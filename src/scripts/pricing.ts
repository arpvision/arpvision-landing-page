// Carrossel de planos no celular: abre no plano recomendado e mostra "Plano X de Y".
// No desktop a grade não rola e os controles ficam ocultos via CSS.
document.querySelectorAll<HTMLElement>('[data-pricing]').forEach((root) => {
  const grid = root.querySelector<HTMLElement>('[data-pricing-grid]')!;
  const cards = [...grid.querySelectorAll<HTMLElement>('.plan-card')];
  const status = root.querySelector<HTMLElement>('[data-carousel-status]')!;
  const prev = root.querySelector<HTMLButtonElement>('[data-carousel-prev]')!;
  const next = root.querySelector<HTMLButtonElement>('[data-carousel-next]')!;
  const isCarousel = () => grid.scrollWidth > grid.clientWidth + 1;
  const offsetOf = (card: HTMLElement) =>
    card.offsetLeft - grid.offsetLeft - parseFloat(getComputedStyle(grid).scrollPaddingLeft || '0');
  const current = () => {
    // O último card não chega a alinhar à esquerda: no fim da rolagem, ele é o atual.
    if (grid.scrollLeft >= grid.scrollWidth - grid.clientWidth - 2) return cards.length - 1;
    let index = 0;
    cards.forEach((card, i) => {
      if (offsetOf(card) <= grid.scrollLeft + 10) index = i;
    });
    return index;
  };
  const go = (index: number) => {
    const card = cards[Math.max(0, Math.min(cards.length - 1, index))];
    // scrollTo no próprio carrossel: não mexe na rolagem vertical da página.
    grid.scrollTo({ left: offsetOf(card), behavior: 'smooth' });
  };
  const update = () => {
    const index = current();
    const name = cards[index].querySelector('h3')?.textContent?.trim() ?? '';
    status.textContent = `${name} · plano ${index + 1} de ${cards.length}`;
    prev.disabled = index === 0;
    next.disabled = index === cards.length - 1;
  };
  prev.addEventListener('click', () => go(current() - 1));
  next.addEventListener('click', () => go(current() + 1));
  let frame = 0;
  grid.addEventListener(
    'scroll',
    () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    },
    { passive: true },
  );
  const recommended = cards.findIndex((card) => card.classList.contains('recommended'));
  if (isCarousel() && recommended > 0) grid.scrollLeft = offsetOf(cards[recommended]);
  update();
});
