/* Build: a launch plan at a glance. Budget by platform + when each campaign runs if launched today.
   Reads the same drafts as the Build list (window.MojoBuild); re-renders whenever the list does. */
(() => {
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const money = v => { const n = Number(String(v ?? '').replace(/[^0-9.]/g, '')); return Number.isFinite(n) ? n : 0; };
  const usd = n => n >= 1000 ? `$${(n / 1000).toFixed(n % 1000 ? 1 : 0)}k` : `$${Math.round(n)}`;
  const DAY = 864e5;
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const fmt = d => `${MONTHS[d.getMonth()]} ${d.getDate()}`;
  const PLATFORMS = {
    'Demandbase Ads': {logo: 'assets/demandbase.png', color: '#1f2a6b'},
    'LinkedIn Ads': {logo: 'assets/linkedin.png', color: '#0a66c2'},
    'Google Ads': {logo: 'assets/google-ads.svg', color: '#34a853'}
  };
  const today = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; })();
  /* "Nov 11–Dec 18" → dates; "28 days" → starts today. */
  function window_(flight) {
    const m = String(flight || '').match(/([A-Z][a-z]{2})\s+(\d{1,2})\s*[–-]\s*([A-Z][a-z]{2})?\s*(\d{1,2})/);
    if (m) {
      const y = today.getFullYear();
      const start = new Date(y, MONTHS.indexOf(m[1]), +m[2]);
      const end = new Date(y, MONTHS.indexOf(m[3] || m[1]), +m[4]);
      if (end < start) end.setFullYear(y + 1);
      return {start, end, fixed: true};
    }
    const days = parseInt(flight, 10) || 28;
    return {start: today, end: new Date(+today + (days - 1) * DAY), fixed: false};
  }
  const HOLIDAY = (() => { const y = today.getMonth() === 0 ? today.getFullYear() - 1 : today.getFullYear(); return {start: new Date(y, 11, 22), end: new Date(y + 1, 0, 2)}; })();

  function model() {
    const B = window.MojoBuild;
    if (!B) return null;
    const items = B.read().map((d, i) => ({d, i, stage: B.stage(d), ch: B.channel(d), ini: B.initiative(d), f: B.facts(d), name: d.planTitle || d.name || 'Campaign'})).filter(x => x.stage === 'ready' || x.stage === 'draft');
    if (!items.length) return null;
    const byPlatform = {}, byInitiative = {};
    items.filter(x => x.stage === 'ready').forEach(x => { byPlatform[x.ch] = (byPlatform[x.ch] || 0) + money(x.f.budget); byInitiative[x.ini || 'Other'] = (byInitiative[x.ini || 'Other'] || 0) + money(x.f.budget); });
    const total = Object.values(byPlatform).reduce((a, b) => a + b, 0);
    const groups = [];
    items.forEach(x => {
      let g = groups.find(g => g.name === x.name && g.stage === x.stage);
      if (!g) groups.push(g = {name: x.name, stage: x.stage, members: [], ...window_(x.f.flight), budget: 0});
      g.members.push(x); g.budget += money(x.f.budget);
    });
    return {byPlatform, byInitiative, total, groups};
  }

  function html(m) {
    const plats = Object.entries(m.byPlatform).sort((a, b) => b[1] - a[1]);
    const bar = plats.map(([p, v]) => `<i style="flex:${v};background:${(PLATFORMS[p] || {}).color || '#8a818d'}" title="${esc(p)} ${usd(v)}"></i>`).join('');
    const legend = plats.map(([p, v]) => `<li>${PLATFORMS[p] ? `<img src="${PLATFORMS[p].logo}" alt="">` : ''}<span>${esc(p.replace(/ Ads$/, ''))}</span><b>${usd(v)}</b><small>${Math.round(v / m.total * 100)}%</small></li>`).join('');
    const start = new Date(Math.min(+today, ...m.groups.map(g => +g.start)));
    const end = new Date(Math.max(+HOLIDAY.end + 2 * DAY, ...m.groups.map(g => +g.end)));
    const span = (end - start) / DAY;
    const pct = d => Math.max(0, Math.min(100, (d - start) / DAY / span * 100));
    const ticks = []; for (let d = new Date(start); d <= end; d = new Date(+d + 7 * DAY)) ticks.push(d);
    const holidayHits = m.groups.filter(g => g.end >= HOLIDAY.start && g.start <= HOLIDAY.end);
    const pastStart = m.groups.filter(g => g.fixed && g.start < today);
    const rows = m.groups.map(g => {
      const past = g.start < today ? `<i class="mbv-past" style="left:${pct(g.start)}%;width:${pct(today) - pct(g.start)}%"></i>` : '';
      return `<li class="is-${g.stage}"><button type="button" data-mbv-jump="${esc(g.name)}" title="${esc(g.name)} · ${fmt(g.start)}–${fmt(g.end)} · ${usd(g.budget)}"><span class="mbv-name">${esc(g.name)}</span><span class="mbv-track">${past}<i class="mbv-bar" style="left:${pct(Math.max(+g.start, +today))}%;width:${Math.max(1.5, pct(g.end) - pct(Math.max(+g.start, +today)))}%"></i></span><span class="mbv-meta">${g.members.map(x => PLATFORMS[x.ch] ? `<img src="${PLATFORMS[x.ch].logo}" alt="${esc(x.ch)}">` : '').join('')}<b>${usd(g.budget)}</b></span></button></li>`;
    }).join('');
    const notes = [
      holidayHits.length ? `<li><span class="mbv-dot warn"></span><p><b>${holidayHits.length} of ${m.groups.length} campaigns run into the holiday slowdown</b> (${fmt(HOLIDAY.start)}–${fmt(HOLIDAY.end)}), when B2B buyers are mostly out. Consider ending before it or holding budget for January.</p></li>` : '',
      pastStart.length ? `<li><span class="mbv-dot warn"></span><p><b>${esc(pastStart[0].name)} was set to start ${fmt(pastStart[0].start)}.</b> Launching today gives it ${Math.round((pastStart[0].end - today) / DAY) + 1} of its ${Math.round((pastStart[0].end - pastStart[0].start) / DAY) + 1} days.</p></li>` : ''
    ].join('');
    return `<section class="mbv" aria-label="Launch plan at a glance">
      <div class="mbv-budget"><h3>Where the ${usd(m.total)} goes</h3><div class="mbv-stack">${bar}</div><ul class="mbv-legend">${legend}</ul><h3 class="mbv-sub">By initiative</h3><ul class="mbv-ini">${Object.entries(m.byInitiative).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<li><span>${esc(k)}</span><i><b style="width:${Math.round(v / Math.max(...Object.values(m.byInitiative)) * 100)}%"></b></i><em>${usd(v)}</em></li>`).join('')}</ul></div>
      <div class="mbv-schedule"><h3>When it runs if you launch today</h3>
        <div class="mbv-chart" style="--rows:${m.groups.length}"><div class="mbv-axis"><span class="mbv-name"></span><span class="mbv-track">${ticks.map(d => `<em style="left:${pct(d)}%">${fmt(d)}</em>`).join('')}<i class="mbv-holiday" style="left:${pct(HOLIDAY.start)}%;width:${pct(HOLIDAY.end) - pct(HOLIDAY.start)}%"><span>Holidays</span></i><i class="mbv-today" style="left:${pct(today)}%"><span>Today</span></i></span><span class="mbv-meta"></span></div><ul class="mbv-rows">${rows}</ul></div>
        <div class="mbv-key"><span><i class="k-ready"></i>Ready</span><span><i class="k-draft"></i>Draft</span></div>
      </div>
      ${notes ? `<ul class="mbv-notes">${notes}</ul>` : ''}
    </section>`;
  }

  const OPEN_KEY = 'mojo-build-plan-open-v1';
  const isOpen = () => { try { return localStorage.getItem(OPEN_KEY) === 'true'; } catch { return false; } };
  function syncToggle(batch, plan) {
    let t = batch.querySelector('.mbv-toggle');
    if (!t) {
      t = Object.assign(document.createElement('button'), {type: 'button', className: 'mbv-toggle'});
      const launch = batch.querySelector('[data-review-launch]');
      launch ? launch.before(t) : batch.append(t);
    }
    const open = isOpen();
    t.setAttribute('aria-expanded', String(open));
    t.innerHTML = `${open ? 'Hide launch plan' : 'Show launch plan'}<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4"/></svg>`;
    plan.hidden = !open;
  }
  function mount() {
    const batch = document.querySelector('.mbj-batch');
    if (!batch) return;
    const m = model(); if (!m) return;
    const markup = html(m);
    const existing = batch.parentElement.querySelector(':scope > .mbv');
    if (existing && existing.dataset.sig === markup.length + ':' + m.total) { if (!batch.querySelector('.mbv-toggle')) syncToggle(batch, existing); return; }
    existing?.remove();
    batch.insertAdjacentHTML('afterend', markup);
    const plan = batch.parentElement.querySelector(':scope > .mbv');
    plan.dataset.sig = markup.length + ':' + m.total;
    syncToggle(batch, plan);
  }
  document.addEventListener('click', e => {
    const t = e.target.closest('.mbv-toggle');
    if (t) { try { localStorage.setItem(OPEN_KEY, String(!isOpen())); } catch {} const batch = t.closest('.mbj-batch'); syncToggle(batch, batch.parentElement.querySelector(':scope > .mbv')); return; }
    const b = e.target.closest('[data-mbv-jump]'); if (!b) return;
    const card = [...document.querySelectorAll('.mbj-card')].find(c => c.querySelector('h3')?.textContent.trim().startsWith(b.dataset.mbvJump));
    if (!card) return;
    card.scrollIntoView({behavior: 'smooth', block: 'center'});
    card.classList.add('mbv-flash'); setTimeout(() => card.classList.remove('mbv-flash'), 1400);
  });
  new MutationObserver(() => requestAnimationFrame(mount)).observe(document.documentElement, {childList: true, subtree: true});
  mount();
})();
