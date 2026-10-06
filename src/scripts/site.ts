import { track } from './analytics';

// Tema: segue o sistema até a pessoa escolher; a escolha fica salva (aplicada no <head>).
const root = document.documentElement;
const systemDark = matchMedia('(prefers-color-scheme: dark)');
const themeButtons = document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]');
const isDark = () => (root.dataset.theme ? root.dataset.theme === 'dark' : systemDark.matches);
const syncThemeButtons = () =>
  themeButtons.forEach((button) => button.setAttribute('aria-pressed', String(isDark())));
themeButtons.forEach((button) =>
  button.addEventListener('click', () => {
    const theme = isDark() ? 'light' : 'dark';
    root.dataset.theme = theme;
    try {
      localStorage.setItem('theme', theme);
    } catch {}
    syncThemeButtons();
    track('tema_alterado', { tema: theme });
  }),
);
systemDark.addEventListener('change', syncThemeButtons);
syncThemeButtons();

// O vidro do cabeçalho deixa o fundo passar; a escrita acompanha a superfície atrás dele.
const header = document.querySelector<HTMLElement>('.site-header');
const opening = document.querySelector<HTMLElement>('.opening');
if (header && opening) {
  let pending = false;
  const updateHeader = () => {
    const top = parseFloat(getComputedStyle(header).top);
    const bottom = top + header.offsetHeight;
    // A cápsula acompanha apenas a abertura, incluindo o leque de fotos.
    // A altura de layout evita realimentar o cálculo com o próprio transform.
    const boundaryBottom = opening.getBoundingClientRect().bottom;
    const shift = Math.max(-bottom - 1, Math.min(0, boundaryBottom - bottom));
    header.dataset.headerSurface = boundaryBottom > 0 ? 'opening' : '';
    header.dataset.headerBounded = '';
    header.style.setProperty('--header-shift', `${shift}px`);
    const hidden = boundaryBottom <= 0;
    header.dataset.headerHidden = String(hidden);
    header.inert = hidden;
  };
  const scheduleHeader = () => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
      pending = false;
      updateHeader();
    });
  };
  window.addEventListener('scroll', scheduleHeader, { passive: true });
  window.addEventListener('resize', scheduleHeader, { passive: true });
  window.addEventListener('pageshow', scheduleHeader);
  updateHeader();
  void document.fonts.ready.then(updateHeader);
}

const menuButton = document.querySelector<HTMLButtonElement>('.menu-toggle');
const menu = document.querySelector<HTMLElement>('#mobile-nav');
const menuLabel = menuButton?.querySelector<HTMLElement>('[data-menu-label]');
const setMenu = (open: boolean) => {
  if (!menu || !menuButton) return;
  menu.hidden = !open;
  menuButton.setAttribute('aria-expanded', String(open));
  if (menuLabel) menuLabel.textContent = open ? 'Fechar' : 'Menu';
  // Com o menu aberto, a página por trás não rola.
  document.body.classList.toggle('menu-is-open', open);
};
menuButton?.addEventListener('click', () =>
  setMenu(menuButton.getAttribute('aria-expanded') !== 'true'),
);
menu?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenu(false)));
// Tocar fora do menu (e fora do cabeçalho) fecha o menu.
document.addEventListener('click', (event) => {
  if (!menu || menu.hidden) return;
  if (!(event.target as Element).closest('.site-header')) setMenu(false);
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menu && !menu.hidden) {
    setMenu(false);
    menuButton?.focus();
  }
});
matchMedia('(min-width: 1024px)').addEventListener('change', (event) => {
  if (event.matches) setMenu(false);
});

const contactDialog = document.querySelector<HTMLDialogElement>('#contact-dialog');
document.addEventListener('click', (event) => {
  const target = (event.target as Element).closest<HTMLElement>('[data-cta], [data-whatsapp]');
  if (target?.dataset.cta) track('cta_criar_conta', { secao: target.dataset.cta });
  if (target?.hasAttribute('data-whatsapp')) {
    if (target.dataset.contactPending === 'true') {
      event.preventDefault();
      contactDialog?.showModal();
    } else track('cta_whatsapp');
  }
});
contactDialog
  ?.querySelector('[data-close-dialog]')
  ?.addEventListener('click', () => contactDialog.close());
contactDialog?.addEventListener('click', (event) => {
  if (event.target === contactDialog) {
    const rect = contactDialog.getBoundingClientRect();
    if (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    )
      contactDialog.close();
  }
});

// Menu do desktop: destaca a seção que está na tela. Só atua em links cuja seção existe
// na página atual (na Home); o aria-current="page" de /planos não é tocado.
const spyLinks = [...document.querySelectorAll<HTMLAnchorElement>('.desktop-nav [data-spy]')]
  .map((link) => ({ link, section: document.getElementById(link.dataset.spy!) }))
  .filter((item): item is { link: HTMLAnchorElement; section: HTMLElement } => !!item.section);
if (spyLinks.length) {
  const spy = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const item = spyLinks.find(({ section }) => section === entry.target)!;
        if (entry.isIntersecting) {
          spyLinks.forEach(({ link }) => link.removeAttribute('aria-current'));
          item.link.setAttribute('aria-current', 'location');
        } else if (item.link.getAttribute('aria-current') === 'location') {
          item.link.removeAttribute('aria-current');
        }
      });
    },
    // Uma faixa estreita logo abaixo do cabeçalho define a seção "atual".
    { rootMargin: '-30% 0px -65% 0px' },
  );
  spyLinks.forEach(({ section }) => spy.observe(section));
}

// O botão flutuante sai de cena quando cobriria botões, formulário ou rodapé.
const floating = document.querySelector<HTMLElement>('.floating-whatsapp');
if (floating) {
  const visible = new Set<Element>();
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) =>
      entry.isIntersecting ? visible.add(entry.target) : visible.delete(entry.target),
    );
    floating.classList.toggle('is-hidden', visible.size > 0);
  });
  document
    .querySelectorAll('.hero-actions, .final-cta, .site-footer')
    .forEach((element) => observer.observe(element));
}

// Vídeos com data-autoplay tocam só enquanto estão na tela, nunca com movimento reduzido,
// e respeitam a pausa feita pelo botão.
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const onScreen = new Set<HTMLVideoElement>();
const pausedByUser = new WeakSet<HTMLVideoElement>();
const updateVideos = () =>
  document.querySelectorAll<HTMLVideoElement>('video[data-autoplay]').forEach((video) => {
    if (!motion.matches && onScreen.has(video) && !pausedByUser.has(video))
      void video.play().catch(() => {});
    else video.pause();
  });
const videoObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    const video = entry.target as HTMLVideoElement;
    if (entry.isIntersecting) onScreen.add(video);
    else onScreen.delete(video);
  });
  updateVideos();
});
document
  .querySelectorAll<HTMLVideoElement>('video[data-autoplay]')
  .forEach((video) => videoObserver.observe(video));
motion.addEventListener('change', updateVideos);
document.querySelectorAll<HTMLButtonElement>('[data-video-toggle]').forEach((button) => {
  const video = document.getElementById(button.dataset.videoToggle!) as HTMLVideoElement | null;
  if (!video) return;
  // Botão só com ícone: o nome acessível acompanha a ação e o CSS troca play/pausa.
  const update = () => {
    const label = video.paused ? 'Reproduzir vídeo' : 'Pausar vídeo';
    button.setAttribute('aria-label', label);
    button.title = label;
    button.dataset.playing = String(!video.paused);
  };
  button.addEventListener('click', () => {
    if (video.paused) {
      pausedByUser.delete(video);
      void video.play();
    } else {
      pausedByUser.add(video);
      video.pause();
    }
  });
  video.addEventListener('play', update);
  video.addEventListener('pause', update);
  update();
});
