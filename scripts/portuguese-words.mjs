// Letras e palavras que denunciam português num texto que deveria estar em outro idioma: os
// testes do dicionário, a checagem do build e a do navegador usam as mesmas listas.
// A fronteira de palavra considera acentos: o \b do JavaScript acharia "pode" em "trípode".
const words = [
  'você',
  'não',
  'celular',
  'ambientes?',
  'cômodos?',
  'imóve(?:l|is)',
  'aprimor\\p{L}*',
  'grátis',
  'conta',
  'sem',
  'com',
  'em',
  'um',
  'uma',
  'seu',
  'sua',
  'mais',
  'até',
  'já',
  'pode',
  'tem',
  'onde',
  'quando',
  'também',
  'então',
  'espaço',
  'preço',
  'cotação',
  'dúvidas',
  'corretor',
  'imobiliárias?',
];
const pattern = (list) =>
  new RegExp(`[ãõçâêôà]|(?<!\\p{L})(?:${list.join('|')})(?!\\p{L})`, 'iu');
// No espanhol, "link" também denuncia o português: lá é "enlace".
export const portugueseWords = pattern([...words, 'links?']);
// No inglês, "link" é a palavra certa.
export const portugueseWordsInEnglish = pattern(words);
/** A lista de cada idioma que não é o português. */
export const portugueseWordsIn = (locale) =>
  locale === 'en' ? portugueseWordsInEnglish : portugueseWords;
