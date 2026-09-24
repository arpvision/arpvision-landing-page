/**
 * Única fonte dos dados comerciais, mídia, links e conteúdo configurável.
 * Os planos seguem as regras comerciais aprovadas, num documento interno fora deste repositório.
 * Campos ainda não decididos permanecem sem oferta na interface.
 */
export interface Plan {
  id: string;
  name: string;
  audience: string;
  billing: 'free' | 'once' | 'monthly' | 'custom';
  monthlyPrice: number | null;
  oneTimePrice: number | null;
  credits: number | null;
  liveTours: number | null;
  duration: string;
  extraRoomPrice: number | null;
  renewalPrice: number | null;
  users: null;
  recommended?: boolean;
  features: string[];
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

export interface ComparisonPair {
  name: string;
  before: string;
  after: string;
  illustrative?: boolean;
  markers: { x: number; y: number; label: string }[];
}

export const site = {
  name: 'ARP Vision',
  themeColor: '#0454ED',
  domain: 'https://arpvision.com.br', // Domínio sugerido no briefing; confirmar antes de publicar.
  readyToIndex: true,
  appUrl: 'https://arpvision.app',
  contact: { whatsapp: '', email: '' },
  company: { legalName: '', cnpj: '', year: new Date().getFullYear() },
  brand: {
    logoBlue: '/brand/arp-vision-horizontal-blue.svg',
    logoWhite: '/brand/arp-vision-horizontal-white.svg',
    symbol: '/brand/arp-vision-symbol-blue-transparent.svg',
  },
  media: {
    tutorial: '/video/tutorial-captura-360-v3.mp4',
    tutorialPoster: '/images/tutorial-720.webp',
    teamScreenshot: '',
    ogHome: '/images/og-home.png',
    ogPlans: '/images/og-planos.png',
  },
  // Adicione somente tours públicos aprovados para demonstração.
  tours: [] as DemoTour[],
  comparisonPairs: [] as ComparisonPair[],
  pricing: {
    isExample: false,
    exampleNotice: '',
    annualDiscount: null as number | null,
    annualLabel: '',
    averageRooms: 8,
    plans: [
      {
        id: 'teste',
        name: 'Teste grátis',
        audience: 'Um ambiente para experimentar.',
        billing: 'free',
        monthlyPrice: 0,
        oneTimePrice: null,
        credits: 1,
        liveTours: null,
        duration: 'A definir',
        extraRoomPrice: null,
        renewalPrice: null,
        users: null,
        features: [
          'Captura guiada pelo celular',
          'Aprimoramento com IA',
          'Crédito devolvido se a IA falhar',
          'Fotos 360° da galeria sem gastar crédito',
        ],
      },
      {
        id: 'individual',
        name: 'Individual',
        audience: 'Um tour, sem mensalidade.',
        billing: 'once',
        monthlyPrice: null,
        oneTimePrice: 279,
        credits: 8,
        liveTours: 1,
        duration: '1 ano no ar',
        extraRoomPrice: 20,
        renewalPrice: 79,
        users: null,
        features: [
          'Captura guiada pelo celular',
          'Aprimoramento com IA',
          'Link público para compartilhar',
          'Créditos da empresa',
        ],
      },
      {
        id: 'corretor',
        name: 'Professional',
        audience: 'Para quem trabalha sozinho.',
        billing: 'monthly',
        monthlyPrice: 249,
        oneTimePrice: null,
        credits: 20,
        liveTours: 30,
        duration: 'Enquanto a assinatura estiver ativa',
        extraRoomPrice: null,
        renewalPrice: 79,
        users: null,
        features: [
          'Captura guiada pelo celular',
          'Aprimoramento com IA',
          'Link público para compartilhar',
          'Créditos da empresa',
        ],
      },
      {
        id: 'imobiliaria',
        name: 'Business',
        audience: 'Para equipes.',
        billing: 'monthly',
        monthlyPrice: 599,
        oneTimePrice: null,
        credits: 80,
        liveTours: 120,
        duration: 'Enquanto a assinatura estiver ativa',
        extraRoomPrice: null,
        renewalPrice: 79,
        users: null,
        recommended: true,
        features: [
          'Captura guiada pelo celular',
          'Aprimoramento com IA',
          'Link público para compartilhar',
          'Créditos da empresa',
        ],
      },
      {
        id: 'rede',
        name: 'Enterprise',
        audience: 'Várias unidades, mais possibilidades.',
        billing: 'custom',
        monthlyPrice: null,
        oneTimePrice: null,
        credits: null,
        liveTours: null,
        duration: 'Conforme contrato',
        extraRoomPrice: null,
        renewalPrice: null,
        users: null,
        features: [
          'Captura guiada pelo celular',
          'Aprimoramento com IA',
          'Link público para compartilhar',
          'Converse sobre a sua operação',
        ],
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
  founders: {
    spots: null as number | null,
    discount: '',
    remainingSpots: null as number | null,
    formEndpoint: '',
  },
  policies: {
    phoneRequirements:
      'Requisitos de compatibilidade a definir. A captura funciona no navegador do celular; a lista de aparelhos e versões compatíveis está em validação.',
    captureTime: '[a definir]',
    billing:
      'Individual: R$ 279 em pagamento único. Professional: R$ 249 por mês. Business: R$ 599 por mês. O meio de pagamento ainda está a definir; este site não realiza cobranças.',
    cancellation:
      'Ao cancelar uma assinatura, os tours permanecem no ar até o fim do mês já pago. Está previsto um aviso por e-mail 7 dias antes de saírem do ar. Depois, você pode manter cada tour por R$ 79 ao ano.',
    liveTourLimit:
      'Só contam tours publicados e não ocultos. Rascunhos e tours ocultos ficam fora do limite. Ao atingir o limite, é preciso ocultar um tour ou mudar de plano antes de publicar outro. O limite não tira tours do ar automaticamente.',
    creditRollover: 'Ainda não foi definido se os ambientes não usados passam para o mês seguinte.',
    annualPlan: 'Ainda não foi definido se haverá plano anual ou desconto anual.',
    monthlyExtras:
      'No Individual, cada ambiente além dos 8 incluídos custa R$ 20. Ambientes extras no Professional e no Business ainda não têm preço definido.',
    individualTerm:
      'O tour do Individual fica no ar por 1 ano e pode ser renovado por R$ 79 por mais 1 ano. O marco inicial desse prazo ainda está a definir.',
    paymentFailure: 'O tratamento de falhas no pagamento ainda está a definir.',
    changePlan: 'Condições para troca de plano a definir.',
    invoice: 'Informações sobre emissão de nota fiscal a definir.',
    terms: '',
    privacy: '',
  },
  analytics: { provider: 'plausible' as const, scriptUrl: '', domain: '' },
};

const currency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
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
      `${site.market.photographerPrice === null ? '[Preço a definir]' : currency(site.market.photographerPrice)} por sessão¹`,
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
      'Sim, com IA',
    ],
  },
];

export type FeatureValue = boolean | string;
export interface FeatureGroup {
  title: string;
  rows: { name: string; values: FeatureValue[] }[];
}

const all = site.pricing.plans.map(() => true);
const publishedTourFeatures = site.pricing.plans.map((p) =>
  p.billing === 'free' ? 'A definir' : true,
);
export const featureGroups: FeatureGroup[] = [
  {
    title: 'Plano e publicação',
    rows: [
      {
        name: 'Preço',
        values: site.pricing.plans.map((p) =>
          p.billing === 'free'
            ? 'Grátis'
            : p.billing === 'once'
              ? `${currency(p.oneTimePrice!)} uma vez`
              : p.billing === 'monthly'
                ? `${currency(p.monthlyPrice!)} / mês`
                : 'Sob consulta',
        ),
      },
      {
        name: 'Ambientes com IA',
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
            ? p.billing === 'free'
              ? 'A definir'
              : 'Conforme contrato'
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
              : p.billing === 'custom'
                ? 'Conforme contrato'
                : 'A definir',
        ),
      },
    ],
  },
  {
    title: 'Captura e IA',
    rows: [
      { name: 'Captura guiada 360° pelo celular', values: all },
      { name: 'IA corrige emendas, objetos duplicados e luz', values: all },
      { name: 'Crédito devolvido se a IA falhar', values: all },
      { name: 'Fotos 360° da galeria sem gastar crédito', values: all },
    ],
  },
  {
    title: 'Tours e compartilhamento',
    rows: [
      { name: 'Passagens entre os ambientes', values: publishedTourFeatures },
      { name: 'Link público: o cliente abre sem conta', values: publishedTourFeatures },
      { name: 'Atalho para WhatsApp e e-mail', values: publishedTourFeatures },
      { name: 'Código para o site: responsivo, 16:9 e quadrado', values: publishedTourFeatures },
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

export const faq = [
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
    answer: `O tempo de captura por ambiente está ${site.policies.captureTime}. A IA leva cerca de 1 minuto por ambiente, em segundo plano, e você captura o próximo cômodo enquanto ela trabalha.`,
  },
  {
    question: 'O que é um crédito?',
    answer:
      'Cada ambiente capturado pela câmera e aprimorado pela IA usa 1 crédito. Os créditos são da empresa, e toda a equipe usa o mesmo saldo.',
  },
  {
    question: 'E se a IA não conseguir montar um ambiente?',
    answer: 'O crédito volta para o saldo, e você pode fotografar o ambiente de novo.',
  },
  {
    question: 'A IA muda o espaço?',
    answer:
      'Não. Ela corrige os defeitos da montagem: emendas, objetos duplicados e diferenças de luz entre as fotos. Não cria móveis nem troca acabamentos, e a foto original fica guardada. O único trecho completado é o que nenhuma foto alcança: o chão logo abaixo do celular e o centro do teto, seguindo o piso e o teto que aparecem ao redor.',
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
  {
    question: 'Como funcionam o pagamento e o cancelamento?',
    answer: `${site.policies.billing} ${site.policies.cancellation}`,
  },
];

export const billingFaq = [
  faq[4],
  {
    question: 'Quantos tours posso manter no ar?',
    answer:
      'Individual: 1 tour por 1 ano. Professional: até 30 tours enquanto a assinatura estiver ativa. Business: até 120 tours enquanto a assinatura estiver ativa. No Enterprise, o limite é combinado em contrato. O limite do Teste grátis ainda está a definir.',
  },
  { question: 'Quais tours contam no limite?', answer: site.policies.liveTourLimit },
  { question: 'Como funciona o Individual?', answer: site.policies.individualTerm },
  { question: 'Posso comprar ambientes extras?', answer: site.policies.monthlyExtras },
  {
    question: 'Os créditos acumulam de um mês para o outro?',
    answer: site.policies.creditRollover,
  },
  { question: 'Há plano anual?', answer: site.policies.annualPlan },
  { question: 'Posso trocar de plano?', answer: site.policies.changePlan },
  { question: 'Como funciona o cancelamento?', answer: site.policies.cancellation },
  { question: 'O que acontece se um pagamento falhar?', answer: site.policies.paymentFailure },
  { question: 'Como funciona o pagamento?', answer: site.policies.billing },
  { question: 'Vocês emitem nota fiscal?', answer: site.policies.invoice },
];
