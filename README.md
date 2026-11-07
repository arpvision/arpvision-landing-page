# ARP Vision — site de marketing

Landing page em português do Brasil e espanhol da Espanha. Astro gera HTML estático para `/`, `/planos`, `/tutoriais`, `/termos-de-uso` e `/politica-de-privacidade`, as mesmas páginas em espanhol em `/es`, `/es/planes`, `/es/tutoriales`, `/es/terminos-de-uso` e `/es/politica-de-privacidad`, e uma página 404 nos dois idiomas. Sem framework JavaScript no cliente: interações pequenas em TypeScript e CSS com os tokens da marca.

## Executar

Requer Node.js 22.19+ (recomendado) e npm. O Astro 7 exige 22.12+; no Node 22.18 o site compila e todos os testes passam, mas o Lighthouse 13 (usado só em `npm run audit`) emite aviso de engine.

```sh
npm ci
npm run dev
```

O endereço é exibido pelo Astro. Para gerar e visualizar o resultado estático:

```sh
npm run build
npm run preview
```

Hospede o conteúdo de `dist/` em um servidor estático que resolva `/planos` para `/planos/index.html` (e `/es` para `/es/index.html`) e sirva `404.html` para os endereços que não existem. Não configure fallback global para a Home: cada rota tem seu próprio HTML, título, descrição, canonical e dados estruturados.

## Configuração

Os **dados** ficam em **`src/config/site.ts`**: links, contatos, mídias, tours, números dos planos (preços, créditos, tours no ar, dias de teste) e analytics, os mesmos para todos os idiomas. O **texto** fica nos dicionários de `src/i18n/` (veja [Idiomas](#idiomas)). As regras comerciais aprovadas ficam num documento interno, fora deste repositório.

- `pricing.isExample` está desativado para os valores definidos, iguais aos da tela de planos do app: Individual por R$ 229 à vista no Pix ou 12x de R$ 23,25 no cartão, com 8 ambientes, 1 tour por 1 ano, R$ 20 por ambiente extra e renovação de R$ 79; Professional por R$ 249/mês, com 20 ambientes/mês e até 30 tours no ar; Business por R$ 599/mês, com 80 ambientes/mês e até 120 tours no ar; Enterprise sob consulta. O teste grátis (`pricing.freeTrialCredits`) aparece como nota abaixo dos cards, não como plano.
- O Individual não é uma assinatura. Professional e Business são mensais. Ainda não há plano anual ou desconto anual definido, e não há preço aprovado para ambientes extras nessas duas assinaturas.
- O limite de tours no ar considera apenas tours publicados e visíveis. Rascunhos e tours ocultos ficam fora da conta. A publicação de um novo tour exige espaço dentro do limite; atingir o limite não remove tours existentes. Após cancelar uma assinatura, os tours ficam no ar até o fim do mês já pago, com opção de manutenção por R$ 79 por tour ao ano. O aviso por e-mail sete dias antes da saída do ar está previsto nas regras comerciais, mas sua implementação pertence ao app, não a este repositório.
- `domain` precisa ser o domínio primário configurado na Vercel (hoje `https://www.arpvision.com.br`; o apex redireciona para o www). Canonical, `og:url`, sitemap e robots saem dele: se apontar para um endereço que redireciona, o Google não indexa a página. `readyToIndex` controla a indexação em robots e meta.
- Os botões de conta usam `arpvision.app` com UTMs; não existe checkout local. Este repositório não concede créditos, bloqueia publicações, gerencia assinaturas nem envia e-mails.
- `contact.whatsapp` alimenta os links de WhatsApp (o número é usado só com os dígitos). Vazio, os botões abrem um aviso de contato em preparação.
- O FAQ é um só (`faqGroups` em `src/lib/content.ts`), exibido na Home e em `/planos`. O mesmo arquivo monta a tabela de recursos (`featureGroups`) e as condições comerciais (`policies`): a estrutura é uma só, e o texto vem do dicionário do idioma.
- Os vídeos de `/tutoriais` e `/es/tutoriales` são os mesmos, narrados em português (a página em espanhol avisa na abertura), e moram no YouTube (Shorts não listados). Ficam em `tutorials`, na ordem do app: o id do YouTube, a duração em segundos, a data de publicação e a seção. Para publicar um: acrescente a entrada (o id dela entra em `TutorialId`); escreva o título e a descrição em `tutorials.videos.<id>` nos dois dicionários; ponha um quadro do vídeo, em pé, em `public/images/tutoriais/<id>-source.jpg`; e rode `node scripts/prepare-images.mjs <id>-360 <id>-720` para gerar as capas WebP. O app tem a mesma lista em `inner-view-client/src/app/tutoriais`. O player só carrega no clique, no diálogo, e o cartão sem JavaScript abre o YouTube.
- A ativação de analytics exige `analytics.scriptUrl` e `analytics.domain`, de uma instalação Plausible sem cookies. Sem esses campos, nenhum script de analytics é carregado. Eventos não incluem dados pessoais.

## Mídia real e estados pendentes

Logos e tutorial são oficiais e estão hospedados localmente. Fontes Inter e imagens WebP também são locais. Consulte `public/ASSETS.md` para fontes e licença da fotografia ilustrativa.

A fotografia de interior **não é uma captura ARP Vision**.

Exemplo de configuração de um tour real (substitua todos os dados antes de usar):

```ts
tours: [
  {
    id: 'ID_REAL',
    name: 'Nome real do espaço',
    label: { pt: 'Casa · 9 ambientes', es: 'Casa · 9 estancias' },
    cover: '/images/tour-casa.webp',
    publicUrl: 'https://arpvision.app/URL_PUBLICA_REAL',
    phone: 'Modelo usado na captura',
    photosPerRoom: '8',
    captureTime: { pt: 'Tempo medido', es: 'Tiempo medido' },
  },
];
```

O iframe só é criado no clique. Se a largura efetiva do visualizador for menor que 768px, ele abre num diálogo de tela cheia. Escape/Fechar restaura o foco; o diálogo nativo prende a navegação por teclado. O timeout é de 15s. O evento `load` confirma o carregamento do documento remoto; verificar o estado interno de um app de outra origem exigiria uma mensagem de confirmação implementada pelo próprio app.

QR codes de todas as demos são gerados no build e acompanham a seleção das abas. Sem tour configurado, não existe iframe nem QR fictício.

## Idiomas

O português é a fonte e mora na raiz; o espanhol da Espanha (es-ES) mora em `/es`, com endereços em espanhol. O i18n nativo do Astro (`i18n` em `astro.config.mjs`) dá o idioma de cada página (`Astro.currentLocale`). Ninguém é redirecionado pelo idioma do navegador: o seletor PT | ES do rodapé, do menu do celular e do cabeçalho (no desktop a partir de 1280px) leva à mesma página no outro idioma.

Onde mora cada coisa:

- `src/i18n/pt.ts`: todo o texto em português. O tipo `Dictionary` sai daqui.
- `src/i18n/es.ts`: o espanhol, tipado como `Dictionary`: se faltar uma chave, `npm run build` (astro check) falha, e `npm test` confere que as listas têm o mesmo tamanho. Os pontos em que o espanhol diverge de propósito do português estão marcados com `DIFERENTE`.
- `src/i18n/routes.ts`: os endereços das páginas e as âncoras (`#cotacao`, `#cotizacion`) de cada idioma.
- `src/i18n/index.ts`: os idiomas, o `lang` e o `og:locale` de cada um, e o parâmetro `idioma` que os links do app e o tour embutido levam fora do português (`?idioma=es`).
- `src/components/pages/`: o conteúdo de cada página, igual para todos os idiomas; os arquivos de `src/pages/` e `src/pages/es/` só escolhem a página.
- Números, preços e prazos vêm de `site.ts` e entram no texto pelas funções do dicionário (`trial(credits, days)`), para os idiomas nunca divergirem.
- O texto que o script do navegador escreve depois da carga (menu, vídeo, cotação, carrossel, tour) vai na própria página, em atributos `data-*`, no idioma dela; os scripts não carregam os dicionários.

O espanhol segue o glossário e o estilo de `docs/produto/idiomas.md`, no repositório do app (tú, móvil, enlace, estancia, mejorar; sem "IA"). Todo texto novo, ou mudado, entra nos dois dicionários no mesmo PR.

Para acrescentar um idioma (ex.: `en`):

1. Crie `src/i18n/en.ts` com `export const en: Dictionary = { ... }` e registre-o em `src/i18n/index.ts` (`Locale`, `locales`, `localeInfo` e `dictionaries`).
2. Acrescente os endereços e as âncoras em `src/i18n/routes.ts` e o idioma em `i18n.locales` de `astro.config.mjs`.
3. Crie `src/pages/en/` com os mesmos arquivos de `src/pages/es/`, nos endereços do idioma.
4. Gere o cartão Open Graph do idioma em `scripts/prepare-images.mjs` e aponte-o no dicionário (`home.ogImage`, `plansPage.ogImage`).
5. Nos testes, acrescente o idioma em `scripts/check-site.mjs` (`locales`) e nas checagens de navegador.

Hreflang (com `x-default` em português), canonical, `og:locale`, sitemap e JSON-LD saem sozinhos para todos os idiomas registrados.

## Verificações

```sh
npm test
npm run build
npm run check:site
```

Os testes verificam recomendação e dados dos planos, compartilhamento dos números entre superfícies, cenários acima do limite e UTMs; e, nos idiomas, as mesmas chaves no português e no espanhol, nenhuma letra ou palavra do português no espanhol, nenhum "IA", os endereços em `/es`, o `idioma=es` nos links do app e o texto de cada tutorial nos dois idiomas, com o aviso em espanhol de que os vídeos são narrados em português. A checagem de saída verifica as rotas dos dois idiomas, `lang`, arquivos locais, metadados, canonical apontando para a própria página, hreflang com `x-default`, `og:locale`, sitemap com as duas versões e robots no mesmo domínio, JSON-LD no idioma da página (e o FAQPage igual ao FAQ dela; o VideoObject dos tutoriais leva o idioma da narração, pt-BR), os links dos tutoriais no idioma da página, a 404, nenhum texto em português nas páginas `/es`, nenhum iframe inicial além do tour da hero e orçamento de JavaScript.

Para ler o site como o Googlebot (robots → sitemap → cada página, sem seguir redirecionamentos), com a prévia no ar ou contra a produção depois do deploy:

```sh
npm run check:seo
npm run check:seo -- https://www.arpvision.com.br
```

Com a prévia na porta 4321 e Chrome instalado (em outra porta, passe `SITE_URL=http://127.0.0.1:PORTA`):

```sh
npm run preview -- --port 4321
npm run test:browser
npm run test:opening
npm run test:showcase
node scripts/lighthouse.mjs
```

As checagens de navegador cobrem também o espanhol: texto visível sem português, cotação com a mensagem em espanhol, seletor PT | ES, 404, contraste nos dois temas, tour da demo com `idioma=es`, o player dos tutoriais em `/es/tutoriales` e as larguras de 320 a 1440px sem estouro (com o cabeçalho numa linha).

Relatórios e capturas são salvos em `.artifacts/` (ignorado pelo Git). Lighthouse usa emulação móvel; resultados de laboratório não substituem medições de usuários reais.

A abertura e a demonstração também verificam a saída do cabeçalho ao fim do primeiro slide, o leque de fotos, a proteção do tour, o movimento contínuo das palavras (inclusive ao passar o mouse), o contraste e os layouts de 320 a 1440px. Com movimento reduzido ou sem JavaScript, os benefícios aparecem como uma lista estática.

Os WebPs e os cartões Open Graph podem ser gerados com `node scripts/prepare-images.mjs`; com nomes, só os citados (`node scripts/prepare-images.mjs og-home-es og-planes-es`). O script já traz a nova redação para o cartão Open Graph da Home em português; o PNG atual foi preservado nesta atualização de texto. Não há upload, pagamento, envio de e-mail nem publicação automática.

Os dados que ainda precisam ser confirmados antes do lançamento estão listados num documento interno, fora deste repositório.
