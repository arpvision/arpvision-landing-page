/**
 * Idiomas do site. O português é a fonte e mora na raiz (/); o espanhol da Espanha mora em
 * /es e o inglês em /en. Ninguém é redirecionado pelo idioma do navegador: quem escolhe é a
 * pessoa, pelo seletor de idioma do cabeçalho, do menu do celular e do rodapé. Quando o
 * navegador prefere outro idioma do site, uma faixa sugere a mesma página nele
 * (`suggestion.ts`), sem trocar nada sozinha.
 *
 * Para acrescentar um idioma: o dicionário (`xx.ts`, tipado por `Dictionary`), uma entrada
 * em `locales.ts` e em `dictionaries`, os caminhos em `routes.ts`, o texto da faixa em
 * `suggestion.ts`, as páginas em `src/pages/xx/` e o idioma em `astro.config.mjs`. O README
 * tem o passo a passo.
 */
import { pt, type Dictionary } from './pt';
import { es } from './es';
import { en } from './en';
import { defaultLocale, locales, type Locale } from './locales';

export { defaultLocale, localeInfo, locales, type Locale } from './locales';

const dictionaries: Record<Locale, Dictionary> = { pt, es, en };

/** O idioma da página a partir de `Astro.currentLocale` (o i18n do Astro deduz pelo caminho). */
export const toLocale = (value: string | undefined): Locale =>
  locales.find((locale) => locale === value) ?? defaultLocale;

export const translations = (locale: Locale): Dictionary => dictionaries[locale];

/** Idioma e texto da página nos componentes: `const { locale, t } = pageLocale(Astro);`. */
export const pageLocale = (astro: { currentLocale: string | undefined }) => {
  const locale = toLocale(astro.currentLocale);
  return { locale, t: translations(locale) };
};

/**
 * Parâmetro que leva o idioma ao app (cadastro, login e tour embutido). O português, idioma
 * padrão do app, não leva nada; o app ignora o parâmetro enquanto não o conhecer.
 */
export const appLanguageParam = (locale: Locale): Record<string, string> =>
  locale === defaultLocale ? {} : { idioma: locale };

export type { Dictionary };
