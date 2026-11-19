// O selo do canto do tour, como a seção "Seu tour, sua identidade" da home o desenha. As
// proporções são as do app (o carimbo do chão sem o disco), para o site não mostrar um selo
// diferente do que o tour mostra.

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
  /** A altura da maiúscula da Inter, em fração da letra: o texto fica centrado na faixa por ela. */
  capHeight: 0.727,
  /** O círculo em que o logo cabe, dentro do anel de dentro. */
  logoRadius: 56,
} as const;

/**
 * O texto que dá a volta no anel e o giro, em graus, que centra a primeira frase no topo.
 *
 * Como no app, a frase "Capturado por · Nome" entra duas vezes, em maiúsculas, cada uma seguida
 * do separador, e o texto é esticado para fechar a volta. O texto começa no topo e corre no
 * sentido horário; girado para trás a metade do arco que a primeira frase ocupa, ela fica
 * centrada. A conta é por letra (a largura de cada uma só o navegador sabe), e basta para o
 * olho.
 */
export function sealRing(phrase: string, name: string): { text: string; rotation: number } {
  const first = `${phrase.trim()}${SEPARATOR}${name.trim()}`.toUpperCase();
  const text = `${first}${SEPARATOR}`.repeat(2);
  return { text, rotation: -([...first].length / [...text].length) * 180 };
}

/**
 * O nome do modelo discreto, ao lado do logo: em maiúsculas, numa linha, num desenho de 40 de
 * altura. É SVG como o texto dos anéis, para encolher com a figura sem virar texto miúdo da
 * página (a checagem do site não aceita texto abaixo de 12px).
 *
 * A largura de cada letra só o navegador sabe; o desenho reserva uma largura média por letra e
 * por espaço (Inter em peso 700, com o respiro do selo) e estica o texto até ela (`textLength`),
 * então a caixa e o texto sempre fecham.
 */
export function sealName(name: string) {
  const letter = 22;
  const text = name.trim().toUpperCase();
  const letterWidth = letter * 0.66;
  const spaceWidth = letter * 0.3;
  const width = [...text].reduce(
    (total, glyph) => total + (glyph.trim() ? letterWidth : spaceWidth),
    0,
  );
  const height = 40;
  return {
    text,
    letter,
    letterWidth,
    spaceWidth,
    width,
    height,
    baseline: height / 2 + (letter * sealShape.capHeight) / 2,
  };
}
