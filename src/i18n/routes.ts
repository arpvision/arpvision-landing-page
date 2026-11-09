/**
 * Endereços de cada idioma: as páginas e as âncoras que aparecem na barra do navegador.
 * O espanhol e o inglês têm endereços no próprio idioma; o tipo obriga cada idioma a ter
 * todos. O script da faixa de sugestão de idioma também lê este mapa (para levar à página e
 * à âncora equivalentes), então ele não importa nada além de tipos.
 */
import type { Locale } from './locales';

export type PageId =
  | 'home'
  | 'plans'
  | 'tutorials'
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
  | 'inPerson'
  | 'plans'
  | 'quote'
  | 'faq'
  | 'contact'
  | 'compare';

interface LocaleRoutes {
  pages: Record<PageId, string>;
  anchors: Record<AnchorId, string>;
}

export const routes: Record<Locale, LocaleRoutes> = {
  pt: {
    pages: {
      home: '/',
      plans: '/planos',
      tutorials: '/tutoriais',
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
      inPerson: 'presencial',
      plans: 'planos',
      quote: 'cotacao',
      faq: 'duvidas',
      contact: 'contato',
      compare: 'comparar',
    },
  },
  es: {
    pages: {
      home: '/es',
      plans: '/es/planes',
      tutorials: '/es/tutoriales',
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
      // Sem a seção no espanhol (o Presencial é só de Porto Alegre e região); o tipo pede a âncora.
      inPerson: 'presencial',
      plans: 'planes',
      quote: 'cotizacion',
      faq: 'preguntas',
      contact: 'contacto',
      compare: 'comparar',
    },
  },
  en: {
    pages: {
      home: '/en',
      plans: '/en/plans',
      tutorials: '/en/tutorials',
      terms: '/en/terms-of-use',
      privacy: '/en/privacy-policy',
      products: '/en/products',
      productInstagram: '/en/products/autopilot-for-instagram',
      productAutochat: '/en/products/autochat',
      productVideos: '/en/products/videos-from-photos',
    },
    anchors: {
      content: 'content',
      howItWorks: 'how-it-works',
      realTour: 'real-tour',
      // Sem a seção no inglês (o Presencial é só de Porto Alegre e região); o tipo pede a âncora.
      inPerson: 'presencial',
      plans: 'plans',
      quote: 'quote',
      faq: 'faq',
      contact: 'contact',
      compare: 'compare',
    },
  },
};

/**
 * As páginas publicadas. Menu, rodapé, sitemap e checagens usam só estas: uma página nova entra
 * aqui quando fica pronta, e não antes. `plans` está na lista, mas só aparece com preços
 * públicos (`site.pricing.showPrices`). Este arquivo só tem `import type`, para os scripts de
 * checagem (Node) poderem importá-lo direto.
 */
export const publishedPageIds: readonly PageId[] = [
  'home',
  'plans',
  'tutorials',
  'terms',
  'privacy',
  'productInstagram',
  'productVideos',
  'productAutochat',
  'products',
];

export const pagePath = (locale: Locale, page: PageId) => routes[locale].pages[page];
export const anchorId = (locale: Locale, anchor: AnchorId) => routes[locale].anchors[anchor];
/** Seção de uma página a partir de qualquer outra: "/#cotacao", "/es#cotizacion", "/en#quote". */
export const sectionPath = (locale: Locale, page: PageId, anchor: AnchorId) =>
  `${pagePath(locale, page)}#${anchorId(locale, anchor)}`;
/** A página em que se está, pelo caminho do Astro (`Astro.url.pathname`). */
export const pageAt = (locale: Locale, pathname: string): PageId | undefined =>
  (Object.keys(routes[locale].pages) as PageId[]).find(
    (page) => routes[locale].pages[page] === pathname,
  );
