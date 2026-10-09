import { site } from '../config/site';
import { appLink } from './business';

// Dados estruturados (JSON-LD). Os `@id` ligam empresa, site e app num só grafo para o Google.
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

export const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${home}#website`,
  name: site.name,
  url: home,
  inLanguage: 'pt-BR',
  publisher: { '@id': organizationId },
};

export const softwareApplicationSchema = (section: string) => ({
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: site.name,
  url: home,
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  inLanguage: 'pt-BR',
  description:
    'Tour virtual 360° de espaços usando o celular, com captura guiada e aprimoramento automático.',
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
        description:
          plan.billing === 'once'
            ? 'Pagamento único por 1 tour no ar por 1 ano: à vista no Pix ou em 12x no cartão. Renovação anual à parte.'
            : 'Assinatura mensal no cartão; tours no ar enquanto a assinatura estiver ativa, dentro do limite do plano.',
        url: appLink(section),
      })),
  }),
});
