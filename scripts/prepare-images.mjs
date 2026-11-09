// Gera os WebPs e os cartões Open Graph (1200 × 630).
// Uso: node scripts/prepare-images.mjs [nome ...]
//   Sem nomes, gera tudo. Com nomes, só os arquivos citados (sem extensão), por exemplo
//   `node scripts/prepare-images.mjs og-home-en og-plans-en`. Os PNGs em português no ar
//   (og-home, og-planos) já têm o texto daqui.
import sharp from 'sharp';
import { readFile, readdir, mkdir } from 'node:fs/promises';

const only = process.argv.slice(2);
const wanted = (name) => only.length === 0 || only.includes(name);

await mkdir('public/images', { recursive: true });
// Capas da página /tutoriais: um quadro de cada vídeo, em pé (9:16), em <id>-source.jpg.
const tutorialCovers = (await readdir('public/images/tutoriais'))
  .filter((file) => file.endsWith('-source.jpg'))
  .map((file) => file.replace(/-source\.jpg$/, ''));
await Promise.all([
  ...tutorialCovers.flatMap((id) =>
    [360, 720]
      .filter((width) => wanted(`${id}-${width}`))
      .map((width) =>
        sharp(`public/images/tutoriais/${id}-source.jpg`)
          .resize(width)
          .webp({ quality: 80 })
          .toFile(`public/images/tutoriais/${id}-${width}.webp`),
      ),
  ),
  ...[640, 960, 1600]
    .filter((width) => wanted(`interior-${width}`))
    .map((width) =>
      sharp('public/images/interior-source.jpg')
        .resize(width)
        .webp({ quality: 80 })
        .toFile(`public/images/interior-${width}.webp`),
    ),
  ...[720, 360]
    .filter((width) => wanted(`tutorial-${width}`))
    .map((width) =>
      sharp('public/images/tutorial-source.jpg')
        .resize(width)
        .webp({ quality: 80 })
        .toFile(`public/images/tutorial-${width}.webp`),
    ),
]);

// Cartões tipográficos com a identidade oficial: imagens de compartilhamento,
// distintas das fotografias e das provas reais de produto ainda pendentes.
// Um por página e idioma; o público é a imobiliária.
const cards = [
  {
    name: 'og-home',
    lines: ['Seu celular.', 'Seus imóveis.', 'Em 360°.'],
    subtitle: 'Tour virtual para imobiliárias.',
    note: 'Sem baixar app. Sem equipamento extra.',
  },
  {
    name: 'og-planos',
    lines: ['Seu próximo', 'passo começa', 'por inteiro.'],
    subtitle: 'Conheça os planos da ARP Vision.',
    note: 'Sem baixar app. Sem equipamento extra.',
  },
  {
    name: 'og-home-es',
    lines: ['Tu móvil.', 'Tus inmuebles.', 'En 360°.'],
    subtitle: 'Tour virtual para inmobiliarias.',
    note: 'Sin descargar apps. Sin equipo extra.',
  },
  {
    name: 'og-planes-es',
    lines: ['Tu próximo', 'paso empieza', 'aquí.'],
    subtitle: 'Conoce los planes de ARP Vision.',
    note: 'Sin descargar apps. Sin equipo extra.',
  },
  {
    name: 'og-home-en',
    lines: ['Your phone.', 'Your properties.', 'In 360°.'],
    subtitle: 'Virtual tours for real estate agencies.',
    note: 'No app to download. No extra gear.',
  },
  {
    name: 'og-plans-en',
    lines: ['Your next', 'step starts', 'here.'],
    subtitle: 'See the ARP Vision plans.',
    note: 'No app to download. No extra gear.',
  },
].filter((card) => wanted(card.name));
const css = await readFile('src/styles/global.css', 'utf8');
const color = (name) => css.match(new RegExp(`--${name}:\\s*(#[A-Fa-f0-9]+)`))[1];
const logo = await sharp('public/brand/arp-vision-horizontal-blue.svg')
  .resize(247)
  .png()
  .toBuffer();
const image = await sharp('public/images/interior-source.jpg')
  .resize(435, 550, { fit: 'cover' })
  .png()
  .toBuffer();
for (const { name, lines, subtitle, note } of cards) {
  const svg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg"><rect width="1200" height="630" fill="${color('white')}"/><rect x="725" width="475" height="630" fill="${color('brand-blue-soft')}"/><rect x="64" y="157" width="35" height="4" rx="2" fill="${color('brand-teal')}"/><text x="64" y="244" font-family="Arial, sans-serif" font-size="66" font-weight="700" letter-spacing="-2" fill="${color('text-strong')}">${lines[0]}</text><text x="64" y="323" font-family="Arial, sans-serif" font-size="66" font-weight="700" letter-spacing="-2" fill="${color('text-strong')}">${lines[1]}</text><text x="64" y="402" font-family="Arial, sans-serif" font-size="66" font-weight="700" letter-spacing="-2" fill="${color('brand-blue')}">${lines[2]}</text><text x="64" y="470" font-family="Arial, sans-serif" font-size="24" fill="${color('text-secondary')}">${subtitle}</text><text x="64" y="568" font-family="Arial, sans-serif" font-size="18" fill="${color('text-muted')}">${note}</text></svg>`;
  await sharp(Buffer.from(svg))
    .composite([
      { input: logo, top: 54, left: 64 },
      { input: image, top: 40, left: 745 },
    ])
    .png()
    .toFile(`public/images/${name}.png`);
}
console.log(
  only.length
    ? `Prontos: ${only.join(', ')}.`
    : 'Imagens WebP e cartões Open Graph 1200 × 630 (português, espanhol e inglês) prontos.',
);
