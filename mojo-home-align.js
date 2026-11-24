/* Home feed cards behave like Campaigns Feed cards: primary link, "See why" beside it, tools on the right. */
(() => {
  const text = n => (n?.textContent || '').replace(/\s+/g, ' ').trim();
  const sentence = v => { const t = v.toLowerCase(); return t.charAt(0).toUpperCase() + t.slice(1); };
  const AREA_SOURCE = {Campaigns: 'Campaign delivery and spend', AEO: 'AI answer checks and GA4 visits', Audiences: 'Audience records and platform match rates'};
  function align(card) {
    if (card.dataset.homeAligned) return;
    const actions = card.querySelector('.home-actions');
    if (!actions) return;
    card.dataset.homeAligned = 'true';
    card.querySelectorAll('.home-meta > span').forEach(tag => { tag.textContent = sentence(text(tag)); });
    const primary = actions.querySelector(':scope > a');
    const area = text(card.querySelector('.home-source'));
    const title = text(card.querySelector('h3'));
    card._why = {
      title,
      reason: `Mojo spotted this: ${title}`.replace(/[.?]?$/, '.'),
      source: AREA_SOURCE[area] || 'Connected account and campaign data',
      triggerType: 'Mojo Brain',
      triggerReason: text(card.querySelector('h3 + p')),
      nextStep: primary ? text(primary).replace(/\s*→$/, '') : '',
      href: primary?.getAttribute('href') || '',
      linkLabel: primary ? text(primary).replace(/\s*→$/, '') : 'Open it'
    };
    if (!actions.querySelector('[data-home-why]')) {
      const button = Object.assign(document.createElement('button'), {type: 'button', className: 'mojo-see-why', textContent: 'See why'});
      button.dataset.homeWhy = '';
      button.setAttribute('aria-expanded', 'false');
      if (primary) primary.after(button); else actions.prepend(button);
    }
  }
  const run = () => document.querySelectorAll('.home-card').forEach(align);
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-home-why]');
    if (!b) return;
    e.preventDefault();
    window.MojoSeeWhy?.open(b.closest('.home-card')?._why || {}, b);
  });
  new MutationObserver(run).observe(document.documentElement, {childList: true, subtree: true});
  run();
})();
