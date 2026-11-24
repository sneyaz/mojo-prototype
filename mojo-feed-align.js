/* Make AEO and Audiences Feed cards behave like Campaigns Feed cards:
   one primary link, "See why" beside it (expands the same explanation panel), card tools on the right.
   The old "Details" disclosure and best-practice chip become part of See why. */
(() => {
  const text = node => (node?.textContent || '').replace(/\s+/g, ' ').trim();
  function align(card) {
    if (card.dataset.feedAligned) return;
    const main = card.querySelector('.aud-feed-main');
    const actions = main?.querySelector('.aud-feed-actions');
    if (!main || !actions) return;
    card.dataset.feedAligned = 'true';
    card.classList.add('mfa-card');
    const primary = [...actions.querySelectorAll(':scope > a')].find(a => !a.classList.contains('aud-source-chip'));
    primary?.classList.add('mfa-primary');
    const chip = actions.querySelector('.aud-source-chip');
    const details = main.querySelector(':scope > details:not(.mojo-card-more)');
    const receiptDetail = main.querySelector('.aeo-receipt-detail');
    const detailBox = details?.querySelector('.aud-feed-detail') || receiptDetail;
    let label;
    const quiet = text(detailBox?.querySelector('.aud-feed-quiet')).replace(/^Source:\s*/i, '');
    const clean = detailBox?.cloneNode(true);
    clean?.querySelectorAll('strong, small, .aud-feed-quiet, .aud-feedback, button, output, a').forEach(node => node.remove());
    const isSourceBox = /^source record$/i.test(label = text(detailBox?.querySelector('strong')));
    const raw = isSourceBox ? '' : text(clean);
    const reason = raw.charAt(0).toUpperCase() + raw.slice(1);
    const sentence = value => { const v = value.toLowerCase(); return v.charAt(0).toUpperCase() + v.slice(1); };
    const why = {
      title: text(main.querySelector('h3')),
      reason: (() => { const intro = text(main.querySelector(':scope > p')), title = text(main.querySelector('h3')); const r = reason && reason !== intro ? reason : ''; return r || `Mojo spotted this: ${title}`.replace(/[.?]?$/, '.'); })(),
      source: (isSourceBox ? text(clean) : '') || quiet || text(card.closest('.aud-content')?.querySelector('.aud-source')) || 'Sample records',
      triggerType: (/^(Only count|Set a|Assign an owner|Always|Never)\b/i.test(text(main.querySelector('h3'))) || /modeled on your customers|Without a landing page/i.test(text(main.querySelector(':scope > p')))) && !chip ? 'Inferred Best Practice' : chip ? 'Best practice' : 'Mojo Brain',
      triggerReason: chip ? text(chip).replace(/^▣\s*Best practice\s*·\s*/, '') : (text(main.querySelector(':scope > p')) || sentence(text(main.querySelector('.aud-feed-type')))),
      nextStep: primary ? text(primary).replace(/\s*→$/, '') : '',
      href: chip?.getAttribute('href') || primary?.getAttribute('href') || '',
      linkLabel: chip ? 'See the rule' : (primary ? text(primary).replace(/\s*→$/, '') : 'Open it')
    };
    card._mfaWhy = why;
    main.querySelectorAll('.aud-feed-meta .aud-feed-type, .aud-feed-meta .aud-decision-tag').forEach(tag => { const t = text(tag).toLowerCase(); tag.textContent = t.charAt(0).toUpperCase() + t.slice(1); });
    chip?.setAttribute('hidden', '');
    details?.setAttribute('hidden', '');
    card.querySelector('.aeo-receipt-toggle')?.setAttribute('hidden', '');
    receiptDetail?.setAttribute('hidden', '');
    if (!actions.querySelector('[data-mfa-why]')) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'mojo-see-why';
      button.dataset.mfaWhy = '';
      button.setAttribute('aria-expanded', 'false');
      button.textContent = 'See why';
      const anchor = primary || actions.querySelector(':scope > .aud-feed-primary');
      if (anchor) anchor.after(button); else actions.prepend(button);
    }
  }
  const run = () => document.querySelectorAll('.aud-content .aud-feed-item:not(.is-done)').forEach(align);
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-mfa-why]');
    if (!button) return;
    event.preventDefault();
    const card = button.closest('.aud-feed-item');
    window.MojoSeeWhy?.open(card?._mfaWhy || {}, button);
  });
  new MutationObserver(run).observe(document.documentElement, {childList: true, subtree: true});
  run();
})();
