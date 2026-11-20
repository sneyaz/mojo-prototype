(() => {
  const view = document.getElementById('fr-view');
  const firstRunNav = document.querySelector('.fr-app');
  try {
    const collapsed = localStorage.getItem('mojo-nav-expanded-v1') === 'false';
    firstRunNav?.classList.toggle('nav-collapsed', collapsed);
    const toggle = document.getElementById('fr-nav-toggle');
    toggle?.setAttribute('aria-pressed', String(collapsed));
    toggle?.setAttribute('aria-label', collapsed ? 'Expand navigation' : 'Collapse navigation');
  } catch {}
  const storageKey = 'mojo-board-demandbase-connected-v1';
  const revisitingCompany = new URLSearchParams(location.search).get('view') !== 'prospect';
  const clearPrototypeState = () => {
    for (const storage of [localStorage, sessionStorage]) {
      for (const key of Object.keys(storage)) if (key.startsWith('mojo-')) storage.removeItem(key);
    }
  };
  let stage = revisitingCompany ? 'company' : 'prospect';
  let progress = 0;
  let timer;
  let dashboardTimer;
  let discoveryTimer;
  let discoveryStep=revisitingCompany?5:0;
  let scrollToUpdatedRead=false;
  let revealObserver;
  let revealedSections=new Set();
  let domain = 'acme.com';
  let buyerConfirmed=false,adjustOpen=false,buyerCorrection='';
  let chatMessages=[];
  let chatHidden=false;
  let lastConversationStage='';
  let lastVisibleDiscoveryReceipt=-1;
  let lastDiscoveryPaint=-1;
  let selectedAdPlatforms=new Set();
  let demandbaseAuthorized=false;
  let justConnected=false;
  let competitorsSettling=false;
  let competitorRowsRevealed=false;
  try { buyerConfirmed=localStorage.getItem('mojo-board-buyer-confirmed-v1')==='true'; buyerCorrection=localStorage.getItem('mojo-board-buyer-correction-v1')||''; } catch {}
  const thresholds={campaigns:7,audiences:5,aeo:6};
  let extras={google:false,linkedin:false,meta:false,gong:false,crm:false,ga4:false,tag:false};
  try { extras={...extras,...JSON.parse(localStorage.getItem('mojo-board-extra-connections-v1')||'{}')}; } catch {}
  const cards = [
    {id:'campaigns', icon:'campaigns', name:'Campaigns', question:'Where should we invest, and what happened?', href:'HomeSystem.html#feed-insights', items:['Your live campaign performance and spend','Q4 flight pacing, so you catch underpacing early','Naming and budget patterns across campaigns','Campaign ideas Mojo thinks are worth testing']},
    {id:'audiences', icon:'audience', name:'Audiences', question:'Who should we reach?', href:'AppWorkspace.html?app=audience-builder#feed', items:['Your target account lists','Audiences built from those lists, kept fresh automatically','Buying groups mapped across target accounts','Accounts actively evaluating you right now']},
    {id:'aeo', icon:'aeo', name:'AEO', question:'What do buyers hear when they ask AI?', href:'AppWorkspace.html?app=aeo#feed', items:['The questions buyers are asking AI about you','How AI tools answer those questions today','How the sources AI cites compare to your own pages','Content fixes to close the gaps Mojo finds']}
  ];
  const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const animateKpiCount = el => {
    const to = Number(el.dataset.countTo);
    if (!Number.isFinite(to)) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { el.textContent = to.toLocaleString('en-US'); return; }
    const duration = 1100, start = performance.now();
    const step = now => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(to * eased).toLocaleString('en-US');
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const greetingWord=()=>{const h=new Date().getHours();return h<12?'Good morning':h<18?'Good afternoon':'Good evening'};
  const sourceLogo=(name,asset)=>`<img class="fr-source-logo" src="assets/${asset}" alt="${name} logo">`;
  const adPlatforms=[
    {id:'demandbase',name:'Demandbase',asset:'demandbase.png',benefit:'Account lists, intent and ABM campaigns'},
    {id:'linkedin',name:'LinkedIn Ads',asset:'linkedin.png',benefit:'Reach and creative across buying roles'},
    {id:'google',name:'Google Ads',asset:'google-ads.svg',benefit:'Search demand, spend and conversions'},
    {id:'meta',name:'Meta Ads',asset:'meta.svg',benefit:'Paid social reach and retargeting'}
  ];
  const moreSources=[['google','Google Ads','google-ads.svg','Compare search spend and delivery with your account campaigns.'],['linkedin','LinkedIn Ads','linkedin.png','See paid reach across the buying group.'],['gong','Gong','gong.svg','Hear buyer questions and objections from calls.'],['crm','Salesforce','salesforce.png','Connect activity to pipeline and customer exclusions.'],['ga4','Google Analytics 4','ga4-demo.svg','Measure site activity and AI referrals.']];
  const competitorMarks=[
    '<path d="M3 14c2.4-4 4.6-4 7 0s4.6 4 7 0 3.1-3.7 4-2.5"/><path d="M4 8c2-2 3.7-2 5.5 0" opacity=".72"/>',
    '<path d="M7 6 17 7l3 8-9 4-7-7z"/><path d="M7 6 11 19M17 7 4 12M20 15 7 6"/>',
    '<path d="M18.5 9a7 7 0 0 0-12.2-2L4 9m0 0V5m0 4h4"/><path d="M5.5 15a7 7 0 0 0 12.2 2L20 15m0 0v4m0-4h-4"/>',
    '<path d="M5 4v10h8v6M19 4v7h-6"/>',
    '<path d="m5 15 7 4 7-4M5 11l7 4 7-4M5 7l7 4 7-4"/>',
    '<path d="M4.5 9.5c2.4-4.4 6-4.4 8.4 0l1.6 3c1.5 2.8 3.2 2.8 5 0M19.5 14.5c-2.4 4.4-6 4.4-8.4 0l-1.6-3c-1.5-2.8-3.2-2.8-5 0"/>',
    '<path d="M5 5h14M5 12h14M5 19h14M8 5v14M16 5v14"/>',
    '<path d="M5 5h6v6H5zM13 5h6v6h-6zM5 13h6v6H5zM13 13h6v6h-6z"/>'
  ];
  const competitorData=[['flowcrest.io',71,1,1,'#5B3FA0'],['opsmesh.com',64,1,1,'#0759B0'],['revloop.ai',58,0,1,'#297A3F'],['pipeforge.co',52,1,0,'#AA4908'],['stackpilot.io',47,0,0,'#1E7F8A'],['syncwell.com',41,0,1,'#B5436B'],['trellisops.com',36,0,0,'#5A6577'],['gridline.ai',29,1,0,'#A87A1E']];
  const adCopy={
    'flowcrest.io':['Revenue work, without the handoff maze.','Bring every revenue handoff into one clearer flow.'],
    'opsmesh.com':['Make the operating plan visible.','Keep revenue teams moving from the same playbook.'],
    'revloop.ai':['Turn signals into the next step.','Help your team see what needs attention now.'],
    'pipeforge.co':['A cleaner path from lead to pipeline.','Give every handoff a place to land.'],
    'syncwell.com':['Keep every team in sync.','Connect the work between marketing and sales.'],
    'gridline.ai':['See the next revenue move.','Bring your plans and signals into focus.']
  };
  const competitorLogo=(color,index)=>`<span class="fr-competitor-logo" style="--competitor-color:${color}" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${competitorMarks[index]}</svg></span>`;
  const adPreview=(domain,platform,color,index)=>{
    const brand=domain.split('.')[0],displayBrand=brand[0].toUpperCase()+brand.slice(1),[headline,body]=adCopy[domain]||['A clearer way to work.','Bring your plans and signals into focus.'];
    const linkedIn=platform==='li',network=linkedIn?'LinkedIn':'Google',logo=`<img class="fr-provider-mark" src="assets/${linkedIn?'linkedin.png':'google-ads.svg'}" alt="">`;
    const creative=linkedIn?`<div class="fr-ad-social"><div class="fr-ad-head"><span class="fr-ad-avatar" style="--ad-accent:${color}">${brand[0].toUpperCase()}</span><div><b>${displayBrand}</b><small>Promoted · LinkedIn</small></div><i>···</i></div><p>${body}</p><div class="fr-ad-creative" style="--ad-accent:${color}"><span>${displayBrand}</span><strong>${headline}</strong><div class="fr-ad-lines"><i></i><i></i><i></i></div></div><div class="fr-ad-cta"><span>${domain}</span><b>Learn more ↗</b></div></div>`:`<div class="fr-ad-search"><div class="fr-ad-head"><span class="fr-ad-avatar" style="--ad-accent:${color}">${brand[0].toUpperCase()}</span><div><b>${displayBrand}</b><small>Sponsored · ${domain}</small></div></div><strong>${displayBrand} | ${headline}</strong><p>${body}</p><div class="fr-ad-search-links">Explore the platform · See how it works</div></div>`;
    return `<span class="fr-adpeek${index>=5?' flip':''}"><button type="button" class="fr-adpeek-trigger" aria-label="Preview ${network} ad for ${domain}">${logo}</button><span class="fr-adpeek-panel" role="tooltip"><span class="fr-adpeek-kicker">${logo}<b>${network} · ad preview</b></span>${creative}<span class="fr-ad-destination"><small>Destination URL</small><b>${domain}</b></span><span class="fr-ad-disclaimer"></span></span></span>`;
  };
  const adPlatformLineup=()=>`<div class="fr-ad-platforms" aria-label="Advertising platforms">${adPlatforms.map(platform=>`<span class="fr-ad-platform">${sourceLogo(platform.name,platform.asset)}<span>${platform.name}</span><small>${platform.benefit}</small></span>`).join('')}</div>`;
  const updateAdModal=()=>{const modal=document.querySelector('.fr-ad-dialog');if(!modal)return;modal.querySelectorAll('[data-fr-ad-platform]').forEach(button=>{const selected=selectedAdPlatforms.has(button.dataset.frAdPlatform);button.setAttribute('aria-pressed',String(selected));button.classList.toggle('is-first',selected);button.querySelector('small').textContent=selected?'Selected':'Select';});const names=adPlatforms.filter(platform=>selectedAdPlatforms.has(platform.id)).map(platform=>platform.name);modal.querySelector('[data-fr-ad-summary]').textContent=names.length?`${names.length} platform${names.length===1?'':'s'} selected · ${names.join(', ')}`:'Choose the channels you run';modal.querySelector('[data-fr-ad-description]').textContent=selectedAdPlatforms.has('demandbase')?'Demandbase adds account lists, audiences, intent and campaigns.':'Connect a channel to bring its campaigns into view.';const action=modal.querySelector('#fr-authorize');action.disabled=names.length===0;action.textContent='Connect ad platforms';};
  const showAdPlatformModal=(preselect)=>{
    document.querySelector('.fr-modal')?.remove();
    const modal=document.createElement('div');
    modal.className='fr-modal';
    selectedAdPlatforms=stage==='channels'?new Set(adPlatforms.filter(platform=>extras[platform.id]).map(platform=>platform.id)):new Set(preselect?[preselect]:[]);
    modal.innerHTML=`<div class="fr-dialog fr-ad-dialog fr-channel-dialog" role="dialog" aria-modal="true" aria-labelledby="fr-modal-title"><button type="button" class="fr-ad-dialog-close" id="fr-cancel" aria-label="Close">×</button><h2 id="fr-modal-title">Connect ad platforms</h2><p>Connect the platforms where you advertise. See spend, reach, and buyer engagement together.</p><div class="fr-channel-options">${adPlatforms.map(platform=>`<button type="button" class="fr-ad-platform" data-fr-ad-platform="${platform.id}" aria-pressed="false">${sourceLogo(platform.name,platform.asset)}<span>${platform.name}<small>Select</small></span><em>${platform.benefit}</em></button>`).join('')}</div><div class="fr-ad-selection"><b data-fr-ad-summary></b><span data-fr-ad-description></span></div><div class="fr-actions"><button class="fr-button" id="fr-authorize" type="button"></button><span class="fr-connect-assurance">${lockIcon}Read-only — nothing is ever edited, posted or spent</span></div></div>`;
    document.body.append(modal);
    updateAdModal();
    modal.querySelector('[data-fr-ad-platform]')?.focus();
  };
  const platformPermissions={
    demandbase:['Account lists and firmographic data','Intent topics and buying signals','Audience membership and segments'],
    linkedin:['Campaign performance and spend','Audience reach across buying roles'],
    google:['Campaign performance and spend','Search demand and conversion data'],
    meta:['Campaign performance and spend','Audience reach and retargeting lists']
  };
  const showPermissionModal=(selected,onAllow)=>{
    document.querySelector('.fr-modal')?.remove();
    const chosen=adPlatforms.filter(platform=>selected.has(platform.id));
    const modal=document.createElement('div');
    modal.className='fr-modal';
    modal.innerHTML=`<div class="fr-dialog fr-permission-dialog" role="dialog" aria-modal="true" aria-labelledby="fr-perm-title"><button type="button" class="fr-ad-dialog-close" id="fr-perm-close" aria-label="Close">×</button><div class="fr-perm-logos" aria-hidden="true">${chosen.map(platform=>sourceLogo(platform.name,platform.asset)).join('')}</div><h2 id="fr-perm-title">Allow read-only access?</h2><p>Mojo will use this to bring the following into your workspace. Mojo never edits, posts or spends on your behalf.</p><div class="fr-perm-groups">${chosen.map(platform=>`<div class="fr-perm-group"><div class="fr-perm-group-head">${sourceLogo(platform.name,platform.asset)}<b>${platform.name}</b></div><ul>${(platformPermissions[platform.id]||['Read-only account data']).map(scope=>`<li>${escape(scope)}</li>`).join('')}</ul></div>`).join('')}</div><div class="fr-actions"><button class="fr-button secondary" type="button" id="fr-perm-cancel">Cancel</button><button class="fr-button" type="button" id="fr-perm-allow">Allow read-only access</button></div></div>`;
    document.body.append(modal);
    const close=()=>{modal.remove();showAdPlatformModal();};
    modal.querySelector('#fr-perm-close').addEventListener('click',close);
    modal.querySelector('#fr-perm-cancel').addEventListener('click',close);
    modal.querySelector('#fr-perm-allow').addEventListener('click',()=>{modal.remove();onAllow();});
    modal.querySelector('#fr-perm-allow').focus();
  };
  const lockIcon=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" width="13" height="13"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>`;
  const adConnection=()=>{const topCompetitor=competitorData[0][0],otherCount=competitorData.length-1;return `<section class="fr-connection fr-ad-connection"><div class="fr-ad-connection-copy"><h2>See how you compare to ${topCompetitor} and ${otherCount} other competitors.</h2><p>Connect the channels you run to see your own spend, reach and gaps next to theirs — the last step before Campaigns, Audiences and AEO unlock.</p></div><div class="fr-ad-logo-row" aria-label="Available ad platforms">${adPlatforms.map(platform=>`<button type="button" class="fr-ad-logo" data-fr-quick-connect="${platform.id}" title="Connect ${platform.name}" aria-label="Connect ${platform.name}">${sourceLogo(platform.name,platform.asset)}${platform.name}</button>`).join('')}</div><div class="fr-ad-connection-cta"><button class="fr-button" id="fr-connect" type="button">Connect ad platforms</button><span class="fr-connect-assurance">${lockIcon}Read-only — Mojo never edits, posts or spends for you.</span></div></section>`;};
  const nav = ready => {
    let seen=[];try{seen=JSON.parse(localStorage.getItem('mojo-board-app-seen-v1')||'[]');}catch{}
    document.querySelectorAll('[data-app-link]').forEach(link => {const active=ready||(stage==='building'&&progress>=thresholds[link.dataset.appLink]);const enriched=link.dataset.appLink==='campaigns'?(extras.google||extras.linkedin||extras.meta||extras.crm):link.dataset.appLink==='audiences'?(extras.gong||extras.crm):extras.ga4;link.classList.toggle('ready',active);link.classList.toggle('enriched',!!enriched);link.classList.toggle('seen',seen.includes(link.dataset.appLink==='audiences'?'audience-builder':link.dataset.appLink));link.setAttribute('aria-disabled',String(!active));link.tabIndex=active?0:-1;});
    const home=document.getElementById('fr-home-link');
    home.href=ready?'Home.html?board=notifications#feed':'FirstRun.html';
    home.classList.add('active');
    const chatLink=document.getElementById('fr-nav-chat-link');
    if(chatLink){const available=!['welcome','prospect'].includes(stage);chatLink.disabled=!available;chatLink.setAttribute('aria-disabled',String(!available));chatLink.setAttribute('aria-expanded',String(available&&!chatHidden));}
  };
  const scrollToConnection=()=>{const canvas=view.closest('.fr-scroll'),target=view.querySelector('.fr-post-connection');if(canvas&&target)requestAnimationFrame(()=>canvas.scrollTo({top:canvas.scrollTop+target.getBoundingClientRect().top-canvas.getBoundingClientRect().top-20,behavior:'smooth'}));};
  const setStage = next => {clearTimeout(dashboardTimer);if(next!=='company'){clearInterval(discoveryTimer);revealObserver?.disconnect();scrollToUpdatedRead=false;}stage=next;render();if(['building','ready','dashboard','channels'].includes(next))scrollToConnection();else view.closest('.fr-scroll').scrollTop=0;};
  const startDiscovery=()=>{clearInterval(discoveryTimer);discoveryStep=0;scrollToUpdatedRead=false;lastConversationStage='';lastVisibleDiscoveryReceipt=-1;lastDiscoveryPaint=-1;revealedSections=new Set();stage='company';render();view.closest('.fr-scroll').scrollTop=0;discoveryTimer=setInterval(()=>{discoveryStep++;render();if(discoveryStep>=3)clearInterval(discoveryTimer);},1800);};
  const scrollCanvasToUpdatedRead=()=>{if(stage!=='company'||discoveryStep<4)return;const canvas=view.closest('.fr-scroll'),target=view.querySelector('.fr-competitors');if(!canvas||!target||target.hidden)return;const top=canvas.scrollTop+target.getBoundingClientRect().top-canvas.getBoundingClientRect().top-24;canvas.scrollTo({top,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});scrollToUpdatedRead=false;};
  const resumeDiscovery=()=>{clearInterval(discoveryTimer);if(discoveryStep>=4&&scrollToUpdatedRead)requestAnimationFrame(scrollCanvasToUpdatedRead);if(discoveryStep>=5)return;discoveryTimer=setInterval(()=>{discoveryStep++;if(discoveryStep===4){competitorsSettling=true;render();setTimeout(()=>{competitorsSettling=false;render();},1100);}else render();if(discoveryStep>=4&&scrollToUpdatedRead)requestAnimationFrame(scrollCanvasToUpdatedRead);if(discoveryStep>=5)clearInterval(discoveryTimer);},1800);};
  function renderProspectWelcome(){
    view.innerHTML = `<section class="fr-welcome">
      <div class="fr-welcome-main">
        
        <h1 class="fr-welcome-title">Who should see your <em>next campaign?</em></h1>
        <p class="fr-welcome-lead">Start with your site. Mojo will show who may buy and why.</p>
        <div class="fr-welcome-entry"><label for="fr-domain">YOUR COMPANY WEBSITE</label><form id="fr-domain-form"><span class="fr-welcome-globe" aria-hidden="true">◎</span><input id="fr-domain" type="text" inputmode="url" value="${escape(domain)}" aria-label="Company website" required><button type="submit">See what Mojo finds <span aria-hidden="true">↗</span></button></form></div>
      </div>
      <aside class="fr-welcome-preview" aria-label="Preview of Mojo's first read">
        <div class="fr-welcome-preview-top"><b>MOJO’S FIRST READ</b><span><i></i> Acme Co</span></div>
        <div class="fr-welcome-preview-task"><span>✦</span><b>First audience for Acme Co</b></div>
        <div class="fr-welcome-preview-body"><div class="fr-welcome-company"><span>A</span><div><b>Acme Co</b><small>acme.com</small></div><em>Ready for review</em></div>
          <div class="fr-welcome-read"><span>01</span><div><b>WHAT ACME CO SELLS</b><p>Workflow automation for revenue operations.</p></div></div>
          <div class="fr-welcome-read"><span>02</span><div><b>WHO MAY BUY</b><p>RevOps and marketing ops at mid-market software firms.</p></div></div>
          <div class="fr-welcome-audience"><div><b>POTENTIAL ACCOUNTS</b><span>For review</span></div><strong>6,400</strong></div>
        </div>
      </aside>
    </section>`;
  }
  function renderChannels(){
    nav(false);
    renderCompany();
    const chosen=adPlatforms.filter(platform=>selectedAdPlatforms.has(platform.id));
    const channelRead={linkedin:['8 campaigns','$104K','Buying role reach'],google:['6 campaigns','$68K','Search demand'],meta:['4 campaigns','$24K','Paid social reach']};
    view.firstElementChild.insertAdjacentHTML('beforeend',`<section class="fr-post-connection fr-card fr-connected-read"><h2>Your campaigns are coming into view.</h2><p>Here’s the first pass from the channels you selected.</p><div class="fr-connected-channel-list">${chosen.map(platform=>`<span>${sourceLogo(platform.name,platform.asset)}<b>${platform.name}</b><small>${channelRead[platform.id]?.join(' · ')||'Connected'}</small></span>`).join('')}</div><button class="fr-button secondary" type="button" id="fr-connect">Connect another platform</button></section>`);
  }
  function renderPreview(){
    view.innerHTML = `<section class="fr-content">
      <div class="fr-preview-head"><div><div class="fr-kicker">Mojo's first read · no connections yet</div><h1 class="fr-title">Here’s what I understand about Acme Co.</h1><p class="fr-lead">This is a starting hypothesis. Confirm the company story before Mojo uses it to make campaign or audience recommendations.</p></div><div class="fr-domain-badge"><b>A</b><span>Acme Co<br><small>${escape(domain)}</small></span></div></div>
      <div class="fr-grid">
        <article class="fr-card"><div class="fr-iconbox">◈</div><h2>What you sell</h2><div class="fr-fact">Workflow automation for revenue operations teams.</div><span class="fr-source">Company website</span></article>
        <article class="fr-card"><div class="fr-iconbox">♧</div><h2>Who may buy</h2><div class="fr-fact">RevOps, marketing ops and sales ops at mid-market B2B software companies.</div><span class="fr-source">Customer stories</span></article>
        <article class="fr-card"><div class="fr-iconbox">✧</div><h2>A first opportunity</h2><div class="fr-fact">Build a buyer group around teams evaluating account-based growth.</div><span class="fr-source">Mojo inference · needs review</span></article>
      </div>
      <div class="fr-actions"><button class="fr-button secondary" id="fr-company-detail" type="button">Explore the full company read →</button><button type="button" id="fr-adjust" style="border:0;background:none;color:#604398;text-decoration:underline">Change website</button></div>
      ${adConnection()}
      <p class="fr-small" style="margin-top:14px">Public site content is separate from connected Demandbase data. Mojo does not claim first-party traffic, conversion or pipeline results until the relevant systems are connected.</p>
    </section>`;
  }
  const lastSeenDays=[2,1,3,1,4,2,5,3];
  const competitorRow=([name,overlap,li,g,color],index,fresh)=>`<div class="fr-competitor-row${fresh?' fr-row-fresh':''}" style="--row-index:${index}"><div class="fr-competitor-name">${competitorLogo(color,index)}<div><b>${name}</b><small class="fr-competitor-seen">Ad seen ${lastSeenDays[index%lastSeenDays.length]}d ago</small></div></div><div class="fr-competitor-ads">${li?adPreview(name,'li',color,index):''}${g?adPreview(name,'g',color,index):''}</div><div class="fr-competitor-overlap"><i><b style="width:${overlap}%"></b></i></div></div>`;
  const competitorSkeletonRow=index=>`<div class="fr-competitor-row is-skeleton" style="--row-index:${index}" aria-hidden="true"><div class="fr-competitor-name"><i class="fr-skel-avatar"></i><i class="fr-skel-line"></i></div><div class="fr-competitor-ads"><i class="fr-skel-logo"></i><i class="fr-skel-logo"></i></div><div class="fr-competitor-overlap"><i class="fr-skel-track"></i></div></div>`;
  function renderCompany(){
    const connected=localStorage.getItem(storageKey)==='true'||demandbaseAuthorized;
    const postConnect=['building','ready','dashboard','channels'].includes(stage);
    const kpiAccounts=connected?6823:6400,kpiCompetitors=connected?11:8;
    const competitorsReady=discoveryStep>=4&&!competitorsSettling;
    const competitorRowsFresh=competitorsReady&&!competitorRowsRevealed;
    if(competitorRowsFresh)competitorRowsRevealed=true;
    view.innerHTML=`<section class="fr-content fr-company">
      <div class="fr-preview-head"><div>${connected?`<p class="fr-greeting">${greetingWord()}, Pam!</p>`:''}<h1 class="fr-title">Acme Co, at a glance.</h1></div><div class="fr-domain-badge"><b>A</b><span>Acme Co<br><small>${escape(domain)}</small></span></div></div>
      ${discoveryStep<2?'<div class="fr-discovery-skeleton" aria-label="Mojo is building your company read"><div><i></i><i></i><i></i></div><div><i></i><i></i><i></i></div><div><i></i><i></i><i></i></div><div><i></i><i></i><i></i></div></div>':''}
      <div class="fr-kpis"><article><small>${connected?'TARGET ACCOUNTS':'COMPANIES FIT'}</small><strong data-count-to="${kpiAccounts}">${kpiAccounts.toLocaleString('en-US')}</strong><span>${connected?'From Demandbase account lists':'Potential matches · market estimate'}</span></article><article><small>COMPETITORS</small><strong data-count-to="${kpiCompetitors}">${kpiCompetitors}</strong><span>${connected?'Confirmed via your connected accounts':'Public ad examples available'}</span></article></div>
      <article class="fr-card fr-profile-card"><div class="fr-profile-head"><span class="fr-profile-avatar">A</span><div><h2>Acme Co</h2><small>${escape(domain)}</small></div><span class="fr-profile-found">Found</span></div><p class="fr-profile-story">Workflow automation for revenue operations teams.</p><div class="fr-profile-facts"><div><b>Boston</b><span>Based in</span></div><div><b>2018</b><span>Founded</span></div><div><b>180</b><span>People</span></div><div><b>Series C</b><span>Stage</span></div></div></article>
      <div class="fr-company-sections">
        <article class="fr-card fr-buyers"><h2>Who may buy</h2><p>RevOps, marketing ops and sales ops at B2B software companies with 200–2,000 employees.${buyerCorrection?`<br><b>Your correction:</b> ${escape(buyerCorrection)}`:''}</p><div class="fr-role-row"><span>RevOps leaders</span><i><b style="width:38%"></b></i><strong>38%</strong></div><div class="fr-role-row"><span>Marketing ops</span><i><b style="width:27%"></b></i><strong>27%</strong></div><div class="fr-role-row"><span>Sales ops</span><i><b style="width:21%"></b></i><strong>21%</strong></div><span class="fr-source">${connected?'Customer stories + Demandbase':'Customer stories + market estimates'}</span></article>

      </div>
      <article class="fr-card fr-competitors"><div class="fr-competitor-title"><h2>Who you compete with</h2><span>Overlap with your likely buyers</span></div><div class="fr-competitor-head"><span>COMPETITOR</span><span>ADS FOUND ON</span><span>OVERLAP</span></div>${competitorsSettling?[0,1,2,3].map(competitorSkeletonRow).join(''):competitorData.slice(0,4).map((item,index)=>competitorRow(item,index,competitorRowsFresh)).join('')}${competitorsReady?`<details class="fr-competitor-more"><summary>Show all 8 competitors</summary>${competitorData.slice(4).map((item,index)=>competitorRow(item,index+4)).join('')}</details><p class="fr-competitor-note">Select a platform logo to preview an ad.</p>`:''}</article>
      <details class="fr-sources"><summary>Where this comes from</summary><div><b>Public company content</b><span>Company site and customer stories.</span></div><div><b>Market estimates</b><span>Directional fit, visits and competitor examples.</span></div><div><b>Demandbase</b><span>${connected?'Account lists, intent, audiences and ads are in.':'Private workspace data appears after connection.'}</span></div></details>
      ${postConnect?'':connected?`<div class="fr-actions"><a class="fr-button" href="Home.html?board=notifications#feed">Return to Home feed →</a><a class="fr-button secondary" href="Portfolio.html">Open Campaigns</a></div>`:`${adConnection()}`}
    </section>`;
    const reveals=[['.fr-profile-card',1],['.fr-kpis',2],['.fr-buyers',3],['.fr-competitors',4],['.fr-sources',5],['.fr-connection',5],['.fr-actions',5]];
    if(justConnected){revealedSections.delete('.fr-kpis');justConnected=false;}
    revealObserver?.disconnect();
    revealObserver='IntersectionObserver' in window?new IntersectionObserver(entries=>entries.forEach(entry=>{if(!entry.isIntersecting)return;const element=entry.target;const firstReveal=!revealedSections.has(element.dataset.revealKey);revealedSections.add(element.dataset.revealKey);element.classList.add('is-visible');if(firstReveal)element.querySelectorAll('strong[data-count-to]').forEach(animateKpiCount);revealObserver?.unobserve(element);}),{root:view.closest('.fr-scroll'),rootMargin:'0px 0px -28px 0px',threshold:.05}):null;
    reveals.forEach(([selector,step])=>{const element=view.querySelector(selector);if(!element)return;element.hidden=discoveryStep<step;if(element.hidden)return;element.dataset.revealKey=selector;element.classList.add('fr-scroll-reveal');if(revealedSections.has(selector))element.classList.add('is-visible','is-settled');else if(!revealObserver){element.classList.add('is-visible');revealedSections.add(selector);element.querySelectorAll('strong[data-count-to]').forEach(animateKpiCount);}else revealObserver.observe(element);});
  }
  const scanFindings={
    campaigns:[['6 campaigns','Conversion tracking stopped after Nov 3','FIX'],['9 of 22 flights','Underpacing this quarter','OPTIMIZE'],['3 ended flights','Buyer follow-up to plan','OPTIMIZE']],
    audiences:[['1,146 engaged','Most reached one buyer role'],['3 target lists','Imported from your connected sources'],['Buying groups','Mapped across target accounts']],
    aeo:[['24 questions','Drawn from buyer intent'],['Cited sources','Compared with Acme pages'],['Content gaps','Ready for review']]
  };
  const scanRecords={
    campaigns:[['Enterprise ABX','$12,000'],['EMEA evaluation','$9,000'],['Manufacturing ABX','$11,500'],['Security proof','$8,000'],['Finance follow-up','$7,500'],['Q4 retargeting','$6,000'],['Buying group follow-up','Next flight gap']],
    audiences:[['Helio Systems','engaged'],['Northgate','evaluation'],['Brightline','engaged'],['Kestrel Labs','evaluation']],
    aeo:[['Reaching buying groups','cited #3'],['Best ABM tools','not cited'],['Security integrations','source checked'],['Revenue operations','content gap']]
  };
  const scanStatus=['Connecting your ad platforms','Reading target account lists','Mapping buying groups','Reading live campaigns','Checking conversion events','Comparing flight pacing','Checking buyer questions','Ranking what needs your attention'];
  let scanAnimation=0,scanRun=0;
  const scanValue=(card,index,step=progress)=>{const begin=index===0?0:index===1?1:2;const span=index===0?7:index===1?4:4;return Math.max(0,Math.min(1,(step-begin)/span))*[42,6400,24][index]};
  function scanCard(card,index){
    const ready=progress>=thresholds[card.id],value=Math.round(scanValue(card,index));
    const previous=Math.round(scanValue(card,index,progress-1));
    const pct=Math.max(0,Math.min(100,Math.round(value/[42,6400,24][index]*100)));
    const prevPct=Math.max(0,Math.min(100,Math.round(previous/[42,6400,24][index]*100)));
    const arriving=Math.max(0,Math.min(scanRecords[card.id].length,progress-index));
    const records=scanRecords[card.id].slice(Math.max(0,arriving-3),arriving).reverse();
    const unit=card.id==='campaigns'?'live campaigns':card.id==='audiences'?'target accounts':'buyer questions';
    return `<article data-scan-app="${card.id}" class="fr-scan-card ${ready?'is-ready':''} ${ready&&card.id==='campaigns'?'is-focus':''}" aria-label="${card.name} ${ready?'ready':'scanning'}"><div class="fr-scan-card-top"><h2>${card.name}</h2><span class="fr-scan-state">${ready?(card.id==='campaigns'?'3 open':'Ready'):'Syncing'}</span></div><div class="fr-scan-count"><strong data-scan-count data-from="${ready?value:previous}" data-to="${value}">${ready?value.toLocaleString('en-US'):previous.toLocaleString('en-US')}</strong><span>${unit}${card.id==='campaigns'?' · $180K in Q4 flights':card.id==='audiences'?' · 3 audiences':' tracked'}</span></div><div class="fr-scan-card-track"><i style="--from:${prevPct}%;--to:${pct}%"></i></div>${ready?`<div class="fr-scan-findings">${scanFindings[card.id].map(([number,label,kind])=>`<div><span class="fr-scan-finding-text"><b>${number}</b><span>${label}</span></span>${kind?`<em>${kind}</em>`:''}</div>`).join('')}</div>`:`<div class="fr-scan-stream">${records.length?records.map(([name,detail],row)=>`<div class="fr-scan-record ${row===0?'new':''}" style="--row:${row}"><b>${name}</b><small>${detail}</small></div>`).join(''):'<span class="fr-scan-awaiting">Waiting for the first records…</span>'}</div>`}<a class="fr-scan-open" href="${card.href}" ${ready?'':'aria-disabled="true" tabindex="-1"'}>Open ${card.name} <span aria-hidden="true">→</span></a></article>`;
  }
  function animateScanCounts(){
    const token=++scanAnimation,reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    view.querySelectorAll('[data-scan-count]').forEach(node=>{
      const from=Number(node.dataset.from),to=Number(node.dataset.to);
      if(reduced||from===to){node.textContent=to.toLocaleString('en-US');return}
      const start=performance.now();
      const tick=now=>{if(token!==scanAnimation||!node.isConnected)return;const t=Math.min(1,(now-start)/1100),ease=1-(1-t)*(1-t)*(1-t);node.textContent=Math.round(from+(to-from)*ease).toLocaleString('en-US');if(t<1)requestAnimationFrame(tick)};
      requestAnimationFrame(tick);
    });
  }
  const sourceTotals={demandbase:6214,linkedin:1845,google:2480,meta:1390};
  const connectedSourceIds=()=>{const ids=adPlatforms.map(p=>p.id).filter(id=>id==='demandbase'?demandbaseAuthorized:(selectedAdPlatforms.has(id)||extras[id]));return ids.length?ids:['demandbase']};
  const connectedSourceNames=()=>connectedSourceIds().map(id=>adPlatforms.find(p=>p.id===id)?.name).filter(Boolean);
  const connectedSourcesEcho=()=>{const names=connectedSourceNames();const logos=connectedSourceIds().map(id=>{const p=adPlatforms.find(p=>p.id===id);return sourceLogo(p.name,p.asset)}).join('');return `${logos}${names.length>1?'Platforms connected':`${names[0]} connected`}`};
  function scanSourceRow(id,ready){
    const platform=adPlatforms.find(p=>p.id===id);if(!platform)return'';
    const total=sourceTotals[id]||0;
    return `<div class="fr-scan-source"><img src="assets/${platform.asset}" alt=""><span class="fr-scan-source-name"><b>${platform.name}</b><small>${ready?'Synced just now':'Syncing'} · <strong class="fr-scan-record-total">${ready?total.toLocaleString('en-US'):'0'}</strong> records</small></span><div class="fr-scan-source-track" role="progressbar" aria-label="${platform.name} first read progress" aria-valuenow="${Math.round(progress/7*100)}" aria-valuemin="0" aria-valuemax="100"><i style="--from:${Math.round(Math.max(0,progress-1)/7*100)}%;--to:${Math.round(progress/7*100)}%"></i></div></div>`;
  }
  function renderBuilding(){
    const ready=progress>=7;
    nav(ready);
    view.innerHTML=`<section class="fr-scan"><div class="fr-scan-intro"><span class="fr-kicker">${ready?'Acme Co · first read complete':'Setting up Acme Co'}</span><h1 class="fr-title">${ready?'Your apps are ready. Three things need you.':'Mojo is reading what Acme already runs.'}</h1><div class="fr-scan-status" role="status" aria-live="polite">${ready?'<span class="fr-scan-check" aria-hidden="true">✓</span>':'<span class="fr-scan-pulse" aria-hidden="true"></span>'}${ready?'First read complete':scanStatus[Math.min(progress,scanStatus.length-1)]}</div></div><div class="fr-scan-sources">${connectedSourceIds().map(id=>scanSourceRow(id,ready)).join('')}</div><div class="fr-scan-grid">${cards.map(scanCard).join('')}</div>${ready?`<div class="fr-scan-next"><div><strong>Start with Campaigns</strong><p>Review the tracking break, underpacing flights and the follow-up idea.</p></div><a id="fr-see-spotted" class="fr-button" href="HomeSystem.html#feed-insights">See what Mojo spotted →</a></div>`:''}</section>`;
    animateScanCounts();
  }
  function renderInlineDashboard(){renderBuilding()}
  function renderConversation(){
    const workspace=document.getElementById('fr-workspace'),pane=document.getElementById('fr-conversation');
    const previousBody=pane.querySelector('.fr-conversation-body');
    const previousScrollTop=previousBody?.scrollTop||0;
    const wasNearBottom=!previousBody||previousBody.scrollHeight-previousBody.scrollTop-previousBody.clientHeight<100;
    const visible=!['welcome','prospect'].includes(stage)&&!chatHidden;
    workspace.classList.toggle('has-conversation',visible);
    document.querySelector('.fr-app').classList.toggle('has-conversation',visible);
    const chatToggle=document.getElementById('fr-chat-toggle');
    chatToggle.setAttribute('aria-expanded',String(visible));
    document.getElementById('fr-nav-chat-link')?.setAttribute('aria-expanded',String(visible));
    document.getElementById('fr-canvas-toggle').setAttribute('aria-pressed',String(!visible));
    if(!visible){pane.innerHTML='';return;}
    const steps=demandbaseAuthorized||stage==='building'||stage==='ready'||stage==='dashboard'?[['Connect ad platforms',true],['Read your accounts and buyers',true],['Find competitors',discoveryStep>=4],['Prepare your apps',['ready','dashboard'].includes(stage)]]:[['Read your company',discoveryStep>=1],['Confirm your buyers',buyerConfirmed],['Find your competitors',discoveryStep>=4],['Connect ad platforms',stage==='channels'||localStorage.getItem(storageKey)==='true'],['Optimize your next campaign',localStorage.getItem(storageKey)==='true']];
    const firstCompanyPaint=stage==='company'&&lastConversationStage!=='company';
    const timeline=`<div class="fr-chat-timeline">${steps.map(([label,done],index)=>`<div class="${done?'done':''}${firstCompanyPaint?' fr-chat-roadmap-enter':''}" style="--entry-index:${index}"><i>${done?'✓':''}</i><span>${label}</span></div>`).join('')}</div>`;
    let story='';
    if(stage==='channels')story=`<div class="fr-chat-user">${adPlatforms.filter(platform=>selectedAdPlatforms.has(platform.id)).map(platform=>sourceLogo(platform.name,platform.asset)).join('')}Ad platforms connected</div><p>I’ve added your selected channels beneath the company read. Connect Demandbase whenever you want to match delivery to target accounts, audiences and intent.</p>${timeline}<div class="fr-chat-buttons"><button type="button" id="fr-chat-connect">Connect another platform</button></div>`;
    if(stage==='company'){
      const receiptRows=[['Reading '+domain,1],['Found your customer story',2],['Mapped likely buyers',3],['Checked public ads',4]];
      const visibleThrough=buyerConfirmed?Math.min(4,discoveryStep+1):Math.min(3,discoveryStep+1);
      const visibleReceipts=receiptRows.filter(([,step])=>step<=visibleThrough);
      const receiptMarkup=`<div class="fr-chat-receipts fr-discovery-receipts">${visibleReceipts.map(([label,step],index)=>`<div class="${discoveryStep>=step?'done':'pending'}${index>lastVisibleDiscoveryReceipt?' fr-chat-line-enter':''}${step===discoveryStep&&discoveryStep>lastDiscoveryPaint?' fr-chat-check-pop':''}"><i>${discoveryStep>=step?'✓':'○'}</i><span>${escape(label)}</span></div>`).join('')}</div>`;
      lastVisibleDiscoveryReceipt=Math.max(lastVisibleDiscoveryReceipt,visibleReceipts.length-1);
      const initial=`<div class="fr-chat-user">${escape(domain)}</div><p>I’ll read your site and show you who I think buys.</p>${timeline}${receiptMarkup}`;
      if(discoveryStep<3)story=`${initial}<p class="fr-chat-status"><span class="fr-chat-pulse"></span>${['Opening your site…','Reading your company story…','Checking market signals…'][discoveryStep]}<span class="fr-chat-cursor"></span></p>`;
      else if(!buyerConfirmed)story=`${initial}<p class="${lastDiscoveryPaint<3?'fr-chat-question-enter':''}">Here’s my read: RevOps, marketing ops and sales ops leaders at B2B software companies with 200 to 2,000 employees. <b>Does that buyer definition look right?</b></p><div class="fr-chat-buttons ${lastDiscoveryPaint<3?'fr-chat-question-enter':''}"><button type="button" id="fr-confirm-buyers">Looks right</button><button type="button" id="fr-adjust-buyers">Adjust</button></div>${adjustOpen?'<form class="fr-chat-adjust" id="fr-adjust-form"><label>What should I change?<textarea name="correction" required placeholder="For example, focus on enterprise RevOps…"></textarea></label><button type="submit">Save correction</button></form>':''}`;
      else if(discoveryStep<5)story=`${initial}<div class="fr-chat-user">${buyerCorrection?escape(buyerCorrection):'Looks right'}</div><p>I’m checking which competitors target these buyers.</p><p class="fr-chat-status"><span class="fr-chat-pulse"></span>Checking public ads…<span class="fr-chat-cursor"></span></p>`;
      else{
        const adConnected=localStorage.getItem(storageKey)==='true';
        const choiceReceipts=(extras.ga4||extras.tag)?`<div class="fr-chat-receipts">${extras.ga4?'<div class="done">✓ Google Analytics connected</div>':''}${extras.tag?'<div class="done">✓ Tracking snippet installing — first signals in ~24h</div>':''}</div>`:'';
        const choiceIcons={ads:'<path d="M4 9h4l10-5v16L8 15H4a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2Z"/><path d="m7 15 2 6h4l-2-5"/><path d="M21 9v6"/>',ga4:'<path d="M3 20h18M5 16v-5m5 5V6m5 10v-8m5 8V4"/>',tag:'<path d="m12 2 2.3 7.7L22 12l-7.7 2.3L12 22l-2.3-7.7L2 12l7.7-2.3z"/>'};
        const choiceIcon=key=>`<svg class="fr-choice-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${choiceIcons[key]}</svg>`;
        const choices=[
          !adConnected?['fr-chat-connect',null,'ads','Show me where my spend lands','Connect your ad platforms']:null,
          !extras.ga4?[null,'ga4','ga4','Fast-track with my GA4 history','Skip the wait, use what’s already there']:null,
          !extras.tag?[null,'tag','tag','Add Mojo’s tracking snippet','One quick install, no GA4 needed — signals in ~24h']:null
        ].filter(Boolean);
        const choiceButtons=choices.length?`<div class="fr-choice-group"><p class="fr-choice-label">Pick how to start</p><div class="fr-choice-list">${choices.map(([id,connectId,icon,title,sub])=>`<button type="button" class="fr-choice"${id?` id="${id}"`:''}${connectId?` data-fr-inline-connect="${connectId}"`:''}>${choiceIcon(icon)}<span><b>${title}</b><small>${sub}</small></span></button>`).join('')}</div></div>`:'';
        story=`${initial}<div class="fr-chat-user">${buyerCorrection?escape(buyerCorrection):'Looks right'}</div><p>Let’s find out where your spend is reaching these buyers—and where it’s missing them entirely.</p>${choiceReceipts}${adConnected?'<a class="fr-chat-action" href="Home.html?board=notifications#feed">Return to Home →</a>':choiceButtons}`;
      }
    }
    if(stage==='company')lastDiscoveryPaint=discoveryStep;
    lastConversationStage=stage;
    if(stage==='building'){
      const receipts=[
        [`Connected ${connectedSourceNames().length>1?'your ad platforms':connectedSourceNames()[0]}`,''],
        ['Read 3 target account lists · 6,400 accounts','Reading target account lists…'],
        ['Read 3 audiences and their refresh rules','Checking audience refresh rules…'],
        ['Read 42 live campaigns','Reading your campaigns…'],
        ['Matched spend to account reach','Matching spend to account reach…'],
        ['Turned intent topics into buyer questions','Turning intent into buyer questions…'],
        ['Checked AI answers for review','Checking AI answers…']
      ];
      const visible=receipts.slice(0,Math.min(receipts.length,progress+2));
      const receiptMarkup=visible.map(([done,working],i)=>i<=progress
        ?`<div class="done${i===progress?' fr-chat-check-pop':''}"><i aria-hidden="true">✓</i><span>${done}</span></div>`
        :`<div class="working fr-chat-line-enter" role="status"><i aria-hidden="true"></i><span>${working}</span></div>`).join('');
      story=`<div class="fr-chat-user">${connectedSourcesEcho()}</div><p>That’s plenty to start. I’m sorting what you already run into Campaigns, Audiences and AEO. Each app will appear as its first pass is ready.</p>${timeline}<div class="fr-chat-receipts fr-build-receipts">${receiptMarkup}</div>${progress>=3?`<p class="fr-chat-status">${progress>=5?'Audiences is ready. I’m checking the AI questions now.':'Campaigns is ready. I’m mapping your audiences next.'}</p>`:''}`;
    }
    if(stage==='ready')story=`<div class="fr-chat-user">${connectedSourcesEcho()}</div><p><b>Campaigns, Audiences and AEO are ready.</b> I found 42 live campaigns, $180K in Q4 flights and 3 audiences.</p>${timeline}<div class="fr-chat-receipts"><div class="done">✓ &nbsp; Campaigns: 42 live campaigns</div><div class="done">✓ &nbsp; Audiences: 3 audiences and buying groups</div><div class="done">✓ &nbsp; AEO: buyer questions from intent</div></div>`;
    if(stage==='dashboard')story=`<div class="fr-chat-user">${connectedSourcesEcho()}</div><p>Campaigns, Audiences and AEO are ready. I found 42 live campaigns, $180K in Q4 flights and 3 audiences.</p>${timeline}<div class="fr-chat-buttons"><a href="Home.html">Open your workspace →</a></div>`;
    pane.innerHTML=`<div class="fr-conversation-head"><b>Chats</b><button type="button" id="fr-chat-close" aria-label="Close chat">×</button></div><div class="fr-conversation-body">${story}${chatMessages.map(message=>`<div class="${message.role==='user'?'fr-chat-user':'fr-chat-reply'}">${escape(message.text)}</div>`).join('')}</div><form class="fr-conversation-composer" id="fr-chat-form"><textarea name="message" rows="3" aria-label="Ask Mojo anything" placeholder="Ask Mojo anything…"></textarea><div class="fr-composer-bottom"><div class="fr-composer-modes"><span>Balanced <svg class="fr-composer-caret" viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4"/></svg></span><span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 20 5v6c0 5.3-3 8.8-8 11-5-2.2-8-5.7-8-11V5z"/></svg> Guarded <svg class="fr-composer-caret" viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4"/></svg></span><span class="fr-composer-plus" aria-hidden="true">+</span></div><div class="fr-composer-actions"><span class="fr-composer-mic" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21m-4 0h8"/></svg></span><button type="submit" aria-label="Send message">↑</button></div></div></form>`;
    const body=pane.querySelector('.fr-conversation-body');
    body.scrollTop=Math.min(previousScrollTop,body.scrollHeight);
    if(wasNearBottom)requestAnimationFrame(()=>body.scrollTo({top:body.scrollHeight,behavior:'smooth'}));
  }
  function render(){
    document.querySelector('.fr-app').classList.toggle('is-pre-feed',stage==='prospect');
    if(stage==='prospect'){nav(false);renderProspectWelcome();}
    if(stage==='channels')renderChannels();
    if(stage==='preview'){nav(false);renderPreview();}
    if(stage==='building'||stage==='ready')renderBuilding();
    if(stage==='dashboard')renderInlineDashboard();
    if(stage==='company'){nav(localStorage.getItem(storageKey)==='true');renderCompany();}
    renderConversation();
  }
  const scanWait=ms=>new Promise(resolve=>setTimeout(resolve,matchMedia('(prefers-reduced-motion: reduce)').matches?0:ms));
  function scanCount(node,target,duration,token){
    if(!node)return;
    if(matchMedia('(prefers-reduced-motion: reduce)').matches){node.textContent=target.toLocaleString('en-US');return}
    const started=performance.now();
    const tick=now=>{if(token!==scanRun||!node.isConnected)return;const fraction=Math.min(1,(now-started)/duration),eased=1-Math.pow(1-fraction,3);node.textContent=Math.round(target*eased).toLocaleString('en-US');if(fraction<1)requestAnimationFrame(tick)};
    requestAnimationFrame(tick);
  }
  function scanFill(node,duration,token,onFrame){
    if(!node)return;
    if(matchMedia('(prefers-reduced-motion: reduce)').matches){node.style.setProperty('width','100%','important');onFrame?.(100);return}
    node.style.animation='none';
    const started=performance.now();
    const tick=now=>{if(token!==scanRun||!node.isConnected)return;const fraction=Math.min(1,(now-started)/duration),eased=1-Math.pow(1-fraction,2);node.style.setProperty('width',Math.round(eased*100)+'%','important');onFrame?.(Math.round(eased*100));if(fraction<1)requestAnimationFrame(tick)};
    requestAnimationFrame(tick);
  }
  function scanLand(card,record){
    const stream=card.querySelector('.fr-scan-stream');if(!stream)return;
    stream.querySelector('.fr-scan-awaiting')?.remove();
    const previous=[...stream.querySelectorAll('.fr-scan-record')];
    const positions=new Map(previous.map(row=>[row,row.getBoundingClientRect().top]));
    previous.forEach(row=>row.classList.remove('new'));
    const row=document.createElement('div');row.className='fr-scan-record new';
    row.innerHTML=`<b>${escape(record[0])}</b><small>${escape(record[1])}</small>`;
    stream.prepend(row);
    if(!matchMedia('(prefers-reduced-motion: reduce)').matches)previous.forEach(old=>{const oldTop=positions.get(old),newTop=old.getBoundingClientRect().top;if(oldTop!==undefined&&oldTop!==newTop)old.animate([{transform:`translateY(${oldTop-newTop}px)`},{transform:'translateY(0)'}],{duration:570,easing:'cubic-bezier(.2,.7,.25,1)'})});
    [...stream.querySelectorAll('.fr-scan-record')].slice(3).forEach(old=>old.remove());
  }
  async function scanApp(id,start,duration,token){
    await scanWait(start);if(token!==scanRun)return;
    const card=view.querySelector(`.fr-scan-card[data-scan-app="${id}"]`);if(!card)return;
    scanCount(card.querySelector('[data-scan-count]'),id==='campaigns'?42:id==='audiences'?6400:24,duration,token);
    scanFill(card.querySelector('.fr-scan-card-track i'),duration,token);
    const records=scanRecords[id],gap=duration/(records.length+.5);
    for(const record of records){if(token!==scanRun)return;scanLand(card,record);await scanWait(gap)}
    await scanWait(Math.max(0,duration-gap*records.length)+450);if(token!==scanRun)return;
    const stream=card.querySelector('.fr-scan-stream');
    if(stream&&!matchMedia('(prefers-reduced-motion: reduce)').matches)await stream.animate([{opacity:1},{opacity:0}],{duration:220,fill:'forwards'}).finished.catch(()=>{});
    if(token!==scanRun)return;
    stream.getAnimations().forEach(animation=>animation.cancel());
    stream.innerHTML=scanFindings[id].map(([number,label,kind])=>`<div class="fr-scan-finding"><span class="fr-scan-finding-text"><b>${escape(number)}</b><span>${escape(label)}</span></span>${kind?`<em>${escape(kind)}</em>`:''}</div>`).join('');
    stream.classList.add('fr-scan-findings');stream.classList.remove('fr-scan-stream');stream.style.opacity='';
    card.classList.add('is-ready');card.querySelector('.fr-scan-state').textContent=id==='campaigns'?'3 open':'Ready';card.setAttribute('aria-label',`${cards.find(item=>item.id===id).name} ready`);
    const open=card.querySelector('.fr-scan-open');open.removeAttribute('aria-disabled');open.removeAttribute('tabindex');
    const navLink=document.querySelector(`[data-app-link="${id}"]`);navLink?.classList.add('ready');navLink?.setAttribute('aria-disabled','false');navLink?.setAttribute('tabindex','0');
  }
  function complete(token){
    if(token!==scanRun)return;
    progress=7;stage='dashboard';
    localStorage.setItem(storageKey,'true');localStorage.setItem('mojo-nav-expanded-v1','true');nav(true);
    const root=view.querySelector('.fr-scan');if(!root)return;
    root.querySelector('.fr-kicker').textContent='Acme Co · first read complete';
    root.querySelector('h1').textContent='Your apps are ready. Three things need you.';
    root.querySelector('.fr-lead')?.remove();
    root.querySelector('.fr-scan-status').innerHTML='<span class="fr-scan-check" aria-hidden="true">✓</span>First read complete';
    root.querySelector('.fr-scan-card[data-scan-app="campaigns"]')?.classList.add('is-focus');
    const readyIds=connectedSourceIds();
    root.querySelectorAll('.fr-scan-source').forEach((row,i)=>{const id=readyIds[i];if(!id)return;const small=row.querySelector('.fr-scan-source-name small');if(small)small.innerHTML=`Synced just now · <strong class="fr-scan-record-total">${(sourceTotals[id]||0).toLocaleString('en-US')}</strong> records`});
    root.insertAdjacentHTML('beforeend','<div class="fr-scan-next"><div><strong>Start with Campaigns</strong><p>Review the tracking break, underpacing flights and the follow-up idea.</p></div><a id="fr-see-spotted" class="fr-button" href="HomeSystem.html#feed-insights">See what Mojo spotted →</a></div>');
  }
  async function runFirstRead(token){
    const sources=connectedSourceIds();
    view.querySelectorAll('.fr-scan-source').forEach((row,i)=>{
      const id=sources[i];if(!id)return;
      const multiplier=(sourceTotals[id]||0)/100;
      scanFill(row.querySelector('.fr-scan-source-track i'),14500,token,value=>{row.querySelector('.fr-scan-source-track')?.setAttribute('aria-valuenow',String(value));const total=row.querySelector('.fr-scan-record-total');if(total)total.textContent=Math.round(value*multiplier).toLocaleString('en-US')});
    });
    (async()=>{for(const label of scanStatus.slice(1)){await scanWait(2400);if(token!==scanRun||stage!=='building')return;const status=view.querySelector('.fr-scan-status');if(status){status.innerHTML=`<span class="fr-scan-pulse" aria-hidden="true"></span>${label}`;status.animate([{opacity:.35,transform:'translateY(4px)'},{opacity:1,transform:'none'}],{duration:360})}}})();
    await Promise.all([scanApp('audiences',300,8500,token),scanApp('aeo',1800,9500,token),scanApp('campaigns',3200,10500,token)]);
    if(token!==scanRun)return;await scanWait(850);complete(token);
  }
  function begin(){document.querySelector('.fr-modal')?.remove();clearInterval(timer);const token=++scanRun;stage='building';chatHidden=true;progress=0;render();view.querySelector('.fr-scan')?.classList.add('fr-scan-live-run');runFirstRead(token)}
  document.addEventListener('submit',event=>{
    if(event.target.id==='fr-domain-form'){event.preventDefault();domain=document.getElementById('fr-domain').value.trim().replace(/^https?:\/\//,'').replace(/\/$/,'')||'acme.com';startDiscovery();return;}
    if(event.target.id==='fr-adjust-form'){event.preventDefault();buyerCorrection=String(new FormData(event.target).get('correction')||'').trim();buyerConfirmed=true;adjustOpen=false;scrollToUpdatedRead=true;localStorage.setItem('mojo-board-buyer-confirmed-v1','true');localStorage.setItem('mojo-board-buyer-correction-v1',buyerCorrection);render();resumeDiscovery();return;}
    if(event.target.id==='fr-chat-form'){event.preventDefault();const message=String(new FormData(event.target).get('message')||'').trim();if(!message)return;chatMessages.push({role:'user',text:message});chatMessages.push({role:'mojo',text:/source|data|where/i.test(message)?'The company read uses illustrative public and market signals. Demandbase adds your private account lists, intent, audiences and ads; GA4 and CRM add measured outcomes.':/buyer|audience|icp/i.test(message)?'The buyer group is a draft. You can confirm the roles here, then use Audience builder to review account matches and exclusions.':'I can keep working from this company context. Review the evidence on the canvas, and I’ll ask before any connection or launch.'});render();return;}
  });
  let unlockTipLink,unlockTipTimer,unlockTipHideTimer;
  const inUnlockTip=node=>!!node?.closest?.('.fr-nav-unlock-tip');
  function hideUnlockTip(){clearTimeout(unlockTipTimer);clearTimeout(unlockTipHideTimer);unlockTipLink=null;document.querySelector('.fr-nav-unlock-tip')?.remove();}
  function scheduleHideUnlockTip(){clearTimeout(unlockTipHideTimer);unlockTipHideTimer=setTimeout(hideUnlockTip,200);}
  function showUnlockTip(link,id){
    if(unlockTipLink===link){clearTimeout(unlockTipHideTimer);return;}
    hideUnlockTip();
    unlockTipLink=link;
    const card=cards.find(item=>item.id===id);
    if(!card)return;
    unlockTipTimer=setTimeout(()=>{
      const rect=link.getBoundingClientRect();
      const tip=document.createElement('div');
      tip.className='fr-nav-unlock-tip';
      tip.style.setProperty('--tip-left',Math.round(rect.right+10)+'px');
      tip.style.setProperty('--tip-top',Math.round(rect.top)+'px');
      const started=!['welcome','prospect'].includes(stage);
      tip.innerHTML=`<b>Connect a platform and Mojo will show you:</b><ul>${card.items.map((text,index)=>`<li style="--i:${index}">${escape(text)}</li>`).join('')}</ul><button type="button" class="fr-nav-unlock-cta">${started?'Watch it build on the canvas':'Start by telling Mojo your site'} <span aria-hidden="true">→</span></button>`;
      tip.addEventListener('pointerover',()=>clearTimeout(unlockTipHideTimer));
      tip.addEventListener('pointerout',event=>{if(!inUnlockTip(event.relatedTarget)&&event.relatedTarget!==link)scheduleHideUnlockTip();});
      tip.querySelector('.fr-nav-unlock-cta').addEventListener('click',event=>{
        event.stopPropagation();
        hideUnlockTip();
        if(started)view.closest('.fr-scroll')?.scrollTo({top:0,behavior:'smooth'});
        else document.getElementById('fr-domain')?.focus();
      });
      document.body.append(tip);
      requestAnimationFrame(()=>tip.classList.add('is-visible'));
    },400);
  }
  document.addEventListener('pointerover',event=>{
    const lockedAppLink=event.target.closest('.fr-nav.app-link:not(.ready)');
    if(lockedAppLink)showUnlockTip(lockedAppLink,lockedAppLink.dataset.appLink);
  });
  document.addEventListener('pointerout',event=>{
    const lockedAppLink=event.target.closest('.fr-nav.app-link:not(.ready)');
    if(lockedAppLink&&!lockedAppLink.contains(event.relatedTarget)&&!inUnlockTip(event.relatedTarget))scheduleHideUnlockTip();
  });
  document.addEventListener('click',event=>{
    const lockedAppLink=event.target.closest('.fr-nav.app-link:not(.ready)');
    if(lockedAppLink){event.preventDefault();hideUnlockTip();showAdPlatformModal();return;}
    if(event.target.closest('#fr-see-spotted')){try{sessionStorage.setItem('mojo-feed-entry-loading-v1','1')}catch{}return;}
    if(event.target.closest('#fr-scan-replay')){begin();return;}
    if(event.target.closest('#fr-feed-tab')){if(stage==='dashboard'||stage==='ready'){location.href='Home.html?board=notifications#feed';}else{view.closest('.fr-scroll')?.scrollTo({top:0,behavior:'smooth'});}return;}
    if(event.target.closest('#fr-chat-toggle,#fr-chat-close,#fr-nav-chat-link')&&!['welcome','prospect'].includes(stage)){chatHidden=!chatHidden;renderConversation();}
    if(event.target.closest('#fr-canvas-toggle')){chatHidden=true;renderConversation();view.closest('.fr-scroll')?.focus({preventScroll:true});}
    if(event.target.closest('#fr-nav-toggle')){const collapsed=document.querySelector('.fr-app').classList.toggle('nav-collapsed');event.target.closest('#fr-nav-toggle').setAttribute('aria-pressed',String(collapsed));event.target.closest('#fr-nav-toggle').setAttribute('aria-label',collapsed?'Expand navigation':'Collapse navigation');try{localStorage.setItem('mojo-nav-expanded-v1',String(!collapsed));}catch{}}
    if(event.target.closest('#fr-adjust'))setStage('prospect');
    if(event.target.closest('#fr-prospect-start'))setStage('prospect');
    if(event.target.closest('#fr-company-detail'))setStage('company');
    if(event.target.closest('#fr-company-back'))setStage(localStorage.getItem(storageKey)==='true'?'dashboard':'preview');
    if(event.target.closest('#fr-company-connect,#fr-company-connect-link')){event.preventDefault();setStage('preview');}
    const extraButton=event.target.closest('[data-extra]');if(extraButton){extras[extraButton.dataset.extra]=true;localStorage.setItem('mojo-board-extra-connections-v1',JSON.stringify(extras));document.querySelector('.fr-more-modal')?.remove();render();}
    const inlineButton=event.target.closest('[data-fr-inline-connect]');if(inlineButton){const id=inlineButton.dataset.frInlineConnect;inlineButton.disabled=true;inlineButton.textContent='Connecting…';setTimeout(()=>{extras[id]=true;localStorage.setItem('mojo-board-extra-connections-v1',JSON.stringify(extras));render();},850);}
    if(event.target.closest('#fr-more-connect,#fr-more-plus')){
      const modal=document.createElement('div');modal.className='fr-modal fr-more-modal';modal.innerHTML=`<div class="fr-dialog fr-more-dialog" role="dialog" aria-modal="true" aria-labelledby="fr-more-title"><button type="button" class="fr-ad-dialog-close" id="fr-more-close" aria-label="Close">×</button><span class="fr-kicker">Make Mojo sharper</span><h2 id="fr-more-title">Connect more of your world.</h2><p>Each source adds context to the apps you just built.</p><div class="fr-more-options">${moreSources.map(([id,name,asset,description])=>`<button type="button" class="fr-more-option" data-extra="${id}" ${extras[id]?'disabled':''}>${sourceLogo(name,asset)}<span><b>${name}</b><small>${extras[id]?'Connected':description}</small></span><em>${extras[id]?'✓':'+'}</em></button>`).join('')}</div><p class="fr-small"></p></div>`;document.body.append(modal);modal.querySelector('#fr-more-close').focus();
    }
    if(event.target.closest('#fr-more-close'))document.querySelector('.fr-more-modal')?.remove();
    if(event.target.closest('#fr-confirm-buyers')){buyerConfirmed=true;scrollToUpdatedRead=true;localStorage.setItem('mojo-board-buyer-confirmed-v1','true');render();resumeDiscovery();}
    if(event.target.closest('#fr-adjust-buyers')){adjustOpen=true;render();document.querySelector('#fr-adjust-form textarea')?.focus();}
    if(event.target.closest('#fr-connect,#fr-chat-connect'))showAdPlatformModal();
    const quickConnect=event.target.closest('[data-fr-quick-connect]');if(quickConnect)showAdPlatformModal(quickConnect.dataset.frQuickConnect);
    const platformButton=event.target.closest('[data-fr-ad-platform]');if(platformButton){const id=platformButton.dataset.frAdPlatform;selectedAdPlatforms.has(id)?selectedAdPlatforms.delete(id):selectedAdPlatforms.add(id);updateAdModal();}
    if(event.target.closest('#fr-authorize')&&selectedAdPlatforms.size){const chosen=new Set(selectedAdPlatforms);showPermissionModal(chosen,()=>{extras.google=chosen.has('google');extras.linkedin=chosen.has('linkedin');extras.meta=chosen.has('meta');localStorage.setItem('mojo-board-extra-connections-v1',JSON.stringify(extras));demandbaseAuthorized=chosen.has('demandbase');discoveryStep=5;justConnected=true;if(demandbaseAuthorized)begin();else setStage('channels');});}
    if(event.target.closest('#fr-cancel'))document.querySelector('.fr-modal')?.remove();
    if(event.target.closest('#fr-reset,#fr-logo-reset')){scanRun++;clearInterval(timer);clearInterval(discoveryTimer);clearTimeout(dashboardTimer);revealObserver?.disconnect();clearPrototypeState();extras={google:false,linkedin:false,meta:false,gong:false,crm:false,ga4:false,tag:false};buyerConfirmed=false;buyerCorrection='';demandbaseAuthorized=false;chatMessages=[];domain='acme.com';discoveryStep=0;lastConversationStage='';lastVisibleDiscoveryReceipt=-1;lastDiscoveryPaint=-1;revealedSections=new Set();selectedAdPlatforms=new Set();chatHidden=false;adjustOpen=false;history.replaceState(null,'','FirstRun.html');progress=0;setStage('prospect');}
    if(event.target.closest('#fr-share')){navigator.clipboard?.writeText(location.href).then(()=>{event.target.closest('#fr-share').textContent='Link copied';});}
  });
  document.addEventListener('keydown',event=>{if(event.key==='Escape')document.querySelector('.fr-modal')?.remove();});
  document.querySelectorAll('[data-icon]').forEach(node=>{node.innerHTML=MojoApps.icon(node.dataset.icon);});
  const shellIcons={home:'<path d="m3 10 9-7 9 7v10H3z"/><path d="M9 20v-7h6v7"/>',sidebar:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/>',canvases:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',chat:'<path d="M21 11.5a8.5 8.5 0 0 1-12.3 7.6L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5Z"/>',routines:'<path d="M4 8a8 8 0 0 1 13.6-3.6L20 7"/><path d="M20 3v4h-4"/><path d="M20 16a8 8 0 0 1-13.6 3.6L4 17"/><path d="M4 21v-4h4"/><path d="M12 8v4l2.5 1.5"/>',more:'<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>',settings:'<path d="M9.8 2.9h4.4l.5 2.1a7.5 7.5 0 0 1 1.7 1l2-.8 2.2 3.8-1.6 1.4a7.6 7.6 0 0 1 0 2l1.6 1.4-2.2 3.8-2-.8a7.5 7.5 0 0 1-1.7 1l-.5 2.2H9.8l-.5-2.2a7.5 7.5 0 0 1-1.7 1l-2 .8-2.2-3.8L5 12.4a7.6 7.6 0 0 1 0-2L3.4 9l2.2-3.8 2 .8a7.5 7.5 0 0 1 1.7-1l.5-2.1Z"/><circle cx="12" cy="11.4" r="2.7"/>'};
  document.querySelectorAll('[data-shell-icon]').forEach(node=>{node.innerHTML=`<svg viewBox="0 0 24 24" aria-hidden="true">${shellIcons[node.dataset.shellIcon]||''}</svg>`;});
  if(!revisitingCompany){clearPrototypeState();extras={google:false,linkedin:false,meta:false,gong:false,crm:false,ga4:false,tag:false};buyerConfirmed=false;buyerCorrection='';}
  if(revisitingCompany&&localStorage.getItem(storageKey)==='true')progress=7;
  render();
})();
