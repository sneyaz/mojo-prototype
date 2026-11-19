/* Campaign focus for Quarterly Review. The scorecard always describes the full quarter. */
(() => {
  const campaigns = [
    {name:'Demandbase Enterprise', platform:'Demandbase Ads', initiative:'Demand'},
    {name:'LinkedIn EMEA', platform:'LinkedIn Ads', initiative:'Demand'},
    {name:'LinkedIn Manufacturing', platform:'LinkedIn Ads', initiative:'Demand'},
    {name:'Google Ads Search', platform:'Google Ads', initiative:'Demand'},
    {name:'CTV Broad', platform:'Demandbase Ads', initiative:'Brand'}
  ];
  const logos = {'Demandbase Ads':'demandbase.png','Google Ads':'google-ads.svg','LinkedIn Ads':'linkedin.png'};
  const el = (tag, cls, value) => { const node=document.createElement(tag); if(cls) node.className=cls; if(value) node.textContent=value; return node; };
  function mount() {
    const review = document.querySelector('#ia-panel-quarterly .mqr-report');
    if (!review || review.dataset.campaignScopeReady) return false;
    const toolbar=document.querySelector('.ia-portfolio .mf-dashboard-toolbar');
    if(!toolbar) return false;
    review.dataset.campaignScopeReady='true';
    const control=el('div','mojo-scope-control mqr-control');
    const trigger=el('button','mojo-scope-chip mojo-scope-editable mqr-trigger');
    trigger.type='button'; trigger.setAttribute('aria-haspopup','dialog');trigger.setAttribute('aria-expanded','false');
    trigger.innerHTML='<span class="mojo-filter-icon" role="img" aria-label="Filter by"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 20a1 1 0 0 0 .553.895l2 1A1 1 0 0 0 14 21v-7a2 2 0 0 1 .517-1.341L21.74 4.67A1 1 0 0 0 21 3H3a1 1 0 0 0-.742 1.67l7.225 7.989A2 2 0 0 1 10 14z"/></svg></span><strong>All campaigns</strong><svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m4 6 4 4 4-4"/></svg>';
    const menu=el('div','mojo-scope-menu mqr-menu');menu.hidden=true;menu.setAttribute('role','dialog');menu.setAttribute('aria-label','Choose campaigns');
    const title=el('h3','', 'Choose campaigns');
    const presets=el('div','mojo-scope-presets');
    const all=el('button','mojo-scope-preset');all.type='button';all.innerHTML='<strong>All campaigns</strong><small>Quarterly review</small>';presets.append(all);
    const platformGroup=el('div','mojo-scope-platforms');platformGroup.innerHTML='<span>Channels</span><div></div>';
    let draft=new Set(), active=new Set(), platform='all';
    const status=el('p','mqr-status');status.hidden=true;
    const wins=[...review.querySelectorAll('#lookbook-wins .mso-lb-findings article')];
    const rows=[...review.querySelectorAll('#lookbook-money tbody tr')];
    wins.forEach(node=>tag(node.querySelector('h4'),'Cross-campaign'));
    rows.forEach((node,index)=>{node.dataset.reviewCampaign=campaigns[[1,2,3,0,4][index]].name;tag(node.querySelector('th'),campaigns[[1,2,3,0,4][index]].initiative);});
    const blockers=[...review.querySelectorAll('#lookbook-friction .mso-lb-blockers article')];
    blockers.forEach((node,index)=>tag(node.querySelector('h4'),['Brand','Land','Brand'][index]));
    const decisions=[...review.querySelectorAll('#lookbook-next .mso-lb-decision-list article')];
    decisions.forEach((node,index)=>tag(node.querySelector('h4'),['Demand','Brand','Land'][index]));
    const winsEmpty=el('p','mqr-empty','No reviewed campaigns match this selection.');winsEmpty.hidden=true;review.querySelector('#lookbook-wins .mso-lb-findings').after(winsEmpty);
    const rowsEmpty=el('p','mqr-empty','No spend rows match this selection.');rowsEmpty.hidden=true;review.querySelector('#lookbook-money .mso-lb-table-wrap').after(rowsEmpty);
    const applyFocus=()=>{
      const filtered=active.size>0;
      trigger.querySelector('strong').textContent=!filtered?'All campaigns':active.size===1?[...active][0]:`${active.size} campaigns`;
      status.hidden=!filtered;
      status.textContent=filtered?`Quarter totals stay unchanged · showing ${active.size} ${active.size===1?'campaign':'campaigns'} in the lists`:'';
      wins.forEach(node=>{const related=(node.dataset.reviewCampaigns||'').split('|');node.hidden=filtered&&!related.some(name=>active.has(name))});
      rows.forEach(node=>{node.hidden=filtered&&!active.has(node.dataset.reviewCampaign)});
      winsEmpty.hidden=!filtered||wins.some(node=>!node.hidden);
      rowsEmpty.hidden=!filtered||rows.some(node=>!node.hidden);
    };
    const list=el('div','mojo-scope-campaigns');
    const search=el('input','mojo-scope-search');search.type='search';search.placeholder='Search campaigns';search.setAttribute('aria-label','Search campaigns');
    const footer=el('div','mojo-scope-footer');const note=el('span','',`${campaigns.length} campaign groups`);const apply=el('button','', 'Show campaigns');apply.type='button';footer.append(note,apply);
    const renderList=()=>{
      list.replaceChildren();const query=search.value.trim().toLowerCase();
      campaigns.filter(item=>(platform==='all'||item.platform===platform)&&item.name.toLowerCase().includes(query)).forEach(item=>{
        const row=el('label','mojo-scope-campaign');const check=el('input');check.type='checkbox';check.checked=draft.has(item.name);
        check.addEventListener('change',()=>{if(check.checked)draft.add(item.name);else draft.delete(item.name);apply.disabled=!draft.size;});
        const logo=el('span','mojo-scope-logo');logo.innerHTML=`<img src="assets/${logos[item.platform]}" alt="">`;
        const copy=el('span');copy.innerHTML=`<strong>${item.name}</strong><small>${item.initiative} · ${item.platform}</small>`;
        row.append(check,logo,copy);list.append(row);
      });
      apply.disabled=!draft.size;
    };
    for(const [value,logo] of [['all',null],['Demandbase Ads',logos['Demandbase Ads']],['Google Ads',logos['Google Ads']],['LinkedIn Ads',logos['LinkedIn Ads']]]){
      const button=el('button');button.type='button';button.title=value==='all'?'All channels':value;button.setAttribute('aria-label',button.title);
      if(logo)button.innerHTML=`<img src="assets/${logo}" alt="">`;else button.textContent='All';
      button.addEventListener('click',()=>{platform=value;platformGroup.querySelectorAll('button').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));draft=new Set(campaigns.filter(item=>platform==='all'||item.platform===platform).map(item=>item.name));picker.clear();renderList();});
      platformGroup.lastElementChild.append(button);
    }
    platformGroup.querySelector('button').setAttribute('aria-pressed','true');
    menu.append(title,presets,platformGroup,el('p','mojo-scope-list-label','Or choose campaigns'),search,list,footer);
    const picker=window.MojoInitiativePicker(menu,campaigns.map(item=>item.name),names=>{draft=new Set(names);platform='all';platformGroup.querySelectorAll('button').forEach((button,index)=>button.setAttribute('aria-pressed',String(index===0)));renderList();},'.mojo-scope-platforms');
    control.append(trigger,menu);
    const tabs=toolbar?.querySelector('.mf-dashboard-tabs');
    const range=toolbar?.querySelector('.mf-dashboard-range');
    toolbar.insertBefore(control,range||tabs||toolbar.firstChild);
    review.prepend(status);
    const close=()=>{menu.hidden=true;trigger.setAttribute('aria-expanded','false')};
    trigger.addEventListener('click',()=>{if(!menu.hidden){close();return}draft=new Set(active);search.value='';renderList();menu.hidden=false;trigger.setAttribute('aria-expanded','true');search.focus();});
    all.addEventListener('click',()=>{active.clear();draft.clear();picker.clear();applyFocus();close()});
    apply.addEventListener('click',()=>{active=new Set(draft);applyFocus();close()});
    search.addEventListener('input',renderList);
    document.addEventListener('pointerdown',event=>{if(!menu.hidden&&!control.contains(event.target))close()});
    document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!menu.hidden){close();trigger.focus()}});
    applyFocus();return true;
  }
  function tag(target,initiative){if(!target)return;const badge=el('small','mqr-initiative',initiative);target.append(badge);}
  const start=()=>{if(mount())return;const observer=new MutationObserver(()=>{if(mount())observer.disconnect()});observer.observe(document.documentElement,{childList:true,subtree:true});};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
