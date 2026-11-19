/* The dashboard is a place to inspect rows. Feed owns the longer findings. */
document.addEventListener('DOMContentLoaded', () => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(() => {
  const root = document.querySelector('.ia-portfolio');
  const campaigns = root?.querySelector('#ia-panel-campaigns');
  const reveal=()=>document.documentElement.classList.remove('mojo-booting');
  if (!campaigns || !campaigns.querySelector('#mc-overview-panel') || root.classList.contains('md-clean')) {reveal();return;}

  const records = window.MojoCampaignRecords;
  const examples = window.MojoCampaignSamples;
  if (!(records instanceof Map) || !examples) {reveal();return;}
  root.classList.add('md-clean');
  campaigns.querySelector('.mc-shared-triage')?.remove();
  campaigns.querySelector('.mc-other-findings')?.remove();

  const number = value => Number(String(value || '').replace(/[^\d.]/g, '')) || 0;
  const money = value => {const digits=Math.abs(value-Math.round(value))<0.0001?0:2;return new Intl.NumberFormat('en-US', {style:'currency', currency:'USD', minimumFractionDigits:digits, maximumFractionDigits:digits}).format(value);};
  const node = (tag, className, value) => {const el = document.createElement(tag); if(className) el.className = className; if(value != null) el.textContent = value; return el;};
  const dashboardSummary=node('section','md-dashboard-summary');
  dashboardSummary.setAttribute('aria-label','Q4 campaign performance at a glance');
  dashboardSummary.innerHTML=`<div class="md-summary-heading"><strong>Q4 at a glance</strong><details><summary>Data sources</summary><p>Spend and sales results come from the Q4 review. GA4 adds site visits from campaigns. Pipeline figures may change as more sources connect.</p></details></div><div class="md-summary-grid"><div><span>Spend vs budget <em>Estimate</em></span><strong>$304K <small>of $350K</small></strong><i class="md-summary-track"><b style="width:87%"></b></i></div><div data-md-web-engagement><span>Web engagement <em>GA4</em></span><strong>—</strong><small>Connect GA4 to see site visits</small></div><div><span>Opportunities <em>Estimate</em></span><strong>57</strong><small>From the Q4 review</small></div><div><span>Pipeline influenced <em>Estimate</em></span><strong>$2.1M</strong><small>From the Q4 review</small></div><div><span>Cost per opportunity <em>Estimate</em></span><strong>$5.3K</strong><small>$304K ÷ 57 opportunities</small></div></div>`;
  const linkedinPreview=node('div','md-linkedin-preview');
  linkedinPreview.innerHTML='<div class="md-linkedin-preview-head"><span><img src="assets/linkedin.png" alt=""> LinkedIn in Q4</span><button type="button">See top segments</button></div><div class="md-linked-spend"><span>LinkedIn spend</span><strong>$200K of $304K total</strong><i><b></b></i></div><div class="md-linkedin-preview-rows" hidden></div><p>See how EMEA and Manufacturing contributed.</p>';
  try { linkedinPreview.hidden=localStorage.getItem('mojo-board-demandbase-connected-v1')==='true' && !JSON.parse(localStorage.getItem('mojo-board-extra-connections-v1')||'{}').linkedin; } catch {}
  dashboardSummary.append(linkedinPreview);
  const syncWebEngagement=()=>{
    const tile=dashboardSummary.querySelector('[data-md-web-engagement]');
    if(!tile)return;
    let extras={};try{extras=JSON.parse(localStorage.getItem('mojo-board-extra-connections-v1')||'{}')||{};}catch{}
    const firstRun=localStorage.getItem('mojo-board-demandbase-connected-v1')==='true';
    const visits=215+(!firstRun||extras.google?265:0)+(!firstRun||extras.linkedin?420:0);
    tile.querySelector('strong').textContent=extras.ga4?visits.toLocaleString('en-US'):'—';
    tile.querySelector('small').textContent=extras.ga4?'site visits from connected campaigns':'Connect GA4 to see site visits';
  };
  syncWebEngagement();
  document.addEventListener('mojo:board-source-connected',syncWebEngagement);
  linkedinPreview.querySelector('button').addEventListener('click',()=>{
    const button=linkedinPreview.querySelector('button'),rows=linkedinPreview.querySelector('.md-linkedin-preview-rows');
    if(linkedinPreview.classList.contains('is-loaded'))return;
    button.disabled=true;button.textContent='Loading Q4 rows…';rows.hidden=false;rows.innerHTML='<span class="md-linked-skeleton"></span><span class="md-linked-skeleton"></span>';
    const finish=()=>{rows.innerHTML='<div><strong>LinkedIn · EMEA</strong><span>$55K spend</span><span>610 engaged</span><span>14 opportunities</span></div><div><strong>LinkedIn · Manufacturing</strong><span>$49K spend</span><span>520 engaged</span><span>12 opportunities</span></div>';linkedinPreview.classList.add('is-loaded');button.textContent='Top segments shown';};
    if(matchMedia('(prefers-reduced-motion: reduce)').matches)finish();else setTimeout(finish,260);
  });
  campaigns.prepend(dashboardSummary);
  const header = (title, note) => {const box = node('div','md-table-head'); box.append(node('h2','',title),node('span','',note)); return box;};
  const table = (columns, rows, label) => {
    const wrap = node('div','md-table-wrap');
    const t = node('table','md-table'); t.setAttribute('aria-label',label);
    const thead = node('thead'); const hr = node('tr');
    columns.forEach(label => {const th = node('th','',label); th.scope='col'; hr.append(th);});
    thead.append(hr); t.append(thead);
    const tbody = node('tbody');
    rows.forEach(row => {const tr=node('tr'); if(row[0]?.name)tr.dataset.campaignName=row[0].name; row.forEach((value,index) => {
      const td=node('td'); if(index===0 && value && typeof value==='object'){
        if(label==='Campaign metrics'||label==='Reported campaign metrics')td.classList.add('md-lock-col');
        if(value.tab===false)td.append(node('span','md-row-name',value.name));
        else {const a=node('a','md-row-link',value.name); a.href=`#campaign=${encodeURIComponent(value.name)}&tab=${value.tab || 'overview'}`;a.title=value.name;td.append(a);}
      } else if(index===4 && (label==='Campaign delivery overview'||label==='Campaign budgets and pacing'||label==='Campaign metrics')){
        const pace=Math.max(0,Math.min(100,number(value)));
        const meter=node('span','md-pace-track');meter.setAttribute('aria-hidden','true');
        const fill=node('i','md-pace-fill'+(pace<40?' is-low':''));fill.style.width=pace+'%';meter.append(fill);
        td.className='md-pace-cell';td.append(node('span','md-pace-value',value),meter);
      } else td.textContent=value == null ? '—' : String(value);
      tr.append(td);
    });
      if(row[0]?.name&&row[0].tab!==false)tr.addEventListener('click',event=>{
        if(!event.target.closest('a,button,input,label'))location.hash=`campaign=${encodeURIComponent(row[0].name)}&tab=${row[0].tab||'overview'}`;
      });
      tbody.append(tr);
    });
    t.append(tbody); wrap.append(t); return wrap;
  };
  const reported=`2026-Q4-Customer-TryIt-NA	display	$32,000.00	2,921,818	3,214	0.110%	612	448	188
2026-Q4-ENT-TAL-NA-ABX	display	$11,935.33	1,062,856	725	0.068%	206	132	61
2026-Q4-HC-ICP-NA-Display	display	$9,946.11	935,848	697	0.074%	194	130	55
2026-Q4-FSI-ICP-NA-Display	display	$9,448.80	872,591	704	0.081%	187	130	52
2026-Q4-MFG-TAL-NA-ABX	display	$8,951.50	776,347	674	0.087%	178	127	47
2026-Q4-EMEA-TAL-ABX	display	$8,454.19	834,850	777	0.093%	183	138	50
2026-Q4-ENT-ICP-EMEA-Unified	display	$7,956.89	763,076	473	0.062%	176	107	46
2026-Q4-SEM-TAL-NA-Unified	display	$7,757.96	655,728	447	0.068%	166	105	41
2026-Q4-SEM-ICP-NA-Unified	display	$7,459.58	664,285	494	0.074%	166	109	41
2026-Q4-MM-All-NA	display	$6,962.28	655,094	528	0.081%	166	113	41
2026-Q4-SEM-ICP-NA-Ads	display	$6,663.89	609,761	529	0.087%	161	113	38
2026-Q4-CTV-ICP-Roku	ctv	$6,500.00	216,667	3	0.001%	122	3	26
2026-Q4-SEM-ICP-NA-AI	display	$6,266.05	606,757	564	0.093%	161	116	38
2026-Q4-EMEA-TAL-ALL	display	$5,967.67	522,105	324	0.062%	152	92	34
2026-Q4-MM-All-EMEA	display	$5,470.36	509,906	348	0.068%	151	95	33
2026-Q4-CTV-SEM-ICP-NA-AI	ctv	$5,200.00	173,333	2	0.001%	108	2	21
2026-Q4-SEM-TAL-EMEA-Unified	display	$5,171.98	477,629	355	0.074%	148	96	32
2026-Q4-SEM-ICP-EMEA-Ads	display	$4,774.13	410,482	331	0.081%	141	93	29
2026-Q4-SEM-ICP-EMEA-AI	display	$4,475.75	425,143	369	0.087%	143	97	29
2026-Q4-eBook-ConnectedGTM	display	$4,276.83	391,339	364	0.093%	139	96	28
2026-Q4-CTV-SEM-TAL-NA-AI	ctv	$4,200.00	140,000	2	0.001%	97	2	18
2026-Q4-SEM-TAL-NA-Ads	display	$3,978.44	354,285	220	0.062%	135	82	26
2026-Q4-EMEA-Benelux	display	$3,481.14	327,547	223	0.068%	133	82	24
2026-Q4-Retargeting-Pricing-Page	display	$3,381.67	321,220	241	0.075%	132	84	24
2026-Q4-CTV-SEM-ICP-EMEA-AI	ctv	$3,200.00	106,667	1	0.001%	86	1	15
2026-Q4-CTV-SEM-TAL-EMEA-AI	ctv	$2,540.00	84,666	1	0.001%	78	1	12`.split('\n').map(line=>line.split('\t'));
  const allNames=reported.map(row=>row[0]);
  reported.forEach(([name,type,spent,impressions,clicks,ctr,reached,clicked,lifted])=>{
    records.set(name,{
      platform:'Demandbase Ads',read:'Revised scenario export · Oct 2–Nov 2',group:'Campaign delivery',
      spent,impressions,clicks,ctr,reached,clickedAccounts:clicked,liftedAccounts:lifted,
      scenarioExport:true,
      finding:'The revised scenario includes delivery and account counts for this campaign. Its budget and campaign-attributed pipeline were not supplied.'
    });
  });
  const reportedType=new Map(reported.map(row=>[row[0],row[1]]));
  const reportedRows=reported.map(([name,type,spend,impressions,clicks,ctr,reached,clicked,lifted])=>[
    {name,tab:'overview'},type.toUpperCase(),spend,impressions,clicks,ctr,reached,clicked,lifted
  ]);
  const overview=campaigns.querySelector('#mc-overview-panel');
  const demandbaseView=node('div','md-channel-view md-demandbase-view');
  const platform=node('section','md-platform-snapshot');
  platform.setAttribute('aria-label','Campaign performance snapshot');
  const platformHead=node('div','md-platform-head');
  const platformTitle=node('div');
  platformTitle.append(node('span','md-platform-kicker','DEMANDBASE ADS'),node('h2','','Demandbase Ads performance'));
  platformHead.append(platformTitle,node('span','md-platform-source','Revised campaign scenario supplied Nov 3, 2026 · Oct–Nov 2026'));
  platform.append(platformHead);
  const metricGroup=(title,items)=>{
    const section=node('div','md-platform-group');
    section.dataset.group=title.toLowerCase().split(' ')[0];
    section.append(node('h3','',title));
    const grid=node('dl','md-platform-grid');
    items.forEach(([label,value,detail])=>{
      const cell=node('div','md-platform-cell');
      cell.append(node('dt','',label),node('dd','',value));
      if(detail)cell.append(node('small','',detail));
      grid.append(cell);
    });
    section.append(grid);
    return section;
  };
  platform.append(metricGroup('Delivery',[
    ['Spend','$186,420.55'],['Impressions','15,820,000'],['Clicks','12,610'],['CTR','0.080%'],['CPM','$11.78']
  ]));
  const platformMore=node('details','md-platform-more');
  const platformMoreSummary=node('summary');
  platformMoreSummary.append(node('strong','','Accounts and sales results'),node('span','','5,312 reached · 214 opportunities · 37 won'));
  platformMore.append(platformMoreSummary,
    metricGroup('Account activity',[
      ['Targeted accounts','6,400'],['Account coverage','83%','5,312 reached'],['Accounts to check','803','Check these account matches'],['Showing more interest','604']
    ]),
    metricGroup('CRM outcomes',[
      ['Opportunities reported','214'],['Won reported','37'],['Pipeline linked to ads','$0','Not available yet']
    ])
  );
  platform.append(platformMore,node('p','md-platform-note','Account totals can overlap across campaigns. Sales results are shown separately until Mojo can link them to ad activity.'));
  const combined=table(['Campaign','Type','Spend','Impressions','Ad clicks','CTR','Accounts reached','Accounts clicked','Accounts lifted'],reportedRows,'Reported campaign metrics');
  combined.classList.add('md-unified-wrap');
  const combinedTable=combined.querySelector('table');combinedTable.classList.add('md-unified-table');combinedTable.dataset.paginationManaged='true';
  combinedTable.querySelector('thead th:first-child').classList.add('md-lock-col');
  overview.replaceChildren(platform,header('Campaigns',`${allNames.length} Demandbase campaigns`),combined,
    node('p','md-footnote','Campaign totals come from Demandbase. Some campaign details are still missing.'));
  const pager=node('nav','mojo-table-pager');pager.setAttribute('aria-label','Campaign performance snapshot pages');
  const pagerSummary=node('span','mojo-table-pager-summary');pagerSummary.setAttribute('aria-live','polite');
  const pagerControls=node('div','mojo-table-pager-controls');
  const previous=node('button','', 'Previous'),next=node('button','', 'Next');previous.type=next.type='button';
  pagerControls.append(previous,next);pager.append(pagerSummary,pagerControls);combined.after(pager);

  // Platforms are ad products; channels describe how ads reach buyers.
  // The shared directory avoids blended CPM or conversion rates.
  const channelNav=node('div','md-source-tabs');
  channelNav.setAttribute('role','radiogroup');
  channelNav.setAttribute('aria-label','Filter campaigns by platform');
  const channelViews={};
  const channelTabs={};
  const channelNames=[['all','All platforms',null],['demandbase','Demandbase Ads','assets/demandbase.png'],['google','Google Ads','assets/google-ads.svg'],['linkedin','LinkedIn Ads','assets/linkedin.png']];
  const channelRows=[
    ...['GO Prep','Q4 Pipeline Search','Enterprise Retargeting'].map(name=>({name,channel:name==='Q4 Pipeline Search'?'Paid search':name==='Enterprise Retargeting'?'Retargeting':'Format unknown',platform:'Google Ads',spend:records.get(name)?.spent||'—',pace:records.get(name)?.pacing||'—',accounts:'',engaged:'',read:`Check ${records.get(name)?.remaining||'remaining budget'} before moving budget`,window:'Oct 30 snapshot'})),
    {name:'Q4 Enterprise Pipeline',channel:'Paid social',platform:'LinkedIn Ads',spend:'',pace:records.get('Q4 Enterprise Pipeline')?.pacing||'—',accounts:'',engaged:'',read:'Add LinkedIn campaign results',window:'Window unavailable'},
    ...reported.map(([name,type,spend,,,,reached,clicked])=>({name,channel:type==='ctv'?'CTV':'Display',platform:'Demandbase Ads',spend,pace:'',accounts:reached,engaged:clicked,read:'',window:'Oct 2–Nov 2'}))
  ];
  const directoryTable=(rows,label)=>{
    const wrap=node('div','md-table-wrap md-omni-wrap');
    const t=node('table','md-table md-omni-table');t.setAttribute('aria-label',label);
    t.innerHTML='<thead><tr><th scope="col">Campaign</th><th scope="col">Channels</th><th scope="col">Spend</th><th scope="col">Reached</th><th scope="col">Accounts clicked</th><th scope="col">Cost per account click</th><th scope="col">Next step</th></tr></thead>';
    const body=node('tbody');
    const platformIcons={'Google Ads':'assets/google-ads.svg','LinkedIn Ads':'assets/linkedin.png','Demandbase Ads':'assets/demandbase.png'};
    rows.forEach(row=>{
      const tr=node('tr');tr.dataset.channel=row.channel;
      const name=node('td');const link=node('a','md-row-link',row.name);link.href=`#campaign=${encodeURIComponent(row.name)}&tab=overview`;name.append(link);
      const platformCell=node('td','md-platform-icon-cell');
      const icon=node('img','md-platform-icon');icon.src=platformIcons[row.platform];icon.alt=row.platform;icon.title=row.platform;platformCell.append(icon);
      const cost=number(row.engaged)?money(number(row.spend)/number(row.engaged)):'—';
      const move=row.read||(number(row.engaged)&&number(row.accounts)?(number(row.engaged)/number(row.accounts)<.65?'Check audience and ads':'Test a wider audience'):'Review delivery');
      const action=node('td','md-next-move');action.append(node('span','',move));
      if(row.pace)action.append(node('small','md-next-move-context',`${row.pace} budget spent so far`));
      tr.append(name,platformCell,node('td','',row.spend||'—'),node('td','',row.accounts||'—'),node('td','',row.engaged||'—'),node('td','',cost),action);body.append(tr);
    });
    t.append(body);wrap.append(t);return wrap;
  };
  const omniView=node('section','md-channel-view md-omni-view');
  const omniHeader=header('Campaigns across platforms','');
  omniHeader.querySelector('span')?.remove();
  omniView.append(omniHeader,
    directoryTable(channelRows,'Campaigns across platforms'),
    node('p','md-footnote','A dash means that platform has not shared this result. Account totals can overlap across campaigns.'));
  // Use the same campaign picker pattern above the cross-platform directory.
  const omniScope=node('div','mojo-scope-control md-scope-control md-omni-scope');
  const omniTrigger=node('button','mojo-scope-chip mojo-scope-editable md-scope-trigger');
  omniTrigger.type='button';omniTrigger.setAttribute('aria-haspopup','dialog');omniTrigger.setAttribute('aria-expanded','false');omniTrigger.setAttribute('aria-controls','md-omni-scope-menu');
  omniTrigger.innerHTML=`<span class="mojo-filter-icon" role="img" aria-label="Filter by"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 20a1 1 0 0 0 .553.895l2 1A1 1 0 0 0 14 21v-7a2 2 0 0 1 .517-1.341L21.74 4.67A1 1 0 0 0 21 3H3a1 1 0 0 0-.742 1.67l7.225 7.989A2 2 0 0 1 10 14z"/></svg></span><strong>All campaigns</strong><small>${channelRows.length} campaigns</small><svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m4 6 4 4 4-4"/></svg>`;
  const omniMenu=node('div','mojo-scope-menu md-scope-menu');omniMenu.id='md-omni-scope-menu';omniMenu.hidden=true;omniMenu.setAttribute('role','dialog');omniMenu.setAttribute('aria-label','Choose campaigns');
  omniMenu.innerHTML=`<h3>Choose campaigns</h3><div class="mojo-scope-presets"><button class="mojo-scope-preset" type="button" data-omni-preset="all"><strong>All campaigns</strong><small>${channelRows.length} campaigns</small></button><button class="mojo-scope-preset" type="button" data-omni-preset="ended"><strong>Ended flights</strong><small>3 Google Ads records</small></button></div><p class="mojo-scope-list-label">Or choose campaigns</p><input class="mojo-scope-search" type="search" placeholder="Search campaigns" aria-label="Search campaigns"><div class="mojo-scope-campaigns"></div><div class="mojo-scope-footer"><span>${channelRows.length} campaigns available</span><div class="md-scope-footer-actions"><button type="button" class="md-clear-focus" disabled>Clear</button><button type="button" class="md-apply-focus" disabled>Show campaigns</button></div></div>`;
  omniScope.append(omniTrigger,omniMenu);omniView.prepend(omniScope);
  const omniSearch=omniMenu.querySelector('.mojo-scope-search'),omniList=omniMenu.querySelector('.mojo-scope-campaigns'),omniApply=omniMenu.querySelector('.md-apply-focus'),omniClear=omniMenu.querySelector('.md-clear-focus');
  let omniMode='all',omniSelected=new Set(),omniDraft=new Set(),omniPage=1;
  const omniInitiatives=window.MojoInitiativePicker?.(omniMenu,channelRows.map(row=>row.name),names=>{
    omniDraft=new Set(names);renderOmniChoices();
  },'.mojo-scope-list-label');
  const syncOmniActions=()=>{omniApply.disabled=!omniDraft.size;omniClear.disabled=!omniDraft.size;};
  const omniTable=omniView.querySelector('.md-omni-table');omniTable.dataset.paginationManaged='true';
  const omniRows=[...omniTable.querySelectorAll('tbody tr')];
  const omniPager=node('nav','mojo-table-pager');omniPager.setAttribute('aria-label','Campaigns across platforms pages');
  const omniPagerSummary=node('span','mojo-table-pager-summary');omniPagerSummary.setAttribute('aria-live','polite');
  const omniPagerControls=node('div','mojo-table-pager-controls'),omniPrevious=node('button','','Previous'),omniNext=node('button','','Next');
  omniPrevious.type=omniNext.type='button';omniPagerControls.append(omniPrevious,omniNext);omniPager.append(omniPagerSummary,omniPagerControls);omniTable.closest('.md-table-wrap').after(omniPager);
  const updateOmni=()=>{
    const shown=channelRows.filter(row=>omniMode==='all'||(omniMode==='ended'&&row.window==='Oct 30 snapshot')||(omniMode==='custom'&&omniSelected.has(row.name)));
    shown.sort((a,b)=>number(b.engaged)-number(a.engaged)||number(b.spend)-number(a.spend));
    if(omniMode==='all'){
      const groups=['Demandbase Ads','Google Ads','LinkedIn Ads'].map(platform=>shown.filter(row=>row.platform===platform));
      const ordered=[];
      while(groups.some(group=>group.length))groups.forEach(group=>{if(group.length)ordered.push(group.shift());});
      shown.splice(0,shown.length,...ordered);
    }
    const pageCount=Math.max(1,Math.ceil(shown.length/10));omniPage=Math.min(omniPage,pageCount);
    shown.forEach(row=>omniTable.tBodies[0].append(omniRows[channelRows.indexOf(row)]));
    omniRows.forEach((row,index)=>{const position=shown.indexOf(channelRows[index]);row.hidden=position<0||position<(omniPage-1)*10||position>=omniPage*10;});
    const title=omniMode==='all'?'All campaigns':omniMode==='ended'?'Ended flights':shown.length===1?shown[0].name:'Selected campaigns';
    const activePlatform=channelNames.find(([key])=>channelTabs[key]?.getAttribute('aria-checked')==='true')?.[1]||'All platforms';
    omniTrigger.querySelector('strong').textContent=title;omniTrigger.querySelector('small').textContent=activePlatform==='All platforms'?`All platforms · ${shown.length} named ${shown.length===1?'campaign':'campaigns'}`:activePlatform;
    omniTrigger.setAttribute('aria-label',`Choose campaigns and platform. ${title}. ${activePlatform}.`);
    const start=(omniPage-1)*10;omniPagerSummary.textContent=shown.length?`Rows per page 10 · Page ${omniPage} of ${pageCount} · ${start+1}–${Math.min(start+10,shown.length)} of ${shown.length}`:'Rows per page 10 · 0 of 0';
    omniPrevious.disabled=omniPage===1;omniNext.disabled=omniPage===pageCount;
    window.dispatchEvent(new CustomEvent('mojo:campaign-scope',{detail:{names:shown.map(row=>row.name)}}));
  };
  const renderOmniChoices=()=>{
    omniList.replaceChildren();const query=omniSearch.value.trim().toLowerCase();
    channelRows.filter(row=>`${row.name} ${row.platform} ${row.channel}`.toLowerCase().includes(query)).forEach(row=>{
      const choice=node('label','mojo-scope-campaign'),check=node('input');check.type='checkbox';check.checked=omniDraft.has(row.name);
      check.addEventListener('change',()=>{omniInitiatives?.clear();check.checked?omniDraft.add(row.name):omniDraft.delete(row.name);syncOmniActions();});
      const logo=node('span','mojo-scope-logo'),image=node('img');image.src={'Demandbase Ads':'assets/demandbase.png','Google Ads':'assets/google-ads.svg','LinkedIn Ads':'assets/linkedin.png'}[row.platform];image.alt='';logo.append(image);
      const copy=node('span');copy.append(node('strong','',row.name),node('small','',row.platform));choice.append(check,logo,copy);omniList.append(choice);
    });
    if(!omniList.children.length)omniList.append(node('p','','No campaigns match.'));
    syncOmniActions();
  };
  const closeOmni=()=>{omniMenu.hidden=true;omniTrigger.setAttribute('aria-expanded','false');};
  omniTrigger.addEventListener('click',()=>{if(!omniMenu.hidden){closeOmni();return;}omniDraft=new Set(omniSelected);omniSearch.value='';renderOmniChoices();omniMenu.hidden=false;omniTrigger.setAttribute('aria-expanded','true');omniSearch.focus();});
  omniSearch.addEventListener('input',renderOmniChoices);
  omniClear.addEventListener('click',()=>{omniDraft.clear();omniInitiatives?.clear();renderOmniChoices();omniSearch.focus();});
  omniApply.addEventListener('click',()=>{omniSelected=new Set(omniDraft);omniMode='custom';omniPage=1;selectSource('all',true);updateOmni();closeOmni();});
  omniMenu.querySelectorAll('[data-omni-preset]').forEach(button=>button.addEventListener('click',()=>{omniInitiatives?.clear();omniMode=button.dataset.omniPreset;omniSelected.clear();omniPage=1;selectSource('all',true);updateOmni();closeOmni();}));
  omniPrevious.addEventListener('click',()=>{if(omniPage>1){omniPage--;updateOmni();}});omniNext.addEventListener('click',()=>{omniPage++;updateOmni();});
  document.addEventListener('pointerdown',event=>{if(!omniMenu.hidden&&!omniScope.contains(event.target))closeOmni();});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!omniMenu.hidden){closeOmni();omniTrigger.focus();}});
  updateOmni();
  channelViews.all=omniView;
  channelViews.demandbase=demandbaseView;
  const googleView=node('section','md-channel-view');
  const googleRows=['GO Prep','Q4 Pipeline Search','Enterprise Retargeting'].map(name=>{
    const record=records.get(name);
    return [{name},record.spent,record.budget,record.remaining,record.pacing,'Ended Oct 31 · confirm final spend'];
  });
  googleView.append(header('Google Ads','3 campaigns · as of Oct 30'),node('p','md-channel-intro','Review spend against each flight budget before deciding what to move.'),table(['Campaign','Spend','Budget','Remaining','Budget used','Next step'],googleRows,'Google Ads flight metrics'),node('p','md-footnote','Check final spend before moving any remaining budget.'));
  channelViews.google=googleView;
  const linkedinView=node('section','md-channel-view');
  linkedinView.append(header('LinkedIn Ads','1 campaign'),node('p','md-channel-intro','Campaign spend and engagement are not available yet.'),directoryTable(channelRows.filter(row=>row.platform==='LinkedIn Ads'),'LinkedIn Ads campaigns'));
  channelViews.linkedin=linkedinView;
  channelNames.forEach(([key,label,logo])=>{
    const button=node('button','md-source-tab');button.type='button';button.id=`md-source-tab-${key}`;button.setAttribute('role','radio');button.setAttribute('aria-controls',`md-source-view-${key}`);
    if(logo){const image=node('img');image.src=logo;image.alt='';image.setAttribute('aria-hidden','true');button.append(image);}
    button.setAttribute('aria-label',label);button.title=label;
    if(key==='all')button.append(node('span','','All'));
    channelNav.append(button);channelTabs[key]=button;
    channelViews[key].id=`md-source-view-${key}`;channelViews[key].setAttribute('role','region');channelViews[key].setAttribute('aria-labelledby',button.id);
  });
  const addPlatform=node('details','md-add-platform');
  addPlatform.innerHTML='<summary aria-label="Add a platform" title="Add a platform"><svg aria-hidden="true" viewBox="0 0 20 20" focusable="false"><path d="M10 4v12M4 10h12"/></svg></summary><div class="md-add-platform-popover"><strong>Add a platform</strong><form><label for="md-new-platform">Platform name</label><input id="md-new-platform" name="platform" list="md-platform-suggestions" placeholder="e.g. Microsoft Ads" required maxlength="70"><datalist id="md-platform-suggestions"><option value="Microsoft Ads"><option value="Meta Ads"><option value="The Trade Desk"><option value="Amazon Ads"></datalist><button type="submit">Request connection</button></form><p role="status" aria-live="polite">New platforms appear in these filters after delivery data is connected.</p></div>';
  addPlatform.querySelector('form').addEventListener('submit',event=>{
    event.preventDefault();
    const name=addPlatform.querySelector('input').value.trim();
    if(!name)return;
    const status=addPlatform.querySelector('[role="status"]');
    if(channelNames.some(([,label])=>label.toLowerCase()===name.toLowerCase())){status.textContent=`${name} is already available in the filters.`;return;}
    try{
      const key='mojo-platform-connection-requests-v1';
      const requests=JSON.parse(localStorage.getItem(key)||'[]');
      if(!requests.some(item=>item.toLowerCase()===name.toLowerCase()))requests.push(name);
      localStorage.setItem(key,JSON.stringify(requests));
      status.textContent=`${name} added to setup requests. It will appear here once delivery data is connected.`;
    }catch{status.textContent=`${name} is ready to request, but this browser could not save it.`;}
  });
  const platformLabel=node('p','mojo-scope-list-label','Platforms');
  omniMenu.insertBefore(platformLabel,omniMenu.querySelector('.mojo-scope-list-label'));
  const platformChoices=node('div','md-platform-choices');
  platformChoices.append(channelNav,addPlatform);
  platformLabel.after(platformChoices);
  const selectSource=(key,updateHash=false)=>{
    if(!channelViews[key])key='all';
    channelNames.forEach(([name])=>{const active=name===key;channelViews[name].hidden=!active;channelTabs[name].setAttribute('aria-checked',String(active));channelTabs[name].tabIndex=active?0:-1;});
    if(updateHash&&!root.classList.contains('mf-goals-lens'))history.replaceState(null,'',key==='all'?'#campaigns':`#campaigns-${key}`);
  };
  channelNames.forEach(([key])=>channelTabs[key].addEventListener('click',()=>{selectSource(key,true);updateOmni();closeOmni();}));
  channelNav.addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
    event.preventDefault();const keys=channelNames.map(([key])=>key),current=keys.findIndex(key=>channelTabs[key].getAttribute('aria-checked')==='true');
    const next=event.key==='Home'?0:event.key==='End'?keys.length-1:(current+(event.key==='ArrowRight'?1:keys.length-1))%keys.length;
    selectSource(keys[next],true);updateOmni();channelTabs[keys[next]].focus();
  });
  demandbaseView.append(platform,overview.querySelector('.md-table-head'),combined,pager,overview.querySelector('.md-footnote'));
  overview.replaceChildren(omniView,demandbaseView,googleView,linkedinView);
  const dashboardTabs=root.querySelector('.mf-dashboard-tabs');
  if(dashboardTabs){dashboardTabs.before(omniScope);omniScope.after(root.querySelector('.mf-dashboard-range'));}
  else overview.prepend(omniScope);
  selectSource(location.hash.match(/^#campaigns-(demandbase|google|linkedin)$/)?.[1]||'all');
  updateOmni();
  window.addEventListener('hashchange',()=>{if(/^#campaigns(?:-(?:demandbase|google|linkedin))?$/.test(location.hash)){selectSource(location.hash.match(/^#campaigns-(demandbase|google|linkedin)$/)?.[1]||'all');updateOmni();}});

  // Comparison uses the same campaign rows, with a common metric set across platforms.
  const compareSelection=new Set();
  const compareBar=node('div','md-compare-bar');compareBar.hidden=true;
  const compareCount=node('span','md-compare-count');
  const compareAction=node('button','md-compare-action','Compare');compareAction.type='button';
  const compareClear=node('button','md-compare-clear','Clear');compareClear.type='button';
  compareBar.append(compareCount,compareAction,compareClear);omniView.before(compareBar);
  const comparePanel=node('section','md-compare-panel');comparePanel.hidden=true;comparePanel.setAttribute('aria-label','Campaign comparison');compareBar.after(comparePanel);
  const compareRecord=name=>{
    const reportedRow=reported.find(row=>row[0]===name);
    const directoryRow=channelRows.find(row=>row.name===name);
    const record=records.get(name)||{};
    return {name,platform:directoryRow?.platform||record.platform||'Demandbase Ads',
      spend:number(reportedRow?.[2]||record.spent),budget:number(record.budget),remaining:number(record.remaining),pacing:record.pacing||'—',
      impressions:number(reportedRow?.[3]||record.impressions),clicks:number(reportedRow?.[4]||record.clicks),
      reached:number(reportedRow?.[6]||record.reached),engaged:number(reportedRow?.[7]||record.clickedAccounts),
      ctr:reportedRow?.[5]||record.ctr||'—'};
  };
  const comparisonValue=(value,format='number')=>value?format==='money'?money(value):Number(value).toLocaleString('en-US'):'—';
  const renderComparison=(first,second,kind='campaign')=>{
    const a=compareRecord(first),b=kind==='campaign'?compareRecord(second):null;
    const samePlatform=!!b&&a.platform===b.platform;
    comparePanel.replaceChildren();comparePanel.hidden=false;
    const head=node('div','md-compare-head');
    const title=node('div');title.append(node('span','md-platform-kicker','CAMPAIGN COMPARISON'),node('h2','',kind==='campaign'?`${a.name} vs ${b.name}`:kind==='period'?`${a.name} vs previous period`:`${a.name} vs benchmark`));
    const close=node('button','md-compare-close','Close');close.type='button';close.addEventListener('click',()=>{comparePanel.hidden=true;});head.append(title,close);comparePanel.append(head);
    const description=node('p','md-compare-description',kind==='campaign'?`${samePlatform?a.platform:'Cross-platform'} · same reporting window where available`:'Comparison baseline is not available in the supplied campaign records.');comparePanel.append(description);
    if(b&&a.spend&&b.spend){
      const lead=a.spend>=b.spend?a:b,lower=lead===a?b:a;
      comparePanel.append(node('p','md-compare-finding',`${lead.name} spent ${money(lead.spend-lower.spend)} more than ${lower.name}. Compare reach and engagement below before changing budget.`));
    }
    const grid=node('div','md-compare-grid');
    const columns=[['Measure',null], [a.name,a], [kind==='campaign'?b.name:kind==='period'?'Previous period':'Benchmark',b]];
    columns.forEach(([label])=>grid.append(node('strong','md-compare-grid-heading',label)));
    const row=(label,left,right)=>{grid.append(node('span','md-compare-metric',label),node('span','md-compare-value',left),node('span','md-compare-value',right));};
    row('Platform',a.platform,b?.platform||'—');
    row('Spend',comparisonValue(a.spend,'money'),b?comparisonValue(b.spend,'money'):'—');
    if(a.budget||b?.budget)row('Budget',comparisonValue(a.budget,'money'),b?comparisonValue(b.budget,'money'):'—');
    if(a.remaining||b?.remaining)row('Remaining',comparisonValue(a.remaining,'money'),b?comparisonValue(b.remaining,'money'):'—');
    if(a.pacing!=='—'||b?.pacing!=='—')row('Budget spent so far',a.pacing,b?.pacing||'—');
    if(a.reached||b?.reached)row('Accounts reached',comparisonValue(a.reached),b?comparisonValue(b.reached):'—');
    if(a.engaged||b?.engaged)row('Accounts clicked',comparisonValue(a.engaged),b?comparisonValue(b.engaged):'—');
    if(samePlatform){
      if(a.impressions||b.impressions)row('Impressions',comparisonValue(a.impressions),comparisonValue(b.impressions));
      if(a.clicks||b.clicks)row('Ad clicks',comparisonValue(a.clicks),comparisonValue(b.clicks));
      if(a.ctr!=='—'||b.ctr!=='—')row('CTR',a.ctr,b.ctr);
      if(a.impressions||b.impressions)row('CPM',a.impressions?money(a.spend/a.impressions*1000):'—',b.impressions?money(b.spend/b.impressions*1000):'—');
      if(a.clicks||b.clicks)row('CPC',a.clicks?money(a.spend/a.clicks):'—',b.clicks?money(b.spend/b.clicks):'—');
    }
    comparePanel.append(grid);
    if(b&&a.reached&&b.reached){
      const overlap=node('div','md-compare-overlap');
      const shared=Math.round(Math.min(a.reached,b.reached)*.38),firstOnly=a.reached-shared,secondOnly=b.reached-shared;
      overlap.append(node('h3','','Account overlap · sample join'),node('p','',`${shared.toLocaleString('en-US')} accounts reached by both · ${firstOnly.toLocaleString('en-US')} only by ${a.name} · ${secondOnly.toLocaleString('en-US')} only by ${b.name}`));
      const overlapBar=node('div','md-compare-overlap-bar');
      const total=shared+firstOnly+secondOnly;
      for(const [label,value,className] of [['First campaign only',firstOnly,'first'],['Both campaigns',shared,'shared'],['Second campaign only',secondOnly,'second']]){
        const segment=node('span',`md-compare-overlap-${className}`);segment.style.width=`${value/total*100}%`;segment.title=`${label}: ${value.toLocaleString('en-US')}`;overlapBar.append(segment);
      }
      overlap.append(overlapBar,node('p','md-compare-role-note','Buyer-role overlap needs person-level IDs before it can guide a buying-group decision.'));
      comparePanel.append(overlap);
    }
    comparePanel.append(node('p','md-compare-data-health',kind==='campaign'?'Data health · Campaign windows and account definitions may differ. Account overlap is illustrative, not an observed join. CRM progression and buyer-role overlap are unavailable; delivery metrics appear together only for the same platform.':'Data health · A prior-period or benchmark series is not in the supplied records. Add one to complete this comparison.'));
    comparePanel.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
  };
  const renderMultiComparison=names=>{
    const items=names.map(compareRecord),samePlatform=items.every(item=>item.platform===items[0].platform);
    comparePanel.replaceChildren();comparePanel.hidden=false;
    const head=node('div','md-compare-head'),title=node('div');title.append(node('span','md-platform-kicker','CAMPAIGN COMPARISON'),node('h2','',`${items.length} campaigns side by side`));
    const close=node('button','md-compare-close','Close');close.type='button';close.addEventListener('click',()=>comparePanel.hidden=true);head.append(title,close);comparePanel.append(head);
    comparePanel.append(node('p','md-compare-description',samePlatform?`${items[0].platform} · compare delivery within the same platform`:'Cross-platform · shared measures only'));
    const grid=node('div','md-compare-grid md-compare-grid-multi');grid.style.gridTemplateColumns=`minmax(120px,.7fr) repeat(${items.length},minmax(145px,1fr))`;
    grid.append(node('strong','md-compare-grid-heading','Measure'));items.forEach(item=>grid.append(node('strong','md-compare-grid-heading',item.name)));
    const row=(label,values)=>{grid.append(node('span','md-compare-metric',label));values.forEach(value=>grid.append(node('span','md-compare-value',value)));};
    row('Platform',items.map(item=>item.platform));row('Spend',items.map(item=>comparisonValue(item.spend,'money')));
    if(items.some(item=>item.reached))row('Accounts reached',items.map(item=>comparisonValue(item.reached)));
    if(items.some(item=>item.engaged))row('Accounts clicked',items.map(item=>comparisonValue(item.engaged)));
    if(samePlatform&&items.some(item=>item.impressions))row('Impressions',items.map(item=>comparisonValue(item.impressions)));
    if(samePlatform&&items.some(item=>item.ctr!=='—'))row('CTR',items.map(item=>item.ctr));
    comparePanel.append(grid);
    comparePanel.append(node('p','md-compare-data-health','Data health · Account-level shared and unique groups need joined account IDs for all selected campaigns. CRM progression is not attributed to individual campaigns. Same-platform delivery metrics appear only where supplied.'));
    comparePanel.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
  };
  const savedComparisons=node('div','md-saved-comparisons');savedComparisons.hidden=true;comparePanel.after(savedComparisons);
  const showSavedComparison=names=>{savedComparisons.hidden=false;savedComparisons.replaceChildren();const link=node('a','','Pinned comparison · '+names.map(name=>name.replace(/^2026-Q4-/,'')).join(' vs '));link.href=`#compare=${names.map(encodeURIComponent).join(',')}`;link.addEventListener('click',event=>{event.preventDefault();renderFocusedComparison(names);});savedComparisons.append(link);};
  const exitFocusedComparison=()=>{overview.classList.remove('md-comparing');comparePanel.hidden=true;updateCompareBar();history.pushState(null,'','#campaigns');omniScope.scrollIntoView({block:'start'});};
  const renderFocusedComparison=(names,writeUrl=true)=>{
    names=[...new Set(names)].filter(name=>channelRows.some(row=>row.name===name)).slice(0,4);
    if(names.length<2){exitFocusedComparison();return;}
    compareSelection.clear();names.forEach(name=>compareSelection.add(name));
    overview.querySelectorAll('.md-compare-select input').forEach(input=>{input.checked=compareSelection.has(input.getAttribute('aria-label').replace(/^Select | for comparison$/g,''));});
    const items=names.map(compareRecord),samePlatform=items.every(item=>item.platform===items[0].platform);
    overview.classList.add('md-comparing');compareBar.hidden=true;comparePanel.hidden=false;comparePanel.replaceChildren();
    if(writeUrl)history.pushState(null,'',`#compare=${names.map(encodeURIComponent).join(',')}`);
    const back=node('button','md-compare-back','← All campaigns');back.type='button';back.addEventListener('click',exitFocusedComparison);comparePanel.append(back);
    const head=node('div','md-compare-head'),title=node('div');title.append(node('span','md-platform-kicker','CAMPAIGN COMPARISON'),node('h2','',`Compare ${items.length} campaigns`));head.append(title);
    const utilities=node('div','md-compare-utilities');
    const addCanvas=node('button','md-compare-close','Add to canvas');addCanvas.type='button';addCanvas.addEventListener('click',()=>{const saved={names,createdAt:new Date().toISOString()};localStorage.setItem('mojo-canvas-campaign-comparison-v1',JSON.stringify(saved));showSavedComparison(names);addCanvas.textContent='Added to canvas';});
    const share=node('button','md-compare-close','Share');share.type='button';share.addEventListener('click',()=>document.dispatchEvent(new CustomEvent('mojo:open-share',{detail:{url:location.href}})));
    utilities.append(addCanvas,share);head.append(utilities);comparePanel.append(head);
    const chips=node('div','md-compare-chips');items.forEach(item=>{const chip=node('button','md-compare-chip',`${item.name} ×`);chip.type='button';chip.setAttribute('aria-label',`Remove ${item.name} from comparison`);chip.addEventListener('click',()=>renderFocusedComparison(names.filter(name=>name!==item.name)));chips.append(chip);});
    if(names.length<4){const add=node('select','md-compare-add');add.setAttribute('aria-label','Add campaign to comparison');add.append(node('option','','+ Add campaign'));for(const row of channelRows.filter(row=>!names.includes(row.name))){const option=node('option','',row.name);option.value=row.name;add.append(option);}add.addEventListener('change',()=>{if(add.value)renderFocusedComparison([...names,add.value]);});chips.append(add);}comparePanel.append(chips);
    const read=node('div','md-compare-read');read.append(node('strong','','Next step'));
    const withRemaining=items.every(item=>item.remaining&&item.budget);
    const withAccountClicks=items.every(item=>item.engaged&&item.spend);
    let finding='Compare the available delivery measures, then connect account and CRM outcomes before reallocating spend.';
    if(withRemaining){const remaining=items.reduce((sum,item)=>sum+item.remaining,0);finding=`These ended flights had ${money(remaining)} remaining at the snapshot. Confirm final spend before reallocating; compare conversion events in the same window.`;}
    else if(withAccountClicks){const ranked=[...items].sort((a,b)=>a.spend/a.engaged-b.spend/b.engaged);finding=`${ranked[0].name} had the lowest cost per clicked account (${money(ranked[0].spend/ranked[0].engaged)}). Test whether that advantage holds for the same audience and window before scaling.`;}
    read.append(node('p','',finding));const draft=node('button','md-compare-action','Draft review task');draft.type='button';draft.addEventListener('click',()=>{localStorage.setItem('mojo-campaign-comparison-task-v1',JSON.stringify({names,finding,createdAt:new Date().toISOString()}));draft.textContent='Review task saved';draft.disabled=true;});read.append(draft,node('small','','Confidence: medium · campaign-level CRM attribution unavailable'));comparePanel.append(read);
    if(samePlatform){const common=[];if(items.every(item=>item.budget&&item.budget===items[0].budget))common.push(`${money(items[0].budget)} budget`);common.push(items[0].platform);if(common.length)comparePanel.append(node('p','md-compare-common',`Same for all: ${common.join(' · ')}`));}
    const metric=(label,selector,format='number')=>{const values=items.map(selector);if(values.some(value=>!value||value==='—'))return null;return {label,values,format};};
    const sections=[['Delivery',[metric('Spend',item=>item.spend,'money'),metric('Budget used',item=>number(item.pacing),'percent'),samePlatform?metric('Ad clicks',item=>item.clicks):null,samePlatform?metric('CTR',item=>number(item.ctr),'ctr'):null,samePlatform?metric('Cost per click',item=>item.clicks?item.spend/item.clicks:0,'money'):null]],['Accounts',[metric('Accounts reached',item=>item.reached),metric('Accounts clicked',item=>item.engaged),metric('Cost per clicked account',item=>item.engaged?item.spend/item.engaged:0,'money')]]];
    const formatValue=(value,format)=>format==='money'?money(value):format==='percent'?`${value}%`:format==='ctr'?`${value.toFixed(3)}%`:Math.round(value).toLocaleString('en-US');
    sections.forEach(([label,rows])=>{const available=rows.filter(Boolean);if(!available.length)return;const section=node('section','md-compare-section');section.append(node('h3','',label));const grid=node('div','md-compare-diff-grid');grid.style.setProperty('--compare-count',items.length);grid.append(node('strong','','Measure'));items.forEach(item=>grid.append(node('strong','',item.name)));grid.append(node('strong','','Difference'));available.forEach(row=>{grid.append(node('span','',row.label));const max=Math.max(...row.values),min=Math.min(...row.values);row.values.forEach(value=>{const cell=node('span','md-compare-visual');cell.append(node('b','',formatValue(value,row.format)));const track=node('i','');track.style.setProperty('--bar-width',`${Math.max(5,value/max*100)}%`);cell.append(track);grid.append(cell);});const direction=row.label.startsWith('Cost')?'lower':'higher',index=row.label.startsWith('Cost')?row.values.indexOf(min):row.values.indexOf(max),shortName=items[index].name.replace(/^2026-Q4-/,'');grid.append(node('span','md-compare-delta',max===min?'≈ same':`${formatValue(max-min,row.format)} ${direction} · ${shortName}`));});section.append(grid);comparePanel.append(section);});
    const accountVisual=node('section','md-account-visual');
    accountVisual.append(node('h3','','Account reach → response'),node('p','','Clicked accounts within reached accounts, shown on one common scale.'));
    const bars=node('div','md-account-journeys');
    const maxReached=Math.max(...items.map(item=>item.reached),1);
    items.forEach(item=>{
      const line=node('div','md-account-journey');
      line.append(node('strong','',item.name.replace(/^2026-Q4-/,'')));
      if(item.reached&&item.engaged){
        const track=node('div','md-account-journey-track');track.style.width=`${Math.max(8,item.reached/maxReached*100)}%`;
        const clicked=node('span','md-account-journey-clicked');clicked.style.width=`${Math.min(100,item.engaged/item.reached*100)}%`;track.append(clicked);
        line.append(track,node('small','',`${item.engaged.toLocaleString('en-US')} clicked / ${item.reached.toLocaleString('en-US')} reached · ${Math.round(item.engaged/item.reached*100)}%`));
      }else line.append(node('span','md-account-journey-empty','Account join needed'));
      bars.append(line);
    });
    accountVisual.append(bars,node('p','md-account-legend','■ Accounts clicked   ▫ Reached, no click recorded'));
    if(items.length===2&&items.every(item=>item.reached)){
      const shared=Math.round(Math.min(...items.map(item=>item.reached))*.38);
      const leftOnly=items[0].reached-shared,rightOnly=items[1].reached-shared,total=leftOnly+shared+rightOnly;
      const overlap=node('div','md-account-overlap');
      overlap.append(node('strong','','Shared and unique reach · illustrative sample'),node('p','','A modeled account join for this prototype; replace these values with matched account IDs before making a budget decision.'));
      const stack=node('div','md-account-overlap-stack');
      [[leftOnly,'first'],[shared,'shared'],[rightOnly,'second']].forEach(([value,kind])=>{const segment=node('span',`md-account-overlap-${kind}`,value.toLocaleString('en-US'));segment.style.width=`${value/total*100}%`;stack.append(segment);});
      overlap.append(stack);
      const legend=node('div','md-account-overlap-legend');
      [[leftOnly,`${items[0].name.replace(/^2026-Q4-/,'')} only`],[shared,'Both campaigns'],[rightOnly,`${items[1].name.replace(/^2026-Q4-/,'')} only`]].forEach(([value,label])=>legend.append(node('span','',`${value.toLocaleString('en-US')} ${label}`)));
      overlap.append(legend);accountVisual.append(overlap);
    }
    comparePanel.append(accountVisual);
    const accountGap=node('div','md-compare-gap');accountGap.append(node('strong','','Buying-group roles'),node('p','','Person-level role coverage needs a joined contact record before it can be compared across campaigns.'));comparePanel.append(accountGap);
    comparePanel.append(node('p','md-compare-data-health',`Data health · ${samePlatform?'Delivery measures use one platform.':'Cross-platform view uses only portable measures.'} Campaign account joins and opportunity attribution are unavailable. Missing rows are hidden until their sources are connected.`));
    comparePanel.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
  };
  const updateCompareBar=()=>{const count=compareSelection.size;compareBar.hidden=count===0;compareCount.textContent=count===1?'1 campaign selected · choose 1–3 more':`${count} campaigns selected`;compareAction.disabled=count<2||count>4;};
  for(const view of [omniView,demandbaseView,googleView,linkedinView]){
    view.querySelectorAll('.md-table tbody tr').forEach(row=>{
      const name=row.dataset.campaignName||row.querySelector('.md-row-link')?.textContent;
      if(!name||!channelRows.some(item=>item.name===name))return;
      const cell=row.querySelector('td');if(!cell)return;
      const label=node('label','md-compare-select'),input=node('input');input.type='checkbox';input.setAttribute('aria-label',`Select ${name} for comparison`);input.checked=compareSelection.has(name);
      input.addEventListener('change',()=>{
        if(input.checked&&compareSelection.size>=4){input.checked=false;return;}
        input.checked?compareSelection.add(name):compareSelection.delete(name);
        overview.querySelectorAll('.md-compare-select input').forEach(other=>{if(other!==input&&other.getAttribute('aria-label')===input.getAttribute('aria-label'))other.checked=input.checked;});
        updateCompareBar();
      });
      label.append(input);cell.prepend(label);
    });
  }
  compareAction.addEventListener('click',()=>{if(compareSelection.size>=2&&compareSelection.size<=4)renderFocusedComparison([...compareSelection]);});
  compareClear.addEventListener('click',()=>{compareSelection.clear();overview.querySelectorAll('.md-compare-select input').forEach(input=>input.checked=false);if(overview.classList.contains('md-comparing'))exitFocusedComparison();updateCompareBar();});
  const compareFromHash=()=>{const match=location.hash.match(/^#compare=(.+)$/);if(match){try{renderFocusedComparison(match[1].split(',').map(decodeURIComponent),false);}catch{exitFocusedComparison();}}else if(overview.classList.contains('md-comparing')){overview.classList.remove('md-comparing');comparePanel.hidden=true;updateCompareBar();}};
  window.addEventListener('hashchange',compareFromHash);if(location.hash.startsWith('#compare='))compareFromHash();
  try{const saved=JSON.parse(localStorage.getItem('mojo-canvas-campaign-comparison-v1')||'null');if(Array.isArray(saved?.names)&&saved.names.length>=2)showSavedComparison(saved.names);}catch{}

  // One picker for the Campaigns lens; the existing tables remain the source of displayed rows.
  const scope=node('div','mojo-scope-control md-scope-control');
  const trigger=node('button','mojo-scope-chip mojo-scope-editable md-scope-trigger');
  trigger.type='button';trigger.setAttribute('aria-haspopup','dialog');trigger.setAttribute('aria-expanded','false');trigger.setAttribute('aria-controls','md-scope-menu');
  trigger.innerHTML='<span class="mojo-filter-icon" role="img" aria-label="Filter by"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 20a1 1 0 0 0 .553.895l2 1A1 1 0 0 0 14 21v-7a2 2 0 0 1 .517-1.341L21.74 4.67A1 1 0 0 0 21 3H3a1 1 0 0 0-.742 1.67l7.225 7.989A2 2 0 0 1 10 14z"/></svg></span><strong>All campaigns</strong><small>26 scenario rows</small><svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m4 6 4 4 4-4"/></svg>';
  const menu=node('div','mojo-scope-menu md-scope-menu');menu.id='md-scope-menu';menu.hidden=true;menu.setAttribute('role','dialog');menu.setAttribute('aria-label','Choose campaigns');
  menu.innerHTML='<h3>Choose campaigns</h3><div class="mojo-scope-presets"></div><div class="md-channel-filter" role="group" aria-label="Ad format"><span>Ad format</span><div class="md-channel-options"></div></div><p class="mojo-scope-list-label">Or choose campaigns</p><input class="mojo-scope-search" type="search" placeholder="Search campaigns" aria-label="Search campaigns"><div class="mojo-scope-campaigns"></div><div class="mojo-scope-footer"><span>26 scenario rows available</span><div class="md-scope-footer-actions"><button type="button" class="md-clear-focus" disabled>Clear</button><button type="button" class="md-apply-focus" disabled>Show campaigns</button></div></div>';
  scope.append(trigger,menu);
  const subtabs=campaigns.querySelector('.mc-subtabs');
  // The shared campaign picker includes platform choice and is the single visible filter.
  subtabs?.remove();
  campaigns.querySelector('#mc-budget-panel')?.remove();
  campaigns.querySelector('#mc-performance-panel')?.remove();
  overview.hidden=false;
  overview.removeAttribute('role');overview.removeAttribute('aria-labelledby');
  if(/^#dashboard-(budget|performance)$/.test(location.hash))history.replaceState(null,'','#dashboard-overview');
  menu.querySelector('.mojo-scope-footer span').textContent=`${allNames.length} scenario campaigns available`;
  const presets=[['all','All campaigns',`${allNames.length} scenario campaigns`]];
  const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
  let motionReady=false;
  function drawVisiblePacing(){
    if(reducedMotion.matches)return;
    for(const panel of [demandbaseView]){
      if(!panel.getClientRects().length)continue;
      [...panel.querySelectorAll('.md-table tbody tr:not([hidden]) .md-pace-fill')].forEach((bar,index)=>{
        bar.animate([{transform:'scaleX(0)'},{transform:'scaleX(1)'}],{duration:460,delay:Math.min(index,7)*28,easing:'cubic-bezier(.2,.8,.2,1)'});
      });
    }
  }
  let mode='all',selected=new Set(),draft=new Set(),channel='all',currentPage=1;
  const presetButtons={};
  presets.forEach(([key,label,detail])=>{const button=node('button','mojo-scope-preset');button.type='button';button.innerHTML=`<strong>${label}</strong><small>${detail}</small>`;button.addEventListener('click',()=>{mode=key;selected.clear();applyScope();closeMenu();});menu.querySelector('.mojo-scope-presets').append(button);presetButtons[key]=button;});
  const channelButtons={};
  [['all','All formats'],['display','Display'],['ctv','CTV']].forEach(([key,label])=>{
    const button=node('button','md-channel-option',label);button.type='button';button.setAttribute('aria-pressed',String(channel===key));
    button.addEventListener('click',()=>{channel=key;Object.entries(channelButtons).forEach(([value,item])=>item.setAttribute('aria-pressed',String(value===channel)));applyScope();renderChoices();});
    menu.querySelector('.md-channel-options').append(button);channelButtons[key]=button;
  });
  const search=menu.querySelector('.mojo-scope-search'),list=menu.querySelector('.mojo-scope-campaigns'),apply=menu.querySelector('.md-apply-focus'),clear=menu.querySelector('.md-clear-focus');
  const dbInitiatives=window.MojoInitiativePicker?.(menu,allNames,names=>{
    draft=new Set(names);renderChoices();
  },'.md-channel-filter');
  const syncActions=()=>{apply.disabled=draft.size===0;clear.disabled=draft.size===0;};
  const renderChoices=()=>{
    list.replaceChildren();const query=search.value.trim().toLowerCase();
    allNames.filter(name=>(channel==='all'||reportedType.get(name)===channel)&&`${name} ${reportedType.get(name)||''}`.toLowerCase().includes(query)).forEach(name=>{
      const row=node('label','mojo-scope-campaign'),check=node('input');check.type='checkbox';check.checked=draft.has(name);
      check.addEventListener('change',()=>{dbInitiatives?.clear();if(check.checked)draft.add(name);else draft.delete(name);syncActions();});
      const logo=node('span','mojo-scope-logo');
      const image=node('img');image.src='assets/demandbase.png';image.alt='';logo.title='Demandbase Ads';logo.append(image);
      const copy=node('span');copy.append(node('strong','',name),node('small','',reportedType.get(name).toUpperCase()));row.append(check,logo,copy);list.append(row);
    });
    if(!list.children.length)list.append(node('p','','No campaigns match.'));
    syncActions();
  };
  const closeMenu=()=>{menu.hidden=true;trigger.setAttribute('aria-expanded','false');};
  trigger.addEventListener('click',()=>{
    if(!menu.hidden){closeMenu();return;}
    draft=new Set(selected);search.value='';renderChoices();
    Object.entries(presetButtons).forEach(([key,button])=>button.setAttribute('aria-pressed',String(mode===key)));
    menu.hidden=false;trigger.setAttribute('aria-expanded','true');search.focus();
  });
  search.addEventListener('input',renderChoices);
  clear.addEventListener('click',()=>{draft.clear();dbInitiatives?.clear();renderChoices();search.focus();});
  apply.addEventListener('click',()=>{selected=new Set(draft);mode='custom';applyScope();closeMenu();});
  document.addEventListener('pointerdown',event=>{if(!menu.hidden&&!scope.contains(event.target))closeMenu();});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!menu.hidden){closeMenu();trigger.focus();}});
  previous.addEventListener('click',()=>{if(currentPage>1){currentPage--;applyScope(false);}});
  next.addEventListener('click',()=>{currentPage++;applyScope(false);});
  function applyScope(resetPage=true){
    if(resetPage)currentPage=1;
    const names=mode==='all'?null:selected;
    const label=mode==='all'?'All campaigns':selected.size===1?[...selected][0]:'Selected campaigns';
    const channelLabel=channel==='all'?'All formats':channel.toUpperCase();
    const visible=reported.filter(row=>(!names||names.has(row[0]))&&(channel==='all'||row[1]===channel));
    trigger.querySelector('strong').textContent=label;
    trigger.querySelector('small').textContent=`${visible.length} ${visible.length===1?'campaign':'campaigns'} · ${channelLabel}`;
    trigger.setAttribute('aria-label',`Choose campaigns. ${label}. ${channelLabel}.`);
    const totals=visible.reduce((sum,row)=>{sum.spend+=number(row[2]);sum.impressions+=number(row[3]);sum.clicks+=number(row[4]);return sum;},{spend:0,impressions:0,clicks:0});
    const delivery=platform.querySelector('[data-group="delivery"]');
    const values=[money(totals.spend),totals.impressions.toLocaleString('en-US'),totals.clicks.toLocaleString('en-US'),totals.impressions?`${(totals.clicks/totals.impressions*100).toFixed(3)}%`:'—',totals.impressions?money(totals.spend/totals.impressions*1000):'—'];
    delivery.querySelectorAll('dd').forEach((cell,index)=>{cell.textContent=values[index];});
    platform.querySelector('.md-platform-kicker').textContent=channel==='all'&&mode==='all'?'DEMANDBASE ADS':'FILTERED DEMANDBASE ADS';
    platform.querySelector('.md-platform-note').textContent=channel==='all'&&mode==='all'?'Account totals can overlap across campaigns. Sales results are shown separately until Mojo can link them to ad activity.':'Delivery totals above reflect the selected campaigns and channel. Accounts and sales results below remain portfolio-wide; account counts can overlap across campaigns.';
    for(const panel of [demandbaseView]){
      const rows=[...panel.querySelectorAll('.md-table tbody tr[data-campaign-name]')];
      const matches=rows.filter(row=>(!names||names.has(row.dataset.campaignName))&&(channel==='all'||reportedType.get(row.dataset.campaignName)===channel));
      const shown=matches.length,pageSize=10,pageCount=Math.max(1,Math.ceil(shown/pageSize));
      currentPage=Math.min(currentPage,pageCount);
      rows.forEach(row=>{const index=matches.indexOf(row);row.hidden=index<0||index<(currentPage-1)*pageSize||index>=currentPage*pageSize;});
      const start=(currentPage-1)*pageSize;
      pagerSummary.textContent=shown?`Rows per page ${pageSize} · Page ${currentPage} of ${pageCount} · ${start+1}–${Math.min(start+pageSize,shown)} of ${shown}`:`Rows per page ${pageSize} · 0 of 0`;
      previous.disabled=currentPage===1;next.disabled=currentPage===pageCount;
      let empty=panel.querySelector('.md-scope-empty');
      if(!empty){empty=node('p','md-scope-empty');panel.querySelector('.md-table-wrap')?.after(empty);}
      empty.hidden=shown>0;empty.textContent='No campaign rows for this selection.';
      const meta=panel.querySelector('.md-table-head span');
      if(meta){
        const next=names||channel!=='all'?`${shown} ${shown===1?'row':'rows'} shown · ${channelLabel}`:`${allNames.length} Demandbase campaigns`;
        if(meta.textContent!==next){meta.textContent=next;if(motionReady&&!reducedMotion.matches&&panel.getClientRects().length)meta.animate([{opacity:.45,transform:'translateY(3px)'},{opacity:1,transform:'translateY(0)'}],{duration:260,easing:'ease-out'});}
      }
    }
    if(motionReady)requestAnimationFrame(drawVisiblePacing);
  }
  applyScope();
  motionReady=true;
  if('IntersectionObserver' in window){
    const barObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
      if(entry.isIntersecting){barObserver.unobserve(entry.target);drawVisiblePacing();}
    }),{threshold:.15});
    barObserver.observe(demandbaseView.querySelector('.md-table-wrap'));
  }else requestAnimationFrame(drawVisiblePacing);

  const accounts=root.querySelector('#mojo-accounts-portfolio');
  if(accounts){
    const oldHead=accounts.querySelector('.aq-head');
    oldHead?.remove();
    const quick=accounts.querySelector('.aq-quick');
    const accountHead=header('Accounts','340 account examples · 38 AI sourced');
    if(quick)quick.prepend(accountHead);else accounts.prepend(accountHead);
    accounts.querySelector('.aq-receipt')?.remove();
    quick?.querySelector('.aq-top-action')?.remove();
    const presets=quick?.querySelector('.aq-presets');
    if(presets){
      const view=node('label','md-account-view');
      view.textContent='View';
      const select=node('select');
      select.setAttribute('aria-label','Account view');
      for(const button of presets.querySelectorAll('[data-preset]')){
        const option=node('option','',button.textContent);
        option.value=button.dataset.preset;
        select.append(option);
      }
      select.value='ready';
      select.addEventListener('change',()=>presets.querySelector(`[data-preset="${select.value}"]`)?.click());
      view.append(select);
      presets.after(view);
      presets.hidden=true;
    }
    const filters=accounts.querySelector('.aq-advanced');
    if(filters&&quick){
      filters.querySelector('summary').textContent='Filters';
      const panel=node('div','md-account-filter-panel');
      for(const child of [...filters.children].filter(child=>child.tagName!=='SUMMARY'))panel.append(child);
      filters.append(panel);
      quick.append(filters);
    }
    accounts.querySelector('.aq-results')?.classList.add('md-account-results');
    const selectAll=accounts.querySelector('.aq-results button'); if(selectAll)selectAll.classList.add('md-select-all');
    accounts.querySelector('.aq-table-wrap')?.classList.add('md-table-wrap');
    accounts.querySelector('.aq-table')?.classList.add('md-table','md-entity-table','md-account-table');
    accounts.querySelector('.aq-table-wrap')?.after(node('p','md-footnote','Demandbase found 1,140 surging accounts. Named accounts, CRM details, channels, campaign memberships, and AI source joins are sample data. AI sources illustrate GA4 referrer and UTM evidence; channels show modeled targeting.'));
  }

  const creative=root.querySelector('#ia-panel-creative');
  if(creative){
    const compare=creative.querySelector('.cr-compare');
    if(compare){
      creative.prepend(compare);
      const oldHead=compare.querySelector('.cr-heading');
      const search=oldHead?.querySelector('.cr-search');
      oldHead?.replaceWith(header('Creatives','10 ad groups · Demandbase sample'));
      if(search){const toolbar=node('div','md-creative-toolbar');toolbar.append(search);compare.querySelector('.md-table-head')?.after(toolbar);}
      compare.querySelector('.cr-table-wrap')?.classList.add('md-table-wrap');
      compare.querySelector('.cr-table')?.classList.add('md-table','md-entity-table','md-creative-table');
    }
    const theme=creative.querySelector('.cr-theme-section');
    if(theme){const details=node('details','md-creative-extra'); details.append(node('summary','', 'Messaging themes'),theme); creative.append(details);}
    const tool=creative.querySelector('.mn-tool');
    if(tool){const details=node('details','md-creative-extra'); details.append(node('summary','', 'Draft replacement copy'),tool); creative.append(details);}
  }

  const drill=document.querySelector('.ia-campaign-workspace');
  if(drill){
    const cleanDetail=()=>{
      if(drill.hidden || !['overview','performance'].includes(drill.dataset.tab) || records.get(drill.dataset.campaign)?.platform==='Demandbase Ads')return;
      const body=drill.querySelector('.ia-campaign-content');
      if(!body || body.dataset.mdClean==='1')return;
      const name=drill.dataset.campaign, r=records.get(name), sample=examples[name];
      if(!r)return;
      body.dataset.mdClean='1';
      const rows=[];
      for(const [label,value] of [['Budget',r.budget],['Spend',r.spent],['Remaining',r.remaining],[['GO Prep','Q4 Pipeline Search','Enterprise Retargeting'].includes(name)?'Budget spent so far':'Pacing',r.pacing],['Impressions',r.impressions],['Ad clicks',r.clicks],['CTR',r.ctr],['Accounts reached',r.reached],['Accounts clicked',r.clickedAccounts],['Accounts marked lifted',r.liftedAccounts]]){
        if(value)rows.push([label,value,r.scenarioExport?'Revised scenario':'Source snapshot']);
      }
      if(sample){
        if(!r.budget && sample.budget)rows.unshift(['Budget',money(sample.budget),'Illustrative']);
        if(!r.spent)rows.push(['Spend',money(sample.spend),'Illustrative']);
        if(!r.remaining && sample.remaining)rows.push(['Remaining',money(sample.remaining),'Illustrative']);
        if(drill.dataset.tab==='performance' && !r.impressions)rows.push(['Impressions',new Intl.NumberFormat('en-US').format(sample.impressions),'Illustrative']);
        rows.push(['Clicks',new Intl.NumberFormat('en-US').format(sample.clicks),'Illustrative']);
        rows.push(['CTR',(sample.clicks/sample.impressions*100).toFixed(2)+'%','Illustrative']);
        rows.push(['Platform events',String(sample.conversions),'Illustrative · unverified']);
      }
      if(drill.dataset.tab==='performance' && sample){
        rows.push(['CPC',money(sample.spend/sample.clicks),'Illustrative']);
        rows.push(['CPM',money(sample.spend/sample.impressions*1000),'Illustrative']);
        rows.push(['Platform CPA',money(sample.spend/sample.conversions),'Illustrative · unverified events']);
      }
      const section=node('section','md-detail-summary');
      const title=drill.dataset.tab==='performance'?'Performance':'Campaign overview';
      section.append(header(title,r.scenarioExport?'Revised campaign scenario':'Oct 30 · sample data'),table(['Metric','Value'],rows.map(([label,value])=>[label,value]),`${name} ${title.toLowerCase()} metrics`));
      const funnel=node('div','md-campaign-funnel');
      funnel.setAttribute('aria-label','Campaign funnel');
      const spent=number(r.spent),reached=number(r.reached),engaged=number(r.clickedAccounts);
      [['Spend',spent?money(spent):'—'],['Reached',reached?reached.toLocaleString('en-US'):'Account join needed'],['Clicked',engaged?engaged.toLocaleString('en-US'):'Account join needed'],['Opportunity','CRM join needed']].forEach(([label,value])=>{const cell=node('div');cell.append(node('small','',label),node('strong','',value));funnel.append(cell);});
      section.append(node('p','md-detail-confidence',r.scenarioExport?'Spend and account reach are available. Sales impact is not yet linked to this campaign.':'Spend is available. Account reach and sales impact are not yet linked.'),funnel);
      const sourceLink=node('a','md-detail-source','Open source campaign table →');sourceLink.href=r.scenarioExport?'Portfolio.html#campaigns-demandbase':'Portfolio.html#campaigns-google';section.append(sourceLink);
      if(r.ctr&&r.scenarioExport)section.append(node('p','md-detail-benchmark',`${r.ctr} CTR · portfolio aggregate 0.080% for the same Demandbase scenario. Compare ad formats before treating this as a winner.`));
      if(r.budget&&r.spent){
        const used=Math.min(100,Math.round(number(r.spent)/number(r.budget)*100));
        const pace=node('div','md-flight-chart');pace.innerHTML=`<strong>Budget used</strong><div class="md-flight-track"><span style="width:${used}%"></span></div><small>${used}% of the budget has been spent.</small>`;
        section.append(pace);
      }
      if(drill.dataset.tab==='performance')section.append(node('p','md-detail-note',r.scenarioExport?'Scenario row allocations may be modeled. Budget and campaign-attributed pipeline were not supplied.':'Engagement numbers are illustrative. Platform events and pipeline return are unverified.'));
      const actions=node('div','md-detail-actions');
      const target=drill.dataset.tab==='overview'?'performance':'overview';
      const otherLink=node('a','',`${target==='overview'?'Overview':'Performance'} →`); otherLink.href=`#campaign=${encodeURIComponent(name)}&tab=${target}`;
      const tasksLink=node('a','', 'Tasks →'); tasksLink.href=`#campaign=${encodeURIComponent(name)}&tab=work`;
      actions.append(otherLink,tasksLink); section.append(actions);
      body.replaceChildren(section);
    };
    new MutationObserver(cleanDetail).observe(drill,{childList:true,subtree:true});
    cleanDetail();
  }
  if(location.hash.startsWith('#campaign='))window.dispatchEvent(new Event('hashchange'));
  reveal();
}))));
