/*
 * Canvas campaign editor.
 *
 * Opens a Build campaign in the canvas: one view for the whole campaign, however
 * many ad platforms it runs on. Shared setup (accounts, creative, landing page,
 * tracking, schedule, budget split) is edited once; each platform gets one card
 * with only its own settings, rendered from window.MojoAdPlatforms. This file has
 * no platform-specific code.
 *
 * Deep link: CampaignLifecycle.html?view=build#edit=<campaign id>[&field=<key>]
 * Depends on window.MojoBuild (exposed by mojo-build-journey.js).
 */
(() => {
  const onBuild = location.pathname.endsWith('/CampaignLifecycle.html') && new URLSearchParams(location.search).get('view') === 'build';
  if (!onBuild && !window.MojoCanvasEditorStandalone) return; /* standalone: preview pages that provide their own window.MojoBuild */
  const main = document.getElementById('lifecycle-content');
  const P = window.MojoAdPlatforms;
  if (!main || !P) return;
  const {text, list} = P.helpers;
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[char]));
  const host = url => { try { return new URL(text(url)).host.replace(/^www\./, ''); } catch { return ''; } };
  /* Flight dates: stored as "Nov 11–Dec 18" (or a legacy "28 days"), edited with real date pickers. */
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dayStart = date => new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const addDays = (date, n) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + n);
  const isoDate = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const fromIso = value => { const m = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null; };
  const shortDate = date => `${MONTHS[date.getMonth()]} ${date.getDate()}`;
  const spanDays = (start, end) => Math.round((end - start) / 86400000) + 1;
  function parseFlight(value) {
    const v = text(value), today = dayStart(new Date());
    const days = v.match(/^(\d+)\s*days?$/i);
    if (days) return {start: today, end: addDays(today, Number(days[1]) - 1)};
    const parts = v.split(/\s*[–-]\s*/);
    if (parts.length !== 2) return null;
    const year = today.getFullYear();
    const start = new Date(`${parts[0]} ${year}`);
    let end = new Date(/^\d+$/.test(parts[1]) ? `${parts[0].replace(/\d+$/, '')}${parts[1]} ${year}` : `${parts[1]} ${year}`);
    if (isNaN(start) || isNaN(end)) return null;
    if (end < start) end = new Date(end.getFullYear() + 1, end.getMonth(), end.getDate());
    return {start: dayStart(start), end: dayStart(end)};
  }
  /* Budget slider: bounds are set once per open so the track doesn't jump while dragging. */
  const moneyValue = value => { const n = Number(String(value ?? '').replace(/[^0-9.]/g, '')); return Number.isFinite(n) ? n : 0; };
  const moneyText = n => '$' + Math.round(n).toLocaleString();
  function sliderBounds(key, value) {
    state.sliderBounds = state.sliderBounds || {};
    if (!state.sliderBounds[key]) {
      const current = moneyValue(value) || 10000;
      const step = current >= 50000 ? 1000 : current >= 5000 ? 500 : 100;
      const max = Math.max(step * 10, Math.ceil((current * 2.5) / (step * 10)) * step * 10);
      state.sliderBounds[key] = {min: step, max, step};
    }
    return state.sliderBounds[key];
  }
  /* "Enterprise Intent (620 accounts)": readable, and the count stays parseable for budget math. */
  const audienceText = item => `${item.name} (${Number(item.accounts).toLocaleString()} accounts)`;
  const formatFlight = (start, end) => `${shortDate(start)}–${shortDate(end)}`;
  const assetSrc = key => P.assetLibrary.find(item => item.key === key)?.src || '';
  const previewHelpers = {escape, host, assets: values => list(values.assets).map(assetSrc).filter(Boolean)};
  const icon = {
    back: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M12 4 6 10l6 6"/></svg>',
    check: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="m4.5 10.5 3.5 3.5 7.5-8"/></svg>',
    close: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="m6 6 8 8M14 6l-8 8"/></svg>',
    chat: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 11.5a8.5 8.5 0 0 1-12.3 7.6L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5Z"/></svg>',
    plus: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 4v12M4 10h12"/></svg>'
  };

  const el = document.createElement('section');
  el.className = 'mce';
  el.hidden = true;
  main.append(el);

  let state = null; // see open()

  const build = () => window.MojoBuild;
  const findIndex = id => build().read().findIndex(item => item && String(item.id) === String(id));
  const title = draft => draft.planTitle || draft.name || 'Untitled campaign';

  /* ───────── field rendering ───────── */
  function counter(field, value) {
    const limit = field.max || field.recommend;
    if (!limit || ['chips', 'tags', 'list', 'assets', 'select', 'toggle'].includes(field.kind)) return '';
    const length = text(value).length;
    const tone = field.max && length > field.max ? 'over' : field.recommend && length > field.recommend ? 'long' : '';
    const hint = field.max && field.recommend ? `${field.recommend} recommended, ${field.max} max` : field.max ? `${field.max} max` : `${field.recommend} recommended`;
    return `<span class="mce-count ${tone}" data-count-for="${field.key}" title="${hint}">${length}/${field.recommend || field.max}</span>`;
  }
  function control(field, value, id) {
    const name = `name="${field.key}" data-kind="${field.kind}"`;
    const placeholder = field.placeholder ? ` placeholder="${escape(field.placeholder)}"` : '';
    switch (field.kind) {
      case 'audience': {
        /* Picker: Mojo's pick for this plan, then the saved audiences from the Audiences app. */
        const catalog = window.MojoAudienceCatalog?.all() || [];
        const planPick = state.planAudience;
        const match = catalog.find(item => audienceText(item) === text(value) || item.name === text(value));
        const isPlan = !match && text(value) === text(planPick);
        const meta = match ? `${match.type} · ${match.source} · updated ${match.updated}` : isPlan ? 'Mojo’s pick for this plan' : 'Custom';
        const warn = item => item.status === 'Stale' ? `<span class="mce-aud-flag">Stale · ${item.days} days</span>` : item.status === 'Needs review' ? '<span class="mce-aud-flag">Needs review</span>' : item.status === 'Draft' ? '<span class="mce-aud-flag muted">Draft</span>' : '';
        const option = (label, sub, val, flag = '', selected = false) => `<button type="button" class="mce-aud-option" role="option" aria-selected="${selected}" data-aud-pick="${escape(val)}" data-aud-search-text="${escape((label + ' ' + sub).toLowerCase())}"><span class="mce-aud-option-main"><strong>${escape(label)}</strong>${flag}</span><small>${escape(sub)}</small>${selected ? icon.check : ''}</button>`;
        const open = state.audOpen === field.key;
        return `<div class="mce-aud${open ? ' is-open' : ''}" data-aud="${field.key}">
          <button type="button" class="mce-aud-trigger" id="${id}" data-aud-toggle="${field.key}" aria-haspopup="listbox" aria-expanded="${open}"><span><strong>${escape(value || 'Choose accounts')}</strong><small>${escape(meta)}</small></span><svg viewBox="0 0 20 20" aria-hidden="true"><path d="m6 8 4 4 4-4"/></svg></button>
          <div class="mce-aud-pop" role="listbox" aria-label="Audiences" ${open ? '' : 'hidden'}>
            <input type="search" class="mce-aud-search" data-aud-search placeholder="Search audiences" aria-label="Search audiences">
            ${planPick ? `<p class="mce-aud-group">Mojo’s pick for this plan</p>${option(planPick, 'From the plan · matched to this campaign’s goal', planPick, '', isPlan)}` : ''}
            <p class="mce-aud-group">Your audiences · ${catalog.length}</p>
            ${catalog.map(item => option(item.name, `${item.accounts.toLocaleString()} accounts · ${item.type} · ${item.campaigns.length ? 'used by ' + item.campaigns.length + ' campaign' + (item.campaigns.length > 1 ? 's' : '') : 'not in a campaign yet'}`, audienceText(item), warn(item), match?.id === item.id)).join('')}
            <p class="mce-aud-empty" hidden>No audiences match.</p>
            <a class="mce-aud-foot" href="AppWorkspace.html?app=audience-builder#dashboards">Manage audiences in Audiences →</a>
          </div>
        </div>`;
      }
      case 'daterange': {
        const range = parseFlight(value), start = range?.start, end = range?.end;
        const days = start && end && end >= start ? spanDays(start, end) : 0;
        const presets = [14, 28, 42, 56];
        return `<div class="mce-dates" data-dates="${field.key}">
          <label class="mce-date"><span>Start</span><input type="date" id="${id}" data-date-start="${field.key}" value="${start ? isoDate(start) : ''}"></label>
          <span class="mce-date-arrow" aria-hidden="true">→</span>
          <label class="mce-date"><span>End</span><input type="date" data-date-end="${field.key}" value="${end ? isoDate(end) : ''}" ${start ? `min="${isoDate(start)}"` : ''}></label>
          <div class="mce-date-presets" role="group" aria-label="Flight length">${presets.map(n => `<button type="button" class="mce-chip" data-flight-days="${n}" data-flight-key="${field.key}" aria-pressed="${days === n}">${n / 7} weeks</button>`).join('')}</div>
        </div>
        <p class="mce-date-readout">${days ? `<strong>${days} days</strong> · ${shortDate(start)} – ${shortDate(end)}${start < dayStart(new Date()) ? ' · <span class="mce-date-past">starts in the past</span>' : ''}` : 'Pick a start and end date'}</p>`;
      }
      case 'textarea':
        return `<textarea id="${id}" ${name} rows="3"${placeholder}>${escape(value)}</textarea>`;
      case 'select':
        return `<span class="mce-select"><select id="${id}" ${name}>${field.options.map(option => `<option${option === value ? ' selected' : ''}>${escape(option)}</option>`).join('')}</select></span>`;
      case 'toggle':
        return `<span class="mce-switch"><input type="checkbox" role="switch" id="${id}" ${name}${value === true ? ' checked' : ''}><span aria-hidden="true"></span></span>`;
      case 'chips': {
        const chosen = list(value);
        return `<div class="mce-chips" role="group" aria-labelledby="${id}-label">${field.options.map(option => `<button type="button" class="mce-chip" data-chip="${field.key}" data-value="${escape(option)}" aria-pressed="${chosen.includes(option)}">${chosen.includes(option) ? icon.check : ''}${escape(option)}</button>`).join('')}</div>`;
      }
      case 'tags': {
        const items = list(value);
        return `<div class="mce-tags" data-tags="${field.key}">${items.map((item, i) => `<span class="mce-tag${field.itemMax && item.length > field.itemMax ? ' over' : ''}">${escape(item)}<button type="button" data-tag-remove="${field.key}" data-index="${i}" aria-label="Remove ${escape(item)}">${icon.close}</button></span>`).join('')}<input id="${id}" data-tag-input="${field.key}"${placeholder} aria-label="${escape(field.label)}"></div>`;
      }
      case 'list': {
        /* Keep blank rows while editing; validation ignores them. */
        const items = Array.isArray(value) && value.length ? value.map(item => String(item ?? '')) : list(value).length ? list(value) : [''];
        const singular = field.itemLabel || field.label.replace(/s$/, '');
        return `<ol class="mce-list" data-list="${field.key}">${items.map((item, i) => `<li><input id="${i ? `${id}-${i}` : id}" data-list-item="${field.key}" data-index="${i}" value="${escape(item)}" aria-label="${escape(singular)} ${i + 1}"><span class="mce-count ${field.itemMax && item.length > field.itemMax ? 'over' : ''}" data-list-count="${field.key}-${i}">${item.length}/${field.itemMax}</span><button type="button" class="mce-icon-button" data-list-remove="${field.key}" data-index="${i}" aria-label="Remove ${escape(singular.toLowerCase())} ${i + 1}" ${items.length <= 1 ? 'disabled' : ''}>${icon.close}</button></li>`).join('')}</ol>${!field.maxItems || items.length < field.maxItems ? `<button type="button" class="mce-add" data-list-add="${field.key}">${icon.plus}Add ${escape(singular.toLowerCase())}</button>` : ''}`;
      }
      case 'assets': {
        const chosen = list(value), single = field.maxItems === 1;
        return `<div class="mce-assets" role="group" aria-labelledby="${id}-label">${P.assetLibrary.map(asset => `<button type="button" class="mce-asset" data-asset="${asset.key}" data-single="${single}" aria-pressed="${chosen.includes(asset.key)}" title="${escape(asset.title)}"><img src="${asset.src}" alt="${escape(asset.title)}"><span class="mce-asset-mark">${chosen.includes(asset.key) ? (single ? icon.check : chosen.indexOf(asset.key) + 1) : ''}</span></button>`).join('')}</div>`;
      }
      default: {
        if (field.kind === 'money' && field.slider) {
          const b = sliderBounds(field.key, value), n = Math.min(Math.max(moneyValue(value), b.min), b.max);
          return `<div class="mce-budget"><input id="${id}" type="text" ${name} value="${escape(value)}" inputmode="decimal"><input type="range" class="mce-slider" data-slider="${field.key}" min="${b.min}" max="${b.max}" step="${b.step}" value="${n}" aria-label="${escape(field.label)}" aria-valuetext="${escape(moneyText(n))}" style="--fill:${((n - b.min) / (b.max - b.min)) * 100}%"><span class="mce-slider-scale"><span>${moneyText(b.min)}</span><span>${moneyText(b.max)}</span></span></div><p class="mce-budget-readout" data-budget-readout>${escape(budgetReadout())}</p>`;
        }
        const type = field.kind === 'url' ? 'url' : 'text';
        const mode = field.kind === 'money' ? ' inputmode="decimal"' : '';
        return `<input id="${id}" type="${type}" ${name} value="${escape(value)}"${placeholder}${mode}>`;
      }
    }
  }
  function fieldHtml(field, sectionId, values, scope) {
    if (field.showIf && !field.showIf(values)) return '';
    const id = `mce-${scope}-${sectionId}-${field.key}`;
    const issue = P.fieldIssue(field, values[field.key], values);
    const wide = ['textarea', 'chips', 'tags', 'list', 'assets', 'daterange', 'audience'].includes(field.kind) || field.wide;
    const required = typeof field.required === 'function' ? field.required(values) : field.required;
    /* "Mojo picks" marks a default the marketer hasn't changed yet, with Mojo's reason. */
    const member = memberOf(scope);
    const picked = field.why && member && !member.touched.has(field.key)
      ? `<span class="mce-picked" tabindex="0" aria-describedby="${id}-why"><img src="assets/moj-mdot.svg" alt="">Mojo picks<span class="mce-why" role="tooltip" id="${id}-why">${escape(field.why)}</span></span>` : '';
    if (field.kind === 'toggle') {
      return `<div class="mce-field mce-field-toggle wide${issue ? ' has-issue' : ''}" data-field="${field.key}"><label for="${id}" id="${id}-label">${control(field, values[field.key], id)}<span class="mce-label-text">${escape(field.label)}</span>${picked}</label>${field.help ? `<small class="mce-help">${escape(field.help)}</small>` : ''}<small class="mce-issue" data-issue-for="${field.key}">${escape(issue)}</small></div>`;
    }
    return `<div class="mce-field${wide ? ' wide' : ''}${issue ? ' has-issue' : ''}" data-field="${field.key}"><div class="mce-label-row"><label for="${id}" id="${id}-label">${escape(field.label)}${required ? '' : ' <span class="mce-optional">Optional</span>'}</label>${picked}${counter(field, values[field.key])}</div>${field.help ? `<small class="mce-help">${escape(field.help)}</small>` : ''}${control(field, values[field.key], id)}<small class="mce-issue" data-issue-for="${field.key}">${escape(issue)}</small></div>`;
  }

  /* Routines Mojo runs on every live campaign (see Routines.html). Shown quietly. */
  const ROUTINES = [
    {id: 'weekly', name: 'Weekly Performance Update', schedule: 'Mondays, 9:00 AM'},
    {id: 'pacing', name: 'Budget Pacing and Optimization', schedule: 'Daily, 9:15 AM', note: 'Overspend? Not on Mojo’s watch. It checks pacing every morning.'},
    {id: 'tracking', name: 'Tracking, UTM, and Naming Governance', schedule: 'Daily, 9:30 AM', note: 'Broken links don’t stand a chance. Mojo checks them every morning.'},
    {id: 'goal', name: 'Progress to Goal', schedule: 'Mondays, 9:45 AM'}
  ];
  const mdot = '<img class="mce-mdot" src="assets/moj-mdot.svg" alt="">';
  const watchNote = id => { const routine = ROUTINES.find(item => item.id === id); return routine ? `<p class="mce-section-watch">${mdot}<span>${escape(routine.note)}</span></p>` : ''; };

  /* ───────── campaign model ─────────
     A campaign is the set of drafts that share a plan source, one per platform.
     Shared settings are edited once and written to every platform that isn't live. */
  const SHARED = ['audience', 'creative', 'messaging', 'assets', 'landing', 'tracking', 'flight', 'conversion', 'validation', 'budgetApproved'];
  const isShared = key => SHARED.includes(key);
  const platformOnly = field => !P.isCore(field.key) || field.key === 'keywords';
  const memberOf = scope => state?.members.find(member => member.scope === scope) || null;
  const nonLive = () => state.members.filter(member => !member.live);
  const summaryHelpers = {
    escape, host, join: P.helpers.join, spend: P.helpers.spendMath,
    b: value => `<strong>${escape(value)}</strong>`,
    path: url => { try { const p = new URL(text(url)).pathname; return p === '/' ? '' : p; } catch { return ''; } }
  };
  const lowerFirst = label => /^[A-Z][a-z]/.test(label) ? label.charAt(0).toLowerCase() + label.slice(1) : label;
  const totalBudget = () => nonLive().concat(state.members.filter(m => m.live)).reduce((sum, member) => sum + moneyValue(member.values.budget), 0);
  /* Values a platform actually uses: shared settings plus its own, with asset counts trimmed to its format. */
  function effective(member) {
    const values = {...member.values, ...state.shared};
    const assetField = P.fields(member.platform).find(field => field.key === 'assets' && (!field.showIf || field.showIf(values)));
    values.assets = assetField?.maxItems ? list(values.assets).slice(0, assetField.maxItems) : list(values.assets);
    return values;
  }
  const memberIssues = member => member.live ? [] : P.issues(member.draft, member.facts, effective(member));
  function sharedIssues() {
    const seen = new Map();
    nonLive().forEach(member => memberIssues(member).filter(issue => isShared(issue.key)).forEach(issue => { if (!seen.has(issue.key)) seen.set(issue.key, issue); }));
    return [...seen.values()];
  }
  const platformIssues = member => memberIssues(member).filter(issue => !isShared(issue.key));
  const allIssues = () => [...sharedIssues(), ...nonLive().flatMap(member => platformIssues(member).map(issue => ({...issue, scope: member.scope})))];

  /* Shared sections, edited once for every platform. */
  function sharedSections() {
    const usesAssets = nonLive().some(member => P.fields(member.platform).some(field => field.key === 'assets'));
    const textOnly = state.members.filter(member => !P.fields(member.platform).some(field => field.key === 'assets')).map(member => member.platform.name);
    return [
      {id: 'accounts', title: 'Accounts', description: 'Who this campaign reaches, on every platform.', fields: [P.core.audience],
        summary: v => `${summaryHelpers.b(v.audience || 'No accounts yet')}`},
      {id: 'creative', title: 'Creative and message', description: 'One concept and message. Each platform card adapts the copy.', fields: [P.core.creative, P.core.messaging, ...(usesAssets ? [{...P.core.assets, maxItems: 3, help: textOnly.length ? `${P.helpers.join(textOnly)} uses text ads, so it skips images.` : ''}] : [])],
        summary: v => `“${escape(v.creative || 'No concept yet')}”${usesAssets ? ` with ${summaryHelpers.b(list(v.assets).length + ' ' + (list(v.assets).length === 1 ? 'asset' : 'assets'))}` : ''}.`},
      {id: 'landing', title: 'Landing page and tracking', description: 'Mojo adds utm_source for each platform automatically.', fields: [P.core.landing, P.core.tracking, P.core.conversion, P.core.validation], watch: 'tracking',
        summary: v => `${v.landing ? summaryHelpers.b(host(v.landing) + (summaryHelpers.path(v.landing) || '')) : summaryHelpers.b('No landing page yet')}, tagged ${summaryHelpers.b(v.tracking || 'no tracking yet')}.`},
      {id: 'schedule', title: 'Schedule and budget', description: '', fields: [P.core.flight, {key: 'budget', label: 'Budget', kind: 'split'}, P.core.budgetApproved], watch: 'pacing',
        summary: v => { const total = totalBudget(), spend = P.helpers.spendMath({...v, budget: total}); return `${summaryHelpers.b(moneyText(total))} over ${summaryHelpers.b(v.flight || 'no flight yet')}${spend ? `, ${spend}` : ''}.`; }}
    ];
  }
  const sharedSectionOf = key => key === 'budget' ? 'schedule' : sharedSections().find(section => section.fields.some(field => field.key === key))?.id || '';
  /* One card per platform: only that platform's own settings, grouped under its registry sections. */
  function platformGroups(member) {
    const values = effective(member);
    return member.platform.sections.map(section => ({title: section.title, fields: section.fields.filter(field => platformOnly(field) && (!field.showIf || field.showIf(values)))})).filter(group => group.fields.length);
  }
  function platformSummary(member) {
    const v = effective(member);
    if (member.live) return 'Live. Changes now happen in the platform.';
    if (member.platform.card) { try { return member.platform.card(v, summaryHelpers); } catch { /* fall through */ } }
    return platformGroups(member).flatMap(group => group.fields).slice(0, 4).map(field => escape(list(v[field.key]).join(', ') || v[field.key] || '')).filter(Boolean).join(' · ');
  }
  function sectionIssueCount(id) {
    if (id.startsWith('p-')) { const member = memberOf(id.slice(2)); return member ? platformIssues(member).filter(issue => issue.key !== 'budget').length : 0; }
    const keys = sharedSections().find(section => section.id === id)?.fields.map(field => field.key) || [];
    const shared = sharedIssues().filter(issue => keys.includes(issue.key)).length;
    const budget = id === 'schedule' ? nonLive().filter(member => memberIssues(member).some(issue => issue.key === 'budget')).length : 0;
    return shared + budget;
  }

  /* ───────── field access ───────── */
  function keyScope(key) {
    if (isShared(key)) return 'shared';
    return state.members.find(member => !member.live && P.fields(member.platform).some(field => field.key === key && platformOnly(field)))?.scope || 'shared';
  }
  function getValue(key, scope = keyScope(key)) { return scope === 'shared' ? state.shared[key] : memberOf(scope)?.values[key]; }
  function setValue(key, value, scope = keyScope(key)) {
    if (scope === 'shared') state.shared[key] = value;
    else { const member = memberOf(scope); if (!member) return; member.values[key] = value; member.touched.add(key); }
    el.querySelector(`.mce-field[data-field="${key}"] .mce-picked`)?.remove();
  }
  function findField(key) {
    const scope = keyScope(key);
    if (scope === 'shared') return sharedSections().flatMap(section => section.fields).find(field => field.key === key) || null;
    const member = memberOf(scope), values = effective(member);
    return P.fields(member.platform).find(field => field.key === key && (!field.showIf || field.showIf(values))) || null;
  }
  const valuesFor = scope => scope === 'shared' ? {...(nonLive()[0] || state.members[0]).values, ...state.shared} : effective(memberOf(scope));

  /* ───────── rendering ───────── */
  function headActionsHtml() {
    const open = nonLive(), issues = allIssues();
    if (!open.length) return '<span class="mce-status live"><i></i>Live on every platform</span>';
    if (issues.length) return `<button type="button" class="mce-link mce-fix-link" data-fix-next>${issues.length} to fix →</button>`;
    return `<button type="button" class="mce-primary is-ready" data-launch>Launch on ${open.length === 1 ? escape(open[0].platform.name) : `${open.length} platforms`} →</button>`;
  }
  function platformsHtml() {
    const used = new Set(state.members.map(member => member.platform.id));
    const chips = state.members.map(member => {
      const count = platformIssues(member).length;
      const mark = member.live ? '<span class="mce-tab-mark live">Live</span>' : count ? `<span class="mce-tab-mark issue" aria-label="${count} to fix">${count}</span>` : '';
      return `<button type="button" class="mce-tab" data-nav="p-${member.scope}"><img src="${member.platform.logo}" alt="">${escape(member.platform.name)}${mark}</button>`;
    }).join('');
    const adds = P.all().filter(platform => !used.has(platform.id)).map(platform => `<button type="button" class="mce-tab mce-tab-add" data-copy="${platform.id}" title="Add ${escape(platform.name)}. Shared settings carry over.">${icon.plus}<img src="${platform.logo}" alt="">${escape(platform.name)}</button>`).join('');
    return `<div class="mce-tabs">${chips}</div><p class="mce-platforms-label"><strong>${moneyText(totalBudget())}</strong>${state.members.length > 1 ? ' total' : ''}</p>${adds ? `<div class="mce-tabs mce-tabs-adds"><span class="mce-tabs-add-label">Add</span>${adds}</div>` : ''}`;
  }
  function progressHtml() {
    const steps = [...sharedSections().map(section => ({id: section.id, title: section.title})), ...state.members.map(member => ({id: `p-${member.scope}`, title: member.platform.name, logo: member.platform.logo, live: member.live}))];
    const ready = steps.filter(step => !sectionIssueCount(step.id)).length;
    return `<span class="mce-progress-label"><strong>${ready} of ${steps.length}</strong> ready</span><ol class="mce-steps">${steps.map(step => {
      const count = sectionIssueCount(step.id);
      return `<li><button type="button" class="mce-step${count ? ' has-issue' : ''}" data-nav="${step.id}"><span class="mce-step-mark" aria-hidden="true">${count || icon.check}</span>${step.logo ? `<img class="mce-step-logo" src="${step.logo}" alt="">` : ''}${escape(step.title)}<span class="sr-only">${count ? `, ${count} to fix` : ', ready'}</span></button></li>`;
    }).join('')}</ol>`;
  }
  /* Budget split: the campaign total and each platform's share, with plain per-day math. */
  function splitHtml() {
    const total = totalBudget(), flight = state.shared.flight;
    const b = sliderBounds('budget-total', moneyText(total)), n = Math.min(Math.max(total, b.min), b.max);
    const rows = state.members.map((member, i) => {
      const amount = moneyValue(member.values.budget), share = total ? Math.round((amount / total) * 100) : 0;
      return `<li data-split-row="${member.scope}"><span class="mce-split-name"><img src="${member.platform.logo}" alt="">${escape(member.platform.name)}</span><input type="text" inputmode="decimal" data-split-amount="${member.scope}" value="${escape(moneyText(amount))}" aria-label="${escape(member.platform.name)} budget" ${member.live ? 'disabled' : ''}><span class="mce-split-share" data-split-share="${member.scope}">${share}%</span><small data-split-day="${member.scope}">${member.live ? 'Live' : perDay(amount, flight)}</small></li>`;
    }).join('');
    const bar = state.members.map((member, i) => `<span style="flex:${Math.max(moneyValue(member.values.budget), 0.0001)}" class="mce-split-seg s${i % 4}" title="${escape(member.platform.name)}"></span>`).join('');
    return `<div class="mce-field wide mce-split" data-field="budget">
      <div class="mce-label-row"><label for="mce-split-total">Total budget</label></div>
      <div class="mce-budget"><input id="mce-split-total" type="text" inputmode="decimal" data-split-total value="${escape(moneyText(total))}"><input type="range" class="mce-slider" data-split-slider min="${b.min}" max="${b.max}" step="${b.step}" value="${n}" aria-label="Total budget" aria-valuetext="${escape(moneyText(n))}" style="--fill:${((n - b.min) / (b.max - b.min)) * 100}%"><span class="mce-slider-scale"><span>${moneyText(b.min)}</span><span>${moneyText(b.max)}</span></span></div>
      <p class="mce-budget-readout" data-budget-readout>${escape(campaignSpend())}</p>
      ${state.members.length > 1 ? `<div class="mce-split-bar" aria-hidden="true">${bar}</div><ul class="mce-split-rows">${rows}</ul><button type="button" class="mce-link mce-split-even" data-split-even>Split evenly</button>` : ''}
      <small class="mce-issue" data-issue-for="budget"></small>
    </div>`;
  }
  const flightDays = flight => { const range = parseFlight(flight); return range && range.end >= range.start ? spanDays(range.start, range.end) : 0; };
  const perDay = (amount, flight = state.shared.flight) => { const days = flightDays(flight); return days && amount ? `about ${moneyText(amount / days)} a day` : ''; };
  const budgetReadout = () => campaignSpend();
  const campaignSpend = () => P.helpers.spendMath({...state.shared, budget: moneyText(totalBudget())}) || 'Add a flight to see daily spend';
  function sharedSectionHtml(section) {
    const count = sectionIssueCount(section.id), isOpen = state.openSections.has(section.id), values = valuesFor('shared');
    const fields = section.fields.map(field => field.kind === 'split' ? splitHtml() : fieldHtml(field, section.id, values, 'shared')).join('');
    return cardHtml({id: section.id, title: section.title, summary: section.summary(values), description: section.description, count, isOpen, body: `<div class="mce-fields">${fields}</div>${section.watch ? watchNote(section.watch) : ''}`});
  }
  function platformCardHtml(member) {
    const id = `p-${member.scope}`, count = platformIssues(member).length, isOpen = state.openSections.has(id), values = effective(member);
    const groups = platformGroups(member);
    const body = member.live ? '<p class="mce-section-desc">This platform is live. Changes now happen in the platform.</p>'
      : groups.map(group => `<div class="mce-group"><h3 class="mce-group-title">${escape(group.title)}</h3><div class="mce-fields">${group.fields.map(field => fieldHtml(field, id, values, member.scope)).join('')}</div></div>`).join('');
    return cardHtml({id, title: member.platform.name, logo: member.platform.logo, summary: platformSummary(member), count, isOpen, live: member.live, body, extraClass: 'mce-platform-card'});
  }
  function cardHtml({id, title: heading, logo, summary, description, count, isOpen, live, body, extraClass = ''}) {
    const mark = live ? '<span class="mce-section-mark live" data-mark aria-hidden="true">●</span>' : `<span class="mce-section-mark" data-mark aria-hidden="true">${count || icon.check}</span>`;
    return `<section class="mce-section ${extraClass}${count ? ' has-issue' : ''}" id="mce-s-${id}" data-section="${id}" data-open="${isOpen}">
      <header class="mce-section-head">
        ${mark}
        <div class="mce-section-text">
          <h2><button type="button" data-toggle="${id}" aria-expanded="${isOpen}" aria-controls="mce-b-${id}">${logo ? `<img class="mce-card-logo" src="${logo}" alt="">` : ''}${escape(heading)}</button></h2>
          <p class="mce-summary" data-summary>${summary}</p>
          ${description ? `<p class="mce-section-desc">${escape(description)}</p>` : ''}
        </div>
        <span class="mce-section-action" aria-hidden="true">${isOpen ? 'Done' : count ? 'Fix' : 'Edit'}<svg viewBox="0 0 20 20"><path d="m6 8 4 4 4-4"/></svg></span>
      </header>
      <div class="mce-section-body" id="mce-b-${id}" ${isOpen ? '' : 'hidden'}>${body}</div>
    </section>`;
  }
  function formHtml() {
    const add = P.all().filter(platform => !state.members.some(member => member.platform.id === platform.id));
    const multi = state.members.length > 1;
    return `<p class="mce-group-label">${multi ? 'Shared across platforms' : 'Campaign setup'}</p>${sharedSections().map(sharedSectionHtml).join('')}
      <p class="mce-group-label">${multi ? 'Each platform' : `${escape(state.members[0].platform.name)} settings`}</p>${state.members.map(platformCardHtml).join('')}
      ${add.length ? `<div class="mce-add-platforms">${add.map(platform => `<button type="button" class="mce-add-platform" data-copy="${platform.id}">${icon.plus}<img src="${platform.logo}" alt="">Add ${escape(platform.name)}</button>`).join('')}</div>` : ''}`;
  }
  /* Story view: the campaign as one sentence. Each underlined word opens just that section below it. */
  function storyHtml() {
    const v = valuesFor('shared'), missing = new Set(sharedIssues().map(issue => issue.key));
    const budgetMissing = nonLive().some(member => memberIssues(member).some(issue => issue.key === 'budget'));
    const word = (id, value, placeholder, keys) => {
      const isMissing = keys.some(key => missing.has(key)) || !value;
      const isOpen = state.openSections.has(id);
      return `<button type="button" class="mce-word${isMissing ? ' is-missing' : ''}${isOpen ? ' is-open' : ''}" data-story="${id}" aria-expanded="${isOpen}">${escape(value || placeholder)}</button>`;
    };
    const conversion = text(v.conversion);
    const goal = conversion ? lowerFirst(conversion) + (/s$/i.test(conversion) ? '' : 's') : '';
    const landing = v.landing ? host(v.landing) + (summaryHelpers.path(v.landing) || '') : '';
    const total = totalBudget();
    const lead = `Reach ${word('accounts', text(v.audience).replace(/^(Up to|About|All|Any|Every|Around|Roughly)\b/, w => w.toLowerCase()), 'which accounts?', ['audience'])} with ${word('creative', v.creative ? `“${text(v.creative)}”` : '', 'what message?', ['creative', 'messaging', 'assets'])}, sending them to ${word('landing', landing, 'which page?', ['landing', 'tracking'])}${goal || missing.has('conversion') ? ` for ${word('landing', goal, 'what result?', ['conversion'])}` : ''}. Spend ${word('schedule', total ? moneyText(total) : '', 'how much?', ['budgetApproved']).replace('class="mce-word', `class="mce-word${budgetMissing ? ' is-missing' : ''}`)} over ${word('schedule', v.flight ? text(v.flight) : '', 'when?', ['flight'])}.`;
    const platforms = state.members.map(member => {
      if (member.live) return `${escape(member.platform.name)} (live)`;
      const id = `p-${member.scope}`, count = platformIssues(member).filter(issue => issue.key !== 'budget').length, isOpen = state.openSections.has(id);
      return `<button type="button" class="mce-word${count ? ' is-missing' : ''}${isOpen ? ' is-open' : ''}" data-story="${id}" aria-expanded="${isOpen}">${escape(member.platform.name)}</button>`;
    });
    const on = platforms.length > 1 ? `${platforms.slice(0, -1).join(', ')} and ${platforms[platforms.length - 1]}` : platforms[0];
    return `<p class="mce-story-text">${lead.replace(/\.$/, '')} on ${on}.</p>`;
  }
  function syncStory() {
    const node = el.querySelector('[data-story-text]');
    if (node) node.innerHTML = storyHtml();
  }
  /* Preview: one platform at a time, switchable. */
  function previewHtml() {
    const member = memberOf(state.previewScope) || state.members[0];
    const tabs = state.members.length > 1 ? `<div class="mce-preview-tabs" role="tablist">${state.members.map(m => `<button type="button" role="tab" aria-selected="${m.scope === member.scope}" data-preview-switch="${m.scope}" title="${escape(m.platform.name)}"><img src="${m.platform.logo}" alt="${escape(m.platform.name)}"></button>`).join('')}</div>` : '';
    return `<div class="mce-card-head"><h3>Preview</h3>${tabs || `<small>${escape(member.platform.context || member.platform.name)}</small>`}</div><div class="mce-preview" data-preview>${member.platform.preview(effective(member), previewHelpers)}</div><p class="mce-preview-hint">Click any part of the ad to edit it.</p>`;
  }
  /* Mojo QA: one row for the shared setup and one per platform. Detail only when something is missing. */
  function qaHtml() {
    const rows = [{label: 'Shared setup', issues: sharedIssues(), scope: 'shared'}, ...state.members.map(member => ({label: member.platform.name, logo: member.platform.logo, issues: platformIssues(member), live: member.live, scope: member.scope}))];
    const bad = rows.filter(row => row.issues.length).length;
    const item = row => {
      const issue = row.issues[0];
      const line = issue ? (issue.empty ? `Add ${lowerFirst(issue.label)}` : `${issue.label}: ${lowerFirst(issue.message)}`) + (row.issues.length > 1 ? ` (+${row.issues.length - 1})` : '') : '';
      return `<li class="${issue ? 'is-bad' : ''}"><span class="mce-qa-mark${row.live ? ' live' : ''}" aria-hidden="true">${row.live ? '●' : issue ? '!' : icon.check}</span><div><strong>${row.logo ? `<img src="${row.logo}" alt="">` : ''}${escape(row.label)}${row.live ? ' <em>Live</em>' : ''}</strong>${issue ? `<small>${escape(line)}</small>` : ''}</div>${issue ? `<button type="button" class="mce-link" data-jump="${issue.key}" data-jump-scope="${row.scope}">Fix</button>` : ''}</li>`;
    };
    const checked = sharedSections().reduce((n, section) => n + section.fields.length, 0) + state.members.reduce((n, member) => n + member.platform.sections.reduce((m, section) => m + section.fields.filter(platformOnly).length, 0), 0);
    const scope = state.members.length > 1 ? `shared setup and ${state.members.length} platforms` : escape(state.members[0].platform.name);
    const watch = nonLive().length ? `<p class="mce-qa-watch" title="${escape(ROUTINES.map(routine => `${routine.name} · ${routine.schedule}`).join('\n'))}">${mdot}<span>After launch, Mojo watches pacing, tracking and results for you. <a href="Routines.html">Routines</a></span></p>` : '';
    if (!bad) return `<div class="mce-qa-head"><h3>Mojo QA</h3><span class="mce-qa-sum"><span class="ok">${icon.check}All set</span></span></div><p class="mce-qa-allset">Mojo checked ${checked} settings across ${scope}.</p>${watch}`;
    const fine = rows.length - bad;
    return `<div class="mce-qa-head"><h3>Mojo QA</h3><span class="mce-qa-sum"><span class="bad">${allIssues().length} to fix</span> · <button type="button" class="mce-link" data-ask-fix>Ask Mojo</button></span></div><ul class="mce-qa-checks">${rows.filter(row => row.issues.length).map(item).join('')}</ul>${fine ? `<p class="mce-qa-fine">${icon.check}Everything else is all set</p>` : ''}${watch}`;
  }
  const introText = () => allIssues().length ? 'Mojo set up everything it could. The open cards need you.' : 'Mojo set up every card. Open one to change it, or launch.';
  function render() {
    const first = state.members[0].draft;
    state.lastReady = !allIssues().length;
    el.innerHTML = `
      <div class="mce-top">
        <nav class="mce-crumbs" aria-label="Breadcrumb"><button type="button" data-close>Build</button><span aria-hidden="true">/</span><span aria-current="page">${escape(title(first))}</span></nav>
        <span class="mce-save-state" data-save-state role="status"></span>
      </div>
      <header class="mce-head">
        <div class="mce-head-main">
          <span class="mce-platform">${escape(build().initiative(first))}</span>
          <h1>${escape(title(first))}</h1>
        </div>
        <div class="mce-head-actions" data-head-actions>${headActionsHtml()}</div>
      </header>
      <section class="mce-platforms" data-platforms aria-label="Platforms">${platformsHtml()}</section>
      <div class="mce-body">
        <div class="mce-main">
          <section class="mce-story" aria-label="Campaign summary" data-story-text>${storyHtml()}</section>
          <form class="mce-form" novalidate>${formHtml()}</form>
        </div>
        <aside class="mce-rail">
          <div class="mce-rail-top">
            <section class="mce-card mce-preview-card" data-preview-card>${previewHtml()}</section>
            <section class="mce-card mce-qa-card" data-qa-card><div data-qa>${qaHtml()}</div></section>
          </div>
        </aside>
      </div>
      <div class="mce-toast" data-toast role="status" aria-live="polite"></div>`;
    markActive();
    requestAnimationFrame(syncStepsFade);
  }
  /* Refresh what depends on values without touching focused inputs. */
  function refresh() {
    el.querySelector('[data-head-actions]').innerHTML = headActionsHtml();
    el.querySelector('[data-qa]').innerHTML = qaHtml();
    el.querySelector('[data-platforms]').innerHTML = platformsHtml();
    el.querySelector('[data-preview-card]').innerHTML = previewHtml();
    syncStory();
    el.querySelectorAll('[data-budget-readout]').forEach(node => { node.textContent = campaignSpend(); });
    syncSplit();
    sharedSections().forEach(section => refreshCard(section.id, section.summary(valuesFor('shared'))));
    state.members.forEach(member => refreshCard(`p-${member.scope}`, platformSummary(member)));
    /* Field-level issue messages and counters. */
    el.querySelectorAll('.mce-field[data-field]').forEach(box => {
      const key = box.dataset.field;
      if (key === 'budget') {
        const missing = nonLive().filter(member => memberIssues(member).some(issue => issue.key === 'budget')).map(member => member.platform.name);
        box.classList.toggle('has-issue', !!missing.length);
        box.querySelector('[data-issue-for]').textContent = missing.length ? `Add a budget for ${P.helpers.join(missing)}` : '';
        return;
      }
      const field = findField(key);
      if (!field) return;
      const values = valuesFor(keyScope(key)), issue = P.fieldIssue(field, values[key], values);
      box.classList.toggle('has-issue', !!issue);
      const message = box.querySelector(`[data-issue-for="${key}"]`);
      if (message) message.textContent = issue;
      const count = box.querySelector(`[data-count-for="${key}"]`);
      if (count) count.outerHTML = counter(field, values[key]);
    });
    const ready = !allIssues().length;
    if (!state.lastReady && ready) readyMoment();
    state.lastReady = ready;
    markActive();
    syncStepsFade();
  }
  function refreshCard(id, summary) {
    const card = el.querySelector(`.mce-section[data-section="${id}"]`);
    if (!card) return;
    const count = sectionIssueCount(id), had = card.classList.contains('has-issue');
    card.classList.toggle('has-issue', !!count);
    const mark = card.querySelector('[data-mark]');
    if (!mark.classList.contains('live')) mark.innerHTML = count || icon.check;
    if (had && !count) celebrateMark(card);
    card.querySelector('[data-summary]').innerHTML = summary;
    syncAction(card);
  }
  function rerenderForm(focusSelector) {
    el.querySelector('.mce-form').innerHTML = formHtml();
    refresh();
    if (focusSelector) el.querySelector(focusSelector)?.focus({preventScroll: true});
  }
  function syncAction(card) {
    const open = card.dataset.open === 'true', action = card.querySelector('.mce-section-action');
    if (action) action.firstChild.textContent = open ? 'Done' : card.classList.contains('has-issue') ? 'Fix' : 'Edit';
  }
  function setOpen(id, open) {
    const card = el.querySelector(`.mce-section[data-section="${id}"]`);
    if (!card) return;
    if (open) state.openSections.add(id); else state.openSections.delete(id);
    card.dataset.open = String(open);
    card.querySelector('[data-toggle]').setAttribute('aria-expanded', String(open));
    card.querySelector('.mce-section-body').hidden = !open;
    syncAction(card);
    syncStory();
  }
  const calm = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  function celebrateMark(card) {
    const mark = card.querySelector('[data-mark]');
    mark.classList.remove('is-pop'); void mark.offsetWidth; mark.classList.add('is-pop');
  }
  function readyMoment() {
    const toast = el.querySelector('[data-toast]');
    if (toast) {
      const names = nonLive().map(member => member.platform.name);
      toast.innerHTML = `${icon.check}<span><strong>Ready to launch.</strong> Every rule checks out on ${escape(P.helpers.join(names))}.</span>`;
      toast.classList.remove('is-shown'); void toast.offsetWidth; toast.classList.add('is-shown');
      clearTimeout(state.toastTimer);
      state.toastTimer = setTimeout(() => toast.classList.remove('is-shown'), 3200);
    }
    const launch = el.querySelector('[data-launch]');
    if (launch && !calm()) { launch.classList.remove('is-arrive'); void launch.offsetWidth; launch.classList.add('is-arrive'); }
  }
  function markActive() {
    el.querySelectorAll('[data-preview] [data-edit-field]').forEach(node => node.classList.toggle('is-active', node.dataset.editField === state.activeField));
  }
  function syncSplit() {
    const total = totalBudget();
    state.members.forEach(member => {
      const amount = moneyValue(member.values.budget);
      const share = el.querySelector(`[data-split-share="${member.scope}"]`);
      if (share) share.textContent = `${total ? Math.round((amount / total) * 100) : 0}%`;
      const input = el.querySelector(`[data-split-amount="${member.scope}"]`);
      if (input && document.activeElement !== input) input.value = moneyText(amount);
      const day = el.querySelector(`[data-split-day="${member.scope}"]`);
      if (day && !member.live) day.textContent = perDay(amount);
    });
    el.querySelectorAll('.mce-split-seg').forEach((seg, i) => { seg.style.flex = String(Math.max(moneyValue(state.members[i]?.values.budget), 0.0001)); });
    const totalInput = el.querySelector('[data-split-total]');
    if (totalInput && document.activeElement !== totalInput) totalInput.value = moneyText(total);
    const slider = el.querySelector('[data-split-slider]');
    if (slider && document.activeElement !== slider) { const b = state.sliderBounds['budget-total']; const n = Math.min(Math.max(total, b.min), b.max); slider.value = n; syncSlider(slider, n, 'budget-total'); }
  }

  /* ───────── persistence ───────── */
  function persist() {
    const items = build().read();
    state.members.forEach(member => {
      if (member.live) return;
      const index = findIndex(member.id), item = items[index];
      if (!item) return;
      const v = effective(member), core = {};
      ['audience', 'creative', 'tracking', 'budget', 'flight', 'landing', 'messaging', 'conversion', 'validation'].forEach(key => { core[key] = Array.isArray(v[key]) ? list(v[key]).join(', ') : text(v[key]); });
      core.keywords = P.fields(member.platform).some(field => field.key === 'keywords') ? list(member.values.keywords).join(', ') : text(item.deliverables?.keywords);
      item.deliverables = core;
      item.creatives = list(state.shared.assets);
      item.budgetApproved = state.shared.budgetApproved === true;
      item.platformFields = item.platformFields || {};
      const own = {};
      P.fields(member.platform).filter(field => !P.isCore(field.key)).forEach(field => { own[field.key] = field.kind === 'list' ? list(member.values[field.key]) : member.values[field.key]; });
      item.platformFields[member.platform.id] = own;
      item.platformTouched = {...(item.platformTouched || {}), [member.platform.id]: [...member.touched]};
      item.buildSetup = {...(item.buildSetup || {}), audience: core.audience, message: core.creative, channels: build().channel(item), budget: core.budget, utm: core.tracking, conversion: core.conversion, validation: core.validation};
      item.buildStatus = build().qa(item).passed ? 'ready' : 'draft';
      member.draft = item;
      member.facts = build().facts(item);
    });
    build().write(items);
    build().render();
    const label = el.querySelector('[data-save-state]');
    if (label) {
      label.textContent = nonLive().length > 1 ? `Saved to ${nonLive().length} platforms` : 'Saved';
      label.classList.add('is-shown');
      clearTimeout(state.savedTimer);
      state.savedTimer = setTimeout(() => label.classList.remove('is-shown'), 2500);
    }
  }
  function changed({structural = false, focus} = {}) {
    const label = el.querySelector('[data-save-state]');
    if (label) { label.textContent = 'Saving…'; label.classList.add('is-shown'); clearTimeout(state.savedTimer); }
    if (structural) rerenderForm(focus); else refresh();
    clearTimeout(state.saveTimer);
    state.saveTimer = setTimeout(persist, 450);
  }
  function flush() { if (state?.saveTimer) { clearTimeout(state.saveTimer); state.saveTimer = null; persist(); } }

  /* ───────── open / close ───────── */
  function campaignDrafts(anchor) {
    return build().read().filter(item => item && item.name && (item.id === anchor.id || (anchor.source && item.source === anchor.source)) && P.forChannel(build().channel(item)))
      .sort((a, b) => P.all().indexOf(P.forChannel(build().channel(a))) - P.all().indexOf(P.forChannel(build().channel(b))));
  }
  function open(id, focusKey = '', openCard = '') {
    const anchor = build().read()[findIndex(id)];
    if (!anchor || !P.forChannel(build().channel(anchor))) return close();
    if (state && String(state.id) !== String(id)) flush();
    const drafts = campaignDrafts(anchor);
    const members = drafts.map((draft, i) => {
      const platform = P.forChannel(build().channel(draft)), facts = build().facts(draft);
      return {scope: `m${i}`, id: draft.id, draft, platform, facts, values: P.valuesFor(platform, draft, facts), live: draft.buildStatus === 'live', touched: new Set(draft.platformTouched?.[platform.id] || [])};
    });
    const source = members.find(member => !member.live) || members[0];
    const shared = Object.fromEntries(SHARED.map(key => [key, source.values[key]]));
    state = {id: anchor.id, members, shared, openSections: new Set(), sliderBounds: {}, audOpen: '', activeField: '', lastReady: false,
      previewScope: (members.find(member => member.id === anchor.id) || source).scope,
      planAudience: text(anchor.audience || (Array.isArray(anchor.planBlueprint) ? Object.fromEntries(anchor.planBlueprint).Who : '') || source.facts.audience)};
    /* Open only what needs the marketer; everything else reads as a sentence. */
    allIssues().forEach(issue => state.openSections.add(issue.scope ? `p-${issue.scope}` : sharedSectionOf(issue.key)));
    nonLive().forEach(member => { if (memberIssues(member).some(issue => issue.key === 'budget')) state.openSections.add('schedule'); });
    if (openCard) state.openSections.add(openCard);
    if (focusKey) state.openSections.add(sectionOf(focusKey));
    render();
    el.hidden = false;
    main.classList.add('mce-editing');
    document.querySelector('.chatpane .chatbody .mbj-editor')?.remove();
    main.scrollTop = 0;
    window.scrollTo({top: 0});
    const target = focusKey ? jump(focusKey) : openCard ? el.querySelector(`#mce-s-${openCard}`) : null;
    if (openCard && target) target.scrollIntoView({block: 'start', behavior: calm() ? 'auto' : 'smooth'});
    if (!target) el.querySelector('h1')?.setAttribute('tabindex', '-1'), el.querySelector('h1')?.focus({preventScroll: true});
    return true;
  }
  function close() {
    flush();
    state = null;
    el.hidden = true;
    el.innerHTML = '';
    main.classList.remove('mce-editing');
  }
  function sectionOf(key, scope = keyScope(key)) { return scope === 'shared' || key === 'budget' ? sharedSectionOf(key) : `p-${scope}`; }
  function jump(key, scope) {
    const sectionId = sectionOf(key, scope || keyScope(key));
    if (sectionId && !state.openSections.has(sectionId)) setOpen(sectionId, true);
    const box = el.querySelector(`#mce-s-${sectionId} .mce-field[data-field="${key}"]`) || el.querySelector(`.mce-field[data-field="${key}"]`);
    if (!box) return null;
    box.scrollIntoView({block: 'center', behavior: 'smooth'});
    const input = box.querySelector('input:not([type="checkbox"]):not([disabled]), textarea, select, button, input');
    input?.focus({preventScroll: true});
    box.classList.remove('is-flash'); void box.offsetWidth; box.classList.add('is-flash');
    return box;
  }
  const route = () => {
    const params = new URLSearchParams(location.hash.slice(1));
    const id = params.get('edit');
    if (id) open(id, params.get('field') || ''); else if (state) close();
  };

  /* Public entry point used by Build. */
  window.MojoCanvasEditor = {
    canEdit: draft => !!(draft && P.forChannel(build()?.channel(draft))),
    open(index, field = '') {
      const draft = build().read()[index];
      if (!draft?.id || !this.canEdit(draft)) return false;
      const hash = `edit=${encodeURIComponent(draft.id)}${field ? `&field=${encodeURIComponent(field)}` : ''}`;
      if (location.hash.slice(1) === hash) route();
      else { location.hash = hash; }
      return true;
    }
  };

  /* ───────── events ───────── */
  el.addEventListener('input', event => {
    if (!state) return;
    const target = event.target;
    if (target.matches('[data-list-item]')) {
      const key = target.dataset.listItem, current = getValue(key), items = Array.isArray(current) && current.length ? [...current] : [''];
      items[Number(target.dataset.index)] = target.value;
      setValue(key, items);
      const field = findField(key), count = el.querySelector(`[data-list-count="${key}-${target.dataset.index}"]`);
      if (count && field) { count.textContent = `${target.value.length}/${field.itemMax}`; count.classList.toggle('over', target.value.length > field.itemMax); }
      return changed();
    }
    if (target.matches('[data-split-slider]')) { setTotal(Number(target.value)); syncSlider(target, Number(target.value), 'budget-total'); return changed(); }
    if (target.matches('[data-split-total]')) { setTotal(moneyValue(target.value)); return changed(); }
    if (target.matches('[data-split-amount]')) { const member = memberOf(target.dataset.splitAmount); if (member) { member.values.budget = moneyText(moneyValue(target.value)); } return changed(); }
    if (target.matches('[data-aud-search]')) {
      const q = target.value.trim().toLowerCase(), pop = target.closest('.mce-aud-pop');
      let shown = 0;
      pop.querySelectorAll('[data-aud-pick]').forEach(option => { const hit = !q || option.dataset.audSearchText.includes(q); option.hidden = !hit; if (hit) shown++; });
      pop.querySelector('.mce-aud-empty').hidden = !!shown;
      return;
    }
    if (target.matches('[data-tag-input]')) return;
    if (!target.name || !findField(target.name)) return;
    if (target.type === 'checkbox' || target.tagName === 'SELECT') return;
    setValue(target.name, target.value);
    changed();
  });
  /* Changing the total keeps each platform's share. */
  function setTotal(total) {
    const current = totalBudget(), open = nonLive();
    if (!open.length) return;
    const liveTotal = state.members.filter(member => member.live).reduce((sum, member) => sum + moneyValue(member.values.budget), 0);
    const target = Math.max(0, total - liveTotal), base = current - liveTotal;
    open.forEach(member => { member.values.budget = moneyText(base > 0 ? Math.round((moneyValue(member.values.budget) / base) * target / 10) * 10 : Math.round(target / open.length / 10) * 10); });
  }
  function syncAudience(key) {
    const box = el.querySelector(`[data-aud="${key}"]`);
    if (!box) return;
    const isOpen = state.audOpen === key;
    box.classList.toggle('is-open', isOpen);
    box.querySelector('[data-aud-toggle]').setAttribute('aria-expanded', String(isOpen));
    box.querySelector('.mce-aud-pop').hidden = !isOpen;
  }
  function syncStepsFade() {
    const steps = el.querySelector('.mce-steps');
    if (!steps) return;
    steps.classList.toggle('fade-right', steps.scrollLeft + steps.clientWidth < steps.scrollWidth - 2);
    steps.classList.toggle('fade-left', steps.scrollLeft > 2);
  }
  function syncSlider(slider, n, key) {
    const b = state.sliderBounds[key];
    slider.style.setProperty('--fill', `${((n - b.min) / (b.max - b.min)) * 100}%`);
    slider.setAttribute('aria-valuetext', moneyText(n));
  }
  el.addEventListener('change', event => {
    if (!state) return;
    const target = event.target;
    if (target.matches('[data-split-total], [data-split-amount]')) { target.value = target.matches('[data-split-total]') ? moneyText(totalBudget()) : moneyText(moneyValue(target.value)); return; }
    if (target.matches('[data-date-start], [data-date-end]')) {
      const key = target.dataset.dateStart || target.dataset.dateEnd, box = target.closest('[data-dates]');
      const prev = parseFlight(getValue(key)), length = prev ? spanDays(prev.start, prev.end) : 28;
      let start = fromIso(box.querySelector('[data-date-start]').value), end = fromIso(box.querySelector('[data-date-end]').value);
      if (target.dataset.dateStart && start) end = addDays(start, length - 1);
      if (start && end && end < start) end = start;
      if (start && !end) end = addDays(start, 27);
      if (!start || !end) return;
      setValue(key, formatFlight(start, end));
      return changed({structural: true, focus: target.dataset.dateStart ? `[data-date-start="${key}"]` : `[data-date-end="${key}"]`});
    }
    if (target.tagName === 'SELECT' && target.name) { setValue(target.name, target.value); return changed({structural: true, focus: `select[name="${target.name}"]`}); }
    if (target.type === 'checkbox' && target.name) { setValue(target.name, target.checked); return changed({structural: true, focus: `input[name="${target.name}"]`}); }
  });
  el.addEventListener('keydown', event => {
    if (!state) return;
    if (state.audOpen) {
      const box = el.querySelector(`[data-aud="${state.audOpen}"]`);
      if (event.key === 'Escape') { const key = state.audOpen; state.audOpen = ''; syncAudience(key); box?.querySelector('[data-aud-toggle]')?.focus(); event.preventDefault(); return; }
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        const options = [...box.querySelectorAll('[data-aud-pick]:not([hidden])')], i = options.indexOf(document.activeElement);
        const next = event.key === 'ArrowDown' ? options[Math.min(i + 1, options.length - 1)] : i <= 0 ? box.querySelector('[data-aud-search]') : options[i - 1];
        next?.focus(); event.preventDefault(); return;
      }
      if (event.key === 'Enter' && event.target.matches('[data-aud-search]')) { box.querySelector('[data-aud-pick]:not([hidden])')?.click(); event.preventDefault(); return; }
    }
    const input = event.target.closest('[data-tag-input]');
    if (input) {
      const key = input.dataset.tagInput, items = list(getValue(key));
      if ((event.key === 'Enter' || event.key === ',') && text(input.value)) {
        event.preventDefault();
        const next = text(input.value).replace(/,$/, '');
        if (!items.includes(next)) setValue(key, [...items, next]);
        return changed({structural: true, focus: `[data-tag-input="${key}"]`});
      }
      if (event.key === 'Backspace' && !input.value && items.length) { setValue(key, items.slice(0, -1)); return changed({structural: true, focus: `[data-tag-input="${key}"]`}); }
      if (event.key === 'Enter') event.preventDefault();
      return;
    }
    if (event.key === 'Enter' && event.target.matches('.mce-form input')) {
      event.preventDefault();
      const listInput = event.target.closest('[data-list-item]');
      if (listInput) el.querySelector(`[data-list-add="${listInput.dataset.listItem}"]`)?.click();
    }
  });
  el.addEventListener('focusout', event => {
    const input = event.target.closest?.('[data-tag-input]');
    if (!input || !state || !text(input.value)) return;
    const key = input.dataset.tagInput, items = list(getValue(key)), next = text(input.value).replace(/,$/, '');
    if (!items.includes(next)) { setValue(key, [...items, next]); input.value = ''; changed({structural: true}); }
  });
  el.addEventListener('focusin', event => {
    if (!state) return;
    const box = event.target.closest('.mce-field');
    state.activeField = box?.dataset.field || '';
    /* Show the preview of the platform being edited. */
    const card = event.target.closest('.mce-platform-card');
    if (card) { const scope = card.dataset.section.slice(2); if (scope !== state.previewScope) { state.previewScope = scope; el.querySelector('[data-preview-card]').innerHTML = previewHtml(); } }
    markActive();
  });
  el.addEventListener('submit', event => event.preventDefault());
  el.addEventListener('click', event => {
    if (!state) return;
    const t = event.target;
    if (t.closest('[data-close]')) { history.pushState(null, '', location.pathname + location.search); close(); return; }
    const audToggle = t.closest('[data-aud-toggle]');
    if (audToggle) {
      const key = audToggle.dataset.audToggle;
      state.audOpen = state.audOpen === key ? '' : key;
      syncAudience(key);
      if (state.audOpen) el.querySelector(`[data-aud="${key}"] [data-aud-search]`)?.focus({preventScroll: true});
      return;
    }
    const audPick = t.closest('[data-aud-pick]');
    if (audPick) {
      const key = audPick.closest('[data-aud]').dataset.aud;
      state.audOpen = '';
      setValue(key, audPick.dataset.audPick);
      return changed({structural: true, focus: `[data-aud-toggle="${key}"]`});
    }
    if (state.audOpen && !t.closest('.mce-aud')) { const key = state.audOpen; state.audOpen = ''; syncAudience(key); }
    if (t.closest('[data-split-even]')) {
      const open = nonLive(), liveTotal = state.members.filter(m => m.live).reduce((sum, m) => sum + moneyValue(m.values.budget), 0), each = Math.round((totalBudget() - liveTotal) / open.length / 10) * 10;
      open.forEach(member => { member.values.budget = moneyText(each); });
      el.querySelectorAll('[data-split-amount]').forEach(input => { const member = memberOf(input.dataset.splitAmount); if (member) input.value = member.values.budget; });
      return changed();
    }
    const preset = t.closest('[data-flight-days]');
    if (preset) {
      const key = preset.dataset.flightKey, start = parseFlight(getValue(key))?.start || dayStart(new Date());
      setValue(key, formatFlight(start, addDays(start, Number(preset.dataset.flightDays) - 1)));
      return changed({structural: true, focus: `[data-flight-days="${preset.dataset.flightDays}"]`});
    }
    const chip = t.closest('[data-chip]');
    if (chip) {
      const key = chip.dataset.chip, value = chip.dataset.value, items = list(getValue(key));
      setValue(key, items.includes(value) ? items.filter(item => item !== value) : [...items, value]);
      return changed({structural: true, focus: `[data-chip="${key}"][data-value="${CSS.escape(value)}"]`});
    }
    const asset = t.closest('[data-asset]');
    if (asset) {
      const key = asset.dataset.asset, items = list(getValue('assets')), field = findField('assets');
      let next = asset.dataset.single === 'true' ? [key] : items.includes(key) ? items.filter(item => item !== key) : [...items, key];
      if (field?.maxItems && next.length > field.maxItems) next = next.slice(-field.maxItems);
      setValue('assets', next);
      return changed({structural: true, focus: `[data-asset="${key}"]`});
    }
    const remove = t.closest('[data-tag-remove]');
    if (remove) {
      const key = remove.dataset.tagRemove, items = list(getValue(key));
      items.splice(Number(remove.dataset.index), 1);
      setValue(key, items);
      return changed({structural: true, focus: `[data-tag-input="${key}"]`});
    }
    const add = t.closest('[data-list-add]');
    if (add) {
      const key = add.dataset.listAdd, current = getValue(key), items = Array.isArray(current) ? [...current] : list(current);
      setValue(key, [...items, '']);
      return changed({structural: true, focus: `[data-list-item="${key}"][data-index="${items.length}"]`});
    }
    const listRemove = t.closest('[data-list-remove]');
    if (listRemove) {
      const key = listRemove.dataset.listRemove, current = getValue(key), items = Array.isArray(current) ? [...current] : list(current);
      items.splice(Number(listRemove.dataset.index), 1);
      setValue(key, items);
      return changed({structural: true, focus: `[data-list-add="${key}"]`});
    }
    const storyWord = t.closest('[data-story]');
    if (storyWord) {
      const id = storyWord.dataset.story;
      setOpen(id, true);
      {
        if (id.startsWith('p-')) { state.previewScope = id.slice(2); el.querySelector('[data-preview-card]').innerHTML = previewHtml(); }
        const card = el.querySelector(`#mce-s-${id}`);
        card?.classList.remove('is-arriving'); void card?.offsetWidth; card?.classList.add('is-arriving');
        card?.scrollIntoView({block: 'start', behavior: calm() ? 'auto' : 'smooth'});
        el.querySelector(`#mce-b-${id} .mce-field input:not([type="checkbox"]):not([disabled]), #mce-b-${id} .mce-field textarea, #mce-b-${id} .mce-field select, #mce-b-${id} .mce-aud-trigger`)?.focus({preventScroll: true});
      }
      return;
    }
    const previewSwitch = t.closest('[data-preview-switch]');
    if (previewSwitch) { state.previewScope = previewSwitch.dataset.previewSwitch; el.querySelector('[data-preview-card]').innerHTML = previewHtml(); markActive(); return; }
    const toggle = t.closest('[data-toggle]') || (t.closest('.mce-section-head') && !t.closest('.mce-picked') ? t.closest('.mce-section')?.querySelector('[data-toggle]') : null);
    if (toggle) {
      const id = toggle.dataset.toggle, isOpen = !state.openSections.has(id);
      setOpen(id, isOpen);
      if (isOpen) {
        if (id.startsWith('p-')) { state.previewScope = id.slice(2); el.querySelector('[data-preview-card]').innerHTML = previewHtml(); }
        el.querySelector(`#mce-b-${id} .mce-field input:not([type="checkbox"]):not([disabled]), #mce-b-${id} .mce-field textarea, #mce-b-${id} .mce-field select`)?.focus({preventScroll: true});
      } else el.querySelector(`#mce-s-${id}`)?.scrollIntoView({block: 'nearest', behavior: calm() ? 'auto' : 'smooth'});
      return;
    }
    const nav = t.closest('[data-nav]');
    if (nav) {
      const id = nav.dataset.nav;
      if (!state.openSections.has(id)) setOpen(id, true);
      if (id.startsWith('p-')) { state.previewScope = id.slice(2); el.querySelector('[data-preview-card]').innerHTML = previewHtml(); }
      el.querySelector(`#mce-s-${id}`)?.scrollIntoView({block: 'start', behavior: calm() ? 'auto' : 'smooth'});
      return;
    }
    if (t.closest('[data-fix-next]')) { const next = allIssues()[0]; if (next) jump(next.key, next.scope || 'shared'); return; }
    const hotspot = t.closest('[data-preview] [data-edit-field]');
    if (hotspot) return void jump(hotspot.dataset.editField);
    const jumpTo = t.closest('[data-jump]');
    if (jumpTo) return void jump(jumpTo.dataset.jump, jumpTo.dataset.jumpScope === 'shared' ? 'shared' : jumpTo.dataset.jumpScope);
    if (t.closest('[data-ask-fix]')) {
      const issues = allIssues(), name = title(state.members[0].draft);
      const prompt = issues.length ? `Fill in ${issues.map(issue => lowerFirst(issue.label) + (issue.scope ? ` on ${memberOf(issue.scope).platform.name}` : '')).join(', ')} for “${name}”.` : `Help me improve “${name}”.`;
      window.MojoOpenChat?.(prompt, false);
      const box = document.querySelector('.chatpane .composer textarea');
      if (box && !box.value) { box.value = prompt; box.focus(); }
      return;
    }
    const copy = t.closest('[data-copy]');
    if (copy) return copyTo(copy.dataset.copy);
    if (t.closest('[data-launch]')) {
      flush();
      const indices = nonLive().map(member => findIndex(member.id)).filter(index => index >= 0);
      const button = t.closest('[data-launch]');
      button.disabled = true;
      button.textContent = 'Launching…';
      const started = build().launch(indices, () => {
        history.replaceState(null, '', location.pathname + location.search);
        close();
        document.querySelector('.mbj-launch-confirmation')?.scrollIntoView({block: 'center'});
      });
      if (!started) { button.disabled = false; button.innerHTML = headActionsHtml(); }
    }
  });

  /* Add a platform: a new draft with the campaign's shared settings and a fair share of budget. */
  function copyTo(platformId) {
    flush();
    const platform = P.get(platformId), items = build().read(), source = items[findIndex((nonLive()[0] || state.members[0]).id)];
    if (!platform || !source) return;
    const deliverables = {...(source.deliverables || {}), keywords: '', budget: moneyText(Math.round(totalBudget() / state.members.length / 10) * 10)};
    const baseName = String(source.name || '').replace(/\s·\s[^·]+$/, '');
    const copy = {
      id: `${String(source.id).replace(/--[a-z0-9-]+$/, '')}--${platform.id}-${Date.now().toString(36)}`,
      source: source.source || source.id, name: `${baseName} · ${platform.name}`, planTitle: source.planTitle, initiative: source.initiative,
      planBlueprint: source.planBlueprint, duration: source.duration, budget: source.budget, audience: source.audience, creative: source.creative,
      channels: [platform.name], buildChannel: platform.name, creatives: [...(source.creatives || [])],
      budgetApproved: source.budgetApproved, deliverables, buildStatus: 'draft', savedAt: new Date().toISOString(),
      buildSetup: {audience: deliverables.audience, message: deliverables.creative, channels: platform.name, budget: deliverables.budget, utm: deliverables.tracking, conversion: deliverables.conversion, validation: deliverables.validation}
    };
    if (!source.source) source.source = source.id;
    build().write([...items, copy]);
    build().render();
    const anchorId = state.id;
    open(anchorId, '', `p-m${campaignDrafts(copy).findIndex(item => item.id === copy.id)}`);
  }

  window.addEventListener('hashchange', route);
  el.addEventListener('scroll', event => { if (event.target.matches?.('.mce-steps')) syncStepsFade(); }, true);
  window.addEventListener('resize', () => { if (state) syncStepsFade(); });
  window.addEventListener('beforeunload', flush);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });
  /* Build renders before this script loads, so re-render once to show the Edit in canvas buttons. */
  const start = () => { if (!window.MojoBuild) return void setTimeout(start, 50); window.MojoBuild.render(); route(); };
  start();
})();
