import test from 'node:test';
import assert from 'node:assert/strict';
import { locales, translations } from '../src/i18n';
import { glyphAdvance, sealArcs, sealName, sealRing, sealShape } from '../src/lib/seal';

// O selo do canto do tour, na seção "Seu tour, sua identidade" da home. O desenho repete o do
// app: a frase "Capturado por · Nome" dá a volta inteira no anel, duas vezes, com cada letra no
// lugar dela.

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);
const close = (actual: number, expected: number, message?: string) =>
  assert.ok(Math.abs(actual - expected) < 1e-6, `${message ?? ''} ${actual} ≠ ${expected}`);

test('o anel leva a frase e o nome duas vezes, em maiúsculas, com o separador do app', () => {
  assert.equal(
    sealRing('Capturado por', 'ARP Vision').text,
    'CAPTURADO POR · ARP VISION · CAPTURADO POR · ARP VISION · ',
  );
});

test('nome com acento fica em maiúsculas, sem perder o acento', () => {
  assert.match(
    sealRing('Capturado por', 'São José Imóveis').text,
    /^CAPTURADO POR · SÃO JOSÉ IMÓVEIS · /,
  );
});

test('espaços sobrando na frase e no nome não entram no anel', () => {
  assert.equal(
    sealRing('  Captured by ', ' ARP Vision  ').text,
    'CAPTURED BY · ARP VISION · CAPTURED BY · ARP VISION · ',
  );
});

test('o anel fecha a volta: os arcos das letras somam 360°, sem buraco e sem sobra', () => {
  for (const [phrase, name] of [
    ['Capturado por', 'ARP Vision'],
    ['Captured by', 'ARP Vision'],
    ['Capturado por', 'Imobiliária Exemplo de Porto Alegre'],
  ]) {
    const ring = sealRing(phrase, name);
    assert.equal(ring.letters.length, [...ring.text].length, name);
    close(sum(ring.letters.map((letter) => letter.arc)), 360, name);
    // Cada letra começa onde a anterior termina.
    ring.letters.forEach((letter, index) => {
      if (index === 0) return;
      const before = ring.letters[index - 1];
      close(
        letter.angle - letter.arc / 2,
        before.angle + before.arc / 2,
        `${name}, letra ${index}`,
      );
    });
  }
});

test('a primeira frase fica centrada no topo, e a segunda, embaixo', () => {
  const ring = sealRing('Capturado por', 'ARP Vision');
  const first = ring.letters.slice(0, [...'CAPTURADO POR · ARP VISION'].length);
  const start = first[0].angle - first[0].arc / 2;
  const last = first[first.length - 1];
  close(start, -(last.angle + last.arc / 2), 'centrada no topo');
  // As duas metades são iguais: a mesma letra da segunda frase fica meia volta adiante.
  const half = ring.letters.length / 2;
  close(ring.letters[half].angle - ring.letters[0].angle, 180, 'a segunda embaixo');
});

test('cada letra ocupa a própria largura mais o mesmo respiro: o I menos que o M', () => {
  const ring = sealRing('Capturado por', 'Mimi');
  const arcOf = (glyph: string) => ring.letters.find((letter) => letter.glyph === glyph)!.arc;
  assert.ok(arcOf('I') < arcOf('M'));
  // A diferença dos arcos é a diferença das larguras: o respiro é igual para as duas.
  const perDegree = (2 * Math.PI * sealShape.textRadius) / 360;
  close(
    (arcOf('M') - arcOf('I')) * perDegree,
    (glyphAdvance('M') - glyphAdvance('I')) * ring.letter,
    'respiro igual',
  );
});

test('na letra do desenho quando cabe; menor, e ainda fechando a volta, quando não cabe', () => {
  assert.equal(sealRing('Capturado por', 'ARP Vision').letter, sealShape.letter);
  const long = sealRing('Capturado por', 'Imobiliária e Administradora de Bens Exemplo');
  assert.ok(long.letter < sealShape.letter);
  close(sum(long.letters.map((letter) => letter.arc)), 360);
});

test('letra com acento tem a largura da letra sem ele, e sinal fora da tabela tem a média', () => {
  assert.equal(glyphAdvance('Á'), glyphAdvance('A'));
  assert.equal(glyphAdvance('ç'), glyphAdvance('C'));
  assert.equal(glyphAdvance('ñ'), glyphAdvance('N'));
  assert.ok(glyphAdvance('漢') > 0.5 && glyphAdvance('漢') < 0.9);
});

test('modelo com contato: o nome centrado no topo e o contato centrado na base, lido da esquerda para a direita', () => {
  const arcs = sealArcs('ARP Vision', 'Entre em contato');
  assert.equal(arcs.top.map((letter) => letter.glyph).join(''), 'ARP VISION');
  assert.equal(arcs.bottom.map((letter) => letter.glyph).join(''), 'ENTRE EM CONTATO');
  const middleOf = (letters: typeof arcs.top) =>
    (letters[0].angle + letters[letters.length - 1].angle) / 2;
  // O meio do arco: entre a borda de fora da primeira letra e a da última.
  const top = arcs.top;
  close(
    top[0].angle - top[0].arc / 2,
    -(top[top.length - 1].angle + top[top.length - 1].arc / 2),
    'topo centrado',
  );
  assert.ok(Math.abs(middleOf(arcs.bottom) - 180) < 3, 'base centrada');
  // Em cima no sentido horário; embaixo no anti-horário, com a primeira letra à esquerda.
  assert.ok(top.every((letter, index) => index === 0 || letter.angle > top[index - 1].angle));
  assert.ok(
    arcs.bottom.every(
      (letter, index) => index === 0 || letter.angle < arcs.bottom[index - 1].angle,
    ),
  );
  assert.ok(arcs.bottom[0].angle > 180);
  assert.equal(arcs.letter, sealShape.letter);
});

test('modelo com contato: nenhum arco passa de 150°, e a letra diminui para os dois', () => {
  const arcs = sealArcs('Imobiliária Solução Imóveis', '(51) 99999-0000 whatsapp');
  for (const letters of [arcs.top, arcs.bottom]) {
    const span = sum(letters.map((letter) => letter.arc));
    assert.ok(span <= sealShape.maxArc + 1e-6, `arco de ${span}°`);
  }
  assert.ok(arcs.letter < sealShape.letter && arcs.letter >= sealShape.minLetter);
  // Os exemplos do site, nos três idiomas, cabem na letra do desenho.
  for (const locale of locales) {
    const example = sealArcs('ARP Vision', translations(locale).seal.contactSample);
    assert.equal(example.letter, sealShape.letter, locale);
  }
});

test('o nome do modelo discreto: em maiúsculas, com a largura que o desenho reserva', () => {
  const name = sealName(' ARP Vision ');
  assert.equal(name.text, 'ARP VISION');
  // Um nome mais comprido reserva mais largura, na mesma altura.
  const longer = sealName('Imobiliária Exemplo');
  assert.ok(longer.width > name.width);
  assert.equal(longer.height, name.height);
  // A largura sai das letras: dois I ocupam menos que dois M.
  assert.ok(sealName('II').width < sealName('MM').width);
  // A linha de base centra a maiúscula na altura do desenho.
  assert.ok(name.baseline > name.height / 2 && name.baseline < name.height);
});

test('a seção do selo tem o texto do app em cada idioma', () => {
  assert.equal(translations('pt').seal.capturedBy, 'Capturado por');
  assert.equal(translations('es').seal.capturedBy, 'Capturado por');
  assert.equal(translations('en').seal.capturedBy, 'Captured by');
  // As legendas dos três modelos, as do slide e da tela de Configurações do app.
  assert.deepEqual(translations('pt').seal.models, {
    ring: 'Logo no meio, texto em volta',
    contact: 'Nome em cima, contato embaixo',
    discreet: 'Logo e nome, discretos',
  });
});

test('a seção do selo promete só o que o app faz', () => {
  const sizesAndCorners = {
    pt: /^Três tamanhos e três cantos/,
    es: /^Tres tamaños y tres esquinas/,
    en: /^Three sizes and three corners/,
  };
  const threeModels = { pt: /três modelos/, es: /tres modelos/, en: /three styles/ };
  for (const locale of locales) {
    const seal = translations(locale).seal;
    const all = JSON.stringify(seal);
    // O selo some ou sobe em alguns estados do tour: nada de "o tempo todo" nem de "fica sempre".
    assert.doesNotMatch(
      all,
      /o tempo todo|todo el tiempo|all the time|always|siempre|sempre|stays|remains|se queda|permanece/i,
      locale,
    );
    // Três modelos, três tamanhos e três cantos: é o que a tela de Configurações oferece.
    assert.equal(seal.items.length, 3, locale);
    assert.match(seal.items[0], threeModels[locale], locale);
    assert.match(seal.items[1], sizesAndCorners[locale], locale);
    assert.equal(Object.keys(seal.models).length, 3, locale);
    // O texto de contato do exemplo cabe no limite do app.
    assert.ok([...seal.contactSample].length <= 24, `${locale}: ${seal.contactSample}`);
  }
});
