/**
 * Endereços de cada idioma: as páginas e as âncoras que aparecem na barra do navegador.
 * O espanhol tem endereços em espanhol; o tipo obriga cada idioma a ter todos.
 */
import type { Locale } from '.';

export type PageId =
  | 'home'
  | 'plans'
  | 'terms'
  | 'privacy'
  | 'products'
  | 'productInstagram'
  | 'productAutochat'
  | 'productVideos';
export type AnchorId =
  | 'content'
  | 'howItWorks'
  | 'realTour'
  | 'plans'
  | 'quote'
  | 'faq'
  | 'contact'
  | 'compare'
  | 'inPerson';

interface LocaleRoutes {
  pages: Record<PageId, string>;
  anchors: Record<AnchorId, string>;
}

export const routes: Record<Locale, LocaleRoutes> = {
  pt: {
    pages: {
      home: '/',
      plans: '/planos',
      terms: '/termos-de-uso',
      privacy: '/politica-de-privacidade',
      products: '/produtos',
      productInstagram: '/produtos/piloto-automatico-para-instagram',
      productAutochat: '/produtos/autochat',
      productVideos: '/produtos/videos-a-partir-de-fotos',
    },
    anchors: {
      content: 'conteudo',
      howItWorks: 'como-funciona',
      realTour: 'tour-real',
      plans: 'planos',
      quote: 'cotacao',
      faq: 'duvidas',
      contact: 'contato',
      compare: 'comparar',
      inPerson: 'presencial',
    },
  },
  es: {
    pages: {
      home: '/es',
      plans: '/es/planes',
      terms: '/es/terminos-de-uso',
      privacy: '/es/politica-de-privacidad',
      products: '/es/productos',
      productInstagram: '/es/productos/piloto-automatico-para-instagram',
      productAutochat: '/es/productos/autochat',
      productVideos: '/es/productos/videos-a-partir-de-fotos',
    },
    anchors: {
      content: 'contenido',
      howItWorks: 'como-funciona',
      realTour: 'tour-real',
      plans: 'planes',
      quote: 'cotizacion',
      faq: 'preguntas',
      contact: 'contacto',
      compare: 'comparar',
      inPerson: 'presencial',
    },
  },
};

/**
 * As páginas publicadas. Menu, rodapé, sitemap e checagens usam só estas: uma página nova entra
 * aqui quando fica pronta, e não antes. `plans` está na lista, mas só aparece com preços
 * públicos (`site.pricing.showPrices`). Este arquivo só tem `import type`, para os scripts de
 * checagem (Node) poderem importá-lo direto.
 */
export const publishedPageIds: readonly PageId[] = ['home', 'plans', 'terms', 'privacy'];

export const pagePath = (locale: Locale, page: PageId) => routes[locale].pages[page];
export const anchorId = (locale: Locale, anchor: AnchorId) => routes[locale].anchors[anchor];
/** Seção de uma página a partir de qualquer outra: "/#cotacao", "/es#cotizacion". */
export const sectionPath = (locale: Locale, page: PageId, anchor: AnchorId) =>
  `${pagePath(locale, page)}#${anchorId(locale, anchor)}`;
/** A página em que se está, pelo caminho do Astro (`Astro.url.pathname`). */
export const pageAt = (locale: Locale, pathname: string): PageId | undefined =>
  (Object.keys(routes[locale].pages) as PageId[]).find(
    (page) => routes[locale].pages[page] === pathname,
  );
