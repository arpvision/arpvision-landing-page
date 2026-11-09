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
const stepScreensOverflow = (target) =>
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
    const locale = esRoutes.includes(route) ? 'es' : 'pt';
    const footerProducts = page.locator('footer .footer-products');
    assert.equal(await footerProducts.count(), 1, `${route}: coluna Produtos no rodapé`);
    assert.equal(
      await footerProducts.locator('h2').innerText(),
      locale === 'es' ? 'Productos' : 'Produtos',
      `${route}: título da coluna Produtos do rodapé`,
    );
    const footerLinks = await footerProducts
      .locator('a')
      .evaluateAll((links) => links.map((link) => link.getAttribute('href')));
    assert.deepEqual(
      [...footerLinks].sort(),
      [
        ...productLinks(locale),
        ...(allProductsLinks ? [localeRoutes[locale].pages.products] : []),
      ].sort(),
      `${route}: um link por produto no ar no rodapé`,
    );
    if (route === '/' || route === '/es')
      for (const href of footerLinks)
        assert.equal((await fetch(base + href)).status, 200, `${route}: ${href} existe`);
    results.push(
      `Rota ${route}: HTML, nenhum título vazio, imagens, carregamento inicial sem iframe extra e produtos no rodapé OK`,
    );
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

  // A página do Piloto automático para Instagram, nos dois idiomas: as telas de exemplo marcadas,
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
    const context = await browser.newContext({
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
    'Piloto automático para Instagram (pt e es): 1 h1; 13 telas de exemplo (uma em cada passo) com a etiqueta visível, aria-hidden, inert e a descrição "Exemplo:"; a lista dos passos com role="list" e nada para fora das telas dos passos a 1024, 1100 e 1440px; o número de WhatsApp do story numa linha só nessas larguras; nada do tour na cotação e na faixa; dúvidas sem título de grupo; o produto nos 5 botões de WhatsApp; a mensagem e os eventos da cotação; o menu marca o produto; Cotação e Dúvidas na página; a frase da dor troca 2 voltas e para no primeiro trecho, e não troca com movimento reduzido OK',
  );

  // A página dos Vídeos a partir de fotos, nos dois idiomas: o par de vídeos do topo (os arquivos do
  // idioma, sem som, em laço, sem pré-carga, fora do leitor de tela, com a descrição "Exemplo:" e o
  // botão de cada um), uma tela de exemplo em cada passo e o que toda página de produto confere.
  // Com movimento reduzido (o contexto desta página), nenhum dos dois toca sozinho.
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
    const context = await browser.newContext({
      viewport: { width: 390, height: 800 },
      reducedMotion,
      isMobile: true,
      hasTouch: true,
    });
    const phoneVideos = await context.newPage();
    phoneVideos.on('pageerror', (error) => errors.push(error.message));
    if (reducedMotion === 'reduce') {
      const problems = [];
      for (const locale of ['pt', 'es']) {
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
  // reduzido, os dois tocam quando aparecem, nos dois idiomas.
  const motionDesktop = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: 'no-preference',
  });
  const sideBySide = await motionDesktop.newPage();
  sideBySide.on('pageerror', (error) => errors.push(error.message));
  for (const locale of ['pt', 'es']) {
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
    'Vídeos a partir de fotos (pt e es): 1 h1; uma tela de exemplo em cada passo (etiqueta visível, aria-hidden, inert e a descrição "Exemplo:") e nada para fora delas a 1024, 1100 e 1440px; os dois vídeos do idioma sem som, em laço, sem pré-carga, fora do leitor de tela, com a descrição e o botão; nada do tour na cotação e na faixa; o produto nos 5 botões de WhatsApp; a mensagem ("6 a 20", "Os dois", "Este mês") e os eventos da cotação; o menu marca o produto. A 390px: o pôster é o primeiro quadro e o selo tem 10px ou mais; com movimento reduzido nada toca sozinho e o play à mão continua quando o outro vídeo entra na tela; sem ele cada vídeo toca quando aparece e a pausa à mão continua. A 1440px, sem movimento reduzido, os dois aparecem juntos e tocam OK',
  );

  // A página do Autochat, nos dois idiomas: a conversa do topo, uma tela de exemplo em cada um dos
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
    'Autochat (pt e es): 1 h1; 7 telas de exemplo (a conversa do topo, uma em cada um dos 4 passos, as distâncias e o resumo) com a etiqueta visível, aria-hidden, inert e a descrição "Exemplo:"; nada para fora das telas dos passos a 1024, 1100 e 1440px; toda distância da página "em linha reta"; nada do tour na cotação e na faixa; o produto nos 5 botões de WhatsApp; a mensagem ("4 a 10", "100 a 500", "Este mês") e os eventos da cotação; o menu marca o produto; Cotação e Dúvidas na página OK',
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
      'Como trabalho': 'Tenho uma equipe',
      'Espaços por mês': '6 a 15',
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
    const context = await browser.newContext({
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
      pricesShown ? '/planos' : '/termos-de-uso',
    ]) {
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
  // A 360 px, as telas do Piloto (as dos passos também) continuam marcadas, e o calendário do topo
  // mostra uma semana só.
  await phone.goto(base + localeRoutes.pt.pages.productInstagram);
  const phoneScreens = await exampleScreens(phone);
  assert.equal(phoneScreens.length, 13, '360px, Piloto: treze telas de exemplo');
  checkExampleScreens(phoneScreens, 'Exemplo', '360px, Piloto');
  // A 390 e a 360 px, nos dois idiomas: nada sai das telas dos passos, cada trecho da frase da dor
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
  // A 390 e a 360 px, nos dois idiomas, as telas dos passos dos Vídeos continuam marcadas, e nada
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
    '360px: as 13 telas do Piloto marcadas e o calendário com uma semana só; a 390 e 360px, em pt e es, nada para fora das telas dos passos, cada trecho da frase da dor numa linha e o número do story numa linha só; as 3 telas dos Vídeos e as 7 do Autochat marcadas e nada para fora das dos passos; menu aberto numa cápsula opaca com contraste AA (topo da home e faixa azul de /tutoriais e do Piloto, com o produto marcado, nos dois temas); fechado, volta ao vidro da abertura, sem o círculo de hover preso no botão OK',
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
    for (const route of [
      '/es',
      localeRoutes.es.pages.productInstagram,
      localeRoutes.es.pages.productVideos,
      localeRoutes.es.pages.productAutochat,
      '/es/terminos-de-uso',
      '/pagina-que-nao-existe',
    ]) {
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
