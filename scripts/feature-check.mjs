import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

await mkdir('.artifacts', { recursive: true });
const base = process.env.SITE_URL || 'http://127.0.0.1:4321';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const errors = [];
const results = [];
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
const scroll = async (page, top) => {
  await page.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), top);
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
};
try {
  const { context, page } = await setup({
    viewport: { width: 1440, height: 900 },
    reducedMotion: 'no-preference',
    colorScheme: 'light',
  });
  assert.equal(await page.locator('.fan-photo-media img').count(), 3);
  // Cada cartão: ambiente no rótulo e um benefício da LP no título.
  assert.deepEqual(await page.locator('.fan-card .fan-photo-room').allTextContents(), [
    'Sala 1 · feito com o celular',
    'Entrada · feito com o celular',
    'Quarto com suíte · feito com o celular',
  ]);
  assert.deepEqual(await page.locator('.fan-card h3').allTextContents(), [
    'Só o celular.',
    'Pronto em cerca de 1 minuto.',
    'O cliente abre sem conta.',
  ]);
  await page.screenshot({ path: '.artifacts/photos-initial.png' });
  await scroll(page, 420);
  await page.mouse.move(720, 540);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '.artifacts/photos-open.png' });

  const section = page.locator('[data-feature-scroll]');
  assert.equal(await section.getAttribute('data-stack-enhanced'), 'true');
  const metrics = await section.evaluate((el) => ({
    top: el.getBoundingClientRect().top + scrollY,
    pinTop: parseFloat(getComputedStyle(el.querySelector('.feature-pin')).top),
    travel: parseFloat(el.style.getPropertyValue('--stack-travel')) - 160,
  }));
  const transforms = () =>
    page
      .locator('.feature-position')
      .evaluateAll((cards) =>
        cards.map((card) => new DOMMatrix(getComputedStyle(card).transform).f),
      );
  await scroll(page, metrics.top - 320);
  const before = await transforms();
  await scroll(page, metrics.top - 180);
  assert.deepEqual(await transforms(), before, '01 e 02 ainda estáticos antes da fixação');
  await page.screenshot({ path: '.artifacts/features-entry.png' });
  await scroll(page, metrics.top - metrics.pinTop);
  const fixed = await page.locator('.protected-tour').boundingBox();
  assert.ok(Math.abs(fixed.y - metrics.pinTop) < 2, 'embed para abaixo do cabeçalho');
  await scroll(page, metrics.top - metrics.pinTop + metrics.travel * 0.5);
  const middle = await page.locator('.protected-tour').boundingBox();
  assert.ok(Math.abs(fixed.y - middle.y) < 2, 'embed fica fixo durante a subida');
  const midway = await transforms();
  assert.ok(midway[1] < before[1] && midway[2] < before[2], 'cards sobem com o scroll');
  await page.screenshot({ path: '.artifacts/features-middle.png' });
  await scroll(page, metrics.top - metrics.pinTop + metrics.travel);
  const final = await transforms();
  assert.ok(
    final.every((y, index) => Math.abs(y - index * 22) < 1),
    'último card encaixado e anteriores sobrepostos',
  );
  await page.screenshot({ path: '.artifacts/features-final.png' });
  // Tab também permite revisitar um cartão coberto, restaurando sua posição de leitura.
  await page.locator('.feature-card').nth(1).focus();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Shift+Tab');
  await page.waitForTimeout(100);
  assert.ok((await transforms())[2] > 44, 'foco de teclado revela o card anterior');
  await scroll(page, metrics.top - metrics.pinTop + metrics.travel + 180);
  assert.ok(
    (await page.locator('.protected-tour').boundingBox()).y < metrics.pinTop - 10,
    'seção libera a rolagem após o último',
  );
  results.push(
    'Desktop: 01/02 estáticos na entrada, embed fixo, subida/encaixe dos 5 cards, teclado e liberação da seção.',
  );

  await scroll(page, metrics.top - metrics.pinTop);
  const host = page.locator('[data-protected-tour]');
  const iframe = host.locator('iframe');
  assert.equal(await iframe.evaluate((el) => el.inert), true);
  assert.equal(await iframe.evaluate((el) => getComputedStyle(el).pointerEvents), 'none');
  await host.locator('[data-tour-shield]').click({ position: { x: 20, y: 30 } });
  assert.equal(
    await host.getAttribute('data-tour-active'),
    'false',
    'um toque fora do botão não ativa',
  );
  await host.locator('[data-tour-activate]').click();
  assert.equal(await host.getAttribute('data-tour-active'), 'true');
  assert.equal(await iframe.evaluate((el) => el.inert), false);
  assert.equal(await host.locator('[data-tour-shield]').isVisible(), false);
  await host.locator('[data-tour-lock]').click();
  assert.equal(await host.getAttribute('data-tour-active'), 'false');
  assert.equal(
    await host.locator('[data-tour-activate]').evaluate((el) => el === document.activeElement),
    true,
    'foco retorna ao ativador',
  );
  await host.locator('[data-tour-activate]').click();
  await scroll(page, metrics.top - metrics.pinTop + 100);
  assert.equal(await host.getAttribute('data-tour-active'), 'false', 'rolagem retoma proteção');
  await context.close();
  results.push(
    'Tour: proteção por padrão, ativação apenas no botão, encerramento e proteção ao retomar a rolagem.',
  );

  const axeSource = await readFile('node_modules/axe-core/axe.min.js', 'utf8');
  for (const [width, height, colorScheme, reducedMotion] of [
    [1440, 900, 'light', 'no-preference'],
    [1440, 900, 'dark', 'no-preference'],
    [1280, 720, 'light', 'no-preference'],
    [1024, 650, 'light', 'no-preference'],
    [768, 1024, 'light', 'no-preference'],
    [390, 844, 'light', 'no-preference'],
    [360, 800, 'light', 'no-preference'],
    [320, 740, 'light', 'no-preference'],
    [1440, 900, 'light', 'reduce'],
  ]) {
    const { context, page } = await setup({
      viewport: { width, height },
      colorScheme,
      reducedMotion,
      hasTouch: width < 1024,
      isMobile: width < 1024,
    });
    const expected = width >= 1024 && height >= 650 && reducedMotion !== 'reduce';
    assert.equal(
      await page.locator('[data-feature-scroll]').getAttribute('data-stack-enhanced'),
      String(expected),
    );
    await page.locator('.presentation-heading').scrollIntoViewIfNeeded();
    const sizes = await page.evaluate(() => ({
      width: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth,
    }));
    assert.ok(sizes.scroll <= sizes.width, `${width}px: sem overflow ${JSON.stringify(sizes)}`);
    if (!expected) {
      for (const card of await page.locator('.feature-card').all()) {
        await card.scrollIntoViewIfNeeded();
        const valid = await card.evaluate((el) => {
          const p = el.querySelector('.use-tag').getBoundingClientRect(),
            r = el.getBoundingClientRect();
          return p.bottom <= r.bottom && p.right <= r.right;
        });
        assert.ok(valid, `${width}px: conteúdo completo no fluxo normal`);
      }
    }
    await page.locator('[data-tour-activate]').scrollIntoViewIfNeeded();
    if (width < 1024) {
      const point = await page.locator('[data-tour-shield]').boundingBox();
      const startY = await page.evaluate(() => scrollY);
      await page.evaluate(
        ({ x, y }) => {
          const el = document.elementFromPoint(x, y);
          const r = el.closest('[data-protected-tour]');
          Reflect.set(
            window,
            'shieldPoint',
            r && r.dataset.tourActive === 'false' && !el.closest('iframe'),
          );
        },
        { x: point.x + 25, y: point.y + 25 },
      );
      assert.equal(
        await page.evaluate(() => Reflect.get(window, 'shieldPoint')),
        true,
        'gesto chega na proteção, não no iframe',
      );
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
      assert.equal(
        await page.evaluate(() => scrollY),
        startY,
        'ativar/encerrar não desloca a página',
      );
    }
    await page.evaluate(() => document.activeElement?.blur());
    await page.addScriptTag({ content: axeSource });
    const violations = await page.evaluate(async () =>
      (await window.axe.run(document, { runOnly: ['color-contrast'] })).violations.flatMap((v) =>
        v.nodes.map((n) => n.target),
      ),
    );
    assert.deepEqual(violations, [], `${colorScheme} ${width}px: contraste`);
    await page.screenshot({
      path: `.artifacts/features-${width}-${colorScheme}-${reducedMotion}.png`,
    });
    await context.close();
  }
  results.push(
    '320–1440px: sem overflow, fluxo normal no mobile/movimento reduzido, controles ao toque e contraste nos dois temas.',
  );
  assert.deepEqual(errors, []);
  await writeFile('.artifacts/feature-results.json', JSON.stringify({ results, errors }, null, 2));
  console.log(results.join('\n'));
} finally {
  await browser.close();
}
