// As regras de texto da spec no inglês, num lugar só: o check-site as aplica ao texto das páginas
// /en, e o teste do catálogo (tests/products.test.ts) ao dicionário das páginas de produto. Nada de
// "intelligent", "smart", "generated", "algorithm", "100% real" nem "unedited", e nada de
// "starting at", "from" ou "as low as" com preço. O preço pode vir em toda moeda que o site
// escreve, antes ou depois do número, com espaço comum ou &nbsp;, como no pricePattern
// (prices.mjs): o site escreve preço em reais também no inglês (price() em src/config/site.ts dá
// "R$ 249"). Esta regra vale com os preços públicos ou não; a moeda com número sozinha fica com o
// pricePattern, que só reprova com os preços ocultos.
export const englishRules =
  /\bintelligen(?:t|ce)\b|\bsmart\b|\bgenerat(?:e|ed|es|ing)\b|\balgorithms?\b|100\s*%\s*real|\bunedited\b|\b(?:starting at|from|as low as)(?:\s|&nbsp;)*(?:\$|R\$|US\$|€|&euro;|£|&pound;|\d[\d.,]*(?:\s|&nbsp;)*(?:€|&euro;|£|&pound;))/i;
