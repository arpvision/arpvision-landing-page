/**
 * Os idiomas do site e como cada um aparece no HTML, no Open Graph, nos links do app e no
 * seletor. Fica fora de `index.ts` porque o script do navegador (a faixa de sugestão de
 * idioma) também usa esta lista, e `index.ts` levaria os dicionários inteiros para o
 * JavaScript da página.
 */
export type Locale = 'pt' | 'es' | 'en';
export const locales: readonly Locale[] = ['pt', 'es', 'en'];
export const defaultLocale: Locale = 'pt';

export const localeInfo: Record<
  Locale,
  { lang: string; ogLocale: string; code: string; name: string }
> = {
  pt: { lang: 'pt-BR', ogLocale: 'pt_BR', code: 'PT', name: 'Português' },
  es: { lang: 'es-ES', ogLocale: 'es_ES', code: 'ES', name: 'Español' },
  en: { lang: 'en', ogLocale: 'en_US', code: 'EN', name: 'English' },
};
