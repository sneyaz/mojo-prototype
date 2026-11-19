/* Keep the Brief rail honest about scope, human work, and optional setup. */
document.addEventListener('DOMContentLoaded', () => {
  const rail = document.querySelector('.brief-ledger-layout > aside');
  const scopeBox = rail?.querySelector(':scope > .sidebox:first-child');
  const routineBox = rail?.querySelector(':scope > .sidebox:nth-child(2)');
  const optionalBox = rail?.querySelector(':scope > .brief-opportunity');
  const guardrailBox = [...(rail?.querySelectorAll(':scope > .sidebox') || [])]
    .find(box => box.textContent.includes('Your rules, my guardrails'));
  if (!scopeBox || !routineBox) return;
  if (guardrailBox) {
    // The source's dark-card inline style adds padding that misaligns this rail section.
    guardrailBox.removeAttribute('style');
    guardrailBox.classList.add('brief-guardrail-box');
  }

  const scopeState = document.createElement('strong');
  scopeState.className = 'brief-scope-state';
  scopeState.setAttribute('aria-live', 'polite');
  const scopeCopy = scopeBox.querySelector(':scope > p');
  const scopeTitle = scopeBox.querySelector(':scope > span');
  scopeTitle?.after(scopeState);
  if (scopeCopy) {
    const context = document.createElement('details');
    context.className = 'mojo-data-details brief-rail-context';
    const summary = document.createElement('summary');
    summary.textContent = 'About this view';
    context.append(summary, scopeCopy);
    scopeState.after(context);
  }
  const scopeLink = scopeBox.querySelector(':scope > a.lnk');
  if (scopeLink) {
    scopeLink.href = '#brief-focus-controls';
    scopeLink.textContent = 'Filter this Brief';
    scopeLink.addEventListener('click', event => {
      event.preventDefault();
      window.mojoBriefSetView?.('needs');
      requestAnimationFrame(() => document.getElementById('brief-focus-controls')?.scrollIntoView({ block: 'center', behavior: 'smooth' }));
    });
  }
  const renderScope = scope => {
    if (!scopeCopy) return;
    const mode = scope?.mode || 'all';
    const records = scope?.records || [];
    if (mode === 'all') {
      scopeState.textContent = '';
      scopeState.hidden = true;
      scopeCopy.textContent = 'Across 3 connected ad sources. Pacing follows each flight plan; the performance window is last 30 days.';
      return;
    }
    scopeState.hidden = false;
    const single = records.length === 1 ? records[0] : null;
    const label = mode === 'soon' ? 'Ending soon' : mode === 'attention' ? 'Needs attention'
      : single ? `${single.client ? `${single.client} · ` : ''}${single.name}` : 'Selected campaigns';
    scopeState.textContent = `${label} · ${records.length} named ${records.length === 1 ? 'campaign' : 'campaigns'}`;
    const platform = records.length === 1 && ['Google Ads', 'LinkedIn Ads', 'Demandbase Ads'].includes(records[0].platform)
      ? ` · ${records[0].platform}` : '';
    scopeCopy.textContent = `Showing the ${records.length} source-backed ${records.length === 1 ? 'row' : 'rows'} in this focus${platform}. Portfolio totals are hidden until you return to All campaigns.`;
  };
  renderScope(window.mojoBriefFocus);
  window.addEventListener('mojo-brief-focus-change', event => renderScope(event.detail));

  routineBox.classList.add('brief-routine-box');
  const routineTitle = routineBox.querySelector(':scope > div:first-child > span:first-child');
  if (routineTitle) routineTitle.textContent = 'Mojo’s routines';
  const routineCount = routineBox.querySelector(':scope > div:first-child > span:last-child');
  if (routineCount) routineCount.textContent = '6 of 9 shown';
  const routines = [...routineBox.querySelectorAll(':scope > .rt')];
  const states = [
    ['found', 'Found', 'Every 2h · 12 min ago · 1 finding'],
    ['found', 'Found', 'Daily · 3 findings'],
    ['handled', 'Handled', 'Daily · 6 fixes completed'],
    ['needs', 'Needs you', 'Mondays · 3 drafts ready to read'],
    ['handled', 'Handled', 'Monthly · filed today'],
    ['watching', 'Watching', 'Weekly · Demandbase ad groups']
  ];
  routines.forEach((row, index) => {
    const [state, label, detail] = states[index] || [];
    if (!state) return;
    row.dataset.status = state;
    const copy = row.querySelector(':scope > div');
    const small = copy?.querySelector('small');
    if (small) small.textContent = detail;
    const chip = row.querySelector(':scope > span');
    if (chip) chip.textContent = label;
  });
  // A person's draft review comes first; completed work stays in the receipt area.
  [routines[3], routines[0], routines[1], routines[5], routines[2], routines[4]].forEach(row => {
    if (row) routineBox.querySelector(':scope > a.lnk')?.before(row);
  });

  const guardrailLink = guardrailBox?.querySelector('a');
  if (guardrailLink) {
    guardrailLink.href = 'Settings.html';
    guardrailLink.textContent = 'Open settings →';
  }
  if (optionalBox && guardrailBox) {
    guardrailBox.after(optionalBox);
    optionalBox.classList.add('brief-optional-signals');
    const names = ['Salesforce', 'Tag Manager', 'LinkedIn Ads'];
    const rows = [...optionalBox.querySelectorAll(':scope > .rt')];
    const heading = optionalBox.querySelector(':scope > span');
    const intro = optionalBox.querySelector('.brief-opportunity-intro');
    if (intro) intro.hidden = true;
    const storageKey = 'mojo-dismissed-connections-v1';
    let dismissed = new Set();
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
      if (Array.isArray(saved)) dismissed = new Set(saved.filter(name => names.includes(name)));
    } catch (_) {}
    const restore = document.createElement('button');
    restore.type = 'button';
    restore.className = 'brief-optional-restore';
    restore.addEventListener('click', () => {
      dismissed.clear();
      persist();
      render();
      rows[0]?.querySelector('.brief-optional-dismiss')?.focus();
    });
    optionalBox.append(restore);
    function persist() {
      try { localStorage.setItem(storageKey, JSON.stringify([...dismissed])); } catch (_) {}
    }
    function render() {
      rows.forEach((row, index) => { row.hidden = dismissed.has(names[index]); });
      const allHidden = rows.length > 0 && rows.every(row => row.hidden);
      optionalBox.classList.toggle('brief-optional-all-hidden', allHidden);
      if (heading) heading.textContent = allHidden ? 'Connections hidden' : 'The signals you’re missing';
      if (intro) intro.hidden = true;
      restore.hidden = dismissed.size === 0;
      restore.textContent = allHidden ? 'Show connections' : `Show ${dismissed.size} hidden`;
    }
    rows.forEach((row, index) => {
      const dismiss = document.createElement('button');
      dismiss.type = 'button';
      dismiss.className = 'brief-optional-dismiss';
      dismiss.innerHTML = '<svg viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="M2 2l8 8M10 2l-8 8"/></svg>';
      dismiss.setAttribute('aria-label', `Dismiss ${names[index]} suggestion`);
      dismiss.title = `Dismiss ${names[index]}`;
      dismiss.addEventListener('click', () => {
        dismissed.add(names[index]);
        persist();
        render();
        const next = rows.slice(index + 1).find(item => !item.hidden)
          || rows.slice(0, index).find(item => !item.hidden);
        (next?.querySelector('.brief-optional-dismiss') || restore).focus();
      });
      row.append(dismiss);
    });
    render();
  }
  guardrailBox?.remove();
});
