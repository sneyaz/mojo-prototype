/* Reveal feed evidence as each insight enters view. */
(() => {
  const selector = '.home-card, article.mfc-card, .aud-feed-item';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const observed = new WeakSet();
  const animated = new WeakSet();
  const ease = t => 1 - Math.pow(1 - t, 3);

  function fill(progress, delay) {
    if (animated.has(progress)) return;
    animated.add(progress);
    const target = progress.value;
    if (!target || reduced.matches) return;
    const label = progress.textContent.trim();
    if (label) progress.setAttribute('aria-valuetext', label);
    let start;
    const begin = performance.now() + delay;
    progress.value = 0;
    function step(now) {
      if (!progress.isConnected) return;
      if (now < begin) { requestAnimationFrame(step); return; }
      start ??= now;
      const t = Math.min(1, (now - start) / 720);
      progress.value = target * ease(t);
      if (t < 1) requestAnimationFrame(step);
      else { progress.value = target; progress.removeAttribute('aria-valuetext'); }
    }
    requestAnimationFrame(step);
  }

  function reveal(card) {
    if (!card.isConnected || card.classList.contains('mm-entered')) return;
    card.classList.add('mm-entered');
    card.querySelectorAll('progress').forEach((progress, index) => fill(progress, 100 + index * 105));
  }

  const observer = 'IntersectionObserver' in window
    ? new IntersectionObserver(entries => {
        for (const entry of entries) if (entry.isIntersecting) {
          observer.unobserve(entry.target);
          reveal(entry.target);
        }
      }, {threshold: .12, rootMargin: '0px 0px 36px 0px'})
    : null;

  function scan() {
    document.querySelectorAll(selector).forEach(card => {
      if (observed.has(card)) return;
      observed.add(card);
      if (reduced.matches || !observer) reveal(card);
      else observer.observe(card);
    });
  }

  let queued = false;
  new MutationObserver(() => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; scan(); });
  }).observe(document.body, {childList: true, subtree: true});
  scan();
})();
