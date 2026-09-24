import { chromium, devices } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

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
    assert.equal(await page.locator('iframe').count(), 0);
    assert.equal(
      await page
        .locator('img')
        .evaluateAll(
          (images) => images.filter((image) => image.complete && !image.naturalWidth).length,
        ),
      0,
    );
    results.push(`Rota ${route}: HTML, imagens e carregamento inicial sem iframe OK`);
  }
  await page.goto(base);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: '.artifacts/home-desktop.png' });
  assert.equal(await page.locator('#hero-video').evaluate((video) => video.paused), true);
  const range = page.locator('.comparison-range');
  await range.focus();
  await range.press('ArrowRight');
  assert.equal(await range.inputValue(), '51');
  assert.match(await range.getAttribute('aria-valuetext'), /51%/);
  await range.press('Home');
  assert.equal(await range.inputValue(), '0');
  await range.press('End');
  assert.equal(await range.inputValue(), '100');
  await range.fill('50');
  await range.dispatchEvent('input');
  assert.match(await page.locator('[data-result="plan"]').textContent(), /Business/);
  await page.locator('#properties-number').fill('2');
  assert.equal(await page.locator('[data-range="properties"]').inputValue(), '2');
  assert.equal(await page.locator('[data-result="credits"]').textContent(), '16');
  assert.equal(await page.locator('[data-result="plan"]').textContent(), 'Professional');
  await page.locator('#properties-number').fill('200');
  await page.locator('#rooms-number').fill('15');
  assert.equal(await page.locator('[data-result="credits"]').textContent(), '3.000');
  assert.equal(await page.locator('[data-result="plan"]').textContent(), 'Enterprise');
  await page.locator('[data-result="cta"]').click();
  assert.equal(await page.locator('#contact-dialog').evaluate((dialog) => dialog.open), true);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#contact-dialog').evaluate((dialog) => dialog.open), false);
  await page.locator('[data-tour-open]').click();
  assert.match(await page.locator('[data-tour-status]').textContent(), /em preparação/);
  assert.equal(await page.locator('iframe').count(), 0);
  results.push(
    'Comparador por teclado, calculadora, contato pendente, reduced motion e demo pendente OK',
  );

  const consent = page.locator('[name="consent"]');
  assert.equal(await consent.isChecked(), false);
  await page.locator('#founder-name').fill('Teste de validação');
  await page.locator('#founder-company').fill('Empresa de teste');
  await page.locator('#founder-city').fill('São Paulo / SP');
  await page.locator('#founder-agents').fill('5');
  await page.locator('#founder-phone').fill('(11) 99999-1234');
  await consent.check();
  assert.equal(
    await page.locator('[data-founders-form]').evaluate((form) => form.checkValidity()),
    true,
  );
  await page.locator('[data-founders-form] button[type="submit"]').click();
  assert.match(await page.locator('[data-form-status]').textContent(), /Nenhum dado foi enviado/);
  await page.locator('#founder-phone').fill('abc11999991234');
  assert.equal(
    await page.locator('#founder-phone').evaluate((input) => input.checkValidity()),
    false,
  );
  results.push('Formulário: consentimento, telefone e ausência de envio fictício OK');
  await page.goto(base + '/planos');
  assert.equal(await page.locator('.plan-card').count(), 5);
  assert.equal(await page.locator('.feature-table thead th').count(), 6);
  assert.equal(await page.locator('[data-billing]').count(), 0);
  assert.match(await page.locator('[data-plan="teste"]').textContent(), /1 crédito para testar/);
  assert.match(await page.locator('[data-plan="individual"]').textContent(), /279,00/);
  assert.match(
    await page.locator('[data-plan="individual"]').textContent(),
    /20,00 por ambiente extra/,
  );
  assert.match(
    await page.locator('[data-plan="individual"]').textContent(),
    /79,00\s+por mais 1 ano/,
  );
  assert.match(await page.locator('[data-plan="corretor"] [data-price]').textContent(), /249,00/);
  assert.match(await page.locator('[data-plan="corretor"]').textContent(), /Até 30 tours no ar/);
  assert.match(
    await page.locator('[data-plan="imobiliaria"] [data-price]').textContent(),
    /599,00/,
  );
  assert.match(
    await page.locator('[data-plan="imobiliaria"]').textContent(),
    /Até 120 tours no ar/,
  );
  const schema = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent());
  const offers = schema.find((item) => item['@type'] === 'SoftwareApplication').offers;
  assert.deepEqual(
    offers.map((offer) => [offer.name, offer.price]),
    [
      ['Teste grátis', 0],
      ['Individual', 279],
      ['Professional', 249],
      ['Business', 599],
    ],
  );
  await page.screenshot({ path: '.artifacts/planos-desktop.png' });
  results.push('Cinco planos, preço único/mensal, limites e ofertas estruturadas consistentes OK');

  const mobile = await browser.newContext({
    ...devices['Pixel 7'],
    viewport: { width: 360, height: 800 },
    reducedMotion: 'reduce',
  });
  const phone = await mobile.newPage();
  phone.on('pageerror', (error) => errors.push(error.message));
  for (const route of ['/', '/planos', '/termos-de-uso', '/politica-de-privacidade']) {
    await phone.goto(base + route);
    const dimensions = await phone.evaluate(() => ({
      width: innerWidth,
      scroll: document.documentElement.scrollWidth,
    }));
    assert.ok(
      dimensions.scroll <= dimensions.width,
      `${route}: sem overflow em 360px: ${JSON.stringify(dimensions)}`,
    );
  }
  await phone.goto(base);
  await phone.screenshot({ path: '.artifacts/home-mobile.png' });
  await phone.locator('.menu-toggle').click();
  assert.equal(await phone.locator('#mobile-nav').isVisible(), true);
  await phone.locator('#mobile-nav a').first().click();
  assert.equal(await phone.locator('#mobile-nav').isVisible(), false);
  await phone.locator('.faq-item').first().locator('summary').click();
  assert.equal(await phone.locator('.faq-item').first().getAttribute('open'), '');
  await phone.goto(base + '/planos');
  const table = phone.locator('.feature-table-wrap');
  assert.ok(await table.evaluate((element) => element.scrollWidth > element.clientWidth));
  await table.evaluate((element) => {
    element.scrollLeft = 250;
  });
  const stickyPosition = await phone
    .locator('.feature-table tbody tr:not(.feature-group) th')
    .first()
    .evaluate((element) => ({
      left: element.getBoundingClientRect().left,
      box: element.closest('.feature-table-wrap').getBoundingClientRect().left,
    }));
  assert.ok(Math.abs(stickyPosition.left - stickyPosition.box) < 3);
  results.push('360px: quatro rotas sem overflow, menu, FAQ e tabela com coluna fixa OK');
  assert.deepEqual(errors, []);
  console.log(results.join('\n'));
  await writeFile('.artifacts/browser-results.json', JSON.stringify({ results, errors }, null, 2));
} finally {
  await browser.close();
}
