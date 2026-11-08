/**
 * Os produtos do site. O menu "Produtos", a página /produtos, o rodapé, o sitemap e os testes
 * saem desta lista, para nenhum esquecer um produto. O tour e o ARP Vision Presencial não têm
 * página própria e levam à home.
 */
import { locales, type Locale } from '../i18n';
import { available } from '../config/site';
import {
  anchorId,
  pageAt,
  pagePath,
  publishedPageIds,
  sectionPath,
  type AnchorId,
  type PageId,
} from '../i18n/routes';

export type ProductId = 'tour' | 'videos' | 'instagram' | 'autochat' | 'training' | 'readyTour';
/** Os grupos do menu: mostrar o imóvel, divulgar e atender, e o trabalho com a nossa equipe. */
export type ProductGroupId = 'show' | 'promote' | 'team';
export type ProductPageId = 'productInstagram' | 'productAutochat' | 'productVideos';

export interface Product {
  id: ProductId;
  group: ProductGroupId;
  /** Nome do ícone em `Icon.astro`. */
  icon: string;
  /** O selo "Novo" quer dizer produto novo, e não "em breve". */
  isNew: boolean;
  /** A página própria do produto. Sem ela (`null`), o item leva ao `target`. */
  page: ProductPageId | null;
  /** Aonde o item leva, com a seção da página quando houver. */
  target: { page: PageId; anchor?: AnchorId };
  /** Os idiomas em que o produto aparece. */
  locales: readonly Locale[];
}

export const productGroups: readonly ProductGroupId[] = ['show', 'promote', 'team'];

/** Na ordem do menu: os produtos de cada grupo ficam juntos, e os grupos seguem `productGroups`. */
export const products: readonly Product[] = [
  {
    id: 'tour',
    group: 'show',
    icon: 'camera',
    isNew: false,
    page: null,
    target: { page: 'home' },
    locales,
  },
  {
    id: 'videos',
    group: 'show',
    icon: 'video',
    isNew: true,
    page: 'productVideos',
    target: { page: 'productVideos' },
    locales,
  },
  {
    id: 'instagram',
    group: 'promote',
    icon: 'calendar',
    isNew: true,
    page: 'productInstagram',
    target: { page: 'productInstagram' },
    locales,
  },
  {
    id: 'autochat',
    group: 'promote',
    icon: 'message',
    isNew: true,
    page: 'productAutochat',
    target: { page: 'productAutochat' },
    locales,
  },
  {
    id: 'training',
    group: 'team',
    icon: 'users',
    isNew: false,
    page: null,
    target: { page: 'home', anchor: 'inPerson' },
    locales: ['pt'],
  },
  {
    id: 'readyTour',
    group: 'team',
    icon: 'home',
    isNew: false,
    page: null,
    target: { page: 'home', anchor: 'inPerson' },
    locales: ['pt'],
  },
];

/** As páginas próprias dos produtos, na ordem Piloto, Autochat, Vídeos. */
export const productPageIds: readonly ProductPageId[] = [
  'productInstagram',
  'productAutochat',
  'productVideos',
];

/**
 * Os produtos de um idioma, na ordem do catálogo. O grupo da equipe só entra com o Presencial
 * ligado (`available.inPerson`, a menos que `options.inPerson` diga o contrário).
 */
export function productsFor(locale: Locale, options: { inPerson?: boolean } = {}): Product[] {
  const inPerson = options.inPerson ?? available.inPerson;
  return products.filter(
    (product) => product.locales.includes(locale) && (inPerson || product.group !== 'team'),
  );
}

/** No ar: o produto sem página própria (tour, Presencial) ou com a página já publicada. */
export function isLive(product: Product): boolean {
  return product.page === null || publishedPageIds.includes(product.page);
}

/** Os produtos de `productsFor` que já estão no ar: é essa a lista que o visitante vê. */
export function liveProductsFor(locale: Locale, options?: { inPerson?: boolean }): Product[] {
  return productsFor(locale, options).filter(isLive);
}

/**
 * O endereço do item de menu. Com seção, a âncora local (`#presencial`) se a pessoa já está na
 * página do destino, e o caminho inteiro (`/#presencial`) se está em outra.
 */
export function productHref(locale: Locale, product: Product, currentPath: string): string {
  const { page, anchor } = product.target;
  if (!anchor) return pagePath(locale, page);
  return currentPath === pagePath(locale, page)
    ? `#${anchorId(locale, anchor)}`
    : sectionPath(locale, page, anchor);
}

/** O último segmento do endereço da página, igual nos dois idiomas. */
export function productSlug(locale: Locale, page: ProductPageId): string {
  const path = pagePath(locale, page);
  return path.slice(path.lastIndexOf('/') + 1);
}

/** O produto dono da página, para marcar o item atual do menu. */
export function productOfPage(page: PageId | undefined): Product | undefined {
  return page ? products.find((product) => product.page === page) : undefined;
}

/** As seções da home que toda página de produto também tem, com os mesmos ids. */
const productPageSections: readonly AnchorId[] = ['quote', 'faq'];

/**
 * O link do cabeçalho para uma seção da home. Fica na própria página quando ela tem a seção (a
 * home, e a página de produto na cotação e nas dúvidas); das outras, leva à home (`/#cotacao`).
 */
export function sectionHref(locale: Locale, anchor: AnchorId, currentPath: string): string {
  const page = pageAt(locale, currentPath);
  const local =
    page === 'home' || (productOfPage(page) !== undefined && productPageSections.includes(anchor));
  return local ? `#${anchorId(locale, anchor)}` : sectionPath(locale, 'home', anchor);
}
