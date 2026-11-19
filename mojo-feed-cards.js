/* Present the existing findings as a scan-friendly, data-led feed. */
(() => {
  if (!/^(HomeSystem|index)(\.html)?$/.test(location.pathname.split('/').pop() || 'index')) return;

  const attention = ['q4-pacing', 'evaluation-roles', 'engaged-roles', 'ended-live', 'unassigned-utms', 'flight-allocation'];
  const areas = {
    'flight-allocation':'Plan', 'ended-live':'Optimize', 'q4-pacing':'Optimize',
    'evaluation-roles':'Optimize', 'engaged-roles':'Optimize', unreached:'Optimize',
    'unassigned-utms':'Fix', 'cpa-target':'Optimize', 'traffic-baseline':'Report',
    'weekly-efficiency':'Optimize', lifted:'Report', 'engagement-checks':'Optimize',
    'customer-campaign':'Report', 'ctv-measure':'Optimize', 'influence-gap':'Report'
  };
  const names = {
    'flight-allocation': 'Campaign planning', 'ended-live': 'Flight status check',
    'q4-pacing': 'Pacing watcher', 'evaluation-roles':'Buying group check', 'engaged-roles':'Engagement check', unreached: 'Coverage watcher',
    'unassigned-utms': 'UTM check', 'cpa-target': 'Measurement check',
    'traffic-baseline': 'Traffic watcher', 'weekly-efficiency': 'Weekly recap',
    lifted: 'Reach watcher', 'engagement-checks': 'Engagement check',
    'customer-campaign': 'Delivery watcher', 'ctv-measure': 'Delivery watcher',
    'influence-gap': 'Measurement check'
  };
  const charts = {
    'flight-allocation': `<div class="mfc-chart"><strong>Budget used by flight</strong><div class="mfc-bars"><div><span>Q3 ENT TAL</span><progress max="100" value="41">41%</progress><b>41%</b></div><div><span>Q3 CTV ICP</span><progress max="100" value="46">46%</progress><b>46%</b></div><div><span>Q3 Retargeting</span><progress max="100" value="48">48%</progress><b>48%</b></div></div></div>`,
    'ended-live': `<dl class="mfc-stats"><div><dt>Groups to verify</dt><dd>3</dd></div><div><dt>Scheduled end</dt><dd>Oct 31</dd></div><div><dt>Budget used</dt><dd>47–53%</dd></div></dl>`,
    'q4-pacing': `<div class="mfc-chart"><div class="mfc-dots" role="img" aria-label="9 of 22 Demandbase Ads flights below 40 percent pacing">${Array.from({length:22}, (_,i)=>`<span class="${i<9?'mfc-risk':''}"></span>`).join('')}</div><div class="mfc-legend"><span><i class="mfc-risk"></i>9 below 40%</span><span><i></i>13 other flights</span></div></div>`,
    'evaluation-roles': `<dl class="mfc-stats"><div><dt>Evaluation accounts</dt><dd>412</dd></div><div><dt>Next buyers</dt><dd>Finance</dd></div><div><dt>Also check</dt><dd>Security</dd></div></dl>`,
    'engaged-roles': `<dl class="mfc-stats"><div><dt>Accounts engaged</dt><dd>1,146</dd></div><div><dt>Next step</dt><dd>Check roles</dd></div></dl>`,
    unreached: `<div class="mfc-chart mfc-reach mfc-coverage"><div><strong>83%</strong><span>account coverage · 5,312 of 6,400 reached</span></div><progress max="6400" value="5312">5,312 reached</progress><div class="mfc-scale"><span>803 match issues to review</span><span>285 suppressions to confirm</span></div></div>`,
    'unassigned-utms': `<dl class="mfc-stats"><div><dt>Unassigned UTMs</dt><dd>16</dd></div><div><dt>Sessions</dt><dd>2,222</dd></div><div><dt>Window</dt><dd>7 days</dd></div></dl>`,
    'cpa-target': `<div class="mfc-chart mfc-compare"><div><span>Actual Google Ads cost</span><progress max="188" value="188">$188</progress><b>$188</b></div><div><span>Recorded target</span><progress max="188" value="9">$9</progress><b>$9</b></div></div>`,
    'traffic-baseline': `<div class="mfc-chart mfc-compare"><div><span>Reported sessions</span><progress max="18420" value="18420">18,420</progress><b>18,420</b></div><div><span>28-day baseline</span><progress max="18420" value="13060">13,060</progress><b>13,060</b></div></div>`,
    'weekly-efficiency': `<dl class="mfc-stats"><div><dt>Prior week spend</dt><dd>$15,685</dd></div><div><dt>Oct 27–Nov 2</dt><dd>$14,748</dd></div><div><dt>Conversions</dt><dd>16 → 21</dd></div></dl>`,
    lifted: `<div class="mfc-chart mfc-reach"><div><strong>11.37%</strong><span>of reached accounts marked lifted</span></div><progress max="5312" value="604">604 lifted</progress><div class="mfc-scale"><span>604 marked lifted</span><span>5,312 reached</span></div></div>`,
    'engagement-checks': `<div class="mfc-chart mfc-checks"><span aria-label="Six of six checks passed">${Array.from({length:6},()=>'<b>✓</b>').join('')}</span><strong>6 / 6 passed</strong></div>`,
    'customer-campaign': `<dl class="mfc-stats"><div><dt>Impressions</dt><dd>2,921,818</dd></div><div><dt>CTR</dt><dd>0.110%</dd></div><div><dt>Accounts reached</dt><dd>612</dd></div></dl>`,
    'ctv-measure': `<dl class="mfc-stats"><div><dt>Spend · 5 campaigns</dt><dd>$21,640</dd></div><div><dt>Impressions</dt><dd>721,333</dd></div><div><dt>Clicks</dt><dd>9</dd></div></dl>`,
    'influence-gap': `<dl class="mfc-stats"><div><dt>Opportunities</dt><dd>214</dd></div><div><dt>Wins</dt><dd>37</dd></div><div><dt>Exposure join</dt><dd>Missing</dd></div></dl>`
  };
  const directLabels = {
    'flight-allocation':'Plan the next campaign', 'ended-live':'Verify flight status',
    'q4-pacing':'See pacing breakdown', 'evaluation-roles':'Review buying groups', 'engaged-roles':'Find missing buyers', unreached:'Review account coverage',
    'unassigned-utms':'Open the tracking rule', 'cpa-target':'See target comparison',
    'traffic-baseline':'Review traffic sources', 'weekly-efficiency':'Compare weekly totals',
    lifted:'See lift evidence', 'engagement-checks':'See the outcome gap',
    'customer-campaign':'Open campaign metrics', 'ctv-measure':'Compare CTV delivery',
    'influence-gap':'See required data'
  };
  const chatDetails = {
    'flight-allocation': {summary:'Three campaigns ended with $45,920 unspent and no follow-up draft. Review what worked before planning the next one.', headers:['Flight','Budget','Spent','Left'], rows:[['Q3 ENT TAL Display','$28,000','$11,480','$16,520'],['Q3 CTV ICP Roku','$40,000','$18,400','$21,600'],['Q3 Retargeting Pricing Page','$15,000','$7,200','$7,800']], next:'Confirm final spend, then draft a campaign around the strongest audience and message.'},
    'ended-live': {summary:'Make mo money, Product A, and GO Prep were marked live after their October 31 end dates. Reported budget use was 47–53%.', next:'Check each platform’s live status and end date before making a budget decision.'},
    'q4-pacing': {summary:'Nine of 22 Demandbase Ads flights are below 40% of planned spend.', headers:['Flight','Spent','Plan','Pacing'], rows:[['Q4 Enterprise TAL','$11,935','$35,000','34%'],['Q4 EMEA Unified','$7,957','$29,000','27%'],['Q4 Manufacturing TAL','$8,952','$24,000','37%'],['Q4 EMEA TAL','$8,454','$23,000','37%'],['Q4 Search TAL','$7,758','$25,000','31%'],['Q4 Search ICP','$7,460','$21,000','36%'],['Q4 CTV ICP Roku','$6,500','$27,000','24%'],['Q4 EMEA TAL All','$5,968','$15,500','38%'],['Q4 CTV Search ICP','$5,200','$18,500','28%']], next:'Confirm flight dates and delivery before extending or rebalancing.'},
    'evaluation-roles': {summary:'Demandbase shows 412 accounts in Evaluation. Ironwood is one example: its finance and security buyers have not seen your ads.', next:'Start with accounts missing finance or security.'},
    'engaged-roles': {summary:'1,146 target accounts engaged with ads. Check which have only one buyer role engaged, then plan a role-specific follow-up.', next:'Find the missing buyers in the account list.'},
    unreached:{summary:'5,312 of 6,400 target accounts were reached. The sample flags 803 match issues to review and 285 suppressions to confirm.',next:'Verify account matching and intentional exclusions before changing reach.'},
    'unassigned-utms':{summary:'Sixteen unassigned paid-looking UTMs contributed 2,222 sessions in seven days.',next:'Map each tag to a campaign ID before comparing conversion totals.'},
    'cpa-target':{summary:'Google Ads cost per platform conversion was about $188 against a recorded $9 target.',next:'Check whether the target and conversion event use the same lead definition.'},
    'traffic-baseline':{summary:'18,420 sessions compared with a 13,060-session 28-day baseline; source tags still need review.',next:'Audit pricing traffic and untagged LinkedIn clicks before crediting a campaign.'},
    'weekly-efficiency':{summary:'Spend fell from about $15,685 to $14,748 while platform conversions rose from 16 to 21 across comparable full weeks.',next:'Confirm the conversion definition before calling this an efficiency gain.'},
    lifted:{summary:'604 of 5,312 reached accounts were marked lifted (11.37%). The sample does not define a control group.',next:'Confirm the lift method and join dated opportunity records.'},
    'engagement-checks':{summary:'Customer Try-It passed six engagement checks. Its delivery row shows 3,214 clicks; that does not establish pipeline lift.',next:'Inspect landing pages and account mix, then join CRM outcomes.'},
    'customer-campaign':{summary:'Customer Try-It recorded 3,214 clicks, 0.110% CTR, and 612 accounts reached in the sample.',next:'Review the landing page and account mix before repeating the creative.'},
    'ctv-measure':{summary:'Five CTV rows spent $21,640, delivered 721,333 impressions, and recorded nine clicks.',next:'Review completed views and account reach; clicks alone are a weak CTV measure.'},
    'influence-gap':{summary:'The CRM summary has 214 opportunities and 37 wins, but no account-level join to exposure and spend.',next:'Join account ID, first impression date, opportunity date, and allocated spend.'}
  };
  const triggerReasons = {
    'flight-allocation':'Three ended flights have unspent budget and no follow-up draft.',
    'ended-live':'Three campaigns remain marked live after their Oct 31 end dates.',
    'q4-pacing':'Nine of 22 flights are below 40% of planned spend.',
    'evaluation-roles':'412 Evaluation accounts include buying groups missing finance or security.',
    'engaged-roles':'Most of 1,146 engaged accounts have reached only one buyer role.',
    unreached:'1,088 target accounts were not reached; account matching and suppressions need review.',
    'unassigned-utms':'16 paid-looking UTMs have 2,222 sessions without a campaign assignment.',
    'cpa-target':'The reported $188 conversion cost is above the recorded $9 target.',
    'traffic-baseline':'18,420 sessions exceed the 13,060-session baseline while source tags remain incomplete.',
    'weekly-efficiency':'Platform conversions rose from 16 to 21 while spend fell across comparable weeks.',
    lifted:'604 accounts are marked lifted, but the sample has no defined control group.',
    'engagement-checks':'Six engagement checks passed, but the record has no pipeline join.',
    'customer-campaign':'Customer Try-It reached 612 accounts with 0.110% CTR.',
    'ctv-measure':'Five CTV campaigns spent $21,640 and recorded nine clicks.',
    'influence-gap':'214 opportunities and 37 wins lack account-level exposure joins.'
  };
  const chatPrompts = {
    'flight-allocation':['What worked in these campaigns?','Who should the next campaign reach?','Draft the next campaign'],
    'q4-pacing':['Which flights are slowest?','Check flight dates','What should we change?'],
    'evaluation-roles':['Show accounts missing finance','Show accounts missing security','Plan a follow-up'],
    'engaged-roles':['Find accounts with one buyer','Compare engagement by campaign','Plan a follow-up'],
    unreached:['Show the account gaps','Review DSP matches','Check suppressions'],
    'cpa-target':['Compare cost and target','Check the conversion definition','What should we change?']
  };
  const sourceViews = {
    'flight-allocation':['Demandbase Ads flight budgets','CampaignLifecycle.html?view=optimize#performance','Open performance'],
    'ended-live':['Demandbase Ads flight status','CampaignLifecycle.html?view=optimize#issues','Open issues'],
    'q4-pacing':['Demandbase Ads flight delivery','CampaignLifecycle.html?view=optimize#performance','Open performance'],
    'evaluation-roles':['Demandbase account lists and buying groups','CampaignLifecycle.html?view=optimize#performance','Open performance'],
    'engaged-roles':['Demandbase account engagement','CampaignLifecycle.html?view=optimize#performance','Open performance'],
    unreached:['Demandbase account matching','Portfolio.html#accounts','Open accounts'],
    'unassigned-utms':['Campaign tracking records','CampaignLifecycle.html?view=optimize#issues','Open issues'],
    'cpa-target':['Google Ads conversion report','CampaignLifecycle.html?view=optimize#issues','Open issues'],
    'traffic-baseline':['GA4 traffic report','Portfolio.html#campaigns','Open dashboard'],
    'weekly-efficiency':['Connected platform weekly totals','CampaignLifecycle.html?view=optimize#performance','Open performance'],
    lifted:['Demandbase account lift report','Portfolio.html#accounts','Open accounts'],
    'engagement-checks':['Demandbase engagement checks','CampaignLifecycle.html?view=optimize#performance','Open performance'],
    'customer-campaign':['Demandbase Ads campaign report','Portfolio.html#campaign=2026-Q4-Customer-TryIt-NA','Open campaign'],
    'ctv-measure':['Demandbase Ads CTV report','CampaignLifecycle.html?view=optimize#performance','Open performance'],
    'influence-gap':['Opportunity summary and ad activity','CampaignLifecycle.html?view=optimize#issues','Open data checks']
  };
  const areaHref=(id,area)=>area==='Plan'?'Strategy.html':area==='Report'?'Portfolio.html#campaigns':area==='Build'?'CampaignLifecycle.html?view=build#draft':`CampaignLifecycle.html?view=optimize#${area==='Fix'||['cpa-target','ended-live'].includes(id)?'issues':'performance'}`;
  const escaped = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  function openInsightChat(card) {
    const id=card?.dataset.findingId, detail=chatDetails[id];
    if(!detail)return;
    window.MojoOpenChat?.('',false);
    const body=document.querySelector('.chatpane .chatbody');
    if(!body)return;
    body.querySelector('.mfc-chat-seed')?.remove();
    const seed=document.createElement('section');seed.className='mfc-chat-seed';
    const table=detail.rows?`<div class="mfc-chat-table-wrap"><table><thead><tr>${detail.headers.map(cell=>`<th>${escaped(cell)}</th>`).join('')}</tr></thead><tbody>${detail.rows.map(row=>`<tr>${row.map(cell=>`<td>${escaped(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`:'';
    const source=sourceViews[id] || ['Connected campaign records','Portfolio.html#campaigns','Open campaigns'];
    seed.innerHTML=`<div class="mfc-chat-head"><div><h2>${escaped(card.querySelector('h2')?.textContent.trim()||'Campaign insight')}</h2></div></div><p class="mfc-chat-summary">${escaped(detail.summary)}</p>${table}<div class="mfc-chat-evidence"><div><b>Data source</b><span>${escaped(source[0])}</span></div><div><b>Triggered by · Mojo Brain</b><span>${escaped(triggerReasons[id])}</span></div><div><b>Recommended action</b><span>${escaped(detail.next)}</span></div></div><a class="mfc-chat-source-link" href="${escaped(source[1])}">${escaped(source[2])} <span aria-hidden="true">→</span></a><p class="mfc-chat-prompt">Want to check or change something?</p>`;
    body.append(seed);
    window.MojoAddChatSuggestions?.(seed, chatPrompts[id] || ['Show the supporting data','What needs verification?','What should we do next?']);
    seed.scrollIntoView({block:'start',behavior:'smooth'});
  }
  const utilityIcons = {
    discuss: '<path d="M20 11.5a8 8 0 0 1-8 8 8.4 8.4 0 0 1-3.6-.8L4 20l1.3-4.4A8 8 0 1 1 20 11.5Z"/>',
    snooze: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 1.5M9 2h6"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>'
  };
  const utilityButton = (action, label) => `<button type="button" data-mfc-action="${action}" aria-label="${label}"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${utilityIcons[action]}</svg></button>`;
  const snoozeKey = 'mojo-feed-snoozed-v1';
  const snoozed = () => { try { return JSON.parse(localStorage.getItem(snoozeKey) || '{}'); } catch { return {}; } };

  function init() {
    const shell = document.querySelector('.mf-shell');
    const stream = shell?.querySelector('#mf-insights .mf-stream');
    if (!stream?.querySelector('[data-finding-id="influence-gap"]') || stream.dataset.mfcReady) return false;
    stream.dataset.mfcReady = 'true';
    shell.classList.add('mfc-feed');
    const cards = new Map([...stream.querySelectorAll('article[data-finding-id]')].map(card => [card.dataset.findingId, card]));
    const sourceNote = stream.querySelector('.mf-source-note');
    const sections = [['Needs attention', attention]].map(([label, ids]) => {
      const section = document.createElement('section');
      section.className = 'mfc-section';
      const head = document.createElement('div');
      head.className = 'mfc-section-head';
      head.innerHTML = `<h2>${label}</h2><span></span><b>${ids.length}</b>`;
      section.append(head);
      ids.forEach(id => {
        const card = cards.get(id);
        if (!card) return;
        card.classList.remove('mf-split-story');
        card.classList.add('mfc-card');
        const body = card.firstElementChild;
        const meta = body.querySelector('.mf-story-meta');
        meta.insertAdjacentHTML('afterbegin', `<a class="mfc-area-tag" href="${areaHref(id,areas[id] || 'Report')}">${escaped(areas[id] || 'Report')}</a>`);
        card.dataset.feedArea = areas[id] || 'Report';
        const title = body.querySelector('h2');
        if (title) {
          const cleanTitle = title.textContent.trim();
          title.textContent = /[.!?]$/.test(cleanTitle) ? cleanTitle : `${cleanTitle}.`;
        }
        const oldVisual = card.querySelector(':scope > .mf-number-visual, :scope > .mf-dot-visual, :scope > .mf-six-visual');
        oldVisual?.remove();
        const action = body.querySelector('a[href]:not(.mf-finding-title-link):not(.mf-practice-chip):not(.mfc-area-tag)');
        const href = `Portfolio.html#insight=${encodeURIComponent(id)}`;
        const titleLink = document.createElement('a');
        titleLink.className = 'mf-finding-title-link';
        titleLink.href = '#';
        titleLink.textContent = title.textContent;
        title.replaceChildren(titleLink);
        const footer = document.createElement('div');
        footer.className = 'mfc-actions';
        footer.innerHTML = `<a class="mfc-primary" href="#">${escaped(directLabels[id])} <span aria-hidden="true">→</span></a><button type="button" class="mojo-see-why" data-mfc-action="why">See why</button><span class="mfc-utility-group" role="group" aria-label="Card actions">${utilityButton('discuss', 'Discuss')}${utilityButton('snooze', 'Snooze')}${utilityButton('copy', 'Copy link')}</span>`;
        action?.remove();
        const extra = body.querySelector('.mf-practice-chip');
        extra?.remove();
        const detail = card.querySelector('.mf-insight-more');
        card.insertAdjacentHTML('beforeend', charts[id]);
        card.append(footer);
        detail?.remove();
        card.hidden = !!snoozed()[id];
        section.append(card);
      });
      return section;
    });
    stream.replaceChildren(...sections);
    if (sourceNote) stream.append(sourceNote);

    stream.addEventListener('click', async event => {
      const insightLink=event.target.closest('.mfc-card .mfc-primary, .mfc-card .mf-finding-title-link');
      if(insightLink?.closest('[data-finding-id]')){event.preventDefault();openInsightChat(insightLink.closest('.mfc-card'));return;}
      const button = event.target.closest('[data-mfc-action]');
      if (!button) return;
      const card = button.closest('.mfc-card');
      const id = card?.dataset.findingId;
      if (!id) return;
      if (button.dataset.mfcAction === 'snooze') {
        const saved = snoozed(); saved[id] = true;
        localStorage.setItem(snoozeKey, JSON.stringify(saved));
        card.hidden = true;
        const notice = document.createElement('div');
        notice.className = 'mfc-snoozed';
        notice.innerHTML = `Snoozed: ${escaped(card.querySelector('h2')?.textContent || 'finding')} <button type="button">Undo</button>`;
        card.after(notice);
        notice.querySelector('button').addEventListener('click', () => { delete saved[id]; localStorage.setItem(snoozeKey, JSON.stringify(saved)); card.hidden = false; notice.remove(); });
      } else if (button.dataset.mfcAction === 'why') {
        const detail=chatDetails[id],source=sourceViews[id];
        window.MojoSeeWhy?.open({title:card.querySelector('h2')?.textContent.trim(),reason:detail?.summary,source:source?.[0],triggerType:'Mojo Brain',triggerReason:triggerReasons[id],nextStep:detail?.next,href:source?.[1],linkLabel:source?.[2]},button);
      } else if (button.dataset.mfcAction === 'discuss') {
        window.MojoOpenChat?.(`Let's discuss ${card.querySelector('h2')?.textContent.trim()}`);
      } else if (button.dataset.mfcAction === 'copy') {
        try {
          await navigator.clipboard.writeText(new URL(`Portfolio.html#insight=${encodeURIComponent(id)}`, location.href).href);
          button.setAttribute('aria-label', 'Copied link');
          button.dataset.state = 'copied';
          setTimeout(() => { button.setAttribute('aria-label', 'Copy link'); delete button.dataset.state; }, 1800);
        } catch { button.setAttribute('aria-label', 'Copy unavailable'); }
      }
    });
    return true;
  }
  if (!init()) {
    const observer = new MutationObserver(() => { if (init()) observer.disconnect(); });
    observer.observe(document.documentElement, {childList:true, subtree:true});
  }
})();
