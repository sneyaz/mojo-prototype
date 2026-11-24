/* Audiences sample workspace. All records and actions stay in this browser. */
(() => {
  const snapshot='Nov 3, 2026';
  /* Saved audiences live in mojo-audience-catalog.js so other apps can list them too. */
  const audiences=(window.MojoAudienceCatalog?.base||[]).map(item=>({...item,campaigns:[...(item.campaigns||[])]}));
  try {
    const drafts=JSON.parse(localStorage.getItem('mojo-selected-audience-drafts-v1')||'[]');
    if(Array.isArray(drafts)) drafts.forEach(draft=>{
      if(!draft?.id||!Array.isArray(draft.accountNames))return;
      audiences.push({id:draft.id,name:draft.name,role:draft.role,industry:draft.industry,definition:draft.definition||`Selected portfolio accounts: ${draft.accountNames.join(', ')}`,accounts:draft.accountNames.length,contacts:0,type:draft.type||'Selected accounts',source:draft.source||'Campaign account table',updated:draft.created||'Today',days:0,status:'Draft',campaigns:[],overlap:'Not checked',risk:draft.accountNames.length?'Review account IDs, exclusions, and match quality before activation.':'Match eligible TAM accounts and check exclusions before activation. No accounts are matched to this draft yet.',action:'Review the draft'});
    });
  } catch {}
  const feed=[
    {id:'enterprise-intent',type:'New matches',title:'214 new accounts fit Enterprise Intent',reason:'They match your rules but aren\u2019t in the audience yet, so your campaigns can\u2019t reach them. Add them after a quick check.',action:'Review 214 additions'},
    {id:'tier-1-named',type:'Match rate',title:'LinkedIn can find only 41% of Tier 1 Named',reason:'Most of your top accounts never see your LinkedIn ads. Run this list on Demandbase (98% found) or add contacts for LinkedIn.',action:'Review match rate'},
    {id:'intent-surge',type:'Freshness',title:'Intent Surge is 16 days old',reason:'Your ads may be reaching accounts that stopped researching. Your team refreshes intent lists every 7 days. Refresh it now.',action:'Request a refresh'},
    {id:'tier-1-named',type:'Overlap',title:'Tier 1 Named and Enterprise Intent share 42% of accounts',reason:'Those accounts see ads from two campaigns. You pay twice and can\u2019t tell which one worked. Leave one list out of the other.',action:'Review the overlap'},
    {id:'healthcare-fit',type:'Size change',title:'Healthcare Fit lost 23% of its accounts',reason:'Healthcare Search will reach fewer accounts than planned and may underspend. Check which accounts dropped out.',action:'Investigate the drop'},
    {id:'product-retargeting',type:'Suppression',title:'6 customers or do-not-contact accounts are in Product Retargeting',reason:'You\u2019re showing prospecting ads to people you shouldn\u2019t. Remove them before the next ads go out.',action:'Review exclusions'},
    {id:'trial-recovery',type:'Performance',title:'Trial Recovery engages fewer accounts than a similar list',reason:'1.6% vs 2.3%. Compare who is in each list before changing the ads.',action:'Compare the audiences'}
  ];
  const rules=[
    {id:'min-size',origin:'mojo',title:'Require 500 accounts before activation',check:'Hold a new prospecting audience below 500 matched accounts for MOps review.',scope:'New prospecting audiences',source:'Audience eligibility check',status:'Proposed',effect:'Three audiences launched below 500 accounts',evidence:'The same size problem appeared in three separate sample audience launches. A single small audience would not create this proposal.'},
    {id:'overlap',origin:'org',title:'Flag overlap above 35% across live audiences',check:'Flag two active audiences when more than 35% of the smaller audience is shared.',scope:'Concurrently active audiences',source:'MOps audience policy',author:'Priya Shah',status:'Approved',effect:'Caught the 42% Enterprise Intent / Tier 1 Named overlap'},
    {id:'refresh',origin:'org',title:'Refresh intent audiences every seven days',check:'Intent: every seven days. Firmographic fit: every 30 days. Manual lists: every 14 days.',scope:'Audiences used in live campaigns',source:'MOps data policy',author:'Priya Shah',status:'Approved',effect:'Flagged Intent Surge at 16 days since update'},
    {id:'qualified',origin:'org',title:'Use one Tier 1 qualification definition',check:'Tier 1 requires fit score of at least 80, a target region, and no active customer status.',scope:'Tier 1 audiences in Campaigns and Audiences',source:'MOps ICP definition',author:'Alex Rivera',status:'Approved',effect:'Definition shared with the Tier 1 Named audience'},
    {id:'suppression',origin:'org',title:'Exclude customers and do-not-contact accounts',check:'Never include closed-won, active customer, or do-not-contact accounts in a prospecting audience.',scope:'Every prospecting audience',source:'MOps suppression policy',author:'Priya Shah',status:'Approved',effect:'6 conflicts to fix in Product Retargeting'},
    {id:'reach-approval',origin:'org',title:'Review large audiences before activation',check:'A new audience above 5,000 accounts or linked to more than $50,000 planned spend needs MOps and finance approval.',scope:'New or substantially expanded audiences',source:'MOps approval policy',author:'MOps team',status:'Draft',effect:'Not enforced; awaiting review'}
  ];
  const ruleRoutine={
    'min-size':'audience-eligibility',overlap:'audience-overlap-watch',refresh:'audience-freshness-watch',
    qualified:'audience-eligibility',suppression:'audience-eligibility','reach-approval':'audience-eligibility'
  };
  const key='mojo-audiences-workspace-v1';
  const read=k=>{try{return JSON.parse(localStorage.getItem(k)||'null');}catch{return null;}};
  const saved=read(key)||{};
  const state={actions:saved.actions||{},rules:saved.rules||{},customRules:Array.isArray(saved.customRules)?saved.customRules:[],exceptions:saved.exceptions||{},sales:saved.sales||{},refreshed:saved.refreshed||{},role:'reviewer'};
  const persist=()=>localStorage.setItem(key,JSON.stringify(state));
  const feedbackKey='mojo-audience-feed-feedback-v1';
  const feedback=read(feedbackKey)||{};
  const saveFeedback=()=>localStorage.setItem(feedbackKey,JSON.stringify(feedback));
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const age=days=>days===0?'Today':days===1?'1 day ago':`${days} days ago`;
  const reviewers=()=>{const names=read('mojo-practice-reviewers-v1')?.names;return Array.isArray(names)&&names.length?names.slice(0,3):['Priya Shah'];};
  const allRules=()=>[...rules,...state.customRules];
  const status=id=>state.rules[id]?.status||allRules().find(rule=>rule.id===id)?.status;
  const ruleData=id=>({...allRules().find(rule=>rule.id===id),...state.rules[id]});
  let sort='name',statusFilter='all',campaignFilter='all',practiceFilter='all',writeOpen=false,practiceType='Best practice';
  let feedAudienceIds=new Set();
  const selectControl=(id,label,values,value)=>{
    const selected=values.find(([option])=>option===value)||values[0];
    const chevron='<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4"/></svg>';
    const check='<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3.5 8 3 3 6-6"/></svg>';
    return `<div class="aud-select" data-aud-select="${id}"><span class="aud-select-label" id="${id}-label">${esc(label)}</span><button class="aud-select-trigger" id="${id}-trigger" type="button" data-aud-select-trigger aria-haspopup="listbox" aria-expanded="false" aria-labelledby="${id}-label ${id}-value"><span id="${id}-value">${esc(selected[1])}</span>${chevron}</button><div class="aud-select-menu" role="listbox" aria-labelledby="${id}-label" hidden>${values.map(([option,text])=>`<button type="button" role="option" data-aud-select-option data-value="${esc(option)}" aria-selected="${option===value}"><span>${esc(text)}</span>${option===value?check:''}</button>`).join('')}</div></div>`;
  };
  const route=()=>{const [section,detail]=decodeURIComponent(location.hash.slice(1)).split(':');const pillar=section?.startsWith('feed')?'feed':['build','dashboards','best-practices','strategy'].includes(section)?section:'feed';const feedTab=section==='feed-decisions'?'decisions':section==='feed-receipts'?'receipts':'insights';return {pillar,detail,feedTab};};
  function arrangeFeedFeedback(content){
    content.querySelectorAll('.aud-feed-item').forEach(card=>{
      const group=card.querySelector('.aud-feedback'),actions=card.querySelector('.aud-feed-actions');
      if(!group||!actions)return;
      const isReceipt=card.classList.contains('aud-receipt-row');
      const ignore=group.querySelector('.aud-feedback-ignore');
      if(isReceipt){
        ignore?.remove();
        group.querySelector('output')?.remove();
        actions.insertAdjacentHTML('beforeend','<span class="aud-receipt-utility" role="group" aria-label="Card actions"><button type="button" data-aud-receipt-tool="discuss" aria-label="Discuss" title="Discuss"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11.5a8 8 0 0 1-8 8 8.4 8.4 0 0 1-3.6-.8L4 20l1.3-4.4A8 8 0 1 1 20 11.5Z"/></svg></button><button type="button" data-aud-receipt-tool="routine" aria-label="Review routine" title="Review routine"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 1.5M9 2h6"/></svg></button><button type="button" data-aud-receipt-tool="copy" aria-label="Copy receipt" title="Copy receipt"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg></button></span>');
      }else if(ignore)card.querySelector('.aud-feed-detail')?.append(ignore);
      group.querySelector(':scope > span')?.remove();
      actions.append(group);
    });
    content.querySelector('.aud-receipt-row details')?.setAttribute('open','');
  }
  function mount(root){
    document.title='Audiences · Mojo';
    const createButton=document.querySelector('.aud-create-cta');
    if(createButton){createButton.hidden=false;createButton.addEventListener('click',()=>window.MojoOpenChat?.('Create a new audience for ',true));}
    const closeSelects=(except)=>root.querySelectorAll('.aud-select').forEach(control=>{
      if(control===except)return;
      control.querySelector('.aud-select-menu').hidden=true;
      control.querySelector('.aud-select-trigger').setAttribute('aria-expanded','false');
    });
    /* Tabs follow this app's own workflow; the hashes stay the same. */
    const NAV=[['feed','Feed'],['dashboards','Library'],['strategy','Coverage'],['build','Build']];
    const nav=document.querySelector('.aud-app-nav');
    NAV.forEach(([pillar,label])=>{const link=nav?.querySelector(`[data-aud-pillar="${pillar}"]`);if(link){link.textContent=label;nav.insertBefore(link,nav.querySelector('.aud-practices-link'));}});
    document.querySelectorAll('.aud-sidepane nav a').forEach(link=>{const hit=NAV.find(([pillar])=>link.getAttribute('href')===`#${pillar}`);if(hit)link.textContent=hit[1];});
    const paint=()=>{
      const {pillar,detail,feedTab}=route();
      document.querySelectorAll('.aud-app-nav a').forEach(link=>{const current=link.dataset.audPillar===pillar;if(current)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');});
      root.innerHTML='<section class="aud-content" aria-live="polite"></section>';
      const content=root.querySelector('.aud-content');
      if(pillar==='feed')renderFeed(content,feedTab);
      if(pillar==='build')renderBuild(content);
      if(pillar==='dashboards')renderDashboard(content,detail);
      if(pillar==='best-practices'){renderPractices(content,detail);const type=content.querySelector('[data-aud-create] select[name=type]'),enforcement=content.querySelector('[data-aud-create] select[name=enforcement]');if(type)type.value=practiceType;if(enforcement)enforcement.value=practiceType==='Guardrail'?'Blocks activation':practiceType==='Rule'?'Warns':'Suggests';}
      if(pillar==='strategy')renderStrategy(content);
      if(pillar==='feed')arrangeFeedFeedback(content);
    };
    root.addEventListener('click',event=>{
      const buildPrompt=event.target.closest('[data-aud-build-chat]');
      if(buildPrompt){window.MojoOpenChat?.(buildPrompt.dataset.audBuildChat,true);return;}
      const trigger=event.target.closest('[data-aud-select-trigger]');
      if(trigger&&root.contains(trigger)){
        const control=trigger.closest('.aud-select'),menu=control.querySelector('.aud-select-menu'),willOpen=menu.hidden;
        closeSelects(control);menu.hidden=!willOpen;trigger.setAttribute('aria-expanded',String(willOpen));
        return;
      }
      const option=event.target.closest('[data-aud-select-option]');
      if(option&&root.contains(option)){
        const id=option.closest('.aud-select').dataset.audSelect,value=option.dataset.value;
        if(id==='aud-status')statusFilter=value;
        if(id==='aud-campaign')campaignFilter=value;
        if(id==='aud-sort')sort=value;
        if(route().detail&&(id==='aud-status'||id==='aud-campaign'))location.hash='#dashboards';
        else paint();
        return;
      }
      const feedScope=event.target.closest('[data-aud-feed-scope]');
      if(feedScope&&root.contains(feedScope)){
        const menu=root.querySelector('#aud-feed-scope-menu');
        const open=menu.hidden;
        closeSelects();menu.hidden=!open;feedScope.setAttribute('aria-expanded',String(open));
        if(open)root.querySelector('#aud-feed-scope-search')?.focus();
        return;
      }
      if(event.target.closest('[data-aud-feed-all]')){feedAudienceIds=new Set();paint();return;}
      if(event.target.closest('[data-aud-feed-apply]')){
        feedAudienceIds=new Set([...root.querySelectorAll('[data-aud-feed-audience]:checked')].map(input=>input.value));
        paint();return;
      }
      const feedDecision=event.target.closest('[data-aud-feed-decision]');
      if(feedDecision){
        const card=feedDecision.closest('.aud-decision-row'),choice=card?.querySelector('input[name^="aud-decision-"]:checked');
        if(!choice)return;
        state.actions[feedDecision.dataset.audFeedDecision]={text:choice.value,at:snapshot,source:'feed-decision'};
        persist();location.hash='#feed-receipts';paint();return;
      }
      const receiptTool=event.target.closest('[data-aud-receipt-tool]');
      if(receiptTool){
        const card=receiptTool.closest('.aud-receipt-row'),title=card?.querySelector('h3')?.textContent.trim()||'audience receipt';
        if(receiptTool.dataset.audReceiptTool==='discuss')window.MojoOpenChat?.(`Let's discuss this audience receipt: ${title}`,true);
        if(receiptTool.dataset.audReceiptTool==='routine')location.href='Routines.html';
        if(receiptTool.dataset.audReceiptTool==='copy')navigator.clipboard?.writeText(`${title} — ${card?.querySelector('.aud-feed-main>p')?.textContent.trim()||''}`).then(()=>{receiptTool.dataset.state='copied';receiptTool.setAttribute('aria-label','Copied');receiptTool.title='Copied'});
        return;
      }
            const feedbackButton=event.target.closest('[data-aud-feedback]');
      if(feedbackButton){
        const id=feedbackButton.dataset.id,action=feedbackButton.dataset.audFeedback;
        feedback[id]??={};
        if(action==='ignore')feedback[id].ignored=true;
        else if(action==='undo')feedback[id].ignored=false;
        else feedback[id].vote=feedback[id].vote===action?'':action;
        saveFeedback();
        if(action==='ignore'||action==='undo')paint();
        else{
          const group=feedbackButton.closest('.aud-feedback');
          group?.querySelectorAll('[data-aud-feedback="up"],[data-aud-feedback="down"]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.audFeedback===feedback[id].vote)));
          let output=group?.querySelector('output');if(!output&&group){output=document.createElement('output');group.append(output);}if(output)output.textContent=feedback[id].vote?'Noted':'';
        }
        return;
      }
      const share=event.target.closest('[data-aud-share]');
      if(share){const id=share.dataset.audShare;state.sales[id]=!sharedWithSales(id);persist();share.textContent=state.sales[id]?'Shared with Sales ✓':'Share with Sales';return;}
      const refresh=event.target.closest('[data-aud-refresh]');
      if(refresh){state.refreshed[refresh.dataset.audRefresh]=snapshot;persist();refresh.textContent='Refresh requested ✓';refresh.disabled=true;return;}
      const button=event.target.closest('[data-aud-action]');if(!button)return;
      const action=button.dataset.audAction,id=button.dataset.id;
      if(action==='stage'){
        state.actions[id]={text:audiences.find(item=>item.id===id)?.action||'Review staged',at:snapshot};persist();
        const output=root.querySelector('.aud-action-result');if(output)output.textContent='Review draft saved in this browser. No audience or campaign changed.';
        button.textContent='Draft saved ✓';button.disabled=true;
      }
      if(action==='approve'&&state.role==='reviewer'){
        const custom=state.customRules.some(rule=>rule.id===id);
        state.rules[id]={...state.rules[id],status:'Approved',approvedBy:reviewers()[0],...(custom?{effect:'Approved; no sample checks recorded yet'}:{})};persist();paint();
      }
      if(action==='write'&&state.role!=='teammate'){practiceType=button.dataset.practiceType||'Best practice';writeOpen=true;paint();}
      if(action==='describe-practice'){if(window.MojoOpenChat)window.MojoOpenChat('Help me add a practice for this audience: ',true);else{practiceType='Best practice';writeOpen=true;paint();}}
      if(action==='close-write'){writeOpen=false;paint();}
      if(action==='edit'&&(state.role==='reviewer'||(state.role==='author'&&ruleData(id).origin==='org'&&status(id)==='Draft'))){
        const form=root.querySelector(`[data-aud-edit="${id}"]`);if(form)form.hidden=false;button.hidden=true;
      }
      if(action==='reject'&&state.role==='reviewer'){
        const form=root.querySelector(`[data-aud-reject="${id}"]`);if(form)form.hidden=false;button.hidden=true;
      }
      if(action==='exception'){
        const form=root.querySelector(`[data-aud-exception="${id}"]`);if(form)form.hidden=false;button.hidden=true;
      }
      if(action==='copy'){
        const text=root.querySelector('#aud-leadership-copy')?.textContent||'';
        const copy=navigator.clipboard?.writeText(text);
        if(copy)copy.then(()=>{button.textContent='Copied ✓';}).catch(()=>{button.textContent='Select the paragraph to copy';});
        else button.textContent='Select the paragraph to copy';
      }
    });
    root.addEventListener('keydown',event=>{
      if(event.key==='Escape'&&!root.querySelector('#aud-feed-scope-menu')?.hidden){
        const menu=root.querySelector('#aud-feed-scope-menu');menu.hidden=true;
        const trigger=root.querySelector('[data-aud-feed-scope]');trigger?.setAttribute('aria-expanded','false');trigger?.focus();
        event.preventDefault();return;
      }
      const control=event.target.closest('.aud-select');if(!control)return;
      const trigger=control.querySelector('.aud-select-trigger'),menu=control.querySelector('.aud-select-menu');
      const options=[...menu.querySelectorAll('[data-aud-select-option]')];
      if(event.key==='Escape'){if(!menu.hidden){event.preventDefault();closeSelects();trigger.focus();}return;}
      if(event.target===trigger&&['ArrowDown','ArrowUp','Home','End'].includes(event.key)){
        event.preventDefault();closeSelects(control);menu.hidden=false;trigger.setAttribute('aria-expanded','true');
        const selected=options.findIndex(option=>option.getAttribute('aria-selected')==='true');
        const index=event.key==='Home'?0:event.key==='End'?options.length-1:event.key==='ArrowUp'?Math.max(0,selected-1):Math.min(options.length-1,selected+1);
        options[index]?.focus();return;
      }
      if(event.target.matches('[data-aud-select-option]')&&['ArrowDown','ArrowUp','Home','End'].includes(event.key)){
        event.preventDefault();const current=options.indexOf(event.target);
        const index=event.key==='Home'?0:event.key==='End'?options.length-1:event.key==='ArrowUp'?Math.max(0,current-1):Math.min(options.length-1,current+1);
        options[index]?.focus();
      }
    });
    document.addEventListener('click',event=>{
      if(!event.target.closest('.aud-select'))closeSelects();
      if(!event.target.closest('.aud-feed-scope')){
        const menu=root.querySelector('#aud-feed-scope-menu');
        if(menu)menu.hidden=true;
        root.querySelector('[data-aud-feed-scope]')?.setAttribute('aria-expanded','false');
      }
    });
    root.addEventListener('input',event=>{
      if(event.target.id!=='aud-feed-scope-search')return;
      const query=event.target.value.trim().toLowerCase();
      root.querySelectorAll('[data-aud-feed-choice]').forEach(choice=>{choice.hidden=!choice.textContent.toLowerCase().includes(query);});
      const empty=root.querySelector('.aud-feed-scope-no-match');
      if(empty)empty.hidden=!!root.querySelector('[data-aud-feed-choice]:not([hidden])');
    });
    root.addEventListener('change',event=>{
      if(event.target.id==='aud-status'){statusFilter=event.target.value;if(route().detail)location.hash='#dashboards';else paint();}
      if(event.target.id==='aud-campaign'){campaignFilter=event.target.value;if(route().detail)location.hash='#dashboards';else paint();}
      if(event.target.id==='aud-sort'){sort=event.target.value;paint();}
      if(event.target.name==='practice-filter'){practiceFilter=event.target.value;paint();}
    });
    root.addEventListener('submit',event=>{
      const form=event.target;
      if(!form.matches('[data-aud-create],[data-aud-edit],[data-aud-reject],[data-aud-exception]'))return;
      event.preventDefault();const data=new FormData(form);const id=form.dataset.audEdit||form.dataset.audReject||form.dataset.audException;
      if('audCreate' in form.dataset&&state.role!=='teammate'){
        const value=name=>String(data.get(name)||'').trim();
        state.customRules.push({id:`aud-rule-${Date.now()}`,origin:'org',title:value('title'),check:value('check'),scope:value('scope'),source:value('source'),author:value('author'),routine:value('routine'),status:'Draft',type:value('type'),enforcement:value('enforcement'),effect:'Not enforced; awaiting review'});
        practiceFilter='org';writeOpen=false;
      }
      if(form.dataset.audEdit&&(state.role==='reviewer'||(state.role==='author'&&ruleData(id).origin==='org'&&status(id)==='Draft')))state.rules[id]={...state.rules[id],title:String(data.get('title')||'').trim(),check:String(data.get('check')||'').trim(),editedBy:state.role==='reviewer'?reviewers()[0]:ruleData(id).author||'MOps author'};
      if(form.dataset.audReject&&state.role==='reviewer')state.rules[id]={...state.rules[id],status:'Declined',reason:String(data.get('reason')||'').trim(),rejectedBy:reviewers()[0]};
      if(form.dataset.audException){state.exceptions[id]??=[];state.exceptions[id].push({scope:String(data.get('scope')||'').trim(),reason:String(data.get('reason')||'').trim()});}
      persist();paint();
    });
    document.getElementById('aud-chat-form')?.addEventListener('submit',event=>{
      event.preventDefault();const field=event.currentTarget.querySelector('textarea');const question=field?.value.trim();if(!question)return;
      const body=document.querySelector('.chatbody');const user=document.createElement('div');user.className='chat-polish-user';user.innerHTML='<small>You</small><p></p>';user.querySelector('p').textContent=question;body.append(user);
      const q=question.toLowerCase();
      const reply=q.includes('stale')||q.includes('refresh')?'Intent Surge is stale in the sample: its Demandbase intent source last refreshed Oct 18, 16 days before the Nov 3 snapshot. Your seven-day standard would flag it. Open its Dashboard row to review the source and request a refresh.'
        :q.includes('overlap')?'Tier 1 Named and Enterprise Intent overlap by 42% in the sample. Both feed live campaigns. Review the shared accounts before changing either audience.'
        :q.includes('new')||q.includes('214')?'214 accounts now meet Enterprise Intent criteria but are not included yet. Review exclusions and ownership before staging the additions.'
        :q.includes('suppress')||q.includes('exclude')?'Six sample accounts in Product Retargeting conflict with customer or do-not-contact exclusions. Review them before this audience is used for prospecting.'
        :'I can show the sample audience records and checks here. Open a Feed item or Dashboard row for the source details; this prototype does not change a connected audience.';
      const answer=document.createElement('div');answer.className='bubble mc-chat-ack';answer.innerHTML='<small>Mojo</small><p></p>';answer.querySelector('p').textContent=reply;body.append(answer);field.value='';body.scrollTop=body.scrollHeight;
    });
    document.getElementById('aud-share')?.addEventListener('click',async event=>{
      const button=event.currentTarget,originalMarkup=button.innerHTML;
      try{await navigator.clipboard.writeText(location.href);button.textContent='Link copied ✓';setTimeout(()=>button.innerHTML=originalMarkup,1800);}
      catch{button.textContent='Copy the page URL to share';}
    });
    window.addEventListener('hashchange',()=>{
      const {pillar,detail}=route(),item=audiences.find(audience=>audience.id===detail);
      if(pillar==='dashboards'&&item&&((statusFilter!=='all'&&item.status!==statusFilter)||(campaignFilter!=='all'&&!item.campaigns.includes(campaignFilter)))){statusFilter='all';campaignFilter='all';}
      paint();
    });paint();
  }
  /* Owner view: how each audience holds up across platforms, where it's used, and who it's shared with. Sample values. */
  const LOGO={linkedin:['assets/linkedin.png','LinkedIn Ads'],google:['assets/google-ads.svg','Google Ads'],demandbase:['assets/demandbase.png','Demandbase Ads']};
  const HEALTH={
    'enterprise-intent':{match:{demandbase:96,linkedin:78,google:64},plans:1,sales:true,results:'61% reached · 9 opportunities influenced'},
    'healthcare-fit':{match:{demandbase:94,google:58},plans:0,sales:false,results:'44% reached · 3 opportunities influenced'},
    'tier-1-named':{match:{demandbase:98,linkedin:41},plans:2,sales:true,results:'72% reached · 14 opportunities influenced'},
    'product-retargeting':{match:{demandbase:91,linkedin:70},plans:0,sales:false,results:'38% reached · 5 opportunities influenced'},
    'intent-surge':{match:{demandbase:95,google:61},plans:1,sales:false,results:'52% reached · 4 opportunities influenced'},
    'trial-recovery':{match:{demandbase:90,linkedin:67},plans:0,sales:true,results:'47% reached · 6 trials reopened'},
    'regional-lookalike':{match:{demandbase:88},plans:0,sales:false,results:'Not live yet'},
    'customer-expansion':{match:{},plans:1,sales:false,results:'Not live yet'}
  };
  const EXCLUSIONS=[['Customers',1204],['Open opportunities',86],['Competitors',12],['Do not contact',31]];
  const health=item=>HEALTH[item.id]||{match:{},plans:0,sales:false,results:'Not live yet'};
  const lowMatch=item=>Object.entries(health(item).match).filter(([,v])=>v<50);
  const matchHtml=item=>{const m=Object.entries(health(item).match);return m.length?`<span class="aud-match">${m.map(([id,v])=>`<span class="${v<50?'low':''}" tabindex="0" data-tip="${LOGO[id][1]} can find ${v}% of these accounts${v<50?'. Most of the list won\u2019t see your ads there.':'.'}"><img src="${LOGO[id][0]}" alt="${LOGO[id][1]}">${v}%</span>`).join('')}</span>`:'<span class="aud-quiet">Not synced yet</span>';};
  const freshness=item=>item.status==='Draft'?['quiet','Draft']:item.status==='Stale'||item.days>7?['warn',`Stale · ${item.days} days`]:item.status==='Needs review'?['warn','Needs review']:['ok','Fresh'];
  const usedIn=item=>{const h=health(item),parts=[];if(item.campaigns.length)parts.push(`${item.campaigns.length} campaign${item.campaigns.length>1?'s':''}`);if(h.plans)parts.push(`${h.plans} plan${h.plans>1?'s':''}`);if(h.sales)parts.push('Sales');return parts.join(' · ')||'Not used yet';};
  /* Plain-English: what changed and what to do about it. */
  const NEXT={
    'customer-expansion':'Still a draft. Check that only current customers are in it, then use it for an expansion campaign.',
    'enterprise-intent':'214 new accounts fit this audience but aren\u2019t in it yet, so your campaigns can\u2019t reach them. Add them after a quick check.',
    'healthcare-fit':'This list shrank 23% after its last update, so Healthcare Search may underspend. Check which accounts dropped out.',
    'intent-surge':'The intent data is 16 days old, so some accounts may have stopped researching. Refresh it before the next flight.',
    'product-retargeting':'6 customers or do-not-contact accounts are in this list. Remove them before the next ads go out.',
    'regional-lookalike':'A new 760-account list modeled on your customers. Check it picked the right companies before it goes live.',
    'tier-1-named':'42% of these accounts are also in Enterprise Intent, so they see ads from two campaigns. Leave one list out of the other.',
    'trial-recovery':'Engages fewer accounts than a similar audience (1.6% vs 2.3%). Compare the rules before changing the ads.'
  };
  const sharedWithSales=id=>state.sales?.[id]??health({id}).sales;
  const USE_ICON={campaign:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12"/></svg>',plan:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z"/><path d="M9 4v14M15 6v14"/></svg>',sales:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3.2"/><path d="M3 19c.4-3.4 2.6-5.2 6-5.2s5.6 1.8 6 5.2"/><path d="M16 5.2a3 3 0 0 1 0 5.6M18 14.2c1.7.6 2.8 2.2 3 4.8"/></svg>'};
  const PLAN_NAMES={"enterprise-intent": ["Q4 net-new pipeline"], "tier-1-named": ["Q4 net-new pipeline", "Buying-Group Coverage"], "intent-surge": ["Q4 net-new pipeline"], "customer-expansion": ["Customer Growth"]};
  const tipLinks=pairs=>pairs.map(([label,href])=>`${label}|${href}`).join(';;');
  const usedInHtml=item=>{const h=health(item),chips=[];
    if(item.campaigns.length)chips.push(`<span class="aud-use" tabindex="0" data-tip="Used in ${item.campaigns.length} campaign${item.campaigns.length>1?'s':''}" data-tip-links="${esc(tipLinks(item.campaigns.map(name=>[name,"Portfolio.html#campaigns"])))}" aria-label="${item.campaigns.length} campaign${item.campaigns.length>1?'s':''}">${USE_ICON.campaign}<b>${item.campaigns.length}</b></span>`);
    if(h.plans)chips.push(`<span class="aud-use" tabindex="0" data-tip="Used in ${h.plans} plan${h.plans>1?'s':''}" data-tip-links="${esc(tipLinks((PLAN_NAMES[item.id]||['Q4 plan']).slice(0,h.plans).map(name=>[name,'Strategy.html'])))}" aria-label="${h.plans} plan${h.plans>1?'s':''}">${USE_ICON.plan}<b>${h.plans}</b></span>`);
    if(sharedWithSales(item.id))chips.push(`<span class="aud-use is-sales" tabindex="0" data-tip="Shared with Sales, so reps work the same accounts" data-tip-links="${esc(tipLinks([['Manage sharing',`#dashboards:${item.id}`]]))}" aria-label="Shared with Sales">${USE_ICON.sales}</span>`);
    return chips.length?`<span class="aud-uses">${chips.join('')}</span>`:'<span class="aud-quiet">Not used yet</span>';};
  const overlapHtml=(item,long)=>{const m=String(item.overlap).match(/^(\d+)%\s*with\s*(.+)$/);if(!m)return `<span class="aud-quiet">${esc(item.overlap)}</span>`;const n=Number(m[1]),tip=`${n}% of these accounts are also in ${m[2]}. ${n>=35?'They see ads from both campaigns. Leave one list out of the other.':'Low enough to leave as is.'}`;
    if(long)return `<span class="aud-overlap${n>=35?' high':''}"><span class="aud-overlap-bar"><i style="width:${Math.min(n,100)}%"></i></span><b>${n}%</b></span> also in ${esc(m[2])}${n>=35?' <span class="aud-quiet">· leave one out of the other so you don\u2019t pay twice</span>':''}`;
    const other=audiences.find(a=>a.name===m[2]);return `<span class="aud-overlap${n>=35?' high':''}" tabindex="0" data-tip="${esc(tip)}"${other?` data-tip-links="${esc(tipLinks([[`Open ${other.name}`,`#dashboards:${other.id}`]]))}"`:''}><span class="aud-overlap-bar"><i style="width:${Math.min(n,100)}%"></i></span><b>${n}%</b></span><small>also in ${esc(m[2])}</small>`;};
  function renderBuild(root){
    const drafts=audiences.filter(item=>item.status==='Draft');
    const proposals=[
      {name:'Add 214 accounts to Enterprise Intent',detail:'New accounts match the saved intent rules. Check exclusions before adding them.',size:'214 accounts',source:'Demandbase intent',href:'#dashboards:enterprise-intent',prompt:'Help me review the 214 new Enterprise Intent accounts and their exclusions.'},
      {name:'Build an Evaluation audience',detail:'Start with accounts missing finance or security buyers.',size:'Evaluation stage',source:'Buying groups',href:'#dashboards:enterprise-intent',prompt:'Build an Evaluation audience for accounts missing finance or security buyers.'},
      {name:'Review Regional Lookalike',detail:'Check match quality and exclusions before activation.',size:'760 accounts',source:'Platform model',href:'#dashboards:regional-lookalike',prompt:'Review Regional Lookalike match quality and exclusions with me.'}
    ];
    const chev='<svg class="mp-chev" viewBox="0 0 20 20" aria-hidden="true"><path d="m5 7 5 5 5-5"/></svg>';
    const card=(item,facts,status)=>`<article class="mp-card"><details><summary><div class="mp-card-main"><span class="mp-eyebrow">${esc(item.source)}</span><h3>${esc(item.name)}</h3><p>${esc(item.detail)}</p></div><div class="mp-card-side">${status}<span>${esc(item.size)}</span></div>${chev}</summary><div class="mp-card-body"><dl class="mp-facts">${facts.map(([k,v])=>`<dt>${esc(k)}</dt><dd>${v}</dd>`).join('')}</dl><div class="mp-actions"><a class="mp-link" href="${item.href}">Open record →</a><button type="button" class="mp-btn" data-aud-build-chat="${esc(item.prompt)}">Work with Mojo →</button></div></div></details></article>`;
    const draftCards=drafts.map(item=>card({name:item.name,detail:item.definition,size:`${item.accounts.toLocaleString()} accounts`,source:item.source,href:`#dashboards:${item.id}`,prompt:`Help me finish the ${item.name} audience draft.`},[['Next step',esc(NEXT[item.id]||item.risk)],['Exclusions','Standard exclusions apply when you activate'],['Match rate',matchHtml(item)],['Used in',esc(usedIn(item))]],'<span class="mp-status bad">Needs exclusions check</span>')).join('');
    const ideaCards=proposals.map(item=>card(item,[['Why now',esc(item.detail)],['Source',esc(item.source)],['Exclusions','Standard exclusions apply automatically']],'')).join('');
    root.innerHTML=`<div class="mp-page"><div class="mp-head"><h1>Build</h1><p>Mojo drafts audiences from your data and checks them against your rules. You approve.</p><a class="mp-link" href="#dashboards">See the audience library →</a></div><div class="mp-summary"><span><span class="mp-needs">${drafts.length}</span> ${drafts.length===1?'draft needs':'drafts need'} you · <strong>${proposals.length} suggestions</strong> from Mojo</span></div><section class="mp-section"><div class="mp-section-head"><h2>Draft</h2><span>${drafts.length}</span></div>${draftCards}</section><section class="mp-section"><div class="mp-section-head"><h2>Suggested by Mojo</h2><span>${proposals.length}</span></div>${ideaCards}</section></div>`;
  }
  function renderFeed(root,feedTab){
    const tabs=`<nav class="aud-feed-tabs" aria-label="Feed sections">${[['insights','Tasks'],['receipts','Recently Completed']].map(([id,label])=>`<a href="#feed-${id}" ${feedTab===id?'aria-current="page"':''}>${label}</a>`).join('')}</nav>`;
    const selectedAudiences=audiences.filter(item=>feedAudienceIds.has(item.id));
    const scopeName=selectedAudiences.length===0?`All ${audiences.length} audiences`:selectedAudiences.length===1?selectedAudiences[0].name:`${selectedAudiences.length} audiences`;
    const scope=`<div class="aud-feed-scope"><button type="button" class="aud-feed-scope-trigger" data-aud-feed-scope aria-label="Choose audiences. ${esc(scopeName)}" aria-expanded="false" aria-controls="aud-feed-scope-menu"><span class="mojo-filter-icon aud-feed-scope-icon" role="img" aria-label="Filter by"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 20a1 1 0 0 0 .553.895l2 1A1 1 0 0 0 14 21v-7a2 2 0 0 1 .517-1.341L21.74 4.67A1 1 0 0 0 21 3H3a1 1 0 0 0-.742 1.67l7.225 7.989A2 2 0 0 1 10 14z"/></svg></span><strong>${esc(scopeName)}</strong><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4"/></svg></button><div class="aud-feed-scope-menu" id="aud-feed-scope-menu" hidden><label for="aud-feed-scope-search">Find an audience</label><input id="aud-feed-scope-search" type="search" placeholder="Search audiences…" autocomplete="off"><div class="aud-feed-scope-list">${audiences.map(item=>`<label data-aud-feed-choice><input type="checkbox" data-aud-feed-audience value="${esc(item.id)}" ${feedAudienceIds.has(item.id)?'checked':''}><span><strong>${esc(item.name)}</strong><small>${esc(item.type)} · ${item.accounts.toLocaleString()} accounts</small></span></label>`).join('')}<p class="aud-feed-scope-no-match" hidden>No audiences match.</p></div><div class="aud-feed-scope-actions"><button type="button" data-aud-feed-all>All audiences</button><button type="button" data-aud-feed-apply>Apply</button></div></div></div>`;
    const inScope=item=>feedAudienceIds.size===0||feedAudienceIds.has(item.id);
    const empty=`<div class="aud-feed-empty"><strong>No items for ${esc(scopeName)}.</strong><p>Choose another audience or view its record in Dashboards.</p><a href="#dashboards">Open Dashboards →</a></div>`;
    const visuals={'enterprise-intent':['214','new matches'],'intent-surge':['16d','since refresh'],'tier-1-named':['42%','overlap'],'healthcare-fit':['−23%','audience size'],'product-retargeting':['6','exclusions'],'trial-recovery':['1.6%','engagement'],'regional-lookalike':['760','accounts']};
    const compareVisual=(title,rows,max)=>`<div class="aud-feed-visual aud-viz" role="img" aria-label="${esc(title)}"><div class="aud-viz-title">${esc(title)}</div><div class="aud-viz-bars">${rows.map(([label,value,display,tone])=>`<div><span>${esc(label)}</span><progress max="${max}" value="${value}" class="${tone||''}">${esc(display)}</progress><b>${esc(display)}</b></div>`).join('')}</div></div>`;
    const visualFor=item=>{
      if(item.id==='intent-surge')return compareVisual('Refresh age versus standard',[['Elapsed',16,'16 days','warn'],['Standard',7,'7 days','base']],16);
      if(item.id==='tier-1-named')return compareVisual('Audience overlap versus review limit',[['Overlap',42,'42%','warn'],['Review at',35,'35%','base']],100);
      if(item.id==='healthcare-fit')return `<div class="aud-feed-visual aud-viz" role="img" aria-label="Healthcare Fit is 77 percent of its previous size, a 23 percent decrease"><div class="aud-viz-title">Size after latest update</div><div class="aud-viz-bars"><div><span>Current</span><progress max="100" value="77" class="warn">77%</progress><b>−23%</b></div></div><small>Compared with the previous size</small></div>`;
      if(item.id==='trial-recovery')return compareVisual('Account engagement',[['Trial Recovery',1.6,'1.6%','warn'],['Product Retargeting',2.3,'2.3%','base']],2.3);
      if(item.id==='enterprise-intent')return compareVisual('Existing audience and qualifying additions',[['In audience',620,'620','base'],['To review',214,'214','warn']],834);
      return `<div class="aud-feed-visual"><strong>${esc(visuals[item.id]?.[0]||'✓')}</strong><small>${esc(visuals[item.id]?.[1]||'recorded')}</small></div>`;
    };
    const decisionOptions={
      'enterprise-intent':['Review all 214 qualifying accounts','Hold additions until match quality is checked','Prepare an approval request for the additions'],
      'regional-lookalike':['Review match quality and exclusions','Keep the audience in draft','Prepare a launch approval request']
    };
    const thumb=up=>up?'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10v11H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3Zm0 0 5-8a2 2 0 0 1 3 2v5h5a2 2 0 0 1 2 2l-1 8a2 2 0 0 1-2 2H7"/></svg>':'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 14V3H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3Zm0 0 5 8a2 2 0 0 0 3-2v-5h5a2 2 0 0 0 2-2l-1-8a2 2 0 0 0-2-2H7"/></svg>';
    const row=(item,kind='insight')=>{
      const feedbackId=`${kind}:${item.id}`;
      if(feedback[feedbackId]?.ignored)return `<div class="aud-ignored-row"><span>Ignored: ${esc(item.title)}</span><button type="button" data-aud-feedback="undo" data-id="${esc(feedbackId)}">Undo</button></div>`;
      const sourceId={'intent-surge':'refresh','tier-1-named':'overlap','product-retargeting':'suppression'}[item.id];
      const practice=sourceId&&status(sourceId)==='Approved'?ruleData(sourceId):null;
      return `<article class="aud-feed-item ${kind==='decision'?'aud-decision-row':kind==='receipt'?'aud-receipt-row':''}"><div class="aud-feed-main"><div class="aud-feed-meta">${kind==='decision'?'<span class="aud-decision-tag">DECISION</span>':''}<span class="aud-feed-type aud-type-${esc(item.type.toLowerCase().replace(/\s+/g,'-'))}">${esc(item.type)}</span><span class="aud-feed-byline">${kind==='receipt'?'Drafted by Mojo':'Audience watch'}</span></div><h3><a class="aud-feed-title" href="#dashboards:${esc(item.id)}">${esc(item.title)}</a></h3><p>${esc(item.reason)}</p>${kind==='decision'?`<fieldset class="aud-feed-choices"><legend>What should happen next?</legend>${(decisionOptions[item.id]||['Review the audience evidence']).map((choice,index)=>`<label><input type="radio" name="aud-decision-${esc(item.id)}" value="${esc(choice)}" ${index===0?'checked':''}><span>${esc(choice)}</span>${index===0?'<em>Mojo recommends</em>':''}</label>`).join('')}</fieldset>`:''}<div class="aud-feed-actions">${kind==='decision'?`<button type="button" class="aud-feed-primary" data-aud-feed-decision="${esc(item.id)}">Save review draft</button>`:''}<a href="#dashboards:${esc(item.id)}">${esc(item.action)} →</a>${practice?`<a class="aud-source-chip" href="#best-practices:${sourceId}">▣ Best practice · ${esc(practice.title)}</a>`:''}</div><details><summary><span>Details</span><svg viewBox="0 0 12 12" aria-hidden="true"><path d="m2.5 4.5 3.5 3 3.5-3"/></svg></summary><div class="aud-feed-detail"><strong>Why this is here</strong>${esc(item.reason)}<span class="aud-feed-quiet">Source: ${esc(audiences.find(audience=>audience.id===item.id)?.source||'Audience records')} · ${snapshot}</span></div><div class="aud-feedback" role="group" aria-label="Feedback on this item"><span>Was this useful?</span><button type="button" data-aud-feedback="up" data-id="${esc(feedbackId)}" aria-label="Helpful" title="Helpful" aria-pressed="${feedback[feedbackId]?.vote==='up'}">${thumb(true)}</button><button type="button" data-aud-feedback="down" data-id="${esc(feedbackId)}" aria-label="Not helpful" title="Not helpful" aria-pressed="${feedback[feedbackId]?.vote==='down'}">${thumb(false)}</button><button type="button" class="aud-feedback-ignore" data-aud-feedback="ignore" data-id="${esc(feedbackId)}"><span aria-hidden="true">×</span> Ignore this</button>${feedback[feedbackId]?.vote?'<output>Noted</output>':''}</div></details></div>${visualFor(item)}</article>`;
    };
    if(feedTab==='decisions')feedTab='insights';
    if(feedTab==='insights'){
      const decisions=[feed[0],{id:'regional-lookalike',type:'Approval',title:'Regional Lookalike needs your OK before it goes live',reason:'A new 760-account list modeled on your customers. Check it picked the right companies.',action:'Review the audience'}].filter(inScope);
      const insights=feed.filter(item=>item.id!=='enterprise-intent'&&inScope(item));
      root.innerHTML=`${tabs}<div class="aud-section-head aud-feed-head"><div><h2>Changes worth a look</h2><p>${decisions.length} ${decisions.length===1?'decision needs':'decisions need'} you. ${insights.length} ${insights.length===1?'change is':'changes are'} worth a look.</p></div>${scope}</div>${decisions.length+insights.length?`<div class="aud-feed">${decisions.map(item=>row(item,'decision')).join('')}${insights.map(item=>row(item)).join('')}</div>`:empty}`;
    }else if(feedTab==='decisions'){
      const decisions=[feed[0],{id:'regional-lookalike',type:'Approval',title:'Regional Lookalike needs your OK before it goes live',reason:'A new 760-account list modeled on your customers. Check it picked the right companies.',action:'Review the audience'}].filter(inScope);
      root.innerHTML=`${tabs}<div class="aud-section-head aud-feed-head"><div><h2>${decisions.length} decisions need you</h2><p>Check the audience record before changing membership or launching.</p></div>${scope}</div>${decisions.length?`<div class="aud-feed">${decisions.map(item=>row(item,'decision')).join('')}</div>`:empty}`;
    }else{
      const receipts=[{id:'enterprise-intent',type:'Exclusions',title:'Excluded 12 accounts that became customers',reason:'They closed-won this week, so Mojo removed them from Enterprise Intent and Tier 1 Named on every synced platform. Your exclusion rule did this; nothing else changed.',action:'See the 12 accounts'}].filter(inScope).concat(Object.entries(state.actions).map(([id])=>{const audience=audiences.find(item=>item.id===id);return audience?{id,type:'Draft',title:`Prepared a review draft for ${audience.name}`,reason:state.actions[id].source==='feed-decision' ? `Review choice: ${state.actions[id].text}. No audience membership changed.` : 'Saved for review in this browser. No audience membership changed.',action:'Open the audience'}:null}).filter(item=>item&&inScope(item)));
      root.innerHTML=`${tabs}<div class="aud-section-head aud-feed-head"><div><h2>Recently completed</h2><p>What Mojo did for your audiences.</p></div>${scope}</div>${receipts.length?`<div class="aud-feed">${receipts.map(item=>row(item,'receipt')).join('')}</div>`:feedAudienceIds.size?empty:'<div class="aud-feed-empty"><strong>No audience changes logged yet.</strong><p>Review an audience in Dashboards to prepare a draft. It will show up here.</p><a href="#dashboards">Open Dashboards →</a></div>'}`;
    }
  }
  function renderDashboard(root,selected){
    const campaigns=[...new Set(audiences.flatMap(item=>item.campaigns))].sort();
    const filtered=audiences.filter(item=>(statusFilter==='all'||item.status===statusFilter)&&(campaignFilter==='all'||item.campaigns.includes(campaignFilter))).sort((a,b)=>sort==='size'?b.accounts-a.accounts:sort==='freshness'?b.days-a.days:sort==='status'?a.status.localeCompare(b.status):a.name.localeCompare(b.name));
    const filters=`<div class="aud-controls">${selectControl('aud-status','Status',[['all','All statuses'],['Active','Active'],['Needs review','Needs review'],['Stale','Stale'],['Draft','Draft']],statusFilter)}${selectControl('aud-campaign','Used by',[['all','All campaigns'],...campaigns.map(name=>[name,name])],campaignFilter)}${selectControl('aud-sort','Sort',[['name','Name A–Z'],['size','Size, largest first'],['freshness','Stalest first'],['status','Status A–Z']],sort)}</div>`;
    const target=audiences.find(item=>item.id===selected);
    const citedId={'intent-surge':'refresh','tier-1-named':'overlap','product-retargeting':'suppression'}[selected];
    const cited=citedId&&status(citedId)==='Approved'?ruleData(citedId):null;
    root.innerHTML=`<div class="aud-section-head"><div><h2>Audience library</h2><p>Every list your team targets. Fix stale data, low match rates and shared accounts before they waste spend.</p></div><span>${audiences.length} audiences</span></div><div class="aud-exclusions"><span class="aud-exclusions-label" data-tip="Mojo removes these from every prospecting list on every platform, so you never pay to advertise to them.">Always left out</span><span class="aud-exclusions-list">${EXCLUSIONS.map(([k,n])=>`<span><b>${esc(k)}</b> ${n.toLocaleString()}</span>`).join('')}</span><a class="mp-link" href="#best-practices:suppression">Edit rules →</a></div>${filters}<div class="aud-table-scroll"><table class="aud-table"><thead><tr><th>Audience</th><th>Size</th><th><span data-tip="How recently the list was updated. Stale lists target accounts that may have moved on.">Freshness</span></th><th><span data-tip="How much of the list each ad platform can find. Under 50% means most of it never sees your ads there.">Match rate</span></th><th><span data-tip="Campaigns, plans and Sales teams using this list">Used in</span></th><th><span data-tip="Accounts this list shares with another audience. Over 35% means you pay twice to reach the same accounts.">Shared accounts</span></th></tr></thead><tbody>${filtered.map(item=>`<tr class="${item.id===selected?'is-selected':''}"><th scope="row"><a href="#dashboards:${item.id}">${esc(item.name)}</a><small>${esc(item.definition)}</small></th><td class="aud-num">${item.accounts.toLocaleString()} accts<small>${item.contacts.toLocaleString()} contacts</small></td><td class="aud-nowrap"><span class="mp-status ${freshness(item)[0]}">${esc(freshness(item)[1])}</span><small>Updated ${esc(item.updated)}</small></td><td class="aud-nowrap">${matchHtml(item)}</td><td class="aud-nowrap">${usedInHtml(item)}</td><td>${overlapHtml(item)}</td></tr>`).join('')}</tbody></table></div>${filtered.length?'':'<p class="aud-empty">No audiences match those filters.</p>'}${target?`<section class="aud-detail aud-detail2" id="aud-detail"><div class="aud-detail-top"><div><span class="aud-feed-type">${esc(target.type)}</span><h3>${esc(target.name)}</h3><p>${esc(target.definition)}</p></div><a href="#dashboards" aria-label="Close audience detail">×</a></div>
<div class="aud-callout"><span class="aud-callout-dot" aria-hidden="true"></span><p>${esc(NEXT[target.id]||target.risk)}</p><button type="button" class="mp-btn" data-aud-action="stage" data-id="${target.id}" ${state.actions[target.id]?'disabled':''}>${state.actions[target.id]?'Draft saved ✓':esc(target.action)}</button></div>
<div class="aud-tiles"><div><small>Size</small><strong>${target.accounts.toLocaleString()} accts</strong><span>${target.contacts.toLocaleString()} contacts</span></div><div><small>Freshness</small><strong><span class="mp-status ${freshness(target)[0]}">${esc(freshness(target)[1])}</span></strong><span>Updated ${esc(target.updated)} · ${esc(target.source)}</span></div><div data-tip="Share of this list each ad platform can find. Under 50% means most of the list never sees your ads there."><small>Match rate</small><strong>${matchHtml(target)}</strong><span>${lowMatch(target).length?`${esc(LOGO[lowMatch(target)[0][0]][1])} is low`:'Good on every platform'}</span></div><div><small>Results so far</small><strong>${esc(health(target).results.split(' · ')[0])}</strong><span>${esc(health(target).results.split(' · ')[1]||'')}</span></div></div>
<dl class="mp-facts aud-detail-facts"><dt>Used in</dt><dd>${usedInHtml(target)}${target.campaigns.length?` <span class="aud-quiet">${esc(target.campaigns.join(', '))}</span>`:''}</dd><dt>Shares accounts with</dt><dd>${overlapHtml(target,true)}</dd><dt>Left out automatically</dt><dd>Customers, open opportunities, competitors, do-not-contact</dd></dl>
<div class="mp-actions"><button type="button" class="mp-link" data-aud-share="${target.id}">${sharedWithSales(target.id)?'Shared with Sales ✓':'Share with Sales'}</button>${freshness(target)[0]==='warn'?`<button type="button" class="mp-link" data-aud-refresh="${target.id}">${state.refreshed?.[target.id]?'Refresh requested ✓':'Refresh now'}</button>`:''}<a class="mp-link" href="CampaignLifecycle.html?view=build">Use in a campaign →</a>${cited?`<a class="mp-link aud-rule-link" href="#best-practices:${citedId}">Rule: ${esc(cited.title)}</a>`:''}</div></section>`:''}`;
    const focus=target||audiences[0];
    const roles=[
      ['Economic buyer','VP marketing or CMO','Business case, cost, and outcomes'],
      ['Champion','Demand generation lead','Campaign orchestration and activation'],
      ['Technical evaluator',focus.role||'Marketing operations','CRM integration, identity, and data quality'],
      ['Revenue partner','Sales or RevOps','Account handoff and pipeline evidence'],
      ['Approver','Procurement or security','Terms, governance, and risk']
    ];
    const buyingGroups=`<section class="aud-buying-groups" aria-labelledby="aud-buying-title"><div class="aud-section-head"><div><h2 id="aud-buying-title">Who decides at ${esc(focus.name)} accounts</h2><p>Several people sign off on a purchase. Reach each of them with what they care about.</p></div></div><div class="aud-buying-grid">${roles.map(([functionName,role,question])=>`<article><small>${esc(functionName)}</small><strong>${esc(role)}</strong><p>${esc(question)}</p><span>Reached: connect contacts to see</span></article>`).join('')}</div><div class="aud-buying-footer"><p>Connect contacts to see which roles you\u2019ve reached and which you\u2019re missing.</p><a href="Connections.html">Connect contacts →</a><a href="AppWorkspace.html?app=aeo&amp;audience=${encodeURIComponent(focus.id)}#dashboards">See what these roles ask AI →</a></div></section>`;
    root.querySelector('.aud-table-scroll')?.insertAdjacentHTML('afterend',buyingGroups);
    if(target)root.querySelector('#aud-detail')?.scrollIntoView({block:'nearest'});
  }
  function renderPractices(root,selected){
    const shown=allRules().map(rule=>ruleData(rule.id)).filter(rule=>practiceFilter==='all'||rule.origin===practiceFilter);
    const pending=allRules().filter(rule=>status(rule.id)==='Proposed').length;
    const canWrite=state.role!=='teammate';
    const row=(rule,index)=>{
      const routine=rule.routine||ruleRoutine[rule.id];
      const identity=rule.author?`Written by ${esc(rule.author)}`:rule.origin==='mojo'?'Mojo proposal':'MOps team';
      const reviewActions=rule.origin==='mojo'&&rule.status==='Proposed'
        ?state.role==='reviewer'?`<div class="aud-rule-actions"><button type="button" data-aud-action="approve" data-id="${rule.id}">Approve</button><button type="button" data-aud-action="edit" data-id="${rule.id}">Edit first</button><button type="button" data-aud-action="reject" data-id="${rule.id}">Decline with reason</button></div>`:'<p>Only a designated MOps reviewer can approve, edit, or decline this proposal.</p>'
        :rule.status==='Draft'?`<div class="aud-rule-actions">${state.role==='reviewer'?`<button type="button" data-aud-action="approve" data-id="${rule.id}">Approve</button>`:''}${canWrite?`<button type="button" data-aud-action="edit" data-id="${rule.id}">Edit draft</button>`:''}</div>`:'';
      const exception=rule.status==='Approved'?`<div class="aud-rule-actions"><button type="button" data-aud-action="exception" data-id="${rule.id}">Request an exception</button></div>${(state.exceptions[rule.id]||[]).length?`<p>${state.exceptions[rule.id].length} exception request(s) recorded in this browser.</p>`:''}`:'';
      const statusClass={Approved:'active',Proposed:'proposed',Draft:'draft',Declined:'rejected'}[rule.status]||'draft';
      const statusLabel=rule.status==='Proposed'?'Needs review':rule.status;
      const enforcement=rule.enforcement||({ 'min-size':'Blocks activation',overlap:'Warns',refresh:'Warns',qualified:'Suggests',suppression:'Blocks activation','reach-approval':'Blocks activation'}[rule.id]||'Suggests');
      const origin=rule.origin==='mojo'?'<span class="mps-origin mojo"><img src="assets/moj-mdot.svg?v=20261104v230" alt="" aria-hidden="true">Mojo proposed</span>':'<span class="mps-origin org">Org-authored</span>';
      return `<details class="mps-row" id="${esc(rule.id)}" ${selected===rule.id?'open':''}><summary><span class="mps-number">${String(index+1).padStart(2,'0')}</span><span class="mps-main"><span class="mps-meta">${origin}<span>${esc(rule.source)}</span></span><strong>${esc(rule.title)}</strong><span class="mps-effect ${statusClass==='active'?'active':''}">${esc(rule.effect)}</span><span class="mps-owner">${identity}</span></span><span class="mps-status-stack"><span class="mps-status ${statusClass}">${esc(statusLabel)}</span><span class="mps-enforcement">${esc(enforcement)}</span></span><span class="mps-chevron" aria-hidden="true">⌄</span></summary><div class="mps-detail aud-practice-body"><div class="mps-facts"><div><small>Check or gate</small><p>${esc(rule.check)}</p></div><div><small>Applies to</small><p>${esc(rule.scope)}</p></div><div><small>Source</small><p>${esc(rule.source)}</p></div></div>${rule.evidence?`<p><b>Why proposed:</b> ${esc(rule.evidence)}</p>`:''}${routine?`<p><a href="Routines.html#${esc(routine)}">Open related routine →</a></p>`:''}${rule.approvedBy?`<p>Approved by ${esc(rule.approvedBy)}.</p>`:''}${rule.reason?`<p>Declined by ${esc(rule.rejectedBy||'MOps')}: ${esc(rule.reason)}</p>`:''}${reviewActions}${exception}<form data-aud-edit="${esc(rule.id)}" hidden><label>Standard<input name="title" required maxlength="120" value="${esc(rule.title)}"></label><label>Exact check<textarea name="check" required maxlength="500">${esc(rule.check)}</textarea></label><button>Save edit for review</button></form><form data-aud-reject="${esc(rule.id)}" hidden><label>Reason<textarea name="reason" required maxlength="300"></textarea></label><button>Decline proposal</button></form><form data-aud-exception="${esc(rule.id)}" hidden><label>Audience or campaign<input name="scope" required maxlength="80"></label><label>Why this rule does not fit<textarea name="reason" required maxlength="300"></textarea></label><button>Send request to MOps</button><small>The rule stays in place for everyone else.</small></form></div></details>`;
    };
    const composer=writeOpen&&canWrite?`<section class="aud-compose"><div class="aud-compose-head"><div><h3>Add an audience practice</h3><p>Describe the shared guidance and what Mojo should do with it.</p></div><button type="button" data-aud-action="close-write">Close</button></div><form data-aud-create=""><div class="aud-compose-grid"><label>Type<select name="type"><option>Guardrail</option><option>Rule</option><option>Playbook</option><option>Best practice</option></select></label><label>Enforcement<select name="enforcement"><option>Blocks activation</option><option>Warns</option><option>Suggests</option></select></label></div><label>Practice<input name="title" required maxlength="120" placeholder="Example: Suppress active customers before launch"></label><label>Exact check or gate<textarea name="check" required maxlength="500" placeholder="State the threshold, definition, or approval step."></textarea></label><label>Applies to<input name="scope" required maxlength="120" placeholder="Which audiences or campaigns?"></label><div class="aud-compose-grid"><label>Author<input name="author" required maxlength="70" placeholder="Your name"></label><label>Source<input name="source" required maxlength="120" placeholder="MOps policy or playbook"></label></div><label>Related routine<select name="routine"><option value="audience-eligibility">Audience eligibility check</option><option value="audience-freshness-watch">Audience freshness watch</option><option value="audience-overlap-watch">Audience overlap watch</option><option value="audience-performance-watch">Audience performance watch</option></select></label><button>Save draft for review</button><small>A reviewer must approve the draft. Saving it changes no live audience.</small></form></section>`:'';
    root.innerHTML=`<header class="mps-head"><div><h1>Best practices</h1><p>The rules Mojo checks every audience against. Approve a proposal and Mojo enforces it everywhere.</p></div><details class="mps-create-menu"><summary class="mps-button" ${canWrite?'':'aria-disabled="true"'}>+ Add Best Practices</summary><div class="mps-create-options"><button type="button" data-aud-action="describe-practice"><b>Describe it to Mojo</b><span>Write what you need in plain words.</span></button><button type="button" data-aud-action="write" data-practice-type="Guardrail"><b>Guardrail</b><span>Blocks or flags a risky action.</span></button><button type="button" data-aud-action="write" data-practice-type="Rule"><b>Rule</b><span>A shared definition everyone uses.</span></button><button type="button" data-aud-action="write" data-practice-type="Playbook"><b>Playbook</b><span>Steps for a repeatable situation.</span></button><button type="button" data-aud-action="write" data-practice-type="Best practice"><b>Best practice</b><span>Guidance Mojo suggests.</span></button></div></details></header><div class="mps-toolbar"><div class="mps-filters aud-pill-group" role="group" aria-label="Filter practices">${[['all','All practices',allRules().length],['org','Org-authored',allRules().filter(rule=>rule.origin==='org').length],['mojo','Mojo proposed',allRules().filter(rule=>rule.origin==='mojo').length]].map(([id,label,count])=>`<label class="${practiceFilter===id?'is-on':''}"><input type="radio" name="practice-filter" value="${id}" ${practiceFilter===id?'checked':''}>${label} <span>${count}</span></label>`).join('')}</div><span class="mps-tally">${allRules().filter(rule=>status(rule.id)==='Approved').length} approved · ${pending} for review</span></div>${composer}<section class="mps-list" aria-label="Audience standards">${shown.map(row).join('')}</section>`;
  }
  function renderStrategy(root){
    root.innerHTML=`<div class="aud-strategy-lead"><span>COVERAGE</span><p>Are you reaching the right accounts, and the people inside them who decide? Fix the biggest gap first.</p></div>
      <section class="aud-strategy-section"><h2><small>01</small> Are you reaching your best-fit accounts?</h2><div class="aud-strategy-coverage"><div class="aud-strategy-main-metric"><span>BEST-FIT ACCOUNTS IN AN AUDIENCE</span><strong>63%</strong><p>1,520 of your 2,400 best-fit accounts can see your ads. The rest can\u2019t.</p><div class="aud-reach-track"><i></i></div></div><div class="aud-strategy-side-metric"><span>NOT IN ANY AUDIENCE</span><strong>880</strong><p>Best-fit accounts no campaign can reach. Add them to an audience.</p></div><div class="aud-strategy-side-metric"><span>RESEARCHING NOW</span><strong>214</strong><p>Showing buying intent this week. Add these first.</p></div></div><p class="aud-strategy-note"><a href="#dashboards:enterprise-intent">Add the 214 to Enterprise Intent →</a></p></section>
      <section class="aud-strategy-section aud-bg-strategy" aria-labelledby="aud-bg-strategy-title"><h2 id="aud-bg-strategy-title"><small>02</small> Are you reaching everyone who decides?</h2><p class="aud-bg-intro">Deals stall when you only reach one person. Make sure each of these roles hears a reason to buy.</p><div class="aud-bg-role-map">${[['Budget owner','VP marketing / CMO','Cost, expected return and the business case'],['Champion','Demand generation lead','How to launch and reach target accounts'],['Evaluator','Marketing operations','Identity, Salesforce integration and data controls'],['Sales partner','Sales / RevOps','When to follow up and what counts as progress'],['Approver','Procurement / security','Terms, privacy and risk']].map(([stage,role,need])=>`<article><small>${stage}</small><strong>${role}</strong><p>${need}</p><span>Reached: connect contacts to see</span></article>`).join('')}</div><div class="aud-bg-strategy-actions"><p><b>Next:</b> find the 214 new intent accounts that have no budget owner or evaluator reached, and target those roles.</p><a href="#dashboards:enterprise-intent">Review Enterprise Intent →</a><a href="AppWorkspace.html?app=aeo&amp;audience=enterprise-intent#dashboards">See what these roles ask AI →</a></div></section>
      <section class="aud-strategy-section"><h2><small>03</small> Is the data fresh enough to act on?</h2><div class="aud-strategy-pair"><div><span class="aud-strategy-label">FRESHNESS</span><strong>3 of 5</strong><p>live audiences are fresh. Intent Surge is 16 days old. Refresh it before the next flight.</p><a href="#dashboards:intent-surge">Check Intent Surge →</a></div><div><span class="aud-strategy-label">CONTACTS AND CRM</span><strong>Not connected</strong><p>Connect them to see which roles you\u2019ve reached and which deals followed your ads.</p><a href="Connections.html">Connect →</a></div></div></section>
      <section class="aud-strategy-section"><h2><small>04</small> Prove it with one test</h2><div class="aud-strategy-steps"><div><small>01 · PICK</small><strong>Choose the accounts.</strong><p>Start with the 214 researching now.</p></div><div><small>02 · TAILOR</small><strong>Give each role its own message.</strong><p>The CMO wants the business case. Marketing Ops wants integration proof.</p></div><div><small>03 · TEST</small><strong>Run a small campaign.</strong><p>Hold back a similar group so you can see what the ads changed.</p></div></div><p class="aud-strategy-note"><a href="Strategy.html#next-test">See the campaign test →</a></p></section>`;
  }
  window.MojoAudiences={mount};
})();
