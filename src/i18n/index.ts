/**
 * Idiomas do site. O português é a fonte e mora na raiz (/); o espanhol da Espanha mora em
 * /es. Não há redirecionamento pelo idioma do navegador: quem escolhe é a pessoa, pelo
 * seletor PT | ES do cabeçalho e do rodapé.
 *
 * Para acrescentar um idioma: o dicionário (`xx.ts`, tipado por `Dictionary`), uma entrada
 * em `locales`, `localeInfo` e `dictionaries`, os caminhos em `routes.ts`, as páginas em
 * `src/pages/xx/` e o idioma em `astro.config.mjs`. O README tem o passo a passo.
 */
import { pt, type Dictionary } from './pt';
import { es } from './es';

export type Locale = 'pt' | 'es';
export const locales: readonly Locale[] = ['pt', 'es'];
export const defaultLocale: Locale = 'pt';

/** Como cada idioma aparece no HTML, no Open Graph, nos links do app e no seletor. */
export const localeInfo: Record<
  Locale,
  { lang: string; ogLocale: string; code: string; name: string }
> = {
  pt: { lang: 'pt-BR', ogLocale: 'pt_BR', code: 'PT', name: 'Português' },
  es: { lang: 'es-ES', ogLocale: 'es_ES', code: 'ES', name: 'Español' },
};

const dictionaries: Record<Locale, Dictionary> = { pt, es };

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
