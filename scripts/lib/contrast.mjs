// Contraste de texto medido na imagem. O axe marca texto sobre vidro (backdrop-filter) como
// "incomplete" e não reprova; aqui o fundo vem de uma captura, com o vidro, o desfoque e o que
// passa por trás dele.
import sharp from 'sharp';

const channel = (value) => {
  const s = value / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};

/**
 * Luminância relativa do WCAG.
 * @param {number[]} color [r, g, b], de 0 a 255
 */
export const luminance = ([r, g, b]) =>
  0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);

/**
 * Razão de contraste do WCAG entre duas cores [r, g, b].
 * @param {number[]} a
 * @param {number[]} b
 */
export const contrastRatio = (a, b) => {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high + 0.05) / (low + 0.05);
};

/**
 * Cor calculada pelo navegador (rgb(), rgba() ou color(srgb …)) em [r, g, b, a], de 0 a 255.
 * @param {string} text
 * @returns {number[]}
 */
export const parseColor = (text) => {
  const [r, g, b, a = 1] = (text.match(/[\d.]+(?:e-?\d+)?/g) ?? []).map(Number);
  const scale = text.startsWith('color(') ? 255 : 1;
  return [r * scale, g * scale, b * scale, a];
};

/**
 * A cor [r, g, b, a] por cima do fundo [r, g, b].
 * @param {number[]} color
 * @param {number[]} background
 */
export const over = ([r, g, b, a = 1], background) =>
  [r, g, b].map((value, index) => value * a + background[index] * (1 - a));

/**
 * Menor contraste da cor do texto contra os pixels do retângulo (o fundo atrás do texto). Fora da
 * imagem não há o que medir: Infinity.
 * @param {{ data: Uint8Array, info: { width: number, height: number, channels: number } }} image
 *   a saída crua do sharp
 * @param {{ x: number, y: number, width: number, height: number }} rect
 * @param {string} color
 */
export const lowestContrast = ({ data, info }, rect, color) => {
  const text = parseColor(color);
  const left = Math.max(0, Math.round(rect.x));
  const right = Math.min(info.width, Math.round(rect.x + rect.width));
  const top = Math.max(0, Math.round(rect.y));
  const bottom = Math.min(info.height, Math.round(rect.y + rect.height));
  let lowest = Infinity;
  for (let y = top; y < bottom; y++)
    for (let x = left; x < right; x++) {
      const index = (y * info.width + x) * info.channels;
      const background = [data[index], data[index + 1], data[index + 2]];
      lowest = Math.min(lowest, contrastRatio(over(text, background), background));
    }
  return lowest;
};

/**
 * O retângulo inteiro dentro da área, com meio pixel de folga para o arredondamento.
 * @param {{ x: number, y: number, width: number, height: number }} rect
 * @param {{ x: number, y: number, width: number, height: number }} area
 */
export const insideArea = (rect, area) =>
  rect.x >= area.x - 0.5 &&
  rect.y >= area.y - 0.5 &&
  rect.x + rect.width <= area.x + area.width + 0.5 &&
  rect.y + rect.height <= area.y + area.height + 0.5;

/**
 * Menor contraste de cada texto visível do elemento contra o fundo atrás dele. O fundo vem de uma
 * captura com o texto apagado: assim o pixel medido é o que fica por trás das letras. A captura é
 * da página, recortada na caixa do elemento: a do próprio elemento rola a página até ele, e num
 * cabeçalho grudado isso muda o que passa por trás. O texto cortado pela borda de uma área que rola
 * por dentro (o menu do celular aberto, quando passa da altura da tela) fica de fora: ali só se vê
 * parte dele, e o retângulo inteiro pegaria a borda e o que está fora; ele é lido depois de rolar.
 * @param {import('@playwright/test').Locator} locator um elemento inteiro na tela
 * @returns {Promise<{ text: string, color: string, ratio: number }[]>}
 */
export const textContrast = async (locator) => {
  const { items, clip } = await locator.evaluate(async (root) => {
    // Toda troca de cor (de tema, de estado) vira transição, até com movimento reduzido: a leitura
    // espera todas acabarem.
    for (let round = 0; round < 10; round++) {
      const running = document
        .getAnimations()
        .filter((animation) => animation instanceof CSSTransition);
      if (!running.length) break;
      await Promise.allSettled(running.map((animation) => animation.finished));
    }
    // O recorte vai do pixel inteiro em que o elemento começa ao pixel inteiro em que ele termina.
    const box = root.getBoundingClientRect();
    const x = Math.floor(box.left);
    const y = Math.floor(box.top);
    const found = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const element = node.parentElement;
      if (!node.textContent.trim() || !element.checkVisibility()) continue;
      // Sem o texto só para leitor de tela: a caixa dele tem 1 px, e o resto fica recortado.
      const own = element.getBoundingClientRect();
      if (own.width <= 2 || own.height <= 2) continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      const rects = [...range.getClientRects()].map((rect) => ({
        x: rect.x - x,
        y: rect.y - y,
        width: rect.width,
        height: rect.height,
      }));
      // A área visível da caixa que rola por dentro mais próxima, dentro do elemento.
      let area = null;
      for (let parent = element; parent && root.contains(parent); parent = parent.parentElement)
        if (/auto|scroll/.test(getComputedStyle(parent).overflowY)) {
          const scroller = parent.getBoundingClientRect();
          area = {
            x: scroller.x + parent.clientLeft - x,
            y: scroller.y + parent.clientTop - y,
            width: parent.clientWidth,
            height: parent.clientHeight,
          };
          break;
        }
      found.push({
        text: node.textContent.trim(),
        color: getComputedStyle(element).color,
        rects,
        area,
      });
    }
    // O texto some sem transição, e a captura mostra só o fundo.
    const style = document.createElement('style');
    style.id = 'contrast-probe';
    style.textContent =
      '[data-contrast-probe], [data-contrast-probe] * { color: transparent !important; transition: none !important; }';
    document.head.append(style);
    root.dataset.contrastProbe = '';
    return {
      items: found,
      clip: { x, y, width: Math.ceil(box.right) - x, height: Math.ceil(box.bottom) - y },
    };
  });
  const png = await locator.page().screenshot({ clip, scale: 'css' });
  await locator.evaluate((root) => {
    // A cor volta ainda sem transição (a leitura do estilo aplica a troca na hora); só então a
    // regra sai.
    const style = document.getElementById('contrast-probe');
    style.textContent =
      '[data-contrast-probe], [data-contrast-probe] * { transition: none !important; }';
    for (const element of [root, ...root.querySelectorAll('*')])
      void getComputedStyle(element).color;
    style.remove();
    delete root.dataset.contrastProbe;
  });
  const image = await sharp(png).raw().toBuffer({ resolveWithObject: true });
  return items
    .filter(({ rects, area }) => !area || rects.every((rect) => insideArea(rect, area)))
    .map(({ text, color, rects }) => ({
      text,
      color,
      ratio: Math.min(...rects.map((rect) => lowestContrast(image, rect, color))),
    }))
    .filter((item) => item.ratio !== Infinity);
};
