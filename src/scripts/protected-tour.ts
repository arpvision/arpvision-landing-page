document.querySelectorAll<HTMLElement>('[data-protected-tour]').forEach((host) => {
  const frame = host.querySelector<HTMLIFrameElement>('iframe')!;
  const shield = host.querySelector<HTMLElement>('[data-tour-shield]')!;
  const activate = host.querySelector<HTMLButtonElement>('[data-tour-activate]')!;
  const lock = host.querySelector<HTMLButtonElement>('[data-tour-lock]')!;
  host.dataset.enhanced = 'true';
  const setActive = (active: boolean, restoreFocus = false) => {
    host.dataset.tourActive = String(active);
    activate.setAttribute('aria-expanded', String(active));
    frame.inert = !active;
    frame.tabIndex = active ? 0 : -1;
    shield.hidden = active;
    if (active) frame.focus({ preventScroll: true });
    else if (restoreFocus) activate.focus({ preventScroll: true });
  };
  activate.addEventListener('click', () => setActive(true));
  lock.addEventListener('click', () => setActive(false, true));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && host.dataset.tourActive === 'true') setActive(false, true);
  });
  document.addEventListener('pointerdown', (event) => {
    if (!host.contains(event.target as Node)) setActive(false);
  });
  // Rolar a página retoma a proteção, sem recarregar ou perder o ambiente do iframe.
  window.addEventListener(
    'scroll',
    () => {
      if (host.dataset.tourActive === 'true') setActive(false);
    },
    { passive: true },
  );
});
