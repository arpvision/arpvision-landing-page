# Prompt de atualização: a landing da ARP Vision passa a falar com qualquer negócio

> Cole tudo abaixo da linha na mesma ferramenta que gerou o site a partir de `PROMPT-LANDING-ARPVISION.md`.
> É uma atualização de texto. Nada de estrutura muda.

---

Você vai atualizar o site de marketing da **ARP Vision** que você mesmo construiu a partir do prompt original. O público do produto mudou: **a ARP Vision deixou de ser só para imobiliárias e corretores e passou a atender qualquer empresa ou negócio que precise mostrar um espaço por dentro com um tour 360°**, como fazem Matterport e Nodalview. Imobiliárias continuam bem-vindas, mas viram um exemplo entre vários.

## 1. O que NÃO muda (obrigatório)

- Nenhuma seção entra, sai ou troca de ordem. As páginas, rotas (`/`, `/planos`, `/termos-de-uso`, `/politica-de-privacidade`), âncoras (`#tour-real`, `#como-funciona`, `#duvidas`, `#comparar`) e componentes ficam como estão.
- Layout, espaçamentos, tokens de cor, tipografia, logos, imagens, vídeos e animações ficam iguais.
- O arquivo de config (`src/config/site.ts` ou equivalente) mantém as **mesmas chaves**. Mude só os textos exibidos; não renomeie chave, não mude preço nem crédito.
- Os `{{PLACEHOLDERS}}` ainda não preenchidos continuam onde estão.
- As regras de honestidade do prompt original continuam valendo: nada de depoimento, logo de cliente, número inventado, checkout fingido ou recurso sem o selo "Em breve".
- Tom de voz igual: direto, confiante, brasileiro, tratando o leitor por "você", sem superlativo vazio.

## 2. Glossário da mudança

Não faça busca-e-troca cega: reescreva cada frase para ficar natural. Esta é a regra geral, e a seção 3 traz o texto final das frases mais importantes.

| Hoje | Passa a ser |
|---|---|
| imobiliária (a empresa do cliente) | empresa, negócio, ou "você" |
| corretor / corretores (quem usa) | você, sua equipe, quem captura, cada pessoa da equipe |
| imóvel (o que é fotografado) | espaço, ambiente, "o seu espaço"; "imóvel" só como um exemplo entre outros |
| site da imobiliária | o seu site |
| captação, exclusividade, proprietário, visita de curioso, imóvel vendido | jargão de imobiliária: sai, salvo dentro de um exemplo explícito de imobiliária |
| "para imobiliárias" | "para o seu negócio" |

Exemplos de negócio que podem aparecer quando o texto precisar de exemplos (use de 3 a 5 por vez, nunca a lista inteira): imobiliárias, hotéis e pousadas, salões de festas e espaços de eventos, lojas e showrooms, clínicas e consultórios, restaurantes, academias, escolas, escritórios e coworkings, construtoras e arquitetos.

Novo fato do produto para o seu contexto: **a conta é da empresa, com administrador e usuários**. No app, o perfil que se chamava "Corretor" agora se chama "Usuário". Os créditos são da empresa, e a equipe inteira usa o mesmo saldo.

## 3. Texto final, seção por seção da Home

Onde o texto está entre aspas, use exatamente assim. Onde eu descrevo, reescreva seguindo o glossário.

### 3.1 Hero

- Sobretítulo: "Tour virtual 360° para o seu negócio"
- H1: mantém: "O tour 360° de uma câmera de R$ 3.000. Feito com o seu celular."
- Subtítulo: "Gire o celular seguindo as bolinhas na tela. A IA da ARP Vision junta as fotos, corrige emendas e luz, e entrega um tour 360° pronto para mandar no WhatsApp e colocar no seu site."
- Botões e microtexto: mantêm.

### 3.2 Faixa de fatos

Só o quarto item muda: **"A equipe inteira usa."** "Os créditos são da empresa, não de uma pessoa."

### 3.3 Tour real

- Título e subtítulo: mantêm.
- Botão: "Quero um tour assim do meu espaço"
- Abas de demonstração: se houver tour de demonstração que não seja imóvel (loja, hotel, salão), inclua. Se só houver imóveis, mantenha os que existem.

### 3.4 Antes e depois da IA

Faixa de confiança: "A IA corrige, não inventa. Ela não cria móveis nem troca acabamentos, e a sua foto original fica guardada. Quem vê o tour vai conhecer o espaço de verdade, então o tour precisa ser fiel a ele."

### 3.5 Como funciona

Passo 3: **Publique.** "Marque as passagens entre os ambientes e publique. Mande o link no WhatsApp ou cole o código no seu site."

### 3.6 Onde o tour trabalha por você

Os três cards trocam de cenário; a estrutura (três cards, título curto em negrito e uma frase) fica igual:

- **Antes da visita.** "Mande o tour antes de a pessoa ir até você. Quem chega já conhece o espaço e vem decidido."
- **No WhatsApp.** "O cliente abre o link sem criar conta e vê o espaço inteiro em um minuto."
- **No seu site.** "Cole o código na página e mostre por dentro o que uma foto sozinha não mostra."

### 3.7 Comparação com as alternativas

- Título: **"Quanto custa mostrar um espaço por dentro?"**
- Linhas da tabela: "Custo por imóvel" vira "Custo por espaço"; "Corretores usando ao mesmo tempo" vira "Pessoas capturando ao mesmo tempo". As outras linhas e colunas ficam.
- Frase de fechamento: **"Uma câmera 360° para a equipe inteira vira fila. Com a ARP Vision, cada pessoa já tem a sua no bolso."**

### 3.8 Para a imobiliária → Para a empresa

- Título: **"Feito para a empresa inteira, não só para uma pessoa."**
- Cards:
  - **Créditos da empresa.** "Um saldo só, da empresa. Você contrata uma vez e toda a equipe usa."
  - **Equipe.** "Cadastre quem vai capturar, e cada pessoa entra com o próprio acesso."
  - **Auditoria.** mantém.
  - **Mesmo padrão para todos.** "A captura guiada faz quem nunca fotografou e quem já é experiente entregarem o mesmo resultado."

### 3.9 Calculadora

- Título: **"De quanto a sua empresa precisa?"**
- Rótulos das entradas: "pessoas na equipe", "espaços por mês", "ambientes por espaço". Os limites, os padrões e a conta não mudam.
- Saídas: "custo por espaço no plano recomendado"; comparação: "Uma câmera 360° para cada pessoa da equipe: {pessoas} × R$ 3.000 = R$ X".
- Botão: mantém.

### 3.10 Programa Fundadores

- Título: **"Seja uma das {{VAGAS_FUNDADORES}} empresas fundadoras."**
- Formulário: o campo "imobiliária" passa a "empresa" e "número de corretores" passa a "tamanho da equipe". Mesmos campos, mesma ordem, mesmo destino.

### 3.11 Dúvidas frequentes

Só estas mudam; as demais ficam:

- **O que é um crédito?** "Cada ambiente capturado pela câmera e aprimorado pela IA usa 1 crédito. Os créditos são da empresa, e toda a equipe usa o mesmo saldo."
- **A IA muda o espaço?** (era "A IA muda o imóvel?") Resposta igual à atual.
- **Posso colocar o tour no meu site?** "Pode. Cada tour tem um código para colar no site, nos formatos responsivo, 16:9 ou quadrado."

### 3.12 Chamada final

Título: **"O seu espaço pode ter tour 360° hoje."**

### 3.13 SEO da Home

Descrição: "Faça o tour virtual 360° do seu espaço só com o celular. A IA corrige emendas e luz, e o cliente abre o tour pelo WhatsApp, sem criar conta." O título fica.

## 4. Página `/planos`

- Título: **"Planos para todo tamanho de negócio"**
- Subtítulo: "1 crédito = 1 ambiente com IA. Um espaço costuma ter de 6 a 10 ambientes."
- Nos cards: "≈ N espaços por mês" no lugar de "≈ N imóveis por mês".
- Tabela de comparação: "Corretores na conta" vira "Pessoas na conta"; "Tour com a marca da sua imobiliária" vira "Tour com a marca da sua empresa". O resto fica.
- Card "Corretor": coluna "para quem" passa a "quem trabalha sozinho". Card "Imobiliária": "para quem" passa a "equipes". Os nomes dos cards seguem o bloco opcional abaixo.

### 4.1 Bloco opcional: nomes dos planos

Os nomes "Corretor", "Imobiliária" e "Rede" carregam o público antigo. Se este bloco for aplicado, renomeie **só o texto exibido** (as chaves do config como `PRECO_CORRETOR` continuam iguais):

| Hoje | Passa a ser |
|---|---|
| Corretor | Professional |
| Imobiliária | Business |
| Rede | Enterprise |

"Teste grátis" fica. Mensagens do WhatsApp que citam o nome do plano usam o nome novo. Se preferir manter os nomes por enquanto, pule este bloco e o resto da atualização continua válido.

## 5. Como entregar

1. Aplique as mudanças e rode uma busca em todo o código e no config por `imobiliári`, `corretor` e `imóve`. O que sobrar precisa ser um exemplo explícito ("um imóvel, uma loja, um hotel") ou uma chave interna do config. Liste cada ocorrência que ficou e o motivo.
2. Confira que a Home e a `/planos` continuam saindo como HTML estático com título, descrição e Open Graph, e que nada mudou de lugar: mesmo número de seções, mesma ordem, mesmos componentes.
3. No fim da resposta, liste todos os textos alterados no formato "antes → depois", seção por seção, para revisão.
