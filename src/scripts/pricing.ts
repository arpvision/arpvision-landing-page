// Planos: carrossel no celular, seletor mensal/anual com preço em "painel eletrônico",
// varredura holográfica e lantejoulas, e entrada dos cards no desktop. Sem dependências.
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

// Mesmo formato do `price()` do site: centavos só quando o valor não é inteiro.
const formatPrice = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);

// Preço em odômetro: cada dígito vira uma fita 0–9 (CSS) que gira até o novo valor, da
// esquerda para a direita. O texto do elemento continua sendo o preço real.
const showPrice = (element: HTMLElement, value: number) => {
  const text = formatPrice(value);
  const previous = element.textContent ?? '';
  if (reducedMotion.matches) {
    element.textContent = text;
    return;
  }
  const digits: { node: HTMLElement; target: number }[] = [];
  element.replaceChildren(
    ...[...text].map((char, index) => {
      if (!/\d/.test(char)) return document.createTextNode(char);
      const digit = document.createElement('span');
      digit.className = 'odo-digit';
      const inner = document.createElement('span');
      inner.textContent = char;
      digit.append(inner);
      // Parte do dígito anterior na mesma posição (ou de um aleatório), como um contador.
      const start = /\d/.test(previous[index] ?? '')
        ? Number(previous[index])
        : Math.floor(Math.random() * 10);
      digit.style.setProperty('--digit', String(start));
      digit.style.setProperty('--order', String(digits.length));
      digits.push({ node: digit, target: Number(char) });
      return digit;
    }),
  );
  // Dois quadros: a posição inicial é pintada antes de a fita girar.
  requestAnimationFrame(() =>
    requestAnimationFrame(() =>
      digits.forEach(({ node, target }) => node.style.setProperty('--digit', String(target))),
    ),
  );
};

// Reinicia uma animação CSS ligada a um atributo (pulso do seletor, varredura dos cards).
// O atributo sai quando termina a animação mais longa (`lastAnimation`).
const replay = (element: HTMLElement, attribute: string, lastAnimation: string) => {
  if (reducedMotion.matches) return;
  element.removeAttribute(attribute);
  void element.offsetWidth;
  element.setAttribute(attribute, '');
  const done = (event: AnimationEvent) => {
    if (event.animationName !== lastAnimation) return;
    element.removeAttribute(attribute);
    element.removeEventListener('animationend', done);
  };
  element.addEventListener('animationend', done);
};

// Lantejoulas: discos metálicos com furo que giram no ar (vistos de frente ou de perfil)
// e soltam um reflexo em estrela quando ficam de frente para a luz.
const SEQUIN_COLORS = [
  ['#2f6bff', '#0347cc'],
  ['#9cbcff', '#4a7dff'],
  ['#5eead4', '#0f9d8f'],
  ['#f8fafc', '#94a3b8'],
];
const sparkle = (context: CanvasRenderingContext2D, size: number, alpha: number) => {
  context.globalAlpha = alpha;
  context.fillStyle = '#ffffff';
  // Halo azul: o reflexo aparece também sobre o fundo claro.
  context.shadowColor = 'rgba(4, 84, 237, 0.75)';
  context.shadowBlur = size * 0.9;
  context.beginPath();
  for (let i = 0; i < 8; i++) {
    const radius = i % 2 === 0 ? size : size * 0.18;
    const angle = (i * Math.PI) / 4;
    context.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
  }
  context.closePath();
  context.fill();
};
const sequins = (origin: DOMRect) => {
  if (reducedMotion.matches) return;
  const canvas = document.createElement('canvas');
  const ratio = Math.min(devicePixelRatio || 1, 2);
  canvas.width = innerWidth * ratio;
  canvas.height = innerHeight * ratio;
  canvas.className = 'pricing-sequins';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.append(canvas);
  const context = canvas.getContext('2d')!;
  context.scale(ratio, ratio);
  const x = origin.left + origin.width / 2;
  const y = origin.top + origin.height / 2;
  const life = 140;
  const pieces = Array.from({ length: 70 }, () => {
    const angle = ((-90 + (Math.random() - 0.5) * 140) * Math.PI) / 180;
    const speed = 5 + Math.random() * 9;
    return {
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 4.5 + Math.random() * 3.5,
      tilt: Math.random() * Math.PI,
      flip: Math.random() * Math.PI * 2,
      flipSpeed: 0.12 + Math.random() * 0.22,
      sway: Math.random() * Math.PI * 2,
      colors: SEQUIN_COLORS[Math.floor(Math.random() * SEQUIN_COLORS.length)],
    };
  });
  let tick = 0;
  const frame = () => {
    tick += 1;
    context.clearRect(0, 0, innerWidth, innerHeight);
    const fade = tick > life * 0.65 ? 1 - (tick - life * 0.65) / (life * 0.35) : 1;
    pieces.forEach((piece) => {
      piece.vx = piece.vx * 0.975 + Math.sin(tick * 0.08 + piece.sway) * 0.09;
      piece.vy = piece.vy * 0.975 + 0.2;
      piece.x += piece.vx;
      piece.y += piece.vy;
      piece.flip += piece.flipSpeed;
      piece.tilt += piece.vx * 0.01;
      // Giro em 3D: o disco achata conforme vira de perfil.
      const facing = Math.cos(piece.flip);
      const squash = Math.max(0.08, Math.abs(facing));
      context.save();
      context.translate(piece.x, piece.y);
      context.rotate(piece.tilt);
      context.globalAlpha = fade;
      context.scale(1, squash);
      const gradient = context.createRadialGradient(
        -piece.radius * 0.35,
        -piece.radius * 0.35,
        0,
        0,
        0,
        piece.radius,
      );
      gradient.addColorStop(0, '#ffffff');
      gradient.addColorStop(0.35, piece.colors[0]);
      gradient.addColorStop(1, piece.colors[1]);
      context.strokeStyle = gradient;
      context.lineWidth = piece.radius * 0.76;
      context.beginPath();
      context.arc(0, 0, piece.radius * 0.62, 0, Math.PI * 2);
      context.stroke();
      context.restore();
      // Reflexo: só quando a lantejoula está quase de frente.
      const glint = Math.pow(Math.max(0, facing), 14);
      if (glint > 0.05) {
        context.save();
        context.translate(piece.x, piece.y);
        context.rotate(Math.PI / 8);
        sparkle(context, piece.radius * 2.4, glint * fade);
        context.restore();
      }
    });
    if (tick < life) requestAnimationFrame(frame);
    else canvas.remove();
  };
  requestAnimationFrame(frame);
};

document.querySelectorAll<HTMLElement>('[data-pricing]').forEach((root) => {
  const grid = root.querySelector<HTMLElement>('[data-pricing-grid]')!;
  const cards = [...grid.querySelectorAll<HTMLElement>('.plan-card')];

  // Seletor mensal/anual (só existe com desconto anual configurado).
  const toggle = root.querySelector<HTMLElement>('[data-billing-toggle]');
  if (toggle) {
    const button = toggle.querySelector<HTMLButtonElement>('[data-billing-switch]')!;
    const status = toggle.querySelector<HTMLElement>('[data-billing-status]')!;
    const setAnnual = (annual: boolean) => {
      if ((button.getAttribute('aria-checked') === 'true') === annual) return;
      button.setAttribute('aria-checked', String(annual));
      toggle.dataset.billingMode = annual ? 'annual' : 'monthly';
      root.querySelectorAll<HTMLElement>('[data-price-annual]').forEach((element) => {
        showPrice(
          element,
          Number(annual ? element.dataset.priceAnnual : element.dataset.priceMonthly),
        );
        // A varredura e o anel de energia marcam os cards cujo preço mudou.
        if (annual) replay(element.closest<HTMLElement>('.plan-card')!, 'data-boost', 'plan-ring');
      });
      root.querySelectorAll<HTMLElement>('[data-payment-annual]').forEach((element) => {
        element.textContent = annual
          ? element.dataset.paymentAnnual!
          : element.dataset.paymentMonthly!;
      });
      status.textContent = annual
        ? 'Mostrando os preços do plano anual, com desconto.'
        : 'Mostrando os preços mensais.';
      if (annual) {
        replay(button, 'data-pulse', 'billing-pulse');
        sequins(button.getBoundingClientRect());
      }
    };
    toggle.dataset.billingMode = 'monthly';
    button.addEventListener('click', () =>
      setAnnual(button.getAttribute('aria-checked') !== 'true'),
    );
    toggle
      .querySelectorAll<HTMLElement>('[data-billing-option]')
      .forEach((option) =>
        option.addEventListener('click', () =>
          setAnnual(option.dataset.billingOption === 'annual'),
        ),
      );
  }

  // Entrada no desktop: os cards sobem e se acomodam quando a grade aparece na tela.
  if (grid.dataset.reveal === 'pending') {
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        grid.dataset.reveal = 'done';
        observer.disconnect();
      },
      { threshold: 0.2 },
    );
    observer.observe(grid);
  }

  // Carrossel no celular: abre no plano recomendado e mostra "Plano X de Y".
  // No desktop a grade não rola e os controles ficam ocultos via CSS.
  const carouselStatus = root.querySelector<HTMLElement>('[data-carousel-status]')!;
  const prev = root.querySelector<HTMLButtonElement>('[data-carousel-prev]')!;
  const next = root.querySelector<HTMLButtonElement>('[data-carousel-next]')!;
  const isCarousel = () => grid.scrollWidth > grid.clientWidth + 1;
  const offsetOf = (card: HTMLElement) =>
    card.offsetLeft - grid.offsetLeft - parseFloat(getComputedStyle(grid).scrollPaddingLeft || '0');
  const current = () => {
    // O último card não chega a alinhar à esquerda: no fim da rolagem, ele é o atual.
    if (grid.scrollLeft >= grid.scrollWidth - grid.clientWidth - 2) return cards.length - 1;
    let index = 0;
    cards.forEach((card, i) => {
      if (offsetOf(card) <= grid.scrollLeft + 10) index = i;
    });
    return index;
  };
  const go = (index: number) => {
    const card = cards[Math.max(0, Math.min(cards.length - 1, index))];
    // scrollTo no próprio carrossel: não mexe na rolagem vertical da página.
    grid.scrollTo({ left: offsetOf(card), behavior: 'smooth' });
  };
  const update = () => {
    const index = current();
    const name = cards[index].querySelector('h3')?.textContent?.trim() ?? '';
    carouselStatus.textContent = `${name} · plano ${index + 1} de ${cards.length}`;
    prev.disabled = index === 0;
    next.disabled = index === cards.length - 1;
  };
  prev.addEventListener('click', () => go(current() - 1));
  next.addEventListener('click', () => go(current() + 1));
  let frame = 0;
  grid.addEventListener(
    'scroll',
    () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    },
    { passive: true },
  );
  const recommended = cards.findIndex((card) => card.classList.contains('recommended'));
  if (isCarousel() && recommended > 0) grid.scrollLeft = offsetOf(cards[recommended]);
  update();
});
