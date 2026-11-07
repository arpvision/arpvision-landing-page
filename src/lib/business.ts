import { site } from '../config/site';

export const money = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 2,
  }).format(value);
export const appLink = (section: string, path: 'register' | 'login' = 'register') =>
  `${site.appUrl}/${path}?${new URLSearchParams({ utm_source: 'site', utm_medium: section, utm_campaign: 'landing' })}`;
// Player do YouTube para os tutoriais. O domínio nocookie só grava cookie depois do play;
// playsinline toca dentro da página no iPhone; rel=0 encerra com vídeos do próprio canal.
export const youtubeEmbed = (id: string) =>
  `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&playsinline=1&rel=0`;
// Sem JavaScript, ou com Ctrl/⌘ no clique, o tutorial abre no próprio YouTube.
export const youtubeWatch = (id: string) => `https://www.youtube.com/watch?v=${id}`;
// Duração em segundos: "2:14" no cartão, "PT2M14S" nos dados estruturados.
export const clockDuration = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
export const isoDuration = (seconds: number) =>
  `PT${seconds >= 60 ? `${Math.floor(seconds / 60)}M` : ''}${seconds % 60}S`;
export const whatsappLink = (
  message = 'Olá! Vim pelo site e quero saber mais sobre a ARP Vision.',
) => {
  const number = site.contact.whatsapp.replace(/\D/g, '');
  return number ? `https://wa.me/${number}?text=${encodeURIComponent(message)}` : '#contato';
};
// Preço no plano anual: valor mensal com desconto (arredondado em centavos) e total do ano.
export const annualPricing = (monthlyPrice: number, discount: number) => {
  const perMonth = Math.round(monthlyPrice * (1 - discount) * 100) / 100;
  return { perMonth, perYear: Math.round(perMonth * 12 * 100) / 100 };
};
export function calculateUsage(properties: number, rooms: number) {
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
  };
}
