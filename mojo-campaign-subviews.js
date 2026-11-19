/* Three focused views inside the Campaigns lens. Reuse verified sections; leave stale source totals hidden. */
document.addEventListener('DOMContentLoaded', () => requestAnimationFrame(() => requestAnimationFrame(() => {
  const root=document.querySelector('.ia-portfolio');
  const panel=root?.querySelector('#ia-panel-campaigns');
  const report=root?.querySelector('.ia-source-detail');
  if(!panel||!report||panel.querySelector('.mc-subtabs'))return;

  const find=(selector)=>panel.querySelector(selector);
  const flight=find('.mc-flight-evidence');
  const directory=find('.mc-directory');
  const feed=find('.mc-finding-feed');
  const resolved=find('.mc-resolved');
  const win=find('.mc-win');
  const snapshot=find('.mc-snapshot');
  const pipeline=find('.ia-pipeline-link');
  if(!flight||!directory||!snapshot)return;

  const legacySection=heading=>[...report.querySelectorAll('.tabpanel section.panel')]
    .find(section=>section.querySelector('h2')?.textContent.trim()===heading)?.cloneNode(true);
  const waystar=report.querySelector('.performance-waystar-panel')?.cloneNode(true);
  const topBudgets=legacySection('Top campaigns by budget — Demandbase set');
  const averagePacing=legacySection('Average pacing — Demandbase set');
  const thresholds=legacySection('Demandbase stage thresholds');
  const accountOutcomes=report.querySelector('#influence')?.cloneNode(true);
  const portfolioRollup=report.querySelector('.performance-portfolio-panel:not(.performance-waystar-panel)')?.cloneNode(true);
  for(const node of [waystar,topBudgets,averagePacing,thresholds,accountOutcomes,portfolioRollup])if(node)node.hidden=false;
  if(accountOutcomes)accountOutcomes.id='mc-account-outcomes';
  portfolioRollup?.querySelectorAll('.mojo-source-counts-hidden,.mojo-source-connect-duplicate,.performance-portfolio-exposure').forEach(node=>node.remove());

  const make=(tag,className,text)=>{const node=document.createElement(tag);if(className)node.className=className;if(text!=null)node.textContent=text;return node;};
  const nav=make('div','mc-subtabs');nav.setAttribute('role','tablist');nav.setAttribute('aria-label','Campaigns sections');
  const overviewTab=make('button','','Overview');
  const budgetTab=make('button','','Budget & Pacing');
  const performanceTab=make('button','','Performance');
  const overview=make('section','mc-subview mc-subview-overview');
  const budget=make('section','mc-subview mc-subview-budget');
  const performance=make('section','mc-subview mc-subview-performance');
  [[overviewTab,'mc-overview-tab','mc-overview-panel'],[budgetTab,'mc-budget-tab','mc-budget-panel'],[performanceTab,'mc-performance-tab','mc-performance-panel']].forEach(([button,id,controls])=>{
    button.type='button';button.id=id;button.setAttribute('role','tab');button.setAttribute('aria-controls',controls);nav.append(button);
  });
  overview.id='mc-overview-panel';overview.setAttribute('role','tabpanel');overview.setAttribute('aria-labelledby',overviewTab.id);
  budget.id='mc-budget-panel';budget.setAttribute('role','tabpanel');budget.setAttribute('aria-labelledby',budgetTab.id);
  performance.id='mc-performance-panel';performance.setAttribute('role','tabpanel');performance.setAttribute('aria-labelledby',performanceTab.id);
  const intro=(title,description)=>{const head=make('div','mc-subview-intro');head.append(make('h2','',title),make('p','',description));return head;};
  const triage=make('section','mc-shared-triage');
  triage.setAttribute('aria-label','Campaign findings');
  const triageHead=make('div','mc-shared-triage-head');
  triageHead.append(make('strong','','Top findings'));
  const allFindings=make('a','','Review findings in Feed →');allFindings.href='HomeSystem.html#feed-decisions';triageHead.append(allFindings);
  triage.append(triageHead);
  const triageGrid=make('div','mc-triage-grid');
  const sharedFindings=[
    ['BUDGET',flight.querySelector('h2')?.textContent.trim(),'3 flights · ~$90k remaining','HomeSystem.html#finding-flights'],
    ['TRACKING',feed?.querySelector('.mc-finding-events h3')?.textContent.trim(),'2 GA4 events to check','HomeSystem.html#finding-duplicate-events'],
    ['AUDIENCE',feed?.querySelector('.mc-finding-overlap h3')?.textContent.trim(),'7 overlapping list pairs','HomeSystem.html#finding-account-overlap']
  ];
  for(const [label,title,measure,href] of sharedFindings){
    if(!title)continue;
    const card=make('a','mc-triage-card');card.href=href;
    card.append(make('span','mc-triage-label',label),make('strong','',title),make('small','',measure));
    triageGrid.append(card);
  }
  triage.append(triageGrid);
  flight.querySelector('h2').textContent='Budget pacing exposure';
  feed?.querySelectorAll('.mc-finding-events,.mc-finding-overlap').forEach(node=>node.remove());
  overview.append(intro('Overview','Oct 30 sample · separate source exports'));
  budget.append(intro('Budget & Pacing','Campaign spend, remaining balances, and flight pacing.'),directory,flight);
  for(const node of [waystar,topBudgets,averagePacing])if(node)budget.append(node);
  performance.append(intro('Performance','Reported reach and engagement. Pipeline lift is not verified.'),snapshot);
  for(const node of [win,portfolioRollup,thresholds,accountOutcomes,pipeline])if(node)performance.append(node);

  const other=make('details','mc-other-findings');
  other.append(make('summary','','Other campaign findings and receipts'));
  const otherBody=make('div','mc-other-findings-body');
  for(const node of [feed,resolved])if(node)otherBody.append(node);
  other.append(otherBody);
  panel.replaceChildren(triage,nav,overview,budget,performance,other);

  const sections={overview,budget,performance};
  const buttons={overview:overviewTab,budget:budgetTab,performance:performanceTab};
  const names=Object.keys(sections);
  const setTab=(name,focus=false,updateHash=false)=>{
    if(root.classList.contains('md-clean'))name='overview';
    if(!sections[name])name='overview';
    for(const key of names){
      const selected=key===name;
      sections[key].hidden=!selected;
      buttons[key].setAttribute('aria-selected',String(selected));
      buttons[key].tabIndex=selected?0:-1;
    }
    if(updateHash)history.replaceState(null,'','#dashboard-'+name);
    if(focus)buttons[name].focus();
  };
  for(const key of names)buttons[key].addEventListener('click',()=>setTab(key,false,true));
  nav.addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
    event.preventDefault();
    const current=names.findIndex(key=>buttons[key].getAttribute('aria-selected')==='true');
    const next=event.key==='Home'?0:event.key==='End'?names.length-1:(current+(event.key==='ArrowRight'?1:names.length-1))%names.length;
    setTab(names[next],true,true);
  });
  portfolioRollup?.querySelectorAll('.performance-portfolio-client').forEach(button=>{
    const name=button.querySelector('.performance-portfolio-client-name strong')?.textContent.trim();
    button.setAttribute('aria-label',`View ${name||'source'} budget and pacing detail`);
    button.addEventListener('click',()=>{
      setTab('budget',false,true);
      (name==='Q1 flight set'?waystar:topBudgets)?.scrollIntoView({block:'start',behavior:'smooth'});
    });
  });
  const fromHash=()=>{const name=location.hash.match(/^#dashboard-(overview|budget|performance)$/)?.[1];if(name){setTab(name);if(name!=='overview'&&root.classList.contains('md-clean'))history.replaceState(null,'','#dashboard-overview');}};
  window.addEventListener('hashchange',fromHash);
  setTab(location.hash.match(/^#dashboard-(overview|budget|performance)$/)?.[1]||'overview');
  root.classList.add('mc-subviews-ready');
  root.dispatchEvent(new Event('mojo:campaign-subviews-ready'));
})));
