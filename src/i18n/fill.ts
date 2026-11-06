/**
 * Preenche `{nome}` num texto do dicionário. Fica sem dependências porque os scripts do
 * navegador também o usam, e importar `src/i18n/index.ts` levaria os dicionários inteiros
 * para o JavaScript da página.
 */
export const fill = (template: string, values: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
