import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateUsage, appLink, whatsappLink, founderMessage } from '../src/lib/business';
import { site, featureGroups } from '../src/config/site';

test('configuração publica os cinco planos decididos sem oferta anual ou pacotes indefinidos', () => {
  const [free, individual, professional, business, enterprise] = site.pricing.plans;
  assert.deepEqual(
    site.pricing.plans.map((plan) => [plan.name, plan.billing]),
    [
      ['Teste grátis', 'free'],
      ['Individual', 'once'],
      ['Professional', 'monthly'],
      ['Business', 'monthly'],
      ['Enterprise', 'custom'],
    ],
  );
  assert.deepEqual([free.credits, individual.credits, individual.oneTimePrice], [1, 8, 279]);
  assert.deepEqual(
    [individual.liveTours, individual.extraRoomPrice, individual.renewalPrice],
    [1, 20, 79],
  );
  assert.deepEqual(
    [professional.monthlyPrice, professional.credits, professional.liveTours],
    [249, 20, 30],
  );
  assert.deepEqual([business.monthlyPrice, business.credits, business.liveTours], [599, 80, 120]);
  assert.deepEqual(
    [enterprise.monthlyPrice, enterprise.credits, enterprise.liveTours],
    [null, null, null],
  );
  assert.ok(site.pricing.plans.every((plan) => plan.users === null));
  assert.equal(site.pricing.annualDiscount, null);
  assert.deepEqual(site.pricing.extraCredits, []);
  assert.ok(featureGroups.every((group) => group.rows.every((row) => row.values.length === 5)));
});
test('calculadora mensal exclui o teste e o Individual e respeita 20/80 ambientes', () => {
  assert.equal(calculateUsage(1, 8, 1).plan?.name, 'Professional');
  assert.equal(calculateUsage(2, 10, 1).plan?.name, 'Professional');
  assert.equal(calculateUsage(3, 8, 1).plan?.name, 'Business');
  assert.equal(calculateUsage(10, 8, 1).plan?.name, 'Business');
  assert.equal(calculateUsage(11, 8, 1).plan, null);
});
test('custo mensal usa os espaços efetivos e não presume limite de equipe', () => {
  const result = calculateUsage(5, 8, 50);
  assert.equal(result.credits, 40);
  assert.equal(result.plan?.name, 'Business');
  assert.equal(result.cameraInvestment, 50 * site.market.cameraPrice);
  assert.equal(result.perProperty, result.plan!.monthlyPrice! / 5);
  assert.equal(result.twelveMonthPrice, result.plan!.monthlyPrice! * 12);
});
test('cenário além do maior plano não inventa preço nem custo por espaço', () => {
  const result = calculateUsage(200, 15, 50);
  assert.equal(result.credits, 3000);
  assert.equal(result.plan, null);
  assert.equal(result.perProperty, null);
  assert.equal(result.twelveMonthPrice, null);
});
test('conta e login apontam ao app com origem e seção rastreáveis', () => {
  for (const route of ['register', 'login'] as const) {
    const url = new URL(appLink('seção de teste', route));
    assert.equal(url.origin, 'https://arpvision.app');
    assert.equal(url.pathname, `/${route}`);
    assert.equal(url.searchParams.get('utm_source'), 'site');
    assert.equal(url.searchParams.get('utm_medium'), 'seção de teste');
    assert.equal(url.searchParams.get('utm_campaign'), 'landing');
  }
});
test('WhatsApp ausente não produz link para número inventado; mensagem mantém os campos', () => {
  assert.equal(whatsappLink(), '#contato');
  const message = founderMessage({
    name: 'Ana',
    company: 'Casa & Cia',
    city: 'São Paulo / SP',
    agents: '5',
    phone: '(11) 99999-0000',
  });
  assert.ok(message.includes('Empresa: Casa & Cia'));
  assert.ok(message.includes('Cidade/UF: São Paulo / SP'));
  assert.ok(message.includes('Tamanho da equipe: 5'));
});
