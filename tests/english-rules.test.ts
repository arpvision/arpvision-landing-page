import test from 'node:test';
import assert from 'node:assert/strict';
import { englishRules } from '../scripts/lib/english-rules.mjs';

// A regra do inglês sozinha é a que o check-site aplica às páginas /en, com os preços públicos ou
// não. O teste do catálogo a junta às regras do português e do espanhol.

test('a regra do inglês pega as palavras que a spec proíbe', () => {
  for (const text of [
    'An intelligent assistant answers your clients',
    'Smart replies, day and night',
    'Videos generated from your photos',
    'Our algorithm picks the best photos',
    '100% real photos',
    'Unedited footage of the property',
  ])
    assert.match(text, englishRules, text);
});

test('a regra do inglês pega "from", "starting at" e "as low as" com preço em toda moeda que o site escreve', () => {
  // O preço do site sai em reais também no inglês (price() em src/config/site.ts dá "R$ 249").
  for (const text of [
    'From R$ 249 a month',
    'Plans from R$&nbsp;249 a month',
    'starting at US$ 29',
    'From $49',
    'Starting at €49',
    'from &euro;49',
    'As low as £19',
    'as low as &pound;9',
    'from 49 € a month',
  ])
    assert.match(text, englishRules, text);
});

test('a regra do inglês deixa passar o preço sozinho, que vale com os preços públicos, e o "from" sem preço', () => {
  for (const text of [
    'R$ 249 a month',
    'US$ 29 per video',
    'Billed annually: R$ 2,390',
    'From the first post to a client ready to visit.',
    'Distances come from public databases of schools, hospitals and train stations',
    'about 450 m in a straight line from a school',
    'up to 2,500 a month',
    'License #00000',
  ])
    assert.doesNotMatch(text, englishRules, text);
});
