import { site } from '../config/site';
export function GET() {
  // A Home é a página principal do site; as legais mudam pouco.
  const routes = [
    { path: '/', changefreq: 'weekly', priority: '1.0' },
    { path: '/planos', changefreq: 'weekly', priority: '0.8' },
    { path: '/termos-de-uso', changefreq: 'yearly', priority: '0.3' },
    { path: '/politica-de-privacidade', changefreq: 'yearly', priority: '0.3' },
  ];
  const escapeXml = (value: string) =>
    value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map((route) => `<url><loc>${escapeXml(new URL(route.path, site.domain).href)}</loc><changefreq>${route.changefreq}</changefreq><priority>${route.priority}</priority></url>`).join('')}</urlset>`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
}
