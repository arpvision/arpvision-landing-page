// Menu "Produtos". No desktop, o botão abre um painel que fica fora da cápsula do cabeçalho; no
// celular, um grupo dentro do menu. Os links do grupo fecham o menu como os outros (site.ts).
const header = document.querySelector<HTMLElement>('.site-header');
const toggle = document.querySelector<HTMLButtonElement>('[data-products-toggle]');
const panel = document.querySelector<HTMLElement>('#products-panel');

const isOpen = () => toggle?.getAttribute('aria-expanded') === 'true';
// O painel começa embaixo do botão, sem passar da borda direita do cabeçalho.
const place = () => {
  if (!header || !toggle || !panel) return;
  const headerBox = header.getBoundingClientRect();
  const left = toggle.getBoundingClientRect().left - headerBox.left;
  const room = headerBox.width - panel.offsetWidth;
  panel.style.setProperty('--products-left', `${Math.max(0, Math.min(left, room))}px`);
};
const setPanel = (open: boolean) => {
  if (!toggle || !panel) return;
  panel.hidden = !open;
  toggle.setAttribute('aria-expanded', String(open));
  if (open) place();
};

// Clique, Enter e Espaço chegam como clique no botão.
toggle?.addEventListener('click', () => setPanel(!isOpen()));
panel
  ?.querySelectorAll('a')
  .forEach((link) => link.addEventListener('click', () => setPanel(false)));
// Clique fora do painel e do botão fecha.
document.addEventListener('click', (event) => {
  if (isOpen() && !(event.target as Element).closest('#products-panel, [data-products-toggle]'))
    setPanel(false);
});
// O foco que volta do painel à cápsula do cabeçalho (no Esc, aqui, e no Tab, abaixo) não rola a
// página: com o `scroll-padding-top` do html, o navegador acharia o botão encoberto pelo cabeçalho
// fixo e subiria a página (uns 500 px no Chrome).
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && isOpen()) {
    setPanel(false);
    toggle?.focus({ preventScroll: true });
  }
});
// Com o painel aberto, o Tab segue a ordem da tela: do botão ao primeiro item e do último item ao
// link depois do botão (no HTML, o painel vem depois da cápsula).
toggle?.addEventListener('keydown', (event) => {
  const first = panel?.querySelector('a');
  if (event.key !== 'Tab' || event.shiftKey || !isOpen() || !first) return;
  event.preventDefault();
  first.focus();
});
panel?.addEventListener('keydown', (event) => {
  if (event.key !== 'Tab') return;
  const links = [...panel.querySelectorAll('a')];
  if (event.shiftKey && event.target === links[0]) {
    event.preventDefault();
    toggle?.focus({ preventScroll: true });
  } else if (!event.shiftKey && event.target === links.at(-1)) {
    event.preventDefault();
    setPanel(false);
    (toggle?.nextElementSibling as HTMLElement | null)?.focus({ preventScroll: true });
  }
});
window.addEventListener('resize', () => isOpen() && place(), { passive: true });
// Abaixo de 1024px o menu Produtos fica no menu do celular.
matchMedia('(max-width: 1023px)').addEventListener('change', (event) => {
  if (event.matches) setPanel(false);
});
// Na home, o cabeçalho sai de cena quando a pessoa desce a página (site.ts): o painel fecha junto,
// para não voltar aberto no meio da página.
if (header)
  new MutationObserver(() => {
    if (header.dataset.headerHidden === 'true' && isOpen()) setPanel(false);
  }).observe(header, { attributeFilter: ['data-header-hidden'] });

const mobileToggle = document.querySelector<HTMLButtonElement>('.mobile-products-toggle');
const mobileList = document.querySelector<HTMLElement>('#mobile-products-list');
mobileToggle?.addEventListener('click', () => {
  if (!mobileList) return;
  const open = mobileToggle.getAttribute('aria-expanded') !== 'true';
  mobileList.hidden = !open;
  mobileToggle.setAttribute('aria-expanded', String(open));
});
