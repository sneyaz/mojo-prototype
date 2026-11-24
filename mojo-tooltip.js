/* One black tooltip for any element with data-tip. Positioned on the page, so table edges never clip it. */
(() => {
  let tip;
  const show = target => {
    const text = target.getAttribute('data-tip');
    if (!text) return;
    tip ||= Object.assign(document.createElement('div'), {className: 'mojo-tip', role: 'tooltip'});
    tip.textContent = text;
    document.body.append(tip);
    const r = target.getBoundingClientRect(), t = tip.getBoundingClientRect();
    const left = Math.min(Math.max(8, r.left + r.width / 2 - t.width / 2), innerWidth - t.width - 8);
    const below = r.bottom + 8 + t.height < innerHeight;
    tip.style.left = `${left}px`;
    tip.style.top = `${below ? r.bottom + 8 : r.top - t.height - 8}px`;
    tip.classList.add('is-on');
  };
  const hide = () => tip?.classList.remove('is-on');
  document.addEventListener('mouseover', e => { const t = e.target.closest?.('[data-tip]'); if (t) show(t); });
  document.addEventListener('mouseout', e => { if (e.target.closest?.('[data-tip]') && !e.relatedTarget?.closest?.('[data-tip]')) hide(); });
  document.addEventListener('focusin', e => { const t = e.target.closest?.('[data-tip]'); if (t) show(t); });
  document.addEventListener('focusout', hide);
  document.addEventListener('scroll', hide, true);
})();
