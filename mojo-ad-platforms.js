/*
 * Mojo ad platform registry.
 *
 * Each ad platform (LinkedIn Ads, Google Ads, Demandbase Ads, ...) is described
 * as data: its structure, editable sections, fields, limits, defaults and a
 * preview. The canvas campaign editor (mojo-canvas-editor.js) and Mojo QA
 * (mojo-build-journey.js) both read from here, so adding a platform means
 * adding one `register({...})` call. No editor or QA code changes.
 *
 * Field kinds
 *   text | textarea | url | money | select | chips | tags | list | toggle | assets
 *
 * Field options
 *   key        storage key. Shared fields use the campaign's core deliverable keys
 *              (audience, creative, messaging, landing, tracking, keywords,
 *              budget, flight, conversion, validation, budgetApproved, assets).
 *              Platform fields are stored under draft.platformFields[platform.id].
 *   shared     true when the value is the same idea on every platform and is
 *              carried over when a campaign is copied to another platform.
 *   required   true, or a function (values) => boolean.
 *   showIf     (values) => boolean. Hidden fields are not validated.
 *   max        hard character limit (blocks QA).
 *   recommend  soft character limit (shown as guidance only).
 *   minItems / maxItems / itemMax   for list, chips and tags fields.
 *   options    for select and chips.
 *   default    value or (ctx) => value. Mojo fills these in; the marketer reviews.
 *   validate   (value, values) => error string or ''.
 *   help       one line of guidance under the label.
 *
 * Sample data only: field names and limits approximate each platform's setup
 * so the prototype feels real. Confirm against each platform's API before build.
 */
(() => {
  const platforms = [];

  const text = value => String(value ?? '').trim();
  const list = value => Array.isArray(value) ? value.map(text).filter(Boolean) : text(value) ? text(value).split(/\s*,\s*/).filter(Boolean) : [];
  const trimTo = (value, max) => { const s = text(value); return s.length <= max ? s : s.slice(0, max).replace(/\s+\S*$/, ''); };
  const isUrl = value => /^https?:\/\/[^\s.]+\.[^\s]+$/i.test(text(value));
  /* Keys stored on the campaign itself (draft.deliverables / draft.creatives), not per platform. */
  const CORE_KEYS = new Set(['audience', 'creative', 'messaging', 'assets', 'landing', 'tracking', 'keywords', 'conversion', 'validation', 'budget', 'flight', 'budgetApproved']);
  const isCore = key => CORE_KEYS.has(key);
  /* Sample creative library. In the product this comes from the brand's asset store. */
  const assetLibrary = [
    {key: 'handoff', title: 'Make the handoff the easy part.', src: 'assets/acme-creative-handoff.svg'},
    {key: 'buyers', title: 'Every buyer. One flow.', src: 'assets/acme-creative-buyers.svg'},
    {key: 'momentum', title: 'Keep momentum moving.', src: 'assets/acme-creative-momentum.svg'}
  ];

  /* Fields every platform shares. Platforms pick and relabel them. */
  const core = {
    audience: {key:'audience', label:'Accounts', kind:'audience', shared:true, required:true, wide:true, help:'Keep Mojo’s pick for this plan or choose a saved audience.'},
    creative: {key:'creative', label:'Creative concept', kind:'text', shared:true, required:true},
    messaging: {key:'messaging', label:'Core message', kind:'textarea', shared:true, required:true, recommend:120},
    assets: {key:'assets', label:'Creative assets', kind:'assets', shared:true, minItems:1, required:true, default:({facts}) => facts.creative ? ['handoff'] : []},
    landing: {key:'landing', label:'Landing page URL', kind:'url', shared:true, required:true, placeholder:'https://acme.com/…', validate:v => text(v) && !isUrl(v) ? 'Enter a full URL that starts with https://' : ''},
    tracking: {key:'tracking', label:'Campaign tracking', kind:'text', shared:true, required:true, placeholder:'utm_campaign=…', help:'Added to every link so Report can match visits to this campaign.', validate:v => text(v) && !/utm_campaign=\S+/.test(text(v)) ? 'Include utm_campaign=…' : ''},
    conversion: {key:'conversion', label:'Conversion event', kind:'text', shared:true, help:'What counts as success in the CRM.'},
    validation: {key:'validation', label:'How Mojo will check the result', kind:'text', shared:true},
    budget: {key:'budget', label:'Total budget', kind:'money', shared:true, required:true, slider:true},
    flight: {key:'flight', label:'Flight', kind:'daterange', shared:true, required:true, wide:true, validate:v => text(v) && !flightDays(v) ? 'Pick a start and end date' : ''},
    budgetApproved: {key:'budgetApproved', label:'Budget approved under company rules', kind:'toggle', shared:true, required:true, validate:v => v === false ? 'Approve the budget, or ask your approver in Chat' : ''}
  };
  const use = (field, overrides = {}) => ({...field, ...overrides});

  /* Helpers platforms use for sensible defaults. */
  const roleGuess = audience => {
    const a = text(audience).toLowerCase(), roles = [];
    if (/finance|cfo/.test(a)) roles.push('Finance');
    if (/security|it\b|cio/.test(a)) roles.push('Information Technology');
    if (/marketing/.test(a)) roles.push('Marketing');
    if (/operations|ops/.test(a)) roles.push('Operations');
    return roles.length ? roles : ['Information Technology', 'Operations'];
  };
  const urlPath = url => { try { return new URL(text(url)).pathname.split('/').filter(Boolean); } catch { return []; } };
  const join = items => { const l = list(items); return l.length < 2 ? l.join('') : `${l.slice(0, -1).join(', ')} and ${l[l.length - 1]}`; };
  /* Plain arithmetic on what the marketer entered: no forecasts, no invented numbers. */
  const money = value => { const n = Number(String(value ?? '').replace(/[^0-9.]/g, '')); return Number.isFinite(n) && n > 0 ? n : 0; };
  const usd = n => '$' + (n >= 10 ? Math.round(n).toLocaleString() : n.toFixed(2));
  const flightDays = value => {
    const v = text(value), days = v.match(/(\d+)\s*days?/i);
    if (days) return Number(days[1]);
    const parts = v.split(/\s*[–-]\s*/), year = new Date().getFullYear();
    if (parts.length !== 2) return 0;
    const start = new Date(`${parts[0]} ${year}`), end = new Date(/^\d+$/.test(parts[1]) ? `${parts[0].replace(/\d+$/, '')}${parts[1]} ${year}` : `${parts[1]} ${year}`);
    const diff = Math.round((end - start) / 86400000) + 1;
    return diff > 0 ? diff : diff + 365 > 0 && diff + 365 < 366 ? diff + 365 : 0;
  };
  /* The number next to "accounts" ("Tier 1 Named (360 accounts)" is 360), else the first number. */
  const accountCount = value => { const v = text(value), m = v.match(/(\d[\d,]*)\s+(?:[A-Za-z-]+\s+){0,3}accounts?\b/i) || v.match(/\d[\d,]*/); return m ? Number((m[1] || m[0]).replace(/,/g, '')) : 0; };
  const spendMath = values => {
    const total = money(values.budget), days = flightDays(values.flight), accounts = accountCount(values.audience);
    return [total && days ? `about ${usd(total / days)} a day` : '', total && accounts ? `${usd(total / accounts)} per account` : ''].filter(Boolean).join(' · ');
  };

  function register(def) {
    if (!def?.id || !def.match || !Array.isArray(def.sections)) throw new Error('Mojo platform needs id, match and sections');
    const index = platforms.findIndex(item => item.id === def.id);
    if (index >= 0) platforms.splice(index, 1, def); else platforms.push(def);
    return def;
  }
  const all = () => platforms.slice();
  const get = id => platforms.find(item => item.id === id) || null;
  const forChannel = name => platforms.find(item => item.match.test(String(name || ''))) || null;
  const fields = platform => platform.sections.flatMap(section => section.fields.map(field => ({...field, section: section.id})));

  /* Resolve the values the editor shows: saved value, else Mojo's default. */
  function valuesFor(platform, draft, facts) {
    const saved = draft.platformFields?.[platform.id] || {};
    const values = {...facts, budgetApproved: draft.budgetApproved !== false, assets: Array.isArray(facts.assets) ? facts.assets : []};
    const ctx = {draft, facts, platform, values};
    const empty = value => value == null || (Array.isArray(value) ? !value.length : text(value) === '');
    const resolve = field => typeof field.default === 'function' ? field.default(ctx) : field.default;
    fields(platform).forEach(field => {
      if (isCore(field.key)) {
        if (empty(values[field.key]) && field.default !== undefined) values[field.key] = resolve(field);
      } else if (Object.prototype.hasOwnProperty.call(saved, field.key)) {
        values[field.key] = saved[field.key];
      } else {
        values[field.key] = field.default !== undefined ? resolve(field) : ['chips', 'list', 'tags'].includes(field.kind) ? [] : '';
      }
    });
    /* Asset counts depend on the ad format (one image vs. a carousel). */
    const assetField = fields(platform).find(field => field.key === 'assets' && (!field.showIf || field.showIf(values)));
    if (assetField?.maxItems) values.assets = list(values.assets).slice(0, assetField.maxItems);
    return values;
  }

  function fieldIssue(field, value, values) {
    if (field.showIf && !field.showIf(values)) return '';
    const required = typeof field.required === 'function' ? field.required(values) : field.required;
    if (field.kind === 'toggle') return required && value !== true ? (field.validate?.(value, values) || 'Required') : '';
    const multi = ['chips', 'list', 'tags', 'assets'].includes(field.kind);
    const items = multi ? list(value) : [];
    if (required && (multi ? !items.length : !text(value))) return field.minItems > 1 ? `Add at least ${field.minItems}` : 'Needed for Mojo QA';
    if (multi && field.minItems && items.length && items.length < field.minItems) return `Add at least ${field.minItems}`;
    if (multi && field.maxItems && items.length > field.maxItems) return `Use ${field.maxItems} or fewer`;
    if (multi && field.itemMax) { const long = items.filter(item => item.length > field.itemMax); if (long.length) return `${long.length} over ${field.itemMax} characters`; }
    if (!multi && field.max && text(value).length > field.max) return `${text(value).length - field.max} characters over the ${field.max} limit`;
    return field.validate ? field.validate(value, values) || '' : '';
  }

  /* Every issue for a draft on its platform. The editor shows all of them;
     QA on the Build list uses the platform-only ones (core fields are checked there already). */
  function issues(draft, facts, values) {
    const platform = forChannel(draft.buildChannel || draft.buildSetup?.channels || (draft.channels || [])[0]);
    if (!platform) return [];
    const resolved = values || valuesFor(platform, draft, facts);
    const seen = new Set();
    return fields(platform).map(field => ({field, message: fieldIssue(field, resolved[field.key], resolved)}))
      .filter(({field, message}) => message && !seen.has(field.key) && seen.add(field.key))
      .map(({field, message}) => {
        const value = resolved[field.key];
        const empty = Array.isArray(value) ? !value.length : field.kind === 'toggle' ? value !== true : !text(value);
        return {key: field.key, label: field.label, section: field.section, core: isCore(field.key), empty, message};
      });
  }

  window.MojoAdPlatforms = {register, all, get, forChannel, fields, valuesFor, issues, fieldIssue, isCore, core, use, assetLibrary, helpers: {text, list, trimTo, isUrl, roleGuess, urlPath, join, spendMath}};

  const trackingSummary = (v, h) => `Tagged ${h.b(v.tracking || 'with no tracking yet')}. ${v.conversion ? `Counts ${h.b(v.conversion)} as success.` : 'No conversion event yet.'}`;

  /* ───────────────────────── LinkedIn Ads ───────────────────────── */
  register({
    id: 'linkedin',
    name: 'LinkedIn Ads',
    match: /LinkedIn/i,
    logo: 'assets/linkedin.png',
    structure: ['Campaign group', 'Campaign', 'Ad'],
    structureValues: (draft, values, ctx) => [ctx.initiative, ctx.title, `${values.li_format} ad`],
    sections: [
      {id: 'setup', title: 'Campaign settings', description: 'How LinkedIn optimizes delivery.', summary: (v, h) => `Optimizing for ${h.b(v.li_objective.toLowerCase())} with a ${h.b(v.li_format.toLowerCase())} ad.`, fields: [
        {key: 'li_objective', label: 'Objective', kind: 'select', required: true, options: ['Brand awareness', 'Website visits', 'Engagement', 'Lead generation', 'Website conversions'], default: 'Website visits', why: 'The goal is evaluation meetings, so Mojo optimizes for visits to the proof page and lets the CRM count meetings.'},
        {key: 'li_format', label: 'Ad format', kind: 'select', required: true, options: ['Single image', 'Carousel', 'Document', 'Video'], default: 'Single image', why: 'Single image has the most finished assets for this concept.'}
      ]},
      {id: 'audience', title: 'Audience', description: 'Who sees the ad inside the matched accounts.', summary: (v, h) => `${h.b(h.join(v.li_seniority) || 'Any seniority')} in ${h.b(h.join(v.li_functions) || 'any function')} at ${h.b(v.audience || 'no account list yet')}.${v.li_expansion ? ' Audience expansion is on.' : ''}`, fields: [
        use(core.audience, {label: 'Company list'}),
        {key: 'li_functions', label: 'Job functions', kind: 'chips', required: true, minItems: 1, options: ['Finance', 'Information Technology', 'Operations', 'Marketing', 'Sales', 'Engineering'], default: ({facts}) => roleGuess(facts.audience), why: 'Matched to the buyer roles missing from these accounts.'},
        {key: 'li_seniority', label: 'Seniority', kind: 'chips', required: true, minItems: 1, options: ['Manager', 'Director', 'VP', 'CXO'], default: ['Director', 'VP', 'CXO'], why: 'Finance and security sign-off usually sits at director level and above.'},
        {key: 'li_expansion', label: 'Audience expansion', kind: 'toggle', default: false, help: 'Off keeps delivery inside your company list.'}
      ]},
      {id: 'ad', title: 'Ad', description: 'What buyers see in their feed.', summary: (v, h) => `“${h.escape(v.li_headline || 'No headline yet')}” with ${h.b(v.li_cta)}, linking to ${v.landing ? h.b(h.host(v.landing) + (h.path(v.landing) || '')) : h.b('no landing page yet')}.`, fields: [
        use(core.creative),
        use(core.assets, {label: 'Image', maxItems: 1, showIf: v => v.li_format !== 'Carousel', help: 'Single image ads use one asset.'}),
        use(core.assets, {label: 'Carousel cards', minItems: 2, maxItems: 10, showIf: v => v.li_format === 'Carousel', help: 'Use 2 to 10 cards.'}),
        {key: 'li_intro', label: 'Introductory text', kind: 'textarea', required: true, recommend: 150, max: 600, default: ({facts}) => trimTo(facts.messaging, 150)},
        {key: 'li_headline', label: 'Headline', kind: 'text', required: true, recommend: 70, max: 200, default: ({facts}) => trimTo(facts.creative || facts.messaging, 70)},
        {key: 'li_cta', label: 'Call to action', kind: 'select', required: true, options: ['Learn more', 'Download', 'Request demo', 'Register', 'Sign up'], default: 'Learn more'},
        use(core.landing),
        use(core.messaging, {label: 'Core message', help: 'The LinkedIn copy above starts from this.'})
      ]},
      {id: 'budget', title: 'Budget and schedule', description: '', summary: (v, h) => `${h.b(v.budget || 'No budget')} over ${h.b(v.flight || 'no flight yet')}${h.spend(v) ? `, ${h.spend(v)}` : ''}. ${h.escape(v.li_bid)}.`, fields: [
        use(core.budget),
        use(core.flight),
        {key: 'li_bid', label: 'Bid strategy', kind: 'select', required: true, options: ['Maximum delivery', 'Cost cap', 'Manual bidding'], default: 'Maximum delivery', why: 'Spends the full budget on a small account list. Switch to a cost cap once there are two weeks of data.'},
        {key: 'li_costcap', label: 'Cost cap per result', kind: 'money', required: v => v.li_bid === 'Cost cap', showIf: v => v.li_bid === 'Cost cap'},
        use(core.budgetApproved)
      ]},
      {id: 'tracking', title: 'Tracking and measurement', description: 'How Report connects delivery to pipeline.', summary: trackingSummary, fields: [
        use(core.tracking),
        use(core.conversion, {label: 'Conversion (Insight Tag)'}),
        use(core.validation)
      ]}
    ],
    context: 'LinkedIn feed',
    preview: (values, h) => `
      <div class="mce-ctx mce-ctx-feed">
        <div class="mce-sk-post" aria-hidden="true"><span class="mce-sk mce-sk-avatar"></span><span class="mce-sk" style="width:46%"></span></div>
        <article class="mce-li">
          <div class="mce-li-head"><span class="mce-li-avatar">A</span><div><strong>Acme Co</strong><small>4,812 followers</small><small>Promoted</small></div></div>
          <p class="mce-li-intro" data-edit-field="li_intro">${h.escape(values.li_intro) || '<span class="mce-muted">Introductory text</span>'}</p>
          ${values.li_format === 'Carousel'
            ? `<div class="mce-li-carousel" data-edit-field="assets">${(h.assets(values).length ? h.assets(values) : [null, null]).slice(0, 3).map(src => src ? `<img src="${src}" alt="">` : '<span class="mce-asset-empty"></span>').join('')}</div>`
            : h.assets(values)[0] ? `<img class="mce-li-image" data-edit-field="assets" src="${h.assets(values)[0]}" alt="">` : '<span class="mce-asset-empty mce-li-image" data-edit-field="assets"></span>'}
          <div class="mce-li-foot"><div><strong data-edit-field="li_headline">${h.escape(values.li_headline) || 'Headline'}</strong><small data-edit-field="landing">${h.escape(h.host(values.landing)) || '<span class="mce-missing">Add landing page</span>'}</small></div><span class="mce-li-cta" data-edit-field="li_cta">${h.escape(values.li_cta)}</span></div>
          <div class="mce-li-actions" aria-hidden="true"><span>Like</span><span>Comment</span><span>Repost</span><span>Send</span></div>
        </article>
      </div>`
  });

  /* ───────────────────────── Google Ads ───────────────────────── */
  const googleHeadlines = ({facts}) => {
    const candidates = [trimTo(facts.creative, 30), 'Acme for Buying Groups', 'See How Acme Compares', 'Book an Evaluation Call', 'Proof for Every Buyer Role'];
    return [...new Set(candidates.filter(item => item && item.length <= 30))].slice(0, 5);
  };
  register({
    id: 'google',
    name: 'Google Ads',
    match: /Google|Search/i,
    logo: 'assets/google-ads.svg',
    structure: ['Campaign', 'Ad group', 'Responsive search ad'],
    structureValues: (draft, values, ctx) => [ctx.title, list(values.keywords)[0] ? `“${list(values.keywords)[0]}” ad group` : 'Ad group', `${list(values.g_headlines).length} headlines · ${list(values.g_descriptions).length} descriptions`],
    sections: [
      {id: 'setup', title: 'Campaign settings', description: 'Search campaigns show when buyers search your keywords.', summary: (v, h) => `${h.b(v.g_type)} campaign, bidding to ${h.b(v.g_bidding.toLowerCase())}${v.g_bidding === 'Target CPA' && v.g_cpa ? ` at ${h.b(v.g_cpa)}` : ''}.`, fields: [
        {key: 'g_type', label: 'Campaign type', kind: 'select', required: true, options: ['Search', 'Performance Max', 'Display'], default: 'Search'},
        {key: 'g_bidding', label: 'Bidding', kind: 'select', required: true, options: ['Maximize conversions', 'Target CPA', 'Maximize clicks', 'Manual CPC'], default: 'Maximize conversions', why: 'The conversion action is already tracked, so Google can bid toward evaluation meetings.'},
        {key: 'g_cpa', label: 'Target cost per conversion', kind: 'money', required: v => v.g_bidding === 'Target CPA', showIf: v => v.g_bidding === 'Target CPA'}
      ]},
      {id: 'audience', title: 'Keywords and audience', description: 'Intent signals that decide when the ad can show.', summary: (v, h) => { const k = list(v.keywords); return `${h.b(k.length + ' ' + (k.length === 1 ? 'keyword' : 'keywords'))} on ${h.b(v.g_match.toLowerCase())} match${k.length ? ` (${h.escape(k.slice(0, 2).map(x => '“' + x + '”').join(', '))}${k.length > 2 ? '…' : ''})` : ''}, excluding ${h.b(list(v.g_negatives).length)}. Bids up for ${h.b(v.audience || 'no account list yet')}.`; }, fields: [
        use(core.audience, {label: 'Customer match accounts', help: 'Mojo raises bids for these accounts when they search.'}),
        {key: 'keywords', label: 'Keywords', kind: 'tags', required: true, minItems: 1, maxItems: 20, itemMax: 80, placeholder: 'Add a keyword and press Enter', default: ['vendor comparison', 'evaluation proof'], why: 'Pulled from the intent topics these accounts are researching.'},
        {key: 'g_match', label: 'Match type', kind: 'select', required: true, options: ['Broad', 'Phrase', 'Exact'], default: 'Phrase', why: 'Phrase match keeps spend on evaluation searches without missing close variants.'},
        {key: 'g_negatives', label: 'Negative keywords', kind: 'tags', placeholder: 'Add a keyword to exclude', default: ['free', 'jobs', 'careers']}
      ]},
      {id: 'ad', title: 'Responsive search ad', description: 'Google mixes headlines and descriptions to find the best combination.', summary: (v, h) => `${h.b(list(v.g_headlines).length + ' headlines')} and ${h.b(list(v.g_descriptions).length + ' descriptions')}, linking to ${v.landing ? h.b(h.host(v.landing) + (h.path(v.landing) || '')) : h.b('no final URL yet')}.`, fields: [
        {key: 'g_headlines', label: 'Headlines', kind: 'list', required: true, minItems: 3, maxItems: 15, itemMax: 30, help: '3 to 15 headlines, 30 characters each.', default: googleHeadlines, why: 'Written from the creative concept and the plan’s message.'},
        {key: 'g_descriptions', label: 'Descriptions', kind: 'list', required: true, minItems: 2, maxItems: 4, itemMax: 90, help: '2 to 4 descriptions, 90 characters each.', default: ({facts}) => [trimTo(facts.messaging, 90) || 'See the proof finance and security teams ask for.', 'Compare vendors with real customer results. Book a 30-minute evaluation.'].filter(Boolean)},
        use(core.landing, {label: 'Final URL'}),
        {key: 'g_path1', label: 'Display path 1', kind: 'text', max: 15, default: ({facts}) => { const segment = urlPath(facts.landing)[0] || 'solutions'; return segment.length <= 15 ? segment : trimTo(segment.split('-')[0], 15); }},
        {key: 'g_path2', label: 'Display path 2', kind: 'text', max: 15, default: ''},
        use(core.creative, {label: 'Creative concept', help: 'The name used on every platform and in Report.'}),
        use(core.messaging)
      ]},
      {id: 'budget', title: 'Budget and schedule', description: '', summary: (v, h) => `${h.b(v.budget || 'No budget')} over ${h.b(v.flight || 'no flight yet')}${h.spend(v) ? `, ${h.spend(v)}` : ''}.`, fields: [
        use(core.budget),
        use(core.flight),
        use(core.budgetApproved)
      ]},
      {id: 'tracking', title: 'Tracking and measurement', description: 'How Report connects clicks to pipeline.', summary: trackingSummary, fields: [
        use(core.tracking, {label: 'Final URL suffix'}),
        use(core.conversion, {label: 'Conversion action'}),
        use(core.validation)
      ]}
    ],
    context: 'Google search',
    preview: (values, h) => {
      const heads = list(values.g_headlines).slice(0, 3);
      const path = [h.host(values.landing) || 'acme.com', values.g_path1, values.g_path2].map(text).filter(Boolean).join(' › ');
      const query = list(values.keywords)[0] || 'vendor comparison';
      return `
      <div class="mce-ctx mce-ctx-search">
        <div class="mce-g-bar" data-edit-field="keywords"><svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="9" cy="9" r="5.5"/><path d="m13.5 13.5 3.5 3.5"/></svg><span>${h.escape(query)}</span></div>
        <div class="mce-g">
          <small class="mce-g-sponsored">Sponsored</small>
          <div class="mce-g-site"><span class="mce-g-favicon">A</span><div><strong>Acme Co</strong><small data-edit-field="landing">${h.escape(path)}</small></div></div>
          <p class="mce-g-title" data-edit-field="g_headlines">${heads.length ? heads.map(h.escape).join(' | ') : '<span class="mce-muted">Headline 1 | Headline 2 | Headline 3</span>'}</p>
          <p class="mce-g-desc" data-edit-field="g_descriptions">${h.escape(list(values.g_descriptions)[0] || '')}</p>
        </div>
        <div class="mce-sk-result" aria-hidden="true"><span class="mce-sk" style="width:38%"></span><span class="mce-sk mce-sk-link" style="width:72%"></span><span class="mce-sk" style="width:92%"></span><span class="mce-sk" style="width:64%"></span></div>
      </div>`;
    }
  });

  /* ───────────────────────── Demandbase Ads ───────────────────────── */
  const sizes = ['300×250', '728×90', '160×600', '320×50', '300×600'];
  register({
    id: 'demandbase',
    name: 'Demandbase Ads',
    match: /Demandbase/i,
    logo: 'assets/demandbase.png',
    structure: ['Campaign', 'Account list', 'Creatives'],
    structureValues: (draft, values, ctx) => [ctx.title, values.audience || 'Account list', `${list(values.db_sizes).length} sizes`],
    sections: [
      {id: 'audience', title: 'Accounts', description: 'Ads serve only to people at these accounts.', summary: (v, h) => `${h.b(v.audience || 'No account list yet')} on ${h.b(h.join(v.db_inventory).toLowerCase() || 'no inventory')}, capped at ${h.b(v.db_freq.toLowerCase())}.`, fields: [
        use(core.audience, {label: 'Account list'}),
        {key: 'db_inventory', label: 'Inventory', kind: 'chips', required: true, minItems: 1, options: ['Display', 'Native', 'Video', 'CTV'], default: ['Display']},
        {key: 'db_freq', label: 'Frequency cap', kind: 'select', required: true, options: ['2 per person per day', '3 per person per day', '5 per person per week', 'No cap'], default: '3 per person per day', why: 'Your Best Practices cap account-based display at 3 a day to avoid fatigue.'}
      ]},
      {id: 'ad', title: 'Creatives', description: 'Mojo resizes the concept for each placement.', summary: (v, h) => `${h.b(list(v.assets).length + ' ' + (list(v.assets).length === 1 ? 'asset' : 'assets'))} in ${h.b(list(v.db_sizes).length + ' sizes')}, linking to ${v.landing ? h.b(h.host(v.landing) + (h.path(v.landing) || '')) : h.b('no URL yet')}.`, fields: [
        use(core.creative),
        use(core.assets, {label: 'Creative assets', maxItems: 3}),
        {key: 'db_sizes', label: 'Ad sizes', kind: 'chips', required: true, minItems: 1, options: sizes, default: sizes.slice(0, 3)},
        use(core.landing, {label: 'Click-through URL'}),
        use(core.messaging)
      ]},
      {id: 'budget', title: 'Budget and pacing', description: '', summary: (v, h) => `${h.b(v.budget || 'No budget')} over ${h.b(v.flight || 'no flight yet')}${h.spend(v) ? `, ${h.spend(v)}` : ''}. ${h.escape(v.db_pacing)} pacing, max ${h.escape(v.db_cpm)} CPM.`, fields: [
        use(core.budget),
        use(core.flight),
        {key: 'db_pacing', label: 'Pacing', kind: 'select', required: true, options: ['Even', 'Front-loaded', 'As fast as possible'], default: 'Even'},
        {key: 'db_cpm', label: 'Max CPM', kind: 'money', required: true, default: '$18'},
        use(core.budgetApproved)
      ]},
      {id: 'tracking', title: 'Tracking and measurement', description: 'How Report connects impressions to account engagement.', summary: trackingSummary, fields: [
        use(core.tracking),
        use(core.conversion),
        use(core.validation)
      ]}
    ],
    context: 'Publisher page',
    preview: (values, h) => {
      const srcs = h.assets(values), sizes = list(values.db_sizes);
      const ad = (size, src) => `<figure class="mce-db-ad" data-size="${size}" data-edit-field="assets">${src ? `<img src="${src}" alt="">` : '<span class="mce-asset-empty"></span>'}<figcaption>Ad · ${size}</figcaption></figure>`;
      const lines = n => Array.from({length: n}, (_, i) => `<span class="mce-sk" style="width:${[96, 88, 92, 70, 84, 60][i % 6]}%"></span>`).join('');
      return `
      <div class="mce-ctx mce-ctx-page">
        <div class="mce-db-page-bar" aria-hidden="true"><span class="mce-sk" style="width:22%"></span><span class="mce-sk" style="width:34%"></span></div>
        ${sizes.includes('728×90') ? ad('728×90', srcs[0]) : ''}
        <div class="mce-db-page-body">
          <div class="mce-db-article" aria-hidden="true"><span class="mce-sk mce-sk-title"></span>${lines(6)}</div>
          ${sizes.includes('300×250') ? ad('300×250', srcs[1] || srcs[0]) : sizes.includes('160×600') ? ad('160×600', srcs[1] || srcs[0]) : ''}
        </div>
        <p class="mce-db-sizes" data-edit-field="db_sizes">${sizes.length} ${sizes.length === 1 ? 'size' : 'sizes'}: ${h.escape(sizes.join(', ') || 'none yet')}</p>
      </div>`;
    }
  });
})();
