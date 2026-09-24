import { founderMessage, whatsappLink } from '../lib/business';
import { track } from './analytics';
const form = document.querySelector<HTMLFormElement>('[data-founders-form]');
form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const status = form.querySelector<HTMLElement>('[data-form-status]')!;
  const button = form.querySelector<HTMLButtonElement>('[type="submit"]')!;
  const data = new FormData(form);
  const phoneDigits = String(data.get('phone')).replace(/\D/g, '');
  if (
    phoneDigits.length < 10 ||
    phoneDigits.length > 13 ||
    !/^[+0-9()\s-]+$/.test(String(data.get('phone')))
  ) {
    status.textContent = 'Confira o WhatsApp: informe o número com DDD.';
    form.querySelector<HTMLInputElement>('[name="phone"]')!.focus();
    return;
  }
  const payload = {
    name: String(data.get('name')).trim(),
    company: String(data.get('company')).trim(),
    city: String(data.get('city')).trim(),
    agents: String(data.get('agents')),
    phone: String(data.get('phone')).trim(),
  };
  if (!payload.name || !payload.company || !payload.city) {
    status.textContent = 'Preencha nome, empresa e cidade com informações válidas.';
    return;
  }
  if (!form.dataset.endpoint) {
    if (!form.dataset.phone) {
      status.textContent =
        'O canal de inscrições está em preparação. Nenhum dado foi enviado. Volte em breve para participar.';
      return;
    }
    window.open(whatsappLink(founderMessage(payload)), '_blank', 'noopener,noreferrer');
    status.textContent =
      'A mensagem está pronta no WhatsApp. Confirme o envio por lá para concluir seu interesse.';
    track('cta_whatsapp', { secao: 'fundadores' });
    // A abertura do WhatsApp não confirma envio. O evento de envio só ocorre após sucesso do endpoint.
    return;
  }
  button.disabled = true;
  status.textContent = 'Enviando seu interesse…';
  try {
    const response = await fetch(form.dataset.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, consent: true, source: 'arpvision-site' }),
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error('Falha no envio');
    track('form_fundadores_enviado');
    status.textContent = 'Interesse enviado. Obrigado por participar deste começo!';
    form.reset();
  } catch {
    status.textContent =
      'Não foi possível enviar agora. Seus campos foram mantidos; tente novamente em instantes.';
  } finally {
    button.disabled = false;
  }
});
