/* Command-first demo. All actions stay in this browser; no ad or CRM write occurs. */
document.addEventListener('DOMContentLoaded', () => {
  const last = location.pathname.split('/').pop() || 'HomeSystem.html';
  const page = last.includes('.') ? last : `${last}.html`;
  const main = document.querySelector('main.canvaspane');
  setupNavigation(page);
  if (!main) return;
  if (page === 'Strategy.html') setupStrategy(main);
  setupChat(main);
});

function setupNavigation(page) {
  const shareIcon = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="18" cy="5" r="2.6"/><circle cx="6" cy="12" r="2.6"/><circle cx="18" cy="19" r="2.6"/><path d="m8.3 10.8 7.4-4.3M8.3 13.2l7.4 4.3"/></svg>';
  const chatIcon = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M21 11.5a8.5 8.5 0 0 1-12.3 7.6L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5Z"/></svg>';
  const canvasIcon = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>';
  const trustTopbar = document.querySelector('.trust-topbar');
  if (trustTopbar) trustTopbar.innerHTML = `<span class="wtitle">${page === 'Routines.html' ? 'Routines' : 'Mojo Ad Campaigns'}</span><div class="mc-topbar-actions"><button type="button" class="mc-pane-toggle" id="mc-trust-chat-toggle" aria-expanded="false">${chatIcon}Chat</button><span class="trust-canvas-pill" aria-current="page">${canvasIcon}Canvas</span><span class="mc-sidebar-label" aria-disabled="true"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M15 3v18"/></svg>Sidebar</span><button type="button" class="btn outline mc-share-button" id="mc-share" aria-label="Copy page link">${shareIcon}Share</button></div>`;
  document.querySelectorAll('.topbar .btn.outline').forEach(button => {
    if (button.textContent.trim() !== 'Share' || button.querySelector('svg')) return;
    button.classList.add('mc-share-button');
    button.insertAdjacentHTML('afterbegin', shareIcon);
  });
  trustTopbar?.querySelector('#mc-share')?.addEventListener('click', async event => {
    try { await navigator.clipboard.writeText(location.href); event.target.textContent = 'Link copied'; }
    catch { event.target.textContent = 'Use the address bar'; }
  });
  const trustRail = document.querySelector('.trust-rail');
  if (trustRail) trustRail.innerHTML = `<a href="HomeSystem.html" aria-label="Brief" title="Brief"><svg viewBox="0 0 24 24"><path d="M3 11l9-8 9 8v9H3z"/></svg></a><a href="Work.html" aria-label="Work" title="Work"><svg viewBox="0 0 24 24"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/></svg></a><a href="Portfolio.html" aria-label="Campaigns" title="Campaigns"><svg viewBox="0 0 24 24"><path d="M4 4h16v16H4zM4 10h16M10 10v10"/></svg></a><a href="HomeSystem.html" class="on" aria-label="Canvas" title="Canvas">${canvasIcon}</a><button type="button" class="mc-rail-chat" aria-label="Chat" title="Chat">${chatIcon}</button><span class="trust-rail-spacer"></span><a class="mojo-settings-link${page === 'Settings.html' ? ' on' : ''}" href="Settings.html" title="Settings and rules" aria-label="Settings"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"/></svg></a><span class="trust-avatar" aria-label="Your profile">S</span>`;
  trustRail?.querySelector('.mc-rail-chat')?.addEventListener('click', () => document.querySelector('#mc-trust-chat-toggle')?.click());
}

function commandKind(value) {
  const text = value.toLowerCase();
  if (/saved view|my view|pinned view/.test(text)) return 'views';
  if (/bulk|launch|create|template|market/.test(text)) return 'bulk';
  if (/creative|copy|message|positioning|ad text/.test(text)) return 'creative';
  if (/audience|account|segment|surge|sales|sdr/.test(text)) return 'accounts';
  if (/trust|tracking|tag|conversion|cpa|lead definition/.test(text)) return 'trust';
  if (/exec|board|export|report|cmo|strategy/.test(text)) return 'exec';
  if (/pace|pacing|quarter|q3|q4|plan/.test(text)) return 'pacing';
  if (/budget|realloc|shift|move|spend|\$40k|40k go/.test(text)) return 'budget';
  return 'help';
}

function setupChat(main) {
  const panes = main.parentElement;
  let chat = panes.querySelector('.chatpane');
  if (!chat) {
    chat = document.createElement('aside'); chat.className = 'chatpane mc-trust-chat';
    chat.innerHTML = `<div class="chathead"><strong>Chat <span aria-hidden="true">⌄</span></strong></div><div class="chatbody"></div><div class="chatfoot"><div class="composer"><textarea rows="2" placeholder="Ask Mojo…" aria-label="Ask Mojo"></textarea><div class="mc-chat-composer-tools" aria-label="Chat settings"><span>Balanced <span aria-hidden="true">⌄</span></span><span>♢ Guarded <span aria-hidden="true">⌄</span></span><span aria-hidden="true">＋</span></div></div></div>`;
    panes.prepend(chat);
    const toggle = document.querySelector('#mc-trust-chat-toggle');
    toggle?.addEventListener('click', () => {
      const open = chat.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.classList.toggle('is-active', open);
    });
  }
  const body = chat.querySelector('.chatbody');
  const prompts = document.createElement('div'); prompts.className = 'mc-chat-prompts';
  prompts.innerHTML = `<p>Try a question</p><button data-command="budget">Review the three ended flights</button><button data-command="pacing">Check campaign pacing</button><button data-command="exec">Draft a leadership update</button>`;
  if (!location.pathname.includes('HomeSystem')) body.append(prompts);
  const source = document.createElement('div'); source.className = 'mc-original-content';
  while (main.firstChild) source.append(main.firstChild);
  const workspace = document.createElement('section'); workspace.className = 'mojo-command mc-workspace'; workspace.hidden = true;
  workspace.innerHTML = `<div class="mc-section-head"><div><h1>Here is the work.</h1></div><button type="button" class="mc-btn" id="mc-back-canvas">Back to ${document.querySelector('.modulenav a.on')?.textContent || 'Canvas'}</button></div><div class="mc-result" id="mc-result" aria-live="polite" tabindex="-1"></div>`;
  main.append(source, workspace);
  const result = workspace.querySelector('#mc-result');
  const query = chat.querySelector('.chatfoot textarea');
  let send = chat.querySelector('.chat-polish-send');
  if (!send) {
    send = document.createElement('button'); send.type = 'button'; send.className = 'chat-polish-send';
    send.setAttribute('aria-label', 'Send message'); send.textContent = '↑';
    chat.querySelector('.chatfoot .composer').append(send);
    const update = () => { send.disabled = !query.value.trim(); };
    send.addEventListener('click', () => {
      const prompt = query.value.trim(); if (!prompt) return;
      const message = document.createElement('div'); message.className = 'chat-polish-user';
      message.append(document.createTextNode(prompt)); body.append(message);
      document.dispatchEvent(new CustomEvent('mojo:chat-sent', { detail: { prompt } }));
      query.value = ''; update();
    });
    query.addEventListener('input', update);
    query.addEventListener('keydown', event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); send.click(); } });
    update();
  }
  const show = (kind) => {
    renderCommand(kind, result);
    if (['budget','pacing','accounts','bulk','creative','trust','exec'].includes(kind)) {
      const save = document.createElement('div'); save.className = 'mc-save-row';
      save.innerHTML = '<button type="button" class="mc-btn" id="mc-save-view">Save to My views</button><span role="status"></span>';
      result.append(save);
      save.querySelector('button').addEventListener('click', event => {
        let views = []; try { views = JSON.parse(localStorage.getItem('mojo-command-views-v1') || '[]'); } catch {}
        if (!Array.isArray(views)) views = [];
        if (!views.includes(kind)) views.push(kind);
        localStorage.setItem('mojo-command-views-v1', JSON.stringify(views));
        event.target.disabled = true; save.querySelector('span').textContent = 'Saved in this browser.';
      });
    }
    source.hidden = true; workspace.hidden = false;
    history.replaceState(null, '', `#${kind}`);
    result.focus({ preventScroll: true }); main.scrollTo({ top: 0, behavior: 'smooth' });
  };
  prompts.addEventListener('click', event => {
    const button = event.target.closest('[data-command]');
    if (!button) return;
    query.value = button.textContent; query.dispatchEvent(new Event('input', { bubbles: true })); send.click();
  });
  document.addEventListener('mojo:chat-sent', event => {
    if (document.documentElement.dataset.mojoSequence === 'true') return;
    const kind = commandKind(event.detail?.prompt || '');
    show(kind);
    prompts.hidden = true;
    const answer = document.createElement('div'); answer.className = 'bubble mc-chat-ack';
    const text = document.createElement('p');
    text.textContent = kind === 'help' ? 'Ask about spend, pacing, accounts, or campaign results.' : 'I opened the related workspace in Canvas. You can review the sample evidence there.';
    answer.append(text);
    body.append(answer); body.scrollTop = body.scrollHeight;
  });
  workspace.addEventListener('click', event => {
    const button = event.target.closest('[data-command]');
    if (button) show(button.dataset.command);
  });
  workspace.querySelector('#mc-back-canvas').addEventListener('click', () => {
    workspace.hidden = true; source.hidden = false;
    history.replaceState(null, '', location.pathname + location.search);
  });
  const initial = location.hash.slice(1);
  if (['HomeSystem.html','index.html'].includes(location.pathname.split('/').pop()) && ['budget','pacing','accounts','bulk','creative','trust','exec','views'].includes(initial)) {
    if (document.getElementById('chatOn')) document.getElementById('chatOn').checked = true;
    else document.querySelector('#mc-trust-chat-toggle')?.click();
    show(initial);
  }
}

function renderCommand(kind, result) {
  if (kind === 'views') {
    let views = []; try { views = JSON.parse(localStorage.getItem('mojo-command-views-v1') || '[]'); } catch {}
    const labels = {budget:'Budget options',pacing:'Pacing audit',accounts:'Account targeting',bulk:'Bulk campaign creation',creative:'Creative review',trust:'Data trust',exec:'Executive readout'};
    result.innerHTML = `<h2>Your saved workspaces</h2><p class="mc-result-intro">Saved in this browser for the demo. Select a view to bring its workspace back into Mojo Command.</p><div class="mc-view-list"></div>`;
    const list = result.querySelector('.mc-view-list');
    for (const kind of Array.isArray(views) ? views : []) if (labels[kind]) { const button = document.createElement('button'); button.className = 'mc-btn'; button.dataset.command = kind; button.textContent = `${labels[kind]} →`; list.append(button); }
    if (!list.childElementCount) list.textContent = 'No views saved yet. Open a workspace and choose “Save to My views.”';
    return;
  }
  if (kind === 'pacing') return renderPacing(result);
  if (kind === 'bulk') return renderBulk(result);
  if (kind === 'creative') return renderCreative(result);
  if (kind === 'accounts') return renderAccounts(result);
  if (kind === 'home') {
    result.innerHTML = `<div class="mc-focus"><h2>The first decision: where should the next $30k go?</h2><p>Three example flights ended with about $46k still allocated. Remaining budget is not lost value. Compare the next dollar against the stronger Demandbase program before extending anything.</p><button class="mc-btn primary" data-command="budget">Open the $30k decision →</button></div>
      <div class="mc-status-strip"><span><b>2</b> open data-trust checks</span><span><b>1,088</b> surging accounts not reached</span></div>
      <div class="mc-grid"><article class="mc-tile"><h3>Trust the metric first</h3><p>Duplicate g2_ events and an undefined lead can distort cost-per-conversion.</p><button class="mc-btn" data-command="trust">Check data trust →</button></article><article class="mc-tile"><h3>Hand accounts to sales</h3><p>See the surging accounts outside live campaigns and stage an owner handoff.</p><button class="mc-btn" data-command="accounts">Open account gap</button></article><article class="mc-tile"><h3>Launch once, adapt by channel</h3><p>Preview a 30-market campaign template across Google, LinkedIn and Meta.</p><button class="mc-btn" data-command="bulk">Preview bulk creation</button></article></div><p class="mc-note">Source-backed counts come from the supplied campaign and Demandbase snapshots. Pipeline scenarios and named account examples are labeled when shown. No live account change is made here.</p>`;
    return;
  }
  if (kind === 'budget') {
    result.innerHTML = `<h2>Where should the next $30k go after the Oct 31 flight end?</h2><p class="mc-result-intro">Compare three uses of the next $30k. The pipeline rates below are synthetic demo assumptions; tracking is still under review, so confidence for a live move is low.</p>
      <div class="mc-status-strip"><span><b>Q3 ENT TAL Display</b> 2 demo open opps · $3.2k pipeline / $1k</span><span><b>Proposed demand gen</b> synthetic case · $5.5k / $1k</span><span><b>Confidence</b> low · 30-day illustrative sample</span></div>
      <div class="mc-option-list" role="radiogroup" aria-label="Budget options"><label class="mc-option"><span><input type="radio" name="mc-budget" value="extend"> <strong>Extend ending flights</strong></span><em>$96k</em><small>Modeled 90-day influenced pipeline if the current rate holds.</small></label><label class="mc-option"><span><input type="radio" name="mc-budget" value="shift"> <strong>Shift $30k to a proposed demand gen campaign</strong></span><em>$165k</em><small>Modeled 90-day influenced pipeline; $69k above extension.</small></label><label class="mc-option"><span><input type="radio" name="mc-budget" value="release"> <strong>Release to Q1</strong></span><em>Unknown</em><small>Preserves the budget. Q1 return is not modeled.</small></label></div>
      <p class="mc-note"><b>Do nothing:</b> the flights end and $30k stays uncommitted; this is not a $30k loss. Source-backed: three ended example flights and $45,920 remaining. Opportunity counts and projected pipeline are illustrative.</p>
      <button class="mc-btn primary" id="mc-review-budget" disabled>Open the $30k decision →</button><div id="mc-budget-diff"></div>`;
    const review = result.querySelector('#mc-review-budget');
    let pendingChoice = null;
    try { pendingChoice = sessionStorage.getItem('mojo-budget-pending-choice-v1'); } catch {}
    if (['extend','shift','release'].includes(pendingChoice)) {
      const selected = result.querySelector(`input[name=mc-budget][value="${pendingChoice}"]`);
      if (selected) { selected.checked = true; review.disabled = false; }
    }
    result.querySelectorAll('input[name=mc-budget]').forEach(input => input.addEventListener('change', () => {
      review.disabled = false;
      try { sessionStorage.setItem('mojo-budget-pending-choice-v1', input.value); } catch {}
    }));
    review.addEventListener('click', () => {
      const choice = result.querySelector('input[name=mc-budget]:checked')?.value;
      const options = { extend: ['Ending flights', 'Extend to Nov 30', '$96k modeled'], shift: ['Ending flights', 'Shift $30k to a proposed demand gen campaign', '$165k modeled'], release: ['Ending flights', 'Move $30k to Q1 reserve', 'Unmodeled'] };
      const selected = options[choice];
      if (!selected) return;
      const diff = result.querySelector('#mc-budget-diff');
      diff.innerHTML = `<div class="mc-section"><h2>Review before applying (demo)</h2><table class="mc-table"><thead><tr><th>Before</th><th>After</th><th>Pipeline case</th></tr></thead><tbody><tr><td>${selected[0]}</td><td>${selected[1]}</td><td>${selected[2]}</td></tr></tbody></table><p class="mc-note">This prototype records a local decision only. It does not update Google Ads. A live move over $10k would require demand gen and finance approval.</p><button class="mc-btn primary" id="mc-apply-budget">Record demo decision</button><p class="mc-result-status" id="mc-budget-status" hidden role="status"></p></div>`;
      diff.querySelector('#mc-apply-budget').addEventListener('click', event => {
        localStorage.setItem('mojo-command-budget-v1', JSON.stringify({ choice, recordedAt: new Date().toISOString() }));
        event.target.disabled = true;
        const status = diff.querySelector('#mc-budget-status');
        status.hidden = false;
        status.textContent = 'Decision recorded in this browser. No ad platform was changed. Outcome check: day 14, 30 and 60.';
      });
    });
    return;
  }
  if (kind === 'pacing') {
    result.innerHTML = `<h2>Which flights need a decision?</h2><p class="mc-result-intro">Three example flights ended with 43–47% of their budgets spent. Check audience capacity, outcome quality and flight intent before extending or shifting budget.</p><table class="mc-table"><thead><tr><th>Campaign</th><th>Spent</th><th>Budget</th><th>Pacing</th></tr></thead><tbody><tr><td><strong>Q3 ENT TAL Display</strong></td><td>$11,480</td><td>$28,000</td><td>41%</td></tr><tr><td><strong>Q3 CTV ICP Roku</strong></td><td>$18,400</td><td>$40,000</td><td>46%</td></tr><tr><td><strong>Q3 Retargeting Pricing Page</strong></td><td>$7,200</td><td>$15,000</td><td>48%</td></tr></tbody></table><div class="mc-callout"><div><strong>What Mojo would check next</strong><p>Is delivery limited by audience size, bid, stale flight settings or tracking? Unspent budget alone is not a performance verdict.</p></div><button class="mc-btn" data-command="budget">Compare $30k options →</button></div><p class="mc-note">Source: supplied campaign reporting snapshot. Q4 fiscal plan and account-level marginal pipeline are not available from these rows.</p>`;
    return;
  }
  if (kind === 'accounts') {
    result.innerHTML = `<h2>Work the account queue.</h2><p class="mc-result-intro">Search, rank and select accounts, then stage an owner handoff or build a campaign from the exact selection.</p><a class="mc-btn primary" href="Work.html#handoffs">Open account queue →</a>`;
    return;
  }
  if (kind === 'trust') {
    result.innerHTML = `<h2>Two checks block a clean CPA read.</h2><p class="mc-result-intro">Duplicate g2_ events and an undefined “lead” can distort platform conversion CPA. The click-to-visit gap also needs a tag check before it is called a creative problem.</p><div class="mc-grid"><article class="mc-tile"><h3>Deduplicate g2_</h3><p>Stage a tracking review before using conversion volume to move spend.</p></article><article class="mc-tile"><h3>Define a lead</h3><p>Choose SQL or opportunity, then align the platform and CRM mappings.</p></article><article class="mc-tile"><h3>Verify the tag</h3><p>Check landing-page tags and redirects when clicks fail to become recorded visits.</p></article></div><div class="mc-callout"><div><strong>Decision rule</strong><p>Until these checks pass, pipeline scenarios are illustrative and conversion CPA should not drive automatic reallocation.</p></div><a class="mc-btn" href="HomeSystem.html#finding-duplicate-events">Check data trust →</a></div>`;
    return;
  }
  if (kind === 'creative') {
    result.innerHTML = `<h2>Check copy before it goes live.</h2><p class="mc-result-intro">Edit the draft here. The rule below is an illustrative approved-message sample; no positioning document is connected.</p><div class="mc-callout"><div><strong>Example positioning rule</strong><p>Talk about account coverage, pipeline visibility and buying-group context. Avoid unsupported guarantees or “cheap clicks” as the primary promise.</p></div></div><div class="mc-form"><label for="mc-copy">Draft ad copy<textarea id="mc-copy">Reach the right buying group and see which accounts are moving toward pipeline.</textarea></label><div><button class="mc-btn primary" id="mc-check-copy">Check message</button></div></div><div id="mc-copy-feedback" role="status"></div>`;
    result.querySelector('#mc-check-copy').addEventListener('click', () => {
      const copy = result.querySelector('#mc-copy').value.trim();
      const feedback = result.querySelector('#mc-copy-feedback');
      if (!copy) { feedback.textContent = 'Add draft copy to check.'; return; }
      const warnings = [];
      if (/guarantee|guaranteed|instant|zero risk/i.test(copy)) warnings.push('Remove unsupported certainty claims.');
      if (/cheap clicks|low cpc/i.test(copy)) warnings.push('Lead with account and pipeline outcomes, not click price.');
      if (!/account|pipeline|buying group|opportunit/i.test(copy)) warnings.push('Connect the promise to account coverage or pipeline visibility.');
      feedback.innerHTML = `<div class="mc-callout"><div><strong>${warnings.length ? 'Review before launch' : 'Aligned with the example rule'}</strong><p></p></div></div>`;
      feedback.querySelector('p').textContent = warnings.length ? warnings.join(' ') : 'No conflict found by this simple local check. A real approval still needs your positioning documents and human review.';
    });
    return;
  }
  if (kind === 'bulk') {
    result.innerHTML = `<h2>Launch once. Adapt for each channel.</h2><p class="mc-result-intro">One naming, audience and tracking template can create drafts for many markets. This wizard previews the work locally; no campaign is created in an ad platform.</p><div class="mc-form"><label for="mc-market-count">Markets<input id="mc-market-count" type="number" min="1" max="30" value="30"></label><div class="mc-checkboxes" role="group" aria-label="Platforms"><label><input type="checkbox" value="LinkedIn" checked> LinkedIn</label><label><input type="checkbox" value="Google Ads" checked> Google Ads</label><label><input type="checkbox" value="Meta Ads" checked> Meta Ads</label></div><label for="mc-template">Enforced structure<select id="mc-template"><option>Enterprise pipeline · Tier 1 accounts · Q4</option><option>Regional ABM · Tier 2 accounts · Q4</option></select></label><div><button class="mc-btn primary" id="mc-preview-bulk">Preview drafts →</button></div></div><div id="mc-bulk-preview"></div>`;
    result.querySelector('#mc-preview-bulk').addEventListener('click', () => {
      const count = Math.max(1, Math.min(30, Number(result.querySelector('#mc-market-count').value) || 1));
      result.querySelector('#mc-market-count').value = count;
      const channels = [...result.querySelectorAll('.mc-checkboxes input:checked')].map(input => input.value);
      const preview = result.querySelector('#mc-bulk-preview');
      if (!channels.length) { preview.textContent = 'Choose at least one platform.'; return; }
      const template = result.querySelector('#mc-template').value;
      const regional = template.startsWith('Regional');
      const program = regional ? 'Regional ABM' : 'Enterprise Pipeline';
      const tier = regional ? 'Tier 2' : 'Tier 1';
      const drafts = Array.from({ length: count }, (_, index) => String(index + 1).padStart(2, '0'))
        .flatMap(market => channels.map(platform => `Q4 · ${program} · Market ${market} · ${platform}`));
      const total = drafts.length;
      preview.innerHTML = `<div class="mc-section"><h2><span id="mc-draft-count"></span> campaign drafts — preview only, no live write</h2><p class="mc-result-intro">Mojo applies one structure to each market and adapts creative limits, tracking and audience fields per channel.</p><table class="mc-table"><thead><tr><th>Rule</th><th>Enforced across drafts</th></tr></thead><tbody><tr><td>Campaign name</td><td id="mc-preview-name"></td></tr><tr><td>Audience</td><td id="mc-preview-audience"></td></tr><tr><td>Tracking</td><td>UTM source, medium, campaign; lead mapping required</td></tr><tr><td>Approval</td><td>Demand gen lead; finance above $10k</td></tr></tbody></table><p class="mc-note">Channel mapping: LinkedIn matched audiences and lead forms · Google customer match and search ads · Meta custom audiences and primary text. These are demo rules, not connected platform templates.</p><p class="mc-note" id="mc-draft-example"></p><button class="mc-btn primary" id="mc-stage-bulk">Create local drafts</button><p class="mc-result-status" id="mc-bulk-status" hidden role="status"></p></div>`;
      preview.querySelector('#mc-draft-count').textContent = String(total);
      preview.querySelector('#mc-preview-name').textContent = `Q4 · ${program} · Market · Platform`;
      preview.querySelector('#mc-preview-audience').textContent = `${tier} account list; verify reach before launch`;
      preview.querySelector('#mc-draft-example').textContent = `Examples: ${drafts.slice(0, 3).join('  ·  ')}. ${count} markets × ${channels.length} platforms. These are preview names, not live campaigns.`;
      preview.querySelector('#mc-stage-bulk').addEventListener('click', event => {
        localStorage.setItem('mojo-command-bulk-v1', JSON.stringify({ markets: count, channels, template, drafts }));
        event.target.disabled = true;
        const status = preview.querySelector('#mc-bulk-status');
        status.hidden = false;
        status.textContent = window.MojoVoice.say('bulk',{count:total});
      });
    });
    return;
  }
  if (kind === 'exec') {
    result.innerHTML = `<h2>A board-safe story in one click.</h2><p class="mc-result-intro">Separate sample exports total $2.2M in campaign budgets, alongside a different $130.3M reached-account pipeline cohort. It does not show ad-generated pipeline.</p><div class="mc-callout"><div><strong>The narrative</strong><p>Our next growth move is to verify measurement, compare the next $40k by marginal pipeline, and route the surging account gap to owners. Under-spend is not a loss claim; pipeline lift requires a matched comparison.</p></div><button class="mc-btn primary" id="mc-export-exec">Download slide-ready summary · TXT ↓</button></div><p class="mc-note">Copy-ready for an executive slide deck: the decision, three moves and source limits.</p>`;
    result.querySelector('#mc-export-exec').addEventListener('click', downloadExec);
    return;
  }
  result.innerHTML = `<h2>Tell me the outcome you need.</h2><p class="mc-result-intro">This guided demo can surface budget options, pacing, accounts, data trust, creative checks, bulk creation and an executive update. Try one of the examples above.</p>`;
}

function executiveText() {
  return `Mojo — executive growth update\n\nWhere the money sits\n• $2,201,740 is the sum of budgets in separate sample exports, not reconciled portfolio spend.\n• Three ending search flights: $165,000 budget, $74,233 spent, $90,767 remaining at flight end.\n• Q1 flight group: $304,976 budget, 46% average pacing; 13 of 20 below 40%.\n• Engagement benchmark sample: $56,393 budget, 98.6% average pacing. These slices have different scopes and must not be added together.\n\nWhat is working\nOne campaign group cleared six engagement checks. Mojo repaired 6 malformed UTMs and mapped 16 stray tags, bringing about 2,500 sessions back into attribution. Neither establishes incremental pipeline.\n\nWhat needs intervention\nThree flights ended with unused budget; 13 Q1 flights are underpacing. Duplicate GA4 conversion events and an undefined lead weaken CPA. CRM outcomes are not connected, so ad-driven pipeline remains unproven.\n\nWhat to change this week\n1. Confirm GA4 events and one shared lead definition before scaling on CPA.\n2. Compare the next $40k across the ending flights, a proposed campaign and a Q1 reserve. The $128k and $220k pipeline cases are synthetic assumptions, not observed results.\n3. Validate the 1,140 surging accounts outside live campaigns in CRM before routing them to owners.\n\nSource and limits\nSupplied campaign, routine and Demandbase snapshots have different reporting windows. No causal lift, verified pipeline per dollar or live CRM write is claimed.`;
}

function downloadExec() {
  const file = new Blob([executiveText()], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'mojo-executive-update.txt';
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function wrapDetailedReport(main, label) {
  const detail = document.createElement('details');
  detail.className = 'mc-detail-report';
  detail.innerHTML = `<summary>${label}</summary>`;
  const body = document.createElement('div');
  while (main.firstChild) body.append(main.firstChild);
  detail.append(body);
  return detail;
}

function setupStrategy(main) {
  const report = wrapDetailedReport(main, 'Explore the source detail behind this view');
  report.open = true;
  const strategy = document.createElement('div');
  strategy.className = 'mojo-command mc-strategy';
  strategy.innerHTML = `<div class="mc-section-head"><div><h1>What to tell your boss next</h1><p class="mc-strategy-intro">Where the budget sits, what the evidence says, and what to change.</p></div><button class="mc-btn primary" id="mc-strategy-export">Download slide-ready summary · TXT ↓</button></div>
    <div class="mc-metric-grid"><div class="mc-metric"><span>Sample campaign budgets</span><strong>$2.2M</strong><small>Across separate exports; not verified spend</small></div><div class="mc-metric"><span>Pipeline from ads</span><strong>Unproven</strong><small>CRM outcomes are not connected</small></div><div class="mc-metric"><span>Next allocation</span><strong>$40k</strong><small>Compare marginal pipeline before deciding</small></div></div>
    <section class="mc-section mc-exec-spend"><div class="mc-exec-head"><div><h2>Where the money is going</h2><p>Three source slices to inspect; they have different scopes and must not be added together.</p></div><a href="Portfolio.html#campaigns" class="mc-exec-source-link">Open campaign performance →</a></div><div class="mc-exec-spend-grid"><a href="HomeSystem.html#finding-flights" class="mc-exec-spend-card"><span>Ending search flights</span><strong>$165k <small>budget</small></strong><div class="mc-exec-track"><i style="width:45%"></i></div><p>$74.2k spent · $90.8k remained at flight end</p><em>Allocation decision needed</em></a><a href="HomeSystem.html#finding-waystar-delivery" class="mc-exec-spend-card"><span>Q1 flight group</span><strong>$305k <small>budget</small></strong><div class="mc-exec-track"><i style="width:46%"></i></div><p>46% average pacing · 13 of 20 below 40%</p><em>Confirm flight intent and cause</em></a><a href="Portfolio.html#campaign=D%26M_2026&tab=overview" class="mc-exec-spend-card"><span>Engagement benchmark sample</span><strong>$56.4k <small>budget</small></strong><div class="mc-exec-track"><i style="width:98.6%"></i></div><p>98.6% average pacing · 6 checks cleared</p><em>Test before scaling</em></a></div><p class="mc-exec-footnote">Source: supplied Oct 30 campaign and routine snapshots. Budget and delivery describe separate examples, not one consolidated portfolio ledger. None verifies pipeline return.</p></section>
    <section class="mc-section mc-exec-read"><h2>What is working, and what is not</h2><p class="mc-result-intro">CPA needs a shared lead definition and clean conversion events.</p><div class="mc-exec-read-grid"><div><span class="mc-exec-kicker">WORKING IN THE SAMPLE</span><strong>Engagement and attribution</strong><p>One campaign group cleared 6 of 6 engagement checks. Mojo repaired 6 malformed UTMs and mapped 16 stray tags, bringing about 2,500 sessions back into attribution.</p><small>Observed engagement and repair receipt; no verified revenue lift.</small></div><div><span class="mc-exec-kicker">NEEDS INTERVENTION</span><strong>Delivery and measurement</strong><p>Three flights ended with about $90k unspent; 13 Q1 flights are below 40% pacing. Duplicate GA4 events and the lead definition remain open checks.</p><small>Delivery counts observed; causes and ROI unverified.</small></div></div></section>
    <section class="mc-section"><h2>What to change this week</h2><ol class="mc-move-list"><li><b>1</b><div><strong>Define the lead</strong><span>Confirm GA4 events and one shared lead definition before using CPA to scale.</span></div></li><li><b>2</b><div><strong>Decide the next $40k</strong><span>Compare the modeled options, then verify marginal results before moving budget.</span></div></li><li><b>3</b><div><strong>Reach uncovered accounts</strong><span>Route qualified accounts from the 1,140-account gap.</span></div></li></ol></section>
    <div class="mc-callout"><div><strong>What leadership can safely say</strong><p>Delivery and engagement signals justify targeted tests. Pipeline impact needs CRM outcomes and a matched comparison.</p></div><a class="mc-btn" href="HomeSystem.html#finding-flights">Open the $40k decision →</a></div>`;
  main.append(strategy, report);
  strategy.querySelector('#mc-strategy-export').addEventListener('click', downloadExec);
}

function renderPacing(result) {
  const flights = [
    ['Q3 ENT TAL Display', 11480, 28000],
    ['Q3 CTV ICP Roku', 18400, 40000],
    ['Q3 Retargeting Pricing Page', 7200, 15000]
  ];
  result.innerHTML = `<h2>Where is the plan diverging?</h2><p class="mc-result-intro">The supplied snapshot has current spend and budget for three ended example flights. It has no weekly history or channel plan, so the bars show spend against each flight's total budget rather than inventing a time series.</p><div class="mc-pacing" aria-label="Spend versus total budget by campaign"></div><div class="mc-callout"><div><strong>Decision before extension</strong><p>Check audience capacity, tracking and marginal pipeline. Under-spend alone does not say where money should move.</p></div><button class="mc-btn primary" data-command="budget">Open the $30k decision →</button></div><section class="mc-section"><h2>Test one move across channels (illustrative)</h2><p class="mc-result-intro">The scenario below demonstrates the planning control. Channel forecasts need CRM outcomes and a fiscal plan before Mojo can recommend a live transfer.</p><div class="mc-form"><label for="mc-shift-amount">Amount to move from Google ending flights <input id="mc-shift-amount" type="range" min="0" max="30000" step="5000" value="15000"></label><div class="mc-shift-readout" aria-live="polite"></div><label for="mc-shift-to">Destination <select id="mc-shift-to"><option>LinkedIn matched accounts</option><option>Demandbase intent audience</option><option>Q1 reserve</option></select></label></div><button class="mc-btn" id="mc-stage-shift">Stage scenario locally</button><p class="mc-result-status" id="mc-shift-status" hidden role="status"></p></section><p class="mc-note">Source: supplied campaign rows. The planning destination and estimated outcome are a demo scenario, not measured channel performance.</p>`;
  const container = result.querySelector('.mc-pacing');
  for (const [name, spent, budget] of flights) {
    const row = document.createElement('div'); row.className = 'mc-pacing-row';
    const pct = Math.round(spent / budget * 100);
    row.innerHTML = `<div class="mc-pacing-label"><strong></strong><span></span></div><div class="mc-pacing-track"><i></i></div><span class="mc-pacing-pct"></span>`;
    row.querySelector('strong').textContent = name;
    row.querySelector('.mc-pacing-label span').textContent = `$${spent.toLocaleString()} / $${budget.toLocaleString()}`;
    row.querySelector('i').style.width = `${pct}%`;
    row.querySelector('.mc-pacing-pct').textContent = `${pct}%`;
    container.append(row);
  }
  const range = result.querySelector('#mc-shift-amount');
  const destination = result.querySelector('#mc-shift-to');
  const update = () => { result.querySelector('.mc-shift-readout').textContent = `$${Number(range.value).toLocaleString()} from ending flights → ${destination.value}. Pipeline effect: unverified.`; };
  range.addEventListener('input', update); destination.addEventListener('change', update); update();
  result.querySelector('#mc-stage-shift').addEventListener('click', event => {
    localStorage.setItem('mojo-command-scenario-v1', JSON.stringify({ amount: Number(range.value), destination: destination.value }));
    const status = result.querySelector('#mc-shift-status'); status.hidden = false;
    status.textContent = `Scenario staged in this browser. No budget changed.`;
    event.target.textContent = 'Scenario staged';
  });
}

/* Campaign planning is a local demo. No platform, CRM, or approval write occurs. */
function renderBulk(result) {
  const markets = ['United States', 'Canada', 'United Kingdom', 'Germany', 'France', 'Netherlands', 'Australia', 'Singapore', 'Japan', 'Brazil', 'Mexico', 'United Arab Emirates', 'Spain', 'Italy', 'Sweden', 'Norway', 'Denmark', 'Finland', 'Ireland', 'Switzerland', 'Belgium', 'Austria', 'Poland', 'India', 'South Korea', 'New Zealand', 'South Africa', 'Israel', 'Saudi Arabia', 'Chile'];
  const codes = {'United States':'us','Canada':'ca','United Kingdom':'uk','Germany':'de','France':'fr','Netherlands':'nl','Australia':'au','Singapore':'sg','Japan':'jp','Brazil':'br','Mexico':'mx','United Arab Emirates':'ae','Spain':'es','Italy':'it','Sweden':'se','Norway':'no','Denmark':'dk','Finland':'fi','Ireland':'ie','Switzerland':'ch','Belgium':'be','Austria':'at','Poland':'pl','India':'in','South Korea':'kr','New Zealand':'nz','South Africa':'za','Israel':'il','Saudi Arabia':'sa','Chile':'cl'};
  const money = amount => new Intl.NumberFormat('en-US', {style:'currency',currency:'USD',maximumFractionDigits:0}).format(amount);
  const selectedMarkets = () => [...result.querySelectorAll('[data-market]:checked')].map(input => input.value);
  const selectedChannels = () => [...result.querySelectorAll('[data-platform]:checked')].map(input => input.value);
  let rules = {};
  try { rules = JSON.parse(localStorage.getItem('mojo-rules-v1') || '{}'); } catch {}
  const threshold = Number.isFinite(Number(rules.threshold)) && Number(rules.threshold) >= 0 ? Number(rules.threshold) : 10000;
  const sequence = (rules.sequence || 'Demand gen lead → Finance').split('→').map(value => value.trim());
  result.innerHTML = `<h2>Build a campaign from the account gap</h2>
    <p class="mc-result-intro">Select the actual markets, budget and reviewers. Mojo can prepare naming and tracking, but targeting, creative and regional checks still need people. This prototype saves drafts locally only.</p>
    <div class="mc-form mc-bulk-form">
      <label for="mc-bulk-program">Program name<input id="mc-bulk-program" maxlength="48" value="Q4 Enterprise Pipeline"></label>
      <label for="mc-bulk-goal">Success metric<select id="mc-bulk-goal"><option>Sales-qualified opportunities</option><option>Pipeline from matched accounts</option><option>Sales-qualified leads</option></select></label>
      <label for="mc-bulk-list">Audience source<select id="mc-bulk-list"><option>Tier-1 named accounts</option><option>Surging accounts not reached</option><option>Open opportunities</option></select></label>
      <label for="mc-bulk-budget">Total planned budget · USD<input id="mc-bulk-budget" type="number" inputmode="decimal" min="1" step="1000" placeholder="Enter budget"></label>
      <fieldset class="mc-market-field"><legend>Choose markets by name</legend><div class="mc-market-list"></div><p>Planning amounts are in USD. Local currency, targeting rules and privacy requirements need review for each market.</p></fieldset>
      <fieldset class="mc-platform-field"><legend>Platforms</legend><div class="mc-checkboxes"><label><input data-platform type="checkbox" value="LinkedIn" checked> LinkedIn</label><label><input data-platform type="checkbox" value="Google Ads" checked> Google Ads</label><label><input data-platform type="checkbox" value="Meta Ads"> Meta Ads</label></div></fieldset>
      <label for="mc-bulk-code">UTM campaign code<input id="mc-bulk-code" maxlength="32" value="q4_enterprise_pipeline"></label>
      <div class="mc-bulk-next"><button class="mc-btn primary" id="mc-preview-bulk" type="button">Preview budget, markets and drafts →</button></div>
    </div><div id="mc-bulk-preview" aria-live="polite"></div>`;
  let selectedAudience = null;
  try { selectedAudience = JSON.parse(localStorage.getItem('mojo-account-campaign-selection-v1') || 'null'); } catch {}
  if (new URLSearchParams(location.search).get('audience') === 'selected' && selectedAudience?.ids?.length) {
    const option = document.createElement('option'); option.value = 'selected'; option.textContent = `Selected accounts (${selectedAudience.ids.length})`;
    result.querySelector('#mc-bulk-list').append(option);
    result.querySelector('#mc-bulk-list').value = 'selected';
    const description = document.createElement('p'); description.className = 'mc-selected-audience'; description.textContent = `${selectedAudience.ids.length} ${selectedAudience.ids.length === 1 ? 'account came' : 'accounts came'} from the Accounts queue. Review ownership and eligibility before launch.`;
    result.querySelector('#mc-bulk-list').after(description);
  }
  const marketList = result.querySelector('.mc-market-list');
  markets.forEach((market, index) => {
    const label = document.createElement('label');
    const input = document.createElement('input'); input.type = 'checkbox'; input.dataset.market = ''; input.value = market; input.checked = index < 3;
    label.append(input, document.createTextNode(` ${market}`)); marketList.append(label);
  });
  if (new URLSearchParams(location.search).get('audience') === 'surging') result.querySelector('#mc-bulk-list').value = 'Surging accounts not reached';
  const preview = result.querySelector('#mc-bulk-preview');
  result.querySelector('#mc-preview-bulk').addEventListener('click', () => {
    const chosenMarkets = selectedMarkets(); const channels = selectedChannels();
    const total = Number(result.querySelector('#mc-bulk-budget').value);
    if (!chosenMarkets.length || !channels.length || !Number.isFinite(total) || total <= 0) {
      preview.innerHTML = '<p class="mc-bulk-error" role="alert">Choose at least one named market and platform, then enter a positive total budget.</p>'; return;
    }
    const program = result.querySelector('#mc-bulk-program').value.trim();
    if (!program) { preview.innerHTML = '<p class="mc-bulk-error" role="alert">Name the program before previewing drafts.</p>'; return; }
    const code = result.querySelector('#mc-bulk-code').value.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_') || 'campaign';
    const audience = result.querySelector('#mc-bulk-list').value === 'selected' ? `Selected accounts (${selectedAudience.ids.length})` : result.querySelector('#mc-bulk-list').value;
    const accountIds = result.querySelector('#mc-bulk-list').value === 'selected' ? selectedAudience.ids : [];
    const metric = result.querySelector('#mc-bulk-goal').value;
    const count = chosenMarkets.length * channels.length;
    const needsFinance = total >= threshold && sequence.length > 1;
    const approvalPath = needsFinance ? sequence.join(' → ') : sequence[0];
    preview.innerHTML = `<section class="mc-section mc-launch-preview"><h3>Review ${count} proposed drafts</h3><p class="mc-note">Preview only. No drafts have been saved, and no campaigns are live.</p><div class="mc-launch-summary"><div><span>Total planned</span><strong>${money(total)}</strong></div><div><span>Drafts</span><strong>${count} across ${chosenMarkets.length} markets</strong></div><div><span>Approval path</span><strong id="mc-approval-path"></strong></div></div><p class="mc-note">${needsFinance ? `At or above the ${money(threshold)} rule: the configured review path is required before a live launch.` : `Below the ${money(threshold)} finance threshold: the configured first review is still required for new spend.`} Mojo cannot approve its own campaign.</p><div class="mc-table-wrap"><table class="mc-table"><thead><tr><th>Market</th><th>Market budget · USD</th><th>Per platform · USD</th><th>Creative</th><th>Regional review</th></tr></thead><tbody id="mc-market-rows"></tbody></table></div><p class="mc-bulk-error" id="mc-budget-error" role="alert" hidden></p><div class="mc-launch-checks"><strong>Before these drafts can launch</strong><ul><li>Confirm account identity, audience eligibility and exclusions in each platform.</li><li>Review platform objectives, bids and pacing separately for the selected platforms.</li><li>Approve localized creative, landing pages, currency and regional privacy requirements.</li></ul></div><details class="mc-launch-draft-detail"><summary>Inspect a draft and its tracking</summary><div class="mc-draft-edit"><label>Draft<select id="mc-draft-select"></select></label><label>Campaign name<input id="mc-draft-name" maxlength="90"></label><label>UTM content<input id="mc-draft-utm" maxlength="48"></label><button class="mc-btn" id="mc-save-draft" type="button">Save this draft name</button><span id="mc-draft-status" role="status"></span></div><p class="mc-note" id="mc-channel-rule"></p></details><div class="mc-launch-approval"><div id="mc-launch-reviewers"></div><label class="mc-launch-ack"><input id="mc-launch-ack" type="checkbox"> I understand these drafts need creative, regional and approval review before launch.</label></div><button class="mc-btn primary" id="mc-stage-bulk" type="button">Stage ${count} drafts for approval</button><p class="mc-result-status" id="mc-bulk-status" role="status" hidden></p></section>`;
    preview.querySelector('#mc-approval-path').textContent = approvalPath;
    const reviewers = preview.querySelector('#mc-launch-reviewers');
    (needsFinance ? sequence : sequence.slice(0, 1)).forEach((role, index) => {
      const label = document.createElement('label'); label.textContent = `${index + 1}. ${role} reviewer`;
      const input = document.createElement('input'); input.type = 'text'; input.maxLength = 64; input.placeholder = 'Name the person'; input.dataset.reviewerRole = role;
      label.append(input); reviewers.append(label);
    });
    const draftRows = [];
    const body = preview.querySelector('#mc-market-rows');
    chosenMarkets.forEach((market, index) => {
      const row = document.createElement('tr');
      const name = document.createElement('td'); name.textContent = market;
      const budgetCell = document.createElement('td'); const budgetInput = document.createElement('input');
      budgetInput.type = 'number'; budgetInput.min = '0'; budgetInput.step = '1'; budgetInput.className = 'mc-market-budget'; budgetInput.setAttribute('aria-label', `${market} planned budget in USD`);
      budgetInput.value = String(Math.floor(total / chosenMarkets.length) + (index === 0 ? total % chosenMarkets.length : 0)); budgetCell.append(budgetInput);
      const platformCell = document.createElement('td'); platformCell.className = 'mc-platform-share';
      const creativeCell = document.createElement('td'); const creative = document.createElement('select'); creative.setAttribute('aria-label', `${market} creative readiness`);
      ['Needs localization','Ready for review'].forEach(value => { const option = document.createElement('option'); option.textContent = value; creative.append(option); }); creativeCell.append(creative);
      const reviewCell = document.createElement('td'); reviewCell.textContent = 'Pending';
      row.append(name,budgetCell,platformCell,creativeCell,reviewCell); body.append(row);
      draftRows.push({market,budgetInput,platformCell,creative});
    });
    const budgetError = preview.querySelector('#mc-budget-error');
    const updateBudget = () => {
      const allocations = draftRows.map(row => Number(row.budgetInput.value));
      const sum = allocations.reduce((a,b) => a + b, 0);
      const valid = allocations.every(n => Number.isFinite(n) && n >= 0) && Math.abs(sum - total) < .01;
      draftRows.forEach((row,index) => row.platformCell.textContent = `${money(allocations[index] / channels.length)} × ${channels.length}`);
      budgetError.hidden = valid; budgetError.textContent = valid ? '' : `Market budgets total ${money(sum)}; they must equal the ${money(total)} plan.`;
      return valid;
    };
    draftRows.forEach(row => row.budgetInput.addEventListener('input', updateBudget)); updateBudget();
    const drafts = chosenMarkets.flatMap(market => channels.map(channel => ({market,channel,name:`${program} · ${market} · ${channel}`,utmContent:`market_${codes[market]}`})));
    const picker = preview.querySelector('#mc-draft-select');
    drafts.forEach((draft,index) => { const option = document.createElement('option'); option.value = String(index); option.textContent = draft.name; picker.append(option); });
    const loadDraft = () => { const draft = drafts[Number(picker.value)]; preview.querySelector('#mc-draft-name').value = draft.name; preview.querySelector('#mc-draft-utm').value = draft.utmContent; const rules = {'LinkedIn':'Matched audience, lead form and bidding need review.','Google Ads':'Customer Match eligibility, search intent and bidding need review.','Meta Ads':'Custom audience eligibility, objective and placement need review.'}; preview.querySelector('#mc-channel-rule').textContent = `${draft.channel}: ${rules[draft.channel]} UTM campaign: ${code}.`; };
    picker.addEventListener('change', loadDraft); loadDraft();
    preview.querySelector('#mc-save-draft').addEventListener('click', () => { const draft = drafts[Number(picker.value)]; const name = preview.querySelector('#mc-draft-name').value.trim(); const utm = preview.querySelector('#mc-draft-utm').value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_'); if (!name || !utm) { preview.querySelector('#mc-draft-status').textContent = 'Add a name and UTM content.'; return; } draft.name = name; draft.utmContent = utm; picker.options[picker.selectedIndex].textContent = name; preview.querySelector('#mc-draft-status').textContent = 'Draft name updated in this preview.'; });
    preview.querySelector('#mc-stage-bulk').addEventListener('click', event => {
      const reviewerFields = [...preview.querySelectorAll('[data-reviewer-role]')];
      const reviewers = reviewerFields.map(input => ({role:input.dataset.reviewerRole,name:input.value.trim()}));
      const ack = preview.querySelector('#mc-launch-ack').checked;
      const status = preview.querySelector('#mc-bulk-status'); status.hidden = false;
      if (!updateBudget() || reviewers.some(item => !item.name) || !ack) { status.textContent = 'Balance the market budgets, name each reviewer and acknowledge the launch checks before staging.'; return; }
      const unlocalized = draftRows.filter(row => row.creative.value !== 'Ready for review').map(row => row.market);
      const allocations = draftRows.map(row => ({market:row.market,budget:Number(row.budgetInput.value),creative:row.creative.value,regionalReview:'Pending'}));
      localStorage.setItem('mojo-command-bulk-v3', JSON.stringify({program,audience,accountIds,metric,total,currency:'USD',markets:allocations,channels,code,drafts,reviewers,approvalPath,approvalStatus:'Pending',unlocalized,at:new Date().toISOString()}));
      event.target.disabled = true;
      status.textContent = `${count} drafts staged locally for ${reviewers[0].name}. ${unlocalized.length ? `${unlocalized.length} ${unlocalized.length === 1 ? 'market needs' : 'markets need'} localized creative: ${unlocalized.join(', ')}.` : 'Creative is ready for review in all selected markets.'} ${needsFinance ? 'Finance review is also pending.' : ''} No approval was sent and nothing went live.`;
    });
    preview.scrollIntoView({block:'start'});
  });
}

function renderCreative(result) {
  result.innerHTML = `<h2>Keep the message on brief.</h2><p class="mc-result-intro">Review copy beside its placement and stage a rotation. The positioning rule and ads below are demo examples; no creative asset library or publishing connection is available.</p><div class="mc-creative-grid"><article class="mc-creative-preview"><span>LINKEDIN · CURRENT</span><div class="mc-creative-art" aria-hidden="true">MOJO<br>ACCOUNT SIGNALS</div><strong>Reach the right buying group.</strong><p>See which accounts are moving toward pipeline.</p><small>Example creative · rotation candidate</small></article><article class="mc-creative-edit"><label for="mc-copy">Replacement copy<textarea id="mc-copy">Reach the right buying group and see which accounts are moving toward pipeline.</textarea></label><p class="mc-note"><b>Approved message example:</b> account coverage, pipeline visibility and buying-group context. Avoid unsupported guarantees.</p><div class="mc-inline-actions"><button class="mc-btn" id="mc-check-copy">Check alignment</button><button class="mc-btn primary" id="mc-stage-creative">Stage rotation</button></div><p id="mc-copy-feedback" class="mc-result-status" role="status"></p></article></div><div class="mc-callout"><div><strong>Fatigue signal needs context</strong><p>Frequency and CTR trend are not supplied for this creative. Mojo should verify tracking and compare matched audiences before recommending a pause.</p></div><a class="mc-btn" href="Portfolio.html#creative">Open creative evidence →</a></div>`;
  const feedback = result.querySelector('#mc-copy-feedback');
  result.querySelector('#mc-check-copy').addEventListener('click', () => {
    const copy = result.querySelector('#mc-copy').value.trim();
    const warnings = [];
    if (!copy) warnings.push('Add replacement copy first.');
    if (/guarantee|guaranteed|instant|zero risk/i.test(copy)) warnings.push('Remove unsupported certainty claims.');
    if (/cheap clicks|low cpc/i.test(copy)) warnings.push('Lead with account or pipeline outcomes.');
    if (copy && !/account|pipeline|buying group|opportunit/i.test(copy)) warnings.push('Connect the promise to the approved message.');
    feedback.textContent = warnings.length ? warnings.join(' ') : 'No conflict found in this simple local check. Human review is still required.';
  });
  result.querySelector('#mc-stage-creative').addEventListener('click', event => {
    const copy = result.querySelector('#mc-copy').value.trim();
    if (!copy) { feedback.textContent = 'Add replacement copy first.'; return; }
    localStorage.setItem('mojo-command-creative-v1', JSON.stringify({ copy }));
    event.target.disabled = true; feedback.textContent = window.MojoVoice.say('creative',{name:'this creative'});
  });
}

function renderAccounts(result) {
  result.innerHTML = `<h2>Find the accounts worth reaching.</h2><p class="mc-result-intro">The source-backed account cohort has 1,140 surging accounts outside live campaigns. Account identities and opportunity stages below are synthetic demo examples.</p><div class="mc-form"><label for="mc-audience-rule">Smart list <select id="mc-audience-rule"><option>Surging, not reached</option><option>Engaged, no opportunity</option><option>Open opportunity going cold</option></select></label><label class="mc-audience-toggle"><input id="mc-exclude-open" type="checkbox" checked> Exclude accounts with open opportunities from prospecting</label></div><table class="mc-table"><thead><tr><th>Example account</th><th>Intent</th><th>Opportunity</th><th>Current reach</th></tr></thead><tbody><tr><td><strong>Northstar Health</strong></td><td>High</td><td>Discovery · $310k</td><td>None</td></tr><tr><td><strong>Cedar Grid</strong></td><td>Surging</td><td>Evaluation · $180k</td><td>None</td></tr><tr><td><strong>Harbor Systems</strong></td><td>Surging</td><td>None</td><td>None</td></tr></tbody></table><div class="mc-callout"><div><strong>Resolve overlap by purpose</strong><p>Cross-channel reach can be deliberate ABM. Check frequency, cost per account and open opportunity status before excluding an account.</p></div><button class="mc-btn primary" id="mc-stage-audience">Stage audience list</button></div><p class="mc-result-status" id="mc-audience-status" hidden role="status"></p><p class="mc-note">Audience changes and sales handoffs are local demo states. <a href="Portfolio.html#accounts">Explore account coverage →</a></p>`;
  result.querySelector('#mc-stage-audience').addEventListener('click', event => {
    const rule = result.querySelector('#mc-audience-rule').value;
    const excludeOpen = result.querySelector('#mc-exclude-open').checked;
    localStorage.setItem('mojo-command-audience-v1', JSON.stringify({ rule, excludeOpen }));
    event.target.disabled = true;
    const status = result.querySelector('#mc-audience-status'); status.hidden = false;
    status.textContent = `“${rule}” staged locally with ${excludeOpen ? 'open-opportunity exclusion' : 'no open-opportunity exclusion'}. No targeting changed.`;
  });
}
