import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  trailingSlash: 'never',
  build: { format: 'directory' },
  vite: { build: { assetsInlineLimit: 0 } },
  // Português na raiz, espanhol em /es e inglês em /en. Sem redirecionamento pelo idioma do
  // navegador: a escolha é sempre do seletor de idioma; quando o navegador prefere outro
  // idioma do site, uma faixa sugere a mesma página nele (src/i18n/suggestion.ts).
  // Os idiomas e os endereços de cada um estão em src/i18n/ (locales.ts e routes.ts).
  i18n: {
    defaultLocale: 'pt',
    locales: ['pt', 'es', 'en'],
    routing: { prefixDefaultLocale: false },
  },
});
