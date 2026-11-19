/* Shared, browser-local account-group actions across Campaigns, AEO and Audiences. */
(() => {
  const key = 'mojo-account-groups-v1';
  const selectionKey = 'mojo-selected-accounts-v1';
  const audienceDraftKey = 'mojo-selected-audience-drafts-v1';
  const campaignDraftKey = 'mojo-selected-campaign-drafts-v1';
  const groups = {
    'ai-referrals': {name:'ChatGPT referrals', size:'3,482 sessions', origin:'Demandbase GA4 · ChatGPT / OpenAI', use:'No account or campaign join yet', note:'Sessions are not identified accounts. Match visitors to account IDs before activation.', kind:'AEO'},
    'coverage-gap': {name:'Accounts with match issues', size:'803 match issues', origin:'Campaign account coverage', use:'Review before adding to live campaigns', note:'The aggregate export does not identify the individual accounts behind this count.', kind:'Campaigns'},
    'lifted': {name:'Reached accounts marked lifted', size:'604 accounts', origin:'Demandbase influence sample', use:'Campaign measurement review', note:'“Lifted” is a source label. The sample has no matched comparison group.', kind:'Campaigns'},
    'new-intent': {name:'New Enterprise Intent matches', size:'214 accounts', origin:'Demandbase intent criteria', use:'Not yet in Enterprise Intent; audience is used by Q4 Pipeline Search and ABM Retargeting', note:'Review exclusions and match quality before staging membership.', kind:'Audiences'},
    'intent-surge': {name:'Intent Surge', size:'280 accounts', origin:'Demandbase intent · last refresh Oct 18', use:'Used by Q4 Pipeline Search', note:'16 days since refresh; the standard is seven days. Review the campaign before any pause.', kind:'Audiences'},
    'enterprise-intent': {name:'Enterprise Intent', size:'620 accounts', origin:'Demandbase intent', use:'Used by Q4 Pipeline Search and ABM Retargeting', note:'214 new matches remain outside this audience pending review.', kind:'Audiences'}
  };
  const reportedAccounts = new Map();
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const read = (storageKey, fallback) => { try { return JSON.parse(localStorage.getItem(storageKey) || 'null') || fallback; } catch { return fallback; } };
  const state = () => read(key, {});
  const save = value => { localStorage.setItem(key, JSON.stringify(value)); window.dispatchEvent(new Event('mojo:groups-updated')); };
  const selected = () => read(selectionKey, []);
  const setSelected = ids => { localStorage.setItem(selectionKey, JSON.stringify([...new Set(ids)])); window.dispatchEvent(new Event('mojo:selection-updated')); };
  const identify = card => {
    if (card.matches('.mfc-card')) return ({unreached:'coverage-gap',lifted:'lifted'})[card.dataset.findingId];
    const title = card.querySelector('h3')?.textContent?.toLowerCase() || '';
    if (location.search.includes('app=aeo')) return title.includes('3,482 sessions') ? 'ai-referrals' : null;
    if (title.includes('214 accounts now match')) return 'new-intent';
    if (title.includes('intent surge')) return 'intent-surge';
    return null;
  };
  function controls(id) {
    const group = groups[id], current = state()[id] || {};
    return `<div class="mag-connections"><span><b>Evidence from</b> ${escape(group.origin)}</span><span><b>Used</b> ${escape(group.use)}</span></div>
      <div class="mag-toolbar"><span class="mag-object">Account group · ${escape(group.size)}</span><button type="button" class="mag-open" data-mag-open="${id}" aria-expanded="false">Use this group <span aria-hidden="true">⌄</span></button></div>
      <div class="mag-panel" data-mag-panel="${id}" hidden><div class="mag-panel-head"><strong>${escape(group.name)}</strong><button type="button" data-mag-close aria-label="Close group actions">×</button></div><p>${escape(group.note)}</p><div class="mag-actions">
        <button type="button" data-mag-action="save" data-group="${id}">${current.audience?'Audience draft saved ✓':'Save as audience'}</button>
        <button type="button" data-mag-action="advertise" data-group="${id}">${current.advertise?'Retargeting draft saved ✓':current.audience?'Run retargeting':'Advertise to it'}</button>
        <button type="button" data-mag-action="answer" data-group="${id}">Check what AI says</button>
        <button type="button" data-mag-action="watch" data-group="${id}">${current.watch?'Routine draft saved ✓':'Watch it'}</button>
        ${id==='intent-surge'?'<button type="button" data-mag-action="pause" data-group="intent-surge">Review campaign pause</button>':''}
      </div><output class="mag-status" role="status">${current.message?escape(current.message):'Draft actions stay in this browser.'}</output></div>`;
  }
  function enhance(card) {
    if (card.dataset.magReady) return;
    const id = identify(card); if (!id) return;
    card.dataset.magReady = id;
    const box = document.createElement('div'); box.className='mag-block'; box.innerHTML=controls(id);
    const detail=card.querySelector('.mf-insight-more .mf-insight-detail,.aud-feed-item details .aud-feed-detail');
    if(detail)detail.append(box);
    else card.querySelector('details')?.append(box);
  }
  function enhanceDashboards() {
    if (!location.search.includes('app=audience-builder')) return;
    document.querySelectorAll('.aud-table tbody tr').forEach(row => {
      if (row.dataset.magDashboard) return;
      const name=row.querySelector('th')?.textContent || '';
      const id=name.includes('Enterprise Intent')?'enterprise-intent':name.includes('Intent Surge')?'intent-surge':null;
      if (!id) return;
      row.dataset.magDashboard=id;
      const note=document.createElement('small'); note.className='mag-table-source'; note.textContent=`Evidence from ${groups[id].origin} · ${groups[id].use}`;
      row.querySelector('th')?.append(note);
    });
  }
  function enhanceReportedAccounts() {
    const table=document.querySelector('#ia-panel-accounts table');
    if(!table||table.classList.contains('aq-table'))return;
    const head=table.querySelector('thead tr')||table.querySelector('tr');
    if(head&&!head.querySelector('.mag-select-head')){
      const th=document.createElement('th');th.className='mag-select-head';
      th.innerHTML='<label class="mag-select-all-label"><input type="checkbox" data-mag-select-all aria-label="Select all visible accounts"></label>';
      head.prepend(th);
    }
    if(!table.dataset.magColumns){
      const headings=[...head.querySelectorAll('th')];
      const nameHeading=headings.find(cell=>['domain name','account'].includes(cell.textContent.trim().toLowerCase()));
      const countHeading=headings.find(cell=>cell!==nameHeading&&cell.textContent.trim().toLowerCase()==='accounts');
      if(nameHeading&&nameHeading.textContent.trim().toLowerCase()==='domain name')nameHeading.textContent='Accounts';
      if(countHeading){table.dataset.magLegacyCount='true';countHeading.remove();}table.dataset.magColumns='true';
    }
    [...table.querySelectorAll('tbody tr')].forEach(row=>{
      if(row.dataset.magReported)return;
      const cells=[...row.querySelectorAll('td')];if(cells.length<2)return;
      const name=cells[0].textContent.trim();if(!name)return;
      const id=`reported:${name.toLowerCase().replace(/[^a-z0-9]+/g,'-')}`;
      reportedAccounts.set(id,{id,name,spend:row.dataset.magSpend||cells[2]?.textContent.trim()||'—',impressions:row.dataset.magImpressions||cells[3]?.textContent.trim()||'—',clicks:row.dataset.magClicks||cells[4]?.textContent.trim()||'—'});
      if(table.dataset.magLegacyCount==='true')cells[1].remove();
      row.dataset.magReported=id;
      const cell=document.createElement('td');
      const checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.dataset.magSelect=id;checkbox.checked=selected().includes(id);checkbox.setAttribute('aria-label',`Select ${name}`);cell.append(checkbox);row.prepend(cell);
      const button=document.createElement('button');button.type='button';button.className='aq-account-story';button.dataset.magAccount=id;button.textContent=name;cells[0].replaceChildren(button);
    });
    if(!table.parentElement.querySelector('.mag-table-toolbar')){
      const toolbar=document.createElement('div');toolbar.className='mag-table-toolbar';toolbar.setAttribute('role','toolbar');toolbar.setAttribute('aria-label','Selected account actions');
      toolbar.innerHTML='<strong data-mag-selection-count>0 selected</strong><button type="button" data-mag-tray="save">Save as audience</button><button type="button" data-mag-tray="advertise">Advertise</button><button type="button" data-mag-tray="answer">Check AI answers</button><button type="button" data-mag-tray="watch">Watch</button><button type="button" data-mag-tray="clear">Clear</button><output role="status"></output>';
      table.before(toolbar);
    }
    updateTableToolbar();
  }
  function updateTableToolbar(){
    const table=document.querySelector('#ia-panel-accounts table');if(!table)return;
    const rows=[...table.querySelectorAll('tbody tr:not([hidden]) [data-mag-select]')];
    const picked=rows.filter(check=>selected().includes(check.dataset.magSelect));
    const all=table.querySelector('[data-mag-select-all]');if(all){all.checked=rows.length>0&&picked.length===rows.length;all.indeterminate=picked.length>0&&picked.length<rows.length;}
    const toolbar=table.parentElement.querySelector('.mag-table-toolbar');if(!toolbar)return;
    const signature=selected().join('|');
    if(toolbar.dataset.ids!==signature){toolbar.dataset.ids=signature;toolbar.querySelector('output').replaceChildren();}
    toolbar.classList.toggle('has-selection',selected().length>0);
    toolbar.querySelector('[data-mag-selection-count]').textContent=`${selected().length} selected`;
    toolbar.querySelectorAll('button').forEach(button=>button.disabled=!selected().length);
  }
  function enhanceCampaignDrafts(){
    const directory=document.querySelector('#ia-panel-campaigns');
    if(!directory)return;
    let section=directory.querySelector('.mag-campaign-drafts');
    const drafts=read(campaignDraftKey,[]);
    if(!drafts.length){section?.remove();return;}
    if(!section){section=document.createElement('section');section.className='mag-campaign-drafts';directory.querySelector('.md-scope-control,.mojo-scope-control')?.after(section);if(!section.isConnected)directory.prepend(section);}
    const active=new URLSearchParams(location.search).get('draft');
    const signature=JSON.stringify([drafts,active]);if(section.dataset.signature===signature)return;section.dataset.signature=signature;
    section.replaceChildren();
    const heading=document.createElement('h3');heading.textContent='Campaign drafts';section.append(heading);
    drafts.forEach(draft=>{
      const card=document.createElement('article');card.className='mag-campaign-draft';card.id=`mag-campaign-${draft.id}`;
      if(draft.id===active)card.classList.add('is-active');
      const name=document.createElement('a');name.href=`Portfolio.html?draft=${encodeURIComponent(draft.id)}#campaigns`;name.textContent=draft.name;
      const detail=document.createElement('span');detail.textContent=draft.cohortName?`Draft · ${draft.cohortName} · Awaiting account matching and campaign setup`:`Draft · ${draft.accountNames.length} selected accounts · Awaiting campaign setup`;
      card.append(name,detail);section.append(card);
    });
    if(active&&!section.dataset.scrolled){section.dataset.scrolled='true';requestAnimationFrame(()=>section.querySelector('.is-active')?.scrollIntoView({block:'center'}));}
  }
  function enhanceRoutines() {
    const row=document.querySelector('#ai-referral-retargeting');
    if (!row || row.dataset.magRoutine) return;
    row.dataset.magRoutine='true';
    const trigger=document.createElement('div');trigger.className='mag-routine-flow';
    trigger.innerHTML='<span>AI referral from an ICP account</span><b>→</b><span>Match account ID</span><b>→</b><span>AI visitors audience</span><b>→</b><span>Retargeting flight</span>';
    row.querySelector('.mr-detail p')?.after(trigger);
  }
  function enhanceObjectConnections() {
    const answer=document.querySelector('.aeo-detail');
    if(answer&&!answer.querySelector('.mag-object-links')){
      const block=document.createElement('div');block.className='mag-object-links';
      block.innerHTML='<strong>Connected work</strong><span>Campaigns sending visitors to this page: no landing-page or UTM join supplied.</span><span>Account groups from this answer: no answer-to-account ID join supplied.</span>';
      answer.querySelector('.aud-detail-grid')?.after(block);
    }
    const campaign=document.querySelector('.ia-campaign-workspace:not([hidden]) .md-detail-summary');
    if(campaign&&!campaign.querySelector('.mag-object-links')){
      const block=document.createElement('div');block.className='mag-object-links';
      const name=document.querySelector('.ia-campaign-workspace:not([hidden])')?.dataset.campaign||'';
      const audience=/Customer|Retarget/i.test(name)?'Customer expansion':/ICP/i.test(name)?'ICP accounts':'Target account list';
      const question=/Search|Pricing|Retarget/i.test(name)?'pricing and alternatives':'best B2B GTM platforms';
      block.innerHTML=`<strong>Connected work · proposed planning links</strong><span><a href="AppWorkspace.html?app=audience-builder#dashboards">Audience: ${escape(audience)} →</a> Confirm membership against campaign account IDs.</span><span><a href="AppWorkspace.html?app=aeo#dashboards">Buyer question: ${escape(question)} →</a> Map the actual prompt before measuring exposure.</span>`;
      campaign.querySelector('.md-detail-actions')?.before(block);
    }
  }
  let pending=false;
  function scan() {
    if(pending)return; pending=true;
    requestAnimationFrame(()=>{pending=false;document.querySelectorAll('.aud-feed-item,.mfc-card').forEach(enhance);enhanceDashboards();enhanceReportedAccounts();enhanceCampaignDrafts();enhanceRoutines();enhanceObjectConnections();});
  }
  function closeAccountRail() {
    const rail=document.querySelector('#mag-account-rail');if(!rail)return;
    const active=document.querySelector('[data-mag-account][aria-expanded="true"]');
    rail.hidden=true;rail.dataset.account='';
    document.querySelectorAll('[data-mag-account]').forEach(button=>{button.setAttribute('aria-expanded','false');button.closest('tr')?.classList.remove('mag-account-active');});
    active?.focus();
  }
  function accountRail(id) {
    const account=window.MojoAccounts?.get?.(id)||reportedAccounts.get(id);if(!account)return;
    let rail=document.querySelector('#mag-account-rail');
    if(!rail){rail=document.createElement('aside');rail.id='mag-account-rail';rail.className='mag-account-rail';rail.setAttribute('aria-label','Account details');rail.hidden=true;document.body.append(rail);}
    const isReported=id.startsWith('reported:');
    const visible=[...document.querySelectorAll('#ia-panel-accounts [data-mag-account],#mojo-accounts-work [data-mag-account]')].filter(button=>button.getClientRects().length);
    const current=visible.findIndex(button=>button.dataset.magAccount===id);
    const channels=Array.isArray(account.channels)?account.channels:[];
    const campaigns=Array.isArray(account.campaigns)?account.campaigns:[];
    const opportunity=account.stage?`${escape(account.stage)}${account.opportunityValue?' · '+new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(account.opportunityValue):''}`:'No linked opportunity';
    rail.innerHTML=`<div class="mag-rail-top"><span>${isReported?'SOURCE ACCOUNT':'ACCOUNT · SAMPLE CONTEXT'}</span><button type="button" class="mag-rail-close" data-mag-rail-close aria-label="Close account details">×</button></div>
      <div class="mag-rail-body"><h2 aria-live="polite">${escape(account.name)}</h2><p class="mag-rail-subtitle">${isReported?'Demandbase account performance row':`${escape(account.tier)} · ${escape(account.industry)} · ${escape(account.owner)}`}</p>
      ${isReported?`<div class="mag-rail-facts"><div><small>Spend</small><strong>${escape(account.spend)}</strong></div><div><small>Impressions</small><strong>${escape(account.impressions)}</strong></div><div><small>Clicks</small><strong>${escape(account.clicks)}</strong></div></div>`:
      `<div class="mag-rail-facts"><div><small>Journey stage</small><strong>${escape(account.stage==='Proposal'?'Decision':account.stage==='Evaluation'?'Evaluation':account.stage==='Discovery'?'Consideration':account.intentStrength>=4?'Research':'Awareness')}</strong></div><div><small>Opportunity</small><strong>${opportunity}</strong></div><div><small>Campaign reach</small><strong>${escape(account.reach)}</strong></div><div><small>AI sourced</small><strong>${account.aiSource?escape(account.aiSource.provider):'No recorded source'}</strong></div></div>
      <section class="mag-rail-section"><h3>Campaigns · ${campaigns.length}</h3>${campaigns.length?`<ul class="mag-rail-campaigns">${campaigns.map(campaign=>`<li><a href="Portfolio.html#campaign=${encodeURIComponent(campaign.name)}&amp;tab=overview">${escape(campaign.name)}</a><span>${escape(campaign.platform)}</span></li>`).join('')}</ul>`:'<p>No campaign membership modeled.</p>'}<p>Campaign memberships are sample context. Reach shows whether delivery was recorded.</p></section>`}
      <section class="mag-rail-section"><h3>Connected activity</h3><ol>
        <li><b>AI answer</b><span>No account-linked answer check is supplied${account.topic?`. Buyer topic: ${escape(account.topic)}.`:'.'}</span></li>
        <li><b>Referral visit</b><span>${account.aiSource?`${escape(account.aiSource.method)} · ${escape(account.aiSource.value)} (sample attribution)`:'No AI referral is linked to this account ID.'}</span></li>
        <li><b>Audience</b><span>${account.alsoIn?escape(account.alsoIn):'Audience membership is not supplied for this account.'}</span></li>
        <li><b>Ads</b><span>${isReported?`${escape(account.impressions)} impressions · ${escape(account.clicks)} clicks · ${escape(account.spend)} spend in the supplied row.`:`${channels.length?channels.map(escape).join(', ')+' targeted. ':''}Reach: ${escape(account.reach)}.`}</span></li>
        <li><b>Opportunity</b><span>${opportunity}</span></li>
      </ol></section><p class="mag-rail-note">${isReported?'A source account ID is needed to join activity across AEO, audiences, campaigns and CRM.':'The account ID is the join key. Missing events stay visible until a connected source supplies them.'}</p></div>
      <div class="mag-rail-nav"><button type="button" data-mag-rail-step="-1" ${current<=0?'disabled':''}>← Previous</button><span>${current>=0?`${current+1} of ${visible.length}`:'Account'}</span><button type="button" data-mag-rail-step="1" ${current<0||current>=visible.length-1?'disabled':''}>Next →</button></div>`;
    rail.hidden=false;rail.dataset.account=id;
    document.querySelectorAll('[data-mag-account]').forEach(button=>{const active=button.dataset.magAccount===id;button.setAttribute('aria-expanded',String(active));button.setAttribute('aria-controls','mag-account-rail');button.closest('tr')?.classList.toggle('mag-account-active',active);});
  }
  document.addEventListener('click', event => {
    const open=event.target.closest('[data-mag-open]');
    if(open){const panel=open.closest('.mag-block').querySelector('.mag-panel');panel.hidden=!panel.hidden;open.setAttribute('aria-expanded',String(!panel.hidden));return;}
    const close=event.target.closest('[data-mag-close]');if(close){const panel=close.closest('.mag-panel');panel.hidden=true;panel.closest('.mag-block').querySelector('.mag-open').setAttribute('aria-expanded','false');return;}
    const action=event.target.closest('[data-mag-action]');
    if(action){
      const id=action.dataset.group, kind=action.dataset.magAction, group=groups[id], all=state(), current=all[id]||{};
      const messages={save:`${group.name} saved as an audience draft. ${id==='ai-referrals'?'Account matching is required before activation.':'Review membership before activation.'}`,advertise:`Retargeting draft prepared for ${group.name}. Review eligibility and approvals before launch.`,answer:`Answer check queued for ${group.name}. No account-level answer result is connected yet.`,watch:`Cross-area watch draft saved for ${group.name}.`,pause:'Pause review drafted for Q4 Pipeline Search. The campaign is still live.'};
      current[kind]=true;current.message=messages[kind];all[id]=current;save(all);
      const panel=action.closest('.mag-panel');panel.querySelector('output').textContent=current.message;
      if(kind==='save'){action.textContent='Audience draft saved ✓';const advertise=panel.querySelector('[data-mag-action="advertise"]');advertise.textContent='Run retargeting';advertise.focus();}
      if(kind==='advertise')action.textContent='Retargeting draft saved ✓';
      if(kind==='watch')action.textContent='Routine draft saved ✓';
      return;
    }
    const trayButton=event.target.closest('[data-mag-tray]');
    if(trayButton){
      const kind=trayButton.dataset.magTray;if(kind==='clear'){setSelected([]);return;}
      const ids=selected(),names=ids.map(id=>reportedAccounts.get(id)?.name||window.MojoAccounts?.get?.(id)?.name||id);
      const label=names.length===1?names[0]:`Selected accounts · ${names.length}`;
      const stamp=new Date().toLocaleDateString('en-US',{month:'short',day:'numeric'});
      let name,url,description;
      if(kind==='save'){
        const id=`account-selection-${Date.now()}`;name=`${label} · ${stamp}`;url=`AppWorkspace.html?app=audience-builder#dashboards:${id}`;
        const drafts=read(audienceDraftKey,[]);drafts.unshift({id,name,accountNames:names,created:stamp});localStorage.setItem(audienceDraftKey,JSON.stringify(drafts));
        description='Audience draft created: ';
      }else if(kind==='advertise'){
        const id=`retargeting-${Date.now()}`;name=`Retargeting · ${label} · ${stamp}`;url=`Portfolio.html?draft=${encodeURIComponent(id)}#campaigns`;
        const drafts=read(campaignDraftKey,[]);drafts.unshift({id,name,accountNames:names,created:stamp});localStorage.setItem(campaignDraftKey,JSON.stringify(drafts));enhanceCampaignDrafts();
        description='Campaign draft created: ';
      }else if(kind==='answer'){
        name='AI answers dashboard';url='AppWorkspace.html?app=aeo#dashboards';description='Open the answer visibility report: ';
      }else{
        name=`Account watch · ${label}`;url='Routines.html';description='Open routines to set up: ';
      }
      const output=trayButton.closest('.mag-table-toolbar,.aq-bulk').querySelector('output');
      const link=document.createElement('a');link.href=url;link.textContent=`${name} →`;
      output.replaceChildren(description,link);
      return;
    }
    if(event.target.closest('[data-mag-rail-close]')){closeAccountRail();return;}
    const step=event.target.closest('[data-mag-rail-step]');if(step){const buttons=[...document.querySelectorAll('#ia-panel-accounts [data-mag-account],#mojo-accounts-work [data-mag-account]')].filter(button=>button.getClientRects().length);const index=buttons.findIndex(button=>button.dataset.magAccount===document.querySelector('#mag-account-rail')?.dataset.account);const next=buttons[index+Number(step.dataset.magRailStep)];if(next){accountRail(next.dataset.magAccount);document.querySelector(`#mag-account-rail [data-mag-rail-step="${step.dataset.magRailStep}"]:not([disabled])`)?.focus();}return;}
    const account=event.target.closest('[data-mag-account]');if(account){accountRail(account.dataset.magAccount);}
  });
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!document.querySelector('#mag-account-rail')?.hidden)closeAccountRail();});
  document.addEventListener('change',event=>{
    const all=event.target.closest('[data-mag-select-all]');
    if(all){const ids=new Set(selected());document.querySelectorAll('#ia-panel-accounts tbody tr:not([hidden]) [data-mag-select]').forEach(check=>{all.checked?ids.add(check.dataset.magSelect):ids.delete(check.dataset.magSelect);});setSelected([...ids]);return;}
    const check=event.target.closest('[data-mag-select]');if(!check)return;const ids=new Set(selected());check.checked?ids.add(check.dataset.magSelect):ids.delete(check.dataset.magSelect);setSelected([...ids]);
  });
  document.addEventListener('DOMContentLoaded',()=>{document.querySelector('#mag-selection-tray')?.remove();scan();new MutationObserver(scan).observe(document.body,{subtree:true,childList:true});window.addEventListener('mojo:selection-updated',()=>{document.querySelectorAll('[data-mag-select]').forEach(check=>check.checked=selected().includes(check.dataset.magSelect));updateTableToolbar();});});
  window.MojoAccountGroups={groups,selected,setSelected};
})();
