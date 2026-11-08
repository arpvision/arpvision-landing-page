import test from 'node:test';
import assert from 'node:assert/strict';
import { available } from '../src/config/site';
import { locales } from '../src/i18n';
import { anchorId, publishedPageIds, routes, type PageId } from '../src/i18n/routes';
import {
  isLive,
  liveProductsFor,
  productGroups,
  productHref,
  productOfPage,
  productPageIds,
  products,
  productSlug,
  productsFor,
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
