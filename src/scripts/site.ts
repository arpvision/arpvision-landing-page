import { track } from './analytics';

const menuButton = document.querySelector<HTMLButtonElement>('.menu-toggle');
const menu = document.querySelector<HTMLElement>('#mobile-nav');
const setMenu = (open: boolean) => {
  if (!menu || !menuButton) return;
  menu.hidden = !open;
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
};
menuButton?.addEventListener('click', () =>
  setMenu(menuButton.getAttribute('aria-expanded') !== 'true'),
);
menu?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenu(false)));
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

const motion = matchMedia('(prefers-reduced-motion: reduce)');
const updateVideos = () =>
  document.querySelectorAll<HTMLVideoElement>('video[data-autoplay]').forEach((video) => {
    if (motion.matches) video.pause();
    else void video.play().catch(() => {});
  });
updateVideos();
motion.addEventListener('change', updateVideos);
document.querySelectorAll<HTMLButtonElement>('[data-video-toggle]').forEach((button) => {
  const video = document.getElementById(button.dataset.videoToggle!) as HTMLVideoElement | null;
  if (!video) return;
  const update = () => {
    button.textContent = video.paused ? 'Reproduzir vídeo' : 'Pausar vídeo';
    button.setAttribute('aria-pressed', String(!video.paused));
  };
  button.addEventListener('click', () => {
    if (video.paused) void video.play();
    else video.pause();
  });
  video.addEventListener('play', update);
  video.addEventListener('pause', update);
  update();
});
