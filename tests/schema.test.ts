import test from 'node:test';
import assert from 'node:assert/strict';
import { portugueseWords } from '../scripts/portuguese-words.mjs';
import { available } from '../src/config/site';
import { locales, translations } from '../src/i18n';
import { publishedPageIds, type PageId } from '../src/i18n/routes';
import { faq, faqSchema } from '../src/lib/content';
import { liveProductsFor, productPageText, productText } from '../src/lib/products';
import { faqPageSchema, itemListSchema, serviceSchema } from '../src/lib/schema';

// O texto que uma pessoa lê no JSON-LD: tudo, menos endereços e tipos. É a regra do check-site.mjs,
// que deixa estas chaves de fora porque "arpvision.com.br" casa "com" na lista de palavras do
// português, sem ser texto em português.
const addressKeys = ['@context', '@type', '@id', 'url', 'logo', 'email'];
const readable = (value: unknown, key = ''): string[] => {
  if (typeof value === 'string') return addressKeys.includes(key) ? [] : [value];
  if (value && typeof value === 'object')
    return Object.entries(value).flatMap(([child, item]) => readable(item, child));
  return [];
};

// Só o que está publicado entra nas listas. Troca publishedPageIds por uma lista conhecida e
// devolve a original no fim, como tests/products.test.ts, para continuar valendo quando as
// páginas de produto forem entrando.
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

type ItemList = {
  '@type': string;
  itemListElement: { '@type': string; position: number; name: string; url: string }[];
};

test('Service do Autochat em es', () => {
  const s = serviceSchema('autochat', 'es');
  assert.equal(s['@type'], 'Service');
  assert.deepEqual(s.provider, { '@id': 'https://www.arpvision.com.br/#organization' });
  assert.equal(s.inLanguage, 'es-ES');
  assert.equal(s.url, 'https://www.arpvision.com.br/es/productos/autochat');
  assert.deepEqual(s.audience, { '@type': 'BusinessAudience', audienceType: 'Inmobiliarias' });
  for (const text of readable(s)) assert.doesNotMatch(text, portugueseWords, `es: "${text}"`);
  assert.doesNotMatch(JSON.stringify(s), /offers/);
});

test('Service do Piloto em pt: nome e descrição da página, público, idioma e endereço absoluto', () => {
  const s = serviceSchema('instagram', 'pt');
  assert.equal(s['@type'], 'Service');
  // O título da página sem a marca, que já está no provider.
  assert.equal(s.name, 'Piloto automático para Instagram de imobiliárias');
  assert.equal(
    s.description,
    'A ARP Vision prepara o mês de posts e stories do Instagram da sua imobiliária, com seus imóveis e sua região. Você aprova e a ARP Vision publica.',
  );
  assert.equal(s.inLanguage, 'pt-BR');
  assert.equal(s.url, 'https://www.arpvision.com.br/produtos/piloto-automatico-para-instagram');
  assert.deepEqual(s.provider, { '@id': 'https://www.arpvision.com.br/#organization' });
  assert.deepEqual(s.audience, { '@type': 'BusinessAudience', audienceType: 'Imobiliárias' });
  assert.doesNotMatch(JSON.stringify(s), /offers/);
});

test('Service do Piloto em es: o texto da página em espanhol', () => {
  const s = serviceSchema('instagram', 'es');
  const { meta } = translations('es').productPages.instagram;
  assert.equal(s.name, 'Piloto automático para Instagram de inmobiliarias');
  assert.equal(`${s.name} | ARP Vision`, meta.title);
  assert.equal(s.description, meta.description);
  assert.equal(s.url, 'https://www.arpvision.com.br/es/productos/piloto-automatico-para-instagram');
  for (const text of readable(s)) assert.doesNotMatch(text, portugueseWords, `es: "${text}"`);
});

test('Service de um produto sem texto no idioma é erro, e não um JSON-LD vazio', () => {
  assert.throws(() => serviceSchema('training', 'es'), /training/);
});

test('cada produto com página tem um Service no idioma dela, sem oferta', () => {
  // O endereço de cada página, pelo idioma: o inglês tem os próprios nomes.
  type PageProduct = 'videos' | 'instagram' | 'autochat';
  const addresses: Record<(typeof locales)[number], Record<PageProduct, string>> = {
    pt: {
      videos: '/produtos/videos-a-partir-de-fotos',
      instagram: '/produtos/piloto-automatico-para-instagram',
      autochat: '/produtos/autochat',
    },
    es: {
      videos: '/es/productos/videos-a-partir-de-fotos',
      instagram: '/es/productos/piloto-automatico-para-instagram',
      autochat: '/es/productos/autochat',
    },
    en: {
      videos: '/en/products/videos-from-photos',
      instagram: '/en/products/autopilot-for-instagram',
      autochat: '/en/products/autochat',
    },
  };
  for (const locale of locales)
    for (const [id, address] of Object.entries(addresses[locale]) as [PageProduct, string][]) {
      const s = serviceSchema(id, locale);
      // Com texto de página, o nome e a descrição saem dela; antes disso, do menu Produtos.
      const meta = productPageText(locale, id)?.meta;
      const item = translations(locale).products.items[id];
      assert.equal(
        s.name,
        meta ? meta.title.replace(/ \| ARP Vision$/, '') : item.name,
        `${locale}/${id}: nome`,
      );
      assert.equal(
        s.description,
        meta ? meta.description : item.line,
        `${locale}/${id}: descrição`,
      );
      assert.equal(s.url, `https://www.arpvision.com.br${address}`, `${locale}/${id}: endereço`);
      assert.doesNotMatch(JSON.stringify(s), /offers/, `${locale}/${id}`);
    }
});

test('ItemList do pt segue os produtos no ar e deixa o Presencial desligado de fora', () => {
  const list = itemListSchema('pt') as ItemList;
  assert.equal(list['@type'], 'ItemList');
  const live = liveProductsFor('pt');
  assert.equal(list.itemListElement.length, live.length, 'um item por produto no ar');
  assert.ok(list.itemListElement.length >= 1);
  assert.deepEqual(
    list.itemListElement.map((item) => item.position),
    live.map((_, index) => index + 1),
  );
  const names = list.itemListElement.map((item) => item.name);
  assert.deepEqual(
    names,
    live.map((product) => productText('pt', product.id)?.name),
    'nomes na ordem do menu',
  );
  // Os dois itens do Presencial só entram com ele ligado (`available.inPerson`).
  const presencial = translations('pt').products.inPerson!;
  assert.equal(names.includes(presencial.training.name), available.inPerson);
  assert.equal(names.includes(presencial.readyTour.name), available.inPerson);
  for (const item of list.itemListElement) {
    assert.equal(item['@type'], 'ListItem');
    assert.match(item.url, /^https:\/\/www\.arpvision\.com\.br\//);
  }
  // O tour é o primeiro e leva à home.
  assert.equal(list.itemListElement[0].url, 'https://www.arpvision.com.br/');
});

test('ItemList com os três produtos publicados tem 4 itens, com endereços absolutos', () => {
  assert.equal(
    available.inPerson,
    false,
    'com o Presencial ligado a lista ganha os dois itens da equipe: atualize este teste',
  );
  withPublished(
    ['home', 'productVideos', 'productInstagram', 'productAutochat', 'products'],
    () => {
      const pt = itemListSchema('pt') as ItemList;
      assert.deepEqual(
        pt.itemListElement.map(({ position, name, url }) => [position, name, url]),
        [
          [1, 'Tour virtual 360°', 'https://www.arpvision.com.br/'],
          [
            2,
            'Vídeos a partir de fotos',
            'https://www.arpvision.com.br/produtos/videos-a-partir-de-fotos',
          ],
          [
            3,
            'Piloto automático para Instagram',
            'https://www.arpvision.com.br/produtos/piloto-automatico-para-instagram',
          ],
          [4, 'Autochat', 'https://www.arpvision.com.br/produtos/autochat'],
        ],
      );
      const es = itemListSchema('es') as ItemList;
      assert.deepEqual(
        es.itemListElement.map(({ url }) => url),
        [
          'https://www.arpvision.com.br/es',
          'https://www.arpvision.com.br/es/productos/videos-a-partir-de-fotos',
          'https://www.arpvision.com.br/es/productos/piloto-automatico-para-instagram',
          'https://www.arpvision.com.br/es/productos/autochat',
        ],
      );
      for (const text of readable(es)) assert.doesNotMatch(text, portugueseWords, `es: "${text}"`);
    },
  );
});

test('ItemList não lista produto cuja página ainda não foi publicada', () => {
  withPublished(['home', 'productAutochat'], () => {
    assert.deepEqual(
      (itemListSchema('pt') as ItemList).itemListElement.map((item) => item.name),
      ['Tour virtual 360°', 'Autochat'],
    );
  });
});

test('faqSchema da home continua igual', () => {
  assert.deepEqual(faqSchema('pt'), faqPageSchema(faq('pt')));
  // E continua com a forma de antes: o JSON-LD da home sai igual, até na ordem das chaves.
  for (const locale of locales) {
    const before = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faq(locale).map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: { '@type': 'Answer', text: item.answer },
      })),
    };
    assert.equal(JSON.stringify(faqSchema(locale)), JSON.stringify(before), locale);
  }
});

test('faqPageSchema monta o FAQPage com os itens que recebe', () => {
  const s = faqPageSchema([
    { question: 'Pergunta 1?', answer: 'Resposta 1.' },
    { question: 'Pergunta 2?', answer: 'Resposta 2.' },
  ]) as { '@type': string; mainEntity: { name: string; acceptedAnswer: { text: string } }[] };
  assert.equal(s['@type'], 'FAQPage');
  assert.deepEqual(
    s.mainEntity.map((q) => [q.name, q.acceptedAnswer.text]),
    [
      ['Pergunta 1?', 'Resposta 1.'],
      ['Pergunta 2?', 'Resposta 2.'],
    ],
  );
  assert.equal('inLanguage' in s, false);
});
