import { chromium, devices } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

await mkdir('.artifacts', { recursive: true });
const base = process.env.SITE_URL || 'http://127.0.0.1:4321';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const errors = [];
const results = [];
try {
  const desktop = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: 'reduce',
  });
  const page = await desktop.newPage();
  page.on('pageerror', (error) => errors.push(error.message));
  for (const route of ['/', '/planos', '/termos-de-uso', '/politica-de-privacidade']) {
    const response = await page.goto(base + route);
    assert.equal(response.status(), 200);
    assert.equal(await page.locator('h1').count(), 1);
    // Só o tour embutido na hero carrega de início; o tour da demo continua sob demanda.
    assert.equal(await page.locator('iframe:not(.hero-embed)').count(), 0);
    assert.equal(
      await page
        .locator('img')
        .evaluateAll(
          (images) => images.filter((image) => image.complete && !image.naturalWidth).length,
        ),
      0,
    );
    results.push(`Rota ${route}: HTML, imagens e carregamento inicial sem iframe extra OK`);
  }
  await page.goto(base);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: '.artifacts/home-desktop.png' });
  assert.equal(
    await page.locator('.hero-embed').getAttribute('src'),
    'https://arpvision.app/embed/511a5654-29f2-4798-87ff-5b479210dbf0',
  );
  // Com movimento reduzido, o vídeo da captura não toca sozinho.
  assert.equal(await page.locator('#tutorial-video').evaluate((video) => video.paused), true);
  assert.equal(await page.locator('#fundadores').count(), 0, 'sem seção Fundadores');
  assert.equal(await page.locator('.team-visual').count(), 0, 'sem card ilustrativo da equipe');
  assert.equal(await page.locator('#creditos').isVisible(), true, 'seção sobre créditos');
  assert.equal(await page.locator('[data-number="agents"]').count(), 0, 'sem pessoas na equipe');
  assert.match(await page.locator('[data-result="plan"]').textContent(), /Business/);
  await page.locator('#properties-number').fill('2');
  assert.equal(await page.locator('[data-range="properties"]').inputValue(), '2');
  assert.equal(await page.locator('[data-result="credits"]').textContent(), '16');
  assert.equal(await page.locator('[data-result="plan"]').textContent(), 'Professional');
  await page.locator('#properties-number').fill('200');
  await page.locator('#rooms-number').fill('15');
  assert.equal(await page.locator('[data-result="credits"]').textContent(), '3.000');
  assert.equal(await page.locator('[data-result="plan"]').textContent(), 'Enterprise');
  assert.equal(await page.locator('[data-result="cta"] svg').count(), 1, 'seta mantida no botão');
  // Acima do maior plano, o botão abre o WhatsApp comercial em nova aba.
  assert.match(
    await page.locator('[data-result="cta"]').getAttribute('href'),
    /^https:\/\/wa\.me\/5551995273661\?text=/,
  );
  assert.equal(await page.locator('[data-result="cta"]').getAttribute('target'), '_blank');
  // Sem tour configurado, a seção e os links para ela ficam fora da página.
  assert.equal(await page.locator('#tour-real').isVisible(), false);
  assert.equal(await page.locator('a[href$="#tour-real"]:visible').count(), 0);
  assert.equal(await page.locator('[data-tour-host] iframe').count(), 0);
  results.push('Calculadora, WhatsApp, reduced motion, seções removidas e demo oculta OK');

  // Menu do desktop acompanha a seção visível.
  for (const [id, label] of [
    ['como-funciona', 'Como funciona'],
    ['planos', 'Planos'],
    ['duvidas', 'Dúvidas'],
  ]) {
    await page.evaluate((section) => {
      const top = document.getElementById(section).getBoundingClientRect().top + scrollY;
      scrollTo({ top: top - 120, behavior: 'instant' });
    }, id);
    await page.waitForFunction(
      (text) =>
        document.querySelector('.desktop-nav [aria-current="location"]')?.textContent.trim() ===
        text,
      label,
    );
  }
  results.push('Menu do desktop destaca a seção visível OK');

  for (const route of ['/', '/planos']) {
    await page.goto(base + route);
    const text = await page.locator('body').innerText();
    assert.ok(!/\[[^\]]*a definir[^\]]*\]/i.test(text), `${route}: sem "[a definir]" visível`);
    assert.match(
      await page.locator('.floating-whatsapp').getAttribute('href'),
      /^https:\/\/wa\.me\/5551995273661/,
      `${route}: WhatsApp flutuante`,
    );
    assert.equal(await page.locator('#duvidas').count(), 1, `${route}: um FAQ só`);
  }
  await page.goto(base + '/planos');
  // Mesmos quatro cards da tela de planos do app; o teste grátis vira uma nota.
  assert.equal(await page.locator('.plan-card').count(), 4);
  assert.equal(await page.locator('.feature-table thead th').count(), 5);
  assert.equal(await page.locator('[data-billing]').count(), 0);
  const individual = await page.locator('[data-plan="individual"]').innerText();
  assert.match(individual, /12x\s*R\$\s*23,25/);
  assert.match(individual, /ou R\$\s*229 à vista no Pix/);
  assert.match(individual, /8 ambientes/);
  assert.match(individual, /1 tour no ar por 1 ano/);
  assert.match(individual, /Renovação R\$\s*79\/ano/);
  assert.match(
    await page.locator('[data-plan="corretor"] [data-price]').textContent(),
    /R\$\s*249$/,
  );
  assert.match(await page.locator('[data-plan="corretor"]').textContent(), /20 ambientes por mês/);
  assert.match(await page.locator('[data-plan="corretor"]').textContent(), /Até 30 tours no ar/);
  assert.match(
    await page.locator('[data-plan="imobiliaria"] [data-price]').textContent(),
    /R\$\s*599$/,
  );
  assert.match(await page.locator('[data-plan="rede"]').textContent(), /Falar no WhatsApp/);
  assert.match(await page.locator('.pricing-trial').textContent(), /1\s+ambiente sem pagar/);
  assert.match(
    await page.locator('[data-plan="imobiliaria"]').textContent(),
    /Até 120 tours no ar/,
  );
  const schema = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent());
  const offers = schema.find((item) => item['@type'] === 'SoftwareApplication').offers;
  assert.deepEqual(
    offers.map((offer) => [offer.name, offer.price]),
    [
      ['Individual', 229],
      ['Professional', 249],
      ['Business', 599],
    ],
  );
  await page.screenshot({ path: '.artifacts/planos-desktop.png' });
  results.push('Quatro planos como no app, Pix/parcelas, limites e ofertas estruturadas OK');

  // Temas: contraste AA nos dois, logo certo e escolha salva entre recarregamentos.
  const axeSource = await readFile('node_modules/axe-core/axe.min.js', 'utf8');
  for (const colorScheme of ['light', 'dark']) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      colorScheme,
      reducedMotion: 'reduce',
    });
    const themed = await context.newPage();
    themed.on('pageerror', (error) => errors.push(error.message));
    for (const route of ['/', '/planos']) {
      await themed.goto(base + route);
      await themed.addScriptTag({ content: axeSource });
      const contrast = await themed.evaluate(async () =>
        (await window.axe.run(document, { runOnly: ['color-contrast'] })).violations.flatMap(
          (violation) => violation.nodes.map((node) => node.target.join(' ')),
        ),
      );
      assert.deepEqual(contrast, [], `${colorScheme} ${route}: contraste insuficiente`);
    }
    const visibleLogo = await themed
      .locator('.site-header .brand img')
      .evaluateAll((images) => images.find((image) => image.checkVisibility())?.src);
    assert.match(visibleLogo, colorScheme === 'dark' ? /white/ : /blue/);
    await themed.screenshot({ path: `.artifacts/home-${colorScheme}.png` });
    await context.close();
  }
  const toggleContext = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    colorScheme: 'light',
  });
  const toggle = await toggleContext.newPage();
  await toggle.goto(base);
  const themeButton = toggle.locator('.desktop-theme-toggle');
  assert.equal(await themeButton.getAttribute('aria-pressed'), 'false');
  await themeButton.click();
  assert.equal(await toggle.evaluate(() => document.documentElement.dataset.theme), 'dark');
  assert.equal(await themeButton.getAttribute('aria-pressed'), 'true');
  await toggle.reload();
  assert.equal(await toggle.evaluate(() => document.documentElement.dataset.theme), 'dark');
  assert.equal(await themeButton.getAttribute('aria-pressed'), 'true');
  await toggleContext.close();
  results.push('Temas claro e escuro: contraste AA, logo por tema e escolha salva OK');

  const mobile = await browser.newContext({
    ...devices['Pixel 7'],
    viewport: { width: 360, height: 800 },
    reducedMotion: 'reduce',
  });
  const phone = await mobile.newPage();
  phone.on('pageerror', (error) => errors.push(error.message));
  for (const route of ['/', '/planos', '/termos-de-uso', '/politica-de-privacidade']) {
    await phone.goto(base + route);
    // Em emulação de celular, innerWidth cresce junto com o conteúdo largo; a largura visível
    // é clientWidth, então é com ela que o scrollWidth deve ser comparado.
    const dimensions = await phone.evaluate(() => ({
      width: document.documentElement.clientWidth,
      layout: innerWidth,
      scroll: document.documentElement.scrollWidth,
    }));
    assert.ok(
      dimensions.scroll <= dimensions.width && dimensions.layout <= dimensions.width,
      `${route}: sem overflow em 360px: ${JSON.stringify(dimensions)}`,
    );
    const tiny = await phone.evaluate(() => {
      const found = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const element = node.parentElement;
        if (!node.textContent.trim() || !element.checkVisibility() || element.closest('.sr-only'))
          continue;
        const size = parseFloat(getComputedStyle(element).fontSize);
        if (size < 12) found.push(`${size}px "${node.textContent.trim().slice(0, 40)}"`);
      }
      return found;
    });
    assert.deepEqual(tiny, [], `${route}: nenhum texto visível abaixo de 12px`);
    // Alvos de toque: 44px de altura; links dentro de parágrafos e a nota "¹" precisam de 24px.
    const smallTargets = await phone.evaluate(() =>
      [...document.querySelectorAll('a, button, input, summary, select, textarea')]
        .filter((element) => element.checkVisibility() && element.type !== 'checkbox')
        .filter((element) => {
          const box = element.getBoundingClientRect();
          const inline = element.closest('p, sup, .consent');
          return inline ? box.width < 24 || box.height < 24 : box.height < 44 || box.width < 24;
        })
        .map((element) => {
          const box = element.getBoundingClientRect();
          const label = (element.getAttribute('aria-label') || element.textContent || '').trim();
          return `${element.tagName} "${label.slice(0, 30)}" ${Math.round(box.width)}x${Math.round(box.height)}`;
        }),
    );
    assert.deepEqual(smallTargets, [], `${route}: alvos de toque abaixo do mínimo`);
  }
  await phone.goto(base);
  await phone.screenshot({ path: '.artifacts/home-mobile.png' });
  await phone.locator('.menu-toggle').click();
  assert.equal(await phone.locator('#mobile-nav').isVisible(), true);
  assert.equal(await phone.evaluate(() => getComputedStyle(document.body).overflow), 'hidden');
  // Toque fora do menu num ponto sem link (o título da hero), para não navegar.
  await phone.locator('.hero h1').click({ position: { x: 10, y: 10 } });
  assert.equal(await phone.locator('#mobile-nav').isVisible(), false, 'toque fora fecha o menu');
  await phone.locator('.menu-toggle').click();
  await phone.locator('#mobile-nav a').first().click();
  assert.equal(await phone.locator('#mobile-nav').isVisible(), false);
  assert.equal(await phone.evaluate(() => getComputedStyle(document.body).overflow), 'visible');
  const status = phone.locator('#planos [data-carousel-status]');
  await status.scrollIntoViewIfNeeded();
  assert.match(await status.textContent(), /Business · plano 3 de 4/);
  await phone.locator('#planos [data-carousel-next]').click();
  await phone.waitForFunction(() =>
    /plano 4 de 4/.test(document.querySelector('#planos [data-carousel-status]').textContent),
  );
  await phone.locator('#planos [data-carousel-prev]').click();
  await phone.waitForFunction(() =>
    /plano 3 de 4/.test(document.querySelector('#planos [data-carousel-status]').textContent),
  );
  await phone.locator('.faq-item').first().locator('summary').click();
  assert.equal(await phone.locator('.faq-item').first().getAttribute('open'), '');
  await phone.goto(base + '/planos');
  assert.equal(await phone.locator('.feature-table-wrap').isVisible(), false);
  const plans = phone.locator('.feature-plan');
  assert.equal(await plans.count(), 4);
  assert.equal(await phone.locator('[data-feature-plan="imobiliaria"]').getAttribute('open'), '');
  await phone.locator('[data-feature-plan="individual"] summary').click();
  assert.match(
    await phone.locator('[data-feature-plan="individual"]').innerText(),
    /229 no Pix ou 12x de R\$\s*23,25/,
  );
  results.push(
    '360px: quatro rotas sem overflow, texto < 12px ou alvo pequeno; menu, carrossel, FAQ e recursos por plano OK',
  );
  assert.deepEqual(errors, []);
  console.log(results.join('\n'));
  await writeFile('.artifacts/browser-results.json', JSON.stringify({ results, errors }, null, 2));
} finally {
  await browser.close();
}
