// Preço escrito no HTML publicado: real, dólar (o "$" pega também "R$" e "US$"), euro ou libra com
// um número, antes ou depois dele, com espaço comum ou &nbsp; no meio ("R$ 99", "$49", "99 €",
// "€99", "£19"). Sem preços públicos (site.pricing.showPrices), o check-site reprova qualquer
// página que tenha um.
export const pricePattern =
  /(?:\$|€|&euro;|£|&pound;)(?:\s|&nbsp;)*\d|\d(?:\s|&nbsp;)*(?:€|&euro;|£|&pound;)/;
