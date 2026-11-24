/* Audience drill-down: open an audience from the Library and work its accounts.
   Every audience shows the same sample accounts (first N of one generated list) so the prototype stays simple. */
(() => {
  const PER = 25;
  const KEY = 'mojo-audience-accounts-v1';
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };
  const saved = Object.assign({sent: {}, excluded: {}, targeted: {}}, load());
  const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch {} };

  /* ---------- Sample accounts (deterministic) ---------- */
  const A = ['North', 'Bright', 'Blue', 'Summit', 'Clear', 'Iron', 'Silver', 'Harbor', 'Pine', 'Granite', 'Atlas', 'Beacon', 'Cedar', 'Vector', 'Lumen', 'Orbit', 'Keystone', 'Meridian', 'Nimbus', 'Sterling', 'Tidal', 'Quarry', 'Ridge', 'Willow', 'Apex'];
  const B = ['line', 'path', 'stone', 'field', 'wave', 'gate', 'bridge', 'point', 'forge', 'works', 'leaf', 'crest'];
  const C = [['Systems', 'Technology'], ['Health', 'Healthcare'], ['Analytics', 'Software'], ['Labs', 'Life sciences'], ['Software', 'Software'], ['Financial', 'Financial services'], ['Logistics', 'Transportation'], ['Cloud', 'Software'], ['Networks', 'Telecom'], ['Bio', 'Life sciences'], ['Security', 'Cybersecurity'], ['Energy', 'Energy']];
  const SIZES = ['200–500', '500–1K', '1K–5K', '5K–10K', '10K+'];
  const TOPICS = ['Account-based advertising', 'B2B ad targeting', 'Intent data', 'Marketing attribution', 'Buying group engagement', 'Revenue analytics'];
  const ROLES = ['Budget owner', 'Champion', 'Evaluator', 'Sales partner', 'Approver'];
  const SEEN = ['Today', 'Yesterday', '2 days ago', '4 days ago', '1 week ago', '2 weeks ago'];
  const rand = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const cache = [];
  function account(i) {
    if (cache[i]) return cache[i];
    const r = rand(i * 7919 + 17);
    const a = A[i % 25], b = B[Math.floor(i / 25) % 12], c = C[(i + Math.floor(i / 300) * 5) % 12];
    const intentRoll = r(), intent = intentRoll < .3 ? 'High' : intentRoll < .68 ? 'Medium' : 'Low';
    const engRoll = r() + (intent === 'High' ? .25 : intent === 'Low' ? -.2 : 0);
    const engagement = engRoll > .62 ? 'Engaged' : engRoll > .22 ? 'Seen ads' : 'Not reached';
    let reachedCount = engagement === 'Not reached' ? 0 : Math.max(1, Math.min(5, Math.round(r() * 4 + (engagement === 'Engaged' ? 1.2 : 0))));
    const order = [1, 2, 0, 3, 4].sort(() => r() - .5);
    const reached = ROLES.map((_, k) => order.indexOf(k) < reachedCount);
    const stage = engagement === 'Engaged' && reachedCount >= 3 && intent !== 'Low' ? (r() > .5 ? 'MQA' : 'Engaged') : engagement === 'Engaged' ? 'Engaged' : 'Target';
    const item = {
      i, id: `acct-${i}`,
      name: `${a}${b} ${c[0]}`,
      domain: `${(a + b).toLowerCase()}${i >= 300 ? (c[0].slice(0, 3).toLowerCase()) : ''}.com`,
      industry: c[1], size: SIZES[Math.floor(r() * SIZES.length)],
      intent, topic: TOPICS[Math.floor(r() * TOPICS.length)],
      engagement, seen: engagement === 'Not reached' ? '' : SEEN[Math.floor(r() * SEEN.length)],
      reached, reachedCount, stage,
      linkedinMatch: r() > .22
    };
    item.segment = item.intent === 'High' && item.engagement === 'Engaged' && item.reachedCount >= 3 ? 'ready'
      : item.engagement === 'Not reached' ? 'cold'
      : item.reachedCount <= 2 ? 'gaps' : 'warming';
    item.score = {ready: 3, gaps: 2, cold: 1, warming: 0}[item.segment] * 10 + {High: 3, Medium: 2, Low: 1}[item.intent] * 2 + item.reachedCount;
    return (cache[i] = item);
  }

  const SEGMENTS = {
    all: {label: 'All accounts', tip: 'Every account in this audience.'},
    ready: {label: 'Ready for Sales', tip: 'Researching now, engaging with your ads, and three or more roles reached.',
      what: 'These accounts are researching right now and several people there are engaging with your ads.',
      why: 'This is the moment a rep’s outreach lands best. Wait two weeks and the interest cools.',
      cta: 'Send to Sales', bulk: 'send'},
    gaps: {label: 'Missing decision makers', tip: 'Ads are reaching the account, but only one or two of the five buying roles.',
      what: 'Your ads reach these accounts, but only one or two of the people who decide.',
      why: 'Deals stall when the budget owner or evaluator never hears from you.',
      cta: 'Target the missing roles', bulk: 'target'},
    cold: {label: 'Not reached yet', tip: 'No one at the account has seen an ad yet.',
      what: 'No one at these accounts has seen an ad yet.',
      why: 'Often the platform can’t match the account, or the bid is too low to win the impression.',
      cta: 'Check platform match', bulk: 'match'}
  };

  /* ---------- View state ---------- */
  const view = {audience: '', page: 1, segment: 'all', query: '', selected: new Set(), open: ''};
  const resetFor = id => { if (view.audience !== id) Object.assign(view, {audience: id, page: 1, segment: 'all', query: '', selected: new Set(), open: ''}); };
  const key = (id) => `${view.audience}:${id}`;
  const isSent = a => !!saved.sent[key(a.id)];
  const isExcluded = a => !!saved.excluded[key(a.id)];
  const isTargeted = a => !!saved.targeted[key(a.id)];

  function list(total) {
    const all = Array.from({length: total}, (_, i) => account(i)).sort((x, y) => y.score - x.score || x.i - y.i);
    const counts = {all: total, ready: 0, gaps: 0, cold: 0};
    all.forEach(a => { if (counts[a.segment] != null) counts[a.segment]++; });
    const q = view.query.toLowerCase();
    const shown = all.filter(a => (view.segment === 'all' || a.segment === view.segment) && (!q || a.name.toLowerCase().includes(q) || a.domain.includes(q)));
    return {counts, shown};
  }

  /* ---------- Rendering ---------- */
  const missing = a => ROLES.filter((_, k) => !a.reached[k]);
  const rolesTip = a => ROLES.map((role, k) => `${a.reached[k] ? '✓' : '–'} ${role}`).join('\n');
  function nextStep(a) {
    if (isExcluded(a)) return `<button type="button" class="mp-link aac-quiet" data-aac-undo="${a.id}">Excluded · Undo</button>`;
    if (a.segment === 'ready') return isSent(a) ? '<span class="aac-done">Sent to Sales ✓</span>' : `<button type="button" class="mp-link" data-aac-send="${a.id}">Send to Sales</button>`;
    if (a.segment === 'gaps') return isTargeted(a) ? '<span class="aac-done">Roles added ✓</span>' : `<button type="button" class="mp-link" data-aac-target="${a.id}">Reach the ${esc(missing(a)[0].toLowerCase())}</button>`;
    if (a.segment === 'cold') return `<a class="mp-link" href="#dashboards:${esc(view.audience)}" data-aac-match="${a.id}">${a.linkedinMatch ? 'Raise the bid' : 'Fix LinkedIn match'}</a>`;
    return '<span class="aac-quiet">Keep warming</span>';
  }
  const intentHtml = a => `<span class="mp-status ${a.intent === 'High' ? 'ok' : a.intent === 'Medium' ? 'warn' : 'quiet'}">${a.intent}</span><small>${esc(a.topic)}</small>`;
  const rolesHtml = a => `<span class="aac-roles" data-tip="${esc(rolesTip(a))}">${a.reached.map(on => `<i class="${on ? 'on' : ''}"></i>`).join('')}</span><small>${a.reachedCount} of 5 roles</small>`;
  const engagementHtml = a => `<span class="aac-eng ${a.engagement === 'Engaged' ? 'on' : a.engagement === 'Not reached' ? 'off' : ''}">${a.engagement}</span>${a.seen ? `<small>Last seen ${esc(a.seen)}</small>` : '<small>No ad views</small>'}`;

  function openRow(a) {
    const activity = a.engagement === 'Not reached' ? ['No ad views yet', a.linkedinMatch ? 'Matched on LinkedIn and Demandbase' : 'Not matched on LinkedIn'] :
      [`${a.reachedCount} ${a.reachedCount === 1 ? 'person' : 'people'} saw your ads · last ${a.seen.toLowerCase()}`, a.engagement === 'Engaged' ? 'Visited the pricing page' : 'No site visits yet', `Researching “${a.topic}”`];
    return `<tr class="aac-open-row"><td colspan="7"><div class="aac-open">
      <div><small>Buying group</small><ul class="aac-role-list">${ROLES.map((role, k) => `<li class="${a.reached[k] ? 'on' : ''}"><span>${a.reached[k] ? '✓' : ''}</span>${role}</li>`).join('')}</ul></div>
      <div><small>Recent activity</small><ul class="aac-activity">${activity.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
      <div class="aac-open-actions">${isSent(a) ? '<span class="aac-done">Sent to Sales ✓</span>' : `<button type="button" class="mp-btn" data-aac-send="${a.id}">Send to Sales</button>`}${missing(a).length && !isTargeted(a) ? `<button type="button" class="mp-btn mp-btn-secondary" data-aac-target="${a.id}">Reach missing roles</button>` : ''}${isExcluded(a) ? `<button type="button" class="mp-link aac-quiet" data-aac-undo="${a.id}">Undo exclude</button>` : `<button type="button" class="mp-link aac-quiet" data-aac-exclude="${a.id}">Exclude from this audience</button>`}</div>
    </div></td></tr>`;
  }

  function render(section) {
    const total = Number(section.dataset.total) || 0;
    const {counts, shown} = list(total);
    const pages = Math.max(1, Math.ceil(shown.length / PER));
    view.page = Math.min(view.page, pages);
    const start = (view.page - 1) * PER, rows = shown.slice(start, start + PER);
    const seg = SEGMENTS[view.segment];
    const allOnPage = rows.length && rows.every(a => view.selected.has(a.id));
    const pageNums = (() => {
      const set = new Set([1, pages, view.page - 1, view.page, view.page + 1].filter(n => n >= 1 && n <= pages));
      const out = []; let prev = 0;
      [...set].sort((x, y) => x - y).forEach(n => { if (n - prev > 1) out.push('…'); out.push(n); prev = n; });
      return out;
    })();
    section.innerHTML = `
      <div class="aac-head"><div><h2>Accounts in this audience</h2><p>Who’s in it, how far along they are, and what to do about each one.</p></div>
        <label class="aac-search"><svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="4.5"/><path d="m10.5 10.5 3 3"/></svg><input type="search" data-aac-search placeholder="Find an account" value="${esc(view.query)}" aria-label="Find an account"></label></div>
      <div class="aac-segments" role="tablist" aria-label="Filter accounts">${Object.entries(SEGMENTS).map(([id, s]) => `<button type="button" role="tab" aria-selected="${view.segment === id}" class="${view.segment === id ? 'is-on' : ''} aac-seg-${id}" data-aac-seg="${id}" data-tip="${esc(s.tip)}"><strong>${counts[id].toLocaleString()}</strong><span>${s.label}</span></button>`).join('')}</div>
      ${seg.what ? `<div class="aac-wwd"><p><b>${esc(seg.what)}</b> ${esc(seg.why)}</p><button type="button" class="mp-btn" data-aac-bulk="${seg.bulk}" data-aac-scope="segment">${esc(seg.cta)} · ${counts[view.segment].toLocaleString()}</button></div>` : ''}
      <div class="aac-bulk" ${view.selected.size ? '' : 'hidden'}><span><b>${view.selected.size}</b> selected</span><button type="button" class="mp-link" data-aac-bulk="send">Send to Sales</button><button type="button" class="mp-link" data-aac-bulk="target">Reach missing roles</button><button type="button" class="mp-link" data-aac-bulk="exclude">Exclude</button><button type="button" class="mp-link" data-aac-bulk="export">Export CSV</button><button type="button" class="mp-link aac-quiet" data-aac-clear>Clear</button></div>
      <div class="aud-table-scroll aac-scroll"><table class="aac-table"><thead><tr>
        <th class="aac-check"><input type="checkbox" data-aac-all ${allOnPage ? 'checked' : ''} aria-label="Select all on this page"></th>
        <th>Account</th>
        <th><span data-tip="How actively the account is researching topics you sell into, from Demandbase intent.">Intent</span></th>
        <th><span data-tip="Of the five people who usually decide (budget owner, champion, evaluator, sales partner, approver), how many have seen your ads.">Buying group</span></th>
        <th><span data-tip="Engaged means someone clicked or visited your site after seeing an ad.">Ad engagement</span></th>
        <th><span data-tip="Where the account sits in your Demandbase journey. Customers and open opportunities are left out automatically.">Stage</span></th>
        <th>Next step</th></tr></thead>
        <tbody>${rows.map(a => `<tr data-aac-row="${a.id}" class="${view.open === a.id ? 'is-open' : ''} ${isExcluded(a) ? 'is-excluded' : ''}">
          <td class="aac-check"><input type="checkbox" data-aac-pick="${a.id}" ${view.selected.has(a.id) ? 'checked' : ''} aria-label="Select ${esc(a.name)}"></td>
          <th scope="row"><button type="button" class="aac-name" data-aac-toggle="${a.id}" aria-expanded="${view.open === a.id}">${esc(a.name)}<span class="aac-chev" aria-hidden="true">›</span></button><small>${esc(a.industry)} · ${esc(a.size)} employees</small></th>
          <td class="aac-nowrap">${intentHtml(a)}</td>
          <td class="aac-nowrap">${rolesHtml(a)}</td>
          <td class="aac-nowrap">${engagementHtml(a)}</td>
          <td class="aac-nowrap">${esc(a.stage)}</td>
          <td class="aac-nowrap">${nextStep(a)}</td></tr>${view.open === a.id ? openRow(a) : ''}`).join('')}</tbody></table>
        ${rows.length ? '' : '<p class="aac-empty">No accounts match. Try another filter or search.</p>'}</div>
      <nav class="aac-pager" aria-label="Account pages"><span>${shown.length ? `${(start + 1).toLocaleString()}–${(start + rows.length).toLocaleString()} of ${shown.length.toLocaleString()} accts` : '0 accts'}</span>
        <div><button type="button" data-aac-page="${view.page - 1}" ${view.page <= 1 ? 'disabled' : ''} aria-label="Previous page">‹</button>${pageNums.map(n => n === '…' ? '<span class="aac-gap">…</span>' : `<button type="button" data-aac-page="${n}" class="${n === view.page ? 'is-on' : ''}" ${n === view.page ? 'aria-current="page"' : ''}>${n}</button>`).join('')}<button type="button" data-aac-page="${view.page + 1}" ${view.page >= pages ? 'disabled' : ''} aria-label="Next page">›</button></div></nav>
      <p class="aac-toast" role="status" aria-live="polite"></p>`;
  }

  /* ---------- Mount into the Library detail ---------- */
  const audienceId = () => (location.hash.match(/^#dashboards:([\w-]+)/) || [])[1] || '';
  function mount() {
    const detail = document.querySelector('.aud-content #aud-detail');
    const content = detail?.closest('.aud-content');
    if (!detail || !content || content.querySelector('.aac-section')) return;
    const id = audienceId();
    resetFor(id);
    content.classList.add('aud-drill');
    const total = parseInt((detail.querySelector('.aud-tiles strong')?.textContent || '0').replace(/[^\d]/g, ''), 10) || 0;
    detail.insertAdjacentHTML('beforebegin', '<a class="aac-back mp-link" href="#dashboards">← Audience library</a>');
    const section = document.createElement('section');
    section.className = 'aac-section';
    section.dataset.total = total;
    detail.after(section);
    render(section);
    content.closest('.aud-app-body, main')?.scrollTo?.({top: 0});
    window.scrollTo({top: 0});
  }

  const toast = (section, text) => { const t = section.querySelector('.aac-toast'); if (!t) return; t.textContent = text; t.classList.add('is-on'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('is-on'), 2600); };
  const byId = id => account(Number(id.replace('acct-', '')));
  function bulk(section, kind, scope) {
    const total = Number(section.dataset.total) || 0;
    const targets = scope === 'segment' ? list(total).shown : [...view.selected].map(byId);
    if (kind === 'export') {
      const csv = ['Account,Domain,Industry,Employees,Intent,Roles reached,Ad engagement,Stage', ...targets.map(a => [a.name, a.domain, a.industry, a.size, a.intent, a.reachedCount, a.engagement, a.stage].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
      const link = Object.assign(document.createElement('a'), {href: URL.createObjectURL(new Blob([csv], {type: 'text/csv'})), download: `${view.audience || 'audience'}-accounts.csv`});
      link.click(); URL.revokeObjectURL(link.href);
      return toast(section, `Exported ${targets.length} accts.`);
    }
    if (kind === 'match') { location.hash = `#dashboards:${view.audience}`; return toast(section, `Mojo is checking platform match for ${targets.length.toLocaleString()} accts. Results land in your Feed.`); }
    const store = {send: saved.sent, target: saved.targeted, exclude: saved.excluded}[kind];
    targets.forEach(a => { store[key(a.id)] = true; });
    persist(); view.selected.clear(); render(section);
    toast(section, {send: `Sent ${targets.length.toLocaleString()} accts to Sales. Reps see them in Salesforce today.`, target: `Added the missing roles for ${targets.length.toLocaleString()} accts to the LinkedIn campaign draft.`, exclude: `Excluded ${targets.length.toLocaleString()} accts from this audience.`}[kind]);
  }

  document.addEventListener('click', e => {
    const section = e.target.closest('.aac-section');
    if (!section) {
      const row = e.target.closest('.aud-content .aud-table tbody tr');
      if (row && !e.target.closest('a, button, input')) { const link = row.querySelector('th a[href^="#dashboards:"]'); if (link) location.hash = link.getAttribute('href'); }
      return;
    }
    const t = e.target;
    const seg = t.closest('[data-aac-seg]'); if (seg) { view.segment = seg.dataset.aacSeg; view.page = 1; view.selected.clear(); view.open = ''; return render(section); }
    const page = t.closest('[data-aac-page]'); if (page && !page.disabled) { view.page = Number(page.dataset.aacPage); view.open = ''; render(section); return section.scrollIntoView({block: 'start', behavior: 'smooth'}); }
    const toggle = t.closest('[data-aac-toggle]'); if (toggle) { view.open = view.open === toggle.dataset.aacToggle ? '' : toggle.dataset.aacToggle; return render(section); }
    const send = t.closest('[data-aac-send]'); if (send) { saved.sent[key(send.dataset.aacSend)] = true; persist(); render(section); return toast(section, `Sent ${byId(send.dataset.aacSend).name} to Sales.`); }
    const target = t.closest('[data-aac-target]'); if (target) { saved.targeted[key(target.dataset.aacTarget)] = true; persist(); render(section); return toast(section, `Added the missing roles at ${byId(target.dataset.aacTarget).name} to the LinkedIn campaign draft.`); }
    const exclude = t.closest('[data-aac-exclude]'); if (exclude) { saved.excluded[key(exclude.dataset.aacExclude)] = true; persist(); render(section); return toast(section, `Excluded ${byId(exclude.dataset.aacExclude).name}.`); }
    const undo = t.closest('[data-aac-undo]'); if (undo) { delete saved.excluded[key(undo.dataset.aacUndo)]; persist(); return render(section); }
    const match = t.closest('[data-aac-match]'); if (match) { e.preventDefault(); return toast(section, `Mojo is checking ${byId(match.dataset.aacMatch).name} across platforms. Results land in your Feed.`); }
    const b = t.closest('[data-aac-bulk]'); if (b) return bulk(section, b.dataset.aacBulk, b.dataset.aacScope);
    if (t.closest('[data-aac-clear]')) { view.selected.clear(); return render(section); }
    const row = t.closest('tr[data-aac-row]');
    if (row && !t.closest('a, button, input')) { view.open = view.open === row.dataset.aacRow ? '' : row.dataset.aacRow; render(section); }
  });
  document.addEventListener('change', e => {
    const section = e.target.closest('.aac-section'); if (!section) return;
    const pick = e.target.closest('[data-aac-pick]');
    if (pick) { pick.checked ? view.selected.add(pick.dataset.aacPick) : view.selected.delete(pick.dataset.aacPick); return render(section); }
    if (e.target.matches('[data-aac-all]')) {
      const ids = [...section.querySelectorAll('[data-aac-pick]')].map(x => x.dataset.aacPick);
      ids.forEach(id => e.target.checked ? view.selected.add(id) : view.selected.delete(id));
      render(section);
    }
  });
  document.addEventListener('input', e => {
    if (!e.target.matches('.aac-section [data-aac-search]')) return;
    const section = e.target.closest('.aac-section');
    view.query = e.target.value.trim(); view.page = 1;
    clearTimeout(section._q);
    section._q = setTimeout(() => { render(section); const input = section.querySelector('[data-aac-search]'); input.focus(); input.setSelectionRange(input.value.length, input.value.length); }, 180);
  });

  new MutationObserver(mount).observe(document.documentElement, {childList: true, subtree: true});
  mount();
})();
