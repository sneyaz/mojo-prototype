/* One continuous, cross-app feed. Each card links to the record in its own workspace. */
(() => {
  const campaign = id => `Portfolio.html#insight=${encodeURIComponent(id)}`;
  const audience = id => `AppWorkspace.html?app=audience-builder#dashboards:${encodeURIComponent(id)}`;
  const aeo = id => `AppWorkspace.html?app=aeo#dashboards:${encodeURIComponent(id)}`;
  const items = [
    {group:'attention',source:'Campaigns',topic:'Budget',title:'Three flights ended with less than half their budgets spent.',body:'The three Q3 flights left $45,920 combined. Confirm final spend and end dates before reallocating it.',href:campaign('flight-allocation'),action:'Open flight budgets',visual:{title:'Budget used by flight',bars:[['Q3 ENT TAL',41,100,'41%'],['Q3 CTV ICP',46,100,'46%'],['Q3 Retargeting',48,100,'48%']]}},
    {group:'attention',source:'Audiences',topic:'Freshness',title:'Intent Surge is running on 16-day-old data.',body:'The audience standard calls for an intent refresh every seven days.',href:audience('intent-surge'),action:'Review Intent Surge',visual:{stats:[['16 days','Since the last update'],['7 days','Refresh standard']]}},
    {group:'attention',source:'AEO',topic:'Accuracy',title:'One sampled answer gets annual pricing wrong.',body:'The sampled ChatGPT answer conflicts with the sample pricing page. A content owner should verify the claim.',href:aeo('price-chatgpt'),action:'Review the answer'},
    {group:'attention',source:'Campaigns',topic:'Flight status',title:'Three groups remain live after their Oct 31 end date.',body:'Spend rows continue after the planned end. Confirm platform status before deciding what to do.',href:campaign('ended-live'),action:'Verify flight status',visual:{stats:[['3','Groups to verify'],['Oct 31','Scheduled end'],['47–53%','Budget used']]}},
    {group:'attention',source:'Audiences',topic:'Suppression',title:'Six excluded accounts appear in Product Retargeting.',body:'Customer or do-not-contact flags conflict with a live prospecting audience.',href:audience('product-retargeting'),action:'Review exclusions',visual:{stats:[['6','Accounts to inspect']]}},
    {group:'attention',source:'Campaigns',topic:'Pacing',title:'9 of 22 Q4 flights are underpacing.',body:'Nine flights are below 40% pacing. Check spend plans and active dates before calling the gap lost delivery.',href:campaign('q4-pacing'),action:'See pacing breakdown',visual:{bars:[['Below 40%',9,22,'9 / 22']]}},
    {group:'attention',source:'AEO',topic:'Visibility',title:'Your brand is missing from 3 of 4 comparison answers.',body:'Competitors appear in all four sampled answers. Review the buyer question and the sources those answers use.',href:aeo('best-chatgpt'),action:'Inspect comparison answers',visual:{bars:[['Brand absent',3,4,'3 / 4']]}},
    {group:'attention',source:'Campaigns',topic:'Account coverage',title:'83% account coverage: 5,312 of 6,400 reached.',body:'The separate planning breakdown suggests 803 match issues to investigate: 412 without a DSP match and 391 with low match rates. Confirm whether 285 suppressions are intentional.',href:campaign('unreached'),action:'Review account coverage',visual:{bars:[['Account coverage',5312,6400,'83%'],['Match issues to review',803,1088,'803']]}},
    {group:'attention',source:'Audiences',topic:'Overlap',title:'Tier 1 Named and Enterprise Intent overlap by 42%.',body:'Both audiences feed live campaigns, so the same account may see both.',href:audience('tier-1-named'),action:'Review overlap',visual:{bars:[['Shared accounts',42,100,'42%']]}},
    {group:'attention',source:'Campaigns',topic:'Tracking',title:'16 paid-looking UTMs are not assigned to a campaign group.',body:'Those tags account for 2,222 sessions in seven days. Map them before comparing campaign conversions.',href:campaign('unassigned-utms'),action:'Open the tracking rule',visual:{stats:[['16','Unassigned UTMs'],['2,222','Sessions'],['7 days','Window']]}},
    {group:'attention',source:'AEO',topic:'Citations',title:'Your Salesforce guide is cited in only 1 of 4 integration answers.',body:'The other sampled answers lean on third-party roundups. Check whether your page answers the question clearly.',href:aeo('sf-perplexity'),action:'Inspect cited sources',visual:{bars:[['Your site cited',1,4,'1 / 4']]}},
    {group:'attention',source:'Audiences',topic:'Size change',title:'Healthcare Fit shrank 23% after its last update.',body:'Healthcare Search may now reach fewer accounts than planned.',href:audience('healthcare-fit'),action:'Investigate the drop',visual:{bars:[['Audience retained',77,100,'77%']]}},
    {group:'knowing',source:'Campaigns',topic:'Measurement',title:'Google Ads cost per conversion is $188 against a $9 target.',body:'The target and recorded conversion event may measure different things. Validate both before comparing performance.',href:campaign('cpa-target'),action:'See target comparison',visual:{bars:[['Actual',188,188,'$188'],['Target',9,188,'$9']]}},
    {group:'knowing',source:'AEO',topic:'Referrals',title:'ChatGPT / OpenAI sent 3,482 sessions.',body:'It accounts for most listed answer-engine referrals and 24 of the 26 key events. Check source variants and landing pages.',href:'AppWorkspace.html?app=aeo#dashboards',action:'Inspect engine traffic',visual:{stats:[['3,482','Sessions'],['24','Key events']]}},
    {group:'knowing',source:'Audiences',topic:'Performance',title:'Trial Recovery trails a similar retargeting audience.',body:'Account engagement is 1.6% versus 2.3%. Check criteria and delivery before changing creative.',href:audience('trial-recovery'),action:'Compare the audiences',visual:{bars:[['Trial Recovery',1.6,2.3,'1.6%'],['Comparison',2.3,2.3,'2.3%']]}},
    {group:'knowing',source:'Campaigns',topic:'Traffic',title:'Sessions rose 41% above the 28-day baseline.',body:'Sessions reached 18,420 against a 13,060 baseline. Audit source tags before crediting a campaign.',href:campaign('traffic-baseline'),action:'Review traffic sources',visual:{bars:[['This period',18420,18420,'18,420'],['Baseline',13060,18420,'13,060']]}},
    {group:'knowing',source:'AEO',topic:'Landing page',title:'453 referrals have no landing page set.',body:'Only 15 were engaged. Investigate GA4 page-path collection and traffic quality before calling them bot visits.',href:'AppWorkspace.html?app=aeo#dashboards',action:'Review landing pages',visual:{stats:[['453','Page not set'],['15','Engaged']]}},
    {group:'knowing',source:'Campaigns',topic:'Weekly change',title:'Spend fell 6%; platform conversions rose to 21.',body:'Oct 27–Nov 2 spend fell from about $15,685 to $14,748, while platform conversions rose from 16 to 21.',href:campaign('weekly-efficiency'),action:'Compare weekly totals',visual:{stats:[['$14,748','This week spend'],['21','This week conversions'],['$15,685','Prior week spend']]}},
    {group:'knowing',source:'AEO',topic:'Pricing',title:'Pricing received 15 referred sessions.',body:'One was engaged. This small sample does not establish a conversion problem.',href:'AppWorkspace.html?app=aeo#dashboards',action:'Review pricing referrals',visual:{stats:[['15','Referred sessions'],['1','Engaged']]}},
    {group:'knowing',source:'Campaigns',topic:'Account lift',title:'604 reached accounts were marked lifted.',body:'That is 11.37% of reached accounts. The export does not define a comparison group, so it cannot establish incremental pipeline.',href:campaign('lifted'),action:'See lift evidence',visual:{bars:[['Marked lifted',604,5312,'604 / 5,312']]}},
    {group:'knowing',source:'Campaigns',topic:'Engagement',title:'Customer Try-It cleared six engagement checks.',body:'That supports another test, but pipeline impact needs account-level CRM dates.',href:campaign('engagement-checks'),action:'See the outcome gap',visual:{stats:[['6 / 6','Checks passed']]}},
    {group:'knowing',source:'Campaigns',topic:'Clicks',title:'Customer Try-It drew 3,214 clicks.',body:'Check the landing page and account mix before repeating it.',href:campaign('customer-campaign'),action:'Open campaign metrics',visual:{stats:[['2,921,818','Impressions'],['0.110%','CTR'],['612','Accounts reached']]}},
    {group:'knowing',source:'Campaigns',topic:'CTV',title:'CTV spent $21,640 and recorded nine clicks.',body:'Five CTV rows delivered 721,333 impressions. Clicks alone cannot show whether video reached intended accounts.',href:campaign('ctv-measure'),action:'Compare CTV delivery',visual:{stats:[['$21,640','Spend'],['721,333','Impressions'],['9','Clicks']]}},
    {group:'knowing',source:'Campaigns',topic:'Measurement',title:'214 opportunities were reported without an exposure join.',body:'The CRM summary also reports 37 wins. Neither count is joined to account-level exposure, spend, or dates.',href:campaign('influence-gap'),action:'See required data',visual:{stats:[['214','Opportunities'],['37','Wins'],['Missing','Exposure join']]}},
    {group:'decisions',source:'Campaigns',topic:'Account coverage',title:'Improve coverage by checking DSP matches.',body:'Mojo suggests verifying the 412 accounts without a DSP match first, then reviewing 391 low match rates. Confirm whether the 285 suppressions are intentional. These are planning counts to verify.',href:'HomeSystem.html#feed-decisions',action:'Review the decision',visual:{stats:[['83%','Coverage'],['803','Match issues to review'],['285','Suppressions to confirm']]}},
    {group:'decisions',source:'Audiences',topic:'New matches',title:'Review 214 new Enterprise Intent matches.',body:'They meet the saved criteria but are not yet in the audience. Check exclusions and ownership first.',href:'AppWorkspace.html?app=audience-builder#feed-decisions',action:'Review additions',visual:{stats:[['214','New matches']]}},
    {group:'decisions',source:'AEO',topic:'Accuracy',title:'Assign an owner to the annual-pricing claim.',body:'The sampled answer conflicts with the sample pricing page. Verify both before requesting a change.',href:'AppWorkspace.html?app=aeo#feed-decisions',action:'Review the claim'},
    {group:'decisions',source:'Campaigns',topic:'CTV',title:'Set a CTV measure beyond clicks.',body:'Nine clicks across five campaigns do not show whether video reached target accounts. Compare completed views and account reach.',href:'HomeSystem.html#feed-decisions',action:'Review the measure'},
    {group:'decisions',source:'Audiences',topic:'Approval',title:'Regional Lookalike needs a launch review.',body:'Check match quality and exclusions before the 760-account lookalike audience goes live.',href:'AppWorkspace.html?app=audience-builder#feed-decisions',action:'Review the audience',visual:{stats:[['760','Accounts to review']]}},
    {group:'decisions',source:'AEO',topic:'Visibility',title:'Decide which comparison answer gap to address first.',body:'Your brand is absent in three of four sampled comparison answers. Review visible sources before assigning content work.',href:'AppWorkspace.html?app=aeo#feed-decisions',action:'Review comparison answers'},
    {group:'decisions',source:'Campaigns',topic:'Measurement',title:'Only count opportunities we can link to an ad.',body:'Check the account, ad date and spend before reporting impact.',href:'HomeSystem.html#feed-decisions',action:'Review the rule'},
    {group:'receipts',source:'Campaigns',topic:'Tracking',title:'Repaired 6 malformed email UTMs.',body:'Sample receipt: six email UTM links were rewritten to the tracking format.',href:'HomeSystem.html#feed-receipts',action:'View changes'},
    {group:'receipts',source:'Campaigns',topic:'Tracking',title:'Mapped 16 stray tags.',body:'Sample receipt connected paid-looking UTMs to campaign groups.',href:'HomeSystem.html#feed-receipts',action:'View mapping'},
    {group:'receipts',source:'Campaigns',topic:'Reporting',title:'Drafted 3 weekly reports.',body:'Drafts await a person to review them before sharing.',href:'HomeSystem.html#feed-receipts',action:'Open drafts'},
    {group:'receipts',source:'Campaigns',topic:'Analysis',title:'Logged the mobile engagement gap.',body:'Sample record of a finding Mojo filed for review.',href:'HomeSystem.html#feed-receipts',action:'Open the log'},
    {group:'receipts',source:'Campaigns',topic:'Budget',title:'Filed the overdue Spend Review.',body:'Sample receipt for the monthly spend review.',href:'HomeSystem.html#feed-receipts',action:'View the review'}
  ];
  const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const read = key => { try { return JSON.parse(localStorage.getItem(key) || '{}') || {}; } catch { return {}; } };
  const snoozeKey = 'mojo-home-feed-snoozed-v1';
  const voteKey = 'mojo-home-feed-votes-v1';
  const approvalKey = 'mojo-board-approved-feed-v1';
  const itemKey = item => `${item.source}:${item.group}:${item.title}:${item.href}`;
  const iconPaths = {
    discuss:'<path d="M20 11.5a8 8 0 0 1-8 8 8.4 8.4 0 0 1-3.6-.8L4 20l1.3-4.4A8 8 0 1 1 20 11.5Z"/>',
    snooze:'<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 1.5M9 2h6"/>',
    copy:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
    up:'<path d="M7 10v11H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3Zm0 0 5-8a2 2 0 0 1 3 2v5h5a2 2 0 0 1 2 2l-1 8a2 2 0 0 1-2 2H7"/>',
    down:'<path d="M7 14V3H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3Zm0 0 5 8a2 2 0 0 0 3-2v-5h5a2 2 0 0 0 2-2l-1-8a2 2 0 0 0-2-2H7"/>'
  };
  const iconButton = (action, label, pressed) => `<button type="button" data-home-action="${action}" aria-label="${label}"${pressed === undefined ? '' : ` aria-pressed="${pressed}"`}><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${iconPaths[action]}</svg></button>`;
  const audienceActions = read('mojo-audiences-workspace-v1').actions || {};
  Object.keys(audienceActions).forEach(id => items.push({group:'receipts',source:'Audiences',topic:'Draft',title:`Prepared an audience review draft.`,body:'Saved in this browser; no audience membership changed.',href:audience(id),action:'Open the audience'}));
  const aeoDrafts = read('mojo-aeo-workspace-v1').drafts || {};
  Object.keys(aeoDrafts).forEach(id => items.push({group:'receipts',source:'AEO',topic:'Draft',title:'Prepared an answer review brief.',body:'Saved in this browser; no website content was published.',href:aeo(id),action:'Open the evidence'}));
  const visual = data => {
    if (!data) return '';
    const title = data.title ? `<strong class="home-visual-title">${escape(data.title)}</strong>` : '';
    if (data.bars) return `<div class="home-visual">${title}<div class="home-bars">${data.bars.map(([label,value,max,display]) => `<div><span>${escape(label)}</span><progress value="${Number(value)}" max="${Number(max)}">${escape(display)}</progress><b>${escape(display)}</b></div>`).join('')}</div></div>`;
    return `<div class="home-visual"><div class="home-stats" style="--columns:${Math.min(data.stats.length,3)}">${data.stats.map(([value,label]) => `<div><strong>${escape(value)}</strong><small>${escape(label)}</small></div>`).join('')}</div></div>`;
  };
  const card = item => {
    const key = itemKey(item);
    if (item.group === 'decisions' && read(approvalKey)[key]) return `<div class="home-done-receipt" data-home-key="${escape(key)}"><span class="home-done-check" aria-hidden="true">✓</span><strong>Done</strong><span>${escape(item.title)}</span><button type="button" data-home-action="unapprove">Undo</button></div>`;
    if (read(snoozeKey)[key]) return `<div class="home-snoozed" data-home-key="${escape(key)}"><span>Snoozed: ${escape(item.title)}</span><button type="button" data-home-action="undo">Undo</button></div>`;
    const vote = read(voteKey)[key];
    return `<article class="home-card" data-home-key="${escape(key)}"><div class="home-meta"><span class="home-source ${item.source.toLowerCase()}">${escape(item.source)}</span>${item.group === 'decisions' ? '<span class="home-kind">Decision</span>' : ''}<span class="home-topic">${escape(item.topic)}</span></div><h3><a href="${escape(item.href)}">${escape(item.title)}</a></h3><p>${escape(item.body)}</p>${visual(item.visual)}<div class="home-actions"><a href="${escape(item.href)}">${escape(item.action)} <span aria-hidden="true">→</span></a>${item.group === 'decisions' ? '<button type="button" class="home-approve" data-home-action="approve">Approve next step</button>' : ''}<span class="home-utilities" role="group" aria-label="Card actions">${iconButton('discuss','Discuss')}${iconButton('snooze','Snooze')}${iconButton('copy','Copy link')}${iconButton('up','Helpful',vote === 'up')}${iconButton('down','Not helpful',vote === 'down')}</span></div></article>`;
  };
  const labels = {attention:'Needs attention',knowing:'Worth knowing',decisions:'Decisions',receipts:'What Mojo did'};
  const root = document.getElementById('home-feed');
  const filter = document.querySelector('.home-source-filter');
  if (!root || !filter) return;
  const greetingWord = (() => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; })();
  const fixCount = items.filter(item => item.group === 'attention').length;
  const optimizeCount = items.filter(item => item.group === 'decisions').length;
  const greetingHtml = `<div class="mfd-feed-greeting"><p class="mfd-greeting-name">${greetingWord}, Pam!</p><p class="mfd-greeting-summary">${fixCount} fix${fixCount === 1 ? '' : 'es'} need attention. ${optimizeCount} optimization${optimizeCount === 1 ? '' : 's'} ${optimizeCount === 1 ? 'is' : 'are'} ready to review. <span class="mfd-greeting-scan">Last scan 12 minutes ago</span></p></div>`;
  filter.querySelectorAll('[data-home-count]').forEach(count => {
    count.textContent = items.filter(item => count.dataset.homeCount === 'all' || item.source === count.dataset.homeCount).length;
  });
  let currentSource = 'all';
  const render = source => {
    currentSource = source;
    const visible = items.filter(item => source === 'all' || item.source === source);
    const grouped = Object.entries(labels).map(([group,label]) => {
      const rows = visible.filter(item => item.group === group);
      return rows.length ? `<section class="home-section" aria-label="${label}"><h2 class="home-section-title">${group==='receipts'?'Recently Completed':label}<span ${group==='receipts'?'data-home-done-count':''}>${group==='receipts'?rows.length+Object.keys(read(approvalKey)).length:rows.length}</span></h2>${rows.map(card).join('')}</section>` : '';
    }).join('');
    root.innerHTML = greetingHtml + grouped + '<p class="home-footer">Campaign and audience examples are scenario data. AEO referral counts come from the supplied GA4 export; answer checks are illustrative. Drafts and changes shown here are sample or browser-local records.</p>';
    filter.querySelectorAll('[data-home-source]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.homeSource === source)));
  };
  filter.addEventListener('click', event => {
    const button = event.target.closest('[data-home-source]');
    if (button) render(button.dataset.homeSource);
  });
  render('all');
  root.addEventListener('click', async event => {
    const button = event.target.closest('[data-home-action]');
    if (!button) return;
    const card = button.closest('[data-home-key]');
    const key = card?.dataset.homeKey;
    if (!key) return;
    const action = button.dataset.homeAction;
    if(action === 'approve'){
      card.classList.add('home-card-folding');
      button.disabled=true;
      setTimeout(()=>{const saved=read(approvalKey);saved[key]=true;localStorage.setItem(approvalKey,JSON.stringify(saved));render(currentSource);const receipt=[...root.querySelectorAll('.home-done-receipt')].find(row=>row.dataset.homeKey===key);receipt?.classList.add('home-done-arriving');const fish=document.querySelector('.mojo-companion');if(fish){fish.classList.remove('board-fish-hop');void fish.offsetWidth;fish.classList.add('board-fish-hop');setTimeout(()=>fish.classList.remove('board-fish-hop'),900);}},420);
      return;
    }
    if(action === 'unapprove'){
      const saved=read(approvalKey);delete saved[key];localStorage.setItem(approvalKey,JSON.stringify(saved));render(currentSource);return;
    }
    if (action === 'undo' || action === 'snooze') {
      const saved = read(snoozeKey);
      if (action === 'snooze') saved[key] = true;
      else delete saved[key];
      localStorage.setItem(snoozeKey, JSON.stringify(saved));
      render(currentSource);
    } else if (action === 'discuss') {
      const title = card.querySelector('h3')?.textContent.trim();
      window.MojoOpenChat?.(`Let's discuss this ${title ? `finding: ${title}` : 'feed item'}`);
    } else if (action === 'copy') {
      const href = card.querySelector('h3 a')?.getAttribute('href');
      try {
        await navigator.clipboard.writeText(new URL(href, location.href).href);
        button.setAttribute('aria-label', 'Copied link');
        setTimeout(() => button.setAttribute('aria-label', 'Copy link'), 1600);
      } catch { button.setAttribute('aria-label', 'Copy unavailable'); }
    } else if (action === 'up' || action === 'down') {
      const saved = read(voteKey);
      saved[key] = saved[key] === action ? '' : action;
      localStorage.setItem(voteKey, JSON.stringify(saved));
      card.querySelectorAll('[data-home-action="up"],[data-home-action="down"]').forEach(control => control.setAttribute('aria-pressed', String(control.dataset.homeAction === saved[key])));
    }
  });
})();
