import test from 'node:test';
import assert from 'node:assert/strict';
import { pricePattern } from '../scripts/lib/prices.mjs';

test('o check-site acha o preço em reais no HTML, com espaço comum ou &nbsp;', () => {
  for (const html of ['R$ 99', 'R$99', 'por R$&nbsp;1.290 ao mês'])
    assert.match(html, pricePattern, html);
});

test('o check-site acha o preço em euros, antes ou depois do número', () => {
  for (const html of ['99 €', '49€ al mes', 'desde 99&nbsp;€', '€ 99', '€49', 'desde 12 &euro;'])
    assert.match(html, pricePattern, html);
});

test('número sem moeda e moeda sem número não são preço', () => {
  for (const html of [
    'hasta 2.500 al mes',
    'até 2.500 por mês',
    'Calificación energética: E',
    'CRECI 00000-J',
    '3 dormitorios · 240 m²',
    'R$ e € sem valor',
  ])
    assert.doesNotMatch(html, pricePattern, html);
});
