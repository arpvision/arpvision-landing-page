// Recortes retilíneos da casa de demonstração (o tour 511a5654, "Casa corretor"): as fotos das
// telas de exemplo do site e dos vídeos de exemplo. Os ângulos de cada recorte estão em
// scripts/product-crops.json. Cada recorte vira um WebP do site e, com --video-out, um JPG em
// resolução cheia para os vídeos.
//
// O `retouch` do mesmo JSON lista, por panorâmica, as manchas retocadas antes de recortar (o
// reflexo de quem fotografou no vidro da cabeceira da suíte, que nenhum enquadramento evita sem
// perder a cama). O retoque é o de scripts/lib/retouch.mjs.
//
// Uso:
//   node scripts/product-crops.mjs --source <pasta> [--site-out <pasta>] [--video-out <pasta>]
//   --source     a pasta do tour, com a panorâmica 2:1 de cada ambiente em <ambiente>/tratada.jpg
//   --site-out   padrão: public/images/produtos
//   --video-out  sem ela, só os WebP do site são gravados
//
// A panorâmica é lida com fs.readFile e o buffer vai para o sharp: o caminho do tour tem
// acento ("Área de Trabalho").
import sharp from 'sharp';
import { mkdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { sampleCoords } from './lib/gnomonic.mjs';
import { retouchSpot } from './lib/retouch.mjs';

const { values } = parseArgs({
  options: {
    source: { type: 'string' },
    'site-out': {
      type: 'string',
      default: fileURLToPath(new URL('../public/images/produtos', import.meta.url)),
    },
    'video-out': { type: 'string' },
  },
});
const { source, 'site-out': siteOut, 'video-out': videoOut } = values;
if (!source) {
  console.error(
    'Uso: node scripts/product-crops.mjs --source <pasta do tour> [--site-out <pasta>] [--video-out <pasta>]',
  );
  process.exit(1);
}

const {
  formats,
  rooms,
  retouch = {},
} = JSON.parse(await readFile(new URL('./product-crops.json', import.meta.url), 'utf8'));

const panoramas = new Map();
async function loadPanorama(folder) {
  if (!panoramas.has(folder)) {
    const file = join(source, folder, 'tratada.jpg');
    const { data, info } = await sharp(await readFile(file))
      .raw()
      .toBuffer({ resolveWithObject: true });
    if (info.channels !== 3 || info.width !== 2 * info.height) {
      throw new Error(
        `${file}: esperava uma panorâmica 2:1 em RGB, mas veio ${info.width}×${info.height} com ${info.channels} canais.`,
      );
    }
    for (const region of retouch[folder] ?? []) {
      retouchSpot(data, info.width, info.height, region);
    }
    panoramas.set(folder, { data, width: info.width, height: info.height });
  }
  return panoramas.get(folder);
}

// Amostragem bilinear: o u dá a volta em x, e a linha trava nas pontas da panorâmica.
function crop(panorama, view, width, height) {
  const { data, width: srcW, height: srcH } = panorama;
  const coords = sampleCoords(width, height, view, srcW, srcH);
  const pixels = Buffer.alloc(width * height * 3);
  for (let i = 0; i < width * height; i++) {
    const u = coords[2 * i];
    const v = coords[2 * i + 1];
    const u0 = Math.floor(u);
    const v0 = Math.floor(v);
    const du = u - u0;
    const dv = v - v0;
    const left = (u0 + srcW) % srcW; // u0 vai de -1 a srcW - 1
    const right = (u0 + 1 + srcW) % srcW;
    const top = Math.min(Math.max(v0, 0), srcH - 1);
    const bottom = Math.min(Math.max(v0 + 1, 0), srcH - 1);
    const topLeft = (top * srcW + left) * 3;
    const topRight = (top * srcW + right) * 3;
    const bottomLeft = (bottom * srcW + left) * 3;
    const bottomRight = (bottom * srcW + right) * 3;
    for (let channel = 0; channel < 3; channel++) {
      const upper = data[topLeft + channel] * (1 - du) + data[topRight + channel] * du;
      const lower = data[bottomLeft + channel] * (1 - du) + data[bottomRight + channel] * du;
      pixels[i * 3 + channel] = Math.round(upper * (1 - dv) + lower * dv);
    }
  }
  return pixels;
}

const kb = (bytes) => `${(bytes / 1024).toFixed(0)} KB`;

await mkdir(siteOut, { recursive: true });
if (videoOut) await mkdir(videoOut, { recursive: true });
let count = 0;
for (const room of rooms) {
  const panorama = await loadPanorama(room.source);
  for (const [ratio, view] of Object.entries(room.views)) {
    const { site, video } = formats[ratio];
    const [siteWidth, siteHeight] = site;
    const [videoWidth, videoHeight] = video;
    const pixels = crop(panorama, view, videoWidth, videoHeight);
    const frame = () =>
      sharp(pixels, { raw: { width: videoWidth, height: videoHeight, channels: 3 } });
    const name = `${room.name}-${ratio}`;
    const webp = await frame()
      .resize(siteWidth, siteHeight)
      .webp({ quality: 80 })
      .toFile(join(siteOut, `${name}.webp`));
    let line = `${name}: ${siteWidth}×${siteHeight} webp ${kb(webp.size)}`;
    if (videoOut) {
      const jpg = await frame()
        .jpeg({ quality: 90 })
        .toFile(join(videoOut, `${name}.jpg`));
      line += `, ${videoWidth}×${videoHeight} jpg ${kb(jpg.size)}`;
    }
    console.log(line);
    count++;
  }
}
console.log(`${count} recortes: WebP em ${siteOut}${videoOut ? `, JPG em ${videoOut}` : ''}.`);
