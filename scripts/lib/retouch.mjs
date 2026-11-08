// Retoque de uma mancha da panorâmica equirretangular, como o reflexo de quem fotografou num
// vidro. A parte de baixa frequência da região (a cor e o brilho da mancha) dá lugar à do entorno,
// um plano ajustado num anel em volta, e o detalhe fino fica (as linhas gravadas de um vidro
// jateado). Na borda, o retoque some aos poucos.
//
// A região vem em graus, na convenção dos recortes (gnomonic.mjs): yaw a partir da borda esquerda
// da panorâmica (pode passar pela emenda) e pitch acima do horizonte.

/**
 * Retoca a região, mudando os pixels de `data` no lugar.
 *
 * @param {Uint8Array} data pixels RGB da panorâmica 2:1, linha a linha
 * @param {number} width largura da panorâmica
 * @param {number} height altura da panorâmica
 * @param {{ yaw: [number, number], pitch: [number, number] }} region a mancha, em graus
 * @param {{ feather?: number, ring?: number, sigma?: number }} [options]
 *   feather: graus, fora da região, em que o retoque some aos poucos;
 *   ring: largura, em graus, do anel em volta que dá o fundo;
 *   sigma: desvio da gaussiana que separa a baixa frequência, em pixels. Com 2, a cor do reflexo
 *   da suíte sai inteira (sobram 3 pixels mornos dos 899; com 3 sobravam 39) e as linhas gravadas
 *   ficam iguais a olho.
 */
export function retouchSpot(
  data,
  width,
  height,
  region,
  { feather = 1, ring = 1, sigma = 2 } = {},
) {
  const [yawFrom, yawTo] = region.yaw;
  const [pitchFrom, pitchTo] = region.pitch;
  if (!(yawFrom < yawTo && yawTo - yawFrom + 2 * (feather + ring) < 360 && pitchFrom < pitchTo)) {
    throw new Error(`Região de retoque inválida: ${JSON.stringify(region)}`);
  }
  if (!(feather > 0 && ring > 0 && sigma > 0)) {
    throw new Error('feather, ring e sigma precisam ser positivos.');
  }

  // A região em pixels contínuos. O x não dá a volta aqui: pode ser negativo ou passar da largura.
  const perDegree = width / 360; // o mesmo que height / 180 numa panorâmica 2:1
  const left = yawFrom * perDegree;
  const right = yawTo * perDegree;
  const top = ((90 - pitchTo) / 180) * height;
  const bottom = ((90 - pitchFrom) / 180) * height;

  // O pedaço trabalhado: a região, a borda que some, o anel e o raio da gaussiana.
  const radius = Math.ceil(3 * sigma);
  const pad = Math.ceil((feather + ring) * perDegree) + radius + 1;
  const x0 = Math.floor(left) - pad;
  const y0 = Math.max(0, Math.floor(top) - pad);
  const w = Math.ceil(right) + pad - x0;
  const h = Math.min(height, Math.ceil(bottom) + pad) - y0;
  const sourceIndex = (px, py) => ((py + y0) * width + ((((x0 + px) % width) + width) % width)) * 3;

  const patch = new Float64Array(w * h * 3);
  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const from = sourceIndex(px, py);
      const to = (py * w + px) * 3;
      for (let c = 0; c < 3; c++) patch[to + c] = data[from + c];
    }
  }
  const low = gaussianBlur(patch, w, h, sigma, radius);

  // Distância de cada pixel até a região, em graus (0 dentro). O retoque vale 1 dentro e cai a 0
  // em `feather` graus; o anel fica logo depois.
  const distance = new Float64Array(w * h);
  for (let py = 0; py < h; py++) {
    const cy = y0 + py + 0.5;
    const dy = Math.max(top - cy, cy - bottom, 0);
    for (let px = 0; px < w; px++) {
      const cx = x0 + px + 0.5;
      distance[py * w + px] = Math.max(left - cx, cx - right, dy, 0) / perDegree;
    }
  }

  // Plano a + b·x + c·y por canal, ajustado por mínimos quadrados na baixa frequência do anel.
  // As coordenadas partem do meio do pedaço, para o sistema ficar bem condicionado.
  const normal = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  const rhs = [new Float64Array(3), new Float64Array(3), new Float64Array(3)];
  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const d = distance[py * w + px];
      if (d <= feather || d > feather + ring) continue;
      const basis = [1, px - w / 2, py - h / 2];
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) normal[i * 3 + j] += basis[i] * basis[j];
        for (let c = 0; c < 3; c++) rhs[c][i] += basis[i] * low[(py * w + px) * 3 + c];
      }
    }
  }
  const planes = rhs.map((b) => solve3(normal, b));

  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const weight = 1 - distance[py * w + px] / feather;
      if (weight <= 0) continue;
      const to = sourceIndex(px, py);
      const k = (py * w + px) * 3;
      for (let c = 0; c < 3; c++) {
        const [a, b, cc] = planes[c];
        const plane = a + b * (px - w / 2) + cc * (py - h / 2);
        const value = patch[k + c] + weight * (plane - low[k + c]);
        data[to + c] = Math.min(255, Math.max(0, Math.round(value)));
      }
    }
  }
}

// Gaussiana separável num pedaço RGB em ponto flutuante, repetindo a borda.
function gaussianBlur(source, w, h, sigma, radius) {
  const kernel = [];
  for (let k = -radius; k <= radius; k++) kernel.push(Math.exp(-(k * k) / (2 * sigma * sigma)));
  const total = kernel.reduce((sum, value) => sum + value, 0);
  const weights = kernel.map((value) => value / total);
  const pass = (input, horizontal) => {
    const output = new Float64Array(input.length);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        for (let c = 0; c < 3; c++) {
          let sum = 0;
          for (let k = -radius; k <= radius; k++) {
            const sx = horizontal ? Math.min(w - 1, Math.max(0, x + k)) : x;
            const sy = horizontal ? y : Math.min(h - 1, Math.max(0, y + k));
            sum += weights[k + radius] * input[(sy * w + sx) * 3 + c];
          }
          output[(y * w + x) * 3 + c] = sum;
        }
      }
    }
    return output;
  };
  return pass(pass(source, true), false);
}

// Resolve o sistema 3 × 3 (matriz em linhas) pela regra de Cramer.
function solve3(m, b) {
  const det = (a) =>
    a[0] * (a[4] * a[8] - a[5] * a[7]) -
    a[1] * (a[3] * a[8] - a[5] * a[6]) +
    a[2] * (a[3] * a[7] - a[4] * a[6]);
  const whole = det(m);
  if (Math.abs(whole) < 1e-9) throw new Error('O anel do retoque não tem pixels suficientes.');
  return [0, 1, 2].map((column) => {
    const replaced = m.slice();
    for (let row = 0; row < 3; row++) replaced[row * 3 + column] = b[row];
    return det(replaced) / whole;
  });
}
