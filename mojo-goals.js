/* Campaign goals are a planning layer. Campaign reach can overlap, so rows are not summed. */
document.addEventListener('DOMContentLoaded', () => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(() => {
  const root=document.querySelector('.ia-portfolio');
  const panel=root?.querySelector('#ia-panel-goals');
  const table=root?.querySelector('.md-omni-table');
  if(!root||!panel||!table)return;
  const key='mojo-campaign-goals-v1';
  const defaults={
    goals:[
      {id:'visibility',initiative:'Q4 net-new pipeline',title:'Create qualified pipeline from net-new accounts',metric:'Ads Served',current:null,target:1200000,period:'Q4',source:'Reported ad impressions',tone:'blue'},
      {id:'expansion',initiative:'Customer Growth',title:'Open expansion opportunities in existing customers',metric:'Expansion Opportunities',current:null,target:null,period:'Q4',source:'No campaign-level expansion opportunities yet',tone:'orange'},
      {id:'coverage',initiative:'Event Demand Generation',title:'Turn event interest into qualified engagement',metric:'Conversions',current:null,target:null,period:'Q4',source:'No campaign conversions available yet',tone:'purple'},
      {id:'acceleration',initiative:'Buying-Group Coverage',title:'Reach missing buyers and create meetings',metric:'Meetings Set',current:null,target:null,period:'Q4',source:'No campaign-level meeting data yet',tone:'purple'}
    ],
    assignments:{'GO Prep':'visibility','MOF — Patient Payments':'visibility','2026-Q4-eBook-ConnectedGTM':'visibility','2026-Q4-CTV-ICP-Roku':'visibility','2026-Q4-EMEA-Benelux':'visibility','Q4 Enterprise Pipeline':'coverage','Q4 Pipeline Search':'visibility','2026-Q4-EMEA-TAL-ABX':'coverage','2026-Q4-ENT-TAL-NA-ABX':'coverage','2026-Q4-HC-ICP-NA-Display':'coverage','2026-Q4-MFG-TAL-NA-ABX':'coverage','Enterprise Retargeting':'visibility','2026-Q4-Retargeting-Pricing-Page':'acceleration','2026-Q4-SEM-ICP-NA-AI':'acceleration','2026-Q4-SEM-ICP-EMEA-AI':'acceleration','2026-Q4-SEM-TAL-EMEA-Unified':'acceleration','2026-Q4-Customer-TryIt-NA':'expansion','2026-Q4-MM-All-NA':'expansion','2026-Q4-MM-All-EMEA':'expansion','2026-Q4-ENT-ICP-EMEA-Unified':'expansion'}
  };
  let state;
  try{const saved=JSON.parse(localStorage.getItem(key)||'null');state=saved?.goals&&saved?.assignments?saved:structuredClone(defaults);}catch{state=structuredClone(defaults);}
  if(state.schema!==8){
    const byId=new Map(state.goals.map(goal=>[goal.id,goal]));
    const oldTargets={visibility:1200,coverage:3500,acceleration:2000,expansion:5000};
    state.goals=defaults.goals.map(goal=>{
      const saved=byId.get(goal.id);
      if(!saved)return goal;
      const oldTarget=Number(saved.target)===oldTargets[goal.id];
      const metricChanged=saved.metric!==goal.metric;
      const legacyTitle=['Brand','Demand','Land','Expand'].includes(saved.title);
      const generic=['Brand','Demand','Land','Expand'].includes(saved.initiative);
      return {...goal,...saved,title:legacyTitle?goal.title:saved.title||goal.title,initiative:generic?goal.initiative:saved.initiative||goal.initiative,metric:goal.metric,source:goal.source,target:oldTarget||metricChanged?goal.target:saved.target};
    }).concat(state.goals.filter(goal=>!defaults.goals.some(item=>item.id===goal.id)));
    for(const [name,id] of Object.entries(defaults.assignments))if(!state.assignments[name])state.assignments[name]=id;
    state.schema=8;
    localStorage.setItem(key,JSON.stringify(state));
  }
  try {
    const review=JSON.parse(localStorage.getItem('mojo-initiative-review-v1')||'null');
    if(review?.confirmed&&Array.isArray(review.goals)){
      state.goals=state.goals.map(goal=>{const suggestion=review.goals.find(item=>item.id===goal.id);return {...goal,...suggestion,initiative:['Brand','Demand','Land','Expand'].includes(suggestion?.initiative)?goal.initiative:suggestion?.initiative||goal.initiative,title:['Reach the right target accounts','Increase qualified engagement','Turn buying-group engagement into meetings','Open customer expansion opportunities'].includes(suggestion?.title)?goal.title:suggestion?.title||goal.title}});
      state.groupingLabel=review.label||'Initiatives';
      localStorage.setItem(key,JSON.stringify(state));
    }
  } catch {}
  for(const name of ['Q4 Pipeline Search','Enterprise Retargeting'])state.assignments[name]='visibility';
  const groupingLabel=()=>state.groupingLabel||'Initiatives';
  // An older prototype stored answer-count targets on the Brand initiative.
  // Those values cannot be used after its measure became Ads Served.
  const brandGoal=state.goals.find(goal=>goal.id==='visibility');
  if(brandGoal?.metric==='Ads Served'&&Number(brandGoal.target)<1000){
    brandGoal.target=defaults.goals[0].target;
    localStorage.setItem(key,JSON.stringify(state));
  }
  const save=()=>localStorage.setItem(key,JSON.stringify(state));
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const icons={'Google Ads':'assets/google-ads.svg','Demandbase Ads':'assets/demandbase.png','LinkedIn Ads':'assets/linkedin.png'};
  const connections=()=>{let extras={};try{extras=JSON.parse(localStorage.getItem('mojo-board-extra-connections-v1')||'{}')||{};}catch{}const firstRun=localStorage.getItem('mojo-board-demandbase-connected-v1')==='true';return {ga4:!!extras.ga4,google:!firstRun||!!extras.google,linkedin:!firstRun||!!extras.linkedin,demandbase:true};};
  const sourceReady=row=>{const sources=connections();return !(row.platform==='Google Ads'&&!sources.google||row.platform==='LinkedIn Ads'&&!sources.linkedin);};
  const metricKeys={visibility:'impressions',coverage:'conversions',acceleration:'meetingsSet',expansion:'expansionOpportunities'};
  const metricFor=(row,goal)=>{if(!goal||!sourceReady(row))return null;const value=window.MojoCampaignRecords?.get(row.name)?.[metricKeys[goal.id]];const parsed=Number(String(value??'').replace(/,/g,''));return Number.isFinite(parsed)&&String(value??'').trim()!==''?parsed:null;};
  const rows=[...table.tBodies[0].rows].map(row=>{const clickedText=row.cells[4]?.textContent.trim()||'';return {name:row.cells[0]?.querySelector('a')?.textContent.trim()||row.cells[0]?.textContent.trim(),platform:row.cells[1]?.querySelector('img')?.alt||'',channel:row.dataset.channel||'',accountsClicked:/^[\d,]+$/.test(clickedText)?Number(clickedText.replace(/,/g,'')):null,node:row};});
  let scopedNames=null;
  const scopedRows=()=>scopedNames?rows.filter(row=>scopedNames.has(row.name)):rows;
  const goalFor=name=>state.goals.find(goal=>goal.id===state.assignments[name]);
  const goalCell=row=>{
    const goal=goalFor(row.name);
    const nameLink=row.node.cells[0]?.querySelector('.md-row-link');
    if(!nameLink)return;
    let copy=nameLink.closest('.mg-campaign-copy');
    if(!copy){
      copy=document.createElement('span');
      copy.className='mg-campaign-copy';
      nameLink.before(copy);
      copy.append(nameLink);
    }
    copy.querySelector('.mg-inline-goal')?.remove();
    const label=document.createElement('a');
    label.className='mg-inline-goal';
    label.href='Strategy.html#current-plan';
    label.textContent=goal?goal.initiative:'Set goal';
    label.title=goal?`Review ${goal.initiative} goal`:'Assign a goal';

    copy.append(label);
  };
  const renderCells=()=>rows.forEach(goalCell);
  const campaignItem=row=>{
    const goal=goalFor(row.name);
    const value=metricFor(row,goal);
    const record=window.MojoCampaignRecords?.get(row.name);
    const spend=sourceReady(row)?record?.spent:'';
    return `<li class="mg-campaign-item" data-mg-campaign="${esc(row.name)}"><span class="mg-campaign-link"><span class="mg-platform"><img src="${icons[row.platform]||'assets/demandbase.png'}" alt=""></span><span class="mg-campaign-name"><strong>${esc(row.name)}</strong><small>${esc(row.platform)}${row.channel&&row.channel!=='Format unknown'?` · ${esc(row.channel)}`:''}</small></span></span><span class="mg-campaign-clicks">${value===null?'—':value.toLocaleString()}</span><span class="mg-campaign-spend">${spend?esc(spend):'—'}</span><div class="mg-goal-picker"><button type="button" class="mg-picker-trigger" data-mg-picker="${esc(row.name)}" aria-expanded="false" aria-haspopup="listbox" aria-label="Initiative for ${esc(row.name)}"><span>${esc(goal?.initiative||'No goal')}</span><svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 7 5 5 5-5"/></svg></button><div class="mg-picker-list" role="listbox" aria-label="Choose initiative for ${esc(row.name)}" hidden><button type="button" role="option" aria-selected="${!goal}" data-mg-choice="" data-mg-name="${esc(row.name)}">No goal</button>${state.goals.map(option=>`<button type="button" role="option" aria-selected="${option.id===goal?.id}" data-mg-choice="${esc(option.id)}" data-mg-name="${esc(row.name)}">${esc(option.initiative)}</button>`).join('')}</div></div></li>`;
  };
  const dropCampaignItem=row=>`<li class="mg-campaign-item mg-drop-campaign" draggable="true" data-mg-campaign="${esc(row.name)}" title="Drag to another goal"><span class="mg-drag-handle" aria-hidden="true">⠿</span><a href="#campaign=${encodeURIComponent(row.name)}&tab=overview&from=goals" aria-label="Open ${esc(row.name)} campaign"><img src="${icons[row.platform]||'assets/demandbase.png'}" alt=""><span>${esc(row.name)}</span></a></li>`;
  const goalCard=(goal,openGoals)=>{
    const assigned=scopedRows().filter(row=>state.assignments[row.name]===goal.id);
    const campaignMetric=Object.hasOwn(metricKeys,goal.id);
    const measured=assigned.map(row=>metricFor(row,goal)).filter(Number.isFinite);
    const current=campaignMetric?(measured.length?measured.reduce((sum,value)=>sum+value,0):null):goal.current;
    const source=campaignMetric?(measured.length?`${measured.length} of ${assigned.length} campaigns reporting ${goal.metric.toLowerCase()}`:goal.source):goal.source;
    const hasProgress=Number.isFinite(current)&&Number.isFinite(goal.target)&&goal.target>0;
    const pct=hasProgress?Math.min(100,Math.round(current/goal.target*100)):0;
    const count=`${assigned.length} ${assigned.length===1?'campaign':'campaigns'}`;
    const gap=hasProgress?(goal.target>current?`${(goal.target-current).toLocaleString()} ${campaignMetric?goal.metric.toLowerCase():'remaining'}`:'Goal reached'):'Awaiting campaign data';
    const channels=[...new Map(assigned.filter(row=>row.channel&&row.channel!=='Format unknown').map(row=>[`${row.platform}:${row.channel}`,row])).values()];
    const gapSummary=hasProgress?`<div class="mg-gap"><small>To goal</small><strong>${esc(gap)}</strong></div>`:'';
    const measuredSummary=campaignMetric?`<div class="mg-clicked"><small>Campaigns reporting</small><strong>${measured.length} of ${assigned.length}</strong></div>`:'';
    const channelSummary=channels.length?`<div class="mg-channels"><small>Channels</small><div class="mg-channel-list">${channels.map(row=>`<span class="mg-channel" title="${esc(row.platform)} · ${esc(row.channel)}"><img src="${icons[row.platform]||'assets/demandbase.png'}" alt="${esc(row.platform)}"><span>${esc(row.channel)}</span></span>`).join('')}</div></div>`:'';
    return `<article class="mg-card" data-goal-id="${esc(goal.id)}" data-mg-drop-goal="${esc(goal.id)}" data-tone="${esc(goal.tone||'purple')}">
      <div class="mg-card-body">
        <div class="mg-card-top"><h2>${esc(goal.initiative)}</h2><p>${esc(goal.period)} goal · ${esc(goal.title)}</p></div>
        <div class="mg-measure"><div class="mg-outcome"><div><small>${esc(goal.metric)}</small><strong>${Number.isFinite(current)?`${Number(current).toLocaleString()}${Number.isFinite(goal.target)?` <span>of ${Number(goal.target).toLocaleString()}</span>`:''}`:'—'}</strong></div>${hasProgress?`<b>${pct}%</b>`:''}</div>${hasProgress?`<div class="mg-progress" role="progressbar" aria-label="${esc(goal.metric)}" aria-valuenow="${esc(current)}" aria-valuemin="0" aria-valuemax="${esc(goal.target)}"><i style="--mg-final:${pct}%;width:${pct}%"></i></div>`:''}<p class="mg-source">${esc(source)}</p></div>
        <div class="mg-card-actions"><a class="mg-text-button" href="Strategy.html#current-plan">Edit in Plan →</a></div>
      </div>
      <div class="mg-goal-context">${gapSummary}${measuredSummary}${channelSummary}</div>
      <details class="mg-support" data-mg-support="${esc(goal.id)}" ${openGoals.has(goal.id)?'open':''}><summary>${assigned.length?`${count} supporting this goal`:'Assign campaigns'}</summary><div class="mg-support-inner">${assigned.length?`<div class="mg-campaign-head" aria-hidden="true"><span></span><span>Campaign</span><span>${esc(goal.metric)}</span><span>Spend</span><span>Initiative</span></div><ul>${assigned.map(campaignItem).join('')}</ul>`:'<p>Drag a campaign here or choose this goal from its menu below.</p>'}</div></details>
    </article>`;
  };
  const render=(revealGoal='')=>{
    const unassigned=scopedRows().filter(row=>!goalFor(row.name));
    const openGoals=new Set([...panel.querySelectorAll('.mg-support[open]')].map(item=>item.dataset.mgSupport));
    if(!panel.querySelector('.mg-grid'))state.goals.filter(goal=>rows.some(row=>state.assignments[row.name]===goal.id)).forEach(goal=>openGoals.add(goal.id));
    if(revealGoal)openGoals.add(revealGoal);
    panel.innerHTML=`<div class="mg-head"><div class="mg-head-title"><h1>Your ${esc(groupingLabel().toLowerCase())}</h1><a class="mg-add" href="Strategy.html#current-plan">Manage initiatives</a></div><div class="mg-head-actions"></div></div><div class="mg-grid">${state.goals.map(goal=>goalCard(goal,openGoals)).join('')}</div><p class="mg-status" role="status" aria-live="polite"></p>`;
    document.dispatchEvent(new Event('mojo:goals-rendered'));
    renderCells();
  };
  const edit=(id)=>{
    const goal=state.goals.find(item=>item.id===id);
    const added=!goal;
    window.MojoOpenChat?.('',true);
    const body=document.querySelector('.app .chatpane .chatbody');
    if(!body)return;
    body.querySelector('.mg-chat-flow')?.remove();
    body.querySelector('.seq-chat-empty')?.remove();
    const flow=document.createElement('section');flow.className='mg-chat-flow';
    flow.innerHTML=`<h2>${added?'Add an initiative':'Edit initiative'}</h2><p class="mg-chat-intro">${added?'Set the outcome Mojo should work toward. Change the suggested fields as needed.':'Tune this goal to match what your team actually cares about.'}</p><form class="mg-chat-form" data-mg-form="${esc(id||'new')}"><label>Initiative<input name="initiative" required maxlength="60" value="${esc(goal?.initiative||'Pipeline growth')}"></label><label>Goal<input name="title" required maxlength="80" value="${esc(goal?.title||'Create more qualified pipeline')}"></label><label>Measure<input name="metric" required maxlength="60" value="${esc(goal?.metric||'Pipeline created')}"></label><label>Time frame<input name="period" maxlength="60" value="${esc(goal?.period||'Next quarter')}"></label><button type="submit" class="mg-primary">${added?'Add initiative':'Save goal'}</button></form>`;
    body.append(flow);body.scrollTop=body.scrollHeight;flow.querySelector('input')?.focus();
  };
  const assign=(name,id)=>{
    if(id)state.assignments[name]=id;else delete state.assignments[name];
    save();render(id);
  };
  table.addEventListener('click',event=>{const link=event.target.closest('[data-mg-assign-link]');if(!link)return;event.preventDefault();location.hash='goals';requestAnimationFrame(()=>{[...panel.querySelectorAll('[data-mg-picker]')].find(control=>control.dataset.mgPicker===link.dataset.mgAssignLink)?.focus();});});
  panel.addEventListener('click',event=>{
    const editInitiatives=event.target.closest('[data-mg-edit-initiatives]');if(editInitiatives){event.preventDefault();panel.querySelector('.mg-head')?.scrollIntoView({behavior:'smooth',block:'start'});return;}
    const add=event.target.closest('[data-mg-add]');if(add){edit();return;}
    const editButton=event.target.closest('[data-mg-edit]');if(editButton){edit(editButton.dataset.mgEdit);return;}
    const trigger=event.target.closest('[data-mg-picker]');if(trigger){const list=trigger.nextElementSibling;const opening=list.hidden;panel.querySelectorAll('.mg-picker-list').forEach(menu=>{menu.hidden=true;menu.previousElementSibling.setAttribute('aria-expanded','false')});list.hidden=!opening;trigger.setAttribute('aria-expanded',String(opening));if(opening)list.querySelector('[aria-selected="true"]')?.focus();return;}
    const choice=event.target.closest('[data-mg-choice]');if(choice){assign(choice.dataset.mgName,choice.dataset.mgChoice);return;}
  });
  panel.addEventListener('keydown',event=>{const menu=event.target.closest('.mg-picker-list');if(!menu)return;const items=[...menu.querySelectorAll('[data-mg-choice]')];const index=items.indexOf(event.target);if(event.key==='Escape'){menu.hidden=true;menu.previousElementSibling.setAttribute('aria-expanded','false');menu.previousElementSibling.focus();event.preventDefault();}else if(event.key==='ArrowDown'||event.key==='ArrowUp'){items[(index+(event.key==='ArrowDown'?1:-1)+items.length)%items.length]?.focus();event.preventDefault();}else if(event.key==='Enter'||event.key===' '){event.target.click();event.preventDefault();}});
  document.addEventListener('pointerdown',event=>{if(panel.contains(event.target)&&event.target.closest('.mg-goal-picker'))return;panel.querySelectorAll('.mg-picker-list').forEach(menu=>{menu.hidden=true;menu.previousElementSibling.setAttribute('aria-expanded','false')});});
  let dragging='';
  const clearDrop=()=>panel.querySelectorAll('.mg-drop-ready,.mg-dragging').forEach(item=>item.classList.remove('mg-drop-ready','mg-dragging'));
  panel.addEventListener('dragstart',event=>{
    const item=event.target.closest('.mg-campaign-item');if(!item)return;
    dragging=item.dataset.mgCampaign;
    event.dataTransfer.effectAllowed='move';event.dataTransfer.setData('text/plain',dragging);
    const campaign=rows.find(row=>row.name===dragging);
    const preview=document.createElement('div');
    preview.className='mg-drag-preview';
    preview.innerHTML=`<img src="${icons[campaign?.platform]||'assets/demandbase.png'}" alt=""><span>${esc(dragging)}</span>`;
    document.body.append(preview);
    event.dataTransfer.setDragImage(preview,20,18);
    setTimeout(()=>preview.remove(),0);
    item.classList.add('mg-dragging');
  });
  panel.addEventListener('dragover',event=>{const target=event.target.closest('[data-mg-drop-goal]');if(!dragging||!target)return;event.preventDefault();event.dataTransfer.dropEffect='move';panel.querySelectorAll('.mg-drop-ready').forEach(item=>item.classList.remove('mg-drop-ready'));target.classList.add('mg-drop-ready');});
  panel.addEventListener('drop',event=>{const target=event.target.closest('[data-mg-drop-goal]');if(!dragging||!target)return;event.preventDefault();const name=dragging,id=target.dataset.mgDropGoal;dragging='';clearDrop();assign(name,id);});
  panel.addEventListener('dragend',()=>{dragging='';clearDrop();});
  document.addEventListener('submit',event=>{
    const form=event.target.closest('[data-mg-form]');if(!form)return;event.preventDefault();
    const data=new FormData(form);let goal=state.goals.find(item=>item.id===form.dataset.mgForm);
    if(!goal){goal={id:'goal-'+Date.now().toString(36),current:null,source:'Connect an outcome source to report progress',tone:'purple'};state.goals.push(goal);}
    goal.initiative=String(data.get('initiative')).trim();goal.title=String(data.get('title')).trim();goal.metric=String(data.get('metric')).trim();goal.period=String(data.get('period')).trim()||'Time frame not set';
    save();render();form.closest('.mg-chat-flow').innerHTML=`<p class="mg-chat-intro">${esc(goal.title)} is now in Your initiatives. You can assign campaigns to it on the canvas.</p>`;
  });
  render();
  window.addEventListener('mojo:campaign-scope',event=>{scopedNames=new Set(event.detail.names);render();});
  document.addEventListener('mojo:board-source-connected',()=>render());
})))));
