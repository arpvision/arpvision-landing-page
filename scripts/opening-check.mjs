import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';
import { browserLocale, chooseLanguage } from './language-choice.mjs';

const base = process.env.SITE_URL || 'http://127.0.0.1:4321';
await mkdir('.artifacts', { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const errors = [];
const results = [];
// Cada contexto no idioma do navegador da página que testa e com a escolha de idioma gravada:
// a faixa de sugestão de idioma não entra nesta checagem.
const setup = async (options, locale = 'pt') => {
  const context = await browser.newContext({ locale: browserLocale[locale], ...options });
  await chooseLanguage(context, locale);
  const page = await context.newPage();
  page.on('pageerror', (error) => errors.push(error.message));
  // A resposta remota não faz parte desta revisão de composição/interação.
  await page.route('https://arpvision.app/embed/**', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<!doctype html><html lang="pt-BR"><body>Tour de teste</body></html>',
    }),
  );
  return { context, page };
};
const dimensions = (page) =>
  page.evaluate(() => ({
    width: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
    layout: innerWidth,
  }));
// Contraste WCAG entre duas cores [r, g, b] de 0 a 255.
const luminance = (rgb) =>
  rgb
    .map((value) => value / 255)
    .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
    .reduce((sum, c, index) => sum + c * [0.2126, 0.7152, 0.0722][index], 0);
const contrast = (a, b) => {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
};
// A tela em pixels CSS: (x, y) → [r, g, b].
const capture = async (page) => {
  const { data, info } = await sharp(await page.screenshot({ scale: 'css' }))
    .raw()
    .toBuffer({ resolveWithObject: true });
  return (x, y) => {
    const index = (y * info.width + x) * info.channels;
    return [...data.subarray(index, index + 3)];
  };
};
// Escrita, ícone do menu e logo do cabeçalho contra o que está de fato atrás deles. O axe não
// calcula o fundo do vidro (deixa esses textos como incompletos): o fundo vem da própria tela,
// capturada de novo com a escrita, os ícones e o logo escondidos.
const verifyHeaderContrast = async (page, label) => {
  // Com movimento reduzido, cada troca de cor vira uma transição de 0,01ms, que desce em cascata
  // pelos filhos. Sem transições, as cores lidas são as finais.
  const still = await page.addStyleTag({
    content: `.site-header, .site-header *, .site-header *::before, .site-header *::after {
      transition: none !important;
    }`,
  });
  const items = await page.locator('.header-capsule').evaluate((capsule) => {
    const paint = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    // Qualquer cor do CSS em [r, g, b, a].
    const rgba = (color) => {
      paint.clearRect(0, 0, 1, 1);
      paint.fillStyle = color;
      paint.fillRect(0, 0, 1, 1);
      return [...paint.getImageData(0, 0, 1, 1).data];
    };
    const items = [];
    const walker = document.createTreeWalker(capsule, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const element = node.parentElement;
      // Fora os textos escondidos visualmente (caixa de 1px), como o rótulo "Menu" no celular.
      if (!node.textContent.trim() || !element.checkVisibility()) continue;
      if (element.getBoundingClientRect().width <= 1) continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      const color = rgba(getComputedStyle(element).color);
      for (const rect of range.getClientRects())
        items.push({ name: node.textContent.trim(), color, rect: rect.toJSON(), minimum: 4.5 });
    }
    const visible = (selector) =>
      [...capsule.querySelectorAll(selector)].find((element) => element.checkVisibility());
    const icon = visible('.menu-toggle svg');
    const logo = visible('.brand img');
    items.push(
      {
        name: 'ícone do menu',
        color: rgba(getComputedStyle(icon).color),
        rect: icon.getBoundingClientRect().toJSON(),
        minimum: 3,
      },
      { name: 'logo', rect: logo.getBoundingClientRect().toJSON(), minimum: 3 },
    );
    return items;
  });
  const shown = await capture(page);
  const hide = await page.addStyleTag({
    content: `.site-header *, .site-header *::before, .site-header *::after {
      color: transparent !important;
    }
    .site-header img, .site-header svg { visibility: hidden !important; }`,
  });
  const behind = await capture(page);
  await Promise.all([still, hide].map((style) => style.evaluate((element) => element.remove())));
  const low = items.flatMap(({ name, color, rect, minimum }) => {
    // Escrita e ícone: a cor deles contra o pior pixel de fundo. Logo: o pixel que mais se destaca.
    let ratio = color ? Infinity : 0;
    for (let y = Math.ceil(rect.top); y < Math.floor(rect.bottom); y++)
      for (let x = Math.ceil(rect.left); x < Math.floor(rect.right); x++) {
        const background = behind(x, y);
        if (!color) ratio = Math.max(ratio, contrast(shown(x, y), background));
        else {
          const alpha = color[3] / 255;
          const ink = background.map((value, index) => color[index] * alpha + value * (1 - alpha));
          ratio = Math.min(ratio, contrast(ink, background));
        }
      }
    return ratio >= minimum ? [] : [`${name}: ${ratio.toFixed(2)}:1`];
  });
  assert.deepEqual(low, [], `${label}: contraste medido na tela`);
};
const verifyHeaderBoundary = async (page) => {
  const header = page.locator('.site-header');
  const boundary = await page.locator('.opening').evaluate((el) => {
    const rect = el.getBoundingClientRect();
    return { top: rect.top + scrollY, bottom: rect.bottom + scrollY };
  });
  const scroll = async (top) => {
    await page.evaluate(
      (y) =>
        new Promise((resolve) => {
          window.addEventListener(
            'scroll',
            () => requestAnimationFrame(() => requestAnimationFrame(resolve)),
            { once: true },
          );
          scrollTo({ top: y, behavior: 'instant' });
        }),
      top,
    );
  };
  await scroll(boundary.top + 20);
  await page.waitForFunction(
    () => document.querySelector('.site-header')?.dataset.headerHidden === 'false',
  );
  assert.equal(await header.isVisible(), true, 'cabeçalho acompanha a abertura');
  await scroll(boundary.bottom - 36);
  await page.waitForFunction(
    () => document.querySelector('.site-header')?.getBoundingClientRect().y < 0,
    null,
    { timeout: 5000 },
  );
  assert.ok((await header.boundingBox()).y < 0, 'cabeçalho sai junto com o fim da seção');
  await scroll(boundary.bottom + 20);
  await page.waitForFunction(
    () => getComputedStyle(document.querySelector('.site-header')).visibility === 'hidden',
    null,
    { timeout: 5000 },
  );
  assert.equal(await header.isVisible(), false, 'cabeçalho ausente nas próximas seções');
  assert.equal(await header.evaluate((el) => el.inert), true, 'controles ocultos fora do teclado');
  await scroll(0);
  await page.waitForFunction(
    () => getComputedStyle(document.querySelector('.site-header')).visibility === 'visible',
    null,
    { timeout: 5000 },
  );
  assert.equal(await header.isVisible(), true, 'cabeçalho retorna ao voltar para a abertura');
  assert.equal(await header.evaluate((el) => el.inert), false);
};
try {
  const { context, page } = await setup({
    viewport: { width: 1440, height: 900 },
    colorScheme: 'light',
  });
  await page.addInitScript(() => {
    const samples = [];
    Reflect.set(window, 'fanFrames', samples);
    const start = performance.now();
    let openedAt;
    const sample = () => {
      const fan = document.querySelector('[data-fan]');
      if (fan)
        samples.push({
          time: performance.now() - start,
          state: fan.dataset.fanState,
          transform: getComputedStyle(fan.querySelector('.fan-position')).transform,
        });
      if (fan?.dataset.fanState === 'open' && openedAt === undefined) openedAt = performance.now();
      if (openedAt === undefined || performance.now() - openedAt < 1200)
        requestAnimationFrame(sample);
      else Reflect.set(window, 'fanSampleDone', true);
    };
    requestAnimationFrame(sample);
  });
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => document.fonts.ready);
  // A abertura mostra a ponta da pilha; a rolagem revela e abre o leque.
  assert.equal(await page.locator('[data-fan]').getAttribute('data-fan-state'), 'stacked');
  const peek = await page.locator('.fan-card').evaluateAll((cards) => ({
    visible: innerHeight - Math.min(...cards.map((card) => card.getBoundingClientRect().top)),
    full: cards.some((card) => card.getBoundingClientRect().bottom <= innerHeight),
  }));
  assert.ok(peek.visible > 15 && peek.visible < 120, `só a ponta aparece: ${JSON.stringify(peek)}`);
  assert.equal(peek.full, false, 'nenhum cartão inteiro antes de rolar');
  await page.screenshot({ path: '.artifacts/opening-desktop-peek.png' });
  await page.evaluate(() => scrollTo({ top: 350, behavior: 'instant' }));
  await page.waitForFunction(
    () => document.querySelector('[data-fan]')?.dataset.fanState === 'open',
  );
  await page.waitForFunction(() => Reflect.get(window, 'fanSampleDone'));
  assert.equal(await page.evaluate(() => scrollY), 350, 'a rolagem abre o leque');
  const frames = await page.evaluate(() => Reflect.get(window, 'fanFrames'));
  const stacked = frames.find((frame) => frame.state === 'stacked');
  const open = frames.filter((frame) => frame.state === 'open');
  assert.ok(stacked, 'primeira pintura empilhada');
  await writeFile('.artifacts/fan-animation-frames.json', JSON.stringify(frames, null, 2));
  assert.ok(new Set(open.map((frame) => frame.transform)).size > 3, 'posição e rotação animadas');
  assert.equal(
    await page
      .locator('.fan-position')
      .first()
      .evaluate((el) => getComputedStyle(el).transitionDuration),
    '0.9s',
  );
  const boxes = await page.locator('.fan-card').evaluateAll((cards) =>
    cards.map((card) => {
      const r = card.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, bottom: r.bottom };
    }),
  );
  assert.ok(
    boxes.every((r) => r.y > 0 && r.bottom < 900),
    'leque inteiro após rolar',
  );
  assert.ok(
    boxes.every((box, index) => index === 2 || box.y > boxes[2].y),
    'centro mais alto',
  );
  assert.equal(await page.locator('.fan-card').count(), 5);
  assert.equal(
    await page.locator('.fan-card h3, .fan-card p, .fan-photo-badge, .fan-photo-caption').count(),
    0,
    'sem textos descritivos nas fotografias',
  );
  assert.equal(await page.locator('.fan-arrow[data-liquid]').count(), 5);
  assert.equal(await page.locator('.fan-room-link[data-liquid]').count(), 5);
  assert.deepEqual(await page.locator('.fan-room-link').allTextContents(), [
    'Suíte',
    'Quarto',
    'Sala',
    'Quarto Visita',
    'Pátio',
  ]);
  assert.equal(await page.locator('.header-capsule[data-liquid]').count(), 1);
  assert.ok((await page.locator('.site-header').boundingBox()).width <= 1060, 'cabeçalho estreito');
  assert.equal(
    await page.locator('.opening + #compartilhamento').count(),
    1,
    'compartilhamento logo após o leque',
  );
  assert.equal(
    await page
      .locator('.opening + #compartilhamento + #como-funciona + .presentation + #creditos')
      .count(),
    1,
    'compartilhamento, captura, tour e créditos na sequência solicitada',
  );
  assert.equal(await page.locator('.presentation .hero-actions').count(), 0);
  assert.equal(
    await page
      .locator('.fan-card')
      .evaluateAll((cards) =>
        cards.every((c) => c.getAttribute('aria-label') && c.querySelector('img').naturalWidth > 0),
      ),
    true,
    'fotos carregadas e descrição acessível',
  );
  await page.screenshot({ path: '.artifacts/opening-desktop.png' });
  const first = page.locator('.fan-card').first();
  const resting = await first.boundingBox();
  await first.hover({ position: { x: 20, y: 80 } });
  await page.waitForTimeout(350);
  assert.ok((await first.boundingBox()).y < resting.y - 8, 'hover eleva o cartão');
  assert.equal(await first.locator('..').evaluate((el) => getComputedStyle(el).zIndex), '20');
  await page.mouse.move(10, 120);
  await page.waitForTimeout(350);
  assert.ok(
    await first.evaluate((el) => getComputedStyle(el).transform === 'none'),
    'hover termina e a elevação individual retorna',
  );
  assert.equal(
    await page.locator('[data-fan]').getAttribute('data-fan-state'),
    'open',
    'continua aberto sem hover enquanto está na tela',
  );
  await first.focus();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Shift+Tab');
  assert.equal(
    await first.locator('..').evaluate((el) => getComputedStyle(el).zIndex),
    '10',
    'teclado traz à frente',
  );
  await page.locator('.site-header .brand').focus();
  await page.evaluate(() => scrollTo({ top: 2400, behavior: 'instant' }));
  await page.waitForFunction(
    () => document.querySelector('[data-fan]')?.dataset.fanState === 'stacked',
  );
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForFunction(
    () => document.querySelector('[data-fan]')?.dataset.fanState === 'stacked',
  );
  await page.evaluate(() => scrollTo({ top: 350, behavior: 'instant' }));
  await page.waitForFunction(
    () => document.querySelector('[data-fan]')?.dataset.fanState === 'open',
  );
  results.push(
    '1440×900: apenas a ponta na abertura; rolagem revela o leque em 900ms, cinco fotos com seta e nomes dos ambientes, hover e foco preservados.',
  );

  assert.equal(await page.locator('main h1').count(), 1);
  assert.equal(await page.locator('.use-card').count(), 5, 'sem cartões duplicados');
  await verifyHeaderBoundary(page);
  // Página interna que existe com ou sem preços públicos (/planos pode só redirecionar).
  await page.goto(base + '/termos-de-uso', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => scrollTo({ top: 1500, behavior: 'instant' }));
  assert.equal(
    await page.locator('.site-header').isVisible(),
    true,
    'navegação das páginas internas preservada',
  );
  results.push(
    'Cabeçalho até o fim do primeiro slide, saída com a abertura, controles ocultos sem foco e retorno ao início; páginas internas preservadas.',
  );
  await context.close();

  // A abertura em espanhol e em inglês: mesma composição, com os nomes dos ambientes traduzidos.
  for (const [code, rooms, ids] of [
    [
      'es',
      ['Suite', 'Dormitorio', 'Salón', 'Invitados', 'Patio'],
      '.opening + #compartilhamento + #como-funciona + .presentation + #creditos',
    ],
    [
      'en',
      ['Suite', 'Bedroom', 'Living room', 'Guest room', 'Backyard'],
      '.opening + #compartilhamento + #how-it-works + .presentation + #creditos',
    ],
  ]) {
    const { context, page } = await setup(
      {
        viewport: { width: 1440, height: 900 },
        reducedMotion: 'reduce',
        colorScheme: 'light',
      },
      code,
    );
    await page.goto(`${base}/${code}`, { waitUntil: 'domcontentloaded' });
    assert.deepEqual(await page.locator('.fan-room-link').allTextContents(), rooms);
    assert.equal(await page.locator(ids).count(), 1, `mesma sequência de seções em /${code}`);
    assert.ok(
      (await page.locator('.site-header').boundingBox()).width <= 1060,
      `cabeçalho estreito em /${code}`,
    );
    await page.screenshot({ path: `.artifacts/opening-${code}-desktop.png` });
    await context.close();
  }

  const axeSource = await readFile('node_modules/axe-core/axe.min.js', 'utf8');
  for (const [width, height, path] of [
    [1280, 720],
    [1024, 768],
    [768, 1024],
    [600, 900],
    [390, 844],
    [360, 800],
    [320, 740],
  ].flatMap((size) => ['', '/es', '/en'].map((path) => [...size, path]))) {
    const { context, page } = await setup(
      {
        viewport: { width, height },
        reducedMotion: 'reduce',
        colorScheme: 'light',
        isMobile: width < 768,
        hasTouch: width < 768,
      },
      path.slice(1) || 'pt',
    );
    await page.goto(base + path, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => document.fonts.ready);
    const initial = await page.locator('.fan-card').evaluateAll((cards) => ({
      visible: innerHeight - Math.min(...cards.map((card) => card.getBoundingClientRect().top)),
      full: cards.some((card) => card.getBoundingClientRect().bottom <= innerHeight),
    }));
    assert.ok(
      initial.visible > 15 && initial.visible < 120,
      `${width}px${path}: só a ponta: ${JSON.stringify(initial)}`,
    );
    assert.equal(initial.full, false, `${width}px${path}: nenhum cartão inteiro antes de rolar`);
    await page.screenshot({
      path: `.artifacts/opening-peek-${width}${path.replace('/', '-')}.png`,
    });
    await page.evaluate(() => scrollTo({ top: 350, behavior: 'instant' }));
    const d = await dimensions(page);
    assert.ok(
      d.scroll <= width && d.layout <= width,
      `${width}px${path}: sem scroll horizontal ${JSON.stringify(d)}`,
    );
    const bounds = await page.locator('.fan-card').evaluateAll((cards) =>
      cards.map((card) => {
        const r = card.getBoundingClientRect();
        return { left: r.left, right: r.right };
      }),
    );
    assert.ok(
      bounds.every((r) => r.left >= 0 && r.right <= width),
      `${width}px${path}: cartões sem cortes`,
    );
    if (width >= 768) {
      const bottom = await page
        .locator('.fan-card')
        .evaluateAll((cards) => Math.max(...cards.map((c) => c.getBoundingClientRect().bottom)));
      assert.ok(bottom <= height, `${width}px${path}: leque inteiro após rolar (${bottom})`);
    }
    if (width < 768) {
      for (let index = 0; index < 5; index++) {
        await page.locator('[data-fan-select]').nth(index).click();
        assert.equal(
          await page.locator('[data-fan-select]').nth(index).getAttribute('aria-pressed'),
          'true',
        );
        await page.locator('.fan-card').nth(index).scrollIntoViewIfNeeded();
        const visible = await page
          .locator('.fan-card')
          .nth(index)
          .evaluate((card) => {
            const title = card.querySelector('img').getBoundingClientRect();
            return card.contains(
              document.elementFromPoint(title.x + title.width / 2, title.y + title.height / 2),
            );
          });
        assert.equal(visible, true, `${width}px${path}: cartão ${index + 1} acessível ao toque`);
      }
      await page.locator('[data-fan-select]').nth(2).click();
      await page.evaluate(() => scrollTo(0, 0));
      await page.locator('.menu-toggle').click();
      assert.equal(await page.locator('#mobile-nav').isVisible(), true);
      // Aberto, o cabeçalho cresce e empurra a abertura: atrás do menu fica a página.
      await verifyHeaderContrast(page, `${width}px${path}: menu aberto`);
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#mobile-nav').isVisible(), false);
      // Fechado, e com o ponteiro fora do botão, volta a escrita branca sobre o fundo escuro.
      await page.mouse.move(0, 0);
      await verifyHeaderContrast(page, `${width}px${path}: menu fechado`);
      assert.equal(
        await page.locator('.menu-toggle').evaluate((el) => el === document.activeElement),
        true,
      );
      await page.evaluate(() => document.activeElement?.blur());
    }
    await verifyHeaderBoundary(page);
    await page.addScriptTag({ content: axeSource });
    const violations = await page.evaluate(async () =>
      (await window.axe.run(document, { runOnly: ['color-contrast'] })).violations.flatMap((v) =>
        v.nodes.map((n) => n.target),
      ),
    );
    assert.deepEqual(violations, [], `${width}px${path}: contraste`);
    await page.screenshot({ path: `.artifacts/opening-${width}${path.replace('/', '-')}.png` });
    assert.ok(
      await page
        .locator('.fan-position')
        .first()
        .evaluate((el) => parseFloat(getComputedStyle(el).transitionDuration) <= 0.0001),
      'movimento reduzido',
    );
    await context.close();
  }
  results.push(
    '320–1440px, em português, espanhol e inglês: sem cortes/overflow; controles ao toque, menu (contraste medido na tela, aberto e fechado), Escape, foco, contraste e movimento reduzido.',
  );

  const dark = await setup({
    viewport: { width: 1440, height: 900 },
    colorScheme: 'dark',
    reducedMotion: 'reduce',
  });
  await dark.page.goto(base, { waitUntil: 'domcontentloaded' });
  await dark.page.addScriptTag({ content: axeSource });
  const darkViolations = await dark.page.evaluate(async () =>
    (await window.axe.run(document, { runOnly: ['color-contrast'] })).violations.flatMap((v) =>
      v.nodes.map((n) => n.target),
    ),
  );
  assert.deepEqual(darkViolations, [], 'contraste no tema escuro');
  await dark.page.screenshot({ path: '.artifacts/opening-dark.png' });
  await dark.context.close();

  const glass = await setup({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  await glass.page.route('**/*.css', async (route) => {
    const response = await route.fetch();
    const css = (await response.text()).replaceAll('@supports', '@supports not');
    await route.fulfill({ response, body: css });
  });
  const fallbackSession = await glass.page.context().newCDPSession(glass.page);
  await fallbackSession.send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-transparency', value: 'no-preference' }],
  });
  await glass.page.goto(base, { waitUntil: 'domcontentloaded' });
  await glass.page.evaluate(() => document.fonts.ready);
  await glass.page.waitForFunction(
    () =>
      getComputedStyle(document.querySelector('.header-capsule')).backgroundColor ===
      'rgb(15, 23, 42)',
    null,
    { timeout: 5000 },
  );
  const glassFallback = await glass.page.evaluate(() => {
    const style = getComputedStyle(document.querySelector('.header-capsule'));
    return {
      background: style.backgroundColor,
      image: style.backgroundImage,
      blur: style.backdropFilter,
    };
  });
  assert.deepEqual(
    glassFallback,
    { background: 'rgb(15, 23, 42)', image: 'none', blur: 'none' },
    'fallback de vidro sólido',
  );
  await glass.page.screenshot({ path: '.artifacts/opening-no-blur.png' });
  await glass.context.close();

  const tablet = await setup({
    viewport: { width: 768, height: 1024 },
    hasTouch: true,
    isMobile: true,
    reducedMotion: 'no-preference',
  });
  await tablet.page.goto(base, { waitUntil: 'domcontentloaded' });
  assert.equal(
    await tablet.page.locator('.fan-controls').isVisible(),
    true,
    'controles também no tablet ao toque',
  );
  await tablet.page.locator('[data-fan-select]').first().click();
  assert.equal(
    await tablet.page.locator('.fan-position').first().getAttribute('data-selected'),
    '',
  );
  await tablet.page.waitForTimeout(1600);
  assert.equal(
    await tablet.page.locator('[data-fan]').getAttribute('data-fan-state'),
    'open',
    'toque mantém o cartão legível após parar',
  );
  await tablet.page.touchscreen.tap(20, 120);
  assert.equal(
    await tablet.page.locator('[data-fan]').getAttribute('data-fan-state'),
    'open',
    'toque fora não recolhe o leque enquanto está na tela',
  );
  await tablet.context.close();

  const fallback = await setup({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false });
  await fallback.page.goto(base, { waitUntil: 'domcontentloaded' });
  assert.equal(
    await fallback.page.locator('[data-fan]').getAttribute('data-fan-state'),
    null,
    'sem JS, leque já aberto',
  );
  await fallback.page.screenshot({ path: '.artifacts/opening-no-js.png' });
  await fallback.context.close();
  results.push(
    'Tema escuro, fallback sólido sem blur, tablet ao toque e conteúdo legível sem JavaScript.',
  );
  assert.deepEqual(errors, []);
  await writeFile('.artifacts/opening-results.json', JSON.stringify({ results, errors }, null, 2));
  console.log(results.join('\n'));
} finally {
  await browser.close();
}
