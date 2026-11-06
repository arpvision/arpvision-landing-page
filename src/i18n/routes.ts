/**
 * Endereços de cada idioma: as páginas e as âncoras que aparecem na barra do navegador.
 * O espanhol tem endereços em espanhol; o tipo obriga cada idioma a ter todos.
 */
import type { Locale } from '.';

export type PageId = 'home' | 'plans' | 'terms' | 'privacy';
export type AnchorId =
  'content' | 'howItWorks' | 'realTour' | 'plans' | 'quote' | 'faq' | 'contact' | 'compare';

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
    },
  },
  es: {
    pages: {
      home: '/es',
      plans: '/es/planes',
      terms: '/es/terminos-de-uso',
      privacy: '/es/politica-de-privacidad',
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
    },
  },
};

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
