# Planos da ARP Vision

Versão 1, decidida em 24/09/2026. Valores em reais.

## Como os créditos funcionam

- **1 ambiente = 1 crédito.** Cada cômodo capturado pela câmera do app e montado pela IA gasta
  um crédito. Um espaço (um imóvel, uma loja, um hotel) costuma ter de 6 a 10 ambientes.
- **Se a IA falhar, o crédito volta** para o saldo.
- **Fotos 360° enviadas da galeria não gastam crédito.** Servem para quem já tem uma câmera 360°.
- **Os créditos são da empresa.** Administradores e usuários da mesma conta usam o mesmo saldo.
  Vale para qualquer negócio que precise de tour 360°, não só imobiliária.

## Os planos

- **Teste grátis:**: Empresa nova ganha 1 crédito apenas. Hoje ganha 5, vamos precisar alterar isso.

| Plano | Preço | Ambientes | Tours no ar | Tempo no ar |
|---|---|---|---|---|
| Individual | R$ 279, pagamento único | 8 (+R$ 20 por ambiente extra) | 1 | 1 ano, renovável por R$ 79 |
| Professional | R$ 249 por mês | 20 por mês | até 30 | enquanto a assinatura estiver ativa |
| Business | R$ 599 por mês | 80 por mês | até 120 | enquanto a assinatura estiver ativa |
| Enterprise | sob consulta | sob medida | combinado em contrato | combinado em contrato |

### Individual

Um tour, sem mensalidade.

- Pagamento único de R$ 279, com 8 ambientes.
- Cada ambiente além dos 8 custa R$ 20.
- O tour fica no ar por 1 ano.
- Para manter o tour no ar por mais um ano, o cliente paga R$ 79.

### Professional e Business

- A mensalidade dá 20 ambientes por mês no Professional e 80 no Business.
- Os tours ficam no ar enquanto a assinatura estiver ativa, dentro do limite de tours no ar do
  plano.
- Nos ultimos 7 dias vamos enviar emails ao usuário dizendo que o tour vai sair do ar

### Enterprise

Solução sob medida para os requisitos do cliente. Preço, volume e limites são combinados em
contrato. Para contratar, o cliente entra em contato.

## Limite de tours no ar

O limite equivale a cerca de 12 meses do que o plano produz, contando ~8 ambientes por espaço.

- Conta só tour **publicado e não oculto**. Rascunhos e tours ocultos ficam fora da conta.
- No limite, o app bloqueia a publicação de um tour novo e sugere ocultar um tour que já cumpriu
  o papel (um imóvel vendido, um espaço reformado) ou mudar de plano.
- O app nunca tira um tour do ar sozinho por causa do limite.
- Quem cancela uma mensalidade pode manter tours no ar pagando R$ 79 por tour por ano, o mesmo
  valor da renovação do Individual.

## Cancelamento

Se o cliente cancelar, o tour fica no ar até o fim do mês já pago. Sete dias antes de o tour
sair do ar, o cliente recebe um e-mail avisando.

## Custos e margem (uso interno)

Margem é o que sobra do preço depois do imposto, da taxa do meio de pagamento (~4%), da IA e da
hospedagem que cresce com o uso.

| | Custo dos ambientes | Margem com imposto de 6% | Margem com imposto de 15,5% |
|---|---|---|---|
| Individual (R$ 279) | R$ 11,20 | 86% | 76% |
| Professional (R$ 249) | R$ 28,00 | 79% | 69% |
| Business (R$ 599) | R$ 112,00 | 71% | 62% |
| Renovação (R$ 79) | ~R$ 2 de hospedagem | 87% | 78% |

Premissas:

- **R$ 1,40 por ambiente:** IA a US$ 0,19 (dólar a R$ 5,16, mais IOF e 10% de folga para
  falhas) e 12 meses de hospedagem.
- **Uso de 100% dos ambientes do plano**, que é o pior caso.
- **Imposto:** 6% no Simples Nacional com Fator R (pró-labore de pelo menos 28% do faturamento)
  e 15,5% sem ele.
- **Custos fixos ficam fora da margem:** Render, contador, INSS do pró-labore e o resto somam de
  ~R$ 410 a ~R$ 900 por mês e entram no ponto de equilíbrio.
- **Dólar:** se subir 30%, as margens caem de 1 a 6 pontos, conforme o plano.
- **Hospedagem no limite de tours no ar:** ~R$ 5 por mês no Professional e ~R$ 21 no Business,
  com a arquitetura atual. Cai para centavos quando as fotos deixarem de ser gravadas também no
  Postgres.

## Ainda não definido

- **Ambiente extra** no Professional e no Business.
- **Ambientes que sobram no mês:** se passam para o mês seguinte.
- **Pagamento que falha:** o que acontece com a assinatura e com os tours.
- **Individual:** se o ano começa na compra ou na publicação do tour.
- **Plano anual:** se existe, e com qual desconto.
- **Cobrança e nota fiscal:** o meio de pagamento e a emissão de nota, que dependem do CNPJ.
