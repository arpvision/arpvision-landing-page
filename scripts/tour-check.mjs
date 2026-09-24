import { chromium, devices } from '@playwright/test';
import assert from 'node:assert/strict';

// Fixtures restritas ao navegador de teste. Não alteram o site nem acessam tours reais.
const base = 'http://127.0.0.1:4321';
const tours = [0, 1].map((index) => ({
  id: `test-${index}`,
  name: `Espaço de teste ${index}`,
  label: `Demo de teste ${index}`,
  cover: '/images/interior-960.webp',
  publicUrl: `https://arpvision.app/test-public-${index}`,
  phone: 'Celular de teste',
  photosPerRoom: '8',
  captureTime: 'teste',
}));
const qrCodes = [0, 1].map(
  (index) =>
    `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><text x="10" y="40">${index}</text></svg>`)}`,
);
const attribute = (value) =>
  JSON.stringify(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const fixture = async (page) => {
  await page.route(base + '/', async (route) => {
    const response = await route.fetch();
    let html = await response.text();
    html = html
      .replace(/data-tours="[^"]*"/, `data-tours="${attribute(tours)}"`)
      .replace(/data-qrs="[^"]*"/, `data-qrs="${attribute(qrCodes)}"`);
    const tabs = `<div role="tablist">${tours.map((tour, index) => `<button role="tab" id="test-tab-${index}" aria-controls="tour-panel" aria-selected="${index === 0}" tabindex="${index === 0 ? 0 : -1}" data-tour-index="${index}">${tour.label}</button>`).join('')}</div><a class="tour-qr" href="${tours[0].publicUrl}"><img src="${qrCodes[0]}" width="80" height="80" alt="QR de teste" /></a>`;
    html = html.replace(/(<div data-tour\b[^>]*>)/, `$1${tabs}`);
    await route.fulfill({ response, body: html });
  });
};
try {
  const desktop = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: 'reduce',
  });
  await fixture(desktop);
  let requests = 0;
  await desktop.route('https://arpvision.app/embed/**', async (route) => {
    requests++;
    await route.fulfill({
      contentType: 'text/html',
      body: '<!doctype html><html lang="pt-BR"><body><h1>Visualizador de teste</h1></body></html>',
    });
  });
  await desktop.goto(base);
  assert.equal(await desktop.locator('iframe').count(), 0);
  assert.equal(requests, 0);
  await desktop.locator('[data-tour-open]').click();
  await desktop.locator('iframe').waitFor();
  assert.equal(
    await desktop.locator('iframe').getAttribute('src'),
    'https://arpvision.app/embed/test-0',
  );
  assert.equal(await desktop.locator('iframe').getAttribute('allow'), 'fullscreen');
  assert.equal(await desktop.locator('iframe').getAttribute('sandbox'), null);
  await desktop.locator('[data-tour-index="1"]').click();
  assert.equal(
    await desktop.locator('iframe').getAttribute('src'),
    'https://arpvision.app/embed/test-1',
  );
  assert.equal(await desktop.locator('.tour-qr img').getAttribute('src'), qrCodes[1]);
  assert.equal(await desktop.locator('.tour-qr').getAttribute('href'), tours[1].publicUrl);
  console.log(
    'Tour desktop: sem iframe/requisição inicial; abertura, atributos, troca de tour e QR corretos.',
  );

  const phone = await browser.newPage({
    ...devices['Pixel 7'],
    viewport: { width: 360, height: 800 },
    reducedMotion: 'reduce',
  });
  await fixture(phone);
  await phone.route('https://arpvision.app/embed/**', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<!doctype html><html><body>Visualizador de teste</body></html>',
    }),
  );
  await phone.goto(base);
  await phone.locator('[data-tour-open]').click();
  assert.equal(await phone.locator('.tour-dialog').evaluate((dialog) => dialog.open), true);
  assert.equal(await phone.locator('[data-tour-host] iframe').count(), 0);
  const dimensions = await phone.locator('.tour-dialog').boundingBox();
  assert.equal(dimensions.width, 360);
  assert.equal(dimensions.height, 800);
  assert.equal(
    await phone.locator('.tour-close').evaluate((button) => button === document.activeElement),
    true,
  );
  await phone.locator('.tour-close').click();
  assert.equal(await phone.locator('iframe').count(), 0);
  assert.equal(
    await phone.locator('[data-tour-open]').evaluate((button) => button === document.activeElement),
    true,
  );
  console.log('Tour móvel: diálogo 100vw × 100dvh, fechamento e restauração de foco corretos.');

  const timeoutPage = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: 'reduce',
  });
  await fixture(timeoutPage);
  await timeoutPage.route('https://arpvision.app/embed/**', () => {});
  await timeoutPage.clock.install();
  await timeoutPage.goto(base);
  await timeoutPage.locator('[data-tour-open]').click();
  await timeoutPage.clock.fastForward(15100);
  assert.equal(await timeoutPage.locator('iframe').count(), 0);
  assert.match(
    await timeoutPage.locator('[data-tour-status]').textContent(),
    /Não foi possível abrir o tour agora/,
  );
  assert.equal(await timeoutPage.locator('[data-tour-status] a').getAttribute('target'), '_blank');
  console.log('Timeout de 15 segundos: capa restaurada e link alternativo disponível.');
} finally {
  await browser.close();
}
