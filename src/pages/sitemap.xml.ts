import { site } from '../config/site';
import { defaultLocale, localeInfo, locales } from '../i18n';
import { pagePath, type PageId } from '../i18n/routes';
export function GET() {
  // A Home é a página principal do site; os tutoriais crescem aos poucos; as legais mudam pouco.
  // /planos só entra com preços públicos; sem eles, a rota redireciona para a cotação.
  // Cada página entra uma vez por idioma, com as versões dos outros idiomas (hreflang).
  const pages: { page: PageId; changefreq: string; priority: string }[] = [
    { page: 'home', changefreq: 'weekly', priority: '1.0' },
    ...(site.pricing.showPrices
      ? [{ page: 'plans' as const, changefreq: 'weekly', priority: '0.8' }]
      : []),
    { page: 'tutorials', changefreq: 'monthly', priority: '0.6' },
    { page: 'terms', changefreq: 'yearly', priority: '0.3' },
    { page: 'privacy', changefreq: 'yearly', priority: '0.3' },
  ];
  const escapeXml = (value: string) =>
    value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;');
  const url = (path: string) => escapeXml(new URL(path, site.domain).href);
  const alternates = (page: PageId) =>
    [
      ...locales.map((locale) => [localeInfo[locale].lang, pagePath(locale, page)]),
      ['x-default', pagePath(defaultLocale, page)],
    ]
      .map(
        ([hreflang, path]) =>
          `<xhtml:link rel="alternate" hreflang="${hreflang}" href="${url(path)}"/>`,
      )
      .join('');
  const entries = locales.flatMap((locale) =>
    pages.map(
      (route) =>
        `<url><loc>${url(pagePath(locale, route.page))}</loc><changefreq>${route.changefreq}</changefreq><priority>${route.priority}</priority>${alternates(route.page)}</url>`,
    ),
  );
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${entries.join('')}</urlset>`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
}
