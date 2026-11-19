/* A focused, source-aware path through the Mojo board demo. Demo data stays in this browser. */
(() => {
  const connectedKey='mojo-board-demandbase-connected-v1';
  if(localStorage.getItem(connectedKey)!=='true')return;
  const page=(location.pathname.split('/').pop()||'').replace(/\.html$/,'');
  const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key)||'null')||fallback}catch{return fallback}};
  const save=(key,value)=>localStorage.setItem(key,JSON.stringify(value));
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const extrasKey='mojo-board-extra-connections-v1';
  const practiceKey='mojo-board-practices-v1';
  const draftKey='mojo-board-draft-v1';
  const steps=['Dashboards','Best practices','Campaign ideas','Draft campaign','Your feed'];
  const ideas=[
    {id:'ironwood',title:'Bring the missing buyers into Ironwood Works',reason:'Ironwood has spent 21 days in Evaluation. Two of five buyer roles have seen the campaign.',tags:['Demandbase intent','Campaign performance','AEO'],message:'Show finance and security why Acme shortens the revenue handoff.',budget:3000},
    {id:'surging',title:'Reach accounts showing new intent',reason:'1,850 target accounts have active intent. Start with the 1,140 outside current campaign reach.',tags:['Demandbase intent','Audience coverage'],message:'Lead with the RevOps workflow buyers are researching.',budget:5000},
    {id:'comparison',title:'Show up in RevOps comparisons',reason:'Acme appears in one of four comparison answers. Update the comparison page, then test it as a campaign landing page.',tags:['AEO','Campaign performance'],message:'Answer the Acme versus alternatives question with evidence.',budget:2000}
  ];
  const audienceNames=['Evaluation accounts · missing roles','Enterprise Intent Surge','Mid-market operations leaders','Manufacturing evaluation','Financial services buying group','North America ICP · engaged','EMEA ICP · engaged','Strategic named accounts','Accounts researching AI for ABM','Pipeline visibility evaluators','RevOps automation researchers','Marketing operations leaders','Finance stakeholders','Security evaluators','Open opportunities · exclude','Customer expansion · exclude','New intent this week','High fit · low reach','Product retargeting','Comparison page visitors','Partner influenced accounts','Sales accepted accounts','Dormant evaluation accounts'];
  const audiences=audienceNames.map((name,index)=>({id:'aud-'+index,name,size:[1280,860,1460,520,470,1190,680,340,740,610,880,1050,430,390,214,318,780,920,605,450,380,290,510][index],fresh:[2,1,3,4,5,2,3,1,2,4,3,2,6,2,1,7,1,5,4,3,2,6,8][index],overlap:[18,24,12,16,22,31,27,14,20,19,15,21,9,11,6,8,17,28,13,25,10,7,23][index]}));
  const values=()=>({extras:read(extrasKey,{}),practices:read(practiceKey,{}),draft:read(draftKey,{})});
  const logo=(name,file)=>`<img src="assets/${file}" alt="${name} logo">`;
  const routeNav=()=>{
    document.querySelectorAll('a[href="Home.html?board=ready#feed"]').forEach(link=>{link.href='Home.html?board=notifications#feed';});
  };
  routeNav();
  const requestedStep=new URLSearchParams(location.search).get('step');
  if(page==='Portfolio'&&requestedStep==='dashboard')location.replace('Portfolio.html');
  else if(page==='Portfolio'&&requestedStep==='practices')location.replace('Strategy.html');
  else if(page==='Portfolio'&&requestedStep)startCampaigns();
  if(page==='AppWorkspace'&&new URLSearchParams(location.search).get('app')==='aeo'&&new URLSearchParams(location.search).get('from')==='campaign')startAeo();

  function startCampaigns(){
    let step=new URLSearchParams(location.search).get('step')||sessionStorage.getItem('mojo-board-step-v1')||'dashboard';
    if(!['dashboard','practices','ideas','draft'].includes(step))step='dashboard';
    let loading='',editPractice='',browseAll=false,audiencePanel=false,saved=false;
    const mount=()=>{
      const main=document.querySelector('main.canvaspane');if(!main)return;
      document.body.classList.add('board-demo-active');
      document.body.classList.toggle('board-draft-active',step==='draft');
      let root=document.getElementById('board-demo-flow');
      if(!root){root=document.createElement('section');root.id='board-demo-flow';root.setAttribute('aria-label','Campaigns workspace');}
      if(root.parentElement!==main)main.prepend(root);
      const {extras,practices,draft}=values();
      const index={dashboard:0,practices:1,ideas:2,draft:3}[step];
      const content=step==='dashboard'?dashboard(extras,loading):step==='practices'?bestPractices(practices,editPractice):step==='ideas'?campaignIdeas(extras,loading):campaignDraft(extras,practices,draft,browseAll,audiencePanel,saved);
      root.innerHTML=`<header class="bd-head"><div><h1>${steps[index]}</h1></div><div class="bd-step"><span>${index+1} of 5</span><i style="--bd-step:${(index+1)*20}%"></i></div></header><div class="bd-content">${content}</div>`;
      if(step==='draft')renderDraftChat(extras,practices,draft,browseAll,saved);
      main.scrollTo({top:0,behavior:'smooth'});
    };
    const goto=name=>{
      if(name==='feed'){location.href='Home.html?board=notifications#feed';return;}
      step=name;sessionStorage.setItem('mojo-board-step-v1',name);history.replaceState(null,'',`Portfolio.html?step=${name}`);editPractice='';browseAll=false;audiencePanel=false;saved=false;mount();
    };
    const ensure=()=>{const main=document.querySelector('main.canvaspane');if(!main){setTimeout(ensure,50);return;}routeNav();mount();new MutationObserver(()=>{const root=document.getElementById('board-demo-flow');if(root&&root.parentElement!==main)main.prepend(root);}).observe(main,{childList:true,subtree:true});};
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ensure,{once:true});else ensure();
    document.addEventListener('click',event=>{
      const root=event.target.closest('#board-demo-flow, #bd-draft-chat');if(!root)return;
      const action=event.target.closest('[data-bd-step],[data-bd-action]');if(!action)return;
      const target=action.dataset.bdStep;if(target){goto(target);return;}
      const kind=action.dataset.bdAction;
      if(kind==='connect-linkedin'||kind==='connect-gong'){
        const id=kind==='connect-linkedin'?'linkedin':'gong';if(loading)return;loading=id;mount();
        setTimeout(()=>{const updated=read(extrasKey,{});updated[id]=true;save(extrasKey,updated);loading='';mount();document.dispatchEvent(new CustomEvent('mojo:board-source-connected',{detail:{source:id}}));},matchMedia('(prefers-reduced-motion: reduce)').matches?100:1100);return;
      }
      if(kind==='practice'){const id=action.dataset.id,decision=action.dataset.decision;const current=read(practiceKey,{});if(decision==='edit'){editPractice=id;mount();return;}current[id]={status:decision,value:current[id]?.value||''};save(practiceKey,current);editPractice='';mount();return;}
      if(kind==='browse-audiences'){browseAll=!browseAll;mount();return;}
      if(kind==='select-audience'){const current=read(draftKey,{});current.audience=audiences[Number(action.dataset.index)];save(draftKey,current);browseAll=false;mount();return;}
      if(kind==='build-audience'){audiencePanel=true;mount();return;}
      if(kind==='close-audience'){audiencePanel=false;mount();return;}
      if(kind==='idea'){const current=read(draftKey,{});current.idea=action.dataset.id;current.audience=null;save(draftKey,current);goto('draft');return;}
      if(kind==='draft-budget'){const current=read(draftKey,{});current.budget=Number(action.dataset.value);save(draftKey,current);mount();return;}
      if(kind==='draft-channel'){const current=read(draftKey,{});current.channels=action.dataset.value==='linkedin'?['Demandbase Ads','LinkedIn Ads']:['Demandbase Ads'];save(draftKey,current);mount();return;}
      if(kind==='save-draft'){const current=read(draftKey,{});if(!current.audience)return;const idea=ideas.find(row=>row.id===current.idea)||ideas[0];current.name=current.name||((read(practiceKey,{}).naming?.status==='confirmed')?'2026-Q4-ENT-EVAL-NA-ABX':idea.title);current.budget=current.budget||idea.budget;current.start=current.start||'2026-11-09';current.channels=current.channels||['Demandbase Ads'];save(draftKey,current);saved=true;mount();return;}
    });
    document.addEventListener('submit',event=>{
      const root=event.target.closest('#board-demo-flow');if(!root)return;
      if(event.target.id==='bd-practice-edit'){event.preventDefault();const id=event.target.dataset.id,current=read(practiceKey,{});current[id]={status:'confirmed',value:String(new FormData(event.target).get('value')||'').trim()};save(practiceKey,current);editPractice='';mount();}
      if(event.target.id==='bd-audience-builder'){event.preventDefault();const data=new FormData(event.target),current=read(draftKey,{});current.audience={id:'new-evaluation',name:String(data.get('name')||'Evaluation buying group'),size:640,fresh:0,overlap:11,definition:`${data.get('stage')} · ${data.get('roles')}`};save(draftKey,current);audiencePanel=false;mount();}
    });
    document.addEventListener('mojo:board-source-connected',()=>{if(step==='dashboard'||step==='ideas')mount();});
    document.addEventListener('click',event=>{if(event.target.closest('.mojo-create-cta')){event.preventDefault();event.stopImmediatePropagation();goto(Object.keys(read(practiceKey,{})).length<3?'practices':'ideas');}},true);
  }

  function dashboard(extras,loading){
    const linked=!!extras.linkedin,google=!!extras.google,crm=!!extras.crm,count=1+Number(linked)+Number(google);
    return `<section class="bd-intro"><div><h2>Your campaigns, with the channels Mojo can see.</h2><p>Demandbase gives Mojo your accounts and ad campaigns. Add LinkedIn to see its spend and reach too.</p></div><span class="bd-source-pill">${logo('Demandbase','demandbase.png')} Demandbase connected</span></section><div class="bd-kpis"><article><small>SPEND IN VIEW</small><strong>${linked?'$284K':'$180K'}</strong><span>${linked?'Demandbase + LinkedIn':'Demandbase Ads'}</span></article><article><small>TARGET ACCOUNTS REACHED</small><strong>${linked?'5,690':'5,312'}</strong><span>of 6,400 target accounts</span></article><article><small>ACCOUNTS ENGAGED</small><strong>${linked?'1,666':'1,146'}</strong><span>Across connected delivery</span></article><article><small>PIPELINE INFLUENCED <em>PROVISIONAL</em></small><strong>${crm?'$2.1M':'—'}</strong><span>${crm?'Account match for review':'Connect Salesforce to see'}</span></article></div><section class="bd-card bd-completeness"><div><h3>You’re seeing ${count} of 3 ad platforms.</h3><p>Connect LinkedIn or Google Ads to see their campaigns here.</p></div><div class="bd-completeness-track"><i style="width:${count/3*100}%"></i></div></section><section class="bd-card bd-channel-table"><div class="bd-card-heading"><div><h3>Where your campaigns are running</h3><p>Spend and reach by connected channel.</p></div></div><div class="bd-channel-head"><span>CHANNEL</span><span>SPEND</span><span>ACCOUNTS REACHED</span><span>STATUS</span></div><div class="bd-channel-row"><span>${logo('Demandbase','demandbase.png')} Demandbase Ads</span><b>$180K</b><b>5,312</b><span class="bd-connected">Connected</span></div>${linked?`<div class="bd-channel-row bd-new-row"><span>${logo('LinkedIn Ads','linkedin.png')} LinkedIn Ads</span><b>$104K</b><b>2,180</b><span class="bd-connected">Connected</span></div>`:`<div class="bd-channel-row bd-locked"><span>${logo('LinkedIn Ads','linkedin.png')} LinkedIn Ads</span><b>—</b><b>—</b><button type="button" data-bd-action="connect-linkedin" ${loading?'disabled':''}>${loading==='linkedin'?'Connecting…':'Connect to see'}</button></div>`}<div class="bd-channel-row ${google?'bd-new-row':'bd-locked'}"><span>${logo('Google Ads','google-ads.svg')} Google Ads</span><b>${google?'$68K':'—'}</b><b>${google?'1,420':'—'}</b>${google?'<span class="bd-connected">Connected</span>':'<button type="button" data-board-open-connections>Connect to see</button>'}</div></section><div class="bd-next"><button type="button" class="bd-primary" data-bd-step="practices">See what Mojo learned →</button></div>`;
  }

  function bestPractices(practices,editPractice){
    const rules=[
      {id:'naming',label:'Naming conventions',title:'22 of 26 campaigns follow one naming pattern.',body:'Four campaign names break the pattern.',value:'Year-Quarter-Segment-Audience-Region-Tactic',detail:'2026-Q4-eBook-ConnectedGTM · 2026-Q4-EMEA-Benelux · 2026-Q4-Retargeting-Pricing-Page · 2026-Q4-CTV-ICP-Roku'},
      {id:'freshness',label:'Audience freshness',title:'Intent audiences usually refresh every 7 days.',body:'Intent Surge is at 16 days. Ask for a refresh before using it in a new flight.',value:'Refresh intent audiences every 7 days',detail:'Current exception · Intent Surge · 16 days old'},
      {id:'guardrail',label:'Budget guardrail',title:'Moves above $10K went through finance review.',body:'Mojo can draft the change; a finance owner approves before any platform update.',value:'Finance review before budget moves over $10,000',detail:'Also worth reviewing · 10% holdout · customer exclusions · two buyer roles at enterprise accounts'}
    ];
    const decided=rules.filter(rule=>practices[rule.id]?.status).length;
    return `<section class="bd-intro"><div><h2>Review three campaign rules Mojo found.</h2><p>Confirm each rule before Mojo uses it in a draft.</p></div><span class="bd-progress-count">${decided} of 3 reviewed</span></section><div class="bd-practice-stack">${rules.map(rule=>{const status=practices[rule.id]?.status;return `<article class="bd-card bd-practice"><div class="bd-practice-top"><span>${rule.label}</span>${status?`<b>${status==='confirmed'?'✓ Confirmed':'Not a rule'}</b>`:'<b>For review</b>'}</div><h3>${rule.title}</h3><p>${rule.body}</p><div class="bd-rule-value">${esc(practices[rule.id]?.value||rule.value)}</div><small>${rule.detail}</small>${editPractice===rule.id?`<form id="bd-practice-edit" data-id="${rule.id}"><label>Make this rule yours<input name="value" value="${esc(practices[rule.id]?.value||rule.value)}" required></label><button type="submit">Save rule</button></form>`:`<div class="bd-practice-actions"><button type="button" data-bd-action="practice" data-id="${rule.id}" data-decision="confirmed">Confirm</button><button type="button" data-bd-action="practice" data-id="${rule.id}" data-decision="edit">Edit</button><button type="button" data-bd-action="practice" data-id="${rule.id}" data-decision="dismissed">Not a rule</button></div>`}</article>`}).join('')}</div><div class="bd-next"><button type="button" class="bd-secondary" data-bd-step="dashboard">← Dashboards</button><button type="button" class="bd-primary" data-bd-step="ideas" ${decided<3?'disabled':''}>Use these in a campaign idea →</button></div>`;
  }

  function campaignIdeas(extras,loading){
    return `<section class="bd-intro"><div><h2>Three campaigns you could run next.</h2><p>See why Mojo suggested each one. Connect Gong to add what buyers said on calls.</p></div></section><div class="bd-idea-list">${ideas.map((idea,index)=>`<article class="bd-card bd-idea"><div class="bd-idea-number">0${index+1}</div><div><div class="bd-tags">${idea.tags.map(tag=>`<span>${tag}</span>`).join('')}${index===0?`<span class="${extras.gong?'bd-tag-on':'bd-tag-off'}">${extras.gong?'Gong · 4 of 6 calls':'Gong · connect for call themes'}</span>`:''}</div><h3>${idea.title}</h3><p>${idea.reason}</p>${index===0?`<div class="bd-gong-note">${extras.gong?'Security objections came up in 4 of 6 Ironwood calls. Lead the message with the security review and the proof buyers requested.':'Connect Gong to hear what Ironwood buyers say on calls.'}</div>`:''}<div class="bd-idea-actions"><button type="button" class="bd-primary" data-bd-action="idea" data-id="${idea.id}">Start drafting this campaign →</button>${index===0&&!extras.gong?`<button type="button" class="bd-secondary" data-bd-action="connect-gong" ${loading?'disabled':''}>${loading==='gong'?'Reading calls…':`${logo('Gong','gong.svg')} Connect Gong`}</button>`:''}</div></div></article>`).join('')}</div><div class="bd-next"><button type="button" class="bd-secondary" data-bd-step="practices">← Best practices</button></div>`;
  }

  function campaignDraft(extras,practices,draft,browseAll,audiencePanel,saved){
    const idea=ideas.find(row=>row.id===draft.idea)||ideas[0];
    const name=draft.name||(practices.naming?.status==='confirmed'?'2026-Q4-ENT-EVAL-NA-ABX':idea.title);
    const chosen=draft.audience;
    return `<section class="bd-intro bd-draft-intro"><div><h2>${idea.title}</h2><p>Work through the choices with Mojo in Chat. The draft takes shape here.</p></div></section><section class="bd-card bd-draft-artifact"><div class="bd-card-heading"><div><h3>Campaign draft</h3><p>${saved?'Saved for review':'Working draft'}</p></div>${logo('Demandbase','demandbase.png')}</div><div class="bd-artifact-grid"><div><small>Audience</small><strong>${chosen?esc(chosen.name):'Choose with Mojo'}</strong>${chosen?`<span>${chosen.size.toLocaleString()} accounts · refreshed ${chosen.fresh}d ago · ${chosen.overlap}% overlap</span>`:''}</div><div><small>Campaign name</small><strong>${chosen?esc(name):'Fills in after audience choice'}</strong></div><div><small>Channels</small><strong>${chosen?esc((draft.channels||['Demandbase Ads']).join(' + ')):'Demandbase Ads ready'}</strong></div><div><small>Budget and start</small><strong>${chosen?`$${(draft.budget||idea.budget).toLocaleString()} · ${esc(draft.start||'Nov 9')}`:'Set with Mojo'}</strong></div></div>${chosen?`<p class="bd-artifact-rule">${practices.naming?.status==='confirmed'?'✓ Naming pattern applied':'Naming pattern ready for review'} · ${practices.guardrail?.status==='confirmed'?'✓ Finance review over $10K':'Budget changes need review'}</p><div class="bd-aeo-note"><strong>Buyers ask AI how Acme compares with Flowcrest.</strong><span>Acme appears in 1 of 4 answers. Check the cited page before using it as the landing page.</span><a href="AppWorkspace.html?app=aeo&from=campaign#dashboards:best-chatgpt">Improve this in AEO →</a></div>`:''}</section>${audiencePanel?`<div class="bd-panel-scrim"><aside class="bd-audience-panel" role="dialog" aria-modal="true" aria-label="Build a new audience"><div class="bd-panel-head"><h2>Build an audience</h2><button type="button" data-bd-action="close-audience" aria-label="Close">×</button></div><p>Mojo has added the Evaluation stage and the missing finance and security roles.</p><form id="bd-audience-builder"><label>Audience name<input name="name" value="Ironwood · Evaluation missing roles" required></label><label>Buying stage<input name="stage" value="Evaluation" required></label><label>Buyer roles<input name="roles" value="Finance, Security" required></label><div class="bd-applied">Exclude customers · include accounts showing active intent</div><button type="submit" class="bd-primary">Save to draft</button></form></aside></div>`:''}<div class="bd-next"><button type="button" class="bd-secondary" data-bd-step="ideas">← Campaign ideas</button></div>`;
  }

  function renderDraftChat(extras,practices,draft,browseAll,saved){
    const pane=document.querySelector('.panes > .chatpane');
    const body=pane?.querySelector('.chatbody');
    if(!body)return;
    const checkbox=document.getElementById('chatOn');
    if(checkbox&&!checkbox.checked)checkbox.checked=true;
    const idea=ideas.find(row=>row.id===draft.idea)||ideas[0];
    const chosen=draft.audience;
    const name=draft.name||(practices.naming?.status==='confirmed'?'2026-Q4-ENT-EVAL-NA-ABX':idea.title);
    const list=browseAll?audiences:audiences.slice(0,3);
    const options=list.map((aud,index)=>`<button type="button" class="bd-chat-audience ${chosen?.id===aud.id?'is-selected':''}" data-bd-action="select-audience" data-index="${index}"><strong>${esc(aud.name)}</strong><span>${aud.size.toLocaleString()} accounts · ${aud.fresh}d fresh · ${aud.overlap}% overlap</span></button>`).join('');
    body.innerHTML=`<div id="bd-draft-chat" class="bd-chat-thread" aria-live="polite"><div class="bd-chat-you">Start drafting ${esc(idea.title)}</div><div class="bd-chat-mojo"><p>Let’s start with the audience. I’d use the Evaluation accounts missing finance and security. It’s current, and 1,280 accounts fit.</p><div class="bd-chat-audiences">${options}</div><div class="bd-chat-chips"><button type="button" data-bd-action="browse-audiences">${browseAll?'Show top matches':'See all 23 audiences'}</button><button type="button" data-bd-action="build-audience">Build a new audience</button></div></div>${chosen?`<div class="bd-chat-you">Use ${esc(chosen.name)}</div><div class="bd-chat-mojo"><p>I’ve named the draft <strong>${esc(name)}</strong>${practices.naming?.status==='confirmed'?' using the pattern you confirmed':''}. Demandbase Ads is ready. How much should we set aside for the first run?</p><div class="bd-chat-chips"><button type="button" class="${(draft.budget||idea.budget)===3000?'is-selected':''}" data-bd-action="draft-budget" data-value="3000">$3,000 test</button><button type="button" class="${draft.budget===5000?'is-selected':''}" data-bd-action="draft-budget" data-value="5000">$5,000</button></div>${extras.linkedin?`<p>LinkedIn is connected. Should I include it?</p><div class="bd-chat-chips"><button type="button" class="${(draft.channels||[]).includes('LinkedIn Ads')?'is-selected':''}" data-bd-action="draft-channel" data-value="linkedin">Add LinkedIn</button><button type="button" class="${!(draft.channels||[]).includes('LinkedIn Ads')?'is-selected':''}" data-bd-action="draft-channel" data-value="demandbase">Demandbase only</button></div>`:''}<p>I’ll use Nov 9 as the start date and keep the finance review guardrail. Nothing goes live when you save.</p>${saved?`<div class="bd-chat-receipt">✓ Draft saved for review. <a href="Home.html?board=notifications#feed">See your Home feed →</a></div>`:`<div class="bd-chat-chips"><button type="button" class="bd-chat-save" data-bd-action="save-draft">Save this draft</button><a href="AppWorkspace.html?app=aeo&from=campaign#dashboards:best-chatgpt">Check the AI answer in AEO</a></div>`}</div>`:''}</div>`;
  }

  function startAeo(){
    document.body.classList.add('board-aeo-active');
    const place=()=>{
      const main=document.querySelector('main.canvaspane');if(!main)return;
      let view=main.querySelector('.bd-aeo-handoff');
      if(!view){
        view=document.createElement('section');view.className='bd-aeo-handoff';
        view.innerHTML=`<div class="bd-aeo-handoff-head"><a href="Portfolio.html?step=draft">← Back to campaign draft</a></div><h2>How does Acme compare with Flowcrest for RevOps teams?</h2><p>Acme appears in one of four answers. The other three rely on a third-party category guide.</p><div class="bd-aeo-engine-list"><article><div><b>ChatGPT</b><span>Acme absent</span></div><p>Recommends Flowcrest for revenue handoffs; does not mention Acme.</p><small>Cites: Independent category guide</small></article><article><div><b>Perplexity</b><span class="is-mentioned">Acme mentioned</span></div><p>Names Acme alongside Flowcrest, but does not cite Acme’s site.</p><small>Cites: Independent category guide</small></article><article><div><b>Copilot</b><span>Acme absent</span></div><p>Points to a category guide and leaves Acme out.</p><small>Cites: Independent category guide</small></article><article><div><b>Google AI Overview</b><span>Acme absent</span></div><p>Names Flowcrest; Acme is missing from the visible answer.</p><small>Cites: Independent category guide</small></article></div><div class="bd-aeo-fix-panel"><h3>Give these answers a better source</h3><p>Mojo drafted an update to the Acme comparison page: include RevOps fit, security review details and evidence from the Ironwood campaign.</p><div class="bd-aeo-fixes"><label>Content update<select id="bd-aeo-fix"><option>Update comparison page</option><option>Verify pricing page</option></select></label><label>Owner<select id="bd-aeo-owner"><option>Content lead</option><option>Product marketing</option><option>Web team</option></select></label><button type="button" id="bd-aeo-assign">Assign update</button><button type="button" id="bd-aeo-track">Track question</button></div><p class="bd-aeo-status" role="status"></p></div><div class="bd-aeo-close"><strong>Use the updated page as the campaign landing page.</strong><a href="Home.html?board=notifications#feed">Go to your feed →</a></div>`;
        view.addEventListener('click',event=>{if(event.target.id==='bd-aeo-assign')view.querySelector('.bd-aeo-status').textContent=`✓ ${view.querySelector('#bd-aeo-fix').value} assigned to ${view.querySelector('#bd-aeo-owner').value}.`;if(event.target.id==='bd-aeo-track'){event.target.textContent='✓ Tracking';view.querySelector('.bd-aeo-status').textContent='Mojo will check this question again after the page changes.';}});
      }
      if(view.parentElement!==main)main.prepend(view);
    };
    const begin=()=>{routeNav();place();new MutationObserver(()=>{const main=document.querySelector('main.canvaspane');if(main&&!main.querySelector(':scope > .bd-aeo-handoff'))place();}).observe(document.body,{childList:true,subtree:true});};
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',begin,{once:true});else begin();
  }


})();
