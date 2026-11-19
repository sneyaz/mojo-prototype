/* Shared initiative structure for Company, Plan, Build, and Report. */
(() => {
  const entries = [
    {id:'visibility',area:'capture',name:'Q4 net-new pipeline',goal:'Create qualified pipeline from net-new accounts',motions:['Demand','Land'],channels:['LinkedIn Ads','Demandbase Ads','Google Ads']},
    {id:'expansion',area:'customer_growth',name:'Customer Growth',goal:'Open expansion opportunities in existing customers',motions:['Expand'],channels:['Demandbase Ads','LinkedIn Ads']},
    {id:'coverage',area:'regional',name:'Event Demand Generation',goal:'Turn event interest into qualified engagement',motions:['Demand'],channels:['Demandbase Ads','LinkedIn Ads']},
    {id:'acceleration',area:'buying_group',name:'Buying-Group Coverage',goal:'Reach missing buyers and create meetings',motions:['Brand','Demand','Land'],channels:['Demandbase Ads']}
  ];
  const oldNames = {
    visibility:['Competitive takeout','Brand'],
    expansion:['Industry expansion','Expand'],
    coverage:['GO events','Demand'],
    acceleration:['Buying-group expansion','Land']
  };
  const oldGoals = {
    visibility:['Win active vendor comparisons','Reach the right target accounts'],
    expansion:['Open opportunities in priority industries','Open customer expansion opportunities'],
    coverage:['Increase qualified engagement'],
    acceleration:['Turn buying-group engagement into meetings']
  };
  const logo = {'LinkedIn Ads':'assets/linkedin.png','Demandbase Ads':'assets/demandbase.png','Google Ads':'assets/google-ads.svg'};
  const read = key => {try{return JSON.parse(localStorage.getItem(key)||'null')}catch{return null}};
  const metadataKey = 'mojo-initiative-structure-v1';
  const metadata = read(metadataKey) || {};
  const byId = id => {
    const entry = entries.find(item => item.id===id);
    if (!entry) return null;
    const saved = metadata[id] || {};
    return {...entry,motions:Array.isArray(saved.motions)?saved.motions:entry.motions,channels:Array.isArray(saved.channels)?saved.channels.filter(name=>logo[name]):entry.channels};
  };
  const normalize = goal => {
    const entry = entries.find(item=>item.id===goal?.id);
    if (!entry) return goal;
    return {...goal,initiative:oldNames[entry.id].includes(goal.initiative)?entry.name:goal.initiative||entry.name,title:oldGoals[entry.id].includes(goal.title)?entry.goal:goal.title||entry.goal};
  };
  for (const key of ['mojo-campaign-goals-v1','mojo-initiative-review-v1']) {
    const saved = read(key);
    if (!Array.isArray(saved?.goals)) continue;
    const next = saved.goals.map(normalize);
    if (JSON.stringify(next)!==JSON.stringify(saved.goals)) {
      saved.goals = next;
      localStorage.setItem(key,JSON.stringify(saved));
    }
  }
  window.MojoInitiatives={entries,byId,normalize,logo,metadataKey,read};
})();
