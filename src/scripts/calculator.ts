import { calculateUsage, money, appLink, whatsappLink } from '../lib/business';
import { site } from '../config/site';
import { track } from './analytics';
const root = document.querySelector<HTMLElement>('[data-calculator]');
if (root) {
  const value = (id: string) =>
    Number(root.querySelector<HTMLInputElement>(`[data-number="${id}"]`)!.value);
  const set = (name: string, text: string) => {
    root.querySelector(`[data-result="${name}"]`)!.textContent = text;
  };
  const update = () => {
    const agents = value('agents');
    const result = calculateUsage(value('properties'), value('rooms'), agents);
    set('credits', result.credits.toLocaleString('pt-BR'));
    set('plan', result.plan?.name ?? 'Enterprise');
    set(
      'per-property',
      result.perProperty !== null
        ? `${money(result.perProperty)} por espaço no plano recomendado`
        : 'Custo por espaço sob consulta.',
    );
    set(
      'tour-limit',
      result.plan
        ? `Até ${result.plan.liveTours} tours publicados no ar.`
        : 'Limite de tours combinado em contrato.',
    );
    set(
      'camera',
      `${agents} × ${money(site.market.cameraPrice)} = ${money(result.cameraInvestment)}`,
    );
    set(
      'annual-label',
      result.plan
        ? `12 mensalidades de ARP Vision · ${result.plan.name}`
        : '12 mensalidades de ARP Vision · Enterprise',
    );
    set('year', result.twelveMonthPrice !== null ? money(result.twelveMonthPrice) : 'Sob consulta');
    const cta = root.querySelector<HTMLAnchorElement>('[data-result="cta"]')!;
    const contact = !result.plan;
    cta.textContent = contact
      ? 'Falar sobre um plano para minha equipe'
      : `Começar com o plano ${result.plan!.name}`;
    cta.href = contact
      ? whatsappLink(
          `Olá! Preciso de ${result.credits} créditos por mês para uma equipe de ${agents} pessoas.`,
        )
      : appLink('calculadora');
    cta.toggleAttribute('data-whatsapp', contact);
    if (contact) {
      delete cta.dataset.cta;
      if (!site.contact.whatsapp) cta.dataset.contactPending = 'true';
    } else {
      cta.dataset.cta = 'calculadora';
      delete cta.dataset.contactPending;
    }
  };
  for (const id of ['agents', 'properties', 'rooms']) {
    const number = root.querySelector<HTMLInputElement>(`[data-number="${id}"]`)!;
    const range = root.querySelector<HTMLInputElement>(`[data-range="${id}"]`)!;
    const sync = (source: HTMLInputElement, target: HTMLInputElement, commit: boolean) => {
      if (source.value === '' && !commit) return;
      const entered = Number(source.value);
      if (
        (!Number.isFinite(entered) ||
          entered < Number(source.min) ||
          entered > Number(source.max)) &&
        !commit
      )
        return;
      const bounded = Math.min(
        Number(source.max),
        Math.max(Number(source.min), Math.round(entered || Number(source.min))),
      );
      source.value = target.value = String(bounded);
      update();
    };
    range.addEventListener('input', () => sync(range, number, true));
    number.addEventListener('input', () => sync(number, range, false));
    number.addEventListener('change', () => sync(number, range, true));
    for (const input of [range, number])
      input.addEventListener('change', () =>
        track('calculadora_usada', { creditos: value('properties') * value('rooms') }),
      );
  }
  update();
}
