const marqueeMotion = matchMedia('(prefers-reduced-motion: reduce)');
document.querySelectorAll<HTMLElement>('[data-benefit-marquee]').forEach((marquee) => {
  let visible = false;
  const update = () => {
    marquee.dataset.marqueeRunning = String(visible && !document.hidden && !marqueeMotion.matches);
  };
  const observer = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
      update();
    },
    { threshold: 0.1 },
  );
  observer.observe(marquee);
  document.addEventListener('visibilitychange', update);
  marqueeMotion.addEventListener('change', update);
  marquee.dataset.marqueeEnhanced = 'true';
  update();
});
