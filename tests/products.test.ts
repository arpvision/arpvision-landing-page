import test from 'node:test';
import assert from 'node:assert/strict';
import { portugueseWords } from '../scripts/portuguese-words.mjs';
import { available } from '../src/config/site';
import { locales, translations } from '../src/i18n';
import { anchorId, publishedPageIds, routes, type PageId } from '../src/i18n/routes';
import {
  isLive,
  liveProductsFor,
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

test('cada página de produto tem caminho nos dois idiomas e o mesmo endereço final', () => {
  for (const page of productPageIds) {
    assert.match(routes.pt.pages[page], /^\/produtos\/[a-z0-9-]+$/);
    assert.match(routes.es.pages[page], /^\/es\/productos\/[a-z0-9-]+$/);
    assert.equal(productSlug('pt', page), productSlug('es', page));
  }
});

test('o grupo da equipe só aparece no pt e com o Presencial ligado', () => {
  assert.deepEqual(
    productsFor('pt', { inPerson: false }).map((p) => p.id),
    ['tour', 'videos', 'instagram', 'autochat'],
  );
  assert.deepEqual(
    productsFor('pt', { inPerson: true }).map((p) => p.id),
    ['tour', 'videos', 'instagram', 'autochat', 'training', 'readyTour'],
  );
  assert.deepEqual(
    productsFor('es', { inPerson: true }).map((p) => p.id),
    ['tour', 'videos', 'instagram', 'autochat'],
  );
});

test('sem a opção inPerson, o grupo da equipe segue available.inPerson', () => {
  const hasTeam = (list: { group: string }[]) => list.some((p) => p.group === 'team');
  assert.equal(hasTeam(productsFor('pt')), available.inPerson);
  assert.equal(hasTeam(productsFor('pt', {})), available.inPerson);
  assert.equal(hasTeam(productsFor('es')), false);
});

test('links dos produtos', () => {
  assert.equal(productHref('pt', by('tour'), '/produtos'), '/');
  assert.equal(productHref('es', by('tour'), '/es/productos'), '/es');
  assert.equal(
    productHref('pt', by('instagram'), '/'),
    '/produtos/piloto-automatico-para-instagram',
  );
  assert.equal(productHref('pt', by('training'), '/'), '#presencial');
  assert.equal(productHref('pt', by('training'), '/produtos/autochat'), '/#presencial');
});

test('productText: o nome e a linha do idioma; o Presencial só existe em português', () => {
  assert.deepEqual(productText('pt', 'autochat'), {
    name: 'Autochat',
    line: 'Atende no WhatsApp e passa ao corretor.',
  });
  assert.equal(productText('es', 'tour')?.name, 'Tour virtual 360°');
  assert.equal(productText('pt', 'training')?.name, 'Treinamento da equipe');
  assert.equal(productText('pt', 'readyTour')?.name, 'Tour Pronto');
  assert.equal(productText('es', 'training'), undefined);
  assert.equal(productText('es', 'readyTour'), undefined);
  // Todo produto de um idioma tem texto nele.
  for (const locale of locales)
    for (const product of productsFor(locale, { inPerson: true }))
      assert.ok(productText(locale, product.id), `${locale}/${product.id}`);
});

test('o Presencial tem a mesma âncora nos dois idiomas', () => {
  for (const locale of locales) assert.equal(anchorId(locale, 'inPerson'), 'presencial');
});

test('links de seção do cabeçalho: ficam na página quando ela tem a seção', () => {
  assert.equal(sectionHref('pt', 'quote', '/'), '#cotacao');
  assert.equal(sectionHref('es', 'faq', '/es'), '#preguntas');
  assert.equal(sectionHref('pt', 'quote', '/termos-de-uso'), '/#cotacao');
  assert.equal(sectionHref('es', 'quote', '/es/tutoriales'), '/es#cotizacion');
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
      liveProductsFor('pt', { inPerson: false }).map((p) => p.id),
      ['tour', 'videos', 'autochat'],
    );
    assert.deepEqual(
      liveProductsFor('pt', { inPerson: true }).map((p) => p.id),
      ['tour', 'videos', 'autochat', 'training', 'readyTour'],
    );
    assert.deepEqual(
      liveProductsFor('es', { inPerson: true }).map((p) => p.id),
      ['tour', 'videos', 'autochat'],
    );
  });
});

// As páginas de produto: cada bloco de `productPages` do dicionário, nos dois idiomas.
type Leaf = [path: string, text: string];
const leaves = (value: unknown, path = ''): Leaf[] => {
  if (typeof value === 'string') return [[path, value]];
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
// As regras de texto da spec: sem "IA" nem o que a pasta de marketing proíbe, sem preço e sem o
// nome do site de referência. Cada regra vale também no espanhol: "generado", o euro com número
// e "desde" com preço.
const forbidden =
  /\bIA\b|\bAI\b|intelig[eê]ncia artificial|inteligente|gerad[oa]s?\b|generad[oa]s?\b|algoritmo|100% real|sem edição|sin edición|R\$\s*\d|€\s*\d|\d\s*€|(?:a partir de|desde)\s*(?:R\$|€)|\bPedra\b/i;

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

test('o texto das páginas de produto segue as regras da spec', () => {
  for (const locale of locales)
    for (const [id, page] of productPagesOf(locale))
      for (const [path, text] of leaves(page))
        assert.doesNotMatch(text, forbidden, `${locale}/${id}.${path}: "${text}"`);
});

test('as páginas de produto em espanhol não têm português nem CRECI', () => {
  for (const [id, page] of productPagesOf('es'))
    for (const [path, text] of leaves(page)) {
      assert.doesNotMatch(text, portugueseWords, `es/${id}.${path}: "${text}"`);
      assert.doesNotMatch(text, /CRECI/, `es/${id}.${path}: "${text}"`);
    }
});

test('o Piloto em português leva o CRECI', () => {
  assert.match(JSON.stringify(translations('pt').productPages.instagram), /CRECI/);
});

test('a descrição de cada tela de exemplo começa por "Exemplo:" no idioma', () => {
  assert.equal(translations('pt').products.example, 'Exemplo');
  assert.equal(translations('es').products.example, 'Ejemplo');
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

test('as artes do Piloto têm ids únicos, os mesmos e na mesma ordem nos dois idiomas', () => {
  const ids = (locale: (typeof locales)[number]) =>
    translations(locale).productPages.instagram.gallery.arts.map((art) => art.id);
  assert.equal(new Set(ids('pt')).size, ids('pt').length);
  assert.deepEqual(ids('es'), ids('pt'));
});

test('os formatos dos Vídeos são vertical, horizontal e o final, nessa ordem, nos dois idiomas', () => {
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

test('cada página de produto publicada tem texto nos dois idiomas', () => {
  const published = productPageIds.filter((page) => publishedPageIds.includes(page));
  assert.ok(published.includes('productInstagram'), 'o Piloto está publicado');
  assert.ok(published.includes('productVideos'), 'os Vídeos estão publicados');
  for (const locale of locales)
    for (const page of published)
      assert.ok(productPageText(locale, productOfPage(page)!.id), `${locale}: ${page}`);
  // Sem página própria (o tour), sem texto de página.
  assert.equal(productPageText('pt', 'tour'), undefined);
});
