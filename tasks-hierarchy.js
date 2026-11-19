/* Give the task queue one clear decision, quieter lists, and a compact receipt rail. */
document.addEventListener('DOMContentLoaded', () => {
  const main = document.querySelector('main.canvaspane');
  const panels = [...(main?.querySelectorAll(':scope > section.panel') || [])];
  if (!main || panels.length < 4) return;
  const [answers, decisions, connections, done] = panels;
  const originalTitle = main.querySelector(':scope > h1');
  const originalIntro = main.querySelector(':scope > p');
  const priority = decisions.querySelector(':scope > .row');
  if (!originalTitle || !originalIntro || !priority) return;
  priority.id = 'task-budget-extension';
  const waystarQuestion = [...answers.querySelectorAll('h3')].find(node => node.textContent.includes("the Q1 flights"));
  if (waystarQuestion) waystarQuestion.id = 'task-waystar-owner';
  const q4Review = [...decisions.querySelectorAll(':scope > .row')].find(node => node.textContent.includes('matching the Q4 rule'));
  if (q4Review) q4Review.id = 'task-q4-review';
  if (['#task-budget-extension', '#task-waystar-owner', '#task-q4-review'].includes(location.hash)) {
    requestAnimationFrame(() => document.getElementById(location.hash.slice(1))?.scrollIntoView({block:'center'}));
  }

  const el = (tag, className, textContent) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (textContent !== undefined) node.textContent = textContent;
    return node;
  };
  main.classList.add('task-hierarchy-enhanced');
  const masthead = el('header', 'task-masthead');
  const mastheadCopy = el('div', 'task-masthead-copy');
  mastheadCopy.append(el('p', 'task-kicker', 'PAID CAMPAIGNS · TASKS'));
  originalTitle.textContent = 'Your work';
  originalIntro.textContent = 'Choose what needs your judgment; open evidence when you need it.';
  mastheadCopy.append(originalTitle, originalIntro);
  const tally = el('div', 'task-masthead-tally');
  tally.append(el('span', '', '15 open with you'), el('span', '', '9 Mojo-owned workstreams'));
  mastheadCopy.append(tally);
  mastheadCopy.append(el('p', 'task-coverage-note', '5 work groups shown from the portfolio sample.'));
  masthead.append(mastheadCopy);
  main.prepend(masthead);

  const feature = el('section', 'task-feature');
  feature.setAttribute('aria-label', 'Priority decision');
  const featureCopy = el('div', 'task-feature-copy');
  featureCopy.append(el('p', 'task-feature-kicker', 'TIME-SENSITIVE · BUDGET CHOICE'));
  featureCopy.append(el('p', 'task-feature-owner', 'Owner: you'));
  featureCopy.append(priority);
  const featureMetric = el('div', 'task-feature-metric');
  featureMetric.append(el('strong', 'tn', '~$90k'), el('span', '', 'remaining; pipeline value unknown'));
  feature.append(featureCopy, featureMetric);
  masthead.after(feature);
  const priorityButton = priority.querySelector('button');
  if (priorityButton) {
    priorityButton.textContent = 'Review options';
    const type = window.mojoPatternLearning?.types['Flights ending under half spent'];
    const instance = 'pattern:Flights ending under half spent';
    const dialog = el('dialog', 'task-approval-dialog');
    dialog.setAttribute('aria-labelledby', 'task-approval-title');
    const title = el('h2', '', 'Decide what to do with the remaining budget');
    title.id = 'task-approval-title';
    const detail = el('p', '', 'About $90k remains across three Google Ads flights ending tomorrow. The snapshot does not show expected pipeline, whether spend was meant to be even, or the best next use of the funds.');
    const consequence = el('p', 'task-approval-consequence', 'Review pipeline per dollar and the flight plan first. Remaining budget is not lost value. This prototype records a choice locally and does not update Google Ads.');
    const choices = el('fieldset','task-budget-choices');
    choices.append(el('legend','','What should happen next?'));
    [
      ['request','Request outcome and flight-plan evidence'],
      ['extend','Extend only if expected pipeline supports it'],
      ['reallocate','Reallocate toward a stronger campaign'],
      ['hold','Hold or return the remaining budget']
    ].forEach(([value,label]) => {
      const option = el('label','task-budget-choice');
      const radio = el('input'); radio.type='radio'; radio.name='budget-choice'; radio.value=value;
      option.append(radio,document.createTextNode(label));
      choices.append(option);
    });
    const controls = el('div', 'task-approval-actions');
    const cancel = el('button', '', 'Cancel'); cancel.type = 'button';
    const confirm = el('button', '', 'Record choice'); confirm.type = 'button'; confirm.disabled = true;
    controls.append(cancel, confirm);
    dialog.append(title, detail, consequence, choices, controls);
    document.body.append(dialog);
    priorityButton.addEventListener('click', () => { window.mojoPatternLearning?.engage(type, instance); dialog.showModal(); });
    choices.addEventListener('change', () => { confirm.disabled = !choices.querySelector('input:checked'); });
    cancel.addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
    const setRecorded = choice => {
      priorityButton.textContent = 'Choice recorded';
      priorityButton.disabled = true;
      const status = el('p', 'task-approval-status', `${choice || 'Choice'} recorded in this browser. Google Ads is unchanged.`);
      status.setAttribute('role', 'status');
      if (!priority.querySelector('.task-approval-status')) priority.querySelector(':scope > div:first-child')?.append(status);
    };
    try { const saved = localStorage.getItem('mojo-budget-choice-v2'); if (saved) setRecorded(saved); } catch {}
    confirm.addEventListener('click', () => {
      const selected = choices.querySelector('input:checked');
      if (!selected) return;
      const label = selected.parentElement.textContent.trim();
      try { localStorage.setItem('mojo-budget-choice-v2', label); } catch {}
      window.mojoPatternLearning?.record(type, 'act', instance, label);
      dialog.close();
      setRecorded(label);
    });
  }

  const layout = el('div', 'task-work-layout');
  const queue = el('div', 'task-work-main');
  const rail = el('aside', 'task-work-rail');
  rail.setAttribute('aria-label', 'Work summary');
  queue.append(answers, decisions);
  layout.append(queue, rail);
  feature.after(layout);
  if ('IntersectionObserver' in window) {
    const learning = window.mojoPatternLearning;
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting || entry.intersectionRatio < .5) return;
      const pattern = entry.target === feature ? 'Flights ending under half spent' : 'Long-running delivery stalls';
      learning?.seen(learning.types[pattern], `pattern:${pattern}`);
      observer.unobserve(entry.target);
    }), { threshold: .5 });
    observer.observe(feature);
    if (waystarQuestion) observer.observe(waystarQuestion.closest('.task-list-row') || waystarQuestion);
  }
  const setup = el('div', 'task-work-main task-setup');
  setup.append(el('p', 'task-setup-intro', 'OPTIONAL SETUP · These connections can add context later. They are separate from today’s campaign spend decisions.'));
  const connectionsHeading = connections.querySelector(':scope > div:first-child h2');
  if (connectionsHeading) connectionsHeading.textContent = 'Connections for later';
  setup.append(connections);
  layout.after(setup);

  const score = el('section', 'task-work-score');
  score.append(el('p', 'task-rail-kicker', 'IN MOTION'), el('h2', '', 'Work with a clear owner.'));
  const scoreGrid = el('div', 'task-work-score-grid');
  [['15', 'Need your input'], ['9', 'Mojo is handling']].forEach(([number, label]) => {
    const item = el('div', 'task-work-score-item');
    item.append(el('strong', 'tn', number), el('span', '', label === 'Mojo is handling' ? 'Mojo-owned workstreams' : label));
    scoreGrid.append(item);
  });
  score.append(scoreGrid);
  const mojoWork = el('div', 'task-mojo-work');
  mojoWork.append(el('h3', '', 'Mojo’s nine workstreams'));
  mojoWork.append(el('p', '', 'The nine workstreams behind the count.'));
  const mojoList = el('ol', 'task-mojo-list');
  [
    ['Pacing watch', 'Found · 48 campaigns checked'],
    ['Tracking integrity', 'Found · GA4 events and UTMs'],
    ['Weekly report writer', 'Drafted · 3 waiting for review'],
    ['UTM checker', 'Handled · 6 malformed UTMs'],
    ['Spend review', 'Handled · filed today'],
    ['Creative fatigue watch', 'Watching · no trend claim yet'],
    ['Audience overlap check', 'Found · account gap surfaced'],
    ['Click-to-interaction check', 'Found · 4 campaigns'],
    ['Benchmark check', 'Found · reach-to-visit gap']
  ].forEach(([name, status]) => {
    const item = el('li');
    item.append(el('strong', '', name), el('span', '', status));
    mojoList.append(item);
  });
  mojoWork.append(mojoList);
  score.append(mojoWork);
  rail.append(score, done);

  const doneText = done.querySelector(':scope > p.d');
  if (doneText) {
    const receipts = doneText.textContent.trim().replace(/\.$/, '').split(' · ');
    const list = el('ul', 'task-done-receipts');
    receipts.forEach(text => {
      const item = el('li');
      item.append(el('span', 'task-done-check'), el('span', '', text));
      list.append(item);
    });
    doneText.hidden = true;
    done.append(list);
  }

  const sections = [
    [answers, '2 questions', ['Measurement', 'Pacing']],
    [decisions, '2 decisions', ['Reporting', 'Campaign rule']],
    [connections, '2 connections', ['Data source', 'Intent']]
  ];
  sections.forEach(([section, count, categories]) => {
    const heading = section.firstElementChild;
    heading?.append(el('span', 'task-section-count', count));
    const rows = [...section.children].filter(child => child.matches('.task-list-row,.row'));
    rows.forEach((row, index) => {
      const copy = row.querySelector(':scope > .task-list-copy') || row.querySelector(':scope > div:first-child');
      if (!copy) return;
      const category = el('span', 'task-row-category', categories[index] || 'TASK');
      copy.prepend(category);
      if (!row.classList.contains('task-list-row')) {
        const textNode = [...copy.childNodes].find(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
        if (textNode) textNode.replaceWith(el('strong', 'task-row-title', textNode.textContent.trim()));
      }
      if (section !== connections) {
        const owner = el('span', 'task-row-owner', 'Owner: you');
        const taskTitle = copy.querySelector('h3,.task-row-title');
        if (taskTitle) taskTitle.after(owner); else copy.append(owner);
      }
    });
  });
});
