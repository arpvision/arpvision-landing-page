import { site } from '../config/site';
export function GET() {
  const routes = ['/', '/planos', '/termos-de-uso', '/politica-de-privacidade'];
  const escapeXml = (value: string) =>
    value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map((route) => `<url><loc>${escapeXml(new URL(route, site.domain).href)}</loc></url>`).join('')}</urlset>`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
}
