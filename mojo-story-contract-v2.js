/* One name and one Today destination for each portfolio finding. */
(() => {
  const findings = Object.freeze({
    flights: { id: 'flight-allocation-2026-10-31', anchor: 'finding-flights', title: 'Three flights ended with less than half their budgets spent' },
    lead: { id: 'lead-definition', anchor: 'finding-lead-definition', title: 'Is the $9 cost-per-conversion target measuring the right thing?' },
    events: { id: 'duplicate-ga4-events', anchor: 'finding-duplicate-events', title: 'Are duplicate events inflating your key events?' },
    delivery: { id: 'waystar-delivery', anchor: 'finding-waystar-delivery', title: '13 Q1 flights are underpacing' },
    visits: { id: 'click-visit-gap', anchor: 'finding-click-visit-gap', title: 'Clicks are missing from site activity' },
    benchmarkGap: { id: 'benchmark-visit-gap', anchor: 'finding-benchmark-visit-gap', title: 'The biggest campaign reached 94% of accounts, but only 18% visited' },
    overlap: { id: 'account-list-overlap', anchor: 'finding-account-overlap', title: 'Account lists overlap across campaigns' },
    unreached: { id: 'waystar-unreached-accounts', anchor: 'finding-unreached-accounts', title: '1,140 surging accounts are outside live campaigns' },
    utms: { id: 'utm-repair', anchor: 'finding-utm-repair', title: 'Mojo repaired missing and malformed UTMs' },
    benchmark: { id: 'demandbase-benchmark', anchor: 'finding-demandbase-benchmark', title: 'D&M_2026 cleared six Demandbase engagement benchmarks' }
  });
  window.MojoFindingRegistry = findings;
  const href = key => `HomeSystem.html#${findings[key].anchor}`;
  const mark = (node, key) => { if (node) node.dataset.findingId = findings[key].id; return node; };
  const link = (key, label, className = 'story-stat-chip') => {
    const a = document.createElement('a');
    a.href = href(key);
    a.className = className;
    a.textContent = label;
    mark(a, key);
    return a;
  };
  const anchorBefore = (node, key) => {
    if (!node || document.getElementById(findings[key].anchor)) return;
    const anchor = document.createElement('span');
    anchor.id = findings[key].anchor;
    anchor.className = 'story-anchor';
    node.before(anchor);
  };
  const replaceText = (node, key) => { if (node) node.textContent = findings[key].title; };

  function brief() {
    const list = document.querySelector('.brief-view-needs .brief-finding-list');
    if (!list) return;
    const budget = list.querySelector('#brief-budget-risk');
    if (budget) {
      mark(budget, 'flights');
      anchorBefore(budget, 'flights');
      replaceText(budget.querySelector('summary .headline'), 'flights');
    }
    const categoryKeys = { measurement: 'lead', tracking: 'events', pacing: 'delivery', benchmarks: 'benchmarkGap', audience: 'overlap' };
    let deliveryRow;
    for (const row of document.querySelectorAll('.brief-view-needs details.drow')) {
      const category = row.querySelector('summary .tag')?.textContent.trim().toLowerCase();
      const key = categoryKeys[category];
      if (!key) continue;
      mark(row, key);
      anchorBefore(row, key);
      replaceText(row.querySelector('summary .headline'), key);
      if (key === 'delivery') deliveryRow = row;
    }
    if (deliveryRow) {
      const repeatedAccountLine = [...deliveryRow.querySelectorAll('.mojoline')].find(node => node.textContent.includes('1,140'));
      repeatedAccountLine?.remove();
      if (!document.getElementById(findings.unreached.anchor)) {
        const owner = document.createElement('section');
        owner.className = 'story-owner';
        owner.id = findings.unreached.anchor;
        mark(owner, 'unreached');
        owner.innerHTML = `<div><span class="story-kicker">ACCOUNT GAP · SOURCE & NEXT STEP</span><h3>${findings.unreached.title}</h3><p>Demandbase identified the cohort. Salesforce outcomes are needed to validate identities and opportunity stages before routing accounts to sales.</p></div><div class="story-owner-actions"><a href="Work.html#handoffs">Review handoffs →</a><a href="Connect.dc.html#salesforce">Review CRM requirements →</a></div>`;
        deliveryRow.after(owner);
      }
    }
  }

  function work() {
    const queue = document.querySelector('#ia-panel-decisions .mp-decision-queue');
    mark(queue, 'flights');
    const panel = document.querySelector('#ia-panel-decisions');
    for (const heading of panel?.querySelectorAll('h3') || []) {
      if (heading.textContent.includes('"leads"')) { replaceText(heading, 'lead'); mark(heading.closest('article,section,div'), 'lead'); }
      if (heading.textContent.includes('Q1 flights')) { replaceText(heading, 'delivery'); mark(heading.closest('article,section,div'), 'delivery'); }
    }
    document.querySelector('#ia-panel-handoffs .aq-head .aq-truth')?.replaceWith(link('unreached', '1,140 accounts → Today'));
  }

  function campaigns() {
    const root = document.querySelector('.ia-portfolio');
    if (!root) return;
    const flights = root.querySelector('.mc-flight-evidence');
    if (flights) {
      mark(flights, 'flights');
      replaceText(flights.querySelector('h2'), 'flights');
      const intro = flights.querySelector('.mc-section-intro');
      intro?.replaceWith(link('flights', '3 flights · ~$90k remaining → Today'));
      flights.querySelector('.mc-flight-decision')?.remove();
    }
    for (const article of root.querySelectorAll('.mc-finding')) {
      const key = article.dataset.finding;
      if (!findings[key]) continue;
      mark(article, key);
      replaceText(article.querySelector('h3'), key);
      if (key === 'visits' || key === 'utms' || key === 'benchmark') article.id = findings[key].anchor;
      if (key === 'delivery') {
        const context = article.querySelector('.mc-finding-context');
        if (context) context.textContent = 'Q1 flight sample · Oct 30 source';
        article.querySelector('.mc-finding-impact')?.replaceWith(link(key, '13 of 20 flights below 40% → Today'));
      }
    }
    const accountPanel = root.querySelector('#ia-panel-accounts');
    const accountTruth = accountPanel?.querySelector('.aq-head .aq-truth');
    accountTruth?.replaceWith(link('unreached', '1,140 accounts → Today'));
    const lens = root.querySelector('#ia-lens');
    const syncAccountSource = () => {
      if (lens?.value !== 'accounts') return;
      const source = root.querySelector('#ia-context-source');
      if (source) source.textContent = 'Demandbase cohort · Oct 30';
    };
    lens?.addEventListener('change', () => requestAnimationFrame(syncAccountSource));
    syncAccountSource();
  }

  function strategy() {
    const hero = document.querySelector('.mc-strategy');
    if (!hero) return;
    const pipeline = hero.querySelector('.mc-metric-grid .mc-metric:nth-child(2)');
    if (pipeline && !pipeline.querySelector('a')) {
      const requirements = document.createElement('a');
      requirements.href = 'Connect.dc.html#salesforce';
      requirements.className = 'story-metric-requirements';
      requirements.textContent = 'What would verify this →';
      pipeline.append(requirements);
    }
    const nextAllocation = hero.querySelector('.mc-metric-grid .mc-metric:nth-child(3)');
    if (nextAllocation) {
      mark(nextAllocation, 'flights');
      nextAllocation.replaceChildren(link('flights', findings.flights.title, 'story-metric-link'));
      nextAllocation.append(Object.assign(document.createElement('strong'), {textContent: '$40k'}));
      nextAllocation.append(Object.assign(document.createElement('small'), {textContent: '3 flights · ~$90k remaining → Today'}));
    }
    const measurement = hero.querySelector('.mc-section .mc-result-intro');
    if (measurement) measurement.textContent = 'CPA needs a shared lead definition and clean conversion events.';
    const accountMove = hero.querySelector('.mc-move-list li:nth-child(3) span');
    accountMove?.replaceChildren(link('unreached', '1,140 accounts → Today'));
    const accountAction = [...document.querySelectorAll('#board-view a')].find(a => /account gap/i.test(a.textContent));
    if (accountAction) { accountAction.href = href('unreached'); accountAction.textContent = 'See account gap → Today'; mark(accountAction, 'unreached'); }
  }

  document.addEventListener('DOMContentLoaded', () => requestAnimationFrame(() => {
    const page = (location.pathname.split('/').pop() || 'HomeSystem').replace(/\.html$/, '');
    if (page === 'HomeSystem' || page === 'index') brief();
    if (page === 'Work') work();
    if (page === 'Portfolio') campaigns();
    if (page === 'Strategy') strategy();
    const scrollToFinding = () => {
      const id = decodeURIComponent(location.hash.slice(1));
      if (id.startsWith('finding-')) document.getElementById(id)?.scrollIntoView({block: 'start'});
    };
    requestAnimationFrame(scrollToFinding);
    window.addEventListener('hashchange', scrollToFinding);
  }));
})();
