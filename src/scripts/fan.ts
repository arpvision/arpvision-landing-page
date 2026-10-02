const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const hoverPointer = matchMedia('(hover: hover) and (pointer: fine)');

document.querySelectorAll<HTMLElement>('[data-fan]').forEach((fan) => {
  const stage = fan.querySelector<HTMLElement>('.fan-stage')!;
  const cards = [...fan.querySelectorAll<HTMLElement>('.fan-position')];
  const controls = [...fan.querySelectorAll<HTMLButtonElement>('[data-fan-select]')];
  let scrolling = false;
  let hovering = false;
  let touchPinned = false;
  let lastScrollY = scrollY;
  let closeTimer: number | undefined;
  let frame: number | undefined;
  const select = (index: number) => {
    cards.forEach((card, position) => card.toggleAttribute('data-selected', position === index));
    controls.forEach((button, position) =>
      button.setAttribute('aria-pressed', String(position === index)),
    );
  };
  const update = () => {
    const bounds = stage.getBoundingClientRect();
    const visible = bounds.top < innerHeight - 100 && bounds.bottom > 100;
    const focused = !!fan.querySelector(':focus-visible');
    const open =
      reducedMotion.matches || hovering || focused || touchPinned || (scrolling && visible);
    if (!open && fan.dataset.fanState === 'open') {
      cards.forEach((card) => card.removeAttribute('data-selected'));
      controls.forEach((button, index) =>
        button.setAttribute('aria-pressed', String(index === Math.floor(cards.length / 2))),
      );
    }
    fan.dataset.fanState = open ? 'open' : 'stacked';
  };
  const scheduleUpdate = () => {
    if (frame !== undefined) return;
    frame = requestAnimationFrame(() => {
      frame = undefined;
      update();
    });
  };
  window.addEventListener(
    'scroll',
    () => {
      if (scrollY === lastScrollY) return;
      lastScrollY = scrollY;
      scrolling = true;
      clearTimeout(closeTimer);
      // Completa os 900ms de abertura antes de recolher o leque.
      closeTimer = window.setTimeout(() => {
        scrolling = false;
        update();
      }, 1250);
      scheduleUpdate();
    },
    { passive: true },
  );
  window.addEventListener('resize', scheduleUpdate, { passive: true });
  stage.addEventListener('pointerenter', (event) => {
    if (!hoverPointer.matches || event.pointerType === 'touch') return;
    hovering = true;
    update();
  });
  stage.addEventListener('pointerleave', () => {
    hovering = false;
    update();
  });
  fan.addEventListener('focusin', scheduleUpdate);
  fan.addEventListener('focusout', scheduleUpdate);
  cards.forEach((card, index) =>
    card.addEventListener('focusin', () => {
      if (!hoverPointer.matches) select(index);
    }),
  );
  controls.forEach((button, index) =>
    button.addEventListener('click', () => {
      select(index);
      if (!hoverPointer.matches) touchPinned = true;
      update();
    }),
  );
  fan.addEventListener('click', () => {
    // Um toque permite ler os cartões sem depender do mouse.
    if (!hoverPointer.matches) {
      touchPinned = true;
      update();
    }
  });
  document.addEventListener('pointerdown', (event) => {
    if (fan.contains(event.target as Node)) return;
    touchPinned = false;
    scheduleUpdate();
  });
  reducedMotion.addEventListener('change', update);
  hoverPointer.addEventListener('change', () => {
    hovering = false;
    update();
  });
  window.addEventListener('pageshow', () => {
    scrolling = false;
    lastScrollY = scrollY;
    clearTimeout(closeTimer);
    update();
  });
  update();
});
