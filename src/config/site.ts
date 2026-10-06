/**
 * Única fonte dos dados comerciais, mídia, links e conteúdo configurável.
 * Os planos seguem as regras comerciais aprovadas, num documento interno fora deste repositório.
 * Campos ainda não decididos permanecem sem oferta na interface.
 */
export interface Plan {
  id: string;
  name: string;
  audience: string;
  billing: 'once' | 'monthly' | 'custom';
  monthlyPrice: number | null;
  /** Total parcelado no cartão; `pixPrice` é o valor à vista no Pix. */
  oneTimePrice: number | null;
  pixPrice: number | null;
  installments: number | null;
  credits: number | null;
  liveTours: number | null;
  duration: string;
  extraRoomPrice: number | null;
  renewalPrice: number | null;
  users: null;
  recommended?: boolean;
}

export interface DemoTour {
  id: string;
  name: string;
  label: string;
  cover: string;
  publicUrl: string;
  phone: string;
  photosPerRoom: string;
  captureTime: string;
}

export const site = {
  name: 'ARP Vision',
  themeColor: '#0454ED',
  // Domínio primário na Vercel: o apex (arpvision.com.br) redireciona para o www. Canonical,
  // sitemap e robots usam este valor; se apontar para um endereço que redireciona, o Google não indexa.
  domain: 'https://www.arpvision.com.br',
  readyToIndex: true,
  appUrl: 'https://arpvision.app',
  contact: { whatsapp: '+55 (51) 99527-3661', email: 'arpvision@outlook.com.br' },
  company: { legalName: '', cnpj: '', year: new Date().getFullYear() },
  brand: {
    logoBlue: '/brand/arp-vision-horizontal-blue.svg',
    logoWhite: '/brand/arp-vision-horizontal-white.svg',
    symbol: '/brand/arp-vision-symbol-blue-transparent.svg',
  },
  media: {
    tutorial: '/video/tutorial-captura-360-v3.mp4',
    tutorialPoster: '/images/tutorial-720.webp',
    whatsappConversation: '/images/conversa-whatsapp.webp',
    // Tour 360° da demonstração, protegido até a pessoa ativar.
    heroEmbed: 'https://arpvision.app/embed/511a5654-29f2-4798-87ff-5b479210dbf0',
    // Panoramas do proprietário. O enquadramento das miniaturas é feito no layout.
    fanRooms: [
      {
        title: 'Suíte',
        image: '/images/tours/banheiro.webp',
        alt: 'Box de vidro e banheira em um banheiro fotografado em 360 graus',
        position: '28% 50%',
        labelTone: 'dark' as const,
        arrowTone: 'dark' as const,
      },
      {
        title: 'Quarto',
        image: '/images/tours/suite.webp',
        alt: 'Duas poltronas junto a uma mesa no quarto com suíte',
        position: '92% 50%',
        labelTone: 'dark' as const,
        arrowTone: 'dark' as const,
      },
      {
        title: 'Sala',
        image: '/images/tours/sala.webp',
        alt: 'Escada de madeira e mesa de vidro na sala fotografada em 360 graus',
        position: '100% 50%',
        labelTone: 'light' as const,
        arrowTone: 'light' as const,
      },
      {
        title: 'Quarto Visita',
        image: '/images/tours/tv-janela.webp',
        alt: 'Televisão junto à janela e à cortina',
        position: '0% 50%',
        labelTone: 'light' as const,
        arrowTone: 'dark' as const,
      },
      {
        title: 'Pátio',
        image: '/images/tours/patio.webp',
        alt: 'Piscina, cascata e área coberta de churrasqueira no pátio',
        position: '84% 50%',
        labelTone: 'dark' as const,
        arrowTone: 'dark' as const,
      },
    ],
    ogHome: '/images/og-home.png',
    ogPlans: '/images/og-planos.png',
  },
  // Adicione somente tours públicos aprovados para demonstração.
  tours: [] as DemoTour[],
  pricing: {
    isExample: false,
    exampleNotice: '',
    // Plano anual: 20% de desconto nas assinaturas mensais (Professional e Business).
    annualDiscount: 0.2 as number | null,
    annualLabel: '',
    averageRooms: 8,
    // Conta nova ganha créditos para testar; fica fora do grid de planos, como no app.
    freeTrialCredits: 1,
    // Quanto tempo o teste vale no app (desde 01/10/2026): depois o tour sai do ar.
    freeTrialDays: 7,
    plans: [
      {
        id: 'individual',
        name: 'Individual',
        audience: 'Um tour, sem mensalidade.',
        billing: 'once',
        monthlyPrice: null,
        oneTimePrice: 279,
        pixPrice: 229,
        installments: 12,
        credits: 8,
        liveTours: 1,
        duration: '1 ano no ar',
        extraRoomPrice: 20,
        renewalPrice: 79,
        users: null,
      },
      {
        id: 'corretor',
        name: 'Professional',
        audience: 'Para quem trabalha sozinho.',
        billing: 'monthly',
        monthlyPrice: 249,
        oneTimePrice: null,
        pixPrice: null,
        installments: null,
        credits: 20,
        liveTours: 30,
        duration: 'Enquanto a assinatura estiver ativa',
        extraRoomPrice: null,
        renewalPrice: 79,
        users: null,
      },
      {
        id: 'imobiliaria',
        name: 'Business',
        audience: 'Para equipes.',
        billing: 'monthly',
        monthlyPrice: 599,
        oneTimePrice: null,
        pixPrice: null,
        installments: null,
        credits: 80,
        liveTours: 120,
        duration: 'Enquanto a assinatura estiver ativa',
        extraRoomPrice: null,
        renewalPrice: 79,
        users: null,
        recommended: true,
      },
      {
        id: 'rede',
        name: 'Enterprise',
        audience: 'Várias unidades, mais possibilidades.',
        billing: 'custom',
        monthlyPrice: null,
        oneTimePrice: null,
        pixPrice: null,
        installments: null,
        credits: null,
        liveTours: null,
        duration: 'Conforme contrato',
        extraRoomPrice: null,
        renewalPrice: null,
        users: null,
      },
    ] as Plan[],
    extraCredits: [] as { credits: number; price: number | null }[],
  },
  market: {
    cameraPrice: 3000,
    photographerPrice: null as number | null,
    researchDate: '',
    sourceUrl: '',
  },
  policies: {
    phoneRequirements:
      'Requisitos de compatibilidade a definir. A captura funciona no navegador do celular; a lista de aparelhos e versões compatíveis está em validação.',
    billing:
      'O pagamento é feito no app, com segurança, pelo Asaas. Individual: R$ 229 à vista no Pix ou 12x de R$ 23,25 no cartão. Professional: R$ 249 por mês, no cartão. Business: R$ 599 por mês, no cartão. No plano anual, Professional e Business têm 20% de desconto. Enterprise: condições em contrato.',
    cancellation:
      'Ao cancelar uma assinatura, os tours permanecem no ar até o fim do mês já pago. Está previsto um aviso por e-mail 7 dias antes de saírem do ar. Depois, você pode manter cada tour por R$ 79 ao ano.',
    liveTourLimit:
      'Só contam tours publicados e não ocultos. Rascunhos e tours ocultos ficam fora do limite. Ao atingir o limite, é preciso ocultar um tour ou mudar de plano antes de publicar outro. O limite não tira tours do ar automaticamente.',
    monthlyExtras:
      'No Individual, cada ambiente além dos 8 incluídos custa R$ 20. Ambientes extras no Professional e no Business ainda não têm preço definido.',
    individualTerm:
      'O tour do Individual fica no ar por 1 ano e pode ser renovado por R$ 79 por mais 1 ano. O marco inicial desse prazo ainda está a definir.',
    terms: '',
    privacy: '',
  },
  analytics: { provider: 'plausible' as const, scriptUrl: '', domain: '' },
};

// O que ainda não foi configurado fica fora da interface, em vez de aparecer como "[a definir]".
export const available = {
  whatsapp: Boolean(site.contact.whatsapp),
  email: Boolean(site.contact.email),
  tour: site.tours.length > 0,
};

// Preço como no app: sem centavos quando o valor é inteiro (R$ 249, R$ 23,25).
export const price = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
  }).format(value);
const currency = price;
const perPropertyPrices = site.pricing.plans
  .filter((p) => p.monthlyPrice && p.credits && p.credits >= site.pricing.averageRooms)
  .map((p) => p.monthlyPrice! / Math.floor(p.credits! / site.pricing.averageRooms));
export const alternativeLabels = [
  'Investimento inicial',
  'Custo por espaço',
  'Pessoas capturando ao mesmo tempo',
  'Quando fica pronto',
  'Tour entre cômodos',
  'Corrige emendas e luz',
];
export const alternatives = [
  {
    name: 'Câmera 360°',
    icon: 'camera',
    values: [
      `~${currency(site.market.cameraPrice)} por câmera¹`,
      'Plataforma de tour costuma ser paga à parte',
      '1 por câmera',
      'Depois de editar e publicar',
      'Com a plataforma certa',
      'Depende da câmera e edição',
    ],
  },
  {
    name: 'Fotógrafo profissional',
    icon: 'camera',
    values: [
      'Nenhum',
      site.market.photographerPrice === null
        ? 'Cobrado por sessão'
        : `${currency(site.market.photographerPrice)} por sessão¹`,
      'Depende da agenda',
      'Em alguns dias',
      'Depende do pacote',
      'Sim',
    ],
  },
  {
    name: 'Fotos comuns',
    icon: 'phone',
    values: ['Nenhum', 'R$ 0', 'Todos', 'Na hora', 'Não', 'Não se aplica'],
  },
  {
    name: 'ARP Vision',
    icon: 'sparkle',
    values: [
      'Sem câmera extra; plano pago à parte',
      perPropertyPrices.length
        ? `A partir de ${currency(Math.min(...perPropertyPrices))} / espaço²`
        : 'Preço por espaço a definir',
      'Todos',
      'No mesmo dia',
      'Sim',
      'Sim, automaticamente',
    ],
  },
];

export type FeatureValue = boolean | string;
export interface FeatureGroup {
  title: string;
  rows: { name: string; values: FeatureValue[] }[];
}

const all = site.pricing.plans.map(() => true);
export const featureGroups: FeatureGroup[] = [
  {
    title: 'Plano e publicação',
    rows: [
      {
        name: 'Preço',
        values: site.pricing.plans.map((p) =>
          p.billing === 'once'
            ? `${currency(p.pixPrice!)} no Pix ou ${p.installments}x de ${currency(p.oneTimePrice! / p.installments!)}`
            : p.billing === 'monthly'
              ? `${currency(p.monthlyPrice!)} / mês`
              : 'Sob consulta',
        ),
      },
      {
        name: 'Ambientes',
        values: site.pricing.plans.map((p) =>
          p.credits === null
            ? 'Sob medida'
            : `${p.credits} ${p.billing === 'monthly' ? 'por mês' : 'uma vez'}`,
        ),
      },
      {
        name: 'Tours publicados no ar',
        values: site.pricing.plans.map((p) =>
          p.liveTours === null
            ? 'Conforme contrato'
            : p.billing === 'monthly'
              ? `Até ${p.liveTours}`
              : String(p.liveTours),
        ),
      },
      { name: 'Tempo no ar', values: site.pricing.plans.map((p) => p.duration) },
      {
        name: 'Ambiente extra',
        values: site.pricing.plans.map((p) =>
          p.extraRoomPrice !== null
            ? `${currency(p.extraRoomPrice)} por ambiente`
            : p.billing === 'custom'
              ? 'Conforme contrato'
              : 'A definir',
        ),
      },
      {
        name: 'Renovação ou manutenção',
        values: site.pricing.plans.map((p) =>
          p.billing === 'once'
            ? `${currency(p.renewalPrice!)} por mais 1 ano`
            : p.billing === 'monthly'
              ? `${currency(p.renewalPrice!)} por tour/ano após cancelar`
              : 'Conforme contrato',
        ),
      },
    ],
  },
  {
    title: 'Captura e aprimoramento',
    rows: [
      { name: 'Captura guiada 360° pelo celular', values: all },
      { name: 'Emendas e luz corrigidas automaticamente', values: all },
      { name: 'Crédito devolvido se o aprimoramento falhar', values: all },
      { name: 'Fotos 360° da galeria sem gastar crédito', values: all },
    ],
  },
  {
    title: 'Tours e compartilhamento',
    rows: [
      { name: 'Passagens entre os ambientes', values: all },
      { name: 'Link público: o cliente abre sem conta', values: all },
      { name: 'Atalho para WhatsApp e e-mail', values: all },
      { name: 'Código para o site: responsivo, 16:9 e quadrado', values: all },
    ],
  },
  {
    title: 'Equipe e gestão',
    rows: [
      { name: 'Saldo de créditos compartilhado pela equipe', values: all },
      { name: 'Administrador e usuários na conta', values: all },
      { name: 'Rascunhos fora do limite de tours no ar', values: all },
    ],
  },
];

// Um FAQ só, em dois grupos, usado pela Home e por /planos.
export const faqGroups = [
  {
    title: 'Captura e tours',
    items: [
      {
        question: 'Preciso comprar câmera 360° ou tripé?',
        answer:
          'Não. A captura é feita com o celular, na mão. A tela mostra para onde apontar e avisa quando segurar parado.',
      },
      {
        question: 'Preciso instalar algum app?',
        answer: 'Não. A ARP Vision abre no navegador do celular.',
      },
      { question: 'Funciona no meu celular?', answer: site.policies.phoneRequirements },
      {
        question: 'Quanto tempo leva para fazer um tour?',
        answer:
          'Cada ambiente é uma volta só, com 8 fotos. O 360° fica pronto em cerca de 1 minuto, em segundo plano, e você captura o próximo cômodo enquanto isso.',
      },
      {
        question: 'O aprimoramento muda o espaço?',
        answer:
          'Ele deixa uniformes as emendas e a luz entre as fotos, sem criar móveis nem trocar acabamentos. O único trecho completado é o que nenhuma foto alcança: o chão logo abaixo do celular e o centro do teto, seguindo o piso e o teto que aparecem ao redor. A foto original fica guardada, e você compara as duas antes de publicar.',
      },
      {
        question: 'Já tenho uma câmera 360°. Ela serve?',
        answer:
          'Serve. Envie as fotos 360° pela galeria e monte o tour normalmente. Fotos da galeria não gastam créditos.',
      },
      {
        question: 'O meu cliente precisa criar conta para ver o tour?',
        answer: 'Não. Ele abre o link direto, no celular ou no computador.',
      },
      {
        question: 'Posso colocar o tour no meu site?',
        answer:
          'Pode. Cada tour tem um código para colar no site, nos formatos responsivo, 16:9 ou quadrado.',
      },
    ],
  },
  {
    title: 'Créditos, planos e pagamento',
    items: [
      {
        question: 'O que é um crédito?',
        answer:
          'Cada ambiente fotografado com o celular usa 1 crédito. Os créditos são da empresa, e toda a equipe usa o mesmo saldo.',
      },
      {
        question: 'E se um ambiente não ficar pronto?',
        answer: 'O crédito volta para o saldo, e você pode fotografar o ambiente de novo.',
      },
      {
        question: 'Quantos tours posso manter no ar?',
        answer:
          'Individual: 1 tour por 1 ano. Professional: até 30 tours enquanto a assinatura estiver ativa. Business: até 120 tours enquanto a assinatura estiver ativa. No Enterprise, o limite é combinado em contrato.',
      },
      { question: 'Quais tours contam no limite?', answer: site.policies.liveTourLimit },
      { question: 'Como funciona o Individual?', answer: site.policies.individualTerm },
      { question: 'Posso comprar ambientes extras?', answer: site.policies.monthlyExtras },
      { question: 'Como funciona o pagamento?', answer: site.policies.billing },
      { question: 'Como funciona o cancelamento?', answer: site.policies.cancellation },
    ],
  },
];

export const faq = faqGroups.flatMap((group) => group.items);
