/* Marketplace, workflow previews, and installed dashboard links. */
(() => {
  const boot=()=>requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(init))));
  if(document.readyState==='complete')boot();else document.addEventListener('DOMContentLoaded',boot,{once:true});
  const esc=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const icon=app=>`<span class="ma-icon">${MojoApps.icon(app.icon)}</span>`;
  function init(){
    if(!window.MojoApps)return;
    if(document.querySelector('.mojo-marketplace-page'))marketplace();
    if(document.querySelector('.ma-standalone'))standalone();
  }
  function marketplace(){
    const root=document.querySelector('.mojo-marketplace-page');
    let category='all';
    const artwork={
      campaigns:'<svg viewBox="0 0 220 150" fill="none"><path d="M19 124H202" stroke="currentColor" opacity=".24"/><path d="M19 88H202M19 52H202" stroke="currentColor" stroke-dasharray="4 6" opacity=".18"/><rect x="34" y="76" width="25" height="48" rx="5" fill="currentColor" opacity=".24"/><rect x="71" y="54" width="25" height="70" rx="5" fill="currentColor" opacity=".42"/><rect x="108" y="34" width="25" height="90" rx="5" fill="currentColor" opacity=".76"/><rect x="145" y="62" width="25" height="62" rx="5" fill="currentColor" opacity=".38"/><path d="m34 60 49-22 37 11 50-28" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><circle cx="170" cy="21" r="6" fill="currentColor"/></svg>',
      'audience-builder':'<svg viewBox="0 0 220 150" fill="none"><circle cx="89" cy="75" r="53" stroke="currentColor" stroke-width="2" opacity=".42"/><circle cx="137" cy="75" r="53" stroke="currentColor" stroke-width="2" opacity=".75"/><path d="M113 28a53 53 0 0 1 0 94 53 53 0 0 1 0-94Z" fill="currentColor" opacity=".18"/><circle cx="68" cy="62" r="5" fill="currentColor"/><circle cx="84" cy="93" r="4" fill="currentColor" opacity=".55"/><circle cx="116" cy="67" r="6" fill="currentColor"/><circle cx="139" cy="92" r="5" fill="currentColor" opacity=".7"/><circle cx="158" cy="53" r="4" fill="currentColor" opacity=".5"/></svg>',
      aeo:'<svg viewBox="0 0 220 150" fill="none"><path d="M24 33h119M24 62h91M24 91h112M24 120h70" stroke="currentColor" stroke-width="5" stroke-linecap="round" opacity=".35"/><path d="m166 37 8 23 23 8-23 8-8 23-8-23-23-8 23-8 8-23Z" fill="currentColor" opacity=".72"/><circle cx="173" cy="112" r="5" fill="currentColor" opacity=".4"/></svg>',
      'icp-builder':'<svg viewBox="0 0 220 130" fill="none"><circle cx="110" cy="65" r="49" stroke="currentColor" opacity=".3"/><circle cx="110" cy="65" r="31" stroke="currentColor" opacity=".55"/><circle cx="110" cy="65" r="12" fill="currentColor" opacity=".8"/><path d="m145 30 33-20m-33 20 14 1m-14-1 5-13" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>',
      'creative-studio':'<svg viewBox="0 0 220 130" fill="none"><rect x="33" y="27" width="68" height="77" rx="8" stroke="currentColor" opacity=".36"/><rect x="75" y="14" width="77" height="89" rx="8" fill="currentColor" opacity=".14" stroke="currentColor"/><path d="M87 74h43M87 83h27" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity=".6"/><path d="m163 32 5 14 14 5-14 5-5 14-5-14-14-5 14-5 5-14Z" fill="currentColor" opacity=".75"/></svg>',
      'lifecycle-journeys':'<svg viewBox="0 0 220 130" fill="none"><path d="M39 78c29 0 33-42 69-42s36 58 75 58" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><circle cx="39" cy="78" r="12" fill="currentColor" opacity=".25" stroke="currentColor"/><circle cx="108" cy="36" r="12" fill="currentColor" opacity=".45" stroke="currentColor"/><circle cx="183" cy="94" r="12" fill="currentColor" opacity=".7" stroke="currentColor"/><path d="M39 104v12m69-64v64m75-7v7" stroke="currentColor" stroke-dasharray="3 5" opacity=".3"/></svg>',
      'revenue-reporting':'<svg viewBox="0 0 220 130" fill="none"><path d="M27 108h170" stroke="currentColor" opacity=".3"/><rect x="39" y="69" width="21" height="39" rx="4" fill="currentColor" opacity=".3"/><rect x="75" y="55" width="21" height="53" rx="4" fill="currentColor" opacity=".42"/><rect x="111" y="71" width="21" height="37" rx="4" fill="currentColor" opacity=".55"/><rect x="147" y="33" width="21" height="75" rx="4" fill="currentColor" opacity=".76"/><path d="m49 56 37-20 37 13 37-31" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      'event-programs':'<svg viewBox="0 0 220 130" fill="none"><rect x="48" y="23" width="124" height="88" rx="10" stroke="currentColor" stroke-width="2" opacity=".65"/><path d="M48 45h124M74 17v16m72-16v16" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><rect x="71" y="61" width="19" height="16" rx="3" fill="currentColor" opacity=".3"/><rect x="101" y="61" width="19" height="16" rx="3" fill="currentColor" opacity=".55"/><rect x="131" y="61" width="19" height="16" rx="3" fill="currentColor" opacity=".32"/><rect x="71" y="86" width="19" height="12" rx="3" fill="currentColor" opacity=".46"/><rect x="101" y="86" width="19" height="12" rx="3" fill="currentColor" opacity=".24"/></svg>'
    };
    function card(app){
      const installed=app.status==='installed';
      return `<article class="ma-card ${installed?'ma-hero':'ma-planned'} ma-app-${app.id}${app.jobFamily?' ma-job':''}" data-category="${app.category}"><div class="ma-card-art" aria-hidden="true">${artwork[app.id]||artwork['lifecycle-journeys']}</div><div class="ma-card-top">${icon(app)}<span class="ma-status ${installed?'ma-installed':''}">${installed?'Installed':'Preview'}</span></div><div class="ma-card-copy"><small>${esc(app.jobFamily||MojoApps.categories[app.category])}</small><h3>${esc(app.name)}</h3><p>${esc(app.description)}</p>${app.components?`<div class="ma-components" aria-label="Composed of ${esc(app.components.join(', '))}">${app.components.map(part=>`<span>${esc(part)}</span>`).join('')}</div>`:''}</div><div class="ma-actions">${installed?`<a class="ma-open" href="${app.entryRoute}">Open ${esc(app.name)} <span aria-hidden="true">→</span></a>`:`<a class="ma-preview" href="${app.previewRoute}">Preview workflow <span aria-hidden="true">→</span></a><button type="button" data-install="${app.id}" aria-label="Install ${esc(app.name)}">Install</button>`}</div></article>`;
    }
    function render(){
      const apps=MojoApps.apps(),installed=apps.filter(app=>app.status==='installed'),planned=apps.filter(app=>app.status==='planned'),jobs=planned.filter(app=>app.jobFamily),other=planned.filter(app=>!app.jobFamily);
      const names=installed.map(app=>app.name);
      const available=names.length<3?names.join(' and '):`${names.slice(0,-1).join(', ')}, and ${names.at(-1)}`;
      root.innerHTML=`<header class="ma-head"><div><h1>Mojo apps</h1><p>${esc(available)} ${installed.length===1?'is':'are'} ready to use. Explore sample workflows below.</p></div><div class="ma-head-count" aria-label="${installed.length} installed apps and ${planned.length} previews"><strong>${installed.length}</strong><span>installed</span><i aria-hidden="true"></i><strong>${planned.length}</strong><span>previews</span></div></header><section class="ma-section" aria-labelledby="ma-installed-title"><div class="ma-section-title"><h2 id="ma-installed-title">Your workspaces</h2><span>Installed · ready to open</span></div><div class="ma-installed-grid">${installed.map(card).join('')}</div></section><section class="ma-section" aria-labelledby="ma-jobs-title"><div class="ma-section-title"><h2 id="ma-jobs-title">Marketing workflows</h2><span>See how Mojo helps with everyday B2B marketing work</span></div><div class="ma-planned-grid ma-job-grid">${jobs.map(card).join('')}</div></section><section class="ma-section" aria-labelledby="ma-planned-title"><div class="ma-section-title"><h2 id="ma-planned-title">More previews</h2></div><div class="ma-planned-grid">${other.map(card).join('')}</div></section>`;
      root.querySelectorAll('[data-install]').forEach(button=>button.addEventListener('click',()=>{
        if(MojoApps.install(button.dataset.install)){category='all';render();}
      }));
      root.classList.add('ma-ready');
    }
    render();
  }
  function dashboardLinks(){
    const tabs=document.querySelector('.mf-dashboard-tabs');
    if(!tabs)return;
    MojoApps.apps().filter(app=>app.status==='installed'&&app.id!=='campaigns').forEach(app=>{
      if(tabs.querySelector(`[data-app-tab="${app.id}"]`))return;
      const link=document.createElement('a');
      link.className='ma-dashboard-tab';
      link.dataset.appTab=app.id;
      link.href=`AppWorkspace.html?app=${app.id}#dashboards`;
      link.textContent=app.name;
      link.setAttribute('aria-label',`Open ${app.name} dashboard`);
      tabs.append(link);
    });
  }
  function standalone(){
    const root=document.querySelector('.ma-standalone');
    const app=MojoApps.apps().find(item=>item.id===new URLSearchParams(location.search).get('app')&&item.id!=='campaigns');
    if(!app){root.innerHTML='<h1>App not found</h1><a href="Apps.html">Back to apps →</a>';return;}
    const preview=root.dataset.mode==='preview';
    if(!preview&&app.status!=='installed'){location.replace(app.previewRoute);return;}
    if(preview&&app.status==='installed'){location.replace(app.entryRoute);return;}
    if(!preview&&app.id==='audience-builder'&&window.MojoAudiences){window.MojoAudiences.mount(root,app);return;}
    if(!preview&&app.id==='aeo'&&window.MojoAEO){window.MojoAEO.mount(root,app);return;}
    const intro=preview?`<h1>${esc(app.name)}</h1><p>${esc(app.description)}</p><p class="ma-standalone-note">Sample workflow · no connected data or live actions</p>`:`<h1>${esc(app.name)}</h1><p>${esc(app.description)}</p>`;
    const stage=app.steps.map((step,index)=>`<li><span>0${index+1}</span><strong>${esc(step)}</strong></li>`).join('');
    const jobPreview=app.jobFamily?`<section class="ma-job-preview" aria-label="Example job"><div class="ma-job-family">${esc(app.jobFamily)} · composable job</div><div class="ma-job-example"><span>EXAMPLE SIGNAL</span><p>${esc(app.example)}</p></div><div class="ma-job-flow"><div><small>INPUT</small><p>${esc(app.input)}</p></div><span aria-hidden="true">→</span><div><small>PROPOSED OUTPUT</small><p>${esc(app.output)}</p></div></div><div class="ma-job-parts"><small>BUILT FROM</small><div>${app.components.map(part=>`<span>${esc(part)}</span>`).join('')}</div></div><div class="ma-job-approval"><strong>Review before action</strong><p>${esc(app.approval)}.</p></div></section>`:'';
    root.innerHTML=`<div class="ma-standalone-top"><a href="Apps.html">← Mojo apps</a><a href="Routines.html">Routines →</a></div><header>${icon(app)}${intro}</header>${preview?`${jobPreview}<section><h2>How it would work</h2><ol class="ma-steps">${stage}</ol><p class="ma-standalone-note">Install from the ${esc(app.name)} card in Mojo apps to open its sample workspace.</p><a class="ma-open" href="Apps.html">Back to Mojo apps →</a></section>`:`<nav class="ma-workspace-tabs" aria-label="${esc(app.name)} sections"><a href="#feed">Feed</a><a href="#dashboards">Dashboards</a><a href="#strategy">Strategy</a><a href="#best-practices">Best practices</a></nav><section class="ma-workspace-content" aria-live="polite"></section>`}`;
    if(!preview){
      const content=root.querySelector('.ma-workspace-content');
      const reviewedKey=`mojo-app-reviewed-${app.id}`;
      const paint=()=>{
        const tab=['feed','dashboards','best-practices','strategy'].includes(location.hash.slice(1))?location.hash.slice(1):'feed';
        root.querySelectorAll('.ma-workspace-tabs a').forEach(link=>link.setAttribute('aria-current',String(link.hash==='#'+tab)));
        if(tab==='feed')content.innerHTML=`<h2>Feed</h2><p>Sample work for ${esc(app.name)}. Nothing is sent or changed in connected systems.</p><article class="ma-work-card"><small>READY TO REVIEW</small><h3>${esc(app.steps[0])}</h3><p>Start with the source records, then decide whether to continue.</p><button type="button" class="ma-review">${localStorage.getItem(reviewedKey)==='1'?'Reviewed ✓':'Mark reviewed'}</button></article>`;
        if(tab==='dashboards')content.innerHTML=`<h2>Dashboards</h2><p>No connected source data yet. These are the checks this workspace will show.</p><ol class="ma-steps">${stage}</ol>`;
        if(tab==='best-practices')content.innerHTML=`<h2>Best practices</h2><p>Review the rules before this workspace makes a recommendation.</p><ol class="ma-steps">${stage}</ol>`;
        if(tab==='strategy')content.innerHTML=`<h2>Strategy</h2><p>Connect source data to compare outcomes. This sample does not claim performance or ROI.</p><a href="Connections.html">See connections →</a>`;
        content.querySelector('.ma-review')?.addEventListener('click',()=>{localStorage.setItem(reviewedKey,'1');paint();});
      };
      window.addEventListener('hashchange',paint);
      paint();
    }
  }
})();
