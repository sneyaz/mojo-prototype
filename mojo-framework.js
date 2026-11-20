/* Campaigns app framework: a feed, a campaign dashboard, a rule library, and a strategy memo. */
(() => {
  const page = (location.pathname.split('/').pop() || 'HomeSystem.html').replace(/\.html$/, '');
  if (document.readyState === 'complete') init();
  else document.addEventListener('DOMContentLoaded', init, {once:true});

  function init() {
    if (page === 'HomeSystem' || page === 'index') feed();
    if (page === 'Portfolio') dashboard();
    if (page === 'Strategy') strategy();
    if (page === 'BestPractices') practices();
    for (const link of document.querySelectorAll('a[href*="HomeSystem"]')) {
      for (const node of link.childNodes) if (node.nodeType===Node.TEXT_NODE) node.textContent=node.textContent.replace(/\bToday\b/g,'Feed');
    }
    if(page!=='Portfolio')document.documentElement.classList.remove('mojo-booting');
  }

  function practices() {
    const root=document.querySelector('.mf-practices');
    if(!root)return;
    const buttons=[...root.querySelectorAll('[data-practice-filter]')];
    const cards=[...root.querySelectorAll('[data-practice-source]')];
    buttons.forEach(button=>button.addEventListener('click',()=>{
      const filter=button.dataset.practiceFilter;
      buttons.forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
      cards.forEach(card=>card.hidden=filter!=='all'&&card.dataset.practiceSource!==filter);
    }));
    const openAnchor=()=>{const anchor=location.hash.slice(1);if(anchor){const card=root.querySelector('#'+CSS.escape(anchor));if(card){card.hidden=false;card.open=true;card.scrollIntoView({block:'start'});}}};
    window.addEventListener('hashchange',openAnchor);
    openAnchor();
  }

  function feed() {
    const main = document.querySelector('main.canvaspane');
    const queue = document.getElementById('today-queue');
    if (!main || !queue || main.querySelector('.mf-shell')) return;
    document.title = 'Mojo — Feed';
    main.classList.add('mf-feed-page');
    const shell = document.createElement('div');
    shell.className = 'mf-shell';
    const sourcesRail=`<aside class="mf-rail mf-sources-rail" aria-label="Connected sources"><div class="mf-sources"><span>INTEGRATIONS</span><div class="mf-source-icons"><a href="Connections.html" title="Google Ads" aria-label="Google Ads connection"><img src="assets/google-ads.svg" alt=""></a><a href="Connections.html" title="Demandbase Ads" aria-label="Demandbase Ads connection"><img src="assets/demandbase.png" alt=""></a><a href="Connections.html" title="LinkedIn Ads" aria-label="LinkedIn Ads connection"><img src="assets/linkedin.png" alt=""></a><a href="Connections.html" title="Salesforce" aria-label="Salesforce connection"><img src="assets/salesforce.png" alt=""></a><a class="mf-connect-more" href="Connections.html" title="Connect more" aria-label="Connect more sources">+</a></div></div></aside>`;
    shell.innerHTML = `
      <div class="mf-feed-toolbar"><div class="mf-tabs" role="tablist" aria-label="Feed sections"><button type="button" role="tab" data-mf-tab="insights" aria-controls="mf-insights">Tasks</button><button type="button" role="tab" data-mf-tab="receipts" aria-controls="mf-receipts">Recently Completed</button></div><div class="mf-topline"><div class="mf-scope-slot"></div><a href="Routines.html">How Mojo checks ↗</a></div></div>
      <section class="mf-panel" id="mf-insights" role="tabpanel"><div class="mf-scope-results" hidden></div>
        <div class="mf-feed-grid"><div class="mf-stream">
          <article class="mf-lead mf-story" data-finding-id="flight-allocation">
            <div class="mf-story-meta"><span class="mf-kind mf-kind-budget">BUDGET</span></div>
            <div class="mf-lead-layout"><div><h2>Three flights ended with less than half their budgets spent</h2><p>About $90k stayed put. Let’s decide where the next $40k should go.</p><div class="mf-story-actions"><a class="mf-primary" href="#feed-decisions">Review the decision <span>→</span></a><a href="Portfolio.html#campaigns">See campaigns ↗</a></div></div><div class="mf-lead-visual" role="img" aria-label="Three ended flights at 43, 45, and 47 percent spent"><div class="mf-visual-head"><span>SPENT AT FLIGHT END</span><strong>3 flights</strong></div><div class="mf-flight-bar"><span>Search</span><i style="--fill:43%"></i><b>43%</b></div><div class="mf-flight-bar"><span>GO Prep</span><i style="--fill:45%"></i><b>45%</b></div><div class="mf-flight-bar"><span>Retargeting</span><i style="--fill:47%"></i><b>47%</b></div><small>Budget remains available to reallocate. Pipeline impact is unverified.</small></div></div>
          </article>
          <div class="mf-section-line"><strong>Signals worth a look</strong></div>
          <article class="mf-story mf-split-story" data-finding-id="q1-pacing"><div><div class="mf-story-meta"><span class="mf-kind mf-kind-pacing">PACING</span></div><h2>13 Q1 flights are underpacing</h2><p>13 of 20 are below 40% pacing. First, make sure the flight plans still make sense.</p><a href="Portfolio.html#dashboard-overview">Inspect delivery →</a></div><div class="mf-dot-visual" aria-label="13 of 20 flights below 40 percent pacing"><strong>13 <small>/ 20</small></strong><div>${Array.from({length:20},(_,i)=>'<i class="'+(i<13?'is-risk':'')+'"></i>').join('')}</div><span>below 40%</span></div></article>
          <article class="mf-story mf-split-story" data-finding-id="engagement"><div><div class="mf-story-meta"><span class="mf-kind mf-kind-signal">ENGAGEMENT</span></div><h2>One program passed all six engagement checks</h2><p>Promising, but pipeline lift still needs proof.</p><a href="Strategy.html#next-test">See the test →</a></div><div class="mf-six-visual" aria-label="Six of six engagement checks passed"><strong>6 <small>/ 6</small></strong><span>engagement checks</span><div><i></i><i></i><i></i><i></i><i></i><i></i></div></div></article>
          <article class="mf-story mf-split-story" data-finding-id="traffic-spike"><div><div class="mf-story-meta"><span class="mf-kind mf-kind-traffic">TRAFFIC</span></div><h2>Traffic rose 66% above its baseline</h2><p>A spike is worth checking. Confirm the source and tags before calling it campaign growth.</p><a href="Routines.html#traffic-watch">Review the check →</a></div><div class="mf-number-visual mf-traffic-visual" aria-label="Traffic 66 percent above the sample baseline"><strong>+66%</strong><span>versus sample baseline</span></div></article>
          <article class="mf-story mf-split-story" data-finding-id="account-gap"><div><div class="mf-story-meta"><span class="mf-kind mf-kind-accounts">ACCOUNTS</span></div><h2>1,140 surging accounts are outside live campaigns</h2><p>The interest is there. CRM eligibility and sales follow-up still need checking.</p><a href="Portfolio.html#accounts">Review accounts →</a></div><div class="mf-number-visual"><strong>1,140</strong><span>outside campaign reach</span></div></article>
          <article class="mf-story mf-compact-story"><div class="mf-story-meta"><span class="mf-kind mf-kind-measure">MEASUREMENT</span></div><h2>Two conversion events may be counted twice</h2><a href="BestPractices.html#measurement">See the measurement finding →</a></article>
        </div>${sourcesRail}</div>
      </section>
      <section class="mf-panel mf-decisions-inline" id="mf-decisions" role="region" aria-label="Decisions waiting on you" hidden><div class="mf-feed-grid"><div class="mf-stream"><div class="mf-section-line"><strong>Needs a decision</strong><span>Mojo found them. You make the call.</span></div><div class="mf-decision-filters" role="group" aria-label="Filter decisions by area"></div><div class="mf-work-mount"></div></div></div></section>
      <section class="mf-panel" id="mf-receipts" role="tabpanel" hidden><div class="mf-feed-grid"><div class="mf-stream"><div class="mf-section-line"><strong>Recently Completed</strong></div><div class="mf-receipt-mount"></div></div>${sourcesRail}</div></section>`;
    main.prepend(shell);
    const syncFloatingSources = () => shell.classList.toggle('mf-sources-floating', main.scrollTop > 24);
    main.addEventListener('scroll', syncFloatingSources, {passive:true});
    syncFloatingSources();
    const pacingAction=shell.querySelector('[data-finding-id="q1-pacing"] a[href]');
    pacingAction?.insertAdjacentHTML('afterend','<a class="mf-practice-chip" href="BestPractices.html#pacing-threshold" aria-label="Best practice source: Review flights below 40% pacing"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2h6l3 3v9H4zM10 2v3h3M6 8h5M6 11h4"/></svg><span>Best practice · Review flights below 40% pacing</span></a>');
    shell.querySelectorAll('#mf-insights .mf-story').forEach(story=>{
      const heading=story.querySelector('h2');
      const action=story.querySelector('a[href]');
      if(!heading||!action)return;
      const link=document.createElement('a');
      link.className='mf-headline-link';
      link.href=action.getAttribute('href');
      link.textContent=heading.textContent;
      heading.replaceChildren(link);
    });
    const leadVisual=shell.querySelector('.mf-lead-visual');
    if(leadVisual&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
      const draw=()=>leadVisual.classList.add('mf-bars-drawn');
      if('IntersectionObserver' in window){
        const observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){observer.disconnect();draw();}},{threshold:.25});
        observer.observe(leadVisual);
      }else requestAnimationFrame(draw);
    }
    const focusResults=main.querySelector('.brief-focus-results');
    if(focusResults)shell.querySelector('.mf-scope-results').append(focusResults);
    const syncScope=()=>{
      const focus=window.mojoBriefFocus;
      const scoped=!!focus&&focus.mode!=='all';
      const tab=shell.querySelector('[data-mf-tab][aria-selected="true"]')?.dataset.mfTab||'insights';
      shell.querySelector('#mf-insights .mf-feed-grid').hidden=scoped;
      shell.querySelector('.mf-scope-results').hidden=!scoped;
    };
    syncScope();
    shell.querySelector('.mf-work-mount').append(queue);
    const decisionRows=[...queue.querySelectorAll('.today-queue-group[data-queue-group="decisions"] details.drow, .today-queue-group[data-queue-group="decisions"] .wr-queue-entry, .today-queue-group[data-queue-group="handoffs"] .today-handoff-row')];
    const decisionArea=row=>{
      if(row.matches('.wr-queue-entry'))return 'reporting';
      if(row.matches('.today-handoff-row'))return 'handoffs';
      return row.querySelector('summary .tag.cat')?.textContent.trim().toLowerCase().split(' · ')[0]||'other';
    };
    const decisionGroups=[
      {id:'all',label:'All',types:[]},
      {id:'spend',label:'Spend',types:['budget','pacing']},
      {id:'measurement',label:'Measurement',types:['measurement','tracking']},
      {id:'audience',label:'Audience',types:['benchmarks','audience','handoffs']},
      {id:'reporting',label:'Reporting',types:['reporting']}
    ];
    decisionRows.forEach(row=>{row.classList.add('mf-decision-item');row.dataset.mfKind=decisionArea(row);});
    const decisionFilters=shell.querySelector('.mf-decision-filters');
    decisionFilters.innerHTML=decisionGroups.map(group=>`<button type="button" data-mf-decision-filter="${group.id}" aria-pressed="${group.id==='all'}">${group.label} <span>${group.id==='all'?decisionRows.length:decisionRows.filter(row=>group.types.includes(row.dataset.mfKind)).length}</span></button>`).join('');
    const setDecisionFilter=id=>{
      const group=decisionGroups.find(item=>item.id===id)||decisionGroups[0];
      decisionFilters.querySelectorAll('button').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.mfDecisionFilter===group.id)));
      decisionRows.forEach(row=>{row.hidden=group.id!=='all'&&!group.types.includes(row.dataset.mfKind);});
    };
    decisionFilters.addEventListener('click',event=>{const button=event.target.closest('[data-mf-decision-filter]');if(button)setDecisionFilter(button.dataset.mfDecisionFilter);});
    const receiptGroup = queue.querySelector('[data-queue-group="receipts"]');
    if (receiptGroup) shell.querySelector('.mf-receipt-mount').append(receiptGroup);
    const tabs = [...shell.querySelectorAll('[data-mf-tab]')];
    const panels = ['insights','receipts'];
    const select = (name, updateHash=false) => {
      if (!panels.includes(name)) name='insights';
      tabs.forEach(button => {const on=button.dataset.mfTab===name;button.setAttribute('aria-selected',String(on));button.tabIndex=on?0:-1;});
      panels.forEach(key => shell.querySelector('#mf-'+key).hidden=key!==name);
      syncScope();
      if (name==='insights') queue.querySelectorAll('[data-queue-group]').forEach(group=>group.hidden=false);
      if (receiptGroup && name==='receipts') receiptGroup.hidden=false;
      if (updateHash) {
        history.replaceState(null,'','#feed-'+name);
        main.scrollTop=0;
        if (queue.classList.contains('wr-mode')) {
          queue.classList.remove('wr-mode');
          document.body.classList.remove('wr-screen-active');
          const reportScreen=queue.querySelector('.wr-screen');
          if (reportScreen) reportScreen.hidden=true;
        }
      }
    };
    window.addEventListener('mojo-brief-focus-change',()=>{
      syncScope();
      if(window.mojoBriefFocus?.mode!=='all'&&shell.querySelector('[data-mf-tab][aria-selected="true"]')?.dataset.mfTab!=='insights')select('insights',true);
    });
    tabs.forEach(button=>button.addEventListener('click',()=>select(button.dataset.mfTab,true)));
    shell.querySelector('.mf-tabs').addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const at=panels.findIndex(name=>shell.querySelector('[data-mf-tab="'+name+'"]').getAttribute('aria-selected')==='true');const next=event.key==='Home'?0:event.key==='End'?panels.length-1:(at+(event.key==='ArrowRight'?1:panels.length-1))%panels.length;select(panels[next],true);tabs[next].focus();});
    const fromHash=()=>{const hash=location.hash.slice(1);const done=hash==='feed-receipts'||hash==='queue-receipts';select(done?'receipts':'insights');if(hash==='feed-decisions'||/^(queue-|finding-|budget-planner|weekly-report)/.test(hash)&&!done){if(hash==='budget-planner'&&plannerDisclosure)plannerDisclosure.open=true;requestAnimationFrame(()=>shell.querySelector(hash==='budget-planner'?'#budget-planner':'#mf-decisions')?.scrollIntoView({block:'start'}));}};
    window.addEventListener('hashchange',fromHash);fromHash();
    shell.querySelectorAll('a[href^="#feed-"]').forEach(link=>link.addEventListener('click',event=>{if(link.hash==='#feed-decisions'){event.preventDefault();select('insights');history.replaceState(null,'','#feed-decisions');shell.querySelector('#mf-decisions')?.scrollIntoView({block:'start'});}else select(link.hash.slice(6),true);}));
  }

  function dashboard() {
    const root=document.querySelector('.ia-portfolio');
    if(!root || root.querySelector('.mf-dashboard'))return;
    document.title='Mojo — Report';
    const board=document.createElement('section');board.className='mf-dashboard';
    board.innerHTML=`<div class="mf-kpi-row"><div><small>Campaign records</small><strong>284</strong><span>Supplied source exports</span></div><div><small>Spend pacing</small><strong>86%</strong><span>Against plan</span></div><div><small>Accounts reached</small><strong>96.3%</strong><span>Demandbase campaign sample</span></div><div><small>Pipeline lift</small><strong>Unverified</strong><span>Demo CRM join; lift unproven</span></div></div><div class="mf-dashboard-story"><div class="mf-dashboard-chart"><span class="mf-kicker">BUDGET / PACING</span><h2>Pacing exposure</h2><div class="mf-exposure"><span>Underpacing</span><i style="--w:86%"></i><strong>$826.7k</strong></div><div class="mf-exposure"><span>Overpacing</span><i style="--w:14%"></i><strong>$130.2k</strong></div><small>Pacing estimates from the sample, not lost revenue.</small></div><div class="mf-dashboard-call"><span class="mf-kicker">Q1 FLIGHTS</span><strong>13 of 20 are below 40% pacing.</strong><p>Confirm flight dates, audience size, and bids before moving spend.</p><a href="#dashboard-overview">See flight pacing →</a></div></div><div class="mf-deep-link"><strong>Campaign rows</strong><a href="#dashboard-overview">Open the campaign table →</a></div></section>`;
    const overview=document.createElement('div');
    overview.className='mf-dashboard-overview';
    while(board.firstChild)overview.append(board.firstChild);
    board.append(overview);
    const tablist=document.createElement('div');
    tablist.className='mf-dashboard-tabs';
    tablist.setAttribute('role','tablist');
    tablist.setAttribute('aria-label','Dashboard views');
    tablist.innerHTML='<button type="button" role="tab" id="mf-tab-quarterly" data-dashboard-tab="quarterly" aria-controls="ia-panel-quarterly">Quarterly Review</button><button type="button" role="tab" id="mf-tab-goals" data-dashboard-tab="goals" aria-controls="ia-panel-goals">Initiatives</button><button type="button" role="tab" id="mf-tab-channels" data-dashboard-tab="channels" aria-controls="ia-panel-channels">Channels</button><button type="button" role="tab" id="mf-tab-campaigns" data-dashboard-tab="campaigns" aria-controls="ia-panel-campaigns">Campaigns</button><button type="button" role="tab" id="mf-tab-accounts" data-dashboard-tab="accounts" aria-controls="ia-panel-accounts">Accounts</button><button type="button" role="tab" id="mf-tab-creative" data-dashboard-tab="creative" aria-controls="ia-panel-creative">Creatives</button><button type="button" class="mf-report-add" aria-label="Create your own custom report" data-tooltip="Create your own custom report"><span class="mf-report-add-icon" aria-hidden="true"></span></button>';
    const addReport=tablist.querySelector('.mf-report-add');
    addReport.addEventListener('click',()=>window.MojoOpenChat?.('Help me create a custom report about ',true));
    const toolbar=document.createElement('div');
    toolbar.className='mf-dashboard-toolbar';
    toolbar.append(tablist,addReport);
    const range=document.createElement('div');
    range.className='mf-dashboard-range';
    range.innerHTML='<button type="button" class="mf-dashboard-range-trigger" aria-expanded="false" aria-controls="mf-dashboard-range-pop"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/></svg><span>Q4 2026</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button><div class="mf-dashboard-range-pop" id="mf-dashboard-range-pop" hidden><strong>Reporting period</strong><p>Q4 2026 is available in this sample.</p><div class="mf-dashboard-range-fields"><label>From<input type="date" value="2026-10-01"></label><label>To<input type="date" value="2026-12-31"></label></div><div class="mf-dashboard-range-actions"><button type="button" data-range-reset>Q4 2026</button><button type="button" data-range-apply>Apply</button></div><p class="mf-dashboard-range-status" role="status" hidden></p></div>';
    toolbar.append(range);
    board.prepend(toolbar);
    const rangeTrigger=range.querySelector('.mf-dashboard-range-trigger');
    const rangePop=range.querySelector('.mf-dashboard-range-pop');
    const rangeStatus=range.querySelector('.mf-dashboard-range-status');
    const rangeInputs=[...range.querySelectorAll('input[type=date]')];
    const setRangeOpen=open=>{rangePop.hidden=!open;rangeTrigger.setAttribute('aria-expanded',String(open));};
    rangeTrigger.addEventListener('click',()=>setRangeOpen(rangePop.hidden));
    range.querySelector('[data-range-reset]').addEventListener('click',()=>{rangeInputs[0].value='2026-10-01';rangeInputs[1].value='2026-12-31';rangeStatus.hidden=true;rangeTrigger.querySelector('span').textContent='Q4 2026';setRangeOpen(false);});
    range.querySelector('[data-range-apply]').addEventListener('click',()=>{
      const [from,to]=rangeInputs.map(input=>input.value);
      rangeStatus.hidden=false;
      if(!from||!to||from>to){rangeStatus.textContent='Choose a valid start and end date.';return;}
      if(from!=='2026-10-01'||to!=='2026-12-31'){rangeStatus.textContent='This sample only has Q4 2026 data. Choose Q4 2026 to see these dashboards.';return;}
      rangeStatus.hidden=true;rangeTrigger.querySelector('span').textContent='Q4 2026';setRangeOpen(false);
    });
    document.addEventListener('pointerdown',event=>{if(!range.contains(event.target))setRangeOpen(false)});
    range.addEventListener('keydown',event=>{if(event.key==='Escape')setRangeOpen(false)});
    root.prepend(board);
    const mountOverview=()=>{
      const panel=root.querySelector('#mc-overview-panel');
      if(panel&&overview.parentElement!==panel)panel.append(overview);
    };
    root.addEventListener('mojo:campaign-subviews-ready',mountOverview);
    mountOverview();
    const lens=root.querySelector('#ia-lens');
    lens?.closest('label')?.classList.add('mf-old-lens-control');
    root.querySelector('.mc-view-control')?.classList.add('mf-old-lens-control');
    const tabs=[...tablist.querySelectorAll('[data-dashboard-tab]')];
    for(const button of tabs){
      const panel=root.querySelector('#ia-panel-'+button.dataset.dashboardTab);
      if(panel){panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',button.id);}
    }
    root.querySelector('.ia-context-head')?.classList.add('mf-old-context');
    root.querySelector('.ia-pipeline-link')?.classList.add('mf-old-pipeline');
    const sync=()=>{
      const campaignDetail=location.hash.includes('campaign=');
      const campaignLens=lens?.value==='campaigns';
      board.hidden=campaignDetail;
      root.classList.toggle('mf-dashboard-lens',campaignLens&&!campaignDetail);
      root.classList.toggle('mf-accounts-lens',lens?.value==='accounts'&&!campaignDetail);
      root.classList.toggle('mf-goals-lens',lens?.value==='goals'&&!campaignDetail);
      root.classList.toggle('mf-channels-lens',lens?.value==='channels'&&!campaignDetail);
      root.classList.toggle('mf-quarterly-lens',lens?.value==='quarterly'&&!campaignDetail);
      for(const name of ['campaigns','accounts','creative','goals','channels','quarterly']){
        const panel=root.querySelector('#ia-panel-'+name);
        if(panel)panel.hidden=lens?.value!==name;
      }
      if(lens?.value==='creative')root.querySelector('#ia-context-title').textContent='Creatives';
      tabs.forEach(button=>{const selected=button.dataset.dashboardTab===lens?.value;button.setAttribute('aria-selected',String(selected));button.tabIndex=selected?0:-1;});
    };
    const select=value=>{
      if(!lens||lens.value===value)return;
      lens.value=value;
      lens.dispatchEvent(new Event('input',{bubbles:true}));
      lens.dispatchEvent(new Event('change',{bubbles:true}));
      history.replaceState(null,'','#'+value);
      sync();
    };
    tabs.forEach(button=>button.addEventListener('click',()=>select(button.dataset.dashboardTab)));
    tablist.addEventListener('keydown',event=>{
      if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
      event.preventDefault();
      const current=tabs.findIndex(button=>button.getAttribute('aria-selected')==='true');
      const next=event.key==='Home'?0:event.key==='End'?tabs.length-1:(current+(event.key==='ArrowRight'?1:tabs.length-1))%tabs.length;
      select(tabs[next].dataset.dashboardTab);
      tabs[next].focus();
    });
    lens?.addEventListener('input',sync);
    lens?.addEventListener('change',sync);
    const syncFromHash=()=>{
      const hash=location.hash.slice(1);
      const value=hash==='creatives'?'creative':hash==='quarterly-review'?'quarterly':hash;
      if(['campaigns','accounts','creative','goals','channels','quarterly'].includes(value)&&lens?.value!==value){
        lens.value=value;
        lens.dispatchEvent(new Event('input',{bubbles:true}));
        lens.dispatchEvent(new Event('change',{bubbles:true}));
      }
      sync();
    };
    window.addEventListener('hashchange',syncFromHash);
    syncFromHash();
  }

  function strategy() {
    const main=document.querySelector('main.canvaspane');
    if(!main || main.querySelector('.mf-strategy'))return;
    document.title='Mojo — Plan';
    main.classList.add('mf-strategy-page');
    const memo=document.createElement('article');
    memo.className='mf-strategy';
    main.prepend(memo);
  }


})();
