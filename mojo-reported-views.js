/* Views from the revised scenario and separately supplied Demandbase screenshots. */
(() => {
  const page=(location.pathname.split('/').pop()||'index.html').replace(/\.html$/,'');
  const afterMount=callback=>{
    const run=()=>requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(callback))));
    document.readyState==='loading'?document.addEventListener('DOMContentLoaded',run,{once:true}):run();
  };
  const escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const accountRows=[
    ['Mercer Consulting Group, Inc.','2','$210.85','320,870','460','0.143%','$0.66','33'],
    ['Avnet, Inc.','1','$195.59','286,290','365','0.127%','$0.68','44'],
    ['TGW Logistics Group GmbH','1','$320.95','285,838','336','0.118%','$1.12','0'],
    ['Thermo Fisher Scientific Inc','3','$180.95','282,412','176','0.062%','$0.64','104'],
    ['Combilift Unlimited Company','1','$224.96','266,062','263','0.099%','$0.85','1'],
    ['Veolia Environnement SA','1','$162.24','250,289','306','0.122%','$0.65','2'],
    ['SoftwareOne Holding AG','2','$161.09','248,332','433','0.174%','$0.65','0'],
    ['Takeaway.com Group B.v.','1','$288.68','218,258','217','0.099%','$1.32','8'],
    ['Novartis AG','1','$124.72','189,679','257','0.135%','$0.66','3'],
    ['Yahoo Inc.','1','$169.44','189,494','108','0.057%','$0.89','57']
  ];
  const creativeRows=[
    ['Q3 Mojo Launch Brand Campaign…','6','$3,903.26','5,508,904','1,616','0.029%'],
    ['Display-Qualified-ICP-Product-P…','5','$2,805.77','2,765,394','1,391','0.050%'],
    ['Display-Aware-TAL-ABX-Marketi…','5','$2,793.70','2,751,128','1,402','0.051%'],
    ['Display-Aware-ICP-ABX-Marketi…','5','$2,791.45','2,750,574','1,400','0.051%'],
    ['Display-Qualified-AMER-Changin…','5','$2,759.79','2,693,602','1,439','0.053%'],
    ['MB-Attract-AI-Meets-ABM-Repo…','5','$2,752.08','2,686,202','1,355','0.050%'],
    ['Display-All-TAL-BuyingGroupsV1','5','$2,714.31','2,623,632','1,405','0.054%'],
    ['Display-2026-q3-Demandbase-…','5','$2,718.09','2,567,037','1,271','0.050%'],
    ['Display-2026-q3-Demandbase-…','5','$2,711.00','2,564,049','1,159','0.045%'],
    ['Display-AdsAssist-v4','5','$2,708.65','2,562,523','1,226','0.048%']
  ];
  const table=(title,note,headers,rows)=>`<div class="md-table-head"><h2>${title}</h2><span>${note}</span></div><div class="md-table-wrap"><table class="md-table md-entity-table"><thead><tr>${headers.map(header=>`<th scope="col">${header}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(cell=>`<td>${escape(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  const creativeTheme=name=>/Cloud|AI-Meets|AdsAssist/.test(name)?'cloud':/Personalization|Changing/.test(name)?'personalization':/BuyingGroups|Qualified/.test(name)?'clear':'demo';
  function creativeTable(){
    return `<div class="md-table-head"><h2>Creatives</h2></div><div class="md-creative-read"><strong>Swap test candidate</strong><span>Q3 Mojo Launch Brand Campaign has 0.029% CTR, below this table’s 0.050% median. Test a replacement against the same audience before calling it fatigue.</span><button type="button" data-creative-swap="0">Make swap task</button></div><div class="md-table-wrap"><table class="md-table md-entity-table md-creative-table"><thead><tr>${['Ad group / preview','Creatives','Spend','Impressions','Clicks','CTR','Read'].map(header=>`<th scope="col">${header}</th>`).join('')}</tr></thead><tbody>${creativeRows.map((row,index)=>`<tr><td><span class="cr-group-label"><button type="button" class="cr-row-thumb cr-art-${creativeTheme(row[0])}" data-cr-preview="${index}" aria-label="Preview ${escape(row[0])}"><span>DEMANDBASE</span><i></i></button><span title="Name as supplied; truncated in export">${escape(row[0])}</span></span></td>${row.slice(1).map(cell=>`<td>${escape(cell)}</td>`).join('')}<td>${index===0?'Swap test candidate':index===6?'Highest CTR · verify audience mix':'Compare within same audience'}</td></tr>`).join('')}</tbody></table></div><p class="cr-preview-note">Data health · Thumbnail art is a stand-in; source files, frequency history and full names were not supplied. CTR alone cannot establish creative fatigue.</p>`;
  }
  function attachCreativePreviews(creative){
    const preview=document.createElement('div');preview.className='cr-tear';preview.setAttribute('role','tooltip');preview.hidden=true;document.body.append(preview);
    const close=()=>{preview.hidden=true};
    creative.querySelectorAll('[data-cr-preview]').forEach(button=>{
      const show=()=>{
        const row=creativeRows[Number(button.dataset.crPreview)];
        preview.innerHTML=`<div class="cr-tear-art cr-art-${creativeTheme(row[0])}"><span>DEMANDBASE</span><strong>${escape(row[0])}</strong><small>Illustrative preview</small></div><div class="cr-tear-details"><h3>Ad group details</h3><p><b>Ad group</b> ${escape(row[0])}</p><p><b>Creatives</b> ${escape(row[1])}</p><p><b>Performance</b> ${escape(row[4])} clicks · ${escape(row[5])} CTR</p><p class="cr-tear-association">Campaign association is unavailable in the supplied table.</p></div>`;
        preview.hidden=false;
        const rect=button.getBoundingClientRect(),width=preview.offsetWidth,height=preview.offsetHeight;
        preview.style.left=`${rect.right+width+12<innerWidth-12?rect.right+12:Math.max(12,rect.left-width-12)}px`;
        preview.style.top=`${Math.max(12,Math.min(rect.top,innerHeight-height-12))}px`;
      };
      button.addEventListener('mouseenter',show);button.addEventListener('focus',show);
      button.addEventListener('mouseleave',close);button.addEventListener('blur',close);
    });
    creative.querySelector('.md-table-wrap')?.addEventListener('scroll',close);
    window.addEventListener('scroll',close,true);window.addEventListener('resize',close);
    window.addEventListener('keydown',event=>{if(event.key==='Escape')close()});
  }
  function dashboards(){
    const accounts=document.querySelector('#ia-panel-accounts');
    const creative=document.querySelector('#ia-panel-creative');
    if(accounts&&!accounts.querySelector('#mojo-accounts-portfolio')){
      const rows=accountRows.map((row,index)=>{
        const roles=index%4===0?'1 of 3':index%3===0?'3 of 3':'2 of 3';
        const intent=['Researching','Evaluating','In market'][index%3];
        const opportunity=index%4===0?'No open opportunity':index%3===0?'Open · Proposal':'Open · Discovery';
        const campaign=index%2===0?'2026-Q4-Customer-TryIt-NA':'2026-Q4-ENT-TAL-NA-ABX';
        const gap=roles==='1 of 3'?'Decision maker missing':roles==='3 of 3'?'No role gap':'Economic buyer missing';
        return `<tr data-mag-spend="${escape(row[2])}" data-mag-impressions="${escape(row[3])}" data-mag-clicks="${escape(row[4])}"><td>${escape(row[0])}</td><td>${index<4?'Tier 1':'Tier 2'} · ${index%2?'Medium':'High'} fit</td><td>${intent}</td><td>${roles}</td><td>${opportunity}</td><td><a href="Portfolio.html#campaign=${encodeURIComponent(campaign)}&tab=accounts">${escape(campaign)}</a></td><td>${gap}</td></tr>`;
      }).join('');
      accounts.innerHTML=`<div class="md-table-head"><h2>Accounts</h2></div><div class="md-table-wrap"><table class="md-table md-entity-table md-account-table"><thead><tr>${['Account','Fit','Intent stage','Buyer roles reached','Opportunity','Campaign touch','Missing'].map(label=>`<th scope="col">${label}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div>`;
    }
    if(creative){creative.innerHTML=creativeTable();attachCreativePreviews(creative);creative.querySelector('[data-creative-swap]')?.addEventListener('click',event=>{localStorage.setItem('mojo-creative-swap-task-v1',JSON.stringify({adGroup:creativeRows[0][0],reason:'CTR below same-table median; test replacement against the same audience',createdAt:new Date().toISOString()}));event.currentTarget.textContent='Task saved';event.currentTarget.disabled=true;});}
  }
  function feed(){
    const shell=document.querySelector('.mf-shell');
    const stream=shell?.querySelector('#mf-insights .mf-stream');
    if(!stream)return;
    if(shell.querySelector('[data-mf-tab="insights"][aria-selected="true"]'))
    stream.innerHTML=`<div class="mf-section-line"><strong>Signals worth a look</strong></div>
      <article class="mf-story mf-split-story" data-finding-id="flight-allocation" data-mojo-owner="Pam Beesly"><div><div class="mf-story-meta"><span class="mf-kind mf-kind-budget">PLANNING</span></div><h2>3 Campaigns ended without full coverage of your buying group</h2><p>Mojo found 3 opportunities to leverage in your next campaign.</p><a href="Portfolio.html#campaigns">Review ended campaigns →</a></div><div class="mf-number-visual"><strong>3</strong><span>campaigns ended</span></div></article>
      <article class="mf-story mf-split-story" data-finding-id="q4-pacing" data-mojo-owner="Pam Beesly"><div><div class="mf-story-meta"><span class="mf-kind mf-kind-pacing">PACING</span></div><h2>9 of 22 Demandbase Ads flights are underpacing</h2><p>Nine Q4 flights are below 40% pacing. Check their spend plans and dates to see whether they can catch up.</p><a href="Portfolio.html#insight=q4-pacing">See pacing breakdown →</a></div><div class="mf-number-visual"><strong>9 / 22</strong><span>below 40% pacing</span></div></article>
      <article class="mf-story mf-split-story" data-finding-id="evaluation-roles" data-mojo-owner="Pam Beesly"><div><div class="mf-story-meta"><span class="mf-kind mf-kind-accounts">BUYING GROUP</span></div><h2>412 accounts are evaluating. Who else needs to see us?</h2><p>Check whether finance and security are in the buying group before adding more spend.</p><a href="Portfolio.html#accounts">Review buying groups →</a></div><div class="mf-number-visual"><strong>412</strong><span>Evaluation accounts</span></div></article>
      <article class="mf-story mf-split-story" data-finding-id="engaged-roles" data-mojo-owner="Pam Beesly"><div><div class="mf-story-meta"><span class="mf-kind mf-kind-accounts">ENGAGEMENT</span></div><h2>1,146 accounts engaged with ads. Which buyers did we reach?</h2><p>Find engaged accounts with only one buyer role and plan the next touch.</p><a href="Portfolio.html#accounts">See engaged accounts →</a></div><div class="mf-number-visual"><strong>1,146</strong><span>engaged accounts</span></div></article>
      <article class="mf-story mf-split-story" data-finding-id="weekly-efficiency"><div><div class="mf-story-meta"><span class="mf-kind mf-kind-signal">WEEKLY CHANGE</span></div><h2>Spend fell 6%; platform conversions rose to 21</h2><p>Oct 27–Nov 2 spend fell from about $15,685 to $14,748, while platform conversions rose from 16 to 21. Cost per conversion fell to about $702. The conversion event still needs validation.</p><a href="Portfolio.html#insight=weekly-efficiency">Compare weekly totals →</a></div><div class="mf-number-visual"><strong>21</strong><span>platform conversions</span></div></article>
      <article class="mf-story mf-split-story" data-finding-id="cpa-target"><div><div class="mf-story-meta"><span class="mf-kind mf-kind-measure">MEASUREMENT</span></div><h2>Make mo money: $188 per conversion against a $9 target</h2><p>Platform conversions rose from 7.5 to 11, but Google Ads cost per conversion was still about $188 against a $9 target. Check whether the target and event measure the same thing.</p><a href="Portfolio.html#insight=cpa-target">See target comparison →</a></div><div class="mf-number-visual"><strong>$188</strong><span>Google Ads cost / conversion</span></div></article>
      <article class="mf-story mf-split-story" data-finding-id="engagement-checks"><div><div class="mf-story-meta"><span class="mf-kind mf-kind-signal">ENGAGEMENT</span></div><h2>Customer Try-It cleared six engagement checks</h2><p>All six engagement checks passed. That supports another test, but pipeline impact needs account-level CRM dates.</p><a href="Strategy.html#mf-influence">See the outcome gap →</a></div><div class="mf-number-visual"><strong>6 / 6</strong><span>checks passed</span></div></article>
      <article class="mf-story mf-split-story" data-finding-id="traffic-baseline"><div><div class="mf-story-meta"><span class="mf-kind mf-kind-traffic">TRAFFIC</span></div><h2>Sessions rose 41% above the 28-day baseline</h2><p>Sessions reached 18,420 against a 13,060 baseline. Untagged LinkedIn clicks appear in /pricing traffic; audit source tags before crediting a campaign.</p><a href="BestPractices.html#measurement">Open the tracking rule →</a></div><div class="mf-number-visual"><strong>+41%</strong><span>versus baseline</span></div></article>
      <article class="mf-story mf-split-story" data-finding-id="unassigned-utms"><div><div class="mf-story-meta"><span class="mf-kind mf-kind-measure">TRACKING</span></div><h2>16 paid-looking UTMs are not assigned to a campaign group</h2><p>These tags account for 2,222 sessions in seven days. Assign them before comparing campaign conversions.</p><a href="BestPractices.html#measurement">Open the tracking rule →</a></div><div class="mf-number-visual"><strong>2,222</strong><span>sessions unassigned</span></div></article>
      <article class="mf-story mf-split-story" data-finding-id="ended-live"><div><div class="mf-story-meta"><span class="mf-kind mf-kind-pacing">FLIGHT STATUS</span></div><h2>Three groups remain live after their Oct 31 end date</h2><p>All three groups ended Oct 31 at 47–53% of budget, yet spend rows continue. Confirm their platform status.</p><a href="Portfolio.html#campaigns">Verify flight status →</a></div><div class="mf-number-visual"><strong>3</strong><span>groups to verify</span></div></article>
      <article class="mf-story mf-split-story" data-finding-id="lifted"><div><div class="mf-story-meta"><span class="mf-kind mf-kind-signal">ACCOUNT LIFT</span></div><h2>604 reached accounts were marked lifted</h2><p>That is 11.37% of reached accounts. The export does not define the comparison group, so it cannot establish incremental pipeline.</p><a href="Portfolio.html#insight=lifted">See lift evidence →</a></div><div class="mf-number-visual"><strong>604</strong><span>marked lifted</span></div></article>
      <article class="mf-story mf-split-story" data-finding-id="customer-campaign"><div><div class="mf-story-meta"><span class="mf-kind mf-kind-traffic">CLICKS</span></div><h2>Customer Try-It drew 3,214 clicks</h2><p>The campaign recorded 2,921,818 impressions, 0.110% CTR, and 612 reached accounts. Check the landing page and account mix before repeating it.</p><a href="Portfolio.html#campaigns">Open campaign metrics →</a></div><div class="mf-number-visual"><strong>3,214</strong><span>ad clicks</span></div></article>
      <article class="mf-story mf-split-story" data-finding-id="ctv-measure"><div><div class="mf-story-meta"><span class="mf-kind mf-kind-budget">CTV</span></div><h2>CTV spent $21,640 and recorded nine clicks</h2><p>Five CTV rows delivered 721,333 impressions. Clicks alone cannot show whether video reached the intended accounts; compare reach and completed views.</p><a href="Portfolio.html#campaigns">Compare CTV delivery →</a></div><div class="mf-number-visual"><strong>5</strong><span>CTV campaigns</span></div></article>
      <article class="mf-story mf-split-story" data-finding-id="influence-gap"><div><div class="mf-story-meta"><span class="mf-kind mf-kind-measure">MEASUREMENT</span></div><h2>214 opportunities reported, with no exposure join</h2><p>The CRM summary also reports 37 wins. It does not join those records to account-level exposure, spend, and opportunity dates.</p><a href="Strategy.html#mf-influence">See required data →</a><a class="mf-practice-chip" href="BestPractices.html#measurement">Best practice · Define the evidence for influence</a></div><div class="mf-number-visual"><strong>214</strong><span>opportunities reported</span></div></article>
      `;
    stream.querySelectorAll('article[data-finding-id]').forEach(article=>{
      const title=article.querySelector('h2');
      if(!title)return;
      const target=`Portfolio.html#insight=${encodeURIComponent(article.dataset.findingId)}`;
      const link=document.createElement('a');
      link.href=target;
      link.className='mf-finding-title-link';
      link.textContent=title.textContent;
      title.replaceChildren(link);
      const action=article.querySelector('a[href="Portfolio.html#campaigns"]');
      if(action)action.href=target;
    });
    const decisions=shell.querySelector('#mf-decisions .mf-work-mount');
    if(decisions){
      const queue=decisions.querySelector('#today-queue');if(queue)queue.hidden=true;
      shell.querySelector('.mf-decision-filters').hidden=true;
      shell.querySelector('#mf-decisions .mf-section-line span').textContent='Check the source record before changing spend or targeting.';
      decisions.insertAdjacentHTML('afterbegin',`<div class="mf-reported-decisions"><article class="mf-story mf-compact-story"><div class="mf-story-meta"><span class="mf-kind mf-kind-accounts">ACCOUNT COVERAGE</span></div><h2>Improve coverage by checking DSP matches</h2><p>Coverage is 83%. The planning breakdown suggests 412 accounts without a DSP match and 391 with low match rates. Verify those accounts, then confirm whether 285 suppressions are intentional.</p><a href="Portfolio.html#insight=unreached">Review account coverage →</a></article><article class="mf-story mf-compact-story"><div class="mf-story-meta"><span class="mf-kind mf-kind-budget">CTV</span></div><h2>Set a CTV measure beyond clicks</h2><p>Nine clicks across five CTV campaigns and $21,640 in spend do not show whether video reached or lifted target accounts. Compare completed views and account reach.</p><a href="Portfolio.html#campaigns">Compare CTV delivery →</a></article><article class="mf-story mf-compact-story"><div class="mf-story-meta"><span class="mf-kind mf-kind-measure">MEASUREMENT</span></div><h2>Require an account-level join for influence</h2><p>Require account ID, first impression date, opportunity created date, and account spend before reporting influenced opportunities.</p><a href="BestPractices.html#measurement">Review the standard →</a></article></div>`);
    }
  }
  afterMount(()=>{
    if(page==='HomeSystem'||page==='index'){
      const mountReportedFeed=()=>{
        const stream=document.querySelector('.mf-shell #mf-insights .mf-stream');
        if(!stream)return false;
        if(!stream.querySelector('[data-finding-id="influence-gap"]'))feed();
        return true;
      };
      if(!mountReportedFeed()){
        const observer=new MutationObserver(()=>{if(mountReportedFeed())observer.disconnect();});
        observer.observe(document.documentElement,{childList:true,subtree:true});
      }
    }
  });
  if(page==='Portfolio'){
    const mountCreativeTable=()=>{
      dashboards();
      const creative=document.querySelector('#ia-panel-creative');
      if(!creative)return;
      new MutationObserver(()=>{
        if(creative.querySelector('.ia-gallery')&&!creative.querySelector('.md-creative-table'))dashboards();
      }).observe(creative,{childList:true});
    };
    // Mojo's page shell reveals after three animation frames. Mount this report
    // on the first frame so the older copy editor never flashes into view.
    const start=()=>requestAnimationFrame(mountCreativeTable);
    document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
  }
})();
