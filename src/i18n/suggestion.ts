/**
 * Faixa de sugestão de idioma: quando o navegador da pessoa prefere outro idioma que o site
 * tem, uma faixa discreta oferece a mesma página nele. Nada troca sozinho: sem
 * redirecionamento no servidor nem no navegador.
 *
 * O texto mora aqui, e não nos dicionários, porque só entra na página pelo navegador, quando a
 * faixa aparece: o HTML que o servidor entrega (o que o Google e as checagens de idioma leem)
 * não tem a faixa. Cada texto fica no idioma que oferece. Sem DOM: o script da faixa
 * (`src/scripts/language-suggestion.ts`) e os testes usam as mesmas funções.
 */
import { locales, type Locale } from './locales';
import { pageAt, routes, type AnchorId, type PageId } from './routes';

/**
 * A escolha de idioma guardada no navegador (localStorage). É gravada quando a pessoa usa o
 * seletor de idioma, o link da faixa ou o fechar (que grava o idioma da página); com ela, a
 * faixa não aparece mais.
 */
export const languageChoiceKey = 'arpvision-idioma';

export const suggestionText: Record<
  Locale,
  { text: string; link: string; close: string; label: string }
> = {
  pt: {
    text: 'Esta página também está em português.',
    link: 'Ver em português',
    close: 'Fechar',
    label: 'Idioma',
  },
  es: {
    text: 'Esta página también está en español.',
    link: 'Ver en español',
    close: 'Cerrar',
    label: 'Idioma',
  },
  en: {
    text: 'This page is also available in English.',
    link: 'View in English',
    close: 'Close',
    label: 'Language',
  },
};

/**
 * O primeiro idioma do site na lista do navegador, pelo prefixo ("es-AR" é espanhol, "en-GB"
 * é inglês). Se o navegador não informa nenhum idioma que o site tenha, o inglês.
 */
export const browserLocale = (languages: readonly string[]): Locale => {
  for (const tag of languages) {
    const prefix = tag.trim().toLowerCase().split(/[-_]/)[0];
    const locale = locales.find((code) => code === prefix);
    if (locale) return locale;
  }
  return 'en';
};

/**
 * O idioma a oferecer na faixa, ou `null` quando ela não aparece: a pessoa já escolheu um
 * idioma (qualquer escolha guardada vale) ou o navegador prefere o idioma da página.
 */
export const suggestedLocale = (
  page: Locale,
  languages: readonly string[],
  choice: string | null,
): Locale | null => {
  if (choice) return null;
  const preferred = browserLocale(languages);
  return preferred === page ? null : preferred;
};

/** A página em que se está, pelo endereço do navegador (aceita a barra no fim). */
export const pageFromPath = (locale: Locale, pathname: string): PageId | undefined =>
  pageAt(locale, pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname);

/**
 * A mesma página no idioma `to`, com a âncora equivalente ("/#cotacao" → "/es#cotizacion").
 * Uma âncora que não está no mapa de rotas fica de fora.
 */
export const equivalentHref = (from: Locale, to: Locale, page: PageId, hash: string): string => {
  let id = hash.replace(/^#/, '');
  try {
    id = decodeURIComponent(id);
  } catch {}
  const anchor = (Object.keys(routes[from].anchors) as AnchorId[]).find(
    (key) => routes[from].anchors[key] === id,
  );
  return `${routes[to].pages[page]}${anchor ? `#${routes[to].anchors[anchor]}` : ''}`;
};
