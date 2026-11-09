# ARP Vision — site de marketing

Landing page para imobiliárias, em português do Brasil, espanhol da Espanha e inglês: o tour virtual 360° e os produtos que vêm com ele (vídeos a partir de fotos, Piloto automático para Instagram e Autochat). Astro gera HTML estático para as páginas da tabela de [Páginas](#páginas), em cada idioma, e uma página 404 nos três idiomas. Sem framework JavaScript no cliente: interações pequenas em TypeScript e CSS com os tokens da marca.

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

Hospede o conteúdo de `dist/` em um servidor estático que resolva `/planos` para `/planos/index.html` (e `/es`, `/en` e `/produtos` para o `index.html` de cada pasta) e sirva `404.html` para os endereços que não existem. Não configure fallback global para a Home: cada rota tem seu próprio HTML, título, descrição, canonical e dados estruturados.

## Páginas

Os endereços de cada idioma moram em `src/i18n/routes.ts`; o espanhol e o inglês têm endereços no próprio idioma.

| Página                           | pt                                           | es                                               | en                                     |
| -------------------------------- | -------------------------------------------- | ------------------------------------------------ | -------------------------------------- |
| Home                             | `/`                                          | `/es`                                            | `/en`                                  |
| Planos                           | `/planos`                                    | `/es/planes`                                     | `/en/plans`                            |
| Tutoriais                        | `/tutoriais`                                 | `/es/tutoriales`                                 | `/en/tutorials`                        |
| Termos de uso                    | `/termos-de-uso`                             | `/es/terminos-de-uso`                            | `/en/terms-of-use`                     |
| Privacidade                      | `/politica-de-privacidade`                   | `/es/politica-de-privacidad`                     | `/en/privacy-policy`                   |
| Todos os produtos                | `/produtos`                                  | `/es/productos`                                  | `/en/products`                         |
| Piloto automático para Instagram | `/produtos/piloto-automatico-para-instagram` | `/es/productos/piloto-automatico-para-instagram` | `/en/products/autopilot-for-instagram` |
| Autochat                         | `/produtos/autochat`                         | `/es/productos/autochat`                         | `/en/products/autochat`                |
| Vídeos a partir de fotos         | `/produtos/videos-a-partir-de-fotos`         | `/es/productos/videos-a-partir-de-fotos`         | `/en/products/videos-from-photos`      |

- Os preços estão ocultos: `/planos`, `/es/planes` e `/en/plans` só redirecionam para a cotação da Home, com `noindex`, e ficam fora do sitemap e da lista de páginas que as checagens percorrem (`site.pricing.showPrices` liga a página de volta). Neles, o `check:site` confere o redirecionamento e o `noindex`, e o `browser-check`, que cada endereço leva à cotação. São 24 páginas HTML, mais os três redirecionamentos e a 404.
- O tour 360° e o ARP Vision Presencial não têm página: levam à Home (o Presencial, à seção `#presencial`, só no português).
- Uma página de produto só existe no site depois de entrar em `publishedPageIds`; veja [Produtos](#produtos).

## Configuração

Os **dados** ficam em **`src/config/site.ts`**: links, contatos, mídias, tours, números dos planos (preços, créditos, tours no ar, dias de teste) e analytics, os mesmos para todos os idiomas. O **texto** fica nos dicionários de `src/i18n/` (veja [Idiomas](#idiomas)). As regras comerciais aprovadas ficam num documento interno, fora deste repositório.

- `pricing.isExample` está desativado para os valores definidos, iguais aos da tela de planos do app: Individual por R$ 229 à vista no Pix ou 12x de R$ 23,25 no cartão, com 8 ambientes, 1 tour por 1 ano, R$ 20 por ambiente extra e renovação de R$ 79; Professional por R$ 249/mês, com 20 ambientes/mês e até 30 tours no ar; Business por R$ 599/mês, com 80 ambientes/mês e até 120 tours no ar; Enterprise sob consulta. O teste grátis (`pricing.freeTrialCredits`) aparece como nota abaixo dos cards, não como plano.
- O Individual não é uma assinatura. Professional e Business são mensais. Ainda não há plano anual ou desconto anual definido, e não há preço aprovado para ambientes extras nessas duas assinaturas.
- O limite de tours no ar considera apenas tours publicados e visíveis. Rascunhos e tours ocultos ficam fora da conta. A publicação de um novo tour exige espaço dentro do limite; atingir o limite não remove tours existentes. Após cancelar uma assinatura, os tours ficam no ar até o fim do mês já pago, com opção de manutenção por R$ 79 por tour ao ano. O aviso por e-mail sete dias antes da saída do ar está previsto nas regras comerciais, mas sua implementação pertence ao app, não a este repositório.
- `domain` precisa ser o domínio primário configurado na Vercel (hoje `https://www.arpvision.com.br`; o apex redireciona para o www). Canonical, `og:url`, sitemap e robots saem dele: se apontar para um endereço que redireciona, o Google não indexa a página. `readyToIndex` controla a indexação em robots e meta.
- Os botões de conta usam `arpvision.app` com UTMs; não existe checkout local. Este repositório não concede créditos, bloqueia publicações, gerencia assinaturas nem envia e-mails.
- `contact.whatsapp` alimenta os links de WhatsApp (o número é usado só com os dígitos). Vazio, os botões abrem um aviso de contato em preparação.
- O FAQ da Home e de `/planos` é um só (`faqGroups` em `src/lib/content.ts`). O mesmo arquivo monta a tabela de recursos (`featureGroups`) e as condições comerciais (`policies`): a estrutura é uma só, e o texto vem do dicionário do idioma. Cada página de produto tem as próprias dúvidas (`productPages.<produto>.faq`), e o `FAQPage` dela sai da mesma lista.
- Os vídeos de `/tutoriais`, `/es/tutoriales` e `/en/tutorials` são os mesmos, narrados em português (as páginas em espanhol e em inglês avisam na abertura), e moram no YouTube (Shorts não listados). Ficam em `tutorials`, na ordem do app: o id do YouTube, a duração em segundos, a data de publicação e a seção. Para publicar um: acrescente a entrada (o id dela entra em `TutorialId`); escreva o título e a descrição em `tutorials.videos.<id>` nos três dicionários; ponha um quadro do vídeo, em pé, em `public/images/tutoriais/<id>-source.jpg`; e rode `node scripts/prepare-images.mjs <id>-360 <id>-720` para gerar as capas WebP. O app tem a mesma lista em `inner-view-client/src/app/tutoriais`. O player só carrega no clique, no diálogo, e o cartão sem JavaScript abre o YouTube.
- A ativação de analytics exige `analytics.scriptUrl` e `analytics.domain`, de uma instalação Plausible sem cookies. Sem esses campos, nenhum script de analytics é carregado. Eventos não incluem dados pessoais.

## Mídia real e estados pendentes

Logos e tutorial são oficiais e estão hospedados localmente. Fontes Inter e imagens WebP também são locais. Consulte `public/ASSETS.md` para fontes e licença da fotografia ilustrativa.

A fotografia de interior **não é uma captura ARP Vision**. As fotos e os seis vídeos de exemplo das páginas de produto vêm do tour de demonstração, e essas páginas os mostram sempre com a etiqueta "Exemplo" (veja [Produtos](#produtos)); em `/produtos`, as fotos são só a capa de cada cartão.

Exemplo de configuração de um tour real (substitua todos os dados antes de usar):

```ts
tours: [
  {
    id: 'ID_REAL',
    name: 'Nome real do imóvel',
    label: { pt: 'Casa · 9 ambientes', es: 'Casa · 9 estancias', en: 'House · 9 rooms' },
    cover: '/images/tour-casa.webp',
    publicUrl: 'https://arpvision.app/URL_PUBLICA_REAL',
    phone: 'Modelo usado na captura',
    photosPerRoom: '8',
    captureTime: { pt: 'Tempo medido', es: 'Tiempo medido', en: 'Measured time' },
  },
];
```

O iframe só é criado no clique. Se a largura efetiva do visualizador for menor que 768px, ele abre num diálogo de tela cheia. Escape/Fechar restaura o foco; o diálogo nativo prende a navegação por teclado. O timeout é de 15s. O evento `load` confirma o carregamento do documento remoto; verificar o estado interno de um app de outra origem exigiria uma mensagem de confirmação implementada pelo próprio app.

QR codes de todas as demos são gerados no build e acompanham a seleção das abas. Sem tour configurado, não existe iframe nem QR fictício.

## Idiomas

O português é a fonte e mora na raiz; o espanhol da Espanha (es-ES) mora em `/es` e o inglês em `/en`, cada um com endereços no próprio idioma. O i18n nativo do Astro (`i18n` em `astro.config.mjs`) dá o idioma de cada página (`Astro.currentLocale`).

Ninguém é redirecionado pelo idioma do navegador: um redirecionamento automático levaria também o robô do Google, que lê como um navegador em inglês, e tiraria o português do índice. No lugar dele:

- **Seletor de idioma** (`LanguageSwitch.astro`): PT | ES | EN no rodapé e no menu do celular; no cabeçalho do desktop, a partir de 1280px, um seletor compacto (globo e código do idioma, que abre a lista; `src/scripts/language-menu.ts`). No espanhol ele fica fora do cabeçalho, porque os rótulos longos não deixam espaço; no português, também quando o menu tem "Tour real" (`data-long-nav`). Leva à mesma página no outro idioma.
- **Faixa de sugestão** (`LanguageSuggestion.astro`, `src/scripts/language-suggestion.ts`, texto em `src/i18n/suggestion.ts`): quando o primeiro idioma do navegador que o site tem (pt, es ou en; inglês se nenhum) difere do idioma da página, uma faixa discreta no pé da tela, escrita no idioma oferecido, leva à página equivalente. Ela só existe no navegador: o HTML do servidor não a tem. Some para sempre quando a pessoa usa o seletor, o link da faixa ou o fechar, que gravam a escolha em `localStorage` (`arpvision-idioma`). Não aparece na 404 nem para robôs.

Onde mora cada coisa:

- `src/i18n/pt.ts`: todo o texto em português. O tipo `Dictionary` sai daqui.
- `src/i18n/es.ts` e `src/i18n/en.ts`: o espanhol e o inglês, tipados como `Dictionary`: se faltar uma chave, `npm run build` (astro check) falha, e `npm test` confere que as listas têm o mesmo tamanho. Os pontos em que eles divergem de propósito do português estão marcados com `DIFERENTE`.
- `src/i18n/locales.ts`: os idiomas, o `lang`, o `og:locale`, o código e o nome de cada um (fora de `index.ts` porque o script da faixa também usa esta lista).
- `src/i18n/routes.ts`: os endereços das páginas e as âncoras (`#cotacao`, `#cotizacion`, `#quote`) de cada idioma, e `publishedPageIds`, a lista das páginas publicadas (veja [Produtos](#produtos)).
- `src/i18n/index.ts`: os dicionários e o parâmetro `idioma` que os links do app e o tour embutido levam fora do português (`?idioma=es`, `?idioma=en`).
- `src/components/pages/`: o conteúdo de cada página, igual para todos os idiomas; os arquivos de `src/pages/`, `src/pages/es/` e `src/pages/en/` só escolhem a página.
- Números, preços e prazos vêm de `site.ts` e entram no texto pelas funções do dicionário (`trial(credits, days)`), para os idiomas nunca divergirem.
- O texto que o script do navegador escreve depois da carga (menu, vídeo, cotação, carrossel, tour) vai na própria página, em atributos `data-*`, no idioma dela; os scripts não carregam os dicionários.

O espanhol segue o glossário e o estilo de `docs/produto/idiomas.md`, no repositório do app (tú, móvil, enlace, estancia, mejorar; sem "IA"); o inglês segue a terminologia do inglês do app (`en.json`: room, enhance, tours live; sem "AI"). Todo texto novo, ou mudado, entra nos três dicionários no mesmo PR, menos uma parte que só existe em português (um serviço local, como o ARP Vision Presencial): ela vai em `onlyInPortuguese({ ... })` no `pt.ts` e vale `null` no `es.ts` e no `en.ts`, marcada com `DIFERENTE`; o componente não mostra nada com `null`, e a chave entra nas diferenças permitidas de `tests/i18n.test.ts`. O menu Produtos segue o mesmo critério: o grupo "Com a nossa equipe" (o Presencial) só existe onde o dicionário tem a seção dele, hoje o português.

Para acrescentar um idioma (ex.: `fr`):

1. Crie `src/i18n/fr.ts` com `export const fr: Dictionary = { ... }`, registre o idioma em `src/i18n/locales.ts` (`Locale`, `locales`, `localeInfo`) e o dicionário em `dictionaries` de `src/i18n/index.ts`.
2. Acrescente os endereços e as âncoras em `src/i18n/routes.ts`, o texto da faixa em `src/i18n/suggestion.ts` e o idioma em `i18n.locales` de `astro.config.mjs`.
3. Crie `src/pages/fr/` com os mesmos arquivos de `src/pages/en/`, nos endereços do idioma.
4. Gere o cartão Open Graph do idioma em `scripts/prepare-images.mjs` e aponte-o no dicionário (`home.ogImage`, `plansPage.ogImage`).
5. Grave o par de vídeos de exemplo do idioma (vertical e horizontal, com o texto dele gravado na imagem) e registre-o em `site.media.exampleVideos`, que o tipo exige para todo idioma (veja [Produtos](#produtos)).
6. Nos testes, acrescente o idioma em `scripts/check-site.mjs` (`locales`) e nas checagens de navegador.

Hreflang (com `x-default` em português), canonical, `og:locale`, sitemap e JSON-LD saem sozinhos para todos os idiomas registrados.

## Produtos

- **Catálogo:** `src/lib/products.ts` tem a lista `products` (id, grupo, ícone, selo "Novo", página própria e destino) e as funções que o resto do site usa. O menu Produtos, a página de todos os produtos, a coluna do rodapé, o "Conheça também" das páginas, a faixa "Mais para a sua imobiliária." da Home e o `ItemList` dos dados estruturados leem essa lista, e assim nenhum esquece um produto. O sitemap e os scripts de checagem não leem o catálogo, e sim `publishedPageIds` e `routes`, de `src/i18n/routes.ts` (veja "O que está no ar"); o catálogo tem os testes de `tests/products.test.ts`. Três grupos:
  - "Mostrar o imóvel": Tour virtual 360° (leva à Home) e Vídeos a partir de fotos;
  - "Divulgar e atender": Piloto automático para Instagram e Autochat;
  - "Com a nossa equipe": Treinamento da equipe e Tour Pronto, o ARP Vision Presencial. Entram onde o dicionário tem a seção `inPerson` (hoje só o português) e levam a `#presencial` na Home (`/#presencial` nas outras páginas).
- **O que está no ar:** `publishedPageIds`, em `src/i18n/routes.ts`. Uma página entra nessa lista quando fica pronta, e só então o menu, o rodapé, a faixa da Home, o sitemap, `getStaticPaths` e as checagens passam a mostrá-la (`isLive` e `liveProductsFor`, em `products.ts`). O link "Ver todos os produtos" só aparece com `products` publicada. Os scripts `.mjs` importam essa lista direto: `routes.ts` só tem `import type`, e o Node tira os tipos sozinho.
- **Páginas:** `src/components/pages/ProductPage.astro` monta as três páginas de produto, e `ProductsPage.astro`, a lista (`/produtos`, com um cartão por produto, nos grupos do menu). As seções ficam em `src/components/product/` e as telas de exemplo, em `src/components/mocks/`. Cada página tem o topo (nome com o selo "Novo", promessa, botão de cotação pelo WhatsApp e uma tela de exemplo), como funciona (uma tela pequena em cada passo), o que está incluído, as seções próprias do produto (a dor, as artes e a comparação no Piloto; a dor, a distância, o resumo para o corretor e os casos em que a conversa passa para uma pessoa no Autochat; os formatos nos Vídeos), a cotação, as dúvidas, a faixa azul e, depois dela, o "Conheça também" com os outros produtos. Nada do tour entra nelas: nem os benefícios, nem a linha do teste grátis, nem o "Criar conta grátis" da faixa. Sem preço, sem "a partir de" e sem número de resultado.
- **Texto:** só nos dicionários, nos três idiomas: o menu em `products`, cada página em `productPages.<produto>`, a lista em `productsPage` e a faixa da Home em `productsStrip`. As regras de texto (nada de "IA"/"AI", "gerado", "algoritmo", "100% real" ou "sem edição", moeda com número, "a partir de"/"from" com preço) valem para os três idiomas, e cada uma tem quem a confere: `tests/products.test.ts` as aplica a todo o texto dos dicionários, nos três idiomas: as páginas novas, o menu Produtos, o cabeçalho, o rodapé e a faixa da Home (as do inglês vêm de `scripts/lib/english-rules.mjs`), `tests/i18n.test.ts` reprova "IA"/"AI" em todo o texto do site, e o `check:site` aplica as regras do inglês às páginas `/en` e, com os preços ocultos, reprova moeda com número no HTML dos três idiomas (`scripts/lib/prices.mjs`). O espanhol e o inglês não levam palavra em português nem CRECI: o espanhol usa a "calificación energética" e o inglês, o número da licença ("License #00000").
- **Telas de exemplo:** HTML e CSS com as fotos dos recortes, sem imagem gerada. Cada uma leva a etiqueta visível "Exemplo" ("Ejemplo", "Example"), com nomes fictícios no idioma (Imobiliária Exemplo, Inmobiliaria Ejemplo, Example Realty). Ficam fora do leitor de tela (`aria-hidden` e `inert`), que ouve antes uma descrição curta que começa por "Exemplo:" ("Ejemplo:", "Example:"). Os "botões" delas são `span`, sem foco.
- **Fotos de exemplo:** 20 recortes de 7 ambientes do tour de demonstração, em `public/images/produtos/`. `scripts/product-crops.mjs` os gera de panorâmicas 2:1, com os ângulos de `scripts/product-crops.json`, a projeção de `scripts/lib/gnomonic.mjs` e o retoque do reflexo no vidro da cabeceira da suíte, de `scripts/lib/retouch.mjs`. Para refazer: `node scripts/product-crops.mjs --source "<pasta do tour com <ambiente>/tratada.jpg>"`; `--video-out <pasta>` grava também os JPG em resolução cheia para os vídeos e `--site-out <pasta>` muda o destino dos WebP. O calendário do topo do Piloto usa miniaturas de cinco deles (240 px no 4:5 e 180 px no 9:16, em `site.media.calendarPhotos`), que saem de `scripts/prepare-images.mjs` e se refazem depois dos recortes. A origem e o formato de cada arquivo estão em `public/ASSETS.md`.
- **Vídeos de exemplo:** seis MP4, `public/video/exemplo-{vertical,horizontal}-{pt,es,en}.mp4`, com o pôster de cada um em `public/images/produtos/`. São feitos no projeto Remotion da ARP Vision, fora deste repositório (parâmetros e origem em `public/ASSETS.md`), com o selo "Exemplo", os dados do imóvel e o cartão final gravados na imagem, e por isso há um par por idioma. Na página: `muted`, `loop`, `playsinline`, `preload="none"`, pôster e `data-autoplay`; tocam só enquanto estão na tela, cada um tem o botão de tocar e pausar, e com movimento reduzido nada toca sozinho. Ficam em `site.media.exampleVideos`.
- **Cotação e WhatsApp:** cada página de produto leva o próprio texto para o componente da cotação e a própria mensagem do WhatsApp (`whatsappMessage`, que o Layout leva ao rodapé e ao botão flutuante). Os eventos da cotação levam o produto (`produto`), e a da Home continua sendo a do tour. Os preços seguem ocultos.
- **Dados estruturados:** as páginas de produto levam `Service` (sem `offers`) e `FAQPage` com as dúvidas que aparecem nelas; a página de todos os produtos leva o `ItemList`, sem `FAQPage`. Todas levam também a `Organization` e o `WebSite`, que vêm do Layout.

Para acrescentar um produto:

1. Em `src/lib/products.ts`, acrescente o id em `ProductId` e a entrada em `products` (grupo, ícone, selo, página e destino). Se o produto tem página própria, acrescente também o id dela em `ProductPageId` e em `productPageIds`, a lista que as rotas `[slug].astro` percorrem. O texto do menu vai em `products.items.<produto>` nos três dicionários, e a foto do cartão de `/produtos`, em `photoOf`, no `ProductsPage.astro`.
2. Em `src/i18n/routes.ts`, acrescente o `PageId` e o endereço nos três idiomas (o do português, sob `/produtos/`: é assim que as checagens reconhecem uma página de produto) e, em `src/pages/sitemap.xml.ts`, a frequência dele em `frequency`. Não há arquivo de rota para criar: `src/pages/produtos/[slug].astro`, `src/pages/es/productos/[slug].astro` e `src/pages/en/products/[slug].astro` já geram a página de todo id de `productPageIds` que estiver em `publishedPageIds`.
3. Escreva `productPages.<produto>` nos três dicionários (o tipo `Dictionary` e `tests/i18n.test.ts` exigem as mesmas chaves e listas do mesmo tamanho) e monte a página em `ProductPage.astro`.
4. Ponha o `PageId` em `publishedPageIds`. É essa linha que publica a página: fora da lista ela não é gerada, e o menu, o rodapé, a faixa da Home, o sitemap e as checagens não a enxergam. Por isso as checagens rodam só depois dela: `npm test`, `npm run build`, `npm run check:site` e, com a prévia no ar, `npm run test:browser`. Acrescente a elas o que a página tem de próprio.
5. Inclua a página na lista de `scripts/lighthouse.mjs` (`npm run audit`), que tem as páginas de produto nomeadas à mão.

## Cabeçalho

- **Home:** na abertura, o cabeçalho é um vidro transparente com a escrita branca (`data-header-surface="opening"`). Depois dela, sai de cena quando a pessoa desce e volta no primeiro movimento para cima: um vai e volta de até 8 px (o elástico e a barra de endereço do Safari) não o traz de volta. Escondido, fica com `visibility: hidden` e `inert`, e o foco do teclado não o traz de volta. Com movimento reduzido, entra e sai sem animação. Nas outras páginas, ele fica sempre à vista.
- **Fora da abertura**, e com o menu do celular aberto, a cápsula fica quase opaca: a superfície do tema com 90% de opacidade, mais o desfoque, e a escrita usa a cor do tema. Assim o texto continua legível por cima de qualquer seção (a faixa azul, o tour, o rodapé), nos dois temas. O axe marca texto sobre vidro como "incomplete" e não reprova, então esse contraste é medido na imagem (veja [Verificações](#verificações)).
- **Menu Produtos:** o topo é Produtos ▾ · Cotação · Dúvidas · Tutoriais (es: Productos · Presupuesto · Preguntas · Tutoriales; en: Products · Get a quote · FAQ · Tutorials). O painel dos grupos é irmão da cápsula, e não filho dela, porque um `backdrop-filter` dentro de outro só desfoca o que está dentro do pai; ele usa o mesmo `GlassSurface`. Abre no clique e com Enter ou Espaço; fecha com Esc (o foco volta ao botão), com clique fora, ao escolher um item e ao mudar para a largura do celular, e o botão usa `aria-expanded` e `aria-controls`. No celular, "Produtos" é um grupo do menu, fechado até alguém tocar. Na página de um produto, o link dele leva `aria-current="page"` e o botão ganha só a marca visual.
- **Largura:** uma linha só de 1024 px para cima nos três idiomas, a cápsula com no máximo 1060 px e nenhum rótulo com mais de 50 px de altura de 320 a 1440 px. As regras do seletor de idioma em `src/styles/language.css` dão o espaço que falta. As de `data-long-nav` em `global.css`, para o item "Tour real" (que só entra com um tour de demonstração em `site.tours`), valem só no português (`:lang(pt)`): com um tour configurado, o cabeçalho do espanhol e do inglês quebra a linha em parte das larguras, e os dois pedem regras próprias antes de o tour entrar.
- **Cotação e Dúvidas:** nas páginas de produto, os links do topo levam às seções da própria página, com os mesmos ids da Home; em `/produtos`, que não as tem, levam às da Home.

## Verificações

```sh
npm test
npm run build
npm run check:site
```

Os testes (`tests/*.test.ts`) verificam:

- **Planos e números** (`business.test.ts`): recomendação e dados dos planos, compartilhamento dos números entre superfícies, cenários acima do limite e UTMs.
- **Idiomas** (`i18n.test.ts`): as mesmas chaves no português, no espanhol e no inglês (menos as partes só em português), nenhuma letra ou palavra do português no espanhol e no inglês, nenhum "IA"/"AI", o público de imobiliárias e nenhuma das promessas antigas, os endereços em `/es` e `/en`, o `idioma=es`/`idioma=en` nos links do app, o texto de cada tutorial nos três idiomas (com o aviso, no espanhol e no inglês, de que os vídeos são narrados em português) e a escolha da faixa de sugestão.
- **Produtos** (`products.test.ts`): o catálogo e a lista das páginas publicadas, os grupos do menu e de `/produtos` (seis itens no português, com o Presencial, e quatro no espanhol e no inglês), os links de cada produto e das seções do cabeçalho, título com a marca e descrição de até 160 caracteres, a mensagem de WhatsApp própria de cada produto, a descrição "Exemplo:" de cada tela, o Autochat com toda distância "em linha reta" e as regras de texto da spec nos três idiomas. Elas reprovam "IA"/"AI", "gerado"/"generated" e "algoritmo"/"algorithm", "100% real" e "sem edição"/"unedited", "a partir de"/"from" com preço e moeda com número. As do inglês estão em `scripts/lib/english-rules.mjs` (`english-rules.test.ts`), as mesmas que o `check:site` aplica.
- **Moeda** (`prices.test.ts`): o padrão que o `check:site` usa para achar preço escrito no HTML (R$, US$, $, € e £, antes ou depois do número, com espaço comum ou `&nbsp;`) e o que não é preço (número sem moeda, moeda sem número).
- **Dados estruturados** (`schema.test.ts`): o `Service` de cada produto, sem `offers`, o `ItemList` de `/produtos` e o `FAQPage` montado com as dúvidas que a página mostra.
- **Contraste** (`contrast.test.ts`): a fórmula do WCAG e a medida do pior pixel atrás do texto, em que se apoia a checagem do cabeçalho.
- **Recortes** (`gnomonic.test.ts`, `retouch.test.ts`): a projeção, os ângulos dos 20 recortes (nada de chão, de TV nem de espelho) e o retoque do reflexo no vidro da suíte.

A checagem de saída (`check:site`) verifica:

- as páginas do `dist` contra as publicadas em `src/i18n/routes.ts`, e o sitemap contra as mesmas rotas, sem tirar as esperadas do próprio sitemap;
- `lang`, um `h1` só e nenhum título (h1 a h6) dentro de `<span>`, arquivos locais, metadados, canonical apontando para a própria página, hreflang com `x-default`, `og:locale`, a imagem de compartilhamento do idioma nas páginas de produto e na de todos os produtos, sitemap com as três versões e robots no mesmo domínio;
- JSON-LD no idioma da página: o `FAQPage` igual às dúvidas dela (também nas páginas de produto), o `Service` nelas, o `ItemList` de `/produtos` e o `VideoObject` dos tutoriais com o idioma da narração (pt-BR);
- com os preços ocultos, nenhum `offers` e nenhuma moeda com número no HTML (`scripts/lib/prices.mjs`: R$, US$, $, € e £, antes ou depois do número, com espaço comum ou `&nbsp;`);
- nas páginas `/en`, as regras de texto do inglês (`scripts/lib/english-rules.mjs`) e, nas `/es` e `/en`, nenhum texto em português;
- o ARP Vision Presencial só em português: o treinamento e o Tour Pronto no menu Produtos, levando à seção da Home, e nada dele no espanhol e no inglês; em `/produtos`, cada cartão com a sua foto (o Treinamento e o Tour Pronto ficam lado a lado);
- os links dos tutoriais no idioma da página, a 404, o seletor, a faixa de sugestão só no navegador, nenhum iframe inicial além do tour da hero e orçamento de JavaScript abaixo de 100 KB.

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
npm run audit
```

Cada comando roda um script de `scripts/`: `check-site.mjs` (`check:site`), `seo-check.mjs` (`check:seo`), `browser-check.mjs` e `tour-check.mjs` (`test:browser`), `opening-check.mjs` (`test:opening`), `showcase-check.mjs` (`test:showcase`) e `lighthouse.mjs` (`audit`). `language-choice.mjs` e `portuguese-words.mjs` são auxiliares dos testes e das checagens, e `scripts/lib/` guarda os módulos que os scripts e os testes dividem (`contrast.mjs`, `prices.mjs`, `english-rules.mjs`, `gnomonic.mjs` e `retouch.mjs`).

As checagens de navegador cobrem os três idiomas, as páginas de produto e a Home:

- **Texto e idiomas:** texto visível sem português no espanhol e no inglês, cotação com a mensagem no idioma, seletor PT | ES | EN (o compacto do cabeçalho pelo teclado), 404, tour da demo com `idioma=es`/`idioma=en`, o player dos tutoriais em `/es/tutoriales` e `/en/tutorials` e a faixa de sugestão (quando aparece, para onde leva, que não volta depois da escolha, que não cobre o cabeçalho nem o WhatsApp), também numa página de produto, com a âncora equivalente.
- **Cabeçalho:** o topo de cada idioma (Produtos · Cotação · Dúvidas · Tutoriais e os equivalentes), numa linha só de 1024 a 1440px, com a cápsula de até 1060px e nenhum rótulo acima de 50px de altura; o menu Produtos no desktop (clique, Enter, Espaço, Esc com o foco de volta, Tab e Shift+Tab, clique fora, o fecho na largura do celular, os produtos no ar com o selo "Novo" nos três novos, o "Ver todos" marcado em `/produtos` e o contraste com o painel aberto, nos dois temas) e no celular (o grupo abre e fecha no toque); o Presencial no menu só do português; o destaque da seção pela rolagem; e o cabeçalho de volta ao subir sobre a faixa final, o tour e as faixas azuis, nos dois temas.
- **Contraste do cabeçalho por amostra de pixel:** o axe não reprova texto sobre vidro, então `scripts/lib/contrast.mjs` mede o contraste na imagem: captura a cápsula com o texto apagado e mede cada texto contra os pixels que ficam atrás dele. A cápsula tem de passar de 4,5:1 em cada parada de uma varredura de 60 em 60px sobre a faixa (e com o menu do celular aberto sobre ela), nos dois temas, e o menor valor aparece no resultado. O texto do painel Produtos aberto, também sobre vidro, é medido do mesmo jeito, nos dois temas e nos três idiomas.
- **Páginas de produto:** cada tela de exemplo com a etiqueta visível, `aria-hidden`, `inert` e a descrição "Exemplo:"; nada para fora das telas dos passos de 1024 a 1440px e a 390 e 360px; as artes do Piloto de 320 a 390px, nos três idiomas, com o rodapé (a imobiliária e o CRECI) à vista e dentro delas e sem ficar abaixo do formato; a frase da dor do Piloto numa linha; os dois vídeos de exemplo (sem som, em laço, sem pré-carga, fora do leitor de tela, com o botão; só tocam na tela; com movimento reduzido nada toca sozinho e o play à mão continua quando o outro vídeo entra na tela; os dois tocam juntos no desktop); nada do tour na cotação e na faixa azul; o produto nos botões de WhatsApp; a mensagem e os eventos da cotação; o menu marcando o produto; Cotação e Dúvidas na própria página.
- **Layout:** nas 24 rotas dos três idiomas, as larguras de 320 a 1440px (com 1040 e 1100) sem estouro e com o cabeçalho numa linha, e a 360px sem texto abaixo de 12px nem alvo de toque pequeno; o rodapé da home a 1024, 768, 390 e 320px, com os links de cada coluna separados (também os nomes de duas linhas) e, abaixo de 1024px, o contato na linha inteira, com o e-mail e o WhatsApp numa linha cada; contraste AA nos dois temas (axe).

Cada contexto do navegador define o idioma da página que testa, para o resultado não depender do idioma do Chrome da máquina. `npm run audit` roda o Lighthouse, com emulação móvel, na Home, em `/planos`, em `/produtos` e nas páginas de produto publicadas, todas no português, e na Home em espanhol. O inglês e as páginas de produto em espanhol não entram nele. Resultados de laboratório não substituem medições de usuários reais.

Relatórios e capturas são salvos em `.artifacts/` (ignorado pelo Git).

A abertura e a demonstração também verificam a saída do cabeçalho ao fim do primeiro slide e a volta dele quando a página sobe (o limiar de 8px: 6px não o trazem de volta, 16px trazem; e a saída de novo ao descer), o leque de fotos, a proteção do tour, o movimento contínuo das palavras (inclusive ao passar o mouse), o contraste e os layouts de 320 a 1440px nos três idiomas. Com movimento reduzido ou sem JavaScript, os benefícios aparecem como uma lista estática.

Os WebPs e os cartões Open Graph podem ser gerados com `node scripts/prepare-images.mjs`; com nomes, só os citados (`node scripts/prepare-images.mjs og-home-es og-home-en`). Sem nome, o script regrava todos os cartões. Os cartões da Home dizem "Seus imóveis" (pt), "Tus inmuebles" (es) e "Your properties" (en), e os PNGs do repositório já têm o texto do script. Os recortes das páginas de produto saem de `scripts/product-crops.mjs` (veja [Produtos](#produtos)). Não há upload, pagamento, envio de e-mail nem publicação automática.

Os dados que ainda precisam ser confirmados antes do lançamento estão listados num documento interno, fora deste repositório.
