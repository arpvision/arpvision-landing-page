import sharp from 'sharp';
import { readFile, mkdir } from 'node:fs/promises';

await mkdir('public/images', { recursive: true });
await Promise.all([
  ...[640, 960, 1600].map((width) =>
    sharp('public/images/interior-source.jpg')
      .resize(width)
      .webp({ quality: 80 })
      .toFile(`public/images/interior-${width}.webp`),
  ),
  sharp('public/images/tutorial-source.jpg')
    .resize(720)
    .webp({ quality: 80 })
    .toFile('public/images/tutorial-720.webp'),
  sharp('public/images/tutorial-source.jpg')
    .resize(360)
    .webp({ quality: 80 })
    .toFile('public/images/tutorial-360.webp'),
]);

// Cartões tipográficos com a identidade oficial: imagens de compartilhamento,
// distintas das fotografias e das provas reais de produto ainda pendentes.
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
for (const [name, lines, subtitle] of [
  ['home', ['Seu celular.', 'Seu espaço.', 'Em 360°.'], 'Tour virtual para o seu negócio.'],
  ['planos', ['Seu próximo', 'passo começa', 'por inteiro.'], 'Conheça os planos da ARP Vision.'],
]) {
  const svg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg"><rect width="1200" height="630" fill="${color('white')}"/><rect x="725" width="475" height="630" fill="${color('brand-blue-soft')}"/><rect x="64" y="157" width="35" height="4" rx="2" fill="${color('brand-teal')}"/><text x="64" y="244" font-family="Arial, sans-serif" font-size="66" font-weight="700" letter-spacing="-2" fill="${color('text-strong')}">${lines[0]}</text><text x="64" y="323" font-family="Arial, sans-serif" font-size="66" font-weight="700" letter-spacing="-2" fill="${color('text-strong')}">${lines[1]}</text><text x="64" y="402" font-family="Arial, sans-serif" font-size="66" font-weight="700" letter-spacing="-2" fill="${color('brand-blue')}">${lines[2]}</text><text x="64" y="470" font-family="Arial, sans-serif" font-size="24" fill="${color('text-secondary')}">${subtitle}</text><text x="64" y="568" font-family="Arial, sans-serif" font-size="18" fill="${color('text-muted')}">Sem baixar app. Sem equipamento extra.</text></svg>`;
  await sharp(Buffer.from(svg))
    .composite([
      { input: logo, top: 54, left: 64 },
      { input: image, top: 40, left: 745 },
    ])
    .png()
    .toFile(`public/images/og-${name}.png`);
}
console.log('Imagens WebP e dois cartões Open Graph 1200 × 630 prontos.');
