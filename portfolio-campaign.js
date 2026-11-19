/* Campaign context inside Portfolio. Source values and demo scenarios stay separate. */
document.addEventListener('DOMContentLoaded', () => {
  const portfolio=document.querySelector('.ia-portfolio');
  if(!portfolio)return;
  const main=portfolio.parentElement;
  const known={
    'GO Prep':{platform:'Google Ads',read:'Oct 30 source snapshot · flight end Oct 31',pacing:'45%',spent:'$27,290',budget:'$60,000',remaining:'$32,710',flightEnd:'2026-10-31',group:'Three ending flights',finding:'The supplied Oct 30 snapshot shows 45% of budget spent before the Oct 31 flight end. Check performance before extending, shifting or reserving funds.',scope:'The $40k decision is shared across three campaigns; GO Prep alone has $32,710 remaining.'},
    'Q4 Pipeline Search':{platform:'Google Ads',read:'Oct 30 source snapshot · flight end Oct 31',pacing:'43%',spent:'$25,589',budget:'$60,000',remaining:'$34,411',flightEnd:'2026-10-31',group:'Three ending flights',finding:'The supplied Oct 30 snapshot shows 43% of budget spent before the Oct 31 flight end. The shared allocation needs review.',scope:'The shared $40k decision covers three campaigns.'},
    'Enterprise Retargeting':{platform:'Google Ads',read:'Oct 30 source snapshot · flight end Oct 31',pacing:'47%',spent:'$21,354',budget:'$45,000',remaining:'$23,646',flightEnd:'2026-10-31',group:'Three ending flights',finding:'The supplied Oct 30 snapshot shows 47% of budget spent before the Oct 31 flight end. The shared allocation needs review.',scope:'The shared $40k decision covers three campaigns.'},
    'MOF — Patient Payments':{platform:'Demandbase Ads',read:'Stalled delivery',pacing:'6%',group:'Q1 flight delivery',finding:'Reported delivery is stalled. The campaign owner needs to confirm whether this flight should remain live.'},
    'D&M_2026':{platform:'Demandbase Ads',read:'On track',pacing:'96%',budget:'$56,393',group:'Reported benchmark',finding:'Reported as a strong Demandbase campaign. Its 96% explorer pacing and 98.6% average pacing come from different source views. Pipeline return is not verified.'},
    'Q4 Enterprise Pipeline':{platform:'LinkedIn Ads',read:'On track',pacing:'91%'},
    'Commerce/Holiday 2026':{platform:'Demandbase Ads',read:'Check visit tag',pacing:'82%',clicked:'43.7%',interacted:'6.8%',group:'Tracking check',finding:'Clicks exceed site interaction. Check the landing-page visit tag and redirects before interpreting this as a creative problem.'}
  };
  const sampleCampaigns={
    'MOF - RCM - Q126':{budget:72000,spend:288,remaining:71712,impressions:21600,clicks:43,conversions:1,daily:[25,40,28,51,31,47,66],creative:['Revenue cycle display','Operations follow-up'],finding:'The source shows this flight at 0.4% pacing. Confirm targeting and bids before changing spend.',nextStep:'Ask the campaign owner to confirm audience size, bids and whether this flight should remain live.',tasks:['Confirm the flight is still needed','Check audience and bid limits']},
    'MOF — Patient Payments':{budget:82000,spend:4920,remaining:77080,impressions:174000,clicks:261,conversions:4,daily:[600,700,690,720,680,750,780],creative:['Patient payments display','Finance team follow-up'],finding:'The source shows stalled delivery at 6% pacing. Check campaign setup with the owner before changing spend.',nextStep:'Ask the campaign owner to check list size, bids and flight dates before changing spend.',tasks:['Confirm audience and bid limits','Decide whether to extend the flight']},
    'Q4 Pipeline Search':{budget:60000,spend:25589,remaining:34411,impressions:312000,clicks:4212,conversions:93,daily:[3400,3550,3640,3480,3780,3820,3919],creative:['Pipeline search ad A','Pipeline search ad B'],nextStep:'Review this flight alongside GO Prep and Enterprise Retargeting in the shared $40k decision.',tasks:['Review the shared $40k allocation','Check conversion definitions before approval']},
    'GO Prep':{budget:60000,spend:27290,remaining:32710,impressions:148400,clicks:1187,conversions:34,daily:[3600,3750,3890,3800,3970,4080,4200],creative:['GO Prep search ad A','GO Prep search ad B'],nextStep:'Review this flight alongside the other two ending flights in the shared $40k decision.',tasks:['Review the shared $40k allocation','Check conversion definitions before approval']},
    'Enterprise Retargeting':{budget:45000,spend:21354,remaining:23646,impressions:242000,clicks:1945,conversions:41,daily:[2800,2940,3050,3160,2980,3100,3324],creative:['Retargeting display A','Retargeting display B'],nextStep:'Review this flight alongside GO Prep and Q4 Pipeline Search in the shared $40k decision.',tasks:['Review the shared $40k allocation','Check conversion definitions before approval']}
  };
  window.MojoCampaignSamples=sampleCampaigns;
  const records=new Map(Object.entries(known));
  [
    ['MOF - RCM - Q126','Demandbase Ads','0.4%','Q1 flight delivery'],
    ['MANTL Banks_2026','Demandbase Ads','','Clicked but low interaction'],
    ['OLB Banks','Demandbase Ads','','Clicked but low interaction'],
    ["Q4'26 Corp & Ent",'Source not specified','','Clicked but low interaction'],
    ['OLB Banks (Rest of ICP)','Demandbase Ads','','Demandbase sample'],
    ['PPAR_Full ICP_2026','Demandbase Ads','','Demandbase sample'],
    ['AOS_Payments_General_2026','Demandbase Ads','','Demandbase sample'],
    ['OLB Banks (Rob & Bob)','Demandbase Ads','','Demandbase sample'],
    ['CU MANTL 2026','Demandbase Ads','','Demandbase sample'],
    ['CU MANTL & OLB 2026','Demandbase Ads','','Demandbase sample'],
    ['CU OLB 2026','Demandbase Ads','','Demandbase sample'],
    ["OLB Banks (Matt's Tier 1)",'Demandbase Ads','','Demandbase sample'],
    ['MOF - Mid-cycle','Demandbase Ads','','Q1 flight delivery'],
    ['MOF - Claims - Q126','Demandbase Ads','','Q1 flight delivery'],
    ['MOF - Denials - Q126','Demandbase Ads','','Q1 flight delivery'],
    ["TOFU Q4'26 Expansion",'Source not specified','','Q4 rule review'],
    ['Partner Co-marketing','Source not specified','','Q4 rule review'],
    ['Renewal Push','Source not specified','','Q4 rule review']
  ].forEach(([name,platform,pacing,group])=>{
    if(!records.has(name))records.set(name,{platform,pacing,group,read:group==='Q1 flight delivery'?'Stalled delivery':pacing?'No issues flagged':'More data needed',finding:'The source names this campaign, but this consolidated view has no campaign-level outcome or complete delivery record.'});
  });
  [
    ['Q4FY26_CSA_Signal_Path_CTV','$416.64','$3,672.78','12,626'],
    ['Q4FY26_CSA_Signal_Path_Display','$975.38','$6,708.38','88,804'],
    ['Q4FY26_CSA_Signal_Path_PreRoll','$517.71','$3,571.14','38,652'],
    ['Q3FY26_Aster_CTV','$10,238.03','$22,493.63','317,733'],
    ['Q3FY26_Aster_Personalization_Display','$20,921.63','$44,538.48','1,958,746'],
    ['Q3FY26_Aster_PreRoll','$10,438.32','$22,284.79','797,776'],
    ['Q4FY26_CSA_Cloud_Path_CTV','$6,757.70','$17,148.47','205,859'],
    ['Q4FY26_CSA_Cloud_Path_Display','$13,374.93','$28,436.81','1,225,908'],
    ['Q4FY26_CSA_Cloud_Path_PreRoll','$7,627.83','$16,261.50','572,093'],
    ['Q4FY26_CSA_Cloud_Path_Security_Display','$11,037.78','$23,773.39','963,624']
  ].forEach(([name,spent,remaining,impressions])=>records.set(name,{platform:'Demandbase Ads',read:'Selected reporting slice',spent,remaining,impressions,targeting:'Yes',selectedSlice:true,finding:'This named row has delivery data in the selected Demandbase slice, but no verified pipeline outcome or campaign-level creative mapping.'}));
  window.MojoCampaignRecords=records;
  const legacyRows=portfolio.querySelectorAll('.ia-source-detail table tbody tr');
  legacyRows.forEach(row=>{
    const cells=[...row.cells].map(cell=>cell.textContent.trim());
    const name=cells.find(cell=>records.has(cell));
    if(name)return;
    const candidate=cells.find(cell=>cell&&cell.length>3&&!/^(\$|\d|Google Ads|LinkedIn Ads|Demandbase Ads)/.test(cell));
    if(candidate&&!records.has(candidate)&&candidate.length<90) records.set(candidate,{platform:'Source not specified',read:'More data needed'});
  });
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const route=(name,tab='overview')=>`#campaign=${encodeURIComponent(name)}&tab=${tab}`;
  const drill=document.createElement('div');drill.className='ia-page ia-campaign-workspace';drill.hidden=true;main.append(drill);
  const tbody=portfolio.querySelector('#ia-campaign-rows');
  const originalRender=window.MutationObserver;
  const curated=new Set(Object.keys(known));
  const showAllButton=document.createElement('button');
  showAllButton.type='button';showAllButton.className='ia-show-campaigns';
  portfolio.querySelector('.ia-table-wrap').after(showAllButton);
  showAllButton.addEventListener('click',()=>{
    [...tbody.rows].forEach(row=>row.hidden=false);
    showAllButton.hidden=true;
    portfolio.querySelector('#ia-match-count').textContent=`${tbody.rows.length} named campaigns available.`;
  });
  const renderDirectory=()=>{
    const platform=portfolio.querySelector('#ia-platform').value;
    const query=portfolio.querySelector('#ia-search').value.trim().toLowerCase();
    let count=[...tbody.rows].length;
    for(const [name,r] of records){
      if(curated.has(name))continue;
      if(platform!=='all'&&platform!==r.platform)continue;
      if(query&&!`${name} ${r.platform||''} ${r.read||''} ${r.group||''}`.toLowerCase().includes(query))continue;
      const row=document.createElement('tr');
      [name,r.platform||'Source not specified',r.read||r.group||'More data needed',r.pacing||'—'].forEach(text=>{const td=document.createElement('td');td.textContent=text;row.append(td)});
      tbody.append(row);count++;
    }
    const compact=!query&&platform==='all'&&count>10;
    [...tbody.rows].forEach((row,index)=>row.hidden=compact&&index>=10);
    showAllButton.hidden=!compact;
    showAllButton.textContent=`Show all ${count} named campaigns ↓`;
    portfolio.querySelector('#ia-match-count').textContent=`${count} named campaigns available.`;
  };
  const linkRows=()=>{
    [...tbody?.rows||[]].forEach(row=>{
      const name=row.cells[0]?.textContent.trim();if(!records.has(name))return;
      const a=document.createElement('a');a.href=route(name);a.className='ia-campaign-link';a.textContent=name;
      row.cells[0].replaceChildren(a);row.classList.add('ia-campaign-row');
      row.onclick=e=>{if(!e.target.closest('a,button,input,select'))location.hash=route(name);};
    });
  };
  renderDirectory();linkRows();new originalRender(linkRows).observe(tbody,{childList:true});
  portfolio.querySelectorAll('#ia-platform,#ia-search,#ia-lens').forEach(control=>control.addEventListener('input',()=>{renderDirectory();linkRows();}));
  portfolio.querySelectorAll('.ia-bars>div>b').forEach(label=>{
    const name=label.textContent.trim();if(!records.has(name))return;
    const a=document.createElement('a');a.href=route(name);a.className='ia-campaign-link';a.textContent=name;label.replaceWith(a);
  });
  const sourceLinks=portfolio.querySelectorAll('.ia-source-detail a.campaign-name-link');
  sourceLinks.forEach(a=>{const name=a.textContent.trim();if(records.has(name))a.href=route(name);});
  const demoPerformance={
    'GO Prep':{spend:27290,impressions:148400,clicks:1187,conversions:34,daily:[810,760,880,830,960,900,1000]},
    'D&M_2026':{spend:54138,impressions:402500,clicks:3220,conversions:84,daily:[900,1050,1110,1030,1180,1260,1340]}
  };
  const sampleAccountPaths=[
    ['A-1042','Q4 Pipeline Search','Sep 9','Oct 18',4320,18400,42],
    ['A-2077','GO Prep','Sep 12','Oct 23',2780,12600,18],
    ['A-3181','Enterprise Retargeting','Sep 18','Oct 27',1950,9300,9],
    ['A-4026','D&M_2026','Sep 4','Oct 19',3620,14800,0],
    ['A-5083','Q4 Pipeline Search','Sep 14','Oct 25',3890,16200,31],
    ['A-6119','Enterprise Retargeting','Sep 21','Oct 29',2210,10800,13],
    ['A-7044','GO Prep','Sep 15','Oct 16',3180,13700,24],
    ['A-8156','D&M_2026','Sep 8','Oct 21',4140,17700,27],
    ['A-9271','Q4 Pipeline Search','Sep 19','Oct 30',3760,15400,34],
    ['A-1033','Enterprise Retargeting','Sep 22','Oct 24',1880,8700,12],
    ['A-1148','GO Prep','Sep 11','Oct 20',2960,12100,21],
    ['A-1265','D&M_2026','Sep 17','Oct 28',3450,14900,19]
  ];
  const money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:2}).format(n);
  const whole=n=>new Intl.NumberFormat('en-US').format(n);
  const value=(label,number,note='',hero=false)=>number?`<div><dt>${esc(label)}</dt><dd${hero?' class="ia-campaign-performance-stat"':''}>${esc(number)}</dd>${note?`<small>${esc(note)}</small>`:''}</div>`:'';
  const spendChart=values=>{
    const top=Math.ceil(Math.max(...values)*1.15/100)*100;
    const coords=values.map((n,i)=>[48+i*85,148-(n/top)*115]);
    const points=coords.map(([x,y])=>`${x},${y.toFixed(1)}`).join(' ');
    const circles=coords.map(([x,y])=>`<circle cx="${x}" cy="${y.toFixed(1)}" r="4"/>`).join('');
    return `<svg class="ia-campaign-chart" viewBox="0 0 600 180" role="img" aria-label="Illustrative daily spend, October 24 to 30: ${values.map(money).join(', ')}"><line x1="48" y1="148" x2="558" y2="148"/><line x1="48" y1="33" x2="558" y2="33"/><text x="4" y="37">${esc(money(top))}</text><text x="22" y="151">$0</text><polyline points="${points}"/>${circles}<text x="48" y="174">Oct 24</text><text x="510" y="174">Oct 30</text></svg>`;
  };
  const render=()=>{
    const params=new URLSearchParams(location.hash.slice(1));
    const name=params.get('campaign');const sourceRecord=records.get(name);const sample=sampleCampaigns[name]||null;const record=sourceRecord&&sample?{...sourceRecord,finding:sample.finding||sourceRecord.finding,scope:sample.nextStep}:sourceRecord;
    if(!record){
      drill.hidden=true;portfolio.hidden=false;
      drill.dataset.returnTo='';
      if(['campaigns','creative','accounts'].includes(location.hash.slice(1))){
        const lens=portfolio.querySelector('#ia-lens');
        lens.value=location.hash.slice(1);
        lens.dispatchEvent(new Event('input',{bubbles:true}));
      }
      return;
    }
    const returnToGoals=params.get('from')==='goals'||(drill.dataset.campaign===name&&drill.dataset.returnTo==='goals');
    drill.dataset.returnTo=returnToGoals?'goals':'';
    const requested=params.get('tab')||params.get('view');
    const isDemandbase=record.platform==='Demandbase Ads';
    const tab=isDemandbase?(['performance','influence','trends','publishers','creatives'].includes(requested)?requested:'performance'):requested==='performance'?'performance':requested==='accounts'?'accounts':['creative','creatives'].includes(requested)?'creatives':['activity','evidence'].includes(requested)?'evidence':['work','tasks'].includes(requested)?'work':'overview';
    const priorName=drill.dataset.campaign;
    const priorTab=drill.dataset.tab;
    const paint=()=>{
    portfolio.hidden=true;drill.hidden=false;
    drill.dataset.campaign=name;drill.dataset.tab=tab;
    const tabs=isDemandbase?[['performance','Performance'],['influence','Influence'],['trends','Trends'],['publishers','Publishers'],['creatives','Creatives']]:[['overview','Overview'],['performance','Performance'],['accounts','Accounts'],['creatives','Creatives'],['work','Tasks']];
    drill.classList.toggle('dbcd-workspace',isDemandbase);
    drill.innerHTML=`<a class="ia-campaign-back" href="#${returnToGoals?'goals':'campaigns'}">← ${returnToGoals?'Your initiatives':'All campaigns'}</a><header class="ia-pagehead ia-campaign-head"><h1>${esc(name)}</h1><p>${esc(record.platform)} · ${isDemandbase?'Campaign reporting':esc(record.read||'Named campaign in the supplied snapshot')}${!isDemandbase&&sample?' · Sample detail':''}</p></header><nav class="ia-tabs ia-campaign-tabs" aria-label="${esc(name)} views">${tabs.map(([id,label])=>`<a href="${route(name,id)}" class="${id===tab?'on':''}" ${id===tab?'aria-current="page"':''}>${label}</a>`).join('')}</nav><div class="ia-campaign-content"></div>`;
    const body=drill.querySelector('.ia-campaign-content');
    if(isDemandbase&&window.MojoDemandbaseDetail){window.MojoDemandbaseDetail.render({body,tab,name,record,sample});requestAnimationFrame(()=>{const pane=drill.closest('.canvaspane');if(pane)pane.scrollTop=0;window.scrollTo(0,0)});return;}
    if(tab==='overview'){
      const atGlance=[value('Spend',record.spent),value('Remaining',record.remaining),value('Pacing',record.pacing),value('Impressions',record.impressions),value('Ad clicks',record.clicks),value('Accounts reached',record.reached)].filter(Boolean).join('');
      body.innerHTML=`<div class="ia-campaign-lead"><div><span class="ia-campaign-label">MOJO’S READ</span><h2>${esc(record.group||record.read||'Campaign snapshot')}</h2><p>${esc(record.finding||'This named campaign appears in the supplied reporting slice. There is no campaign-specific finding recorded.')}</p></div><strong class="ia-campaign-hero-stat">${esc(record.pacing||'—')}</strong></div><div class="ia-campaign-next"><h2>What should happen next?</h2><p>${esc(record.scope||'Review the source values before making a campaign change. No campaign-level pipeline outcome is connected in this prototype.')}</p><a class="mc-btn primary" href="${route(name,'work')}">See next steps →</a><a class="ia-campaign-secondary-link" href="${route(name,'performance')}">View performance table →</a>${record.group==='Three ending flights'?'<a class="ia-campaign-secondary-link" href="HomeSystem.html#finding-flights">Open the $40k decision →</a>':''}</div>${atGlance?`<section class="ia-campaign-source"><div class="ia-campaign-section-head"><h3>Delivery at a glance</h3><span>Source snapshot · Oct 30</span></div><dl class="ia-campaign-metrics">${atGlance}</dl></section>`:''}`;
      const glance=body.querySelector('.ia-campaign-source');if(glance)body.querySelector('.ia-campaign-next').before(glance);
    }
    if(tab==='performance'){
      const sourceBasis=record.scenarioExport?'Revised scenario export':record.selectedSlice?'Selected source slice':record.flightEnd?'Oct 30 snapshot':'Supplied source';
      const sourceRows=[
        ['Budget',record.budget,sourceBasis],
        ['Spend',record.spent,sourceBasis],
        ['Remaining',record.remaining,sourceBasis],
        ['Pacing',record.pacing,sourceBasis],
        ['Impressions',record.impressions,sourceBasis],
        ['Ad clicks',record.clicks,sourceBasis],
        ['CTR',record.ctr,sourceBasis],
        ['Accounts reached',record.reached,sourceBasis],
        ['Accounts clicked',record.clickedAccounts,sourceBasis],
        ['Accounts lifted',record.liftedAccounts,sourceBasis],
        ['Clicked rate',record.clicked,'Source-defined'],
        ['Interacted rate',record.interacted,'Source-defined']
      ];
      const sourceSpend=Number(String(record.spent||'').replace(/[^0-9.]/g,''));
      const sourceImpressions=Number(String(record.impressions||'').replace(/[^0-9.]/g,''));
      if(sourceSpend&&sourceImpressions)sourceRows.push(['CPM',money(sourceSpend/sourceImpressions*1000),'Calculated from source']);
      const table=(rows,label)=>`<div class="ia-campaign-table-scroll"><table class="ia-campaign-performance-table"><caption>${esc(label)}</caption><thead><tr><th scope="col">Metric</th><th scope="col">Value</th><th scope="col">Basis</th></tr></thead><tbody>${rows.map(([metric,result,basis])=>`<tr><th scope="row">${esc(metric)}</th><td class="ia-campaign-performance-value">${esc(result||'—')}</td><td class="ia-campaign-performance-basis">${esc(result?basis:'Not supplied')}</td></tr>`).join('')}</tbody></table></div>`;
      const sampleRows=sample?[
        ['Spend',money(sample.spend),'Illustrative'],
        ['Impressions',whole(sample.impressions),'Illustrative'],
        ['Clicks',whole(sample.clicks),'Illustrative'],
        ['CTR',(sample.clicks/sample.impressions*100).toFixed(2)+'%','Clicks ÷ impressions'],
        ['CPC',money(sample.spend/sample.clicks),'Spend ÷ clicks'],
        ['CPM',money(sample.spend/sample.impressions*1000),'Spend ÷ impressions × 1,000'],
        ['Platform conversions',whole(sample.conversions),'Illustrative · unverified'],
        ['Platform CPA',money(sample.spend/sample.conversions),'Spend ÷ unverified events']
      ]:null;
      const sourceHasData=sourceRows.some(([,result])=>!!result);
      if(sourceHasData){for(let index=sourceRows.length-1;index>=0;index--)if(!sourceRows[index][1])sourceRows.splice(index,1);}
      body.innerHTML=`<div class="ia-campaign-performance-heading"><div><span class="ia-campaign-label">CAMPAIGN PERFORMANCE</span><h2>Performance</h2></div><span>${esc(record.platform)}</span></div><p class="ia-campaign-intro">The measures marketers use to review delivery, engagement, and outcomes for this campaign.</p><section class="ia-campaign-performance-block"><h3>Delivery</h3><p>Reported measures available for this campaign.</p>${table(sourceRows,'Source delivery metrics')}${sourceHasData?'':'<p class="ia-campaign-performance-note">This campaign is named in the source, but a campaign-level delivery record was not supplied.</p>'}</section><section class="ia-campaign-performance-block"><h3>Engagement and outcomes</h3>${sampleRows?`<p>Illustrative example for this campaign. These counts are separate from the source figures above.</p>${table(sampleRows,'Illustrative engagement and outcome metrics')}`:'<p>Clicks, CTR, CPC, conversions, CPA, and campaign-attributed pipeline were not supplied for this campaign.</p>'}</section><div class="ia-campaign-performance-foot"><strong>Pipeline return</strong><span>Unverified · requires matched CRM outcomes</span></div>`;
      if(sample)body.insertAdjacentHTML('beforeend',`<section class="ia-campaign-trend"><div class="ia-campaign-section-head"><h3>Daily spend</h3><span>Illustrative · Oct 24–30</span></div>${spendChart(sample.daily)}<p>This is a seven-day example, not a source trend or a plan-versus-actual forecast.</p></section>`);
    }
    if(tab==='accounts'){
      const accountMetrics=[
        ['Accounts reached',record.reached],
        ['Accounts clicked',record.clickedAccounts],
        ['Accounts marked lifted',record.liftedAccounts]
      ].filter(([,count])=>count);
      const paths=sampleAccountPaths.filter(([,campaign])=>campaign===name);
      const pathTable=paths.length?`<section class="ia-campaign-performance-block"><h3>Example account paths</h3><p>Illustrative scenario records for this campaign. An impression before an opportunity shows timing, not lift or attribution.</p><div class="ia-campaign-table-scroll"><table class="ia-campaign-performance-table ia-campaign-account-table"><caption>Example account paths for ${esc(name)}</caption><thead><tr><th scope="col">Account</th><th scope="col">First impression</th><th scope="col">Opportunity created</th><th scope="col">Spend</th><th scope="col">Impressions</th><th scope="col">Clicks</th></tr></thead><tbody>${paths.map(([account,,impression,opportunity,spend,impressions,clicks])=>`<tr><th scope="row">${esc(account)}</th><td>${esc(impression)}</td><td>${esc(opportunity)}</td><td>${money(spend)}</td><td>${whole(impressions)}</td><td>${whole(clicks)}</td></tr>`).join('')}</tbody></table></div></section>`:'';
      body.innerHTML=`<div class="ia-campaign-performance-heading"><div><span class="ia-campaign-label">CAMPAIGN ACCOUNTS</span><h2>Accounts</h2></div><span>${esc(record.platform)}</span></div>${accountMetrics.length?`<p class="ia-campaign-intro">Account totals reported for ${esc(name)}.</p><dl class="ia-campaign-metrics">${accountMetrics.map(([label,count])=>value(label,count)).join('')}</dl>`:''}${pathTable}<section class="ia-campaign-empty"><h3>${paths.length?'Connect the source account records':'Account-level detail'}</h3><p>${paths.length?'The example rows above are separate from the reported campaign totals. Link exposure and CRM records by account ID before claiming pipeline impact.':accountMetrics.length?'The supplied campaign data includes account totals, but no list of named accounts linked to this campaign.':'The supplied data does not link named account rows or account totals to this campaign.'}</p></section>`;
    }
    if(tab==='evidence'){
      const performanceSummary=record.flightEnd&&record.pacing
        ?{title:`${record.pacing} of budget used before flight end`,detail:`At the Oct 30 snapshot, ${record.remaining||'budget'} remained. The flight ended Oct 31; campaign-level pipeline return is not connected.`}
        :record.group==='Q1 flight delivery'&&record.pacing
          ?{title:`Only ${record.pacing} paced`,detail:'Delivery is stalled. Check targeting, bids and flight setup with the owner before changing spend.'}
          :record.clicked&&record.interacted
            ?{title:`${record.clicked} clicked; ${record.interacted} interacted`,detail:'The click-to-visit gap needs a tracking check before judging the creative or landing page.'}
            :record.group==='Reported benchmark'&&record.pacing
              ?{title:'Six engagement benchmarks cleared',detail:`The source explorer reports ${record.pacing} pacing. Compare similar campaigns before scaling; pipeline return is not verified.`}
          :record.pacing
              ?{title:`${record.pacing} paced in the source snapshot`,detail:'Delivery is visible, but observed campaign-level conversions and pipeline return are not linked here.'}
              :record.spent&&record.impressions
                ?{title:'Spend and impressions are available',detail:'Those measures support a CPM calculation. Clicks, conversions and a daily trend were not supplied for this campaign.'}
                :{title:'No campaign-level performance read yet',detail:'This campaign is named in the source, but delivery and outcome measures are not linked to it.'};
      body.innerHTML=`<div class="ia-campaign-evidence-head"><span class="ia-campaign-label">WHAT SUPPORTS THIS READ</span><h2>${esc(performanceSummary.title)}</h2><p class="ia-campaign-intro">${esc(performanceSummary.detail)}</p><a href="${route(name,'performance')}">View performance table →</a></div>`;
    }
    if(tab==='creatives'){
      const exampleCopy={
        'GO Prep':[['Get Ready for Your Next Growth Opportunity','Plan the next campaign with a clear path from interest to pipeline.'],['Turn Buying Signals Into Action','Reach the right accounts with a focused go-to-market plan.']],
        'Q4 Pipeline Search':[['Build a Stronger Q4 Pipeline','Connect with teams actively looking for a better way forward.'],['Reach Buyers Ready to Move','Put your solution in front of high-intent searches this quarter.']],
        'Enterprise Retargeting':[['Keep the Conversation Moving','Give buying teams a timely reason to return and learn more.'],['Stay Visible to Key Accounts','Reconnect with decision-makers already exploring your solution.']],
        'MOF - RCM - Q126':[['Make Revenue Cycle Work Simpler','Explore a more connected approach to healthcare operations.'],['Turn RCM Complexity Into Clarity','See how teams can remove friction from everyday workflows.']],
        'MOF — Patient Payments':[['A Simpler Way to Manage Payments','Create a smoother payment experience for patients and teams.'],['Make Every Payment Easier','Help staff and patients move through billing with confidence.']]
      };
      const titles=sample?.creative||[`${name} · concept A`,`${name} · concept B`];
      const copies=exampleCopy[name]||[[`${name}: explore the possibilities`,'See a clearer path from campaign interest to meaningful action.'],[`${name}: keep momentum going`,'Give your audience a useful next step at the right moment.']];
      const splitImpressions=sample?Math.round(sample.impressions*.6):0;
      const splitClicks=sample?Math.round(sample.clicks*.6):0;
      const search=record.platform==='Google Ads';
      const cards=titles.map((title,index)=>{
        const [headline,description]=copies[index]||copies[0];
        const preview=search
          ?`<div class="ia-creative-preview ia-creative-search"><div class="ia-creative-search-source"><strong>Sponsored</strong><span class="ia-creative-favicon" aria-hidden="true">M</span><span>example.com <small>example.com › solutions</small></span></div><div class="ia-creative-search-title">${esc(headline)}</div><p>${esc(description)} <span>Learn more</span></p></div>`
          :`<div class="ia-creative-preview ia-creative-display"><div class="ia-creative-display-brand"><span class="ia-creative-display-mark" aria-hidden="true">M</span> Example advertiser</div><div class="ia-creative-display-copy"><span>For teams ready to move forward</span><strong>${esc(headline)}</strong><p>${esc(description)}</p><span class="ia-creative-display-cta">Explore solutions <span aria-hidden="true">→</span></span></div></div>`;
        const metrics=sample?(()=>{const impressions=index?sample.impressions-splitImpressions:splitImpressions,clicks=index?sample.clicks-splitClicks:splitClicks;return `<dl class="ia-creative-metrics"><div><dt>Impressions</dt><dd>${whole(impressions)}</dd></div><div><dt>Clicks</dt><dd>${whole(clicks)}</dd></div><div><dt>CTR</dt><dd>${(clicks/impressions*100).toFixed(2)}%</dd></div></dl>`;})():'';
        return `<article class="ia-creative-card"><div class="ia-creative-card-head"><div><span>Example ${index+1}</span><h3>${esc(title)}</h3></div><small>${esc(record.platform)}</small></div>${preview}${metrics}</article>`;
      }).join('');
      body.insertAdjacentHTML('beforeend',`<section class="ia-campaign-evidence-creative"><div class="ia-creative-heading"><div><span class="ia-campaign-label">CAMPAIGN CREATIVES</span><h2>Creatives</h2><p>Illustrative copy and layouts for ${esc(name)}.</p></div><span class="ia-campaign-demo-badge">Sample creative</span></div><div class="ia-creative-grid">${cards}</div><p class="ia-creative-footnote">${sample?'Metrics shown are sample data.':'Actual creative assets and metrics are not connected yet.'}</p></section>`);
    }
    if(tab==='evidence'){
      const sourceLine=record.flightEnd?`The Oct 30 snapshot showed ${esc(record.pacing||'—')} pacing and ${esc(record.spent||'—')} spent. The flight ended Oct 31.`:record.pacing?`The source snapshot showed ${esc(record.pacing)} pacing.`:'This campaign appears in the named source list.';
      body.insertAdjacentHTML('beforeend',`<section class="ia-campaign-evidence-activity"><h2>Activity</h2><div class="ia-campaign-work-row"><span>Oct 30 · Source</span><div><strong>Campaign scan</strong><p>${sourceLine}</p></div></div>${sample?`<div class="ia-campaign-work-row"><span>Sample</span><div><strong>Example engagement record</strong><p>${whole(sample.impressions)} impressions, ${whole(sample.clicks)} clicks, ${whole(sample.conversions)} unverified conversions. These are illustrative, not an observed run.</p></div></div><div class="ia-campaign-work-row"><span>Next</span><div><strong>Suggested follow-up</strong><p>${esc(sample.nextStep)}</p></div></div>`:'<p class="ia-campaign-intro">No campaign-specific action history is connected.</p>'}</section>`);
    }
    if(tab==='work'){
      const choices=[...(sample&&record.group==='Q1 flight delivery'?[['owner','Request owner review']]:[]),...(record.flightEnd?[['extend','Extend flight']]:[]),...(record.budget?[['budget','Adjust total budget']]:[]),['pause','Draft a pause request']];
      body.innerHTML=`<h2>Next steps for ${esc(name)}</h2><div class="ia-campaign-work-row"><span>Finding</span><div><strong>${esc(record.group||'No campaign-specific finding recorded')}</strong><p>${esc(record.finding||'The supplied source does not include a finding for this campaign.')}</p></div></div><div class="ia-campaign-work-row"><span>Decision</span><div><strong>${record.group==='Three ending flights'?'Shared allocation review':'No campaign-specific approval recorded'}</strong><p>${esc(record.scope||'No live platform action is connected to this campaign record.')}</p>${record.group==='Three ending flights'?'<a href="HomeSystem.html#finding-flights">Open the $40k decision →</a>':''}</div></div><div class="ia-campaign-work-row"><span>Verification</span><div><strong>Outcome pending</strong><p>Check pipeline after a suitable lag and compare against similar accounts. Add the verified outcome here after the campaign has run.</p></div></div><section class="ia-campaign-action"><span class="ia-campaign-label">CAMPAIGN-SPECIFIC ACTION</span><h3>Draft a change to ${esc(name)}.</h3><p>Choose one change for this campaign. The preview is local and requires review; it does not update ${esc(record.platform)}.</p><form id="ia-campaign-action-form"><label>Change<select id="ia-campaign-change">${choices.map(([key,label])=>`<option value="${key}">${label}</option>`).join('')}</select></label><label class="ia-campaign-action-field" data-for="extend">New end date<input type="date" id="ia-campaign-end" value="2026-11-30"></label><label class="ia-campaign-action-field" data-for="budget">Proposed total budget<input type="number" id="ia-campaign-budget" min="1" step="1" value="${record.budget?Number(record.budget.replace(/[^0-9.]/g,''))+5000:''}"></label><div class="ia-campaign-diff" id="ia-campaign-diff"></div><button class="mc-btn primary" type="submit">Stage change for review →</button><p class="ia-campaign-action-status" role="status"></p></form></section>`;
      if(sample){
        const section=document.createElement('section');section.className='ia-campaign-sample-tasks';
        section.innerHTML=`<h3>Next steps <span class="ia-campaign-demo-badge">Suggested</span></h3><ol>${sample.tasks.map(task=>`<li>${esc(task)}</li>`).join('')}</ol>`;
        body.querySelector('.ia-campaign-action').before(section);
      }
      const select=body.querySelector('#ia-campaign-change');
      const preview=()=>{
        const type=select.value;
        body.querySelectorAll('.ia-campaign-action-field').forEach(field=>field.hidden=field.dataset.for!==type);
        const before=type==='owner'?'Owner review not recorded':type==='extend'?'Oct 31, 2026':type==='budget'?record.budget:'Current status not supplied';
        const after=type==='owner'?'Owner review request (local draft)':type==='extend'?body.querySelector('#ia-campaign-end').value||'Choose a date':type==='budget'?money(Number(body.querySelector('#ia-campaign-budget').value||0)):'Pause request for review';
        body.querySelector('#ia-campaign-diff').innerHTML=`<span>Current · ${esc(before)}</span><span aria-hidden="true">→</span><strong>Draft · ${esc(after)}</strong>`;
        return {type,before,after};
      };
      select.addEventListener('change',preview);
      body.querySelectorAll('#ia-campaign-end,#ia-campaign-budget').forEach(input=>input.addEventListener('input',preview));
      preview();
      try{const saved=JSON.parse(localStorage.getItem(`mojo-campaign-draft-${name}`)||'null');if(saved?.name===name)body.querySelector('.ia-campaign-action-status').textContent=`Saved draft: ${saved.type==='owner'?'owner review request':saved.type==='extend'?'flight extension':saved.type==='budget'?'budget adjustment':'pause request'} for ${name}. No ad account was changed.`;}catch{}
      body.querySelector('#ia-campaign-action-form').addEventListener('submit',event=>{
        event.preventDefault();const change=preview();
        const status=body.querySelector('.ia-campaign-action-status');
        if(change.type==='extend'&&body.querySelector('#ia-campaign-end').value<=record.flightEnd){status.textContent='Choose an end date after the source flight end.';return;}
        if(change.type==='budget'&&Number(body.querySelector('#ia-campaign-budget').value)<=0){status.textContent='Enter a total budget above zero.';return;}
        try{localStorage.setItem(`mojo-campaign-draft-${name}`,JSON.stringify({...change,name,at:new Date().toISOString()}));}catch{}
        status.textContent=`${name}: ${change.type==='owner'?'owner review request':change.type==='extend'?'flight extension':change.type==='budget'?'budget adjustment':'pause request'} drafted here for review. No ad account was changed.`;
      });
    }
    requestAnimationFrame(()=>{const pane=drill.closest('.canvaspane');if(pane)pane.scrollTop=0;window.scrollTo(0,0)});
    };
    const sharedStat=priorName===name&&record.pacing&&((priorTab==='overview'&&tab==='evidence')||(priorTab==='evidence'&&tab==='overview'));
    if(sharedStat&&document.startViewTransition&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches)document.startViewTransition(paint);
    else paint();
  };
  window.addEventListener('hashchange',render);render();
});
