/**
 * Inglês internacional, claro e direto, conforme a coluna Inglês do glossário de
 * docs/produto/idiomas.md e o en.json do app: room (ambiente), enhance (aprimorar), tours
 * live (tours no ar), property, credits, free trial, sign in, phone. Sem "AI".
 *
 * Com imobiliárias, valem também os termos da seção Inglês da spec dos produtos: real estate
 * agency na primeira menção de cada página e agency depois ("real estate" só nessa expressão;
 * "marketing agency" é a agência de marketing), agent (corretor), property (imóvel), listing
 * quando é o anúncio, your listings (carteira) e quote (cotação, "Get a quote"). Captação, em
 * todo o site: "Owners" (no Piloto automático para Instagram, o tipo da arte e o título do item
 * do incluído), que diz a quem o post fala; no verbo, "listed" ("listed two homes"). Não "listing
 * leads": dentro da arte, que o seguidor da agência vê, seria jargão de corretor, e passa do
 * comprimento de "Captação". O CRECI, que os mercados de língua inglesa não têm, dá lugar ao
 * número da licença que a agência informar ("License #00000" nas telas de exemplo).
 *
 * Tradução do português, com as mesmas exceções do espanhol: aqui não entra promessa de
 * funcionalidade que o app não tem, nem serviço local (o ARP Vision Presencial, que só atende
 * Porto Alegre e região), e a página de tutoriais avisa que os vídeos são narrados em
 * português. Os pontos em que o texto diverge do português estão marcados com DIFERENTE.
 */
import type { Dictionary } from './pt';

/** "1 room", "2 rooms". */
const rooms = (count: number) => `${count} ${count === 1 ? 'room' : 'rooms'}`;

export const en: Dictionary = {
  meta: {
    defaultDescription:
      'Create a 360° virtual tour of your property with just your phone. Seams and lighting come out corrected, and clients open it on WhatsApp with no account.',
  },
  layout: { skipLink: 'Skip to content' },
  language: { label: 'Language' },
  brand: { home: 'ARP Vision — home' },
  whatsappMessage: "Hi! I came from the website and I'd like to know more about ARP Vision.",
  header: {
    mainNav: 'Main navigation',
    mobileNav: 'Mobile navigation',
    products: 'Products',
    productsPanel: 'ARP Vision products',
    viewAllProducts: 'See all products',
    // Selo dos produtos novos: quer dizer produto novo, e não "em breve".
    newBadge: 'New',
    realTour: 'Real tour',
    plans: 'Plans',
    quote: 'Get a quote',
    faq: 'FAQ',
    tutorials: 'Tutorials',
    darkTheme: 'Dark theme',
    login: 'Sign in',
    loginLong: 'Sign in to my account',
    signup: 'Create a free account',
    signupShort: 'Sign up',
    menu: 'Menu',
    close: 'Close',
  },
  // Menu "Produtos" do cabeçalho: os grupos e, de cada produto, o nome e uma linha.
  products: {
    // O público dos dados estruturados (`Service`) de cada produto.
    audience: 'Real estate agencies',
    // Etiqueta visível de toda tela de exemplo das páginas de produto, que nunca passa por caso
    // real. A descrição de cada tela para o leitor de tela começa por esta palavra e dois-pontos.
    example: 'Example',
    // O fim das páginas de produto, com os outros produtos no ar.
    also: 'More from ARP Vision',
    groups: {
      show: 'Show the property',
      promote: 'Promote and respond',
      // Só aparece com o ARP Vision Presencial, que não existe no inglês (`inPerson: null`).
      team: 'With our team',
    },
    items: {
      tour: { name: '360° virtual tour', line: 'Inside the property, with a phone.' },
      videos: { name: 'Videos from photos', line: 'Reels, stories, portals.' },
      instagram: {
        name: 'Autopilot for Instagram',
        line: 'A month of posts, ready to approve.',
      },
      autochat: { name: 'Autochat', line: 'Answers WhatsApp, hands off to agents.' },
    },
    // DIFERENTE: o ARP Vision Presencial só existe em português (só atende Porto Alegre e região),
    // como no espanhol: no inglês, sem o grupo "With our team".
    inPerson: null,
  },
  // As páginas dos produtos novos (/en/products/<produto>), uma por produto. As telas de exemplo
  // usam só nomes fictícios (Example Realty, youragency, Example Neighborhood, License #00000) e
  // nenhum preço.
  // DIFERENTE: os mercados de língua inglesa não têm CRECI. No lugar dele entra o número da licença
  // que a agência informar, com o nome dela, em toda peça (spec, seção Inglês): no apoio da
  // galeria, no item do incluído, na dúvida e nas artes ("License #00000"). O texto nunca diz que o
  // produto garante o cumprimento de regra de licença ou de publicidade.
  productPages: {
    instagram: {
      meta: {
        title: 'Autopilot for Instagram, for real estate agencies | ARP Vision',
        description:
          'ARP Vision prepares a month of Instagram posts and stories for your real estate agency, with your properties and area. You approve and ARP Vision publishes.',
      },
      hero: {
        eyebrow: 'AUTOPILOT FOR INSTAGRAM',
        title: "Your real estate agency's Instagram, on autopilot.",
        lead: 'ARP Vision prepares a month of posts and stories with your properties, your area and the look of your brand. You approve, and ARP Vision publishes on the scheduled day.',
        button: 'Get a quote on WhatsApp',
        note: 'No post goes out without your approval.',
        mockDescription:
          'Example: a two-week calendar for Example Realty, with posts and stories already approved, others waiting for your approval, and the Approve all button.',
      },
      pain: {
        eyebrow: 'SOUND FAMILIAR?',
        before: 'This month you',
        // O fim do título troca sozinho entre estes trechos e para no primeiro. Cada um cabe numa
        // linha a 360 px: o título reserva a altura do maior. No inglês, até 18 caracteres por
        // trecho, contando o ponto.
        phrases: [
          'sold a house.',
          'listed two homes.',
          'leased an office.',
          // DIFERENTE: no lugar do cartório, "closed a deal.", que se lê em qualquer mercado de
          // língua inglesa (o closing americano é só dos EUA e do Canadá) e cabe em 18 caracteres.
          'closed a deal.',
        ],
        after: 'And none of it made it to Instagram.',
        text: 'Keeping your profile up to date between visits is hard.',
      },
      steps: {
        title: 'Three steps. Then you just approve.',
        items: [
          {
            title: 'Send your website address',
            text: "ARP Vision reads your brand, your area and your properties from your website. If the website can't be read, or if you don't have one, you send the photos and details of your properties.",
          },
          {
            title: 'Choose your style',
            text: 'See one of your properties in each style, with your logo and colors, and pick your favorite.',
          },
          {
            title: 'Approve the month',
            text: 'All at once or post by post. If you want a change, request it on the post itself. ARP Vision publishes each one on the scheduled day.',
          },
        ],
      },
      // As oito artes, nesta ordem. PostGallery.astro escolhe a foto e o formato de cada uma pelo
      // `id`, que é o mesmo em todos os idiomas e não aparece na página; `kind` é o tipo de post, e
      // `title`, o texto principal da arte.
      gallery: {
        title: 'What your posts look like',
        // DIFERENTE: o número da licença no lugar do CRECI.
        lead: 'With photos of your properties, your logo and your license number on every post.',
        arts: [
          { id: 'sale', kind: 'For sale', title: '3-bedroom house with a pool' },
          // DIFERENTE: só a lareira. Com a varanda, o título passa do comprimento do português e
          // vai a três linhas a 360 px.
          { id: 'rent', kind: 'For rent', title: 'House with a fireplace' },
          // DIFERENTE: sem o "mais uma" ("Another key" é decalque: em inglês se entregam "the
          // keys"), para caber no comprimento do português. O selo "Sold" já diz que vendeu.
          { id: 'sold', kind: 'Sold', title: 'Keys handed over in Example Neighborhood' },
          { id: 'tour', kind: '360° tour', title: 'Look inside this house' },
          // As artes só de texto (bairro e dica) têm a altura mais justa: a 360 px, o rodapé delas
          // já corta no português, pelo CSS do PostArt, e não pelo texto. Com os títulos no mesmo
          // número de linhas do português, o inglês herda o corte sem piorar; "Example
          // Neighborhood" sozinho já ocupa duas.
          // DIFERENTE: "Around Example Neighborhood" ("o que há em volta"), e não "What's nearby in
          // Example Neighborhood", que vai a três linhas a 360 e 390 px e corta ainda mais o
          // rodapé.
          { id: 'neighborhood', kind: 'Your area', title: 'Around Example Neighborhood' },
          { id: 'tip', kind: 'Tip', title: 'Documents to get ready before selling' },
          // DIFERENTE: "Owners" no lugar de "Captação" (ver o cabeçalho).
          { id: 'valuation', kind: 'Owners', title: 'Selling or renting out? Get a valuation' },
          { id: 'story', kind: 'Story', title: 'New in Example Neighborhood' },
        ],
      },
      included: {
        title: "What's included",
        items: [
          {
            title: 'Posts and stories',
            text: 'The whole month, on the days and at the times you choose.',
          },
          { title: 'Sale and rental listings', text: 'For sale, for rent, sold and rented.' },
          { title: 'Your area', text: 'Posts about the neighborhoods where you work.' },
          // DIFERENTE: "Owners" no lugar de "Captação" (ver o cabeçalho).
          { title: 'Owners', text: 'Posts inviting owners to ask for a valuation.' },
          { title: 'Your brand', text: 'Your logo, your colors and the style you choose.' },
          {
            // DIFERENTE: o número da licença no lugar do CRECI.
            title: 'License number on every post',
            text: "Your agency's name and the license number you provide, shown prominently.",
          },
          {
            title: '360° tours in posts',
            text: "Posts that invite people to see the property's tour.",
          },
          { title: 'You approve first', text: 'And request changes to any post you want.' },
        ],
      },
      comparison: {
        title: 'Three ways to manage Instagram',
        // DIFERENTE: "Marketing agency", e não só "agency": no inglês, "agency" sozinho é a
        // imobiliária do cliente. E não "Hire a marketing agency", que quebra em duas linhas a 1024
        // e 1440 px.
        columns: ['Do it yourself', 'Marketing agency', 'ARP Vision'],
        rows: [
          {
            label: 'Your time',
            values: ['Hours every week', 'Meetings and revisions', 'Approving the month'],
          },
          {
            label: 'Posts with your properties and area',
            values: [
              'When you find the time',
              'If you send the material',
              'From your website or the photos you send',
            ],
          },
          { label: 'Consistency', values: ['Depends on the week', 'Yes', 'Yes, every month'] },
        ],
      },
      // A resposta escolhida entra na mensagem do WhatsApp como está escrita aqui; o `id` só
      // nomeia o campo do formulário.
      quote: {
        eyebrow: 'CUSTOM PRICING',
        title: 'A proposal sized to your listings.',
        lead: 'Answer 3 quick questions and get a proposal on WhatsApp for your properties and the number of posts you want, with no commitment.',
        questions: [
          {
            id: 'listings',
            label: 'How many properties do you have listed?',
            summary: 'Listed properties',
            options: ['Up to 20', '21 to 100', 'More than 100'],
          },
          {
            id: 'posts',
            label: 'How many posts per week?',
            summary: 'Posts per week',
            options: ['2', '3', '5', 'Not sure yet'],
          },
          {
            // A pergunta e o resumo da cotação da home no inglês ("When do you need it?").
            id: 'timing',
            label: 'When do you need it?',
            summary: 'When I need it',
            options: ['This month', 'Next month', 'Still researching'],
          },
        ],
        greeting:
          "Hi! I came from the website and I'd like a quote for ARP Vision's Autopilot for Instagram.",
        closing: 'Could you send me a proposal?',
      },
      faq: {
        eyebrow: 'FREQUENTLY ASKED QUESTIONS',
        title1: 'You ask.',
        title2: 'We explain.',
        lead1: 'No fine print.',
        // DIFERENTE: o nome inteiro do produto, e não a forma curta do português ("Piloto
        // automático"): "Autopilot" sozinho leria como palavra comum.
        lead2: 'Understand every part of Autopilot for Instagram.',
        items: [
          {
            question: 'Do I need a professional Instagram account?',
            answer:
              'Yes. The account has to be a professional one (business or creator). Switching is free and you do it right in Instagram.',
          },
          {
            // DIFERENTE: o número da licença no lugar do CRECI.
            question: 'Does my license number appear on every post?',
            answer:
              "Yes. Every post carries your agency's name and the license number you provide.",
          },
          {
            question: 'Where do the properties come from?',
            answer:
              "From your agency's website. If the website can't be read, or if you don't have one, you send the photos and details of your properties.",
          },
          {
            question: 'Can I change a post before it goes out?',
            answer: 'Yes. You request a change on the post itself, or take it off the calendar.',
          },
          {
            question: 'How many posts and stories per month?',
            answer: 'You choose how many per week, and the proposal takes that into account.',
          },
          {
            question: 'Can a post go out without me seeing it?',
            answer: 'No. Only what you approved goes out.',
          },
          {
            question: 'Do stories have a link?',
            answer:
              "No. Stories have no link to tap. Your agency's WhatsApp number is written on the image.",
          },
          {
            question: 'How do I cancel?',
            answer: 'The contract terms, including cancellation, come with your proposal.',
          },
        ],
      },
      finalCta: {
        title: 'Your next month of Instagram, ready to approve.',
        lead: 'Talk to ARP Vision and get a proposal for your agency.',
        button: 'Get a quote on WhatsApp',
      },
      // A mensagem do rodapé e do botão flutuante; os botões de cotação usam a saudação da cotação.
      whatsappMessage:
        "Hi! I came from the website and I'd like to know more about ARP Vision's Autopilot for Instagram.",
      // O texto fictício das telas de exemplo.
      mock: {
        // O calendário do topo. O título vale nas duas larguras: no desktop são duas semanas, e
        // abaixo de 768 px, uma.
        period: 'Upcoming posts',
        weekdays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        story: 'Story',
        approved: 'Approved',
        waiting: 'Waiting on you',
        approveAll: 'Approve all',
        // O perfil parado, ao lado da dor.
        handle: 'youragency',
        lastPost: 'Last post: June',
        profileDescription:
          'Example: an Instagram profile of a real estate agency, with the last post in June.',
        // As telas dos passos de "Como funciona": o endereço do site lido, os estilos e o mês.
        siteDescription:
          'Example: the address youragency.net in the website field, with the Scan button and a notice that the logo, colors and properties were found.',
        // DIFERENTE: .net, e não .com: "com" está na lista de palavras do português
        // (scripts/portuguese-words.mjs).
        siteAddress: 'youragency.net',
        // DIFERENTE: "Scan", e não "Read": ao lado de um endereço, "Read" lembra ler um artigo. O
        // texto do passo 1 continua com "reads".
        siteRead: 'Scan',
        siteFound: 'Logo, colors and properties found',
        stylesDescription:
          'Example: the same house in three post styles, with the middle one marked as your pick.',
        // DIFERENTE: "Your pick" ("a sua escolha"), e não "Your style". O rótulo não quebra linha
        // e, mais largo que a coluna do estilo, passa dela; medido, "Your pick" fica mais estreito
        // que o "Seu estilo" em todas as larguras, e "Your style", mais largo.
        styleChosen: 'Your pick',
        monthDescription:
          "Example: next month's posts in a small calendar, with the Approve all and Request changes buttons.",
        month: 'Next month',
        requestChange: 'Request changes',
        // As artes. A licença é da agência: vai em toda peça, inclusive nas que não anunciam um
        // imóvel (bairro, dica, captação).
        agency: 'Example Realty',
        // DIFERENTE: o número da licença no lugar do CRECI.
        license: 'License #00000',
        licenseOnEveryPost: true,
        details: '3 bedrooms · 240 m²',
        // O WhatsApp escrito no story: o rótulo numa linha e o número inteiro na de baixo.
        whatsapp: 'WhatsApp',
        // DIFERENTE: o formato de telefone americano, só com zeros, no lugar do brasileiro.
        whatsappNumber: '(000) 000-0000',
      },
    },
    // O Autochat atende só no WhatsApp da imobiliária e se apresenta como atendimento automático
    // ("automated service"). Toda distância é aproximada e vem com "in a straight line" (o teste de
    // catálogo confere).
    autochat: {
      meta: {
        title: 'Autochat: WhatsApp customer service for real estate agencies | ARP Vision',
        description:
          "Autochat answers your real estate agency's WhatsApp, finds properties by area, price, bedrooms and what's nearby, and hands off to an agent with a summary.",
      },
      hero: {
        eyebrow: 'AUTOCHAT',
        title: 'Clients answered right away, even after hours.',
        lead: "Autochat answers clients on your real estate agency's WhatsApp, understands what they're looking for (area, price, bedrooms, near a school or hospital), shows the properties that match and hands the conversation off to an agent with a summary ready.",
        button: 'Get a quote on WhatsApp',
        note: 'Clients can ask for an agent at any time.',
        mockDescription:
          "Example: a conversation on Example Realty's WhatsApp. The automated service introduces itself. The client asks for a 2-bedroom apartment to rent downtown, near a school, for up to 2,500 a month. The reply shows a property about 450 m in a straight line from a school, with the View 360° tour button. Next to it is the summary for the agent.",
      },
      // O título fica parado: não tem trecho que troca, como o do Piloto.
      pain: {
        eyebrow: 'SOUND FAMILIAR?',
        title:
          "A client messaged you at 10 p.m. By 9 a.m., they'd already talked to another agency.",
        text: 'Buyers and renters message several agencies at once. Whoever answers first, and answers well, comes out ahead.',
      },
      steps: {
        title: 'From first message to agent in four steps.',
        items: [
          {
            title: 'The client messages you on WhatsApp',
            text: "On your agency's WhatsApp, at any hour.",
          },
          {
            title: 'Autochat understands what they want',
            text: 'Buying or renting, area, price range, bedrooms, parking, pets and what they need nearby.',
          },
          {
            title: 'Shows the properties that match',
            text: 'Only from your listings, each with a photo, price and link. When the property has a 360° tour, the client can look inside right away.',
          },
          {
            title: 'Hands off to an agent',
            text: 'With a summary of the conversation and the times the client prefers to visit.',
          },
        ],
      },
      // "Perto do que importa". As três distâncias são as do imóvel de exemplo (DistanceListMock).
      // No texto corrido, "train station": nos EUA, "station" sozinho também é posto de gasolina ou
      // delegacia. A etiqueta da tela fica "Station", que cabe no espaço e tem o texto ao lado.
      proximity: {
        title: 'Close to what matters',
        text: 'The client writes “near a school,” “near the hospital” or “near the train station,” and Autochat searches your listings for properties close by and shows the approximate distance, in a straight line.',
        coverage:
          'Distances come from public databases of schools, hospitals and train stations, and coverage varies from city to city.',
        examples: [
          { place: 'School', distance: 'about 450 m in a straight line' },
          { place: 'Hospital', distance: 'about 1.2 km in a straight line' },
          { place: 'Station', distance: 'about 800 m in a straight line' },
        ],
      },
      // "O que o corretor recebe": o que vai no resumo, na ordem do cartão de exemplo.
      broker: {
        title: 'The agent takes over, already briefed.',
        fields: [
          "The client's name and WhatsApp number",
          'Whether they want to buy or rent',
          "What they're looking for",
          'The listings they saw and which ones they liked',
          'When they want to visit',
          'The full conversation',
        ],
      },
      // "Quando passa para uma pessoa".
      handoff: {
        title: 'Autochat brings in an agent in these cases:',
        items: [
          'When the client asks to talk to a person, at any time.',
          'When the topic is an offer, negotiation, documents or financing.',
          "When the question isn't covered in the listing details.",
          'After hours, it tells the client when the team will be back and has the summary ready.',
        ],
        closing: "Autochat doesn't negotiate or close deals: that's the agent's job.",
      },
      included: {
        title: "What's included",
        items: [
          {
            title: 'Any time',
            text: 'Replies as soon as the client writes, after hours too.',
          },
          {
            title: 'Automated service',
            text: "Says right in its first message that it's the agency's automated service.",
          },
          {
            title: 'The questions that matter',
            text: 'Buying or renting, area, price range, bedrooms, parking and pets.',
          },
          {
            title: 'Only your listings',
            text: "Shows only your agency's properties, each with a photo, price and link.",
          },
          {
            title: '360° tour in the conversation',
            text: 'When the property has a tour, the client can look inside right away.',
          },
          {
            title: "What's nearby",
            text: 'The approximate distance, in a straight line, to schools, hospitals and train stations.',
          },
          {
            title: 'Summary for the agent',
            text: 'With what the client is looking for and the full conversation.',
          },
          // DIFERENTE: "ID numbers" no lugar do CPF, que só existe no Brasil (no espanhol, o DNI).
          {
            title: 'No documents',
            text: "Doesn't ask for documents, ID numbers or health information.",
          },
        ],
      },
      // A resposta escolhida entra na mensagem do WhatsApp como está escrita aqui; o `id` só
      // nomeia o campo do formulário.
      quote: {
        eyebrow: 'CUSTOM PRICING',
        title: 'A proposal sized to your team.',
        lead: 'Answer 3 quick questions and get a proposal on WhatsApp based on your team size and how many conversations come in, with no commitment.',
        questions: [
          {
            id: 'brokers',
            label: 'How many agents handle clients?',
            summary: 'Agents',
            options: ['1 to 3', '4 to 10', 'More than 10'],
          },
          {
            id: 'contacts',
            label: 'How many inquiries come in per month?',
            summary: 'Inquiries per month',
            options: ['Up to 100', '100 to 500', 'More than 500', 'Not sure'],
          },
          {
            id: 'timing',
            label: 'When do you need it?',
            summary: 'When I need it',
            options: ['This month', 'Next month', 'Still researching'],
          },
        ],
        greeting: "Hi! I came from the website and I'd like a quote for ARP Vision's Autochat.",
        closing: 'Could you send me a proposal?',
      },
      faq: {
        eyebrow: 'FREQUENTLY ASKED QUESTIONS',
        title1: 'You ask.',
        title2: 'We explain.',
        lead1: 'No fine print.',
        lead2: 'Understand every part of Autochat.',
        items: [
          {
            question: 'Is it a bot?',
            answer:
              "Yes. It's an automated service, and it says so in its very first message. The client can ask for an agent whenever they want.",
          },
          {
            question: 'Does it work at night and on weekends?',
            answer: 'Yes. It replies at any hour and has the summary ready for the agent.',
          },
          {
            question: "Does it use my agency's WhatsApp number?",
            answer:
              "Yes. Autochat uses WhatsApp's official platform for automated messaging. It can be the number you already use or a new one, and ARP Vision explains beforehand what changes on your team's phones.",
          },
          {
            question: 'Where do the answers about properties come from?',
            answer:
              "From your listing details. Anything that isn't there goes to the agent. The agent confirms price and terms before any offer.",
          },
          {
            question: 'How does Autochat find properties near a school or hospital?',
            answer:
              'By the approximate distance, in a straight line, between the property and that place. For the walking or driving route, and anything not in the database, the client checks with the agent.',
          },
          // DIFERENTE: "ID numbers" no lugar do CPF, que só existe no Brasil (no espanhol, o DNI).
          {
            question: 'Does it ask for documents or ID numbers?',
            answer: 'No. Documents and financial information stay with the agent.',
          },
          // DIFERENTE: sem citar lei, como manda a seção Inglês da spec. O português usa os termos
          // da LGPD (controladora e operadora) e o espanhol, os do RGPD; aqui fica só o que eles
          // dizem: a agência responde pelos dados, e a ARP Vision trata as conversas só para fazer
          // o atendimento, em nome dela e seguindo as instruções dela.
          {
            question: "What about my clients' data?",
            answer:
              "Your agency is responsible for your clients' data. ARP Vision processes the conversations only to answer your clients, on your agency's behalf and following its instructions.",
          },
          {
            question: 'How much does it cost?',
            answer:
              "It depends on the size of your team and how many conversations come in. You get the proposal on WhatsApp, and it also explains how Meta's per-message fees are paid, when they apply.",
          },
        ],
      },
      finalCta: {
        title: 'Autochat replies right away, with a summary ready for your agent.',
        lead: 'Talk to ARP Vision and get a proposal for your agency.',
        button: 'Get a quote on WhatsApp',
      },
      // A mensagem do rodapé e do botão flutuante; os botões de cotação usam a saudação da cotação.
      whatsappMessage:
        "Hi! I came from the website and I'd like to know more about ARP Vision's Autochat.",
      // O texto fictício das telas de exemplo: a conversa do topo, o que a cliente procura, o
      // cartão do imóvel, o resumo para a corretora e as distâncias. A licença é a da imobiliária
      // (no inglês, o número da licença; no espanhol, a calificación energética do imóvel).
      mock: {
        agency: 'Example Realty',
        automated: 'Automated service',
        // A conversa, na ordem: a apresentação (um aviso no alto, sem hora), o pedido da cliente e
        // o imóvel que combina.
        intro:
          "Hi! This is Example Realty's automated service. If you'd prefer, I can bring in an agent.",
        request:
          "I'm looking for a 2-bedroom apartment to rent downtown, near a school, up to 2,500 a month.",
        found: "I found 3. This one's about 450 m in a straight line from a school:",
        // A hora do pedido e a da resposta, como o WhatsApp mostra. A descrição do passo 1 diz a do
        // pedido, no mesmo formato (o teste de catálogo confere).
        // DIFERENTE: 12 horas, como o WhatsApp mostra em en_US (o português e o espanhol usam
        // 22:04). A hora fica numa linha só dela no canto do balão, então os 3 caracteres a mais
        // não apertam a tela.
        times: { request: '10:04 PM', found: '10:05 PM' },
        // O cartão do imóvel, na conversa e no passo 3.
        listing: 'Downtown apartment',
        listingDetails: '2 bedrooms · 68 m²',
        listingPrice: '2,400 a month',
        // DIFERENTE: rótulo e valor, como as outras linhas do cartão e as distâncias de "Close to
        // what matters", para caber no espaço do português ("A uns 450 m de uma escola, em linha
        // reta").
        listingDistance: 'School: about 450 m in a straight line',
        // DIFERENTE: o número da licença no lugar do CRECI, como manda a seção Inglês da spec: os
        // mercados de língua inglesa não têm um registro único, e muitos pedem a licença no
        // anúncio.
        license: 'License #00000',
        // O botão não quebra linha e tem o espaço do português: por isso "View 360° tour", sem o
        // artigo do "See the 360° tour" do cartão final dos vídeos.
        tour: 'View 360° tour',
        // O que a cliente procura: o negócio e o resto, nas fichas do passo 2 e no resumo. No
        // inglês, toda ficha começa por maiúscula, como "Rental" ("Downtown" não é nome próprio
        // como "Centro").
        wishesTitle: 'What the client wants',
        deal: 'Rental',
        wishes: ['Downtown', '2 bedrooms', 'Up to 2,500 a month', 'Near a school'],
        // O resumo para a corretora, no topo, no passo 4 e em "O que o corretor recebe".
        summary: 'Summary for the agent',
        client: 'Laura Bennett',
        // O WhatsApp da cliente: o rótulo e o número, que vai inteiro, sem quebrar no meio.
        whatsapp: 'WhatsApp',
        // DIFERENTE: o número fictício no formato americano, como o en_US do site (o português usa
        // o formato do Brasil, e o espanhol, o da Espanha).
        clientPhone: '(000) 000-0000',
        seen: 'Saw 3 listings, liked the downtown apartment',
        visit: 'Wants to visit Saturday morning',
        conversation: 'Full conversation',
        // As telas dos passos, das distâncias e do resumo.
        requestDescription:
          "Example: the conversation with Example Realty on WhatsApp and the client's message, at 10:04 PM, asking for a 2-bedroom apartment to rent downtown.",
        wishesDescription:
          'Example: what the client wants (rental, downtown, 2 bedrooms, up to 2,500 a month and near a school).',
        listingDescription:
          'Example: the listing card for a downtown apartment, with a photo, the price, the distance to a school (in a straight line) and the View 360° tour button.',
        summaryStartDescription:
          "Example: the start of the summary for the agent, with the client's name, WhatsApp number and what she's looking for.",
        summaryDescription:
          "Example: the summary for the agent. It shows the client's name and WhatsApp number, that she wants to rent, what she's looking for, the listings she saw and the one she liked, when she wants to visit and the full conversation.",
        distancesDescription:
          'Example: a downtown apartment and the approximate distances, in a straight line, to a school (about 450 m), a hospital (about 1.2 km) and a train station (about 800 m).',
      },
    },
    // Os dois vídeos de exemplo do topo são arquivos (`site.media.exampleVideos`), um par por
    // idioma, com o selo, os dados do imóvel e o cartão final gravados na imagem.
    videos: {
      meta: {
        title: 'Property videos from photos | ARP Vision',
        // DIFERENTE: o número da licença no lugar do CRECI, que os mercados de língua inglesa não
        // têm.
        description:
          'You send the listing photos, and ARP Vision builds the video for Reels, stories and property portals, with the property details, your logo and license number.',
      },
      hero: {
        eyebrow: 'VIDEOS FROM PHOTOS',
        title: 'Your listing photos become videos for Reels and property portals.',
        // DIFERENTE: o número da licença no lugar do CRECI.
        lead: 'You send photos of the property. ARP Vision builds the video in vertical and horizontal formats, with smooth motion, music and the property details on screen. Your logo appears at the end, with your license number.',
        button: 'Get a quote on WhatsApp',
        note: 'When the property has a 360° tour, the video ends with the tour link.',
      },
      // VideoFormats.astro desenha o formato de cada cartão pelo `id`, o mesmo em todos os idiomas.
      formats: {
        title: 'One set of photos, the formats you need.',
        cards: [
          { id: 'vertical', title: 'Vertical, for Reels and stories' },
          { id: 'horizontal', title: 'Horizontal, for portals and YouTube' },
          { id: 'ending', title: 'End card with your brand and tour' },
        ],
      },
      steps: {
        title: 'From photos to video in three steps.',
        items: [
          {
            title: 'Send the photos',
            text: "Your listing photos, as long as your real estate agency has the right to use them and they don't carry another company's watermark.",
          },
          {
            title: 'ARP Vision builds the video',
            text: "In the order you'd show the property, from the facade to the outdoor area, with smooth motion on each photo.",
          },
          {
            title: 'Approve and get the video',
            text: 'Request an edit if needed, then get both versions in MP4.',
          },
        ],
      },
      included: {
        title: 'What goes into the video',
        items: [
          { title: 'Smooth motion', text: "Over the property's own photos." },
          { title: 'Music', text: 'A background track plays along with the photos.' },
          { title: 'Property details', text: 'Bedrooms, floor area and neighborhood, on screen.' },
          // DIFERENTE: o número da licença no lugar do CRECI.
          {
            title: 'Your logo and license number',
            text: 'At the end of the video, with your contact details.',
          },
          {
            title: '360° tour link',
            text: 'When the property has a tour, the video ends with the link.',
          },
          { title: 'Vertical and horizontal', text: 'Both versions, in MP4.' },
        ],
      },
      // A resposta escolhida entra na mensagem do WhatsApp como está escrita aqui; o `id` só
      // nomeia o campo do formulário.
      quote: {
        eyebrow: 'CUSTOM PRICING',
        title: 'A proposal that fits how often you list.',
        lead: 'Answer 3 quick questions and get a proposal on WhatsApp for your properties and the formats you want, with no commitment.',
        questions: [
          {
            id: 'listings',
            label: 'How many properties per month?',
            summary: 'Properties per month',
            options: ['1 to 5', '6 to 20', 'More than 20'],
          },
          {
            id: 'formats',
            label: 'Which formats?',
            summary: 'Formats',
            options: ['Vertical', 'Horizontal', 'Both'],
          },
          {
            id: 'timing',
            label: 'When do you need it?',
            summary: 'When I need it',
            options: ['This month', 'Next month', 'Still researching'],
          },
        ],
        greeting:
          "Hi! I came from the website and I'd like a quote for ARP Vision's videos from photos.",
        closing: 'Could you send me a proposal?',
      },
      faq: {
        eyebrow: 'FREQUENTLY ASKED QUESTIONS',
        title1: 'You ask.',
        title2: 'We explain.',
        lead1: 'No fine print.',
        lead2: 'Understand every part of your videos.',
        items: [
          {
            question: 'How many photos do I need to send?',
            answer: 'Your listing photos are enough. The more rooms, the more complete the video.',
          },
          {
            question: 'How long until I get the video?',
            answer: 'The delivery time comes with your proposal.',
          },
          {
            question: 'Which formats do I get?',
            answer:
              'Vertical (9:16) for Reels and stories, and horizontal (16:9) for property portals and YouTube, both in MP4.',
          },
          // DIFERENTE: o número da licença no lugar do CRECI; a resposta diz que é o número que a
          // agência informa, como manda a spec.
          {
            question: 'Can I add my logo, contact details and license number?',
            answer:
              'Yes. The end of the video shows your logo, your contact details and the license number you provide.',
          },
          {
            question: 'Do I need to take new photos?',
            answer: 'No. The video is made with the photos you already have.',
          },
          {
            question: 'Can I use the video on property portals and Instagram?',
            answer: 'Yes, on the portals that accept video and on your social media.',
          },
          {
            question: 'What if I want to change something?',
            answer: 'You can request an edit before you get the final version.',
          },
          {
            question: 'How much does it cost?',
            answer:
              'It depends on how many properties you send per month. You get the proposal on WhatsApp.',
          },
        ],
      },
      finalCta: {
        title: 'Your next listing, now with video.',
        lead: 'Talk to ARP Vision and get a proposal for your properties.',
        button: 'Get a quote on WhatsApp',
      },
      // A mensagem do rodapé e do botão flutuante; os botões de cotação usam a saudação da cotação.
      whatsappMessage:
        "Hi! I came from the website and I'd like to know more about ARP Vision's videos from photos.",
      // O texto das telas de exemplo e o dos vídeos do topo.
      mock: {
        // Os dois vídeos do topo: a descrição para o leitor de tela e os rótulos do botão.
        // DIFERENTE: o cartão final do vídeo em inglês traz "License #00000" no lugar do CRECI (os
        // outros textos gravados nele: "EXAMPLE", "Example Neighborhood", "240 m²", "3 bedrooms",
        // "Example Realty" e "See the 360° tour").
        verticalDescription:
          'Example: a vertical video for Reels and stories, made from five photos of a house, with the neighborhood, floor area and number of bedrooms on screen. It ends with Example Realty, its license number and an invitation to see the 360° tour.',
        verticalPlay: 'Play the vertical video',
        verticalPause: 'Pause the vertical video',
        horizontalDescription:
          'Example: the same video in horizontal format, for property portals and YouTube.',
        horizontalPlay: 'Play the horizontal video',
        horizontalPause: 'Pause the horizontal video',
        // As telas dos passos de "Como funciona": as fotos enviadas, na ordem em que chegaram; as
        // mesmas fotos na ordem da visita; e as duas versões para aprovar.
        photosDescription:
          'Example: four photos of a house, each with a check mark showing it was sent.',
        photosSent: '4 photos sent',
        scenesDescription:
          'Example: the four photos in the order of a visit (facade, living room, kitchen and outdoor area).',
        scenesTitle: 'Visit order',
        scenes: ['Facade', 'Living room', 'Kitchen', 'Outdoor area'],
        deliveryDescription:
          'Example: both versions of the video, 9:16 and 16:9, in MP4, with the Approve and Request edit buttons.',
        vertical: '9:16',
        horizontal: '16:9',
        file: 'MP4',
        approve: 'Approve',
        requestAdjustment: 'Request edit',
      },
    },
  },
  // A página com todos os produtos (/en/products): os cartões seguem os grupos do menu, e a faixa
  // azul pede a cotação pelo WhatsApp com uma mensagem geral sobre os produtos.
  productsPage: {
    meta: {
      title: 'Products for real estate agencies | ARP Vision',
      description:
        '360° virtual tour, videos from photos, Autopilot for Instagram and Autochat: ARP Vision products to show the property, promote it and respond to clients.',
    },
    eyebrow: 'PRODUCTS FOR REAL ESTATE AGENCIES',
    title: 'From the first post to a client ready to visit.',
    lead: 'Products that work together: they show the property, keep your Instagram up to date and answer clients on WhatsApp while your agents are out in the field.',
    // O fim de cada cartão. "Discover" é o "Conheça" do en.ts (`footer.discover`); "Explore", lá,
    // quer dizer andar pelo tour, sentido que o cartão dos vídeos não pode ter.
    cta: 'Discover',
    finalCta: {
      title: 'Which product fits your agency?',
      lead: 'Tell us how you work and get a proposal on WhatsApp for the products you choose.',
      button: 'Get a quote on WhatsApp',
      message: "Hi! I came from the website and I'd like a quote for ARP Vision's products.",
    },
  },
  footer: {
    taglineLines: ['The whole property.', 'Your phone is just the beginning.'],
    products: 'Products',
    discover: 'Discover',
    howItWorks: 'How it works',
    realTour: 'Real tour',
    plans: 'Plans',
    quote: 'Request a quote',
    faq: 'Frequently asked questions',
    tutorials: 'Video tutorials',
    start: 'Start here',
    signup: 'Create a free account',
    login: 'Sign in to my account',
    talk: "Let's talk",
    whatsapp: (number: string) => `WhatsApp ${number}`,
    note: 'Made for anyone with properties to show.',
    cnpj: 'CNPJ',
    terms: 'Terms of Use',
    privacy: 'Privacy Policy',
    quickContact: 'Quick contact',
    floatingWhatsapp: 'Talk to ARP Vision on WhatsApp',
  },
  contactDialog: {
    close: 'Close',
    title: "Let's talk soon.",
    text: (credits: number, days: number) =>
      `Our sales team will be available soon. In the meantime, create your free account and try the capture with ${credits} ${credits === 1 ? 'credit' : 'credits'} for ${days} days, no card needed.`,
    signup: 'Create a free account',
  },
  home: {
    title: '360° virtual tours with your phone | ARP Vision',
    // Entre 140 e 160 caracteres, como no português.
    description:
      'Make a 360° virtual tour of your property with just your phone. Seams and lighting corrected, a WhatsApp-ready link clients open with no account. Free trial.',
    ogImage: '/images/og-home-en.png',
    eyebrow: '360° VIRTUAL TOURS FOR REAL ESTATE AGENCIES',
    title1: 'Turn your property into an experience.',
    title2: 'With just your phone.',
    opening:
      'Create a 360° virtual tour of your property with just your phone. And clients open the tour without creating an account.',
    howTitle: 'The app takes the photos for you',
    howSubtitle: 'Open the camera and follow the instructions',
    steps: ['Capture with your own phone.', 'ARP Vision builds it.', 'Done. Now just share it.'],
    videoLabel: 'ARP Vision 360-degree capture tutorial',
    videoPlay: 'Play video',
    videoPause: 'Pause video',
    presentationLabel: 'Virtual tour and benefits',
    plansEyebrow: 'START SMALL. SHOW IT ALL.',
    plansTitle: 'A plan for your next step.',
    plansLead:
      '1 credit = 1 room photographed with your phone. The balance belongs to your agency.',
  },
  fan: {
    label: 'Rooms photographed with a phone',
    stageLabel: '360-degree room thumbnails',
    arrow: (room: string) => `See the demo tour: ${room}`,
    roomLink: (room: string) => `${room} — see the demo tour`,
    select: (room: string) => `Highlight card: ${room}`,
    rooms: {
      suite: {
        title: 'Suite',
        alt: 'Glass shower and bathtub in a bathroom photographed in 360 degrees',
      },
      quarto: { title: 'Bedroom', alt: 'Two armchairs by a table in the en suite bedroom' },
      sala: {
        title: 'Living room',
        alt: 'Wooden staircase and glass table in the living room photographed in 360 degrees',
      },
      quartoVisita: { title: 'Guest room', alt: 'Television next to the window and the curtain' },
      patio: {
        title: 'Backyard',
        alt: 'Pool, waterfall and covered barbecue area in the backyard',
      },
    },
  },
  sharing: {
    eyebrow: 'SHARING',
    title1: 'One link. Your client',
    title2: 'opens it anywhere.',
    channels: {
      whatsapp: {
        title: 'On WhatsApp',
        text: 'Your client opens the link without creating an account and sees the whole property.',
      },
      site: {
        title: 'On your website',
        text: 'Paste the code into the page, in responsive, 16:9 or square format.',
      },
      visit: {
        title: 'Before the visit',
        text: 'Visitors already know the property and arrive ready to decide.',
      },
    },
    // A imagem da conversa tem o texto em português: aqui ela é montada em HTML.
    conversationImage: null,
    chat: {
      label: 'Simulated WhatsApp conversation with the link to a 9-room tour',
      contact: 'Client',
      status: 'WhatsApp conversation',
      message: "Hi! Here's the tour of the property. You can see everything inside, room by room:",
      linkTitle: '360° tour · 9 rooms',
      reply:
        "You don't need to download anything or create an account. You can open it on a computer or on your phone.",
    },
  },
  showcase: {
    frameTitle: 'ARP Vision 360° demo tour',
    title: 'Look inside the property.',
    hint: 'Click or tap to explore the tour.',
    newTab: 'Open the tour in a new tab',
    exit: 'Stop exploring',
    marqueeLabel: 'What the tour delivers',
    words: [
      'Trust',
      'Exclusivity',
      'Speed',
      'Time saved',
      'Value',
      'Immersion',
      'Connection',
      'Transparency',
      'Credibility',
      'Differentiation',
      'Standing out',
      'Reach',
      'Accessibility',
      'Convenience',
      'Autonomy',
      'Innovation',
      'Delight',
      'Digital presence',
      'Unlimited visits',
      'Interactive experience',
      'Closeness',
      'Perceived value',
    ],
  },
  credits: {
    title1: 'Each room becomes a',
    title2: 'high-quality 360° image.',
    lead: "You don't pay per photo or per tour. You pay per finished room.",
    // Tradução fiel do português, sem tempo prometido na captura.
    flow: {
      capture: {
        value: 'One turn with your phone',
        text: 'In each room, with the screen showing where to point.',
      },
      image: {
        value: 'One 360° image',
        text: 'The photos become a single high-quality image.',
      },
      credit: { value: '1 credit', text: "That's what each room uses from the plan's balance." },
    },
    example:
      'In practice: a house with a living room, kitchen, 2 bedrooms and 1 bathroom has 5 rooms, which means 5 credits.',
  },
  tour: {
    eyebrow: 'STEP IN. LOOK AROUND. EXPLORE.',
    title1: 'This was photographed',
    title2: 'with a phone.',
    lead: 'Drag to look around. Tap the passages to move from one room to another.',
    badge: 'A new way to visit.',
    tabsLabel: 'Demo properties',
    illustrativeAlt: 'Illustrative living room with a sofa, natural light and wooden furniture',
    illustrativeName: 'One property, every angle',
    openLabel: 'Enter the property: open the 360-degree tour',
    pendingLabel: 'Check the availability of the demo tour',
    open: 'Enter the property',
    demo: 'Demo tour',
    openHint: 'The visit starts with a tap.',
    pendingHint: 'The real demo is being prepared.',
    explore: 'Explore every room',
    captured: 'Captured with ARP Vision',
    illustrative: 'Illustrative photo · not an ARP Vision capture',
    toBeDefined: '[to be defined]',
    noTripod: 'No tripod',
    ready: 'Ready in ~1 min per room',
    cta: 'I want a tour like this of my property',
    qrAlt: 'QR code to open the tour on your phone',
    qrLine1: 'View it on',
    qrLine2: 'your phone',
    coverAlt: 'View of the property {name}',
    phone: 'Phone: {phone}',
    photos: '{photos} photos per room',
    time: 'Capture: {time} per room',
    failed: "Couldn't open the tour right now. ",
    newTab: 'Open in a new tab',
    pending:
      'The real tour is still being prepared. This cover is illustrative. Come back soon to explore a property captured with ARP Vision.',
    loading: 'Opening the property…',
    frameTitle: 'Sample 360° tour: {name}',
    dialogLabel: 'Tour of {name}',
    closeDialog: 'Close the tour ×',
  },
  team: {
    eyebrow: 'ONE TOOL. THE WHOLE TEAM.',
    title1: 'Build your tour ecosystem,',
    title2: 'designed for agencies.',
    benefits: {
      autonomy: {
        title: 'More autonomy for those who capture.',
        text: 'More visibility for those who manage.',
      },
      standard: {
        title: 'The same standard for everyone.',
        text: 'Designed so that first-timers and experienced users deliver the same result.',
      },
    },
  },
  // DIFERENTE: o ARP Vision Presencial só atende Porto Alegre e região; no inglês não há seção
  // nem menu.
  inPerson: null,
  productsStrip: {
    title: 'More for your agency.',
  },
  quote: {
    eyebrow: 'CUSTOM PRICING',
    title: 'Every agency has its own size. So does your proposal.',
    lead: 'Answer 3 quick questions and get a proposal for your volume of properties on WhatsApp, with no commitment.',
    benefits: {
      volume: {
        title: 'A proposal for your volume.',
        text: 'You pay per finished room, not per photo.',
      },
      // DIFERENTE: o português oferece também o celular da equipe da ARP Vision ("ou com a
      // nossa"), do Presencial, que só atende Porto Alegre e região.
      phone: {
        title: 'No 360° camera, no photographer.',
        text: 'The phone you already have does the tour.',
      },
      team: {
        title: 'A direct conversation with the team.',
        text: 'Get your questions answered before you decide.',
      },
    },
    questions: {
      perfil: {
        label: 'How do you work?',
        summary: 'How I work',
        options: [
          'Independent agent',
          'Small agency',
          'Agency with a team',
          'Network or franchise',
        ],
      },
      volume: {
        label: 'How many properties per month?',
        summary: 'Properties per month',
        options: ['1', '2 to 5', '6 to 15', 'More than 15'],
      },
      prazo: {
        label: 'When do you need it?',
        summary: 'When I need it',
        options: ['This week', 'This month', 'Still researching'],
      },
    },
    greeting: "Hi! I came from the website and I'd like a quote from ARP Vision.",
    closing: 'Could you send me a proposal?',
    preview: 'Your message',
    submit: 'Get my quote on WhatsApp',
    note: 'Opens WhatsApp with the message ready. You review it before sending.',
    trial: (credits: number, days: number) =>
      `Prefer to try it first? Create your free account, photograph ${rooms(credits)} and keep the tour live for ${days} days, without paying anything.`,
    signup: 'Create a free account',
  },
  finalCta: {
    title: 'Your property can have a 360° tour today.',
    lead: 'You already have the phone. The next step is yours.',
    signup: 'Create a free account',
    whatsapp: 'Talk on WhatsApp',
    note: 'No card. No app to download.',
  },
  faq: {
    eyebrow: 'FREQUENTLY ASKED QUESTIONS',
    title1: 'You ask.',
    title2: 'We explain.',
    lead1: 'No fine print.',
    lead2: 'Understand every part of your tour.',
    groups: {
      capture: 'Capture and tours',
      prices: 'Credits, plans and payment',
      quote: 'Credits, quotes and payment',
    },
    equipment: {
      question: 'Do I need to buy a 360° camera or a tripod?',
      answer:
        'No. You capture with your phone, in your hand. The screen shows where to point and tells you when to hold still.',
    },
    install: {
      question: 'Do I need to install an app?',
      answer: "No. ARP Vision opens in your phone's browser.",
    },
    compatibility: { question: 'Does it work on my phone?' },
    duration: {
      question: 'How long does it take to make a tour?',
      answer:
        'Each room is a single turn. The 360° is ready in about 1 minute, in the background, and you capture the next room in the meantime.',
    },
    // DIFERENTE: a foto original guardada não é citada, como no espanhol. O português a cita no
    // lugar da comparação antes de publicar, uma promessa que só ele fazia.
    enhancement: {
      question: 'Does the enhancement change the property?',
      answer:
        "It evens out the seams and the lighting between the photos. On the floor, a stamp with your agency's name.",
    },
    camera: {
      question: 'I already have a 360° camera. Can I use it?',
      answer:
        "Yes. Upload the 360° photos from your gallery and build the tour as usual. Gallery photos don't use credits.",
    },
    embed: {
      question: 'Can I put the tour on my website?',
      answer:
        'Yes. Each tour has a code to paste on your website, in responsive, 16:9 or square format.',
    },
    credit: {
      question: 'What is a credit?',
      answer:
        'Each room photographed with your phone uses 1 credit. Credits belong to the agency, and the whole team uses the same balance.',
    },
    individual: { question: 'How does the Individual plan work?' },
    cost: {
      question: 'How much does it cost?',
      answer: (credits: number, days: number) =>
        `It depends on how many rooms you photograph per month. Ask for your quote on WhatsApp and get a proposal for your volume. To try it first, create your free account, photograph ${rooms(credits)} and keep the tour live for ${days} days, without paying anything.`,
    },
    payment: {
      question: 'How does payment work?',
      answer:
        'Payment is made in the app, securely, through Asaas. The terms come with your proposal.',
    },
  },
  policies: {
    phoneRequirements:
      "Compatibility requirements to be defined. Capture works in the phone's browser; the list of compatible devices and versions is being validated.",
    billing: (v) =>
      `Payment is made in the app, securely, through Asaas. Individual: ${v.pix} upfront by Pix or ${v.installments} installments of ${v.installment} by card. Professional: ${v.professional} per month, by card. Business: ${v.business} per month, by card. On the annual plan, Professional and Business get ${v.discount}% off. Enterprise: terms agreed in a contract.`,
    cancellation: (noticeDays: number, keepPrice: string) =>
      `When you cancel a subscription, your tours stay live until the end of the month already paid. An email notice is planned ${noticeDays} days before they go offline. After that, you can keep each tour for ${keepPrice} a year.`,
    liveTourLimit:
      'Only published tours that are not hidden count. Drafts and hidden tours are outside the limit. When you reach the limit, you need to hide a tour or change plans before publishing another. The limit never takes tours offline automatically.',
    monthlyExtras: (included: number, extraPrice: string) =>
      `On Individual, each room beyond the ${included} included costs ${extraPrice}. Extra rooms on Professional and Business don't have a price yet.`,
    individualTerm: (renewalPrice: string) =>
      `The Individual tour stays live for 1 year and can be renewed for ${renewalPrice} for 1 more year. When that period starts is still to be defined.`,
  },
  plans: {
    individual: { audience: 'One tour, no monthly fee.', duration: '1 year live' },
    corretor: {
      audience: 'For those who work solo.',
      duration: 'While the subscription is active',
    },
    imobiliaria: { audience: 'For teams.', duration: 'While the subscription is active' },
    rede: {
      audience: 'Several locations, more possibilities.',
      duration: 'As agreed in the contract',
    },
  },
  pricing: {
    srTitle: 'Available plans and prices',
    exampleNotice: '',
    monthly: 'Monthly',
    annual: 'Annual',
    save: (percent: number) => `save ${percent}%`,
    annualSwitch: (percent: number) => `Annual plan, with ${percent}% off`,
    previous: 'Previous plan',
    swipe: 'Swipe to see the plans',
    next: 'Next plan',
    gridLabel: 'Plans',
    carouselStatus: '{name} · plan {current} of {total}',
    statusAnnual: 'Showing annual plan prices, with the discount.',
    statusMonthly: 'Showing monthly prices.',
    recommended: 'Recommended',
    perMonth: '/mo',
    onRequest: 'On request',
    payOnce: (pix: string) => `or ${pix} upfront by Pix`,
    payMonthly: 'Billed monthly, by card',
    payCustom: 'Terms agreed in a contract',
    payAnnual: (total: string) => `Billed annually: ${total}`,
    stats: 'Visit statistics for your tours',
    roomsOnce: (credits: number) => `${credits} rooms`,
    toursOnce: (tours: number) => `${tours} live tour for 1 year`,
    roomsMonthly: (credits: number) => `${credits} rooms per month`,
    toursMonthly: (tours: number) => `Up to ${tours} live tours`,
    roomsCustom: 'Rooms tailored to you',
    toursCustom: 'Volume and live tour limit agreed in a contract.',
    renewal: (renewalPrice: string) => `Renewal ${renewalPrice}/year`,
    contactMessage: (plan: string) => `Hi! I'm interested in the ARP Vision ${plan} plan.`,
    whatsapp: 'Talk on WhatsApp',
    buy: 'Buy',
    subscribe: 'Subscribe',
    secure: 'Secure payment via Asaas · Pix or card',
    trial: (credits: number, days: number) =>
      `Want to try it first? Create your free account, photograph ${rooms(credits)} and keep the tour live for ${days} days, without paying anything.`,
    signup: 'Create a free account',
    compare: 'Compare all features',
  },
  features: {
    groups: {
      plan: 'Plan and publishing',
      capture: 'Capture and enhancement',
      sharing: 'Tours and sharing',
      team: 'Team and management',
    },
    rows: {
      price: 'Price',
      rooms: 'Rooms',
      liveTours: 'Live tours',
      duration: 'Time live',
      extraRoom: 'Extra room',
      renewal: 'Renewal or upkeep',
      guidedCapture: 'Guided 360° capture with your phone',
      autoFix: 'Seams and lighting corrected automatically',
      creditBack: 'Credit returned if the enhancement fails',
      gallery: '360° photos from your gallery without using credits',
      passages: 'Passages between rooms',
      publicLink: 'Public link: clients open it without an account',
      shareShortcut: 'Shortcut to WhatsApp and email',
      embed: 'Website code: responsive, 16:9 and square',
      stats: 'Visit statistics: time in each room and where visitors came from',
      sharedBalance: 'Credit balance shared by the team',
      roles: 'Administrator and users on the account',
      drafts: 'Drafts outside the live tour limit',
    },
    priceOnce: (pix: string, installments: number, installment: string) =>
      `${pix} by Pix or ${installments} installments of ${installment}`,
    priceMonthly: (monthly: string) => `${monthly} / month`,
    onRequest: 'On request',
    custom: 'Tailored',
    roomsMonthly: (credits: number) => `${credits} per month`,
    roomsOnce: (credits: number) => `${credits} once`,
    byContract: 'As agreed in the contract',
    upTo: (tours: number) => `Up to ${tours}`,
    perRoom: (extraPrice: string) => `${extraPrice} per room`,
    toBeDefined: 'To be defined',
    renewalOnce: (renewalPrice: string) => `${renewalPrice} for 1 more year`,
    renewalMonthly: (renewalPrice: string) => `${renewalPrice} per tour/year after canceling`,
    included: 'Included',
    notIncluded: 'Not included',
    comingSoon: 'Coming soon',
  },
  plansPage: {
    title: 'Plans and pricing | ARP Vision',
    description:
      'ARP Vision plans: Individual with a one-time payment, Professional and Business monthly, and Enterprise on request. Compare credits, live tours and free trial.',
    ogImage: '/images/og-plans-en.png',
    breadcrumb: 'Home / Plans',
    eyebrow: 'THE NEXT STEP FOR YOUR REAL ESTATE AGENCY',
    title1: 'Plans for agencies',
    title2: 'of every size',
    lead1: '1 credit = 1 room photographed with your phone.',
    lead2: 'A property usually has 6 to 10 rooms.',
    compareEyebrow: 'EVERY DETAIL, SIDE BY SIDE',
    compareTitle: 'Compare all features.',
    compareLead: 'Compare what each plan includes to capture and publish your properties.',
    tableLabel: 'Plan comparison table, with horizontal scrolling',
    features: 'Features',
    recommended: 'Recommended',
  },
  // Os títulos e as descrições dos vídeos são os da aba Tutorials do app (en.json).
  tutorials: {
    title: 'Video tutorials | ARP Vision',
    // DIFERENTE: os vídeos são narrados em português. A descrição e a abertura avisam logo de
    // início, como a aba Tutorials do app e o espanhol; o português não precisa dizer.
    description:
      'Short videos, in Portuguese, that walk through each step of ARP Vision, from phone capture to the published tour, and how to add the app to your Home Screen.',
    breadcrumb: 'Home / Tutorials',
    eyebrow: 'STEP BY STEP ON VIDEO',
    heading: 'Tutorials',
    lead: 'Short videos, in Portuguese, that walk through each step of ARP Vision, from your first photographed room to the published tour.',
    watch: 'Watch',
    watchLabel: (title: string, duration: string) => `Watch: ${title} (${duration})`,
    close: 'Close the video',
    sections: {
      start: 'Getting started',
      app: 'App tips',
    },
    videos: {
      'do-novo-tour-a-publicacao': {
        title: 'From New tour to publishing',
        description: 'The whole path: capture, rooms, passages and publishing.',
      },
      'app-na-tela-de-inicio': {
        title: 'The app on your Home Screen',
        description: 'Open ARP Vision with one tap, full screen, on iPhone.',
      },
    },
  },
  legal: {
    eyebrow: 'LEGAL INFORMATION',
    preparing: 'Document in preparation',
    available: 'The full document will be available on this page.',
    contact: 'Contact:',
    emailPending: '[email to be defined]',
    terms: {
      title: 'Terms of Use | ARP Vision',
      description: 'ARP Vision Terms of Use. Read the conditions for using the platform.',
      breadcrumb: 'Home / Terms of Use',
      heading: 'Terms of Use',
      notice: "We're preparing our Terms of Use.",
      link: 'Terms of Use →',
      body: '',
    },
    privacy: {
      title: 'Privacy Policy | ARP Vision',
      description: 'ARP Vision Privacy Policy. Information about privacy and how data is handled.',
      breadcrumb: 'Home / Privacy Policy',
      heading: 'Privacy Policy',
      notice: "We're preparing our Privacy Policy.",
      link: 'Privacy Policy →',
      body: '',
    },
  },
  notFound: {
    title: 'Page not found',
    lead: 'The address may have changed or no longer exists.',
    home: 'Back to home',
  },
  schema: {
    appDescription:
      '360° virtual tours of properties using a phone, with guided capture and automatic enhancement.',
    offerOnce: (installments: number) =>
      `One-time payment for 1 tour live for 1 year: upfront by Pix or in ${installments} installments by card. Annual renewal sold separately.`,
    offerMonthly:
      'Monthly subscription by card; tours stay live while the subscription is active, within the plan limit.',
  },
};
