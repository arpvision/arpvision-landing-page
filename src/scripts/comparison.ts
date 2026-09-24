import type { ComparisonPair } from '../config/site';
import { track } from './analytics';
import { setupTabs } from './tabs';
const root = document.querySelector<HTMLElement>('[data-comparison]');
if (root) {
  const pairs: ComparisonPair[] = JSON.parse(root.dataset.pairs!);
  const frame = root.querySelector<HTMLElement>('.comparison-frame')!;
  const range = root.querySelector<HTMLInputElement>('.comparison-range')!;
  const update = () => {
    frame.style.setProperty('--position', `${range.value}%`);
    range.setAttribute('aria-valuetext', `${range.value}% da montagem automática visível`);
  };
  range.addEventListener('input', update);
  range.addEventListener('change', () => track('antes_depois_usado'));
  const activate = (index: number) => {
    const pair = pairs[index];
    const before = root.querySelector<HTMLImageElement>('[data-before]')!;
    const after = root.querySelector<HTMLImageElement>('[data-after]')!;
    before.src = pair.before;
    after.src = pair.after;
    before.alt = `${pair.name}: montagem automática${pair.illustrative ? ' — imagem ilustrativa' : ''}`;
    after.alt = `${pair.name}: com a IA da ARP Vision${pair.illustrative ? ' — imagem ilustrativa' : ''}`;
    const markers = root.querySelector('[data-markers]')!;
    const legend = root.querySelector('[data-legend]')!;
    markers.replaceChildren();
    legend.replaceChildren();
    pair.markers.forEach((marker, i) => {
      const span = document.createElement('span');
      span.className = 'defect-marker';
      span.style.left = `${marker.x}%`;
      span.style.top = `${marker.y}%`;
      span.textContent = String(i + 1);
      span.title = marker.label;
      markers.append(span);
      const li = document.createElement('li');
      li.textContent = marker.label;
      legend.append(li);
    });
    root.querySelector('[data-comparison-disclaimer]')!.textContent = pair.illustrative
      ? 'Prévia da interação · mesma foto ilustrativa nos dois lados. Pares reais a definir.'
      : 'Recortes do mesmo ambiente e enquadramento.';
    range.value = '50';
    update();
  };
  setupTabs(root, '[data-pair-index]', activate);
  activate(0);
}
