import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

await mkdir('.artifacts', { recursive: true });
const base = process.env.SITE_URL || 'http://127.0.0.1:4321';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const errors = [];
const results = [];
const words = [
  'Confiança',
  'Exclusividade',
  'Agilidade',
  'Economia de tempo',
  'Valor',
  'Imersão',
  'Conexão',
  'Transparência',
  'Credibilidade',
  'Diferenciação',
  'Destaque',
  'Alcance',
  'Acessibilidade',
  'Conveniência',
  'Autonomia',
  'Inovação',
  'Encantamento',
  'Presença digital',
  'Visita sem limites',
  'Experiência interativa',
  'Proximidade',
  'Valor percebido',
];
const setup = async (options) => {
  const context = await browser.newContext(options);
  const page = await context.newPage();
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('https://arpvision.app/embed/**', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<!doctype html><html lang="pt-BR"><body style="margin:0;background:linear-gradient(135deg,#c1a180,#427f86);height:100vh"><button style="margin:40px">Controle do tour de teste</button></body></html>',
    }),
  );
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => document.fonts.ready);
  return { context, page };
};
try {
  const { context, page } = await setup({
    viewport: { width: 1440, height: 900 },
    colorScheme: 'dark',
    reducedMotion: 'no-preference',
  });
  const marquee = page.locator('[data-benefit-marquee]');
  assert.equal(
    await marquee.getAttribute('data-marquee-running'),
    'false',
    'fora da tela, animação pausada',
  );
  await marquee.scrollIntoViewIfNeeded();
  await page.mouse.move(1, 1);
  await page.waitForFunction(
    () =>
      getComputedStyle(document.querySelector('.marquee-track')).animationPlayState === 'running',
  );
  assert.deepEqual(
    await page.locator('.marquee-list:not(.marquee-clone) li').allTextContents(),
    words,
  );
  const before = await page
    .locator('.marquee-track')
    .evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).f);
  await page.waitForFunction(
    (start) =>
      new DOMMatrix(getComputedStyle(document.querySelector('.marquee-track')).transform).f <
      start - 2,
    before,
  );
  const after = await page
    .locator('.marquee-track')
    .evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).f);
  assert.ok(after < before - 2, 'palavras sobem continuamente');
  assert.equal(await marquee.locator('button').count(), 0, 'sem botão de pausa');
  await page.locator('.marquee-window').hover();
  await page.waitForFunction(
    () =>
      getComputedStyle(document.querySelector('.marquee-track')).animationPlayState === 'running',
  );
  const hovering = await page
    .locator('.marquee-track')
    .evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).f);
  await page.waitForFunction(
    (start) =>
      new DOMMatrix(getComputedStyle(document.querySelector('.marquee-track')).transform).f <
      start - 2,
    hovering,
  );
  await page.mouse.move(1, 1);

  const host = page.locator('[data-protected-tour]');
  const iframe = host.locator('iframe');
  assert.equal(await iframe.evaluate((el) => el.inert), true);
  assert.equal(await iframe.evaluate((el) => getComputedStyle(el).pointerEvents), 'none');
  await host.locator('[data-tour-shield]').click({ position: { x: 20, y: 30 } });
  assert.equal(await host.getAttribute('data-tour-active'), 'true');
  assert.equal(await iframe.evaluate((el) => el.inert), false);
  await host.locator('[data-tour-lock]').click();
  assert.equal(await host.getAttribute('data-tour-active'), 'false');
  assert.equal(
    await host.locator('[data-tour-activate]').evaluate((el) => el === document.activeElement),
    true,
    'foco volta à capa',
  );
  await host.locator('[data-tour-activate]').click();
  await page.evaluate(() => scrollBy({ top: 100, behavior: 'instant' }));
  await page.waitForFunction(
    () => document.querySelector('[data-protected-tour]').dataset.tourActive === 'false',
  );
  await page.locator('#opening-title').scrollIntoViewIfNeeded();
  await page.waitForFunction(
    () => document.querySelector('[data-benefit-marquee]').dataset.marqueeRunning === 'false',
  );
  await context.close();
  results.push(
    'Rolo: movimento contínuo inclusive no hover, sem botão, pausa fora da tela; tour protegido, ativação, encerramento e foco OK.',
  );

  const axeSource = await readFile('node_modules/axe-core/axe.min.js', 'utf8');
  for (const [width, height, colorScheme, reducedMotion] of [
    [1440, 900, 'light', 'no-preference'],
    [1440, 900, 'dark', 'no-preference'],
    [768, 1024, 'light', 'no-preference'],
    [390, 844, 'dark', 'no-preference'],
    [320, 740, 'light', 'no-preference'],
    [1440, 900, 'dark', 'reduce'],
  ]) {
    const { context, page } = await setup({
      viewport: { width, height },
      colorScheme,
      reducedMotion,
      hasTouch: width < 768,
      isMobile: width < 768,
    });
    await page.locator('.tour-showcase').scrollIntoViewIfNeeded();
    await page.mouse.move(1, 1);
    await page.waitForFunction(
      () => document.querySelector('[data-benefit-marquee]').dataset.marqueeEnhanced === 'true',
    );
    if (reducedMotion === 'reduce') {
      assert.equal(
        await page.locator('.marquee-track').evaluate((el) => getComputedStyle(el).animationName),
        'none',
      );
      assert.equal(await page.locator('.marquee-toggle').isVisible(), false);
      assert.equal(await page.locator('.marquee-clone').isVisible(), false);
      assert.deepEqual(
        await page.locator('.marquee-list:visible li').allTextContents(),
        words,
        'lista completa com movimento reduzido',
      );
    }
    const dimensions = await page.evaluate(() => ({
      width: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth,
    }));
    assert.ok(
      dimensions.scroll <= dimensions.width,
      `${width}px: sem overflow ${JSON.stringify(dimensions)}`,
    );
    const clipped = await page
      .locator('.marquee-list:not(.marquee-clone) li')
      .evaluateAll((items) => items.some((el) => el.scrollWidth > el.clientWidth));
    assert.equal(clipped, false, `${width}px: palavras completas`);
    const centered = await page
      .locator('.marquee-list:not(.marquee-clone) li')
      .evaluateAll((items) =>
        items.every((item) => {
          const parent = item.getBoundingClientRect(),
            word = item.querySelector('.marquee-word').getBoundingClientRect();
          return Math.abs((parent.left + parent.right) / 2 - (word.left + word.right) / 2) < 1;
        }),
      );
    assert.equal(centered, true, `${width}px: palavras centralizadas`);
    if (width < 768) {
      await page.locator('[data-tour-activate]').scrollIntoViewIfNeeded();
      await page.locator('[data-tour-activate]').tap();
      assert.equal(
        await page.locator('[data-protected-tour]').getAttribute('data-tour-active'),
        'true',
      );
      await page.locator('[data-tour-lock]').tap();
      assert.equal(
        await page.locator('[data-protected-tour]').getAttribute('data-tour-active'),
        'false',
      );
    }
    await page.addScriptTag({ content: axeSource });
    const violations = await page.evaluate(async () =>
      (await window.axe.run(document, { runOnly: ['color-contrast'] })).violations.flatMap((v) =>
        v.nodes.map((n) => n.target),
      ),
    );
    assert.deepEqual(violations, [], `${width}px ${colorScheme}: contraste`);
    for (const [selector, name] of [
      ['.presentation', 'showcase'],
      ['#compartilhamento', 'sharing'],
      ['.team-section', 'benefits'],
    ]) {
      await page.locator(selector).scrollIntoViewIfNeeded();
      await page
        .locator(selector)
        .screenshot({ path: `.artifacts/${name}-${width}-${colorScheme}-${reducedMotion}.png` });
    }
    await context.close();
  }
  const fallback = await setup({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false });
  assert.equal(await fallback.page.locator('.marquee-clone').isVisible(), false);
  assert.equal(await fallback.page.locator('.marquee-toggle').isVisible(), false);
  assert.deepEqual(
    await fallback.page.locator('.marquee-list:visible li').allTextContents(),
    words,
  );
  assert.equal(
    await fallback.page.locator('.tour-fallback').isVisible(),
    true,
    'tour continua acessível sem JavaScript',
  );
  await fallback.context.close();
  results.push(
    '320–1440px: palavras sem cortes, conversa e benefícios nos dois temas, contraste, toque, movimento reduzido e fallback sem JS OK.',
  );
  assert.deepEqual(errors, []);
  await writeFile('.artifacts/showcase-results.json', JSON.stringify({ results, errors }, null, 2));
  console.log(results.join('\n'));
} finally {
  await browser.close();
}
