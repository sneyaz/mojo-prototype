/* Portfolio is the default scope; the supplied detailed Performance values cover Alkami. */
document.addEventListener('DOMContentLoaded', () => {
  const main = document.querySelector('main.canvaspane');
  const selector = main?.querySelector('.clientsel select');
  const overview = main?.querySelector('.tab-ov');
  const pacingTab = main?.querySelector('.tab-pc');
  if (!main || !selector || !overview || !pacingTab) return;

  const budgetSection = overview.querySelector(':scope > section.panel');
  const benchmarkSection = budgetSection?.nextElementSibling;
  const influenceSection = overview.querySelector('#influence');
  const pacingSection = pacingTab.querySelector(':scope > section.panel');
  const budgetBars = [...(budgetSection?.querySelectorAll('.bar') || [])];
  const pacingBars = [...(pacingSection?.querySelectorAll('.bar') || [])];
  const records = new Map(budgetBars.map(bar => {
    const name = bar.querySelector(':scope > span:first-child')?.textContent.trim();
    const budget = bar.querySelector('.n')?.textContent.trim();
    return [name, {name, budget}];
  }));
  pacingBars.forEach(bar => {
    const name = bar.querySelector(':scope > span:first-child')?.textContent.trim();
    if (records.has(name)) records.get(name).pacing = bar.querySelector('.n')?.textContent.trim();
  });
  if (records.size !== 10) return;

  const make = (tag, className, value) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (value !== undefined) node.textContent = value;
    return node;
  };
  const route = name => `Portfolio.html#campaign=${encodeURIComponent(name)}&view=brief`;
  const header = main.querySelector(':scope > h1');
  const subtitle = header?.nextElementSibling;
  const fieldLabel = main.querySelector('.clientsel label');
  if (header) header.textContent = 'Campaign performance';
  if (fieldLabel) fieldLabel.textContent = 'Scope';
  const portfolioPanel = make('section', 'performance-portfolio-panel');
  portfolioPanel.append(
    make('p', 'performance-portfolio-kicker', 'PORTFOLIO OVERVIEW'),
    make('h2', '', 'Performance across the sample portfolio'),
    make('p', 'performance-portfolio-description', 'This demo combines separate sample exports. Open a campaign set for its reported measures; totals are not one connected account.'),
  );
  const setScope = value => {
    selector.value = value;
    selector.dispatchEvent(new Event('change', {bubbles: true}));
  };
  const stat = (value, label, note) => {
    const card = make('div', 'performance-portfolio-stat');
    card.append(make('strong', '', value), make('span', '', label), make('small', '', note));
    return card;
  };
  const metrics = make('div', 'performance-portfolio-stats');
  metrics.append(
    stat('284', 'Campaign records', 'Composite sample'),
    stat('2', 'Detailed campaign sets', 'Source excerpts'),
    stat('$2.2M', 'Sample budget total', 'Across separate exports'),
    stat('6', 'Engagement checks passed', 'Outcome unverified')
  );
  portfolioPanel.append(metrics);
  const pipelineGate = make('section', 'performance-pipeline-gate mojo-unlocks');
  const pipelineRow = make('div','mojo-unlock-row');
  const pipelineContent = make('div','mojo-unlock-content');
  const pipelineLogo = make('img','mojo-unlock-logo');
  pipelineLogo.src = 'assets/salesforce.png'; pipelineLogo.alt = '';
  const pipelineCopy = make('div','mojo-unlock-text');
  pipelineCopy.append(
    make('strong', '', 'See which spend creates pipeline'),
    make('small', '', 'Salesforce · opportunity stages and account outcomes')
  );
  pipelineContent.append(pipelineLogo, pipelineCopy);
  const pipelineLink = make('a', 'mojo-unlock-action', 'Requirements');
  pipelineLink.href = 'Connect.dc.html#salesforce';
  pipelineLink.setAttribute('aria-label','Review CRM data required to verify pipeline outcomes');
  pipelineRow.append(pipelineContent, pipelineLink);
  pipelineGate.append(pipelineRow);
  portfolioPanel.append(pipelineGate);
  const exposure = make('section', 'performance-portfolio-exposure');
  exposure.append(make('h3', '', 'Budget pacing exposure'));
  const exposureGrid = make('div', 'performance-portfolio-exposure-grid');
  exposureGrid.append(
    stat('$826,718', 'Under-pacing to diagnose', 'Check cause before reallocation'),
    stat('$130,159', 'Over-pacing exposure', 'Portfolio strategy rollup')
  );
  exposure.append(exposureGrid);
  portfolioPanel.append(exposure);
  const clients = make('section', 'performance-portfolio-clients');
  clients.append(
    make('h3', '', 'Available source rollups'),
    make('p', '', 'These two campaign sets have enough reported detail to inspect. Their source windows differ.')
  );
  const clientList = make('div', 'performance-portfolio-client-list');
  const clientRow = (name, meta, budget, pacing, scope) => {
    const row = make('button', 'performance-portfolio-client');
    row.type = 'button';
    const identity = make('span', 'performance-portfolio-client-name');
    identity.append(make('strong', '', name), make('small', '', meta));
    row.append(identity, make('span', '', budget), make('span', '', pacing), make('span', 'performance-portfolio-client-arrow', '→'));
    row.addEventListener('click', () => setScope(scope));
    return row;
  };
  clientList.append(
    clientRow('Demandbase set', '10 documented Demandbase campaigns', '$319,706 budget', '93.2% average pacing', 'alkami'),
    clientRow('Q1 flight set', '20 campaigns in strategy rollup', '$304,976 budget', '46% average pacing', 'waystar')
  );
  clients.append(clientList);
  portfolioPanel.append(clients, make('p', 'performance-portfolio-source', 'Source: Strategy portfolio rollup, Performance source report, and Activity evidence. Reporting windows differ by source.'));
  main.querySelector('.clientsel').after(portfolioPanel);
  const waystarPanel = make('section', 'performance-portfolio-panel performance-waystar-panel');
  waystarPanel.append(
    make('p', 'performance-portfolio-kicker', 'SOURCE SAMPLE · Q1 FLIGHTS'),
    make('h2', '', 'Q1 flight pacing'),
    make('p', 'performance-portfolio-description', 'Reported source totals from Strategy and Activity. Individual campaign metrics are available where named in the campaign explorer.')
  );
  const waystarMetrics = make('div', 'performance-portfolio-stats');
  waystarMetrics.append(
    stat('20', 'Campaigns', 'Strategy source rollup'),
    stat('$304,976', 'Budget', 'Strategy source rollup'),
    stat('46%', 'Average pacing', 'Activity source report'),
    stat('13 of 20', 'Under 40% paced', 'Since January; Activity evidence')
  );
  waystarPanel.append(waystarMetrics);
  const waystarLinks = make('div', 'performance-portfolio-links');
  [['Review pacing evidence →', 'HomeSystem.html#finding-waystar-delivery'], ['Browse Q1 campaigns →', 'Portfolio.html#campaigns']].forEach(([label, href]) => {
    const link = make('a', '', label);
    link.href = href;
    waystarLinks.append(link);
  });
  waystarPanel.append(waystarLinks);
  portfolioPanel.after(waystarPanel);
  if (influenceSection) {
    const influenceNotes = {
      'Average deal size': 'Selected account cohort; source-reported average.',
      'Revenue': 'Account outcome in this window. Not ad-attributed.',
      'Pipeline': 'Account outcome; stages may overlap. Not ad-attributed.',
      'Opportunity to won': 'Selected account cohort; source-reported duration.'
    };
    influenceSection.querySelectorAll('.source-data-metric').forEach(metric => {
      const label = metric.querySelector(':scope > span')?.textContent.trim();
      const metricKind = label?.startsWith('Pipeline') ? 'Pipeline' : label;
      if (!metricKind || !influenceNotes[metricKind]) return;
      metric.append(make('small', 'performance-influence-note', influenceNotes[metricKind]));
      if (metricKind === 'Pipeline' && !metric.querySelector('.performance-attribution-badge')) {
        const value = metric.querySelector(':scope > strong');
        value?.after(make('span', 'performance-attribution-badge', 'Account pipeline · not ad-attributed'));
      }
      if (metricKind === 'Revenue' || metricKind === 'Pipeline') metric.classList.add('is-influence-outcome');
    });
    const note = influenceSection.querySelector('.source-data-note');
    if (note) {
      // Keep the attribution boundary on the figures; collect the longer
      // methodology copy in one disclosure instead of four card footnotes.
      const revenue = [...influenceSection.querySelectorAll('.source-data-metric')]
        .find(metric => metric.querySelector(':scope > span')?.textContent.trim() === 'Revenue');
      if (revenue && !revenue.querySelector('.performance-attribution-badge')) {
        revenue.querySelector(':scope > strong')?.after(make('small', 'performance-attribution-badge', 'Not ad-attributed'));
      }
      const details = make('details', 'mojo-data-details');
      const summary = make('summary', '', 'How to read these outcomes');
      const body = make('div', 'mojo-data-details-body');
      note.prepend(make('strong', 'performance-influence-lead', 'Account outcomes, not an ad-attributed funnel. '));
      body.append(note);
      const definitions = make('dl', 'mojo-data-definitions');
      influenceSection.querySelectorAll('.source-data-metric').forEach(metric => {
        const explanation = metric.querySelector('.performance-influence-note');
        if (!explanation) return;
        definitions.append(make('dt', '', metric.querySelector(':scope > span')?.textContent.trim() || 'Metric'));
        const definition = make('dd', '', explanation.textContent);
        definitions.append(definition);
        explanation.remove();
      });
      body.append(definitions);
      details.append(summary, body);
      influenceSection.append(details);
    }
  }
  document.title = 'Mojo — Campaign performance';

  // Preserve the source charts and values. Replace the inert client options
  // with the campaigns actually represented by these charts.
  selector.replaceChildren(new Option('Composite sample · 284 records', 'portfolio'), new Option('Demandbase set · 10 campaigns', 'alkami'), new Option('Q1 flight set · 20 campaigns', 'waystar'));
  records.forEach(record => selector.add(new Option(record.name, record.name)));
  const requestedScope = new URLSearchParams(location.hash.slice(1)).get('scope');
  selector.value = requestedScope === 'alkami' || requestedScope === 'waystar' ? requestedScope : records.has(requestedScope) ? requestedScope : 'portfolio';
  selector.setAttribute('aria-label', 'Choose performance scope or campaign');
  selector.dataset.searchable = 'true';
  const directory = make('a', 'performance-directory-link', 'Open campaign explorer ↗');
  directory.href = 'Portfolio.html#campaigns';
  main.querySelector('.clientsel').append(directory);

  for (const bar of [...budgetBars, ...pacingBars]) {
    const label = bar.querySelector(':scope > span:first-child');
    const name = label?.textContent.trim();
    if (!records.has(name)) continue;
    const link = make('a', 'performance-bar-link', name);
    link.href = route(name);
    link.setAttribute('aria-label', `Open ${name} campaign brief`);
    label.replaceChildren(link);
  }

  const overviewFocus = make('section', 'panel performance-focus-panel');
  overviewFocus.hidden = true;
  overview.querySelector('.cardgrid')?.after(overviewFocus);
  const pacingFocus = make('section', 'panel performance-focus-panel');
  pacingFocus.hidden = true;
  pacingTab.append(pacingFocus);

  const side = document.querySelector('.sidebarpane');
  const oldClientBox = side?.querySelector(':scope > .sbox:first-child');
  if (oldClientBox) oldClientBox.hidden = true;
  const scopeBox = make('div', 'sbox performance-scope-box');
  side?.prepend(scopeBox);
  const addLine = (parent, label, value) => {
    const line = make('div', 'performance-focus-line');
    line.append(make('span', '', label), make('strong', '', value));
    parent.append(line);
  };
  const renderPanel = (panel, record, isPacing) => {
    panel.replaceChildren();
    panel.append(make('p', 'performance-focus-kicker', 'DEMANDBASE SAMPLE · CAMPAIGN'), make('h2', '', record.name));
    const description = isPacing
      ? record.pacing ? 'Reported average pacing for this campaign.' : 'A campaign pacing value is not shown in this sample.'
      : 'Reported campaign values from the Demandbase sample budget comparison.';
    panel.append(make('p', 'performance-focus-description', description));
    const ledger = make('div', 'performance-focus-ledger');
    if (!isPacing) addLine(ledger, 'Total budget', record.budget);
    if (record.pacing) addLine(ledger, 'Average pacing', record.pacing);
    panel.append(ledger);
    const link = make('a', 'performance-focus-detail-link', 'Open this campaign’s workspace →');
    link.href = route(record.name);
    panel.append(link);
  };
  const render = () => {
    const record = records.get(selector.value);
    const focused = !!record;
    const portfolio = selector.value === 'portfolio';
    const waystar = selector.value === 'waystar';
    main.classList.toggle('performance-is-focused', focused);
    portfolioPanel.hidden = !portfolio;
    waystarPanel.hidden = !waystar;
    main.querySelector('.ctabs').hidden = portfolio || waystar;
    overview.hidden = portfolio || waystar;
    pacingTab.hidden = portfolio || waystar;
    overview.querySelector('.cardgrid').hidden = focused || portfolio || waystar;
    for (const section of [budgetSection, benchmarkSection, influenceSection, pacingSection]) {
      if (section) section.hidden = focused || portfolio || waystar;
    }
    overviewFocus.hidden = !focused || portfolio || waystar;
    pacingFocus.hidden = !focused || portfolio || waystar;
    if (subtitle) subtitle.textContent = portfolio
      ? 'Illustrative metrics from separate sample exports.'
      : waystar ? 'Q1 flight set · 20 campaigns in the source rollup'
      : focused ? 'Demandbase set · one campaign' : 'Demandbase set · 10 documented campaigns';
    scopeBox.replaceChildren(make('h3', '', 'Reporting scope'));
    addLine(scopeBox, 'Viewing', portfolio ? 'Portfolio' : waystar ? 'Q1 flight set' : focused ? record.name : 'Demandbase set');
    addLine(scopeBox, 'Campaigns', portfolio ? '284 sample records' : waystar ? '20 Q1 flights' : focused ? '1 campaign' : '10 campaigns');
    if (portfolio) scopeBox.append(make('p', 'performance-scope-note', 'These are separate example exports, not one company account.'));
    if (focused) {
      renderPanel(overviewFocus, record, false);
      renderPanel(pacingFocus, record, true);
    }
  };
  selector.addEventListener('change', render);
  render();
});
