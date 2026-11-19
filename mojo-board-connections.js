/* Board-demo connection gallery. All connections here are browser-local simulations. */
(() => {
  const boardKey='mojo-board-demandbase-connected-v1';
  const boardMode=localStorage.getItem(boardKey)==='true';
  const extrasKey='mojo-board-extra-connections-v1';
  const sources=[
    {id:'demandbase',name:'Demandbase',logo:'demandbase.png',category:'Account intelligence',short:'The first working layer',why:'Target lists, intent, buying groups, audiences and Demandbase Ads campaigns give Mojo a starting account view.',apps:['Campaigns','Audiences','AEO']},
    {id:'google',name:'Google Ads',logo:'google-ads.svg',category:'Ad channels',short:'See search beside ABM',why:'Compare search spend, queries and delivery with Demandbase campaigns before shifting budget.',apps:['Campaigns'],recommended:true},
    {id:'linkedin',name:'LinkedIn Ads',logo:'linkedin.png',category:'Ad channels',short:'See the buying group',why:'Add paid social reach and creative by role so Mojo can spot gaps across the buying committee.',apps:['Campaigns','Audiences'],recommended:true},
    {id:'meta',name:'Meta Ads',logo:'meta.svg',category:'Ad channels',short:'See paid social and retargeting',why:'Bring paid social delivery alongside your account campaigns to inspect reach and retargeting.',apps:['Campaigns']},
    {id:'gong',name:'Gong',logo:'gong.svg',category:'Revenue signals',short:'Hear what buyers actually say',why:'Call themes, objections and competitor mentions can sharpen campaign ideas and the questions AEO tracks.',apps:['Campaigns','AEO'],recommended:true},
    {id:'crm',name:'Salesforce',logo:'salesforce.png',category:'Revenue signals',short:'Connect activity to outcomes',why:'Opportunity stages, wins and customer flags help validate impact and keep customers out of acquisition audiences.',apps:['Campaigns','Audiences']},
    {id:'ga4',name:'Google Analytics 4',logo:'ga4-clean.svg',category:'Measurement',short:'Measure what happens on site',why:'Landing pages, key events and AI referrals make campaign and AEO recommendations more grounded.',apps:['Campaigns','AEO']},
    {id:'atlassian',name:'Atlassian',logo:'atlassian-demo.svg',category:'Team workflow',short:'Carry decisions into delivery',why:'Link campaign and content recommendations to project owners, tickets and launch dependencies.',apps:['Campaigns','AEO']},
    {id:'asana',name:'Asana',logo:'asana-clean.svg',category:'Team workflow',short:'Keep the plan moving',why:'Turn approved campaign and content work into tasks with owners, dates and review checkpoints.',apps:['Campaigns','AEO']}
  ];
  const categories=['All','Ad channels','Revenue signals','Measurement','Team workflow'];
  const readExtras=()=>{try{return JSON.parse(localStorage.getItem(extrasKey)||'{}')||{};}catch{return {};}};
  let extras=readExtras();
  let contextDismissed=localStorage.getItem('mojo-board-demandbase-summary-dismissed-v1')==='true';
  const existingSources=new Set(['google','demandbase','linkedin','crm']);
  const connected=source=>(boardMode?source.id==='demandbase':existingSources.has(source.id))||!!extras[source.id];
  const logo=source=>`<img src="assets/${source.logo}" alt="${source.name} logo">`;
  const cards=()=>sources.filter(source=>source.id!=='demandbase');
  const railMarkup=(rail)=>{
    const className=rail.classList.contains('mf-source-icons')?'mf-connect-more':rail.classList.contains('md-connected-logos')?'md-connect-more':rail.classList.contains('mg-connected-logos')?'mg-connect-more':'ms-connect-more';
    return sources.filter(connected).map(source=>`<a href="Connections.html" title="${source.name}" aria-label="${source.name} connection">${logo(source)}</a>`).join('')+`<a href="#" class="${className}" title="Connect more" aria-label="Connect more sources">+</a>`;
  };
  const syncRails=()=>{
    const signature=sources.filter(connected).map(source=>source.id).join(',');
    document.querySelectorAll('.mf-source-icons,.md-connected-logos,.ms-connected-logos,.mg-connected-logos').forEach(rail=>{
      if(rail.dataset.boardSignature===signature)return;
      rail.dataset.boardSignature=signature;
      rail.innerHTML=railMarkup(rail);
    });
  };
  const syncCampaignContext=()=>{document.querySelector('.board-demandbase-context')?.remove();};
  const feedFindings={
    linkedin:{topic:'BUYING GROUP',title:'Ironwood’s finance and security buyers have not seen your ads.',body:'LinkedIn adds reach by role. Two of five buying roles have seen the campaign; finance and security are still missing.',value:'2 / 5',caption:'roles reached',href:'Strategy.html#next-test',action:'Review the audience'},
    google:{topic:'SEARCH',title:'Which search campaigns should you adjust?',body:'6 Google Ads campaigns spent $68K. Compare them with Demandbase before you set the next budget.',value:'$68K',caption:'search spend',href:'Portfolio.html#campaigns',action:'Compare campaigns'},
    meta:{topic:'PAID SOCIAL',title:'Retargeting is now in view beside your account campaigns.',body:'Meta Ads adds four paid social campaigns. Check which target accounts see both ABM and retargeting.',value:'4',caption:'campaigns',href:'Portfolio.html#dashboard-overview',action:'Review delivery'},
    gong:{topic:'BUYER SIGNAL',title:'Should Ironwood’s next campaign address security?',body:'Security came up in four of six calls. Gong added those buyer concerns to the campaign idea.',value:'4 / 6',caption:'calls',href:'Strategy.html#next-test',action:'Review the idea'},
    crm:{topic:'PIPELINE',title:'Campaign activity can now be checked against pipeline.',body:'Salesforce adds opportunity stages and customer exclusions. Review the campaign results with those outcomes in view.',value:'CRM',caption:'connected',href:'Portfolio.html#dashboard-overview',action:'Review results'},
    ga4:{topic:'MEASUREMENT',title:'Landing-page activity is now in the campaign view.',body:'GA4 adds key events and referrals. Check whether the accounts reached by your ads also visit the site.',value:'GA4',caption:'connected',href:'Portfolio.html#dashboard-overview',action:'Review activity'},
    atlassian:{topic:'WORKFLOW',title:'Campaign decisions can now move into delivery.',body:'Atlassian adds project owners and launch dependencies to the work Mojo recommends.',value:'Work',caption:'connected',href:'Work.html',action:'Review the work'},
    asana:{topic:'WORKFLOW',title:'Approved campaign work now has a place to land.',body:'Asana adds task owners, dates and review checkpoints for the next campaign.',value:'Tasks',caption:'connected',href:'Work.html',action:'Review the work'}
  };
  const feedGroup=id=>id==='gong'?'questions':['crm','atlassian','asana'].includes(id)?'decisions':'attention';
  const feedStory=source=>{const finding=feedFindings[source.id];const card=document.createElement('article');card.className='mfc-card board-source-story';card.dataset.boardSourceStory=source.id;card.dataset.feedArea=source.id==='gong'?'Plan':source.id==='crm'?'Report':'Optimize';card.dataset.mojoOwner='Pam Beesly';const areaHref=card.dataset.feedArea==='Plan'?'Strategy.html':card.dataset.feedArea==='Report'?'Portfolio.html#campaigns':'CampaignLifecycle.html?view=optimize';card.innerHTML=`<div><div class="mf-story-meta"><a class="mfc-area-tag" href="${areaHref}">${card.dataset.feedArea}</a><span class="mf-kind mf-kind-signal">${finding.topic}</span><span class="board-source-name">${logo(source)}${source.name}</span></div><h2>${finding.title}</h2><p>${finding.body}</p><div class="board-source-evidence"><strong>${finding.value}</strong><span>${finding.caption}</span></div></div><div class="mfc-actions"><a class="mfc-primary" href="${finding.href}">${finding.action} →</a><button type="button" class="mojo-see-why" data-board-why="${source.id}">See why</button><span class="mfc-utility-group" role="group" aria-label="Card actions"><button type="button" data-board-chat="${source.id}" aria-label="Discuss"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M20 11.5a8 8 0 0 1-8 8 8.4 8.4 0 0 1-3.6-.8L4 20l1.3-4.4A8 8 0 1 1 20 11.5Z"/></svg></button></span></div>`;return card;};
  const syncFeedSignals=()=>{
    const stream=document.querySelector('#mf-insights .mf-stream');
    if(!stream)return;
    const fresh=sources.filter(source=>source.id!=='demandbase'&&!!extras[source.id]);
    stream.querySelector('.board-feed-signals')?.remove();
    stream.querySelector('.board-source-heading')?.remove();
    const attention=stream.querySelector('.mfd-attention-section');
    if(!attention)return;
    if(extras.linkedin){
      const buyers=attention.querySelector('[data-finding-id="evaluation-roles"] p');
      if(buyers&&!buyers.textContent.includes('Ironwood'))buyers.textContent += ' Ironwood is one example: its finance and security buyers have not seen your LinkedIn ads.';
    }
    let changed=false;
    fresh.forEach(source=>{
      let card=stream.querySelector(`.board-source-story[data-board-source-story="${source.id}"]`);
      if(!card){card=feedStory(source);changed=true;}
      if(card.parentElement!==attention){
        attention.prepend(card);
        changed=true;
      }
    });
    stream.querySelectorAll('.board-source-story').forEach(card=>{if(!fresh.some(source=>source.id===card.dataset.boardSourceStory)){card.remove();changed=true;}});
    if(changed)document.dispatchEvent(new CustomEvent('mojo:board-feed-updated'));
    if(pendingSource){
      const card=stream.querySelector(`.board-source-story[data-board-source-story="${pendingSource}"]`);
      if(card){pendingSource=null;requestAnimationFrame(()=>{document.querySelector('[data-mf-tab="insights"]')?.click();card.scrollIntoView({behavior:'smooth',block:'center'});card.classList.add('board-source-spotlight');setTimeout(()=>card.classList.remove('board-source-spotlight'),1400);});}
    }
  };
  const animateFeedUpdate=connectedSources=>{
    document.querySelector('[data-mf-tab="insights"]:not([aria-selected="true"])')?.click();
    const canvas=document.querySelector('main.mf-feed-page');
    const stories=canvas?.querySelector('#mf-insights .ms-stories');
    const stream=canvas?.querySelector('#mf-insights .mf-stream');
    const cards=connectedSources.map(source=>stream?.querySelector(`.board-source-story[data-board-source-story="${source.id}"]`)).filter(Boolean);
    if(!canvas||!stream||!cards.length)return;
    const loading=document.createElement('div');
    loading.className='board-feed-loading';
    loading.setAttribute('role','status');
    loading.setAttribute('aria-live','polite');
    loading.innerHTML=`<p>Updating your feed with ${connectedSources.map(source=>source.name).join(', ')} signals…</p>${cards.map(()=>'<div class="board-feed-skeleton" aria-hidden="true"><span></span><b></b><i></i><i></i><em></em></div>').join('')}`;
    cards.forEach(card=>card.classList.add('board-source-loading'));
    stream.querySelector('.board-source-story.board-source-loading').before(loading);
    loading.scrollIntoView({behavior:'smooth',block:'center'});
    stories?.querySelectorAll('.ms-thumb').forEach((tile,index)=>tile.style.setProperty('--story-index',index));
    canvas.classList.remove('board-feed-updating');
    void canvas.offsetWidth;
    canvas.classList.add('board-feed-updating');
    setTimeout(()=>{
      loading.remove();
      cards.forEach(card=>{card.classList.remove('board-source-loading');card.classList.add('board-source-entering');});
      cards[0].scrollIntoView({behavior:'smooth',block:'center'});
      setTimeout(()=>{canvas.classList.remove('board-feed-updating');cards.forEach(card=>card.classList.remove('board-source-entering'));},850);
    },1100);
  };
  const syncLinkedInMoment=()=>{
    const dashboard=document.querySelector('.mf-dashboard');
    if(!dashboard)return;
    let moment=dashboard.querySelector('.board-linkedin-moment');
    if(!moment){
      moment=document.createElement('section');moment.className='board-linkedin-moment';moment.setAttribute('aria-label','Cross-channel connection preview');
      moment.innerHTML=`<div class="board-linkedin-moment-head"><img src="assets/linkedin.png" alt="LinkedIn logo"><div><small>LINKEDIN ADS</small><strong>See paid social beside your Demandbase view.</strong></div><button type="button" data-board-open-connections>Connect LinkedIn →</button></div><div class="board-linkedin-moment-body"><div class="board-linkedin-spend"><span>Q4 channel spend in view</span><b data-linkedin-spend>$180K</b><div><i></i></div></div><div class="board-linkedin-rows"><div><span>Channel</span><span>Buyer view</span><span>Spend</span></div><div class="board-linkedin-row"><span>Demandbase Ads</span><span>Account delivery</span><b>$180K</b></div><div class="board-linkedin-row board-linkedin-extra"><span>LinkedIn · EMEA</span><span>Buying group reach</span><b>$55K</b></div><div class="board-linkedin-row board-linkedin-extra"><span>LinkedIn · Manufacturing</span><span>Role-specific creative</span><b>$49K</b></div></div></div>`;
      const toolbar=dashboard.querySelector('.mf-dashboard-toolbar');(toolbar||dashboard.firstElementChild)?.after(moment);
    }
    const isLinkedIn=!!extras.linkedin;
    if(isLinkedIn&&!moment.classList.contains('is-connected')){
      moment.classList.add('is-connected');
      moment.querySelector('[data-linkedin-spend]').textContent='$284K';
      moment.querySelector('.board-linkedin-moment-head button').hidden=true;
    }
  };
  const cardMarkup=source=>`<article class="board-connection-card" data-board-source="${source.id}" data-category="${source.category}"><div class="board-connection-card-top"><span class="board-connection-logo">${logo(source)}</span>${source.recommended?'<span class="board-recommended">Recommended next</span>':''}</div><small>${source.category}</small><h3>${source.name}</h3><strong>${source.short}</strong><p>${source.why}</p><button type="button" data-board-connect="${source.id}" ${connected(source)?'disabled':''}>${connected(source)?'✓ Connected':'Connect'}</button></article>`;
  let modal;
  let lastConnectedSource=null;
  let connectedThisSession=[];
  let pendingSource=new URLSearchParams(location.search).get('source');
  const updateCount=()=>{if(modal)modal.querySelector('[data-board-count]').textContent=String(sources.filter(connected).length);};
  const applyFilters=()=>{
    if(!modal)return;
    const category=modal.querySelector('.board-filter[aria-pressed="true"]')?.dataset.category||'All';
    const query=modal.querySelector('[data-board-search]').value.trim().toLowerCase();
    let visible=0;
    modal.querySelectorAll('.board-connection-card').forEach(card=>{
      const source=sources.find(item=>item.id===card.dataset.boardSource);
      card.hidden=(category!=='All'&&source.category!==category)||!!query&&!`${source.name} ${source.short} ${source.why} ${source.apps.join(' ')}`.toLowerCase().includes(query);
      if(!card.hidden)visible++;
    });
    modal.querySelector('.board-no-results').hidden=visible>0;
  };
  const open=()=>{
    if(modal){modal.hidden=false;modal.querySelector('.board-modal-close').focus();return;}
    lastConnectedSource=null;
    connectedThisSession=[];
    modal=document.createElement('div');
    modal.className='board-connection-overlay';
    modal.innerHTML=`<div class="board-connection-dialog" role="dialog" aria-modal="true" aria-labelledby="board-connection-title"><div class="board-connection-hero"><button type="button" class="board-modal-close" aria-label="Close connections">×</button><h2 id="board-connection-title">Connect another source.</h2><p>Choose the data you want Mojo to use next.</p><div class="board-connection-progress"><b><span data-board-count>${sources.filter(connected).length}</span> of ${sources.length} sources connected</b><span>Campaigns · Audiences · AEO</span></div><div class="board-connect-feedback" role="status" aria-live="polite"></div></div><div class="board-connection-controls"><div class="board-connection-filters" role="group" aria-label="Filter connections">${categories.map((category,index)=>`<button type="button" class="board-filter" data-category="${category}" aria-pressed="${index===0}">${category}</button>`).join('')}</div><input type="search" data-board-search aria-label="Search connections" placeholder="Find a connection"></div><div class="board-connection-list">${cards().map(cardMarkup).join('')}<p class="board-no-results" hidden>No connections match this search.</p></div><div class="board-connection-footer"><span data-board-next-hint>Choose a source to add to your feed.</span><button type="button" data-board-see-feed>Back to feed →</button></div></div>`;
    document.body.append(modal);
    document.body.classList.add('board-connections-open');
    modal.querySelector('.board-modal-close').focus();
  };
  const close=()=>{if(!modal)return;const added=connectedThisSession;modal.remove();modal=null;document.body.classList.remove('board-connections-open');lastConnectedSource=null;connectedThisSession=[];if(added.length)animateFeedUpdate(added);};
  const showFeed=()=>{
    const source=lastConnectedSource;
    close();
    const stream=document.querySelector('#mf-insights .mf-stream');
    if(!stream){location.href=`HomeSystem.html${source?`?source=${encodeURIComponent(source)}`:''}#feed`;return;}
    const insights=document.querySelector('[data-mf-tab="insights"]');
    if(insights?.getAttribute('aria-selected')!=='true')insights?.click();
    const card=source&&stream.querySelector(`.board-source-story[data-board-source-story="${source}"]`);
    if(!source)stream.scrollIntoView({behavior:'smooth',block:'start'});
  };
  document.addEventListener('click',event=>{
    const why=event.target.closest('[data-board-why]');
    if(why){const finding=feedFindings[why.dataset.boardWhy],source=sources.find(item=>item.id===why.dataset.boardWhy);if(finding)window.MojoSeeWhy?.open({title:finding.title,reason:finding.body,source:source?.name,triggerType:'Mojo Brain',triggerReason:`${finding.value} ${finding.caption} surfaced when ${source?.name||'the source'} connected.`,nextStep:`${finding.action} in the connected source before changing the campaign.`,href:finding.href,linkLabel:finding.action},why);return;}
    const discuss=event.target.closest('[data-board-chat]');
    if(discuss){const finding=feedFindings[discuss.dataset.boardChat];window.MojoOpenChat?.(`Let's discuss ${finding?.title||'this campaign finding'}`);return;}
    if(event.target.closest('.board-demandbase-dismiss')){contextDismissed=true;localStorage.setItem('mojo-board-demandbase-summary-dismissed-v1','true');const note=event.target.closest('.board-demandbase-context');note?.classList.add('is-dismissing');setTimeout(()=>note?.remove(),220);return;}
    if(event.target.closest('.mf-connect-more,.md-connect-more,.ms-connect-more,.mg-connect-more,[data-board-open-connections]')){event.preventDefault();open();return;}
    if(!modal)return;
    if(event.target===modal||event.target.closest('.board-modal-close')){close();return;}
    if(event.target.closest('[data-board-see-feed]')){showFeed();return;}
    const filter=event.target.closest('.board-filter');
    if(filter){modal.querySelectorAll('.board-filter').forEach(item=>item.setAttribute('aria-pressed',String(item===filter)));applyFilters();return;}
    const button=event.target.closest('[data-board-connect]');
    if(button){const source=sources.find(item=>item.id===button.dataset.boardConnect);if(!source)return;extras[source.id]=true;lastConnectedSource=source.id;connectedThisSession.push(source);localStorage.setItem(extrasKey,JSON.stringify(extras));button.disabled=true;button.textContent='✓ Connected';button.closest('.board-connection-card').classList.add('is-connected');modal.querySelector('.board-connect-feedback').innerHTML=`${logo(source)}<span><b>${source.name} connected.</b> ${source.short}.</span>`;modal.querySelector('[data-board-next-hint]').textContent=`${source.name} added a new finding to Campaigns.`;modal.querySelector('[data-board-see-feed]').textContent='See what changed in feed →';updateCount();syncRails();syncCampaignContext();syncFeedSignals();document.dispatchEvent(new CustomEvent('mojo:board-source-connected',{detail:{source:source.id}}));}
  });
  document.addEventListener('input',event=>{if(event.target.matches('[data-board-search]'))applyFilters();});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&modal)close();});
  document.addEventListener('mojo:board-source-connected',()=>{extras=JSON.parse(localStorage.getItem(extrasKey)||'{}');syncRails();syncCampaignContext();syncFeedSignals();});
  document.addEventListener('mojo:goals-rendered',syncRails);
  const start=()=>{
    syncRails();syncCampaignContext();syncFeedSignals();
    let queued=false;
    new MutationObserver(()=>{
      if(queued)return;
      queued=true;
      requestAnimationFrame(()=>{queued=false;syncRails();syncCampaignContext();syncFeedSignals();});
    }).observe(document.body,{childList:true,subtree:true});
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
