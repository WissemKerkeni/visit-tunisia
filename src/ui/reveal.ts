/**
 * Elements marked data-reveal fade and rise into place when they scroll into view, one after another
 * (--i sets the order within a group). Nothing moves for visitors who ask for reduced motion.
 */
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function reveal(root: ParentNode) {
  const els = [...root.querySelectorAll<HTMLElement>('[data-reveal]:not(.in)')];
  if (reduced() || !('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('in')); return () => {}; }
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  els.forEach((e) => io.observe(e));
  return () => io.disconnect();
}

/** Mark a list of elements to reveal in turn. */
export function stagger<T extends HTMLElement>(els: T[], step = 1): T[] {
  els.forEach((e, i) => { e.dataset.reveal = ''; e.style.setProperty('--i', String((i % 8) * step)); });
  return els;
}

/** Count a number up from zero when it appears (the trip's distance, say). */
export function countUp(el: HTMLElement, to: number, fmt: (n: number) => string = (n) => String(n)) {
  if (reduced()) { el.textContent = fmt(to); return; }
  const t0 = performance.now(), dur = 900;
  const step = (t: number) => {
    const k = Math.min(1, (t - t0) / dur), e = 1 - (1 - k) ** 3;
    el.textContent = fmt(Math.round(to * e));
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
