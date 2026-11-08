import { chromium, devices } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { parseColor, textContrast } from './lib/contrast.mjs';
import { portugueseWords } from './portuguese-words.mjs';
import { publishedPageIds, routes as localeRoutes } from '../src/i18n/routes.ts';

await mkdir('.artifacts', { recursive: true });
const base = process.env.SITE_URL || 'http://127.0.0.1:4321';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const errors = [];
const results = [];
// Sem preços públicos (site.pricing.showPrices), /planos só redireciona para a cotação.
const pricesShown = !(await (await fetch(`${base}/planos`)).text()).includes(
  'http-equiv="refresh"',
);
// As páginas publicadas, na ordem de routes.ts.
const pageIds = Object.keys(localeRoutes.pt.pages).filter(
  (page) => publishedPageIds.includes(page) && (pricesShown || page !== 'plans'),
);
const ptRoutes = pageIds.map((page) => localeRoutes.pt.pages[page]);
// As mesmas páginas em espanhol, em /es, na mesma ordem (cada uma é medida contra a do português).
const esRoutes = pageIds.map((page) => localeRoutes.es.pages[page]);
const routes = [...ptRoutes, ...esRoutes];
// O menu Produtos mostra só o que está no ar: o tour (na home), uma página por produto publicado
// e o "Ver todos" quando /produtos estiver publicada.
const productPages = publishedPageIds.filter((page) =>
  localeRoutes.pt.pages[page].startsWith(`${localeRoutes.pt.pages.products}/`),
);
const productLinks = (locale) =>
  [
    localeRoutes[locale].pages.home,
    ...productPages.map((page) => localeRoutes[locale].pages[page]),
  ].sort();
const allProductsLinks = publishedPageIds.includes('products') ? 1 : 0;
// Cada rolagem espera o evento e dois quadros, como no opening-check: duas rolagens no mesmo quadro
// chegariam ao site como uma só. Sem ter para onde rolar, não há evento a esperar.
const scrollPage = (target, top) =>
  target.evaluate(
    (y) =>
      new Promise((resolve) => {
        const end = document.documentElement.scrollHeight - innerHeight;
        if (Math.abs(Math.min(Math.max(y, 0), end) - scrollY) < 1) return resolve();
        addEventListener(
          'scroll',
          () => requestAnimationFrame(() => requestAnimationFrame(resolve)),
          {
            once: true,
          },
        );
        scrollTo({ top: y, behavior: 'instant' });
      }),
    top,
  );
// Fora da abertura da home, a cápsula do cabeçalho fica quase opaca, na cor do tema, e cada texto
// dele passa de 4,5:1 sobre qualquer seção. O axe marca texto sobre vidro como "incomplete", então
// o contraste é medido na imagem (scripts/lib/contrast.mjs), no tema claro e no escuro. O `before`
// prepara cada tema (o fundo do tour, por exemplo). Devolve o menor contraste de cada tema.
const legibleHeader = async (target, scene, before = async () => {}) => {
  const lowest = {};
  for (const theme of ['light', 'dark']) {
    await target.evaluate((value) => (document.documentElement.dataset.theme = value), theme);
    await before(theme);
    const items = await textContrast(target.locator('.header-capsule'));
    assert.deepEqual(
      items.filter((item) => item.ratio < 4.5),
      [],
      `${scene}, tema ${theme}: texto do cabeçalho abaixo de 4,5:1`,
    );
    const look = await target.locator('.site-header').evaluate((header) => {
      const capsule = getComputedStyle(header.querySelector('.header-capsule'));
      return {
        image: capsule.backgroundImage,
        color: capsule.backgroundColor,
        logo: [...header.querySelectorAll('.brand img')].find((image) => image.checkVisibility())
          ?.src,
      };
    });
    assert.ok(
      look.image === 'none' && parseColor(look.color)[3] >= 0.85,
      `${scene}, tema ${theme}: cápsula quase opaca ${JSON.stringify(look)}`,
    );
    assert.match(look.logo, theme === 'dark' ? /white/ : /blue/, `${scene}, tema ${theme}: logo`);
    lowest[theme] = Math.min(...items.map((item) => item.ratio));
  }
  await target.evaluate(() => delete document.documentElement.dataset.theme);
  return lowest;
};
// O que passa atrás do cabeçalho (o título, os botões e o logo de uma faixa) muda com a posição:
// a seção é percorrida de baixo para cima (na home, ele continua de volta), de 60 em 60 px, sempre
// atrás do cabeçalho inteiro, e cada parada é medida.
const legibleAcross = async (target, selector, scene, before) => {
  const stops = await target.evaluate((sectionSelector) => {
    const header = document.querySelector('.site-header');
    const top = parseFloat(getComputedStyle(header).top);
    const section = document.querySelector(sectionSelector).getBoundingClientRect();
    const first = section.bottom + scrollY - top - header.offsetHeight;
    const last = Math.ceil(section.top + scrollY - top);
    const list = [];
    for (let y = first; y > last; y -= 60) list.push(Math.floor(y));
    return [...list, last];
  }, selector);
  const lowest = { light: Infinity, dark: Infinity };
  for (const stop of stops) {
    await scrollPage(target, stop);
    const behind = await target.evaluate((sectionSelector) => {
      const section = document.querySelector(sectionSelector).getBoundingClientRect();
      const capsule = document.querySelector('.header-capsule').getBoundingClientRect();
      return (
        section.top <= capsule.top &&
        section.bottom >= capsule.bottom &&
        section.left < capsule.right &&
        section.right > capsule.left
      );
    }, selector);
    assert.equal(behind, true, `${scene}: atrás do cabeçalho na parada de ${stop}px`);
    const measured = await legibleHeader(target, `${scene}, parada de ${stop}px`, before);
    lowest.light = Math.min(lowest.light, measured.light);
    lowest.dark = Math.min(lowest.dark, measured.dark);
  }
  return lowest;
};
const readings = [];
const reading = (scene, { light, dark }) =>
  `${scene}: claro ${light.toFixed(2)}:1, escuro ${dark.toFixed(2)}:1`;
try {
  const desktop = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: 'reduce',
  });
  const page = await desktop.newPage();
  page.on('pageerror', (error) => errors.push(error.message));
  for (const route of routes) {
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
  // Tutoriais, nos dois idiomas: o cartão leva ao YouTube; com JavaScript, abre o player no
  // diálogo. Cabeçalho, menu do celular e rodapé levam à página do idioma (o seletor PT | ES,
  // com hreflang, é o único caminho para a do outro).
  for (const [route, closeLabel, screenshot] of [
    ['/tutoriais', 'Fechar o vídeo', 'tutoriais'],
    ['/es/tutoriales', 'Cerrar el vídeo', 'tutoriales'],
  ]) {
    await page.goto(base + route);
    const card = page.locator('.tutorial-card').first();
    assert.match(await card.getAttribute('href'), /^https:\/\/www\.youtube\.com\/watch\?v=/);
    for (const menu of ['.desktop-nav', '#mobile-nav'])
      assert.equal(
        await page
          .locator(`${menu} a[href="${route}"]:not([hreflang])`)
          .getAttribute('aria-current'),
        'page',
        `${route}: ${menu} marca a página`,
      );
    assert.equal(await page.locator(`footer a[href="${route}"]:not([hreflang])`).count(), 1);
    await card.click();
    const videoDialog = page.locator('#tutorial-dialog');
    assert.equal(await videoDialog.evaluate((dialog) => dialog.open), true);
    assert.match(
      await videoDialog.locator('iframe').getAttribute('src'),
      new RegExp(
        `^https://www\\.youtube-nocookie\\.com/embed/${await card.getAttribute('data-youtube')}\\?`,
      ),
    );
    assert.equal(
      await page.locator('#tutorial-dialog-title').textContent(),
      await card.getAttribute('data-title'),
    );
    assert.equal(
      await videoDialog.locator('[data-close-dialog]').getAttribute('aria-label'),
      closeLabel,
    );
    await page.screenshot({ path: `.artifacts/${screenshot}-player-desktop.png` });
    await page.keyboard.press('Escape');
    assert.equal(await videoDialog.evaluate((dialog) => dialog.open), false);
    assert.equal(await videoDialog.locator('iframe').count(), 0, `${route}: fechar tira o player`);
    assert.equal(await card.evaluate((element) => element === document.activeElement), true);
  }
  // Os vídeos são narrados em português: o espanhol avisa logo na abertura, como o app.
  assert.match(
    await page.locator('.tutorials-page .section-heading p').innerText(),
    /^Vídeos cortos, en portugués, /,
  );
  results.push(
    'Tutoriais nos dois idiomas: player no diálogo só após o clique; Escape fecha, tira o iframe e devolve o foco; menus e rodapé no idioma; aviso "en portugués" OK',
  );
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
  assert.equal(await page.locator('.calculator, .alternatives-section, .facts-strip').count(), 0);
  assert.equal(
    await page.locator('.feature-stack, .feature-card, [data-feature-scroll]').count(),
    0,
  );
  assert.equal(await page.locator('.steps p').count(), 0);
  assert.equal(await page.locator('.team-benefit').count(), 2, 'somente benefícios já definidos');
  assert.equal(await page.locator('.credit-facts, .sharing-details').count(), 0);
  assert.match(await page.locator('#creditos').innerText(), /30 segundos/);
  assert.match(
    await page.locator('.credit-example').innerText(),
    /5 ambientes, ou seja, 5 créditos/,
  );
  assert.equal(
    await page.locator('#compartilhamento img').getAttribute('src'),
    '/images/conversa-whatsapp.webp',
  );
  // Sem tour configurado, a seção e os links para ela ficam fora da página.
  assert.equal(await page.locator('#tour-real').isVisible(), false);
  assert.equal(await page.locator('a[href$="#tour-real"]:visible').count(), 0);
  assert.equal(await page.locator('[data-tour-host] iframe').count(), 0);
  results.push('Reduções, seções removidas, compartilhamento, dois benefícios e demo oculta OK');

  // Menu do desktop acompanha a seção visível.
  for (const [id, label] of [
    pricesShown ? ['planos', 'Planos'] : ['cotacao', 'Cotação'],
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

  // Na home, depois da abertura, o cabeçalho volta quando a pessoa sobe a página, numa cápsula
  // quase opaca: sobre a faixa final escura e sobre o tour da apresentação, que ocupa meia largura.
  // O tour vira uma página lisa, preta no tema claro e branca no escuro: o pior fundo de cada um.
  {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      reducedMotion: 'reduce',
    });
    const home = await context.newPage();
    home.on('pageerror', (error) => errors.push(error.message));
    await home.route('https://arpvision.app/embed/**', (route) =>
      route.fulfill({
        contentType: 'text/html',
        body: '<!doctype html><html lang="pt-BR"><body></body></html>',
      }),
    );
    await home.goto(base);
    await home.evaluate(() => document.fonts.ready);
    const headerState = () =>
      home.locator('.site-header').evaluate((header) => ({
        hidden: header.dataset.headerHidden,
        surface: header.dataset.headerSurface,
      }));
    // A coluna grudada da FAQ fica embaixo do cabeçalho de volta e sobe quando ele sai (a troca de
    // valor é uma transição, mesmo com movimento reduzido).
    const faqColumn = async (top, message) => {
      const column = home.locator('.faq-layout > div:first-child');
      await home
        .waitForFunction(
          (value) =>
            getComputedStyle(document.querySelector('.faq-layout > div:first-child')).top === value,
          top,
          { timeout: 3000 },
        )
        .catch(() => {});
      assert.equal(await column.evaluate((element) => getComputedStyle(element).top), top, message);
    };
    const pageEnd = await home.evaluate(() => document.documentElement.scrollHeight - innerHeight);
    await scrollPage(home, pageEnd);
    assert.equal((await headerState()).hidden, 'true', 'cabeçalho fora de cena no fim da home');
    // Subindo até a faixa final, com o fim dela no fim do cabeçalho: logo abaixo vem a seção
    // Dúvidas, e o link dela é o da seção da vez.
    await scrollPage(
      home,
      await home.locator('.final-cta').evaluate((strip) => {
        const header = document.querySelector('.site-header');
        const bottom = parseFloat(getComputedStyle(header).top) + header.offsetHeight;
        return Math.floor(strip.getBoundingClientRect().bottom + scrollY - bottom);
      }),
    );
    assert.deepEqual(
      await headerState(),
      { hidden: 'false', surface: '' },
      'cabeçalho de volta ao subir, sobre a faixa final, fora do vidro da abertura',
    );
    await home.waitForFunction(
      () =>
        document.querySelector('.desktop-nav [aria-current="location"]')?.textContent.trim() ===
        'Dúvidas',
    );
    readings.push(
      reading(
        'home, de volta sobre a faixa final',
        await legibleAcross(home, '.final-cta', 'home, de volta sobre a faixa final'),
      ),
    );
    await faqColumn('104px', 'a coluna da FAQ desce para baixo do cabeçalho de volta');
    await home.screenshot({ path: '.artifacts/cabecalho-faixa-final.png' });
    readings.push(
      reading(
        'home, de volta sobre o tour',
        await legibleAcross(home, '.hero-embed', 'home, de volta sobre o tour', (theme) =>
          home
            .frameLocator('.hero-embed')
            .locator('body')
            .evaluate(
              (body, color) => (body.style.background = color),
              theme === 'dark' ? '#fff' : '#000',
            ),
        ),
      ),
    );
    assert.deepEqual(await headerState(), { hidden: 'false', surface: '' });
    await home.screenshot({ path: '.artifacts/cabecalho-sobre-o-tour.png' });
    // Descer de novo tira o cabeçalho de cena, e a coluna da FAQ volta para cima.
    await scrollPage(home, await home.evaluate(() => scrollY + 200));
    assert.equal((await headerState()).hidden, 'true', 'cabeçalho sai ao descer de novo');
    await faqColumn('32px', 'a coluna da FAQ sobe quando o cabeçalho sai');
    // O painel Produtos aberto fecha quando o cabeçalho sai de cena.
    await scrollPage(home, 0);
    await home.locator('.products-toggle').click();
    assert.equal(await home.locator('.products-toggle').getAttribute('aria-expanded'), 'true');
    await scrollPage(home, pageEnd);
    assert.equal((await headerState()).hidden, 'true');
    assert.equal(
      await home.locator('.products-toggle').getAttribute('aria-expanded'),
      'false',
      'o painel Produtos fecha quando o cabeçalho sai',
    );
    // Fora da home ele fica sempre na tela: em /tutoriais, sobre a faixa azul do fim. A janela é
    // baixa para a faixa chegar ao cabeçalho.
    await home.setViewportSize({ width: 1440, height: 640 });
    await home.goto(base + localeRoutes.pt.pages.tutorials);
    await home.evaluate(() => document.fonts.ready);
    readings.push(
      reading(
        '/tutoriais, sobre a faixa azul',
        await legibleAcross(home, '.final-cta', '/tutoriais, sobre a faixa azul'),
      ),
    );
    await home.screenshot({ path: '.artifacts/cabecalho-faixa-azul.png' });
    await context.close();
  }
  results.push(
    'Cabeçalho fora da abertura: volta ao subir na home, cápsula quase opaca com contraste AA (faixa final, tour e faixa azul de /tutoriais, nos dois temas), coluna da FAQ em 104px e 32px, e o painel Produtos fecha ao sair OK',
  );
  // Com mouse, o botão do menu (abaixo de 1024px) ganha um círculo sob o ponteiro. Sobre a
  // abertura, ele é branco translúcido, porque o ícone ali é branco.
  {
    const context = await browser.newContext({
      viewport: { width: 900, height: 800 },
      reducedMotion: 'reduce',
    });
    const narrow = await context.newPage();
    narrow.on('pageerror', (error) => errors.push(error.message));
    await narrow.goto(base);
    await narrow.waitForFunction(
      () => document.querySelector('.site-header').dataset.headerSurface === 'opening',
    );
    await narrow.locator('.menu-toggle').hover();
    // A cor do hover chega depois do primeiro quadro (a transição do movimento reduzido começa
    // transparente): a leitura imediata falhava em um de cada quatro cliques. Espera até 1 s.
    const readFill = async () =>
      parseColor(
        await narrow
          .locator('.menu-toggle')
          .evaluate((button) => getComputedStyle(button).backgroundColor),
      );
    let hoverFill = await readFill();
    for (let waited = 0; hoverFill[3] === 0 && waited < 1000; waited += 25) {
      await narrow.waitForTimeout(25);
      hoverFill = await readFill();
    }
    assert.ok(
      hoverFill.slice(0, 3).every((value) => value === 255) &&
        hoverFill[3] > 0 &&
        hoverFill[3] <= 0.3,
      `hover do botão do menu branco translúcido sobre a abertura: ${hoverFill}`,
    );
    await context.close();
  }
  results.push(
    '900px, com mouse: o hover do botão do menu é branco translúcido sobre a abertura OK',
  );

  // "Produtos ▾" no lugar de "Como funciona", nos dois idiomas: abre e fecha pelo clique, pelo
  // teclado e pelo clique fora, e mostra um link por produto no ar.
  for (const [locale, route] of [
    ['pt', '/'],
    ['es', '/es'],
  ]) {
    await page.goto(base + route);
    const toggle = page.locator('.desktop-nav > :first-child');
    const panel = page.locator('#products-panel');
    assert.equal(
      await toggle.evaluate((element) => element.matches('button.products-toggle')),
      true,
      `${route}: o primeiro item do menu é o botão Produtos`,
    );
    assert.equal(await panel.isVisible(), false, `${route}: painel fechado ao carregar`);
    await toggle.click();
    assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
    assert.equal(await panel.isVisible(), true, `${route}: o clique abre o painel`);
    assert.deepEqual(
      (
        await panel
          .locator('a[data-product]')
          .evaluateAll((links) => links.map((link) => link.getAttribute('href')))
      ).sort(),
      productLinks(locale),
      `${route}: um link por produto no ar`,
    );
    assert.equal(await panel.locator('a.products-all').count(), allProductsLinks);
    await page.screenshot({ path: `.artifacts/produtos-menu-${locale}-desktop.png` });
    await page.keyboard.press('Escape');
    assert.equal(await panel.isVisible(), false, `${route}: Esc fecha`);
    assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
    assert.equal(
      await toggle.evaluate((element) => element === document.activeElement),
      true,
      `${route}: o foco volta ao botão`,
    );
    await page.keyboard.press('Enter');
    assert.equal(await panel.isVisible(), true, `${route}: Enter reabre`);
    // O painel vem depois da cápsula no HTML: o Tab leva do botão ao primeiro item dele.
    await page.keyboard.press('Tab');
    assert.equal(
      await panel
        .locator('a')
        .first()
        .evaluate((element) => element === document.activeElement),
      true,
      `${route}: Tab do botão aberto vai ao painel`,
    );
    await page.locator('.hero h1').click({ position: { x: 10, y: 10 } });
    assert.equal(await panel.isVisible(), false, `${route}: clique fora fecha`);
    assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
  }
  results.push(
    'Menu Produtos no desktop (pt e es): primeiro item, clique, Esc com o foco de volta, Enter, Tab até o painel, clique fora e os produtos no ar OK',
  );

  for (const route of pricesShown ? ['/', '/planos'] : ['/']) {
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
  if (!pricesShown) {
    // Preços ocultos: a Home pede cotação pelo WhatsApp e nenhum valor aparece.
    await page.goto(base);
    assert.doesNotMatch(await page.locator('body').innerText(), /R\$\s*\d/, 'Home sem valores');
    assert.equal(
      await page.locator('[data-pricing], .plan-card').count(),
      0,
      'sem cards de planos',
    );
    const quote = page.locator('#cotacao');
    const submit = quote.locator('.quote-submit');
    const message = async () => new URL(await submit.getAttribute('href')).searchParams.get('text');
    const greeting = 'Olá! Vim pelo site e quero uma cotação da ARP Vision.';
    assert.equal(await message(), greeting);
    assert.equal(await submit.getAttribute('target'), '_blank');
    await quote.locator('input[value="Tenho uma equipe"]').check();
    await quote.locator('input[value="6 a 15"]').check();
    await quote.locator('input[value="Este mês"]').check();
    const filled = [
      greeting,
      '• Como trabalho: Tenho uma equipe',
      '• Espaços por mês: 6 a 15',
      '• Para quando: Este mês',
      'Pode me mandar uma proposta?',
    ].join('\n');
    assert.equal(await message(), filled, 'respostas entram na mensagem');
    assert.equal(await quote.locator('[data-quote-preview]').textContent(), filled, 'prévia igual');
    // Teclado: as setas trocam a escolha dentro da mesma pergunta.
    await quote.locator('input[value="Este mês"]').press('ArrowRight');
    assert.match(await message(), /• Para quando: Ainda pesquisando/);
    assert.match(await page.locator('#duvidas').innerText(), /Quanto custa\?/);
    const schema = JSON.parse(
      await page.locator('script[type="application/ld+json"]').textContent(),
    );
    assert.equal(
      schema.find((item) => item['@type'] === 'SoftwareApplication').offers,
      undefined,
      'JSON-LD sem ofertas com preço',
    );
    await quote.screenshot({ path: '.artifacts/cotacao-desktop.png' });
    await page.goto(base + '/planos');
    await page.waitForURL(/\/#cotacao$/);
    results.push(
      'Preços ocultos: cotação pelo WhatsApp com mensagem pronta, sem valores nem ofertas; /planos leva à cotação OK',
    );
  } else {
    await page.goto(base + '/planos');
    // Mesmos quatro cards da tela de planos do app; o teste grátis vira uma nota.
    assert.equal(await page.locator('.plan-card').count(), 4);
    assert.equal(await page.locator('.feature-table thead th').count(), 5);
    // Plano anual com 20%: o seletor mensal/anual aparece uma vez.
    assert.equal(await page.locator('[data-billing-toggle]').count(), 1);
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
    assert.match(
      await page.locator('[data-plan="corretor"]').textContent(),
      /20 ambientes por mês/,
    );
    assert.match(await page.locator('[data-plan="corretor"]').textContent(), /Até 30 tours no ar/);
    assert.match(
      await page.locator('[data-plan="imobiliaria"] [data-price]').textContent(),
      /R\$\s*599$/,
    );
    assert.match(await page.locator('[data-plan="rede"]').textContent(), /Falar no WhatsApp/);
    const trial = await page.locator('.pricing-trial').textContent();
    assert.match(trial, /fotografe\s+1 ambiente/);
    assert.match(trial, /por\s+7 dias/);
    assert.match(trial, /sem pagar nada/);
    assert.match(
      await page.locator('[data-plan="imobiliaria"]').textContent(),
      /Até 120 tours no ar/,
    );
    // Seletor mensal/anual: 20% nas assinaturas; Individual e Enterprise não mudam.
    const billingSwitch = page.locator('[data-billing-switch]');
    assert.equal(await billingSwitch.getAttribute('role'), 'switch');
    assert.equal(await billingSwitch.getAttribute('aria-checked'), 'false');
    await billingSwitch.click();
    assert.equal(await billingSwitch.getAttribute('aria-checked'), 'true');
    const priceOf = (plan) => page.locator(`[data-plan="${plan}"] [data-price]`);
    // O Intl separa "R$" do número com espaço inseparável: normaliza antes de comparar.
    const waitForPrice = (plan, text) =>
      page.waitForFunction(
        ([id, expected]) =>
          document
            .querySelector(`[data-plan="${id}"] [data-price]`)
            .textContent.replace(/\s+/g, ' ')
            .trim() === expected,
        [plan, text],
      );
    await waitForPrice('corretor', 'R$ 199,20');
    assert.match(await priceOf('imobiliaria').textContent(), /R\$\s*479,20$/);
    assert.match(
      await page.locator('[data-plan="corretor"] .plan-payment').textContent(),
      /Cobrança anual de R\$\s*2\.390,40/,
    );
    assert.match(
      await page.locator('[data-plan="imobiliaria"] .plan-payment').textContent(),
      /Cobrança anual de R\$\s*5\.750,40/,
    );
    assert.match(await priceOf('individual').textContent(), /R\$\s*23,25/);
    assert.match(await page.locator('[data-billing-status]').textContent(), /plano anual/);
    await page.locator('[data-billing-option="monthly"]').click();
    await waitForPrice('corretor', 'R$ 249');
    assert.match(
      await page.locator('[data-plan="corretor"] .plan-payment').textContent(),
      /Cobrança mensal, no cartão/,
    );
    const schema = JSON.parse(
      await page.locator('script[type="application/ld+json"]').textContent(),
    );
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
    results.push(
      'Quatro planos como no app, Pix/parcelas, seletor mensal/anual (20%), limites e ofertas estruturadas OK',
    );
  }

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
    // Termina numa página interna: na Home, o cabeçalho sobre a abertura usa o logo branco.
    for (const route of ['/', pricesShown ? '/planos' : '/termos-de-uso']) {
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
  for (const route of routes) {
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
  // Aberto, o menu do celular fica numa cápsula opaca, na cor do tema: as linhas dele passam por
  // fundos misturados. Fora da home, ele pode ficar sobre a faixa azul, o título dela desfocado e
  // o rodapé. A página não rola pelo toque com o menu aberto, mas rola pelo script: a faixa vai
  // para o topo do cabeçalho.
  await phone.goto(base + localeRoutes.pt.pages.tutorials);
  await phone.locator('.menu-toggle').click();
  await scrollPage(
    phone,
    await phone.evaluate(
      () =>
        document.querySelector('.final-cta').getBoundingClientRect().top +
        scrollY -
        parseFloat(getComputedStyle(document.querySelector('.site-header')).top) +
        4,
    ),
  );
  assert.equal(
    await phone.evaluate(
      () =>
        document.querySelector('.final-cta').getBoundingClientRect().top <=
        document.querySelector('.header-capsule').getBoundingClientRect().top,
    ),
    true,
    'menu aberto em /tutoriais com a faixa azul atrás dele',
  );
  // O botão Produtos só ganha is-current nas páginas de produto (Tarefa 6); aqui a classe entra
  // à mão.
  const productsCurrent = (on) =>
    phone
      .locator('.mobile-products-toggle')
      .evaluate((button, value) => button.classList.toggle('is-current', value), on);
  await productsCurrent(true);
  readings.push(
    reading(
      '360px, menu aberto sobre a faixa azul de /tutoriais',
      await legibleHeader(phone, '360px, menu aberto sobre a faixa azul de /tutoriais'),
    ),
  );
  await phone.screenshot({ path: '.artifacts/tutoriais-menu-faixa-mobile.png' });
  await productsCurrent(false);
  await phone.goto(base);
  await phone.screenshot({ path: '.artifacts/home-mobile.png' });
  await phone.locator('.menu-toggle').tap();
  assert.equal(await phone.locator('#mobile-nav').isVisible(), true);
  assert.equal(await phone.evaluate(() => getComputedStyle(document.body).overflow), 'hidden');
  // Aberto no topo da home, o menu empurra a abertura para baixo, e o cabeçalho fica sobre o fundo
  // claro e o começo dela: a cápsula deixa o vidro da abertura.
  await phone.waitForFunction(
    () => document.querySelector('.site-header').dataset.headerSurface === '',
    null,
    { timeout: 5000 },
  );
  readings.push(
    reading(
      '360px, menu aberto no topo da home',
      await legibleHeader(phone, '360px, menu aberto no topo da home'),
    ),
  );
  await phone.screenshot({ path: '.artifacts/home-menu-aberto-mobile.png' });
  // Fechado pelo próprio botão, ele volta ao vidro da abertura. O :hover fica no botão depois do
  // toque, mas sem mouse o botão não ganha o círculo claro atrás do ícone branco.
  await phone.locator('.menu-toggle').tap();
  await phone.waitForFunction(
    () => document.querySelector('.site-header').dataset.headerSurface === 'opening',
    null,
    { timeout: 5000 },
  );
  assert.equal(
    await phone
      .locator('.menu-toggle')
      .evaluate((button) => getComputedStyle(button).backgroundColor),
    'rgba(0, 0, 0, 0)',
    'sem círculo de hover no botão do menu depois do toque',
  );
  results.push(
    '360px: menu aberto numa cápsula opaca com contraste AA (topo da home e faixa azul de /tutoriais, nos dois temas); fechado, volta ao vidro da abertura, sem o círculo de hover preso no botão OK',
  );
  // Toque fora do menu num ponto sem link (o título da hero), para não navegar.
  await phone.locator('.menu-toggle').click();
  await phone.locator('.hero h1').click({ position: { x: 10, y: 10 } });
  assert.equal(await phone.locator('#mobile-nav').isVisible(), false, 'toque fora fecha o menu');
  await phone.waitForFunction(
    () => document.querySelector('.site-header').dataset.headerSurface === 'opening',
    null,
    { timeout: 5000 },
  );
  await phone.locator('.menu-toggle').click();
  // O grupo Produtos abre dentro do menu, com os produtos do painel e toques de 44px.
  const productsToggle = phone.locator('.mobile-products-toggle');
  const productsList = phone.locator('#mobile-products-list');
  assert.equal(await productsList.isVisible(), false, 'grupo Produtos fechado ao abrir o menu');
  await productsToggle.tap();
  assert.equal(await productsToggle.getAttribute('aria-expanded'), 'true');
  const productItems = await productsList.locator('a').evaluateAll((links) =>
    links.map((link) => ({
      label: link.textContent.trim().slice(0, 30),
      href: link.dataset.product ? link.getAttribute('href') : null,
      visible: link.checkVisibility(),
      height: Math.round(link.getBoundingClientRect().height),
    })),
  );
  assert.deepEqual(
    productItems.flatMap((item) => (item.href ? [item.href] : [])).sort(),
    productLinks('pt'),
    'grupo Produtos com os produtos no ar',
  );
  assert.equal(productItems.length, productLinks('pt').length + allProductsLinks);
  for (const item of productItems)
    assert.ok(item.visible && item.height >= 44, `item do grupo Produtos: ${JSON.stringify(item)}`);
  await phone.screenshot({ path: '.artifacts/produtos-menu-mobile.png' });
  // "Produtos" é um botão: o primeiro link de seção do menu leva à home e fecha o menu. Com preços
  // públicos, o primeiro link é "Planos" (/planos), que sai da home; o de seção é "Dúvidas".
  await phone.locator('#mobile-nav > a[href^="#"]').first().click();
  assert.equal(await phone.locator('#mobile-nav').isVisible(), false);
  assert.equal(await phone.evaluate(() => getComputedStyle(document.body).overflow), 'visible');
  if (!pricesShown) {
    assert.equal(phone.url(), `${base}/#cotacao`, 'o primeiro link do menu leva à cotação');
    // Cotação no celular: toque numa opção atualiza a mensagem; o FAQ continua abrindo.
    const quote = phone.locator('#cotacao');
    await quote.scrollIntoViewIfNeeded();
    await quote.locator('input[value="Trabalho sozinho"]').tap();
    assert.match(
      new URL(await quote.locator('.quote-submit').getAttribute('href')).searchParams.get('text'),
      /• Como trabalho: Trabalho sozinho/,
    );
    await quote.screenshot({ path: '.artifacts/cotacao-mobile.png' });
    await phone.locator('.faq-item').first().locator('summary').click();
    assert.equal(await phone.locator('.faq-item').first().getAttribute('open'), '');
    results.push(
      `360px: ${routes.length} rotas (pt e es) sem overflow, texto < 12px ou alvo pequeno; menu, cotação e FAQ OK`,
    );
  } else {
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
    // O carrossel não rola na vertical: o gesto de subir/descer sobre os cards move a página.
    assert.equal(
      await phone
        .locator('#planos [data-pricing-grid]')
        .evaluate((grid) => getComputedStyle(grid).overflowY),
      'hidden',
      'carrossel de planos sem rolagem vertical',
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
      `360px: ${routes.length} rotas (pt e es) sem overflow, texto < 12px ou alvo pequeno; menu, carrossel, FAQ e recursos por plano OK`,
    );
  }
  // Espanhol (/es): idioma, texto sem português, links do app e tour no idioma, cotação,
  // seletor PT | ES, 404 nos dois idiomas e larguras de 320 a 1440px sem estouro.
  const knownIssues = [];
  const es = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: 'reduce',
  });
  const esPage = await es.newPage();
  esPage.on('pageerror', (error) => errors.push(error.message));
  // Texto visível, sem o que está marcado em português de propósito ("Português" no seletor)
  // e sem e-mails e domínios.
  const portugueseLines = () =>
    esPage.evaluate((source) => {
      const words = new RegExp(source, 'iu');
      const hidden = [...document.querySelectorAll('[lang="pt-BR"]')];
      hidden.forEach((node) => (node.style.display = 'none'));
      const text = document.body.innerText;
      hidden.forEach((node) => (node.style.display = ''));
      return text
        .replace(/[\w.+-]+@[\w.-]+|[\w-]+(?:\.[\w-]+)+/g, '')
        .split('\n')
        .filter((line) => words.test(line));
    }, portugueseWords.source);
  for (const route of esRoutes) {
    await esPage.goto(base + route);
    assert.equal(await esPage.locator('html').getAttribute('lang'), 'es-ES', `${route}: lang`);
    assert.deepEqual(await portugueseLines(), [], `${route}: português na página em espanhol`);
    for (const href of await esPage
      .locator('a[href^="https://arpvision.app/"]')
      .evaluateAll((links) => links.map((link) => link.href)))
      assert.equal(new URL(href).searchParams.get('idioma'), 'es', `${route}: ${href}`);
  }
  await esPage.goto(base + '/es');
  assert.equal(
    await esPage.locator('.hero-embed').getAttribute('src'),
    'https://arpvision.app/embed/511a5654-29f2-4798-87ff-5b479210dbf0?idioma=es',
  );
  assert.equal(
    await esPage.locator('#compartilhamento .chat-preview').count(),
    1,
    'conversa do WhatsApp em HTML, sem a imagem em português',
  );
  assert.equal(await esPage.locator('img[src*="conversa-whatsapp"]').count(), 0);
  const esSchema = JSON.parse(
    await esPage.locator('script[type="application/ld+json"]').textContent(),
  );
  assert.equal(
    esSchema.find((item) => item['@type'] === 'SoftwareApplication').inLanguage,
    'es-ES',
  );
  assert.ok(
    esSchema
      .find((item) => item['@type'] === 'FAQPage')
      .mainEntity.some((item) => item.name === '¿Cómo funciona el pago?'),
    'FAQPage em espanhol',
  );
  if (!pricesShown) {
    const quote = esPage.locator('#cotizacion');
    const submit = quote.locator('.quote-submit');
    const message = async () => new URL(await submit.getAttribute('href')).searchParams.get('text');
    const greeting = '¡Hola! Vengo de la web y quiero un presupuesto de ARP Vision.';
    assert.equal(await message(), greeting);
    await quote.locator('input[value="Tengo un equipo"]').check();
    await quote.locator('input[value="6 a 15"]').check();
    await quote.locator('input[value="Este mes"]').check();
    const filled = [
      greeting,
      '• Cómo trabajo: Tengo un equipo',
      '• Espacios al mes: 6 a 15',
      '• Para cuándo: Este mes',
      '¿Me puedes enviar una propuesta?',
    ].join('\n');
    assert.equal(await message(), filled, 'respostas em espanhol na mensagem');
    assert.equal(await quote.locator('[data-quote-preview]').textContent(), filled);
    assert.match(await esPage.locator('#preguntas').innerText(), /¿Cuánto cuesta\?/);
    await quote.screenshot({ path: '.artifacts/cotizacion-desktop.png' });
    await esPage.goto(base + '/es/planes');
    await esPage.waitForURL(/\/es#cotizacion$/);
  }
  // Menu do desktop com as âncoras em espanhol.
  await esPage.goto(base + '/es');
  for (const [id, label] of [
    pricesShown ? ['planes', 'Planes'] : ['cotizacion', 'Presupuesto'],
    ['preguntas', 'Preguntas'],
  ]) {
    await esPage.evaluate((section) => {
      const top = document.getElementById(section).getBoundingClientRect().top + scrollY;
      scrollTo({ top: top - 120, behavior: 'instant' });
    }, id);
    await esPage.waitForFunction(
      (text) =>
        document.querySelector('.desktop-nav [aria-current="location"]')?.textContent.trim() ===
        text,
      label,
    );
  }
  await esPage.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  await esPage.screenshot({ path: '.artifacts/es-desktop.png' });
  // Seletor PT | ES: leva à mesma página no outro idioma; nada troca sozinho.
  await esPage.goto(base + '/termos-de-uso');
  assert.equal(await esPage.locator('html').getAttribute('lang'), 'pt-BR');
  await esPage.locator('footer .language-switch a[lang="es-ES"]').click();
  await esPage.waitForURL(/\/es\/terminos-de-uso$/);
  assert.equal(
    await esPage.locator('footer .language-switch [aria-current="true"]').getAttribute('lang'),
    'es-ES',
  );
  // No espanhol o seletor do desktop fica só no rodapé: o cabeçalho não comporta os rótulos
  // longos e ele. O português o mantém no cabeçalho, que é por onde um espanhol chega ao /es.
  assert.equal(await esPage.locator('.desktop-language').isVisible(), false);
  await esPage.locator('footer .language-switch a[lang="pt-BR"]').click();
  await esPage.waitForURL(/\/termos-de-uso$/);
  assert.equal(await esPage.locator('.desktop-language').isVisible(), true);
  const notFound = await esPage.goto(base + '/pagina-que-nao-existe');
  assert.equal(notFound.status(), 404);
  assert.match(await esPage.locator('h1').innerText(), /Página não encontrada/);
  assert.match(await esPage.locator('main [lang="es-ES"]').innerText(), /Página no encontrada/);
  await es.close();
  for (const colorScheme of ['light', 'dark']) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      colorScheme,
      reducedMotion: 'reduce',
    });
    const themed = await context.newPage();
    for (const route of ['/es', '/es/terminos-de-uso', '/pagina-que-nao-existe']) {
      await themed.goto(base + route);
      await themed.addScriptTag({ content: axeSource });
      const contrast = await themed.evaluate(async () =>
        (await window.axe.run(document, { runOnly: ['color-contrast'] })).violations.flatMap(
          (violation) => violation.nodes.map((node) => node.target.join(' ')),
        ),
      );
      assert.deepEqual(contrast, [], `${colorScheme} ${route}: contraste insuficiente`);
    }
    await context.close();
  }
  // Cabeçalho em uma linha em todas as rotas dos dois idiomas, inclusive de 1024 a 1100px, onde
  // os rótulos do espanhol ficam mais apertados.
  for (const width of [320, 360, 390, 768, 1024, 1040, 1100, 1280, 1440]) {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      reducedMotion: 'reduce',
      isMobile: width < 768,
      hasTouch: width < 768,
    });
    const sized = await context.newPage();
    sized.on('pageerror', (error) => errors.push(error.message));
    const measure = async (route) => {
      await sized.goto(base + route);
      await sized.evaluate(() => document.fonts.ready);
      return sized.evaluate(() => ({
        width: document.documentElement.clientWidth,
        layout: innerWidth,
        scroll: document.documentElement.scrollWidth,
        // Nenhum rótulo do cabeçalho quebra em duas linhas, o botão Produtos incluído.
        wrapped: [...document.querySelectorAll('.header-inner a, .header-inner button')]
          .filter((element) => element.checkVisibility())
          .filter((element) => element.getBoundingClientRect().height > 50)
          .map((element) => element.textContent.trim()),
        products: document.querySelector('.products-toggle')?.checkVisibility() ?? false,
      }));
    };
    // A mesma medida na página em português: um estouro que o português também tem não é do
    // espanhol (a tabela de /planos entre 768 e 1023px, só visível com preços públicos).
    const ptDimensions = new Map();
    for (const route of ptRoutes) {
      const dimensions = await measure(route);
      ptDimensions.set(route, dimensions);
      assert.deepEqual(dimensions.wrapped, [], `${route} ${width}px: cabeçalho em uma linha`);
      assert.equal(dimensions.products, width >= 1024, `${route} ${width}px: Produtos no desktop`);
    }
    for (const route of [...esRoutes, '/pagina-que-nao-existe']) {
      const dimensions = await measure(route);
      const overflows =
        dimensions.scroll > dimensions.width || dimensions.layout > dimensions.width;
      const ptRoute = ptRoutes[esRoutes.indexOf(route)];
      const pt = overflows && ptRoute ? ptDimensions.get(ptRoute) : null;
      if (pt && pt.scroll > pt.width)
        knownIssues.push(
          `${route} ${width}px: estouro de ${dimensions.scroll - dimensions.width}px, também em ${ptRoute} (${pt.scroll - pt.width}px)`,
        );
      else assert.ok(!overflows, `${route} ${width}px: sem overflow ${JSON.stringify(dimensions)}`);
      assert.deepEqual(dimensions.wrapped, [], `${route} ${width}px: cabeçalho em uma linha`);
      // A 404 não tem cabeçalho.
      if (ptRoute)
        assert.equal(
          dimensions.products,
          width >= 1024,
          `${route} ${width}px: Produtos no desktop`,
        );
    }
    if (width === 360) {
      await sized.goto(base + '/es');
      await sized.locator('.menu-toggle').click();
      assert.equal((await sized.locator('[data-menu-label]').textContent()).trim(), 'Cerrar');
      assert.equal(await sized.locator('.mobile-language').isVisible(), true);
      await sized.screenshot({ path: '.artifacts/es-menu-mobile.png' });
    }
    await context.close();
  }
  if (knownIssues.length)
    results.push(`Avisos (problemas que o português também tem): ${knownIssues.join('; ')}`);
  results.push(
    'Espanhol: lang es-ES, sem texto em português, app e tour com idioma=es, cotação, seletor PT | ES, 404 nos dois idiomas, contraste e 320–1440px sem estouro OK',
  );
  results.push(
    `Cabeçalho em uma linha, com Produtos só a partir de 1024px: ${routes.length} rotas (pt e es) de 320 a 1440px OK`,
  );
  results.push(`Menor contraste do texto do cabeçalho, medido na imagem: ${readings.join('; ')}`);
  assert.deepEqual(errors, []);
  console.log(results.join('\n'));
  await writeFile('.artifacts/browser-results.json', JSON.stringify({ results, errors }, null, 2));
} finally {
  await browser.close();
}
