import test from 'node:test';
import assert from 'node:assert/strict';
import { locales, translations } from '../src/i18n';
import { sealName, sealRing } from '../src/lib/seal';

// O selo do canto do tour, na seção "Seu tour, sua identidade" da home. O desenho repete o do
// app: a frase "Capturado por · Nome" dá a volta inteira no anel, duas vezes.

test('o anel leva a frase e o nome duas vezes, em maiúsculas, com o separador do app', () => {
  assert.equal(
    sealRing('Capturado por', 'ARP Vision').text,
    'CAPTURADO POR · ARP VISION · CAPTURADO POR · ARP VISION · ',
  );
});

test('o giro centra a primeira frase no topo: metade do arco que ela ocupa, para trás', () => {
  // 26 letras da frase em 58 da volta inteira.
  assert.equal(sealRing('Capturado por', 'ARP Vision').rotation, -(26 / 58) * 180);
  // Uma frase mais longa ocupa mais da volta, e gira mais.
  const longer = sealRing('Captured by', 'Example Realty of Barcelona').rotation;
  assert.ok(longer < sealRing('Captured by', 'ARP Vision').rotation);
  // A primeira frase nunca passa de meia volta: o giro fica entre -90° e 0°.
  assert.ok(longer > -90 && longer < 0);
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
  for (const locale of locales) {
    const seal = translations(locale).seal;
    const all = JSON.stringify(seal);
    // O selo some ou sobe em alguns estados do tour: nada de "o tempo todo".
    assert.doesNotMatch(
      all,
      /o tempo todo|todo el tiempo|all the time|always|siempre|sempre/i,
      locale,
    );
    // Três modelos, três tamanhos e três cantos: é o que a tela de Configurações oferece.
    assert.equal(seal.items.length, 3, locale);
    assert.equal(Object.keys(seal.models).length, 3, locale);
    // O texto de contato do exemplo cabe no limite do app.
    assert.ok([...seal.contactSample].length <= 24, `${locale}: ${seal.contactSample}`);
  }
});

test('o nome do modelo discreto: em maiúsculas, com a largura que o desenho reserva', () => {
  const name = sealName(' ARP Vision ');
  assert.equal(name.text, 'ARP VISION');
  // Nove letras e um espaço: a letra larga conta mais que o espaço.
  assert.equal(name.width, 9 * name.letterWidth + name.spaceWidth);
  assert.ok(name.letterWidth > name.spaceWidth);
  // Um nome mais comprido reserva mais largura, na mesma altura.
  const longer = sealName('Imobiliária Exemplo');
  assert.ok(longer.width > name.width);
  assert.equal(longer.height, name.height);
  // A linha de base centra a maiúscula na altura do desenho.
  assert.ok(name.baseline > name.height / 2 && name.baseline < name.height);
});
