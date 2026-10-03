const hoverPointer = matchMedia('(hover: hover) and (pointer: fine)');

// O leque fica na primeira tela e abre sozinho sempre que está visível. A primeira
// pintura sai empilhada (script inline do FanCards) e a abertura anima em seguida.
document.querySelectorAll<HTMLElement>('[data-fan]').forEach((fan) => {
  const stage = fan.querySelector<HTMLElement>('.fan-stage')!;
  const cards = [...fan.querySelectorAll<HTMLElement>('.fan-position')];
  const controls = [...fan.querySelectorAll<HTMLButtonElement>('[data-fan-select]')];
  let frame: number | undefined;
  const select = (index: number) => {
    cards.forEach((card, position) => card.toggleAttribute('data-selected', position === index));
    controls.forEach((button, position) =>
      button.setAttribute('aria-pressed', String(position === index)),
    );
  };
  const update = () => {
    const bounds = stage.getBoundingClientRect();
    const visible = bounds.top < innerHeight && bounds.bottom > 0;
    fan.dataset.fanState = visible ? 'open' : 'stacked';
  };
  const scheduleUpdate = () => {
    if (frame !== undefined) return;
    frame = requestAnimationFrame(() => {
      frame = undefined;
      update();
    });
  };
  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleUpdate, { passive: true });
  window.addEventListener('pageshow', scheduleUpdate);
  cards.forEach((card, index) =>
    card.addEventListener('focusin', () => {
      if (!hoverPointer.matches) select(index);
    }),
  );
  controls.forEach((button, index) => button.addEventListener('click', () => select(index)));
  // Dois quadros: garante que a pilha foi pintada antes de abrir (a transição aparece).
  requestAnimationFrame(() => requestAnimationFrame(update));
});
