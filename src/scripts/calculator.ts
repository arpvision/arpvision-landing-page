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
    const result = calculateUsage(value('properties'), value('rooms'));
    set('credits', result.credits.toLocaleString('pt-BR'));
    set('plan', result.plan?.name ?? 'Enterprise');
    root.querySelector('[data-summary="credits"]')!.textContent =
      result.credits.toLocaleString('pt-BR');
    root.querySelector('[data-summary="plan"]')!.textContent = result.plan?.name ?? 'Enterprise';
    root.querySelectorAll<HTMLInputElement>('[data-range]').forEach((range) => {
      const min = Number(range.min);
      const fill = ((Number(range.value) - min) / (Number(range.max) - min)) * 100;
      range.style.setProperty('--fill', `${fill}%`);
    });
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
      'annual-label',
      result.plan
        ? `12 mensalidades de ARP Vision · ${result.plan.name}`
        : '12 mensalidades de ARP Vision · Enterprise',
    );
    set('year', result.twelveMonthPrice !== null ? money(result.twelveMonthPrice) : 'Sob consulta');
    const cta = root.querySelector<HTMLAnchorElement>('[data-result="cta"]')!;
    const contact = !result.plan;
    // Troca só o texto: o ícone de seta continua no botão.
    cta.querySelector('[data-cta-label]')!.textContent = contact
      ? 'Falar sobre um plano para minha equipe'
      : `Começar com o plano ${result.plan!.name}`;
    cta.href = contact
      ? whatsappLink(`Olá! Preciso de ${result.credits} créditos por mês.`)
      : appLink('calculadora');
    cta.toggleAttribute('data-whatsapp', contact);
    if (contact) {
      delete cta.dataset.cta;
      if (!site.contact.whatsapp) cta.dataset.contactPending = 'true';
      // Como os outros links de WhatsApp: abre em nova aba.
      else Object.assign(cta, { target: '_blank', rel: 'noopener noreferrer' });
    } else {
      cta.dataset.cta = 'calculadora';
      delete cta.dataset.contactPending;
      cta.removeAttribute('target');
      cta.removeAttribute('rel');
    }
  };
  for (const id of ['properties', 'rooms']) {
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
