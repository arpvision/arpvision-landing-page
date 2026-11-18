import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { sampleCoords } from '../scripts/lib/gnomonic.mjs';

test('o centro do quadro cai no yaw e no pitch pedidos', () => {
  const c = sampleCoords(9, 9, { yaw: 90, pitch: 0, hfov: 60 }, 3840, 1920);
  const i = (4 * 9 + 4) * 2; // pixel central
  assert.ok(Math.abs(c[i] - (90 / 360) * 3840 + 0.5) < 1);
  assert.ok(Math.abs(c[i + 1] - 1920 / 2 + 0.5) < 1);
});

test('o yaw dá a volta na borda', () => {
  const c = sampleCoords(9, 9, { yaw: 0, pitch: 0, hfov: 60 }, 3840, 1920);
  for (let k = 0; k < c.length; k += 2) assert.ok(c[k] >= -0.5 && c[k] < 3840);
});

test('um par (u, v) por pixel, linha a linha: o yaw cresce para a direita e o topo do quadro fica no alto', () => {
  const c = sampleCoords(9, 9, { yaw: 90, pitch: 0, hfov: 60 }, 3840, 1920);
  assert.equal(c.length, 9 * 9 * 2);
  const u = (col: number, row: number) => c[(row * 9 + col) * 2];
  const v = (col: number, row: number) => c[(row * 9 + col) * 2 + 1];
  assert.ok(u(0, 4) < u(4, 4) && u(4, 4) < u(8, 4));
  assert.ok(v(4, 0) < v(4, 4) && v(4, 4) < v(4, 8));
});

test('o pitch positivo sobe o centro do quadro acima do horizonte', () => {
  const c = sampleCoords(9, 9, { yaw: 0, pitch: 30, hfov: 60 }, 3840, 1920);
  const v = c[(4 * 9 + 4) * 2 + 1];
  assert.ok(Math.abs(v - ((90 - 30) / 180) * 1920 + 0.5) < 0.01);
});

test('o campo de visão horizontal vai de uma borda do quadro à outra', () => {
  const width = 1440;
  const c = sampleCoords(width, 3, { yaw: 180, pitch: 0, hfov: 90 }, 3840, 1920);
  const row = width * 2; // a linha do meio, na altura do horizonte
  assert.ok(Math.abs(c[row] - ((135 / 360) * 3840 - 0.5)) < 1);
  assert.ok(Math.abs(c[row + (width - 1) * 2] - ((225 / 360) * 3840 - 0.5)) < 1);
});

// Os recortes do tour de vitrine (scripts/product-crops.json).
type Format = { site: [number, number]; video: [number, number] };
type View = { yaw: number; pitch: number; hfov: number };
const { formats, rooms } = JSON.parse(
  readFileSync(new URL('../scripts/product-crops.json', import.meta.url), 'utf8'),
) as {
  formats: Record<string, Format>;
  rooms: { name: string; source: string; views: Record<string, View> }[];
};
const crops = rooms.flatMap(({ name, source, views }) =>
  Object.entries(views).map(([ratio, view]) => ({ name, source, ratio, ...view })),
);
const stem = (crop: (typeof crops)[number]) => `${crop.name}-${crop.ratio}`;

test('são 16 recortes: 5 ambientes em 3 proporções e o banheiro, que só aparece em 16:9', () => {
  const ambientes = ['fachada', 'sala', 'cozinha', 'suite', 'sacada'];
  const esperados = [
    ...ambientes.flatMap((name) => ['16x9', '9x16', '4x5'].map((ratio) => `${name}-${ratio}`)),
    'banheiro-16x9',
  ];
  assert.deepEqual(crops.map(stem).sort(), esperados.sort());
  // A pasta de cada panorâmica tem o nome do ambiente no tour. A cozinha com a mesa de jantar é
  // vista da sala de estar.
  const pastas: Record<string, string> = {
    fachada: 'frente',
    sala: 'sala',
    cozinha: 'sala-de-estar',
    suite: 'suite-master',
    banheiro: 'banheiro-suite-master',
    sacada: 'sacada-suite-master',
  };
  for (const crop of crops) assert.equal(crop.source, pastas[crop.name], stem(crop));
  assert.deepEqual(formats, {
    '16x9': { site: [960, 540], video: [1440, 810] },
    '9x16': { site: [540, 960], video: [810, 1440] },
    '4x5': { site: [720, 900], video: [1080, 1350] },
  });
  // O tamanho do site é o do vídeo reduzido, na mesma proporção.
  for (const { site, video } of Object.values(formats)) {
    assert.equal(site[0] * video[1], site[1] * video[0]);
  }
});

test('nenhum recorte desce ao chão da panorâmica (a borda de baixo fica acima de −50°) nem inclina além de 8°', () => {
  for (const crop of crops) {
    const [width, height] = formats[crop.ratio].video;
    const c = sampleCoords(width, height, crop, 3840, 1920);
    let bottom = -Infinity;
    for (let k = 1; k < c.length; k += 2) bottom = Math.max(bottom, c[k]);
    const lowestPitch = 90 - ((bottom + 0.5) / 1920) * 180;
    assert.ok(lowestPitch > -50, `${stem(crop)}: borda de baixo em ${lowestPitch.toFixed(1)}°`);
    assert.ok(Math.abs(crop.pitch) <= 8, `${stem(crop)}: pitch ${crop.pitch}°`);
  }
});

test('nenhum recorte amplia a panorâmica além de 1,35 vez (a 1,5 vez a foto já fica mole)', () => {
  for (const crop of crops) {
    const focal = formats[crop.ratio].video[0] / 2 / Math.tan((crop.hfov * Math.PI) / 360);
    const density = focal / (3840 / (2 * Math.PI)); // pixels por radiano, sobre os da panorâmica
    assert.ok(density <= 1.35, `${stem(crop)}: ${density.toFixed(2)}x`);
  }
});

test('os recortes da sacada não pegam o reflexo de quem fotografou no vidro do guarda-corpo', () => {
  // As pernas e os tênis no vidro, de yaw 226 a 239 e pitch −27 a −11, com folga.
  const reflexo = { yaw: [226, 239], pitch: [-27, -11] };
  const sacada = crops.filter((crop) => crop.name === 'sacada');
  assert.equal(sacada.length, 3);
  for (const crop of sacada) {
    const [width, height] = formats[crop.ratio].video;
    const c = sampleCoords(width, height, crop, 3840, 1920);
    for (let k = 0; k < c.length; k += 2) {
      const yaw = ((c[k] + 0.5) / 3840) * 360;
      const pitch = 90 - ((c[k + 1] + 0.5) / 1920) * 180;
      const dentro =
        yaw >= reflexo.yaw[0] &&
        yaw <= reflexo.yaw[1] &&
        pitch >= reflexo.pitch[0] &&
        pitch <= reflexo.pitch[1];
      assert.ok(!dentro, `${stem(crop)}: yaw ${yaw.toFixed(1)}, pitch ${pitch.toFixed(1)}`);
    }
  }
});
