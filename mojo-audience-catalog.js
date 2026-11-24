/* Mojo audience catalog: the saved audiences the Audiences app manages (sample data).
   Shared so other apps (the Campaigns canvas editor's audience picker) list the same audiences.
   In the product this comes from Demandbase audience lists and synced platform audiences. */
window.MojoAudienceCatalog = (() => {
  const base = [
    {id:'enterprise-intent',name:'Enterprise Intent',definition:'Enterprise accounts showing buying intent for revenue operations',accounts:620,contacts:1240,type:'Intent',source:'Demandbase intent',updated:'Nov 3',days:0,status:'Active',campaigns:['Q4 Pipeline Search','ABM Retargeting'],overlap:'42% with Tier 1 Named',risk:'214 new qualifying accounts are outside this audience.',action:'Stage 214 additions for review'},
    {id:'healthcare-fit',name:'Healthcare Fit',definition:'Healthcare accounts meeting firmographic fit criteria',accounts:540,contacts:920,type:'Firmographic fit',source:'Demandbase firmographics',updated:'Nov 1',days:2,status:'Active',campaigns:['Healthcare Search'],overlap:'18% with Enterprise Intent',risk:'Audience size fell 23% after the latest source update.',action:'Investigate the 23% drop'},
    {id:'tier-1-named',name:'Tier 1 Named',definition:'Priority accounts selected by MOps from the ICP',accounts:360,contacts:710,type:'Manual list',source:'CRM + Demandbase',updated:'Oct 30',days:4,status:'Active',campaigns:['ABM Retargeting'],overlap:'42% with Enterprise Intent',risk:'High overlap can expose the same accounts to two campaigns.',action:'Review overlapping accounts'},
    {id:'product-retargeting',name:'Product Retargeting',definition:'Accounts that visited product pages in the last 30 days',accounts:410,contacts:860,type:'Retargeting',source:'First-party web',updated:'Nov 3',days:0,status:'Active',campaigns:['ABM Retargeting'],overlap:'34% with Enterprise Intent',risk:'Six sample accounts have a customer or do-not-contact suppression conflict.',action:'Review six exclusions'},
    {id:'intent-surge',name:'Intent Surge',definition:'Accounts with a recent rise in category research',accounts:280,contacts:500,type:'Intent',source:'Demandbase intent',updated:'Oct 18',days:16,status:'Stale',campaigns:['Q4 Pipeline Search'],overlap:'29% with Enterprise Intent',risk:'The intent source has not refreshed in 16 days; the org limit is seven.',action:'Request source refresh'},
    {id:'trial-recovery',name:'Trial Recovery',definition:'Open trial accounts with no return visit in seven days',accounts:220,contacts:370,type:'Retargeting',source:'First-party CRM',updated:'Nov 2',days:1,status:'Active',campaigns:['Customer Nurture'],overlap:'15% with Product Retargeting',risk:'Sample account engagement is 1.6%, versus 2.3% for Product Retargeting.',action:'Compare criteria and delivery'},
    {id:'regional-lookalike',name:'Regional Lookalike',definition:'New accounts modeled from current customers in target regions',accounts:760,contacts:1520,type:'Lookalike',source:'Platform model',updated:'Nov 2',days:1,status:'Needs review',campaigns:['Q1 Expansion'],overlap:'11% with Healthcare Fit',risk:'Match quality and exclusions need approval before activation.',action:'Review before activation'},
    {id:'customer-expansion',name:'Customer Expansion',definition:'Current customers eligible for an expansion message',accounts:190,contacts:330,type:'Manual list',source:'CRM export',updated:'Nov 1',days:2,status:'Draft',campaigns:[],overlap:'7% with Trial Recovery',risk:'No live campaign uses this draft audience.',action:'Review the draft'}
  ];
  const draftsKey = 'mojo-selected-audience-drafts-v1';
  /* Saved audiences plus account selections saved from the Audiences app. */
  function all() {
    const list = base.map(item => ({...item, campaigns: [...(item.campaigns || [])]}));
    try {
      const drafts = JSON.parse(localStorage.getItem(draftsKey) || '[]');
      if (Array.isArray(drafts)) drafts.forEach(draft => {
        if (!draft?.id || !Array.isArray(draft.accountNames) || list.some(item => item.id === draft.id)) return;
        list.push({id: draft.id, name: draft.name, definition: draft.definition || '', accounts: draft.accountNames.length, type: draft.type || 'Selected accounts', source: draft.source || 'Campaign account table', updated: draft.created || 'Today', days: 0, status: 'Draft', campaigns: []});
      });
    } catch {}
    return list;
  }
  return {base, all};
})();
