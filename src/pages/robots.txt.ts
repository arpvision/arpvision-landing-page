import { site } from '../config/site';
export function GET() {
  return new Response(
    `User-agent: *\n${site.readyToIndex ? 'Allow: /' : 'Disallow: /'}\nSitemap: ${site.domain}/sitemap.xml\n`,
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
}
