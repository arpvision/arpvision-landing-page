import { chromium, devices } from '@playwright/test';
import assert from 'node:assert/strict';

// Fixtures restritas ao navegador de teste. Não alteram o site nem acessam tours reais.
const base = process.env.SITE_URL || 'http://127.0.0.1:4321';
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
const fixture = async (page, path = '/') => {
  await page.route(base + path, async (route) => {
    const response = await route.fetch();
    let html = await response.text();
    html = html
      .replace(/(<section[^>]*id="tour-real"[^>]*?)\s+hidden(?=[\s>])/, '$1')
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
    // O tour embutido na hero carrega com a página; aqui contam só os tours da demo.
    if (route.request().url().includes('/embed/test-')) requests++;
    await route.fulfill({
      contentType: 'text/html',
      body: '<!doctype html><html lang="pt-BR"><body><h1>Visualizador de teste</h1></body></html>',
    });
  });
  await desktop.goto(base);
  assert.equal(await desktop.locator('[data-tour-host] iframe').count(), 0);
  assert.equal(requests, 0);
  await desktop.locator('[data-tour-open]').click();
  await desktop.locator('[data-tour-host] iframe').waitFor();
  assert.equal(
    await desktop.locator('[data-tour-host] iframe').getAttribute('src'),
    'https://arpvision.app/embed/test-0',
  );
  assert.equal(
    await desktop.locator('[data-tour-host] iframe').getAttribute('allow'),
    'fullscreen',
  );
  assert.equal(await desktop.locator('[data-tour-host] iframe').getAttribute('sandbox'), null);
  await desktop.locator('[data-tour-index="1"]').click();
  assert.equal(
    await desktop.locator('[data-tour-host] iframe').getAttribute('src'),
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
  assert.equal(await phone.locator('[data-tour-host] iframe').count(), 0);
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
  // Só os tours da demo ficam sem resposta; o da hero responde para a página terminar de carregar.
  await timeoutPage.route('https://arpvision.app/embed/**', (route) => {
    if (!route.request().url().includes('/embed/test-'))
      return route.fulfill({ contentType: 'text/html', body: '' });
  });
  await timeoutPage.clock.install();
  await timeoutPage.goto(base);
  await timeoutPage.locator('[data-tour-open]').click();
  await timeoutPage.clock.fastForward(15100);
  assert.equal(await timeoutPage.locator('[data-tour-host] iframe').count(), 0);
  assert.match(
    await timeoutPage.locator('[data-tour-status]').textContent(),
    /Não foi possível abrir o tour agora/,
  );
  assert.equal(await timeoutPage.locator('[data-tour-status] a').getAttribute('target'), '_blank');
  console.log('Timeout de 15 segundos: capa restaurada e link alternativo disponível.');

  // Em /es, o tour da demo abre no idioma da página e o aviso de erro fala espanhol.
  const spanish = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: 'reduce',
  });
  await fixture(spanish, '/es');
  await spanish.route('https://arpvision.app/embed/**', (route) => {
    if (!route.request().url().includes('/embed/test-'))
      return route.fulfill({ contentType: 'text/html', body: '' });
  });
  await spanish.clock.install();
  await spanish.goto(base + '/es');
  await spanish.locator('[data-tour-open]').click();
  assert.equal(
    await spanish.locator('[data-tour-host] iframe').getAttribute('src'),
    'https://arpvision.app/embed/test-0?idioma=es',
  );
  assert.equal(
    await spanish.locator('[data-tour-host] iframe').getAttribute('title'),
    'Tour 360° de ejemplo: Espaço de teste 0',
  );
  await spanish.clock.fastForward(15100);
  assert.match(
    await spanish.locator('[data-tour-status]').textContent(),
    /No se ha podido abrir el tour ahora/,
  );
  assert.equal(
    await spanish.locator('[data-tour-status] a').textContent(),
    'Abrir en una pestaña nueva',
  );
  await spanish.locator('[data-tour-index="1"]').click();
  assert.equal(await spanish.locator('[data-tour-photos]').textContent(), '8 fotos por estancia');
  console.log('Tour em espanhol: embed com idioma=es, título, erro e troca de tour no idioma.');
} finally {
  await browser.close();
}
