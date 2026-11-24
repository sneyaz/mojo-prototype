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
  main.append(root);
  main.classList.add('mbj-active');
  function deliverable(label, value, note, required = true, error = false, fixField = '') {
    const done = !required || !!value;
    const copy = `<strong>${escape(label)}</strong><small>${escape(required ? note : 'Not needed for this channel')}</small>`;
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
    const items = read(), readyIdx = items.map((item, i) => item?.name && stage(item) === 'ready' ? i : null).filter(i => i !== null);
    const drafts = items.filter(item => item?.name && stage(item) === 'draft').length;
    if (selectedReady.size) return `<strong>${selectedReady.size} of ${readyIdx.length}</strong> selected · ${usd([...selectedReady].reduce((sum, i) => sum + moneyOf(facts(items[i] || {}).budget), 0))}`;
    const total = readyIdx.reduce((sum, i) => sum + moneyOf(facts(items[i]).budget), 0);
    return `${drafts ? `<span class="mbj-batch-needs"><strong>${drafts}</strong> ${drafts === 1 ? 'needs' : 'need'} you</span> · ` : ''}<strong>${readyIdx.length} ready to launch</strong> · ${usd(total)} ready to spend`;
  }
  const batchButton = () => selectedReady.size ? `Review launch of ${selectedReady.size} →` : 'Select to launch together';
  /* Multichannel: other platforms of the same plan (same source). */
  const siblingsOf = draft => draft.source ? read().filter(other => other && other.id !== draft.id && other.name && other.source === draft.source) : [];
  /* Fix on the card: when a draft is missing only its landing page or tracking, ask for it right here. */
  const inlineFixes = {landing: {label: 'Landing page URL', placeholder: 'https://acme.com/…', type: 'url'}, tracking: {label: 'Campaign tracking', placeholder: 'utm_campaign=…', type: 'text'}};
  function inlineFix(draft) {
    const missing = qa(draft).missing;
    if (missing.length !== 1) return '';
    const key = {'landing page': 'landing', tracking: 'tracking'}[missing[0]];
    if (!key) return '';
    const f = inlineFixes[key];
    return `<form class="mbj-inline-fix" data-inline-fix="${key}" novalidate><label><span>${f.label}</span><input type="${f.type}" name="value" placeholder="${f.placeholder}" autocomplete="off" aria-label="${f.label}"></label><button type="submit">Save</button><small class="mbj-inline-error" role="alert"></small></form>`;
  }
  function card(draft, index) {
    const f = facts(draft), result = qa(draft), state = stage(draft), alert = issue(draft);
    const isOpen = root.querySelector('[data-build-index="'+index+'"] details')?.open;
    const progress = [
      deliverable('Audience',f.audience,f.audience?'Found the audience · '+f.audience:'Mojo is finding the audience'),
      deliverable('Creative and tracking',f.creative && f.tracking,f.creative && f.tracking?'Using creative with tracking · '+f.creative:!f.creative?'Creative needed before launch':'Tracking needed before launch',true,!f.tracking,!f.tracking?'tracking':''),
      deliverable('Intent keywords',f.keywords,f.keywords?'Keywords · '+f.keywords:'Mojo is gathering intent keywords',keywordRequired(draft)),
      deliverable('Budget and flight',f.budget && f.flight,f.budget && f.flight?'Planned · '+[f.budget,f.flight].filter(Boolean).join(' · '):'Budget or flight dates still needed'),
      deliverable('Landing page and messaging',f.landing && f.messaging,f.landing && f.messaging?'Landing page · '+f.landing:!f.landing?'Landing page URL needed before launch':'Messaging needed before launch',true,!f.landing,!f.landing?'landing':'')
    ].join('');
    const total = result.missing.length, percent = Math.max(0,Math.round((8-Math.min(total,7))/8*100));
    const qaLabel = result.passed ? 'Mojo QA passed' : 'Mojo QA · ' + (result.tone==='red'?'Needs a fix':'Checking');
    const qaExplanation = result.passed ? 'Mojo checked the campaign setup and found no missing deliverables.' : `Mojo is waiting for ${result.missing.map(item => qaField[item] || item).join(', ')} before this campaign can launch.`;
    const canvasLink = state!=='recent' && canEditInCanvas(draft) ? '<a href="#" class="mbj-canvas-link" data-canvas>Edit in canvas</a>' : '';
    const action = state==='ready' ? '<button type="button" class="mbj-launch" data-launch>Launch campaign →</button><a href="#" data-review-in-chat>Preview in chat</a>'+canvasLink : state==='recent' ? '' : '<button type="button" data-resolve>Preview in chat</button>'+canvasLink;
    const note = state==='recent' ? '' : alert ? `<p class="mbj-feed-match"><span class="mbj-dot ${alert.tone}"></span><button type="button" data-edit>Ask Mojo to ${escape(alert.label.toLowerCase())} →</button></p>` : '';
    const dataWait = state==='recent' ? '<p class="mbj-data-wait"><strong>Waiting for first data.</strong> The ad platform has not reported delivery yet. <a href="Portfolio.html#campaigns">Open Report →</a></p>' : '';
    const selectReady = state==='ready' ? `<label class="mbj-select-ready" title="Select for a shared launch"><input type="checkbox" data-select-ready="${index}" ${selectedReady.has(index)?'checked':''}><span class="sr-only">Select ${escape(draft.planTitle||draft.name)} in ${escape(channel(draft))} for launch</span></label>` : '';
    const title = state==='recent' ? `<a href="Portfolio.html#campaigns">${escape(draft.planTitle||draft.name)}</a>` : `<button type="button" data-edit title="Edit in Chat">${escape(draft.planTitle||draft.name)}</button>`;
    const remove = state==='recent' ? '' : '<button type="button" class="mbj-delete-icon" data-delete aria-label="Delete draft" title="Delete draft"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 10v7M14 10v7"/></svg></button>';
    return `<article class="mbj-card${state==='recent'&&newlyLaunchedIndices.has(index)?' is-new-launch':''}${justReady===index?' is-just-ready':''}" data-build-index="${index}" data-stage="${state}"><div class="mbj-row">${selectReady}<div class="mbj-row-main"><span class="mbj-initiative">${alert?'<span class="mbj-dot '+alert.tone+'"></span>':''}${escape(initiative(draft))}<span class="mbj-initiative-separator" aria-hidden="true">·</span>${channelLogo(draft)}${siblingsOf(draft).length?`<span class="mbj-also">Also on ${siblingsOf(draft).map(other=>channelLogo(other)).join('')}</span>`:''}</span><h3>${title}</h3><p>${escape(f.audience)}</p></div><div class="mbj-row-right"><span class="mbj-qa-wrap"><span class="mbj-qa ${result.tone}" tabindex="0" aria-describedby="mbj-qa-tip-${index}">${result.passed?check:'<span class="mbj-dot '+result.tone+'" aria-hidden="true"></span>'}<span>${escape(state==='recent'?'Recently launched · '+qaLabel:state==='ready'?'Ready · '+qaLabel:'Draft · Needs '+(qaNeeds(draft).length?qaNeeds(draft)[0].replace(/^[A-Z](?=[a-z])/,c=>c.toLowerCase())+(qaNeeds(draft).length>1?' + '+(qaNeeds(draft).length-1)+' more':''):'a fix'))}</span></span><span class="mbj-qa-tip" role="tooltip" id="mbj-qa-tip-${index}">${escape(qaExplanation)}</span></span>${state==='draft'?`<small>${percent}% complete</small>`:''}</div></div>${dataWait}<div class="mbj-details-row"><details ${isOpen?'open':''}><summary>Deliverables and platform fields <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 7 5 5 5-5"/></svg></summary>${state==='draft'?inlineFix(draft):''}<ul class="mbj-deliverables">${progress}</ul>${creativePreviews(draft,f.creative)}<div class="mbj-platform"><h4>Fields Mojo will fill in ${channelLogo(draft)}</h4><dl>${[['Audience',f.audience],['Creative',f.creative],['Tracking',f.tracking],['Intent keywords',keywordRequired(draft)?f.keywords:'Not used'],['Budget',f.budget],['Flight',f.flight],['Landing page',f.landing],['Message',f.messaging],['Conversion event',f.conversion],['Validation',f.validation]].map(([name,value])=>platformField(name,value,f)).join('')}</dl></div>${note}${action?`<div class="mbj-actions">${action}</div>`:''}</details>${remove}</div></article>`;
  }
  function render() {
    const items=read(), lists={draft:[],ready:[],recent:[]};
    items.forEach((item,index)=>{if(!item?.name)return;if(launchNotice?.indices.includes(index))lists.ready.push(`<div class="mbj-launch-confirmation" role="status" tabindex="-1">${check}<div><strong>Campaign launched</strong><span>${escape(item.planTitle||item.name)} moved to Recently launched. Mojo is watching for first data.</span></div></div>`);const status=stage(item);if(qaNotice&&qaNotice.index===index&&lists[status])lists[status].push(`<div class="mbj-qa-confirmation" role="status" tabindex="-1">${check}<div><strong>Mojo QA started</strong><span>${qaNotice.passed?escape(item.planTitle||item.name)+' passed Mojo QA and moved to Ready to launch.':'Mojo will flag any missing setup for '+escape(item.planTitle||item.name)+' before publishing.'}</span></div></div>`);if(lists[status])lists[status].push(card(item,index));});
    const ready=items.map((item,index)=>stage(item)==='ready'?index:null).filter(index=>index!==null);
    for(const index of [...selectedReady])if(!ready.includes(index))selectedReady.delete(index);
    root.innerHTML=`<header><h1>Build</h1><p>Mojo gathers each campaign’s deliverables, checks the setup, and gets it ready for your launch.</p><a class="mbj-ideas-link" href="Strategy.html#ideas">Browse ideas in Plan →</a></header>${ready.length>1?`<div class="mbj-batch"><span data-selected-count>${batchLabel()}</span><button type="button" data-review-launch ${selectedReady.size?'':'disabled'}>${batchButton()}</button></div>`:''}${[['draft','Draft'],['ready','Ready to launch'],['recent','Recently launched']].map(([name,title])=>`<section class="mbj-section" data-build-section="${name}"><div class="mbj-section-head"><h2>${title}</h2><span>${name==='ready'?ready.length:lists[name].length}</span></div>${lists[name].length?lists[name].join(''):`<p class="mbj-empty">${name==='recent'?'No launches in the last 7 days.':name==='ready'?'Mojo is checking campaign deliverables.':'No drafts yet.'}</p>`}</section>`).join('')}<dialog class="mbj-launch-review" aria-labelledby="mbj-review-title"><h2 id="mbj-review-title">Review campaigns to launch</h2><p>Mojo QA passed for each selected campaign. Confirm the setup before launch.</p><ul data-review-list></ul><div class="mbj-review-actions"><button type="button" data-cancel-launch>Cancel</button><a href="#" data-review-details>Review campaign details</a><button type="button" data-confirm-launch>Launch selected campaigns →</button></div></dialog><dialog class="mbj-launch-review mbj-delete-review" aria-labelledby="mbj-delete-title"><h2 id="mbj-delete-title">Delete draft campaign?</h2><p data-delete-description></p><div class="mbj-review-actions"><button type="button" data-cancel-delete>Cancel</button><button type="button" data-confirm-delete>Delete draft</button></div></dialog>`;
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
    editor.innerHTML=`<div class="mbj-editor-head"><h3>Finish ${escape(draft.planTitle||draft.name)}</h3>${canvasButton}</div><p>Quick changes here. Mojo rechecks the setup when you save. For targeting, ad copy and every ${escape(channel(draft))} setting, edit in canvas.</p><p class="mbj-qa-needs" role="status">${qaNeeds(draft).length?'To finish QA: '+escape(qaNeeds(draft).join(' · ')):'All required deliverables are ready.'}</p>${fixGuidance?`<p class="mbj-fix-guidance"><strong>How to fix it</strong> ${escape(fixGuidance)}</p>`:''}${creativePreviews(draft,f.creative)}<form>${orderedFields.map(([name,label])=>`<label data-field="${name}">${label}<input name="${name}" value="${escape(f[name])}"></label>`).join('')}<label class="mbj-approve" data-field="budgetApproved"><input type="checkbox" name="budgetApproved" ${draft.budgetApproved!==false?'checked':''}>Budget approved under company rules</label><button type="submit">Save campaign setup →</button></form>`;
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
      const result=qa(item);item.buildStatus=result.passed?'ready':'draft';write(items);render();
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
      reviewIndices=[...selectedReady].filter(index=>stage(read()[index])==='ready');
      if(!reviewIndices.length)return;
      root.querySelector('[data-review-list]').innerHTML=reviewIndices.map(index=>{const item=read()[index],f=facts(item);return `<li><strong>${escape(item.planTitle||item.name)}</strong><dl class="mbj-review-facts"><div><dt>Channel</dt><dd class="mbj-review-channel">${channelLogo(item)}<span>${escape(channel(item))}</span></dd></div><div><dt>Budget</dt><dd>${escape(f.budget||'To confirm')}</dd></div><div><dt>Flight</dt><dd>${escape(f.flight||'To confirm')}</dd></div></dl></li>`}).join('');
      root.querySelector('[data-confirm-launch]').textContent=`Launch ${reviewIndices.length} campaigns →`;
      root.querySelector('.mbj-launch-review').showModal();return;
    }
    if(event.target.closest('[data-review-details]')){event.preventDefault();root.querySelector('.mbj-launch-review').close();openReviewChat(reviewIndices);return}
    if(event.target.closest('[data-cancel-launch]')){root.querySelector('.mbj-launch-review').close();return}
    if(event.target.closest('[data-confirm-launch]')){root.querySelector('.mbj-launch-review').close();launch(reviewIndices);return}
    if(event.target.closest('[data-cancel-delete]')){root.querySelector('.mbj-delete-review').close();deleteIndex=null;return}
    if(event.target.closest('[data-confirm-delete]')){
      const items=read(), item=items[deleteIndex];
      root.querySelector('.mbj-delete-review').close();
      if(item && stage(item)!=='recent'){
        items.splice(deleteIndex,1);selectedReady.clear();
        document.querySelector('.chatpane .chatbody .mbj-editor')?.remove();
        write(items);render();
      }
      deleteIndex=null;return;
    }
    const row=event.target.closest('[data-build-index]');if(!row)return;const index=Number(row.dataset.buildIndex);
    const fix=event.target.closest('[data-fix-field]');
    if(fix){event.preventDefault();openChat(index,fix.dataset.fixField);return}
    if(event.target.closest('[data-canvas]')){event.preventDefault();editInCanvas(index);return}
    if(event.target.closest('[data-edit]')){openChat(index);return}
    if(event.target.closest('[data-delete]')){
      const item=read()[index];if(!item)return;
      deleteIndex=index;
      root.querySelector('[data-delete-description]').textContent=`Delete “${item.planTitle||item.name}” in ${channel(item)}? This removes the saved draft and its setup.`;
      root.querySelector('.mbj-delete-review').showModal();return;
    }
    if(event.target.closest('[data-resolve]'))openChat(index);
    if(event.target.closest('[data-review-in-chat]')){event.preventDefault();openReviewChat([index]);return;}
    if(event.target.closest('[data-launch]'))launch([index]);
  });
  root.addEventListener('submit',event=>{
    const form=event.target.closest('[data-inline-fix]');if(!form)return;
    event.preventDefault();
    const key=form.dataset.inlineFix,input=form.querySelector('input'),value=input.value.trim(),error=form.querySelector('.mbj-inline-error');
    const problem=!value?'Add a value first.':key==='landing'&&!/^https?:\/\/[^\s.]+\.[^\s]+$/i.test(value)?'Enter a full URL that starts with https://':key==='tracking'&&!/utm_campaign=\S+/.test(value)?'Include utm_campaign=…':'';
    if(problem){error.textContent=problem;form.classList.add('has-error');input.focus();return;}
    const items=read(),index=Number(form.closest('[data-build-index]').dataset.buildIndex),item=items[index];if(!item)return;
    item.deliverables={...facts(item),...(item.deliverables||{}),[key]:value};delete item.deliverables.assets;
    item.buildSetup={...(item.buildSetup||{}),...(key==='tracking'?{utm:value}:{})};
    const passed=qa(item).passed;item.buildStatus=passed?'ready':'draft';
    write(items);qaNotice={index,passed};justReady=passed?index:null;render();
    const banner=root.querySelector('.mbj-qa-confirmation');banner?.scrollIntoView({block:'center',behavior:'smooth'});banner?.focus({preventScroll:true});
    qaNotice=null;setTimeout(()=>{justReady=null;root.querySelector('.is-just-ready')?.classList.remove('is-just-ready');},1600);
  });
  root.addEventListener('input',event=>{const form=event.target.closest('[data-inline-fix]');if(form){form.classList.remove('has-error');form.querySelector('.mbj-inline-error').textContent='';}});
  root.addEventListener('change',event=>{
    const input=event.target.closest('[data-select-ready]');if(!input)return;
    const index=Number(input.dataset.selectReady);
    if(input.checked)selectedReady.add(index);else selectedReady.delete(index);
    const count=root.querySelector('[data-selected-count]'),button=root.querySelector('[data-review-launch]');
    if(count)count.innerHTML=batchLabel();
    if(button){button.disabled=!selectedReady.size;button.textContent=batchButton();}
  });
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
