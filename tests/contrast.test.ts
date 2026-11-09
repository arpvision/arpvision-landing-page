import test from 'node:test';
import assert from 'node:assert/strict';
import {
  contrastRatio,
  insideArea,
  lowestContrast,
  over,
  parseColor,
} from '../scripts/lib/contrast.mjs';

test('o contraste segue a fórmula do WCAG: preto e branco dão 21:1, em qualquer ordem', () => {
  assert.equal(contrastRatio([0, 0, 0], [255, 255, 255]), 21);
  assert.equal(contrastRatio([255, 255, 255], [0, 0, 0]), 21);
  assert.equal(contrastRatio([10, 20, 30], [10, 20, 30]), 1);
});

test('o cinza #767676 é o mais claro que passa de 4,5:1 sobre o branco', () => {
  assert.ok(contrastRatio([0x76, 0x76, 0x76], [255, 255, 255]) >= 4.5);
  assert.ok(contrastRatio([0x77, 0x77, 0x77], [255, 255, 255]) < 4.5);
});

test('a cor calculada pelo navegador vira [r, g, b, a], de 0 a 255, também em color(srgb …)', () => {
  assert.deepEqual(parseColor('rgb(15, 23, 42)'), [15, 23, 42, 1]);
  assert.deepEqual(parseColor('rgba(0, 0, 0, 0)'), [0, 0, 0, 0]);
  // Assim o Chrome escreve o resultado de um color-mix com transparência.
  assert.deepEqual(parseColor('color(srgb 1 1 1 / 0.9)'), [255, 255, 255, 0.9]);
  assert.deepEqual(parseColor('color(srgb 0 0.5 1)'), [0, 127.5, 255, 1]);
});

test('o texto translúcido entra no cálculo já misturado com o fundo', () => {
  assert.deepEqual(over([255, 255, 255, 0.5], [0, 0, 0]), [127.5, 127.5, 127.5]);
  assert.deepEqual(over([10, 20, 30, 1], [200, 200, 200]), [10, 20, 30]);
});

test('no retângulo do texto, o pior pixel do fundo é o que vale', () => {
  // Imagem de 4 × 2 como a do sharp (RGB, linha a linha): a metade esquerda branca, a direita preta.
  const width = 4;
  const data = new Uint8Array(width * 2 * 3);
  for (let y = 0; y < 2; y++)
    for (let x = 2; x < width; x++) data.set([0, 0, 0], (y * width + x) * 3);
  for (let y = 0; y < 2; y++)
    for (let x = 0; x < 2; x++) data.set([255, 255, 255], (y * width + x) * 3);
  const image = { data, info: { width, height: 2, channels: 3 } };
  const whole = { x: 0, y: 0, width: 4, height: 2 };
  assert.equal(lowestContrast(image, { x: 0, y: 0, width: 2, height: 2 }, 'rgb(0, 0, 0)'), 21);
  assert.equal(lowestContrast(image, whole, 'rgb(0, 0, 0)'), 1);
  // O cinza #777: 4,48:1 no branco e 4,69:1 no preto.
  assert.equal(
    lowestContrast(image, whole, 'rgb(119, 119, 119)'),
    contrastRatio([119, 119, 119], [255, 255, 255]),
  );
  // Fora da imagem não há fundo para medir.
  assert.equal(
    lowestContrast(image, { x: 9, y: 0, width: 2, height: 2 }, 'rgb(0, 0, 0)'),
    Infinity,
  );
});

test('só conta o texto inteiro dentro da área que rola: o cortado pela borda é lido depois de rolar', () => {
  // A área visível do menu do celular aberto, que rola por dentro quando passa da altura da tela.
  const area = { x: 0, y: 66, width: 336, height: 684 };
  assert.equal(insideArea({ x: 21, y: 600, width: 80, height: 50 }, area), true);
  // "Dúvidas" com a metade de baixo abaixo da borda da área: fica de fora.
  assert.equal(insideArea({ x: 21, y: 716.7, width: 80, height: 50 }, area), false);
  // E a que passa da borda de cima, ou dos lados.
  assert.equal(insideArea({ x: 21, y: 40, width: 80, height: 50 }, area), false);
  assert.equal(insideArea({ x: 300, y: 600, width: 80, height: 50 }, area), false);
  // Meio pixel de arredondamento não tira o texto da área.
  assert.equal(insideArea({ x: -0.4, y: 65.6, width: 80, height: 684.6 }, area), true);
});
