/* One black tooltip for any element with data-tip. Positioned on the page, so table edges never clip it.
   Add data-tip-links="Label|href;;Label|href" to list links; the tooltip then stays open while you move into it. */
(() => {
  let tip, owner, hideTimer;
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const place = target => {
    const r = target.getBoundingClientRect(), t = tip.getBoundingClientRect();
    const left = Math.min(Math.max(8, r.left + r.width / 2 - t.width / 2), innerWidth - t.width - 8);
    const below = r.bottom + 6 + t.height < innerHeight;
    tip.style.left = `${left}px`;
    tip.style.top = `${below ? r.bottom + 6 : r.top - t.height - 6}px`;
  };
  const show = target => {
    const text = target.getAttribute('data-tip');
    if (!text) return;
    clearTimeout(hideTimer);
    owner = target;
    tip ||= Object.assign(document.createElement('div'), {className: 'mojo-tip', role: 'tooltip'});
    const links = (target.getAttribute('data-tip-links') || '').split(';;').filter(Boolean).map(item => item.split('|'));
    tip.classList.toggle('has-links', links.length > 0);
    tip.innerHTML = `<span>${esc(text)}</span>${links.length ? `<span class="mojo-tip-links">${links.map(([label, href]) => `<a href="${esc(href)}">${esc(label)} <span aria-hidden="true">→</span></a>`).join('')}</span>` : ''}`;
    document.body.append(tip);
    place(target);
    tip.classList.add('is-on');
  };
  const hideSoon = () => { clearTimeout(hideTimer); hideTimer = setTimeout(() => { tip?.classList.remove('is-on'); owner = null; }, tip?.classList.contains('has-links') ? 220 : 0); };
  document.addEventListener('mouseover', e => {
    if (tip && tip.contains(e.target)) { clearTimeout(hideTimer); return; }
    const t = e.target.closest?.('[data-tip]');
    if (t) show(t);
  });
  document.addEventListener('mouseout', e => {
    const from = e.target.closest?.('[data-tip]') || (tip && tip.contains(e.target) ? tip : null);
    if (!from) return;
    const to = e.relatedTarget;
    if (to && (tip?.contains(to) || (owner && owner.contains(to)))) return;
    hideSoon();
  });
  document.addEventListener('focusin', e => { const t = e.target.closest?.('[data-tip]'); if (t) show(t); else if (!tip?.contains(e.target)) hideSoon(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { tip?.classList.remove('is-on'); owner?.focus?.(); } });
  document.addEventListener('scroll', () => { tip?.classList.remove('is-on'); }, true);
})();
