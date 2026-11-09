/**
 * Conteúdo que junta os dados comerciais (`site.ts`) com o texto do idioma. A estrutura
 * (quais linhas, perguntas e valores) é uma só para todos os idiomas; só o texto muda.
 */
import { site, price, planById, type Plan } from '../config/site';
import { translations, type Dictionary, type Locale } from '../i18n';
import { faqPageSchema } from './schema';

export type FeatureValue = boolean | string;
export type FeatureGroupId = keyof Dictionary['features']['groups'];
export type FeatureRowId = keyof Dictionary['features']['rows'];
export interface FeatureGroup {
  id: FeatureGroupId;
  title: string;
  rows: { id: FeatureRowId; name: string; values: FeatureValue[] }[];
}

const plans = site.pricing.plans;
const all = plans.map(() => true);

/** Tabela de recursos de /planos: uma linha por recurso, um valor por plano. */
export function featureGroups(locale: Locale): FeatureGroup[] {
  const t = translations(locale).features;
  const each = (value: (plan: Plan) => FeatureValue) => plans.map(value);
  const structure: [FeatureGroupId, [FeatureRowId, FeatureValue[]][]][] = [
    [
      'plan',
      [
        [
          'price',
          each((p) =>
            p.billing === 'once'
              ? t.priceOnce(
                  price(p.pixPrice!),
                  p.installments!,
                  price(p.oneTimePrice! / p.installments!),
                )
              : p.billing === 'monthly'
                ? t.priceMonthly(price(p.monthlyPrice!))
                : t.onRequest,
          ),
        ],
        [
          'rooms',
          each((p) =>
            p.credits === null
              ? t.custom
              : p.billing === 'monthly'
                ? t.roomsMonthly(p.credits)
                : t.roomsOnce(p.credits),
          ),
        ],
        [
          'liveTours',
          each((p) =>
            p.liveTours === null
              ? t.byContract
              : p.billing === 'monthly'
                ? t.upTo(p.liveTours)
                : String(p.liveTours),
          ),
        ],
        ['duration', each((p) => translations(locale).plans[p.id].duration)],
        [
          'extraRoom',
          each((p) =>
            p.extraRoomPrice !== null
              ? t.perRoom(price(p.extraRoomPrice))
              : p.billing === 'custom'
                ? t.byContract
                : t.toBeDefined,
          ),
        ],
        [
          'renewal',
          each((p) =>
            p.billing === 'once'
              ? t.renewalOnce(price(p.renewalPrice!))
              : p.billing === 'monthly'
                ? t.renewalMonthly(price(p.renewalPrice!))
                : t.byContract,
          ),
        ],
      ],
    ],
    [
      'capture',
      [
        ['guidedCapture', all],
        ['autoFix', all],
        ['creditBack', all],
        ['gallery', all],
      ],
    ],
    [
      'sharing',
      [
        ['passages', all],
        ['publicLink', all],
        ['shareShortcut', all],
        ['embed', all],
        ['stats', each((p) => p.stats)],
      ],
    ],
    [
      'team',
      [
        ['sharedBalance', all],
        ['roles', all],
        ['drafts', all],
      ],
    ],
  ];
  return structure.map(([id, rows]) => ({
    id,
    title: t.groups[id],
    rows: rows.map(([rowId, values]) => ({ id: rowId, name: t.rows[rowId], values })),
  }));
}

/** Textos das condições comerciais com os valores de `site.pricing`. */
export function policies(locale: Locale) {
  const t = translations(locale).policies;
  const individual = planById('individual');
  // Nestes textos corridos o valor leva espaço comum ("R$ 229"), como antes de virem do
  // dicionário; o Intl põe um espaço inseparável (que \s também pega) entre "R$" e o número.
  const amount = (value: number) => price(value).replace(/\s/g, ' ');
  return {
    phoneRequirements: t.phoneRequirements,
    billing: t.billing({
      pix: amount(individual.pixPrice!),
      installments: individual.installments!,
      installment: amount(individual.oneTimePrice! / individual.installments!),
      professional: amount(planById('corretor').monthlyPrice!),
      business: amount(planById('imobiliaria').monthlyPrice!),
      discount: Math.round((site.pricing.annualDiscount ?? 0) * 100),
    }),
    cancellation: t.cancellation(
      site.pricing.cancellationNoticeDays,
      amount(planById('corretor').renewalPrice!),
    ),
    liveTourLimit: t.liveTourLimit,
    monthlyExtras: t.monthlyExtras(individual.credits!, amount(individual.extraRoomPrice!)),
    individualTerm: t.individualTerm(amount(individual.renewalPrice!)),
  };
}

/** Um FAQ só, em dois grupos, usado pela Home e por /planos. */
export function faqGroups(locale: Locale) {
  const t = translations(locale).faq;
  const conditions = policies(locale);
  const { freeTrialCredits, freeTrialDays, showPrices } = site.pricing;
  return [
    {
      title: t.groups.capture,
      items: [
        t.equipment,
        t.install,
        { question: t.compatibility.question, answer: conditions.phoneRequirements },
        t.duration,
        t.enhancement,
        t.camera,
        t.embed,
      ],
    },
    {
      title: showPrices ? t.groups.prices : t.groups.quote,
      items: [
        t.credit,
        ...(showPrices
          ? [
              { question: t.individual.question, answer: conditions.individualTerm },
              { question: t.payment.question, answer: conditions.billing },
            ]
          : [
              { question: t.cost.question, answer: t.cost.answer(freeTrialCredits, freeTrialDays) },
              t.payment,
            ]),
      ],
    },
  ];
}

export const faq = (locale: Locale) => faqGroups(locale).flatMap((group) => group.items);

/** FAQPage do Google com as perguntas do idioma da página. */
export const faqSchema = (locale: Locale) => faqPageSchema(faq(locale));
