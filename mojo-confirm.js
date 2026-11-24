/* One confirmation layout for every card in Campaigns, Home, Audiences and AEO.
   ✓  What happened              (15px/600)
      What was saved             (14px)
      Where it applies           (12px, muted)
      Primary link · See why · Undo
   Existing confirmations keep their elements (other scripts update them); this only adds the shared classes. */
(() => {
  const CHECK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12l5 5L20 7"/></svg>';
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  /* For new confirmations (Audiences, AEO). actions: [{label, attrs, href, kind: 'primary'|'undo'}] */
  function html({title, detail = '', meta = '', actions = [], declined = false}) {
    const acts = actions.map(a => a.href
      ? `<a class="mcf-${a.kind || 'primary'}" href="${esc(a.href)}" ${a.attrs || ''}>${esc(a.label)}</a>`
      : `<button type="button" class="mcf-${a.kind || 'primary'}" ${a.attrs || ''}>${esc(a.label)}</button>`).join('');
    return `<div class="mcf${declined ? ' is-declined' : ''}" role="status"><span class="mcf-check" aria-hidden="true">${declined ? '–' : CHECK}</span><div class="mcf-body"><strong class="mcf-title">${esc(title)}</strong>${detail ? `<p class="mcf-detail">${esc(detail)}</p>` : ''}${meta ? `<small class="mcf-meta">${esc(meta)}</small>` : ''}${acts ? `<div class="mcf-actions">${acts}</div>` : ''}</div></div>`;
  }
  const tag = (el, cls) => el && el.classList.add(cls);
  function normalize(box) {
    if (box.dataset.mcf) return;
    box.dataset.mcf = '1';
    box.classList.add('mcf');
    if (box.classList.contains('mfd-quick-declined')) box.classList.add('is-declined');
    if (box.classList.contains('home-done-receipt')) {
      /* Flat Home receipt → same structure, same nodes for the Undo button. */
      const check = box.querySelector('.home-done-check'), title = box.querySelector(':scope > span:not(.home-done-check)'), undo = box.querySelector('button');
      const body = document.createElement('div'); body.className = 'mcf-body';
      body.innerHTML = `<strong class="mcf-title">Approved</strong><p class="mcf-detail">${esc(title?.textContent || '')}</p><div class="mcf-actions"></div>`;
      if (undo) { undo.classList.add('mcf-undo'); body.querySelector('.mcf-actions').append(undo); }
      box.querySelector(':scope > strong')?.remove(); title?.remove();
      if (check) { check.className = 'home-done-check mcf-check'; check.innerHTML = CHECK; }
      box.append(body);
      return;
    }
    const check = box.querySelector(':scope > .mfd-quick-check');
    if (check) { tag(check, 'mcf-check'); if (!box.classList.contains('is-declined')) check.innerHTML = CHECK; }
    const body = box.querySelector(':scope > div'); tag(body, 'mcf-body');
    if (!body) return;
    tag(body.querySelector(':scope > strong'), 'mcf-title');
    tag(body.querySelector(':scope > p, :scope > .seq-receipt-decision'), 'mcf-detail');
    tag(body.querySelector(':scope > small, :scope > .seq-receipt-meta'), 'mcf-meta');
    const actions = body.querySelector(':scope > .mfd-quick-links, :scope > .mic-saved-actions'); tag(actions, 'mcf-actions');
    actions?.querySelectorAll('button, a').forEach(b => { if (/undo/i.test(b.textContent.trim()) && b.textContent.trim().length < 8) b.classList.add('mcf-undo'); });
  }
  const run = () => document.querySelectorAll('.mic-confirmation, .mfd-quick-receipt, .home-done-receipt').forEach(normalize);
  new MutationObserver(run).observe(document.documentElement, {childList: true, subtree: true});
  run();
  window.MojoConfirm = {html};
})();
