import { site } from '../config/site';
import { localeInfo, translations, type Locale } from '../i18n';
import { pagePath } from '../i18n/routes';
import { appLink } from './business';

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
