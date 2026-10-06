// Lê o site como o Googlebot: robots.txt → sitemap → cada página, sem seguir redirecionamentos.
// Uso: node scripts/seo-check.mjs [origem]
//   Prévia local (padrão http://127.0.0.1:4321): as URLs do sitemap são pedidas na prévia.
//   Produção (ex.: https://www.arpvision.com.br): as URLs do sitemap são pedidas como estão;
//   qualquer redirecionamento ou noindex reprova.
import assert from 'node:assert/strict';
const origin = (process.argv[2] || 'http://127.0.0.1:4321').replace(/\/$/, '');
const isLocal = /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(origin);
const at = (url) => (isLocal ? origin + new URL(url).pathname : url);
const get = async (url) => {
  const response = await fetch(url, {
    redirect: 'manual',
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    },
  });
  assert.equal(
    response.status,
    200,
    `${url}: esperado 200 sem redirecionamento, recebido ${response.status} ${response.headers.get('location') ?? ''}`,
  );
  assert.doesNotMatch(
    response.headers.get('x-robots-tag') ?? '',
    /noindex|none/i,
    `${url}: X-Robots-Tag`,
  );
  return response.text();
};

const robots = await get(`${origin}/robots.txt`);
assert.doesNotMatch(robots, /^Disallow:\s*\/\s*$/m, 'robots.txt bloqueia o site inteiro');
const sitemapUrl = robots.match(/^Sitemap:\s*(\S+)/m)?.[1];
assert.ok(sitemapUrl, 'robots.txt sem Sitemap');
const locs = [...(await get(at(sitemapUrl))).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
assert.ok(locs.length > 0, 'sitemap vazio');

for (const loc of locs) {
  const html = await get(at(loc));
  const head = html.slice(0, html.indexOf('</head>'));
  const attr = (pattern) => head.match(pattern)?.[1];
  const title = attr(/<title>([^<]*)<\/title>/);
  const description = attr(/<meta name="description" content="([^"]*)"/);
  assert.equal(attr(/<link rel="canonical" href="([^"]+)"/), loc, `${loc}: canonical`);
  assert.equal(attr(/<meta property="og:url" content="([^"]+)"/), loc, `${loc}: og:url`);
  assert.doesNotMatch(
    attr(/<meta name="robots" content="([^"]*)"/) ?? '',
    /noindex/,
    `${loc}: noindex`,
  );
  assert.ok(title?.includes('ARP Vision'), `${loc}: título com a marca`);
  assert.ok(description && description.length <= 160, `${loc}: description até 160 caracteres`);
  if (new URL(loc).pathname === '/')
    assert.ok(description.length >= 140, `${loc}: description da Home com 140+ caracteres`);
  for (const meta of ['og:title', 'og:description', 'og:image', 'twitter:card', 'twitter:image'])
    assert.ok(head.includes(`="${meta}"`), `${loc}: ${meta}`);
  const types = [
    ...head.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs),
  ]
    .flatMap((m) => JSON.parse(m[1]))
    .map((item) => item['@type']);
  assert.ok(types.includes('Organization'), `${loc}: JSON-LD Organization`);
  const h1s = html.match(/<h1[ >][\s\S]*?<\/h1>/g) ?? [];
  assert.equal(h1s.length, 1, `${loc}: exatamente um h1`);
  const h1 = h1s[0]
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  assert.ok(h1, `${loc}: h1 com texto no HTML inicial`);
  console.log(
    `✓ ${loc}\n  título (${title.length}): ${title}\n  description: ${description.length} caracteres\n  h1: ${h1}\n  JSON-LD: ${types.join(', ')}`,
  );
}
console.log(
  `\n${locs.length} URLs do sitemap respondem 200, sem noindex e com canonical para si mesmas.`,
);
