# ARP Vision — site de marketing

Landing page em português do Brasil. Astro gera HTML estático para `/`, `/planos`, `/termos-de-uso` e `/politica-de-privacidade`. Sem framework JavaScript no cliente: interações pequenas em TypeScript e CSS com os tokens da marca.

## Executar

Requer Node.js 22.19+ (recomendado) e npm. O projeto também foi compilado e testado no Node 22.18 do ambiente de implementação; uma dependência transitiva do Astro emite aviso de engine nessa versão.

```sh
npm ci
npm run dev
```

O endereço é exibido pelo Astro. Para gerar e visualizar o resultado estático:

```sh
npm run build
npm run preview
```

Hospede o conteúdo de `dist/` em um servidor estático que resolva `/planos` para `/planos/index.html`. Não configure fallback global para a Home: cada rota tem seu próprio HTML, título, descrição, canonical e dados estruturados.

## Configuração

Edite **`src/config/site.ts`**. Ele concentra links, contatos, mídias, tours, condições dos planos, tabela de recursos, comparativo, programa Fundadores, documentos legais e analytics. As regras comerciais aprovadas ficam num documento interno, fora deste repositório.

- `pricing.isExample` está desativado para os valores definidos: teste grátis com 1 crédito; Individual por R$ 279 em pagamento único, com 8 ambientes, 1 tour por 1 ano, R$ 20 por ambiente extra e renovação de R$ 79; Professional por R$ 249/mês, com 20 ambientes/mês e até 30 tours no ar; Business por R$ 599/mês, com 80 ambientes/mês e até 120 tours no ar; Enterprise sob consulta.
- O Individual não é uma assinatura. Professional e Business são mensais. Ainda não há plano anual ou desconto anual definido, e não há preço aprovado para ambientes extras nessas duas assinaturas.
- O limite de tours no ar considera apenas tours publicados e visíveis. Rascunhos e tours ocultos ficam fora da conta. A publicação de um novo tour exige espaço dentro do limite; atingir o limite não remove tours existentes. Após cancelar uma assinatura, os tours ficam no ar até o fim do mês já pago, com opção de manutenção por R$ 79 por tour ao ano. O aviso por e-mail sete dias antes da saída do ar está previsto nas regras comerciais, mas sua implementação pertence ao app, não a este repositório.
- `domain` usa o domínio sugerido no briefing; confirme o endereço antes de publicar. `readyToIndex` controla a indexação em robots e meta.
- Os botões de conta usam `arpvision.app` com UTMs; não existe checkout local. Este repositório não concede créditos, bloqueia publicações, gerencia assinaturas nem envia e-mails.
- WhatsApp vazio mostra aviso de contato em preparação. O formulário não transmite nem armazena dados sem um destino configurado.
- `founders.formEndpoint`: endpoint HTTPS que aceite JSON e retorne HTTP 2xx apenas quando o interesse for recebido. Sem endpoint, `contact.whatsapp` é usado para abrir uma mensagem preenchida no WhatsApp. A confirmação do envio ocorre no WhatsApp.
- A ativação de analytics exige `analytics.scriptUrl` e `analytics.domain`, de uma instalação Plausible sem cookies. Sem esses campos, nenhum script de analytics é carregado. Eventos não incluem dados pessoais do formulário.

## Mídia real e estados pendentes

Logos e tutorial são oficiais e estão hospedados localmente. Fontes Inter e imagens WebP também são locais. Consulte `public/ASSETS.md` para fontes e licença da fotografia ilustrativa.

A fotografia de interior **não é uma captura ARP Vision**. O comparador mostra a mesma imagem nos dois lados como prévia da interação e avisa isso. Para usar os resultados reais, configure de dois a três pares em `comparisonPairs`, com recortes em perspectiva do mesmo ângulo. Os marcadores usam coordenadas percentuais relativas à imagem inteira.

Exemplo de configuração de um tour real (substitua todos os dados antes de usar):

```ts
tours: [
  {
    id: 'ID_REAL',
    name: 'Nome real do espaço',
    label: 'Casa · 9 ambientes',
    cover: '/images/tour-casa.webp',
    publicUrl: 'https://arpvision.app/URL_PUBLICA_REAL',
    phone: 'Modelo usado na captura',
    photosPerRoom: '8',
    captureTime: 'Tempo medido',
  },
];
```

O iframe só é criado no clique. Se a largura efetiva do visualizador for menor que 768px, ele abre num diálogo de tela cheia. Escape/Fechar restaura o foco; o diálogo nativo prende a navegação por teclado. O timeout é de 15s. O evento `load` confirma o carregamento do documento remoto; verificar o estado interno de um app de outra origem exigiria uma mensagem de confirmação implementada pelo próprio app.

QR codes de todas as demos são gerados no build e acompanham a seleção das abas. Sem tour configurado, não existe iframe nem QR fictício.

## Verificações

```sh
npm test
npm run build
npm run check:site
```

Os testes verificam recomendação e dados dos planos, compartilhamento dos números entre superfícies, cenários acima do limite e UTMs. A checagem de saída verifica rotas, arquivos locais, metadados, schema, ausência de iframe inicial e orçamento de JavaScript.

Com a prévia na porta 4321 e Chrome instalado:

```sh
npm run preview -- --port 4321
node scripts/browser-check.mjs
node scripts/lighthouse.mjs
```

Relatórios e capturas são salvos em `.artifacts/` (ignorado pelo Git). Lighthouse usa emulação móvel; resultados de laboratório não substituem medições de usuários reais.

Os WebPs podem ser gerados com `node scripts/prepare-images.mjs`. O script já traz a nova redação para o cartão Open Graph da Home; o PNG atual foi preservado nesta atualização de texto. Não há upload, pagamento, envio de e-mail nem publicação automática.

Os dados que ainda precisam ser confirmados antes do lançamento estão listados num documento interno, fora deste repositório.
