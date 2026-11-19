// O selo do canto do tour, como a seção "Seu tour, sua identidade" da home o desenha. As
// proporções e a disposição das letras são as do app (o carimbo do chão sem o disco), para o site
// não mostrar um selo diferente do que o tour mostra.
//
// Cada letra é posta no lugar dela, uma a uma, com a largura medida da fonte do site. O SVG tem
// um atalho para texto em curva (`textPath` com `textLength`), mas o WebKit não estica o texto
// num `textPath`: no Safari o anel ficava com um buraco de um quinto da volta.

/** O separador entre a frase e o nome, e entre as duas voltas: o mesmo do app. */
const SEPARATOR = ' · ';

/**
 * As medidas do selo de anel num quadro de 200 de lado (raio 100), nas frações do app: anéis em
 * 0,956 e 0,664 do raio, texto no meio da faixa (0,81), letra de 0,132 e peso 600.
 */
export const sealShape = {
  size: 200,
  outerRing: 95.6,
  innerRing: 66.4,
  textRadius: 81,
  letter: 13.2,
  /** Abaixo disto o texto não encolhe mais (0,08 do raio, como no app). */
  minLetter: 8,
  /** A altura da maiúscula da Inter, em fração da letra: o texto fica centrado na faixa por ela. */
  capHeight: 0.734,
  /** Quanto da volta cada arco do modelo com contato pode ocupar: 150°, como no app. */
  maxArc: 150,
  /** O respiro entre as letras de um arco, em fração da letra, como no app. */
  arcTracking: 0.12,
} as const;

/**
 * O avanço de cada letra da Inter do site em peso 600, em fração da letra. Medido no Chrome
 * (`measureText`) com a fonte de `global.css`. Letra com acento tem o avanço da letra sem ele.
 */
// prettier-ignore
const ADVANCE: Record<string, number> = {
  A: 0.728, B: 0.659, C: 0.737, D: 0.722, E: 0.605, F: 0.588, G: 0.749, H: 0.746, I: 0.277,
  J: 0.58, K: 0.703, L: 0.565, M: 0.922, N: 0.759, O: 0.769, P: 0.645, Q: 0.773, R: 0.652,
  S: 0.65, T: 0.66, U: 0.736, V: 0.728, W: 1.02, X: 0.72, Y: 0.713, Z: 0.652,
  0: 0.66, 1: 0.423, 2: 0.623, 3: 0.636, 4: 0.666, 5: 0.612, 6: 0.64, 7: 0.576, 8: 0.64, 9: 0.64,
  ' ': 0.252, '·': 0.319, '.': 0.319, ',': 0.319, ':': 0.319, '-': 0.465, '–': 0.5,
  '(': 0.373, ')': 0.373, '+': 0.673, '&': 0.663, '@': 0.999, '/': 0.379, "'": 0.326,
  '!': 0.321, '?': 0.543, '…': 0.956, '#': 0.644, '%': 1.004,
};
/** Para um sinal fora da tabela: a média das maiúsculas. */
const AVERAGE_ADVANCE = 0.69;

/** O avanço de uma letra, em fração do tamanho da letra. */
export function glyphAdvance(glyph: string): number {
  const base = glyph.normalize('NFD').replace(/\p{M}/gu, '').toUpperCase();
  return ADVANCE[base] ?? AVERAGE_ADVANCE;
}

/** Uma letra do selo no lugar dela. */
export interface SealLetter {
  glyph: string;
  /** O meio da letra, em graus no sentido horário, com o zero no topo. */
  angle: number;
  /** O arco que a letra ocupa, com o respiro dela, em graus. */
  arc: number;
}

const upper = (text: string) => text.normalize('NFC').trim().toUpperCase();
const degrees = (length: number, radius: number) => (length / radius) * (180 / Math.PI);

/**
 * As letras que dão a volta no anel, e o tamanho delas.
 *
 * Como no app, a frase "Capturado por · Nome" entra duas vezes, em maiúsculas, cada uma seguida
 * do separador. Cada letra ocupa a própria largura mais um respiro igual para todas, o que sobra
 * da volta: o anel sempre fecha, sem buraco. A primeira frase fica centrada no topo, e a outra,
 * embaixo. Se as duas não coubessem na letra do desenho, a letra diminuiria até caberem (o app,
 * nesse caso, escreve a frase uma vez só; o exemplo do site nunca chega lá).
 */
export function sealRing(
  phrase: string,
  name: string,
): { text: string; letters: SealLetter[]; letter: number } {
  const first = `${upper(phrase)}${SEPARATOR}${upper(name)}`;
  const text = `${first}${SEPARATOR}`.repeat(2);
  const glyphs = [...text];
  const lap = 2 * Math.PI * sealShape.textRadius;
  const natural = glyphs.reduce((total, glyph) => total + glyphAdvance(glyph), 0);
  const letter = Math.min(sealShape.letter, lap / natural);
  const gap = (lap - natural * letter) / glyphs.length;
  const arcOf = (glyph: string) =>
    degrees(glyphAdvance(glyph) * letter + gap, sealShape.textRadius);

  // A primeira frase, sem o separador do fim, centrada no topo.
  let position = -[...first].reduce((total, glyph) => total + arcOf(glyph), 0) / 2;
  const letters = glyphs.map((glyph) => {
    const arc = arcOf(glyph);
    const placed = { glyph, angle: position + arc / 2, arc };
    position += arc;
    return placed;
  });
  return { text, letters, letter };
}

/**
 * As letras do modelo com contato: o nome centrado no arco de cima e o texto de contato centrado
 * no de baixo, cada um com no máximo 150° e o respiro do app entre as letras. Uma letra só para
 * os dois: se algum não cabe, ela diminui para os dois, até a mínima.
 *
 * Em cima as letras correm no sentido horário. Embaixo, no anti-horário: de pé, elas se leem da
 * esquerda para a direita.
 */
export function sealArcs(
  name: string,
  contact: string,
): { top: SealLetter[]; bottom: SealLetter[]; letter: number } {
  const texts = [upper(name), upper(contact)].map((text) => [...text]);
  const naturalOf = (glyphs: string[]) =>
    glyphs.reduce((total, glyph) => total + glyphAdvance(glyph) + sealShape.arcTracking, 0);
  const limit = (sealShape.maxArc * Math.PI * sealShape.textRadius) / 180;
  const widest = Math.max(...texts.map(naturalOf));
  const letter = Math.max(
    sealShape.minLetter,
    Math.min(sealShape.letter, widest > 0 ? limit / widest : sealShape.letter),
  );

  const [top, bottom] = texts.map((glyphs, index) => {
    const arcOf = (glyph: string) =>
      degrees((glyphAdvance(glyph) + sealShape.arcTracking) * letter, sealShape.textRadius);
    let position = -glyphs.reduce((total, glyph) => total + arcOf(glyph), 0) / 2;
    return glyphs.map((glyph) => {
      const arc = arcOf(glyph);
      const middle = position + arc / 2;
      position += arc;
      // Em cima, do meio para os lados a partir do topo; embaixo, espelhado em torno da base.
      return { glyph, angle: index === 0 ? middle : 180 - middle, arc };
    });
  });
  return { top, bottom, letter };
}

/**
 * O nome do modelo discreto, ao lado do logo: em maiúsculas, numa linha, num desenho de 40 de
 * altura. É SVG como o texto dos anéis, para encolher com a figura sem virar texto miúdo da
 * página (a checagem do site não aceita texto abaixo de 12px). A largura do desenho sai da
 * tabela de avanços, com a folga do peso 700 e o respiro entre as letras.
 */
export function sealName(name: string) {
  const letter = 22;
  const tracking = 0.04;
  const text = upper(name);
  // O peso 700 é uns 2% mais largo que o 600 da tabela.
  const width = [...text].reduce(
    (total, glyph) => total + (glyphAdvance(glyph) * 1.02 + tracking) * letter,
    0,
  );
  const height = 40;
  return {
    text,
    letter,
    tracking: tracking * letter,
    width,
    height,
    baseline: height / 2 + (letter * sealShape.capHeight) / 2,
  };
}
