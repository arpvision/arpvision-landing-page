import { track } from './analytics';
import { youtubeEmbed } from '../lib/business';

// Os tutoriais abrem num diálogo com o player do YouTube. O iframe só nasce no clique
// (nada do YouTube carrega antes) e sai ao fechar, o que também para o vídeo.
// Clique com Ctrl, ⌘, Shift ou o botão do meio segue o link e abre o YouTube.
const dialog = document.querySelector<HTMLDialogElement>('#tutorial-dialog');
const frame = dialog?.querySelector<HTMLElement>('[data-video-frame]');
const title = dialog?.querySelector<HTMLElement>('#tutorial-dialog-title');
let opener: HTMLElement | null = null;

document.querySelectorAll<HTMLAnchorElement>('[data-youtube]').forEach((link) =>
  link.addEventListener('click', (event) => {
    if (!dialog || !frame || !title) return;
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey)
      return;
    event.preventDefault();
    const iframe = document.createElement('iframe');
    iframe.src = youtubeEmbed(link.dataset.youtube!);
    iframe.title = link.dataset.title!;
    iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    frame.replaceChildren(iframe);
    title.textContent = link.dataset.title!;
    opener = link;
    dialog.showModal();
    track('tutorial_aberto', { video: link.dataset.tutorial! });
  }),
);
dialog?.addEventListener('close', () => {
  frame?.replaceChildren();
  opener?.focus();
  opener = null;
});
dialog?.querySelector('[data-close-dialog]')?.addEventListener('click', () => dialog.close());
// Tocar fora do vídeo, no fundo escurecido, também fecha.
dialog?.addEventListener('click', (event) => {
  if (event.target === dialog) dialog.close();
});
