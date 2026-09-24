import lighthouse from 'lighthouse';
import { launch } from 'chrome-launcher';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
await mkdir('.artifacts', { recursive: true });
await mkdir('.artifacts/lighthouse-profile', { recursive: true });
const chrome = await launch({
  chromePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  userDataDir: path.resolve('.artifacts/lighthouse-profile'),
  chromeFlags: ['--headless=new', '--disable-gpu', '--no-sandbox'],
});
const results = [];
try {
  for (const [label, route] of [
    ['home', '/'],
    ['planos', '/planos'],
  ]) {
    const report = await lighthouse(`http://127.0.0.1:4321${route}`, {
      port: chrome.port,
      output: 'json',
      logLevel: 'error',
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    });
    await writeFile(`.artifacts/lighthouse-${label}.json`, report.report);
    const result = {
      page: route,
      scores: Object.fromEntries(
        Object.entries(report.lhr.categories).map(([name, category]) => [
          name,
          Math.round(category.score * 100),
        ]),
      ),
      lcp: report.lhr.audits['largest-contentful-paint'].displayValue,
      cls: report.lhr.audits['cumulative-layout-shift'].displayValue,
      failures: Object.entries(report.lhr.audits)
        .filter(([, audit]) => audit.score !== null && audit.score < 0.9 && audit.details)
        .map(([id, audit]) => ({
          id,
          score: audit.score,
          title: audit.title,
          details: audit.details,
        })),
    };
    results.push(result);
    console.log(
      JSON.stringify({
        ...result,
        failures: result.failures.map(({ id, score, title }) => ({ id, score, title })),
      }),
    );
  }
  await writeFile('.artifacts/lighthouse-summary.json', JSON.stringify(results, null, 2));
} finally {
  chrome.kill();
}
