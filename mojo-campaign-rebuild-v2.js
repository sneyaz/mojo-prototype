/* Campaigns leads with work Mojo found, then offers one source-backed directory. */
window.MojoCampaignFindings = [
  {key:'flights', source:'Flights ending under half spent', title:'Three flights ended with less than half their budgets spent', context:'GO Prep, Q4 Pipeline Search, Enterprise Retargeting · Google Ads', impact:'About $90k remaining', confidence:'Low', why:'The Oct 30 snapshot shows 43–47% pacing before the Oct 31 flight end. Compare the three options before moving the shared $40k; remaining budget is not lost value.', action:'Open the $40k decision →', href:'HomeSystem.html#finding-flights', campaigns:['GO Prep','Q4 Pipeline Search','Enterprise Retargeting']},
  {key:'events', source:'Duplicate events need review', title:'Are duplicate events inflating your key events?', context:'Conversion measurement · 90-day event window', impact:'2,734 key events in scope', confidence:'Medium', why:'Two GA4 conversion events fire almost as often as page loads. Validate event mapping and the lead definition before relying on conversion CPA.', action:'Check data trust →', href:'HomeSystem.html#finding-duplicate-events'},
  {key:'visits', source:'Clicked but did not interact', title:'Clicks are missing from site activity', context:'Four sample campaign groups', impact:'$279,243 budget in scope', confidence:'Low', why:'A click-to-visit gap can come from a missing landing-page tag or redirect. Check measurement before judging the creative or landing page. The budget is the scope of the check, not a loss estimate.', action:'Check data trust →', href:'HomeSystem.html#finding-duplicate-events'},
  {key:'delivery', source:'Long-running delivery stalls', title:'13 Q1 flights are underpacing', context:'Q1 flight sample · 13 of 20 flights', impact:'13 flights below 40% pacing', confidence:'Medium', why:'These campaigns have paced slowly since January. The source does not identify the cause. Ask the owner to check list size, bids, flight dates and tracking before changing spend.', action:'Ask the campaign owner', href:'Work.html#decisions', campaigns:['MOF — Patient Payments']},
  {key:'overlap', source:'Nested account lists', title:'Account lists overlap across campaigns', context:'Account targeting · seven list pairs', impact:'1,264 accounts in 3+ campaigns', confidence:'Medium', why:'Overlap can be intentional in account-based marketing. Review reach, frequency and buying stage before changing exclusions; 580 accounts appear in four or more campaigns.', action:'Review overlap'},
  {key:'utms', source:'Malformed and missing UTMs', title:'Mojo repaired missing and malformed UTMs', context:'Tracking · 16 campaign rows', impact:'About 2,500 sessions attributed again', confidence:'High', why:'The activity record documents six malformed UTMs repaired and 16 stray tags mapped. The receipt shows what changed.', action:'See repair receipt', href:'Work.html#receipts'},
  {key:'benchmark', source:'Engagement checks', title:'D&M_2026 cleared six Demandbase engagement benchmarks', context:'Demandbase campaign sample', impact:'6 benchmarks cleared', confidence:'Medium', why:'This is an engagement example worth comparing with its own history and similar campaigns. It is a playbook candidate, not a claim of incremental pipeline.', action:'Copy test notes', copy:'D&M_2026 cleared all six Demandbase engagement benchmarks in the Oct 30 sample. Compare it with its own history and similar campaigns, then test whether the approach improves pipeline.', campaigns:['D&M_2026']}
];
document.addEventListener('DOMContentLoaded', () => {
  document.documentElement.dataset.mojoCampaignRebuild='started';
  // The header is the one place for Chat and Canvas. Remove duplicate and inert rail controls.
  document.querySelectorAll('.rail [title="Canvas"],.rail [title="Chat"],.rail [title="Workspaces"],.trust-rail [aria-label="Canvas"],.trust-rail [aria-label="Chat"]').forEach(node => node.remove());

  const root = document.querySelector('.ia-portfolio');
  const source = window.MojoCampaignSource;
  const records = window.MojoCampaignRecords;
  if (!root || !source || !records) { document.documentElement.dataset.mojoCampaignRebuild=`missing-${!!root}-${!!source}-${!!records}`; return; }

  const campaignPanel = root.querySelector('#ia-panel-campaigns');
  const toolbar = root.querySelector('.ia-toolbar');
  const pipeline = root.querySelector('.ia-pipeline-link');
  const platformField = root.querySelector('#ia-platform')?.closest('.mojo-platform-filter,label');
  const searchField = root.querySelector('.ia-search');
  const platform = root.querySelector('#ia-platform');
  const search = root.querySelector('#ia-search');
  const lens = root.querySelector('#ia-lens');
  if (!campaignPanel || !toolbar || !platformField || !searchField) { document.documentElement.dataset.mojoCampaignRebuild=`nodes-${!!campaignPanel}-${!!toolbar}-${!!platformField}-${!!searchField}`; return; }
  const updateHeader=()=>{
    if(lens.value!=='campaigns')return;
    root.querySelector('#ia-context-title').textContent='Campaigns';
    root.querySelector('#ia-context-summary').innerHTML='<span><strong>5</strong> to review</span><span><strong>1</strong> fixed</span><span><strong>1</strong> win</span>';
    root.querySelector('#ia-context-source').textContent='Oct 30 sample · 284 records · 48 checks';
    root.querySelector('#ia-context-action').hidden=true;
  };

  // The source markup is retained as evidence, never presented as a second report.
  const parsed = document.createElement('template');
  parsed.innerHTML = source.findings;
  const sourcePanels = [...parsed.content.querySelectorAll('section.panel')];
  const evidenceByName = new Map(sourcePanels.map(panel => [panel.querySelector('.title')?.textContent.trim(), panel.querySelector('details.evid')?.cloneNode(true)]));
  const findings = window.MojoCampaignFindings;
  const create = (tag, className, content) => { const el=document.createElement(tag); if(className)el.className=className; if(content!==undefined)el.textContent=content; return el; };
  const feed = create('section','mc-finding-feed'); feed.setAttribute('aria-labelledby','mc-open-title');
  feed.append(create('h2','mc-section-title','More to review'));
  const openList = create('div','mc-findings-list'); feed.append(openList);

  function makeFinding(item) {
    const article=create('article',`mc-finding mc-finding-${item.key}`);
    article.dataset.finding=item.key;
    const top=create('div','mc-finding-top');
    const copy=create('div','mc-finding-copy');
    copy.append(create('h3','',item.title),create('p','mc-finding-context',item.context));
    top.append(copy,create('strong','mc-finding-impact',item.impact));
    const lower=create('div','mc-finding-lower');
    const badge=create('span',`mc-confidence mc-confidence-${item.confidence.toLowerCase()}`,`${item.confidence} confidence`);
    lower.append(badge);
    const actionLabel=item.action.endsWith('→')?item.action:`${item.action} →`;
    if(item.href){const a=create('a','mc-finding-action',actionLabel);a.href=item.href;lower.append(a);}
    else{const button=create('button','mc-finding-action',actionLabel);button.type='button';lower.append(button);}
    const why=create('details','mc-finding-why');
    why.append(create('summary','','Evidence and limits'));
    const inner=create('div','mc-finding-detail');inner.append(create('p','',item.why));
    const raw=evidenceByName.get(item.source);
    if(raw){raw.querySelector('summary').textContent='Raw source evidence';if(item.key==='events'){const callout=raw.querySelector('.cap');if(callout)callout.textContent='Two GA4 conversion events are firing almost as often as page loads — check for double counting.';}inner.append(raw);}
    if(item.key==='benchmark'){const link=create('a','mc-playbook-link','See the strategy context →');link.href='Strategy.html';inner.append(link);}
    const feedback=create('div','mc-finding-feedback');feedback.setAttribute('role','group');feedback.setAttribute('aria-label','Rate this finding');
    const status=create('span','mc-feedback-status');status.setAttribute('role','status');
    const key=`mojo-finding-feedback-${item.key}`;
    const buttons={};
    const thumb='<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 10v12H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h3Zm0 0 4-7a2 2 0 0 1 3.7 1.4L14 8h5a3 3 0 0 1 2.9 3.8l-2.2 8a3 3 0 0 1-2.9 2.2H7"/></svg>';
    const getVote=()=>{try{return JSON.parse(localStorage.getItem(key)||'null')?.kind||null;}catch{return null;}};
    const render=()=>{const vote=getVote();Object.entries(buttons).forEach(([kind,button])=>button.setAttribute('aria-pressed',String(vote===kind)));};
    [['relevant','Thumbs up — helpful finding'],['dismiss','Thumbs down — not helpful finding']].forEach(([kind,label])=>{
      const button=create('button','mc-vote');button.type='button';button.setAttribute('aria-label',label);button.title=label;button.innerHTML=thumb;
      if(kind==='dismiss')button.querySelector('svg').classList.add('mc-thumb-down');
      button.addEventListener('click',()=>{if(getVote()===kind)localStorage.removeItem(key);else localStorage.setItem(key,JSON.stringify({label:kind==='relevant'?'Helpful':'Not helpful',kind,at:Date.now()}));render();});
      buttons[kind]=button;feedback.append(button);
    });
    feedback.append(status);inner.append(feedback);why.append(inner);
    if(!item.href)lower.querySelector('button.mc-finding-action').addEventListener('click',async()=>{
      if(item.copy){try{await navigator.clipboard.writeText(item.copy);status.textContent='Playbook summary copied.';}catch{status.textContent=item.copy;why.open=true;}return;}
      why.open=true;raw?.setAttribute('open','');why.scrollIntoView({block:'nearest',behavior:'smooth'});
    });
    article.append(top,lower);
    if(item.campaigns?.length){
      const related=create('div','mc-finding-campaigns');related.append(create('span','','Campaigns: '));
      item.campaigns.forEach((name,index)=>{if(index)related.append(create('span','mc-related-separator',' · '));const link=create('a','',name);link.href=`Portfolio.html#campaign=${encodeURIComponent(name)}&tab=overview`;related.append(link);});
      article.append(related);
    }
    article.append(why);render();return article;
  }
  findings.slice(1,5).forEach(item=>openList.append(makeFinding(item)));

  const flightEvidence=create('section','mc-flight-evidence');
  flightEvidence.append(create('h2','mc-section-title','3 flights to review'));
  flightEvidence.append(create('p','mc-section-intro','About $90k remained at flight end.'));
  const flightGrid=create('div','mc-flight-grid');
  [['GO Prep','45%','$27,290','$32,710'],['Q4 Pipeline Search','43%','$25,589','$34,411'],['Enterprise Retargeting','47%','$21,354','$23,646']].forEach(([name,pacing,spent,remaining])=>{
    const link=create('a','mc-flight-row');link.href=`Portfolio.html#campaign=${encodeURIComponent(name)}&tab=overview`;
    link.append(create('strong','',name),create('span','',`${pacing} paced`),create('span','',`${spent} spent`),create('span','',`${remaining} remaining`),create('span','mc-flight-arrow','↗'));
    flightGrid.append(link);
  });
  flightEvidence.append(flightGrid);
  const decisionLink=create('a','mc-flight-decision','Open the $40k decision →');decisionLink.href='HomeSystem.html#finding-flights';flightEvidence.append(decisionLink);

  const resolved=create('section','mc-resolved');resolved.append(create('h2','mc-section-title','Resolved this week'),makeFinding(findings[5]));
  const win=create('section','mc-win');win.append(create('h2','mc-section-title','Engagement checks'),makeFinding(findings[6]));
  const snapshot=create('section','mc-snapshot');snapshot.append(create('h2','mc-section-title','Performance snapshot'));
  snapshot.append(create('p','mc-section-intro','Demandbase campaign sample · Oct 30, 2026'));
  const metrics=create('dl','mc-metrics');[['Total budget','$319,706'],['Target accounts','5,687'],['Average pacing','93.2%'],['Accounts reached','96.3%']].forEach(([label,value])=>{const cell=create('div','');cell.append(create('dt','',label),create('dd','',value));metrics.append(cell);});snapshot.append(metrics);
  const organizationTotals=create('details','mc-organization-totals');
  organizationTotals.append(create('summary','','Example budget totals from separate source exports'));
  const orgList=create('dl','mc-organization-list');
  [['Sample set A','$378k'],['Demandbase set','$320k'],['Q1 flight set','$305k'],['Sample set D','$149k']].forEach(([name,total])=>{const row=create('div','');row.append(create('dt','',name),create('dd','',total));orgList.append(row);});
  organizationTotals.append(orgList,create('p','mc-organization-note',"These totals come from separate example exports. They are not one company's budget."));
  snapshot.append(organizationTotals);

  const tableSection=create('section','mc-directory');tableSection.id='mc-campaign-directory';
  tableSection.append(create('h2','mc-section-title','Campaigns to inspect'));
  tableSection.append(create('p','mc-section-intro','Open a campaign for performance and next steps.'));
  const filters=create('div','mc-campaign-filters');filters.append(platformField,searchField);
  const statusLabel=create('label','mc-status-filter','Status ');const statusSelect=create('select','');statusSelect.id='mc-status';statusSelect.setAttribute('aria-label','Filter campaigns by status');[['all','All statuses'],['Needs review','Needs review'],['Stalled','Stalled'],['On track','On track'],['Delivery only','Delivery only']].forEach(([value,text])=>{const option=create('option','',text);option.value=value;statusSelect.append(option);});statusLabel.append(statusSelect);filters.append(statusLabel);tableSection.append(filters);
  const wrap=create('div','ia-table-wrap');const table=create('table','mc-table mc-one-table');
  table.innerHTML='<thead><tr><th><button type="button" data-sort="name">Campaign</button></th><th><button type="button" data-sort="platform">Platform</button></th><th><button type="button" data-sort="status">Mojo’s read</button></th><th><button type="button" data-sort="pacing" aria-sort="ascending">Pacing ↑</button></th><th><button type="button" data-sort="spend">Spend</button></th><th><button type="button" data-sort="remaining">Remaining</button></th></tr></thead><tbody id="ia-campaign-rows"></tbody>';
  wrap.append(table);tableSection.append(wrap,create('p','mc-directory-count'));
  const legacyCount=create('p','');legacyCount.id='ia-match-count';legacyCount.hidden=true;tableSection.append(legacyCount);
  campaignPanel.replaceChildren(flightEvidence,feed,resolved,win,snapshot,tableSection);
  if(pipeline){const link=pipeline.querySelector('a');if(link){link.classList.remove('primary');link.textContent='Review CRM requirements →';}snapshot.after(pipeline);}
  toolbar.classList.add('mc-lens-toolbar');
  const header=root.querySelector('.ia-context-head');
  const headerRow=create('div','mc-header-row');
  header.querySelector('h1').before(headerRow);
  headerRow.append(toolbar,header.querySelector('h1'));
  const newCampaignButton=create('button','mc-new-campaign-button','+ New campaign');
  newCampaignButton.type='button';
  newCampaignButton.setAttribute('aria-controls','mc-new-campaign-panel');
  newCampaignButton.setAttribute('aria-expanded','false');
  headerRow.append(newCampaignButton);
  const newCampaignPanel=create('section','mc-new-campaign-panel');
  newCampaignPanel.id='mc-new-campaign-panel';
  newCampaignPanel.hidden=true;
  newCampaignPanel.setAttribute('aria-label','New campaign');
  header.after(newCampaignPanel);
  const openNewCampaign=()=>{
    if(lens.value!=='campaigns'){
      lens.value='campaigns';
      lens.dispatchEvent(new Event('input',{bubbles:true}));
      lens.dispatchEvent(new Event('change',{bubbles:true}));
    }
    if(newCampaignPanel.hidden){
      newCampaignPanel.hidden=false;
      if(typeof renderBulk==='function'){
        renderBulk(newCampaignPanel);
        newCampaignPanel.querySelector('h2').textContent='Plan a new campaign';
        newCampaignPanel.querySelector('.mc-result-intro').textContent='Set the goal, audience, markets, budget, and reviewers. Mojo prepares a local draft for approval; this prototype does not launch a live campaign.';
      }
    }
    newCampaignButton.setAttribute('aria-expanded','true');
    history.replaceState(null,'','#new-campaign');
    newCampaignPanel.scrollIntoView({block:'start',behavior:'smooth'});
  };
  newCampaignButton.addEventListener('click',openNewCampaign);
  if(location.hash==='#new-campaign')requestAnimationFrame(openNewCampaign);
  window.addEventListener('hashchange',()=>{if(location.hash==='#new-campaign')openNewCampaign();});
  // Use the same in-page menu pattern as Brief. Keep the original select as the
  // single source of truth for the existing lens, hash and drilldown listeners.
  const originalLensField=lens.closest('label');
  const viewControl=create('div','mc-view-control');
  const viewTrigger=create('button','mc-view-trigger');
  viewTrigger.type='button';
  viewTrigger.setAttribute('aria-haspopup','menu');
  viewTrigger.setAttribute('aria-expanded','false');
  viewTrigger.setAttribute('aria-controls','mc-view-menu');
  viewTrigger.innerHTML='<span>VIEW</span><strong></strong><svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m4 6 4 4 4-4"/></svg>';
  const viewMenu=create('div','mc-view-menu');
  viewMenu.id='mc-view-menu';
  viewMenu.setAttribute('role','menu');
  viewMenu.setAttribute('aria-label','Campaigns view');
  viewMenu.hidden=true;
  const viewOptions=[...lens.options].map(option=>{
    const item=create('button','mc-view-option',option.textContent);
    item.type='button';
    item.dataset.value=option.value;
    item.setAttribute('role','menuitemradio');
    item.addEventListener('click',()=>{
      lens.value=option.value;
      lens.dispatchEvent(new Event('input',{bubbles:true}));
      lens.dispatchEvent(new Event('change',{bubbles:true}));
      closeViewMenu(true);
    });
    viewMenu.append(item);
    return item;
  });
  viewControl.append(lens,viewTrigger,viewMenu);
  originalLensField.replaceWith(viewControl);
  lens.hidden=true;
  const syncViewTrigger=()=>{
    const selected=lens.selectedOptions[0]?.textContent||'Campaigns';
    viewTrigger.querySelector('strong').textContent=selected;
    viewTrigger.setAttribute('aria-label',`View: ${selected}`);
    viewOptions.forEach(item=>item.setAttribute('aria-checked',String(item.dataset.value===lens.value)));
  };
  const closeViewMenu=(restoreFocus=false)=>{
    viewMenu.hidden=true;
    viewTrigger.setAttribute('aria-expanded','false');
    if(restoreFocus)viewTrigger.focus();
  };
  const openViewMenu=(focusOption=false)=>{
    syncViewTrigger();
    viewMenu.hidden=false;
    viewTrigger.setAttribute('aria-expanded','true');
    if(focusOption)viewOptions.find(item=>item.dataset.value===lens.value)?.focus();
  };
  viewTrigger.addEventListener('click',()=>viewMenu.hidden?openViewMenu():closeViewMenu());
  viewTrigger.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&!viewMenu.hidden){event.preventDefault();closeViewMenu(true);return;}
    if(event.key==='ArrowDown'||event.key==='ArrowUp'){
      event.preventDefault();openViewMenu(true);
      if(event.key==='ArrowUp')viewOptions.at(-1)?.focus();
    }
  });
  viewMenu.addEventListener('keydown',event=>{
    if(event.key==='Escape'){event.preventDefault();closeViewMenu(true);return;}
    if(event.key==='Tab'){closeViewMenu();return;}
    const index=viewOptions.indexOf(document.activeElement);
    const next=event.key==='ArrowDown'?viewOptions[(index+1)%viewOptions.length]
      :event.key==='ArrowUp'?viewOptions[(index-1+viewOptions.length)%viewOptions.length]
      :event.key==='Home'?viewOptions[0]:event.key==='End'?viewOptions.at(-1):null;
    if(next){event.preventDefault();next.focus();}
  });
  document.addEventListener('pointerdown',event=>{
    if(!viewMenu.hidden&&!viewControl.contains(event.target))closeViewMenu();
  });
  lens.addEventListener('input',syncViewTrigger);
  syncViewTrigger();

  const creativeTemplate=document.createElement('template');creativeTemplate.innerHTML=source.creative;
  const creative=creativeTemplate.content.firstElementChild;
  if(creative){creative.classList.add('mc-creative-watch');creative.removeAttribute('id');const intro=creative.querySelector('.d');if(intro)intro.textContent='Demandbase ad groups · Sep 29–Oct 29, 2026';const note=creative.querySelector('.source-data-note');if(note)note.textContent='No asset-level fatigue call yet: frequency and CTR trend are missing.';tableSection.after(creative);}

  const moneyNumber=value=>{const n=Number(String(value||'').replace(/[^0-9.]/g,''));return Number.isFinite(n)&&n>0?n:null;};
  const money=value=>value==null?'—':new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:value%1?2:0}).format(value);
  const getStatus=(name,record)=>{
    if(record.group==='Q1 flight delivery'||record.read==='Stalled delivery')return 'Stalled';
    if(['GO Prep','Q4 Pipeline Search','Enterprise Retargeting','Commerce/Holiday 2026'].includes(name)||record.group==='Clicked but low interaction')return 'Needs review';
    if(record.read==='On track')return 'On track';
    if(record.selectedSlice)return 'Delivery only';
    return 'More data needed';
  };
  let sort='pacing',direction=1;
  const renderTable=()=>{
    const q=search.value.toLowerCase().trim(),p=platform.value,s=statusSelect.value;
    const rows=[...records.entries()].map(([name,record])=>{
      const spend=moneyNumber(record.spent),remaining=moneyNumber(record.remaining),budget=moneyNumber(record.budget);
      const rest=remaining??(budget!=null&&spend!=null?Math.max(0,budget-spend):null);
      const pacing=record.pacing?Number.parseFloat(record.pacing):spend!=null&&rest!=null&&spend+rest>0?Math.round(spend/(spend+rest)*100):null;
      return {name,record,status:getStatus(name,record),spend,remaining:rest,pacing};
    }).filter(row=>row.spend!=null&&row.remaining!=null&&row.pacing!=null&&(p==='all'||row.record.platform===p)&&(s==='all'||row.status===s)&&`${row.name} ${row.record.platform} ${row.status} ${row.record.group||''}`.toLowerCase().includes(q));
    rows.sort((a,b)=>{const av=sort==='pacing'?a.pacing:sort==='spend'?a.spend:sort==='remaining'?a.remaining:sort==='status'?a.status:sort==='platform'?a.record.platform:a.name;const bv=sort==='pacing'?b.pacing:sort==='spend'?b.spend:sort==='remaining'?b.remaining:sort==='status'?b.status:sort==='platform'?b.record.platform:b.name;if(av==null&&bv==null)return a.name.localeCompare(b.name);if(av==null)return 1;if(bv==null)return -1;return typeof av==='number'?(av-bv)*direction:String(av).localeCompare(String(bv))*direction;});
    const body=table.tBodies[0];body.replaceChildren();
    rows.forEach(row=>{const tr=create('tr','ia-campaign-row');const a=create('a','ia-campaign-link',row.name);a.href=`#campaign=${encodeURIComponent(row.name)}&tab=overview`;const nameCell=create('td','');nameCell.append(a);tr.append(nameCell);const platformCell=create('td','',row.record.platform||'Source unknown');tr.append(platformCell);const statusCell=create('td','');const read=row.status==='On track'?'No issues flagged':row.status==='Stalled'?'Stalled delivery':row.status==='Needs review'?(['GO Prep','Q4 Pipeline Search','Enterprise Retargeting'].includes(row.name)?'Flight ended Oct 31':row.name==='Commerce/Holiday 2026'?'Tracking check needed':'Check delivery and reach'):row.status==='Delivery only'?'Delivery snapshot':row.status;statusCell.append(create('span',`mc-read mc-read-${row.status.toLowerCase().replaceAll(' ','-')}`,read));tr.append(statusCell);tr.append(create('td','mc-numeric',row.pacing==null?'—':`${row.pacing}%`),create('td','mc-numeric',money(row.spend)),create('td','mc-numeric',money(row.remaining)));tr.addEventListener('click',event=>{if(!event.target.closest('a,button'))location.hash=a.hash;});body.append(tr);});
    const complete=[...records.values()].filter(record=>{const spend=moneyNumber(record.spent),remaining=moneyNumber(record.remaining),budget=moneyNumber(record.budget);return spend!=null&&(remaining!=null||budget!=null)&&(record.pacing||remaining!=null||budget!=null)}).length;
    tableSection.querySelector('.mc-directory-count').textContent=`${rows.length} shown · ${complete} with full delivery data`;
    table.querySelectorAll('th button').forEach(button=>{const th=button.closest('th');th.removeAttribute('aria-sort');button.textContent=({name:'Campaign',platform:'Platform',status:'Mojo’s read',pacing:'Pacing',spend:'Spend',remaining:'Remaining'})[button.dataset.sort]+(button.dataset.sort===sort?(direction===1?' ↑':' ↓'):'');if(button.dataset.sort===sort)th.setAttribute('aria-sort',direction===1?'ascending':'descending');});
  };
  table.querySelectorAll('th button').forEach(button=>button.addEventListener('click',()=>{const next=button.dataset.sort;direction=sort===next?-direction:1;sort=next;renderTable();}));
  [platform,search,statusSelect].forEach(control=>control.addEventListener('input',renderTable));
  const syncView=()=>{
    root.classList.toggle('mc-campaign-lens',lens.value==='campaigns');
    newCampaignButton.hidden=lens.value!=='campaigns';
    if(lens.value!=='campaigns'){
      newCampaignPanel.hidden=true;
      newCampaignButton.setAttribute('aria-expanded','false');
    }
    updateHeader();
    root.querySelector('.ia-source-detail').hidden=lens.value!=='campaigns';
    renderTable();
  };
  lens.addEventListener('input',syncView);
  syncView();
  document.documentElement.dataset.mojoCampaignRebuild='complete';
});
