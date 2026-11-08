// O fim do título da dor troca sozinho: a cada 2,5 s mostra o trecho seguinte, por 2 voltas, e
// para no primeiro, que é o da frase inteira do leitor de tela. Começa quando o título aparece na
// tela e, com movimento reduzido, nem começa. Os trechos já estão no HTML, um <span> cada, e o
// script só troca a classe do que aparece.
const interval = 2500;
const laps = 2;
const motion = matchMedia('(prefers-reduced-motion: reduce)');

document.querySelectorAll<HTMLElement>('[data-rotating-phrase]').forEach((phrase) => {
  const parts = [...phrase.children];
  if (parts.length < 2 || motion.matches) return;
  let shown = 0;
  const show = (index: number) => {
    parts[shown].classList.remove('is-active');
    parts[index].classList.add('is-active');
    shown = index;
  };
  const start = () => {
    // Cada volta passa por todos os trechos e termina de novo no primeiro.
    let changes = parts.length * laps;
    const timer = window.setInterval(() => {
      changes -= 1;
      // Quem liga o movimento reduzido no meio para a troca na hora, no primeiro trecho.
      if (changes === 0 || motion.matches) {
        window.clearInterval(timer);
        show(0);
      } else show((shown + 1) % parts.length);
    }, interval);
  };
  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      start();
    },
    { threshold: 0.6 },
  );
  observer.observe(phrase);
});
