/* Campaign work has a durable home, while drafting stays in Chat. */
(() => {
  const view = new URLSearchParams(location.search).get('view') || 'build';
  if (view === 'fix') { location.replace('CampaignLifecycle.html?view=optimize#issues'); return; }
  const main = document.getElementById('lifecycle-content');
  if (!main) return;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
  let reviewedGroups = null;
  try { reviewedGroups = JSON.parse(localStorage.getItem('mojo-initiative-review-v1') || 'null'); } catch {}
  const groupNames = {Brand:'visibility',Demand:'coverage',Land:'acceleration',Expand:'expansion'};
  const groupLabel = name => reviewedGroups?.goals?.find(goal => goal.id === name)?.initiative || window.MojoInitiatives?.byId(name)?.name || name;
  const groupingLabel = reviewedGroups?.label || 'Initiatives';
  let connected = {};
  try { connected = JSON.parse(localStorage.getItem('mojo-board-extra-connections-v1') || '{}') || {}; } catch {}
  const work = {
    build: {
      title:'Build', lede:'Mojo builds each campaign and checks it against your rules. You publish.',
      label:'Ready to draft',
      items:[
        {title:'Buying group follow-up',source:'Demandbase intent · Buying groups',copy:'Reach finance and security at engaged accounts.',signals:['Audience: 1,146 engaged accounts','Ads: 2 role-specific ads · 2 ad groups','Spend / flight: $15,000 · Nov 16–Dec 18','Goal: 35 accounts add a third buyer role'],action:'Review campaign setup',initiative:'Land'},
        {title:'EMEA evaluation follow-up',source:'Demandbase intent · Evaluation accounts',copy:'Follow up with buyers already evaluating Acme in EMEA.',signals:['Audience: 312 EMEA Evaluation accounts','Ads: 2 regional proof ads · 2 ad groups','Spend / flight: $2,700 · Nov 16–Dec 18','Goal: 36 accounts engage a third buyer role'],action:'Review campaign setup',initiative:'Demand'},
        {title:'Manufacturing buying-group test',source:'Demandbase buying groups · Manufacturing',copy:'Test finance and security proof with Manufacturing accounts.',signals:['Audience: 208 Manufacturing accounts','Ads: 2 buyer-role ads · 2 ad groups','Spend / flight: $1,800 · Nov 16–Dec 18','Goal: 24 accounts engage a third buyer role'],action:'Review campaign setup',initiative:'Land'}
      ]
    },
    optimize: {
      title:'Optimize', lede:'Adjust what is running, with the reason and source one click away.',
      label:'Worth a look',
      items:[
        {title:'9 of 22 flights are underpacing',source:'Demandbase Ads · Flight delivery',copy:'Nine active flights have used less than 40% of planned spend.',signals:['9 below pace','22 active flights'],action:'Discuss pacing',href:'Portfolio.html#campaigns'},
        {title:'Engagement is concentrated in one role',source:'Demandbase · Buying groups',copy:'Review the accounts where ads reached one buyer but missed finance or security.',signals:['1,146 engaged accounts','2 roles to check'],action:'Review buyers',href:'AppWorkspace.html?app=audience-builder#feed'},
        {title:'A new ad concept is ready',source:'Demandbase · Creative performance',copy:'Compare the replacement with the current ad before making a change.',signals:['Creative fatigue','1 concept drafted'],action:'Review creative',href:'Portfolio.html#campaign=2026-Q4-EMEA-TAL-ABX&tab=creatives'}
      ]
    },
    fix: {
      title:'Fix', lede:'These setup issues can make campaign results harder to trust.',
      label:'To resolve',
      items:[
        {title:'16 campaign links need a match',source:'Campaign tags · Tracking review',copy:'Mojo found paid links that are not assigned to a campaign.',signals:['16 links','2,222 sessions to review'],action:'Review links',href:'BestPractices.html'},
        {title:'3 flights need their status checked',source:'Demandbase Ads · Flight settings',copy:'They still say live after their end dates. Confirm status before moving budget.',signals:['3 flights','Ended Oct 31'],action:'Check flights',href:'Portfolio.html#campaigns'}
      ]
    }
  };
  const state = work[view] || work.build;
  const sectionData = {
    build: [
      {id:'recommended',title:'Ideas from Plan',intro:'Campaigns Mojo can prepare from what it found.',items:state.items},
      {id:'draft',title:'Drafts',intro:'Plans ready to build and validate.',items:[]},
      {id:'qa',title:'Mojo QA',intro:'Mojo checks setup, tracking and rules before publishing.',items:[
        {title:'Check the Evaluation draft end date',source:'Campaign name and flight dates',copy:'The draft name says Q4, but its planned end date is in Q1.',signals:['Date mismatch','Needs review'],action:'Resolve with Mojo'},
        {title:'Add a tracking tag to the replacement ad',source:'Creative and tracking setup',copy:'The new ad needs a campaign UTM before publishing.',signals:['1 missing UTM','Needs review'],action:'Resolve with Mojo'},
        {title:'Check customer overlap',source:'Demandbase audience rules',copy:'Review customer exclusions for the Evaluation audience.',signals:['Audience check','Needs review'],action:'Resolve with Mojo'}
      ]},
      {id:'ready',title:'Ready to publish',intro:'Mojo assembled these for your review.',items:[
        {title:'Buying group follow-up',source:'Demandbase · Buying groups',copy:'Audience, creative, budget and ad groups are drafted. Review each part before publishing.',signals:['Audience: 1,146 engaged accounts','2 ads ready','$15,000 cap'],action:'Review with Mojo'},
        {title:'EMEA Evaluation test',source:'Demandbase · Intent',copy:'A small test is ready for EMEA accounts still evaluating.',signals:['312 accounts','2 ads ready','$2,700 cap'],action:'Review with Mojo'},
        {title:'Manufacturing role test',source:'Demandbase · Buying groups',copy:'A focused draft targets finance and security at Manufacturing accounts.',signals:['208 accounts','2 ads ready','$1,800 cap'],action:'Review with Mojo'}
      ]},
    ],
    optimize: [
      {id:'delivery',title:'Delivery',intro:'Pacing and budget.',items:[state.items[0],{title:'Three campaigns ended with budget left',source:'Demandbase Ads · Flight budgets',copy:'Confirm final spend before using the remaining $45,920 in a new plan.',signals:['3 ended flights','$45,920 to verify'],action:'Plan a follow-up',href:'Strategy.html'}]},
      {id:'audience',title:'Audience',intro:'Account and buyer engagement.',items:[state.items[1],{title:'412 Evaluation accounts need more buyers',source:'Demandbase · Buying groups',copy:'Finance and security are missing from many engaged buying groups.',signals:['412 evaluating','2 roles to check'],action:'Find missing buyers',href:'AppWorkspace.html?app=audience-builder#dashboards'}]},
      {id:'creative',title:'Creative',intro:'Ads that may need a new message.',items:[state.items[2]]}
    ],
    fix: [
      {id:'tracking',title:'Tracking',intro:'Links and conversion events.',items:[work.fix.items[0],{title:'Check the conversion event',source:'Google Ads · Conversion setup',copy:'The cost target and platform conversion use different definitions.',signals:['Definition mismatch','Review target'],action:'Check setup',href:'Portfolio.html#campaigns'}]},
      {id:'data',title:'Data',intro:'Missing results and account matches.',items:[{title:'Match 214 opportunities to accounts',source:'Opportunity summary · Ad activity',copy:'Match account IDs and dates before reporting ad influence.',signals:['214 opportunities','Account match needed'],action:'Review matches',href:'Portfolio.html#accounts'},{title:'Add LinkedIn campaign results',source:'LinkedIn Ads · Connection status',copy:'The channel is connected, but campaign results have not been loaded.',signals:['Results missing'],action:'Check results',href:'Portfolio.html#campaigns'},{title:'Connect analytics for site conversions',source:'Site measurement · Connection status',copy:'Connect GA4 to compare ad activity with visits and conversions.',signals:['GA4 not connected'],action:'Review connection',href:'Portfolio.html#campaigns'}]},
      {id:'setup',title:'Setup',intro:'Campaign settings to check.',items:[work.fix.items[1],{title:'11 campaigns have no initiative',source:'Campaign setup',copy:'Choose Brand, Demand, Land or Expand for each campaign.',signals:['11 campaigns','Initiative missing'],action:'Assign initiatives',href:'Portfolio.html#campaigns'},{title:'Four names break your campaign pattern',source:'Campaign names · Best Practices',copy:'Check the exceptions before applying the naming rule to new drafts.',signals:['22 follow pattern','4 exceptions'],action:'Review names',href:'BestPractices.html'}]},
      {id:'recently-fixed',title:'Recently fixed',intro:'Changes ready to inspect.',items:[{title:'16 campaign tags mapped',source:'Mojo · Tracking history',copy:'The tags are linked to campaign groups and ready for review.',signals:['16 tags','Completed'],action:'Review changes',href:'BestPractices.html'},{title:'Six email links repaired',source:'Mojo · Tracking history',copy:'Six links now use the campaign naming rule.',signals:['6 links','Completed'],action:'Review changes',href:'BestPractices.html'}]}
    ]
  };
  const planOptions=[...(window.MojoPlanCatalog?.items||[])].sort((a,b)=>['Brand','Demand','Land','Expand'].indexOf(a.initiative)-['Brand','Demand','Land','Expand'].indexOf(b.initiative));
  if(view==='build'&&planOptions.length){
    sectionData.build[0].items=planOptions.map(option=>({
      planId:option.id,title:option.title,initiative:option.initiative,source:option.source,
      copy:option.who,message:option.message,goal:option.goal,budget:option.budget,
      duration:option.duration,channels:option.channels,creatives:option.creatives,
      recommended:option.recommended,signals:[`Audience: ${option.who}`,`Message: ${option.message}`,`Budget: $${Number(option.budget).toLocaleString()}`,`Goal: ${option.goal}`],
      action:'Start building'
    }));
  }
  sectionData.optimize = [
    {id:'performance',title:'Performance',intro:'Pacing, audiences and creative.',items:sectionData.optimize.flatMap(section=>section.items)},
    {id:'issues',title:'Issues',intro:'Tracking, data and setup to repair.',items:sectionData.fix.flatMap(section=>section.items)}
  ];
  if (view === 'build') {
    sectionData.build.push({id:'live',title:'Live',intro:'Campaigns Mojo is watching.',items:[]});
    let savedDrafts = [];
    try { savedDrafts = JSON.parse(localStorage.getItem('mojo-created-campaign-drafts-v1') || '[]'); } catch {}
    if (Array.isArray(savedDrafts)) {
      const namedDrafts=savedDrafts.map((draft,index)=>({draft,index})).filter(({draft}) => draft?.name);
      const savedItems = namedDrafts.map(({draft,index:savedIndex}) => {
        const option=planOptions.find(option=>option.id===draft.source);
        const rawChannels=draft.channels?.length?draft.channels:(option?.channels||[]);
        const channels=Array.isArray(rawChannels)?rawChannels:String(rawChannels).split(/[,·+]/).map(channel=>channel.trim()).filter(Boolean);
        const blueprint=draft.planBlueprint||option?.blueprint||[['Who',draft.audience||'To review'],['Message',draft.creative||'To review'],['Where',channels.join(' · ')||'To review'],['Spend',draft.budget?`$${Number(draft.budget).toLocaleString()}`:'To review'],['Goal',draft.success||draft.goal||'To review']];
        return {title:draft.planTitle||option?.title||draft.name,planId:option?.id,savedIndex,initiative:draft.initiative||option?.initiative||'Demand',source:option?.source||'Saved campaign draft',copy:blueprint.find(([label])=>label==='Who')?.[1]||draft.goal||'Ready for your review.',signals:blueprint.map(([label,value])=>`${label}: ${value}`),blueprint,channels,creatives:draft.creatives||option?.creatives||[],action:'Build this campaign'};
      });
      savedItems.forEach(item => {
        const draft=savedDrafts[item.savedIndex];
        const destination=draft?.buildStatus==='live'?'live':draft?.buildStatus==='ready'?'ready':draft?.buildStatus==='qa'?'qa':'draft';
        item.buildStatus=destination;
        sectionData.build.find(section => section.id === destination).items.push(item);
      });
    }
  }
  if (view === 'build') {
    sectionData.build.find(section=>section.id==='qa').items=sectionData.build.find(section=>section.id==='qa').items.filter(item=>item.buildStatus==='qa');
    sectionData.build.find(section=>section.id==='ready').items=sectionData.build.find(section=>section.id==='ready').items.filter(item=>item.buildStatus==='ready');
    sectionData.build.sort((a,b) => ['ready','qa','draft','live','recommended'].indexOf(a.id) - ['ready','qa','draft','live','recommended'].indexOf(b.id));
  }
  const sections = sectionData[view] || sectionData.build;
  const requested = decodeURIComponent(location.hash.slice(1));
  const active = sections.some(section => section.id === requested) ? requested : sections[0].id;
  document.title = `Mojo — ${state.title}`;
  const initiativeFor = item => {
    const source=String(item.planId||'');
    const area=source.startsWith('buying_group')?'buying_group':source.startsWith('customer_growth')?'customer_growth':source.startsWith('regional')?'regional':source.startsWith('capture')?'capture':'';
    return window.MojoInitiatives?.entries.find(entry=>entry.area===area)?.id || groupNames[item.initiative] || item.initiative || 'visibility';
  };
  const buildRow = (item,index,section) => {
    const channels=Array.isArray(item.channels)?item.channels:String(item.channels||'').split(/[,·+]/).map(channel=>channel.trim()).filter(Boolean);
    const channelLogos=channels.map(channel=>{
      const src=/linkedin/i.test(channel)?'assets/linkedin.png':/google/i.test(channel)?'assets/google-ads.svg':/demandbase/i.test(channel)?'assets/demandbase.png':null;
      return src?`<img src="${src}" alt="${esc(channel)}" title="${esc(channel)}">`:'';
    }).join('');
    const isDraft=section.id==='draft', isIdea=section.id==='recommended';
    const blueprint=(isDraft||section.id==='live')?(item.blueprint||item.signals.map(signal=>{const [label,...value]=signal.split(':');return [label,value.join(':').trim()||signal]})).map(([label,value])=>`<div><dt>${esc(label)}</dt><dd${label==='Where'?' class="ml-build-blueprint-channels"':''}>${label==='Where'&&channelLogos?channelLogos:esc(value)}</dd></div>`).join(''):'';
    const creatives=(item.creatives||[]).map(art=>`<img src="assets/acme-creative-${esc(art)}.svg" alt="Creative preview" loading="lazy">`).join('');
    const attrs=`data-item="${section.id}:${index}" ${Number.isInteger(item.savedIndex)?`data-saved-index="${item.savedIndex}"`:''} data-plan-id="${esc(item.planId||'')}" data-initiative="${initiativeFor(item)}"`;
    if(isIdea)return `<article class="ml-build-row ml-build-recommended" ${attrs}><div class="ml-build-row-main"><h3>${esc(item.title)}<span class="ml-build-title-channels" aria-label="Channels">${channelLogos}</span>${item.recommended?'<span class="ml-build-recommendation">Recommended</span>':''}</h3><p>${esc(item.copy)}</p></div><div class="ml-build-budget"><strong>$${Number(item.budget||0).toLocaleString()}</strong></div><div class="ml-build-row-actions"><button type="button" class="ml-primary" data-discuss>Review idea <span aria-hidden="true">→</span></button><button type="button" class="mojo-see-why" data-why>See why</button></div></article>`;
    const stage=section.id==='ready'?'Ready to publish':section.id==='qa'?'Mojo QA':section.id==='live'?'Live':'Draft';
    const isReady=section.id==='ready',isQA=section.id==='qa',isLive=section.id==='live';
    const checklist=isLive?'<div class="ml-build-passed" aria-label="Published campaign"><span>Published to Demandbase Ads</span><span>Mojo is watching delivery</span></div>' : isReady?`<div class="ml-build-passed" aria-label="Completed checks"><span>Audience</span><span>Budget rule</span><span>Tracking</span><span>Ad specs</span><span>Name rule</span></div>`:
      `<div class="ml-build-checklist"><div class="ml-build-checklist-top"><strong>${isQA?'Mojo is checking setup':'Plan saved · ready to build'}</strong><span>${isQA?'Mojo QA':'Build'}</span></div><ul><li class="is-done"><span class="ml-build-check" aria-hidden="true">✓</span><span>${isQA?'Campaign setup saved':'Campaign brief saved'}</span></li><li><span class="ml-build-pending" aria-hidden="true"></span><span>${isQA?'Mojo checks tracking and rules':'Build audience and creative in Chat'}</span></li><li><span class="ml-build-pending" aria-hidden="true"></span><span>${isQA?'Review Mojo’s findings in Chat':'Set tracking and validation'}</span></li></ul></div>`;
    return `<article class="ml-build-row ml-build-work-card ${isDraft?'ml-build-draft':''} ${isReady?'ml-build-ready':''} ${isQA?'ml-build-qa':''} ${isLive?'ml-build-live':''}" ${attrs}><div class="ml-build-row-main"><div class="ml-build-row-head"><span class="ml-area">${esc(groupLabel(initiativeFor(item)))}</span><span class="ml-build-stage">${stage}</span></div><h3>${esc(item.title)}<span class="ml-build-title-channels" aria-label="Channels">${channelLogos}</span></h3><p>${esc(item.copy)}</p>${checklist}${isDraft||isLive?`<details class="ml-build-blueprint-details"><summary>View blueprint <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 7.5 5 5-5"/></svg></summary><dl class="ml-build-blueprint">${blueprint}</dl></details>`:''}</div><div class="ml-build-row-side">${creatives?`<div class="ml-build-creatives" aria-label="Recommended creatives">${creatives}</div>`:''}<div class="ml-build-row-actions"><button type="button" class="ml-primary" data-discuss>${isReady?'Review to publish':isQA?'Review Mojo’s QA':isLive?'View campaign':'Build in Chat'} <span aria-hidden="true">→</span></button><button type="button" class="mojo-see-why" data-why>See why</button></div></div></article>`;
  };
  const buildRows=section=>{
    if(section.id!=='recommended')return section.items.map((item,index)=>buildRow(item,index,section)).join('');
    const groups = new Map();
    section.items.forEach((item,index) => {
      const initiative = initiativeFor(item);
      if (!groups.has(initiative)) groups.set(initiative, []);
      groups.get(initiative).push([item,index]);
    });
    return [...groups].map(([initiative,items]) => `<section class="ml-build-group" data-group-initiative="${esc(initiative)}"><div class="ml-build-group-heading"><span class="ml-build-group-name">${esc(groupLabel(initiative))}</span><span class="ml-build-group-count">${items.length} ideas</span></div><div class="ml-build-group-list">${items.map(([item,itemIndex])=>buildRow(item,itemIndex,section)).join('')}</div></section>`).join('');
  };
  const buildFilters = `<div class="ml-build-filters"><details class="ml-build-scope"><summary><strong>All ${esc(groupingLabel.toLowerCase())}</strong><svg class="ml-build-scope-chevron" viewBox="0 0 16 16" aria-hidden="true"><path d="m3.5 6 4.5 4 4.5-4"/></svg></summary><div class="ml-build-scope-menu"><div class="ml-build-scope-group ml-build-initiative-options">${['All','visibility','expansion','coverage','acceleration'].map(name=>`<button type="button" data-build-initiative="${name}" aria-pressed="${name==='All'}">${name==='All'?`All ${esc(groupingLabel.toLowerCase())}`:esc(groupLabel(name))}</button>`).join('')}</div></div></details></div>`;
  main.innerHTML = `<div class="ml-wrap"><div class="ml-title"><h1>${state.title}</h1></div><p class="ml-lede">${state.lede}</p>${view==='build'?'':`<div class="ml-section-tabs" role="tablist" aria-label="${state.title} sections">${sections.map(section=>`<button type="button" role="tab" data-section="${section.id}" aria-selected="${section.id===active}">${section.title}</button>`).join('')}</div>`}${sections.map(section=>`<section class="ml-section" data-source-section="${section.id}" ${view!=='build'&&section.id!==active?'hidden':''}>${view==='optimize'?'':`<div class="ml-toolbar"><div><h2>${section.title}</h2>${view==='build'?`<span class="ml-section-count">${section.items.length}</span>`:`<p>${section.intro}</p>`}</div>${view==='build'&&section.id==='recommended'?buildFilters:''}${view==='build'&&section.id==='draft'&&section.items.length?'<button type="button" class="ml-text-button" data-new-campaign>Start with your own idea →</button>':''}</div>`}${view==='build'?`<div class="ml-build-list">${section.items.length?buildRows(section):`<div class="ml-build-empty"><span>${section.id==='qa'?'No campaigns for Mojo to check yet. Campaigns move here after setup.':section.id==='ready'?'Nothing ready to publish yet. Campaigns move here after Mojo completes QA.':section.id==='live'?'Live campaigns appear here after publishing.':'No drafts saved yet.'}</span>${section.id==='draft'?'<button type="button" class="ml-text-button" data-new-campaign>Start with your own idea →</button>':''}</div>`}</div>`:`<div class="ml-list">${section.items.map((item,index)=>`<article class="ml-card" data-item="${section.id}:${index}"><div class="ml-card-top"><span class="ml-area">${state.title}</span><span class="ml-source">${esc(item.source)}</span></div><h3>${esc(item.title)}</h3><p>${esc(item.copy)}</p><div class="ml-signal-row">${item.signals.map(signal=>`<span>${esc(signal)}</span>`).join('')}</div><div class="ml-card-footer"><button type="button" class="ml-primary" data-discuss>${esc(item.action)} <span class="ml-arrow" aria-hidden="true">→</span></button><button type="button" class="mojo-see-why" data-why>See why</button></div></article>`).join('')}</div>`}</section>`).join('')}</div>`;
  if(view==='build'&&location.hash==='#draft')requestAnimationFrame(()=>requestAnimationFrame(()=>main.querySelector('[data-source-section="draft"]')?.scrollIntoView({block:'start'})));
  if (view === 'build') {
    let selected='All';
    const applyBuildFilters = () => {
      main.querySelector('.ml-build-scope summary strong').textContent=selected==='All'?`All ${groupingLabel.toLowerCase()}`:groupLabel(selected);
      main.querySelectorAll('[data-group-initiative]').forEach(group=>{group.hidden=selected!=='All'&&selected!==group.dataset.groupInitiative;});
      const recommended=main.querySelector('[data-source-section="recommended"]');
      recommended?.querySelector('.ml-section-count')?.replaceChildren(document.createTextNode(String(recommended.querySelectorAll('.ml-build-group:not([hidden]) .ml-build-row').length)));
    };
    main.querySelector('.ml-build-filters').addEventListener('click',event=>{
      const initiativeButton=event.target.closest('[data-build-initiative]');
      if(initiativeButton){selected=initiativeButton.dataset.buildInitiative;main.querySelectorAll('[data-build-initiative]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.buildInitiative===selected)));applyBuildFilters();main.querySelector('.ml-build-scope').open=false;}
    });
    applyBuildFilters();
    document.addEventListener('mojo:build-status-changed',event=>{
      const savedIndex=Number(event.detail?.index);
      const status=event.detail?.status;
      if(!Number.isInteger(savedIndex)||!['draft','qa','ready','live'].includes(status))return;
      const source=sections.find(section=>section.items.some(item=>item.savedIndex===savedIndex));
      const destination=sections.find(section=>section.id===status);
      if(!source||!destination)return;
      const itemIndex=source.items.findIndex(item=>item.savedIndex===savedIndex);
      const [item]=source.items.splice(itemIndex,1);
      item.buildStatus=status;
      destination.items.push(item);
      const renderSection=section=>{
        const element=main.querySelector(`[data-source-section="${section.id}"]`);
        if(!element)return;
        const list=element.querySelector('.ml-build-list');
        const emptyText=section.id==='qa'?'No campaigns for Mojo to check yet. Campaigns move here after setup.':section.id==='ready'?'Nothing ready to publish yet. Campaigns move here after Mojo completes QA.':section.id==='live'?'Live campaigns appear here after publishing.':'No drafts saved yet.';
        list.innerHTML=section.items.length?buildRows(section):`<div class="ml-build-empty"><span>${emptyText}</span>${section.id==='draft'?'<button type="button" class="ml-text-button" data-new-campaign>Start with your own idea →</button>':''}</div>`;
        element.querySelector('.ml-section-count').textContent=String(section.items.length);
        const toolbarNew=element.querySelector('.ml-toolbar [data-new-campaign]');
        if(toolbarNew)toolbarNew.hidden=section.items.length===0;
      };
      renderSection(source);
      if(source!==destination)renderSection(destination);
      history.replaceState(null,'',`${location.pathname}${location.search}#${destination.id}`);
      main.querySelector(`[data-source-section="${destination.id}"]`)?.scrollIntoView({block:'start',behavior:'smooth'});
    });
  }

  const body = () => document.querySelector('.chatpane .chatbody');
  const openChat = () => { window.MojoOpenChat?.('', false); return body(); };
  window.MojoOpenCampaignCreator = () => {
    const log=openChat();if(!log)return;
    log.querySelector('.ml-chat-card')?.remove();
    log.querySelector('.seq-chat-empty')?.remove();
    const panel=document.createElement('section');panel.className='ml-chat-card';
    panel.innerHTML='<h2>What are you planning?</h2><p>Tell me the event, audience or result you have in mind. I’ll draft the campaign for your review.</p>';
    log.append(panel);document.querySelector('.chatpane .chatfoot textarea')?.focus();
  };
  function draft(item, section) {
    const log = openChat(); if (!log) return;
    log.querySelector('.ml-chat-card')?.remove();
    log.querySelector('.seq-chat-empty')?.remove();
    const panel = document.createElement('section'); panel.className = 'ml-chat-card';
    const qaReview=section.id==='qa'&&Number.isInteger(item.savedIndex)?'<div class="ml-chat-qa"><strong>Mojo QA findings</strong><p>Mojo checked setup and tracking. Review its findings, then approve the campaign for final publishing review.</p><button type="button" data-qa-approve>Approve for publishing →</button></div>':'';
    panel.innerHTML = `<small>${esc(state.title)} · ${esc(section.title)}</small><h2>${esc(item.title)}</h2><p>${esc(item.copy)}</p><details class="ml-chat-support"><summary>Why Mojo suggested this</summary><p>${esc(item.source)}</p><ul>${item.signals.map(signal=>`<li>${esc(signal)}</li>`).join('')}</ul></details>${qaReview}<p>${section.id==='ready'?'Audience, creative, budget, ad groups and tracking need your review before anything goes live.':section.id==='qa'?'Would you like Mojo to change anything before you approve?':'What would you like to check or change?'}</p><div class="ml-chat-actions"><button type="button" data-draft-step="audience">Audience</button><button type="button" data-draft-step="creative">Creative</button><button type="button" data-draft-step="budget">Budget and dates</button></div>${item.href?`<p class="ml-chat-source"><a href="${esc(item.href)}">Open the full view →</a></p>`:''}`;
    log.append(panel); panel.scrollIntoView({block:'nearest',behavior:'smooth'});
    panel.addEventListener('click', event => {
      if(event.target.closest('[data-qa-approve]')){
        let all=[];try{all=JSON.parse(localStorage.getItem('mojo-created-campaign-drafts-v1')||'[]')}catch{}
        const saved=Array.isArray(all)?all[item.savedIndex]:null;
        if(!saved)return;
        saved.buildStatus='ready';
        localStorage.setItem('mojo-created-campaign-drafts-v1',JSON.stringify(all));
        document.dispatchEvent(new CustomEvent('mojo:build-status-changed',{detail:{index:item.savedIndex,status:'ready'}}));
        panel.querySelector('.ml-chat-qa').innerHTML='<strong>Approved for publishing</strong><p>This campaign is now in Ready to publish. Review it there before launch.</p>';
        return;
      }
      const step = event.target.closest('[data-draft-step]')?.dataset.draftStep;
      if (!step) return;
      const questions={audience:'Which audience should this campaign use?',creative:'Which message and creative should we use?',budget:'What budget and dates should we set?'};
      const field=document.querySelector('.chatpane .chatfoot textarea');
      if(field){field.value=questions[step];field.dispatchEvent(new Event('input',{bubbles:true}));field.focus();}
    });
  }
  main.addEventListener('click', event => {
    const sectionButton=event.target.closest('[data-section]');
    if(sectionButton){
      const id=sectionButton.dataset.section;
      main.querySelectorAll('.ml-section').forEach(section=>section.hidden=section.dataset.sourceSection!==id);
      main.querySelectorAll('[data-section]').forEach(button=>button.setAttribute('aria-selected',String(button.dataset.section===id)));
      history.replaceState(null,'',`${location.pathname}${location.search}#${id}`);
      return;
    }
    const card=event.target.closest('.ml-card,.ml-build-row');
    const [sectionId,itemIndex]=(card?.dataset.item||'').split(':');
    const section=sections.find(entry=>entry.id===sectionId);
    const item=section?.items[Number(itemIndex)];
    if(event.target.closest('[data-new-campaign]')){window.MojoOpenCampaignCreator();return;}
    if(!item)return;
    const showWhy=(trigger)=>{
      const isRule=/best practice|rule|naming|end date|tracking tag/i.test(`${item.title} ${item.source}`);
      const planSources={visibility:'AI comparison answer checks and Demandbase intent',coverage:'Demandbase Evaluation accounts and buying groups',acceleration:'Demandbase buying groups and Q4 campaign results',expansion:'Demandbase customer accounts and intent signals'};
      const dataSource=view==='build'&&(section.id==='recommended'||section.id==='draft')?planSources[initiativeFor(item)]||'Saved campaign plan':item.source;
      const triggerReason=section.id==='recommended' ? `${item.copy}${item.message?` · ${item.message}`:''}` : (item.signals||[]).slice(0,2).join(' · ')||item.copy;
      const nextStep=view==='build'
        ? section.id==='recommended'?'Review the audience, message, channels and spend before starting the campaign.':section.id==='draft'?'Review the saved blueprint, then send the draft through QA.':'Resolve the flagged setup item before publishing.'
        : item.action==='Discuss pacing'?'Check flight dates and delivery before changing spend.':`Review the source record, then ${String(item.action||'choose the next step').replace(/^./,c=>c.toLowerCase())}.`;
      window.MojoSeeWhy?.open({title:item.title,reason:item.copy,source:dataSource,triggerType:isRule?'Best practice':'Mojo Brain',triggerReason,nextStep,href:item.href||`${location.pathname}${location.search}#${section.id}`,linkLabel:'Open the relevant view'},trigger);
    };
    const whyButton=event.target.closest('[data-why]');
    if(whyButton){
      showWhy(whyButton);
      return;
    }
    if(event.target.closest('[data-discuss]')){
      if(view==='build') draft(item,section);
      else showWhy();
    }
  });
})();
