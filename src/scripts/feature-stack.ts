const stackViewport = matchMedia('(min-width: 1024px) and (min-height: 650px)');
const stackMotion = matchMedia('(prefers-reduced-motion: reduce)');

document.querySelectorAll<HTMLElement>('[data-feature-scroll]').forEach((section) => {
  const pin = section.querySelector<HTMLElement>('.feature-pin')!;
  const cards = [...section.querySelectorAll<HTMLElement>('.feature-position')];
  let offsets: number[] = [];
  let travel = 0;
  let scheduled = false;
  const render = () => {
    if (section.dataset.stackEnhanced !== 'true') return;
    const top = parseFloat(getComputedStyle(pin).top);
    const progress = Math.max(0, Math.min(travel, top - section.getBoundingClientRect().top));
    cards.forEach((card, index) => {
      card.style.transform = `translateY(${Math.max(index * 22, offsets[index] - progress)}px)`;
    });
  };
  const measure = () => {
    const enabled = stackViewport.matches && !stackMotion.matches;
    section.dataset.stackEnhanced = String(enabled);
    cards.forEach((card) => card.style.removeProperty('transform'));
    if (!enabled) {
      section.style.removeProperty('--stack-travel');
      return;
    }
    let offset = 0;
    offsets = cards.map((card) => {
      const start = offset;
      offset += card.offsetHeight + 18;
      return start;
    });
    travel = offsets.at(-1)! - (cards.length - 1) * 22;
    section.style.setProperty('--stack-travel', `${travel + 160}px`);
    render();
  };
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      render();
    });
  };
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', measure, { passive: true });
  stackViewport.addEventListener('change', measure);
  stackMotion.addEventListener('change', measure);
  cards.forEach((card, index) =>
    card.addEventListener('focusin', () => {
      if (section.dataset.stackEnhanced !== 'true' || !card.querySelector(':focus-visible')) return;
      // Tab leva cada cartão para a posição de leitura dentro da seção fixa.
      const top = parseFloat(getComputedStyle(pin).top);
      const destination =
        scrollY + section.getBoundingClientRect().top - top + offsets[index] - index * 22;
      scrollTo({ top: destination, behavior: 'instant' });
      render();
    }),
  );
  measure();
  void document.fonts.ready.then(measure);
});
