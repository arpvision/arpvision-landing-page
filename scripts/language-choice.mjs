// A faixa de sugestão de idioma depende do idioma do navegador (src/i18n/suggestion.ts). As
// checagens que não são da faixa gravam antes a escolha de idioma, como quem já usou o seletor,
// para não dependerem do idioma do Chrome da máquina; as da faixa usam um contexto sem escolha,
// com o `locale` do caso testado.
export const languageChoiceKey = 'arpvision-idioma';

/** O `locale` do Playwright que corresponde ao idioma de cada página. */
export const browserLocale = { pt: 'pt-BR', es: 'es-ES', en: 'en-US' };

/** Grava a escolha antes de cada página do contexto, sem apagar uma escolha feita no teste. */
export const chooseLanguage = (context, locale = 'pt') =>
  context.addInitScript(
    ([key, value]) => {
      try {
        if (!localStorage.getItem(key)) localStorage.setItem(key, value);
      } catch {}
    },
    [languageChoiceKey, locale],
  );
