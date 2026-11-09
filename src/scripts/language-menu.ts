// Seletor de idioma compacto do cabeçalho (<details>): abre e fecha pelo próprio navegador,
// também pelo teclado. Aqui ele ganha o que um menu suspenso precisa: Escape fecha e devolve
// o foco ao botão; clicar fora ou levar o foco para fora também fecha.
document.querySelectorAll<HTMLDetailsElement>('[data-language-menu]').forEach((menu) => {
  const summary = menu.querySelector('summary');
  menu.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !menu.open) return;
    event.preventDefault();
    // Sem propagar: o Escape não chega ao menu do celular nem aos diálogos.
    event.stopPropagation();
    menu.open = false;
    summary?.focus();
  });
  menu.addEventListener('focusout', (event) => {
    const next = event.relatedTarget as Node | null;
    if (menu.open && next && !menu.contains(next)) menu.open = false;
  });
  document.addEventListener('click', (event) => {
    if (menu.open && !menu.contains(event.target as Node)) menu.open = false;
  });
});
