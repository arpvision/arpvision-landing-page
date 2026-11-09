/**
 * Inglês internacional, claro e direto, conforme a coluna Inglês do glossário de
 * docs/produto/idiomas.md e o en.json do app: room (ambiente), enhance (aprimorar), tours
 * live (tours no ar), property, company, credits, free trial, sign in, phone. Sem "AI".
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
      'Create a 360° virtual tour of your space with just your phone. Seams and lighting come out corrected, and clients open it on WhatsApp with no account.',
  },
  layout: { skipLink: 'Skip to content' },
  language: { label: 'Language' },
  brand: { home: 'ARP Vision — home' },
  whatsappMessage: "Hi! I came from the website and I'd like to know more about ARP Vision.",
  header: {
    mainNav: 'Main navigation',
    mobileNav: 'Mobile navigation',
    howItWorks: 'How it works',
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
  footer: {
    taglineLines: ['The whole space.', 'Your phone is just the beginning.'],
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
    note: 'Made for anyone with spaces to show.',
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
      'Make a 360° virtual tour of your space with just your phone. Seams and lighting corrected, a WhatsApp-ready link that clients open with no account. Free trial.',
    ogImage: '/images/og-home-en.png',
    eyebrow: '360° VIRTUAL TOURS FOR YOUR BUSINESS',
    title1: 'Turn your space into an experience.',
    title2: 'With just your phone.',
    opening:
      'Create a 360° virtual tour of your space with just your phone. And clients open the tour without creating an account.',
    howTitle: 'The app takes the photos for you',
    howSubtitle: 'Open the camera and follow the instructions',
    steps: ['Capture with your own phone.', 'ARP Vision builds it.', 'Done. Now just share it.'],
    videoLabel: 'ARP Vision 360-degree capture tutorial',
    videoPlay: 'Play video',
    videoPause: 'Pause video',
    presentationLabel: 'Virtual tour and benefits',
    plansEyebrow: 'START SMALL. SHOW IT ALL.',
    plansTitle: 'A plan for your next step.',
    plansLead: '1 credit = 1 room photographed with your phone. The balance belongs to your company.',
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
        text: 'Your client opens the link without creating an account and sees the whole space.',
      },
      site: {
        title: 'On your website',
        text: 'Paste the code into the page, in responsive, 16:9 or square format.',
      },
      visit: {
        title: 'Before the visit',
        text: 'Visitors already know the space and arrive ready to decide.',
      },
    },
    // A imagem da conversa tem o texto em português: aqui ela é montada em HTML.
    conversationImage: null,
    chat: {
      label: 'Simulated WhatsApp conversation with the link to a 9-room tour',
      contact: 'Client',
      status: 'WhatsApp conversation',
      message: "Hi! Here's the tour of the space. You can see everything inside, room by room:",
      linkTitle: '360° tour · 9 rooms',
      reply:
        "You don't need to download anything or create an account. You can open it on a computer or on your phone.",
    },
  },
  showcase: {
    frameTitle: 'ARP Vision 360° demo tour',
    title: 'Look inside the space.',
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
    // Tradução fiel do texto aprovado em português (medido no app: ~2 min por ambiente).
    flow: {
      capture: { value: '30 seconds', text: 'A single turn with your phone, in each room.' },
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
    tabsLabel: 'Demo spaces',
    illustrativeAlt: 'Illustrative living room with a sofa, natural light and wooden furniture',
    illustrativeName: 'One space, every angle',
    openLabel: 'Enter the space: open the 360-degree tour',
    pendingLabel: 'Check the availability of the demo tour',
    open: 'Enter the space',
    demo: 'Demo tour',
    openHint: 'The visit starts with a tap.',
    pendingHint: 'The real demo is being prepared.',
    explore: 'Explore every room',
    captured: 'Captured with ARP Vision',
    illustrative: 'Illustrative photo · not an ARP Vision capture',
    toBeDefined: '[to be defined]',
    noTripod: 'No tripod',
    ready: 'Ready in ~1 min per room',
    cta: 'I want a tour like this of my space',
    qrAlt: 'QR code to open the tour on your phone',
    qrLine1: 'View it on',
    qrLine2: 'your phone',
    coverAlt: 'View of the space {name}',
    phone: 'Phone: {phone}',
    photos: '{photos} photos per room',
    time: 'Capture: {time} per room',
    failed: "Couldn't open the tour right now. ",
    newTab: 'Open in a new tab',
    pending:
      'The real tour is still being prepared. This cover is illustrative. Come back soon to explore a space captured with ARP Vision.',
    loading: 'Opening the space…',
    frameTitle: 'Sample 360° tour: {name}',
    dialogLabel: 'Tour of {name}',
    closeDialog: 'Close the tour ×',
  },
  team: {
    eyebrow: 'ONE TOOL. THE WHOLE TEAM.',
    title1: 'Build your tour ecosystem,',
    title2: 'designed for companies.',
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
  quote: {
    eyebrow: 'CUSTOM PRICING',
    title: 'Every business has its own size. So does your proposal.',
    lead: 'Answer 3 quick questions and get a proposal for your volume of spaces on WhatsApp, with no commitment.',
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
        options: ['I have 1 space', 'I work on my own', 'I have a team', 'Several locations'],
      },
      volume: {
        label: 'How many spaces per month?',
        summary: 'Spaces per month',
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
    title: 'Your space can have a 360° tour today.',
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
        'Each room is a single turn, with 8 photos. The 360° is ready in about 1 minute, in the background, and you capture the next room in the meantime.',
    },
    // DIFERENTE: como no espanhol. O português promete comparar a foto original antes de
    // publicar (o app não tem isso) e um chão "completado" (hoje é um borrão com carimbo).
    // Aqui fica só o que é verdade; o centro do teto e a foto original guardada não são citados.
    enhancement: {
      question: 'Does the enhancement change the space?',
      answer:
        'It evens out the seams and the lighting between the photos, without adding furniture or changing finishes. The floor right below the phone, which no photo reaches, is shown blurred, with a stamp.',
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
        'Each room photographed with your phone uses 1 credit. Credits belong to the company, and the whole team uses the same balance.',
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
    rede: { audience: 'Several locations, more possibilities.', duration: 'As agreed in the contract' },
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
    eyebrow: 'THE NEXT STEP FOR YOUR BUSINESS',
    title1: 'Plans for businesses',
    title2: 'of every size',
    lead1: '1 credit = 1 room photographed with your phone.',
    lead2: 'A space usually has 6 to 10 rooms.',
    compareEyebrow: 'EVERY DETAIL, SIDE BY SIDE',
    compareTitle: 'Compare all features.',
    compareLead: 'Compare what each plan includes to capture and publish your spaces.',
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
      '360° virtual tours of spaces using a phone, with guided capture and automatic enhancement.',
    offerOnce: (installments: number) =>
      `One-time payment for 1 tour live for 1 year: upfront by Pix or in ${installments} installments by card. Annual renewal sold separately.`,
    offerMonthly:
      'Monthly subscription by card; tours stay live while the subscription is active, within the plan limit.',
  },
};
