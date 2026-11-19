/* Focus the Brief on source-backed campaign rows without inventing filtered totals. */
document.addEventListener('DOMContentLoaded', () => {
  const view = document.querySelector('.brief-view-needs');
  const grid = view?.querySelector('.healthgrid');
  const heading = grid?.previousElementSibling;
  if (!view || !grid || !heading) return;

  // These are the campaign records visible in Portfolio.html and its evidence tables.
  const records = [
    {name:'GO Prep', platform:'Google Ads', read:'Flight ended Oct 31', pacing:'45%', spent:'$27,290', budget:'$60,000', soon:true, attention:true},
    {name:'Q4 Pipeline Search', platform:'Google Ads', read:'Flight ended Oct 31', pacing:'43%', spent:'$25,589', budget:'$60,000', soon:true, attention:true},
    {name:'Enterprise Retargeting', platform:'Google Ads', read:'Flight ended Oct 31', pacing:'47%', spent:'$21,354', budget:'$45,000', soon:true, attention:true},
    {name:'MOF — Patient Payments', client:'Q1 flight sample', platform:'Demandbase Ads', read:'Stalled delivery', pacing:'6%', attention:true},
    {name:'D&M_2026', client:'Demandbase sample', platform:'Demandbase Ads', read:'On track', pacing:'96%'},
    {name:'Q4 Enterprise Pipeline', platform:'LinkedIn Ads', read:'On track', pacing:'91%'},
    {name:'Commerce/Holiday 2026', platform:'Demandbase Ads', read:'Clicked, low visits', pacing:'82%', attention:true},
    {name:'MOF - RCM - Q126', client:'Q1 flight sample', platform:'Source not specified', read:'Under', pacing:'0.4%', budget:'$4,830', attention:true},
    {name:'Q4FY26_CSA_Signal_Path_CTV', platform:'Demandbase Ads', spent:'$416.64', remaining:'$3,672.78'},
    {name:'Q4FY26_CSA_Signal_Path_Display', platform:'Demandbase Ads', spent:'$975.38', remaining:'$6,708.38'},
    {name:'Q4FY26_CSA_Signal_Path_PreRoll', platform:'Demandbase Ads', spent:'$517.71', remaining:'$3,571.14'},
    {name:'Q3FY26_Aster_CTV', platform:'Demandbase Ads', spent:'$10,238.03', remaining:'$22,493.63'},
    {name:'Q3FY26_Aster_Personalization_Display', platform:'Demandbase Ads', spent:'$20,921.63', remaining:'$44,538.48'},
    {name:'Q3FY26_Aster_PreRoll', platform:'Demandbase Ads', spent:'$10,438.32', remaining:'$22,284.79'},
    {name:'Q4FY26_CSA_Cloud_Path_CTV', platform:'Demandbase Ads', spent:'$6,757.70', remaining:'$17,148.47'},
    {name:'Q4FY26_CSA_Cloud_Path_Display', platform:'Demandbase Ads', spent:'$13,374.93', remaining:'$28,436.81'},
    {name:'Q4FY26_CSA_Cloud_Path_PreRoll', platform:'Demandbase Ads', spent:'$7,627.83', remaining:'$16,261.50'},
    {name:'Q4FY26_CSA_Cloud_Path_Security_Display', platform:'Demandbase Ads', spent:'$11,037.78', remaining:'$23,773.39'}
  ];
  const channelOf = record => /(?:^|[_ -])CTV(?:$|[_ -])/i.test(record.name) ? 'CTV'
    : /PreRoll/i.test(record.name) ? 'Pre-roll'
    : /Display/i.test(record.name) ? 'Display'
    : /Search/i.test(record.name) ? 'Search'
    : 'Unspecified';
  records.forEach(record => { record.channel = channelOf(record); });
  const selected = new Set();
  let mode = 'all';
  let channel = 'all';
  let platform = 'all';
  const savedFocus = new URLSearchParams(location.search);
  if (['soon', 'attention'].includes(savedFocus.get('focus'))) mode = savedFocus.get('focus');
  if (savedFocus.get('focus') === 'custom') {
    savedFocus.getAll('campaign').forEach(name => {
      if (records.some(record => record.name === name)) selected.add(name);
    });
    if (selected.size) mode = 'custom';
  }
  const make = (tag, className, textContent) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (textContent !== undefined) element.textContent = textContent;
    return element;
  };

  const head = make('div', 'brief-focus-head');
  heading.before(head);
  head.append(heading);
  const allLink = make('a', 'brief-focus-all-link', 'Open campaign explorer ↗');
  allLink.href = 'Portfolio.html#campaigns';
  head.append(allLink);
  const intro = make('p', 'brief-focus-intro', 'Portfolio totals. Choose a focus to see the campaigns behind it and open an individual brief.');
  intro.hidden = true;
  head.after(intro);

  const controls = make('div', 'brief-focus-controls');
  controls.id = 'brief-focus-controls';
  controls.setAttribute('role', 'group');
  controls.setAttribute('aria-label', 'Campaign focus');
  const buttons = {};
  for (const [key, label] of [['all','All campaigns'],['soon','Ending soon'],['attention','Needs attention']]) {
    const button = make('button', 'brief-focus-button', label);
    button.type = 'button';
    button.setAttribute('aria-pressed', key === 'all' ? 'true' : 'false');
    button.addEventListener('click', () => { mode = key; selected.clear(); closePicker(); renderChoices(); render(); });
    controls.append(button);
    buttons[key] = button;
  }
  const pickerWrap = make('div', 'brief-focus-picker-wrap');
  const pickerButton = make('button', 'brief-focus-button brief-focus-pick-button');
  pickerButton.type = 'button';
  pickerButton.setAttribute('aria-expanded', 'false');
  pickerButton.setAttribute('aria-haspopup', 'dialog');
  pickerButton.setAttribute('aria-controls', 'brief-focus-picker');
  const pickerLabel = make('span', 'brief-focus-pick-label', 'Choose campaigns');
  const pickerChevron = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  pickerChevron.setAttribute('viewBox', '0 0 24 24');
  pickerChevron.setAttribute('width', '14');
  pickerChevron.setAttribute('height', '14');
  pickerChevron.setAttribute('fill', 'none');
  pickerChevron.setAttribute('stroke', 'currentColor');
  pickerChevron.setAttribute('stroke-width', '2');
  pickerChevron.setAttribute('aria-hidden', 'true');
  const chevronPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  chevronPath.setAttribute('d', 'm6 9 6 6 6-6');
  pickerChevron.append(chevronPath);
  pickerButton.append(pickerLabel, pickerChevron);
  pickerButton.addEventListener('click', () => {
    const open = picker.hidden;
    picker.hidden = !open;
    pickerButton.setAttribute('aria-expanded', String(open));
    if (open) search.focus();
  });
  const picker = make('div', 'brief-focus-picker');
  picker.id = 'brief-focus-picker';
  picker.hidden = true;
  picker.setAttribute('role', 'dialog');
  picker.setAttribute('aria-label', 'Choose campaigns');
  const pickerHead = make('div', 'brief-focus-picker-head');
  pickerHead.append(make('strong', '', 'Focus on campaigns'), make('span', '', 'Select one or more'));
  const search = make('input', 'brief-focus-search');
  search.type = 'search';
  search.placeholder = 'Search visible campaigns';
  search.setAttribute('aria-label', 'Search campaigns');
  const choices = make('div', 'brief-focus-choices');
  const pickerFoot = make('div', 'brief-focus-picker-foot');
  const pickerHint = make('span', '', '18 campaigns in this prototype');
  const pickerClear = make('button', '', 'Clear');
  pickerClear.type = 'button';
  pickerClear.addEventListener('click', () => { selected.clear(); mode = 'all'; renderChoices(); render(); });
  const pickerDone = make('button', '', 'Done');
  pickerDone.type = 'button';
  pickerDone.addEventListener('click', () => { closePicker(); pickerButton.focus(); });
  pickerFoot.append(pickerHint, pickerClear, pickerDone);
  const searchWrap = make('div', 'brief-focus-search-wrap');
  searchWrap.innerHTML = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-4-4"></path></svg>';
  searchWrap.append(search);
  picker.append(pickerHead, searchWrap, choices, pickerFoot);
  pickerWrap.append(pickerButton, picker);
  controls.append(pickerWrap);
  intro.after(controls);
  const results = make('div', 'brief-focus-results');
  results.hidden = true;
  grid.after(results);

  function closePicker() {
    picker.hidden = true;
    pickerButton.setAttribute('aria-expanded', 'false');
  }
  function renderChoices() {
    choices.replaceChildren();
    const query = search.value.trim().toLocaleLowerCase();
    const matching = records.filter(record => record.name.toLocaleLowerCase().includes(query));
    if (!matching.length) choices.append(make('p', 'brief-focus-empty-search', 'No visible campaigns match.'));
    matching.forEach(record => {
      const label = make('label', 'brief-focus-choice');
      const checkbox = make('input');
      checkbox.type = 'checkbox';
      checkbox.checked = selected.has(record.name);
      checkbox.addEventListener('change', () => {
        if (checkbox.checked) selected.add(record.name); else selected.delete(record.name);
        mode = selected.size ? 'custom' : 'all';
        render();
      });
      const copy = make('span');
      copy.append(make('strong', '', record.name), make('small', '', record.platform));
      label.append(checkbox, copy);
      choices.append(label);
    });
  }
  search.addEventListener('input', renderChoices);
  search.addEventListener('keydown', event => {
    if (event.key !== 'ArrowDown') return;
    const first = choices.querySelector('.brief-focus-choice input');
    if (first) { event.preventDefault(); first.focus(); }
  });
  choices.addEventListener('keydown', event => {
    if (!['ArrowDown', 'ArrowUp'].includes(event.key)) return;
    const inputs = [...choices.querySelectorAll('.brief-focus-choice input')];
    const index = inputs.indexOf(document.activeElement);
    const next = inputs[index + (event.key === 'ArrowDown' ? 1 : -1)];
    if (next) { event.preventDefault(); next.focus(); }
  });
  document.addEventListener('pointerdown', event => {
    if (!picker.hidden && !pickerWrap.contains(event.target)) closePicker();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !picker.hidden) { closePicker(); pickerButton.focus(); }
  });

  // The Brief is for triage. Keep only numbers that change today's work.
  const triageMetrics = [
    ['Decisions waiting', '6', 'Need a person today'],
    ['Flight risk', 'About $90k', '3 flights ended Oct 31'],
    ['Tracking gaps', '3', 'Need review']
  ];
  grid.replaceChildren(...triageMetrics.map(([label, value, note]) => {
    const metric = make('div', 'hcard');
    metric.append(make('div', 'l', label), make('div', 'v tn', value), make('div', 'hsub', note));
    return metric;
  }));
  heading.textContent = 'Today at a glance';
  grid.classList.add('brief-triage-grid');
  const metricLinks = make('div', 'brief-focus-metric-links');
  for (const [label, href] of [['Open full performance →', 'Portfolio.html#campaigns'], ['Open full activity →', 'Work.html#receipts']]) {
    const link = make('a', '', label);
    link.href = href;
    metricLinks.append(link);
  }
  grid.after(metricLinks);

  // Secondary scan facts share one disclosure; the daily decisions stay visible.
  const more = make('details', 'brief-context-details');
  const moreSummary = make('summary', '', 'More from this scan');
  moreSummary.append(make('span', '', 'Campaign focus · 48 checks'));
  const moreBody = make('div', 'brief-context-body');
  head.before(more);
  more.append(moreSummary, moreBody);
  more.open = true;
  moreBody.append(head, intro, controls, grid, metricLinks, results);
  const scanStatus = view.querySelector('.brief-status');
  if (scanStatus) moreBody.append(scanStatus);
  const openForAnchor = () => {
    if (['#brief-focus-controls', '#brief-focus-results'].includes(location.hash)) more.open = true;
  };
  openForAnchor();
  window.addEventListener('hashchange', openForAnchor);
  document.addEventListener('click', event => {
    if (event.target.closest('a[href$="#brief-focus-controls"],a[href$="#brief-focus-results"]')) more.open = true;
  });

  function render() {
    const publishScope = subset => {
      window.mojoBriefFocus = { mode, channel, platform, records: subset.map(record => ({ name: record.name, client: record.client, platform: record.platform, channel: record.channel })), portfolioTotal: 284 };
      window.dispatchEvent(new CustomEvent('mojo-brief-focus-change', { detail: window.mojoBriefFocus }));
    };
    for (const [key, button] of Object.entries(buttons)) button.setAttribute('aria-pressed', String(mode === key));
    pickerButton.setAttribute('aria-pressed', String(mode === 'custom'));
    pickerLabel.textContent = selected.size ? `${selected.size} selected` : 'Choose campaigns';
    grid.hidden = mode !== 'all' || channel !== 'all' || platform !== 'all';
    metricLinks.hidden = mode !== 'all' || channel !== 'all' || platform !== 'all';
    results.hidden = mode === 'all' && channel === 'all' && platform === 'all';
    if (mode === 'all' && channel === 'all' && platform === 'all') { intro.textContent = ''; publishScope([]); return; }

    const subset = records.filter(record => (mode === 'all' || (mode === 'soon' ? record.soon : mode === 'attention' ? record.attention : selected.has(record.name))) && (channel === 'all' || record.channel === channel) && (platform === 'all' || record.platform === platform));
    const title = mode === 'soon' ? 'Ended Oct 31' : mode === 'attention' ? 'Needs attention' : platform !== 'all' && mode === 'all' ? `${platform} campaigns` : channel !== 'all' && mode === 'all' ? `${channel} campaigns` : 'Selected campaigns';
    intro.textContent = '';
    results.replaceChildren();
    results.id = 'brief-focus-results';
    const resultHead = make('div', 'brief-focus-result-head');
    resultHead.append(make('h4', '', title), make('span', '', `${subset.length} shown`));
    results.append(resultHead);
    const list = make('div', 'brief-focus-list');
    subset.forEach(record => {
      const row = make('a', 'brief-focus-row');
      row.href = `Portfolio.html#campaign=${encodeURIComponent(record.name)}&view=brief`;
      const primary = make('span', 'brief-focus-row-primary');
      primary.append(make('strong', '', record.name), make('small', '', `${record.platform}${record.read ? ` · ${record.read}` : ''}`));
      const snapshot = make('span', 'brief-focus-row-snapshot');
      if (record.spent && record.budget) snapshot.textContent = `${record.pacing} pacing · ${record.spent} of ${record.budget} spent`;
      else if (record.spent && record.remaining) snapshot.textContent = `${record.spent} spent · ${record.remaining} remaining`;
      else snapshot.textContent = `${record.pacing} pacing${record.budget ? ` · ${record.budget} budget` : ''}`;
      row.append(primary, snapshot, make('span', 'brief-focus-row-arrow', '↗'));
      list.append(row);
    });
    results.append(list);
    const coverage = make('details', 'mojo-data-details brief-focus-coverage');
    coverage.append(make('summary', '', 'About this scope'), make('p', 'brief-focus-data-note', 'Source snapshots from the campaign explorer and reporting slice. Portfolio totals are shown only in All campaigns.'));
    results.append(coverage);
    publishScope(subset);
  }
  window.mojoBriefFocusControls = {
    records: records.map(({name, platform, client, channel}) => ({name, platform, client, channel})),
    getState: () => ({mode, channel, platform, selected:[...selected]}),
    setPlatform: next => {if(!['all','Google Ads','LinkedIn Ads','Demandbase Ads'].includes(next))return;platform=next;render();},
    setChannel: next => {if(!['all','Search','Display','CTV','Pre-roll','Unspecified'].includes(next))return;channel=next;render();},
    setMode: key => {
      if (!['all', 'soon', 'attention'].includes(key)) return;
      more.open = true;
      mode = key;
      selected.clear();
      closePicker();
      renderChoices();
      render();
    },
    setSelected: names => {
      more.open = true;
      selected.clear();
      names.filter(name => records.some(record => record.name === name)).forEach(name => selected.add(name));
      mode = selected.size ? 'custom' : 'all';
      closePicker();
      renderChoices();
      render();
    }
  };
  renderChoices();
  render();
});
