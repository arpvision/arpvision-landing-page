# Prompt: site de vendas da ARP Vision

> Cole tudo abaixo da linha na ferramenta que vai gerar o site (Claude Code, Lovable, v0, Bolt...).
> Antes, troque os `{{PLACEHOLDERS}}`. A lista completa, com sugestões, está na seção 12.

---

Você vai construir o site de marketing e vendas da **ARP Vision**, em português do Brasil.

Se você é o Claude Code rodando no workspace do projeto: crie o site numa pasta nova, `arpvision-site/`, na raiz do workspace. Não altere nada dentro das pastas `imob-*`, que são o app.

Convenção: `{{ASSIM}}` é um valor que nós preenchemos; `{assim}` é um valor que a página calcula na hora. Se algum `{{PLACEHOLDER}}` ainda estiver entre chaves quando você for usá-lo, coloque um valor de exemplo visivelmente marcado (por exemplo "R$ XX" ou "[a definir]") e liste todos os pendentes no fim da sua resposta.

## 1. O que construir

1. **Home (`/`)**: landing page que apresenta o produto, prova a promessa com um tour 360° real incorporado e leva o visitante a criar conta.
2. **Planos (`/planos`)**: cards de planos, alternância mensal/anual e tabela de comparação entre os planos.
3. **Duas páginas legais simples, nestes endereços exatos** (o app já aponta para eles): `/termos-de-uso` e `/politica-de-privacidade`. Conteúdo: {{TEXTO_TERMOS}} e {{TEXTO_PRIVACIDADE}}. Se ainda não houver texto, faça uma página simples dizendo que o documento está em preparação, com o contato {{EMAIL_DE_CONTATO}}.

O site é separado do app. O app roda em `https://arpvision.app`, e o site vai em `https://{{DOMINIO_DO_SITE}}`. Todo botão de conversão leva para o app.

## 2. O produto (use só estes fatos, não invente outros)

A ARP Vision faz tour virtual 360° de imóveis usando só o celular.

- **Captura guiada.** O corretor abre a ARP Vision no navegador do celular (não precisa instalar app) e gira devagar seguindo bolinhas na tela. Quando a mira entra na bolinha, ele segura parado até o anel completar, e aquela foto é tirada. Cada ambiente leva de 8 a 12 fotos, numa volta só, na altura dos olhos (8 com a lente ultra-angular, 12 com a lente comum). Não precisa de tripé.
- **Montagem por IA.** As fotos viram um panorama 360°, e a IA corrige as emendas, os objetos duplicados (paralaxe) e os degraus de luz entre as fotos, usando as fotos originais como referência. Leva cerca de 1 minuto por ambiente, em segundo plano, e o corretor segue capturando o próximo cômodo enquanto isso.
- **A IA corrige, não inventa.** Ela não cria móveis nem troca acabamentos. A foto original fica guardada. A única parte completada é a que nenhuma foto alcança: o chão logo abaixo do celular e o centro do teto, que seguem o piso e o teto visíveis ao redor.
- **Tour navegável.** O corretor marca as passagens entre os ambientes, e quem visita toca na porta para ir ao próximo cômodo.
- **Compartilhamento.** Link público (o cliente abre sem criar conta), atalhos para WhatsApp e e-mail, e código para colocar o tour no site da imobiliária, nos formatos responsivo, 16:9 e quadrado.
- **Para a imobiliária.** A conta é da imobiliária, com administrador e corretores. Os créditos são da imobiliária, e a equipe inteira usa o mesmo saldo. A auditoria mostra quem criou e quem editou cada tour, com data e hora. Capturas deixadas pela metade ficam salvas como rascunho.
- **Créditos.** 1 crédito = 1 ambiente capturado pela câmera e aprimorado pela IA. Se a IA falhar, o crédito volta para o saldo. Fotos 360° enviadas da galeria (de uma câmera 360° que a imobiliária já tenha) não gastam crédito.

**Promessa central:** o tour 360° que uma câmera de R$ 3.000 faria, feito com o celular que o corretor já tem.

## 3. Para quem

- **Quem decide e paga:** dono ou gestor de imobiliária pequena ou média (2 a 30 corretores). Pensa em custo, em padrão de qualidade da equipe, em rapidez para publicar e em ganhar captações.
- **Quem usa:** o corretor, inclusive o autônomo (ele cria a conta como uma imobiliária de uma pessoa só). Quer parecer profissional, conquistar a exclusividade com o proprietário e perder menos tempo com visita de curioso.

**Tom de voz:** direto, confiante e brasileiro. Frases curtas, tratando o leitor por "você". Sem jargão: "paralaxe" só aparece explicada. Nada de superlativo vazio ("revolucionário", "incrível", "o melhor do mercado"). Prefira fatos e números do produto.

## 4. Regras de honestidade (obrigatórias)

- Não crie depoimentos, logos de clientes, número de usuários, avaliações nem selos como "Mais escolhido". A empresa está começando, e a prova social vem do Programa Fundadores (seção 6.12).
- Nenhum botão pode fingir um checkout. Ainda não existe pagamento pelo site: os botões dos planos levam para criar conta (teste grátis) ou para o WhatsApp.
- Recurso que ainda não existe só aparece com o selo "Em breve".
- Preços de terceiros (câmera, fotógrafo) aparecem como referência, com nota de rodapé e data.
- Não prometa giroscópio, realidade virtual, integração com portais nem app nas lojas.

## 5. Identidade visual

Use estes tokens como variáveis CSS (e no Tailwind, se usar Tailwind). Nunca escreva um hex solto num componente.

```css
:root {
  /* Marca */
  --brand-blue-dark: #0347CC;  /* hover/pressed do azul; texto azul sobre claro */
  --brand-blue: #0454ED;       /* cor principal: identidade, links, botão primário */
  --brand-blue-soft: #E6EEFF;  /* fundos suaves, selecionados, badges */
  --brand-teal-dark: #0F766E;  /* teal para texto/ícone sobre branco */
  --brand-teal: #14B8A6;       /* accent: só áreas grandes, barras, fundos de ícone */
  --brand-teal-soft: #CCFBF1;  /* tags, realces leves */

  /* Neutros */
  --text-strong: #0F172A;
  --text-secondary: #334155;
  --text-muted: #64748B;
  --border: #CBD5E1;
  --bg-section: #F1F5F9;
  --bg-base: #F8FAFC;
  --white: #FFFFFF;

  /* Status: só feedback, nunca cor de marca */
  --status-success: #16A34A;
  --status-warning: #F59E0B;
  --status-error: #DC2626;
}
```

Regras:

- Tema claro no site inteiro, sem modo escuro: a marca reserva o escuro para dentro do visualizador de tour.
- Proporção 60/30/10: 60% neutro, 30% azul, 10% teal.
- Botão primário: fundo `--brand-blue`, texto branco, hover `--brand-blue-dark`. Secundário: contorno `--border` ou texto azul.
- Teal: nunca texto branco sobre `#14B8A6`. Texto ou ícone teal pequeno sobre branco usa `--brand-teal-dark`. Botão teal com texto branco usa `--brand-teal-dark` como fundo.
- Cor de status sempre acompanhada de ícone ou texto.
- Tipografia: Inter (versão variável), que é a fonte de fallback do app. Não use Airbnb Cereal nem Circular, que são fontes proprietárias.
- Logo: `arp-vision-horizontal-blue.svg` no cabeçalho, `arp-vision-horizontal-white.svg` sobre fundo azul, `arp-vision-symbol-blue-transparent.svg` como favicon e símbolo.
- A marca tem uma coruja (animação 3D da cabeça girando, um bom símbolo para "360°"). Use como detalhe, nunca como protagonista.
- Estilo: limpo, muito espaço em branco, fotos grandes de interiores reais, cantos arredondados de 12 a 16px e sombras suaves. A sensação da marca é "claro, confiável e fácil".

## 6. Home: seções, nesta ordem

### 6.1 Cabeçalho fixo

- Logo e os links: Como funciona · Tour real · Planos · Dúvidas.
- "Entrar" (link de texto) → `https://arpvision.app/login`.
- "Criar conta grátis" (botão primário) → `https://arpvision.app/register`.
- No celular: menu hambúrguer, com o botão "Criar conta" sempre visível ao lado.

### 6.2 Hero

Coluna de texto:

- Sobretítulo: "Tour virtual 360° para imobiliárias"
- H1: **"O tour 360° de uma câmera de R$ 3.000. Feito com o seu celular."**
- Subtítulo: "Gire o celular seguindo as bolinhas na tela. A IA da ARP Vision junta as fotos, corrige emendas e luz, e entrega um tour 360° pronto para mandar no WhatsApp e colocar no site da imobiliária."
- Botões: "Criar conta grátis" (primário) e "Ver um tour de verdade" (secundário, rola até a seção 6.4).
- Microtexto abaixo dos botões: "Sem cartão. Sem baixar app. Funciona no navegador do celular."

Coluna visual: mockup de celular tocando o vídeo do tutorial de captura do app (`tutorial-captura-360-v3.mp4`, com a capa `tutorial-captura-360-v3-capa.jpg` como poster), mudo, em loop e com `playsinline`. Opcional: a coruja da marca girando a cabeça num canto, como vídeo curto pré-renderizado. Não carregue three.js nem o arquivo `.glb` na landing.

### 6.3 Faixa de fatos (logo abaixo do hero)

Quatro itens curtos, cada um com ícone:

- **Só o celular.** Sem câmera 360°, sem tripé.
- **~1 minuto por ambiente.** A IA trabalha enquanto você captura o próximo.
- **O cliente abre sem conta.** É só mandar o link no WhatsApp.
- **A equipe inteira usa.** Os créditos são da imobiliária, não do corretor.

### 6.4 Tour real (a seção mais importante da página, `id="tour-real"`)

- Título: **"Isto foi fotografado com um celular."**
- Subtítulo: "Arraste para olhar em volta. Toque nas passagens para ir de um cômodo a outro."
- O tour incorporado. A especificação técnica está na seção 8.
- Se houver mais de um tour de demonstração, mostre abas acima dele: {{TOURS_DEMO}} (exemplo: "Casa · 9 ambientes", "Apartamento", "Sala comercial").
- Ficha técnica em chips, abaixo do tour: "Celular: {{MODELO_DO_CELULAR}}" · "{{FOTOS_POR_AMBIENTE}} fotos por ambiente" · "Sem tripé" · "Captura: {{TEMPO_DE_CAPTURA}} por ambiente" · "IA: ~1 min por ambiente".
- Botão: "Quero tours assim nos meus imóveis" → criar conta.
- Só no desktop: um bloco "Veja no seu celular" com QR code do link público do tour.

### 6.5 Antes e depois da IA

- Título: **"A IA conserta o que o celular sozinho não resolve."**
- Subtítulo: "Quando várias fotos viram uma só, aparecem emendas, objetos duplicados e degraus de luz. A IA da ARP Vision corrige isso usando as suas próprias fotos como referência."
- Componente: comparador com divisória arrastável (mouse, toque e teclado com ←/→). Rótulo à esquerda: "Montagem automática". À direita: "Com a IA da ARP Vision". De 2 a 3 pares (sala, cozinha, quarto) em abas.
- No lado "antes", marcadores numerados sobre os defeitos (1 emenda, 2 objeto duplicado, 3 degrau de luz), com legenda abaixo.
- Faixa de confiança, com ícone de escudo: "A IA corrige, não inventa. Ela não cria móveis nem troca acabamentos, e a sua foto original fica guardada. O cliente vai visitar o imóvel de verdade, então o tour precisa ser fiel a ele."
- Use recortes em perspectiva do mesmo enquadramento nas duas versões. Nunca mostre o panorama equiretangular inteiro, que parece distorcido para quem não conhece o formato. As fontes estão na seção 10.

### 6.6 Como funciona (`id="como-funciona"`)

- Título: **"Do celular ao tour publicado, no mesmo dia."**
- Três passos numerados:
  1. **Capture.** "Abra a ARP Vision no navegador do celular e gire devagar seguindo as bolinhas. Cada ambiente leva de 8 a 12 fotos, numa volta só."
  2. **A IA monta.** "Em cerca de 1 minuto por ambiente, as fotos viram um 360° sem emendas. Enquanto isso, você já captura o próximo cômodo."
  3. **Publique.** "Marque as passagens entre os cômodos e publique. Mande o link no WhatsApp ou cole o código no site da imobiliária."
- Ao lado, o vídeo do tutorial com controles e `preload="none"`.

### 6.7 Onde o tour trabalha por você

Três cards:

- **Na captação.** "Capture na visita de captação e mande o tour para o proprietário no mesmo dia. É o tipo de cuidado que ajuda a conquistar a exclusividade."
- **No WhatsApp.** "O cliente abre o link sem criar conta e conhece o imóvel inteiro antes de marcar a visita."
- **No site da imobiliária.** "Cole o código na página do imóvel e deixe o anúncio muito mais completo."

### 6.8 Comparação com as alternativas

- Título: **"Quanto custa mostrar um imóvel por dentro?"**
- Tabela com a coluna ARP Vision destacada. No celular, vira um card por alternativa, empilhados.

| | Câmera 360° | Fotógrafo profissional | Fotos comuns | ARP Vision |
|---|---|---|---|---|
| Investimento inicial | ~R$ 3.000 por câmera¹ | nenhum | nenhum | nenhum: usa o celular |
| Custo por imóvel | a plataforma de tour costuma ser paga à parte | {{PRECO_FOTOGRAFO}} por sessão¹ | R$ 0 | a partir de {{PRECO_POR_IMOVEL}} |
| Corretores usando ao mesmo tempo | 1 por câmera | depende da agenda | todos | todos |
| Quando fica pronto | depois de editar e publicar | em alguns dias | na hora | no mesmo dia |
| Tour navegável entre cômodos | com a plataforma certa | depende do pacote | não | sim |
| Corrige emendas e luz | depende da câmera e da edição | sim | não se aplica | sim, com IA |

¹ Valores de referência de mercado, pesquisados em {{MES_ANO_DA_PESQUISA}}.

- Frase de fechamento, em destaque: **"Uma câmera 360° para dez corretores vira fila. Com a ARP Vision, cada corretor já tem a sua no bolso."**

### 6.9 Para a imobiliária

- Título: **"Feito para a imobiliária inteira, não só para um corretor."**
- Quatro cards:
  - **Créditos da imobiliária.** "Um saldo só, da imobiliária. Você contrata uma vez e todos os corretores usam."
  - **Equipe.** "Cadastre seus corretores, e cada um entra com o próprio acesso."
  - **Auditoria.** "Veja quem criou e quem editou cada tour, com data e hora."
  - **Mesmo padrão para todos.** "A captura guiada faz o corretor novato e o veterano entregarem o mesmo resultado."
- Ao lado, um print da tela de equipe ou de auditoria: {{PRINT_EQUIPE}}.

### 6.10 Calculadora

- Título: **"De quanto a sua imobiliária precisa?"**
- Entradas (slider com campo numérico): corretores (1 a 50, padrão 5), imóveis captados por mês (1 a 200, padrão 20), ambientes por imóvel (3 a 15, padrão {{AMBIENTES_POR_IMOVEL_PADRAO}}).
- Saídas, atualizadas ao vivo:
  - créditos por mês = imóveis × ambientes;
  - plano recomendado: o menor plano cujos créditos cobrem a necessidade (se passar do maior, "Fale com a gente");
  - custo por imóvel no plano recomendado;
  - comparação: "Uma câmera 360° para cada corretor: {corretores} × R$ 3.000 = R$ X" ao lado de "Um ano de ARP Vision no plano {recomendado}: R$ Y".
- Botão: "Começar com o plano {recomendado}" → criar conta.
- A calculadora lê preços e créditos do mesmo arquivo de configuração dos planos (seção 9).

### 6.11 Planos (prévia)

- Os mesmos cards da página `/planos` (reaproveite o componente), sem a tabela completa.
- Link: "Comparar todos os recursos" → `/planos#comparar`.

### 6.12 Programa Fundadores

- Título: **"Seja uma das {{VAGAS_FUNDADORES}} imobiliárias fundadoras."**
- Texto: "{{DESCONTO_FUNDADORES}} de desconto enquanto a assinatura estiver ativa, e um canal direto com quem constrói o produto. Em troca, queremos ouvir você e, se gostar, contar a sua história aqui."
- Só mostre um contador de vagas restantes se houver um número real para exibir.
- Formulário curto: nome, imobiliária, cidade/UF, número de corretores e WhatsApp, mais um checkbox de consentimento (não marcado por padrão) com link para a Política de Privacidade. Envia para {{DESTINO_DO_FORMULARIO}}. Se não houver destino, o botão abre o WhatsApp com os dados preenchidos na mensagem.

### 6.13 Dúvidas frequentes (`id="duvidas"`, acordeão, com schema `FAQPage`)

- **Preciso comprar câmera 360° ou tripé?** Não. A captura é feita com o celular, na mão. A tela mostra para onde apontar e avisa quando segurar parado.
- **Preciso instalar algum app?** Não. A ARP Vision abre no navegador do celular.
- **Funciona no meu celular?** {{REQUISITOS_DO_CELULAR}}
- **Quanto tempo leva para fazer um tour?** A captura leva {{TEMPO_DE_CAPTURA}} por ambiente. A IA leva cerca de 1 minuto por ambiente, em segundo plano, e você captura o próximo cômodo enquanto ela trabalha.
- **O que é um crédito?** Cada ambiente capturado pela câmera e aprimorado pela IA usa 1 crédito. Os créditos são da imobiliária, e todos os corretores usam o mesmo saldo.
- **E se a IA não conseguir montar um ambiente?** O crédito volta para o saldo, e você pode fotografar o ambiente de novo.
- **A IA muda o imóvel?** Não. Ela corrige os defeitos da montagem: emendas, objetos duplicados e diferenças de luz entre as fotos. Não cria móveis nem troca acabamentos, e a foto original fica guardada. O único trecho completado é o que nenhuma foto alcança, o chão logo abaixo do celular e o centro do teto, seguindo o piso e o teto que aparecem ao redor.
- **Já tenho uma câmera 360°. Ela serve?** Serve. Envie as fotos 360° pela galeria e monte o tour normalmente. Fotos da galeria não gastam créditos.
- **O meu cliente precisa criar conta para ver o tour?** Não. Ele abre o link direto, no celular ou no computador.
- **Posso colocar o tour no site da imobiliária?** Pode. Cada tour tem um código para colar no site, nos formatos responsivo, 16:9 ou quadrado.
- **Como funcionam o pagamento e o cancelamento?** {{POLITICA_DE_COBRANCA}}

### 6.14 Chamada final

- Faixa com fundo `--brand-blue` e logo branco.
- Título: **"O seu próximo imóvel pode ter tour 360° hoje."**
- Botões: "Criar conta grátis" (fundo branco, texto azul) e "Falar no WhatsApp".

### 6.15 Rodapé

- Logo, links das seções, Planos, Entrar, Criar conta.
- Contato: {{EMAIL_DE_CONTATO}} · WhatsApp {{WHATSAPP}}.
- Termos de Uso (`/termos-de-uso`) e Política de Privacidade (`/politica-de-privacidade`).
- "© {{ANO}} ARP Vision · {{RAZAO_SOCIAL}} · CNPJ {{CNPJ}}". Enquanto razão social e CNPJ estiverem vazios no config, essa parte da linha não aparece.

**Botão flutuante de WhatsApp** em todas as páginas (canto inferior direito, sem cobrir o botão de "Criar conta" no celular), com a mensagem pronta: "Olá! Vim pelo site e quero saber mais sobre a ARP Vision."

## 7. Página `/planos`

- Título: **"Planos para todo tamanho de imobiliária"**
- Subtítulo: "1 crédito = 1 ambiente com IA. Um imóvel costuma ter de 6 a 10 ambientes."
- Alternância Mensal / Anual ({{DESCONTO_ANUAL}}). No anual, mostre o valor mensal equivalente e o total por ano.

Quatro cards (os dados vêm do config):

| Plano | Para quem | Preço | Créditos | Destaques |
|---|---|---|---|---|
| Teste grátis | quem quer ver funcionando | R$ 0 | {{CREDITOS_TESTE}}, uma vez só (≈ 1 imóvel completo) | captura, IA e compartilhamento completos; sem cartão |
| Corretor | corretor autônomo | {{PRECO_CORRETOR}}/mês | {{CREDITOS_CORRETOR}}/mês | link, WhatsApp e código para o site; suporte por e-mail |
| Imobiliária (selo "Recomendado") | equipes | {{PRECO_IMOBILIARIA}}/mês | {{CREDITOS_IMOBILIARIA}}/mês | {{USUARIOS_IMOBILIARIA}} corretores; auditoria; treinamento da equipe; suporte por WhatsApp |
| Rede | várias unidades ou alto volume | sob consulta | sob medida | suporte dedicado |

- Em cada card: preço, "≈ N imóveis por mês" (créditos ÷ {{AMBIENTES_POR_IMOVEL_PADRAO}}, arredondado para baixo), custo por ambiente, de 4 a 5 bullets e o botão.
- Botões: Teste grátis → `https://arpvision.app/register`. Planos pagos → "Começar teste grátis" (register), com o link secundário "Falar com vendas" (WhatsApp com o nome do plano na mensagem). Rede → "Falar com vendas".
- Créditos avulsos: pacotes de {{PACOTES_AVULSOS}}, cada um com o seu preço, com o texto "Para os meses de muita captação."

**Tabela de comparação** (`id="comparar"`): cabeçalho fixo ao rolar e primeira coluna fixa no celular (a rolagem horizontal fica só dentro da tabela). Use ✓, "—", um valor, ou o selo "Em breve".

| Recurso | Teste grátis | Corretor | Imobiliária | Rede |
|---|---|---|---|---|
| **Captura e IA** | | | | |
| Créditos de IA | {{CREDITOS_TESTE}} (uma vez) | {{CREDITOS_CORRETOR}}/mês | {{CREDITOS_IMOBILIARIA}}/mês | sob medida |
| Captura guiada 360° pelo celular | ✓ | ✓ | ✓ | ✓ |
| IA corrige emendas, objetos duplicados e luz | ✓ | ✓ | ✓ | ✓ |
| Crédito devolvido se a IA falhar | ✓ | ✓ | ✓ | ✓ |
| Fotos 360° da galeria sem gastar crédito | ✓ | ✓ | ✓ | ✓ |
| **Tours e compartilhamento** | | | | |
| Passagens entre os ambientes | ✓ | ✓ | ✓ | ✓ |
| Link público: o cliente abre sem conta | ✓ | ✓ | ✓ | ✓ |
| Atalho para WhatsApp e e-mail | ✓ | ✓ | ✓ | ✓ |
| Código para o site (responsivo, 16:9, quadrado) | ✓ | ✓ | ✓ | ✓ |
| Tour com a marca da sua imobiliária | — | — | Em breve | Em breve |
| Relatório de visitas por tour | — | Em breve | Em breve | Em breve |
| **Equipe e gestão** | | | | |
| Corretores na conta | {{USUARIOS_TESTE}} | {{USUARIOS_CORRETOR}} | {{USUARIOS_IMOBILIARIA}} | sob medida |
| Saldo de créditos compartilhado pela equipe | ✓ | ✓ | ✓ | ✓ |
| Auditoria de criação e edição de tours | ✓ | ✓ | ✓ | ✓ |
| Rascunhos: continue a captura depois | ✓ | ✓ | ✓ | ✓ |
| **Suporte** | | | | |
| Canal de suporte | e-mail | e-mail | WhatsApp | dedicado |
| Treinamento da equipe | — | — | ✓ | ✓ |

As duas linhas "Em breve" são recursos planejados. Cada linha da tabela vem do config e pode ser removida lá.

Perguntas de cobrança, abaixo da tabela: "O que é um crédito?", "Os créditos acumulam de um mês para o outro?" ({{CREDITO_ACUMULA}}), "Posso trocar de plano?", "Como funciona o cancelamento?" ({{POLITICA_DE_COBRANCA}}), "Vocês emitem nota fiscal?" ({{NOTA_FISCAL}}).

## 8. O tour incorporado (especificação técnica)

- URL: `https://arpvision.app/embed/{{ID_DO_TOUR_DEMO}}`. O parâmetro opcional `?controles=0` esconde a faixa de ambientes e a barra de ações; as passagens continuam na tela.
- **Não carregue o iframe junto com a página.** Ele traz o app inteiro e um visualizador WebGL. Mostre primeiro uma capa (imagem estática do ambiente com o botão "Entrar no imóvel") e troque pelo iframe no clique.
- **Desktop e tablet** (iframe com 768px de largura ou mais): iframe na própria página, proporção 16:9, largura 100% até 1100px, cantos arredondados.
- **Celular** (menos de 768px): **não** coloque o iframe dentro da página. Abaixo de 768px de largura, o visualizador gira a imagem 90° (um modo "deitado", feito para a pessoa virar o aparelho). Dentro de uma página em pé, isso parece defeito e ainda prende a rolagem. No celular, o botão abre o tour em tela cheia: um overlay de 100vw × 100dvh com botão "Fechar" sempre visível e foco preso dentro dele (ou `window.open` do link público).
- Atributos: `title="Tour 360° de exemplo: {{NOME_DO_IMOVEL_DEMO}}"`, `allow="fullscreen"`, `allowfullscreen`, `loading="lazy"`, `referrerpolicy="strict-origin-when-cross-origin"`. Não use `sandbox`: o visualizador precisa de scripts, armazenamento local e tela cheia.
- Se o tour não carregar em 15 segundos, volte a mostrar a capa com "Não foi possível abrir o tour agora" e um link para abrir em nova aba.
- Com mais de um tour, as abas trocam o `src`, e cada tour tem a sua capa.

## 9. Requisitos técnicos

- **Stack:** site estático pré-renderizado. Cada rota precisa sair como HTML pronto, para o Google e para a prévia do link no WhatsApp. Preferência: Astro com Tailwind CSS, e JavaScript só nas partes interativas (tour, comparador, calculadora, alternância de planos, FAQ). Se a ferramenta só gera SPA em React, pré-renderize as rotas.
- **Config central:** preços, créditos, planos, linhas da tabela de comparação, IDs dos tours, links, WhatsApp e dados do rodapé ficam num arquivo só (por exemplo `src/config/site.ts`). Trocar um preço não pode exigir mexer em componente.
- **Desempenho** (celular em 4G): LCP abaixo de 2,5 s, CLS abaixo de 0,1, JavaScript inicial abaixo de 100 KB, e Lighthouse 90 ou mais em Performance, Acessibilidade, Boas Práticas e SEO.
- **Mídia:** imagens em AVIF/WebP com `srcset`, largura e altura declaradas. Vídeos com `muted playsinline` e poster, e `preload="none"` fora do hero.
- **Acessibilidade:** WCAG AA. Tudo navegável por teclado, com foco visível. O comparador usa `role="slider"` e responde às setas. `prefers-reduced-motion` desliga as animações e o autoplay.
- **Animações:** sutis (entrada das seções, números contando). Nada de sequestrar a rolagem.
- **SEO:** `lang="pt-BR"`, canonical, `sitemap.xml` e `robots.txt`. Open Graph e Twitter Card com imagem de 1200×630 ({{OG_IMAGE}}), porque o link vai circular muito no WhatsApp. Schema.org: `Organization`, `SoftwareApplication` com `Offer` na `/planos`, e `FAQPage`.
  - Home: título "Tour virtual 360° com o celular | ARP Vision" e descrição "Faça o tour virtual 360° dos seus imóveis só com o celular. A IA corrige emendas e luz, e o cliente abre o tour pelo WhatsApp, sem criar conta."
  - Planos: título "Planos e preços | ARP Vision".
- **Links para o app** com UTM: `?utm_source=site&utm_medium={seção}&utm_campaign=landing`.
- **Privacidade e analytics (LGPD):** comece com analytics sem cookies (Plausible ou Umami). Se usar GA4 ou Meta Pixel, eles só carregam depois do consentimento, num banner com "Aceitar" e "Recusar" do mesmo tamanho. Eventos: `cta_criar_conta` (com a seção), `cta_whatsapp`, `tour_aberto`, `tour_tela_cheia`, `antes_depois_usado`, `calculadora_usada`, `plano_anual_selecionado`, `form_fundadores_enviado`.

## 10. Arquivos disponíveis

Caminhos a partir da raiz do workspace. Se você não tiver acesso a eles, serão enviados junto com este prompt.

- Logos: `imob-view-360/inner-view-client/src/assets/brand/` (horizontal azul em SVG e PNG, horizontal branco em SVG, símbolo azul em SVG).
- Vídeo da captura: `imob-view-360/inner-view-client/src/assets/tutorial-captura/tutorial-captura-360-v3.mp4` e a capa `tutorial-captura-360-v3-capa.jpg`.
- Coruja 3D: `imob-view-360/inner-view-client/src/assets/owl-loader/logo-coruja-cabeca-3d-animada.glb`. Renderize como vídeo curto (WebM/MP4). Não carregue o `.glb` na landing.
- Antes/depois (a mesma casa, 9 ambientes): sem IA em `imagens-exportadas/casa-do-alemao/panoramas-sem-ia/`, com IA em `imagens-exportadas/casa-do-alemao/panoramas/`. Os pares batem pelo nome do cômodo (`02-sala.jpg` ↔ `2-sala.jpg`). São panoramas equiretangulares 2:1: gere recortes em perspectiva (cerca de 90° de campo de visão, 1600×1000) do MESMO ângulo nas duas versões.
- Design system completo da marca: `imob-view-360/ARP-VISION-DESIGN.md`.

## 11. Critérios de aceite

- [ ] Home e `/planos` saem como HTML estático, cada uma com título, descrição e imagem de Open Graph próprios.
- [ ] `/termos-de-uso` e `/politica-de-privacidade` existem nesses endereços.
- [ ] Nenhum depoimento, logo de cliente ou número inventado, e nenhum botão que finja checkout.
- [ ] Tour: a capa vem primeiro, o iframe só carrega no clique, e no celular o tour abre em tela cheia.
- [ ] O comparador antes/depois funciona com mouse, toque e teclado.
- [ ] Calculadora, cards e tabela leem o mesmo config: trocar um preço lá muda o site inteiro.
- [ ] A tabela de comparação é legível em 360px de largura.
- [ ] Contraste AA (atenção ao teal) e Lighthouse mobile de 90 ou mais nas quatro notas.
- [ ] Todos os links de conta apontam para `https://arpvision.app/register` ou `https://arpvision.app/login`, com UTM.

## 12. Preencher antes de rodar

| Placeholder | O que é | Sugestão |
|---|---|---|
| `{{DOMINIO_DO_SITE}}` | domínio do site | `arpvision.com.br` |
| `{{ID_DO_TOUR_DEMO}}`, `{{TOURS_DEMO}}`, `{{NOME_DO_IMOVEL_DEMO}}` | tour(s) publicado(s) só para a demonstração | id que aparece no link `/embed/<id>` |
| `{{MODELO_DO_CELULAR}}`, `{{FOTOS_POR_AMBIENTE}}`, `{{TEMPO_DE_CAPTURA}}` | ficha técnica real da captura da demo | anote na hora de capturar |
| `{{CREDITOS_TESTE}}` | créditos do teste grátis | 10 ou mais, para caber um imóvel inteiro |
| `{{PRECO_CORRETOR}}`, `{{CREDITOS_CORRETOR}}` | plano Corretor | |
| `{{PRECO_IMOBILIARIA}}`, `{{CREDITOS_IMOBILIARIA}}` | plano Imobiliária | preço tal que 1 ano custe menos que R$ 3.000 |
| `{{USUARIOS_TESTE}}`, `{{USUARIOS_CORRETOR}}`, `{{USUARIOS_IMOBILIARIA}}` | corretores por plano | "ilimitados", se não forem limitar |
| `{{DESCONTO_ANUAL}}` | desconto do anual | "2 meses grátis" |
| `{{PACOTES_AVULSOS}}` | pacotes avulsos e preços | 10, 25 e 50 créditos (os do app) |
| `{{AMBIENTES_POR_IMOVEL_PADRAO}}` | média usada nas contas | 8 |
| `{{PRECO_POR_IMOVEL}}` | sai dos preços acima | |
| `{{PRECO_FOTOGRAFO}}`, `{{MES_ANO_DA_PESQUISA}}` | referência de mercado | pesquise na sua cidade |
| `{{VAGAS_FUNDADORES}}`, `{{DESCONTO_FUNDADORES}}` | Programa Fundadores | 50 vagas, 30% |
| `{{DESTINO_DO_FORMULARIO}}` | para onde vai o formulário | vazio = WhatsApp |
| `{{WHATSAPP}}`, `{{EMAIL_DE_CONTATO}}` | contato comercial | um e-mail que de fato recebe mensagens |
| `{{RAZAO_SOCIAL}}`, `{{CNPJ}}`, `{{ANO}}` | rodapé | vazio até a empresa existir |
| `{{REQUISITOS_DO_CELULAR}}` | celulares compatíveis | confirmar com testes |
| `{{POLITICA_DE_COBRANCA}}`, `{{CREDITO_ACUMULA}}`, `{{NOTA_FISCAL}}` | regras de cobrança | |
| `{{TEXTO_TERMOS}}`, `{{TEXTO_PRIVACIDADE}}` | documentos legais | vêm da frente de LGPD |
| `{{OG_IMAGE}}`, `{{PRINT_EQUIPE}}` | imagens | print do tour com o logo; print da tela de equipe |
