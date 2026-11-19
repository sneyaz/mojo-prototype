/* Four-view navigation. Demo actions are local; platform and CRM state is unchanged. */
document.addEventListener('DOMContentLoaded', () => {
  const route = location.pathname.split('/').pop();
  const page = route.endsWith('.html') ? route : `${route}.html`;
  if (page === 'Work.html') buildWork();
  if (page === 'Portfolio.html') buildPortfolio();
});
const MOJO_FLIGHT = Object.freeze({ id:'flight-allocation-2026-10-31', remaining:'about $90k', count:3, amount:'$40k' });
const mojoNode = html => { const t=document.createElement('template'); t.innerHTML=html.trim(); return t.content.firstElementChild; };
function panelSwitcher(root, prefix) {
  const tabs=[...root.querySelectorAll(`[data-${prefix}-tab]`)];
  const panels=[...root.querySelectorAll(`[data-${prefix}-panel]`)];
  const show=name=>{
    tabs.forEach(tab=>{const on=tab.dataset[`${prefix}Tab`]===name;tab.classList.toggle('on',on);tab.setAttribute('aria-selected',String(on));tab.tabIndex=on?0:-1;});
    panels.forEach(panel=>panel.hidden=panel.dataset[`${prefix}Panel`]!==name);
    history.replaceState(null,'',`#${name}`);
  };
  tabs.forEach(tab=>tab.addEventListener('click',()=>show(tab.dataset[`${prefix}Tab`])));
  const initial=location.hash.slice(1);
  show(tabs.some(tab=>tab.dataset[`${prefix}Tab`]===initial)?initial:tabs[0].dataset[`${prefix}Tab`]);
}
function buildWork(){
  document.title='Mojo — Work';
  const main=document.querySelector('.mc-original-content')||document.querySelector('main.canvaspane');
  if(!main)return;
  const old=document.createElement('div');old.className='ia-imported-tasks';
  while(main.firstChild)old.append(main.firstChild);
  const root=mojoNode(`<div class="ia-page ia-work"><header class="ia-pagehead"><h1>Everything on your plate today</h1></header><div class="ia-tabs" role="tablist" aria-label="Work areas"><button role="tab" data-work-tab="decisions">Decisions <span>6</span></button><button role="tab" data-work-tab="handoffs">Account handoffs <span>1,140</span></button><button role="tab" data-work-tab="create">New campaign</button><button role="tab" data-work-tab="receipts">Receipts</button></div><section role="tabpanel" data-work-panel="decisions" id="ia-panel-decisions"></section><section role="tabpanel" data-work-panel="handoffs" id="ia-panel-handoffs" hidden></section><section role="tabpanel" data-work-panel="create" id="ia-panel-create" hidden></section><section role="tabpanel" data-work-panel="receipts" id="ia-panel-receipts" hidden></section></div>`);
  main.append(root);
  root.querySelector('#ia-panel-decisions').append(old);
  old.querySelector('.task-work-rail')?.remove();
  const legacyMasthead = old.querySelector('.task-masthead');
  if (legacyMasthead) legacyMasthead.remove();
  root.querySelector('#ia-panel-handoffs').innerHTML='<div id="mojo-accounts-work"></div>';
  window.MojoAccounts.mount(root.querySelector('#mojo-accounts-work'));
  root.querySelector('#ia-panel-create').innerHTML=`<div id="ia-bulk"></div>`;
  if(typeof renderBulk==='function')renderBulk(root.querySelector('#ia-bulk'));
  root.querySelector('#ia-panel-receipts').innerHTML=`<div class="ia-sectionhead"><div><h2>Receipts, in order.</h2><p>The alert is recorded once. Each action then adds a distinct decision, apply or verification receipt.</p></div></div><ol class="ia-receipts"><li><b>Observed</b><span>Three flights are 43–47% spent before the end of the flight. <a href="Portfolio.html#campaigns">See source rows →</a></span></li><li><b>Decision pending</b><span>Choose extend, shift or release. Approval stays with the demand gen lead and finance above $10k.</span></li><li><b>Verify later</b><span>Check outcomes at days 14, 30 and 60 against a comparable account group; no result is claimed yet.</span></li></ol>`;
  root.querySelector('#ia-panel-receipts .ia-receipts').insertAdjacentHTML('beforebegin', `<section class="ia-evidence-summary" aria-label="Data trust and routine receipts"><div><h3>Verify the measurement before moving spend — two open checks.</h3><p>Duplicate g2_ events and an undefined “lead” can distort conversion CPA. The click-to-visit gap needs a landing-page tag check before it becomes a creative finding.</p></div><div><h3>What Mojo completed today.</h3><p>Six malformed UTMs repaired, 16 stray tags mapped, and three weekly reports drafted for review. These are local prototype receipts, not live platform writes.</p></div></section>`);
  window.MojoAccounts.mountFollowUp(root.querySelector('#ia-panel-decisions'));
  panelSwitcher(root,'work');
  requestAnimationFrame(() => { main.scrollTop = 0; main.parentElement.scrollTop = 0; window.scrollTo(0, 0); });
}
function buildPortfolio(){
  document.title='Mojo — Campaigns';
  const main=document.querySelector('.mc-original-content')||document.querySelector('main.canvaspane');
  if(!main)return;
  const old=document.createElement('div');while(main.firstChild)old.append(main.firstChild);
  const root=mojoNode(`<div class="ia-page ia-portfolio"><header class="ia-pagehead ia-context-head"><h1 id="ia-context-title">$826,718 in under-pacing campaigns</h1><p id="ia-context-summary">$130,159 is over pacing elsewhere. The $40k allocation needs a decision after the Oct 31 flight end.</p><div class="ia-context-meta"><span id="ia-context-source">Source snapshot · Oct 30, 2026</span><a id="ia-context-action" href="HomeSystem.html#finding-flights">Open the $40k decision →</a></div></header><div class="ia-pipeline-link"><img src="assets/salesforce.png" alt=""><div><strong>See which spend creates pipeline</strong><span>Salesforce outcomes are needed to verify pipeline. This prototype is not connected.</span></div><a class="mc-btn primary" href="Connect.dc.html#salesforce">Review CRM requirements →</a></div><div class="ia-toolbar"><label>Show <select id="ia-lens"><option value="quarterly" selected>Quarterly Review</option><option value="goals">Initiatives</option><option value="channels">Channels</option><option value="campaigns">Campaigns</option><option value="accounts">Accounts</option><option value="creative">Creative</option></select></label><label>Platform <select id="ia-platform"><option value="all">All platforms</option><option value="Google Ads">Google Ads</option><option value="Demandbase Ads">Demandbase Ads</option><option value="LinkedIn Ads">LinkedIn Ads</option></select></label><label class="ia-search">Find <input id="ia-search" type="search" placeholder="Search the current view"></label></div><section class="ia-lens" data-lens="campaigns" id="ia-panel-campaigns" hidden></section><section class="ia-lens" data-lens="accounts" id="ia-panel-accounts" hidden></section><section class="ia-lens" data-lens="creative" id="ia-panel-creative" hidden></section><section class="ia-lens" data-lens="goals" id="ia-panel-goals" hidden></section><section class="ia-lens" data-lens="channels" id="ia-panel-channels" hidden></section><section class="ia-lens" data-lens="quarterly" id="ia-panel-quarterly"></section><details class="mc-detail-report ia-source-detail"><summary>Explore the full source report</summary></details></div>`);
  main.append(root);root.querySelector('.ia-source-detail').open = false;root.querySelector('.ia-source-detail').append(old);
  root.querySelector('#ia-panel-campaigns').innerHTML=`<div class="ia-sectionhead"><div><h2>Which campaigns need a closer look?</h2><p>Open a campaign for its delivery, evidence and work.</p></div></div><div class="ia-table-wrap"><table class="mc-table"><thead><tr><th>Campaign</th><th>Channels</th><th>Mojo's read</th><th>Pacing</th></tr></thead><tbody id="ia-campaign-rows"></tbody></table></div><p class="mc-note" id="ia-match-count"></p>`;
  root.querySelector('#ia-panel-accounts').innerHTML='<div id="mojo-accounts-portfolio"></div>';
  window.MojoAccounts.mount(root.querySelector('#mojo-accounts-portfolio'));
  root.querySelector('#ia-panel-creative').innerHTML='<div class="md-table-head"><h2>Creatives</h2></div><p role="status">Loading creative report…</p>';
  const rows=[['GO Prep','Google Ads','Shared $40k decision','45%'],['Q4 Pipeline Search','Google Ads','Shared $40k decision','43%'],['Enterprise Retargeting','Google Ads','Shared $40k decision','47%'],['MOF — Patient Payments','Demandbase Ads','Stalled delivery','6%'],['D&M_2026','Demandbase Ads','On track','96%'],['Q4 Enterprise Pipeline','LinkedIn Ads','On track','91%'],['Commerce/Holiday 2026','Demandbase Ads','Check visit tag','82%']];
  const renderRows=()=>{const platform=root.querySelector('#ia-platform').value;const q=root.querySelector('#ia-search').value.toLowerCase().trim();const lens=root.querySelector('#ia-lens').value;const header={campaigns:['$826,718 in under-pacing campaigns','$130,159 is over pacing elsewhere. The $40k allocation needs a decision after the Oct 31 flight end.','Source snapshot · Oct 30, 2026'],accounts:['340 accounts ready to act on','Prioritize intent, reach and ownership before handing accounts to sales.','Demandbase cohort · 1,140 identified'],creative:['Creatives','Review ad-group performance and compare creative previews.','10 ad groups · Demandbase sample'],goals:['Initiatives','Review initiatives and the campaigns supporting each outcome.','Planning view'],channels:['Channels','See campaign work by advertising channel.','Current plan sample'],quarterly:['Quarterly Review','Q4 results, what worked, and what needs attention.','Q4 2026']}[lens];root.querySelector('#ia-context-title').textContent=header[0];root.querySelector('#ia-context-summary').textContent=header[1];root.querySelector('#ia-context-source').textContent=header[2];root.querySelector('#ia-context-action').hidden=lens!=='campaigns';root.querySelectorAll('.ia-lens').forEach(section=>section.hidden=section.dataset.lens!==lens);root.querySelector('#ia-platform').disabled=lens!=='campaigns';root.querySelector('#ia-platform').parentElement.hidden=lens!=='campaigns';root.querySelector('.ia-search').hidden=lens==='accounts'||lens==='quarterly'||lens==='channels';const shown=rows.filter(row=>(platform==='all'||row[1]===platform)&&row.join(' ').toLowerCase().includes(q));const tbody=root.querySelector('#ia-campaign-rows');tbody.innerHTML='';for(const row of shown){const tr=document.createElement('tr');for(const value of row){const td=document.createElement('td');td.textContent=value;tr.append(td)}tbody.append(tr)}root.querySelector('#ia-match-count').textContent=`${shown.length} named campaigns match this view.`;window.dispatchEvent(new CustomEvent('mojo:portfolio-count',{detail:{count:shown.length}}));root.querySelectorAll('.ia-account-rows>div').forEach(div=>div.hidden=!!q&&!div.dataset.search.includes(q));};
  root.querySelectorAll('#ia-lens,#ia-platform,#ia-search').forEach(control=>control.addEventListener('input',renderRows));
  const hash=location.hash.slice(1);if(['accounts','creative','goals','channels','quarterly','quarterly-review'].includes(hash))root.querySelector('#ia-lens').value=hash==='quarterly-review'?'quarterly':hash;renderRows();
}
