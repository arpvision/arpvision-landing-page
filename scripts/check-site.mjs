import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { portugueseWordsIn } from './portuguese-words.mjs';
import { pricePattern } from './lib/prices.mjs';
import { publishedPageIds, routes as localeRoutes } from '../src/i18n/routes.ts';
// Sem preços públicos (site.pricing.showPrices), /planos é só um redirecionamento.
const pricesShown = !(await readFile('dist/planos/index.html', 'utf8')).includes(
  'http-equiv="refresh"',
);
// O arquivo de cada endereço no build: "/" é index.html, "/es/planes" é es/planes/index.html.
const fileOf = (route) => `${route.slice(1)}/index.html`.replace(/^\//, '');
// Cada página existe em cada idioma, com os endereços de src/i18n/routes.ts; o português mora
// na raiz, o espanhol em /es e o inglês em /en. A imagem de compartilhamento das páginas de
// produto (e da com todos eles) é a da home do idioma.
const locales = [
  { code: 'pt', lang: 'pt-BR', ogLocale: 'pt_BR', ogImage: 'og-home.png' },
  { code: 'es', lang: 'es-ES', ogLocale: 'es_ES', ogImage: 'og-home-es.png' },
  { code: 'en', lang: 'en', ogLocale: 'en_US', ogImage: 'og-home-en.png' },
].map((locale) => ({
  ...locale,
  quote: localeRoutes[locale.code].anchors.quote,
  pages: Object.fromEntries(
    Object.entries(localeRoutes[locale.code].pages).map(([page, route]) => [page, fileOf(route)]),
  ),
}));
// O texto da faixa de sugestão de idioma só entra na página pelo navegador: nenhum HTML que o
// servidor entrega pode tê-lo (src/i18n/suggestion.ts).
const suggestionTexts = [
  'Esta página também está em português.',
  'Ver em português',
  'Esta página también está en español.',
  'Ver en español',
  'This page is also available in English.',
  'View in English',
];
// Só as páginas publicadas, na ordem de routes.ts; /planos só com preços públicos.
const pageIds = Object.keys(localeRoutes.pt.pages).filter(
  (page) => publishedPageIds.includes(page) && (pricesShown || page !== 'plans'),
);
// As páginas de produto moram em /produtos/<produto>; /produtos é a lista com todos.
const isProductPage = (page) =>
  localeRoutes.pt.pages[page].startsWith(`${localeRoutes.pt.pages.products}/`);
// As regras de texto da spec no inglês (as do português e do espanhol estão no teste do catálogo, e
// a moeda com número no pricePattern): nada de "intelligent", "smart", "generated", "algorithm",
// "100% real" nem "unedited", e nada de "starting at", "from" ou "as low as" com preço.
const englishRules =
  /\bintelligen(?:t|ce)\b|\bsmart\b|\bgenerat(?:e|ed|es|ing)\b|\balgorithms?\b|100\s*%\s*real|\bunedited\b|\b(?:starting at|from|as low as)\s*(?:\$|€|£)/i;
const pathOf = (file) => `/${file.replace(/\/?index\.html$/, '')}`;
const routes = locales.flatMap((locale) =>
  pageIds.map((page) => ({ locale, page, file: locale.pages[page] })),
);
const allFiles = async (directory) =>
  (
    await Promise.all(
      (await readdir(directory, { withFileTypes: true })).map(async (entry) =>
        entry.isDirectory()
          ? allFiles(path.join(directory, entry.name))
          : path.join(directory, entry.name),
      ),
    )
  ).flat();
const decode = (value) =>
  value
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&amp;', '&');
// Todo texto que a pessoa lê ou ouve: nós de texto, atributos de texto e o JSON-LD. Fica de
// fora o que está marcado em português de propósito (lang="pt-BR", o "Português" do seletor).
const readableText = (html) => {
  const jsonLd = [
    ...html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs),
  ].flatMap((match) => {
    const strings = [];
    const collect = (value, key) => {
      if (typeof value === 'string') {
        if (!['@context', '@type', '@id', 'url', 'logo', 'email'].includes(key))
          strings.push(value);
      } else if (value && typeof value === 'object')
        for (const [child, item] of Object.entries(value)) collect(item, child);
    };
    collect(JSON.parse(match[1]));
    return strings;
  });
  const body = html
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/<(\w+)[^>]*\blang="pt-BR"[^>]*>[\s\S]*?<\/\1>/g, '');
  const nodes = [...body.matchAll(/>([^<]+)</g)].map((match) => match[1]);
  const attributes = [
    ...body.matchAll(
      /\s(?:alt|aria-label|title|placeholder|value|data-greeting|data-closing|data-summary|data-label-[\w-]+|data-status-[\w-]+|data-carousel-format|data-messages)="([^"]*)"/g,
    ),
    ...body.matchAll(
      /<meta (?:name|property)="(?:description|og:title|og:description|og:image:alt|twitter:title|twitter:description|twitter:image:alt)" content="([^"]*)"/g,
    ),
  ].map((match) => match[1]);
  // E-mails e domínios (arpvision@outlook.com.br, arpvision.app) não são texto em português.
  return [...nodes, ...attributes, ...jsonLd]
    .map((text) =>
      decode(text).replace(/[\w.+-]+@[\w.-]+|(?:https?:\/\/)?[\w-]+(?:\.[\w-]+)+(?:\/\S*)?/g, ''),
    )
    .filter((text) => text.trim());
};
let verifiedLinks = 0;
const canonicalOrigins = new Set();
for (const { locale, page, file } of routes) {
  const route = file;
  const html = await readFile(path.join('dist', file), 'utf8');
  assert.match(html, new RegExp(`<html[^>]+lang="${locale.lang}"`), `${route}: lang`);
  assert.equal((html.match(/<h1[ >]/g) || []).length, 1, `${route}: exatamente um h1`);
  for (const meta of ['description', 'og:title', 'og:description', 'og:image', 'twitter:card'])
    assert.ok(html.includes(`="${meta}"`), `${route}: ${meta}`);
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  assert.ok(canonical, `${route}: canonical`);
  assert.equal(
    new URL(canonical).pathname,
    pathOf(file),
    `${route}: canonical aponta para a própria página`,
  );
  assert.ok(
    html.includes(`property="og:url" content="${canonical}"`),
    `${route}: og:url = canonical`,
  );
  // hreflang: a mesma página em cada idioma, mais o x-default em português.
  const alternates = Object.fromEntries(
    [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)].map((match) => [
      match[1],
      match[2],
    ]),
  );
  assert.deepEqual(
    Object.keys(alternates).sort(),
    [...locales.map((item) => item.lang), 'x-default'].sort(),
    `${route}: hreflang de todos os idiomas e x-default`,
  );
  for (const other of locales)
    assert.equal(
      new URL(alternates[other.lang]).pathname,
      pathOf(other.pages[page]),
      `${route}: hreflang ${other.lang}`,
    );
  assert.equal(alternates[locale.lang], canonical, `${route}: hreflang do próprio idioma`);
  assert.equal(
    new URL(alternates['x-default']).pathname,
    pathOf(locales[0].pages[page]),
    `${route}: x-default em português`,
  );
  assert.ok(
    html.includes(`property="og:locale" content="${locale.ogLocale}"`),
    `${route}: og:locale`,
  );
  for (const other of locales.filter((item) => item !== locale))
    assert.ok(
      html.includes(`property="og:locale:alternate" content="${other.ogLocale}"`),
      `${route}: og:locale:alternate`,
    );
  canonicalOrigins.add(new URL(canonical).origin);
  assert.ok(!html.includes('{{'), `${route}: sem placeholders brutos`);
  // O tour embutido na hero carrega com a página; qualquer outro iframe só após interação.
  const iframes = html.match(/<iframe[^>]*>/g) || [];
  assert.ok(
    iframes.every((tag) => tag.includes('class="hero-embed"')),
    `${route}: iframe só após interação (exceto o tour da hero)`,
  );
  for (const tag of iframes)
    assert.equal(
      new URL(decode(tag.match(/src="([^"]+)"/)[1])).searchParams.get('idioma'),
      locale.code === 'pt' ? null : locale.code,
      `${route}: tour embutido no idioma da página`,
    );
  for (const match of html.matchAll(/(?:href|src|poster)="(\/[^"?#]*)(?:[?#][^"]*)?"/g)) {
    const destination = path.join('dist', decodeURIComponent(match[1]));
    let exists = false;
    try {
      exists =
        (await stat(destination)).isFile() ||
        (await stat(path.join(destination, 'index.html'))).isFile();
    } catch {}
    assert.ok(exists, `${route}: destino local existe: ${match[1]}`);
    verifiedLinks++;
  }
  for (const match of html.matchAll(
    /href="(https:\/\/arpvision\.app\/(?:register|login)[^"]*)"/g,
  )) {
    const url = new URL(decode(match[1]));
    assert.equal(url.searchParams.get('utm_source'), 'site');
    assert.ok(url.searchParams.get('utm_medium'));
    assert.equal(url.searchParams.get('utm_campaign'), 'landing');
    assert.equal(
      url.searchParams.get('idioma'),
      locale.code === 'pt' ? null : locale.code,
      `${route}: link do app no idioma da página`,
    );
  }
  const schemas = [
    ...html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs),
  ].flatMap((match) => JSON.parse(match[1]));
  // O VideoObject dos tutoriais leva o idioma do vídeo, narrado em português em todos os idiomas.
  for (const item of schemas.filter((item) => 'inLanguage' in item))
    assert.equal(
      item.inLanguage,
      item['@type'] === 'VideoObject' ? 'pt-BR' : locale.lang,
      `${route}: JSON-LD ${item['@type']} no idioma`,
    );
  if (page === 'home' || isProductPage(page)) {
    // O FAQPage é o FAQ que aparece na página, no idioma dela: cada pergunta e cada resposta no
    // HTML sem os <script>, porque o próprio JSON-LD já traz o texto.
    const visible = decode(html.replace(/<script[\s\S]*?<\/script>/g, ''));
    const questions = schemas.find((item) => item['@type'] === 'FAQPage')?.mainEntity ?? [];
    assert.ok(questions.length > 0, `${route}: FAQPage`);
    for (const question of questions) {
      assert.ok(
        visible.includes(question.name),
        `${route}: pergunta do FAQPage na página: ${question.name}`,
      );
      assert.ok(
        visible.includes(question.acceptedAnswer.text),
        `${route}: resposta do FAQPage na página: ${question.acceptedAnswer.text}`,
      );
    }
  }
  // Cada produto é um Service; a página com todos os produtos é uma ItemList.
  const types = schemas.map((item) => item['@type']);
  if (isProductPage(page)) assert.ok(types.includes('Service'), `${route}: JSON-LD Service`);
  if (page === 'products') assert.ok(types.includes('ItemList'), `${route}: JSON-LD ItemList`);
  // Nas páginas de produto, a cotação e a faixa azul não falam do tour: sem a linha do teste
  // grátis e sem o "Criar conta grátis" da faixa.
  if (isProductPage(page)) {
    assert.ok(!html.includes('quote-trial'), `${route}: sem a linha do teste grátis`);
    assert.ok(!html.includes('data-cta="chamada-final"'), `${route}: faixa sem o cadastro`);
  }
  if (page === 'tutorials') {
    // Um VideoObject por cartão, com o título que o cartão mostra, no idioma da página.
    const titles = [...html.matchAll(/data-title="([^"]+)"/g)].map((match) => decode(match[1]));
    assert.ok(titles.length > 0, `${route}: cartões dos tutoriais`);
    assert.deepEqual(
      schemas.filter((item) => item['@type'] === 'VideoObject').map((item) => item.name),
      titles,
      `${route}: VideoObject de cada cartão`,
    );
  }
  // Cabeçalho, menu do celular e rodapé levam aos tutoriais do idioma da página; os dos outros
  // idiomas só aparecem no seletor de idioma, que leva hreflang.
  for (const other of locales)
    assert.equal(
      html.match(new RegExp(`<a href="${pathOf(other.pages.tutorials)}"(?! hreflang)`, 'g'))
        ?.length ?? 0,
      other === locale ? 3 : 0,
      `${route}: links para os tutoriais em ${other.lang}`,
    );
  if (locale.code !== 'pt')
    for (const text of readableText(html))
      assert.doesNotMatch(
        text,
        portugueseWordsIn(locale.code),
        `${route}: português na página: "${text}"`,
      );
  if (locale.code === 'en')
    for (const text of readableText(html))
      assert.doesNotMatch(text, englishRules, `${route}: regra de texto do inglês: "${text}"`);
  if (isProductPage(page) || page === 'products')
    assert.ok(
      html
        .match(/property="og:image" content="([^"]+)"/)?.[1]
        .endsWith(`/images/${locale.ogImage}`),
      `${route}: imagem de compartilhamento do idioma (${locale.ogImage})`,
    );
  // Seletor de idioma: leva à mesma página em cada idioma, cada opção com o lang dela, no
  // cabeçalho (compacto), no menu do celular e no rodapé.
  for (const other of locales)
    assert.equal(
      html.split(
        `href="${pathOf(other.pages[page])}" hreflang="${other.lang}" lang="${other.lang}" data-language-choice="${other.code}"`,
      ).length - 1,
      3,
      `${route}: seletor leva a ${other.lang}`,
    );
  assert.equal(
    (html.match(/<details class="language-menu desktop-language" data-language-menu>/g) || [])
      .length,
    1,
    `${route}: seletor compacto no cabeçalho`,
  );
  for (const text of suggestionTexts)
    assert.ok(!html.includes(text), `${route}: texto da faixa de sugestão no HTML: ${text}`);
  assert.ok(html.includes('<template id="language-suggestion">'), `${route}: molde da faixa`);
  if (!pricesShown) {
    assert.doesNotMatch(html, pricePattern, `${route}: nenhum preço em reais ou em euros`);
    assert.ok(!html.includes('"offers"'), `${route}: JSON-LD sem ofertas com preço`);
    assert.ok(
      !html.includes(`href="${pathOf(locale.pages.plans)}"`),
      `${route}: sem link para a página de planos`,
    );
  }
}
if (!pricesShown)
  for (const locale of locales) {
    const home = pathOf(locale.pages.home);
    const plans = await readFile(path.join('dist', locale.pages.plans), 'utf8');
    assert.ok(
      plans.includes(`url=${home}#${locale.quote}"`),
      `${locale.pages.plans} redireciona para a cotação`,
    );
    assert.match(plans, /name="robots" content="noindex"/, `${locale.pages.plans} fora do índice`);
    const html = await readFile(path.join('dist', locale.pages.home), 'utf8');
    assert.ok(html.includes(`id="${locale.quote}"`), `${home}: seção de cotação`);
    assert.match(
      html,
      /<a href="https:\/\/wa\.me\/\d+\?text=[^"]+" class="[^"]*quote-submit/,
      `${home}: botão da cotação abre o WhatsApp com mensagem pronta`,
    );
  }
// O build tem só as páginas publicadas: fora os redirecionamentos (/planos sem preços), cada
// index.html de dist é uma das rotas verificadas acima, e nenhuma falta.
const built = [];
for (const file of await allFiles('dist'))
  if (
    path.basename(file) === 'index.html' &&
    !(await readFile(file, 'utf8')).includes('http-equiv="refresh"')
  )
    built.push(path.relative('dist', file).split(path.sep).join('/'));
assert.deepEqual(
  built.sort(),
  routes.map(({ file }) => file).sort(),
  'as páginas do build são as publicadas em src/i18n/routes.ts',
);
// ARP Vision Presencial, só em português (atende Porto Alegre e região). Em toda página, o
// treinamento e o Tour Pronto ficam no grupo "Com a nossa equipe" do menu Produtos (no painel do
// desktop e no grupo do celular) e levam à seção dele na Home; o item "Presencial" saiu do topo.
// Nos outros idiomas, nada dele. Vale com ou sem preços.
for (const { locale, page, file } of routes) {
  const html = await readFile(path.join('dist', file), 'utf8');
  const inPersonItems = [
    ...html.matchAll(
      /<a class="products-item" href="([^"]*)" data-product="(training|readyTour)"/g,
    ),
  ].map((match) => `${match[2]} ${match[1]}`);
  if (locale.code === 'pt') {
    const section = page === 'home' ? '#presencial' : `${pathOf(locale.pages.home)}#presencial`;
    assert.deepEqual(
      inPersonItems,
      ['training', 'readyTour', 'training', 'readyTour'].map((id) => `${id} ${section}`),
      `${file}: o Presencial no menu Produtos leva à seção dele`,
    );
  } else
    assert.ok(
      !inPersonItems.length && !html.includes('#presencial') && !html.includes('id="presencial"'),
      `${file}: sem o Presencial`,
    );
  assert.ok(!html.includes('data-spy="presencial"'), `${file}: o Presencial fora do topo`);
}
// A seção na Home, com o WhatsApp levando a mensagem do serviço.
for (const locale of locales) {
  const home = pathOf(locale.pages.home);
  const html = await readFile(path.join('dist', locale.pages.home), 'utf8');
  const inPerson = html.match(/<section[^>]+id="presencial"[\s\S]*?<\/section>/)?.[0];
  if (locale.code === 'pt') {
    assert.ok(inPerson, `${home}: seção Presencial`);
    assert.equal(
      decodeURIComponent(inPerson.match(/href="https:\/\/wa\.me\/\d+\?text=([^"]+)"/)?.[1] ?? ''),
      'Olá! Vim pelo site e quero saber do ARP Vision Presencial.',
      `${home}: botão do Presencial abre o WhatsApp com a mensagem do serviço`,
    );
  } else assert.ok(!inPerson, `${home}: sem a seção do Presencial`);
  // Com "Tour real" o menu só cabe no cabeçalho compacto, ligado por data-long-nav.
  assert.equal(
    /<header[^>]+data-long-nav/.test(html),
    html.includes('data-spy="tour-real"'),
    `${home}: cabeçalho compacto exatamente quando o menu tem "Tour real"`,
  );
}
// Página 404: fala os três idiomas, fica fora do índice, não aponta canonical e não tem a
// faixa de sugestão de idioma.
const notFound = await readFile('dist/404.html', 'utf8');
assert.match(notFound, /name="robots" content="noindex/, '404 fora do índice');
assert.ok(!notFound.includes('rel="canonical"'), '404 sem canonical');
assert.equal((notFound.match(/<h1[ >]/g) || []).length, 1, '404: um h1');
assert.ok(
  notFound.includes('Página não encontrada') &&
    notFound.includes('Página no encontrada') &&
    notFound.includes('Page not found'),
  '404 nos três idiomas',
);
assert.ok(notFound.includes('lang="es-ES"'), '404: o bloco em espanhol marcado como espanhol');
assert.ok(notFound.includes('lang="en"'), '404: o bloco em inglês marcado como inglês');
for (const locale of locales)
  assert.ok(
    notFound.includes(`href="${pathOf(locale.pages.home)}" hreflang="${locale.lang}"`),
    `404: volta ao início em ${locale.lang}`,
  );
assert.ok(!notFound.includes('language-suggestion'), '404 sem a faixa de sugestão de idioma');
for (const text of suggestionTexts)
  assert.ok(!notFound.includes(text), `404: texto da faixa de sugestão no HTML: ${text}`);
const files = await allFiles('dist/_astro');
let jsBytes = 0;
for (const file of files.filter((file) => file.endsWith('.js'))) jsBytes += (await stat(file)).size;
assert.ok(jsBytes < 100 * 1024, `JavaScript total abaixo de 100 KB: ${jsBytes}`);
// Canonical, sitemap e robots no mesmo domínio: se divergirem, o Google vê um redirecionamento e não indexa.
assert.equal(canonicalOrigins.size, 1, `um só domínio nos canonicals: ${[...canonicalOrigins]}`);
const [canonicalOrigin] = canonicalOrigins;
const sitemap = await readFile('dist/sitemap.xml', 'utf8');
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
for (const loc of locs)
  assert.equal(new URL(loc).origin, canonicalOrigin, `sitemap no domínio canônico: ${loc}`);
assert.deepEqual(
  locs.map((loc) => new URL(loc).pathname).sort(),
  routes.map(({ file }) => pathOf(file)).sort(),
  'sitemap com cada página em cada idioma (e /planos só com preços)',
);
for (const locale of locales)
  assert.match(
    sitemap,
    new RegExp(
      `<loc>${canonicalOrigin}${pathOf(locale.pages.home)}</loc>(<changefreq>[^<]+</changefreq>)?<priority>1\\.0</priority>`,
    ),
    `Home ${locale.lang} no sitemap com prioridade máxima`,
  );
assert.equal(
  (sitemap.match(/hreflang="x-default"/g) || []).length,
  locs.length,
  'sitemap com as versões de cada página',
);
const robots = await readFile('dist/robots.txt', 'utf8');
assert.ok(
  robots.includes(`Sitemap: ${canonicalOrigin}/sitemap.xml`),
  'robots aponta o sitemap do domínio canônico',
);
console.log(
  `${routes.length} rotas HTML verificadas em ${locales.length} idiomas (as publicadas em src/i18n/routes.ts, ${pageIds.filter(isProductPage).length} de produto)${pricesShown ? '' : ` (preços ocultos: cotação na Home, ${locales.map((locale) => pathOf(locale.pages.plans)).join(', ')} redirecionam)`}; ${verifiedLinks} referências locais válidas; ${(jsBytes / 1024).toFixed(1)} KB de JavaScript total (sem gzip). Sitemap, hreflang, robots, 404, metadados, schemas (FAQPage com perguntas e respostas na página, Service nos produtos), UTMs, seletor, faixa de sugestão só no navegador e idioma das páginas válidos.`,
);
