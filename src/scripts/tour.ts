import type { PageTour } from '../config/site';
import { fill } from '../i18n/fill';
import { track } from './analytics';
import { setupTabs } from './tabs';
const root = document.querySelector<HTMLElement>('[data-tour]');
if (root) {
  const tours: PageTour[] = JSON.parse(root.dataset.tours!);
  const qrCodes: string[] = JSON.parse(root.dataset.qrs ?? '[]');
  // Texto no idioma da página (data-messages) e o idioma do tour embutido (data-embed-query).
  const text: Record<string, string> = JSON.parse(root.dataset.messages ?? '{}');
  const embedQuery = root.dataset.embedQuery ? `?${root.dataset.embedQuery}` : '';
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
  const fail = (tour: PageTour) => {
    clean();
    status.hidden = false;
    status.replaceChildren(document.createTextNode(text.failed));
    const link = document.createElement('a');
    link.href = tour.publicUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = text.newTab;
    status.append(link);
    openButton.focus();
  };
  const open = () => {
    const tour = tours[selected];
    if (!tour) {
      status.hidden = false;
      status.textContent = text.pending;
      return;
    }
    clean();
    status.hidden = false;
    status.textContent = text.loading;
    const iframe = document.createElement('iframe');
    iframe.title = fill(text.frameTitle, { name: tour.name });
    iframe.allow = 'fullscreen';
    iframe.allowFullscreen = true;
    iframe.loading = 'lazy';
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.src = `https://arpvision.app/embed/${encodeURIComponent(tour.id)}${embedQuery}`;
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
      overlay.setAttribute('aria-label', fill(text.dialogLabel, { name: tour.name }));
      const close = document.createElement('button');
      close.className = 'tour-close button button-white';
      close.textContent = text.closeDialog;
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
    img.alt = fill(text.coverAlt, { name: tour.name });
    root.querySelector('[data-tour-name]')!.textContent = tour.name;
    root.querySelector('[data-tour-phone]')!.textContent = fill(text.phone, { phone: tour.phone });
    root.querySelector('[data-tour-photos]')!.textContent = fill(text.photos, {
      photos: tour.photosPerRoom,
    });
    root.querySelector('[data-tour-time]')!.textContent = fill(text.time, {
      time: tour.captureTime,
    });
    const qrLink = root.querySelector<HTMLAnchorElement>('.tour-qr');
    if (qrLink) {
      qrLink.href = tour.publicUrl;
      const qrImage = qrLink.querySelector<HTMLImageElement>('img')!;
      if (qrCodes[index]) qrImage.src = qrCodes[index];
    }
    if (wasOpen) open();
  });
}
