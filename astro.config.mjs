import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  trailingSlash: 'never',
  build: { format: 'directory' },
  vite: { build: { assetsInlineLimit: 0 } },
  // Português na raiz e espanhol em /es. Sem redirecionamento pelo idioma do navegador: o
  // site estático não tem middleware, e a escolha é sempre do seletor PT | ES.
  // Os idiomas e os endereços em espanhol estão em src/i18n/ (index.ts e routes.ts).
  i18n: {
    defaultLocale: 'pt',
    locales: ['pt', 'es'],
    routing: { prefixDefaultLocale: false },
  },
});
