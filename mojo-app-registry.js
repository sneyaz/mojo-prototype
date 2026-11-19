/* One catalog and one install state for Apps, Dashboards, and Routines. */
(() => {
  const storageKey = 'mojo-installed-apps-v1';
  const categories = {growth:'Growth',creative:'Creative',lifecycle:'Lifecycle',revenue:'Revenue',programs:'Programs',abm:'ABM',aeo:'AEO / GEO'};
  const apps = [
    {id:'campaigns',name:'Campaigns',description:'Inspect delivery, performance, and the next campaign decision.',category:'growth',status:'installed',icon:'campaigns',entryRoute:'HomeSystem.html#feed-insights',previewRoute:null,steps:['Review campaign signals','Inspect performance','Approve the next move']},
    {id:'audience-builder',name:'Audiences',description:'See who qualifies, where audiences are used, and what needs review.',category:'growth',status:'installed',icon:'audience',entryRoute:'AppWorkspace.html?app=audience-builder#feed',previewRoute:null,steps:['Review audience changes','Inspect targeting and freshness','Approve audience standards']},
    {id:'aeo',name:'AEO',description:'Track how answer engines mention your brand, cite your pages, and describe your product.',category:'growth',status:'installed',icon:'aeo',entryRoute:'AppWorkspace.html?app=aeo#feed',previewRoute:null,steps:['Review answer changes','Inspect buyer questions and cited pages','Approve content corrections']},
    {id:'icp-builder',name:'ICP Builder',description:'Define the accounts most likely to become customers.',category:'revenue',status:'planned',icon:'target',entryRoute:null,previewRoute:'AppPreview.html?app=icp-builder',steps:['Compare won accounts','Review fit criteria','Save an ICP draft']},
    {id:'creative-studio',name:'Creative Studio',description:'Review messaging and prepare replacement ad variants.',category:'creative',status:'planned',icon:'spark',entryRoute:null,previewRoute:'AppPreview.html?app=creative-studio',steps:['Choose an ad group','Compare messages','Draft variants for review']},
    {id:'lifecycle-journeys',name:'Journey Progression',description:'Spot engaged accounts that need a next step across paid, email, and sales.',category:'lifecycle',status:'planned',icon:'path',entryRoute:null,previewRoute:'AppPreview.html?app=lifecycle-journeys',jobFamily:'Marketing automation',input:'Account engagement, campaign touches, and CRM stage',output:'A proposed next step for each stalled account',approval:'A marketer reviews the handoff before anyone is contacted',components:['Revenue Intelligence','Journey Progression','Email Agent'],example:'An account visits pricing after an ad click, but the opportunity has no next step.',steps:['Match the account to recent activity','Check its CRM stage and contact rules','Draft a follow-up for owner review']},
    {id:'revenue-reporting',name:'Revenue Reporting',description:'Reconcile campaign activity with CRM outcomes.',category:'revenue',status:'planned',icon:'chart',entryRoute:null,previewRoute:'AppPreview.html?app=revenue-reporting',steps:['Check source definitions','Choose attribution window','Review a sourced report']},
    {id:'event-programs',name:'Event Programs',description:'Manage invitations, attendance, and follow-up.',category:'programs',status:'planned',icon:'calendar',entryRoute:null,previewRoute:'AppPreview.html?app=event-programs',steps:['Build invite audience','Track registration','Draft attendee follow-up']},
    {id:'abm-activation',name:'ABM Activation',description:'Turn a buying group into a reviewed audience and campaign plan.',category:'abm',status:'planned',icon:'audience',entryRoute:null,previewRoute:'AppPreview.html?app=abm-activation',jobFamily:'ABM',input:'Target accounts, buying-group roles, intent, and exclusions',output:'A proposed audience, channel mix, and campaign brief',approval:'A marketer approves the audience and budget before launch',components:['Audience Agent','Campaign Agent','Buying groups'],example:'Finance buyers are active at 37 target accounts, but the current campaign reaches only 22.',steps:['Find missing buying-group roles','Check reach and suppressions','Draft a campaign plan for approval']},
    {id:'answer-readiness',name:'Answer Readiness',description:'Find gaps between approved product facts and what buyer agents say.',category:'aeo',status:'planned',icon:'aeo',entryRoute:null,previewRoute:'AppPreview.html?app=answer-readiness',jobFamily:'AEO / GEO',input:'Approved product facts, sampled answers, and cited pages',output:'A prioritized correction brief with source pages',approval:'A content owner approves every published change',components:['AEO Agent','Campaign Agent','Site Customize Agent'],example:'Three of four sampled comparison answers omit the brand, and an old review page is cited.',steps:['Compare answers with approved facts','Trace the cited sources','Draft page and profile corrections for review']}
  ];
  const routineTemplates = {
    'audience-builder':[{id:'audience-signal-watch',name:'Audience signal watch',cadence:'Daily',description:'Find accounts that newly meet saved audience criteria.'},{id:'audience-eligibility',name:'Audience eligibility check',cadence:'Daily',description:'Check size, suppressions, and approvals before activation.',linkedBestPracticeId:'suppression'},{id:'audience-freshness-watch',name:'Audience freshness watch',cadence:'Daily',description:'Flag audiences whose source has missed its refresh window.',linkedBestPracticeId:'refresh'},{id:'audience-overlap-watch',name:'Audience overlap watch',cadence:'Daily',description:'Compare active audience membership for duplication.',linkedBestPracticeId:'overlap'},{id:'audience-performance-watch',name:'Audience performance watch',cadence:'Weekly',description:'Compare engagement across similar audience types.'}],
    aeo:[{id:'aeo-answer-watch',name:'Answer watch',cadence:'Daily',description:'Recheck the saved buyer questions and flag meaningful changes in brand mentions or competitor presence.'},{id:'aeo-citation-watch',name:'Citation watch',cadence:'Daily',description:'Track which pages appear as explicit sources in sampled AI answers.',linkedBestPracticeId:'aeo-source-review'},{id:'aeo-claim-review',name:'Claim review',cadence:'Weekly',description:'Collect repeated factual mismatches for a human content owner to review.',linkedBestPracticeId:'aeo-claim-owner'}],
    'icp-builder':[{id:'icp-fit-review',name:'ICP fit review',cadence:'Monthly',description:'Compare current ICP criteria with available won-account evidence.'}],
    'creative-studio':[{id:'message-fatigue-watch',name:'Message fatigue watch',cadence:'Weekly',description:'Check whether approved messages are losing engagement.'}],
    'lifecycle-journeys':[{id:'journey-handoff-watch',name:'Journey handoff watch',cadence:'Daily',description:'Find engaged accounts waiting at a handoff.'}],
    'revenue-reporting':[{id:'crm-outcome-check',name:'CRM outcome check',cadence:'Weekly',description:'Check whether campaign and CRM outcome records can be reconciled.'}],
    'event-programs':[{id:'registration-watch',name:'Registration watch',cadence:'Daily',description:'Find invited accounts that have not registered.'}],
    'abm-activation':[{id:'abm-coverage-watch',name:'Buying-group coverage watch',cadence:'Daily',description:'Flag target accounts missing key buying-group roles.'}],
    'answer-readiness':[{id:'answer-fact-watch',name:'Answer fact watch',cadence:'Weekly',description:'Compare sampled buyer answers with approved product facts.'}]
  };
  const readIds = () => {try {const ids=JSON.parse(localStorage.getItem(storageKey)||'[]');return Array.isArray(ids)?ids.filter(id=>apps.some(app=>app.id===id&&app.id!=='campaigns')):[];} catch {return [];}};
  const installedIds = () => [...new Set(['campaigns','audience-builder','aeo',...readIds()])];
  const getApps = () => apps.map(app => {
    const installed=installedIds().includes(app.id);
    return {...app,status:installed?'installed':'planned',entryRoute:installed?(app.id==='campaigns'?'HomeSystem.html#feed-insights':`AppWorkspace.html?app=${app.id}#feed`):null,previewRoute:installed?null:app.previewRoute};
  });
  const install = id => {
    if(id==='campaigns'||id==='audience-builder'||id==='aeo')return false;
    if(!apps.some(app=>app.id===id))return false;
    const ids=readIds();
    if(ids.includes(id))return false;
    localStorage.setItem(storageKey,JSON.stringify([...ids,id]));
    window.dispatchEvent(new CustomEvent('mojo:app-installed',{detail:{id}}));
    return true;
  };
  const routines = () => getApps().filter(app=>app.status==='installed').flatMap(app=>(routineTemplates[app.id]||[]).map(routine=>({...routine,category:app.category,appId:app.id,status:'ready',lastResult:'No run yet',linkedBestPracticeId:routine.linkedBestPracticeId||null})));
  const icon = name => {
    const paths={
      campaigns:'<path d="M4 9h4l10-5v16L8 15H4a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2Z"/><path d="m7 15 2 6h4l-2-5"/><path d="M21 9v6"/>',
      audience:'<circle cx="8" cy="8" r="3"/><circle cx="17" cy="9" r="2"/><path d="M2 21v-3a6 6 0 0 1 12 0v3m0-4a4 4 0 0 1 7 4v2"/>',
      aeo:'<path d="M3 6h18M3 11h13M3 16h9"/><path d="m17 15 1.2 2.8L21 19l-2.8 1.2L17 23l-1.2-2.8L13 19l2.8-1.2L17 15Z"/>',
      target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
      spark:'<path d="m12 2 2.3 7.7L22 12l-7.7 2.3L12 22l-2.3-7.7L2 12l7.7-2.3z"/>',
      path:'<circle cx="5" cy="5" r="2"/><circle cx="19" cy="19" r="2"/><path d="M7 5h7a5 5 0 0 1 0 10H9a4 4 0 0 0 0 4h8"/>',
      chart:'<path d="M3 20h18M5 16v-5m5 5V6m5 10v-8m5 8V4"/>',
      calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18m-13 4h3m3 0h3"/>'
    };
    return `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${paths[name]||paths.campaigns}</svg>`;
  };
  window.MojoApps={apps:getApps,install,routines,icon,categories};
})();
