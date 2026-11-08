import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { portugueseWords } from './portuguese-words.mjs';
import { publishedPageIds, routes as localeRoutes } from '../src/i18n/routes.ts';
// Sem preços públicos (site.pricing.showPrices), /planos é só um redirecionamento.
const pricesShown = !(await readFile('dist/planos/index.html', 'utf8')).includes(
  'http-equiv="refresh"',
);
// O arquivo de cada endereço no build: "/" é index.html, "/es/planes" é es/planes/index.html.
const fileOf = (route) => `${route.slice(1)}/index.html`.replace(/^\//, '');
// Cada página existe em cada idioma, com os endereços de src/i18n/routes.ts; o português mora
// na raiz e o espanhol em /es.
const locales = [
  { code: 'pt', lang: 'pt-BR', ogLocale: 'pt_BR' },
  { code: 'es', lang: 'es-ES', ogLocale: 'es_ES' },
].map((locale) => ({
  ...locale,
  quote: localeRoutes[locale.code].anchors.quote,
  pages: Object.fromEntries(
    Object.entries(localeRoutes[locale.code].pages).map(([page, route]) => [page, fileOf(route)]),
  ),
}));
// Só as páginas publicadas, na ordem de routes.ts; /planos só com preços públicos.
const pageIds = Object.keys(localeRoutes.pt.pages).filter(
  (page) => publishedPageIds.includes(page) && (pricesShown || page !== 'plans'),
);
// As páginas de produto moram em /produtos/<produto>; /produtos é a lista com todos.
const isProductPage = (page) =>
  localeRoutes.pt.pages[page].startsWith(`${localeRoutes.pt.pages.products}/`);
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
  // O VideoObject dos tutoriais leva o idioma do vídeo, narrado em português nos dois idiomas.
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
  // Cabeçalho, menu do celular e rodapé levam aos tutoriais do idioma da página; os do outro
  // idioma só aparecem no seletor PT | ES, que leva hreflang.
  for (const other of locales)
    assert.equal(
      html.match(new RegExp(`<a href="${pathOf(other.pages.tutorials)}"(?! hreflang)`, 'g'))
        ?.length ?? 0,
      other === locale ? 3 : 0,
      `${route}: links para os tutoriais em ${other.lang}`,
    );
  if (locale.code !== 'pt')
    for (const text of readableText(html))
      assert.doesNotMatch(text, portugueseWords, `${route}: português na página: "${text}"`);
  // Seletor de idioma: leva à mesma página em cada idioma.
  for (const other of locales)
    assert.ok(
      html.includes(`href="${pathOf(other.pages[page])}" hreflang="${other.lang}"`),
      `${route}: seletor leva a ${other.lang}`,
    );
  if (!pricesShown) {
    assert.doesNotMatch(html, /R\$(?:\s|&nbsp;)*\d/, `${route}: nenhum valor em reais`);
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
// Página 404: fala os dois idiomas, fica fora do índice e não aponta canonical.
const notFound = await readFile('dist/404.html', 'utf8');
assert.match(notFound, /name="robots" content="noindex/, '404 fora do índice');
assert.ok(!notFound.includes('rel="canonical"'), '404 sem canonical');
assert.equal((notFound.match(/<h1[ >]/g) || []).length, 1, '404: um h1');
assert.ok(notFound.includes('Página não encontrada') && notFound.includes('Página no encontrada'));
assert.ok(notFound.includes('lang="es-ES"'), '404: o bloco em espanhol marcado como espanhol');
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
  `${routes.length} rotas HTML verificadas em ${locales.length} idiomas (as publicadas em src/i18n/routes.ts, ${pageIds.filter(isProductPage).length} de produto)${pricesShown ? '' : ' (preços ocultos: cotação na Home, /planos e /es/planes redirecionam)'}; ${verifiedLinks} referências locais válidas; ${(jsBytes / 1024).toFixed(1)} KB de JavaScript total (sem gzip). Sitemap, hreflang, robots, 404, metadados, schemas (FAQPage com perguntas e respostas na página, Service nos produtos), UTMs e idioma das páginas válidos.`,
);
