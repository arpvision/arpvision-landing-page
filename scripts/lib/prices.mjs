// Preço escrito no HTML publicado: real ou euro com um número, antes ou depois dele, com espaço
// comum ou &nbsp; no meio ("R$ 99", "99 €", "€99"). Sem preços públicos (site.pricing.showPrices),
// o check-site reprova qualquer página que tenha um.
export const pricePattern = /(?:R\$|€|&euro;)(?:\s|&nbsp;)*\d|\d(?:\s|&nbsp;)*(?:€|&euro;)/;
