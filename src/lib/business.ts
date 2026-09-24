import { site } from '../config/site';

export const money = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 2,
  }).format(value);
export const appLink = (section: string, path: 'register' | 'login' = 'register') =>
  `${site.appUrl}/${path}?${new URLSearchParams({ utm_source: 'site', utm_medium: section, utm_campaign: 'landing' })}`;
export const whatsappLink = (
  message = 'Olá! Vim pelo site e quero saber mais sobre a ARP Vision.',
) => {
  const number = site.contact.whatsapp.replace(/\D/g, '');
  return number ? `https://wa.me/${number}?text=${encodeURIComponent(message)}` : '#contato';
};
export function calculateUsage(properties: number, rooms: number, agents: number) {
  const credits = properties * rooms;
  const plan = [...site.pricing.plans]
    .filter((p) => p.billing === 'monthly' && p.monthlyPrice !== null && p.credits !== null)
    .sort((a, b) => a.credits! - b.credits!)
    .find((p) => p.credits! >= credits);
  return {
    credits,
    plan: plan ?? null,
    perProperty: plan ? plan.monthlyPrice! / properties : null,
    twelveMonthPrice: plan ? plan.monthlyPrice! * 12 : null,
    cameraInvestment: agents * site.market.cameraPrice,
  };
}
export function founderMessage(data: {
  name: string;
  company: string;
  city: string;
  agents: string;
  phone: string;
}) {
  return `Olá! Quero participar do Programa Fundadores da ARP Vision.\nNome: ${data.name}\nEmpresa: ${data.company}\nCidade/UF: ${data.city}\nTamanho da equipe: ${data.agents}\nWhatsApp: ${data.phone}`;
}
