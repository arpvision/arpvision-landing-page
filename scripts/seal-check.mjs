// A seção "Seu tour, sua identidade" da home: o selo da imobiliária no canto do tour, nos três
// modelos do app. Roda contra o site já servido (`npm run preview`), como o browser-check.
import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { browserLocale, chooseLanguage } from './language-choice.mjs';
import { routes as localeRoutes } from '../src/i18n/routes.ts';

await mkdir('.artifacts', { recursive: true });
const base = process.env.SITE_URL || 'http://127.0.0.1:4321';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const axeSource = await readFile('node_modules/axe-core/axe.min.js', 'utf8');

// O que o anel escreve em cada idioma (a frase do app) e o exemplo do contato.
const expected = {
  pt: { ring: 'CAPTURADO POR · ARP VISION', contact: 'ENTRE EM CONTATO' },
  es: { ring: 'CAPTURADO POR · ARP VISION', contact: 'CONTÁCTANOS' },
  en: { ring: 'CAPTURED BY · ARP VISION', contact: 'GET IN TOUCH' },
};
const models = ['ring', 'contact', 'discreet'];

const settle = (page) =>
  page.evaluate(
    () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))),
  );
const resize = async (page, width, height) => {
  await page.setViewportSize({ width, height });
  await page.waitForFunction((size) => innerWidth === size, width);
  await settle(page);
};
/** Os modelos cujo selo está à vista na figura. */
const shown = (page) =>
  page.evaluate(() =>
    [...document.querySelectorAll('.seal-stage [data-seal-model]')]
      .filter((mark) => mark.checkVisibility())
      .map((mark) => mark.dataset.sealModel),
  );

try {
  for (const locale of Object.keys(localeRoutes)) {
    const context = await browser.newContext({
      locale: browserLocale[locale],
      viewport: { width: 1280, height: 900 },
    });
    await chooseLanguage(context, locale);
    const page = await context.newPage();
    const failures = [];
    page.on('pageerror', (error) => failures.push(String(error)));
    await page.goto(`${base}${localeRoutes[locale].pages.home}`, { waitUntil: 'networkidle' });
    const section = page.locator('.seal-section');
    assert.equal(await section.count(), 1, `${locale}: a home tem uma seção do selo`);
    await section.scrollIntoViewIfNeeded();
    await settle(page);

    // Entre a demonstração do tour e os benefícios da equipe.
    const order = await page.evaluate(() => {
      const before = (a, b) => !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
      const seal = document.querySelector('.seal-section');
      return {
        afterTour: before(document.querySelector('.tour-section'), seal),
        beforeTeam: before(seal, document.querySelector('.team-section')),
      };
    });
    assert.deepEqual(order, { afterTour: true, beforeTeam: true }, `${locale}: lugar da seção`);

    // O título nomeia a seção, e as miniaturas são um grupo de rádio com nome.
    assert.ok(
      (await section.getAttribute('aria-labelledby')) &&
        (await page.locator('#seal-title').innerText()).trim().length > 0,
      `${locale}: título da seção`,
    );
    const group = section.locator('fieldset.seal-models');
    assert.ok((await group.locator('legend').innerText()).trim(), `${locale}: nome do grupo`);
    const radios = group.locator('input[type="radio"][name="seal-model"]');
    assert.deepEqual(
      await radios.evaluateAll((inputs) => inputs.map((input) => input.value)),
      models,
      `${locale}: os três modelos`,
    );
    // A figura é uma imagem só, com descrição; os selos dentro dela são decoração.
    assert.ok(
      (await section.locator('.seal-stage[role="img"]').getAttribute('aria-label')).length > 20,
      `${locale}: descrição da figura`,
    );
    assert.equal(
      await section.locator('.seal-stage [data-seal-model]:not([aria-hidden="true"])').count(),
      0,
      `${locale}: selos da figura decorativos`,
    );

    // O anel nasce marcado, e só o selo dele aparece na figura.
    assert.equal(await radios.nth(0).isChecked(), true, `${locale}: o anel nasce marcado`);
    assert.deepEqual(await shown(page), ['ring'], `${locale}: só o anel à vista`);

    // O texto de cada modelo, no idioma da página. Cada letra é um <text> no lugar dela, e os
    // espaços não são desenhados: a comparação é sem eles.
    const tight = (text) => text.replaceAll(' ', '');
    const lettersOf = (selector) =>
      section
        .locator(`.seal-stage ${selector} text`)
        .evaluateAll((texts) => texts.map((text) => text.textContent.trim()).join(''));
    assert.equal(
      await lettersOf('[data-seal-model="ring"] .seal-lap'),
      tight(`${expected[locale].ring} · `).repeat(2),
      `${locale}: texto do anel`,
    );
    assert.equal(
      await lettersOf('[data-seal-model="contact"] .seal-arc-top'),
      'ARPVISION',
      `${locale}: nome no arco de cima`,
    );
    assert.equal(
      await lettersOf('[data-seal-model="contact"] .seal-arc-bottom'),
      tight(expected[locale].contact),
      `${locale}: contato no arco de baixo`,
    );

    // O anel fecha a volta, medido na tela: vistos do centro do selo, os meios das letras dão a
    // volta inteira sem buraco (o maior passo entre vizinhas é o de uma letra larga depois de um
    // espaço, uns 14°) e sem uma letra em cima da outra. Não depende de o navegador esticar
    // texto em curva: no WebKit o `textLength` num `textPath` não vale, e o anel abria.
    const lap = await section.locator('.seal-stage [data-seal-model="ring"]').evaluate((mark) => {
      const box = mark.getBoundingClientRect();
      const cx = box.left + box.width / 2;
      const cy = box.top + box.height / 2;
      const angles = [...mark.querySelectorAll('.seal-lap text')]
        .map((text) => {
          const glyph = text.getBoundingClientRect();
          const x = glyph.left + glyph.width / 2 - cx;
          const y = cy - (glyph.top + glyph.height / 2);
          return ((Math.atan2(x, y) * 180) / Math.PI + 360) % 360;
        })
        .sort((a, b) => a - b);
      const steps = angles.map(
        (angle, index) => (angles[(index + 1) % angles.length] - angle + 360) % 360,
      );
      return {
        letters: angles.length,
        widest: Math.round(Math.max(...steps) * 10) / 10,
        narrowest: Math.round(Math.min(...steps) * 10) / 10,
      };
    });
    assert.ok(
      lap.letters > 30 && lap.widest < 20 && lap.narrowest > 2,
      `${locale}: volta do anel ${JSON.stringify(lap)}`,
    );
    // A conta dos lugares usa a largura de cada letra da fonte do site (a tabela de lib/seal.ts):
    // a página tem de desenhar com essa fonte, e a tabela, bater com ela.
    const drawn = await section
      .locator('.seal-stage [data-seal-model="ring"] .seal-lap')
      .evaluate((group) => {
        const size = parseFloat(getComputedStyle(group).fontSize);
        const widthOf = (glyph) =>
          [...group.querySelectorAll('text')]
            .find((text) => text.textContent.trim() === glyph)
            .getComputedTextLength() / size;
        return { A: widthOf('A'), I: widthOf('I'), size };
      });
    assert.ok(
      Math.abs(drawn.A - 0.728) < 0.03 && Math.abs(drawn.I - 0.277) < 0.03,
      `${locale}: largura das letras na tela ${JSON.stringify(drawn)}`,
    );

    // Tocar numa miniatura troca o selo da figura.
    await group.locator('label', { has: page.locator('input[value="contact"]') }).click();
    assert.deepEqual(await shown(page), ['contact'], `${locale}: toque em "contato"`);
    await group.locator('label', { has: page.locator('input[value="discreet"]') }).click();
    assert.deepEqual(await shown(page), ['discreet'], `${locale}: toque em "discreto"`);
    // E o teclado também: as setas andam pelo grupo.
    await page.keyboard.press('ArrowLeft');
    assert.deepEqual(await shown(page), ['contact'], `${locale}: seta para trás`);
    await page.keyboard.press('ArrowLeft');
    assert.deepEqual(await shown(page), ['ring'], `${locale}: de volta ao anel`);
    // O rádio é invisível (cobre a miniatura): o anel de foco que se vê é o da miniatura.
    const focus = await page.evaluate(() => {
      const thumb = document.activeElement.nextElementSibling;
      const style = getComputedStyle(thumb);
      return {
        thumb: thumb.classList.contains('seal-thumb'),
        outline: style.outlineStyle,
        width: parseFloat(style.outlineWidth),
      };
    });
    assert.ok(
      focus.thumb && focus.outline !== 'none' && focus.width >= 2,
      `${locale}: o foco do teclado aparece na miniatura ${JSON.stringify(focus)}`,
    );

    // O selo fica no canto de baixo, à direita, dentro da figura.
    const cornerOf = (model) =>
      section.locator('.seal-stage').evaluate((stage, name) => {
        const box = stage.getBoundingClientRect();
        const mark = stage.querySelector(`[data-seal-model="${name}"]`).getBoundingClientRect();
        return {
          inside:
            mark.width > 0 &&
            mark.left >= box.left &&
            mark.right <= box.right &&
            mark.top >= box.top &&
            mark.bottom <= box.bottom,
          right: (box.right - mark.right) / box.width,
          bottom: (box.bottom - mark.bottom) / box.height,
          share: mark.width / box.width,
          width: mark.width,
          square: Math.abs(mark.width - mark.height) < 1,
        };
      }, model);
    for (const model of [...models].reverse()) {
      await group.locator(`input[value="${model}"]`).check({ force: true });
      const corner = await cornerOf(model);
      assert.ok(corner.inside, `${locale}, ${model}: dentro da figura ${JSON.stringify(corner)}`);
      assert.ok(
        corner.right < 0.08 && corner.bottom < 0.12,
        `${locale}, ${model}: no canto ${JSON.stringify(corner)}`,
      );
    }
    // O laço termina no anel: quadrado, com um quarto da largura da figura.
    const corner = await cornerOf('ring');
    assert.ok(corner.square, `${locale}: anel quadrado ${JSON.stringify(corner)}`);
    assert.ok(
      corner.share > 0.18 && corner.share < 0.34,
      `${locale}: tamanho ${JSON.stringify(corner)}`,
    );

    // Nenhuma largura rola de lado, e as três miniaturas cabem na tela.
    for (const width of [320, 360, 390, 768, 1024, 1440]) {
      await resize(page, width, 900);
      // No app, abaixo de 96 px de diâmetro a letra do anel não se lê. Na figura estreita do
      // celular o anel ocupa mais da largura para chegar perto disso, e segue dentro dela.
      if (width <= 390) {
        const small = await cornerOf('ring');
        assert.ok(
          small.inside && small.width >= 96,
          `${locale}, ${width} px: anel legível no celular ${JSON.stringify(small)}`,
        );
      }
      // No celular a quebra do título some, e as duas metades não podem grudar ("tour,sua").
      assert.match(
        await page.locator('#seal-title').innerText(),
        /,\s+\S/,
        `${locale}, ${width} px: espaço depois da vírgula do título`,
      );
      const layout = await page.evaluate(() => {
        const thumbs = [...document.querySelectorAll('.seal-models label')].map((label) =>
          label.getBoundingClientRect(),
        );
        const names = [...document.querySelectorAll('.seal-model-name')];
        return {
          overflow: document.documentElement.scrollWidth - innerWidth,
          inside: thumbs.every((box) => box.left >= 0 && box.right <= innerWidth),
          clipped: names.filter((name) => name.scrollWidth > name.clientWidth + 1).length,
        };
      });
      // O texto do selo é desenho (SVG), e não texto miúdo da página: nada abaixo de 12px.
      const tiny = await section.evaluate((root) => {
        const found = [];
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          const element = node.parentElement;
          if (!node.textContent.trim() || !element.checkVisibility() || element.closest('.sr-only'))
            continue;
          const size = parseFloat(getComputedStyle(element).fontSize);
          if (size < 12) found.push(size + 'px ' + node.textContent.trim().slice(0, 30));
        }
        return found;
      });
      assert.deepEqual(tiny, [], locale + ', ' + width + ' px: texto abaixo de 12px');
      assert.deepEqual(
        layout,
        { overflow: 0, inside: true, clipped: 0 },
        `${locale}, ${width} px: ${JSON.stringify(layout)}`,
      );
    }

    // Contraste do texto da seção, nos dois temas.
    await resize(page, 1280, 900);
    for (const theme of ['light', 'dark']) {
      await page.evaluate((value) => (document.documentElement.dataset.theme = value), theme);
      await settle(page);
      if (!(await page.evaluate(() => 'axe' in window)))
        await page.addScriptTag({ content: axeSource });
      const violations = await page.evaluate(async () =>
        (
          await window.axe.run(document.querySelector('.seal-section'), {
            runOnly: ['color-contrast'],
          })
        ).violations.flatMap((violation) => violation.nodes.map((node) => node.target.join(' '))),
      );
      assert.deepEqual(violations, [], `${locale}, tema ${theme}: contraste`);
      await section.screenshot({ path: `.artifacts/seal-${locale}-${theme}.png` });
    }
    await page.evaluate(() => delete document.documentElement.dataset.theme);

    // Num navegador sem `:has()`, as regras que trocam o selo são descartadas: a figura fica no
    // anel, e não vazia nem com os três. Aqui elas saem da folha de estilo, que é o que o
    // navegador antigo faz ao ler.
    await group.locator('label', { has: page.locator('input[value="discreet"]') }).click();
    const removed = await page.evaluate(() => {
      let count = 0;
      for (const sheet of document.styleSheets) {
        const strip = (list) => {
          for (let i = list.cssRules.length - 1; i >= 0; i--) {
            const rule = list.cssRules[i];
            if (rule.cssRules) strip(rule);
            if (rule.selectorText?.includes(':has(') && rule.selectorText.includes('seal')) {
              list.deleteRule(i);
              count++;
            }
          }
        };
        strip(sheet);
      }
      return count;
    });
    assert.ok(removed > 0, `${locale}: a troca usa :has()`);
    assert.deepEqual(await shown(page), ['ring'], `${locale}: sem :has(), o anel`);

    assert.deepEqual(failures, [], `${locale}: erros da página`);
    await context.close();
    console.log(`selo ${locale}: ok`);
  }
} finally {
  await browser.close();
}
