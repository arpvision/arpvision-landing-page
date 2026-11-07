import { chromium, devices } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { portugueseWords } from './portuguese-words.mjs';

await mkdir('.artifacts', { recursive: true });
const base = process.env.SITE_URL || 'http://127.0.0.1:4321';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const errors = [];
const results = [];
// Sem preços públicos (site.pricing.showPrices), /planos só redireciona para a cotação.
const pricesShown = !(await (await fetch(`${base}/planos`)).text()).includes(
  'http-equiv="refresh"',
);
const ptRoutes = [
  '/',
  ...(pricesShown ? ['/planos'] : []),
  '/termos-de-uso',
  '/politica-de-privacidade',
];
// As mesmas páginas em espanhol, em /es.
const esRoutes = [
  '/es',
  ...(pricesShown ? ['/es/planes'] : []),
  '/es/terminos-de-uso',
  '/es/politica-de-privacidad',
];
const routes = [...ptRoutes, ...esRoutes];
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
    ['como-funciona', 'Cómo funciona'],
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
  for (const width of [320, 360, 390, 768, 1024, 1280, 1440]) {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      reducedMotion: 'reduce',
      isMobile: width < 768,
      hasTouch: width < 768,
    });
    const sized = await context.newPage();
    sized.on('pageerror', (error) => errors.push(error.message));
    // A mesma medida na página em português: um estouro que o português também tem não é do
    // espanhol (a tabela de /planos entre 768 e 1023px, só visível com preços públicos).
    const measure = async (route) => {
      await sized.goto(base + route);
      await sized.evaluate(() => document.fonts.ready);
      return sized.evaluate(() => ({
        width: document.documentElement.clientWidth,
        layout: innerWidth,
        scroll: document.documentElement.scrollWidth,
        // Nenhum rótulo do cabeçalho quebra em duas linhas.
        wrapped: [...document.querySelectorAll('.header-inner a, .header-inner button')]
          .filter((element) => element.checkVisibility())
          .filter((element) => element.getBoundingClientRect().height > 50)
          .map((element) => element.textContent.trim()),
      }));
    };
    for (const route of [...esRoutes, '/pagina-que-nao-existe']) {
      const dimensions = await measure(route);
      const overflows =
        dimensions.scroll > dimensions.width || dimensions.layout > dimensions.width;
      const ptRoute = ptRoutes[esRoutes.indexOf(route)];
      const ptDimensions = overflows && ptRoute ? await measure(ptRoute) : null;
      if (ptDimensions && ptDimensions.scroll > ptDimensions.width)
        knownIssues.push(
          `${route} ${width}px: estouro de ${dimensions.scroll - dimensions.width}px, também em ${ptRoute} (${ptDimensions.scroll - ptDimensions.width}px)`,
        );
      else assert.ok(!overflows, `${route} ${width}px: sem overflow ${JSON.stringify(dimensions)}`);
      assert.deepEqual(dimensions.wrapped, [], `${route} ${width}px: cabeçalho em uma linha`);
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
  assert.deepEqual(errors, []);
  console.log(results.join('\n'));
  await writeFile('.artifacts/browser-results.json', JSON.stringify({ results, errors }, null, 2));
} finally {
  await browser.close();
}
