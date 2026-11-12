import test from 'node:test';
import assert from 'node:assert/strict';
import { site, tutorials } from '../src/config/site';
import { appLanguageParam, localeInfo, locales, translations, type Locale } from '../src/i18n';
import { routes } from '../src/i18n/routes';
import {
  browserLocale,
  equivalentHref,
  languageChoiceKey,
  pageFromPath,
  suggestedLocale,
  suggestionText,
} from '../src/i18n/suggestion';
import { appLink, embedLink, whatsappLink } from '../src/lib/business';
import { faq, faqGroups, featureGroups, policies } from '../src/lib/content';
import { softwareApplicationSchema, websiteSchema } from '../src/lib/schema';
import { portugueseWordsIn } from '../scripts/portuguese-words.mjs';

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
// Os idiomas traduzidos do português.
const translated = locales.filter((locale) => locale !== 'pt');

test('espanhol e inglês têm as mesmas chaves e funções do português, e nenhum texto vazio a mais', () => {
  const pt = shape(translations('pt')) as Record<string, unknown>;
  // As únicas diferenças: a conversa do WhatsApp, imagem em português e HTML nos outros idiomas,
  // e o ARP Vision Presencial, que só existe em português (o teste abaixo): a seção da home e o
  // grupo "Com a nossa equipe" do menu Produtos.
  const onlyInOne = (path: string) =>
    path.startsWith('sharing.conversationImage') ||
    path.startsWith('inPerson') ||
    path.startsWith('products.inPerson');
  delete (pt.sharing as Record<string, unknown>).conversationImage;
  delete pt.inPerson;
  delete (pt.products as Record<string, unknown>).inPerson;
  const ptTexts = new Map(texts('pt'));
  const ptList = walk(translations('pt'))
    .map(([path]) => path)
    .filter((path) => !onlyInOne(path));
  for (const locale of translated) {
    const other = shape(translations(locale)) as Record<string, unknown>;
    delete (other.sharing as Record<string, unknown>).conversationImage;
    delete other.inPerson;
    delete (other.products as Record<string, unknown>).inPerson;
    assert.deepEqual(other, pt, locale);
    for (const [path, value] of texts(locale)) {
      if (ptTexts.get(path) === '') continue;
      assert.ok(value.trim(), `${locale}: texto vazio em ${path}`);
    }
    // Listas com o mesmo número de itens: perguntas, opções e palavras do rolo.
    assert.deepEqual(
      walk(translations(locale))
        .map(([path]) => path)
        .filter((path) => !onlyInOne(path)),
      ptList,
      locale,
    );
  }
});

test('o ARP Vision Presencial só aparece em português (atende Porto Alegre e região)', () => {
  assert.equal(translations('pt').inPerson?.eyebrow, 'ARP VISION PRESENCIAL');
  assert.equal(translations('pt').products.inPerson?.training.name, 'Treinamento da equipe');
  assert.equal(translations('pt').products.inPerson?.readyTour.name, 'Tour Pronto');
  for (const locale of translated) {
    assert.equal(translations(locale).inPerson, null, locale);
    assert.equal(translations(locale).products.inPerson, null, locale);
  }
});

test('espanhol e inglês sem letras nem palavras do português', () => {
  for (const locale of translated)
    for (const [path, value] of texts(locale))
      assert.doesNotMatch(value, portugueseWordsIn(locale), `${locale}.${path}: "${value}"`);
});

test('o inglês segue o glossário: room, enhance, tours live, sign in', () => {
  const en = translations('en');
  assert.equal(en.pricing.roomsMonthly(20), '20 rooms per month');
  assert.equal(en.pricing.toursMonthly(30), 'Up to 30 live tours');
  assert.equal(en.header.login, 'Sign in');
  assert.match(en.faq.enhancement.question, /enhancement/);
  assert.match(en.quote.trial(1, 7), /photograph 1 room and keep the tour live for 7 days/);
  assert.match(en.quote.trial(2, 30), /2 rooms .* 30 days/);
  // "Real estate" voltou com os produtos para imobiliárias, mas só em "real estate agency" (ou
  // "agencies"), que a seção Inglês da spec dos produtos pede na primeira menção de cada página.
  // No resto, imóvel é "property".
  for (const [path, value] of texts('en'))
    assert.doesNotMatch(
      value,
      /\b(?:environments?|cellphones?)\b|\breal estate\b(?! agenc)/i,
      `en.${path}`,
    );
});

test('nenhum idioma fala em "IA" com o cliente', () => {
  for (const locale of locales)
    for (const [path, value] of [...texts(locale), ...Object.entries(suggestionText[locale])])
      assert.doesNotMatch(
        value,
        /\bIA\b|\bAI\b|intelig[eê]ncia artificial|inteligencia artificial|artificial intelligence/i,
        `${locale}.${path}`,
      );
});

// O site voltou a falar com imobiliárias (06/11): nenhum texto chama o cliente pelo público
// genérico de antes ("o seu espaço", "seus espaços", "a sua empresa", "todo tamanho de negócio").
// A busca é pela palavra, em qualquer forma e caixa; antes dela, saem do texto os usos de hoje que
// não falam do cliente: a marca d'água de outra empresa, a conta de empresa do Instagram, a sede da
// própria ARP Vision e, no inglês, o plano Business (com maiúscula; "BUSINESS" num rótulo em caixa
// alta continua pego).
const oldAudience: Record<Locale, { words: RegExp; allowed: RegExp[] }> = {
  pt: {
    words: /(?<!\p{L})(?:espaços?|negócios?|empresas?)(?!\p{L})/iu,
    allowed: [/marca d'água de outra empresa/g, /^Empresa internacional com sede/g],
  },
  es: {
    words: /(?<!\p{L})(?:espacios?|negocios?|empresas?)(?!\p{L})/iu,
    allowed: [
      /\(de empresa o de creador de contenido\)/g,
      /marca de agua de otra empresa/g,
      /^Empresa internacional con sede/g,
    ],
  },
  en: {
    words: /(?<!\p{L})(?:spaces?|business(?:es)?|compan(?:y|ies))(?!\p{L})/iu,
    allowed: [
      /\bBusiness\b/g,
      /\(business or creator\)/g,
      /another company's watermark/g,
      /^An international company headquartered/g,
    ],
  },
};
// As promessas antigas da home: a volta não leva 30 segundos (medido no app, são cerca de 2 min
// por ambiente), e as 8 fotos não são regra (são 12 na lente comum).
const oldPromises: Record<Locale, RegExp> = {
  pt: /\b30 segundos\b|com 8 fotos/,
  es: /\b30 segundos\b|con 8 fotos/,
  en: /\b30 seconds\b|with 8 photos/,
};
/** A palavra do público antigo no texto, ou `undefined`. */
const oldAudienceIn = (locale: Locale, text: string) => {
  const { words, allowed } = oldAudience[locale];
  return allowed.reduce((rest, use) => rest.replace(use, ''), text).match(words)?.[0];
};
test('nenhum idioma fala com o público genérico de antes nem repete as promessas antigas', () => {
  for (const locale of locales)
    for (const [path, value] of texts(locale)) {
      assert.equal(oldAudienceIn(locale, value), undefined, `${locale}.${path}: "${value}"`);
      assert.doesNotMatch(value, oldPromises[locale], `${locale}.${path}: "${value}"`);
    }
});
// Frases do público antigo que a main tinha antes da volta às imobiliárias: o plural, o
// possessivo, a palavra sozinha e o rótulo em caixa alta.
test('o guarda do público antigo pega as frases de antes', () => {
  const before: Record<Locale, string[]> = {
    pt: [
      'Compare o que cada plano inclui para capturar e publicar seus espaços.',
      '1 crédito = 1 ambiente fotografado com o celular. O saldo é da sua empresa.',
      'tamanho de negócio',
      'Um espaço costuma ter de 6 a 10 ambientes.',
      'O PRÓXIMO PASSO DO SEU NEGÓCIO',
    ],
    es: [
      'Compara lo que incluye cada plan para capturar y publicar tus espacios.',
      '1 crédito = 1 estancia fotografiada con el móvil. El saldo es de tu empresa.',
      'Planes para negocios',
      'Un espacio suele tener de 6 a 10 estancias.',
      'EL PRÓXIMO PASO DE TU NEGOCIO',
    ],
    en: [
      'Compare what each plan includes to capture and publish your spaces.',
      '1 credit = 1 room photographed with your phone. The balance belongs to your company.',
      'Plans for businesses',
      'A space usually has 6 to 10 rooms.',
      'THE NEXT STEP FOR YOUR BUSINESS',
      'Spaces per month',
    ],
  };
  for (const locale of locales)
    for (const text of before[locale])
      assert.ok(oldAudienceIn(locale, text), `${locale}: o guarda deixa passar "${text}"`);
});

test('o aprimoramento não promete o que o app não faz (comparar a original, chão completado, móveis)', () => {
  const answer = (locale: Locale) => translations(locale).faq.enhancement.answer;
  assert.doesNotMatch(
    answer('pt'),
    /compara as duas antes de publicar|completado|sem criar móveis/,
  );
  assert.match(answer('pt'), /A foto original fica guardada\./);
  assert.match(answer('pt'), /No chão, o carimbo com o nome da sua imobiliária\./);
  assert.doesNotMatch(answer('es'), /sin crear muebles|original|compar|complet/i);
  assert.match(answer('es'), /difuminado/);
  // O inglês pode dizer que a foto original fica guardada (é verdade); o "original" fica de fora.
  assert.doesNotMatch(answer('en'), /without adding furniture|changing finishes|compar|complet/i);
  assert.match(answer('en'), /On the floor, a stamp with your agency's name\./);
});

test('cada idioma tem todas as páginas e âncoras; o espanhol mora em /es e o inglês em /en', () => {
  const pages = Object.keys(routes.pt.pages).sort();
  const anchors = Object.keys(routes.pt.anchors).sort();
  for (const locale of locales) {
    assert.deepEqual(Object.keys(routes[locale].pages).sort(), pages);
    assert.deepEqual(Object.keys(routes[locale].anchors).sort(), anchors);
  }
  for (const path of Object.values(routes.es.pages)) assert.match(path, /^\/es(\/|$)/);
  for (const path of Object.values(routes.en.pages)) assert.match(path, /^\/en(\/|$)/);
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
  // O app aponta para /en/terms-of-use e /en/privacy-policy: não mudar sem mudar o app.
  assert.deepEqual(routes.en.pages, {
    home: '/en',
    plans: '/en/plans',
    tutorials: '/en/tutorials',
    terms: '/en/terms-of-use',
    privacy: '/en/privacy-policy',
    products: '/en/products',
    productInstagram: '/en/products/autopilot-for-instagram',
    productAutochat: '/en/products/autochat',
    productVideos: '/en/products/videos-from-photos',
  });
  assert.deepEqual(
    [routes.pt.anchors.quote, routes.es.anchors.quote, routes.en.anchors.quote],
    ['cotacao', 'cotizacion', 'quote'],
  );
  assert.deepEqual([routes.en.anchors.howItWorks, routes.en.anchors.faq], ['how-it-works', 'faq']);
  // Cada idioma com o próprio lang, og:locale e código do seletor.
  assert.deepEqual(
    locales.map((locale) => [localeInfo[locale].lang, localeInfo[locale].ogLocale]),
    [
      ['pt-BR', 'pt_BR'],
      ['es-ES', 'es_ES'],
      ['en', 'en_US'],
    ],
  );
});

test('links do app e tour embutido levam o idioma só fora do português', () => {
  assert.deepEqual(appLanguageParam('pt'), {});
  for (const route of ['register', 'login'] as const) {
    const pt = new URL(appLink('cabecalho', route, 'pt'));
    assert.equal(pt.searchParams.get('idioma'), null);
    for (const locale of translated) {
      const url = new URL(appLink('cabecalho', route, locale));
      assert.equal(url.searchParams.get('idioma'), locale);
      assert.equal(url.searchParams.get('utm_medium'), 'cabecalho');
      assert.equal(url.pathname, `/${route}`);
    }
  }
  assert.equal(appLink('cabecalho'), appLink('cabecalho', 'register', 'pt'));
  assert.equal(embedLink(site.media.heroEmbed, 'pt'), site.media.heroEmbed);
  assert.equal(embedLink(site.media.heroEmbed, 'es'), `${site.media.heroEmbed}?idioma=es`);
  assert.equal(embedLink(site.media.heroEmbed, 'en'), `${site.media.heroEmbed}?idioma=en`);
  assert.equal(
    embedLink('https://arpvision.app/embed/x?a=1', 'en'),
    'https://arpvision.app/embed/x?a=1&idioma=en',
  );
});

test('mensagens prontas do WhatsApp no idioma da página, para o mesmo número', () => {
  const pt = new URL(whatsappLink(translations('pt').quote.greeting));
  const es = new URL(whatsappLink(translations('es').quote.greeting));
  const en = new URL(whatsappLink(translations('en').quote.greeting));
  assert.equal(pt.pathname, es.pathname);
  assert.equal(pt.pathname, en.pathname);
  assert.equal(
    es.searchParams.get('text'),
    '¡Hola! Vengo de la web y quiero un presupuesto de ARP Vision.',
  );
  assert.equal(
    en.searchParams.get('text'),
    "Hi! I came from the website and I'd like a quote from ARP Vision.",
  );
  assert.equal(
    translations('en').pricing.contactMessage('Business'),
    "Hi! I'm interested in the ARP Vision Business plan.",
  );
  assert.equal(whatsappLink('x', '#contacto').startsWith('https://wa.me/'), true);
});

// A faixa de números de uma opção da cotação: "Até 100", "101 a 500", "Mais de 500" e "3", nos
// três idiomas. Uma opção sem número ("Não sei", "Os dois") não é faixa.
const quoteRange = (option: string): [number, number] | null => {
  const upTo = option.match(/^(?:Até|Hasta|Up to) (\d+)$/);
  if (upTo) return [0, Number(upTo[1])];
  const between = option.match(/^(\d+) (?:a|to) (\d+)$/);
  if (between) return [Number(between[1]), Number(between[2])];
  const over = option.match(/^(?:Mais de|Más de|More than) (\d+)$/);
  if (over) return [Number(over[1]) + 1, Infinity];
  const exact = option.match(/^(\d+)$/);
  if (exact) return [Number(exact[1]), Number(exact[1])];
  return null;
};

// A resposta escolhida vai para a mensagem do WhatsApp: com "Até 100" e "100 a 500", quem tem 100
// contatos cabe nas duas, e a mensagem chega ambígua.
test('as faixas de número de cada pergunta da cotação não se sobrepõem', () => {
  const overlapping: string[] = [];
  for (const locale of locales) {
    const questions = new Map<string, string[]>();
    for (const [path, text] of texts(locale)) {
      const question = path.match(/^(.*\.options)\[\d+\]$/)?.[1];
      if (question) questions.set(question, [...(questions.get(question) ?? []), text]);
    }
    assert.ok(questions.size > 0, `${locale}: as perguntas da cotação`);
    for (const [question, options] of questions) {
      const ranges = options
        .filter((option) => /\d/.test(option))
        .map((option) => {
          const range = quoteRange(option);
          assert.ok(range, `${locale}.${question}: "${option}" não é uma faixa que o teste lê`);
          return range;
        })
        .sort((a, b) => a[0] - b[0]);
      if (ranges.some(([start], index) => index > 0 && start <= ranges[index - 1][1]))
        overlapping.push(`${locale}.${question}: ${options.join(' / ')}`);
    }
  }
  assert.deepEqual(overlapping, []);
});

test('créditos, dias de teste e preços saem de site.ts para todos os idiomas', () => {
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
  const cost = (locale: Locale) =>
    faq(locale).find((item) => /custa|cuesta|cost/.test(item.question));
  if (!site.pricing.showPrices) {
    assert.match(cost('pt')!.answer, new RegExp(`por ${freeTrialDays} dias`));
    assert.match(cost('es')!.answer, new RegExp(`durante ${freeTrialDays} días`));
    assert.match(cost('en')!.answer, new RegExp(`for ${freeTrialDays} days`));
  }
  for (const locale of locales) {
    const billing = policies(locale).billing.replace(/\s/g, ' ');
    assert.match(billing, /R\$ 229/);
    assert.match(billing, /R\$ 23,25/);
    assert.match(billing, /R\$ 249/);
    assert.match(billing, /R\$ 599/);
    assert.match(billing, /20 ?%/);
  }
  // Mesma estrutura de FAQ e de tabela em todos os idiomas.
  for (const locale of translated) {
    assert.deepEqual(
      faqGroups(locale).map((group) => group.items.length),
      faqGroups('pt').map((group) => group.items.length),
    );
    assert.deepEqual(
      featureGroups(locale).map((group) =>
        group.rows.map((row) => [row.id, row.values.filter((value) => typeof value === 'boolean')]),
      ),
      featureGroups('pt').map((group) =>
        group.rows.map((row) => [row.id, row.values.filter((value) => typeof value === 'boolean')]),
      ),
    );
  }
});

test('títulos e descrições cabem no resultado de busca', () => {
  for (const locale of locales) {
    const t = translations(locale);
    // As páginas de produto que já têm texto.
    const productMeta = Object.values(t.productPages).map((page) => page.meta);
    assert.ok(productMeta.length > 0, `${locale}: páginas de produto`);
    assert.ok(
      t.home.description.length >= 140 && t.home.description.length <= 160,
      `${locale}: ${t.home.description.length}`,
    );
    for (const description of [
      t.meta.defaultDescription,
      t.plansPage.description,
      t.tutorials.description,
      t.legal.terms.description,
      t.legal.privacy.description,
      t.productsPage.meta.description,
      ...productMeta.map((meta) => meta.description),
    ])
      assert.ok(description.length <= 160, `${locale}: ${description}`);
    for (const title of [
      t.home.title,
      t.plansPage.title,
      t.tutorials.title,
      t.legal.terms.title,
      t.legal.privacy.title,
      t.productsPage.meta.title,
      ...productMeta.map((meta) => meta.title),
    ])
      assert.match(title, /ARP Vision/);
  }
});

test('cada tutorial tem título, descrição e seção em todos os idiomas, e os traduzidos avisam que são em português', () => {
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
  // Os vídeos são narrados em português: os outros idiomas dizem isso na abertura e na busca,
  // como o app.
  const es = translations('es').tutorials;
  assert.match(es.lead, /^Vídeos cortos, en portugués, /);
  assert.match(es.description, /^Vídeos cortos, en portugués, /);
  const en = translations('en').tutorials;
  assert.match(en.lead, /^Short videos, in Portuguese, /);
  assert.match(en.description, /^Short videos, in Portuguese, /);
  // Os títulos, as descrições e as seções são os da aba Tutorials do app (TUTORIAIS no en.json).
  assert.deepEqual(en.videos, {
    'do-novo-tour-a-publicacao': {
      title: 'From New tour to publishing',
      description: 'The whole path: capture, rooms, passages and publishing.',
    },
    'app-na-tela-de-inicio': {
      title: 'The app on your Home Screen',
      description: 'Open ARP Vision with one tap, full screen, on iPhone.',
    },
  });
  assert.deepEqual(en.sections, { start: 'Getting started', app: 'App tips' });
  assert.equal(en.close, 'Close the video');
  assert.equal(en.watchLabel('T', '0:41'), 'Watch: T (0:41)');
});

test('dados estruturados no idioma da página', () => {
  assert.equal(websiteSchema('pt').inLanguage, 'pt-BR');
  assert.equal(websiteSchema('pt')['@id'], 'https://www.arpvision.com.br/#website');
  assert.equal(websiteSchema('es').inLanguage, 'es-ES');
  assert.equal(websiteSchema('es').url, 'https://www.arpvision.com.br/es');
  assert.equal(websiteSchema('en').inLanguage, 'en');
  assert.equal(websiteSchema('en').url, 'https://www.arpvision.com.br/en');
  for (const locale of translated) {
    assert.equal(softwareApplicationSchema('home', locale).inLanguage, localeInfo[locale].lang);
    assert.equal(
      softwareApplicationSchema('home', locale).description,
      translations(locale).schema.appDescription,
    );
  }
});

test('faixa de sugestão: o texto de cada idioma, no próprio idioma', () => {
  assert.equal(languageChoiceKey, 'arpvision-idioma');
  assert.deepEqual(suggestionText, {
    pt: {
      text: 'Esta página também está em português.',
      link: 'Ver em português',
      close: 'Fechar',
      label: 'Idioma',
    },
    es: {
      text: 'Esta página también está en español.',
      link: 'Ver en español',
      close: 'Cerrar',
      label: 'Idioma',
    },
    en: {
      text: 'This page is also available in English.',
      link: 'View in English',
      close: 'Close',
      label: 'Language',
    },
  });
  for (const locale of translated)
    for (const value of Object.values(suggestionText[locale]))
      assert.doesNotMatch(value, portugueseWordsIn(locale), `${locale}: ${value}`);
  // O texto da faixa não está nos dicionários: só entra na página pelo navegador.
  for (const locale of locales)
    for (const [, value] of texts(locale))
      for (const offer of locales) assert.notEqual(value, suggestionText[offer].text);
});

test('faixa de sugestão: o primeiro idioma do site na lista do navegador, ou o inglês', () => {
  assert.equal(browserLocale(['es-ES', 'en-US']), 'es');
  assert.equal(browserLocale(['de-DE', 'pt-PT', 'en']), 'pt');
  assert.equal(browserLocale(['EN-gb']), 'en');
  assert.equal(browserLocale(['es-419']), 'es');
  assert.equal(browserLocale(['fr-FR', 'de']), 'en');
  assert.equal(browserLocale([]), 'en');
  // Aparece só quando o navegador prefere outro idioma e ninguém escolheu ainda.
  assert.equal(suggestedLocale('pt', ['es-ES'], null), 'es');
  assert.equal(suggestedLocale('es', ['en-US', 'es'], null), 'en');
  assert.equal(suggestedLocale('pt', ['pt-BR', 'en'], null), null);
  assert.equal(suggestedLocale('en', ['de-DE'], null), null);
  assert.equal(suggestedLocale('pt', ['de-DE'], null), 'en');
  assert.equal(suggestedLocale('pt', ['es-ES'], 'pt'), null);
  assert.equal(suggestedLocale('pt', ['es-ES'], 'es'), null);
});

test('faixa de sugestão: leva à mesma página e à âncora equivalente no outro idioma', () => {
  assert.equal(pageFromPath('pt', '/'), 'home');
  assert.equal(pageFromPath('es', '/es/'), 'home');
  assert.equal(pageFromPath('en', '/en/terms-of-use/'), 'terms');
  assert.equal(pageFromPath('pt', '/pagina-que-nao-existe'), undefined);
  assert.equal(pageFromPath('pt', '/es'), undefined);
  assert.equal(equivalentHref('pt', 'es', 'home', ''), '/es');
  assert.equal(equivalentHref('pt', 'es', 'home', '#cotacao'), '/es#cotizacion');
  assert.equal(equivalentHref('es', 'en', 'home', '#preguntas'), '/en#faq');
  assert.equal(equivalentHref('en', 'pt', 'home', '#how-it-works'), '/#como-funciona');
  assert.equal(
    equivalentHref('en', 'pt', 'privacy', '#content'),
    '/politica-de-privacidade#conteudo',
  );
  // Âncora fora do mapa de rotas: sem âncora.
  assert.equal(equivalentHref('pt', 'en', 'home', '#compartilhamento'), '/en');
  assert.equal(equivalentHref('pt', 'en', 'tutorials', '#app-na-tela-de-inicio'), '/en/tutorials');
  assert.equal(equivalentHref('pt', 'en', 'home', '#%E0%A4%A'), '/en');
});
