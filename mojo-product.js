/* Cross-page demo decisions. Illustrative CRM values are explicitly separated from source data. */
document.addEventListener('DOMContentLoaded', () => {
  const route = location.pathname.split('/').pop() || 'HomeSystem.html';
  const page = route.includes('.') ? route : `${route}.html`;
  const main = document.querySelector('main.canvaspane');
  const settings = document.querySelector('.rail');
  if (settings && !settings.querySelector('.mojo-settings-link')) {
    const cog = document.createElement('a');
    cog.className = 'mojo-settings-link' + (page === 'Settings.html' ? ' on' : '');
    cog.href = 'Settings.html'; cog.setAttribute('aria-label','Settings'); cog.title='Settings · your rules';
    cog.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2 2-.06-.06A1.7 1.7 0 0 0 16 18.5a1.7 1.7 0 0 0-1 .9v.1h-3v-.1a1.7 1.7 0 0 0-2.6-1.3l-.07.05-2-2 .07-.06A1.7 1.7 0 0 0 7.5 14a1.7 1.7 0 0 0-.9-1H6v-3h.6a1.7 1.7 0 0 0 1.3-2.6l-.06-.07 2-2 .06.07A1.7 1.7 0 0 0 12 5.5a1.7 1.7 0 0 0 1-.9V4h3v.6A1.7 1.7 0 0 0 18.6 5.9l.07-.06 2 2-.07.06A1.7 1.7 0 0 0 20.5 10a1.7 1.7 0 0 0 .9 1h.1v3h-.1a1.7 1.7 0 0 0-2 1Z" transform="translate(-2 -1)"/></svg>';
    settings.querySelector('div[style*="flex:1"],.trust-rail-spacer')?.after(cog);
    if (!cog.isConnected) settings.append(cog);
  }
  document.querySelectorAll('a[href="Guardrails.dc.html"]').forEach(a => {a.href='Settings.html'; if(a.textContent.trim()==='Your rules') a.remove();});
  document.querySelectorAll('.modulenav a[href="HomeSystem.html"]').forEach(a=>a.textContent='Brief');
  const nav = document.querySelector('.modulenav');
  if (!main) return;
  const node=(html)=>{const t=document.createElement('template');t.innerHTML=html.trim();return t.content.firstElementChild};
  const trustHTML = `<aside class="mojo-product mp-trust mp-trust-brief" id="data-trust"><details class="mp-trust-evidence"><summary><span class="mp-trust-intro"><strong>Check data trust →</strong><small>2 open checks · duplicate GA4 events · lead definition</small></span><span class="mp-trust-action">See checks ↓</span></summary><div class="mp-trust-proof"><p><b>Duplicate events.</b> Two GA4 conversion events fire almost as often as page views. Verify their mapping before using conversion totals.</p><p><b>Lead definition.</b> The source has no shared definition of a lead. Agree on one before comparing CPA.</p></div></details></aside>`;
  if (page === 'HomeSystem.html' || page === 'index.html') {
    const needs=main.querySelector('.brief-view-needs'); const lead=needs?.querySelector('.card.lead');
    if(needs && lead){
      lead.classList.add('mp-original-lead');
      const trust=node(trustHTML); needs.querySelector('.brief-view-intro')?.after(trust);
      const checks=trust.querySelector('.mp-trust-evidence');
      checks.addEventListener('toggle',()=>{checks.querySelector('.mp-trust-action').textContent=checks.open?'Hide checks ↑':'See checks ↓';});
    }
  }
  if (page === 'Work.html') {
    const mast = main.querySelector('.task-masthead');
    const feature = main.querySelector('.task-feature');
    if (feature) feature.hidden = true;
    const queueLink = node(`<a class="mojo-product mp-decision-queue" data-finding-id="flight-allocation-2026-10-31" href="HomeSystem.html#finding-flights" aria-label="Three flights ended with less than half their budgets spent. Jump to the $40k allocation decision."><span>$40k allocation decision — 3 flights, ~$90k at stake</span><strong>Review decision ↓</strong></a>`);
    (mast || main.firstElementChild)?.after(queueLink);
  }
  if(page==='Strategy.html'){
    const thesis=main.querySelector('.thesis');if(thesis)thesis.textContent='Pipeline per dollar is the decision metric. Current platform and vendor engagement data can identify questions, but the CRM outcome case remains an illustrative scenario until measurement is verified.';
    const oldBoard=main.querySelector('.cmocard');if(oldBoard)oldBoard.hidden=true;
    main.querySelectorAll('.statcard').forEach(card=>{if(card.textContent.includes('23 min')){card.querySelector('.l').textContent='Data trust';card.querySelector('.v').textContent='2 open checks';card.querySelector('.s').textContent='Resolve before pipeline claims';}});
    const board=node(`<section class="mojo-product mp-section" id="board-view"><h2>Modeled allocation scenario</h2><div class="mp-grid"><div class="mp-tile"><strong>$3.2k → $5.5k</strong><p>Modeled marginal rate, ending Google flights versus a proposed demand gen campaign.</p></div><div class="mp-tile"><strong>$1.9M / $2.2M</strong><p>Illustrative spend forecast / plan, not efficiency.</p></div><div class="mp-tile"><strong>Unproven</strong><p>Reached accounts need a matched unreached cohort before comparing win rate, velocity or deal size.</p></div></div><div class="mp-two"><div class="mp-tile"><h3>Illustrative scenario steps</h3><ol class="mp-list"><li>Shift $40k toward a proposed campaign only if the verified marginal pipeline case holds; modeled $220k.</li><li>Fix duplicate g2_ events and define a lead before using conversion CPA for allocation.</li><li>Route surging, unreached Tier-1 accounts to account owners; measure opportunity creation.</li></ol></div><div class="mp-tile"><h3>Reached versus similar unreached</h3><table class="mp-plan-table"><thead><tr><th>Metric</th><th>Reached</th><th>Matched unreached</th></tr></thead><tbody><tr><td>Win rate</td><td>29%</td><td>Unavailable</td></tr><tr><td>Deal velocity</td><td>42 days</td><td>Unavailable</td></tr><tr><td>Average deal size</td><td>$2,329.57</td><td>Unavailable</td></tr></tbody></table><p>No causal lift is claimed without the unreached cohort.</p><p class="mp-source">All modeled dollar outcomes and Q4 plan here are synthetic demo assumptions. Source: supplied spend, pacing and Demandbase engagement snapshot.</p><a class="mp-btn" href="HomeSystem.html#finding-unreached-accounts">See account gap → Today</a></div></div></section>`);
    main.insertBefore(board,main.querySelector('.cardgrid')||main.firstElementChild);
  }
  if(page==='Settings.html') setupSettings(main,node);
  if(page==='Setup.html') setupFirstRun(main,node);
});

function setupSettings(main,node){
  main.innerHTML=`<div class="mojo-product mp-page">
    <h1>What Mojo can do today</h1>
    <p>Mojo checks the sample portfolio and prepares work for review. Live budget changes, CRM handoffs, tracking writes, and report sends need connected accounts and execution permissions.</p>
    <aside class="mp-trust"><div><strong>Current boundary</strong><p>These settings save locally. They do not authorize live actions or send anything to a teammate.</p></div><a href="Connections.html">See connection status →</a></aside>
    <section class="mp-section"><h2>Action permissions</h2><p class="mp-muted">Suggest and Draft are available in this prototype. Automatic execution becomes available only after live connections and approval checks are built.</p><div id="mp-routines"></div></section>
    <section class="mp-section"><h2>Approval rules for a connected workspace</h2><div class="mp-settings-row"><div><strong>Autonomous transfer limit</strong><p>Maximum shift between campaigns without asking, once live execution is available.</p></div><input id="mp-autonomy-limit" type="number" min="0" max="50000" step="1000" value="5000" aria-label="Autonomous transfer limit in dollars"></div><div class="mp-settings-row"><div><strong>Approval chain threshold</strong><p>Changes at or above this amount need demand gen and finance signoff.</p></div><input id="mp-approval-threshold" type="number" min="0" max="1000000" step="1000" value="10000" aria-label="Approval threshold in dollars"></div><div class="mp-settings-row"><div><strong>Approval sequence</strong><p>Mojo drafts → demand gen lead reviews → finance approves.</p></div><select id="mp-approval-sequence"><option>Demand gen lead → Finance</option><option>Demand gen lead only</option><option>Finance → Demand gen lead</option></select></div><p class="mp-status" id="mp-settings-status" role="status"></p></section>
    <section class="mp-section"><h2>What is already recorded</h2><p class="mp-muted">Sample receipts show UTM repairs, weekly report drafts, pacing checks, and the open handoff. They are examples of the workflow, not evidence of live account changes.</p><a class="mp-btn" href="HomeSystem.html#queue-receipts">Review sample receipts →</a></section>
  </div>`;
  const routines=[['Budget reallocation','Spend and flight changes'],['Account handoff','CRM tasks and Slack alerts'],['Tracking fixes','UTMs and event tags'],['Report distribution','Drafts, exports and scheduled sends']];
  const root=main.querySelector('#mp-routines');let saved={};try{saved=JSON.parse(localStorage.getItem('mojo-rules-v1')||'{}')}catch{}
  for(const [name,desc] of routines){
    const row=node(`<div class="mp-settings-row"><div><strong>${name}</strong><p>${desc}</p></div><select aria-label="${name} autonomy"><option>Suggest</option><option>Draft</option><option disabled>Do and tell me — needs live connection</option><option disabled>Do quietly — needs live connection</option></select></div>`);
    row.querySelector('select').value=['Suggest','Draft'].includes(saved[name])?saved[name]:'Draft';root.append(row);
  }
  const limit=main.querySelector('#mp-autonomy-limit');const threshold=main.querySelector('#mp-approval-threshold');const sequence=main.querySelector('#mp-approval-sequence');limit.value=saved.limit??5000;threshold.value=saved.threshold??10000;sequence.value=saved.sequence||sequence.value;
  main.querySelectorAll('select,input').forEach(input=>input.addEventListener('change',()=>{
    const state={limit:limit.value,threshold:threshold.value,sequence:sequence.value};
    root.querySelectorAll('.mp-settings-row').forEach(row=>state[row.querySelector('strong').textContent]=row.querySelector('select').value);
    localStorage.setItem('mojo-rules-v1',JSON.stringify(state));
    main.querySelector('#mp-settings-status').textContent='Demo rules saved in this browser. Live account permissions are unchanged.';
  }));
}
function setupFirstRun(main,node){
  main.innerHTML=`<div class="mojo-product mp-page"><h1>From connection to first useful finding.</h1><p>Four steps, about 10 minutes, one clear promise: Mojo shows what it can verify and what it still needs before asking you to move spend.</p><div class="mp-guide"><div class="mp-tile on"><strong>1. Connect</strong><p>Ads, CRM and GA4. Simulated in this demo.</p></div><div class="mp-tile"><strong>2. Define a lead</strong><p>Choose SQL or opportunity, not a vague platform conversion.</p></div><div class="mp-tile"><strong>3. Set limits</strong><p>Ownership, autonomy and approval threshold.</p></div><div class="mp-tile"><strong>4. See the work</strong><p>First findings, receipts and evidence gaps.</p></div></div><section class="mp-section" id="mp-setup-step"></section><p class="mp-source">This walkthrough stores progress locally. It does not connect to external services or perform a live scan.</p></div>`;
  let step=0;const box=main.querySelector('#mp-setup-step');const steps=[['Connect your sources','Google Ads, Demandbase, Salesforce and GA4 give Mojo spend, reach, opportunity and measurement context.','Mark sources connected for demo'],['What counts as a lead?','Choose a shared definition so pipeline per dollar has a stable denominator.','Save lead definition'],['Set your boundaries','Choose the approval chain and autonomy threshold before any action.','Use demo rules'],['Here is what I found','Three flights end with budget remaining; data trust has two open checks; 1,140 surging accounts are not reached.','Open your Brief']];
  const render=()=>{main.querySelectorAll('.mp-guide .mp-tile').forEach((x,i)=>x.classList.toggle('on',i===step));const [title,copy,label]=steps[step];box.innerHTML=`<h2>${title}</h2><p class="mp-muted">${copy}</p>${step===1?'<select id="mp-lead-definition"><option>Sales-qualified lead</option><option>Opportunity created</option><option>Pipeline opportunity</option></select>':''}<div class="mp-actions" style="margin-top:14px"><button class="mp-btn primary" id="mp-next">${label} →</button>${step>0?'<button class="mp-btn" id="mp-back">Back</button>':''}</div>`;box.querySelector('#mp-back')?.addEventListener('click',()=>{step--;render()});box.querySelector('#mp-next').addEventListener('click',()=>{if(step===1)localStorage.setItem('mojo-lead-definition-v1',box.querySelector('#mp-lead-definition').value);if(step===3){location.href='HomeSystem.html';return;}step++;render();});};render();
}
