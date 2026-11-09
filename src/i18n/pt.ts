/**
 * Português do Brasil: a fonte do texto do site. Todo texto novo, ou mudado, entra aqui e em
 * `es.ts` no mesmo PR; o tipo `Dictionary` sai deste arquivo, então o espanhol não compila
 * se faltar uma chave. Números, preços, links e mídia comum ficam em `src/config/site.ts`
 * e chegam aqui como parâmetros das funções.
 *
 * `{nome}` marca o valor que o script do navegador preenche (texto que muda depois da carga).
 * Linhas em lista viram linhas separadas por <br /> no componente.
 */
import type { FanRoomId, PlanId, TutorialId, TutorialSectionId } from '../config/site';

/** "1 ambiente", "2 ambientes". */
const rooms = (count: number) => `${count} ${count === 1 ? 'ambiente' : 'ambientes'}`;

export const pt = {
  meta: {
    defaultDescription:
      'Faça o tour virtual 360° do seu espaço só com o celular. As emendas e a luz saem corrigidas, e o cliente abre o tour pelo WhatsApp, sem criar conta.',
  },
  layout: { skipLink: 'Pular para o conteúdo' },
  language: { label: 'Idioma' },
  brand: { home: 'ARP Vision — início' },
  // Mensagem pronta dos botões de WhatsApp que não têm uma própria.
  whatsappMessage: 'Olá! Vim pelo site e quero saber mais sobre a ARP Vision.',
  header: {
    mainNav: 'Navegação principal',
    mobileNav: 'Navegação no celular',
    products: 'Produtos',
    productsPanel: 'Produtos da ARP Vision',
    viewAllProducts: 'Ver todos os produtos',
    // Selo dos produtos novos: quer dizer produto novo, e não "em breve".
    newBadge: 'Novo',
    realTour: 'Tour real',
    plans: 'Planos',
    quote: 'Cotação',
    faq: 'Dúvidas',
    tutorials: 'Tutoriais',
    darkTheme: 'Tema escuro',
    login: 'Entrar',
    loginLong: 'Entrar na minha conta',
    signup: 'Criar conta grátis',
    signupShort: 'Criar conta',
    menu: 'Menu',
    close: 'Fechar',
  },
  // Menu "Produtos" do cabeçalho: os grupos e, de cada produto, o nome e uma linha.
  products: {
    // O público dos dados estruturados (`Service`) de cada produto.
    audience: 'Imobiliárias',
    // Etiqueta visível de toda tela de exemplo das páginas de produto, que nunca passa por caso
    // real. A descrição de cada tela para o leitor de tela começa por esta palavra e dois-pontos.
    example: 'Exemplo',
    // O fim das páginas de produto, com os outros produtos no ar.
    also: 'Conheça também',
    groups: {
      show: 'Mostrar o imóvel',
      promote: 'Divulgar e atender',
      team: 'Com a nossa equipe',
    },
    items: {
      tour: { name: 'Tour virtual 360°', line: 'O imóvel por dentro, com o celular.' },
      videos: { name: 'Vídeos a partir de fotos', line: 'Reels, stories e portais.' },
      instagram: {
        name: 'Piloto automático para Instagram',
        line: 'O mês de posts pronto para aprovar.',
      },
      autochat: { name: 'Autochat', line: 'Atende no WhatsApp e passa ao corretor.' },
    },
    // O ARP Vision Presencial só existe em português, por enquanto: no espanhol, sem o grupo.
    inPerson: {
      training: {
        name: 'Treinamento da equipe',
        line: 'Seus corretores aprendem a fazer tours com o celular.',
      },
      readyTour: { name: 'Tour Pronto', line: 'Nossa equipe vai até o imóvel e faz a captura.' },
    } as {
      training: { name: string; line: string };
      readyTour: { name: string; line: string };
    } | null,
  },
  // As páginas dos produtos novos (/produtos/<produto>), uma por produto. As telas de exemplo usam
  // só nomes fictícios (Imobiliária Exemplo, suaimobiliaria, CRECI 00000-J) e nenhum preço.
  productPages: {
    instagram: {
      meta: {
        title: 'Piloto automático para Instagram de imobiliárias | ARP Vision',
        description:
          'A ARP Vision prepara o mês de posts e stories do Instagram da sua imobiliária, com seus imóveis e sua região. Você aprova e a ARP Vision publica.',
      },
      hero: {
        eyebrow: 'PILOTO AUTOMÁTICO PARA INSTAGRAM',
        title: 'O Instagram da sua imobiliária, no piloto automático.',
        lead: 'A ARP Vision prepara o mês de posts e stories com os seus imóveis, a sua região e a cara da sua marca. Você aprova, e a ARP Vision publica no dia marcado.',
        button: 'Quero uma cotação no WhatsApp',
        note: 'Nenhum post sai sem a sua aprovação.',
        mockDescription:
          'Exemplo: calendário de duas semanas da Imobiliária Exemplo, com posts e stories já aprovados, outros esperando a sua aprovação e o botão Aprovar tudo.',
      },
      pain: {
        eyebrow: 'PARECE FAMILIAR?',
        before: 'Este mês você',
        // O fim do título troca sozinho entre estes trechos e para no primeiro. Cada um cabe numa
        // linha a 360 px: o título reserva a altura do maior.
        phrases: [
          'vendeu uma casa.',
          'captou dois imóveis.',
          'alugou uma sala.',
          'assinou no cartório.',
        ],
        after: 'E nada disso chegou ao Instagram.',
        text: 'Manter o perfil em dia entre uma visita e outra é difícil.',
      },
      steps: {
        title: 'Três passos. Depois, é só aprovar.',
        items: [
          {
            title: 'Mande o endereço do site',
            text: 'A ARP Vision lê a sua marca, a sua região e os seus imóveis no seu site. Se o site não puder ser lido, ou se você não tiver site, você manda as fotos e os dados dos imóveis.',
          },
          {
            title: 'Escolha o estilo',
            text: 'Veja um imóvel seu em cada estilo, com o seu logo e as suas cores, e fique com o que preferir.',
          },
          {
            title: 'Aprove o mês',
            text: 'Tudo de uma vez ou post a post. Se quiser mudar algo, peça a alteração no próprio post. A ARP Vision publica cada um no dia marcado.',
          },
        ],
      },
      // As oito artes, nesta ordem. PostGallery.astro escolhe a foto e o formato de cada uma pelo
      // `id`, que é o mesmo nos dois idiomas e não aparece na página; `kind` é o tipo de post, e
      // `title`, o texto principal da arte.
      gallery: {
        title: 'Assim ficam os seus posts',
        lead: 'Com as fotos dos seus imóveis, o seu logo e o CRECI em todas as peças.',
        arts: [
          { id: 'sale', kind: 'À venda', title: 'Casa com 3 quartos e piscina' },
          { id: 'rent', kind: 'Para alugar', title: 'Casa com lareira e varanda' },
          { id: 'sold', kind: 'Vendido', title: 'Mais uma chave entregue no Bairro Exemplo' },
          { id: 'tour', kind: 'Tour 360°', title: 'Veja esta casa por dentro' },
          { id: 'neighborhood', kind: 'Seu bairro', title: 'O que tem perto no Bairro Exemplo' },
          { id: 'tip', kind: 'Dica', title: 'Documentos para separar antes de vender' },
          { id: 'valuation', kind: 'Captação', title: 'Vai vender ou alugar? Peça uma avaliação' },
          { id: 'story', kind: 'Story', title: 'Novidade no Bairro Exemplo' },
        ],
      },
      included: {
        title: 'O que está incluído',
        items: [
          {
            title: 'Posts e stories',
            text: 'O mês inteiro, nos dias e horários que você escolher.',
          },
          { title: 'Venda e locação', text: 'À venda, para alugar, vendido e alugado.' },
          { title: 'Sua região', text: 'Posts sobre os bairros onde você trabalha.' },
          { title: 'Captação', text: 'Convites para proprietários pedirem uma avaliação.' },
          { title: 'Sua marca', text: 'Seu logo, suas cores e o estilo que você escolher.' },
          {
            title: 'CRECI em toda peça',
            text: 'O nome da imobiliária e o número do CRECI que você informar, em destaque.',
          },
          { title: 'Tour 360° nos posts', text: 'Posts que convidam a ver o tour do imóvel.' },
          { title: 'Você aprova antes', text: 'E pede alteração no post que quiser.' },
        ],
      },
      comparison: {
        title: 'Três jeitos de cuidar do Instagram',
        columns: ['Fazer sozinho', 'Contratar agência', 'ARP Vision'],
        rows: [
          {
            label: 'Seu tempo',
            values: ['Horas toda semana', 'Reuniões e revisões', 'Aprovar o mês'],
          },
          {
            label: 'Com seus imóveis e sua região',
            values: [
              'Quando sobra tempo',
              'Se você mandar o material',
              'A partir do seu site ou das fotos que você manda',
            ],
          },
          { label: 'Constância', values: ['Depende da semana', 'Sim', 'Sim, todo mês'] },
        ],
      },
      // A resposta escolhida entra na mensagem do WhatsApp como está escrita aqui; o `id` só
      // nomeia o campo do formulário.
      quote: {
        eyebrow: 'PREÇO SOB MEDIDA',
        title: 'Uma proposta para o tamanho da sua carteira.',
        lead: 'Responda 3 perguntas rápidas e receba pelo WhatsApp uma proposta para os seus imóveis e o número de posts que você quer, sem compromisso.',
        questions: [
          {
            id: 'listings',
            label: 'Quantos imóveis você tem anunciados?',
            summary: 'Imóveis anunciados',
            options: ['Até 20', '21 a 100', 'Mais de 100'],
          },
          {
            id: 'posts',
            label: 'Quantos posts por semana?',
            summary: 'Posts por semana',
            options: ['2', '3', '5', 'Ainda não sei'],
          },
          {
            id: 'timing',
            label: 'Para quando?',
            summary: 'Para quando',
            options: ['Este mês', 'Próximo mês', 'Ainda pesquisando'],
          },
        ],
        greeting:
          'Olá! Vim pelo site e quero uma cotação do Piloto automático para Instagram da ARP Vision.',
        closing: 'Pode me mandar uma proposta?',
      },
      faq: {
        eyebrow: 'DÚVIDAS FREQUENTES',
        title1: 'Você pergunta.',
        title2: 'A gente explica.',
        lead1: 'Sem letras miúdas.',
        lead2: 'Entenda cada parte do Piloto automático.',
        items: [
          {
            question: 'Preciso de conta profissional no Instagram?',
            answer:
              'Sim. A conta precisa ser profissional (comercial ou de criador de conteúdo). A troca é gratuita e se faz no próprio Instagram.',
          },
          {
            question: 'O CRECI aparece em todos os posts?',
            answer:
              'Sim. Toda peça leva o nome da imobiliária e o número do CRECI que você informar.',
          },
          {
            question: 'De onde vêm os imóveis?',
            answer:
              'Do site da sua imobiliária. Se o site não puder ser lido, ou se você não tiver site, você manda as fotos e os dados dos imóveis.',
          },
          {
            question: 'Posso mudar um post antes de sair?',
            answer: 'Sim. Você pede a alteração no próprio post ou tira o post do mês.',
          },
          {
            question: 'Quantos posts e stories por mês?',
            answer: 'Você escolhe quantos por semana, e a proposta leva isso em conta.',
          },
          {
            question: 'Pode sair algum post sem eu ver?',
            answer: 'Não. Só sai o que você aprovou.',
          },
          {
            question: 'Os stories têm link?',
            answer:
              'Não. O story não leva link clicável; o WhatsApp da imobiliária vai escrito na arte.',
          },
          {
            question: 'Como cancelo?',
            answer: 'As condições de contrato, inclusive de cancelamento, vêm na proposta.',
          },
        ],
      },
      finalCta: {
        title: 'O seu próximo mês de Instagram, pronto para aprovar.',
        lead: 'Fale com a ARP Vision e receba uma proposta para a sua imobiliária.',
        button: 'Quero uma cotação no WhatsApp',
      },
      // A mensagem do rodapé e do botão flutuante; os botões de cotação usam a saudação da cotação.
      whatsappMessage:
        'Olá! Vim pelo site e quero saber do Piloto automático para Instagram da ARP Vision.',
      // O texto fictício das telas de exemplo.
      mock: {
        // O calendário do topo.
        period: 'Próximas duas semanas',
        weekdays: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
        story: 'Story',
        approved: 'Aprovado',
        waiting: 'Esperando você',
        approveAll: 'Aprovar tudo',
        // O perfil parado, ao lado da dor.
        handle: 'suaimobiliaria',
        lastPost: 'Último post: junho',
        profileDescription:
          'Exemplo: perfil de imobiliária no Instagram com o último post em junho.',
        // As telas dos passos de "Como funciona": o endereço do site lido, os estilos e o mês.
        siteDescription:
          'Exemplo: o endereço suaimobiliaria.com.br no campo do site, com o botão Ler e o aviso de logo, cores e imóveis encontrados.',
        siteAddress: 'suaimobiliaria.com.br',
        siteRead: 'Ler',
        siteFound: 'Logo, cores e imóveis encontrados',
        stylesDescription:
          'Exemplo: a mesma casa em três estilos de arte, com o do meio marcado como o seu estilo.',
        styleChosen: 'Seu estilo',
        monthDescription:
          'Exemplo: o próximo mês de posts num calendário pequeno, com os botões Aprovar tudo e Pedir alteração.',
        month: 'Próximo mês',
        requestChange: 'Pedir alteração',
        // As artes. O CRECI é da imobiliária: vai em toda peça, inclusive nas que não anunciam
        // um imóvel (bairro, dica, captação).
        agency: 'Imobiliária Exemplo',
        license: 'CRECI 00000-J',
        licenseOnEveryPost: true,
        details: '3 quartos · 240 m²',
        // O WhatsApp escrito no story: o rótulo numa linha e o número inteiro na de baixo.
        whatsapp: 'WhatsApp',
        whatsappNumber: '(00) 00000-0000',
      },
    },
    // O Autochat atende só no WhatsApp da imobiliária e se apresenta como atendimento automático.
    // Toda distância é aproximada e vem com "em linha reta" (o teste de catálogo confere).
    autochat: {
      meta: {
        title: 'Autochat: atendimento no WhatsApp para imobiliárias | ARP Vision',
        description:
          'O Autochat atende no WhatsApp da sua imobiliária, encontra imóveis por região, preço, quartos e o que tem perto, e passa o cliente ao corretor com um resumo.',
      },
      hero: {
        eyebrow: 'AUTOCHAT',
        title: 'Cliente respondido na hora, mesmo fora do expediente.',
        lead: 'O Autochat atende no WhatsApp da sua imobiliária, entende o que o cliente procura (região, preço, quartos, perto de escola ou hospital), mostra os imóveis que combinam e passa a conversa para o corretor com um resumo pronto.',
        button: 'Quero uma cotação no WhatsApp',
        note: 'O cliente pode pedir um corretor a qualquer momento.',
        mockDescription:
          'Exemplo: conversa no WhatsApp da Imobiliária Exemplo. O atendimento automático se apresenta, a cliente pede um apartamento de 2 quartos para alugar no Centro, perto de escola, até 2.500 por mês, e recebe um imóvel a uns 450 m de uma escola, em linha reta, com o botão Ver o tour 360°. Ao lado, o resumo para a corretora.',
      },
      // O título fica parado: não tem trecho que troca, como o do Piloto.
      pain: {
        eyebrow: 'PARECE FAMILIAR?',
        title: 'O cliente chamou às 22h. Às 9h, já tinha falado com outra imobiliária.',
        text: 'Quem procura imóvel escreve para várias imobiliárias ao mesmo tempo. Quem responde primeiro, e responde bem, sai na frente.',
      },
      steps: {
        title: 'Da primeira mensagem ao corretor, em quatro passos.',
        items: [
          {
            title: 'O cliente chama no WhatsApp',
            text: 'No WhatsApp da sua imobiliária, a qualquer hora.',
          },
          {
            title: 'O Autochat entende o que ele procura',
            text: 'Compra ou aluguel, região, faixa de preço, quartos, vagas, pet e o que precisa ter perto.',
          },
          {
            title: 'Mostra os imóveis que combinam',
            text: 'Só da sua carteira, com foto, preço e link. Quando o imóvel tem tour 360°, o cliente já olha por dentro.',
          },
          {
            title: 'Passa para o corretor',
            text: 'Com um resumo da conversa e os horários em que o cliente prefere visitar.',
          },
        ],
      },
      // "Perto do que importa". As três distâncias são as do imóvel de exemplo (DistanceListMock).
      proximity: {
        title: 'Perto do que importa',
        text: 'O cliente escreve “perto de escola”, “perto do hospital” ou “perto da estação”, e o Autochat procura na sua carteira os imóveis que ficam perto, com a distância aproximada, em linha reta.',
        coverage:
          'A distância vem de bases públicas de escolas, hospitais e estações, e a cobertura muda de cidade para cidade.',
        examples: [
          { place: 'Escola', distance: 'cerca de 450 m em linha reta' },
          { place: 'Hospital', distance: 'cerca de 1,2 km em linha reta' },
          { place: 'Estação', distance: 'cerca de 800 m em linha reta' },
        ],
      },
      // "O que o corretor recebe": o que vai no resumo, na ordem do cartão de exemplo.
      broker: {
        title: 'O corretor recebe o cliente já explicado.',
        fields: [
          'O nome e o WhatsApp do cliente',
          'Se é compra ou aluguel',
          'O que ele procura',
          'Os imóveis que viu e de quais gostou',
          'Quando quer visitar',
          'A conversa inteira',
        ],
      },
      // "Quando passa para uma pessoa".
      handoff: {
        title: 'O Autochat chama o corretor nestes casos:',
        items: [
          'Quando o cliente pede para falar com uma pessoa, a qualquer momento.',
          'Quando o assunto é proposta, negociação, documentos ou financiamento.',
          'Quando a pergunta não está no cadastro do imóvel.',
          'Fora do horário, ele avisa quando a equipe volta e deixa o resumo pronto.',
        ],
        closing: 'O Autochat não negocia nem fecha nada: quem negocia é o corretor.',
      },
      included: {
        title: 'O que está incluído',
        items: [
          {
            title: 'A qualquer hora',
            text: 'Responde assim que o cliente escreve, também fora do horário.',
          },
          {
            title: 'Atendimento automático',
            text: 'Diz logo na primeira mensagem que é o atendimento automático da imobiliária.',
          },
          {
            title: 'As perguntas que importam',
            text: 'Compra ou aluguel, região, faixa de preço, quartos, vagas e pet.',
          },
          {
            title: 'Só a sua carteira',
            text: 'Mostra só imóveis da sua imobiliária, com foto, preço e link.',
          },
          {
            title: 'Tour 360° na conversa',
            text: 'Quando o imóvel tem tour, o cliente já olha por dentro.',
          },
          {
            title: 'O que tem perto',
            text: 'A distância aproximada, em linha reta, até escola, hospital e estação.',
          },
          {
            title: 'Resumo para o corretor',
            text: 'Com o que o cliente procura e a conversa inteira.',
          },
          { title: 'Sem documentos', text: 'Não pede documento, CPF nem dado de saúde.' },
        ],
      },
      // A resposta escolhida entra na mensagem do WhatsApp como está escrita aqui; o `id` só
      // nomeia o campo do formulário.
      quote: {
        eyebrow: 'PREÇO SOB MEDIDA',
        title: 'Uma proposta para o tamanho da sua equipe.',
        lead: 'Responda 3 perguntas rápidas e receba pelo WhatsApp uma proposta para a sua equipe e as conversas que chegam, sem compromisso.',
        questions: [
          {
            id: 'brokers',
            label: 'Quantos corretores atendem?',
            summary: 'Corretores',
            options: ['1 a 3', '4 a 10', 'Mais de 10'],
          },
          {
            id: 'contacts',
            label: 'Quantos contatos chegam por mês?',
            summary: 'Contatos por mês',
            options: ['Até 100', '100 a 500', 'Mais de 500', 'Não sei'],
          },
          {
            id: 'timing',
            label: 'Para quando?',
            summary: 'Para quando',
            options: ['Este mês', 'Próximo mês', 'Ainda pesquisando'],
          },
        ],
        greeting: 'Olá! Vim pelo site e quero uma cotação do Autochat da ARP Vision.',
        closing: 'Pode me mandar uma proposta?',
      },
      faq: {
        eyebrow: 'DÚVIDAS FREQUENTES',
        title1: 'Você pergunta.',
        title2: 'A gente explica.',
        lead1: 'Sem letras miúdas.',
        lead2: 'Entenda cada parte do Autochat.',
        items: [
          {
            question: 'É um robô?',
            answer:
              'Sim. É um atendimento automático, e ele se apresenta assim logo na primeira mensagem. O cliente pode pedir um corretor quando quiser.',
          },
          {
            question: 'Funciona à noite e no fim de semana?',
            answer: 'Sim. Ele responde a qualquer hora e deixa o resumo pronto para o corretor.',
          },
          {
            question: 'Usa o WhatsApp da imobiliária?',
            answer:
              'Sim. O Autochat usa o caminho oficial do WhatsApp para atendimento automático. Pode ser o número que vocês já usam ou um número novo, e a ARP Vision explica antes o que muda no celular da equipe.',
          },
          {
            question: 'De onde vêm as respostas sobre os imóveis?',
            answer:
              'Do cadastro dos seus imóveis. O que não está lá, ele passa para o corretor. Preço e condições, o corretor confirma antes de qualquer proposta.',
          },
          {
            question: 'Como funciona a busca por perto de escola ou hospital?',
            answer:
              'Pela distância aproximada, em linha reta, entre o imóvel e o lugar. O caminho a pé ou de carro, e o que não estiver na base, o cliente confirma com o corretor.',
          },
          {
            question: 'Ele pede documentos ou CPF?',
            answer: 'Não. Documentos e dados financeiros ficam com o corretor.',
          },
          {
            question: 'E os dados dos meus clientes?',
            answer:
              'A imobiliária é a controladora dos dados dos clientes dela, e a ARP Vision é a operadora: trata as conversas só para fazer o atendimento, em nome da imobiliária e seguindo as instruções dela.',
          },
          {
            question: 'Quanto custa?',
            answer:
              'Depende do tamanho da equipe e de quantas conversas chegam. A proposta vem pelo WhatsApp e explica também como é paga a tarifa que a Meta cobra por mensagem, quando houver.',
          },
        ],
      },
      finalCta: {
        title: 'Atendimento na hora, corretor com o resumo pronto.',
        lead: 'Fale com a ARP Vision e receba uma proposta para a sua imobiliária.',
        button: 'Quero uma cotação no WhatsApp',
      },
      // A mensagem do rodapé e do botão flutuante; os botões de cotação usam a saudação da cotação.
      whatsappMessage: 'Olá! Vim pelo site e quero saber do Autochat da ARP Vision.',
      // O texto fictício das telas de exemplo: a conversa do topo, o que a cliente procura, o
      // cartão do imóvel, o resumo para a corretora e as distâncias. A licença é a da imobiliária
      // (no espanhol, a calificación energética do imóvel).
      mock: {
        agency: 'Imobiliária Exemplo',
        automated: 'Atendimento automático',
        // A conversa, na ordem: a apresentação, o pedido da cliente e o imóvel que combina.
        intro:
          'Olá! Sou o atendimento automático da Imobiliária Exemplo. Se preferir, chamo um corretor.',
        request:
          'Procuro apartamento de 2 quartos para alugar no Centro, perto de escola, até 2.500 por mês.',
        found: 'Achei 3 opções. Esta fica a uns 450 m de uma escola, em linha reta:',
        // O cartão do imóvel, na conversa e no passo 3.
        listing: 'Apartamento no Centro',
        listingDetails: '2 quartos · 68 m²',
        listingPrice: '2.400 por mês',
        listingDistance: 'A uns 450 m de uma escola, em linha reta',
        license: 'CRECI 00000-J',
        tour: 'Ver o tour 360°',
        // O que a cliente procura: o negócio e o resto, nas fichas do passo 2 e no resumo.
        wishesTitle: 'O que a cliente procura',
        deal: 'Aluguel',
        wishes: ['Centro', '2 quartos', 'até 2.500 por mês', 'perto de escola'],
        // O resumo para a corretora, no topo, no passo 4 e em "O que o corretor recebe".
        summary: 'Resumo para a corretora',
        client: 'Mariana Souza',
        // O WhatsApp da cliente: o rótulo e o número, que vai inteiro, sem quebrar no meio.
        whatsapp: 'WhatsApp',
        clientPhone: '(00) 00000-0000',
        seen: 'Viu 3 imóveis e gostou do apartamento no Centro',
        visit: 'Quer visitar no sábado de manhã',
        conversation: 'Conversa inteira',
        // As telas dos passos, das distâncias e do resumo.
        requestDescription:
          'Exemplo: a conversa com a Imobiliária Exemplo no WhatsApp e a mensagem da cliente, às 22h04, pedindo um apartamento de 2 quartos para alugar no Centro.',
        wishesDescription:
          'Exemplo: o que a cliente procura: aluguel, Centro, 2 quartos, até 2.500 por mês e perto de escola.',
        listingDescription:
          'Exemplo: o cartão de um apartamento no Centro, com foto, preço, a distância até uma escola, em linha reta, e o botão Ver o tour 360°.',
        summaryStartDescription:
          'Exemplo: o começo do resumo para a corretora, com o nome e o WhatsApp da cliente e o que ela procura.',
        summaryDescription:
          'Exemplo: o resumo para a corretora, com o nome e o WhatsApp da cliente, o aluguel, o que ela procura, os imóveis que viu e de qual gostou, quando quer visitar e a conversa inteira.',
        distancesDescription:
          'Exemplo: um apartamento no Centro e as distâncias aproximadas, em linha reta, até uma escola (cerca de 450 m), um hospital (cerca de 1,2 km) e uma estação (cerca de 800 m).',
      },
    },
    // Os dois vídeos de exemplo do topo são arquivos (`site.media.exampleVideos`), um par por
    // idioma, com o selo, os dados do imóvel e o cartão final gravados na imagem.
    videos: {
      meta: {
        title: 'Vídeos de imóveis a partir de fotos | ARP Vision',
        description:
          'Você manda as fotos do imóvel e a ARP Vision monta o vídeo para Reels, stories e portais, com os dados do imóvel, seu logo e o CRECI.',
      },
      hero: {
        eyebrow: 'VÍDEOS A PARTIR DE FOTOS',
        title: 'As fotos do anúncio viram vídeo para Reels e portais.',
        lead: 'Você manda as fotos do imóvel. A ARP Vision monta o vídeo com movimento suave, música, os dados do imóvel na tela e o seu logo com o CRECI no final, na vertical e na horizontal.',
        button: 'Quero uma cotação no WhatsApp',
        note: 'Quando o imóvel tem tour 360°, o vídeo termina com o link do tour.',
      },
      // VideoFormats.astro desenha o formato de cada cartão pelo `id`, o mesmo nos dois idiomas.
      formats: {
        title: 'Um conjunto de fotos, os formatos de que você precisa.',
        cards: [
          { id: 'vertical', title: 'Vertical, para Reels e stories' },
          { id: 'horizontal', title: 'Horizontal, para portais e YouTube' },
          { id: 'ending', title: 'Final com a sua marca e o tour' },
        ],
      },
      steps: {
        title: 'Das fotos ao vídeo, em três passos.',
        items: [
          {
            title: 'Mande as fotos',
            text: "As fotos do anúncio, desde que a imobiliária possa usá-las e elas não tenham marca d'água de outra empresa.",
          },
          {
            title: 'A ARP Vision monta o vídeo',
            text: 'Na ordem de uma visita, da fachada à área externa, com movimento suave em cada foto.',
          },
          {
            title: 'Aprove e receba',
            text: 'Você pede ajuste se quiser e recebe as duas versões em MP4.',
          },
        ],
      },
      included: {
        title: 'O que entra no vídeo',
        items: [
          { title: 'Movimento suave', text: 'Sobre as próprias fotos do imóvel.' },
          { title: 'Música', text: 'Uma trilha de fundo acompanha as fotos.' },
          { title: 'Os dados do imóvel', text: 'Quartos, área e bairro, na tela.' },
          { title: 'Seu logo e o CRECI', text: 'No final do vídeo, com o seu contato.' },
          {
            title: 'O link do tour 360°',
            text: 'Quando o imóvel tem tour, o vídeo termina com ele.',
          },
          { title: 'Vertical e horizontal', text: 'As duas versões, em MP4.' },
        ],
      },
      // A resposta escolhida entra na mensagem do WhatsApp como está escrita aqui; o `id` só
      // nomeia o campo do formulário.
      quote: {
        eyebrow: 'PREÇO SOB MEDIDA',
        title: 'Uma proposta para o ritmo dos seus anúncios.',
        lead: 'Responda 3 perguntas rápidas e receba pelo WhatsApp uma proposta para os seus imóveis e os formatos que você quer, sem compromisso.',
        questions: [
          {
            id: 'listings',
            label: 'Quantos imóveis por mês?',
            summary: 'Imóveis por mês',
            options: ['1 a 5', '6 a 20', 'Mais de 20'],
          },
          {
            id: 'formats',
            label: 'Quais formatos?',
            summary: 'Formatos',
            options: ['Vertical', 'Horizontal', 'Os dois'],
          },
          {
            id: 'timing',
            label: 'Para quando?',
            summary: 'Para quando',
            options: ['Este mês', 'Próximo mês', 'Ainda pesquisando'],
          },
        ],
        greeting:
          'Olá! Vim pelo site e quero uma cotação de vídeos a partir de fotos da ARP Vision.',
        closing: 'Pode me mandar uma proposta?',
      },
      faq: {
        eyebrow: 'DÚVIDAS FREQUENTES',
        title1: 'Você pergunta.',
        title2: 'A gente explica.',
        lead1: 'Sem letras miúdas.',
        lead2: 'Entenda cada parte dos vídeos.',
        items: [
          {
            question: 'Quantas fotos preciso mandar?',
            answer:
              'As fotos do anúncio já servem. Quanto mais ambientes, mais completo fica o vídeo.',
          },
          { question: 'Em quanto tempo recebo?', answer: 'O prazo vem na proposta.' },
          {
            question: 'Quais formatos recebo?',
            answer:
              'Vertical (9:16), para Reels e stories, e horizontal (16:9), para portais e YouTube, em MP4.',
          },
          {
            question: 'Dá para pôr logo, contato e CRECI?',
            answer: 'Sim. O final do vídeo leva o seu logo, o contato e o CRECI.',
          },
          {
            question: 'Preciso fotografar de novo?',
            answer: 'Não. O vídeo é feito com as fotos que você já tem.',
          },
          {
            question: 'Posso usar nos portais e no Instagram?',
            answer: 'Sim, nos portais que aceitam vídeo e nas suas redes.',
          },
          {
            question: 'E se eu quiser mudar algo?',
            answer: 'Você pede o ajuste antes de receber a versão final.',
          },
          {
            question: 'Quanto custa?',
            answer: 'Depende de quantos imóveis por mês. A proposta vem pelo WhatsApp.',
          },
        ],
      },
      finalCta: {
        title: 'O seu próximo anúncio já com vídeo.',
        lead: 'Fale com a ARP Vision e receba uma proposta para os seus imóveis.',
        button: 'Quero uma cotação no WhatsApp',
      },
      // A mensagem do rodapé e do botão flutuante; os botões de cotação usam a saudação da cotação.
      whatsappMessage:
        'Olá! Vim pelo site e quero saber dos vídeos a partir de fotos da ARP Vision.',
      // O texto das telas de exemplo e o dos vídeos do topo.
      mock: {
        // Os dois vídeos do topo: a descrição para o leitor de tela e os rótulos do botão.
        verticalDescription:
          'Exemplo: vídeo vertical, para Reels e stories, feito com cinco fotos de uma casa, com o bairro, a área e os quartos na tela e, no final, a Imobiliária Exemplo com o CRECI e o convite para o tour 360°.',
        verticalPlay: 'Reproduzir o vídeo vertical',
        verticalPause: 'Pausar o vídeo vertical',
        horizontalDescription: 'Exemplo: o mesmo vídeo na horizontal, para portais e YouTube.',
        horizontalPlay: 'Reproduzir o vídeo horizontal',
        horizontalPause: 'Pausar o vídeo horizontal',
        // As telas dos passos de "Como funciona": as fotos enviadas, na ordem em que chegaram; as
        // mesmas fotos na ordem da visita; e as duas versões para aprovar.
        photosDescription: 'Exemplo: quatro fotos de uma casa, cada uma com o visto de enviada.',
        photosSent: '4 fotos enviadas',
        scenesDescription:
          'Exemplo: as quatro fotos na ordem de uma visita: fachada, sala, cozinha e área externa.',
        scenesTitle: 'Ordem da visita',
        scenes: ['Fachada', 'Sala', 'Cozinha', 'Área externa'],
        deliveryDescription:
          'Exemplo: as duas versões do vídeo, 9:16 e 16:9, em MP4, com os botões Aprovar e Pedir ajuste.',
        vertical: '9:16',
        horizontal: '16:9',
        file: 'MP4',
        approve: 'Aprovar',
        requestAdjustment: 'Pedir ajuste',
      },
    },
  },
  footer: {
    taglineLines: ['O espaço por inteiro.', 'O celular é só o começo.'],
    products: 'Produtos',
    discover: 'Conheça',
    howItWorks: 'Como funciona',
    realTour: 'Tour real',
    plans: 'Planos',
    quote: 'Pedir cotação',
    faq: 'Dúvidas frequentes',
    tutorials: 'Tutoriais em vídeo',
    start: 'Comece por aqui',
    signup: 'Criar conta grátis',
    login: 'Entrar na minha conta',
    talk: 'Vamos conversar',
    whatsapp: (number: string) => `WhatsApp ${number}`,
    note: 'Feito para quem tem espaços para mostrar.',
    cnpj: 'CNPJ',
    terms: 'Termos de Uso',
    privacy: 'Política de Privacidade',
    quickContact: 'Contato rápido',
    floatingWhatsapp: 'Falar com a ARP Vision no WhatsApp',
  },
  contactDialog: {
    close: 'Fechar',
    title: 'Vamos conversar em breve.',
    text: (credits: number, days: number) =>
      `Nosso atendimento comercial abre em breve. Enquanto isso, crie sua conta grátis e teste a captura com ${credits} ${credits === 1 ? 'crédito' : 'créditos'}, por ${days} dias, sem cartão.`,
    signup: 'Criar conta grátis',
  },
  home: {
    title: 'Tour virtual 360° com o celular | ARP Vision',
    // Texto do resultado de busca: entre 140 e 160 caracteres para não ser cortado pelo Google.
    description:
      'Crie o tour virtual 360° do seu espaço só com o celular. Emendas e luz corrigidas, link pronto para o WhatsApp e o cliente abre sem criar conta. Teste grátis.',
    ogImage: '/images/og-home.png',
    eyebrow: 'TOUR VIRTUAL 360° PARA O SEU NEGÓCIO',
    title1: 'Transforme o seu espaço em uma experiência.',
    title2: 'Só com o celular.',
    opening:
      'Faça o tour virtual 360° do seu espaço só com o celular. E o cliente abre o tour sem criar conta.',
    howTitle: 'O app tira as fotos para você',
    howSubtitle: 'Abra a câmera e siga as instruções',
    steps: [
      'Capture com seu próprio celular.',
      'A ARP Vision monta.',
      'Pronto, agora é só compartilhar.',
    ],
    videoLabel: 'Tutorial da captura 360 graus da ARP Vision',
    videoPlay: 'Reproduzir vídeo',
    videoPause: 'Pausar vídeo',
    presentationLabel: 'Tour virtual e benefícios',
    plansEyebrow: 'COMECE PEQUENO. MOSTRE POR INTEIRO.',
    plansTitle: 'Um plano para o seu próximo passo.',
    plansLead: '1 crédito = 1 ambiente fotografado com o celular. O saldo é da sua empresa.',
  },
  fan: {
    label: 'Ambientes fotografados com o celular',
    stageLabel: 'Miniaturas de ambientes em 360 graus',
    arrow: (room: string) => `Ver tour de demonstração: ${room}`,
    roomLink: (room: string) => `${room} — ver tour de demonstração`,
    select: (room: string) => `Destacar cartão: ${room}`,
    rooms: {
      suite: {
        title: 'Suíte',
        alt: 'Box de vidro e banheira em um banheiro fotografado em 360 graus',
      },
      quarto: { title: 'Quarto', alt: 'Duas poltronas junto a uma mesa no quarto com suíte' },
      sala: {
        title: 'Sala',
        alt: 'Escada de madeira e mesa de vidro na sala fotografada em 360 graus',
      },
      quartoVisita: { title: 'Quarto Visita', alt: 'Televisão junto à janela e à cortina' },
      patio: {
        title: 'Pátio',
        alt: 'Piscina, cascata e área coberta de churrasqueira no pátio',
      },
    } satisfies Record<FanRoomId, { title: string; alt: string }>,
  },
  sharing: {
    eyebrow: 'COMPARTILHAMENTO',
    title1: 'Um link. O cliente',
    title2: 'abre onde estiver.',
    channels: {
      whatsapp: {
        title: 'No WhatsApp',
        text: 'O cliente abre o link sem criar conta e vê o espaço inteiro.',
      },
      site: {
        title: 'No seu site',
        text: 'Cole o código na página, nos formatos responsivo, 16:9 ou quadrado.',
      },
      visit: { title: 'Antes da visita', text: 'Quem chega já conhece o espaço e vem decidido.' },
    },
    // A conversa em português é uma imagem; sem ela, o componente monta a conversa em
    // HTML com o texto de `chat` (é o que o espanhol usa).
    conversationImage: {
      src: '/images/conversa-whatsapp.webp',
      alt: 'Simulação de um corretor enviando um tour de 9 ambientes no WhatsApp. A mensagem explica que o cliente pode abrir no computador ou no celular, sem baixar nada nem criar conta.',
    } as { src: string; alt: string } | null,
    chat: {
      label: 'Simulação de uma conversa no WhatsApp com o link de um tour de 9 ambientes',
      contact: 'Cliente',
      status: 'conversa no WhatsApp',
      message: 'Oi! Segue o tour do espaço. Dá para ver tudo por dentro, ambiente por ambiente:',
      linkTitle: 'Tour 360° · 9 ambientes',
      reply:
        'Você não precisa baixar nada nem criar conta. Pode abrir no computador ou no celular.',
    },
  },
  showcase: {
    frameTitle: 'Tour 360° de demonstração da ARP Vision',
    title: 'Olhe o espaço por dentro.',
    hint: 'Clique ou toque para explorar o tour.',
    newTab: 'Abrir tour em nova aba',
    exit: 'Encerrar exploração',
    marqueeLabel: 'O que o tour entrega',
    words: [
      'Confiança',
      'Exclusividade',
      'Agilidade',
      'Economia de tempo',
      'Valor',
      'Imersão',
      'Conexão',
      'Transparência',
      'Credibilidade',
      'Diferenciação',
      'Destaque',
      'Alcance',
      'Acessibilidade',
      'Conveniência',
      'Autonomia',
      'Inovação',
      'Encantamento',
      'Presença digital',
      'Visita sem limites',
      'Experiência interativa',
      'Proximidade',
      'Valor percebido',
    ],
  },
  credits: {
    title1: 'Cada ambiente vira uma',
    title2: 'imagem 360° de alta qualidade.',
    lead: 'Você não paga por foto nem por tour. Paga por ambiente pronto.',
    // O tempo de uma volta é o texto aprovado da landing (medido no app: ~2 min por ambiente).
    flow: {
      capture: { value: '30 segundos', text: 'Uma volta só com o celular, em cada ambiente.' },
      image: {
        value: '1 imagem 360°',
        text: 'As fotos viram uma imagem única, em alta qualidade.',
      },
      credit: { value: '1 crédito', text: 'É o que cada ambiente usa do saldo do plano.' },
    },
    example:
      'Na prática: uma casa com sala, cozinha, 2 quartos, 1 banheiro tem 5 ambientes, ou seja, 5 créditos.',
  },
  tour: {
    eyebrow: 'ENTRE. OLHE EM VOLTA. EXPLORE.',
    title1: 'Isto foi fotografado',
    title2: 'com um celular.',
    lead: 'Arraste para olhar em volta. Toque nas passagens para ir de um cômodo a outro.',
    badge: 'Um novo jeito de visitar.',
    tabsLabel: 'Espaços de demonstração',
    illustrativeAlt: 'Sala de estar ilustrativa com sofá, luz natural e mobiliário de madeira',
    illustrativeName: 'Um espaço, todos os ângulos',
    openLabel: 'Entrar no espaço: abrir tour 360 graus',
    pendingLabel: 'Ver disponibilidade do tour de demonstração',
    open: 'Entrar no espaço',
    demo: 'Tour de demonstração',
    openHint: 'A visita começa com um toque.',
    pendingHint: 'A demonstração real está em preparação.',
    explore: 'Explore cada ambiente',
    captured: 'Capturado com ARP Vision',
    illustrative: 'Foto ilustrativa · não é uma captura da ARP Vision',
    toBeDefined: '[a definir]',
    noTripod: 'Sem tripé',
    ready: 'Pronto em ~1 min por ambiente',
    cta: 'Quero um tour assim do meu espaço',
    qrAlt: 'QR code para abrir o tour no celular',
    qrLine1: 'Veja no',
    qrLine2: 'seu celular',
    // Também usados pelo script do navegador ao trocar de tour.
    coverAlt: 'Vista do espaço {name}',
    phone: 'Celular: {phone}',
    photos: '{photos} fotos por ambiente',
    time: 'Captura: {time} por ambiente',
    // Só do script do navegador.
    failed: 'Não foi possível abrir o tour agora. ',
    newTab: 'Abrir em nova aba',
    pending:
      'O tour real ainda está em preparação. Esta capa é ilustrativa. Volte em breve para explorar um espaço capturado com a ARP Vision.',
    loading: 'Abrindo o espaço…',
    frameTitle: 'Tour 360° de exemplo: {name}',
    dialogLabel: 'Tour de {name}',
    closeDialog: 'Fechar tour ×',
  },
  team: {
    eyebrow: 'UMA FERRAMENTA. A EQUIPE TODA.',
    title1: 'Monte seu ecossistema de tours,',
    title2: 'pensado para empresas.',
    benefits: {
      autonomy: {
        title: 'Mais autonomia para quem captura.',
        text: 'Mais visibilidade para quem faz a gestão.',
      },
      standard: {
        title: 'Mesmo padrão para todos.',
        text: 'Feito para quem nunca fotografou e quem já é experiente entregarem o mesmo resultado.',
      },
    },
  },
  quote: {
    eyebrow: 'PREÇO SOB MEDIDA',
    title: 'Cada negócio tem um tamanho. A sua proposta também.',
    lead: 'Responda 3 perguntas rápidas e receba pelo WhatsApp uma proposta para o seu volume de espaços, sem compromisso.',
    benefits: {
      volume: {
        title: 'Proposta para o seu volume.',
        text: 'Você paga por ambiente pronto, não por foto.',
      },
      phone: {
        title: 'Sem câmera 360° e sem fotógrafo.',
        text: 'O celular que você já tem faz o tour.',
      },
      team: { title: 'Conversa direta com o time.', text: 'Tire as dúvidas antes de decidir.' },
    },
    // A resposta escolhida entra na mensagem do WhatsApp como está escrita aqui.
    questions: {
      perfil: {
        label: 'Como você trabalha?',
        summary: 'Como trabalho',
        options: ['Tenho 1 espaço', 'Trabalho sozinho', 'Tenho uma equipe', 'Várias unidades'],
      },
      volume: {
        label: 'Quantos espaços por mês?',
        summary: 'Espaços por mês',
        options: ['1', '2 a 5', '6 a 15', 'Mais de 15'],
      },
      prazo: {
        label: 'Para quando?',
        summary: 'Para quando',
        options: ['Esta semana', 'Este mês', 'Ainda pesquisando'],
      },
    },
    greeting: 'Olá! Vim pelo site e quero uma cotação da ARP Vision.',
    closing: 'Pode me mandar uma proposta?',
    preview: 'Sua mensagem',
    submit: 'Quero minha cotação no WhatsApp',
    note: 'Abre o WhatsApp com a mensagem pronta. Você revisa antes de enviar.',
    trial: (credits: number, days: number) =>
      `Prefere testar antes? Crie sua conta grátis, fotografe ${rooms(credits)} e deixe o tour no ar por ${days} dias, sem pagar nada.`,
    signup: 'Criar conta grátis',
  },
  finalCta: {
    title: 'O seu espaço pode ter tour 360° hoje.',
    lead: 'Você já tem o celular. O próximo passo é seu.',
    signup: 'Criar conta grátis',
    whatsapp: 'Falar no WhatsApp',
    note: 'Sem cartão. Sem baixar app.',
  },
  faq: {
    eyebrow: 'DÚVIDAS FREQUENTES',
    title1: 'Você pergunta.',
    title2: 'A gente explica.',
    lead1: 'Sem letras miúdas.',
    lead2: 'Entenda cada parte do seu tour.',
    groups: {
      capture: 'Captura e tours',
      prices: 'Créditos, planos e pagamento',
      quote: 'Créditos, cotação e pagamento',
    },
    equipment: {
      question: 'Preciso comprar câmera 360° ou tripé?',
      answer:
        'Não. A captura é feita com o celular, na mão. A tela mostra para onde apontar e avisa quando segurar parado.',
    },
    install: {
      question: 'Preciso instalar algum app?',
      answer: 'Não. A ARP Vision abre no navegador do celular.',
    },
    compatibility: { question: 'Funciona no meu celular?' },
    duration: {
      question: 'Quanto tempo leva para fazer um tour?',
      answer:
        'Cada ambiente é uma volta só, com 8 fotos. O 360° fica pronto em cerca de 1 minuto, em segundo plano, e você captura o próximo cômodo enquanto isso.',
    },
    enhancement: {
      question: 'O aprimoramento muda o espaço?',
      answer:
        'Ele deixa uniformes as emendas e a luz entre as fotos, sem criar móveis nem trocar acabamentos. O único trecho completado é o que nenhuma foto alcança: o chão logo abaixo do celular e o centro do teto, seguindo o piso e o teto que aparecem ao redor. A foto original fica guardada, e você compara as duas antes de publicar.',
    },
    camera: {
      question: 'Já tenho uma câmera 360°. Ela serve?',
      answer:
        'Serve. Envie as fotos 360° pela galeria e monte o tour normalmente. Fotos da galeria não gastam créditos.',
    },
    embed: {
      question: 'Posso colocar o tour no meu site?',
      answer:
        'Pode. Cada tour tem um código para colar no site, nos formatos responsivo, 16:9 ou quadrado.',
    },
    credit: {
      question: 'O que é um crédito?',
      answer:
        'Cada ambiente fotografado com o celular usa 1 crédito. Os créditos são da empresa, e toda a equipe usa o mesmo saldo.',
    },
    individual: { question: 'Como funciona o Individual?' },
    cost: {
      question: 'Quanto custa?',
      answer: (credits: number, days: number) =>
        `Depende de quantos ambientes você fotografa por mês. Peça sua cotação pelo WhatsApp e receba uma proposta para o seu volume. Para conhecer antes, crie sua conta grátis, fotografe ${rooms(credits)} e deixe o tour no ar por ${days} dias, sem pagar nada.`,
    },
    payment: {
      question: 'Como funciona o pagamento?',
      answer:
        'O pagamento é feito no app, com segurança, pelo Asaas. As condições vêm junto com a sua proposta.',
    },
  },
  // Condições comerciais em texto. Os valores chegam formatados de `site.pricing`.
  policies: {
    phoneRequirements:
      'Requisitos de compatibilidade a definir. A captura funciona no navegador do celular; a lista de aparelhos e versões compatíveis está em validação.',
    billing: (v: {
      pix: string;
      installments: number;
      installment: string;
      professional: string;
      business: string;
      discount: number;
    }) =>
      `O pagamento é feito no app, com segurança, pelo Asaas. Individual: ${v.pix} à vista no Pix ou ${v.installments}x de ${v.installment} no cartão. Professional: ${v.professional} por mês, no cartão. Business: ${v.business} por mês, no cartão. No plano anual, Professional e Business têm ${v.discount}% de desconto. Enterprise: condições em contrato.`,
    cancellation: (noticeDays: number, keepPrice: string) =>
      `Ao cancelar uma assinatura, os tours permanecem no ar até o fim do mês já pago. Está previsto um aviso por e-mail ${noticeDays} dias antes de saírem do ar. Depois, você pode manter cada tour por ${keepPrice} ao ano.`,
    liveTourLimit:
      'Só contam tours publicados e não ocultos. Rascunhos e tours ocultos ficam fora do limite. Ao atingir o limite, é preciso ocultar um tour ou mudar de plano antes de publicar outro. O limite não tira tours do ar automaticamente.',
    monthlyExtras: (included: number, extraPrice: string) =>
      `No Individual, cada ambiente além dos ${included} incluídos custa ${extraPrice}. Ambientes extras no Professional e no Business ainda não têm preço definido.`,
    individualTerm: (renewalPrice: string) =>
      `O tour do Individual fica no ar por 1 ano e pode ser renovado por ${renewalPrice} por mais 1 ano. O marco inicial desse prazo ainda está a definir.`,
  },
  plans: {
    individual: { audience: 'Um tour, sem mensalidade.', duration: '1 ano no ar' },
    corretor: {
      audience: 'Para quem trabalha sozinho.',
      duration: 'Enquanto a assinatura estiver ativa',
    },
    imobiliaria: { audience: 'Para equipes.', duration: 'Enquanto a assinatura estiver ativa' },
    rede: { audience: 'Várias unidades, mais possibilidades.', duration: 'Conforme contrato' },
  } satisfies Record<PlanId, { audience: string; duration: string }>,
  pricing: {
    srTitle: 'Planos disponíveis e valores',
    exampleNotice: '',
    monthly: 'Mensal',
    annual: 'Anual',
    save: (percent: number) => `economize ${percent}%`,
    annualSwitch: (percent: number) => `Plano anual, com ${percent}% de desconto`,
    previous: 'Plano anterior',
    swipe: 'Deslize para ver os planos',
    next: 'Próximo plano',
    gridLabel: 'Planos',
    carouselStatus: '{name} · plano {current} de {total}',
    statusAnnual: 'Mostrando os preços do plano anual, com desconto.',
    statusMonthly: 'Mostrando os preços mensais.',
    recommended: 'Recomendado',
    perMonth: '/mês',
    onRequest: 'Sob consulta',
    payOnce: (pix: string) => `ou ${pix} à vista no Pix`,
    payMonthly: 'Cobrança mensal, no cartão',
    payCustom: 'Condições em contrato',
    payAnnual: (total: string) => `Cobrança anual de ${total}`,
    stats: 'Estatísticas de visitas dos tours',
    roomsOnce: (credits: number) => `${credits} ambientes`,
    toursOnce: (tours: number) => `${tours} tour no ar por 1 ano`,
    roomsMonthly: (credits: number) => `${credits} ambientes por mês`,
    toursMonthly: (tours: number) => `Até ${tours} tours no ar`,
    roomsCustom: 'Ambientes sob medida',
    toursCustom: 'Volume e limite de tours combinados em contrato.',
    renewal: (renewalPrice: string) => `Renovação ${renewalPrice}/ano`,
    contactMessage: (plan: string) => `Olá! Quero conhecer o plano ${plan} da ARP Vision.`,
    whatsapp: 'Falar no WhatsApp',
    buy: 'Comprar',
    subscribe: 'Assinar',
    secure: 'Pagamento seguro via Asaas · Pix ou cartão',
    trial: (credits: number, days: number) =>
      `Quer testar antes? Crie sua conta grátis, fotografe ${rooms(credits)} e deixe o tour no ar por ${days} dias, sem pagar nada.`,
    signup: 'Criar conta grátis',
    compare: 'Comparar todos os recursos',
  },
  // Tabela de /planos: o que entra em cada grupo, e em que ordem, está em `src/lib/content.ts`.
  features: {
    groups: {
      plan: 'Plano e publicação',
      capture: 'Captura e aprimoramento',
      sharing: 'Tours e compartilhamento',
      team: 'Equipe e gestão',
    },
    rows: {
      price: 'Preço',
      rooms: 'Ambientes',
      liveTours: 'Tours publicados no ar',
      duration: 'Tempo no ar',
      extraRoom: 'Ambiente extra',
      renewal: 'Renovação ou manutenção',
      guidedCapture: 'Captura guiada 360° pelo celular',
      autoFix: 'Emendas e luz corrigidas automaticamente',
      creditBack: 'Crédito devolvido se o aprimoramento falhar',
      gallery: 'Fotos 360° da galeria sem gastar crédito',
      passages: 'Passagens entre os ambientes',
      publicLink: 'Link público: o cliente abre sem conta',
      shareShortcut: 'Atalho para WhatsApp e e-mail',
      embed: 'Código para o site: responsivo, 16:9 e quadrado',
      stats: 'Estatísticas de visitas: tempo em cada ambiente e de onde vieram',
      sharedBalance: 'Saldo de créditos compartilhado pela equipe',
      roles: 'Administrador e usuários na conta',
      drafts: 'Rascunhos fora do limite de tours no ar',
    },
    priceOnce: (pix: string, installments: number, installment: string) =>
      `${pix} no Pix ou ${installments}x de ${installment}`,
    priceMonthly: (monthly: string) => `${monthly} / mês`,
    onRequest: 'Sob consulta',
    custom: 'Sob medida',
    roomsMonthly: (credits: number) => `${credits} por mês`,
    roomsOnce: (credits: number) => `${credits} uma vez`,
    byContract: 'Conforme contrato',
    upTo: (tours: number) => `Até ${tours}`,
    perRoom: (extraPrice: string) => `${extraPrice} por ambiente`,
    toBeDefined: 'A definir',
    renewalOnce: (renewalPrice: string) => `${renewalPrice} por mais 1 ano`,
    renewalMonthly: (renewalPrice: string) => `${renewalPrice} por tour/ano após cancelar`,
    included: 'Incluído',
    notIncluded: 'Não incluído',
    comingSoon: 'Em breve',
  },
  plansPage: {
    title: 'Planos e preços | ARP Vision',
    description:
      'Planos ARP Vision: Individual com pagamento único, Professional e Business mensais e Enterprise sob consulta. Compare créditos, tours no ar e teste grátis.',
    ogImage: '/images/og-planos.png',
    breadcrumb: 'Início / Planos',
    eyebrow: 'O PRÓXIMO PASSO DO SEU NEGÓCIO',
    title1: 'Planos para todo',
    title2: 'tamanho de negócio',
    lead1: '1 crédito = 1 ambiente fotografado com o celular.',
    lead2: 'Um espaço costuma ter de 6 a 10 ambientes.',
    compareEyebrow: 'CADA DETALHE, LADO A LADO',
    compareTitle: 'Compare todos os recursos.',
    compareLead: 'Compare o que cada plano inclui para capturar e publicar seus espaços.',
    tableLabel: 'Tabela comparativa dos planos, com rolagem horizontal',
    features: 'Recursos',
    recommended: 'Recomendado',
  },
  // /tutoriais. O id do YouTube, a duração, a data e a capa de cada vídeo ficam em
  // `tutorials` no site.ts; aqui, só o texto, pelo id do vídeo e da seção.
  tutorials: {
    title: 'Tutoriais em vídeo | ARP Vision',
    description:
      'Vídeos curtos que mostram cada etapa da ARP Vision, da captura com o celular ao tour publicado, e como deixar o app na tela de início.',
    breadcrumb: 'Início / Tutoriais',
    eyebrow: 'PASSO A PASSO EM VÍDEO',
    heading: 'Tutoriais',
    lead: 'Vídeos curtos que mostram cada etapa da ARP Vision, do primeiro ambiente fotografado ao tour publicado.',
    watch: 'Assistir',
    watchLabel: (title: string, duration: string) => `Assistir: ${title} (${duration})`,
    close: 'Fechar o vídeo',
    sections: {
      start: 'Primeiros passos',
      app: 'Dicas do app',
    } satisfies Record<TutorialSectionId, string>,
    videos: {
      'do-novo-tour-a-publicacao': {
        title: 'Do Novo tour à publicação',
        description: 'O caminho inteiro: captura, ambientes, passagens e publicação.',
      },
      'app-na-tela-de-inicio': {
        title: 'O app na tela de início',
        description: 'Abra a ARP Vision com um toque, em tela cheia, no iPhone.',
      },
    } satisfies Record<TutorialId, { title: string; description: string }>,
  },
  legal: {
    eyebrow: 'INFORMAÇÕES LEGAIS',
    preparing: 'Documento em preparação',
    available: 'O documento completo será disponibilizado nesta página.',
    contact: 'Contato:',
    emailPending: '[e-mail a definir]',
    terms: {
      title: 'Termos de Uso | ARP Vision',
      description: 'Termos de Uso da ARP Vision. Consulte as condições de uso da plataforma.',
      breadcrumb: 'Início / Termos de Uso',
      heading: 'Termos de Uso',
      notice: 'Estamos preparando nossos Termos de Uso.',
      link: 'Termos de Uso →',
      // Texto do documento, em parágrafos separados por linha em branco. Vazio: aviso.
      body: '',
    },
    privacy: {
      title: 'Política de Privacidade | ARP Vision',
      description:
        'Política de Privacidade da ARP Vision. Informações sobre privacidade e tratamento de dados.',
      breadcrumb: 'Início / Política de Privacidade',
      heading: 'Política de Privacidade',
      notice: 'Estamos preparando nossa Política de Privacidade.',
      link: 'Política de Privacidade →',
      body: '',
    },
  },
  notFound: {
    title: 'Página não encontrada',
    lead: 'O endereço pode ter mudado ou não existe mais.',
    home: 'Voltar ao início',
  },
  schema: {
    appDescription:
      'Tour virtual 360° de espaços usando o celular, com captura guiada e aprimoramento automático.',
    offerOnce: (installments: number) =>
      `Pagamento único por 1 tour no ar por 1 ano: à vista no Pix ou em ${installments}x no cartão. Renovação anual à parte.`,
    offerMonthly:
      'Assinatura mensal no cartão; tours no ar enquanto a assinatura estiver ativa, dentro do limite do plano.',
  },
};

export type Dictionary = typeof pt;
