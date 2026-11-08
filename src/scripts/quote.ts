import { track } from './analytics';

// Cotação: cada resposta entra na mensagem do WhatsApp e na prévia, na hora. A saudação e o
// fecho vêm da página (data-greeting e data-closing), no idioma dela.
document.querySelectorAll<HTMLElement>('[data-quote]').forEach((card) => {
  const preview = card.querySelector<HTMLElement>('[data-quote-preview]')!;
  const link = card.querySelector<HTMLAnchorElement>('.quote-submit')!;
  const questions = [...card.querySelectorAll<HTMLFieldSetElement>('fieldset[data-summary]')];
  const answers = () =>
    questions.flatMap((question) => {
      const checked = question.querySelector<HTMLInputElement>('input:checked');
      return checked ? [[question.dataset.summary!, checked.value] as const] : [];
    });
  const update = () => {
    const chosen = answers();
    const message = chosen.length
      ? [
          card.dataset.greeting,
          ...chosen.map(([label, value]) => `• ${label}: ${value}`),
          card.dataset.closing,
        ].join('\n')
      : card.dataset.greeting!;
    preview.textContent = message;
    // Sem WhatsApp configurado o link abre o aviso de contato; não há o que atualizar.
    if (!link.href.startsWith('https://wa.me/')) return;
    // Mesmo formato do whatsappLink(): espaços como %20, não "+".
    link.href = `${link.href.split('?')[0]}?text=${encodeURIComponent(message)}`;
  };
  card.addEventListener('change', update);
  // O produto vem do cartão (data-product); a cotação da Home, sem ele, é a do tour.
  link.addEventListener('click', () =>
    track('cotacao_whatsapp', {
      ...Object.fromEntries(answers().map(([label, value]) => [label, value])),
      produto: card.dataset.product ?? 'tour',
    }),
  );
  // O navegador pode restaurar as escolhas ao voltar para a página.
  update();
});
