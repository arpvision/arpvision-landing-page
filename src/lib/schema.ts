import { site } from '../config/site';
import { localeInfo, translations, type Locale } from '../i18n';
import { pagePath } from '../i18n/routes';
import { appLink } from './business';
import {
  liveProductsFor,
  products,
  productHref,
  productText,
  type Product,
  type ProductId,
} from './products';

// Dados estruturados (JSON-LD). Os `@id` ligam empresa, site e app num só grafo para o Google.
// A empresa é uma só; cada idioma é um WebSite com a própria Home e o próprio `inLanguage`.
const home = new URL('/', site.domain).href;
const organizationId = `${home}#organization`;

export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': organizationId,
  name: site.name,
  url: home,
  ...(site.brand.logoBlue ? { logo: new URL(site.brand.logoBlue, site.domain).href } : {}),
  ...(site.contact.email ? { email: site.contact.email } : {}),
  ...(site.contact.whatsapp ? { telephone: `+${site.contact.whatsapp.replace(/\D/g, '')}` } : {}),
};

const homeOf = (locale: Locale) => new URL(pagePath(locale, 'home'), site.domain).href;

export const websiteSchema = (locale: Locale) => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${homeOf(locale)}#website`,
  name: site.name,
  url: homeOf(locale),
  inLanguage: localeInfo[locale].lang,
  publisher: { '@id': organizationId },
});

// O endereço absoluto do destino do produto: a página dele, ou a seção da home (o Presencial).
// Sem página atual (""), o endereço leva sempre o caminho inteiro, e nunca só a âncora.
const productUrl = (locale: Locale, product: Product) =>
  new URL(productHref(locale, product, ''), site.domain).href;

/**
 * Um produto como serviço da empresa, para o público da imobiliária. Sem `offers`: os preços não
 * são públicos. Enquanto a página do produto não tem `meta` própria no dicionário, o nome e a
 * descrição saem do texto do menu Produtos (`products.items`).
 */
export function serviceSchema(product: ProductId, locale: Locale): Record<string, unknown> {
  const item = products.find((candidate) => candidate.id === product);
  const text = productText(locale, product);
  if (!item || !text) throw new Error(`Sem texto do produto "${product}" em ${locale}`);
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: text.name,
    description: text.line,
    provider: { '@id': organizationId },
    audience: {
      '@type': 'BusinessAudience',
      audienceType: translations(locale).products.audience,
    },
    url: productUrl(locale, item),
    inLanguage: localeInfo[locale].lang,
  };
}

/** A lista dos produtos que já estão no ar, na ordem do menu (a página com todos os produtos). */
export function itemListSchema(locale: Locale): Record<string, unknown> {
  const listed = liveProductsFor(locale).flatMap((product) => {
    const text = productText(locale, product.id);
    return text ? [{ name: text.name, url: productUrl(locale, product) }] : [];
  });
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: listed.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      ...item,
    })),
  };
}

/** FAQPage do Google com as perguntas que aparecem na página. */
export function faqPageSchema(
  items: { question: string; answer: string }[],
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}

export const softwareApplicationSchema = (section: string, locale: Locale) => {
  const t = translations(locale).schema;
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: site.name,
    url: homeOf(locale),
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    inLanguage: localeInfo[locale].lang,
    description: t.appDescription,
    publisher: { '@id': organizationId },
    // Sem preços públicos, nenhuma oferta com valor vai para o Google.
    ...(site.pricing.showPrices && {
      offers: site.pricing.plans
        .filter((plan) => plan.billing !== 'custom')
        .map((plan) => ({
          '@type': 'Offer',
          name: plan.name,
          price: plan.billing === 'once' ? plan.pixPrice : plan.monthlyPrice,
          priceCurrency: 'BRL',
          description: plan.billing === 'once' ? t.offerOnce(plan.installments!) : t.offerMonthly,
          url: appLink(section, 'register', locale),
        })),
    }),
  };
};
