import { localeInfo, locales, type Locale } from '../i18n/locales';
import {
  equivalentHref,
  languageChoiceKey,
  pageFromPath,
  suggestedLocale,
  suggestionText,
} from '../i18n/suggestion';

// Faixa de sugestão de idioma (regras em src/i18n/suggestion.ts). Só existe no navegador:
// o texto entra na página quando a faixa aparece, e nada troca de idioma sozinho.

// No Safari em janela privada, o acesso ao localStorage pode lançar.
const readChoice = () => {
  try {
    return localStorage.getItem(languageChoiceKey);
  } catch {
    return null;
  }
};
const saveChoice = (locale: Locale) => {
  try {
    localStorage.setItem(languageChoiceKey, locale);
  } catch {}
};

// Qualquer opção do seletor de idioma (e o link da faixa) conta como escolha.
document.addEventListener('click', (event) => {
  const option = (event.target as Element).closest<HTMLElement>('[data-language-choice]');
  const locale = locales.find((code) => code === option?.dataset.languageChoice);
  if (locale) saveChoice(locale);
});

const template = document.querySelector<HTMLTemplateElement>('#language-suggestion');
const pageLocale = locales.find((code) => localeInfo[code].lang === document.documentElement.lang);
const page = pageLocale && pageFromPath(pageLocale, location.pathname);
// Robôs de busca leem a página sem a faixa, como o HTML do servidor.
const robot = /bot|crawler|spider|slurp/i.test(navigator.userAgent);
const languages = navigator.languages?.length ? navigator.languages : [navigator.language ?? ''];
const offer =
  template && pageLocale && page && !robot
    ? suggestedLocale(pageLocale, languages, readChoice())
    : null;

if (template && pageLocale && page && offer) {
  const text = suggestionText[offer];
  const banner = template.content.firstElementChild!.cloneNode(true) as HTMLElement;
  banner.lang = localeInfo[offer].lang;
  banner.setAttribute('aria-label', text.label);
  banner.querySelector('[data-suggestion-text]')!.textContent = text.text;
  const link = banner.querySelector<HTMLAnchorElement>('[data-suggestion-link]')!;
  link.textContent = text.link;
  link.hreflang = localeInfo[offer].lang;
  link.dataset.languageChoice = offer;
  // A âncora acompanha a seção em que a pessoa está quando clica.
  const updateLink = () => (link.href = equivalentHref(pageLocale, offer, page, location.hash));
  updateLink();
  window.addEventListener('hashchange', updateLink);
  const close = banner.querySelector<HTMLButtonElement>('[data-suggestion-close]')!;
  close.setAttribute('aria-label', text.close);
  close.title = text.close;
  close.addEventListener('click', () => {
    // Fechar é escolher o idioma da página. Pelo teclado, o próximo Tab segue para o cabeçalho.
    saveChoice(pageLocale);
    window.removeEventListener('hashchange', updateLink);
    banner.remove();
  });
  // Logo depois do link de pular para o conteúdo: o leitor de tela e o teclado a encontram antes
  // do cabeçalho; na tela, ela fica no pé. O foco não sai de onde está.
  const skipLink = document.querySelector('.skip-link');
  if (skipLink) skipLink.after(banner);
  else document.body.prepend(banner);
}
