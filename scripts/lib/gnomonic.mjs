// Projeção gnomônica: o recorte retilíneo (em perspectiva) de uma panorâmica equirretangular.
// Convenção:
//   yaw   graus a partir da borda esquerda da panorâmica (x = yaw / 360 · largura), no centro do quadro;
//   pitch graus acima do horizonte (y = (90 − pitch) / 180 · altura);
//   hfov  campo de visão horizontal do quadro, em graus.
// Sem roll. O yaw dá a volta em x.

const toRadians = (degrees) => (degrees * Math.PI) / 180;
const toDegrees = (radians) => (radians * 180) / Math.PI;

/**
 * Onde cada pixel do quadro cai na panorâmica.
 *
 * Devolve os pares (u, v) de cada pixel de saída, linha a linha. Os dois são índices de pixel da
 * panorâmica, em ponto flutuante (o centro do pixel i está em i), prontos para a amostragem
 * bilinear. O u dá a volta e fica em [-0,5, srcW − 0,5); o v fica em [-0,5, srcH − 0,5], e quem
 * amostra trava a linha.
 *
 * @param {number} width largura do quadro de saída, em pixels
 * @param {number} height altura do quadro de saída, em pixels
 * @param {{ yaw: number, pitch: number, hfov: number }} view para onde o quadro olha
 * @param {number} srcW largura da panorâmica
 * @param {number} srcH altura da panorâmica
 * @returns {Float32Array} width · height pares (u, v)
 */
export function sampleCoords(width, height, { yaw, pitch, hfov }, srcW, srcH) {
  const coords = new Float32Array(width * height * 2);
  const focal = width / 2 / Math.tan(toRadians(hfov) / 2);
  const sinPitch = Math.sin(toRadians(pitch));
  const cosPitch = Math.cos(toRadians(pitch));
  let k = 0;
  for (let row = 0; row < height; row++) {
    const y = height / 2 - (row + 0.5);
    const up = y * cosPitch + focal * sinPitch;
    const ahead = -y * sinPitch + focal * cosPitch;
    for (let col = 0; col < width; col++) {
      const x = col + 0.5 - width / 2;
      const lon = toDegrees(Math.atan2(x, ahead));
      const lat = toDegrees(Math.atan2(up, Math.hypot(x, ahead)));
      // O % do JavaScript devolve negativo à esquerda do yaw 0: somar 360 e repetir o %
      // põe o ângulo em [0, 360).
      const turn = (((yaw + lon) % 360) + 360) % 360;
      coords[k++] = (turn / 360) * srcW - 0.5;
      coords[k++] = ((90 - lat) / 180) * srcH - 0.5;
    }
  }
  return coords;
}
