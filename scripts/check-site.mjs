import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const routes = [
  'index.html',
  'planos/index.html',
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
for (const route of routes) {
  const html = await readFile(path.join('dist', route), 'utf8');
  assert.match(html, /<html[^>]+lang="pt-BR"/);
  assert.equal((html.match(/<h1[ >]/g) || []).length, 1, `${route}: exatamente um h1`);
  for (const meta of ['description', 'og:title', 'og:description', 'og:image', 'twitter:card'])
    assert.ok(html.includes(`="${meta}"`), `${route}: ${meta}`);
  assert.match(html, /rel="canonical"/);
  assert.ok(!html.includes('{{'), `${route}: sem placeholders brutos`);
  assert.ok(!html.includes('<iframe'), `${route}: iframe só após interação`);
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
}
const files = await allFiles('dist/_astro');
let jsBytes = 0;
for (const file of files.filter((file) => file.endsWith('.js'))) jsBytes += (await stat(file)).size;
assert.ok(jsBytes < 100 * 1024, `JavaScript total abaixo de 100 KB: ${jsBytes}`);
assert.ok((await readFile('dist/sitemap.xml', 'utf8')).includes('/politica-de-privacidade'));
assert.ok((await readFile('dist/robots.txt', 'utf8')).includes('Sitemap:'));
console.log(
  `4 rotas HTML verificadas; ${verifiedLinks} referências locais válidas; ${(jsBytes / 1024).toFixed(1)} KB de JavaScript total (sem gzip). Sitemap, robots, metadados, schemas e UTMs válidos.`,
);
