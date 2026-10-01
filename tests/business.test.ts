import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateUsage, appLink, whatsappLink } from '../src/lib/business';
import { site, featureGroups } from '../src/config/site';

test('configuração publica os quatro planos do app sem oferta anual ou pacotes indefinidos', () => {
  const [individual, professional, business, enterprise] = site.pricing.plans;
  assert.deepEqual(
    site.pricing.plans.map((plan) => [plan.name, plan.billing]),
    [
      ['Individual', 'once'],
      ['Professional', 'monthly'],
      ['Business', 'monthly'],
      ['Enterprise', 'custom'],
    ],
  );
  assert.equal(site.pricing.freeTrialCredits, 1);
  // O teste grátis vale 7 dias no app desde 01/10/2026.
  assert.equal(site.pricing.freeTrialDays, 7);
  assert.deepEqual(
    [individual.credits, individual.pixPrice, individual.oneTimePrice, individual.installments],
    [8, 229, 279, 12],
  );
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
  assert.ok(featureGroups.every((group) => group.rows.every((row) => row.values.length === 4)));
});
test('calculadora mensal exclui o teste e o Individual e respeita 20/80 ambientes', () => {
  assert.equal(calculateUsage(1, 8).plan?.name, 'Professional');
  assert.equal(calculateUsage(2, 10).plan?.name, 'Professional');
  assert.equal(calculateUsage(3, 8).plan?.name, 'Business');
  assert.equal(calculateUsage(10, 8).plan?.name, 'Business');
  assert.equal(calculateUsage(11, 8).plan, null);
});
test('custo mensal usa os espaços efetivos', () => {
  const result = calculateUsage(5, 8);
  assert.equal(result.credits, 40);
  assert.equal(result.plan?.name, 'Business');
  assert.equal(result.perProperty, result.plan!.monthlyPrice! / 5);
  assert.equal(result.twelveMonthPrice, result.plan!.monthlyPrice! * 12);
});
test('cenário além do maior plano não inventa preço nem custo por espaço', () => {
  const result = calculateUsage(200, 15);
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
test('WhatsApp comercial abre com o número completo e a mensagem codificada', () => {
  const url = new URL(whatsappLink('Olá! Quero saber mais.'));
  assert.equal(url.origin + url.pathname, 'https://wa.me/5551995273661');
  assert.equal(url.searchParams.get('text'), 'Olá! Quero saber mais.');
});
