/* Quiet, reversible feedback for expanded feed items. */
(() => {
  if(!/^(HomeSystem|index)(\.html)?$/.test(location.pathname.split('/').pop()||'index'))return;
  const storagePrefix='mojo-feed-feedback-v1:';
  const escape=value=>String(value||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const icon=up=>up?'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10v11H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3Zm0 0 5-8a2 2 0 0 1 3 2v5h5a2 2 0 0 1 2 2l-1 8a2 2 0 0 1-2 2H7"/></svg>':'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 14V3H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3Zm0 0 5 8a2 2 0 0 0 3-2v-5h5a2 2 0 0 0 2-2l-1-8a2 2 0 0 0-2-2H7"/></svg>';
  const insightDetails={
    'flight-allocation':{evidence:'Three Q3 flights ended with $45,920 in budget left between them.',check:'Confirm final results, then use the strongest audience and message to plan the next campaign.',source:'Campaign results · Q3'},
    'q4-pacing':{evidence:'Nine of 22 Q4 scenario flights are below 40% pacing.',check:'Compare each flight with its planned spend curve and active dates.',source:'Revised campaign scenario · supplied Nov 3'},
    'q1-pacing':{evidence:'The Oct 30 export shows 13 of 20 flights below 40% pacing. It is a snapshot, not a forecast.',check:'Review flight dates, audience size, and delivery settings before moving spend.',source:'Q1 flight set · Oct 30 sample'},
    'traffic-spike':{evidence:'The supplied monitoring result shows traffic 66% above its recent baseline. This is a sample observation.',check:'Inspect referral sources and campaign tags before treating the spike as paid growth.',source:'Traffic watch · Oct 30 sample'},
    engagement:{evidence:'The six checks measure account engagement. They do not measure pipeline.',check:'Pipeline lift needs a CRM comparison before it can be claimed.',source:'Demandbase sample'},
    'account-gap':{evidence:'The gap compares surging accounts with campaign reach. It does not establish CRM qualification.',check:'Confirm CRM matches, ownership, and audience eligibility before outreach.',source:'Demandbase cohort · sample data'},
    measurement:{evidence:'The GA4 sample contains two events that may represent the same conversion.',check:'Confirm which event represents a lead before using CPA to make budget decisions.',source:'GA4 sample'},
    unreached:{evidence:'5,312 of 6,400 target accounts were reached (83%). A separate planning example splits the remaining 1,088 into 412 with no DSP match, 391 with low match rates, and 285 suppressed.',check:'Verify the 803 possible match issues at account level. Confirm whether the 285 suppressions are intentional; the aggregate export does not show their causes.',source:'Revised campaign scenario and separate planning breakdown · supplied Nov 3'},
    'weekly-efficiency':{evidence:'The control-room digest compares Oct 27–Nov 2 with the prior seven days: spend about $14,748 versus $15,685, conversions 21 versus 16, and cost per conversion about $702 versus $980.',check:'Confirm which platform events count as conversions and which count as qualified leads.',source:'Campaign Control Room digest · Nov 3'},
    'cpa-target':{evidence:'Make mo money recorded 11 versus 7.5 platform conversions in the latest full week; Google Ads cost per conversion was about $188 against a $9 target.',check:'Confirm the target and whether platform conversions represent leads before judging efficiency.',source:'Campaign Control Room digest · Nov 3'},
    'unassigned-utms':{evidence:'The Nov 3 Campaign Control Room digest reports 16 unassigned paid-looking UTMs and 2,222 sessions in the last seven days.',check:'Map each tag to a campaign group and verify its source before crediting conversions.',source:'Campaign Control Room digest · Nov 3'},
    'ended-live':{evidence:'The Nov 3 digest says three groups ended Oct 31 with 47–53% of budget spent, yet were still marked live with spend rows continuing.',check:'Verify status, dates, and spend in the ad platforms before reallocating.',source:'Campaign Control Room digest · Nov 3'},
    lifted:{evidence:'604 accounts were marked lifted, 11.37% of the 5,312 reached accounts.',check:'Confirm Demandbase lift methodology and use a comparison group before claiming incremental pipeline.',source:'Revised campaign scenario · supplied Nov 3'},
    'customer-campaign':{evidence:'Customer DBAI Try-It: $32,000 scenario spend, 2,921,818 impressions, 3,214 clicks, 612 reached and 188 lifted accounts.',check:'Inspect account mix and landing-page engagement before scaling.',source:'Revised campaign scenario · supplied Nov 3'},
    'ctv-measure':{evidence:'Five CTV scenario rows sum to $21,640 spend, 721,333 impressions, and nine clicks.',check:'Compare reach and lift; click rate alone is a weak measure for CTV.',source:'Revised campaign scenario · supplied Nov 3'},
    'influence-gap':{evidence:'The revised scenario reports 214 opportunities, 37 won, and $0 attributable pipeline.',check:'Join account IDs, impression and opportunity dates, and account spend before calculating influenced outcomes.',source:'Revised campaign scenario · supplied Nov 3'}
  };
  const insightDetail=(item)=>{
    const id=item.dataset.findingId||'measurement';
    const detail=insightDetails[id];
    if(!detail)return '';
    return `<div class="mf-insight-detail"><dl><div><dt>Evidence</dt><dd>${escape(detail.evidence)}</dd></div><div><dt>To verify</dt><dd>${escape(detail.check)}</dd></div></dl><div class="mf-insight-source">${escape(detail.source)}</div></div>`;
  };
  const read=key=>{try{return JSON.parse(localStorage.getItem(storagePrefix+key)||'{}')||{};}catch{return {};}};
  const write=(key,value)=>localStorage.setItem(storagePrefix+key,JSON.stringify(value));
  const keyFor=(type,item,index)=>{
    const id=item.dataset.findingId||item.id||item.querySelector('h2,.headline,strong')?.textContent?.trim()||String(index);
    return `${type}:${id.toLowerCase().replace(/\s+/g,'-')}`;
  };
  const labelFor=item=>item.querySelector('h2,.headline,strong')?.textContent?.trim()||'Feed item';
  const routineStorageKey='mojo-routine-config-v1';
  const routineDefaults={'utm-checker':true,'weekly-report-writer':true,'creative-fatigue-watch':true};
  const receiptDetails={
    'utm-repair':{result:'Six malformed email UTMs were recorded as repaired in the supplied sample.',scope:'6 email links · sample tracking export',routine:'UTM checker',routineId:'utm-checker',next:'Review tracking rules',nextHref:'Routines.html#utm-checker'},
    'tag-mapping':{result:'Sixteen stray campaign tags were mapped to the sample taxonomy.',scope:'16 tags · sample tracking export',routine:'UTM checker',routineId:'utm-checker',next:'Review tracking rules',nextHref:'Routines.html#utm-checker'},
    'weekly-reports':{result:'Three weekly reports were drafted for a person to review. None were sent.',scope:'3 drafts · latest sample week',routine:'Weekly report writer',routineId:'weekly-report-writer',next:'Review the drafts',nextHref:'HomeSystem.html#queue-reports'},
    'approved-report':{result:'A weekly report was approved in this browser. It was not sent.',scope:'1 report · local approval record',routine:'Weekly report writer',routineId:'weekly-report-writer',next:'Review weekly reports',nextHref:'HomeSystem.html#queue-reports'},
    'creative-refresh':{result:'Mojo drafted a new ad concept to test against the lower-performing creative. It is ready for review.',scope:'1 creative test · review before launch',routine:'Creative fatigue watch',routineId:'creative-fatigue-watch',next:'Review creative',nextHref:'Portfolio.html#campaign=2026-Q4-EMEA-TAL-ABX&tab=creatives'}
  };
  const readRoutine=id=>{try{const stored=JSON.parse(localStorage.getItem(routineStorageKey)||'{}');return typeof stored[id]?.on==='boolean'?stored[id].on:routineDefaults[id]??false;}catch{return routineDefaults[id]??false;}};
  const setRoutine=(id,on)=>{let stored={};try{stored=JSON.parse(localStorage.getItem(routineStorageKey)||'{}')||{};}catch{}stored[id]={...(stored[id]||{}),on};localStorage.setItem(routineStorageKey,JSON.stringify(stored));};
  const receiptDetail=item=>{
    const detail=receiptDetails[item.dataset.receiptId];
    if(!detail)return '<p>Sample or local record. No live ad account was changed.</p>';
    return `<div class="mf-receipt-facts"><div><span>What happened</span><p>${escape(detail.result)}</p></div><div><span>Scope</span><p>${escape(detail.scope)}</p></div></div><div class="mf-receipt-actions"><div class="mf-receipt-routine"><span>Routine</span><b>${escape(detail.routine)}</b></div><div class="mf-receipt-controls"><button type="button" data-mf-routine-toggle="${detail.routineId}" role="switch"></button><a href="Routines.html#${detail.routineId}">Edit routine →</a>${!detail.nextHref.startsWith('Routines.html')?`<a href="${detail.nextHref}">${escape(detail.next)} →</a>`:''}</div></div><output class="mf-routine-message" role="status"></output>`;
  };
  const syncRoutineControls=panel=>{const button=panel.querySelector('[data-mf-routine-toggle]');if(!button)return;const on=readRoutine(button.dataset.mfRoutineToggle);const name=receiptDetails[panel.closest('[data-receipt-id]')?.dataset.receiptId]?.routine||'routine';button.innerHTML=`<span class="mf-switch-track" aria-hidden="true"></span><span class="mf-switch-state">${on?'On':'Paused'}</span>`;button.setAttribute('aria-checked',String(on));button.setAttribute('aria-label',`${on?'Pause':'Turn on'} ${name}`);button.title=`${on?'Pause':'Turn on'} ${name}`;};
  const toolbar=key=>{
    const state=read(key);
    const bar=document.createElement('div');
    bar.className='mf-feedback';
    bar.setAttribute('role','group');
    bar.setAttribute('aria-label','Feedback on this item');
    bar.innerHTML=`<span>Was this useful?</span><button type="button" data-mf-feedback="up" aria-label="Helpful" aria-pressed="${state.vote==='up'}">${icon(true)}</button><button type="button" data-mf-feedback="down" aria-label="Not helpful" aria-pressed="${state.vote==='down'}">${icon(false)}</button><button type="button" class="mf-feedback-ignore" data-mf-feedback="ignore"><span aria-hidden="true">×</span> Ignore this</button><output aria-live="polite">${state.vote?'Noted':''}</output>`;
    return bar;
  };
  const ignore=(item,key)=>{
    if(item.nextElementSibling?.dataset.mfIgnoredKey===key)return;
    const row=document.createElement(item.tagName==='LI'?'li':'div');
    row.className='mf-ignored-row';
    row.dataset.mfIgnoredKey=key;
    row.innerHTML=`<span>Ignored: ${escape(labelFor(item))}</span><button type="button" data-mf-feedback="undo">Undo</button>`;
    item.hidden=true;
    item.after(row);
  };
  const bind=(item,type,index)=>{
    if(item.dataset.mfFeedbackKey)return;
    const key=keyFor(type,item,index);
    item.dataset.mfFeedbackKey=key;
    item.classList.add('mf-feedback-item');
    if(type==='insight'){
      item.append(toolbar(key));
    }else if(type==='decision'){
      const body=item.querySelector(':scope > .drowbody, :scope > .today-handoff-body');
      body?.append(toolbar(key));
    }else if(type==='receipt'){
      const button=document.createElement('button');
      button.type='button';
      button.className='mf-receipt-expand';
      button.setAttribute('aria-expanded','false');
      button.innerHTML='<span>Details</span><svg class="mf-detail-caret" viewBox="0 0 12 12" aria-hidden="true"><path d="m2.5 4.5 3.5 3 3.5-3"/></svg>';
      const panel=document.createElement('div');
      panel.className='mf-receipt-detail';
      panel.hidden=true;
      panel.innerHTML=receiptDetail(item);
      panel.append(toolbar(key));
      item.append(button,panel);
      syncRoutineControls(panel);
      button.addEventListener('click',()=>{panel.hidden=!panel.hidden;button.setAttribute('aria-expanded',String(!panel.hidden));syncRoutineControls(panel);});
    }
    if(read(key).ignored)ignore(item,key);
  };
  const init=shell=>{
    const sync=()=>{
      shell.querySelectorAll('#mf-insights .mf-story').forEach((item,index)=>bind(item,'insight',index));
      shell.querySelectorAll('#mf-decisions details.drow,#mf-decisions details.today-handoff-row').forEach((item,index)=>bind(item,'decision',index));
      shell.querySelectorAll('#mf-receipts .brief-done-list > li:not(.mf-ignored-row)').forEach((item,index)=>bind(item,'receipt',index));
    };
    sync();
    new MutationObserver(sync).observe(shell,{childList:true,subtree:true});
    shell.addEventListener('click',event=>{
      const routineButton=event.target.closest('[data-mf-routine-toggle]');
      if(routineButton){
        const id=routineButton.dataset.mfRoutineToggle;
        const on=!readRoutine(id);
        setRoutine(id,on);
        shell.querySelectorAll(`[data-mf-routine-toggle="${id}"]`).forEach(control=>{syncRoutineControls(control.closest('.mf-receipt-detail'));control.closest('.mf-receipt-detail').querySelector('.mf-routine-message').textContent=on?'Routine on in this browser preview.':'Routine paused in this browser preview.';});
        return;
      }
      const button=event.target.closest('[data-mf-feedback]');
      if(!button)return;
      const action=button.dataset.mfFeedback;
      if(action==='undo'){
        const row=button.closest('.mf-ignored-row');
        const item=row?.previousElementSibling;
        if(item){const key=item.dataset.mfFeedbackKey;write(key,{...read(key),ignored:false});item.hidden=false;row.remove();}
        return;
      }
      const item=button.closest('.mf-feedback-item');
      if(!item)return;
      const key=item.dataset.mfFeedbackKey;
      const state=read(key);
      if(action==='ignore'){write(key,{...state,ignored:true});ignore(item,key);return;}
      state.vote=state.vote===action?'':action;
      write(key,state);
      item.querySelectorAll('.mf-feedback [data-mf-feedback="up"],.mf-feedback [data-mf-feedback="down"]').forEach(control=>control.setAttribute('aria-pressed',String(control.dataset.mfFeedback===state.vote)));
      const status=item.querySelector('.mf-feedback output');
      if(status)status.textContent=state.vote?'Noted':'';
    });
  };
  const start=()=>{
    const shell=document.querySelector('.mf-shell');
    if(!shell)return false;
    init(shell);
    return true;
  };
  if(!start()){
    const observer=new MutationObserver(()=>{if(start())observer.disconnect();});
    observer.observe(document.body,{childList:true,subtree:true});
  }
})();
