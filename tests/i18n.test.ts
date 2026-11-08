import test from 'node:test';
import assert from 'node:assert/strict';
import { site, tutorials } from '../src/config/site';
import { appLanguageParam, locales, translations, type Locale } from '../src/i18n';
import { routes } from '../src/i18n/routes';
import { appLink, embedLink, whatsappLink } from '../src/lib/business';
import { faq, faqGroups, featureGroups, policies } from '../src/lib/content';
import { softwareApplicationSchema, websiteSchema } from '../src/lib/schema';
import { portugueseWords } from '../scripts/portuguese-words.mjs';

// Valor de teste para as funções do dicionário: vira "1" em qualquer texto e em qualquer campo.
const any: unknown = new Proxy(
  {},
  { get: (_, key) => (key === Symbol.toPrimitive ? () => 1 : any) },
);
type Entry = [path: string, value: unknown];
const walk = (value: unknown, path = ''): Entry[] => {
  if (typeof value === 'function')
    return walk(value(...Array.from({ length: value.length }, () => any)), `${path}()`);
  if (Array.isArray(value)) return value.flatMap((item, index) => walk(item, `${path}[${index}]`));
  if (value && typeof value === 'object')
    return Object.entries(value).flatMap(([key, item]) =>
      walk(item, path ? `${path}.${key}` : key),
    );
  return [[path, value]];
};
const texts = (locale: Locale) =>
  walk(translations(locale)).filter(
    (entry): entry is [string, string] => typeof entry[1] === 'string',
  );
// A forma do dicionário: chaves, tipos e funções, sem o texto.
const shape = (value: unknown): unknown => {
  if (typeof value === 'function') return `function/${value.length}`;
  if (Array.isArray(value)) return 'array';
  if (value === null) return 'null';
  if (typeof value === 'object')
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, shape(item)]));
  return typeof value;
};

test('o espanhol tem as mesmas chaves e funções do português, e nenhum texto vazio a mais', () => {
  const pt = shape(translations('pt')) as Record<string, unknown>;
  const es = shape(translations('es')) as Record<string, unknown>;
  // A conversa do WhatsApp é imagem em português e HTML em espanhol: é a única diferença.
  delete (pt.sharing as Record<string, unknown>).conversationImage;
  delete (es.sharing as Record<string, unknown>).conversationImage;
  assert.deepEqual(es, pt);
  const ptTexts = new Map(texts('pt'));
  for (const [path, value] of texts('es')) {
    if (ptTexts.get(path) === '') continue;
    assert.ok(value.trim(), `es: texto vazio em ${path}`);
  }
  // Listas com o mesmo número de itens: perguntas, opções e palavras do rolo.
  const ptList = walk(translations('pt')).map(([path]) => path);
  const esList = walk(translations('es')).map(([path]) => path);
  assert.deepEqual(
    esList.filter((path) => !path.startsWith('sharing.conversationImage')),
    ptList.filter((path) => !path.startsWith('sharing.conversationImage')),
  );
});

test('o espanhol não tem letras nem palavras do português e segue o glossário', () => {
  for (const [path, value] of texts('es'))
    assert.doesNotMatch(value, portugueseWords, `es.${path}: "${value}"`);
});

test('nenhum idioma fala em "IA" com o cliente', () => {
  for (const locale of locales)
    for (const [path, value] of texts(locale))
      assert.doesNotMatch(
        value,
        /\bIA\b|\bAI\b|intelig[eê]ncia artificial|inteligencia artificial/i,
        `${locale}.${path}`,
      );
});

test('o espanhol não promete o que o app não faz (comparar a original, chão completado)', () => {
  const answer = translations('es').faq.enhancement.answer;
  assert.doesNotMatch(answer, /original|compar|complet/i);
  assert.match(answer, /difuminado/);
  // O português continua como está: a mudança é só acrescentar o idioma.
  assert.match(translations('pt').faq.enhancement.answer, /compara as duas antes de publicar/);
});

test('cada idioma tem todas as páginas e âncoras, e o espanhol mora em /es', () => {
  const pages = Object.keys(routes.pt.pages).sort();
  const anchors = Object.keys(routes.pt.anchors).sort();
  for (const locale of locales) {
    assert.deepEqual(Object.keys(routes[locale].pages).sort(), pages);
    assert.deepEqual(Object.keys(routes[locale].anchors).sort(), anchors);
  }
  for (const path of Object.values(routes.es.pages)) assert.match(path, /^\/es(\/|$)/);
  assert.deepEqual(routes.es.pages, {
    home: '/es',
    plans: '/es/planes',
    tutorials: '/es/tutoriales',
    terms: '/es/terminos-de-uso',
    privacy: '/es/politica-de-privacidad',
    products: '/es/productos',
    productInstagram: '/es/productos/piloto-automatico-para-instagram',
    productAutochat: '/es/productos/autochat',
    productVideos: '/es/productos/videos-a-partir-de-fotos',
  });
  assert.equal(routes.es.anchors.quote, 'cotizacion');
  assert.equal(routes.pt.anchors.quote, 'cotacao');
});

test('links do app e tour embutido levam o idioma só fora do português', () => {
  assert.deepEqual(appLanguageParam('pt'), {});
  for (const route of ['register', 'login'] as const) {
    const pt = new URL(appLink('cabecalho', route, 'pt'));
    const es = new URL(appLink('cabecalho', route, 'es'));
    assert.equal(pt.searchParams.get('idioma'), null);
    assert.equal(es.searchParams.get('idioma'), 'es');
    assert.equal(es.searchParams.get('utm_medium'), 'cabecalho');
    assert.equal(es.pathname, `/${route}`);
  }
  assert.equal(appLink('cabecalho'), appLink('cabecalho', 'register', 'pt'));
  assert.equal(embedLink(site.media.heroEmbed, 'pt'), site.media.heroEmbed);
  assert.equal(embedLink(site.media.heroEmbed, 'es'), `${site.media.heroEmbed}?idioma=es`);
  assert.equal(
    embedLink('https://arpvision.app/embed/x?a=1', 'es'),
    'https://arpvision.app/embed/x?a=1&idioma=es',
  );
});

test('mensagens prontas do WhatsApp no idioma da página, para o mesmo número', () => {
  const pt = new URL(whatsappLink(translations('pt').quote.greeting));
  const es = new URL(whatsappLink(translations('es').quote.greeting));
  assert.equal(pt.pathname, es.pathname);
  assert.equal(
    es.searchParams.get('text'),
    '¡Hola! Vengo de la web y quiero un presupuesto de ARP Vision.',
  );
  assert.equal(whatsappLink('x', '#contacto').startsWith('https://wa.me/'), true);
});

test('créditos, dias de teste e preços saem de site.ts para os dois idiomas', () => {
  const { freeTrialCredits, freeTrialDays } = site.pricing;
  const pt = translations('pt');
  const es = translations('es');
  assert.equal(
    pt.quote.trial(freeTrialCredits, freeTrialDays),
    'Prefere testar antes? Crie sua conta grátis, fotografe 1 ambiente e deixe o tour no ar por 7 dias, sem pagar nada.',
  );
  assert.match(
    es.quote.trial(freeTrialCredits, freeTrialDays),
    /fotografía 1 estancia y deja el tour publicado durante 7 días/,
  );
  assert.match(es.quote.trial(2, 30), /2 estancias .* 30 días/);
  const cost = (locale: Locale) => faq(locale).find((item) => /custa|cuesta/.test(item.question));
  if (!site.pricing.showPrices) {
    assert.match(cost('pt')!.answer, new RegExp(`por ${freeTrialDays} dias`));
    assert.match(cost('es')!.answer, new RegExp(`durante ${freeTrialDays} días`));
  }
  for (const locale of locales) {
    const billing = policies(locale).billing.replace(/\s/g, ' ');
    assert.match(billing, /R\$ 229/);
    assert.match(billing, /R\$ 23,25/);
    assert.match(billing, /R\$ 249/);
    assert.match(billing, /R\$ 599/);
    assert.match(billing, /20 ?%/);
  }
  // Mesma estrutura de FAQ e de tabela nos dois idiomas.
  assert.deepEqual(
    faqGroups('es').map((group) => group.items.length),
    faqGroups('pt').map((group) => group.items.length),
  );
  assert.deepEqual(
    featureGroups('es').map((group) =>
      group.rows.map((row) => [row.id, row.values.filter((value) => typeof value === 'boolean')]),
    ),
    featureGroups('pt').map((group) =>
      group.rows.map((row) => [row.id, row.values.filter((value) => typeof value === 'boolean')]),
    ),
  );
});

test('títulos e descrições cabem no resultado de busca', () => {
  for (const locale of locales) {
    const t = translations(locale);
    assert.ok(
      t.home.description.length >= 140 && t.home.description.length <= 160,
      `${locale}: ${t.home.description.length}`,
    );
    for (const description of [
      t.plansPage.description,
      t.tutorials.description,
      t.legal.terms.description,
      t.legal.privacy.description,
    ])
      assert.ok(description.length <= 160, `${locale}: ${description}`);
    for (const title of [
      t.home.title,
      t.plansPage.title,
      t.tutorials.title,
      t.legal.terms.title,
      t.legal.privacy.title,
    ])
      assert.match(title, /ARP Vision/);
  }
});

test('cada tutorial tem título, descrição e seção nos dois idiomas, e o espanhol avisa que são em português', () => {
  for (const locale of locales) {
    const text = translations(locale).tutorials;
    // Nem vídeo sem texto, nem texto de vídeo que saiu de site.ts.
    assert.deepEqual(
      Object.keys(text.videos).sort(),
      tutorials.map((tutorial) => tutorial.id).sort(),
      locale,
    );
    for (const tutorial of tutorials) {
      assert.ok(text.videos[tutorial.id].title.trim(), `${locale}: ${tutorial.id}`);
      assert.ok(text.videos[tutorial.id].description.trim(), `${locale}: ${tutorial.id}`);
      assert.ok(text.sections[tutorial.section].trim(), `${locale}: ${tutorial.section}`);
    }
  }
  // Os vídeos são narrados em português: o espanhol diz isso na abertura e na busca, como o app.
  const es = translations('es').tutorials;
  assert.match(es.lead, /^Vídeos cortos, en portugués, /);
  assert.match(es.description, /^Vídeos cortos, en portugués, /);
});

test('dados estruturados no idioma da página', () => {
  assert.equal(websiteSchema('pt').inLanguage, 'pt-BR');
  assert.equal(websiteSchema('pt')['@id'], 'https://www.arpvision.com.br/#website');
  assert.equal(websiteSchema('es').inLanguage, 'es-ES');
  assert.equal(websiteSchema('es').url, 'https://www.arpvision.com.br/es');
  assert.equal(softwareApplicationSchema('home', 'es').inLanguage, 'es-ES');
  assert.equal(
    softwareApplicationSchema('home', 'es').description,
    translations('es').schema.appDescription,
  );
});
