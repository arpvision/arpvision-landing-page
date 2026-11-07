// Letras e palavras que denunciam português num texto que deveria estar em espanhol: os
// testes do dicionário, a checagem do build e a do navegador usam a mesma lista.
// A fronteira de palavra considera acentos: o \b do JavaScript acharia "pode" em "trípode".
export const portugueseWords =
  /[ãõçâêôà]|(?<!\p{L})(?:você|não|celular|ambientes?|cômodos?|imóve(?:l|is)|aprimor\p{L}*|grátis|links?|conta|sem|com|em|um|uma|seu|sua|mais|até|já|pode|tem|onde|quando|também|então|espaço|preço|cotação|dúvidas|corretor|imobiliárias?)(?!\p{L})/iu;
