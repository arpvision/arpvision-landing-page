import type { DemoTour } from '../config/site';
import { track } from './analytics';
import { setupTabs } from './tabs';
const root = document.querySelector<HTMLElement>('[data-tour]');
if (root) {
  const tours: DemoTour[] = JSON.parse(root.dataset.tours!);
  const qrCodes: string[] = JSON.parse(root.dataset.qrs ?? '[]');
  let selected = 0;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  let activeFrame: HTMLIFrameElement | null = null;
  let overlay: HTMLDialogElement | null = null;
  const cover = root.querySelector<HTMLElement>('[data-tour-cover]')!;
  const host = root.querySelector<HTMLElement>('[data-tour-host]')!;
  const status = root.querySelector<HTMLElement>('[data-tour-status]')!;
  const openButton = root.querySelector<HTMLButtonElement>('[data-tour-open]')!;
  const clean = () => {
    if (timeout) clearTimeout(timeout);
    activeFrame?.remove();
    activeFrame = null;
    if (overlay) {
      const dialog = overlay;
      overlay = null;
      dialog.close();
      dialog.remove();
      document.body.classList.remove('tour-is-open');
    }
    host.hidden = true;
    cover.hidden = false;
  };
  const fail = (tour: DemoTour) => {
    clean();
    status.hidden = false;
    status.replaceChildren(document.createTextNode('Não foi possível abrir o tour agora. '));
    const link = document.createElement('a');
    link.href = tour.publicUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'Abrir em nova aba';
    status.append(link);
    openButton.focus();
  };
  const open = () => {
    const tour = tours[selected];
    if (!tour) {
      status.hidden = false;
      status.textContent =
        'O tour real ainda está em preparação. Esta capa é ilustrativa. Volte em breve para explorar um espaço capturado com a ARP Vision.';
      return;
    }
    clean();
    status.hidden = false;
    status.textContent = 'Abrindo o espaço…';
    const iframe = document.createElement('iframe');
    iframe.title = `Tour 360° de exemplo: ${tour.name}`;
    iframe.allow = 'fullscreen';
    iframe.allowFullscreen = true;
    iframe.loading = 'lazy';
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.src = `https://arpvision.app/embed/${encodeURIComponent(tour.id)}`;
    activeFrame = iframe;
    iframe.addEventListener(
      'load',
      () => {
        if (iframe !== activeFrame) return;
        if (timeout) clearTimeout(timeout);
        status.hidden = true;
      },
      { once: true },
    );
    iframe.addEventListener(
      'error',
      () => {
        if (iframe === activeFrame) fail(tour);
      },
      { once: true },
    );
    // O breakpoint usa a largura efetiva do visualizador: um iframe <768px gira no app.
    if (host.parentElement!.getBoundingClientRect().width < 768) {
      overlay = document.createElement('dialog');
      overlay.className = 'tour-dialog';
      overlay.setAttribute('aria-label', `Tour de ${tour.name}`);
      const close = document.createElement('button');
      close.className = 'tour-close button button-white';
      close.textContent = 'Fechar tour ×';
      const dialog = overlay;
      const dismiss = () => {
        clean();
        status.hidden = true;
        openButton.focus();
      };
      close.addEventListener('click', dismiss);
      dialog.addEventListener('cancel', (event) => {
        event.preventDefault();
        dismiss();
      });
      dialog.append(close, iframe);
      document.body.append(dialog);
      document.body.classList.add('tour-is-open');
      dialog.showModal();
      close.focus();
      track('tour_tela_cheia', { tour: tour.id });
    } else {
      cover.hidden = true;
      host.hidden = false;
      host.append(iframe);
    }
    timeout = setTimeout(() => {
      if (iframe === activeFrame) fail(tour);
    }, 15000);
    track('tour_aberto', { tour: tour.id });
  };
  openButton.addEventListener('click', open);
  setupTabs(root, '[data-tour-index]', (index) => {
    const wasOpen = !!activeFrame;
    clean();
    status.hidden = true;
    selected = index;
    const tour = tours[index];
    const img = root.querySelector<HTMLImageElement>('[data-tour-image]')!;
    img.src = tour.cover;
    img.alt = `Vista do espaço ${tour.name}`;
    root.querySelector('[data-tour-name]')!.textContent = tour.name;
    root.querySelector('[data-tour-phone]')!.textContent = `Celular: ${tour.phone}`;
    root.querySelector('[data-tour-photos]')!.textContent =
      `${tour.photosPerRoom} fotos por ambiente`;
    root.querySelector('[data-tour-time]')!.textContent =
      `Captura: ${tour.captureTime} por ambiente`;
    const qrLink = root.querySelector<HTMLAnchorElement>('.tour-qr');
    if (qrLink) {
      qrLink.href = tour.publicUrl;
      const qrImage = qrLink.querySelector<HTMLImageElement>('img')!;
      if (qrCodes[index]) qrImage.src = qrCodes[index];
    }
    if (wasOpen) open();
  });
}
