import { founderMessage, whatsappLink } from '../lib/business';
import { track } from './analytics';
const form = document.querySelector<HTMLFormElement>('[data-founders-form]');
// Mensagens escritas junto de cada campo, no lugar dos balões nativos do navegador.
const messages: Record<string, string> = {
  name: 'Informe seu nome.',
  company: 'Informe o nome da empresa ou do seu negócio.',
  city: 'Informe a cidade e o estado. Ex.: São Paulo / SP',
  agents: 'Informe quantas pessoas tem a equipe (de 1 a 10.000).',
  phone: 'Informe o WhatsApp com DDD. Ex.: (11) 99999-9999',
  consent: 'Marque a caixa para concordar com o contato.',
};
const errorFor = (field: HTMLInputElement) =>
  document.getElementById(field.getAttribute('aria-describedby') ?? '');
const showError = (field: HTMLInputElement, message: string) => {
  const error = errorFor(field);
  field.setAttribute('aria-invalid', String(Boolean(message)));
  if (error) {
    error.textContent = message;
    error.hidden = !message;
  }
};
const phoneIsValid = (value: string) => {
  const digits = value.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 13 && /^[+0-9()\s-]+$/.test(value);
};
const validate = (field: HTMLInputElement) => {
  const invalid =
    field.name === 'phone'
      ? !field.validity.valid || !phoneIsValid(field.value)
      : !field.validity.valid;
  const blank = field.type !== 'checkbox' && !field.value.trim();
  showError(field, invalid || (field.required && blank) ? messages[field.name] : '');
  return !(invalid || (field.required && blank));
};
// Máscara brasileira: (11) 99999-9999 enquanto a pessoa digita.
const maskPhone = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : '';
  const local = digits.slice(2);
  const split = local.length > 8 ? 5 : 4;
  return `(${digits.slice(0, 2)}) ${local.slice(0, split)}${local.length > split ? `-${local.slice(split)}` : ''}`;
};
const fields = form ? [...form.querySelectorAll<HTMLInputElement>('input[name]')] : [];
fields.forEach((field) => {
  const event = field.type === 'checkbox' ? 'change' : 'input';
  field.addEventListener(event, () => {
    if (field.name === 'phone' && !field.value.startsWith('+'))
      field.value = maskPhone(field.value);
    // Depois do primeiro erro, a mensagem some assim que o campo fica certo.
    if (field.getAttribute('aria-invalid') === 'true') validate(field);
  });
});
form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const status = form.querySelector<HTMLElement>('[data-form-status]')!;
  const button = form.querySelector<HTMLButtonElement>('[type="submit"]')!;
  const invalid = fields.filter((field) => !validate(field));
  if (invalid.length) {
    status.textContent =
      invalid.length === 1
        ? 'Confira o campo destacado.'
        : `Confira os ${invalid.length} campos destacados.`;
    invalid[0].focus();
    return;
  }
  const data = new FormData(form);
  const showStatus = (text: string) => {
    status.textContent = text;
    status.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  };
  const payload = {
    name: String(data.get('name')).trim(),
    company: String(data.get('company')).trim(),
    city: String(data.get('city')).trim(),
    agents: String(data.get('agents')),
    phone: String(data.get('phone')).trim(),
  };
  // O formulário só é renderizado com um canal configurado (endpoint ou WhatsApp).
  if (!form.dataset.endpoint) {
    window.open(whatsappLink(founderMessage(payload)), '_blank', 'noopener,noreferrer');
    showStatus(
      'A mensagem está pronta no WhatsApp. Confirme o envio por lá para concluir seu interesse.',
    );
    track('cta_whatsapp', { secao: 'fundadores' });
    // A abertura do WhatsApp não confirma envio. O evento de envio só ocorre após sucesso do endpoint.
    return;
  }
  button.disabled = true;
  showStatus('Enviando seu interesse…');
  try {
    const response = await fetch(form.dataset.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, consent: true, source: 'arpvision-site' }),
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error('Falha no envio');
    track('form_fundadores_enviado');
    showStatus('Interesse enviado. Obrigado por participar deste começo!');
    form.reset();
  } catch {
    showStatus(
      'Não foi possível enviar agora. Seus campos foram mantidos; tente novamente em instantes.',
    );
  } finally {
    button.disabled = false;
  }
});
