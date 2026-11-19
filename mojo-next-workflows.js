/* Local, source-labeled workflow previews. No connected account writes. */
(() => {
  const page = (location.pathname.split('/').pop() || 'HomeSystem.html').replace(/\.html$/, '');
  const money = value => (value < 0 ? '-$' : '$') + Math.round(Math.abs(value)).toLocaleString();
  const safe = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const seed = [
    {id:'ending', name:'Three ended sample flights', channel:'Display + CTV', available:45920, rate:3.2},
    {id:'go', name:'Q3 ENT TAL Display', channel:'Demandbase Ads', available:16520, rate:3.2},
    {id:'search', name:'Q3 CTV ICP Roku', channel:'Demandbase Ads', available:21600, rate:3.2},
    {id:'retarget', name:'Q3 Retargeting Pricing Page', channel:'Demandbase Ads', available:7800, rate:3.2},
    {id:'proposed', name:'Proposed demand gen campaign', channel:'Demandbase Ads', available:0, rate:5.5}
  ];
  const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
  const write = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} };

  document.addEventListener('DOMContentLoaded', () => requestAnimationFrame(() => requestAnimationFrame(() => {
    if (page === 'Portfolio') { accounts(); creative(); }
    if (page === 'Routines') { pacing(); utm(); const target=document.getElementById(location.hash.slice(1)); if(target?.matches('details.mr-routine')) target.open=true; }
    if (page === 'Strategy') strategy();
    if (page === 'Settings') autoApply();
  })));

  function planner() {
    const card = document.querySelector('#mojo-reallocation');
    if (!card) return;
    card.id = 'budget-planner';
    const custom = read('mojo-planner-campaigns-v1', []);
    const campaigns = [...seed, ...custom];
    let moves = read('mojo-planner-moves-v1', [{from:'ending',to:'proposed',amount:30000,fromRate:3.2,toRate:5.5}]);
    if (moves.length===1 && moves[0]?.from==='ending' && moves[0]?.to==='proposed' && moves[0]?.amount===40000 && moves[0]?.fromRate===3.2 && moves[0]?.toRate===5.5) moves[0].amount=30000;
    moves = moves.map(move => ({...move, from: campaigns.some(c=>c.id===move.from) ? move.from : 'ending', to: campaigns.some(c=>c.id===move.to) ? move.to : 'proposed'}));
    card.innerHTML = `<div class="mn-eyebrow">MONDAY PLANNING TOOL · LOCAL PREVIEW</div><h2>Budget reallocation planner</h2><p>Compare moves across campaigns and channels. Add your own campaign inputs, then test one or several shifts before approval.</p><div class="mn-planner-summary" aria-live="polite"></div><div class="mn-moves"></div><div class="mn-actions"><button type="button" class="mn-add-move">+ Add a move</button><button type="button" class="mn-save-plan">Save this plan</button></div><details class="mn-add-campaign"><summary>Add a campaign to plan with</summary><form><label>Campaign name<input name="name" required maxlength="80" placeholder="e.g. Healthcare Search"></label><label>Channel<select name="channel"><option>Google Ads</option><option>Demandbase Ads</option><option>LinkedIn Ads</option><option>Meta Ads</option><option>Other</option></select></label><label>Budget available to move<input name="available" type="number" min="0" step="100" required placeholder="50000"></label><button type="submit">Add campaign</button></form></details><p class="mn-note">The preset source balances are examples from the revised scenario; the proposed destination is hypothetical. Add your own campaigns for a real plan. The pipeline rates start at synthetic assumptions of $3.2k and $5.5k per $1k moved. Edit the rates for each move. This planner saves in this browser and does not change ad accounts.</p><p class="mn-status" role="status"></p>`;
    const select = (selected, which) => `<select aria-label="${which} campaign">${campaigns.map(c => `<option value="${safe(c.id)}" ${c.id===selected?'selected':''}>${safe(c.name)} · ${safe(c.channel)}</option>`).join('')}</select>`;
    function render() {
      const maxAmount=Math.ceil(Math.max(46000,...campaigns.map(c=>c.available||0))/1000)*1000;
      card.querySelector('.mn-moves').innerHTML = moves.map((m,i) => `<div class="mn-move" data-index="${i}"><div class="mn-move-top"><strong>Move ${i+1}</strong>${i ? '<button type="button" class="mn-remove" aria-label="Remove move">Remove</button>' : ''}</div><div class="mn-move-pair"><label>From ${select(m.from,'Source')}</label><span aria-hidden="true">→</span><label>To ${select(m.to,'Destination')}</label></div><div class="mn-slider-line"><label>Amount <output>${money(m.amount)}</output></label><input type="range" min="0" max="${maxAmount}" step="1000" value="${m.amount}" aria-label="Move amount"><span>$0 — ${money(maxAmount)}</span></div><div class="mn-rates"><label>Source modeled pipeline ($k) / $1k <input type="number" min="0" max="100" step="0.1" value="${m.fromRate}" aria-label="Source modeled pipeline rate in thousands"></label><label>Destination modeled pipeline ($k) / $1k <input type="number" min="0" max="100" step="0.1" value="${m.toRate}" aria-label="Destination modeled pipeline rate in thousands"></label></div><p class="mn-move-result"></p></div>`).join('');
      card.querySelectorAll('.mn-move').forEach(row => {
        const i = Number(row.dataset.index), m = moves[i];
        const selects = row.querySelectorAll('select'), range = row.querySelector('input[type="range"]'), rates = row.querySelectorAll('.mn-rates input');
        selects[0].addEventListener('change', () => { m.from = selects[0].value; m.fromRate = campaigns.find(c=>c.id===m.from)?.rate ?? 3.2; render(); });
        selects[1].addEventListener('change', () => { m.to = selects[1].value; m.toRate = campaigns.find(c=>c.id===m.to)?.rate ?? 3.2; render(); });
        range.addEventListener('input', () => { m.amount = Number(range.value); update(); });
        rates.forEach((input,j) => input.addEventListener('input', () => { m[j?'toRate':'fromRate'] = Number(input.value) || 0; update(); }));
        row.querySelector('.mn-remove')?.addEventListener('click', () => { moves.splice(i,1); render(); });
      });
      update();
    }
    function update() {
      let sourceValue = 0, destinationValue = 0;
      const used = {};
      card.querySelectorAll('.mn-move').forEach(row => {
        const m = moves[Number(row.dataset.index)];
        const a = m.amount / 1000, before = a*m.fromRate*1000, after = a*m.toRate*1000;
        sourceValue += before; destinationValue += after;
        used[m.from] = (used[m.from] || 0) + m.amount;
        row.querySelector('output').textContent = money(m.amount);
        row.querySelector('.mn-move-result').textContent = `${money(before)} at source → ${money(after)} at destination · ${money(after-before)} modeled difference`;
        row.querySelector('input[type="range"]').style.setProperty('--mp-progress', `${m.amount/Number(row.querySelector('input[type="range"]').max)*100}%`);
      });
      const over = Object.entries(used).filter(([id,amount]) => { const c=campaigns.find(x=>x.id===id); return c && c.available && amount>c.available; });
      const unknown = Object.entries(used).filter(([id,amount]) => { const c=campaigns.find(x=>x.id===id); return c && !c.available && amount>0; });
      const same = moves.some(m=>m.from===m.to);
      card.querySelector('.mn-planner-summary').innerHTML = `<div><small>Amount planned</small><strong>${money(moves.reduce((n,m)=>n+m.amount,0))}</strong></div><div><small>At source</small><strong>${money(sourceValue)}</strong></div><div><small>At destination</small><strong>${money(destinationValue)}</strong></div><div><small>Modeled difference</small><strong>${destinationValue-sourceValue>=0?'+':''}${money(destinationValue-sourceValue)}</strong></div>`;
      card.querySelector('.mn-status').textContent = over.length ? `Over the sample balance for ${over.map(([id])=>campaigns.find(c=>c.id===id)?.name).join(', ')}. Reduce the move or update your inputs.` : unknown.length ? `No source balance is available for ${unknown.map(([id])=>campaigns.find(c=>c.id===id)?.name).join(', ')}. Add a current campaign input to plan from it.` : same ? 'A move has the same source and destination. Select a different destination.' : '';
      card.querySelector('.mn-save-plan').disabled = !!over.length || !!unknown.length || same;
    }
    card.querySelector('.mn-add-move').addEventListener('click', () => { moves.push({from:'ending',to:'proposed',amount:0,fromRate:3.2,toRate:5.5}); render(); });
    card.querySelector('.mn-save-plan').addEventListener('click', () => { write('mojo-planner-moves-v1', moves); card.querySelector('.mn-status').textContent='Plan saved in this browser for your next visit. No budget was moved.'; });
    card.querySelector('.mn-add-campaign form').addEventListener('submit', event => { event.preventDefault(); const form=event.currentTarget, data=new FormData(form); const name=String(data.get('name')).trim(); if (!name) return; const item={id:'custom-'+Date.now(),name,channel:String(data.get('channel')),available:Number(data.get('available')),rate:3.2}; campaigns.push(item); custom.push(item); write('mojo-planner-campaigns-v1',custom); form.reset(); render(); card.querySelector('.mn-status').textContent=`${name} added to this browser’s planning list.`; });
    const finding=document.querySelector('#brief-budget-risk .drowbody');
    if (finding) finding.innerHTML='<div class="mn-budget-facts"><span><strong>3</strong> ended sample flights</span><span><strong>$45,920</strong> unspent</span><a href="#budget-planner">Open planner →</a></div>';
    const pacingBody=document.querySelector('[data-finding-id="waystar-delivery"] .drowbody');
    if (pacingBody && !pacingBody.querySelector('.mn-forecast-link')) { const link=document.createElement('a'); link.className='mn-forecast-link'; link.href='Routines.html#pacing-watch'; link.textContent='Forecast an upcoming flight →'; pacingBody.append(link); }
    const trackingBody=document.querySelector('[data-finding-id="duplicate-events"] .drowbody, [data-finding-id="ga4-duplicate-events"] .drowbody');
    if (trackingBody && !trackingBody.querySelector('.mn-utm-link')) { const link=document.createElement('a'); link.className='mn-forecast-link mn-utm-link'; link.href='Routines.html#utm-checker'; link.textContent='Propose a tracking fix →'; trackingBody.append(link); }
    document.querySelector('#today-queue')?.after(card);
    render();
  }
  window.MojoInitBudgetPlanner = planner;

  function accounts() {
    const body = document.querySelector('#mojo-accounts-portfolio'); if (!body) return;
    const head=body.querySelector('.aq-head'); if (!head) return;
    head.classList.add('mn-account-head');
    const button=document.createElement('button'); button.type='button'; button.className='mn-account-button'; button.textContent='Draft follow-up'; button.setAttribute('aria-expanded','false'); button.setAttribute('aria-controls','mn-account-output');
    head.querySelector('.mc-btn')?.before(button);
    const output=document.createElement('div'); output.id='mn-account-output'; output.className='mn-paired-output mn-account-output'; output.hidden=true; head.after(output);
    button.addEventListener('click', () => {
      if (!output.hidden) { output.hidden=true; button.setAttribute('aria-expanded','false'); return; }
      output.hidden=false;
      button.setAttribute('aria-expanded','true');
      output.innerHTML='<article><small>FOR SALES</small><strong>Check the account before outreach</strong><p>Confirm its owner, opportunity stage, and current priorities. Then send a short note about the topic showing intent.</p></article><article><small>FOR PAID MEDIA</small><strong>Review a matching audience</strong><p>Check which accounts can be matched and exclude customers before adding them to a campaign.</p></article><div class="mn-paired-actions"><button type="button">Save drafts</button><span role="status"></span><small>Draft only. Nothing is sent or launched.</small></div>';
      output.querySelector('button').addEventListener('click',()=>{write('mojo-account-paired-draft-v1',{name:'Surging accounts',sales:output.querySelector('article:first-child p').textContent,paid:output.querySelector('article:nth-child(2) p').textContent,savedAt:new Date().toISOString()});output.querySelector('[role="status"]').textContent='Drafts saved in this browser.';});
    });
  }

  function pacing() {
    const host=document.querySelector('#pacing-watch .mr-detail'); if (!host) return;
    const box=document.createElement('section'); box.className='mn-tool';
    box.innerHTML='<div class="mn-eyebrow">FORECAST · 10–14 DAY WINDOW</div><h3>See underspend before a flight ends</h3><p>Use a current seven-day run rate and flight plan to forecast the ending balance.</p><div class="mn-form-grid"><label>Flight budget ($)<input type="number" min="0" value="72000"></label><label>Spent to date ($)<input type="number" min="0" value="288"></label><label>Average daily spend, last 7 days ($)<input type="number" min="0" value="41"></label><label>Days until flight ends<input type="number" min="1" value="14"></label></div><div class="mn-forecast" role="status"></div><p class="mn-note">Starts with MOF - RCM - Q126’s Oct 30 sample budget, spend and seven-day average; “14 days left” is an editable planning input, not its historical end date. Straight-line forecast only. Connect a current flight schedule and daily delivery for an operational alert.</p>';
    host.append(box);
    const inputs=[...box.querySelectorAll('input')]; const update=()=>{const [budget,spent,daily,days]=inputs.map(x=>Number(x.value)||0);const projected=Math.min(budget,spent+daily*days);const gap=Math.max(0,budget-projected);const alert=days>=10&&days<=14&&gap>budget*.1;box.querySelector('.mn-forecast').innerHTML=`<strong>${money(gap)} projected unspent</strong><span>${money(projected)} projected spend of ${money(budget)} plan · ${days} days left</span><em>${alert?'Early warning: likely to underspend. Review audience, bids, and flight intent now.':gap>budget*.1?'Underspend risk; check the flight plan.':'Within the 10% planning threshold at this run rate.'}</em>`;}; inputs.forEach(x=>x.addEventListener('input',update));update();
  }

  function creative() {
    const host=document.querySelector('#ia-panel-creative'); if (!host) return;
    const box=document.createElement('section');box.className='mn-tool';
    box.innerHTML='<div class="mn-eyebrow">NEXT STEP · CREATIVE DRAFT</div><h3>Draft replacements for approval</h3><p>Enter a product and approved message. Mojo will stage three editable copy angles.</p><div class="mn-form-grid"><label>Product or campaign<input value="Mojo Ad Campaigns"></label><label>Approved message<input value="Turn account signals into coordinated action"></label></div><button type="button">Draft 3 variants</button><div class="mn-variant-output" hidden></div><p class="mn-note">These are copy templates, not account-voice generation. A brand kit and asset-level frequency/CTR trend are needed before recommending a rotation.</p>';
    host.firstElementChild?.after(box); box.querySelector('button').addEventListener('click',()=>{const [product,message]=[...box.querySelectorAll('input')].map(x=>x.value.trim());const o=box.querySelector('.mn-variant-output');o.hidden=false;const variants=[`See what ${product} can do: ${message}.`,`Bring your team the full picture. ${message} with ${product}.`,`Make the next move clearer. ${product} helps you ${message.toLowerCase()}.`];o.innerHTML=variants.map((v,i)=>`<label>Variant ${i+1}<textarea rows="2">${safe(v)}</textarea></label>`).join('')+'<button type="button">Save draft set</button><span role="status"></span>';o.querySelector('button').addEventListener('click',()=>{write('mojo-creative-drafts-v1',[...o.querySelectorAll('textarea')].map(x=>x.value));o.querySelector('[role="status"]').textContent='Three editable drafts saved locally for approval.';});});
  }

  function utm() {
    const host=document.querySelector('#utm-checker .mr-detail');if(!host)return;
    const box=document.createElement('section');box.className='mn-tool';
    box.innerHTML='<div class="mn-eyebrow">NEXT STEP · TAG PROPOSAL</div><h3>Propose a UTM repair</h3><p>Paste a landing URL and choose the expected campaign tags. Review the exact before and after.</p><label>Landing URL<input type="url" placeholder="https://example.com/page?utm_source=..." value="https://example.com/demo?utm_source=Email&utm_medium=Paid&utm_campaign=Q4%20Launch"></label><div class="mn-form-grid"><label>Source<input value="email"></label><label>Medium<input value="paid_email"></label><label>Campaign<input value="q4_launch"></label></div><button type="button">Show proposed fix</button><div class="mn-utm-result" role="status"></div><p class="mn-note">This produces a proposed URL only. It does not edit live ads or tags.</p>';
    host.append(box);box.querySelector('button').addEventListener('click',()=>{const inputs=[...box.querySelectorAll('input')];let url;try{url=new URL(inputs[0].value);}catch{box.querySelector('.mn-utm-result').textContent='Enter a valid full URL.';return;}const before=url.toString();['utm_source','utm_medium','utm_campaign'].forEach((key,i)=>url.searchParams.set(key,inputs[i+1].value.trim().toLowerCase().replace(/\s+/g,'_')));box.querySelector('.mn-utm-result').innerHTML=`<small>BEFORE</small><code>${safe(before)}</code><small>PROPOSED</small><code>${safe(url.toString())}</code><button type="button">Copy proposed URL</button>`;box.querySelector('.mn-utm-result button').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(url.toString());box.querySelector('.mn-utm-result button').textContent='Copied';}catch{box.querySelector('.mn-utm-result button').textContent='Select the URL above to copy';}});});
  }

  function strategy() {
    const host=document.querySelector('.mc-strategy') || document.querySelector('main.canvaspane');if(!host)return;
    const box=document.createElement('section');box.className='mn-tool mn-strategy-ask';box.id='ask-strategy';
    box.innerHTML='<div><div class="mn-eyebrow">GO DEEPER</div><h2>Have a question for the leadership brief?</h2><p>Ask about spend, what is working, or what Mojo would change next.</p></div><button type="button" class="mn-open-strategy-chat">Ask Mojo in Chat →</button>';
    host.append(box);
    box.querySelector('button').addEventListener('click',()=>{
      const chat=document.querySelector('.mojo-nav-chat');
      const checkbox=document.getElementById('chatOn');
      if(checkbox&&!checkbox.checked)chat?.click();
      else if(!checkbox)document.getElementById('mc-trust-chat-toggle')?.click();
      document.querySelector('.chatpane textarea')?.focus();
    });
    const peer=document.createElement('section');peer.className='mn-tool mn-peer';peer.innerHTML='<div class="mn-eyebrow">COMPETITIVE BENCHMARKING</div><h2>Peer comparison needs a real cohort</h2><p>The six engagement checks in this sample are not a peer CPL benchmark. A comparable, anonymized benchmark needs consented customer data, consistent lead definitions, spend and outcome windows, and a cohort large enough to protect privacy.</p><div class="mn-peer-state"><strong>Peer CPL comparison unavailable</strong><span>No cross-customer matched cohort is connected.</span></div>';
    box.after(peer);
  }

  function autoApply() {
    const pageRoot=document.querySelector('.mp-page') || document.querySelector('main.canvaspane');
    const first=pageRoot?.querySelector('.mp-section');if(!first)return;
    const box=document.createElement('section');box.className='mn-tool mn-auto';
    box.innerHTML='<div class="mn-eyebrow">LOW-RISK AUTO-APPLY · RULE PREVIEW</div><h2>Define what Mojo could handle</h2><p>Test an amount against your configured transfer cap and approval threshold. Eligible changes still stay in Draft until live ad accounts, audit receipts, and rollback are connected.</p><div class="mn-form-grid"><label>Change type<select><option value="budget">Budget shift</option><option value="utm">UTM tag repair</option></select></label><label>Change amount ($)<input type="number" min="0" value="1000"></label></div><div class="mn-auto-result" role="status"></div><p class="mn-note">A live auto-apply tier requires authenticated write access, scoped permissions, preflight validation, a receipt, and a rollback path. This preview does not perform a change.</p>';
    ([...pageRoot.querySelectorAll('.mp-section')].find(section=>section.querySelector('h2')?.textContent.includes('Approval rules')) || first).after(box);
    const update=()=>{const type=box.querySelector('select').value, amount=Number(box.querySelector('input').value)||0, cap=Number(pageRoot.querySelector('#mp-autonomy-limit')?.value)||0, threshold=Number(pageRoot.querySelector('#mp-approval-threshold')?.value)||0;let rule;if(type==='utm')rule='Tag repair could qualify after exact-field validation and a reversible write are connected.';else if(amount>cap)rule=`Above the ${money(cap)} autonomous transfer cap: human review required.`;else if(amount>=threshold)rule=`At the ${money(threshold)} approval threshold: demand gen and finance review required.`;else rule=`Within the ${money(cap)} cap: eligible for future auto-apply after live safeguards are connected.`;box.querySelector('.mn-auto-result').innerHTML=`<strong>${safe(rule)}</strong><span>Current mode: Draft only · no external change</span>`;};box.querySelectorAll('input,select').forEach(x=>x.addEventListener('input',update));pageRoot.querySelectorAll('#mp-autonomy-limit,#mp-approval-threshold').forEach(x=>x.addEventListener('input',update));update();
  }
})();
