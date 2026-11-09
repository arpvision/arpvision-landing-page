/**
 * Espanhol da Espanha (es-ES), tratamento por "tú", conforme o glossário de
 * docs/produto/idiomas.md do repositório do app: estancia (ambiente), mejorar (aprimorar),
 * móvil, ordenador, enlace, tours publicados (tours no ar). Sem "IA".
 *
 * Tradução fiel ao português, com duas exceções: aqui não entra promessa de funcionalidade que
 * o app não tem, nem serviço local (o ARP Vision Presencial, que só atende Porto Alegre e
 * região). Os pontos em que o texto diverge do português estão marcados com DIFERENTE.
 */
import type { Dictionary } from './pt';

/** "1 estancia", "2 estancias". */
const rooms = (count: number) => `${count} ${count === 1 ? 'estancia' : 'estancias'}`;

export const es: Dictionary = {
  meta: {
    defaultDescription:
      'Haz el tour virtual 360° de tu inmueble solo con el móvil. Las uniones y la luz salen corregidas, y el cliente abre el tour por WhatsApp, sin crear una cuenta.',
  },
  layout: { skipLink: 'Saltar al contenido' },
  language: { label: 'Idioma' },
  brand: { home: 'ARP Vision — inicio' },
  whatsappMessage: '¡Hola! Vengo de la web y quiero saber más sobre ARP Vision.',
  header: {
    mainNav: 'Navegación principal',
    mobileNav: 'Navegación en el móvil',
    products: 'Productos',
    productsPanel: 'Productos de ARP Vision',
    viewAllProducts: 'Ver todos los productos',
    newBadge: 'Nuevo',
    realTour: 'Tour real',
    plans: 'Planes',
    quote: 'Presupuesto',
    faq: 'Preguntas',
    tutorials: 'Tutoriales',
    darkTheme: 'Tema oscuro',
    login: 'Iniciar sesión',
    loginLong: 'Iniciar sesión en mi cuenta',
    signup: 'Crear cuenta gratis',
    signupShort: 'Crear cuenta',
    menu: 'Menú',
    close: 'Cerrar',
  },
  products: {
    audience: 'Inmobiliarias',
    example: 'Ejemplo',
    also: 'Conoce también',
    groups: {
      show: 'Mostrar el inmueble',
      promote: 'Difundir y atender',
      team: 'Con nuestro equipo',
    },
    items: {
      tour: { name: 'Tour virtual 360°', line: 'El inmueble por dentro, con el móvil.' },
      videos: { name: 'Vídeos a partir de fotos', line: 'Reels, stories y portales.' },
      instagram: {
        name: 'Piloto automático para Instagram',
        line: 'El mes de posts, listo para aprobar.',
      },
      autochat: {
        name: 'Autochat',
        line: 'Atiende por WhatsApp y deriva al agente inmobiliario.',
      },
    },
    // DIFERENTE: o ARP Vision Presencial só existe em português (atende Porto Alegre e região): no
    // espanhol, sem o grupo "Com a nossa equipe".
    inPerson: null,
  },
  // DIFERENTE: a Espanha não tem CRECI. No lugar dele entra a calificación energética, que todo
  // anúncio de venda ou aluguel precisa mostrar (RD 390/2021): no item do incluído, na dúvida e nas
  // artes que anunciam um imóvel.
  productPages: {
    instagram: {
      meta: {
        title: 'Piloto automático para Instagram de inmobiliarias | ARP Vision',
        description:
          'ARP Vision prepara el mes de posts y stories del Instagram de tu inmobiliaria, con tus inmuebles y tu zona. Tú apruebas y ARP Vision publica.',
      },
      hero: {
        eyebrow: 'PILOTO AUTOMÁTICO PARA INSTAGRAM',
        title: 'El Instagram de tu inmobiliaria, en piloto automático.',
        lead: 'ARP Vision prepara el mes de posts y stories con tus inmuebles, tu zona y el estilo de tu marca. Tú apruebas, y ARP Vision publica el día previsto.',
        button: 'Quiero un presupuesto por WhatsApp',
        note: 'Ningún post sale sin tu aprobación.',
        mockDescription:
          'Ejemplo: calendario de dos semanas de la Inmobiliaria Ejemplo, con posts y stories ya aprobados, otros pendientes de tu aprobación y el botón Aprobar todo.',
      },
      pain: {
        eyebrow: '¿TE SUENA?',
        // O "has" fica no começo, que não troca: assim cada trecho cabe numa linha a 360 px.
        before: 'Este mes has',
        phrases: [
          'vendido una casa.',
          'captado dos pisos.',
          'alquilado un local.',
          'firmado en la notaría.',
        ],
        after: 'Y nada de eso ha llegado a Instagram.',
        text: 'Mantener el perfil al día entre una visita y otra es difícil.',
      },
      steps: {
        title: 'Tres pasos. Después, solo tienes que aprobar.',
        items: [
          {
            title: 'Manda la dirección de tu web',
            text: 'ARP Vision lee tu marca, tu zona y tus inmuebles en tu web. Si no se puede leer la web, o si no tienes web, nos mandas las fotos y los datos de los inmuebles.',
          },
          {
            title: 'Elige el estilo',
            text: 'Mira uno de tus inmuebles en cada estilo, con tu logo y tus colores, y quédate con el que prefieras.',
          },
          {
            title: 'Aprueba el mes',
            text: 'Todo a la vez o post a post. Si quieres cambiar algo, pide el cambio en el propio post. ARP Vision publica cada uno el día previsto.',
          },
        ],
      },
      gallery: {
        title: 'Así quedan tus posts',
        lead: 'Con las fotos de tus inmuebles, tu logo y la calificación energética en los anuncios de venta o alquiler.',
        arts: [
          { id: 'sale', kind: 'En venta', title: 'Casa con 3 dormitorios y piscina' },
          { id: 'rent', kind: 'En alquiler', title: 'Casa con chimenea y porche' },
          { id: 'sold', kind: 'Vendido', title: 'Otra llave entregada en el Barrio Ejemplo' },
          { id: 'tour', kind: 'Tour 360°', title: 'Mira esta casa por dentro' },
          { id: 'neighborhood', kind: 'Tu barrio', title: 'Qué hay cerca en el Barrio Ejemplo' },
          { id: 'tip', kind: 'Consejo', title: 'Documentos que preparar antes de vender' },
          {
            id: 'valuation',
            kind: 'Captación',
            title: '¿Vas a vender o alquilar? Pide una valoración',
          },
          { id: 'story', kind: 'Story', title: 'Novedad en el Barrio Ejemplo' },
        ],
      },
      included: {
        title: 'Qué incluye',
        items: [
          {
            title: 'Posts y stories',
            text: 'El mes entero, en los días y horarios que elijas.',
          },
          { title: 'Venta y alquiler', text: 'En venta, en alquiler, vendido y alquilado.' },
          { title: 'Tu zona', text: 'Posts sobre los barrios donde trabajas.' },
          {
            title: 'Captación',
            text: 'Invitaciones para que los propietarios pidan una valoración.',
          },
          { title: 'Tu marca', text: 'Tu logo, tus colores y el estilo que elijas.' },
          {
            title: 'Calificación energética en cada anuncio',
            text: 'La que nos indiques, en los anuncios de venta o alquiler.',
          },
          {
            title: 'Tour 360° en los posts',
            text: 'Posts que invitan a ver el tour del inmueble.',
          },
          { title: 'Tú apruebas antes', text: 'Y pides cambios en el post que quieras.' },
        ],
      },
      comparison: {
        title: 'Tres formas de llevar el Instagram',
        columns: ['Hacerlo tú', 'Contratar una agencia', 'ARP Vision'],
        rows: [
          {
            label: 'Tu tiempo',
            values: ['Horas cada semana', 'Reuniones y revisiones', 'Aprobar el mes'],
          },
          {
            label: 'Con tus inmuebles y tu zona',
            values: [
              'Cuando te sobra tiempo',
              'Si les mandas el material',
              'A partir de tu web o de las fotos que mandas',
            ],
          },
          { label: 'Constancia', values: ['Depende de la semana', 'Sí', 'Sí, cada mes'] },
        ],
      },
      quote: {
        eyebrow: 'PRECIO A MEDIDA',
        title: 'Una propuesta para el tamaño de tu cartera.',
        lead: 'Responde 3 preguntas rápidas y recibe por WhatsApp una propuesta para tus inmuebles y el número de posts que quieres, sin compromiso.',
        questions: [
          {
            id: 'listings',
            label: '¿Cuántos inmuebles tienes anunciados?',
            summary: 'Inmuebles anunciados',
            options: ['Hasta 20', '21 a 100', 'Más de 100'],
          },
          {
            id: 'posts',
            label: '¿Cuántos posts por semana?',
            summary: 'Posts por semana',
            options: ['2', '3', '5', 'Aún no lo sé'],
          },
          {
            id: 'timing',
            label: '¿Para cuándo?',
            summary: 'Para cuándo',
            options: ['Este mes', 'El mes que viene', 'Aún me estoy informando'],
          },
        ],
        greeting:
          '¡Hola! Vengo de la web y quiero un presupuesto del Piloto automático para Instagram de ARP Vision.',
        closing: '¿Me puedes enviar una propuesta?',
      },
      faq: {
        eyebrow: 'PREGUNTAS FRECUENTES',
        title1: 'Tú preguntas.',
        title2: 'Nosotros te lo explicamos.',
        lead1: 'Sin letra pequeña.',
        lead2: 'Entiende cada parte del Piloto automático.',
        items: [
          {
            question: '¿Necesito una cuenta profesional de Instagram?',
            answer:
              'Sí. La cuenta tiene que ser profesional (de empresa o de creador de contenido). El cambio es gratuito y se hace en el propio Instagram.',
          },
          {
            question: '¿Aparece la calificación energética?',
            answer:
              'Sí. Cada anuncio de venta o alquiler lleva la calificación energética que nos indiques.',
          },
          {
            question: '¿De dónde salen los inmuebles?',
            answer:
              'De la web de tu inmobiliaria. Si no se puede leer la web, o si no tienes web, nos mandas las fotos y los datos de los inmuebles.',
          },
          {
            question: '¿Puedo cambiar un post antes de que salga?',
            answer: 'Sí. Pides el cambio en el propio post o quitas el post del mes.',
          },
          {
            question: '¿Cuántos posts y stories al mes?',
            answer: 'Tú eliges cuántos por semana, y la propuesta lo tiene en cuenta.',
          },
          {
            question: '¿Puede salir algún post sin que yo lo vea?',
            answer: 'No. Solo sale lo que has aprobado.',
          },
          {
            question: '¿Las stories llevan enlace?',
            answer:
              'No. La story no lleva un enlace en el que se pueda hacer clic; el WhatsApp de la inmobiliaria va escrito en la imagen.',
          },
          {
            question: '¿Cómo cancelo?',
            answer:
              'Las condiciones del contrato, incluida la cancelación, vienen en la propuesta.',
          },
        ],
      },
      finalCta: {
        title: 'Tu próximo mes de Instagram, listo para aprobar.',
        lead: 'Habla con ARP Vision y recibe una propuesta para tu inmobiliaria.',
        button: 'Quiero un presupuesto por WhatsApp',
      },
      whatsappMessage:
        '¡Hola! Vengo de la web y quiero saber más del Piloto automático para Instagram de ARP Vision.',
      mock: {
        period: 'Próximas dos semanas',
        weekdays: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
        story: 'Story',
        approved: 'Aprobado',
        waiting: 'Pendiente',
        approveAll: 'Aprobar todo',
        handle: 'tuinmobiliaria',
        lastPost: 'Última publicación: junio',
        profileDescription:
          'Ejemplo: perfil de inmobiliaria en Instagram con la última publicación en junio.',
        siteDescription:
          'Ejemplo: la dirección tuinmobiliaria.es en el campo de la web, con el botón Leer y el aviso de logo, colores e inmuebles encontrados.',
        siteAddress: 'tuinmobiliaria.es',
        siteRead: 'Leer',
        siteFound: 'Logo, colores e inmuebles encontrados',
        stylesDescription:
          'Ejemplo: la misma casa en tres estilos de post, con el del medio marcado como tu estilo.',
        styleChosen: 'Tu estilo',
        monthDescription:
          'Ejemplo: el próximo mes de posts en un calendario pequeño, con los botones Aprobar todo y Pedir un cambio.',
        month: 'Próximo mes',
        requestChange: 'Pedir un cambio',
        agency: 'Inmobiliaria Ejemplo',
        // A calificación energética é do imóvel: só vai nas artes que anunciam um.
        license: 'Calificación energética: E',
        licenseOnEveryPost: false,
        details: '3 dormitorios · 240 m²',
        whatsapp: 'WhatsApp',
        whatsappNumber: '600 000 000',
      },
    },
    // DIFERENTE: no cartão do imóvel da conversa, a calificación energética no lugar do CRECI; o
    // DNI no lugar do CPF; e os termos do RGPD na dúvida dos dados. A conversa fala em aluguel de
    // até 1.200 por mês, como na Espanha, sem moeda.
    autochat: {
      meta: {
        title: 'Autochat: atención por WhatsApp para inmobiliarias | ARP Vision',
        description:
          'El Autochat atiende en el WhatsApp de tu inmobiliaria, busca inmuebles por zona, precio, dormitorios y lo que hay cerca, y lo deriva al agente con un resumen.',
      },
      hero: {
        eyebrow: 'AUTOCHAT',
        title: 'Cliente respondido al momento, incluso fuera de horario.',
        lead: 'El Autochat atiende en el WhatsApp de tu inmobiliaria, entiende lo que busca el cliente (zona, precio, dormitorios, cerca de un colegio o de un hospital), muestra los inmuebles que encajan y pasa la conversación al agente inmobiliario con un resumen listo.',
        button: 'Quiero un presupuesto por WhatsApp',
        note: 'El cliente puede pedir un agente inmobiliario en cualquier momento.',
        mockDescription:
          'Ejemplo: conversación en el WhatsApp de la Inmobiliaria Ejemplo. La atención automática se presenta, la clienta pide un piso de 2 dormitorios de alquiler en el Centro, cerca de un colegio, hasta 1.200 al mes, y recibe un inmueble a unos 450 m de un colegio, en línea recta, con el botón Ver el tour 360°. Al lado, el resumen para la agente.',
      },
      pain: {
        eyebrow: '¿TE SUENA?',
        title:
          'El cliente escribió a las 22:00. A las 9:00, ya había hablado con otra inmobiliaria.',
        text: 'Quien busca un inmueble escribe a varias inmobiliarias a la vez. Quien responde primero, y responde bien, toma la delantera.',
      },
      steps: {
        title: 'Del primer mensaje al agente, en cuatro pasos.',
        items: [
          {
            title: 'El cliente escribe por WhatsApp',
            text: 'Al WhatsApp de tu inmobiliaria, a cualquier hora.',
          },
          {
            title: 'El Autochat entiende lo que busca',
            text: 'Compra o alquiler, zona, rango de precio, dormitorios, plaza de garaje, mascota y lo que necesita tener cerca.',
          },
          {
            title: 'Muestra los inmuebles que encajan',
            text: 'Solo de tu cartera, con foto, precio y enlace. Cuando el inmueble tiene tour 360°, el cliente ya lo ve por dentro.',
          },
          {
            title: 'Lo pasa al agente inmobiliario',
            text: 'Con un resumen de la conversación y los horarios en los que el cliente prefiere visitar.',
          },
        ],
      },
      proximity: {
        title: 'Cerca de lo que importa',
        text: 'El cliente escribe «cerca de un colegio», «cerca del hospital» o «cerca de la estación», y el Autochat busca en tu cartera los inmuebles que quedan cerca, con la distancia aproximada, en línea recta.',
        coverage:
          'La distancia sale de bases de datos públicas de colegios, hospitales y estaciones, y la cobertura cambia de una ciudad a otra.',
        examples: [
          { place: 'Colegio', distance: 'a unos 450 m en línea recta' },
          { place: 'Hospital', distance: 'a unos 1,2 km en línea recta' },
          { place: 'Estación', distance: 'a unos 800 m en línea recta' },
        ],
      },
      broker: {
        title: 'El agente recibe al cliente con todo ya explicado.',
        fields: [
          'El nombre y el WhatsApp del cliente',
          'Si es compra o alquiler',
          'Lo que busca',
          'Los inmuebles que ha visto y cuáles le han gustado',
          'Cuándo quiere visitar',
          'La conversación completa',
        ],
      },
      handoff: {
        title: 'El Autochat llama al agente inmobiliario en estos casos:',
        items: [
          'Cuando el cliente pide hablar con una persona, en cualquier momento.',
          'Cuando el tema es una oferta, la negociación, los documentos o la financiación.',
          'Cuando la pregunta no está en la ficha del inmueble.',
          'Fuera de horario, avisa de cuándo vuelve el equipo y deja el resumen listo.',
        ],
        closing: 'El Autochat no negocia ni cierra nada: quien negocia es el agente inmobiliario.',
      },
      included: {
        title: 'Qué incluye',
        items: [
          {
            title: 'A cualquier hora',
            text: 'Responde en cuanto el cliente escribe, también fuera de horario.',
          },
          {
            title: 'Atención automática',
            text: 'Dice en el primer mensaje que es la atención automática de la inmobiliaria.',
          },
          {
            title: 'Las preguntas que importan',
            text: 'Compra o alquiler, zona, rango de precio, dormitorios, garaje y mascota.',
          },
          {
            title: 'Solo tu cartera',
            text: 'Muestra solo inmuebles de tu inmobiliaria, con foto, precio y enlace.',
          },
          {
            title: 'Tour 360° en la conversación',
            text: 'Cuando el inmueble tiene tour, el cliente ya lo ve por dentro.',
          },
          {
            title: 'Lo que hay cerca',
            text: 'La distancia aproximada, en línea recta, a colegios, hospitales y estaciones.',
          },
          {
            title: 'Resumen para el agente',
            text: 'Con lo que busca el cliente y la conversación completa.',
          },
          { title: 'Sin documentos', text: 'No pide documentos, DNI ni datos de salud.' },
        ],
      },
      quote: {
        eyebrow: 'PRECIO A MEDIDA',
        title: 'Una propuesta para el tamaño de tu equipo.',
        lead: 'Responde 3 preguntas rápidas y recibe por WhatsApp una propuesta para tu equipo y las conversaciones que llegan, sin compromiso.',
        questions: [
          {
            id: 'brokers',
            label: '¿Cuántos agentes atienden?',
            summary: 'Agentes',
            options: ['1 a 3', '4 a 10', 'Más de 10'],
          },
          {
            id: 'contacts',
            label: '¿Cuántos contactos llegan al mes?',
            summary: 'Contactos al mes',
            options: ['Hasta 100', '100 a 500', 'Más de 500', 'No lo sé'],
          },
          {
            id: 'timing',
            label: '¿Para cuándo?',
            summary: 'Para cuándo',
            options: ['Este mes', 'El mes que viene', 'Aún me estoy informando'],
          },
        ],
        greeting: '¡Hola! Vengo de la web y quiero un presupuesto del Autochat de ARP Vision.',
        closing: '¿Me puedes enviar una propuesta?',
      },
      faq: {
        eyebrow: 'PREGUNTAS FRECUENTES',
        title1: 'Tú preguntas.',
        title2: 'Nosotros te lo explicamos.',
        lead1: 'Sin letra pequeña.',
        lead2: 'Entiende cada parte del Autochat.',
        items: [
          {
            question: '¿Es un robot?',
            answer:
              'Sí. Es una atención automática, y se presenta así desde el primer mensaje. El cliente puede pedir un agente inmobiliario cuando quiera.',
          },
          {
            question: '¿Funciona de noche y el fin de semana?',
            answer: 'Sí. Responde a cualquier hora y deja el resumen listo para el agente.',
          },
          {
            question: '¿Usa el WhatsApp de la inmobiliaria?',
            answer:
              'Sí. El Autochat usa la vía oficial de WhatsApp para la atención automática. Puede ser el número que ya usáis o uno nuevo, y ARP Vision explica antes qué cambia en el móvil del equipo.',
          },
          {
            question: '¿De dónde salen las respuestas sobre los inmuebles?',
            answer:
              'De la ficha de tus inmuebles. Lo que no está ahí, se lo pasa al agente. El precio y las condiciones los confirma el agente antes de cualquier oferta.',
          },
          {
            question: '¿Cómo funciona la búsqueda cerca de un colegio o de un hospital?',
            answer:
              'Por la distancia aproximada, en línea recta, entre el inmueble y el lugar. El camino a pie o en coche, y lo que no esté en la base, el cliente lo confirma con el agente.',
          },
          {
            question: '¿Pide documentos o el DNI?',
            answer: 'No. Los documentos y los datos financieros quedan en manos del agente.',
          },
          {
            question: '¿Y los datos de mis clientes?',
            answer:
              'La inmobiliaria es la responsable del tratamiento de los datos de sus clientes, y ARP Vision, la encargada: trata las conversaciones solo para hacer la atención, en nombre de la inmobiliaria y siguiendo sus instrucciones.',
          },
          {
            question: '¿Cuánto cuesta?',
            answer:
              'Depende del tamaño del equipo y de cuántas conversaciones llegan. La propuesta llega por WhatsApp y explica también cómo se paga la tarifa que Meta cobra por mensaje, cuando la haya.',
          },
        ],
      },
      finalCta: {
        title: 'Atención al momento, agente con el resumen listo.',
        lead: 'Habla con ARP Vision y recibe una propuesta para tu inmobiliaria.',
        button: 'Quiero un presupuesto por WhatsApp',
      },
      whatsappMessage: '¡Hola! Vengo de la web y quiero saber más del Autochat de ARP Vision.',
      mock: {
        agency: 'Inmobiliaria Ejemplo',
        automated: 'Atención automática',
        intro:
          '¡Hola! Soy la atención automática de la Inmobiliaria Ejemplo. Si lo prefieres, llamo a un agente.',
        request:
          'Busco un piso de 2 dormitorios de alquiler en el Centro, cerca de un colegio, hasta 1.200 al mes.',
        found: 'He encontrado 3 opciones. Este está a unos 450 m de un colegio, en línea recta:',
        times: { request: '22:04', found: '22:05' },
        listing: 'Piso en el Centro',
        listingDetails: '2 dormitorios · 68 m²',
        listingPrice: '1.150 al mes',
        listingDistance: 'A unos 450 m de un colegio, en línea recta',
        license: 'Calificación energética: E',
        tour: 'Ver el tour 360°',
        wishesTitle: 'Lo que busca la clienta',
        deal: 'Alquiler',
        wishes: ['Centro', '2 dormitorios', 'hasta 1.200 al mes', 'cerca de un colegio'],
        summary: 'Resumen para la agente',
        client: 'Lucía Martín',
        whatsapp: 'WhatsApp',
        clientPhone: '600 000 000',
        seen: 'Ha visto 3 inmuebles y le ha gustado el piso del Centro',
        visit: 'Quiere visitarlo el sábado por la mañana',
        conversation: 'Conversación completa',
        requestDescription:
          'Ejemplo: la conversación con la Inmobiliaria Ejemplo en WhatsApp y el mensaje de la clienta, a las 22:04, pidiendo un piso de 2 dormitorios de alquiler en el Centro.',
        wishesDescription:
          'Ejemplo: lo que busca la clienta: alquiler, Centro, 2 dormitorios, hasta 1.200 al mes y cerca de un colegio.',
        listingDescription:
          'Ejemplo: la ficha de un piso en el Centro, con foto, precio, la distancia a un colegio, en línea recta, y el botón Ver el tour 360°.',
        summaryStartDescription:
          'Ejemplo: el principio del resumen para la agente, con el nombre y el WhatsApp de la clienta y lo que busca.',
        summaryDescription:
          'Ejemplo: el resumen para la agente, con el nombre y el WhatsApp de la clienta, el alquiler, lo que busca, los inmuebles que ha visto y cuál le ha gustado, cuándo quiere visitar y la conversación completa.',
        distancesDescription:
          'Ejemplo: un piso en el Centro y las distancias aproximadas, en línea recta, a un colegio (a unos 450 m), un hospital (a unos 1,2 km) y una estación (a unos 800 m).',
      },
    },
    // DIFERENTE: a calificación energética no lugar do CRECI, no topo, no incluído, na dúvida e no
    // cartão final dos vídeos.
    videos: {
      meta: {
        title: 'Vídeos de inmuebles a partir de fotos | ARP Vision',
        description:
          'Tú mandas las fotos del inmueble y ARP Vision monta el vídeo para Reels, stories y portales, con los datos del inmueble, tu logo y la calificación energética.',
      },
      hero: {
        eyebrow: 'VÍDEOS A PARTIR DE FOTOS',
        title: 'Las fotos del anuncio se convierten en vídeo para Reels y portales.',
        lead: 'Tú mandas las fotos del inmueble. ARP Vision monta el vídeo con un movimiento suave, música, los datos del inmueble en pantalla y, al final, tu logo con la calificación energética, en vertical y en horizontal.',
        button: 'Quiero un presupuesto por WhatsApp',
        note: 'Cuando el inmueble tiene tour 360°, el vídeo termina con el enlace del tour.',
      },
      formats: {
        title: 'Un mismo conjunto de fotos, los formatos que necesitas.',
        cards: [
          { id: 'vertical', title: 'Vertical, para Reels y stories' },
          { id: 'horizontal', title: 'Horizontal, para portales y YouTube' },
          { id: 'ending', title: 'Final con tu marca y el tour' },
        ],
      },
      steps: {
        title: 'De las fotos al vídeo, en tres pasos.',
        items: [
          {
            title: 'Manda las fotos',
            text: 'Las fotos del anuncio, siempre que la inmobiliaria pueda usarlas y no tengan marca de agua de otra empresa.',
          },
          {
            title: 'ARP Vision monta el vídeo',
            text: 'En el orden de una visita, de la fachada al exterior, con un movimiento suave en cada foto.',
          },
          {
            title: 'Aprueba y recibe',
            text: 'Pides un ajuste si quieres y recibes las dos versiones en MP4.',
          },
        ],
      },
      included: {
        title: 'Qué lleva el vídeo',
        items: [
          { title: 'Movimiento suave', text: 'Sobre las propias fotos del inmueble.' },
          { title: 'Música', text: 'Una pista de fondo acompaña las fotos.' },
          {
            title: 'Los datos del inmueble',
            text: 'Dormitorios, superficie y barrio, en pantalla.',
          },
          {
            title: 'Tu logo y la calificación energética',
            text: 'Al final del vídeo, con tu contacto.',
          },
          {
            title: 'El enlace del tour 360°',
            text: 'Cuando el inmueble tiene tour, el vídeo termina con él.',
          },
          { title: 'Vertical y horizontal', text: 'Las dos versiones, en MP4.' },
        ],
      },
      quote: {
        eyebrow: 'PRECIO A MEDIDA',
        title: 'Una propuesta para el ritmo de tus anuncios.',
        lead: 'Responde 3 preguntas rápidas y recibe por WhatsApp una propuesta para tus inmuebles y los formatos que quieres, sin compromiso.',
        questions: [
          {
            id: 'listings',
            label: '¿Cuántos inmuebles al mes?',
            summary: 'Inmuebles al mes',
            options: ['1 a 5', '6 a 20', 'Más de 20'],
          },
          {
            id: 'formats',
            label: '¿Qué formatos?',
            summary: 'Formatos',
            options: ['Vertical', 'Horizontal', 'Los dos'],
          },
          {
            id: 'timing',
            label: '¿Para cuándo?',
            summary: 'Para cuándo',
            options: ['Este mes', 'El mes que viene', 'Aún me estoy informando'],
          },
        ],
        greeting:
          '¡Hola! Vengo de la web y quiero un presupuesto de vídeos a partir de fotos de ARP Vision.',
        closing: '¿Me puedes enviar una propuesta?',
      },
      faq: {
        eyebrow: 'PREGUNTAS FRECUENTES',
        title1: 'Tú preguntas.',
        title2: 'Nosotros te lo explicamos.',
        lead1: 'Sin letra pequeña.',
        lead2: 'Entiende cada parte de los vídeos.',
        items: [
          {
            question: '¿Cuántas fotos tengo que mandar?',
            answer:
              'Las fotos del anuncio ya sirven. Cuantas más estancias, más completo queda el vídeo.',
          },
          { question: '¿En cuánto tiempo lo recibo?', answer: 'El plazo viene en la propuesta.' },
          {
            question: '¿Qué formatos recibo?',
            answer:
              'Vertical (9:16), para Reels y stories, y horizontal (16:9), para portales y YouTube, en MP4.',
          },
          {
            question: '¿Se puede poner el logo, el contacto y la calificación energética?',
            answer:
              'Sí. El final del vídeo lleva tu logo, el contacto y la calificación energética que nos indiques.',
          },
          {
            question: '¿Tengo que volver a hacer fotos?',
            answer: 'No. El vídeo se hace con las fotos que ya tienes.',
          },
          {
            question: '¿Puedo usarlo en los portales y en Instagram?',
            answer: 'Sí, en los portales que aceptan vídeo y en tus redes.',
          },
          {
            question: '¿Y si quiero cambiar algo?',
            answer: 'Pides el ajuste antes de recibir la versión final.',
          },
          {
            question: '¿Cuánto cuesta?',
            answer: 'Depende de cuántos inmuebles al mes. La propuesta llega por WhatsApp.',
          },
        ],
      },
      finalCta: {
        title: 'Tu próximo anuncio, ya con vídeo.',
        lead: 'Habla con ARP Vision y recibe una propuesta para tus inmuebles.',
        button: 'Quiero un presupuesto por WhatsApp',
      },
      whatsappMessage:
        '¡Hola! Vengo de la web y quiero saber más de los vídeos a partir de fotos de ARP Vision.',
      mock: {
        verticalDescription:
          'Ejemplo: vídeo vertical, para Reels y stories, hecho con cinco fotos de una casa, con el barrio, la superficie y los dormitorios en pantalla y, al final, la Inmobiliaria Ejemplo con la calificación energética y la invitación al tour 360°.',
        verticalPlay: 'Reproducir el vídeo vertical',
        verticalPause: 'Pausar el vídeo vertical',
        horizontalDescription: 'Ejemplo: el mismo vídeo en horizontal, para portales y YouTube.',
        horizontalPlay: 'Reproducir el vídeo horizontal',
        horizontalPause: 'Pausar el vídeo horizontal',
        photosDescription: 'Ejemplo: cuatro fotos de una casa, cada una marcada como enviada.',
        photosSent: '4 fotos enviadas',
        scenesDescription:
          'Ejemplo: las cuatro fotos en el orden de una visita: fachada, salón, cocina y exterior.',
        scenesTitle: 'Orden de la visita',
        scenes: ['Fachada', 'Salón', 'Cocina', 'Exterior'],
        deliveryDescription:
          'Ejemplo: las dos versiones del vídeo, 9:16 y 16:9, en MP4, con los botones Aprobar y Pedir un ajuste.',
        vertical: '9:16',
        horizontal: '16:9',
        file: 'MP4',
        approve: 'Aprobar',
        requestAdjustment: 'Pedir un ajuste',
      },
    },
  },
  productsPage: {
    meta: {
      title: 'Productos para inmobiliarias | ARP Vision',
      description:
        'Tour virtual 360°, vídeos a partir de fotos, Piloto automático para Instagram y Autochat: productos de ARP Vision para mostrar el inmueble, difundir y atender.',
    },
    eyebrow: 'PRODUCTOS PARA INMOBILIARIAS',
    title: 'Del primer post al cliente listo para la visita.',
    lead: 'Productos que trabajan juntos: muestran el inmueble, mantienen el Instagram al día y atienden por WhatsApp mientras el agente inmobiliario está en la calle.',
    cta: 'Conocer',
    finalCta: {
      title: '¿Qué producto encaja con tu inmobiliaria?',
      lead: 'Cuéntanos cómo trabajáis y recibe por WhatsApp una propuesta con los productos que elijas.',
      button: 'Quiero un presupuesto por WhatsApp',
      message: '¡Hola! Vengo de la web y quiero un presupuesto de los productos de ARP Vision.',
    },
  },
  footer: {
    taglineLines: ['Todo el inmueble, por dentro.', 'El móvil es solo el principio.'],
    products: 'Productos',
    discover: 'Descubre',
    howItWorks: 'Cómo funciona',
    realTour: 'Tour real',
    plans: 'Planes',
    quote: 'Pedir presupuesto',
    faq: 'Preguntas frecuentes',
    tutorials: 'Tutoriales en vídeo',
    start: 'Empieza aquí',
    signup: 'Crear cuenta gratis',
    login: 'Iniciar sesión en mi cuenta',
    talk: 'Hablemos',
    whatsapp: (number: string) => `WhatsApp ${number}`,
    note: 'Hecho para quien tiene inmuebles que mostrar.',
    cnpj: 'CNPJ',
    terms: 'Términos de uso',
    privacy: 'Política de privacidad',
    quickContact: 'Contacto rápido',
    floatingWhatsapp: 'Hablar con ARP Vision por WhatsApp',
  },
  contactDialog: {
    close: 'Cerrar',
    title: 'Hablamos muy pronto.',
    text: (credits: number, days: number) =>
      `Nuestra atención comercial abre muy pronto. Mientras tanto, crea tu cuenta gratis y prueba la captura con ${credits} ${credits === 1 ? 'crédito' : 'créditos'}, durante ${days} días, sin tarjeta.`,
    signup: 'Crear cuenta gratis',
  },
  home: {
    title: 'Tour virtual 360° con el móvil | ARP Vision',
    // Entre 140 e 160 caracteres, como no português.
    description:
      'Crea el tour virtual 360° de tu inmueble solo con el móvil. Uniones y luz corregidas, enlace listo para WhatsApp y el cliente lo abre sin cuenta. Prueba gratis.',
    ogImage: '/images/og-home-es.png',
    eyebrow: 'TOUR VIRTUAL 360° PARA INMOBILIARIAS',
    title1: 'Convierte tu inmueble en una experiencia.',
    title2: 'Solo con el móvil.',
    opening:
      'Haz el tour virtual 360° de tu inmueble solo con el móvil. Y el cliente abre el tour sin crear una cuenta.',
    howTitle: 'La app hace las fotos por ti',
    howSubtitle: 'Abre la cámara y sigue las instrucciones',
    steps: [
      'Captura con tu propio móvil.',
      'ARP Vision lo monta.',
      'Listo, ahora solo tienes que compartirlo.',
    ],
    videoLabel: 'Tutorial de la captura en 360 grados de ARP Vision',
    videoPlay: 'Reproducir vídeo',
    videoPause: 'Pausar vídeo',
    presentationLabel: 'Tour virtual y beneficios',
    plansEyebrow: 'EMPIEZA EN PEQUEÑO. MUÉSTRALO ENTERO.',
    plansTitle: 'Un plan para tu próximo paso.',
    plansLead: '1 crédito = 1 estancia fotografiada con el móvil. El saldo es de tu inmobiliaria.',
  },
  fan: {
    label: 'Estancias fotografiadas con el móvil',
    stageLabel: 'Miniaturas de estancias en 360 grados',
    arrow: (room: string) => `Ver el tour de demostración: ${room}`,
    roomLink: (room: string) => `${room} — ver el tour de demostración`,
    select: (room: string) => `Destacar tarjeta: ${room}`,
    rooms: {
      suite: {
        title: 'Suite',
        alt: 'Mampara de cristal y bañera en un baño fotografiado en 360 grados',
      },
      quarto: {
        title: 'Dormitorio',
        alt: 'Dos butacas junto a una mesa en el dormitorio con baño',
      },
      sala: {
        title: 'Salón',
        alt: 'Escalera de madera y mesa de cristal en el salón fotografiado en 360 grados',
      },
      quartoVisita: { title: 'Invitados', alt: 'Televisión junto a la ventana y la cortina' },
      patio: {
        title: 'Patio',
        alt: 'Piscina, cascada y zona cubierta con barbacoa en el patio',
      },
    },
  },
  sharing: {
    eyebrow: 'COMPARTIR',
    title1: 'Un enlace. El cliente',
    title2: 'lo abre donde esté.',
    channels: {
      whatsapp: {
        title: 'Por WhatsApp',
        text: 'El cliente abre el enlace sin crear una cuenta y ve el inmueble entero.',
      },
      site: {
        title: 'En tu web',
        text: 'Pega el código en la página, en formato adaptable, 16:9 o cuadrado.',
      },
      visit: {
        title: 'Antes de la visita',
        text: 'Quien llega ya conoce el inmueble y viene decidido.',
      },
    },
    // A imagem da conversa tem o texto em português: aqui ela é montada em HTML.
    conversationImage: null,
    chat: {
      label: 'Simulación de una conversación de WhatsApp con el enlace de un tour de 9 estancias',
      contact: 'Cliente',
      status: 'conversación de WhatsApp',
      message:
        '¡Hola! Te paso el tour del inmueble. Puedes verlo todo por dentro, estancia por estancia:',
      linkTitle: 'Tour 360° · 9 estancias',
      reply:
        'No tienes que descargar nada ni crear una cuenta. Puedes abrirlo en el ordenador o en el móvil.',
    },
  },
  showcase: {
    frameTitle: 'Tour 360° de demostración de ARP Vision',
    title: 'Mira el inmueble por dentro.',
    hint: 'Haz clic o toca para explorar el tour.',
    newTab: 'Abrir el tour en una pestaña nueva',
    exit: 'Terminar la exploración',
    marqueeLabel: 'Lo que aporta el tour',
    words: [
      'Confianza',
      'Exclusividad',
      'Agilidad',
      'Ahorro de tiempo',
      'Valor',
      'Inmersión',
      'Conexión',
      'Transparencia',
      'Credibilidad',
      'Diferenciación',
      'Protagonismo',
      'Alcance',
      'Accesibilidad',
      'Comodidad',
      'Autonomía',
      'Innovación',
      'Encanto',
      'Presencia digital',
      'Visitas sin límites',
      'Experiencia interactiva',
      'Cercanía',
      'Valor percibido',
    ],
  },
  credits: {
    title1: 'Cada estancia se convierte en una',
    title2: 'imagen 360° de alta calidad.',
    lead: 'No pagas por foto ni por tour. Pagas por estancia terminada.',
    // Tradução fiel do texto aprovado em português (medido no app: ~2 min por ambiente).
    flow: {
      capture: { value: '30 segundos', text: 'Una sola vuelta con el móvil, en cada estancia.' },
      image: {
        value: '1 imagen 360°',
        text: 'Las fotos se convierten en una única imagen, en alta calidad.',
      },
      credit: { value: '1 crédito', text: 'Es lo que cada estancia gasta del saldo del plan.' },
    },
    example:
      'En la práctica: una casa con salón, cocina, 2 dormitorios y 1 baño tiene 5 estancias, es decir, 5 créditos.',
  },
  tour: {
    eyebrow: 'ENTRA. MIRA A TU ALREDEDOR. EXPLORA.',
    title1: 'Esto se fotografió',
    title2: 'con un móvil.',
    lead: 'Arrastra para mirar alrededor. Toca los pasos para ir de una estancia a otra.',
    badge: 'Una nueva forma de visitar.',
    tabsLabel: 'Inmuebles de demostración',
    illustrativeAlt: 'Salón ilustrativo con sofá, luz natural y muebles de madera',
    illustrativeName: 'Un inmueble, todos los ángulos',
    openLabel: 'Entrar en el inmueble: abrir el tour en 360 grados',
    pendingLabel: 'Ver la disponibilidad del tour de demostración',
    open: 'Entrar en el inmueble',
    demo: 'Tour de demostración',
    openHint: 'La visita empieza con un toque.',
    pendingHint: 'La demostración real está en preparación.',
    explore: 'Explora cada estancia',
    captured: 'Capturado con ARP Vision',
    illustrative: 'Foto ilustrativa · no es una captura de ARP Vision',
    toBeDefined: '[por definir]',
    noTripod: 'Sin trípode',
    ready: 'Listo en ~1 min por estancia',
    cta: 'Quiero un tour así de mi inmueble',
    qrAlt: 'Código QR para abrir el tour en el móvil',
    qrLine1: 'Míralo en',
    qrLine2: 'tu móvil',
    coverAlt: 'Vista del inmueble {name}',
    phone: 'Móvil: {phone}',
    photos: '{photos} fotos por estancia',
    time: 'Captura: {time} por estancia',
    failed: 'No se ha podido abrir el tour ahora. ',
    newTab: 'Abrir en una pestaña nueva',
    pending:
      'El tour real todavía está en preparación. Esta portada es ilustrativa. Vuelve pronto para explorar un inmueble capturado con ARP Vision.',
    loading: 'Abriendo el inmueble…',
    frameTitle: 'Tour 360° de ejemplo: {name}',
    dialogLabel: 'Tour de {name}',
    closeDialog: 'Cerrar el tour ×',
  },
  team: {
    eyebrow: 'UNA HERRAMIENTA. TODO EL EQUIPO.',
    title1: 'Monta tu ecosistema de tours,',
    title2: 'pensado para inmobiliarias.',
    benefits: {
      autonomy: {
        title: 'Más autonomía para quien captura.',
        text: 'Más visibilidad para quien gestiona.',
      },
      standard: {
        title: 'El mismo estándar para todos.',
        text: 'Pensado para que quien nunca ha hecho fotos y quien ya tiene experiencia consigan el mismo resultado.',
      },
    },
  },
  // DIFERENTE: o ARP Vision Presencial só atende Porto Alegre e região; no espanhol não há seção
  // nem menu.
  inPerson: null,
  quote: {
    eyebrow: 'PRECIO A MEDIDA',
    title: 'Cada inmobiliaria tiene su tamaño. Tu propuesta, también.',
    lead: 'Responde 3 preguntas rápidas y recibe por WhatsApp una propuesta para tu volumen de inmuebles, sin compromiso.',
    benefits: {
      volume: {
        title: 'Propuesta para tu volumen.',
        text: 'Pagas por estancia terminada, no por foto.',
      },
      // DIFERENTE: o português oferece também o celular da equipe da ARP Vision ("ou com a
      // nossa"), do Presencial, que só atende Porto Alegre e região.
      phone: {
        title: 'Sin cámara 360° y sin fotógrafo.',
        text: 'El móvil que ya tienes hace el tour.',
      },
      team: {
        title: 'Conversación directa con el equipo.',
        text: 'Resuelve tus dudas antes de decidir.',
      },
    },
    questions: {
      perfil: {
        label: '¿Cómo trabajas?',
        summary: 'Cómo trabajo',
        options: [
          'Soy agente independiente',
          'Inmobiliaria pequeña',
          'Inmobiliaria con equipo',
          'Red o franquicia',
        ],
      },
      volume: {
        label: '¿Cuántos inmuebles al mes?',
        summary: 'Inmuebles al mes',
        options: ['1', '2 a 5', '6 a 15', 'Más de 15'],
      },
      prazo: {
        label: '¿Para cuándo?',
        summary: 'Para cuándo',
        options: ['Esta semana', 'Este mes', 'Aún me estoy informando'],
      },
    },
    greeting: '¡Hola! Vengo de la web y quiero un presupuesto de ARP Vision.',
    closing: '¿Me puedes enviar una propuesta?',
    preview: 'Tu mensaje',
    submit: 'Quiero mi presupuesto por WhatsApp',
    note: 'Abre WhatsApp con el mensaje listo. Lo revisas antes de enviarlo.',
    trial: (credits: number, days: number) =>
      `¿Prefieres probar antes? Crea tu cuenta gratis, fotografía ${rooms(credits)} y deja el tour publicado durante ${days} días, sin pagar nada.`,
    signup: 'Crear cuenta gratis',
  },
  finalCta: {
    title: 'Tu inmueble puede tener un tour 360° hoy mismo.',
    lead: 'Ya tienes el móvil. El siguiente paso es tuyo.',
    signup: 'Crear cuenta gratis',
    whatsapp: 'Hablar por WhatsApp',
    note: 'Sin tarjeta. Sin descargar ninguna app.',
  },
  faq: {
    eyebrow: 'PREGUNTAS FRECUENTES',
    title1: 'Tú preguntas.',
    title2: 'Nosotros te lo explicamos.',
    lead1: 'Sin letra pequeña.',
    lead2: 'Entiende cada parte de tu tour.',
    groups: {
      capture: 'Captura y tours',
      prices: 'Créditos, planes y pago',
      quote: 'Créditos, presupuesto y pago',
    },
    equipment: {
      question: '¿Tengo que comprar una cámara 360° o un trípode?',
      answer:
        'No. La captura se hace con el móvil, en la mano. La pantalla te indica hacia dónde apuntar y te avisa cuándo mantenerlo quieto.',
    },
    install: {
      question: '¿Tengo que instalar alguna app?',
      answer: 'No. ARP Vision se abre en el navegador del móvil.',
    },
    compatibility: { question: '¿Funciona en mi móvil?' },
    duration: {
      question: '¿Cuánto se tarda en hacer un tour?',
      answer:
        'Cada estancia es una sola vuelta, con 8 fotos. El 360° está listo en aproximadamente 1 minuto, en segundo plano, y mientras tanto capturas la siguiente estancia.',
    },
    // DIFERENTE: o português promete comparar a foto original antes de publicar (o app não
    // tem isso) e um chão "completado" (hoje é um borrão com carimbo). Aqui fica só o que é
    // verdade; o centro do teto e a foto original guardada não são citados.
    enhancement: {
      question: '¿La mejora cambia el inmueble?',
      answer:
        'Iguala las uniones y la luz entre las fotos, sin crear muebles ni cambiar acabados. El suelo justo debajo del móvil, que ninguna foto alcanza, se muestra difuminado y con un sello.',
    },
    camera: {
      question: 'Ya tengo una cámara 360°. ¿Me sirve?',
      answer:
        'Sí. Sube las fotos 360° desde la galería y monta el tour como siempre. Las fotos de la galería no gastan créditos.',
    },
    embed: {
      question: '¿Puedo poner el tour en mi web?',
      answer:
        'Sí. Cada tour tiene un código para pegar en tu web, en formato adaptable, 16:9 o cuadrado.',
    },
    credit: {
      question: '¿Qué es un crédito?',
      answer:
        'Cada estancia fotografiada con el móvil gasta 1 crédito. Los créditos son de la inmobiliaria, y todo el equipo usa el mismo saldo.',
    },
    individual: { question: '¿Cómo funciona el Individual?' },
    cost: {
      question: '¿Cuánto cuesta?',
      answer: (credits: number, days: number) =>
        `Depende de cuántas estancias fotografíes al mes. Pide tu presupuesto por WhatsApp y recibe una propuesta para tu volumen. Para conocerlo antes, crea tu cuenta gratis, fotografía ${rooms(credits)} y deja el tour publicado durante ${days} días, sin pagar nada.`,
    },
    payment: {
      question: '¿Cómo funciona el pago?',
      answer:
        'El pago se hace en la app, de forma segura, a través de Asaas. Las condiciones llegan junto con tu propuesta.',
    },
  },
  policies: {
    phoneRequirements:
      'Requisitos de compatibilidad por definir. La captura funciona en el navegador del móvil; la lista de dispositivos y versiones compatibles está en validación.',
    billing: (v) =>
      `El pago se hace en la app, de forma segura, a través de Asaas. Individual: ${v.pix} al contado con Pix o ${v.installments} cuotas de ${v.installment} con tarjeta. Professional: ${v.professional} al mes, con tarjeta. Business: ${v.business} al mes, con tarjeta. Con el plan anual, Professional y Business tienen un ${v.discount} % de descuento. Enterprise: condiciones según contrato.`,
    cancellation: (noticeDays: number, keepPrice: string) =>
      `Si cancelas una suscripción, los tours siguen publicados hasta el final del mes ya pagado. Está previsto un aviso por correo electrónico ${noticeDays} días antes de que dejen de estar publicados. Después, puedes mantener cada tour por ${keepPrice} al año.`,
    liveTourLimit:
      'Solo cuentan los tours publicados y no ocultos. Los borradores y los tours ocultos quedan fuera del límite. Al llegar al límite, tienes que ocultar un tour o cambiar de plan antes de publicar otro. El límite no retira tours automáticamente.',
    monthlyExtras: (included: number, extraPrice: string) =>
      `En el Individual, cada estancia además de las ${included} incluidas cuesta ${extraPrice}. Las estancias extra en Professional y Business todavía no tienen precio definido.`,
    individualTerm: (renewalPrice: string) =>
      `El tour del Individual se mantiene publicado durante 1 año y se puede renovar por ${renewalPrice} por 1 año más. La fecha de inicio de ese plazo todavía está por definir.`,
  },
  plans: {
    individual: { audience: 'Un tour, sin cuota mensual.', duration: '1 año publicado' },
    corretor: {
      audience: 'Para quien trabaja por su cuenta.',
      duration: 'Mientras la suscripción esté activa',
    },
    imobiliaria: { audience: 'Para equipos.', duration: 'Mientras la suscripción esté activa' },
    rede: { audience: 'Varias sedes, más posibilidades.', duration: 'Según contrato' },
  },
  pricing: {
    srTitle: 'Planes disponibles y precios',
    exampleNotice: '',
    monthly: 'Mensual',
    annual: 'Anual',
    save: (percent: number) => `ahorra un ${percent} %`,
    annualSwitch: (percent: number) => `Plan anual, con un ${percent} % de descuento`,
    previous: 'Plan anterior',
    swipe: 'Desliza para ver los planes',
    next: 'Plan siguiente',
    gridLabel: 'Planes',
    carouselStatus: '{name} · plan {current} de {total}',
    statusAnnual: 'Mostrando los precios del plan anual, con descuento.',
    statusMonthly: 'Mostrando los precios mensuales.',
    recommended: 'Recomendado',
    perMonth: '/mes',
    onRequest: 'Bajo consulta',
    payOnce: (pix: string) => `o ${pix} al contado con Pix`,
    payMonthly: 'Cobro mensual, con tarjeta',
    payCustom: 'Condiciones según contrato',
    payAnnual: (total: string) => `Cobro anual de ${total}`,
    stats: 'Estadísticas de visitas de los tours',
    roomsOnce: (credits: number) => `${credits} estancias`,
    toursOnce: (tours: number) => `${tours} tour publicado durante 1 año`,
    roomsMonthly: (credits: number) => `${credits} estancias al mes`,
    toursMonthly: (tours: number) => `Hasta ${tours} tours publicados`,
    roomsCustom: 'Estancias a medida',
    toursCustom: 'Volumen y límite de tours según contrato.',
    renewal: (renewalPrice: string) => `Renovación ${renewalPrice}/año`,
    contactMessage: (plan: string) => `¡Hola! Quiero conocer el plan ${plan} de ARP Vision.`,
    whatsapp: 'Hablar por WhatsApp',
    buy: 'Comprar',
    subscribe: 'Suscribirme',
    secure: 'Pago seguro con Asaas · Pix o tarjeta',
    trial: (credits: number, days: number) =>
      `¿Quieres probar antes? Crea tu cuenta gratis, fotografía ${rooms(credits)} y deja el tour publicado durante ${days} días, sin pagar nada.`,
    signup: 'Crear cuenta gratis',
    compare: 'Comparar todas las funciones',
  },
  features: {
    groups: {
      plan: 'Plan y publicación',
      capture: 'Captura y mejora',
      sharing: 'Tours y compartir',
      team: 'Equipo y gestión',
    },
    rows: {
      price: 'Precio',
      rooms: 'Estancias',
      liveTours: 'Tours publicados',
      duration: 'Tiempo publicado',
      extraRoom: 'Estancia extra',
      renewal: 'Renovación o mantenimiento',
      guidedCapture: 'Captura guiada en 360° con el móvil',
      autoFix: 'Uniones y luz corregidas automáticamente',
      creditBack: 'Crédito devuelto si la mejora falla',
      gallery: 'Fotos 360° de la galería sin gastar créditos',
      passages: 'Pasos entre las estancias',
      publicLink: 'Enlace público: el cliente lo abre sin cuenta',
      shareShortcut: 'Atajo para WhatsApp y correo electrónico',
      embed: 'Código para la web: adaptable, 16:9 y cuadrado',
      stats: 'Estadísticas de visitas: tiempo en cada estancia y de dónde vienen',
      sharedBalance: 'Saldo de créditos compartido por el equipo',
      roles: 'Administrador y usuarios en la cuenta',
      drafts: 'Borradores fuera del límite de tours publicados',
    },
    priceOnce: (pix: string, installments: number, installment: string) =>
      `${pix} con Pix o ${installments} cuotas de ${installment}`,
    priceMonthly: (monthly: string) => `${monthly} / mes`,
    onRequest: 'Bajo consulta',
    custom: 'A medida',
    roomsMonthly: (credits: number) => `${credits} al mes`,
    roomsOnce: (credits: number) => `${credits} una vez`,
    byContract: 'Según contrato',
    upTo: (tours: number) => `Hasta ${tours}`,
    perRoom: (extraPrice: string) => `${extraPrice} por estancia`,
    toBeDefined: 'Por definir',
    renewalOnce: (renewalPrice: string) => `${renewalPrice} por 1 año más`,
    renewalMonthly: (renewalPrice: string) => `${renewalPrice} por tour/año tras cancelar`,
    included: 'Incluido',
    notIncluded: 'No incluido',
    comingSoon: 'Próximamente',
  },
  plansPage: {
    title: 'Planes y precios | ARP Vision',
    description:
      'Planes ARP Vision: Individual de pago único, Professional y Business mensuales y Enterprise bajo consulta. Compara créditos, tours publicados y prueba gratuita.',
    ogImage: '/images/og-planes-es.png',
    breadcrumb: 'Inicio / Planes',
    eyebrow: 'EL PRÓXIMO PASO DE TU INMOBILIARIA',
    title1: 'Planes para inmobiliarias',
    title2: 'de todos los tamaños',
    lead1: '1 crédito = 1 estancia fotografiada con el móvil.',
    lead2: 'Un inmueble suele tener de 6 a 10 estancias.',
    compareEyebrow: 'CADA DETALLE, LADO A LADO',
    compareTitle: 'Compara todas las funciones.',
    compareLead: 'Compara lo que incluye cada plan para capturar y publicar tus inmuebles.',
    tableLabel: 'Tabla comparativa de los planes, con desplazamiento horizontal',
    features: 'Funciones',
    recommended: 'Recomendado',
  },
  // Os títulos e as descrições são os da aba Tutoriales do app (es.json).
  tutorials: {
    title: 'Tutoriales en vídeo | ARP Vision',
    // DIFERENTE: os vídeos são narrados em português. A descrição e a abertura avisam logo de
    // início, como a aba Tutoriales do app; o português não precisa dizer.
    description:
      'Vídeos cortos, en portugués, que muestran cada paso de ARP Vision, de la captura con el móvil al tour publicado, y cómo añadir la app a la pantalla de inicio.',
    breadcrumb: 'Inicio / Tutoriales',
    eyebrow: 'PASO A PASO EN VÍDEO',
    heading: 'Tutoriales',
    lead: 'Vídeos cortos, en portugués, que muestran cada paso de ARP Vision, de la primera estancia fotografiada al tour publicado.',
    watch: 'Ver',
    watchLabel: (title: string, duration: string) => `Ver: ${title} (${duration})`,
    close: 'Cerrar el vídeo',
    sections: {
      start: 'Primeros pasos',
      app: 'Consejos de la app',
    },
    videos: {
      'do-novo-tour-a-publicacao': {
        title: 'De «Nuevo tour» a la publicación',
        description: 'El camino completo: captura, estancias, accesos y publicación.',
      },
      'app-na-tela-de-inicio': {
        title: 'La app en la pantalla de inicio',
        description: 'Abre ARP Vision con un toque, a pantalla completa, en el iPhone.',
      },
    },
  },
  legal: {
    eyebrow: 'INFORMACIÓN LEGAL',
    preparing: 'Documento en preparación',
    available: 'El documento completo estará disponible en esta página.',
    contact: 'Contacto:',
    emailPending: '[correo electrónico por definir]',
    terms: {
      title: 'Términos de uso | ARP Vision',
      description:
        'Términos de uso de ARP Vision. Consulta las condiciones de uso de la plataforma.',
      breadcrumb: 'Inicio / Términos de uso',
      heading: 'Términos de uso',
      notice: 'Estamos preparando nuestros términos de uso.',
      link: 'Términos de uso →',
      body: '',
    },
    privacy: {
      title: 'Política de privacidad | ARP Vision',
      description:
        'Política de privacidad de ARP Vision. Información sobre la privacidad y el tratamiento de datos.',
      breadcrumb: 'Inicio / Política de privacidad',
      heading: 'Política de privacidad',
      notice: 'Estamos preparando nuestra política de privacidad.',
      link: 'Política de privacidad →',
      body: '',
    },
  },
  notFound: {
    title: 'Página no encontrada',
    lead: 'Puede que la dirección haya cambiado o que ya no exista.',
    home: 'Volver al inicio',
  },
  schema: {
    appDescription:
      'Tour virtual 360° de inmuebles con el móvil, con captura guiada y mejora automática.',
    offerOnce: (installments: number) =>
      `Pago único por 1 tour publicado durante 1 año: al contado con Pix o en ${installments} cuotas con tarjeta. Renovación anual aparte.`,
    offerMonthly:
      'Suscripción mensual con tarjeta; tours publicados mientras la suscripción esté activa, dentro del límite del plan.',
  },
};
