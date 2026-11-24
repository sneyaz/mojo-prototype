/*
 * Canvas campaign editor.
 *
 * Opens a Build campaign in the canvas and renders its platform's setup from
 * window.MojoAdPlatforms. This file has no platform-specific code: LinkedIn,
 * Google and Demandbase differ only in their registry entries.
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
  const budgetReadout = () => P.helpers.spendMath(state.values) || 'Add a flight to see daily spend';
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

  let state = null; // {id, platform, draft, facts, values, saveTimer, savedAt}

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
  function fieldHtml(field, section, values) {
    if (field.showIf && !field.showIf(values)) return '';
    const id = `mce-${section.id}-${field.key}`;
    const issue = P.fieldIssue(field, values[field.key], values);
    const wide = ['textarea', 'chips', 'tags', 'list', 'assets', 'daterange'].includes(field.kind) || field.slider || field.wide;
    const required = typeof field.required === 'function' ? field.required(values) : field.required;
    /* "Mojo picked" marks a default the marketer hasn't changed yet, with Mojo's reason. */
    const picked = field.why && !P.isCore(field.key) && !state.touched.has(field.key)
      ? `<span class="mce-picked" tabindex="0" aria-describedby="${id}-why">Mojo picked<span class="mce-why" role="tooltip" id="${id}-why">${escape(field.why)}</span></span>` : '';
    if (field.kind === 'toggle') {
      return `<div class="mce-field mce-field-toggle${wide ? ' wide' : ''}${issue ? ' has-issue' : ''}" data-field="${field.key}"><label for="${id}" id="${id}-label">${control(field, values[field.key], id)}<span class="mce-label-text">${escape(field.label)}</span>${picked}</label>${field.help ? `<small class="mce-help">${escape(field.help)}</small>` : ''}<small class="mce-issue" data-issue-for="${field.key}">${escape(issue)}</small></div>`;
    }
    return `<div class="mce-field${wide ? ' wide' : ''}${issue ? ' has-issue' : ''}" data-field="${field.key}"><div class="mce-label-row"><label for="${id}" id="${id}-label">${escape(field.label)}${required ? '' : ' <span class="mce-optional">Optional</span>'}</label>${picked}${counter(field, values[field.key])}</div>${field.help ? `<small class="mce-help">${escape(field.help)}</small>` : ''}${control(field, values[field.key], id)}<small class="mce-issue" data-issue-for="${field.key}">${escape(issue)}</small></div>`;
  }

  /* ───────── page rendering ───────── */
  const summaryHelpers = {
    escape, host, join: P.helpers.join, spend: P.helpers.spendMath,
    b: value => `<strong>${escape(value)}</strong>`,
    path: url => { try { const p = new URL(text(url)).pathname; return p === '/' ? '' : p; } catch { return ''; } }
  };
  function issueList() { return P.issues(state.draft, state.facts, state.values); }
  const sectionIssues = (issues, id) => issues.filter(issue => issue.section === id);
  function sectionSummary(section) {
    if (section.summary) { try { return section.summary(state.values, summaryHelpers); } catch { /* fall through */ } }
    return section.fields.filter(field => !field.showIf || field.showIf(state.values)).slice(0, 3).map(field => escape(list(state.values[field.key]).join(', ') || state.values[field.key] || '')).filter(Boolean).join(' · ');
  }
  /* Name the actual issue, never "1 thing": "landing page URL", "headlines". */
  const lowerFirst = label => /^[A-Z][a-z]/.test(label) ? label.charAt(0).toLowerCase() + label.slice(1) : label;
  const needsText = issues => issues.length === 1 ? lowerFirst(issues[0].label) : `${lowerFirst(issues[0].label)} + ${issues.length - 1} more`;
  const fixText = issues => issues.length === 1 ? `${issues[0].empty ? 'Add' : 'Fix'} ${lowerFirst(issues[0].label)} →` : `Fix ${issues.length} things →`;
  function statusHtml(issues) {
    if (state.draft.buildStatus === 'live') return '<span class="mce-status live"><i></i>Live</span>';
    return issues.length
      ? `<span class="mce-status draft" title="${escape(issues.map(issue => `${issue.label}: ${issue.message}`).join('\n'))}"><i></i>Draft · Needs ${escape(needsText(issues))}</span>`
      : `<span class="mce-status ready">${icon.check}Ready · Mojo QA passed</span>`;
  }
  /* The primary button always names the next step. */
  function primaryHtml(issues) {
    if (state.draft.buildStatus === 'live') return '';
    return issues.length
      ? `<button type="button" class="mce-primary" data-fix-next>${escape(fixText(issues))}</button>`
      : '<button type="button" class="mce-primary is-ready" data-launch>Launch campaign →</button>';
  }
  function qaHtml(issues) {
    if (!issues.length) return `<p class="mce-qa-ok">${icon.check}Every ${escape(state.platform.name)} field is set and all your rules are followed.</p>`;
    return `<ul class="mce-qa-list">${issues.map(issue => `<li><button type="button" data-jump="${issue.key}"><strong>${escape(issue.label)}</strong><span>${escape(issue.message)}</span></button></li>`).join('')}</ul><button type="button" class="mce-link" data-ask-fix>${icon.chat}Ask Mojo to fill these in</button>`;
  }
  /* Multichannel: drafts that share a plan source are one campaign running on several platforms. */
  const SYNC_KEYS = ['audience', 'creative', 'messaging', 'landing', 'tracking', 'flight', 'conversion', 'validation'];
  function campaignPlatforms() {
    const items = build().read();
    return items.filter(d => d && (d.id === state.draft.id || (state.draft.source && d.source === state.draft.source)) && P.forChannel(build().channel(d)))
      .map(d => ({draft: d, platform: P.forChannel(build().channel(d))}))
      .sort((a, b) => P.all().indexOf(a.platform) - P.all().indexOf(b.platform));
  }
  const moneyOf = value => { const n = Number(String(value ?? '').replace(/[^0-9.]/g, '')); return Number.isFinite(n) ? n : 0; };
  function platformsHtml(issues) {
    const list = campaignPlatforms(), used = new Set(list.map(item => item.platform.id));
    const total = list.reduce((sum, item) => sum + moneyOf(item.draft.id === state.draft.id ? state.values.budget : build().facts(item.draft).budget), 0);
    const tabs = list.map(({draft, platform}) => {
      const current = draft.id === state.draft.id;
      const live = draft.buildStatus === 'live';
      const count = current ? issues.length : build().qa(draft).missing.length;
      const mark = live ? '<span class="mce-tab-mark live">Live</span>' : count ? `<span class="mce-tab-mark issue" aria-label="${count} to fix">${count}</span>` : `<span class="mce-tab-mark ready" aria-label="ready">${icon.check}</span>`;
      return `<button type="button" class="mce-tab" data-switch="${escape(draft.id)}"${current ? ' aria-current="true"' : ''}><img src="${platform.logo}" alt="">${escape(platform.name)}${mark}</button>`;
    }).join('');
    const adds = P.all().filter(platform => !used.has(platform.id)).map(platform => `<button type="button" class="mce-tab mce-tab-add" data-copy="${platform.id}" title="Add ${escape(platform.name)}. Shared settings carry over.">${icon.plus}<img src="${platform.logo}" alt="">${escape(platform.name)}</button>`).join('');
    const label = list.length > 1 ? `Runs on <strong>${list.length} platforms</strong> · <strong>$${Math.round(total).toLocaleString()}</strong> total` : 'Runs on <strong>1 platform</strong>';
    const note = list.length > 1 ? 'Accounts, message, creative, landing page, tracking and flight stay in sync across these platforms. Budget and platform settings are set per platform.' : 'Add a platform to run this campaign there too. Mojo carries over the shared settings and fills in the rest.';
    return `<p class="mce-platforms-label">${label}</p><div class="mce-tabs">${tabs}${adds}</div><p class="mce-platforms-note">${note}</p>`;
  }
  const introText = issues => issues.length ? 'Mojo set up everything it could. The open sections need you.' : 'Mojo set up every section. Open one to change it, or launch.';
  function progressHtml(issues) {
    const sections = state.platform.sections;
    const ready = sections.filter(section => !sectionIssues(issues, section.id).length).length;
    return `<span class="mce-progress-label"><strong>${ready} of ${sections.length}</strong> ready</span><ol class="mce-steps">${sections.map(section => {
      const count = sectionIssues(issues, section.id).length;
      return `<li><button type="button" class="mce-step${count ? ' has-issue' : ''}" data-nav="${section.id}"><span class="mce-step-mark" aria-hidden="true">${count || icon.check}</span>${escape(section.title)}<span class="sr-only">${count ? `, ${count} to fix` : ', ready'}</span></button></li>`;
    }).join('')}</ol>`;
  }
  function structureHtml() {
    const ctx = {title: title(state.draft), initiative: build().initiative(state.draft)};
    const values = state.platform.structureValues ? state.platform.structureValues(state.draft, state.values, ctx) : [];
    return `<ol class="mce-structure" aria-label="Where this lands in ${escape(state.platform.name)}">${state.platform.structure.map((level, i) => `<li><small>${escape(level)}</small><span>${escape(values[i] || '')}</span></li>`).join('')}</ol>`;
  }
  /* Each section is a card: collapsed it reads as one sentence; open it shows the fields. */
  function sectionHtml(section, issues) {
    const count = sectionIssues(issues, section.id).length;
    const isOpen = state.openSections.has(section.id);
    return `<section class="mce-section${count ? ' has-issue' : ''}" id="mce-s-${section.id}" data-section="${section.id}" data-open="${isOpen}">
      <header class="mce-section-head">
        <span class="mce-section-mark" data-mark aria-hidden="true">${count || icon.check}</span>
        <div class="mce-section-text">
          <h2><button type="button" data-toggle="${section.id}" aria-expanded="${isOpen}" aria-controls="mce-b-${section.id}">${escape(section.title)}</button></h2>
          <p class="mce-summary" data-summary>${sectionSummary(section)}</p>
          ${section.description ? `<p class="mce-section-desc">${escape(section.description)}</p>` : ''}
        </div>
        <span class="mce-section-action" aria-hidden="true">${isOpen ? 'Done' : count ? 'Fix' : 'Edit'}<svg viewBox="0 0 20 20"><path d="m6 8 4 4 4-4"/></svg></span>
      </header>
      <div class="mce-section-body" id="mce-b-${section.id}" ${isOpen ? '' : 'hidden'}>
        <div class="mce-fields">${section.fields.map(field => fieldHtml(field, section, state.values)).join('')}</div>
      </div>
    </section>`;
  }
  function formHtml(issues = issueList()) { return state.platform.sections.map(section => sectionHtml(section, issues)).join(''); }
  function render() {
    const issues = issueList();
    state.lastIssueCount = issues.length;
    el.dataset.platform = state.platform.id;
    el.innerHTML = `
      <div class="mce-top">
        <nav class="mce-crumbs" aria-label="Breadcrumb"><button type="button" data-close>Build</button><span aria-hidden="true">/</span><span aria-current="page">${escape(title(state.draft))}</span></nav>
        <span class="mce-save-state" data-save-state role="status">${state.savedAt ? 'Saved' : 'Mojo saves as you edit'}</span>
      </div>
      <header class="mce-head">
        <div class="mce-head-main">
          <span class="mce-platform"><img src="${state.platform.logo}" alt="">${escape(state.platform.name)}<span aria-hidden="true">·</span>${escape(build().initiative(state.draft))}</span>
          <h1>${escape(title(state.draft))}</h1>
          ${structureHtml()}
        </div>
        <div class="mce-head-actions">
          <span data-status>${statusHtml(issues)}</span>
          <div class="mce-buttons">
            <button type="button" class="mce-secondary" data-ask>${icon.chat}Ask Mojo</button>
            <span data-primary>${primaryHtml(issues)}</span>
          </div>
        </div>
      </header>
      <section class="mce-platforms" data-platforms aria-label="Platforms">${platformsHtml(issues)}</section>
      <div class="mce-body">
        <div class="mce-main">
          <nav class="mce-progress" aria-label="Campaign sections" data-progress>${progressHtml(issues)}</nav>
          <p class="mce-intro" data-intro>${introText(issues)}</p>
          <form class="mce-form" novalidate>${formHtml(issues)}</form>
        </div>
        <aside class="mce-rail">
          <div class="mce-rail-top">
            <section class="mce-card mce-preview-card"><div class="mce-card-head"><h3>Preview</h3><small>Click to edit</small></div><div class="mce-preview" data-preview>${state.platform.preview(state.values, previewHelpers)}</div></section>
            <section class="mce-card" data-qa-card><h3>Mojo QA</h3><div data-qa>${qaHtml(issues)}</div></section>
          </div>
        </aside>
      </div>
      <div class="mce-toast" data-toast role="status" aria-live="polite"></div>`;
    markActive();
  }
  /* Refresh everything that depends on values without touching focused inputs. */
  function refresh() {
    const issues = issueList();
    el.querySelector('[data-status]').innerHTML = statusHtml(issues);
    el.querySelector('[data-qa]').innerHTML = qaHtml(issues);
    el.querySelector('[data-progress]').innerHTML = progressHtml(issues);
    el.querySelector('[data-intro]').textContent = introText(issues);
    el.querySelector('[data-platforms]').innerHTML = platformsHtml(issues);
    el.querySelectorAll('[data-budget-readout]').forEach(node => { node.textContent = budgetReadout(); });
    el.querySelector('[data-preview]').innerHTML = state.platform.preview(state.values, previewHelpers);
    const primary = el.querySelector('[data-primary]');
    const wasReady = !state.lastIssueCount, isReady = !issues.length;
    if (primary && wasReady !== isReady) primary.innerHTML = primaryHtml(issues);
    else if (primary && !isReady) { const b = primary.querySelector('[data-fix-next]'); if (b) b.textContent = fixText(issues); }
    const structure = el.querySelector('.mce-structure');
    if (structure) structure.outerHTML = structureHtml();
    state.platform.sections.forEach(section => {
      const card = el.querySelector(`.mce-section[data-section="${section.id}"]`);
      if (!card) return;
      const count = sectionIssues(issues, section.id).length, had = card.classList.contains('has-issue');
      card.classList.toggle('has-issue', !!count);
      card.querySelector('[data-mark]').innerHTML = count || icon.check;
      if (had && !count) celebrateMark(card);
      card.querySelector('[data-summary]').innerHTML = sectionSummary(section);
      syncAction(card);
    });
    P.fields(state.platform).forEach(field => {
      const box = el.querySelector(`.mce-field[data-field="${field.key}"]`);
      if (!box || (field.showIf && !field.showIf(state.values))) return;
      const issue = P.fieldIssue(field, state.values[field.key], state.values);
      box.classList.toggle('has-issue', !!issue);
      const message = box.querySelector('[data-issue-for]');
      if (message) message.textContent = issue;
      const count = box.querySelector(`[data-count-for="${field.key}"]`);
      if (count) count.outerHTML = counter(field, state.values[field.key]);
    });
    if (state.lastIssueCount > 0 && isReady) readyMoment();
    state.lastIssueCount = issues.length;
    markActive();
  }
  /* Full re-render of the form for structural changes (a select that shows or hides fields). */
  function rerenderForm(focusSelector) {
    const form = el.querySelector('.mce-form');
    form.innerHTML = formHtml();
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
  }
  /* Small moments: a section's check pops when its last fix lands; the campaign gets one line when it's ready. */
  const calm = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  function celebrateMark(card) {
    const mark = card.querySelector('[data-mark]');
    mark.classList.remove('is-pop'); void mark.offsetWidth; mark.classList.add('is-pop');
  }
  function readyMoment() {
    const toast = el.querySelector('[data-toast]');
    if (toast) {
      toast.innerHTML = `${icon.check}<span><strong>Ready to launch.</strong> Every ${escape(state.platform.name)} rule checks out.</span>`;
      toast.classList.remove('is-shown'); void toast.offsetWidth; toast.classList.add('is-shown');
      clearTimeout(state.toastTimer);
      state.toastTimer = setTimeout(() => toast.classList.remove('is-shown'), 3200);
    }
    const launch = el.querySelector('[data-launch]');
    if (launch && !calm()) { launch.classList.remove('is-arrive'); void launch.offsetWidth; launch.classList.add('is-arrive'); }
  }
  /* Highlight the part of the preview that the focused field controls. */
  function markActive() {
    el.querySelectorAll('[data-preview] [data-edit-field]').forEach(node => node.classList.toggle('is-active', node.dataset.editField === state.activeField));
  }

  /* ───────── persistence ───────── */
  function persist() {
    const items = build().read();
    const index = findIndex(state.id);
    const item = items[index];
    if (!item) return;
    const v = state.values, core = {};
    ['audience', 'creative', 'tracking', 'keywords', 'budget', 'flight', 'landing', 'messaging', 'conversion', 'validation'].forEach(key => {
      core[key] = Array.isArray(v[key]) ? list(v[key]).join(', ') : text(v[key] ?? state.facts[key]);
    });
    item.deliverables = core;
    item.creatives = list(v.assets);
    item.budgetApproved = v.budgetApproved === true;
    item.platformFields = item.platformFields || {};
    const own = {};
    P.fields(state.platform).filter(field => !P.isCore(field.key)).forEach(field => { own[field.key] = field.kind === 'list' ? list(v[field.key]) : v[field.key]; });
    item.platformFields[state.platform.id] = own;
    item.platformTouched = {...(item.platformTouched || {}), [state.platform.id]: [...state.touched]};
    item.buildSetup = {...(item.buildSetup || {}), audience: core.audience, message: core.creative, channels: build().channel(item), budget: core.budget, utm: core.tracking, conversion: core.conversion, validation: core.validation};
    if (item.buildStatus !== 'live') item.buildStatus = build().qa(item).passed ? 'ready' : 'draft';
    /* Keep shared settings in sync on the campaign's other platforms (not live ones). */
    const synced = [];
    items.forEach(other => {
      if (!other || other === item || !item.source || other.source !== item.source || other.buildStatus === 'live' || !P.forChannel(build().channel(other))) return;
      const before = JSON.stringify([other.deliverables, other.creatives]);
      other.deliverables = {...(other.deliverables || {})};
      SYNC_KEYS.forEach(key => { other.deliverables[key] = core[key]; });
      other.creatives = [...item.creatives];
      other.buildSetup = {...(other.buildSetup || {}), audience: core.audience, message: core.creative, utm: core.tracking, conversion: core.conversion, validation: core.validation};
      other.buildStatus = build().qa(other).passed ? 'ready' : 'draft';
      if (JSON.stringify([other.deliverables, other.creatives]) !== before) synced.push(P.forChannel(build().channel(other)).name);
    });
    build().write(items);
    build().render();
    state.draft = item;
    state.facts = build().facts(item);
    state.savedAt = Date.now();
    const label = el.querySelector('[data-save-state]');
    if (label) label.textContent = synced.length ? `Saved · synced to ${P.helpers.join(synced)}` : 'Saved · Mojo QA rechecked';
    if (synced.length) el.querySelector('[data-platforms]').innerHTML = platformsHtml(issueList());
  }
  function changed({structural = false, focus} = {}) {
    const label = el.querySelector('[data-save-state]');
    if (label) label.textContent = 'Saving…';
    if (structural) rerenderForm(focus); else refresh();
    clearTimeout(state.saveTimer);
    state.saveTimer = setTimeout(persist, 450);
  }
  function flush() { if (state?.saveTimer) { clearTimeout(state.saveTimer); state.saveTimer = null; persist(); } }

  /* ───────── open / close ───────── */
  function open(id, focusKey = '') {
    const index = findIndex(id);
    const draft = build().read()[index];
    if (!draft) return close();
    const platform = P.forChannel(build().channel(draft));
    if (!platform) return false;
    if (state && String(state.id) !== String(id)) flush();
    const facts = build().facts(draft);
    const values = P.valuesFor(platform, draft, facts);
    state = {id: draft.id, platform, draft, facts, values, savedAt: null, saveTimer: null, activeField: '', lastIssueCount: 0,
      touched: new Set(draft.platformTouched?.[platform.id] || []), openSections: new Set(), sliderBounds: {}};
    /* Open only what needs the marketer; everything else reads as a summary. */
    P.issues(draft, facts, values).forEach(issue => state.openSections.add(issue.section));
    if (focusKey) { const section = sectionOf(focusKey); if (section) state.openSections.add(section); }
    render();
    el.hidden = false;
    main.classList.add('mce-editing');
    document.querySelector('.chatpane .chatbody .mbj-editor')?.remove();
    main.scrollTop = 0;
    window.scrollTo({top: 0});
    const target = focusKey ? jump(focusKey) : null;
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
  function sectionOf(key) {
    return state.platform.sections.find(section => section.fields.some(field => field.key === key && (!field.showIf || field.showIf(state.values))))?.id
      || state.platform.sections.find(section => section.fields.some(field => field.key === key))?.id || '';
  }
  function jump(key) {
    const section = sectionOf(key);
    if (section && !state.openSections.has(section)) setOpen(section, true);
    const box = el.querySelector(`.mce-field[data-field="${key}"]`);
    if (!box) return null;
    box.scrollIntoView({block: 'center', behavior: 'smooth'});
    const input = box.querySelector('input:not([type="checkbox"]), textarea, select, button, input');
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
  const setValue = (key, value) => { state.values[key] = value; state.touched.add(key); el.querySelector(`.mce-field[data-field="${key}"] .mce-picked`)?.remove(); };
  const findField = key => P.fields(state.platform).find(field => field.key === key && (!field.showIf || field.showIf(state.values)));

  el.addEventListener('input', event => {
    if (!state) return;
    const target = event.target;
    if (target.matches('[data-list-item]')) {
      const key = target.dataset.listItem, items = Array.isArray(state.values[key]) && state.values[key].length ? [...state.values[key]] : [''];
      items[Number(target.dataset.index)] = target.value;
      setValue(key, items);
      const field = findField(key), count = el.querySelector(`[data-list-count="${key}-${target.dataset.index}"]`);
      if (count) { count.textContent = `${target.value.length}/${field.itemMax}`; count.classList.toggle('over', target.value.length > field.itemMax); }
      return changed();
    }
    if (target.matches('[data-slider]')) {
      const key = target.dataset.slider, n = Number(target.value);
      setValue(key, moneyText(n));
      const box = target.closest('.mce-budget');
      box.querySelector(`input[name="${key}"]`).value = moneyText(n);
      syncSlider(target, n);
      return changed();
    }
    if (target.matches('[data-tag-input]')) return;
    if (!target.name || !findField(target.name)) return;
    if (target.type === 'checkbox') return;
    if (target.tagName === 'SELECT') return;
    setValue(target.name, target.value);
    const slider = target.closest('.mce-budget')?.querySelector('[data-slider]');
    if (slider) { const b = state.sliderBounds[slider.dataset.slider]; const n = Math.min(Math.max(moneyValue(target.value), b.min), b.max); slider.value = n; syncSlider(slider, n); }
    changed();
  });
  function syncSlider(slider, n) {
    const b = state.sliderBounds[slider.dataset.slider];
    slider.style.setProperty('--fill', `${((n - b.min) / (b.max - b.min)) * 100}%`);
    slider.setAttribute('aria-valuetext', moneyText(n));
  }
  el.addEventListener('change', event => {
    if (!state) return;
    const target = event.target;
    if (target.matches('[data-date-start], [data-date-end]')) {
      const key = target.dataset.dateStart || target.dataset.dateEnd, box = target.closest('[data-dates]');
      const prev = parseFlight(state.values[key]), length = prev ? spanDays(prev.start, prev.end) : 28;
      let start = fromIso(box.querySelector('[data-date-start]').value), end = fromIso(box.querySelector('[data-date-end]').value);
      if (target.dataset.dateStart && start) end = addDays(start, length - 1); /* moving the start keeps the length */
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
    const input = event.target.closest('[data-tag-input]');
    if (input) {
      const key = input.dataset.tagInput, items = list(state.values[key]);
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
    const key = input.dataset.tagInput, items = list(state.values[key]), next = text(input.value).replace(/,$/, '');
    if (!items.includes(next)) { setValue(key, [...items, next]); input.value = ''; changed({structural: true}); }
  });
  el.addEventListener('focusin', event => {
    if (!state) return;
    const box = event.target.closest('.mce-field');
    state.activeField = box?.dataset.field || '';
    markActive();
  });
  el.addEventListener('submit', event => event.preventDefault());
  el.addEventListener('click', event => {
    if (!state) return;
    const t = event.target;
    if (t.closest('[data-close]')) {
      history.pushState(null, '', location.pathname + location.search);
      close();
      return;
    }
    const preset = t.closest('[data-flight-days]');
    if (preset) {
      const key = preset.dataset.flightKey, start = parseFlight(state.values[key])?.start || dayStart(new Date());
      setValue(key, formatFlight(start, addDays(start, Number(preset.dataset.flightDays) - 1)));
      return changed({structural: true, focus: `[data-flight-days="${preset.dataset.flightDays}"]`});
    }
    const chip = t.closest('[data-chip]');
    if (chip) {
      const key = chip.dataset.chip, value = chip.dataset.value, items = list(state.values[key]);
      setValue(key, items.includes(value) ? items.filter(item => item !== value) : [...items, value]);
      return changed({structural: true, focus: `[data-chip="${key}"][data-value="${CSS.escape(value)}"]`});
    }
    const asset = t.closest('[data-asset]');
    if (asset) {
      const key = asset.dataset.asset, items = list(state.values.assets), field = findField('assets');
      let next = asset.dataset.single === 'true' ? [key] : items.includes(key) ? items.filter(item => item !== key) : [...items, key];
      if (field?.maxItems && next.length > field.maxItems) next = next.slice(-field.maxItems);
      setValue('assets', next);
      return changed({structural: true, focus: `[data-asset="${key}"]`});
    }
    const remove = t.closest('[data-tag-remove]');
    if (remove) {
      const key = remove.dataset.tagRemove, items = list(state.values[key]);
      items.splice(Number(remove.dataset.index), 1);
      setValue(key, items);
      return changed({structural: true, focus: `[data-tag-input="${key}"]`});
    }
    const add = t.closest('[data-list-add]');
    if (add) {
      const key = add.dataset.listAdd, items = Array.isArray(state.values[key]) ? [...state.values[key]] : list(state.values[key]);
      setValue(key, [...items, '']);
      return changed({structural: true, focus: `[data-list-item="${key}"][data-index="${items.length}"]`});
    }
    const listRemove = t.closest('[data-list-remove]');
    if (listRemove) {
      const key = listRemove.dataset.listRemove, items = Array.isArray(state.values[key]) ? [...state.values[key]] : list(state.values[key]);
      items.splice(Number(listRemove.dataset.index), 1);
      setValue(key, items);
      return changed({structural: true, focus: `[data-list-add="${key}"]`});
    }
    const toggle = t.closest('[data-toggle]') || (t.closest('.mce-section-head') && !t.closest('.mce-picked') ? t.closest('.mce-section')?.querySelector('[data-toggle]') : null);
    if (toggle) {
      const id = toggle.dataset.toggle, open = !state.openSections.has(id);
      setOpen(id, open);
      if (open) el.querySelector(`#mce-b-${id} .mce-field input:not([type="checkbox"]), #mce-b-${id} .mce-field textarea, #mce-b-${id} .mce-field select`)?.focus({preventScroll: true});
      else el.querySelector(`#mce-s-${id}`)?.scrollIntoView({block: 'nearest', behavior: calm() ? 'auto' : 'smooth'});
      return;
    }
    const nav = t.closest('[data-nav]');
    if (nav) {
      const id = nav.dataset.nav;
      if (!state.openSections.has(id)) setOpen(id, true);
      el.querySelector(`#mce-s-${id}`)?.scrollIntoView({block: 'start', behavior: calm() ? 'auto' : 'smooth'});
      return;
    }
    if (t.closest('[data-fix-next]')) { const next = issueList()[0]; if (next) jump(next.key); return; }
    const hotspot = t.closest('[data-preview] [data-edit-field]');
    if (hotspot) return void jump(hotspot.dataset.editField);
    const jumpTo = t.closest('[data-jump]');
    if (jumpTo) return void jump(jumpTo.dataset.jump);
    if (t.closest('[data-ask]') || t.closest('[data-ask-fix]')) {
      const issues = issueList();
      const prompt = t.closest('[data-ask-fix]') && issues.length
        ? `Fill in ${issues.map(issue => issue.label.charAt(0).toLowerCase() + issue.label.slice(1)).join(', ')} for “${title(state.draft)}” on ${state.platform.name}.`
        : `Help me improve “${title(state.draft)}” on ${state.platform.name}.`;
      window.MojoOpenChat?.(prompt, false);
      const box = document.querySelector('.chatpane .composer textarea');
      if (box && !box.value) { box.value = prompt; box.focus(); }
      return;
    }
    const switchTo = t.closest('[data-switch]');
    if (switchTo) { if (switchTo.getAttribute('aria-current') === 'true') return; flush(); location.hash = `edit=${encodeURIComponent(switchTo.dataset.switch)}`; return; }
    const copy = t.closest('[data-copy]');
    if (copy) return copyTo(copy.dataset.copy, copy.dataset.existing);
    if (t.closest('[data-launch]')) {
      flush();
      const index = findIndex(state.id);
      const button = t.closest('[data-launch]');
      button.disabled = true;
      button.textContent = 'Launching…';
      const started = build().launch([index], () => {
        history.replaceState(null, '', location.pathname + location.search);
        close();
        document.querySelector('.mbj-launch-confirmation')?.scrollIntoView({block: 'center'});
      });
      if (!started) { button.disabled = false; button.textContent = 'Launch campaign →'; }
    }
  });

  /* Copy shared fields into a new draft on another platform. */
  function copyTo(platformId, existingId) {
    flush();
    if (existingId) { location.hash = `edit=${encodeURIComponent(existingId)}`; return; }
    const platform = P.get(platformId), items = build().read(), source = items[findIndex(state.id)];
    if (!platform || !source) return;
    const sharedKeys = new Set(P.fields(platform).filter(field => field.shared).map(field => field.key));
    const deliverables = {};
    ['audience', 'creative', 'tracking', 'keywords', 'budget', 'flight', 'landing', 'messaging', 'conversion', 'validation'].forEach(key => { deliverables[key] = sharedKeys.has(key) ? (source.deliverables?.[key] ?? '') : ''; });
    const baseName = String(source.name || '').replace(/\s·\s[^·]+$/, '');
    const copy = {
      id: `${String(source.id).replace(/--[a-z0-9-]+$/, '')}--${platform.id}-${Date.now().toString(36)}`,
      source: source.source, name: `${baseName} · ${platform.name}`, planTitle: source.planTitle, initiative: source.initiative,
      planBlueprint: source.planBlueprint, duration: source.duration, budget: source.budget, audience: source.audience, creative: source.creative,
      channels: [platform.name], buildChannel: platform.name, creatives: sharedKeys.has('assets') ? [...(source.creatives || [])] : [],
      budgetApproved: source.budgetApproved, deliverables, buildStatus: 'draft', savedAt: new Date().toISOString(),
      buildSetup: {audience: deliverables.audience, message: deliverables.creative, channels: platform.name, budget: deliverables.budget, utm: deliverables.tracking, conversion: deliverables.conversion, validation: deliverables.validation}
    };
    build().write([...items, copy]);
    build().render();
    location.hash = `edit=${encodeURIComponent(copy.id)}`;
  }

  window.addEventListener('hashchange', route);
  window.addEventListener('beforeunload', flush);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });
  /* Build renders before this script loads, so re-render once to show the Edit in canvas buttons. */
  const start = () => { if (!window.MojoBuild) return void setTimeout(start, 50); window.MojoBuild.render(); route(); };
  start();
})();
