import { chromium, devices } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { portugueseWordsIn } from './portuguese-words.mjs';
import { browserLocale, chooseLanguage, languageChoiceKey } from './language-choice.mjs';

await mkdir('.artifacts', { recursive: true });
const base = process.env.SITE_URL || 'http://127.0.0.1:4321';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const errors = [];
const results = [];
// Sem preços públicos (site.pricing.showPrices), /planos só redireciona para a cotação.
const pricesShown = !(await (await fetch(`${base}/planos`)).text()).includes(
  'http-equiv="refresh"',
);
// As mesmas páginas em cada idioma, na mesma ordem (cada uma é medida contra a do português).
const routesOf = {
  pt: ['/', ...(pricesShown ? ['/planos'] : []), '/tutoriais', '/termos-de-uso', '/politica-de-privacidade'],
  es: [
    '/es',
    ...(pricesShown ? ['/es/planes'] : []),
    '/es/tutoriales',
    '/es/terminos-de-uso',
    '/es/politica-de-privacidad',
  ],
  en: ['/en', ...(pricesShown ? ['/en/plans'] : []), '/en/tutorials', '/en/terms-of-use', '/en/privacy-policy'],
};
const ptRoutes = routesOf.pt;
const routes = Object.values(routesOf).flat();
const langOf = { pt: 'pt-BR', es: 'es-ES', en: 'en' };
// Contexto das checagens que não são da faixa de sugestão: a escolha de idioma já gravada.
const newContext = async (options, locale = 'pt') => {
  const context = await browser.newContext({ locale: browserLocale[locale], ...options });
  await chooseLanguage(context, locale);
  return context;
};
const contrastOf = (page) =>
  page.evaluate(async () =>
    (await window.axe.run(document, { runOnly: ['color-contrast'] })).violations.flatMap(
      (violation) => violation.nodes.map((node) => node.target.join(' ')),
    ),
  );
// Nenhum rótulo do cabeçalho quebra em duas linhas.
const wrappedHeader = (page) =>
  page.evaluate(() =>
    [...document.querySelectorAll('.header-inner a, .header-inner button, .header-inner summary')]
      .filter((element) => element.checkVisibility())
      .filter((element) => element.getBoundingClientRect().height > 50)
      .map((element) => element.textContent.trim()),
  );
try {
  const desktop = await newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
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
  // Tutoriais, em cada idioma: o cartão leva ao YouTube; com JavaScript, abre o player no
  // diálogo. Cabeçalho, menu do celular e rodapé levam à página do idioma (o seletor de idioma,
  // com hreflang, é o único caminho para as dos outros). Os vídeos são narrados em português:
  // espanhol e inglês avisam logo na abertura, como o app.
  for (const [route, closeLabel, screenshot, lead] of [
    ['/tutoriais', 'Fechar o vídeo', 'tutoriais', /^Vídeos curtos que mostram/],
    ['/es/tutoriales', 'Cerrar el vídeo', 'tutoriales', /^Vídeos cortos, en portugués, /],
    ['/en/tutorials', 'Close the video', 'tutorials-en', /^Short videos, in Portuguese, /],
  ]) {
    await page.goto(base + route);
    assert.match(await page.locator('.tutorials-page .section-heading p').innerText(), lead);
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
  results.push(
    'Tutoriais nos três idiomas: player no diálogo só após o clique; Escape fecha, tira o iframe e devolve o foco; menus e rodapé no idioma; aviso de que os vídeos são em português no espanhol e no inglês OK',
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
    ['como-funciona', 'Como funciona'],
    ['presencial', 'Presencial'],
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

  // Cabeçalho do desktop em português (com o Presencial e, de 1280px para cima, o seletor
  // PT | ES) em uma linha de 1024 a 1440px, também com "Tour real", que só entra com tour de
  // demonstração (aqui simulado, com o data-long-nav que o Header.astro põe).
  for (const tour of [false, true]) {
    await page.goto(base + '/termos-de-uso');
    // Medido com a fonte de reserva, o cabeçalho tem outra largura e a guarda falha por acaso.
    await page.evaluate(() => document.fonts.ready);
    if (tour)
      await page.evaluate(() => {
        const header = document.querySelector('.site-header');
        const link = Object.assign(document.createElement('a'), {
          href: '/#tour-real',
          textContent: 'Tour real',
        });
        link.dataset.spy = 'tour-real';
        header.setAttribute('data-long-nav', '');
        header.querySelector('.desktop-nav a').after(link);
      });
    for (const width of [1024, 1100, 1200, 1280, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.waitForFunction((size) => innerWidth === size, width);
      // O innerWidth muda antes de todas as media queries valerem; dois quadros depois, valem.
      await page.evaluate(
        () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))),
      );
      const wrapped = await page.evaluate(() => {
        const found = [];
        const walker = document.createTreeWalker(
          document.querySelector('.header-inner'),
          NodeFilter.SHOW_TEXT,
        );
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          const element = node.parentElement;
          if (!node.textContent.trim() || !element.checkVisibility() || element.closest('.sr-only'))
            continue;
          const range = document.createRange();
          range.selectNodeContents(node);
          if (range.getClientRects().length > 1) found.push(node.textContent.trim());
        }
        return found;
      });
      assert.deepEqual(wrapped, [], `${width}px${tour ? ' com Tour real' : ''}: cabeçalho quebrou`);
    }
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  results.push('Cabeçalho do desktop em uma linha de 1024 a 1440px, também com "Tour real" OK');

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
    const context = await newContext({
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
      assert.deepEqual(await contrastOf(themed), [], `${colorScheme} ${route}: contraste insuficiente`);
    }
    const visibleLogo = await themed
      .locator('.site-header .brand img')
      .evaluateAll((images) => images.find((image) => image.checkVisibility())?.src);
    assert.match(visibleLogo, colorScheme === 'dark' ? /white/ : /blue/);
    await themed.screenshot({ path: `.artifacts/home-${colorScheme}.png` });
    await context.close();
  }
  const toggleContext = await newContext({
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

  const mobile = await newContext({
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
  if (!pricesShown) {
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
      `360px: ${routes.length} rotas (pt, es e en) sem overflow, texto < 12px ou alvo pequeno; menu, cotação e FAQ OK`,
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
      `360px: ${routes.length} rotas (pt, es e en) sem overflow, texto < 12px ou alvo pequeno; menu, carrossel, FAQ e recursos por plano OK`,
    );
  }

  // Espanhol (/es) e inglês (/en): idioma, texto sem português, links do app e tour no
  // idioma, cotação com a mensagem no idioma e menu do desktop com as âncoras do idioma.
  const translated = [
    {
      code: 'es',
      quote: 'cotizacion',
      faq: 'preguntas',
      payment: '¿Cómo funciona el pago?',
      cost: /¿Cuánto cuesta\?/,
      greeting: '¡Hola! Vengo de la web y quiero un presupuesto de ARP Vision.',
      answers: ['Tengo un equipo', '6 a 15', 'Este mes'],
      filled: [
        '• Cómo trabajo: Tengo un equipo',
        '• Espacios al mes: 6 a 15',
        '• Para cuándo: Este mes',
        '¿Me puedes enviar una propuesta?',
      ],
      nextAnswer: /• Para cuándo: Aún me estoy informando/,
      spy: [
        ['como-funciona', 'Cómo funciona'],
        pricesShown ? ['planes', 'Planes'] : ['cotizacion', 'Presupuesto'],
        ['preguntas', 'Preguntas'],
      ],
    },
    {
      code: 'en',
      quote: 'quote',
      faq: 'faq',
      payment: 'How does payment work?',
      cost: /How much does it cost\?/,
      greeting: "Hi! I came from the website and I'd like a quote from ARP Vision.",
      answers: ['I have a team', '6 to 15', 'This month'],
      filled: [
        '• How I work: I have a team',
        '• Spaces per month: 6 to 15',
        '• When I need it: This month',
        'Could you send me a proposal?',
      ],
      nextAnswer: /• When I need it: Still researching/,
      spy: [
        ['how-it-works', 'How it works'],
        pricesShown ? ['plans', 'Plans'] : ['quote', 'Get a quote'],
        ['faq', 'FAQ'],
      ],
    },
  ];
  const knownIssues = [];
  for (const language of translated) {
    const { code } = language;
    const home = routesOf[code][0];
    const context = await newContext(
      { viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' },
      code,
    );
    const localized = await context.newPage();
    localized.on('pageerror', (error) => errors.push(error.message));
    // Texto visível, sem o que está marcado em português de propósito ("Português" no seletor)
    // e sem e-mails e domínios.
    const portugueseLines = () =>
      localized.evaluate((source) => {
        const words = new RegExp(source, 'iu');
        const hidden = [...document.querySelectorAll('[lang="pt-BR"]')];
        hidden.forEach((node) => (node.style.display = 'none'));
        const text = document.body.innerText;
        hidden.forEach((node) => (node.style.display = ''));
        return text
          .replace(/[\w.+-]+@[\w.-]+|[\w-]+(?:\.[\w-]+)+/g, '')
          .split('\n')
          .filter((line) => words.test(line));
      }, portugueseWordsIn(code).source);
    for (const route of routesOf[code]) {
      await localized.goto(base + route);
      assert.equal(
        await localized.locator('html').getAttribute('lang'),
        langOf[code],
        `${route}: lang`,
      );
      assert.deepEqual(await portugueseLines(), [], `${route}: português na página`);
      for (const href of await localized
        .locator('a[href^="https://arpvision.app/"]')
        .evaluateAll((links) => links.map((link) => link.href)))
        assert.equal(new URL(href).searchParams.get('idioma'), code, `${route}: ${href}`);
    }
    await localized.goto(base + home);
    assert.equal(
      await localized.locator('.hero-embed').getAttribute('src'),
      `https://arpvision.app/embed/511a5654-29f2-4798-87ff-5b479210dbf0?idioma=${code}`,
    );
    assert.equal(
      await localized.locator('#compartilhamento .chat-preview').count(),
      1,
      `${home}: conversa do WhatsApp em HTML, sem a imagem em português`,
    );
    assert.equal(await localized.locator('img[src*="conversa-whatsapp"]').count(), 0);
    const schema = JSON.parse(
      await localized.locator('script[type="application/ld+json"]').textContent(),
    );
    assert.equal(
      schema.find((item) => item['@type'] === 'SoftwareApplication').inLanguage,
      langOf[code],
    );
    assert.ok(
      schema
        .find((item) => item['@type'] === 'FAQPage')
        .mainEntity.some((item) => item.name === language.payment),
      `${home}: FAQPage no idioma`,
    );
    if (!pricesShown) {
      const quote = localized.locator(`#${language.quote}`);
      const submit = quote.locator('.quote-submit');
      const message = async () =>
        new URL(await submit.getAttribute('href')).searchParams.get('text');
      assert.equal(await message(), language.greeting);
      for (const answer of language.answers)
        await quote.locator(`input[value="${answer}"]`).check();
      const filled = [language.greeting, ...language.filled].join('\n');
      assert.equal(await message(), filled, `${home}: respostas no idioma na mensagem`);
      assert.equal(await quote.locator('[data-quote-preview]').textContent(), filled);
      await quote.locator(`input[value="${language.answers[2]}"]`).press('ArrowRight');
      assert.match(await message(), language.nextAnswer);
      assert.match(await localized.locator(`#${language.faq}`).innerText(), language.cost);
      await quote.screenshot({ path: `.artifacts/cotacao-${code}-desktop.png` });
      await localized.goto(base + routesOf[code][0] + (code === 'es' ? '/planes' : '/plans'));
      await localized.waitForURL(new RegExp(`/${code}#${language.quote}$`));
    }
    // Menu do desktop com as âncoras do idioma.
    await localized.goto(base + home);
    for (const [id, label] of language.spy) {
      await localized.evaluate((section) => {
        const top = document.getElementById(section).getBoundingClientRect().top + scrollY;
        scrollTo({ top: top - 120, behavior: 'instant' });
      }, id);
      await localized.waitForFunction(
        (text) =>
          document.querySelector('.desktop-nav [aria-current="location"]')?.textContent.trim() ===
          text,
        label,
      );
    }
    await localized.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
    await localized.screenshot({ path: `.artifacts/${code}-desktop.png` });
    await context.close();
  }
  results.push(
    'Espanhol e inglês: lang es-ES e en, sem texto em português, app e tour com idioma=es e idioma=en, conversa em HTML, FAQPage e cotação com a mensagem no idioma, /es/planes e /en/plans levam à cotação, menu do desktop com as âncoras do idioma OK',
  );

  // Seletor de idioma: leva à mesma página nos outros idiomas e nada troca sozinho. No rodapé e
  // no menu do celular, PT | ES | EN; no cabeçalho do desktop (a partir de 1280px, fora do
  // espanhol), o compacto: o globo e o código do idioma atual abrem a lista.
  const selector = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: 'reduce',
    locale: 'pt-BR',
  });
  const choose = await selector.newPage();
  choose.on('pageerror', (error) => errors.push(error.message));
  const storedChoice = () => choose.evaluate((key) => localStorage.getItem(key), languageChoiceKey);
  await choose.goto(base + '/termos-de-uso');
  assert.equal(await choose.locator('html').getAttribute('lang'), 'pt-BR');
  assert.equal(await storedChoice(), null);
  await choose.locator('footer .language-switch a[lang="es-ES"]').click();
  await choose.waitForURL(/\/es\/terminos-de-uso$/);
  assert.equal(await storedChoice(), 'es', 'o seletor grava a escolha');
  assert.equal(
    await choose.locator('footer .language-switch [aria-current="true"]').getAttribute('lang'),
    'es-ES',
  );
  // No espanhol o seletor do desktop fica só no rodapé: o cabeçalho não comporta os rótulos
  // longos e ele.
  assert.equal(await choose.locator('.desktop-language').isVisible(), false);
  await choose.locator('footer .language-switch a[lang="pt-BR"]').click();
  await choose.waitForURL(/\/termos-de-uso$/);
  assert.equal(await storedChoice(), 'pt');
  const menu = choose.locator('.site-header .language-menu');
  const summary = menu.locator('summary');
  const list = menu.locator('.language-menu-list');
  // O que aparece no botão é só o código; o resto é texto para o leitor de tela.
  const visibleCode = () =>
    choose
      .locator('.site-header .language-menu summary')
      .evaluate((element) =>
        [...element.childNodes]
          .filter((node) => node.nodeType === Node.TEXT_NODE)
          .map((node) => node.textContent)
          .join('')
          .trim(),
      );
  assert.equal(await menu.isVisible(), true);
  assert.equal(await visibleCode(), 'PT');
  // Nome acessível: o código que aparece, o rótulo e o nome do idioma.
  assert.equal(
    (await summary.textContent()).replace(/\s+/g, ' ').trim(),
    'PT, Idioma: Português',
  );
  assert.equal(await list.isVisible(), false);
  // Teclado: Enter abre, Tab percorre as opções, Escape fecha e devolve o foco ao botão.
  await summary.focus();
  await choose.keyboard.press('Enter');
  assert.equal(await list.isVisible(), true);
  assert.deepEqual(
    await list.locator('a').evaluateAll((links) =>
      links.map((link) => [link.textContent.trim(), link.lang, link.getAttribute('href')]),
    ),
    [
      ['Português', 'pt-BR', '/termos-de-uso'],
      ['Español', 'es-ES', '/es/terminos-de-uso'],
      ['English', 'en', '/en/terms-of-use'],
    ],
  );
  assert.equal(await list.locator('[aria-current="true"]').getAttribute('lang'), 'pt-BR');
  await choose.keyboard.press('Tab');
  assert.equal(await choose.evaluate(() => document.activeElement.lang), 'pt-BR');
  await choose.keyboard.press('Escape');
  assert.equal(await list.isVisible(), false);
  assert.equal(await summary.evaluate((element) => element === document.activeElement), true);
  // O foco que sai da lista, ou um clique fora, também fecha.
  await choose.keyboard.press('Enter');
  for (let index = 0; index < 4; index++) await choose.keyboard.press('Tab');
  assert.equal(await list.isVisible(), false, 'o foco saiu da lista');
  await summary.click();
  assert.equal(await list.isVisible(), true);
  await choose.screenshot({ path: '.artifacts/seletor-aberto-desktop.png' });
  await choose.locator('h1').click();
  assert.equal(await list.isVisible(), false, 'clique fora fecha');
  await summary.click();
  await list.locator('a[lang="en"]').click();
  await choose.waitForURL(/\/en\/terms-of-use$/);
  assert.equal(await storedChoice(), 'en');
  assert.equal(await choose.locator('html').getAttribute('lang'), 'en');
  assert.equal(await visibleCode(), 'EN');
  await choose.screenshot({ path: '.artifacts/en-terms-desktop.png' });
  // Abaixo de 1280px o compacto sai do cabeçalho (fica no rodapé); em 1280px ele cabe, também
  // no português com "Presencial" no menu.
  for (const [width, visible] of [
    [1279, false],
    [1280, true],
  ]) {
    await choose.setViewportSize({ width, height: 900 });
    for (const route of ['/termos-de-uso', '/en/terms-of-use', '/es/terminos-de-uso']) {
      await choose.goto(base + route);
      assert.equal(
        await choose.locator('.desktop-language').isVisible(),
        visible && !route.startsWith('/es'),
        `${route} ${width}px: seletor no cabeçalho`,
      );
      assert.deepEqual(await wrappedHeader(choose), [], `${route} ${width}px: cabeçalho em uma linha`);
    }
  }
  const notFound = await choose.goto(base + '/pagina-que-nao-existe');
  assert.equal(notFound.status(), 404);
  assert.match(await choose.locator('h1').innerText(), /Página não encontrada/);
  assert.match(await choose.locator('main [lang="es-ES"]').innerText(), /Página no encontrada/);
  assert.match(await choose.locator('main [lang="en"]').innerText(), /Page not found/);
  await selector.close();
  results.push(
    'Seletor de idioma: PT | ES | EN no rodapé leva à mesma página e grava a escolha; compacto no cabeçalho (globo + código) abre pelo teclado, Escape devolve o foco, foco ou clique fora fecham, cada opção no próprio idioma; fora do cabeçalho abaixo de 1280px e no espanhol; 404 nos três idiomas OK',
  );

  // Contraste nos dois temas, nas páginas dos outros idiomas, na 404 e com a lista do seletor
  // aberta.
  for (const colorScheme of ['light', 'dark']) {
    const context = await newContext({
      viewport: { width: 1440, height: 1000 },
      colorScheme,
      reducedMotion: 'reduce',
    });
    const themed = await context.newPage();
    for (const route of [
      '/es',
      '/es/terminos-de-uso',
      '/en',
      '/en/terms-of-use',
      '/pagina-que-nao-existe',
    ]) {
      await themed.goto(base + route);
      await themed.addScriptTag({ content: axeSource });
      assert.deepEqual(await contrastOf(themed), [], `${colorScheme} ${route}: contraste insuficiente`);
    }
    for (const route of ['/', '/en/terms-of-use']) {
      await themed.goto(base + route);
      await themed.locator('.site-header .language-menu summary').click();
      await themed.addScriptTag({ content: axeSource });
      assert.deepEqual(
        await contrastOf(themed),
        [],
        `${colorScheme} ${route}: contraste com a lista do seletor aberta`,
      );
    }
    await context.close();
  }
  results.push('Contraste AA nos dois temas em /es, /en, 404 e com a lista do seletor aberta OK');

  for (const width of [320, 360, 390, 768, 1024, 1100, 1280, 1440]) {
    const context = await newContext({
      viewport: { width, height: 900 },
      reducedMotion: 'reduce',
      isMobile: width < 768,
      hasTouch: width < 768,
    });
    const sized = await context.newPage();
    sized.on('pageerror', (error) => errors.push(error.message));
    // A mesma medida na página em português: um estouro que o português também tem não é do
    // outro idioma (a tabela de /planos entre 768 e 1023px, só visível com preços públicos).
    const measure = async (route) => {
      await sized.goto(base + route);
      await sized.evaluate(() => document.fonts.ready);
      return {
        ...(await sized.evaluate(() => ({
          width: document.documentElement.clientWidth,
          layout: innerWidth,
          scroll: document.documentElement.scrollWidth,
        }))),
        wrapped: await wrappedHeader(sized),
      };
    };
    for (const route of [...routes, '/pagina-que-nao-existe']) {
      const dimensions = await measure(route);
      const overflows =
        dimensions.scroll > dimensions.width || dimensions.layout > dimensions.width;
      const index = [routesOf.es, routesOf.en]
        .map((list) => list.indexOf(route))
        .find((position) => position >= 0);
      const ptRoute = index === undefined ? undefined : ptRoutes[index];
      const ptDimensions = overflows && ptRoute ? await measure(ptRoute) : null;
      if (ptDimensions && ptDimensions.scroll > ptDimensions.width)
        knownIssues.push(
          `${route} ${width}px: estouro de ${dimensions.scroll - dimensions.width}px, também em ${ptRoute} (${ptDimensions.scroll - ptDimensions.width}px)`,
        );
      else assert.ok(!overflows, `${route} ${width}px: sem overflow ${JSON.stringify(dimensions)}`);
      assert.deepEqual(dimensions.wrapped, [], `${route} ${width}px: cabeçalho em uma linha`);
    }
    if (width === 360)
      for (const [route, close] of [
        ['/es', 'Cerrar'],
        ['/en', 'Close'],
      ]) {
        await sized.goto(base + route);
        await sized.locator('.menu-toggle').click();
        assert.equal((await sized.locator('[data-menu-label]').textContent()).trim(), close);
        assert.equal(await sized.locator('.mobile-language').isVisible(), true);
        assert.equal(await sized.locator('.mobile-language .language-switch a').count(), 3);
        await sized.screenshot({ path: `.artifacts/${route.slice(1)}-menu-mobile.png` });
      }
    await context.close();
  }
  if (knownIssues.length)
    results.push(`Avisos (problemas que o português também tem): ${knownIssues.join('; ')}`);
  results.push(
    'Três idiomas e 404 de 320 a 1440px (com 1100px): sem estouro e cabeçalho numa linha; menu do celular com PT | ES | EN OK',
  );

  // Faixa de sugestão de idioma: aparece só no navegador, quando ele prefere outro idioma do
  // site e a pessoa ainda não escolheu; leva à mesma página (e à âncora equivalente).
  const suggestionTexts = [
    'Esta página também está em português.',
    'Ver em português',
    'Esta página también está en español.',
    'Ver en español',
    'This page is also available in English.',
    'View in English',
  ];
  for (const route of [...routes, '/pagina-que-nao-existe']) {
    const html = await (await fetch(base + route)).text();
    for (const text of suggestionTexts)
      assert.ok(!html.includes(text), `${route}: texto da faixa no HTML do servidor: ${text}`);
  }
  const suggestionContext = (locale, options = {}) =>
    browser.newContext({
      viewport: { width: 1440, height: 900 },
      reducedMotion: 'reduce',
      locale,
      ...options,
    });
  const banner = (page) => page.locator('.language-suggestion');
  const bannerState = (page) =>
    page.evaluate(() => {
      const element = document.querySelector('.language-suggestion');
      if (!element) return null;
      const link = element.querySelector('a');
      return {
        lang: element.lang,
        label: element.getAttribute('aria-label'),
        text: element.querySelector('p').textContent,
        link: link.textContent,
        href: link.getAttribute('href'),
        hreflang: link.hreflang,
        close: element.querySelector('button').getAttribute('aria-label'),
        focused: element.contains(document.activeElement),
        active: document.activeElement === document.body,
      };
    });
  {
    // Navegador em espanhol, no português: oferece o /es, sem tirar o foco de onde está.
    const context = await suggestionContext('es-ES');
    const suggested = await context.newPage();
    suggested.on('pageerror', (error) => errors.push(error.message));
    await suggested.goto(base + '/');
    await banner(suggested).waitFor();
    assert.deepEqual(await bannerState(suggested), {
      lang: 'es-ES',
      label: 'Idioma',
      text: 'Esta página también está en español.',
      link: 'Ver en español',
      href: '/es',
      hreflang: 'es-ES',
      close: 'Cerrar',
      focused: false,
      active: true,
    });
    await suggested.screenshot({ path: '.artifacts/faixa-es-desktop.png' });
    // Âncora equivalente, também quando a pessoa navega pelas seções.
    await suggested.goto(base + '/#cotacao');
    assert.equal((await bannerState(suggested)).href, '/es#cotizacion');
    await suggested.evaluate(() => (location.hash = 'duvidas'));
    await suggested.waitForFunction(
      () => document.querySelector('.language-suggestion a')?.getAttribute('href') === '/es#preguntas',
    );
    await suggested.goto(base + '/#compartilhamento');
    assert.equal((await bannerState(suggested)).href, '/es', 'âncora fora do mapa fica de fora');
    await suggested.goto(base + '/termos-de-uso');
    assert.equal((await bannerState(suggested)).href, '/es/terminos-de-uso');
    // Na página do próprio idioma e na 404, nada.
    for (const route of ['/es', '/es/tutoriales', '/pagina-que-nao-existe']) {
      await suggested.goto(base + route);
      await suggested.waitForLoadState('load');
      assert.equal(await banner(suggested).count(), 0, `es-ES em ${route}: sem faixa`);
    }
    // Fechar grava o idioma da página e a faixa não volta, em nenhuma página.
    await suggested.goto(base + '/tutoriais');
    await banner(suggested).locator('button').click();
    assert.equal(await banner(suggested).count(), 0);
    assert.equal(
      await suggested.evaluate((key) => localStorage.getItem(key), languageChoiceKey),
      'pt',
      'fechar grava o idioma da página',
    );
    for (const route of ['/tutoriais', '/', '/en']) {
      await suggested.goto(base + route);
      await suggested.waitForLoadState('load');
      assert.equal(await banner(suggested).count(), 0, `depois de fechar, ${route}: sem faixa`);
    }
    await context.close();
  }
  {
    // Navegador em inglês, no espanhol: oferece o /en; o link da faixa leva e grava a escolha.
    const context = await suggestionContext('en-US');
    const suggested = await context.newPage();
    suggested.on('pageerror', (error) => errors.push(error.message));
    await suggested.goto(base + '/es#preguntas');
    await banner(suggested).waitFor();
    assert.deepEqual(await bannerState(suggested), {
      lang: 'en',
      label: 'Language',
      text: 'This page is also available in English.',
      link: 'View in English',
      href: '/en#faq',
      hreflang: 'en',
      close: 'Close',
      focused: false,
      active: true,
    });
    for (const route of ['/en', '/en/terms-of-use']) {
      await suggested.goto(base + route);
      await suggested.waitForLoadState('load');
      assert.equal(await banner(suggested).count(), 0, `en-US em ${route}: sem faixa`);
    }
    await suggested.goto(base + '/es/terminos-de-uso');
    await banner(suggested).locator('a').click();
    await suggested.waitForURL(/\/en\/terms-of-use$/);
    assert.equal(
      await suggested.evaluate((key) => localStorage.getItem(key), languageChoiceKey),
      'en',
      'o link da faixa grava a escolha',
    );
    for (const route of ['/es', '/']) {
      await suggested.goto(base + route);
      await suggested.waitForLoadState('load');
      assert.equal(await banner(suggested).count(), 0, `depois do link, ${route}: sem faixa`);
    }
    await context.close();
  }
  {
    // Quem usa o seletor também já escolheu: a faixa sai e não volta.
    const context = await suggestionContext('en-GB');
    const suggested = await context.newPage();
    await suggested.goto(base + '/termos-de-uso');
    await banner(suggested).waitFor();
    await suggested.locator('footer .language-switch a[lang="es-ES"]').click();
    await suggested.waitForURL(/\/es\/terminos-de-uso$/);
    await suggested.waitForLoadState('load');
    assert.equal(await banner(suggested).count(), 0, 'depois do seletor: sem faixa');
    await suggested.goto(base + '/');
    await suggested.waitForLoadState('load');
    assert.equal(await banner(suggested).count(), 0);
    await context.close();
  }
  for (const [locale, route, offered] of [
    ['pt-BR', '/', null],
    ['pt-PT', '/en/tutorials', '/tutoriais'],
    ['es-AR', '/en/privacy-policy', '/es/politica-de-privacidad'],
    ['de-DE', '/', '/en'],
    ['de-DE', '/en', null],
  ]) {
    const context = await suggestionContext(locale);
    const suggested = await context.newPage();
    await suggested.goto(base + route);
    await suggested.waitForLoadState('load');
    assert.equal((await bannerState(suggested))?.href ?? null, offered, `${locale} em ${route}`);
    await context.close();
  }
  {
    // Robô de busca: lê a página sem a faixa, como o HTML do servidor.
    const context = await suggestionContext('es-ES', {
      userAgent: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    });
    const bot = await context.newPage();
    await bot.goto(base + '/');
    await bot.waitForLoadState('load');
    assert.equal(await banner(bot).count(), 0, 'Googlebot: sem faixa');
    await context.close();
  }
  {
    // Sem localStorage (Safari em janela privada, por exemplo): a faixa abre e fecha sem erro.
    const context = await suggestionContext('es-ES');
    await context.addInitScript(() => {
      const fail = () => {
        throw new DOMException('Bloqueado', 'SecurityError');
      };
      Storage.prototype.getItem = fail;
      Storage.prototype.setItem = fail;
    });
    const blocked = await context.newPage();
    const pageErrors = [];
    blocked.on('pageerror', (error) => pageErrors.push(error.message));
    // Uma página sem o tour embutido: o bloqueio também valeria dentro do iframe do app.
    await blocked.goto(base + '/termos-de-uso');
    await banner(blocked).waitFor();
    await banner(blocked).locator('button').click();
    assert.equal(await banner(blocked).count(), 0);
    assert.deepEqual(pageErrors, [], 'sem localStorage: nenhum erro');
    await context.close();
  }
  {
    // Movimento reduzido: a faixa aparece sem animação.
    for (const [reducedMotion, animation] of [
      ['reduce', 'none'],
      ['no-preference', 'language-suggestion-in'],
    ]) {
      const context = await suggestionContext('es-ES', { reducedMotion });
      const animated = await context.newPage();
      await animated.goto(base + '/termos-de-uso');
      await banner(animated).waitFor();
      assert.equal(
        await banner(animated).evaluate((element) => getComputedStyle(element).animationName),
        animation,
        `faixa com ${reducedMotion}`,
      );
      await context.close();
    }
  }
  // Com a faixa na tela: nada estoura de 320 a 1440px, o cabeçalho fica numa linha, e a faixa
  // não cobre o cabeçalho (nem o botão de criar conta) nem o WhatsApp flutuante.
  const overlaps = (a, b) =>
    a && b && a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
  for (const width of [320, 360, 390, 768, 1024, 1100, 1280, 1440]) {
    for (const [locale, pageRoutes] of [
      ['es-ES', ['/', '/termos-de-uso']],
      ['en-US', ['/es', '/es/tutoriales']],
      ['pt-BR', ['/en', '/en/privacy-policy']],
    ]) {
      const context = await suggestionContext(locale, {
        viewport: { width, height: 800 },
        isMobile: width < 768,
        hasTouch: width < 768,
      });
      const sized = await context.newPage();
      sized.on('pageerror', (error) => errors.push(error.message));
      for (const route of pageRoutes) {
        await sized.goto(base + route);
        await banner(sized).waitFor();
        await sized.evaluate(() => document.fonts.ready);
        const layout = await sized.evaluate(() => {
          const rect = (selector) => {
            const element = document.querySelector(selector);
            return element?.checkVisibility({ visibilityProperty: true })
              ? element.getBoundingClientRect().toJSON()
              : null;
          };
          return {
            width: document.documentElement.clientWidth,
            layout: innerWidth,
            scroll: document.documentElement.scrollWidth,
            banner: rect('.language-suggestion'),
            header: rect('.site-header'),
            whatsapp: document.querySelector('.floating-whatsapp:not(.is-hidden)')
              ? rect('.floating-whatsapp')
              : null,
          };
        });
        const where = `${locale} ${route} ${width}px`;
        assert.ok(
          layout.scroll <= layout.width && layout.layout <= layout.width,
          `${where}: sem estouro com a faixa ${JSON.stringify(layout)}`,
        );
        assert.ok(
          layout.banner.left >= 0 &&
            layout.banner.right <= layout.width &&
            layout.banner.bottom <= 800,
          `${where}: faixa inteira na tela`,
        );
        assert.deepEqual(await wrappedHeader(sized), [], `${where}: cabeçalho em uma linha`);
        assert.ok(!overlaps(layout.banner, layout.header), `${where}: faixa sobre o cabeçalho`);
        assert.ok(
          !overlaps(layout.banner, layout.whatsapp),
          `${where}: faixa sobre o WhatsApp flutuante`,
        );
        if (width === 360 || width === 1440)
          await sized.screenshot({
            path: `.artifacts/faixa-${locale}-${width}${route.replaceAll('/', '-')}.png`,
          });
      }
      await context.close();
    }
  }
  // Contraste da faixa nos dois temas, no claro e no escuro de cada idioma oferecido.
  for (const colorScheme of ['light', 'dark'])
    for (const [locale, route] of [
      ['es-ES', '/'],
      ['en-US', '/es/terminos-de-uso'],
      ['pt-BR', '/en'],
    ]) {
      const context = await suggestionContext(locale, { colorScheme });
      const themed = await context.newPage();
      await themed.goto(base + route);
      await banner(themed).waitFor();
      await themed.addScriptTag({ content: axeSource });
      assert.deepEqual(
        await themed.evaluate(async () =>
          (
            await window.axe.run(document.querySelector('.language-suggestion'), {
              runOnly: ['color-contrast'],
            })
          ).violations.flatMap((violation) => violation.nodes.map((node) => node.target.join(' '))),
        ),
        [],
        `${colorScheme} ${locale} ${route}: contraste da faixa`,
      );
      assert.deepEqual(await contrastOf(themed), [], `${colorScheme} ${route}: contraste`);
      await context.close();
    }
  results.push(
    'Faixa de sugestão de idioma: fora do HTML do servidor; navegador es-ES no / oferece o /es, en no /es oferece o /en, de-DE oferece o inglês, nada quando o idioma bate, na 404 e para robôs; âncora equivalente; fechar e o seletor gravam a escolha e ela não volta; sem localStorage não quebra; sem animação com movimento reduzido; de 320 a 1440px sem estouro, cabeçalho numa linha, sem cobrir cabeçalho nem WhatsApp; contraste nos dois temas OK',
  );
  assert.deepEqual(errors, []);
  console.log(results.join('\n'));
  await writeFile('.artifacts/browser-results.json', JSON.stringify({ results, errors }, null, 2));
} finally {
  await browser.close();
}
