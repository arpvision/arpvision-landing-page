import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { retouchSpot } from '../scripts/lib/retouch.mjs';

// Panorâmica sintética do tamanho das reais (3840 × 1920, 10,67 px por grau): um vidro cinza com
// um degradê suave, como o da cabeceira da suíte. O degradê dá a volta sem degrau na emenda.
const W = 3840;
const H = 1920;
const turn = (x: number) => (2 * Math.PI * x) / W;
const glass = (x: number, y: number): [number, number, number] => [
  Math.round(130 + 10 * Math.sin(turn(x))),
  Math.round(125 + y / 80),
  Math.round(115 + 6 * Math.cos(turn(x)) + y / 160),
];
const column = (yaw: number) => (((yaw % 360) + 360) % 360) * (W / 360);
const row = (pitch: number) => ((90 - pitch) / 180) * H;

type Box = { yaw: [number, number]; pitch: [number, number] };

function panorama() {
  const data = new Uint8Array(W * H * 3);
  for (let y = 0, i = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const [r, g, b] = glass(x, y);
      data[i++] = r;
      data[i++] = g;
      data[i++] = b;
    }
  }
  return data;
}

// Uma mancha morna e clara de borda suave (gaussiana de 10 px, mais ou menos a do reflexo real).
function paintSpot(data: Uint8Array, yaw: number, pitch: number, amount = [55, 25, 10]) {
  const cx = Math.round(column(yaw));
  const cy = Math.round(row(pitch));
  for (let dy = -40; dy <= 40; dy++) {
    for (let dx = -40; dx <= 40; dx++) {
      const x = (cx + dx + W) % W;
      const fall = Math.exp(-(dx * dx + dy * dy) / (2 * 10 * 10));
      for (let c = 0; c < 3; c++) {
        const i = ((cy + dy) * W + x) * 3 + c;
        data[i] = Math.min(255, Math.round(data[i] + amount[c] * fall));
      }
    }
  }
}

// O pixel cai dentro da caixa ampliada por `extra` graus? O yaw conta pelo lado mais curto, então
// a caixa pode passar pela emenda.
function inside(x: number, y: number, box: Box, extra: number) {
  const yaw = ((x + 0.5) / W) * 360;
  const pitch = 90 - ((y + 0.5) / H) * 180;
  const center = (box.yaw[0] + box.yaw[1]) / 2;
  const offset = ((((yaw - center + 180) % 360) + 360) % 360) - 180;
  return (
    Math.abs(offset) <= (box.yaw[1] - box.yaw[0]) / 2 + extra &&
    pitch >= box.pitch[0] - extra &&
    pitch <= box.pitch[1] + extra
  );
}

// Quanto sobra de mancha: a maior diferença para o vidro dentro da caixa.
function leftover(data: Uint8Array, box: Box) {
  let worst = 0;
  const x0 = Math.floor(column(box.yaw[0])) - 2;
  const span = Math.ceil(((box.yaw[1] - box.yaw[0]) * W) / 360) + 4;
  for (let y = Math.floor(row(box.pitch[1])) - 2; y <= Math.ceil(row(box.pitch[0])) + 2; y++) {
    for (let k = 0; k <= span; k++) {
      const x = (x0 + k + W) % W;
      if (!inside(x, y, box, 0)) continue;
      const expected = glass(x, y);
      for (let c = 0; c < 3; c++) {
        worst = Math.max(worst, Math.abs(data[(y * W + x) * 3 + c] - expected[c]));
      }
    }
  }
  return worst;
}

// Quantos pixels mudaram fora da caixa ampliada por `margin` graus.
function changedOutside(before: Uint8Array, after: Uint8Array, box: Box, margin: number) {
  let count = 0;
  for (let i = 0; i < after.length; i++) {
    if (after[i] === before[i]) continue;
    const pixel = Math.floor(i / 3);
    if (!inside(pixel % W, Math.floor(pixel / W), box, margin)) count++;
  }
  return count;
}

const spot: Box = { yaw: [96.5, 102.2], pitch: [-2.5, 2.8] };

test('a mancha some e o vidro fora da região retocada fica igual', () => {
  const data = panorama();
  paintSpot(data, 99.35, 0.15);
  const before = data.slice();
  assert.ok(leftover(before, spot) >= 50, 'a mancha sintética precisa aparecer');
  retouchSpot(data, W, H, spot);
  const worst = leftover(data, spot);
  assert.ok(worst <= 8, `ainda sobram ${worst} níveis de mancha`);
  assert.equal(changedOutside(before, data, spot, 1), 0);
});

test('as linhas finas do vidro atravessam o retoque', () => {
  const data = panorama();
  paintSpot(data, 99.35, 0.15);
  const y = Math.round(row(0.15));
  for (let x = Math.floor(column(95)); x < column(104); x++) {
    for (const line of [y, y + 1]) {
      for (let c = 0; c < 3; c++) data[(line * W + x) * 3 + c] -= 60;
    }
  }
  retouchSpot(data, W, H, spot);
  const x = Math.round(column(99.35));
  const glassHere = glass(x, y);
  for (let c = 0; c < 3; c++) {
    const below = glassHere[c] - data[(y * W + x) * 3 + c];
    assert.ok(below >= 30, `canal ${c}: a linha ficou só ${below} abaixo do vidro`);
  }
});

test('a região dá a volta na emenda da panorâmica', () => {
  const data = panorama();
  paintSpot(data, -0.5, 0);
  const before = data.slice();
  const seam: Box = { yaw: [-3.5, 2.5], pitch: [-2.6, 2.6] };
  assert.ok(leftover(before, seam) >= 50, 'a mancha sintética precisa aparecer');
  retouchSpot(data, W, H, seam);
  const worst = leftover(data, seam);
  assert.ok(worst <= 8, `ainda sobram ${worst} níveis de mancha`);
  assert.equal(changedOutside(before, data, seam, 1), 0);
});

// O retoque dos recortes (scripts/product-crops.json): o reflexo de quem fotografou no vidro da
// cabeceira da suíte fica em yaw 354,0 a 358,7 (−6,0 a −1,3) e pitch −2,0 a +2,3, medido pela cor.
test('o reflexo no vidro da cabeceira da suíte fica dentro do retoque, com folga', () => {
  const { rooms, retouch } = JSON.parse(
    readFileSync(new URL('../scripts/product-crops.json', import.meta.url), 'utf8'),
  ) as { rooms: { source: string }[]; retouch: Record<string, Box[]> };
  const sources = new Set(rooms.map((room) => room.source));
  for (const source of Object.keys(retouch)) assert.ok(sources.has(source), source);
  const reflection: Box = { yaw: [354.0, 358.7], pitch: [-2.0, 2.3] };
  const covers = retouch['quarto-com-suite'].some(({ yaw, pitch }) => {
    const shift = Math.floor(yaw[0] / 360) * 360; // o começo da região em [0, 360)
    return (
      yaw[0] - shift <= reflection.yaw[0] - 0.4 &&
      yaw[1] - shift >= reflection.yaw[1] + 0.4 &&
      pitch[0] <= reflection.pitch[0] - 0.4 &&
      pitch[1] >= reflection.pitch[1] + 0.4
    );
  });
  assert.ok(covers, JSON.stringify(retouch['quarto-com-suite']));
});
