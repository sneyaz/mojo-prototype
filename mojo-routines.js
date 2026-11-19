/* Local prototype controls for the cross-product Routines roster. */
document.addEventListener('DOMContentLoaded', () => {
  const pageTitle=document.querySelector('.trust-topbar .wtitle');
  if(pageTitle)pageTitle.textContent='Routines';
  const key='mojo-routine-config-v1';
  const defaults={
    'weekly-report-writer':{on:true,cadence:'Mondays'},
    'pacing-watch':{on:true,cadence:'Every 2 hours'},
    'traffic-watch':{on:true,cadence:'Daily'},
    'tracking-integrity':{on:true,cadence:'Daily'},
    'creative-fatigue-watch':{on:true,cadence:'Weekly'},
    'utm-checker':{on:true,cadence:'Daily'},
    'spend-review':{on:true,cadence:'Monthly'},
    'account-handoff-watch':{on:false,cadence:'Daily'},
    'coverage-gap-watch':{on:false,cadence:'Daily'},
    'benchmark-watch':{on:false,cadence:'Weekly'},
    'next-best-campaign':{on:true,cadence:'Mondays'},
    'ai-referral-retargeting':{on:false,cadence:'Daily'}
  };
  const provisioned=window.MojoApps?.routines()||[];
  provisioned.forEach(routine=>{defaults[routine.id]={on:false,cadence:routine.cadence};});
  const routineAuthors={
    'weekly-report-writer':'Pam Beesly',
    'pacing-watch':'Dwight Schrute'
  };
  const defaultChannels={
    'weekly-report-writer':['Mojo','Slack'],
    'pacing-watch':['Slack'],
    'traffic-watch':['Mojo'],
    'tracking-integrity':['Email'],
    'creative-fatigue-watch':['Teams'],
    'utm-checker':['Slack'],
    'spend-review':['Email'],
    'account-handoff-watch':['Teams'],
    'coverage-gap-watch':['Mojo'],
    'benchmark-watch':['Email'],
    'next-best-campaign':['Mojo','Email'],
    'ai-referral-retargeting':['Mojo']
  };
  let saved={};
  try{const value=JSON.parse(localStorage.getItem(key)||'{}');if(value&&typeof value==='object')saved=value;}catch{}
  const state={};
  Object.entries(defaults).forEach(([id,initial])=>{const value=saved[id]||{};const fallback=defaultChannels[id]||(id.includes('aeo')||id.includes('answer')||id.includes('citation')||id.includes('claim')?['Email']:['Teams']);const custom=Array.isArray(value.channels)&&(value.channelsCustomized===true||value.channels.length!==1||value.channels[0]!=='Mojo');state[id]={mode:['on','paused','off'].includes(value.mode)?value.mode:typeof value.on==='boolean'?(value.on?'on':'off'):(initial.on?'on':'off'),cadence:typeof value.cadence==='string'?value.cadence:initial.cadence,channels:custom?value.channels.filter(channel=>['Mojo','Slack','Teams','Email'].includes(channel)):fallback,channelsCustomized:custom};});
  const persist=()=>localStorage.setItem(key,JSON.stringify(state));
  const count=()=>Object.values(state).filter(x=>x.mode==='on').length;
  const countMode=mode=>Object.values(state).filter(x=>x.mode===mode).length;

  const page=document.querySelector('.mr-page');
  if(page){
    const channelIcon=channel=>channel==='Mojo'?'<img src="assets/moj-mdot.svg?v=20261104v230" alt="">':channel==='Slack'?'<img src="assets/slack.svg" alt="">':channel==='Teams'?'<img src="assets/microsoftteams.svg" alt="">':'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></svg>';
    const channelMarkup=channels=>channels.length?channels.map(channel=>`<span class="mr-channel-chip" title="${channel}">${channelIcon(channel)}<span>${channel}</span></span>`).join(''):'<span class="mr-channel-none">No alerts</span>';
    const headActions=page.querySelector('.mr-head-actions');
    const setupButton=page.querySelector('.mr-setup-trigger');
    headActions.prepend(setupButton);
    headActions.querySelector('a').textContent='Action permissions →';
    const list=page.querySelector('.mr-list');
    page.querySelector('.mr-source')?.remove();
    list.prepend(list.querySelector('#spend-review'));
    if(!list.querySelector('#traffic-watch')){
      const row=document.createElement('details');
      row.className='mr-routine';
      row.id='traffic-watch';
      row.dataset.id='traffic-watch';
      row.dataset.area='campaigns';
      row.dataset.active='true';
      row.innerHTML='<summary><span class="mr-name"><strong>Traffic watch</strong><small>Campaigns</small></span><span class="mr-cadence">Daily</span><span class="mr-result">66% above baseline · sample</span><span class="mr-state">On</span><span class="mr-chevron" aria-hidden="true"></span></summary><div class="mr-detail"><p>Checks the Oct 30 traffic snapshot against its supplied baseline. The export does not identify which source drove the increase.</p><div class="mr-controls"><label>Cadence<select class="mr-cadence-select" aria-label="Traffic watch cadence"><option>Every 2 hours</option><option selected>Daily</option><option>Weekly</option><option>Monthly</option></select></label><button class="mr-toggle" type="button" aria-pressed="true">Pause routine</button></div><h2>Source record</h2><ol class="mr-history"><li><strong>Oct 30 sample</strong><span>Traffic was 66% above the supplied baseline. Verify channel and UTM data before attributing the change.</span></li></ol><p class="mr-detail-note">Imported observation. No live monitoring job is scheduled.</p><a class="mr-related" href="HomeSystem.html#feed-insights">Open related insight →</a></div>';
      list.querySelector('#pacing-watch')?.after(row);
    }
    if(!list.querySelector('#ai-referral-retargeting')){
      const row=document.createElement('details');
      row.className='mr-routine';row.id='ai-referral-retargeting';row.dataset.id=row.id;row.dataset.area='aeo';row.dataset.active='false';
      row.innerHTML='<summary><span class="mr-name"><strong>AI visitor to retargeting</strong><small>AEO · Audiences · Campaigns</small></span><span class="mr-cadence">Daily</span><span class="mr-result">Account match required</span><span class="mr-state">Off</span><span class="mr-chevron" aria-hidden="true"></span></summary><div class="mr-detail"><p>When an identified ICP account visits from an AI answer, add it to an AI visitors audience, then stage it for the retargeting flight after exclusions and approval.</p><div class="mr-controls"><label>Cadence<select class="mr-cadence-select" aria-label="AI visitor to retargeting cadence"><option>Every 2 hours</option><option selected>Daily</option><option>Weekly</option><option>Monthly</option></select></label><button class="mr-toggle" type="button" aria-pressed="false">Turn on routine</button></div><h2>Source record</h2><ol class="mr-history"><li><strong>Demandbase GA4 · ChatGPT / OpenAI</strong><span>3,482 referral sessions; account IDs and campaign exposure are not joined in the supplied sample.</span></li></ol><p class="mr-detail-note">This browser preview saves the routine setup only. No audience membership or ad delivery changes.</p><a class="mr-related" href="AppWorkspace.html?app=aeo#feed">Open related AEO work →</a></div>';
      list.prepend(row);
    }
    if(!list.querySelector('#next-best-campaign')){
      const row=document.createElement('details');
      row.className='mr-routine';row.id='next-best-campaign';row.dataset.id=row.id;row.dataset.area='campaigns';row.dataset.active='true';
      row.innerHTML='<summary><span class="mr-name"><strong>Next best campaign draft</strong><small>Campaigns</small></span><span class="mr-cadence">Mondays</span><span class="mr-result">Ironwood Works · 1:1 draft</span><span class="mr-state">On</span><span class="mr-chevron" aria-hidden="true"></span></summary><div class="mr-detail"><p>Each Monday, review strategic accounts stalled in their journey. Draft a focused campaign with its audience, proven creative, channels, budget cap, and success and stop rules for a person to approve.</p><div class="mr-controls"><label>Cadence<select class="mr-cadence-select" aria-label="Next best campaign draft cadence"><option>Every 2 hours</option><option>Daily</option><option>Weekly</option><option selected>Mondays</option><option>Monthly</option></select></label><button class="mr-toggle" type="button" aria-pressed="true">Pause routine</button></div><h2>Example draft</h2><ol class="mr-history"><li><strong>Ironwood Works · Evaluation</strong><span>Sample 1:1 campaign for a $707.5k opportunity with two of five buyer roles reached.</span></li></ol><p class="mr-detail-note">This routine is a browser preview. It does not schedule a live job or publish campaigns.</p><a class="mr-related" href="Strategy.html#next-campaign">Review campaign draft →</a></div>';
      list.prepend(row);
    }
    const escapeHtml=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
    let standards={};
    try{standards=JSON.parse(localStorage.getItem('mojo-mops-standards-v2')||'{}')||{};}catch{}
    const existingMeta={
      'weekly-report-writer':['revenue','report-approval'],
      'pacing-watch':['growth',null],
      'traffic-watch':['growth',null],
      'tracking-integrity':['revenue',standards.proposal?.status==='active'?'measurement':null],
      'creative-fatigue-watch':['creative',null],
      'utm-checker':['revenue',null],
      'spend-review':['growth',null],
      'account-handoff-watch':['growth',null],
      'coverage-gap-watch':['growth',null],
      'benchmark-watch':['growth',null],
      'next-best-campaign':['growth',null],
      'ai-referral-retargeting':['growth',null]
    };
    const practiceTitles={
      'report-approval':'Approve weekly reports before they go out',
      'pacing-threshold':'Review flights below 40% pacing',
      'legacy-pacing':standards.authored?.find(item=>item.id==='legacy-pacing')?.title||'Warn about underspend before a flight ends',
      measurement:standards.proposal?.title||'Define a lead before optimizing to CPA',
      'budget-review':standards.budget?.title||'Keep budget moves above $10k with finance review',
      suppression:'Exclude customers and do-not-contact accounts',
      refresh:'Refresh intent audiences every seven days',
      overlap:'Flag overlap above 35% across live audiences',
      'aeo-source-review':'Review pricing and integration pages every 30 days',
      'aeo-claim-owner':'Assign an owner to every public product claim'
    };
    provisioned.forEach(routine=>{
      const row=document.createElement('details');
      row.className='mr-routine';
      row.id=routine.id;
      row.dataset.id=routine.id;
      row.dataset.area=routine.category;
      row.dataset.appId=routine.appId;
      row.dataset.active='false';
      row.innerHTML=`<summary><span class="mr-name"><strong>${escapeHtml(routine.name)}</strong><small></small></span><span class="mr-cadence">${escapeHtml(routine.cadence)}</span><span class="mr-result">No run yet</span><span class="mr-state">Ready</span><span class="mr-chevron" aria-hidden="true"></span></summary><div class="mr-detail"><p>${escapeHtml(routine.description)}</p><div class="mr-controls"><label>Cadence<select class="mr-cadence-select" aria-label="${escapeHtml(routine.name)} cadence"><option>Every 2 hours</option><option>Daily</option><option>Weekly</option><option>Monthly</option></select></label><button class="mr-toggle" type="button" aria-pressed="false">Turn on routine</button></div><h2>Run history</h2><ol class="mr-history"><li><strong>No runs yet</strong><span>No sample run recorded.</span></li></ol><p class="mr-detail-note">Turning this on changes only this browser preview. No live job is scheduled.</p><a class="mr-related" href="AppWorkspace.html?app=${routine.appId}#feed">Open related work →</a></div>`;
      list.append(row);
    });
    page.querySelectorAll('.mr-routine').forEach(row=>{
      const meta=existingMeta[row.dataset.id];
      const routine=provisioned.find(item=>item.id===row.dataset.id);
      const category=routine?.category||meta?.[0]||'growth';
      const appId=routine?.appId||'campaigns';
      const practiceId=routine?.linkedBestPracticeId||meta?.[1];
      row.dataset.area=category;
      row.dataset.appId=appId;
      const appName=row.dataset.id==='ai-referral-retargeting'?'AEO → Audiences → Campaigns':window.MojoApps?.apps().find(app=>app.id===appId)?.name||'Campaigns';
      const subtitle=row.querySelector('.mr-name small');
      const author=routine?.author||routineAuthors[row.dataset.id]||'Mojo';
      row.dataset.author=author;
      subtitle.innerHTML=`<span class="mr-author">By ${escapeHtml(author)}</span><span class="mr-author-separator" aria-hidden="true">·</span><span>${escapeHtml(appName)} · ${escapeHtml(window.MojoApps?.categories[category]||category)}</span>`;
      if(practiceId&&practiceTitles[practiceId]){
        const link=document.createElement('a');
        link.className='mr-practice-link';
        link.href=appId==='campaigns'?`BestPractices.html#${practiceId}`:`AppWorkspace.html?app=${appId}#best-practices:${practiceId}`;
        link.textContent=`${['report-approval','pacing-threshold'].includes(practiceId)?'Enforcing':'Related practice'}: ${practiceTitles[practiceId]} →`;
        link.addEventListener('click',event=>event.stopPropagation());
        row.querySelector('.mr-name').append(link);
      }
    });
    const routineModels=[...page.querySelectorAll('.mr-routine')].map(row=>({
      id:row.dataset.id,
      name:row.querySelector('.mr-name strong').textContent,
      author:row.dataset.author,
      category:row.dataset.area,
      appId:row.dataset.appId,
      cadence:state[row.dataset.id].cadence,
      status:state[row.dataset.id].mode,
      lastResult:row.querySelector('.mr-result').textContent,
      linkedBestPracticeId:existingMeta[row.dataset.id]?.[1]||provisioned.find(item=>item.id===row.dataset.id)?.linkedBestPracticeId||null
    }));
    window.MojoRoutineModels=routineModels;
    page.querySelector('.mr-head p')?.remove();
    const areaSelect=document.createElement('select');
    areaSelect.className='mr-area-select';
    areaSelect.setAttribute('aria-label','Filter routines by area');
    areaSelect.innerHTML='<option value="all">All areas</option><option value="audience-builder">Audiences</option><option value="campaigns">Campaigns</option><option value="aeo">AEO</option>';
    const areaLabel=page.querySelector('.mr-filter-label');
    areaLabel.textContent='Area';
    areaLabel.append(areaSelect);
    page.querySelector('.mr-filters').remove();
    const filterbar=document.createElement('div');
    filterbar.className='mr-filterbar';
    const statusButtons=page.querySelector('.mr-status-filters');
    statusButtons.before(filterbar);
    filterbar.append(statusButtons,areaLabel);
    page.querySelector('.mr-setup-options').innerHTML=[...page.querySelectorAll('.mr-routine')].map(row=>`<button type="button" data-setup-routine="${row.id}"><strong>${escapeHtml(row.querySelector('.mr-name strong').textContent)}</strong><span>${escapeHtml(row.querySelector('.mr-detail>p').textContent)}</span></button>`).join('');
    let statusFilter='all';
    let areaFilter='all';
    page.querySelector('.mr-status-filters').innerHTML='<button type="button" data-status="all" aria-pressed="true">All <span data-mr-all-pill></span></button><button type="button" data-status="on" aria-pressed="false">On <span data-mr-on-pill></span></button><button type="button" data-status="paused" aria-pressed="false">Paused <span data-mr-paused-pill></span></button><button type="button" data-status="off" aria-pressed="false">Off <span data-mr-off-pill></span></button>';
    const applyFilters=()=>{
      page.querySelectorAll('.mr-routine').forEach(row=>{
        const matchesStatus=statusFilter==='all'||statusFilter===state[row.dataset.id].mode;
        row.hidden=!matchesStatus||(areaFilter!=='all'&&row.dataset.appId!==areaFilter);
      });
    };
    const sync=()=>{
      const on=count();
      const paused=countMode('paused');
      const off=countMode('off');
      page.querySelector('[data-mr-count]').textContent=`${on} on in preview`;
      const total=Object.keys(state).length;
      page.querySelector('[data-mr-off]').textContent=`${paused} paused · ${off} off`;
      page.querySelector('[data-mr-all-pill]').textContent=total;
      page.querySelector('[data-mr-on-pill]').textContent=on;
      page.querySelector('[data-mr-paused-pill]').textContent=paused;
      page.querySelector('[data-mr-off-pill]').textContent=off;
      page.querySelector('.mr-setup-intro span').textContent=on===total?'All routines are on.':'Choose a routine to review, then turn it on.';
      page.querySelectorAll('[data-setup-routine]').forEach(button=>{button.hidden=state[button.dataset.setupRoutine].mode!=='off';});
      page.querySelector('.mr-setup-trigger').hidden=false;
      page.querySelectorAll('.mr-routine').forEach(row=>{
        const cfg=state[row.dataset.id];if(!cfg)return;
        const model=routineModels.find(item=>item.id===row.dataset.id);
        if(model){model.status=cfg.mode;model.cadence=cfg.cadence;}
        row.dataset.active=String(cfg.mode==='on');
        row.dataset.mode=cfg.mode;
        row.querySelectorAll('.mr-mode button').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.mode===cfg.mode)));
        row.querySelector('.mr-cadence').textContent=cfg.cadence;
        row.querySelector('.mr-destinations-summary').innerHTML=channelMarkup(cfg.channels);
        row.querySelectorAll('.mr-channel-button').forEach(button=>button.setAttribute('aria-pressed',String(cfg.channels.includes(button.dataset.channel))));
      });
      applyFilters();
    };
    page.querySelectorAll('.mr-routine').forEach(row=>{
      const id=row.dataset.id;
      const detail=row.querySelector('.mr-detail');
      const result=row.querySelector('summary .mr-result');
      if(result){
        const latest=document.createElement('p');
        latest.className='mr-latest-result';
        latest.innerHTML='<strong>Latest result</strong> ';
        latest.append(document.createTextNode(result.textContent));
        detail.querySelector('p')?.after(latest);
        result.remove();
      }
      const stateLabel=row.querySelector('.mr-state');
      const deliverySummary=document.createElement('span');
      deliverySummary.className='mr-destinations-summary';
      deliverySummary.setAttribute('aria-label','Alert destinations');
      row.querySelector('.mr-cadence').after(deliverySummary);
      const delivery=document.createElement('div');
      delivery.className='mr-delivery';
      delivery.innerHTML=`<div><strong>Alerts</strong><span>Choose where to hear about a run that needs review.</span></div><div class="mr-channel-list" role="group" aria-label="Alert destinations"><button type="button" class="mr-channel-button" data-channel="Mojo">${channelIcon('Mojo')}<span>Mojo</span></button><button type="button" class="mr-channel-button" data-channel="Slack">${channelIcon('Slack')}<span>Slack</span></button><button type="button" class="mr-channel-button" data-channel="Teams">${channelIcon('Teams')}<span>Teams</span></button><button type="button" class="mr-channel-button" data-channel="Email">${channelIcon('Email')}<span>Email</span></button></div><small>Preview setting · no alerts are sent from this site.</small>`;
      detail.querySelector('.mr-controls').before(delivery);
      delivery.addEventListener('click',event=>{
        const button=event.target.closest('.mr-channel-button');if(!button)return;
        const channels=state[id].channels;
        state[id].channels=channels.includes(button.dataset.channel)?channels.filter(channel=>channel!==button.dataset.channel):[...channels,button.dataset.channel];
        state[id].channelsCustomized=true;
        persist();sync();
      });
      const modeControl=document.createElement('div');
      modeControl.className='mr-state mr-mode';
      modeControl.setAttribute('role','group');
      modeControl.setAttribute('aria-label',`${row.querySelector('.mr-name strong').textContent} status`);
      modeControl.innerHTML='<button type="button" data-mode="on">On</button><button type="button" data-mode="paused">Pause</button><button type="button" data-mode="off">Off</button>';
      stateLabel.replaceWith(modeControl);
      detail.querySelector('.mr-controls').innerHTML='<button type="button" class="mr-edit-with-mojo"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 11.5a8.5 8.5 0 0 1-12.3 7.6L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5Z"/></svg>Edit with Mojo</button>';
      detail.querySelector('.mr-controls').insertAdjacentHTML('afterend','<p class="mr-save-status" role="status">Changes save in this browser.</p>');
      modeControl.addEventListener('click',event=>{
        const button=event.target.closest('button[data-mode]');if(!button)return;
        event.preventDefault();
        event.stopPropagation();
        state[id].mode=button.dataset.mode;
        persist();sync();
        row.querySelector('.mr-save-status').textContent=state[id].mode==='on'?'On in this preview. No live job was scheduled.':state[id].mode==='paused'?'Paused in this preview.':'Off in this preview.';
      });
      detail.querySelector('.mr-edit-with-mojo').addEventListener('click',()=>{
        const toggle=document.querySelector('#mc-trust-chat-toggle');
        if(toggle?.getAttribute('aria-expanded')!=='true')toggle?.click();
        const chat=document.querySelector('.mc-trust-chat');
        chat?.querySelector('.mc-chat-prompts')?.setAttribute('hidden','');
        const intro=chat?.querySelector('.chat-polish-assistant p');
        if(intro)intro.textContent='Tell Mojo what you want to change about this routine.';
        const composer=document.querySelector('.chatpane textarea');
        if(composer){
          composer.value=`Help me edit the ${row.querySelector('.mr-name strong').textContent} routine. It currently runs ${state[id].cadence.toLowerCase()}. I'd like to change: `;
          composer.dispatchEvent(new Event('input',{bubbles:true}));
          composer.focus();
        }
      });
    });
    page.querySelectorAll('.mr-status-filters button').forEach(button=>button.addEventListener('click',()=>{
      statusFilter=button.dataset.status;
      page.querySelectorAll('.mr-status-filters button').forEach(x=>x.setAttribute('aria-pressed',String(x===button)));
      applyFilters();
    }));
    areaSelect.addEventListener('change',()=>{
      areaFilter=areaSelect.value;
      applyFilters();
    });
    const setup=page.querySelector('#mr-setup');
    const setupTrigger=page.querySelector('.mr-setup-trigger');
    setupTrigger?.addEventListener('click',()=>{
      setup.hidden=!setup.hidden;
      setupTrigger.setAttribute('aria-expanded',String(!setup.hidden));
      if(!setup.hidden)setup.querySelector('button')?.focus();
    });
    setup?.querySelectorAll('[data-setup-routine]').forEach(button=>button.addEventListener('click',()=>{
      statusFilter='all';areaFilter='all';
      page.querySelectorAll('.mr-status-filters button').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.status==='all')));
      areaSelect.value='all';
      applyFilters();
      const row=page.querySelector('#'+button.dataset.setupRoutine);
      if(!row)return;
      row.open=true;
      setup.hidden=true;
      setupTrigger.setAttribute('aria-expanded','false');
      history.replaceState(null,'','#'+row.id);
      row.scrollIntoView({block:'center',behavior:'smooth'});
      row.querySelector('.mr-edit-with-mojo')?.focus({preventScroll:true});
    }));
    sync();
    if(location.hash){const target=page.querySelector(location.hash);if(target){target.open=true;requestAnimationFrame(()=>target.scrollIntoView({block:'start'}));}}
  }

  const brief=document.querySelector('.brief-routine-box');
  if(brief){
    const counter=brief.querySelector(':scope > div:first-child > span:last-child');
    if(counter)counter.textContent=`${count()} on · 6 shown`;
    const ids=['weekly-report-writer','pacing-watch','tracking-integrity','creative-fatigue-watch','utm-checker','spend-review'];
    brief.querySelectorAll(':scope > .rt').forEach(row=>{
      const title=row.querySelector(':scope > div');
      const name=title?.firstChild?.textContent?.trim();
      const match=ids.find(id=>({
        'weekly-report-writer':'Weekly report writer','pacing-watch':'Flight balance review','tracking-integrity':'Tracking integrity',
        'creative-fatigue-watch':'Creative fatigue watch','utm-checker':'UTM checker','spend-review':'Demandbase spend review'
      })[id]===name);
      if(!match||!title)return;
      const link=document.createElement('a');link.className='mr-brief-link';link.href=`Routines.html#${match}`;link.textContent=name;
      title.firstChild.replaceWith(link);
      if(state[match].mode!=='on'){row.dataset.status='watching';const chip=row.querySelector(':scope > span');if(chip)chip.textContent=state[match].mode==='paused'?'Paused':'Off';}
    });
    const all=brief.querySelector(':scope > a.lnk');if(all){all.href='Routines.html';all.textContent='All routines →';}
  }

  const settings=document.querySelector('.mp-page:has(#mp-routines)');
  if(settings){
    const target=settings.querySelector('#mp-routines')?.closest('.mp-section');
    const heading=target?.querySelector('h2');if(heading)heading.textContent='Action permissions';
    const entry=document.createElement('section');entry.className='mr-entry-link';
    entry.innerHTML='<div><strong>Manage routines</strong><span>Turn individual routines on, pause them, or turn them off.</span></div><a href="Routines.html">Open all routines →</a>';
    target?.before(entry);
  }

  const apps=document.querySelector('.mojo-apps-page');
  if(apps){
    const link=apps.querySelector('.mojo-app-routines a');if(link)link.href='Routines.html';
    const status=apps.querySelector('.mojo-app-routines span');if(status)status.textContent=`${count()} on · ${countMode('paused')} paused · ${countMode('off')} off`;
  }

  const receipts=document.querySelector('#ia-panel-receipts');
  if(receipts){
    const results=[
      {id:'utm-checker',name:'UTM checker',state:'Fixed',tone:'done',summary:'Repaired 6 malformed email UTMs and mapped 16 stray tags.'},
      {id:'weekly-report-writer',name:'Weekly report writer',state:'Drafted',tone:'done',summary:'3 weekly reports are ready for review. None were sent.'},
      {id:'spend-review',name:'Spend review',state:'Filed',tone:'done',summary:'The monthly spend review is in the sample Brief.'},
      {id:'pacing-watch',name:'Pacing watch',state:'Needs review',tone:'review',summary:'Flagged 13 of 20 Q1 flights pacing below 40%.'},
      {id:'tracking-integrity',name:'Tracking integrity',state:'Needs review',tone:'review',summary:'Flagged duplicate GA4 events and a lead definition that needs confirmation.'},
      {id:'creative-fatigue-watch',name:'Creative fatigue watch',state:'Watching',tone:'watch',summary:'Checked ad groups. No asset was flagged because frequency and CTR trends are missing.'}
    ];
    receipts.innerHTML=`<div class="ia-sectionhead mr-receipts-head"><div><h2>What Mojo recorded</h2><p>Latest result from each routine in this sample.</p></div><a class="mr-receipts-link" href="Routines.html">Manage routines →</a></div><div class="mr-receipt-list" aria-label="Routine receipts">${results.map(item=>`<article class="mr-receipt-row"><div class="mr-receipt-label"><h3>${item.name}</h3><span class="mr-receipt-state" data-tone="${item.tone}">${item.state}</span></div><p>${item.summary}</p><a href="Routines.html#${item.id}" aria-label="View ${item.name} routine">View routine <span aria-hidden="true">→</span></a></article>`).join('')}</div><details class="mr-decision-trail"><summary>Spend decision trail <span>1 open decision</span></summary><ol><li><strong>Observed</strong><span>Three flights were 43–47% spent near the end of their flight. <a href="Portfolio.html#campaigns">See campaigns →</a></span></li><li><strong>Waiting for a decision</strong><span>Choose whether to extend, shift, or release the remaining funds.</span></li><li><strong>After a decision</strong><span>Review outcomes at days 14, 30, and 60. No result is claimed yet.</span></li></ol></details><p class="mr-receipt-note">Earlier runs are not included in this sample.</p>`;
  }
});
