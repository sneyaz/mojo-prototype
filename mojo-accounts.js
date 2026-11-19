/* One modeled account queue shared by Campaigns and Work. Actions remain local. */
(() => {
  const TOTAL = 1140, READY = 340, PAGE = 25;
  const actionKey = 'mojo-account-actions-v1', segmentKey = 'mojo-account-segments-v1', selectionKey = 'mojo-account-campaign-selection-v1';
  const owners = ['Alex Rivera','Morgan Lee','Priya Shah','Jordan Kim','Sam Bennett','Taylor Brooks','Casey Nguyen','Riley Chen'];
  const industries = ['Healthcare','Financial services','Technology','Manufacturing','Energy','Retail'];
  const topics = ['Competitor pricing','Patient payments','Cloud security','Revenue automation','Data integration','Enterprise analytics','Buying-group research','Compliance workflow'];
  const leadNames = ['Northstar Health','Cedar Grid','Harbor Systems','Acme Corp','Summit Financial','Maple Systems','Clearwater Health','Meridian Energy'];
  const left = ['Aster','Beacon','Bluewater','Canyon','Cascade','Cobalt','Crown','Evergreen','Granite','Horizon','Ironwood','Juniper','Keystone','Lighthouse','Mosaic','Northline','Oakmont','Pioneer','Redwood','Silverline','Stonebridge','Vantage','Westlake','Willow'];
  const right = ['Analytics','Health','Systems','Capital','Networks','Group','Labs','Energy','Logistics','Holdings','Partners','Technologies','Cloud','Industries','Works'];
  const channelPlans = [
    ['Display','Paid social'],
    ['Display'],
    ['Paid search'],
    ['Display','Paid search'],
    ['Paid social'],
    ['Display','Paid social','Paid search']
  ];
  const channelMeta = {
    'Display': {platform:'Demandbase Ads',logo:'assets/demandbase.png',icon:'<rect x="2" y="3" width="12" height="9" rx="1.5"/><path d="M6 14h4M8 12v2"/>'},
    'Paid social': {platform:'LinkedIn Ads',logo:'assets/linkedin.png',icon:'<circle cx="4" cy="5" r="1.5"/><circle cx="12" cy="5" r="1.5"/><circle cx="8" cy="12" r="1.5"/><path d="M5.3 6l1.8 4.5M10.7 6l-1.8 4.5"/>'},
    'Paid search': {platform:'Google Ads',logo:'assets/google-ads.svg',icon:'<circle cx="7" cy="7" r="4"/><path d="m10 10 4 4"/>'}
  };
  const campaignPools = {
    'Display': ['D&M_2026','Commerce/Holiday 2026','Q4FY26_CSA_Cloud_Path_Display'],
    'Paid social': ['Q4 Enterprise Pipeline'],
    'Paid search': ['GO Prep','Q4 Pipeline Search']
  };
  const campaignsFor = (channels, index) => channels.flatMap((channel, position) => {
    const pool = campaignPools[channel] || [];
    if (!pool.length) return [];
    const first = (index + position) % pool.length;
    const names = [pool[first]];
    if (pool.length > 1 && (index + position) % 4 === 0) names.push(pool[(first + 1) % pool.length]);
    return names.map(name => ({name, platform:channelMeta[channel].platform}));
  });
  const journeyStage = account => account.stage==='Proposal'?'Decision':account.stage==='Evaluation'?'Evaluation':account.stage==='Discovery'?'Consideration':account.intentStrength>=4?'Research':'Awareness';
  const logoFor = name => ({letters:name.split(/\s+/).slice(0,2).map(word=>word[0]||'').join('').toUpperCase(),tone:[...name].reduce((sum,char)=>sum+char.charCodeAt(0),0)%8});
  const money = n => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n);
  const accounts = Array.from({length:TOTAL}, (_,i) => {
    const ready = i < READY;
    const tier = ['Tier 1','Tier 1','Tier 2','Tier 2','Tier 3'][i % 5];
    const intentStrength = 5 - ((i * 7) % 4);
    const opportunityValue = ready && i % 7 !== 3 ? 70000 + ((i * 53 + Math.floor(i/11) * 17) % 88) * 7500 : 0;
    const potential = tier === 'Tier 1' ? 180000 : tier === 'Tier 2' ? 110000 : 60000;
    const stage = opportunityValue ? ['Discovery','Evaluation','Proposal'][(i * 5 + Math.floor(i/9)) % 3] : 'No open opportunity';
    const reach = !ready ? 'None' : i % 9 === 0 ? 'Partial' : i % 17 === 0 ? 'Full' : 'None';
    const surgeDays = 1 + (i * 7) % 29;
    const activityDays = 1 + (i * 11) % 21;
    const nameIndex=((i-8)*127+360)%360;
    const name = ready ? (leadNames[i] || `${left[Math.floor(nameIndex/right.length)]} ${right[nameIndex%right.length]}`) : `Unmatched Demandbase record ${String(i+1).padStart(4,'0')}`;
    const aiSource=ready&&i%9===0?{provider:'ChatGPT',method:i%18===0?'GA4 referrer':'UTM parameter',value:i%18===0?'chatgpt.com':'utm_source=chatgpt'}:null;
    const channels = ready ? channelPlans[(i*7+Math.floor(i/9))%channelPlans.length] : [];
    return {id:`acct-${String(i+1).padStart(4,'0')}`,name,ready,tier,industry:industries[(i*5+Math.floor(i/9))%industries.length],topic:topics[(i*3+Math.floor(i/8))%topics.length],intentStrength,opportunityValue,potential,stage,reach,channels,campaigns:campaignsFor(channels,i),aiSource,owner:ready?owners[(i*3+Math.floor(i/7))%owners.length]:'Needs CRM match',surgeDays,activityDays,alsoIn:ready&&i%13===1?'Cold opportunities':'',priority:(opportunityValue||potential)*intentStrength*({'Tier 1':1.5,'Tier 2':1.2,'Tier 3':1}[tier])};
  });
  function loadActions() {
    try { const stored = JSON.parse(localStorage.getItem(actionKey) || 'null'); if (stored && typeof stored === 'object') return stored; } catch {}
    const seeded = {};
    for (let i=0;i<34;i++) seeded[accounts[i].id] = {kind:'handoff',state:i===0?'meeting':i<6?'acknowledged':'awaiting',at:Date.now()-(i<32?9:3)*86400000,owner:accounts[i].owner};
    localStorage.setItem(actionKey,JSON.stringify(seeded));
    return seeded;
  }
  function metrics() {
    const values = Object.values(loadActions());
    return {handed:values.length,ack:values.filter(v=>['acknowledged','meeting'].includes(v.state)).length,meetings:values.filter(v=>v.state==='meeting').length,overdue:values.filter(v=>v.state==='awaiting' && Date.now()-v.at>=7*86400000).length};
  }
  const status = action => !action ? 'Not handed off' : action.state==='meeting' ? 'Meeting booked' : action.state==='acknowledged' ? 'Owner acknowledged' : action.kind==='slack' ? 'Slack alert pending' : action.kind==='task' ? 'Salesforce task pending' : action.kind==='campaign' ? 'Campaign add pending' : 'Handoff pending';
  function saveActions(actions) { localStorage.setItem(actionKey,JSON.stringify(actions)); window.dispatchEvent(new CustomEvent('mojo:accounts-updated')); }
  function populate(select, values, first) { select.innerHTML=''; const all=document.createElement('option'); all.value=''; all.textContent=first; select.append(all); values.forEach(value=>{const option=document.createElement('option'); option.value=value; option.textContent=value; select.append(option);}); }
  function mount(container) {
    if (!container) return;
    container.innerHTML = `<div class="aq-head"><div><h2>340 accounts to review</h2><p class="aq-truth">Demandbase found 1,140 surging accounts. The named accounts, CRM details, channels, campaign memberships, and AI source joins below are sample data.</p></div><a class="mc-btn" href="Work.html?audience=surging#create">New campaign →</a></div>
      <div class="aq-receipt"><strong id="aq-handoff-count"></strong><span>handed off</span><b>→</b><strong id="aq-ack-count"></strong><span>acknowledged</span><b>→</b><strong id="aq-meeting-count"></strong><span>meeting booked</span></div>
      <div class="aq-quick"><label class="aq-search">Search accounts<input id="aq-search" type="search" placeholder="Account, topic, owner, or AI source"></label><div class="aq-presets" role="group" aria-label="Account views"><button type="button" data-preset="ready" aria-pressed="true">Ready to hand off</button><button type="button" data-preset="ai" aria-pressed="false">AI sourced</button><button type="button" data-preset="call" aria-pressed="false">Needs your call</button><button type="button" data-preset="stalled" aria-pressed="false">Stalled handoffs</button></div><button type="button" class="aq-top-action" id="aq-top-handoff">Hand top 40 Tier 1 accounts to sales →</button></div>
      <details class="aq-advanced"><summary>Advanced filters and saved segments</summary><div class="aq-filters"><label>Journey stage<select id="aq-stage"><option value="">All stages</option><option>Awareness</option><option>Research</option><option>Consideration</option><option>Evaluation</option><option>Decision</option></select></label><label>Tier<select id="aq-tier"></select></label><label>Industry<select id="aq-industry"></select></label><label>Owner<select id="aq-owner"></select></label><label>Sort by<select id="aq-sort"><option value="priority">Priority: value × intent × tier</option><option value="opportunity">Opportunity value</option><option value="intent">Intent strength</option><option value="recent">Last activity</option><option value="company">Company A–Z</option></select></label></div>
      <div class="aq-segments"><label>Save this segment<input id="aq-segment-name" maxlength="48" placeholder="e.g. Tier 1 · Evaluation"></label><button id="aq-save-segment" type="button">Save segment</button><label>Saved segments<select id="aq-saved"><option value="">Choose a saved segment</option></select></label><span id="aq-segment-status" role="status"></span></div></details>
      <div class="aq-results"><span id="aq-result-count"></span><button id="aq-select-all" type="button">Select all matching ready accounts</button></div>
      <div class="aq-bulk" id="aq-bulk" role="toolbar" aria-label="Selected account actions" hidden><strong id="aq-selected-count"></strong><button type="button" data-mag-tray="save">Save as audience</button><div class="aq-selection-more"><button type="button" class="aq-selection-trigger" id="aq-more-trigger" aria-haspopup="menu" aria-expanded="false" aria-controls="aq-more-menu">More actions<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m4 6 4 4 4-4"/></svg></button><div class="aq-selection-menu" id="aq-more-menu" role="menu" aria-label="More account actions" hidden><span class="aq-selection-menu-label">CAMPAIGNS</span><button id="aq-add" type="button" role="menuitem">Add to Q4 Enterprise Pipeline</button><button id="aq-new" type="button" role="menuitem">Create new campaign</button><div class="aq-selection-menu-divider"></div><button type="button" role="menuitem" data-mag-tray="advertise">Build retargeting</button><button type="button" role="menuitem" data-mag-tray="answer">Check AI answers</button><button type="button" role="menuitem" data-mag-tray="watch">Watch accounts</button><div class="aq-selection-menu-divider"></div><button id="aq-slack" type="button" role="menuitem">Alert owners in Slack</button><button id="aq-task" type="button" role="menuitem">Create Salesforce tasks</button></div></div><button id="aq-clear" type="button">Clear selection</button><output role="status"></output></div>
      <div class="aq-table-wrap" role="region" aria-label="Accounts table, scroll horizontally for more columns" tabindex="0"><table class="aq-table"><thead><tr><th><input id="aq-page-select" type="checkbox" aria-label="Select page"></th><th><button data-sort="company">Account</button></th><th>Industry</th><th>Channels</th><th>AI sourced</th><th>Journey stage</th><th><button data-sort="opportunity">Opportunity</button></th><th>Status</th></tr></thead><tbody id="aq-rows"></tbody></table></div><div class="aq-pagination"><span id="aq-page-label"></span><button id="aq-prev" type="button">Previous</button><button id="aq-next" type="button">Next</button></div><p class="aq-action-status" id="aq-action-status" role="status"></p>`;
    const $ = selector => container.querySelector(selector);
    populate($('#aq-tier'),['Tier 1','Tier 2','Tier 3'],'All tiers');
    populate($('#aq-industry'),industries,'All industries');
    populate($('#aq-owner'),owners,'All owners');
    const selected = new Set(window.MojoAccountGroups?.selected() || []); let page=0, preset='ready';
    const syncSelection=()=>window.MojoAccountGroups?.setSelected([...selected]);
    const controls=['search','stage','tier','industry','owner','sort'];
    const filters=()=>Object.fromEntries(controls.map(key=>[key,$(`#aq-${key}`).value]));
    const applyFilters=()=>{const f=filters();const q=f.search.trim().toLowerCase(),actions=loadActions();let rows=accounts.filter(a=>(preset==='ready'?a.ready:preset==='ai'?a.ready&&!!a.aiSource:preset==='call'?a.ready&&a.tier==='Tier 1'&&a.reach==='None'&&a.opportunityValue>=100000:preset==='stalled'?a.ready&&actions[a.id]?.state==='awaiting'&&Date.now()-actions[a.id].at>=7*86400000:true)&&(!f.stage||journeyStage(a)===f.stage)&&(!f.tier||a.tier===f.tier)&&(!f.industry||a.industry===f.industry)&&(!f.owner||a.owner===f.owner)&&(!q||`${a.name} ${a.topic} ${a.owner} ${a.aiSource?.provider||''} ${a.aiSource?.value||''}`.toLowerCase().includes(q)));rows.sort((a,b)=>f.sort==='company'?a.name.localeCompare(b.name):f.sort==='opportunity'?b.opportunityValue-a.opportunityValue||b.priority-a.priority:f.sort==='intent'?b.intentStrength-a.intentStrength||b.priority-a.priority:f.sort==='recent'?a.activityDays-b.activityDays||b.priority-a.priority:b.priority-a.priority);return rows;};
    const render=()=>{
      const m=metrics(); const counts=[['#aq-handoff-count',m.handed],['#aq-ack-count',m.ack],['#aq-meeting-count',m.meetings]];counts.forEach(([selector,value])=>{const el=$(selector);if(el)el.textContent=value;});
      const rows=applyFilters(); const pages=Math.max(1,Math.ceil(rows.length/PAGE)); page=Math.min(page,pages-1); const visible=rows.slice(page*PAGE,(page+1)*PAGE);
      $('#aq-result-count').textContent=`${rows.length.toLocaleString()} matching · ${READY} of ${TOTAL.toLocaleString()} ready to act`;
      $('#aq-select-all').textContent=`Select all ${rows.filter(a=>a.ready).length} matching ready accounts`;
      const body=$('#aq-rows'); body.innerHTML=''; const actions=loadActions();
      visible.forEach(a=>{
        const tr=document.createElement('tr'); if(!a.ready)tr.className='aq-unmatched';
        const check=document.createElement('input');check.type='checkbox';check.dataset.account=a.id;check.checked=selected.has(a.id);check.disabled=!a.ready;check.setAttribute('aria-label',`Select ${a.name}`);
        const first=document.createElement('td');first.append(check);tr.append(first);
        const nameCell=document.createElement('td');const identity=document.createElement('div');identity.className='aq-account-identity';const logo=document.createElement('span');const logoMeta=logoFor(a.name);logo.className=`aq-account-logo aq-account-logo-${logoMeta.tone}`;logo.textContent=logoMeta.letters;logo.setAttribute('aria-hidden','true');const identityCopy=document.createElement('span');const button=document.createElement('button');button.type='button';button.className='aq-account-story';button.dataset.magAccount=a.id;button.textContent=a.name;identityCopy.append(button);const count=document.createElement('small');count.className='aq-campaign-count';count.textContent=`${a.campaigns.length} ${a.campaigns.length===1?'campaign':'campaigns'}`;identityCopy.append(count);if(a.alsoIn){const small=document.createElement('small');small.textContent=`Also in: ${a.alsoIn}`;identityCopy.append(small);}identity.append(logo,identityCopy);nameCell.append(identity);tr.append(nameCell);
        const industryCell=document.createElement('td');industryCell.className='aq-industry-cell';industryCell.textContent=a.industry;tr.append(industryCell);
        const deliveryCell=document.createElement('td');deliveryCell.className='aq-delivery-cell';const deliveryList=document.createElement('span');deliveryList.className='aq-delivery-list';a.channels.forEach(channel=>{const meta=channelMeta[channel];if(!meta)return;const item=document.createElement('span');item.className='aq-delivery-item';item.title=`${meta.platform} · ${channel}`;item.setAttribute('aria-label',`${meta.platform} · ${channel}`);const logo=document.createElement('img');logo.src=meta.logo;logo.alt='';logo.setAttribute('aria-hidden','true');const name=document.createElement('span');name.textContent=channel;item.append(logo,name);deliveryList.append(item);});if(!a.channels.length)deliveryList.textContent='—';deliveryCell.append(deliveryList);tr.append(deliveryCell);
        const aiCell=document.createElement('td');aiCell.className='aq-ai-cell';if(a.aiSource){const source=document.createElement('strong');source.textContent=a.aiSource.provider;const method=document.createElement('small');method.textContent=a.aiSource.method;aiCell.title=`${a.aiSource.method}: ${a.aiSource.value}`;aiCell.append(source,method);}else{aiCell.textContent='—';aiCell.setAttribute('aria-label','No AI source recorded');}tr.append(aiCell);
        [journeyStage(a),a.opportunityValue?money(a.opportunityValue):a.ready?'No open opportunity':'CRM match needed'].forEach((value,index)=>{const td=document.createElement('td');if(index===0)td.className='aq-journey-cell';td.textContent=value;tr.append(td);});
        const last=document.createElement('td');const line=document.createElement('span');line.textContent=a.ready?status(actions[a.id]):'Needs CRM match';last.append(line);
        if(a.ready&&actions[a.id]){const outcome=document.createElement('select');outcome.dataset.outcome=a.id;outcome.setAttribute('aria-label',`Record outcome for ${a.name}`);[['','Record outcome'],['acknowledged','Owner acknowledged'],['meeting','Meeting booked']].forEach(([value,label])=>{const option=document.createElement('option');option.value=value;option.textContent=label;outcome.append(option);});last.append(outcome);}tr.append(last);body.append(tr);
      });
      $('#aq-page-label').textContent=rows.length?`Showing ${page*PAGE+1}–${Math.min((page+1)*PAGE,rows.length)} of ${rows.length.toLocaleString()}`:'No accounts match these filters';
      $('#aq-prev').disabled=page===0;$('#aq-next').disabled=page>=pages-1;
      $('#aq-page-select').checked=visible.length>0&&visible.filter(a=>a.ready).every(a=>selected.has(a.id));
      $('#aq-bulk').hidden=selected.size===0;$('#aq-selected-count').textContent=`${selected.size} selected`;
    };
    const update=()=>{page=0;render();};
    container.querySelectorAll('[data-preset]').forEach(button=>button.addEventListener('click',()=>{preset=button.dataset.preset;container.querySelectorAll('[data-preset]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));update();}));
    controls.forEach(key=>{const element=$(`#aq-${key}`);element.addEventListener(key==='search'?'input':'change',update);});
    container.querySelectorAll('[data-sort]').forEach(button=>button.addEventListener('click',()=>{$('#aq-sort').value=button.dataset.sort;update();}));
    $('#aq-rows').addEventListener('change',event=>{
      const target=event.target;if(target.dataset.account){target.checked?selected.add(target.dataset.account):selected.delete(target.dataset.account);syncSelection();render();}
      if(target.dataset.outcome){const actions=loadActions();const current=actions[target.dataset.outcome];if(current&&target.value){current.state=target.value;current.updatedAt=Date.now();saveActions(actions);render();}}
    });
    $('#aq-page-select').addEventListener('change',event=>{applyFilters().slice(page*PAGE,(page+1)*PAGE).filter(a=>a.ready).forEach(a=>event.target.checked?selected.add(a.id):selected.delete(a.id));syncSelection();render();});
    $('#aq-select-all').addEventListener('click',()=>{applyFilters().filter(a=>a.ready).forEach(a=>selected.add(a.id));syncSelection();render();});
    $('#aq-clear').addEventListener('click',()=>{selected.clear();syncSelection();render();});
    const moreTrigger=$('#aq-more-trigger'), moreMenu=$('#aq-more-menu');
    const closeMore=(restoreFocus=false)=>{moreMenu.hidden=true;moreTrigger.setAttribute('aria-expanded','false');if(restoreFocus)moreTrigger.focus();};
    moreTrigger.addEventListener('click',()=>{const opening=moreMenu.hidden;moreMenu.hidden=!opening;moreTrigger.setAttribute('aria-expanded',String(opening));if(opening)moreMenu.querySelector('[role="menuitem"]')?.focus();});
    document.addEventListener('pointerdown',event=>{if(!event.target.closest('.aq-selection-more'))closeMore();});
    moreMenu.addEventListener('click',event=>{if(event.target.closest('[role="menuitem"]'))closeMore();});
    container.addEventListener('keydown',event=>{if(moreMenu.hidden)return;if(event.key==='Escape'){event.preventDefault();closeMore(true);}else if(['ArrowDown','ArrowUp'].includes(event.key)){const focusable=[...moreMenu.querySelectorAll('[role="menuitem"]')];const current=focusable.indexOf(document.activeElement);const direction=event.key==='ArrowDown'?1:-1;focusable[(current+direction+focusable.length)%focusable.length]?.focus();event.preventDefault();}});
    $('#aq-prev').addEventListener('click',()=>{page--;render();});$('#aq-next').addEventListener('click',()=>{page++;render();});
    const saveSegment=()=>{const name=$('#aq-segment-name').value.trim();if(!name){$('#aq-segment-status').textContent='Name the segment first.';return;}let segments=[];try{segments=JSON.parse(localStorage.getItem(segmentKey)||'[]')}catch{}segments=segments.filter(s=>s.name!==name);segments.unshift({name,filters:filters()});localStorage.setItem(segmentKey,JSON.stringify(segments.slice(0,12)));$('#aq-segment-status').textContent=`${name} saved in this browser.`;refreshSegments();};
    const refreshSegments=()=>{let segments=[];try{segments=JSON.parse(localStorage.getItem(segmentKey)||'[]')}catch{}populate($('#aq-saved'),segments.map(s=>s.name),'Choose a saved segment');};
    $('#aq-save-segment').addEventListener('click',saveSegment);$('#aq-saved').addEventListener('change',()=>{let segments=[];try{segments=JSON.parse(localStorage.getItem(segmentKey)||'[]')}catch{}const segment=segments.find(s=>s.name===$('#aq-saved').value);if(!segment)return;controls.forEach(key=>{$(`#aq-${key}`).value=segment.filters[key]||'';});update();$('#aq-segment-status').textContent=`${segment.name} loaded.`;});refreshSegments();
    const stage=(kind)=>{const ids=[...selected];if(!ids.length)return;const chosen=accounts.filter(a=>selected.has(a.id));if(kind==='new'){localStorage.setItem(selectionKey,JSON.stringify({ids,names:chosen.map(a=>a.name),filters:filters(),at:Date.now()}));location.href='Work.html?audience=selected#create';return;}const actions=loadActions();chosen.forEach(a=>{actions[a.id]={kind,state:'awaiting',at:Date.now(),owner:a.owner};});saveActions(actions);$('#aq-action-status').textContent=`${ids.length} ${kind==='campaign'?'campaign additions':kind==='slack'?'owner alerts':kind==='handoff'?'sales handoffs':'Salesforce tasks'} staged locally. No platform, Slack or CRM write occurred.`;selected.clear();render();};
    $('#aq-top-handoff').addEventListener('click',()=>{const actions=loadActions();const top=accounts.filter(a=>a.ready&&a.tier==='Tier 1'&&a.reach==='None'&&!actions[a.id]).sort((a,b)=>b.priority-a.priority).slice(0,40);top.forEach(a=>selected.add(a.id));stage('handoff');if(!top.length)$('#aq-action-status').textContent='All matching Tier 1 accounts already have a recorded handoff.';});
    $('#aq-add').addEventListener('click',()=>stage('campaign'));
    $('#aq-new').addEventListener('click',()=>stage('new'));
    $('#aq-slack').addEventListener('click',()=>stage('slack'));$('#aq-task').addEventListener('click',()=>stage('task'));
    window.addEventListener('mojo:accounts-updated',render);
    window.addEventListener('mojo:selection-updated',()=>{selected.clear();(window.MojoAccountGroups?.selected()||[]).forEach(id=>selected.add(id));render();});render();
  }
  function mountFollowUp(container) {
    if(!container)return;const note=document.createElement('div');note.className='aq-followup';note.innerHTML=`<div class="aq-followup-copy"><strong></strong>${container.closest('.ia-work')?'':'<span>Modeled queue · unacknowledged for 7+ days</span>'}</div><a href="Work.html#handoffs">Review handoffs →</a>`;container.prepend(note);
    const update=()=>{const m=metrics();note.hidden=m.overdue===0;note.querySelector('strong').textContent=`${m.overdue} ${m.overdue===1?'handoff needs':'handoffs need'} a sales reply`;
      const briefTab=document.querySelector('#brief-tab-needs');if(briefTab){briefTab.querySelector('.mojo-tab-count').textContent=String(6+(m.overdue>0?1:0));briefTab.setAttribute('aria-label',`Needs you, ${6+(m.overdue>0?1:0)} items`);}
      const briefMetric=document.querySelector('.brief-triage-grid .hcard:first-child .v');if(briefMetric)briefMetric.textContent=String(6+(m.overdue>0?1:0));
      const workCount=document.querySelector('.ia-work [data-work-tab="decisions"] span');if(workCount)workCount.textContent=String(6+(m.overdue>0?1:0));
    };
    window.addEventListener('mojo:accounts-updated',update);update();
  }
  window.MojoAccounts={mount,mountFollowUp,metrics,get:id=>accounts.find(account=>account.id===id),list:()=>accounts.filter(account=>account.ready)};
  document.addEventListener('DOMContentLoaded',()=>{const last=location.pathname.split('/').pop();if(['HomeSystem','HomeSystem.html','index.html',''].includes(last)){const target=document.querySelector('#brief-view-needs');if(target)mountFollowUp(target);}});
})();
