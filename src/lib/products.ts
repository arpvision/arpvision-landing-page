/**
 * Os produtos do site. O menu "Produtos", a página /produtos, o rodapé, a faixa da home, o
 * "Conheça também", a ItemList e os testes saem desta lista, para nenhum esquecer um produto. O
 * sitemap não: ele sai de `publishedPageIds` e das rotas, em routes.ts. O tour e o ARP Vision
 * Presencial não têm página própria e levam à home.
 */
import { translations, type Dictionary, type Locale } from '../i18n';
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
  },
  {
    id: 'videos',
    group: 'show',
    icon: 'video',
    isNew: true,
    page: 'productVideos',
    target: { page: 'productVideos' },
  },
  {
    id: 'instagram',
    group: 'promote',
    icon: 'calendar',
    isNew: true,
    page: 'productInstagram',
    target: { page: 'productInstagram' },
  },
  {
    id: 'autochat',
    group: 'promote',
    icon: 'message',
    isNew: true,
    page: 'productAutochat',
    target: { page: 'productAutochat' },
  },
  {
    id: 'training',
    group: 'team',
    icon: 'users',
    isNew: false,
    page: null,
    target: { page: 'home', anchor: 'inPerson' },
  },
  {
    id: 'readyTour',
    group: 'team',
    icon: 'home',
    isNew: false,
    page: null,
    target: { page: 'home', anchor: 'inPerson' },
  },
];

/** As páginas próprias dos produtos, na ordem Piloto, Autochat, Vídeos. */
export const productPageIds: readonly ProductPageId[] = [
  'productInstagram',
  'productAutochat',
  'productVideos',
];

/**
 * Os produtos de um idioma, na ordem do catálogo, inclusive os que ainda não estão no ar (a lista
 * que o visitante vê é a de `liveProductsFor`). O grupo da equipe é o ARP Vision Presencial: ele
 * entra onde o dicionário tem a seção dele na home (`inPerson`, que hoje só o português tem), como
 * a própria seção.
 */
export function productsFor(locale: Locale): Product[] {
  const inPerson = translations(locale).inPerson !== null;
  return products.filter((product) => inPerson || product.group !== 'team');
}

/** No ar: o produto sem página própria (tour, Presencial) ou com a página já publicada. */
export function isLive(product: Product): boolean {
  return product.page === null || publishedPageIds.includes(product.page);
}

/** Os produtos de `productsFor` que já estão no ar: é essa a lista que o visitante vê. */
export function liveProductsFor(locale: Locale): Product[] {
  return productsFor(locale).filter(isLive);
}

/** O nome e a linha de um produto no menu Produtos. */
export interface ProductText {
  name: string;
  line: string;
}

/**
 * O nome e a linha do produto no idioma. O ARP Vision Presencial só tem texto em português, então
 * nos outros idiomas o retorno é `undefined` (ele também não entra em `productsFor('es')`).
 */
export function productText(locale: Locale, id: ProductId): ProductText | undefined {
  const { items, inPerson } = translations(locale).products;
  return id === 'training' || id === 'readyTour' ? inPerson?.[id] : items[id];
}

/** Um produto no ar com o seu texto no idioma. */
export interface LiveProduct {
  product: Product;
  text: ProductText;
}

/**
 * Os produtos no ar que têm texto no idioma, na ordem do catálogo. É a lista que o menu, a página
 * /produtos, o rodapé, o "Conheça também" e a ItemList mostram: só entra quem tem texto no idioma
 * (o Presencial, por exemplo, não tem no espanhol nem no inglês).
 */
export function liveProductsWithText(locale: Locale): LiveProduct[] {
  return liveProductsFor(locale).flatMap((product) => {
    const text = productText(locale, product.id);
    return text ? [{ product, text }] : [];
  });
}

/**
 * Os grupos do menu Produtos, na ordem de `productGroups`, cada um com os seus produtos no ar; o
 * grupo sem nenhum fica de fora. O menu e a página /produtos saem desta lista, e assim os cartões
 * da página seguem os grupos do menu.
 */
export function liveProductGroups(
  locale: Locale,
): { group: ProductGroupId; items: LiveProduct[] }[] {
  const live = liveProductsWithText(locale);
  return productGroups
    .map((group) => ({ group, items: live.filter(({ product }) => product.group === group) }))
    .filter(({ items }) => items.length > 0);
}

type ProductPagesText = Dictionary['productPages'];

/**
 * O texto da página própria do produto (`productPages` do dicionário), ou `undefined` enquanto
 * ela não tem texto: o tour, o Presencial e as páginas que ainda não foram escritas.
 */
export function productPageText(
  locale: Locale,
  id: ProductId,
): ProductPagesText[keyof ProductPagesText] | undefined {
  const pages: Partial<Record<ProductId, ProductPagesText[keyof ProductPagesText]>> =
    translations(locale).productPages;
  return pages[id];
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

/**
 * O último segmento do endereço da página: o mesmo no português e no espanhol, e o do inglês
 * traduzido (`autopilot-for-instagram`, `videos-from-photos`).
 */
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

/**
 * Junta cada item de uma lista do dicionário com o que o componente decide para ele (a foto e o
 * formato de uma arte, por exemplo), pelo `id` do item, em qualquer ordem. Um id sem par, sobrando
 * no componente ou repetido no dicionário para o build com o nome do componente (`scope`): sem
 * isso, uma arte nova sairia sem foto, e reordenar o dicionário trocaria as fotos sem aviso.
 */
export function pairById<Item extends { id: string }, Extra>(
  scope: string,
  items: readonly Item[],
  extras: Readonly<Record<string, Extra>>,
): [Item, Extra][] {
  const ids = items.map((item) => item.id);
  const problems = [
    ...ids.filter((id) => !Object.hasOwn(extras, id)).map((id) => `"${id}" sem par`),
    ...Object.keys(extras)
      .filter((id) => !ids.includes(id))
      .map((id) => `"${id}" sobrando`),
    ...ids.filter((id, index) => ids.indexOf(id) !== index).map((id) => `"${id}" repetido`),
  ];
  if (problems.length) throw new Error(`${scope}: ${problems.join(', ')}`);
  return items.map((item) => [item, extras[item.id]]);
}

/**
 * Junta, pela posição, cada item de uma lista do dicionário com o que o componente decide para ele
 * (o ícone de um item, por exemplo). Listas de tamanhos diferentes param o build com o nome do
 * componente (`scope`): um item a mais ficaria sem ícone, sem aviso.
 */
export function pairByPosition<Item, Extra>(
  scope: string,
  items: readonly Item[],
  extras: readonly Extra[],
): [Item, Extra][] {
  if (items.length !== extras.length)
    throw new Error(
      `${scope}: ${items.length} itens no dicionário e ${extras.length} no componente`,
    );
  return items.map((item, index) => [item, extras[index]]);
}
