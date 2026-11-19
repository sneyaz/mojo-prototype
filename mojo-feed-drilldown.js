/* Feed findings open a scoped Campaigns view instead of an unfiltered dashboard. */
(() => {
  const findings={
    'flight-allocation':{
      tag:'Budget · scenario',title:'Three flights ended with less than half their budgets spent',
      intro:'These three Q3 flight examples left $45,920 unspent. Confirm final delivery and flight status before proposing a new allocation.',
      metrics:[['Budget','$83,000'],['Spent','$37,080'],['Remaining','$45,920']],
      columns:['Flight','Budget','Spent','Pacing','Remaining'],
      rows:[['Q3 ENT TAL Display','$28,000','$11,480','41%','$16,520'],['Q3 CTV ICP Roku','$40,000','$18,400','46%','$21,600'],['Q3 Retargeting Pricing Page','$15,000','$7,200','48%','$7,800']],
      source:'Separate flight budget example in the supplied scenario. These Q3 flights are outside the 26 Q4 delivery rows below.',
      next:'Check the final platform spend and whether each flight actually ended before moving budget.'
    },
    'q4-pacing':{
      tag:'Demandbase Ads · pacing',title:'9 of 22 Demandbase Ads flights are underpacing',
      intro:'A focused planning view of the nine Q4 flights below 40% of planned spend. Review the plan and delivery cause before moving budget.',
      metrics:[['Below 40%','9'],['Q4 flights reviewed','22'],['Share','41%']],
      source:'Sample planning overlay for 22 named Q4 scenario campaigns. Spend matches the campaign rows; planned spend is illustrative.',
      next:'Confirm the dated flight plans, diagnose the cause for each flight, then decide whether to extend, rebalance, or stop.'
    },
    unreached:{
      tag:'Account coverage',title:'83% account coverage',
      intro:'5,312 of 6,400 target accounts were reached in the revised scenario. The separate planning breakdown suggests 803 match issues to review; the 285 suppressions may be intentional. These are not verified account-level causes.',
      metrics:[['Coverage','83%'],['Reached','5,312 / 6,400'],['Match issues to review','803']],
      columns:['Planning breakdown','Accounts'],rows:[['No DSP match · verify and repair','412'],['Low match rate · investigate','391'],['Suppressed · confirm exclusions','285']],
      source:'Portfolio reach totals and supplied planning breakdown. Account IDs and suppression records were not supplied.',
      next:'Mojo suggests verifying and repairing DSP matches first, then investigating low match rates. Confirm suppressions before changing exclusions.'
    },
    'weekly-efficiency':{
      tag:'Weekly change',title:'Spend fell 6%; platform conversions rose to 21',
      intro:'The two full seven day windows show less spend and more platform conversions. Nov 3 is partial and excluded.',
      metrics:[['Spend change','−6%'],['Conversions','21 vs 16'],['Cost / conversion','$702 vs $980']],
      columns:['Measure','Oct 27–Nov 2','Prior 7 days'],rows:[['Spend','~$14,748','~$15,685'],['Platform conversions','21','16'],['Cost / conversion','~$702','~$980']],
      source:'Campaign Control Room digest supplied Nov 3. These are platform conversions, not confirmed leads.',
      next:'Confirm the conversion definition before calling the change an efficiency gain.'
    },
    'cpa-target':{
      tag:'Measurement',title:"Make mo money: $188 per conversion against a $9 target",
      intro:'Conversions improved in the latest full week, but Google Ads cost per conversion is still well above the recorded target.',
      metrics:[['Latest conversions','11'],['Prior conversions','7.5'],['Google Ads cost / conversion','~$188']],
      columns:['Measure','Latest full week','Prior week or target'],rows:[['Conversions','11','7.5'],['Cost / conversion','~$188','~$284 prior'],['Target CPA','—','$9 target']],
      source:'Campaign Control Room digest. The cost measure includes Google Ads only; Demandbase spend is excluded.',
      next:'Check that the target and platform conversion event represent the same lead definition.'
    },
    'engagement-checks':{
      tag:'Engagement · sample',title:'Customer Try-It cleared six engagement checks',
      intro:'The planning sample says this program passed six checks. The Q4 scenario row below shows delivery and account response, not pipeline lift.',
      metrics:[['Checks passed','6 / 6'],['Clicks','3,214'],['Accounts marked lifted','188']],
      campaign:'2026-Q4-Customer-TryIt-NA',
      source:'Engagement check is a supplied planning example. Delivery row is a modeled scenario allocation except for the user supplied Customer Try-It and CTV facts.',
      next:'Inspect the landing pages and account mix, then join dated CRM outcomes before repeating the message.'
    },
    'traffic-baseline':{
      tag:'Traffic · sample',title:'Sessions rose 41% above the 28-day baseline',
      intro:'The control room sample reports 18,420 sessions against a 13,060-session baseline. Source tags need review before assigning the gain to campaigns.',
      metrics:[['Sessions','18,420'],['Baseline','13,060'],['Difference','+41%']],
      source:'Separate Campaign Control Room traffic sample; no campaign ID or matching GA4 export was supplied.',
      next:'Audit /pricing traffic and untagged LinkedIn clicks before crediting a campaign.'
    },
    'unassigned-utms':{
      tag:'Tracking',title:'16 paid-looking UTMs are not assigned to a campaign group',
      intro:'The unassigned tags contributed 2,222 sessions over seven days. The export does not show which campaign should receive each tag.',
      metrics:[['UTMs','16'],['Sessions','2,222'],['Window','7 days']],
      source:'Campaign Control Room digest supplied Nov 3. Individual UTM values and assignment IDs were not supplied.',
      next:'Map the tags to campaign IDs before comparing campaign conversion totals.'
    },
    'ended-live':{
      tag:'Flight status',title:'Three groups remain live after their Oct 31 end date',
      intro:'Make mo money, Product A, and GO Prep were marked live with spend after the stated flight end. Their reported budget use ranged from 47% to 53%.',
      metrics:[['Groups','3'],['Flight end','Oct 31'],['Budget used','47–53%']],
      columns:['Group','Budget','Reported use'],rows:[['Make mo money','$60,000','47%'],['Product A','$45,000','53%'],['GO Prep','$60,000','50%']],
      source:'Campaign Control Room digest supplied Nov 3. These group names and budget examples are separate from the Q4 Demandbase campaign rows.',
      next:'Confirm end dates and live status in each ad platform before reallocating funds.'
    },
    lifted:{
      tag:'Account lift',title:'604 reached accounts were marked lifted',
      intro:'604 of 5,312 reached accounts were marked lifted in the revised scenario (11.37%). The export does not define the comparison method.',
      metrics:[['Reached accounts','5,312'],['Marked lifted','604'],['Share of reached','11.37%']],
      source:'Revised portfolio scenario. Account level flags and a control group were not supplied.',
      next:'Confirm the lift definition and join dated opportunity records before making a pipeline claim.'
    },
    'customer-campaign':{
      tag:'Clicks',title:'Customer Try-It drew 3,214 clicks',
      intro:'This is the Customer Try-It campaign row from the revised Q4 scenario, shown by itself below.',
      metrics:[['Clicks','3,214'],['CTR','0.110%'],['Reached accounts','612']],
      campaign:'2026-Q4-Customer-TryIt-NA',
      source:'Revised campaign scenario supplied Nov 3. Account counts can overlap across campaigns.',
      next:'Review the landing page and account mix before repeating the creative.'
    },
    'ctv-measure':{
      tag:'CTV',title:'CTV spent $21,640 and recorded nine clicks',
      intro:'The five CTV scenario rows are filtered below. Their nine clicks are a weak success measure for video delivery.',
      metrics:[['CTV spend','$21,640'],['Impressions','721,333'],['Clicks','9']],
      type:'CTV',
      source:'Five CTV rows in the revised campaign scenario. Video completion data was not supplied.',
      next:'Compare account reach, lift flags, and completed views before changing spend.'
    },
    'influence-gap':{
      tag:'Measurement',title:'214 opportunities reported, with no exposure join',
      intro:'The CRM summary includes opportunities and wins, but it does not join those records to exposure and spend by account.',
      metrics:[['Opportunities','214'],['Won','37'],['Attributable pipeline','$0']],
      source:'Revised scenario aggregate. The $0 is reported attributable pipeline in this export, not proof that advertising produced no pipeline.',
      next:'Join account ID, first impression date, opportunity created date, and allocated spend.'
    }
  };
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  // Spend mirrors the campaign table. The plan-to-date column is an explicitly
  // illustrative overlay so this feed example can be inspected as a filter.
  const pacingRows=[
    ['2026-Q4-ENT-TAL-NA-ABX',11935.33,35000,'Repair buyer-role coverage and DSP matches'],
    ['2026-Q4-ENT-ICP-EMEA-Unified',7956.89,29000,'Check EMEA targeting and exclusions'],
    ['2026-Q4-MFG-TAL-NA-ABX',8951.50,24000,'Confirm eligible account-list size'],
    ['2026-Q4-EMEA-TAL-ABX',8454.19,23000,'Review match rate and flight schedule'],
    ['2026-Q4-SEM-TAL-NA-Unified',7757.96,25000,'Check bids and available inventory'],
    ['2026-Q4-SEM-ICP-NA-Unified',7459.58,21000,'Inspect frequency and creative rotation'],
    ['2026-Q4-CTV-ICP-Roku',6500,27000,'Verify video delivery and completed views'],
    ['2026-Q4-EMEA-TAL-ALL',5967.67,15500,'Check audience overlap before adding reach'],
    ['2026-Q4-CTV-SEM-ICP-NA-AI',5200,18500,'Confirm video dates and completion tracking'],
    ['2026-Q4-Customer-TryIt-NA',32000,35000,'Monitor'],
    ['2026-Q4-HC-ICP-NA-Display',9946.11,12000,'Monitor'],
    ['2026-Q4-FSI-ICP-NA-Display',9448.80,11000,'Monitor'],
    ['2026-Q4-MM-All-NA',6962.28,9000,'Monitor'],
    ['2026-Q4-SEM-ICP-NA-Ads',6663.89,9000,'Monitor'],
    ['2026-Q4-SEM-ICP-NA-AI',6266.05,9000,'Monitor'],
    ['2026-Q4-MM-All-EMEA',5470.36,8000,'Monitor'],
    ['2026-Q4-SEM-TAL-EMEA-Unified',5171.98,7000,'Monitor'],
    ['2026-Q4-SEM-ICP-EMEA-Ads',4774.13,7000,'Monitor'],
    ['2026-Q4-SEM-ICP-EMEA-AI',4475.75,6500,'Monitor'],
    ['2026-Q4-eBook-ConnectedGTM',4276.83,6000,'Monitor'],
    ['2026-Q4-CTV-SEM-TAL-NA-AI',4200,6000,'Monitor'],
    ['2026-Q4-SEM-TAL-NA-Ads',3978.44,6000,'Monitor']
  ].map(([name,spent,plan,move])=>({name,spent,plan,move,pace:Math.round(spent/plan*100)}));
  const renderPacing=focused=>{
    const currency=value=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(value);
    const low=pacingRows.filter(row=>row.pace<40);
    const reviewKey='mojo-q4-pacing-review-v1';
    const rowMarkup=row=>`<tr data-pacing-low="${row.pace<40}"><td><a href="#campaign=${encodeURIComponent(row.name)}&tab=overview">${esc(row.name)}</a></td><td>${currency(row.plan)}</td><td>${currency(row.spent)}</td><td><div class="md-pacing-cell"><strong>${row.pace}%</strong><span class="md-pacing-track"><i style="width:${Math.min(100,row.pace)}%"></i></span></div></td><td>${esc(row.move)}</td></tr>`;
    focused.innerHTML=`<nav class="md-insight-crumb" aria-label="Breadcrumb"><a href="HomeSystem.html#feed-insights">Feed</a><span aria-hidden="true">›</span><a href="#campaigns">Dashboards</a><span aria-hidden="true">›</span><span>Pacing breakdown</span></nav>
      <div class="md-insight-heading"><span>Q4 CAMPAIGNS · SAMPLE PLANNING OVERLAY</span><h2>9 of 22 flights are below 40% of plan.</h2><p>These nine need a flight-plan review before anyone moves budget. The filter is set to underpacing flights; switch to all 22 to see the rest of the cohort.</p></div>
      <dl class="md-insight-metrics"><div><dt>Under 40% of plan</dt><dd>9 flights</dd></div><div><dt>Q4 flights with sample plans</dt><dd>22</dd></div><div><dt>Threshold</dt><dd>&lt;40%</dd></div></dl>
      <div class="md-pacing-share"><span style="width:${low.length/pacingRows.length*100}%"></span></div><p class="md-pacing-share-label"><b>9 need review</b><span>13 at or above 40%</span></p>
      <div class="md-pacing-toolbar"><div role="group" aria-label="Filter Q4 flights"><button type="button" data-pacing-filter="low" aria-pressed="true">Underpacing · 9</button><button type="button" data-pacing-filter="all" aria-pressed="false">All flights · 22</button></div><button type="button" class="md-pacing-review" data-pacing-review>Stage review for 9 flights</button></div>
      <div class="md-insight-evidence"><h3 class="md-pacing-table-title">Nine flights to review</h3><div class="md-insight-table-wrap"><table class="md-insight-table md-pacing-table" data-pagination-managed="true"><thead><tr><th scope="col">Campaign</th><th scope="col">Plan to date <small>sample</small></th><th scope="col">Spend <small>scenario</small></th><th scope="col">Actual / plan</th><th scope="col">Mojo’s next check</th></tr></thead><tbody>${pacingRows.map(rowMarkup).join('')}</tbody></table></div></div>
      <div class="md-pacing-receipt" role="status" hidden></div>
      <div class="md-insight-next"><h3>What to do with this</h3><p>Confirm each flight’s dates and planned spend with its owner. Use the next check in the table to find the delivery constraint. Extend, rebalance, or stop only after that review; low pacing alone is not a budget decision.</p></div>
      <p class="md-insight-source"><strong>Source and math</strong> The 22 campaign names and spend values match the Q4 scenario rows in Dashboards. Plan-to-date values are illustrative and were added for this demo; four other Q4 campaign rows have no sample plan. Pacing = spend ÷ sample plan, rounded. No live tasks or ad changes occur here.</p>`;
    const filterButtons=[...focused.querySelectorAll('[data-pacing-filter]')];
    const title=focused.querySelector('.md-pacing-table-title');
    const applyFilter=filter=>{
      filterButtons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.pacingFilter===filter)));
      focused.querySelectorAll('.md-pacing-table tbody tr').forEach(row=>{row.hidden=filter==='low'&&row.dataset.pacingLow!=='true';});
      title.textContent=filter==='low'?'Nine flights to review':'All 22 Q4 flights with sample plans';
    };
    filterButtons.forEach(button=>button.addEventListener('click',()=>applyFilter(button.dataset.pacingFilter)));
    applyFilter('low');
    const receipt=focused.querySelector('.md-pacing-receipt');
    const reviewButton=focused.querySelector('[data-pacing-review]');
    const syncReview=()=>{
      const staged=localStorage.getItem(reviewKey)==='staged';
      reviewButton.textContent=staged?'Review staged':'Stage review for 9 flights';
      receipt.hidden=!staged;
      if(staged)receipt.innerHTML='<strong>Review staged for nine flights.</strong><span>Use the next checks above, then confirm owners and dates before sharing.</span><button type="button" data-pacing-undo>Undo</button>';
    };
    reviewButton.addEventListener('click',()=>{localStorage.setItem(reviewKey,'staged');syncReview();});
    receipt.addEventListener('click',event=>{if(event.target.closest('[data-pacing-undo]')){localStorage.removeItem(reviewKey);syncReview();}});
    syncReview();
  };
  const mount=()=>{
    const root=document.querySelector('.ia-portfolio');
    const overview=root?.querySelector('#mc-overview-panel');
    if(!overview||overview.querySelector('.md-insight-normal'))return;
    const normal=document.createElement('div');normal.className='md-insight-normal';
    normal.append(...overview.childNodes);
    const focused=document.createElement('section');focused.className='md-insight-focus';focused.hidden=true;
    overview.append(normal,focused);
    const reported=normal.querySelector('.md-unified-table');
    const show=()=>{
      const id=new URLSearchParams(location.hash.slice(1)).get('insight');
      const finding=findings[id];
      normal.hidden=!!finding;focused.hidden=!finding;
      document.documentElement.classList.toggle('mojo-insight-open',!!finding);
      if(!finding){focused.replaceChildren();return;}
      const lens=root.querySelector('#ia-lens');
      if(lens&&lens.value!=='campaigns'){
        lens.value='campaigns';
        lens.dispatchEvent(new Event('input',{bubbles:true}));
        lens.dispatchEvent(new Event('change',{bubbles:true}));
      }
      if(id==='q4-pacing'){
        renderPacing(focused);
        requestAnimationFrame(()=>focused.scrollIntoView({block:'start'}));
        return;
      }
      let rows=finding.rows;
      let columns=finding.columns;
      if(finding.campaign||finding.type){
        rows=[...(reported?.tBodies[0]?.rows||[])].filter(row=>finding.campaign?row.cells[0]?.textContent.trim()===finding.campaign:row.cells[1]?.textContent.trim()===finding.type).map(row=>[...row.cells].map(cell=>cell.textContent.trim()));
        columns=[...(reported?.tHead?.rows[0]?.cells||[])].map(cell=>cell.textContent.trim());
      }
      const table=rows?.length?`<div class="md-insight-table-wrap"><table class="md-insight-table"><thead><tr>${columns.map(label=>`<th scope="col">${esc(label)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(cell=>`<td>${esc(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`:'';
      focused.innerHTML=`<a class="md-insight-back" href="#campaigns">← All campaign dashboards</a><div class="md-insight-heading"><span>${esc(finding.tag)}</span><h2>${esc(finding.title)}</h2><p>${esc(finding.intro)}</p></div><dl class="md-insight-metrics">${finding.metrics.map(([label,value])=>`<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl>${table?`<div class="md-insight-evidence"><h3>${finding.campaign?'Matching campaign row':finding.type?'Filtered campaign rows':'Source detail'}</h3>${table}</div>`:''}<div class="md-insight-next"><h3>Next check</h3><p>${esc(finding.next)}</p></div><p class="md-insight-source"><strong>Source and scope</strong> ${esc(finding.source)}</p>`;
      requestAnimationFrame(()=>focused.scrollIntoView({block:'start'}));
    };
    window.addEventListener('hashchange',show);
    show();
  };
  const ready=()=>requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(mount)))));
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',ready,{once:true}):ready();
})();
