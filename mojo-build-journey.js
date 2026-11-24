/* Build shows campaigns Mojo is preparing. QA is computed, never a user step. */
(() => {
  if (!location.pathname.endsWith('/CampaignLifecycle.html') || new URLSearchParams(location.search).get('view') !== 'build') return;
  const key = 'mojo-created-campaign-drafts-v1';
  const main = document.getElementById('lifecycle-content');
  if (!main) return;
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[char]));
  const read = () => { try { const items = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(items) ? items : []; } catch { return []; } };
  const write = items => { localStorage.setItem(key, JSON.stringify(items)); document.dispatchEvent(new Event('mojo:campaign-queue-changed')); };
  const catalog = () => window.MojoPlanCatalog?.items || [];
  const option = draft => catalog().find(item => item.id === draft.source);
  const initiative = draft => {
    const source=String(draft.source||option(draft)?.id||'');
    const area=source.startsWith('buying_group')?'buying_group':source.startsWith('customer_growth')?'customer_growth':source.startsWith('regional')?'regional':source.startsWith('capture')?'capture':'';
    const entry=window.MojoInitiatives?.entries.find(item=>item.area===area);
    return entry?.name||window.MojoInitiatives?.entries.find(item=>item.name===draft.initiative)?.name||'Q4 net-new pipeline';
  };
  const bp = draft => Object.fromEntries(draft.planBlueprint || option(draft)?.blueprint || []);
  const channel = draft => draft.buildChannel || draft.buildSetup?.channels || (draft.channels || option(draft)?.channels || [])[0] || 'Demandbase Ads';
  const channelLogo = draft => {
    const name = String(channel(draft));
    const asset = /LinkedIn/i.test(name) ? 'assets/linkedin.png' : /Google/i.test(name) ? 'assets/google-ads.svg' : /Demandbase/i.test(name) ? 'assets/demandbase.png' : '';
    return asset ? `<img class="mbj-channel-logo" src="${asset}" alt="${escape(name)}" title="${escape(name)}">` : escape(name);
  };
  const creativeTitles = {buyers:'Every buyer. One flow.',handoff:'Make the handoff the easy part.',momentum:'Keep momentum moving.'};
  const creativePreviews = (draft, creative) => {
    if (!creative) return '';
    const arts = Array.isArray(draft.creatives) && draft.creatives.length ? draft.creatives : option(draft)?.creatives || [];
    const thumbnails = /Google|Search/i.test(channel(draft))
      ? `<div class="mbj-creative-search" role="img" aria-label="Search ad preview: ${escape(creative)}"><span>Sponsored · acme.com</span><strong>${escape(creative)}</strong><small>acme.com › solutions</small></div>`
      : arts.filter(art => creativeTitles[art]).slice(0,3).map(art => `<figure><img src="assets/acme-creative-${art}.svg" alt="${escape(creativeTitles[art])} creative concept" title="${escape(creativeTitles[art])}" loading="lazy"></figure>`).join('') || `<div class="mbj-creative-fallback" role="img" aria-label="Creative preview: ${escape(creative)}"><span>Acme Co</span><strong>${escape(creative)}</strong><small>Explore solutions →</small></div>`;
    return `<section class="mbj-creative-previews" aria-label="Creative previews"><h4>Creative previews</h4><div class="mbj-creative-thumbnails">${thumbnails}</div></section>`;
  };
  const facts = draft => {
    const plan = bp(draft), setup = draft.buildSetup || {}, detail = draft.deliverables || {};
    return {
      audience: detail.audience || setup.audience || plan.Who || draft.audience || option(draft)?.who || '',
      creative: detail.creative || setup.message || plan.Message || draft.creative || option(draft)?.message || '',
      tracking: detail.tracking || setup.utm || '',
      keywords: detail.keywords || '',
      budget: detail.budget || setup.budget || plan.Spend || (draft.budget ? '$' + Number(draft.budget).toLocaleString() : ''),
      flight: detail.flight || (draft.duration ? draft.duration + ' days' : ''),
      landing: detail.landing || '',
      messaging: detail.messaging || setup.message || plan.Message || draft.creative || option(draft)?.message || '',
      conversion: detail.conversion || setup.conversion || '',
      validation: detail.validation || setup.validation || '',
      assets: Array.isArray(draft.creatives) ? draft.creatives : option(draft)?.creatives || []
    };
  };
  const keywordRequired = draft => /Google|Search/i.test(channel(draft));
  const qa = draft => {
    const f = facts(draft), missing = [];
    if (!f.audience) missing.push('audience');
    if (!f.creative) missing.push('creative');
    if (!f.tracking) missing.push('tracking');
    if (keywordRequired(draft) && !f.keywords) missing.push('intent keywords');
    if (!f.budget || !f.flight) missing.push('budget and flight');
    if (!f.landing) missing.push('landing page');
    if (!f.messaging) missing.push('messaging');
    if (draft.budgetApproved === false) missing.push('budget approval');
    /* Platform rules (headline limits, required targeting, URL format...) come from mojo-ad-platforms.js. */
    (window.MojoAdPlatforms?.issues(draft, f) || []).filter(item => !item.core || !item.empty).forEach(item => { if (!missing.includes(item.label)) missing.push(item.label); });
    const tone = missing.some(item => item === 'tracking' || item === 'landing page') ? 'red' : missing.length ? 'orange' : 'green';
    return {missing, tone, passed: !missing.length};
  };
  const qaField = {'audience':'Audience','creative':'Creative','tracking':'Tracking','intent keywords':'Intent keywords','budget and flight':'Budget and flight','landing page':'Landing page URL','messaging':'Messaging','budget approval':'Budget approval'};
  const qaNeeds = draft => qa(draft).missing.map(item => qaField[item] || item);
  const isRecent = draft => draft.buildStatus === 'live' && draft.publishedAt && Date.now() - new Date(draft.publishedAt).getTime() < 7 * 86400000 && !draft.hasData;
  const stage = draft => draft.buildStatus === 'live' ? isRecent(draft) ? 'recent' : 'report' : qa(draft).passed && draft.buildSetup ? 'ready' : 'draft';
  const check = '<span class="mbj-check" aria-hidden="true">✓</span>';
  const pending = '<span class="mbj-pending" aria-hidden="true"></span>';
  const issue = draft => {
    const missing = qa(draft).missing;
    if (missing.includes('tracking')) return {tone:'red', label:'Fix campaign tracking'};
    if (missing.includes('landing page')) return {tone:'red', label:'Add the landing page URL'};
    if (missing.includes('budget approval')) return {tone:'orange', label:'Review budget approval'};
    return null;
  };
  function normalizeSavedCampaigns() {
    const items=read(), next=[], existingIds=new Set(items.map(item=>item?.id));
    let changed=false;
    items.forEach(item=>{
      if(!item?.name){next.push(item);return}
      if(item.buildStatus==='live'&&!item.publishedAt){item.publishedAt=new Date().toISOString();changed=true}
      if((item.channels||[]).length<2||item.buildSetup||item.buildChannel){next.push(item);return}
      changed=true;
      const channels=item.channels.filter(name=>!/Salesforce/i.test(name));
      channels.forEach((name,index)=>{
        const id=(item.id||item.name)+'--'+name.toLowerCase().replace(/[^a-z0-9]+/g,'-');
        if(existingIds.has(id))return;
        next.push({...item,id,name:item.name+' · '+name,channels:[name],buildChannel:name,budget:Math.round(Number(item.budget||0)/channels.length),savedAt:new Date(new Date(item.savedAt||Date.now()).getTime()+index).toISOString()});
      });
    });
    if(changed)write(next);
  }
  function seedExamples() {
    if (localStorage.getItem('mojo-build-journey-seeded-v1')) return;
    localStorage.setItem('mojo-build-journey-seeded-v1', 'true');
    if (read().length) return;
    const examples = [
      ['buying_group','Demandbase Ads',15000,{audience:'1,146 engaged accounts',creative:'Finance and security proof',tracking:'utm_campaign=buying_group_follow_up',keywords:'',budget:'$15,000',flight:'Nov 11–Dec 18',landing:'https://acme.com/buying-groups',messaging:'Reach the missing finance and security buyers',conversion:'Evaluation meeting',validation:'Compare buyer-role coverage with unexposed accounts'}],
      ['buying_group_owner','LinkedIn Ads',7500,{audience:'412 Evaluation accounts missing finance or security',creative:'',tracking:'utm_campaign=finance_security',keywords:'',budget:'$7,500',flight:'28 days',landing:'',messaging:'Role-specific finance and security proof',conversion:'Evaluation meeting',validation:'Check new buyer roles and meetings'}],
      ['buying_group_search','Google Ads',9000,{audience:'Up to 412 accounts with relevant intent',creative:'Evaluation proof search ad',tracking:'utm_campaign=evaluation_intent',keywords:'vendor comparison, evaluation proof',budget:'$9,000',flight:'28 days',landing:'https://acme.com/evaluation',messaging:'Get the proof to evaluate Acme',conversion:'Evaluation meeting',validation:'Compare meetings with unexposed accounts'}]
    ];
    write(examples.map(([source,buildChannel,budget,deliverables],index) => {
      const idea = catalog().find(item => item.id === source);
      return {id:'build-demo-'+source,source,name:idea?.title || source,planTitle:idea?.title,initiative:'Land',channels:[buildChannel],buildChannel,budget,duration:source==='buying_group'?42:28,audience:deliverables.audience,creative:deliverables.creative,planBlueprint:idea?.blueprint || [],deliverables,buildSetup:{audience:deliverables.audience,message:deliverables.creative,channels:buildChannel,budget:deliverables.budget,utm:deliverables.tracking,conversion:deliverables.conversion,validation:deliverables.validation},buildStatus:'draft',savedAt:new Date(Date.now()-index*60000).toISOString()};
    }));
  }
  function syncLaunchTodayIdeas() {
    const syncKey='mojo-build-launch-today-synced-v1';
    if(localStorage.getItem(syncKey))return;
    const items=read(), additions=[];
    const landingPages={buying_group:'https://acme.com/buying-groups',regional:'https://acme.com/solutions',capture:'https://acme.com/compare',customer_growth:'https://acme.com/customers'};
    catalog().filter(idea=>idea.readiness==='Launch today').forEach(idea=>{
      (idea.channels||[]).filter(name=>!/Salesforce/i.test(name)).forEach(name=>{
        if(items.some(item=>item.source===idea.id && channel(item)===name))return;
        const slug=idea.id+'-'+name.toLowerCase().replace(/[^a-z0-9]+/g,'-');
        const budget=Math.round(Number(idea.budget||0)/(idea.channels||[]).length);
        const deliverables={audience:idea.who,creative:idea.message,tracking:'utm_campaign='+idea.id,keywords:/Google|Search/i.test(name)?'category comparison, evaluation proof':'',budget:'$'+budget.toLocaleString(),flight:idea.duration+' days',landing:landingPages[idea.id]||'https://acme.com',messaging:idea.message,conversion:'Evaluation meeting',validation:idea.goal};
        additions.push({id:'plan-launch-today-'+slug,source:idea.id,name:idea.title,planTitle:idea.title,initiative:idea.initiative,channels:[name],buildChannel:name,budget,duration:idea.duration,audience:idea.who,creative:idea.message,planBlueprint:idea.blueprint,deliverables,buildSetup:{audience:deliverables.audience,message:deliverables.creative,channels:name,budget:deliverables.budget,utm:deliverables.tracking,conversion:deliverables.conversion,validation:deliverables.validation},buildStatus:'ready',savedAt:new Date().toISOString()});
      });
    });
    localStorage.setItem(syncKey,'true');
    if(additions.length)write([...items,...additions]);
  }
  const root = document.createElement('div');
  root.className = 'mbj-root';
  const selectedReady = new Set();
  let reviewIndices = [];
  let deleteIndex = null;
  let launchInProgress = false;
  let launchNotice = null;
  let qaNotice = null;
  let newlyLaunchedIndices = new Set();
  let justReady = null;
  let groupsCache = [];
  let recentOpen = false; /* Recently launched starts collapsed */
  main.append(root);
  main.classList.add('mbj-active');
  function deliverable(label, value, note, required = true, error = false, fixField = '', fixForm = '') {
    const done = !required || !!value;
    const copy = `<strong>${escape(label)}</strong><small>${escape(required ? note : 'Not needed for this channel')}</small>`;
    if (!done && fixForm) return `<li class="missing error has-fix">${'<span class="mbj-pending" aria-hidden="true">!</span>'}<span>${copy}${fixForm}</span></li>`;
    return `<li class="${done?'done':error?'missing error':'missing'}">${done?check:error?'<span class="mbj-pending" aria-hidden="true">!</span>':pending}${!done&&fixField?`<a href="#" class="mbj-fix-link" data-fix-field="${fixField}">${copy}</a>`:`<span>${copy}</span>`}</li>`;
  }
  function platformField(name, value, facts) {
    const needsLanding = name === 'Landing page' && !facts.landing;
    const link = text => `<a href="#" class="mbj-fix-link" data-fix-field="landing">${escape(text)}</a>`;
    return `<div class="${needsLanding?'mbj-platform-error':''}"><dt>${needsLanding?link(name):escape(name)}</dt><dd>${needsLanding?link(value||'Waiting'):escape(value||'Waiting')}</dd></div>`;
  }
  /* Summary bar: what needs you, what's ready, and what it costs. Plain sums of the entered budgets. */
  const moneyOf = value => { const n = Number(String(value ?? '').replace(/[^0-9.]/g, '')); return Number.isFinite(n) ? n : 0; };
  const usd = n => '$' + Math.round(n).toLocaleString();
  function batchLabel() {
    const items = read(), groups = groupsOf(items), readyGroups = groups.filter(group => group.stage === 'ready');
    const drafts = groups.filter(group => group.stage === 'draft').length;
    const selectedGroups = readyGroups.filter(group => group.readyIndices.some(i => selectedReady.has(i)));
    if (selectedReady.size) return `<strong>${selectedGroups.length} of ${readyGroups.length}</strong> selected · ${usd([...selectedReady].reduce((sum, i) => sum + moneyOf(facts(items[i] || {}).budget), 0))}`;
    const total = readyGroups.flatMap(group => group.readyIndices).reduce((sum, i) => sum + moneyOf(facts(items[i]).budget), 0);
    return `${drafts ? `<span class="mbj-batch-needs"><strong>${drafts}</strong> ${drafts === 1 ? 'needs' : 'need'} you</span> · ` : ''}<strong>${readyGroups.length} ready to launch</strong> · ${usd(total)} ready to spend`;
  }
  const selectedGroupCount = () => groupsOf(read()).filter(group => group.stage === 'ready' && group.readyIndices.some(i => selectedReady.has(i))).length;
  const batchButton = () => { const n = groupsOf(read()).filter(group => group.stage === 'ready').length; return n === 1 ? 'Launch campaign →' : `Launch all ${n} →`; };
  /* Fix on the card: when a draft is missing only its landing page or tracking, ask for it right here. */
  const inlineFixes = {landing: {label: 'Landing page URL', placeholder: 'https://acme.com/…', type: 'url'}, tracking: {label: 'Campaign tracking', placeholder: 'utm_campaign=…', type: 'text'}};
  function inlineFix(draft) {
    const missing = qa(draft).missing;
    if (missing.length !== 1) return '';
    const key = {'landing page': 'landing', tracking: 'tracking'}[missing[0]];
    if (!key) return '';
    const f = inlineFixes[key];
    return `<form class="mbj-inline-fix" data-inline-fix="${key}" novalidate><label><span class="sr-only">${f.label}</span><input type="${f.type}" name="value" placeholder="${f.placeholder}" autocomplete="off" aria-label="${f.label}"></label><button type="submit">Save</button><small class="mbj-inline-error" role="alert"></small></form>`;
  }
  /* A campaign = drafts that share a plan source, one per platform. The list shows one card per campaign. */
  const SYNC_KEYS = ['audience', 'creative', 'messaging', 'landing', 'tracking', 'flight', 'conversion', 'validation'];
  const groupKey = item => item.source || item.id;
  function groupsOf(items) {
    const map = new Map();
    items.forEach((item, index) => { if (!item?.name) return; const key = groupKey(item); if (!map.has(key)) map.set(key, []); map.get(key).push(index); });
    return [...map.values()].map(indices => {
      const members = indices.map(index => ({index, item: items[index], stage: stage(items[index])}));
      const open = members.filter(member => member.stage !== 'recent' && member.stage !== 'report');
      const groupStage = !open.length ? (members.some(member => member.stage === 'recent') ? 'recent' : 'report') : open.some(member => member.stage === 'draft') ? 'draft' : 'ready';
      const lead = open.find(member => member.stage === 'draft') || open[0] || members[0];
      return {indices, members, open, stage: groupStage, lead, readyIndices: open.filter(member => member.stage === 'ready').map(member => member.index)};
    });
  }
  /* Shared settings edited in one place (chat form, card fix) reach the campaign's other platforms. */
  function syncSiblings(items, item) {
    items.forEach(other => {
      if (!other || other === item || groupKey(other) !== groupKey(item) || other.buildStatus === 'live') return;
      other.deliverables = {...facts(other), ...(other.deliverables || {})};
      delete other.deliverables.assets;
      SYNC_KEYS.forEach(key => { other.deliverables[key] = facts(item)[key]; });
      other.buildSetup = {...(other.buildSetup || {}), audience: other.deliverables.audience, message: other.deliverables.creative, utm: other.deliverables.tracking, conversion: other.deliverables.conversion, validation: other.deliverables.validation};
      if (other.buildStatus !== 'live') other.buildStatus = qa(other).passed ? 'ready' : 'draft';
    });
  }
  function groupCard(group) {
    const {lead, members, open} = group, draft = lead.item, index = lead.index, state = group.stage, f = facts(draft);
    const indexAttr = group.indices.join(',');
    const isOpen = root.querySelector(`[data-build-group="${indexAttr}"] details`)?.open;
    const fixForm = state === 'draft' && open.filter(member => member.stage === 'draft').every(member => qa(member.item).missing.length === 1 && qa(member.item).missing[0] === qa(draft).missing[0]) ? inlineFix(draft) : '';
    const fixKey = fixForm.match(/data-inline-fix="(\w+)"/)?.[1] || '';
    const hasSearch = members.some(member => keywordRequired(member.item));
    const searchMember = members.find(member => keywordRequired(member.item));
    const progress = [
      deliverable('Audience',f.audience,f.audience?'Found the audience · '+f.audience:'Mojo is finding the audience'),
      deliverable('Creative and tracking',f.creative && f.tracking,f.creative && f.tracking?'Using creative with tracking · '+f.creative:!f.creative?'Creative needed before launch':'Tracking needed before launch',true,!f.tracking,!f.tracking?'tracking':'',fixKey==='tracking'?fixForm:''),
      ...(hasSearch ? [deliverable('Intent keywords',facts(searchMember.item).keywords,'Keywords · '+facts(searchMember.item).keywords,true)] : []),
      deliverable('Budget and flight',open.every(member => facts(member.item).budget) && f.flight,'Planned · '+[usd(members.reduce((sum, member) => sum + moneyOf(facts(member.item).budget), 0)),f.flight].filter(Boolean).join(' · ')),
      deliverable('Landing page and messaging',f.landing && f.messaging,f.landing && f.messaging?'Landing page · '+f.landing:!f.landing?'Landing page URL needed before launch':'Messaging needed before launch',true,!f.landing,!f.landing?'landing':'',fixKey==='landing'?fixForm:'')
    ].join('');
    /* Status names the issue, and the platform when it's platform-specific. */
    const firstIssue = open.map(member => ({member, need: qaNeeds(member.item)[0]})).find(entry => entry.need);
    const sharedNeed = firstIssue && ['Landing page URL', 'Tracking', 'Audience', 'Creative', 'Messaging', 'Budget and flight', 'Budget approval'].includes(firstIssue.need);
    const needText = firstIssue ? firstIssue.need.replace(/^[A-Z](?=[a-z])/, c => c.toLowerCase()) + (!sharedNeed && open.length > 1 ? ` on ${channel(firstIssue.member.item)}` : '') : '';
    const tone = state === 'draft' ? qa(firstIssue?.member.item || draft).tone : 'green';
    const logos = members.map(member => channelLogo(member.item)).join('');
    const platformsRow = members.length > 1 ? `<ul class="mbj-platform-rows">${members.map(member => { const live = member.stage === 'recent' || member.stage === 'report'; const need = qaNeeds(member.item)[0]; return `<li>${channelLogo(member.item)}<span>${escape(channel(member.item))}</span><small>${escape(facts(member.item).budget || '')}</small><em class="${live ? 'live' : need ? 'bad' : 'ok'}">${live ? 'Live' : need ? 'Needs ' + escape(need.replace(/^[A-Z](?=[a-z])/, c => c.toLowerCase())) : check + 'QA’d'}</em></li>`; }).join('')}</ul>` : '';
    const budgetRow = members.length > 1 ? members.map(member => `${channel(member.item).replace(/ Ads$/, '')} ${facts(member.item).budget || '—'}`).join(' · ') : f.budget;
    const tableRows = [['Audience',f.audience],['Creative',f.creative],['Tracking',f.tracking],...(hasSearch ? [['Intent keywords', facts(searchMember.item).keywords]] : []),['Budget',budgetRow],['Flight',f.flight],['Landing page',f.landing],['Message',f.messaging],['Conversion event',f.conversion],['Validation',f.validation]];
    const canvasLink = state!=='recent' && canEditInCanvas(draft) ? '<a href="#" class="mbj-canvas-link" data-canvas>Edit in canvas</a>' : '';
    const launchLabel = open.length > 1 ? `Launch on ${open.length} platforms →` : 'Launch campaign →';
    const action = state==='ready' ? `<button type="button" class="mbj-launch" data-launch>${launchLabel}</button><a href="#" data-review-in-chat>Preview in chat</a>`+canvasLink : state==='recent' ? '' : '<button type="button" data-resolve>Preview in chat</button>'+canvasLink;
    const dataWait = state==='recent' ? '<p class="mbj-data-wait"><strong>Waiting for first data.</strong> The ad platforms have not reported delivery yet. <a href="Portfolio.html#campaigns">Open Report →</a></p>' : '';
    const remove = state==='recent' ? '' : '<button type="button" class="mbj-delete-icon" data-delete aria-label="Delete draft" title="Delete draft"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 10v7M14 10v7"/></svg></button>';
    const isNew = state==='recent' && group.indices.some(i => newlyLaunchedIndices.has(i));
    const need = state==='draft' ? `<span class="mbj-need ${tone}"><span class="mbj-dot ${tone}" aria-hidden="true"></span>Needs ${escape(needText || 'a fix')}</span>` : '';
    const chevron = '<svg class="mbj-chev" viewBox="0 0 20 20" aria-hidden="true"><path d="m5 7 5 5 5-5"/></svg>';
    return `<article class="mbj-card${isNew?' is-new-launch':''}${group.indices.includes(justReady)?' is-just-ready':''}" data-build-index="${index}" data-build-group="${indexAttr}" data-stage="${state}"><details ${isOpen?'open':''}><summary class="mbj-row" aria-label="${escape(draft.planTitle||draft.name)}: show deliverables and platform fields"><div class="mbj-row-main"><span class="mbj-initiative">${escape(initiative(draft))}</span><h3>${escape(draft.planTitle||draft.name)}</h3><p>${escape(f.audience)}</p>${dataWait}</div><div class="mbj-row-right">${need}<span class="mbj-logos">${logos}</span></div>${chevron}</summary><div class="mbj-details">${platformsRow}<ul class="mbj-deliverables">${progress}</ul>${creativePreviews(draft,f.creative)}<div class="mbj-platform"><h4>${state==='recent'?'Fields sent to':'Fields Mojo will fill in'} <span class="mbj-logos">${logos}</span></h4><dl>${tableRows.map(([name,value])=>platformField(name,value,f)).join('')}</dl></div>${action||remove?`<div class="mbj-actions">${action}${remove}</div>`:''}</div></details></article>`;
  }
  function render() {
    const items=read(), lists={draft:[],ready:[],recent:[]};
    const groups=groupsOf(items);
    groupsCache=groups;
    groups.forEach(group=>{const item=group.lead.item,name=escape(item.planTitle||item.name);if(launchNotice&&group.indices.some(i=>launchNotice.indices.includes(i)))lists.ready.push(`<div class="mbj-launch-confirmation" role="status" tabindex="-1">${check}<div><strong>Campaign launched</strong><span>${name} moved to Recently launched${group.members.length>1?` on ${group.members.length} platforms`:''}. Mojo is watching for first data.</span></div></div>`);if(qaNotice&&group.indices.includes(qaNotice.index)&&lists[group.stage])lists[group.stage].push(`<div class="mbj-qa-confirmation" role="status" tabindex="-1">${check}<div><strong>Mojo QA started</strong><span>${qaNotice.passed?name+' passed Mojo QA and moved to Ready to launch.':'Mojo will flag any missing setup for '+name+' before publishing.'}</span></div></div>`);if(lists[group.stage])lists[group.stage].push(groupCard(group));});
    const ready=groups.filter(group=>group.stage==='ready').flatMap(group=>group.readyIndices);
    const readyGroupCount=groups.filter(group=>group.stage==='ready').length;
    for(const index of [...selectedReady])if(!ready.includes(index))selectedReady.delete(index);
    root.innerHTML=`<header><h1>Build</h1><p>Mojo gathers each campaign’s deliverables, checks the setup, and gets it ready for your launch.</p><a class="mbj-ideas-link" href="Strategy.html#ideas">Browse ideas in Plan →</a></header>${groups.some(group=>group.stage==='draft'||group.stage==='ready')?`<div class="mbj-batch"><span data-selected-count>${batchLabel()}</span>${readyGroupCount?`<button type="button" data-review-launch>${batchButton()}</button>`:''}</div>`:''}${[['draft','Draft'],['ready','Ready to launch'],['recent','Recently launched']].map(([name,title])=>`${name==='recent'?`<section class="mbj-section mbj-section-recent" data-build-section="recent"><details data-recent-toggle ${recentOpen?'open':''}><summary class="mbj-section-head"><h2>${title}</h2><svg class="mbj-recent-chevron" viewBox="0 0 20 20" aria-hidden="true"><path d="m7 5 5 5-5 5"/></svg><span>${lists[name].filter(html=>html.startsWith('<article')).length}</span></summary>${lists[name].length?lists[name].join(''):'<p class="mbj-empty">No launches in the last 7 days.</p>'}</details></section>`:`<section class="mbj-section" data-build-section="${name}"><div class="mbj-section-head"><h2>${title}</h2><span>${name==='ready'?readyGroupCount:lists[name].filter(html=>html.startsWith('<article')).length}</span></div>${lists[name].length?lists[name].join(''):`<p class="mbj-empty">${name==='ready'?'Mojo is checking campaign deliverables.':'No drafts yet.'}</p>`}</section>`}`).join('')}<dialog class="mbj-launch-review" aria-labelledby="mbj-review-title"><h2 id="mbj-review-title">Review campaigns to launch</h2><p>Mojo QA passed for each one. Uncheck anything you want to hold back.</p><ul data-review-list></ul><div class="mbj-review-actions"><button type="button" data-cancel-launch>Cancel</button><a href="#" data-review-details>Review campaign details</a><button type="button" data-confirm-launch>Launch selected campaigns →</button></div></dialog><dialog class="mbj-launch-review mbj-delete-review" aria-labelledby="mbj-delete-title"><h2 id="mbj-delete-title">Delete draft campaign?</h2><p data-delete-description></p><div class="mbj-review-actions"><button type="button" data-cancel-delete>Cancel</button><button type="button" data-confirm-delete>Delete draft</button></div></dialog>`;
  }
  /* Quick changes happen in Chat; "Edit in canvas" opens the full editor (mojo-canvas-editor.js). */
  const canEditInCanvas = draft => !!window.MojoCanvasEditor?.canEdit(draft);
  function editInCanvas(index, field = '') {
    if (window.MojoCanvasEditor?.open(index, field)) return;
    openChat(index, field);
  }
  function openChat(index, fixField = '') {
    const draft=read()[index];if(!draft)return;
    const chatToggle=document.getElementById('chatOn');
    if(chatToggle&&!chatToggle.checked){chatToggle.checked=true;chatToggle.dispatchEvent(new Event('change',{bubbles:true}))}
    document.querySelector('[data-home-pane="chat"][aria-expanded="false"]')?.click();
    const body=document.querySelector('.chatpane .chatbody');if(!body)return;
    body.querySelector('.mbj-editor')?.remove();
    body.querySelector('.mbj-review-chat')?.remove();
    const f=facts(draft),editor=document.createElement('section');editor.className='mbj-editor';
    const fixGuidance={landing:'Add the final landing page URL for this campaign. Save the setup to rerun Mojo QA.',tracking:'Add the campaign tracking value, then save the setup to rerun Mojo QA.'}[fixField];
    const fieldLabels=[['audience','Audience'],['creative','Creative'],['tracking','Tracking'],['keywords','Intent keywords'],['budget','Budget'],['flight','Flight'],['landing','Landing page URL'],['messaging','Messaging'],['conversion','Conversion event'],['validation','Validation check']];
    const orderedFields=fixField?[...fieldLabels.filter(([name])=>name===fixField),...fieldLabels.filter(([name])=>name!==fixField)]:fieldLabels;
    const canvasButton=canEditInCanvas(draft)?`<button type="button" class="mbj-open-canvas" data-open-canvas="${index}" data-open-canvas-field="${escape(fixField)}">Edit in canvas<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M8 4H4v12h12v-4M11 4h5v5M16 4l-7 7"/></svg></button>`:'';
    editor.innerHTML=`<div class="mbj-editor-head"><h3>Finish ${escape(draft.planTitle||draft.name)}</h3>${canvasButton}</div><p>Quick changes here. Mojo rechecks the setup when you save. For targeting, ad copy and every ${escape(channel(draft))} setting, edit in canvas.</p><p class="mbj-qa-needs" role="status">${qaNeeds(draft).length?'To finish QA: '+escape(qaNeeds(draft).join(' · ')):'All required deliverables are ready.'}</p>${fixGuidance?`<p class="mbj-fix-guidance"><strong>How to fix it</strong> ${escape(fixGuidance)}</p>`:''}${creativePreviews(draft,f.creative)}<form>${orderedFields.map(([name,label])=>`<label data-field="${name}">${label}<input name="${name}" value="${escape(f[name])}"></label>`).join('')}<label class="mbj-approve" data-field="budgetApproved"><input type="checkbox" name="budgetApproved" ${draft.budgetApproved!==false?'checked':''}>Budget approved under company rules</label><div class="mbj-editor-actions"><button type="submit">Save campaign setup →</button>${canEditInCanvas(draft)?`<button type="button" class="mbj-canvas-text-link" data-open-canvas="${index}">Edit in canvas</button>`:''}</div></form>`;
    body.append(editor);editor.scrollIntoView({block:'nearest',behavior:'smooth'});
    const firstMissing = qa(draft).missing[0];
    const fieldName = fixField || {'intent keywords':'keywords','budget and flight':!f.budget?'budget':'flight','landing page':'landing','budget approval':'budgetApproved'}[firstMissing] || firstMissing;
    editor.querySelector(`[name="${fieldName}"]`)?.focus({preventScroll:true});
    const form=editor.querySelector('form'),button=form.querySelector('button[type="submit"]');
    const requiredNames=['audience','creative','tracking',...(keywordRequired(draft)?['keywords']:[]),'budget','flight','landing','messaging','budgetApproved'];
    const syncFieldHighlights=()=>{
      form.querySelectorAll('label[data-field]').forEach(label=>{
        const name=label.dataset.field,input=label.querySelector('input');
        const missing=requiredNames.includes(name) && (name==='budgetApproved'?!input.checked:!input.value.trim());
        label.classList.toggle('mbj-field-missing',missing);
        let hint=label.querySelector('.mbj-field-hint');
        if(missing && !hint){hint=document.createElement('small');hint.className='mbj-field-hint';hint.textContent='Needed for Mojo QA';label.append(hint)}
        if(!missing)hint?.remove();
      });
    };
    syncFieldHighlights();
    let readyToLaunch=false;
    const setAction=ready=>{readyToLaunch=ready;button.textContent=ready?'Launch campaign →':'Save campaign setup →'};
    setAction(stage(draft)==='ready');
    const markEdited=()=>{if(readyToLaunch)setAction(false);syncFieldHighlights();editor.querySelector('.mbj-qa-needs').textContent='Save changes to rerun Mojo QA.'};
    form.addEventListener('input',markEdited);
    form.addEventListener('change',markEdited);
    form.addEventListener('submit',event=>{
      event.preventDefault();
      if(readyToLaunch){
        if(!launch([index],()=>{
          editor.querySelector('.mbj-chat-saved')?.remove();
          editor.querySelector('.mbj-qa-needs')?.remove();
          form.replaceWith(Object.assign(document.createElement('p'),{className:'mbj-chat-saved is-launched',innerHTML:`${escape(draft.planTitle||draft.name)} is live in ${escape(channel(draft))}. Mojo is watching for the first data. <a href="Portfolio.html#campaigns">Check performance in Report →</a>`}));
        }))return;
        button.disabled=true;
        button.textContent='Launching…';
        return;
      }
      const items=read(),item=items[index];if(!item)return;
      const values=Object.fromEntries(new FormData(form));
      item.deliverables=Object.fromEntries(Object.entries(values).filter(([name])=>name!=='budgetApproved'));
      item.buildSetup={...(item.buildSetup||{}),audience:values.audience,message:values.creative,channels:channel(item),budget:values.budget,utm:values.tracking,conversion:values.conversion,validation:values.validation};
      item.budgetApproved=!!values.budgetApproved;
      const result=qa(item);item.buildStatus=result.passed?'ready':'draft';syncSiblings(items,item);write(items);render();
      editor.querySelector('.mbj-chat-saved')?.remove();
      editor.querySelector('.mbj-qa-needs').textContent=result.passed?'All required deliverables are ready.':'To finish QA: '+qaNeeds(item).join(' · ');
      syncFieldHighlights();
      editor.insertAdjacentHTML('beforeend',`<p class="mbj-chat-saved${result.passed?'':' is-pending'}">${result.passed?'Saved. Mojo QA passed; this campaign is ready to launch.':'Saved. Mojo QA still needs: '+escape(qaNeeds(item).join(' · '))+'.'}</p>`);
      setAction(result.passed);
    });
  }
  function openReviewChat(indices) {
    window.MojoOpenChat?.('',false);
    const body=document.querySelector('.chatpane .chatbody');
    if(!body)return;
    body.querySelector('.mbj-review-chat')?.remove();
    const items=read(),panel=document.createElement('section');
    panel.className='mbj-review-chat';
    panel.innerHTML=`<h2 tabindex="-1">Campaign details for launch</h2><p>Review the complete setup for ${indices.length===1?'this campaign':`these ${indices.length} campaigns`}.</p>${indices.map(index=>{const item=items[index];if(!item)return '';const f=facts(item);const fields=[['Channel',channel(item)],['Budget',f.budget],['Flight',f.flight],['Audience',f.audience],['Creative',f.creative],['Tracking',f.tracking],...(keywordRequired(item)?[['Intent keywords',f.keywords]]:[]),['Landing page',f.landing],['Message',f.messaging],['Conversion event',f.conversion],['Validation',f.validation]];return `<article data-mbj-review-index="${index}"><h3>${escape(item.planTitle||item.name)}</h3><p>Mojo QA passed · Ready to launch</p><dl>${fields.map(([label,value])=>`<div><dt>${escape(label)}</dt><dd${label==='Channel'?' class="mbj-review-chat-channel"':''}>${label==='Channel'?`${channelLogo(item)}<span>${escape(value)}</span>`:escape(value||'To confirm')}</dd></div>`).join('')}</dl><div class="mbj-review-chat-actions"><button type="button" data-mbj-review-edit="${index}">Edit campaign details</button>${canEditInCanvas(item)?`<button type="button" data-open-canvas="${index}">Edit in canvas</button>`:''}<button type="button" data-mbj-review-launch="${index}">Launch campaign →</button></div></article>`}).join('')}`;
    body.append(panel);
    panel.scrollIntoView({block:'start',behavior:'smooth'});
    panel.querySelector('h2').focus({preventScroll:true});
  }
  function launch(indices, onComplete) {
    if(launchInProgress)return 0;
    const readyIndices=[...new Set(indices)].filter(index=>{
      const item=read()[index];
      return item && stage(item)==='ready' && qa(item).passed;
    });
    if(!readyIndices.length)return 0;
    launchInProgress=true;
    readyIndices.forEach(index=>root.querySelector(`[data-build-index="${index}"]`)?.classList.add('is-launching'));
    const reducedMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    setTimeout(()=>{
      const items=read(),launched=[];
      readyIndices.forEach(index=>{
        const item=items[index];
        if(!item || stage(item)!=='ready' || !qa(item).passed)return;
        item.buildStatus='live';
        item.publishedAt=new Date().toISOString();
        launched.push(index);
      });
      if(launched.length){
        write(items);
        launchNotice={indices:launched};
        newlyLaunchedIndices=new Set(launched);
        selectedReady.clear();
        reviewIndices=[];
        render();
        root.querySelector('.mbj-launch-confirmation')?.focus({preventScroll:true});
        onComplete?.();
        if(window.MojoLaunchCelebration && !localStorage.getItem('mojo-first-campaign-celebrated-v1')){
          localStorage.setItem('mojo-first-campaign-celebrated-v1','true');
          window.MojoLaunchCelebration.play?.({card:root.querySelector('[data-stage="recent"].is-new-launch')});
        }
      }
      launchInProgress=false;
    },reducedMotion?0:460);
    return readyIndices.length;
  }
  document.addEventListener('click',event=>{
    const openCanvas=event.target.closest('[data-open-canvas]');
    if(openCanvas){editInCanvas(Number(openCanvas.dataset.openCanvas),openCanvas.dataset.openCanvasField||'');return;}
    const reviewEdit=event.target.closest('[data-mbj-review-edit]');
    if(reviewEdit){openChat(Number(reviewEdit.dataset.mbjReviewEdit));return;}
    const launchButton=event.target.closest('[data-mbj-review-launch]');
    if(launchButton){const index=Number(launchButton.dataset.mbjReviewLaunch);launchButton.disabled=true;launchButton.textContent='Launching…';if(!launch([index],()=>{const article=document.querySelector(`.mbj-review-chat [data-mbj-review-index="${index}"]`);if(article){article.querySelector('p').textContent='Campaign launched · Mojo is watching for first data';article.querySelector('.mbj-review-chat-actions')?.remove();}})){launchButton.disabled=false;launchButton.textContent='Launch campaign →';}return;}
  });
  root.addEventListener('click',event=>{
    if(event.target.closest('[data-review-launch]')){
      const items=read(),readyGroups=groupsOf(items).filter(group=>group.stage==='ready');
      if(!readyGroups.length)return;
      reviewIndices=readyGroups.flatMap(group=>group.readyIndices);
      const many=readyGroups.length>1;
      root.querySelector('[data-review-list]').innerHTML=readyGroups.map(group=>{const lead=group.lead.item,f=facts(lead);return `<li${many?' class="has-pick"':''}>${many?`<label class="mbj-review-pick"><input type="checkbox" checked data-review-pick="${group.readyIndices.join(',')}" aria-label="Launch ${escape(lead.planTitle||lead.name)}"></label>`:''}<div><strong>${escape(lead.planTitle||lead.name)}</strong><dl class="mbj-review-facts"><div><dt>${group.readyIndices.length>1?'Platforms':'Channel'}</dt><dd class="mbj-review-channel">${group.readyIndices.map(i=>`<span class="mbj-review-plat">${channelLogo(items[i])}<span>${escape(channel(items[i]))} · ${escape(facts(items[i]).budget||'')}</span></span>`).join('')}</dd></div><div><dt>Flight</dt><dd>${escape(f.flight||'To confirm')}</dd></div></dl></div></li>`}).join('');
      syncReview();
      root.querySelector('.mbj-launch-review').showModal();return;
    }
    if(event.target.closest('[data-review-details]')){event.preventDefault();root.querySelector('.mbj-launch-review').close();openReviewChat(reviewIndices);return}
    if(event.target.closest('[data-cancel-launch]')){root.querySelector('.mbj-launch-review').close();return}
    if(event.target.closest('[data-confirm-launch]')){root.querySelector('.mbj-launch-review').close();launch(reviewIndices);return}
    if(event.target.closest('[data-cancel-delete]')){root.querySelector('.mbj-delete-review').close();deleteIndex=null;return}
    if(event.target.closest('[data-confirm-delete]')){
      const items=read(), targets=(deleteIndex||[]).filter(i=>items[i]&&stage(items[i])!=='recent'&&stage(items[i])!=='report').sort((a,b)=>b-a);
      root.querySelector('.mbj-delete-review').close();
      if(targets.length){
        targets.forEach(i=>items.splice(i,1));selectedReady.clear();
        document.querySelector('.chatpane .chatbody .mbj-editor')?.remove();
        write(items);render();
      }
      deleteIndex=null;return;
    }
    const row=event.target.closest('[data-build-index]');if(!row)return;const index=Number(row.dataset.buildIndex);
    const group=groupsOf(read()).find(g=>g.indices.includes(index));
    const fix=event.target.closest('[data-fix-field]');
    if(fix){event.preventDefault();openChat(index,fix.dataset.fixField);return}
    if(event.target.closest('[data-canvas]')){event.preventDefault();editInCanvas(index);return}
    if(event.target.closest('[data-delete]')){
      const item=read()[index];if(!item||!group)return;
      deleteIndex=group.open.map(member=>member.index);
      const where=group.open.length>1?`on ${group.open.length} platforms (${group.open.map(member=>channel(member.item)).join(', ')})`:`in ${channel(item)}`;
      root.querySelector('[data-delete-description]').textContent=`Delete “${item.planTitle||item.name}” ${where}? This removes the saved drafts and their setup.`;
      root.querySelector('.mbj-delete-review').showModal();return;
    }
    if(event.target.closest('[data-resolve]'))openChat(index);
    if(event.target.closest('[data-review-in-chat]')){event.preventDefault();openReviewChat(group?group.readyIndices:[index]);return;}
    if(event.target.closest('[data-launch]'))launch(group?group.readyIndices:[index]);
  });
  /* Launch review: everything ready is picked; unchecking holds a campaign back. */
  function syncReview(){
    const picks=[...root.querySelectorAll('[data-review-pick]')];
    if(picks.length)reviewIndices=picks.filter(input=>input.checked).flatMap(input=>input.dataset.reviewPick.split(',').map(Number));
    const campaigns=picks.length?picks.filter(input=>input.checked).length:1,spend=usd(reviewIndices.reduce((sum,i)=>sum+moneyOf(facts(read()[i]||{}).budget),0));
    const button=root.querySelector('[data-confirm-launch]');
    button.disabled=!reviewIndices.length;
    button.textContent=!reviewIndices.length?'Pick a campaign':campaigns===1?(reviewIndices.length>1?`Launch on ${reviewIndices.length} platforms · ${spend} →`:`Launch · ${spend} →`):`Launch ${campaigns} campaigns · ${spend} →`;
  }
  root.addEventListener('toggle',event=>{if(event.target.matches?.('[data-recent-toggle]'))recentOpen=event.target.open;},true);
  root.addEventListener('submit',event=>{
    const form=event.target.closest('[data-inline-fix]');if(!form)return;
    event.preventDefault();
    const key=form.dataset.inlineFix,input=form.querySelector('input'),value=input.value.trim(),error=form.querySelector('.mbj-inline-error');
    const problem=!value?'Add a value first.':key==='landing'&&!/^https?:\/\/[^\s.]+\.[^\s]+$/i.test(value)?'Enter a full URL that starts with https://':key==='tracking'&&!/utm_campaign=\S+/.test(value)?'Include utm_campaign=…':'';
    if(problem){error.textContent=problem;form.classList.add('has-error');input.focus();return;}
    const items=read(),index=Number(form.closest('[data-build-index]').dataset.buildIndex),item=items[index];if(!item)return;
    item.deliverables={...facts(item),...(item.deliverables||{}),[key]:value};delete item.deliverables.assets;
    item.buildSetup={...(item.buildSetup||{}),...(key==='tracking'?{utm:value}:{})};
    item.buildStatus=qa(item).passed?'ready':'draft';
    syncSiblings(items,item);
    const passed=groupsOf(items).find(g=>g.indices.includes(index))?.stage==='ready';
    write(items);qaNotice={index,passed};justReady=passed?index:null;render();
    const banner=root.querySelector('.mbj-qa-confirmation');banner?.scrollIntoView({block:'center',behavior:'smooth'});banner?.focus({preventScroll:true});
    qaNotice=null;setTimeout(()=>{justReady=null;root.querySelector('.is-just-ready')?.classList.remove('is-just-ready');},1600);
  });
  root.addEventListener('input',event=>{const form=event.target.closest('[data-inline-fix]');if(form){form.classList.remove('has-error');form.querySelector('.mbj-inline-error').textContent='';}});
  root.addEventListener('change',event=>{if(event.target.closest('[data-review-pick]'))syncReview();});
  document.addEventListener('mojo:build-status-changed',event=>{
    const items=read();
    items.forEach(item=>{if(item.buildStatus==='qa')item.buildStatus=qa(item).passed?'ready':'draft'});
    write(items);
    const index=event.detail?.index;
    if(Number.isInteger(index)&&items[index])qaNotice={index,passed:qa(items[index]).passed};
    render();
    if(qaNotice){
      const banner=root.querySelector('.mbj-qa-confirmation');
      banner?.scrollIntoView({block:'center',behavior:'smooth'});
      banner?.focus({preventScroll:true});
      qaNotice=null;
    }
  });
  window.addEventListener('storage',event=>{if(event.key===key)render()});
  /* Shared with the canvas editor (mojo-canvas-editor.js). */
  window.MojoBuild = {read, write, facts, qa, stage, channel, initiative, launch, render};
  normalizeSavedCampaigns();seedExamples();syncLaunchTodayIdeas();render();
})();
