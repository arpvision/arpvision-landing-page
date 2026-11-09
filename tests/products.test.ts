import test from 'node:test';
import assert from 'node:assert/strict';
import { englishRules } from '../scripts/lib/english-rules.mjs';
import { portugueseWordsIn } from '../scripts/portuguese-words.mjs';
import { locales, translations } from '../src/i18n';
import { anchorId, publishedPageIds, routes, type PageId } from '../src/i18n/routes';
import {
  isLive,
  liveProductGroups,
  liveProductsFor,
  liveProductsWithText,
  pairById,
  pairByPosition,
  productGroups,
  productHref,
  productOfPage,
  productPageIds,
  productPageText,
  products,
  productSlug,
  productsFor,
  productText,
  sectionHref,
} from '../src/lib/products';

const by = (id: string) => products.find((p) => p.id === id)!;

test('cada página de produto tem caminho nos três idiomas: o espanhol com o endereço final do português, o inglês com o próprio', () => {
  for (const page of productPageIds) {
    assert.match(routes.pt.pages[page], /^\/produtos\/[a-z0-9-]+$/);
    assert.match(routes.es.pages[page], /^\/es\/productos\/[a-z0-9-]+$/);
    assert.match(routes.en.pages[page], /^\/en\/products\/[a-z0-9-]+$/);
    assert.equal(productSlug('pt', page), productSlug('es', page));
  }
  assert.deepEqual(
    productPageIds.map((page) => productSlug('en', page)),
    ['autopilot-for-instagram', 'autochat', 'videos-from-photos'],
  );
});

test('o grupo da equipe (o Presencial) entra onde o dicionário tem a seção dele: hoje, só no pt', () => {
  assert.deepEqual(
    productsFor('pt').map((p) => p.id),
    ['tour', 'videos', 'instagram', 'autochat', 'training', 'readyTour'],
  );
  for (const locale of ['es', 'en'] as const)
    assert.deepEqual(
      productsFor(locale).map((p) => p.id),
      ['tour', 'videos', 'instagram', 'autochat'],
      locale,
    );
});

// O Presencial com a seção da home num idioma que hoje não a tem (o espanhol), pelo tempo do teste.
const withInPersonInSpanish = (check: () => void) => {
  const es = translations('es');
  const original = es.inPerson;
  es.inPerson = translations('pt').inPerson;
  try {
    check();
  } finally {
    es.inPerson = original;
  }
};

test('com a seção do Presencial no dicionário de um idioma, o grupo da equipe entra nele', () => {
  withInPersonInSpanish(() =>
    assert.deepEqual(
      productsFor('es').map((p) => p.id),
      ['tour', 'videos', 'instagram', 'autochat', 'training', 'readyTour'],
    ),
  );
});

test('links dos produtos', () => {
  assert.equal(productHref('pt', by('tour'), '/produtos'), '/');
  assert.equal(productHref('es', by('tour'), '/es/productos'), '/es');
  assert.equal(productHref('en', by('tour'), '/en/products'), '/en');
  assert.equal(
    productHref('pt', by('instagram'), '/'),
    '/produtos/piloto-automatico-para-instagram',
  );
  assert.equal(productHref('en', by('instagram'), '/en'), '/en/products/autopilot-for-instagram');
  assert.equal(productHref('en', by('videos'), '/en/products'), '/en/products/videos-from-photos');
  assert.equal(productHref('pt', by('training'), '/'), '#presencial');
  assert.equal(productHref('pt', by('training'), '/produtos/autochat'), '/#presencial');
});

test('productText: o nome e a linha do idioma; o Presencial só existe em português', () => {
  assert.deepEqual(productText('pt', 'autochat'), {
    name: 'Autochat',
    line: 'Atende no WhatsApp e passa ao corretor.',
  });
  assert.equal(productText('es', 'tour')?.name, 'Tour virtual 360°');
  // No inglês, os nomes da seção Inglês da spec ("for Instagram" só descreve).
  assert.deepEqual(
    (['tour', 'videos', 'instagram', 'autochat'] as const).map((id) => productText('en', id)?.name),
    ['360° virtual tour', 'Videos from photos', 'Autopilot for Instagram', 'Autochat'],
  );
  assert.equal(productText('pt', 'training')?.name, 'Treinamento da equipe');
  assert.equal(productText('pt', 'readyTour')?.name, 'Tour Pronto');
  for (const locale of ['es', 'en'] as const) {
    assert.equal(productText(locale, 'training'), undefined, locale);
    assert.equal(productText(locale, 'readyTour'), undefined, locale);
  }
  // Todo produto de um idioma tem texto nele.
  for (const locale of locales)
    for (const product of productsFor(locale))
      assert.ok(productText(locale, product.id), `${locale}/${product.id}`);
});

test('o Presencial tem a mesma âncora em todos os idiomas', () => {
  for (const locale of locales) assert.equal(anchorId(locale, 'inPerson'), 'presencial');
});

test('links de seção do cabeçalho: ficam na página quando ela tem a seção', () => {
  assert.equal(sectionHref('pt', 'quote', '/'), '#cotacao');
  assert.equal(sectionHref('es', 'faq', '/es'), '#preguntas');
  assert.equal(sectionHref('en', 'quote', '/en'), '#quote');
  assert.equal(sectionHref('pt', 'quote', '/termos-de-uso'), '/#cotacao');
  assert.equal(sectionHref('es', 'quote', '/es/tutoriales'), '/es#cotizacion');
  assert.equal(sectionHref('en', 'faq', '/en/tutorials'), '/en#faq');
  // A página de produto tem cotação e dúvidas próprias, com os ids da home; o resto é da home.
  for (const locale of locales)
    for (const page of productPageIds) {
      const path = routes[locale].pages[page];
      assert.equal(sectionHref(locale, 'quote', path), `#${anchorId(locale, 'quote')}`);
      assert.equal(sectionHref(locale, 'faq', path), `#${anchorId(locale, 'faq')}`);
      assert.equal(
        sectionHref(locale, 'realTour', path),
        `${routes[locale].pages.home}#${anchorId(locale, 'realTour')}`,
      );
    }
  // A página com todos os produtos não tem essas seções.
  assert.equal(sectionHref('pt', 'quote', '/produtos'), '/#cotacao');
  assert.equal(sectionHref('es', 'faq', '/es/productos'), '/es#preguntas');
  assert.equal(sectionHref('en', 'quote', '/en/products'), '/en#quote');
});

test('productOfPage devolve o dono da página, e cada página de produto tem um só dono', () => {
  assert.equal(productOfPage('productAutochat'), by('autochat'));
  assert.equal(productOfPage('products'), undefined);
  assert.equal(productOfPage('home'), undefined);
  assert.equal(productOfPage(undefined), undefined);
  assert.deepEqual(
    products.flatMap((p) => (p.page ? [p.page] : [])).sort(),
    [...productPageIds].sort(),
  );
});

test('o catálogo é coerente: quem tem página leva a ela, e os grupos seguem a sua ordem', () => {
  for (const product of products)
    if (product.page) assert.deepEqual(product.target, { page: product.page });
  // productsFor só filtra a lista, então ela já precisa estar na ordem dos grupos.
  const order = products.map((p) => productGroups.indexOf(p.group));
  assert.ok(!order.includes(-1));
  assert.deepEqual(
    order,
    [...order].sort((a, b) => a - b),
  );
});

// Só o que está publicado aparece. Estes testes trocam publishedPageIds por uma lista conhecida e
// devolvem a original no fim, para continuarem valendo quando as páginas de produto forem
// entrando na lista.
const withPublished = (pages: PageId[], check: () => void) => {
  const list = publishedPageIds as PageId[];
  const original = [...list];
  list.splice(0, list.length, ...pages);
  try {
    check();
  } finally {
    list.splice(0, list.length, ...original);
  }
};

test('isLive: sem página própria está no ar, e com página só depois de publicada', () => {
  // A lista inicial não tem nenhuma página de produto.
  withPublished(['home', 'plans', 'terms', 'privacy'], () => {
    assert.equal(isLive(by('tour')), true);
    assert.equal(isLive(by('training')), true);
    assert.equal(isLive(by('instagram')), false);
  });
  withPublished(['home', 'productInstagram'], () => {
    assert.equal(isLive(by('instagram')), true);
    assert.equal(isLive(by('autochat')), false);
  });
});

test('liveProductsFor tira o que não está publicado e mantém a ordem e o idioma', () => {
  withPublished(['home', 'productVideos', 'productAutochat'], () => {
    assert.deepEqual(
      liveProductsFor('pt').map((p) => p.id),
      ['tour', 'videos', 'autochat', 'training', 'readyTour'],
    );
    for (const locale of ['es', 'en'] as const)
      assert.deepEqual(
        liveProductsFor(locale).map((p) => p.id),
        ['tour', 'videos', 'autochat'],
        locale,
      );
  });
});

test('liveProductsWithText: só entra quem tem texto no idioma', () => {
  // O Presencial com a seção também no espanhol, mas ainda sem o texto do menu dele
  // (products.inPerson): os dois itens ficam de fora, sem nome vazio.
  withInPersonInSpanish(() =>
    withPublished(['home', 'productVideos', 'productAutochat'], () => {
      assert.ok(liveProductsFor('es').includes(by('training')));
      assert.deepEqual(
        liveProductsWithText('es').map(({ product }) => product.id),
        ['tour', 'videos', 'autochat'],
      );
    }),
  );
});

test('o menu Produtos tem 6 itens no pt (com o treinamento e o Tour Pronto) e 4 no es e no en', () => {
  const counts = (locale: (typeof locales)[number]) =>
    liveProductGroups(locale).map(({ group, items }) => [group, items.length]);
  withPublished(
    ['home', 'productVideos', 'productInstagram', 'productAutochat', 'products'],
    () => {
      assert.deepEqual(counts('pt'), [
        ['show', 2],
        ['promote', 2],
        ['team', 2],
      ]);
      for (const locale of ['es', 'en'] as const)
        assert.deepEqual(
          counts(locale),
          [
            ['show', 2],
            ['promote', 2],
          ],
          locale,
        );
    },
  );
});

test('liveProductGroups: os grupos do menu e de /produtos, com o texto do idioma e sem grupo vazio', () => {
  const groupsOf = (locale: (typeof locales)[number]) =>
    liveProductGroups(locale).map(({ group, items }) => [
      group,
      items.map(({ product }) => product.id),
    ]);
  withPublished(['home', 'productVideos', 'productAutochat'], () => {
    // O grupo da equipe entra no fim, e só no português.
    assert.deepEqual(groupsOf('pt'), [
      ['show', ['tour', 'videos']],
      ['promote', ['autochat']],
      ['team', ['training', 'readyTour']],
    ]);
    for (const locale of ['es', 'en'] as const)
      assert.deepEqual(
        groupsOf(locale),
        [
          ['show', ['tour', 'videos']],
          ['promote', ['autochat']],
        ],
        locale,
      );
  });
  // Sem nenhum produto de divulgar e atender no ar, o grupo não aparece vazio.
  withPublished(['home', 'productVideos'], () => {
    assert.deepEqual(groupsOf('pt'), [
      ['show', ['tour', 'videos']],
      ['team', ['training', 'readyTour']],
    ]);
    assert.deepEqual(groupsOf('es'), [['show', ['tour', 'videos']]]);
  });
  // Os grupos juntos são a lista no ar, na mesma ordem, e cada produto leva o texto do idioma.
  for (const locale of locales) {
    const items = liveProductGroups(locale).flatMap(({ items }) => items);
    assert.deepEqual(
      items.map(({ product }) => product),
      liveProductsFor(locale),
      locale,
    );
    for (const { product, text } of items)
      assert.deepEqual(text, productText(locale, product.id), `${locale}/${product.id}`);
  }
});

// Valor de teste para as funções do dicionário (o mesmo de tests/i18n.test.ts): vira "1" em
// qualquer texto e em qualquer campo.
const any: unknown = new Proxy(
  {},
  { get: (_, key) => (key === Symbol.toPrimitive ? () => 1 : any) },
);
// Os textos de um bloco do dicionário, cada um com o seu caminho; uma função entra com o texto que
// devolve.
type Leaf = [path: string, text: string];
const leaves = (value: unknown, path = ''): Leaf[] => {
  if (typeof value === 'string') return [[path, value]];
  if (typeof value === 'function')
    return leaves(value(...Array.from({ length: value.length }, () => any)), `${path}()`);
  if (Array.isArray(value))
    return value.flatMap((item, index) => leaves(item, `${path}[${index}]`));
  if (value && typeof value === 'object')
    return Object.entries(value).flatMap(([key, item]) =>
      leaves(item, path ? `${path}.${key}` : key),
    );
  return [];
};
const productPagesOf = (locale: (typeof locales)[number]) =>
  Object.entries(translations(locale).productPages);
// Todo texto das páginas novas: cada página de produto e a página com todos os produtos.
const newPagesOf = (locale: (typeof locales)[number]): [string, unknown][] => [
  ...productPagesOf(locale),
  ['productsPage', translations(locale).productsPage],
];
// As regras de texto da spec: sem "IA" nem o que a pasta de marketing proíbe, sem preço e sem o
// nome do site de referência. Cada regra vale também no espanhol ("generado", o euro com número e
// "desde" com preço) e no inglês, pela mesma regra que o check-site aplica às páginas /en
// (scripts/lib/english-rules.mjs: "intelligent", "smart", "generated", "algorithm", "unedited" e
// "starting at", "from" ou "as low as" com preço). Elas valem para todo o texto do dicionário: o
// das páginas novas e também o do menu Produtos, do cabeçalho, do rodapé e da faixa da home.
const forbidden = new RegExp(
  [
    /\bIA\b|\bAI\b|intelig[eê]ncia artificial|inteligente|gerad[oa]s?\b|generad[oa]s?\b|algoritmo|100% real|sem edição|sin edición/,
    // Moeda com número, antes ou depois dele (real, dólar, euro e libra), e "a partir de" ou
    // "desde" com preço.
    /\$\s*\d|€\s*\d|\d\s*€|£\s*\d|\d\s*£|(?:a partir de|desde)\s*(?:\$|R\$|US\$|€|£)/,
    /\bPedra\b/,
    englishRules,
  ]
    .map((rule) => rule.source)
    .join('|'),
  'i',
);

test('as regras de texto pegam também os equivalentes do espanhol', () => {
  // "generado", o euro com número (antes ou depois dele) e "a partir de" ou "desde" com preço.
  for (const text of [
    'Vídeos generados a partir de tus fotos',
    'Una imagen generada con tus fotos',
    'Desde 99 € al mes',
    'Por 49€ al mes',
    'Precio: € 99',
    'A partir de €49',
    'Desde R$99',
  ])
    assert.match(text, forbidden, text);
  // O que o texto já usa continua valendo: "a partir de" e "desde" sem preço e número sem moeda.
  for (const text of [
    'A partir de tu web o de las fotos que mandas',
    'Desde tu móvil',
    'hasta 2.500 al mes',
    'Calificación energética: E',
    '3 dormitorios · 240 m²',
  ])
    assert.doesNotMatch(text, forbidden, text);
});

test('as regras de texto pegam também os equivalentes do inglês', () => {
  // "intelligent", "smart", "generated", "algorithm", "100% real", "unedited", moeda com número
  // ($, US$, €, £, R$) e "starting at", "from" ou "as low as" com preço.
  for (const text of [
    'An intelligent assistant answers your clients',
    'Smart replies, day and night',
    'Videos generated from your photos',
    'Our algorithm picks the best photos',
    '100% real photos',
    'Unedited footage of the property',
    'Plans for $99 a month',
    'US$ 29 per video',
    '£19 a month',
    'Starting at €49',
    'From $49',
    'As low as R$ 99',
    'From R$ 249 a month',
    'starting at US$ 29',
  ])
    assert.match(text, forbidden, text);
  // O que o texto em inglês já usa continua valendo: "from" sem preço, número sem moeda e a
  // licença.
  for (const text of [
    'From the first post to a client ready to visit.',
    'From your website or the photos you send',
    'up to 2,500 a month',
    'License #00000',
    '3 bedrooms · 240 m²',
    'Get a quote on WhatsApp',
  ])
    assert.doesNotMatch(text, forbidden, text);
});

test('o apoio da página com todos os produtos não conta os produtos (são seis no pt e quatro nos outros)', () => {
  assert.deepEqual(
    locales.map((locale) => translations(locale).productsPage.lead.split(':')[0]),
    [
      'Produtos que trabalham juntos',
      'Productos que trabajan juntos',
      'Products that work together',
    ],
  );
});

test('páginas de produto: título com a marca, descrição de até 160 e as mensagens com o nome do produto', () => {
  // O nome pode vir no meio da frase, com minúscula: "uma cotação de vídeos a partir de fotos".
  const cites = (text: string, name: string) => text.toLowerCase().includes(name.toLowerCase());
  for (const locale of locales) {
    const { items } = translations(locale).products;
    for (const [id, page] of productPagesOf(locale)) {
      const name = items[id as keyof typeof items].name;
      assert.match(page.meta.title, /ARP Vision/, `${locale}/${id}: título`);
      assert.ok(
        page.meta.description.length <= 160,
        `${locale}/${id}: descrição com ${page.meta.description.length} caracteres`,
      );
      assert.ok(cites(page.quote.greeting, name), `${locale}/${id}: a saudação cita "${name}"`);
      // A mensagem do rodapé e do botão flutuante é a do produto, e não a de outra página.
      assert.ok(
        cites(page.whatsappMessage, name),
        `${locale}/${id}: a mensagem do WhatsApp cita "${name}"`,
      );
    }
  }
});

test('a página com todos os produtos: publicada, título com a marca, descrição de até 160 e "Conhecer"', () => {
  assert.ok(publishedPageIds.includes('products'), 'a página com todos os produtos está publicada');
  for (const locale of locales) {
    const { meta } = translations(locale).productsPage;
    assert.match(meta.title, /ARP Vision/, `${locale}: título`);
    assert.ok(
      meta.description.length <= 160,
      `${locale}: descrição com ${meta.description.length} caracteres`,
    );
  }
  assert.equal(translations('pt').productsPage.cta, 'Conhecer');
  assert.equal(translations('es').productsPage.cta, 'Conocer');
  assert.equal(translations('en').productsPage.cta, 'Discover');
});

test('todo o texto dos dicionários, nos três idiomas, segue as regras de texto da spec', () => {
  for (const locale of locales)
    for (const [path, text] of leaves(translations(locale)))
      assert.doesNotMatch(text, forbidden, `${locale}.${path}: "${text}"`);
});

test('as páginas de produto e a com todos eles, em espanhol e em inglês, não têm português nem CRECI', () => {
  for (const locale of ['es', 'en'] as const)
    for (const [id, page] of newPagesOf(locale))
      for (const [path, text] of leaves(page)) {
        assert.doesNotMatch(text, portugueseWordsIn(locale), `${locale}/${id}.${path}: "${text}"`);
        assert.doesNotMatch(text, /CRECI/, `${locale}/${id}.${path}: "${text}"`);
      }
});

test('no inglês, o número da licença no lugar do CRECI e os nomes fictícios da spec', () => {
  const { instagram, autochat } = translations('en').productPages;
  for (const mock of [instagram.mock, autochat.mock]) {
    assert.equal(mock.agency, 'Example Realty');
    assert.equal(mock.license, 'License #00000');
  }
  assert.equal(instagram.mock.siteAddress, 'youragency.net');
  assert.ok(
    instagram.gallery.arts.some((art) => art.title.includes('Example Neighborhood')),
    'o bairro fictício nas artes',
  );
});

test('o Autochat tem 4 passos, 3 distâncias, 6 campos no resumo, 4 casos, 8 itens e 8 dúvidas', () => {
  for (const locale of locales) {
    const page = translations(locale).productPages.autochat;
    assert.deepEqual(
      {
        steps: page.steps.items.length,
        distances: page.proximity.examples.length,
        fields: page.broker.fields.length,
        handoff: page.handoff.items.length,
        included: page.included.items.length,
        faq: page.faq.items.length,
      },
      { steps: 4, distances: 3, fields: 6, handoff: 4, included: 8, faq: 8 },
      locale,
    );
  }
});

// Uma distância escrita no texto: "450 m", "1,2 km" (e não "68 m²", nem "12 mensagens").
const distance = /\d+(?:[.,]\d+)?\s*k?m(?![²\p{L}])/u;

test('no Autochat, toda distância vem com "em linha reta" (es: "en línea recta", en: "in a straight line")', () => {
  const straight: Record<(typeof locales)[number], string> = {
    pt: 'em linha reta',
    es: 'en línea recta',
    en: 'in a straight line',
  };
  for (const locale of locales) {
    const withDistance = leaves(translations(locale).productPages.autochat).filter(([, text]) =>
      distance.test(text),
    );
    assert.ok(withDistance.length > 0, `${locale}: distâncias no Autochat`);
    for (const [path, text] of withDistance)
      assert.ok(text.includes(straight[locale]), `${locale}/autochat.${path}: "${text}"`);
  }
  // O padrão pega a distância e deixa de fora a área e as palavras com "m" depois do número.
  assert.match('a uns 450 m de uma escola', distance);
  assert.match('cerca de 1,2 km', distance);
  assert.doesNotMatch('2 quartos · 68 m²', distance);
  assert.doesNotMatch('12 mensagens', distance);
});

test('no Autochat, a descrição do passo 1 diz a hora do pedido que a tela mostra', () => {
  // Na tela, a hora vai como no WhatsApp (22:04, 10:04 PM); no texto corrido do português, como
  // 22h04. Um idioma novo diz aqui como escreve a hora na descrição (o tipo pede a entrada dele).
  const written: Record<(typeof locales)[number], (time: string) => string> = {
    pt: (time) => time.replace(':', 'h'),
    es: (time) => time,
    en: (time) => time,
  };
  for (const locale of locales) {
    const { times, requestDescription } = translations(locale).productPages.autochat.mock;
    assert.match(times.request, /\d{1,2}:\d{2}/, `${locale}: hora do pedido`);
    assert.ok(
      requestDescription.includes(written[locale](times.request)),
      `${locale}: "${requestDescription}" sem a hora ${times.request}`,
    );
  }
});

test('o Piloto em português leva o CRECI', () => {
  assert.match(JSON.stringify(translations('pt').productPages.instagram), /CRECI/);
});

test('a descrição de cada tela de exemplo começa por "Exemplo:" no idioma', () => {
  assert.equal(translations('pt').products.example, 'Exemplo');
  assert.equal(translations('es').products.example, 'Ejemplo');
  assert.equal(translations('en').products.example, 'Example');
  for (const locale of locales) {
    const { example } = translations(locale).products;
    for (const [id, page] of productPagesOf(locale)) {
      const descriptions = leaves(page).filter(([path]) => /Description$/.test(path));
      assert.ok(descriptions.length > 0, `${locale}/${id}: descrições das telas`);
      for (const [path, text] of descriptions)
        assert.ok(text.startsWith(`${example}: `), `${locale}/${id}.${path}: "${text}"`);
    }
  }
});

// O que o componente decide para cada item do dicionário (a foto de uma arte, o ícone de um item)
// fica casado com ele pelo id ou pela posição, e qualquer descasamento para o build.
test('pairById junta pelo id, em qualquer ordem, e recusa id sem par, sobrando ou repetido', () => {
  const items = [
    { id: 'sale', title: 'À venda' },
    { id: 'sold', title: 'Vendido' },
  ];
  assert.deepEqual(pairById('Galeria', items, { sold: 'pátio', sale: 'piscina' }), [
    [items[0], 'piscina'],
    [items[1], 'pátio'],
  ]);
  assert.throws(() => pairById('Galeria', items, { sale: 'piscina' }), /Galeria.*sold/);
  assert.throws(
    () => pairById('Galeria', items, { sale: 'piscina', sold: 'pátio', rent: 'sala' }),
    /Galeria.*rent/,
  );
  assert.throws(
    () => pairById('Galeria', [...items, { id: 'sale', title: 'De novo' }], { sale: '', sold: '' }),
    /Galeria.*sale/,
  );
  // Um id que só existe no protótipo de todo objeto não conta como par.
  assert.throws(() => pairById('Galeria', [{ id: 'toString' }], {}), /Galeria.*toString/);
});

test('pairByPosition junta pela posição e recusa listas de tamanhos diferentes', () => {
  assert.deepEqual(pairByPosition('Incluído', ['Posts', 'Marca'], ['calendar', 'star']), [
    ['Posts', 'calendar'],
    ['Marca', 'star'],
  ]);
  assert.throws(() => pairByPosition('Incluído', ['Posts', 'Marca'], ['calendar']), /Incluído/);
  assert.throws(() => pairByPosition('Incluído', ['Posts'], ['calendar', 'star']), /Incluído/);
});

test('as artes do Piloto têm ids únicos, os mesmos e na mesma ordem em todos os idiomas', () => {
  const ids = (locale: (typeof locales)[number]) =>
    translations(locale).productPages.instagram.gallery.arts.map((art) => art.id);
  assert.equal(new Set(ids('pt')).size, ids('pt').length);
  assert.deepEqual(ids('es'), ids('pt'));
  assert.deepEqual(ids('en'), ids('pt'));
});

test('os formatos dos Vídeos são vertical, horizontal e o final, nessa ordem, em todos os idiomas', () => {
  for (const locale of locales)
    assert.deepEqual(
      translations(locale).productPages.videos.formats.cards.map((card) => card.id),
      ['vertical', 'horizontal', 'ending'],
      locale,
    );
});

test('a tabela de comparação tem um valor por coluna em cada linha', () => {
  for (const locale of locales) {
    const { comparison } = translations(locale).productPages.instagram;
    for (const row of comparison.rows)
      assert.equal(row.values.length, comparison.columns.length, `${locale}: ${row.label}`);
  }
});

test('cada página de produto publicada tem texto em todos os idiomas', () => {
  const published = productPageIds.filter((page) => publishedPageIds.includes(page));
  assert.ok(published.includes('productInstagram'), 'o Piloto está publicado');
  assert.ok(published.includes('productVideos'), 'os Vídeos estão publicados');
  assert.ok(published.includes('productAutochat'), 'o Autochat está publicado');
  for (const locale of locales)
    for (const page of published)
      assert.ok(productPageText(locale, productOfPage(page)!.id), `${locale}: ${page}`);
  // Sem página própria (o tour), sem texto de página.
  assert.equal(productPageText('pt', 'tour'), undefined);
});
