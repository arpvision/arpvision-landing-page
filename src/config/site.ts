/**
 * Única fonte dos dados comerciais, mídia e links, os mesmos em todos os idiomas: créditos,
 * dias de teste, preços e limites saem daqui para o português e o espanhol, para nunca
 * divergirem. O texto mora nos dicionários de `src/i18n/` (um por idioma).
 * Os planos seguem as regras comerciais aprovadas, num documento interno fora deste repositório.
 * Campos ainda não decididos permanecem sem oferta na interface.
 */
import type { Locale } from '../i18n';

export type PlanId = 'individual' | 'corretor' | 'imobiliaria' | 'rede';

export interface Plan {
  id: PlanId;
  /** Os nomes dos planos não se traduzem. Público e tempo no ar ficam no dicionário. */
  name: string;
  billing: 'once' | 'monthly' | 'custom';
  monthlyPrice: number | null;
  /** Total parcelado no cartão; `pixPrice` é o valor à vista no Pix. */
  oneTimePrice: number | null;
  pixPrice: number | null;
  installments: number | null;
  credits: number | null;
  liveTours: number | null;
  extraRoomPrice: number | null;
  renewalPrice: number | null;
  users: null;
  /**
   * O plano mostra as estatísticas dos tours (visitas, tempo por ambiente,
   * origem). Do Business para cima desde 09/10/2026, como no app.
   */
  stats: boolean;
  recommended?: boolean;
}

/** Texto que muda com o idioma num dado que não é do dicionário (o rótulo de um tour real). */
export type Localized = Record<Locale, string>;

export interface DemoTour {
  id: string;
  name: string;
  label: Localized;
  cover: string;
  publicUrl: string;
  phone: string;
  photosPerRoom: string;
  captureTime: Localized;
}

/** O tour como a página de um idioma o entrega ao navegador, já com o texto escolhido. */
export type PageTour = Omit<DemoTour, 'label' | 'captureTime'> & {
  label: string;
  captureTime: string;
};

/** Ambientes do leque da abertura; o nome e a descrição de cada um ficam no dicionário. */
export type FanRoomId = 'suite' | 'quarto' | 'sala' | 'quartoVisita' | 'patio';

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
    // O vídeo tem texto em português gravado na imagem; serve aos dois idiomas até existir
    // uma versão em espanhol.
    tutorial: '/video/tutorial-captura-360-v3.mp4',
    tutorialPoster: '/images/tutorial-720.webp',
    // Tour 360° da demonstração, protegido até a pessoa ativar.
    heroEmbed: 'https://arpvision.app/embed/511a5654-29f2-4798-87ff-5b479210dbf0',
    // Recortes das fotos da casa de demonstração (public/images/produtos) usados nas telas de
    // exemplo das páginas de produto, um por um e com o tamanho do arquivo. Nem todo ambiente tem
    // as três proporções (o 2º andar não tem 16:9): nenhum nome é montado por ambiente e
    // proporção.
    productPhotos: {
      'patio-fachada-4x5': {
        src: '/images/produtos/patio-fachada-4x5.webp',
        width: 720,
        height: 900,
      },
      'patio-piscina-4x5': {
        src: '/images/produtos/patio-piscina-4x5.webp',
        width: 720,
        height: 900,
      },
      'patio-piscina-9x16': {
        src: '/images/produtos/patio-piscina-9x16.webp',
        width: 540,
        height: 960,
      },
      'sala-2-4x5': { src: '/images/produtos/sala-2-4x5.webp', width: 720, height: 900 },
      'cozinha-4x5': { src: '/images/produtos/cozinha-4x5.webp', width: 720, height: 900 },
      'quarto-com-suite-4x5': {
        src: '/images/produtos/quarto-com-suite-4x5.webp',
        width: 720,
        height: 900,
      },
      'patio-fachada-16x9': {
        src: '/images/produtos/patio-fachada-16x9.webp',
        width: 960,
        height: 540,
      },
      'patio-fachada-9x16': {
        src: '/images/produtos/patio-fachada-9x16.webp',
        width: 540,
        height: 960,
      },
      'patio-piscina-16x9': {
        src: '/images/produtos/patio-piscina-16x9.webp',
        width: 960,
        height: 540,
      },
      'sala-2-16x9': { src: '/images/produtos/sala-2-16x9.webp', width: 960, height: 540 },
      'cozinha-16x9': { src: '/images/produtos/cozinha-16x9.webp', width: 960, height: 540 },
    },
    // Os vídeos de exemplo de "Vídeos a partir de fotos" (public/video), um par por idioma: o
    // selo, os dados do imóvel e o cartão final estão gravados na imagem. O pôster de cada um
    // (public/images/produtos) é o primeiro quadro, o mesmo em que o play começa.
    exampleVideos: {
      pt: {
        vertical: {
          src: '/video/exemplo-vertical-pt.mp4',
          poster: '/images/produtos/exemplo-vertical-pt.webp',
          width: 720,
          height: 1280,
        },
        horizontal: {
          src: '/video/exemplo-horizontal-pt.mp4',
          poster: '/images/produtos/exemplo-horizontal-pt.webp',
          width: 1280,
          height: 720,
        },
      },
      es: {
        vertical: {
          src: '/video/exemplo-vertical-es.mp4',
          poster: '/images/produtos/exemplo-vertical-es.webp',
          width: 720,
          height: 1280,
        },
        horizontal: {
          src: '/video/exemplo-horizontal-es.mp4',
          poster: '/images/produtos/exemplo-horizontal-es.webp',
          width: 1280,
          height: 720,
        },
      },
    } satisfies Record<
      Locale,
      Record<
        'vertical' | 'horizontal',
        { src: string; poster: string; width: number; height: number }
      >
    >,
    // Panoramas do proprietário. O enquadramento das miniaturas é feito no layout.
    fanRooms: [
      {
        id: 'suite',
        image: '/images/tours/banheiro.webp',
        position: '28% 50%',
        labelTone: 'dark',
        arrowTone: 'dark',
      },
      {
        id: 'quarto',
        image: '/images/tours/suite.webp',
        position: '92% 50%',
        labelTone: 'dark',
        arrowTone: 'dark',
      },
      {
        id: 'sala',
        image: '/images/tours/sala.webp',
        position: '100% 50%',
        labelTone: 'light',
        arrowTone: 'light',
      },
      {
        id: 'quartoVisita',
        image: '/images/tours/tv-janela.webp',
        position: '0% 50%',
        labelTone: 'light',
        arrowTone: 'dark',
      },
      {
        id: 'patio',
        image: '/images/tours/patio.webp',
        position: '84% 50%',
        labelTone: 'dark',
        arrowTone: 'dark',
      },
    ] as {
      id: FanRoomId;
      image: string;
      position: string;
      labelTone: 'light' | 'dark';
      arrowTone: 'light' | 'dark';
    }[],
  },
  // Adicione somente tours públicos aprovados para demonstração.
  tours: [] as DemoTour[],
  pricing: {
    // Preços ainda em definição: com `false`, a Home mostra a cotação pelo WhatsApp no lugar
    // dos planos, /planos redireciona para ela e nenhum valor aparece (FAQ e JSON-LD
    // inclusos). Quando os preços forem aprovados, basta mudar para `true`.
    showPrices: false,
    isExample: false,
    // Plano anual: 20% de desconto nas assinaturas mensais (Professional e Business).
    annualDiscount: 0.2 as number | null,
    averageRooms: 8,
    // Conta nova ganha créditos para testar; fica fora do grid de planos, como no app.
    freeTrialCredits: 1,
    // Quanto tempo o teste vale no app (desde 01/10/2026): depois o tour sai do ar.
    freeTrialDays: 7,
    // Aviso por e-mail antes de os tours de uma assinatura cancelada saírem do ar.
    cancellationNoticeDays: 7,
    plans: [
      {
        id: 'individual',
        name: 'Individual',
        billing: 'once',
        monthlyPrice: null,
        oneTimePrice: 279,
        pixPrice: 229,
        installments: 12,
        credits: 8,
        liveTours: 1,
        extraRoomPrice: 20,
        renewalPrice: 79,
        users: null,
        stats: false,
      },
      {
        id: 'corretor',
        name: 'Professional',
        billing: 'monthly',
        monthlyPrice: 249,
        oneTimePrice: null,
        pixPrice: null,
        installments: null,
        credits: 20,
        liveTours: 30,
        extraRoomPrice: null,
        renewalPrice: 79,
        users: null,
        stats: false,
      },
      {
        id: 'imobiliaria',
        name: 'Business',
        billing: 'monthly',
        monthlyPrice: 599,
        oneTimePrice: null,
        pixPrice: null,
        installments: null,
        credits: 80,
        liveTours: 120,
        extraRoomPrice: null,
        renewalPrice: 79,
        users: null,
        stats: true,
        recommended: true,
      },
      {
        id: 'rede',
        name: 'Enterprise',
        billing: 'custom',
        monthlyPrice: null,
        oneTimePrice: null,
        pixPrice: null,
        installments: null,
        credits: null,
        liveTours: null,
        extraRoomPrice: null,
        renewalPrice: null,
        users: null,
        stats: true,
      },
    ] as Plan[],
    extraCredits: [] as { credits: number; price: number | null }[],
  },
  analytics: { provider: 'plausible' as const, scriptUrl: '', domain: '' },
};

// O que ainda não foi configurado fica fora da interface, em vez de aparecer como "[a definir]".
export const available = {
  whatsapp: Boolean(site.contact.whatsapp),
  email: Boolean(site.contact.email),
  tour: site.tours.length > 0,
  // O ARP Vision Presencial ainda não tem a sua seção na home. Ligue quando ela entrar: o grupo
  // "Com a nossa equipe" passa a aparecer no menu de Produtos (só em português).
  inPerson: false,
};

// Preço como no app: sem centavos quando o valor é inteiro (R$ 249, R$ 23,25). Em espanhol
// continua em reais e no formato do app ("R$ 249"), até existir cobrança em euro.
export const price = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
  }).format(value);

/** Plano pelo id, para os textos que citam os valores de um plano específico. */
export const planById = (id: PlanId) => site.pricing.plans.find((plan) => plan.id === id)!;

// Os vídeos de /tutoriais e /es/tutoriales, na ordem do app (o app tem a mesma lista em
// inner-view-client/src/app/tutoriais). Moram no YouTube, como Shorts não listados, e são
// narrados em português nos dois idiomas. O título, a descrição e o nome da seção de cada
// vídeo ficam nos dicionários (`tutorials`). A capa é <id>-source.jpg em
// public/images/tutoriais, e `prepare-images` gera os WebP.
export type TutorialId = 'do-novo-tour-a-publicacao' | 'app-na-tela-de-inicio';
export type TutorialSectionId = 'start' | 'app';
export interface Tutorial {
  id: TutorialId;
  section: TutorialSectionId;
  youtube: string;
  /** Em segundos. */
  duration: number;
  /** Data da publicação no YouTube, para os dados estruturados. */
  uploadDate: string;
}
export const tutorials: Tutorial[] = [
  {
    id: 'do-novo-tour-a-publicacao',
    section: 'start',
    youtube: '2P5RVlg3p3k',
    duration: 134,
    uploadDate: '2026-11-06T21:20:54-08:00',
  },
  {
    id: 'app-na-tela-de-inicio',
    section: 'app',
    youtube: '-FXGq9PymS0',
    duration: 41,
    uploadDate: '2026-11-06T21:21:53-08:00',
  },
];
