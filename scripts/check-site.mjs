import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
// Sem preços públicos (site.pricing.showPrices), /planos é só um redirecionamento.
const pricesShown = !(await readFile('dist/planos/index.html', 'utf8')).includes(
  'http-equiv="refresh"',
);
const routes = [
  'index.html',
  ...(pricesShown ? ['planos/index.html'] : []),
  'termos-de-uso/index.html',
  'politica-de-privacidade/index.html',
];
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
let verifiedLinks = 0;
const canonicalOrigins = new Set();
for (const route of routes) {
  const html = await readFile(path.join('dist', route), 'utf8');
  assert.match(html, /<html[^>]+lang="pt-BR"/);
  assert.equal((html.match(/<h1[ >]/g) || []).length, 1, `${route}: exatamente um h1`);
  for (const meta of ['description', 'og:title', 'og:description', 'og:image', 'twitter:card'])
    assert.ok(html.includes(`="${meta}"`), `${route}: ${meta}`);
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  assert.ok(canonical, `${route}: canonical`);
  assert.equal(
    new URL(canonical).pathname,
    `/${route.replace(/\/?index\.html$/, '')}`,
    `${route}: canonical aponta para a própria página`,
  );
  assert.ok(
    html.includes(`property="og:url" content="${canonical}"`),
    `${route}: og:url = canonical`,
  );
  canonicalOrigins.add(new URL(canonical).origin);
  assert.ok(!html.includes('{{'), `${route}: sem placeholders brutos`);
  // O tour embutido na hero carrega com a página; qualquer outro iframe só após interação.
  assert.ok(
    (html.match(/<iframe[^>]*>/g) || []).every((tag) => tag.includes('class="hero-embed"')),
    `${route}: iframe só após interação (exceto o tour da hero)`,
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
    const url = new URL(match[1].replaceAll('&amp;', '&'));
    assert.equal(url.searchParams.get('utm_source'), 'site');
    assert.ok(url.searchParams.get('utm_medium'));
    assert.equal(url.searchParams.get('utm_campaign'), 'landing');
  }
  for (const match of html.matchAll(
    /<script[^>]+type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs,
  ))
    JSON.parse(match[1]);
  if (!pricesShown) {
    assert.doesNotMatch(html, /R\$(?:\s|&nbsp;)*\d/, `${route}: nenhum valor em reais`);
    assert.ok(!html.includes('"offers"'), `${route}: JSON-LD sem ofertas com preço`);
    assert.ok(!html.includes('href="/planos"'), `${route}: sem link para /planos`);
  }
}
if (!pricesShown) {
  const planos = await readFile('dist/planos/index.html', 'utf8');
  assert.match(planos, /url=\/#cotacao/, '/planos redireciona para a cotação');
  assert.match(planos, /name="robots" content="noindex"/, '/planos fora do índice');
  const home = await readFile('dist/index.html', 'utf8');
  assert.ok(home.includes('id="cotacao"'), 'Home com a seção de cotação');
  assert.match(
    home,
    /<a href="https:\/\/wa\.me\/\d+\?text=[^"]+" class="[^"]*quote-submit/,
    'botão da cotação abre o WhatsApp com mensagem pronta',
  );
}
const files = await allFiles('dist/_astro');
let jsBytes = 0;
for (const file of files.filter((file) => file.endsWith('.js'))) jsBytes += (await stat(file)).size;
assert.ok(jsBytes < 100 * 1024, `JavaScript total abaixo de 100 KB: ${jsBytes}`);
// Canonical, sitemap e robots no mesmo domínio: se divergirem, o Google vê um redirecionamento e não indexa.
assert.equal(canonicalOrigins.size, 1, `um só domínio nos canonicals: ${[...canonicalOrigins]}`);
const [canonicalOrigin] = canonicalOrigins;
const sitemap = await readFile('dist/sitemap.xml', 'utf8');
assert.ok(sitemap.includes('/politica-de-privacidade'));
assert.equal(sitemap.includes('/planos'), pricesShown, 'sitemap só lista /planos com preços');
for (const [, loc] of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g))
  assert.equal(new URL(loc).origin, canonicalOrigin, `sitemap no domínio canônico: ${loc}`);
assert.match(
  sitemap,
  new RegExp(
    `<loc>${canonicalOrigin}/</loc>(<changefreq>[^<]+</changefreq>)?<priority>1\\.0</priority>`,
  ),
  'Home no sitemap com prioridade máxima',
);
const robots = await readFile('dist/robots.txt', 'utf8');
assert.ok(
  robots.includes(`Sitemap: ${canonicalOrigin}/sitemap.xml`),
  'robots aponta o sitemap do domínio canônico',
);
console.log(
  `${routes.length} rotas HTML verificadas${pricesShown ? '' : ' (preços ocultos: cotação na Home, /planos redireciona)'}; ${verifiedLinks} referências locais válidas; ${(jsBytes / 1024).toFixed(1)} KB de JavaScript total (sem gzip). Sitemap, robots, metadados, schemas e UTMs válidos.`,
);
