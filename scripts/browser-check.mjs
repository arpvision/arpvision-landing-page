import { chromium, devices } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { parseColor, textContrast } from './lib/contrast.mjs';
import { portugueseWordsIn } from './portuguese-words.mjs';
import { browserLocale, chooseLanguage, languageChoiceKey } from './language-choice.mjs';
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
// As mesmas páginas em cada idioma, na mesma ordem (cada uma é medida contra a do português).
const routesOf = Object.fromEntries(
  Object.entries(localeRoutes).map(([locale, { pages }]) => [
    locale,
    pageIds.map((page) => pages[page]),
  ]),
);
const ptRoutes = routesOf.pt;
const routes = Object.values(routesOf).flat();
const langOf = { pt: 'pt-BR', es: 'es-ES', en: 'en' };
/** O idioma de uma rota publicada. */
const localeOf = (route) =>
  Object.keys(routesOf).find((locale) => routesOf[locale].includes(route));
// O menu Produtos mostra só o que está no ar: o tour (na home), uma página por produto publicado
// e o "Ver todos" quando /produtos estiver publicada. O ARP Vision Presencial só existe em
// português: lá, o grupo "Com a nossa equipe" leva o treinamento e o Tour Pronto à seção dele na
// home ("#presencial" na própria home, "/#presencial" das outras páginas).
const productPages = publishedPageIds.filter((page) =>
  localeRoutes.pt.pages[page].startsWith(`${localeRoutes.pt.pages.products}/`),
);
const inPersonLocales = ['pt'];
const inPersonHref = (locale, route) => {
  const { pages, anchors } = localeRoutes[locale];
  return `${route === pages.home ? '' : pages.home}#${anchors.inPerson}`;
};
const productLinks = (locale, route) =>
  [
    localeRoutes[locale].pages.home,
    ...productPages.map((page) => localeRoutes[locale].pages[page]),
    ...(inPersonLocales.includes(locale) ? Array(2).fill(inPersonHref(locale, route)) : []),
  ].sort();
const allProductsLinks = publishedPageIds.includes('products') ? 1 : 0;
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
// As telas de exemplo das páginas de produto (calendário, perfil, artes): cada uma mostra a
// etiqueta "Exemplo" inteira dentro dela, fica fora do leitor de tela (aria-hidden e inert) e vem
// logo depois da descrição só para ele, que começa por "Exemplo:".
const exampleScreens = (target) =>
  target.locator('.example-screen').evaluateAll((screens) =>
    screens.map((screen) => {
      const tag = screen.querySelector('.example-tag');
      const box = screen.getBoundingClientRect();
      const tagBox = tag?.getBoundingClientRect();
      const description = screen.previousElementSibling;
      return {
        screen: screen.className,
        hidden: screen.getAttribute('aria-hidden'),
        inert: screen.inert,
        tag: tag?.textContent.trim() ?? null,
        tagShown:
          !!tag &&
          tag.checkVisibility({ opacityProperty: true, visibilityProperty: true }) &&
          tagBox.width > 0 &&
          tagBox.left >= box.left &&
          tagBox.right <= box.right &&
          tagBox.top >= box.top &&
          tagBox.bottom <= box.bottom,
        description: description?.matches('.sr-only') ? description.textContent.trim() : null,
      };
    }),
  );
// As telas dos passos são pequenas: nada pode sair da caixa delas, e o endereço do campo do site
// aparece inteiro (ele não quebra linha; sem espaço, seria cortado).
const measureStepScreens = (target) =>
  target.locator('.product-steps .example-screen').evaluateAll((screens) =>
    screens.flatMap((screen) => {
      const box = screen.getBoundingClientRect();
      const name = screen.classList[screen.classList.length - 1];
      const out = [...screen.querySelectorAll('*')]
        .filter((element) => {
          const rect = element.getBoundingClientRect();
          return (
            rect.width > 0 &&
            (rect.left < box.left - 0.5 ||
              rect.right > box.right + 0.5 ||
              rect.top < box.top - 0.5 ||
              rect.bottom > box.bottom + 0.5)
          );
        })
        .map((element) => `${name}: ${element.className || element.tagName} sai da tela`);
      const url = screen.querySelector('.site-url');
      if (url && url.scrollWidth > url.clientWidth) out.push(`${name}: endereço cortado`);
      return out;
    }),
  );
// Logo depois de mudar a largura da janela a página ainda assenta: o cartão do imóvel do Autochat
// já passou 1px da borda na primeira medida, e 500ms depois estava no lugar. A medida se repete por
// até 2s, e só reprova o que continua fora da caixa.
const stepScreensOverflow = async (target) => {
  let outside = await measureStepScreens(target);
  for (let waited = 0; outside.length && waited < 2000; waited += 100) {
    await target.waitForTimeout(100);
    outside = await measureStepScreens(target);
  }
  return outside;
};
// Os trechos da frase da dor ficam empilhados, e o título reserva a altura do maior: cada um cabe
// numa linha, e assim não sobra linha vazia embaixo dos outros. As linhas de um trecho são os topos
// diferentes dos retângulos do texto dele.
const painPhraseLines = (target) =>
  target.locator('[data-rotating-phrase]').evaluate((phrase) => {
    const lines = (element) => {
      const range = document.createRange();
      range.selectNodeContents(element);
      return new Set([...range.getClientRects()].map((rect) => Math.round(rect.top))).size;
    };
    return {
      longer: [...phrase.children]
        .filter((part) => lines(part) !== 1)
        .map((part) => part.textContent),
      reserved: Math.round(
        phrase.getBoundingClientRect().height / parseFloat(getComputedStyle(phrase).lineHeight),
      ),
    };
  });
// O número de WhatsApp escrito no story: do primeiro ao último algarismo, numa linha só e dentro da
// arte (que corta o que passa dela).
const storyNumber = (target) =>
  target.locator('.post-art-story .post-art-whatsapp').evaluate((line) => {
    const art = line.closest('.post-art').getBoundingClientRect();
    const nodes = [];
    const walker = document.createTreeWalker(line, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode())
      if (/\d/.test(node.textContent)) nodes.push(node);
    const [first, last] = [nodes[0], nodes[nodes.length - 1]];
    const range = document.createRange();
    range.setStart(first, first.textContent.search(/[(+\d]/));
    range.setEnd(last, last.textContent.search(/\d\D*$/) + 1);
    const rects = [...range.getClientRects()].filter((rect) => rect.width > 0);
    return {
      number: range.toString(),
      lines: new Set(rects.map((rect) => Math.round(rect.top))).size,
      inside: rects.every((rect) => rect.left >= art.left - 0.5 && rect.right <= art.right + 0.5),
    };
  });
const checkExampleScreens = (screens, example, scene) => {
  assert.ok(screens.length > 0, `${scene}: telas de exemplo`);
  for (const screen of screens) {
    assert.equal(screen.hidden, 'true', `${scene}: ${screen.screen} fora do leitor de tela`);
    assert.equal(screen.inert, true, `${scene}: ${screen.screen} inerte`);
    assert.equal(screen.tag, example, `${scene}: etiqueta de ${screen.screen}`);
    assert.ok(screen.tagShown, `${scene}: etiqueta visível em ${screen.screen}`);
    assert.ok(
      screen.description?.startsWith(`${example}: `),
      `${scene}: descrição de ${screen.screen}: ${screen.description}`,
    );
  }
};
// O que toda página de produto novo confere, em cada idioma: nada do tour na cotação nem na faixa
// azul, as dúvidas sem título de grupo, o produto e a mensagem dele nos 5 botões de WhatsApp, a
// mensagem e os eventos da cotação, o menu marcando o produto, e Cotação e Dúvidas na própria página.
const checkProductPage = async (target, locale, product, expected) => {
  const { anchors } = localeRoutes[locale];
  const route = new URL(target.url()).pathname;
  assert.equal(
    await target
      .locator(
        '.quote-trial, .quote-benefits, [data-cta="chamada-final"], .final-cta-actions > span',
      )
      .count(),
    0,
    `${route}: nada do tour na cotação nem na faixa azul`,
  );
  // As dúvidas do produto são um grupo só: vão sem título de grupo, nem vazio nem inventado.
  assert.equal(
    await target.locator('.faq-section h3').count(),
    0,
    `${route}: dúvidas sem título de grupo`,
  );
  // O topo, a cotação e a faixa pedem a cotação do produto; o rodapé e o botão flutuante falam
  // dele. Todos levam o produto ao evento de analytics.
  const whatsapp = await target
    .locator('[data-whatsapp]')
    .evaluateAll((links) =>
      links.map((link) => [
        ['product-hero', 'quote-section', 'final-cta', 'site-footer', 'floating-whatsapp'].find(
          (place) => link.closest(`.${place}`),
        ),
        link.dataset.product,
        new URL(link.href).searchParams.get('text'),
      ]),
    );
  assert.deepEqual(
    whatsapp,
    [
      ['product-hero', product, expected.message[0]],
      ['quote-section', product, expected.message[0]],
      ['final-cta', product, expected.message[0]],
      ['site-footer', product, expected.contact],
      ['floating-whatsapp', product, expected.contact],
    ],
    `${route}: botões de WhatsApp com o produto e a mensagem dele`,
  );
  // A cotação monta a mensagem do produto com as três respostas.
  const quote = target.locator(`#${anchors.quote}`);
  const submit = quote.locator('.quote-submit');
  assert.equal(await quote.locator('.quote-card').getAttribute('data-product'), product);
  for (const choice of expected.choices) await quote.locator(`input[value="${choice}"]`).check();
  const filled = expected.message.join('\n');
  assert.equal(
    new URL(await submit.getAttribute('href')).searchParams.get('text'),
    filled,
    `${route}: a mensagem da cotação`,
  );
  assert.equal(await quote.locator('[data-quote-preview]').textContent(), filled);
  // Os eventos levam as respostas e o produto (o clique não segue o link).
  const events = await submit.evaluate((link) => {
    const list = [];
    window.plausible = (name, options) => list.push([name, options?.props]);
    const stay = (event) => event.preventDefault();
    document.addEventListener('click', stay, true);
    link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    document.removeEventListener('click', stay, true);
    return list;
  });
  assert.deepEqual(
    events,
    [
      [
        'cotacao_whatsapp',
        {
          ...Object.fromEntries(
            expected.message.slice(1, -1).map((line) => line.slice(2).split(': ')),
          ),
          produto: product,
        },
      ],
      ['cta_whatsapp', { produto: product }],
    ],
    `${route}: eventos da cotação com o produto`,
  );
  // O menu marca o produto da página; Cotação e Dúvidas ficam na própria página.
  for (const list of ['#products-panel', '#mobile-products-list'])
    assert.equal(
      await target.locator(`${list} a[data-product="${product}"]`).getAttribute('aria-current'),
      'page',
      `${route}: ${list} marca o produto`,
    );
  assert.equal(
    await target.locator('.products-toggle').evaluate((button) => button.matches('.is-current')),
    true,
    `${route}: o botão Produtos com a marca da página`,
  );
  for (const anchor of pricesShown ? ['faq'] : ['quote', 'faq'])
    assert.equal(
      await target.locator(`.desktop-nav a[data-spy="${anchors[anchor]}"]`).getAttribute('href'),
      `#${anchors[anchor]}`,
      `${route}: ${anchor} na própria página`,
    );
};
// Uma espera na página com prazo: sem ele, uma promessa que nunca se resolve travaria a checagem.
const withDeadline = async (promise, label, ms = 15000) => {
  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label}: sem resposta em ${ms} ms`)), ms);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
};
// Espera o primeiro aviso, com o elemento na tela, de um IntersectionObserver novo. Os observadores
// avisam na ordem em que foram criados: quando este avisa, o da página já tratou o elemento.
const untilOnScreen = (locator, label) =>
  withDeadline(
    locator.evaluate(
      (element) =>
        new Promise((resolve) => {
          const observer = new IntersectionObserver((entries) => {
            if (!entries.some((entry) => entry.isIntersecting)) return;
            observer.disconnect();
            resolve();
          });
          observer.observe(element);
        }),
    ),
    label,
  );
// Os vídeos de exemplo de uma página de produto: os arquivos, os atributos, a descrição só para o
// leitor de tela, que vem logo antes, e os rótulos do botão de tocar e pausar de cada um.
const exampleVideos = (target) =>
  target.locator('video[data-autoplay]').evaluateAll((videos) =>
    videos.map((video) => {
      const description = video.previousElementSibling;
      const toggle = document.querySelector(`[data-video-toggle="${video.id}"]`);
      return {
        src: video.getAttribute('src'),
        poster: video.getAttribute('poster'),
        size: `${video.getAttribute('width')}x${video.getAttribute('height')}`,
        muted: video.muted,
        loop: video.loop,
        playsInline: video.playsInline,
        preload: video.getAttribute('preload'),
        hidden: video.getAttribute('aria-hidden'),
        inert: video.inert,
        description: description?.matches('.sr-only') ? description.textContent.trim() : null,
        toggle: toggle ? [toggle.dataset.labelPlay, toggle.dataset.labelPause] : null,
      };
    }),
  );
// A diferença entre o pôster e o primeiro quadro do vídeo, os dois no tamanho do arquivo: a média,
// por canal, de 0 a 255. Um vídeo à parte carrega o arquivo, sem mexer no da página. Se o pôster
// for outro quadro, o play começa com um salto (o quadro 40 dava de 43 a 59). No mesmo quadro sobram
// uns 8: o Chrome desenha o H.264 com um pouco mais de contraste que o pôster.
const posterVersusFirstFrame = (video) =>
  withDeadline(
    video.evaluate(async (element) => {
      const { width, height } = element;
      const pixels = (source) => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        context.drawImage(source, 0, 0, width, height);
        return context.getImageData(0, 0, width, height).data;
      };
      const poster = new Image();
      poster.src = element.poster;
      await poster.decode();
      const first = document.createElement('video');
      first.muted = true;
      first.preload = 'auto';
      await new Promise((resolve, reject) => {
        first.addEventListener('loadeddata', resolve, { once: true });
        first.addEventListener('error', () => reject(new Error(`sem ${first.src}`)), {
          once: true,
        });
        first.src = element.getAttribute('src');
      });
      const [a, b] = [pixels(poster), pixels(first)];
      let sum = 0;
      for (let index = 0; index < a.length; index += 4)
        for (let channel = 0; channel < 3; channel++)
          sum += Math.abs(a[index + channel] - b[index + channel]);
      return Math.round((sum / ((a.length / 4) * 3)) * 10) / 10;
    }),
    'pôster e primeiro quadro',
  );
// O tamanho da letra do selo "Exemplo" gravado no vídeo, como ele aparece na página: a altura das
// letras brancas dentro da pílula azul do canto de cima, medida no pôster (o primeiro quadro, com o
// selo) em linhas que a pílula fecha dos dois lados, e levada à largura do vídeo na página. As
// maiúsculas da Inter têm 0,73 da altura do corpo da letra.
const burnedTagFontSize = (video) =>
  withDeadline(
    video.evaluate(async (element) => {
      const poster = new Image();
      poster.src = element.poster;
      await poster.decode();
      const width = Math.round(poster.naturalWidth / 2);
      const height = Math.round(poster.naturalHeight / 4);
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      context.drawImage(poster, 0, 0);
      const { data } = context.getImageData(0, 0, width, height);
      const rgb = (x, y) => data.subarray((y * width + x) * 4, (y * width + x) * 4 + 3);
      const isBrandBlue = ([r, g, b]) => r < 40 && g > 60 && g < 110 && b > 210;
      const isWhite = ([r, g, b]) => r > 215 && g > 215 && b > 215;
      const rows = [];
      for (let y = 0; y < height; y++) {
        const blue = [];
        for (let x = 0; x < width; x++) if (isBrandBlue(rgb(x, y))) blue.push(x);
        if (blue.length < 2) continue;
        for (let x = blue[0]; x <= blue[blue.length - 1]; x++)
          if (isWhite(rgb(x, y))) {
            rows.push(y);
            break;
          }
      }
      if (!rows.length) return 0;
      const capHeight = rows[rows.length - 1] - rows[0] + 1;
      const scale = element.getBoundingClientRect().width / poster.naturalWidth;
      return Math.round((capHeight / 0.73) * scale * 10) / 10;
    }),
    'selo do vídeo',
  );
try {
  const desktop = await newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: 'reduce',
  });
  const page = await desktop.newPage();
  page.on('pageerror', (error) => errors.push(error.message));
  for (const route of routes) {
    const response = await page.goto(base + route);
    assert.equal(response.status(), 200);
    assert.equal(await page.locator('h1').count(), 1);
    // Nenhum título vazio: o leitor de tela anunciaria um título sem nome (as dúvidas de um grupo
    // só, como as de uma página de produto, vão sem o título do grupo).
    assert.deepEqual(
      await page
        .locator('h1, h2, h3, h4, h5, h6')
        .evaluateAll((headings) =>
          headings
            .filter(
              (heading) =>
                !heading.textContent.trim() && !heading.querySelector('img:not([alt=""])[alt]'),
            )
            .map((heading) => heading.outerHTML.slice(0, 80)),
        ),
      [],
      `${route}: título vazio`,
    );
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
    // Rodapé: a coluna Produtos tem um link por produto no ar (os mesmos do menu) e o "Ver todos"
    // só quando /produtos está publicada. Cada destino responde.
    const locale = localeOf(route);
    const footerProducts = page.locator('footer .footer-products');
    assert.equal(await footerProducts.count(), 1, `${route}: coluna Produtos no rodapé`);
    assert.equal(
      await footerProducts.locator('h2').innerText(),
      { pt: 'Produtos', es: 'Productos', en: 'Products' }[locale],
      `${route}: título da coluna Produtos do rodapé`,
    );
    const footerLinks = await footerProducts
      .locator('a')
      .evaluateAll((links) => links.map((link) => link.getAttribute('href')));
    assert.deepEqual(
      [...footerLinks].sort(),
      [
        ...productLinks(locale, route),
        ...(allProductsLinks ? [localeRoutes[locale].pages.products] : []),
      ].sort(),
      `${route}: um link por produto no ar no rodapé`,
    );
    // O Presencial aparece uma vez só no rodapé, na coluna Produtos (e só em português).
    assert.deepEqual(
      await page
        .locator(`footer a[href$="#${localeRoutes[locale].anchors.inPerson}"]`)
        .evaluateAll((links) => links.map((link) => !!link.closest('.footer-products'))),
      inPersonLocales.includes(locale) ? [true, true] : [],
      `${route}: o Presencial só na coluna Produtos do rodapé`,
    );
    if (route === routesOf[locale][0])
      for (const href of footerLinks)
        assert.equal((await fetch(base + href)).status, 200, `${route}: ${href} existe`);
    results.push(
      `Rota ${route}: HTML, nenhum título vazio, imagens, carregamento inicial sem iframe extra e produtos no rodapé OK`,
    );
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
  assert.match(await page.locator('#creditos').innerText(), /Uma volta com o celular/);
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

  // Menu do desktop acompanha a seção visível. O Presencial não está mais no topo: fica no menu
  // Produtos.
  assert.equal(
    await page
      .locator('.desktop-nav a[href$="#presencial"], #mobile-nav > a[href$="#presencial"]')
      .count(),
    0,
    'o Presencial fora do topo e do menu do celular',
  );
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

  // A faixa de produtos na home de cada idioma: os produtos com página própria no ar (os três
  // novos), cada um com o nome e a linha do menu Produtos e o link da página. O tour é a própria
  // home, e o Presencial tem a seção dele. A faixa vem logo depois do Presencial (só no pt) ou dos
  // benefícios da equipe, e logo antes da cotação (ou dos planos, com preços públicos).
  for (const [locale, title, before] of [
    ['pt', 'Mais para a sua imobiliária.', '.in-person-section'],
    ['es', 'Más para tu inmobiliaria.', '.team-section'],
    ['en', 'More for your agency.', '.team-section'],
  ]) {
    const { pages, anchors } = localeRoutes[locale];
    await page.goto(base + pages.home);
    const strip = page.locator(`${before} + .products-strip`);
    assert.equal(await strip.count(), 1, `${pages.home}: a faixa logo depois de ${before}`);
    assert.equal(
      await page
        .locator(`.products-strip + #${pricesShown ? anchors.plans : anchors.quote}`)
        .count(),
      1,
      `${pages.home}: a cotação logo depois da faixa`,
    );
    assert.equal(await strip.locator('h2').innerText(), title, `${pages.home}: título da faixa`);
    const texts = (links) =>
      links.map((link) => ({
        href: link.getAttribute('href'),
        text: ['.products-name', '.products-line'].map((part) =>
          link.querySelector(part).textContent.replace(/\s+/g, ' ').trim(),
        ),
      }));
    const cards = await strip.locator('a').evaluateAll(texts);
    assert.deepEqual(
      cards.map(({ href }) => href).sort(),
      productPages.map((id) => pages[id]).sort(),
      `${pages.home}: um link por página de produto no ar`,
    );
    const menu = await page.locator('#products-panel a[data-product]').evaluateAll(texts);
    for (const card of cards)
      assert.deepEqual(
        card.text,
        menu.find(({ href }) => href === card.href)?.text,
        `${pages.home}: ${card.href} com o nome e a linha do menu`,
      );
  }
  results.push(
    'Faixa de produtos na home (pt, es e en): o título no idioma, depois do Presencial ou dos benefícios da equipe e antes da cotação, um link por página de produto no ar, com o nome e a linha do menu OK',
  );

  // Cabeçalho do desktop em português (de 1280px para cima, com o seletor de idioma) em uma linha
  // de 1024 a 1440px, também com "Tour real", que só entra com tour de demonstração (aqui
  // simulado logo depois do botão Produtos, com o data-long-nav que o Header.astro põe).
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
        header.querySelector('.desktop-nav > .products-toggle').after(link);
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

  // Na home, depois da abertura, o cabeçalho volta quando a pessoa sobe a página, numa cápsula
  // quase opaca: sobre a faixa final escura e sobre o tour da apresentação, que ocupa meia largura.
  // O tour vira uma página lisa, preta no tema claro e branca no escuro: o pior fundo de cada um.
  {
    const context = await newContext({
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
    // Na página de produto também: no Piloto, a faixa azul do fim passa atrás do cabeçalho.
    await home.goto(base + localeRoutes.pt.pages.productInstagram);
    await home.evaluate(() => document.fonts.ready);
    readings.push(
      reading(
        'Piloto, sobre a faixa azul',
        await legibleAcross(home, '.final-cta', 'Piloto, sobre a faixa azul'),
      ),
    );
    await home.screenshot({ path: '.artifacts/cabecalho-faixa-azul-produto.png' });
    await context.close();
  }
  results.push(
    'Cabeçalho fora da abertura: volta ao subir na home, cápsula quase opaca com contraste AA (faixa final, tour e faixa azul de /tutoriais e do Piloto, nos dois temas), coluna da FAQ em 104px e 32px, e o painel Produtos fecha ao sair OK',
  );
  // Com mouse, o botão do menu (abaixo de 1024px) ganha um círculo sob o ponteiro. Sobre a
  // abertura, ele é branco translúcido, porque o ícone ali é branco.
  {
    const context = await newContext({
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

  // "Produtos ▾" no lugar de "Como funciona", nos três idiomas: abre e fecha pelo clique, pelo
  // teclado e pelo clique fora, e mostra um link por produto no ar.
  for (const [locale, route] of [
    ['pt', '/'],
    ['es', '/es'],
    ['en', '/en'],
  ]) {
    await page.goto(base + route);
    const toggle = page.locator('.desktop-nav > :first-child');
    const panel = page.locator('#products-panel');
    // O topo: Produtos ▾ · Cotação · Dúvidas · Tutoriais, com os rótulos do idioma.
    assert.deepEqual(
      await page
        .locator('.desktop-nav > :is(a, button)')
        .evaluateAll((items) => items.map((item) => item.textContent.trim())),
      {
        pt: ['Produtos', pricesShown ? 'Planos' : 'Cotação', 'Dúvidas', 'Tutoriais'],
        es: ['Productos', pricesShown ? 'Planes' : 'Presupuesto', 'Preguntas', 'Tutoriales'],
        en: ['Products', pricesShown ? 'Plans' : 'Get a quote', 'FAQ', 'Tutorials'],
      }[locale],
      `${route}: os itens do topo`,
    );
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
      productLinks(locale, route),
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
    // O ARP Vision Presencial: em português, o grupo "Com a nossa equipe" tem o treinamento e o
    // Tour Pronto, e os dois levam à seção dele na home; nos outros idiomas, nem grupo nem seção.
    const team = await panel.locator('.products-group').evaluateAll((groups) =>
      groups
        .filter((group) => group.querySelector('[data-product="training"]'))
        .map((group) => ({
          title: group.querySelector('.products-group-title').textContent.trim(),
          items: [...group.querySelectorAll('a[data-product]')].map((link) => [
            link.querySelector('.products-name').textContent.trim(),
            link.getAttribute('href'),
          ]),
        })),
    );
    if (locale === 'pt') {
      assert.deepEqual(
        team,
        [
          {
            title: 'Com a nossa equipe',
            items: [
              ['Treinamento da equipe', '#presencial'],
              ['Tour Pronto', '#presencial'],
            ],
          },
        ],
        `${route}: o grupo do Presencial no menu Produtos`,
      );
      await toggle.click();
      await panel.locator('a[data-product="readyTour"]').click();
      await page.waitForFunction(() => location.hash === '#presencial');
      assert.equal(await panel.isVisible(), false, `${route}: escolher o item fecha o painel`);
      assert.equal(
        await page
          .locator('#presencial')
          .evaluate((section) => section.getBoundingClientRect().top < innerHeight),
        true,
        `${route}: o Tour Pronto leva à seção do Presencial`,
      );
    } else {
      assert.deepEqual(team, [], `${route}: sem o grupo do Presencial`);
      assert.equal(await page.locator('#presencial').count(), 0, `${route}: sem a seção`);
    }
  }
  results.push(
    'Menu Produtos no desktop (pt, es e en): o topo Produtos · Cotação · Dúvidas · Tutoriais no idioma, primeiro item, clique, Esc com o foco de volta, Enter, Tab até o painel, clique fora e os produtos no ar; no pt, o grupo "Com a nossa equipe" com o treinamento e o Tour Pronto levando à seção do Presencial, e nada dele no es e no en OK',
  );

  // A página do Piloto automático para Instagram, nos três idiomas: as telas de exemplo marcadas,
  // nada do tour na cotação e na faixa azul, o produto em todo botão de WhatsApp, a mensagem da
  // cotação e o menu marcando o produto, com Cotação e Dúvidas na própria página.
  const instagram = {
    pt: {
      example: 'Exemplo',
      whatsappNumber: '(00) 00000-0000',
      contact:
        'Olá! Vim pelo site e quero saber do Piloto automático para Instagram da ARP Vision.',
      choices: ['21 a 100', '3', 'Este mês'],
      message: [
        'Olá! Vim pelo site e quero uma cotação do Piloto automático para Instagram da ARP Vision.',
        '• Imóveis anunciados: 21 a 100',
        '• Posts por semana: 3',
        '• Para quando: Este mês',
        'Pode me mandar uma proposta?',
      ],
    },
    es: {
      example: 'Ejemplo',
      whatsappNumber: '600 000 000',
      contact:
        '¡Hola! Vengo de la web y quiero saber más del Piloto automático para Instagram de ARP Vision.',
      choices: ['21 a 100', '3', 'Este mes'],
      message: [
        '¡Hola! Vengo de la web y quiero un presupuesto del Piloto automático para Instagram de ARP Vision.',
        '• Inmuebles anunciados: 21 a 100',
        '• Posts por semana: 3',
        '• Para cuándo: Este mes',
        '¿Me puedes enviar una propuesta?',
      ],
    },
    en: {
      example: 'Example',
      whatsappNumber: '(000) 000-0000',
      contact:
        "Hi! I came from the website and I'd like to know more about ARP Vision's Autopilot for Instagram.",
      choices: ['21 to 100', '3', 'This month'],
      message: [
        "Hi! I came from the website and I'd like a quote for ARP Vision's Autopilot for Instagram.",
        '• Listed properties: 21 to 100',
        '• Posts per week: 3',
        '• When I need it: This month',
        'Could you send me a proposal?',
      ],
    },
  };
  for (const [locale, expected] of Object.entries(instagram)) {
    const route = localeRoutes[locale].pages.productInstagram;
    await page.goto(base + route);
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.locator('h1').count(), 1, `${route}: um h1`);
    // O calendário do topo, o perfil parado da dor, uma tela em cada um dos três passos e as oito
    // artes.
    const screens = await exampleScreens(page);
    assert.equal(screens.length, 13, `${route}: treze telas de exemplo`);
    checkExampleScreens(screens, expected.example, route);
    // Cada passo do "Como funciona" leva a sua tela, e a lista dos passos continua lista no Safari,
    // que tira a semântica de lista com `list-style: none`.
    assert.deepEqual(
      await page.locator('.product-steps').evaluate((list) => ({
        role: list.getAttribute('role'),
        screens: [...list.children].map((step) => step.querySelectorAll('.example-screen').length),
      })),
      { role: 'list', screens: [1, 1, 1] },
      `${route}: uma tela em cada passo`,
    );
    // Nos cartões mais estreitos (de 1024 a 1199px, os três lado a lado) e no desktop largo, onde
    // o story é mais estreito que os posts.
    for (const width of [1024, 1100, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      assert.deepEqual(
        await stepScreensOverflow(page),
        [],
        `${route}, ${width}px: telas dos passos`,
      );
      assert.deepEqual(
        await storyNumber(page),
        { number: expected.whatsappNumber, lines: 1, inside: true },
        `${route}, ${width}px: o número de WhatsApp do story numa linha só`,
      );
    }
    await page.screenshot({ path: `.artifacts/produto-instagram-${locale}-desktop.png` });
    await checkProductPage(page, locale, 'instagram', expected);
  }
  // O título da dor troca o fim da frase a cada 2,5 s, por 2 voltas, e para no primeiro trecho;
  // com movimento reduzido, nem começa. O relógio da página é o do teste.
  for (const reducedMotion of ['reduce', 'no-preference']) {
    const context = await newContext({
      viewport: { width: 1440, height: 1000 },
      reducedMotion,
    });
    const painPage = await context.newPage();
    painPage.on('pageerror', (error) => errors.push(error.message));
    // O relógio parado desde antes da carga: só anda quando o teste manda.
    const start = Date.now();
    await painPage.clock.install({ time: start });
    await painPage.clock.pauseAt(start + 1000);
    await painPage.goto(base + localeRoutes.pt.pages.productInstagram);
    const title = painPage.locator('.pain-title');
    // O leitor de tela ouve a frase inteira uma vez; os trechos que trocam ficam fora dele.
    assert.equal(
      (await title.locator('.sr-only').textContent()).trim(),
      'Este mês você vendeu uma casa.',
    );
    assert.equal(
      await title
        .locator('[data-rotating-phrase]')
        .evaluate((phrase) => !!phrase.closest('[aria-hidden="true"]')),
      true,
      'os trechos que trocam ficam fora do leitor de tela',
    );
    // O que se vê é a mesma frase, com o espaço antes do trecho que troca.
    assert.equal(
      await title
        .locator('[aria-hidden="true"]')
        .evaluate((element) => element.innerText.replace(/\s+/g, ' ').trim()),
      'Este mês você vendeu uma casa.',
      'a frase que se vê no título da dor',
    );
    const shown = () =>
      title
        .locator('[data-rotating-phrase] > .is-active')
        .evaluateAll((spans) => spans.map((span) => span.textContent.trim()));
    assert.deepEqual(await shown(), ['vendeu uma casa.']);
    await title.scrollIntoViewIfNeeded();
    // O IntersectionObserver avisa em tempo real, fora do relógio do teste. Um segundo observador no
    // mesmo trecho, com o mesmo limiar, recebe o primeiro aviso na mesma entrega que o da página, ou
    // depois dela: quando ele avisa, a troca já começou (o requestAnimationFrame não serviria aqui,
    // porque o relógio do teste o para).
    await title.locator('[data-rotating-phrase]').evaluate(
      (phrase) =>
        new Promise((resolve) => {
          const observer = new IntersectionObserver(
            (entries) => {
              if (!entries.some((entry) => entry.isIntersecting)) return;
              observer.disconnect();
              resolve();
            },
            { threshold: 0.6 },
          );
          observer.observe(phrase);
        }),
    );
    const seen = [];
    for (let step = 0; step < 10; step++) {
      await painPage.clock.runFor(2500);
      seen.push(...(await shown()));
    }
    assert.deepEqual(
      seen,
      reducedMotion === 'reduce'
        ? Array(10).fill('vendeu uma casa.')
        : [
            'captou dois imóveis.',
            'alugou uma sala.',
            'assinou no cartório.',
            'vendeu uma casa.',
            'captou dois imóveis.',
            'alugou uma sala.',
            'assinou no cartório.',
            'vendeu uma casa.',
            'vendeu uma casa.',
            'vendeu uma casa.',
          ],
      `movimento ${reducedMotion}: trechos a cada 2,5 s`,
    );
    await context.close();
  }
  results.push(
    'Piloto automático para Instagram (pt, es e en): 1 h1; 13 telas de exemplo (uma em cada passo) com a etiqueta visível, aria-hidden, inert e a descrição "Exemplo:"; a lista dos passos com role="list" e nada para fora das telas dos passos a 1024, 1100 e 1440px; o número de WhatsApp do story numa linha só nessas larguras; nada do tour na cotação e na faixa; dúvidas sem título de grupo; o produto nos 5 botões de WhatsApp; a mensagem e os eventos da cotação; o menu marca o produto; Cotação e Dúvidas na página; a frase da dor troca 2 voltas e para no primeiro trecho, e não troca com movimento reduzido OK',
  );

  // A página dos Vídeos a partir de fotos, nos três idiomas: o par de vídeos do topo (os arquivos
  // do idioma, sem som, em laço, sem pré-carga, fora do leitor de tela, com a descrição "Exemplo:"
  // e o botão de cada um), uma tela de exemplo em cada passo e o que toda página de produto
  // confere. Com movimento reduzido (o contexto desta página), nenhum dos dois toca sozinho.
  const videoPage = {
    pt: {
      example: 'Exemplo',
      contact: 'Olá! Vim pelo site e quero saber dos vídeos a partir de fotos da ARP Vision.',
      toggles: [
        ['Reproduzir o vídeo vertical', 'Pausar o vídeo vertical'],
        ['Reproduzir o vídeo horizontal', 'Pausar o vídeo horizontal'],
      ],
      choices: ['6 a 20', 'Os dois', 'Este mês'],
      message: [
        'Olá! Vim pelo site e quero uma cotação de vídeos a partir de fotos da ARP Vision.',
        '• Imóveis por mês: 6 a 20',
        '• Formatos: Os dois',
        '• Para quando: Este mês',
        'Pode me mandar uma proposta?',
      ],
    },
    es: {
      example: 'Ejemplo',
      contact:
        '¡Hola! Vengo de la web y quiero saber más de los vídeos a partir de fotos de ARP Vision.',
      toggles: [
        ['Reproducir el vídeo vertical', 'Pausar el vídeo vertical'],
        ['Reproducir el vídeo horizontal', 'Pausar el vídeo horizontal'],
      ],
      choices: ['6 a 20', 'Los dos', 'Este mes'],
      message: [
        '¡Hola! Vengo de la web y quiero un presupuesto de vídeos a partir de fotos de ARP Vision.',
        '• Inmuebles al mes: 6 a 20',
        '• Formatos: Los dos',
        '• Para cuándo: Este mes',
        '¿Me puedes enviar una propuesta?',
      ],
    },
    en: {
      example: 'Example',
      contact:
        "Hi! I came from the website and I'd like to know more about ARP Vision's videos from photos.",
      toggles: [
        ['Play the vertical video', 'Pause the vertical video'],
        ['Play the horizontal video', 'Pause the horizontal video'],
      ],
      choices: ['6 to 20', 'Both', 'This month'],
      message: [
        "Hi! I came from the website and I'd like a quote for ARP Vision's videos from photos.",
        '• Properties per month: 6 to 20',
        '• Formats: Both',
        '• When I need it: This month',
        'Could you send me a proposal?',
      ],
    },
  };
  for (const [locale, expected] of Object.entries(videoPage)) {
    const route = localeRoutes[locale].pages.productVideos;
    await page.goto(base + route);
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.locator('h1').count(), 1, `${route}: um h1`);
    // Uma tela em cada um dos três passos; os vídeos levam o selo "Exemplo" gravado na imagem.
    const screens = await exampleScreens(page);
    assert.equal(screens.length, 3, `${route}: três telas de exemplo`);
    checkExampleScreens(screens, expected.example, route);
    assert.deepEqual(
      await page.locator('.product-steps').evaluate((list) => ({
        role: list.getAttribute('role'),
        screens: [...list.children].map((step) => step.querySelectorAll('.example-screen').length),
      })),
      { role: 'list', screens: [1, 1, 1] },
      `${route}: uma tela em cada passo`,
    );
    const videos = await exampleVideos(page);
    assert.deepEqual(
      videos.map(({ description, ...video }) => video),
      ['vertical', 'horizontal'].map((format, index) => ({
        src: `/video/exemplo-${format}-${locale}.mp4`,
        poster: `/images/produtos/exemplo-${format}-${locale}.webp`,
        size: format === 'vertical' ? '720x1280' : '1280x720',
        muted: true,
        loop: true,
        playsInline: true,
        preload: 'none',
        hidden: 'true',
        inert: true,
        toggle: expected.toggles[index],
      })),
      `${route}: os dois vídeos de exemplo do idioma`,
    );
    for (const { description } of videos)
      assert.ok(
        description?.startsWith(`${expected.example}: `),
        `${route}: descrição do vídeo: ${description}`,
      );
    assert.deepEqual(
      await page
        .locator('video[data-autoplay]')
        .evaluateAll((list) => list.map((video) => video.paused)),
      [true, true],
      `${route}: com movimento reduzido, os vídeos não tocam sozinhos`,
    );
    for (const width of [1024, 1100, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      assert.deepEqual(
        await stepScreensOverflow(page),
        [],
        `${route}, ${width}px: telas dos passos`,
      );
    }
    await page.screenshot({ path: `.artifacts/produto-videos-${locale}-desktop.png` });
    await checkProductPage(page, locale, 'videos', expected);
  }
  // No celular de 390 px, um vídeo fica embaixo do outro. O pôster de cada um é o primeiro quadro
  // (o play começa sem salto), e o selo "Exemplo" gravado nele tem pelo menos 10 px de letra.
  // Com movimento reduzido, nenhum toca sozinho, e o vertical posto para tocar à mão continua
  // tocando quando o horizontal entra na tela (o observador avisa por causa do outro vídeo). Sem
  // movimento reduzido, cada um toca quando aparece, e a pausa feita à mão no vertical continua
  // quando o horizontal entra na tela.
  for (const reducedMotion of ['reduce', 'no-preference']) {
    const context = await newContext({
      viewport: { width: 390, height: 800 },
      reducedMotion,
      isMobile: true,
      hasTouch: true,
    });
    const phoneVideos = await context.newPage();
    phoneVideos.on('pageerror', (error) => errors.push(error.message));
    if (reducedMotion === 'reduce') {
      const problems = [];
      for (const locale of Object.keys(videoPage)) {
        await phoneVideos.goto(base + localeRoutes[locale].pages.productVideos);
        for (const [index, format] of ['vertical', 'horizontal'].entries()) {
          const video = phoneVideos.locator('video[data-autoplay]').nth(index);
          const difference = await posterVersusFirstFrame(video);
          if (difference > 20)
            problems.push(
              `${locale} ${format}: o pôster difere do primeiro quadro (${difference})`,
            );
          const size = await burnedTagFontSize(video);
          if (size < 10) problems.push(`${locale} ${format}: selo com ${size} px de letra`);
        }
      }
      assert.deepEqual(problems, [], '390px: pôster e selo dos vídeos de exemplo');
    }
    await phoneVideos.goto(base + localeRoutes.pt.pages.productVideos);
    const horizontal = phoneVideos.locator('video[data-autoplay]').nth(1);
    const states = () =>
      phoneVideos
        .locator('video[data-autoplay]')
        .evaluateAll((list) => list.map((video) => (video.paused ? 'parado' : 'tocando')));
    const onScreen = () =>
      phoneVideos.locator('video[data-autoplay]').evaluateAll((list) =>
        list.map((video) => {
          const { top, bottom } = video.getBoundingClientRect();
          return top < innerHeight && bottom > 0;
        }),
      );
    // Rola até o topo do horizontal ficar `below` px abaixo da borda de baixo da tela (negativo:
    // acima dela, já na tela).
    const placeHorizontal = async (below) =>
      scrollPage(
        phoneVideos,
        await horizontal.evaluate(
          (video, offset) => video.getBoundingClientRect().top + scrollY - innerHeight - offset,
          below,
        ),
      );
    // O vertical na tela e o horizontal logo abaixo dela, ainda fora.
    await placeHorizontal(80);
    assert.deepEqual(
      await onScreen(),
      [true, false],
      `movimento ${reducedMotion}: o vertical na tela e o horizontal fora`,
    );
    const toggle = phoneVideos.locator('[data-video-toggle="exemplo-vertical"]');
    if (reducedMotion === 'reduce') {
      assert.deepEqual(await states(), ['parado', 'parado'], 'movimento reduzido: nada toca');
      await toggle.click();
      assert.deepEqual(await states(), ['tocando', 'parado'], 'movimento reduzido: play à mão');
    } else {
      await phoneVideos.waitForFunction(
        () => !document.querySelector('video[data-autoplay]').paused,
      );
      assert.deepEqual(await states(), ['tocando', 'parado'], 'o vertical toca quando aparece');
      await toggle.click();
      assert.deepEqual(await states(), ['parado', 'parado'], 'pausa à mão');
    }
    // O horizontal entra na tela, e o vertical continua nela.
    await placeHorizontal(-120);
    await untilOnScreen(horizontal, `movimento ${reducedMotion}: o horizontal na tela`);
    assert.deepEqual(
      await onScreen(),
      [true, true],
      `movimento ${reducedMotion}: o horizontal entra na tela, e o vertical continua nela`,
    );
    if (reducedMotion === 'reduce')
      assert.deepEqual(
        await states(),
        ['tocando', 'parado'],
        'movimento reduzido: o play à mão do vertical continua quando o horizontal entra na tela',
      );
    else {
      await phoneVideos.waitForFunction(
        () => !document.querySelectorAll('video[data-autoplay]')[1].paused,
      );
      assert.deepEqual(
        await states(),
        ['parado', 'tocando'],
        'o horizontal toca quando aparece, e a pausa à mão do vertical continua',
      );
    }
    await context.close();
  }
  // No desktop, o par fica lado a lado no topo, e os dois vídeos aparecem juntos. Sem movimento
  // reduzido, os dois tocam quando aparecem, nos três idiomas.
  const motionDesktop = await newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: 'no-preference',
  });
  const sideBySide = await motionDesktop.newPage();
  sideBySide.on('pageerror', (error) => errors.push(error.message));
  for (const locale of Object.keys(videoPage)) {
    const route = localeRoutes[locale].pages.productVideos;
    await sideBySide.goto(base + route);
    const videos = sideBySide.locator('video[data-autoplay]');
    assert.deepEqual(
      await videos.evaluateAll((list) =>
        list.map((video) => {
          const { top, bottom } = video.getBoundingClientRect();
          return top < innerHeight && bottom > 0;
        }),
      ),
      [true, true],
      `${route}, 1440px: os dois vídeos aparecem juntos no topo`,
    );
    await sideBySide
      .waitForFunction(
        () =>
          [...document.querySelectorAll('video[data-autoplay]')].every((video) => !video.paused),
        undefined,
        { timeout: 15000 },
      )
      .catch(() => {});
    assert.deepEqual(
      await videos.evaluateAll((list) =>
        list.map((video) => (video.paused ? 'parado' : 'tocando')),
      ),
      ['tocando', 'tocando'],
      `${route}, 1440px, sem movimento reduzido: os dois tocam quando aparecem`,
    );
  }
  await motionDesktop.close();
  results.push(
    'Vídeos a partir de fotos (pt, es e en): 1 h1; uma tela de exemplo em cada passo (etiqueta visível, aria-hidden, inert e a descrição "Exemplo:") e nada para fora delas a 1024, 1100 e 1440px; os dois vídeos do idioma sem som, em laço, sem pré-carga, fora do leitor de tela, com a descrição e o botão; nada do tour na cotação e na faixa; o produto nos 5 botões de WhatsApp; a mensagem ("6 a 20", "Os dois", "Este mês") e os eventos da cotação; o menu marca o produto. A 390px: o pôster é o primeiro quadro e o selo tem 10px ou mais; com movimento reduzido nada toca sozinho e o play à mão continua quando o outro vídeo entra na tela; sem ele cada vídeo toca quando aparece e a pausa à mão continua. A 1440px, sem movimento reduzido, os dois aparecem juntos e tocam OK',
  );

  // A página do Autochat, nos três idiomas: a conversa do topo, uma tela de exemplo em cada um dos
  // quatro passos, as distâncias e o resumo para a corretora, todas marcadas; toda distância que
  // aparece vem "em linha reta"; e o que toda página de produto confere (com o "Cotação" do topo
  // levando à cotação da própria página).
  const autochatPage = {
    pt: {
      example: 'Exemplo',
      straight: 'em linha reta',
      contact: 'Olá! Vim pelo site e quero saber do Autochat da ARP Vision.',
      choices: ['4 a 10', '100 a 500', 'Este mês'],
      message: [
        'Olá! Vim pelo site e quero uma cotação do Autochat da ARP Vision.',
        '• Corretores: 4 a 10',
        '• Contatos por mês: 100 a 500',
        '• Para quando: Este mês',
        'Pode me mandar uma proposta?',
      ],
    },
    es: {
      example: 'Ejemplo',
      straight: 'en línea recta',
      contact: '¡Hola! Vengo de la web y quiero saber más del Autochat de ARP Vision.',
      choices: ['4 a 10', '100 a 500', 'Este mes'],
      message: [
        '¡Hola! Vengo de la web y quiero un presupuesto del Autochat de ARP Vision.',
        '• Agentes: 4 a 10',
        '• Contactos al mes: 100 a 500',
        '• Para cuándo: Este mes',
        '¿Me puedes enviar una propuesta?',
      ],
    },
    en: {
      example: 'Example',
      straight: 'in a straight line',
      contact: "Hi! I came from the website and I'd like to know more about ARP Vision's Autochat.",
      choices: ['4 to 10', '100 to 500', 'This month'],
      message: [
        "Hi! I came from the website and I'd like a quote for ARP Vision's Autochat.",
        '• Agents: 4 to 10',
        '• Inquiries per month: 100 to 500',
        '• When I need it: This month',
        'Could you send me a proposal?',
      ],
    },
  };
  // As linhas do texto da página que falam de uma distância ("450 m", "1,2 km"; não "68 m²"), as
  // das telas de exemplo também.
  const distanceLines = (target) =>
    target
      .locator('main')
      .evaluate((main) =>
        main.innerText
          .split('\n')
          .filter((line) => /\d+(?:[.,]\d+)?\s*k?m(?![²\p{L}])/u.test(line)),
      );
  for (const [locale, expected] of Object.entries(autochatPage)) {
    const route = localeRoutes[locale].pages.productAutochat;
    await page.goto(base + route);
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.locator('h1').count(), 1, `${route}: um h1`);
    // A conversa do topo (com o resumo ao lado), uma tela em cada passo, as distâncias e o resumo.
    const screens = await exampleScreens(page);
    assert.equal(screens.length, 7, `${route}: sete telas de exemplo`);
    checkExampleScreens(screens, expected.example, route);
    assert.deepEqual(
      await page.locator('.product-steps').evaluate((list) => ({
        role: list.getAttribute('role'),
        screens: [...list.children].map((step) => step.querySelectorAll('.example-screen').length),
      })),
      { role: 'list', screens: [1, 1, 1, 1] },
      `${route}: uma tela em cada passo`,
    );
    // Toda distância que aparece é aproximada e em linha reta, no texto e nas telas.
    const lines = await distanceLines(page);
    assert.ok(lines.length > 0, `${route}: distâncias na página`);
    assert.deepEqual(
      lines.filter((line) => !line.includes(expected.straight)),
      [],
      `${route}: distância sem "${expected.straight}"`,
    );
    for (const width of [1024, 1100, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      assert.deepEqual(
        await stepScreensOverflow(page),
        [],
        `${route}, ${width}px: telas dos passos`,
      );
    }
    await page.screenshot({ path: `.artifacts/produto-autochat-${locale}-desktop.png` });
    await checkProductPage(page, locale, 'autochat', expected);
  }
  results.push(
    'Autochat (pt, es e en): 1 h1; 7 telas de exemplo (a conversa do topo, uma em cada um dos 4 passos, as distâncias e o resumo) com a etiqueta visível, aria-hidden, inert e a descrição "Exemplo:"; nada para fora das telas dos passos a 1024, 1100 e 1440px; toda distância da página "em linha reta"; nada do tour na cotação e na faixa; o produto nos 5 botões de WhatsApp; a mensagem ("4 a 10", "100 a 500", "Este mês") e os eventos da cotação; o menu marca o produto; Cotação e Dúvidas na página OK',
  );

  // A página com todos os produtos, nos três idiomas: um cartão por produto no ar (os links do
  // menu), cada um com a foto 16:9 e o "Conhecer", e o do tour leva à home. Cada destino responde.
  // Sem dúvidas próprias, Cotação e Dúvidas do topo levam às da home, e a faixa azul pede a
  // cotação pelo WhatsApp com a mensagem geral dos produtos, sem o cadastro.
  const allProductsPage = {
    pt: {
      cta: 'Conhecer',
      message: 'Olá! Vim pelo site e quero uma cotação dos produtos da ARP Vision.',
    },
    es: {
      cta: 'Conocer',
      message: '¡Hola! Vengo de la web y quiero un presupuesto de los productos de ARP Vision.',
    },
    en: {
      cta: 'Discover',
      message: "Hi! I came from the website and I'd like a quote for ARP Vision's products.",
    },
  };
  for (const [locale, expected] of Object.entries(allProductsPage)) {
    const { pages, anchors } = localeRoutes[locale];
    const route = pages.products;
    await page.goto(base + route);
    const cards = await page.locator('.product-card').evaluateAll((links) =>
      links.map((link) => ({
        product: link.dataset.product,
        href: link.getAttribute('href'),
        image: link.querySelector('img')?.getAttribute('src') ?? null,
        cta: link.querySelector('.product-card-cta')?.textContent.trim() ?? null,
      })),
    );
    assert.deepEqual(
      cards.map((card) => card.href).sort(),
      productLinks(locale, route),
      `${route}: um cartão por produto no ar, com os links do menu`,
    );
    assert.equal(
      cards.find((card) => card.product === 'tour')?.href,
      pages.home,
      `${route}: o cartão do tour leva à home`,
    );
    // Os cartões seguem os grupos do menu Produtos: os mesmos títulos, na mesma ordem, e os mesmos
    // produtos em cada um, no painel do desktop e no grupo do celular. Nenhum cartão fica fora.
    const groupsIn = (selector, title, item) =>
      page
        .locator(selector)
        .evaluateAll(
          (groups, [titleSelector, itemSelector]) =>
            groups.map((group) => [
              group.querySelector(titleSelector).textContent.trim(),
              [...group.querySelectorAll(itemSelector)].map((link) => link.dataset.product),
            ]),
          [title, item],
        );
    const cardGroups = await groupsIn('.products-page-group', 'h2', '.product-card');
    assert.deepEqual(
      cardGroups.flatMap(([, ids]) => ids),
      cards.map((card) => card.product),
      `${route}: todo cartão num grupo`,
    );
    for (const menu of ['#products-panel', '#mobile-products-list'])
      assert.deepEqual(
        cardGroups,
        await groupsIn(`${menu} .products-group`, '.products-group-title', '.products-item'),
        `${route}: os cartões seguem os grupos do menu (${menu})`,
      );
    for (const card of cards) {
      assert.equal((await fetch(base + card.href)).status, 200, `${route}: ${card.href} existe`);
      assert.match(card.image ?? '', /^\/images\/produtos\/[\w-]+-16x9\.webp$/, `${route}: foto`);
      assert.equal(card.cta, expected.cta, `${route}: "${expected.cta}" em ${card.product}`);
    }
    assert.equal(await page.locator('.faq-section').count(), 0, `${route}: sem dúvidas próprias`);
    for (const anchor of pricesShown ? ['faq'] : ['quote', 'faq'])
      assert.equal(
        await page.locator(`.desktop-nav a[data-spy="${anchors[anchor]}"]`).getAttribute('href'),
        `${pages.home}#${anchors[anchor]}`,
        `${route}: ${anchor} leva à home`,
      );
    assert.deepEqual(
      await page
        .locator('.final-cta-actions a')
        .evaluateAll((links) =>
          links.map((link) => [
            link.hasAttribute('data-whatsapp'),
            link.dataset.cta ?? null,
            new URL(link.href).searchParams.get('text'),
          ]),
        ),
      [[true, null, expected.message]],
      `${route}: a faixa azul pede a cotação dos produtos pelo WhatsApp, sem o cadastro`,
    );
    await page.screenshot({ path: `.artifacts/produtos-${locale}-desktop.png` });
  }
  results.push(
    'Todos os produtos (pt, es e en): um cartão por produto no ar, com a foto 16:9 e "Conhecer" no idioma, nos grupos do menu (painel e celular); o do tour leva à home; cada destino responde; sem dúvidas, Cotação e Dúvidas levam à home; a faixa azul pede a cotação dos produtos pelo WhatsApp OK',
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
    await quote.locator('input[value="Imobiliária com equipe"]').check();
    await quote.locator('input[value="6 a 15"]').check();
    await quote.locator('input[value="Este mês"]').check();
    const filled = [
      greeting,
      '• Como trabalho: Imobiliária com equipe',
      '• Imóveis por mês: 6 a 15',
      '• Para quando: Este mês',
      'Pode me mandar uma proposta?',
    ].join('\n');
    assert.equal(await message(), filled, 'respostas entram na mensagem');
    assert.equal(await quote.locator('[data-quote-preview]').textContent(), filled, 'prévia igual');
    // Analytics: o site não carrega o Plausible, então o teste ocupa `window.plausible` e anota as
    // chamadas. O clique não segue o link (o WhatsApp abriria numa aba nova). O evento da cotação
    // leva as respostas e o produto (a Home é do tour), e o do botão de WhatsApp leva o produto
    // só quando o elemento tem data-product, como o das páginas de produto.
    const clickEvents = () =>
      submit.evaluate((link) => {
        const events = [];
        window.plausible = (name, options) => events.push([name, options?.props]);
        const stay = (event) => event.preventDefault();
        document.addEventListener('click', stay, true);
        link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        document.removeEventListener('click', stay, true);
        return events;
      });
    const answers = {
      'Como trabalho': 'Imobiliária com equipe',
      'Imóveis por mês': '6 a 15',
      'Para quando': 'Este mês',
    };
    assert.deepEqual(
      await clickEvents(),
      [
        ['cotacao_whatsapp', { ...answers, produto: 'tour' }],
        ['cta_whatsapp', {}],
      ],
      'eventos da cotação da Home: produto tour, e o botão sem produto',
    );
    await quote.evaluate((section) => {
      section.querySelector('[data-quote]').dataset.product = 'autochat';
      section.querySelector('.quote-submit').dataset.product = 'autochat';
    });
    assert.deepEqual(
      await clickEvents(),
      [
        ['cotacao_whatsapp', { ...answers, produto: 'autochat' }],
        ['cta_whatsapp', { produto: 'autochat' }],
      ],
      'eventos da cotação com data-product: o produto vai nos dois',
    );
    await quote.evaluate((section) => {
      delete section.querySelector('[data-quote]').dataset.product;
      delete section.querySelector('.quote-submit').dataset.product;
    });
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
      'Preços ocultos: cotação pelo WhatsApp com mensagem pronta e eventos com o produto, sem valores nem ofertas; /planos leva à cotação OK',
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
    for (const route of [
      '/',
      localeRoutes.pt.pages.productInstagram,
      localeRoutes.pt.pages.productVideos,
      localeRoutes.pt.pages.productAutochat,
      localeRoutes.pt.pages.products,
      pricesShown ? '/planos' : '/termos-de-uso',
    ]) {
      await themed.goto(base + route);
      await themed.addScriptTag({ content: axeSource });
      assert.deepEqual(
        await contrastOf(themed),
        [],
        `${colorScheme} ${route}: contraste insuficiente`,
      );
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
  // A 360 px, as telas do Piloto (as dos passos também) continuam marcadas, e o calendário do topo
  // mostra uma semana só.
  await phone.goto(base + localeRoutes.pt.pages.productInstagram);
  const phoneScreens = await exampleScreens(phone);
  assert.equal(phoneScreens.length, 13, '360px, Piloto: treze telas de exemplo');
  checkExampleScreens(phoneScreens, 'Exemplo', '360px, Piloto');
  // A 390 e a 360 px, nos três idiomas: nada sai das telas dos passos, cada trecho da frase da dor
  // cabe numa linha (sem linha vazia reservada embaixo dele) e o número do story não quebra.
  for (const [locale, expected] of Object.entries(instagram)) {
    await phone.goto(base + localeRoutes[locale].pages.productInstagram);
    await phone.evaluate(() => document.fonts.ready);
    for (const width of [390, 360]) {
      await phone.setViewportSize({ width, height: 800 });
      const scene = `${width}px, Piloto em ${locale}`;
      assert.deepEqual(await stepScreensOverflow(phone), [], `${scene}: telas dos passos`);
      assert.deepEqual(
        await painPhraseLines(phone),
        { longer: [], reserved: 1 },
        `${scene}: cada trecho da frase da dor numa linha`,
      );
      assert.deepEqual(
        await storyNumber(phone),
        { number: expected.whatsappNumber, lines: 1, inside: true },
        `${scene}: o número de WhatsApp do story numa linha só`,
      );
    }
  }
  await phone.goto(base + localeRoutes.pt.pages.productInstagram);
  assert.deepEqual(
    await phone
      .locator('.calendar-week')
      .evaluateAll((weeks) => weeks.map((week) => week.checkVisibility())),
    [true, false],
    '360px: o calendário do Piloto mostra uma semana só',
  );
  // A 390 e a 360 px, nos três idiomas, as telas dos passos dos Vídeos continuam marcadas, e nada
  // sai delas.
  for (const [locale, expected] of Object.entries(videoPage)) {
    await phone.goto(base + localeRoutes[locale].pages.productVideos);
    await phone.evaluate(() => document.fonts.ready);
    for (const width of [390, 360]) {
      await phone.setViewportSize({ width, height: 800 });
      const scene = `${width}px, Vídeos em ${locale}`;
      const screens = await exampleScreens(phone);
      assert.equal(screens.length, 3, `${scene}: três telas de exemplo`);
      checkExampleScreens(screens, expected.example, scene);
      assert.deepEqual(await stepScreensOverflow(phone), [], `${scene}: telas dos passos`);
    }
  }
  // O mesmo no Autochat: as sete telas continuam marcadas, e nada sai das dos passos.
  for (const [locale, expected] of Object.entries(autochatPage)) {
    await phone.goto(base + localeRoutes[locale].pages.productAutochat);
    await phone.evaluate(() => document.fonts.ready);
    for (const width of [390, 360]) {
      await phone.setViewportSize({ width, height: 800 });
      const scene = `${width}px, Autochat em ${locale}`;
      const screens = await exampleScreens(phone);
      assert.equal(screens.length, 7, `${scene}: sete telas de exemplo`);
      checkExampleScreens(screens, expected.example, scene);
      assert.deepEqual(await stepScreensOverflow(phone), [], `${scene}: telas dos passos`);
    }
    await phone.screenshot({ path: `.artifacts/produto-autochat-${locale}-mobile.png` });
  }
  // Aberto, o menu do celular fica numa cápsula opaca, na cor do tema: as linhas dele passam por
  // fundos misturados. Fora da home, ele pode ficar sobre a faixa azul, o título dela desfocado e
  // o rodapé. A página não rola pelo toque com o menu aberto, mas rola pelo script: a faixa vai
  // para o topo do cabeçalho. Na página de produto, o grupo Produtos aberto mostra o item da página
  // marcado, e o botão Produtos leva a marca da página.
  for (const [route, scene] of [
    [localeRoutes.pt.pages.tutorials, '/tutoriais'],
    [localeRoutes.pt.pages.productInstagram, 'Piloto'],
  ]) {
    await phone.goto(base + route);
    await phone.locator('.menu-toggle').click();
    const productPage = route === localeRoutes.pt.pages.productInstagram;
    if (productPage) {
      await phone.locator('.mobile-products-toggle').click();
      assert.equal(
        await phone
          .locator('.mobile-products-toggle')
          .evaluate((button) => button.matches('.is-current')),
        true,
        `${scene}: o botão Produtos do celular com a marca da página`,
      );
      assert.equal(
        await phone
          .locator('#mobile-products-list a[data-product="instagram"]')
          .evaluate((link) => link.checkVisibility() && link.getAttribute('aria-current')),
        'page',
        `${scene}: o item da página marcado no grupo Produtos`,
      );
    }
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
      `menu aberto em ${scene} com a faixa azul atrás dele`,
    );
    readings.push(
      reading(
        `360px, menu aberto sobre a faixa azul de ${scene}`,
        await legibleHeader(phone, `360px, menu aberto sobre a faixa azul de ${scene}`),
      ),
    );
    await phone.screenshot({
      path: `.artifacts/${productPage ? 'produto' : 'tutoriais'}-menu-faixa-mobile.png`,
    });
  }
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
    '360px: as 13 telas do Piloto marcadas e o calendário com uma semana só; a 390 e 360px, em pt, es e en, nada para fora das telas dos passos, cada trecho da frase da dor numa linha e o número do story numa linha só; as 3 telas dos Vídeos e as 7 do Autochat marcadas e nada para fora das dos passos; menu aberto numa cápsula opaca com contraste AA (topo da home e faixa azul de /tutoriais e do Piloto, com o produto marcado, nos dois temas); fechado, volta ao vidro da abertura, sem o círculo de hover preso no botão OK',
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
    productLinks('pt', '/'),
    'grupo Produtos com os produtos no ar',
  );
  assert.equal(productItems.length, productLinks('pt', '/').length + allProductsLinks);
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
    await quote.locator('input[value="Sou corretor autônomo"]').tap();
    assert.match(
      new URL(await quote.locator('.quote-submit').getAttribute('href')).searchParams.get('text'),
      /• Como trabalho: Sou corretor autônomo/,
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
      capture: /Una vuelta con el móvil/,
      greeting: '¡Hola! Vengo de la web y quiero un presupuesto de ARP Vision.',
      answers: ['Inmobiliaria con equipo', '6 a 15', 'Este mes'],
      filled: [
        '• Cómo trabajo: Inmobiliaria con equipo',
        '• Inmuebles al mes: 6 a 15',
        '• Para cuándo: Este mes',
        '¿Me puedes enviar una propuesta?',
      ],
      nextAnswer: /• Para cuándo: Aún me estoy informando/,
      spy: [
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
      capture: /One turn with your phone/,
      greeting: "Hi! I came from the website and I'd like a quote from ARP Vision.",
      answers: ['Agency with a team', '6 to 15', 'This month'],
      filled: [
        '• How I work: Agency with a team',
        '• Properties per month: 6 to 15',
        '• When I need it: This month',
        'Could you send me a proposal?',
      ],
      nextAnswer: /• When I need it: Still researching/,
      spy: [pricesShown ? ['plans', 'Plans'] : ['quote', 'Get a quote'], ['faq', 'FAQ']],
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
    // A captura é uma volta com o celular, sem tempo prometido.
    assert.match(
      await localized.locator('#creditos').innerText(),
      language.capture,
      `${home}: captura`,
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
    choose.locator('.site-header .language-menu summary').evaluate((element) =>
      [...element.childNodes]
        .filter((node) => node.nodeType === Node.TEXT_NODE)
        .map((node) => node.textContent)
        .join('')
        .trim(),
    );
  assert.equal(await menu.isVisible(), true);
  assert.equal(await visibleCode(), 'PT');
  // Nome acessível: o código que aparece, o rótulo e o nome do idioma.
  assert.equal((await summary.textContent()).replace(/\s+/g, ' ').trim(), 'PT, Idioma: Português');
  assert.equal(await list.isVisible(), false);
  // Teclado: Enter abre, Tab percorre as opções, Escape fecha e devolve o foco ao botão.
  await summary.focus();
  await choose.keyboard.press('Enter');
  assert.equal(await list.isVisible(), true);
  assert.deepEqual(
    await list
      .locator('a')
      .evaluateAll((links) =>
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
  // Abaixo de 1280px o compacto sai do cabeçalho (fica no rodapé); em 1280px ele cabe, no
  // português e no inglês.
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
      assert.deepEqual(
        await wrappedHeader(choose),
        [],
        `${route} ${width}px: cabeçalho em uma linha`,
      );
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

  // Contraste nos dois temas, nas páginas dos outros idiomas (as de produto também), na 404 e com
  // a lista do seletor aberta.
  for (const colorScheme of ['light', 'dark']) {
    const context = await newContext({
      viewport: { width: 1440, height: 1000 },
      colorScheme,
      reducedMotion: 'reduce',
    });
    const themed = await context.newPage();
    for (const route of [
      ...['es', 'en'].flatMap((locale) => {
        const { pages } = localeRoutes[locale];
        return [
          pages.home,
          pages.productInstagram,
          pages.productVideos,
          pages.productAutochat,
          pages.products,
          pages.terms,
        ];
      }),
      '/pagina-que-nao-existe',
    ]) {
      await themed.goto(base + route);
      await themed.addScriptTag({ content: axeSource });
      assert.deepEqual(
        await contrastOf(themed),
        [],
        `${colorScheme} ${route}: contraste insuficiente`,
      );
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
  results.push(
    'Contraste AA nos dois temas em /es e /en (as páginas de produto também), na 404 e com a lista do seletor aberta OK',
  );

  // Cabeçalho em uma linha, com Produtos só a partir de 1024px, e nada estourando, em todas as
  // rotas dos três idiomas e na 404, inclusive de 1024 a 1100px, onde os rótulos do espanhol ficam
  // mais apertados.
  for (const width of [320, 360, 390, 768, 1024, 1040, 1100, 1280, 1440]) {
    const context = await newContext({
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
      return {
        ...(await sized.evaluate(() => ({
          width: document.documentElement.clientWidth,
          layout: innerWidth,
          scroll: document.documentElement.scrollWidth,
          products: document.querySelector('.products-toggle')?.checkVisibility() ?? false,
          capsule: document.querySelector('.header-capsule')?.getBoundingClientRect().width ?? 0,
        }))),
        // Nenhum rótulo do cabeçalho quebra em duas linhas, o botão Produtos incluído.
        wrapped: await wrappedHeader(sized),
      };
    };
    // A mesma medida na página em português: um estouro que o português também tem não é do
    // outro idioma (a tabela de /planos entre 768 e 1023px, só visível com preços públicos).
    const ptDimensions = new Map();
    for (const route of ptRoutes) {
      const dimensions = await measure(route);
      ptDimensions.set(route, dimensions);
      assert.deepEqual(dimensions.wrapped, [], `${route} ${width}px: cabeçalho em uma linha`);
      assert.equal(dimensions.products, width >= 1024, `${route} ${width}px: Produtos no desktop`);
      assert.ok(
        dimensions.capsule <= 1060,
        `${route} ${width}px: cápsula com ${dimensions.capsule}px`,
      );
    }
    for (const route of [...routesOf.es, ...routesOf.en, '/pagina-que-nao-existe']) {
      const dimensions = await measure(route);
      const overflows =
        dimensions.scroll > dimensions.width || dimensions.layout > dimensions.width;
      const index = [routesOf.es, routesOf.en]
        .map((list) => list.indexOf(route))
        .find((position) => position >= 0);
      const ptRoute = index === undefined ? undefined : ptRoutes[index];
      const pt = overflows && ptRoute ? ptDimensions.get(ptRoute) : null;
      if (pt && pt.scroll > pt.width)
        knownIssues.push(
          `${route} ${width}px: estouro de ${dimensions.scroll - dimensions.width}px, também em ${ptRoute} (${pt.scroll - pt.width}px)`,
        );
      else assert.ok(!overflows, `${route} ${width}px: sem overflow ${JSON.stringify(dimensions)}`);
      assert.deepEqual(dimensions.wrapped, [], `${route} ${width}px: cabeçalho em uma linha`);
      // A 404 não tem cabeçalho.
      if (ptRoute) {
        assert.equal(
          dimensions.products,
          width >= 1024,
          `${route} ${width}px: Produtos no desktop`,
        );
        assert.ok(
          dimensions.capsule <= 1060,
          `${route} ${width}px: cápsula com ${dimensions.capsule}px`,
        );
      }
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
    `Três idiomas e 404 de 320 a 1440px (com 1040 e 1100px): ${routes.length} rotas sem estouro e com o cabeçalho numa linha (cápsula de até 1060px), com Produtos só a partir de 1024px; menu do celular com PT | ES | EN OK`,
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
      () =>
        document.querySelector('.language-suggestion a')?.getAttribute('href') === '/es#preguntas',
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
  // Numa página de produto (ou na de todos), a faixa leva à página do mesmo produto no outro
  // idioma, com a seção equivalente.
  for (const [locale, route, offered] of [
    ['pt-BR', '/', null],
    ['pt-PT', '/en/tutorials', '/tutoriais'],
    ['es-AR', '/en/privacy-policy', '/es/politica-de-privacidad'],
    ['de-DE', '/', '/en'],
    ['de-DE', '/en', null],
    ['en-US', '/produtos/autochat', '/en/products/autochat'],
    ['en-GB', '/produtos/videos-a-partir-de-fotos#duvidas', '/en/products/videos-from-photos#faq'],
    [
      'es-ES',
      '/en/products/autopilot-for-instagram#quote',
      '/es/productos/piloto-automatico-para-instagram#cotizacion',
    ],
    ['pt-BR', '/en/products', '/produtos'],
    ['en-US', '/es/productos', '/en/products'],
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
    'Faixa de sugestão de idioma: fora do HTML do servidor; navegador es-ES no / oferece o /es, en no /es oferece o /en, de-DE oferece o inglês, nada quando o idioma bate, na 404 e para robôs; âncora equivalente; na página de produto, a do mesmo produto no outro idioma; fechar e o seletor gravam a escolha e ela não volta; sem localStorage não quebra; sem animação com movimento reduzido; de 320 a 1440px sem estouro, cabeçalho numa linha, sem cobrir cabeçalho nem WhatsApp; contraste nos dois temas OK',
  );
  results.push(`Menor contraste do texto do cabeçalho, medido na imagem: ${readings.join('; ')}`);
  assert.deepEqual(errors, []);
  console.log(results.join('\n'));
  await writeFile('.artifacts/browser-results.json', JSON.stringify({ results, errors }, null, 2));
} finally {
  await browser.close();
}
