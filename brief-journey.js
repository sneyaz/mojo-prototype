/* Four Brief views and a compact, contextual Mojo companion. Source nodes stay intact. */
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.querySelector('.canvaspane');
  const reportingButton = [...(canvas?.querySelectorAll('button') || [])]
    .find(button => button.textContent.trim() === 'All active · Last 30 days');
  if (reportingButton) {
    reportingButton.remove();
  }
  const section = canvas?.querySelector('.brief-ledger-layout > section');
  const rail = canvas?.querySelector('.brief-ledger-layout > aside');
  const chips = section?.querySelector('.chipr');
  const scanline = section?.querySelector('.brief-status-source:not(.scan-workline)');
  if (!canvas || !section || !rail || !chips || !scanline) return;

  const lead = section.querySelector('.card.lead');
  const needsRows = [...section.querySelectorAll('.drow.cat-needs')];
  const canRows = [...section.querySelectorAll('.drow.cat-cando, .compact.cat-cando')];
  const watchRows = [...section.querySelectorAll('.compact.cat-watching')];
  const doneHeading = [...section.querySelectorAll('.grouphead')].find(el => el.textContent.trim() === 'Handled');
  const doneCard = section.querySelector('.card.cat-done');
  const allLinks = [...section.querySelectorAll(':scope > div')].find(el => el.querySelectorAll('a[href="Work.html#receipts"],a[href="Portfolio.html#campaigns"]').length === 2);
  const scoringNote = [...section.querySelectorAll(':scope > p')].find(el => el.classList.contains('brief-scoring-note'));
  const actHeading = [...section.querySelectorAll('.grouphead')].find(el => el.textContent.includes('Act Today'));
  const weekHeading = [...section.querySelectorAll('.grouphead')].find(el => el.textContent.includes('This Week'));
  const health = section.querySelector('.healthgrid');
  const status = section.querySelector('.brief-status');
  const winsHeading = section.querySelector('.weekrow')?.previousElementSibling;
  const wins = section.querySelector('.weekrow');
  // The four controls are one predictable navigation row, immediately after the scan context.
  scanline.after(chips);
  chips.setAttribute('role', 'tablist');
  chips.setAttribute('aria-label', 'Brief views');
  chips.querySelector(':scope > span:last-child')?.remove();
  chips.querySelector(':scope > div[style*="flex:1"]')?.remove();
  const viewRoot = document.createElement('div');
  viewRoot.className = 'brief-view-root';
  chips.after(viewRoot);
  const views = {};
  for (const [key, title, description] of [
    ['needs', 'Needs you', 'Choose where the money should go, with the measurement risks in view.'],
    ['cando', "Mojo's got it", 'Ready to review.'],
    ['watching', 'Watching', 'Signals being monitored.'],
    ['done', 'Handled', 'Completed work.']
  ]) {
    const view = document.createElement('section');
    view.className = `brief-view brief-view-${key}`;
    view.id = `brief-view-${key}`;
    view.setAttribute('role', 'tabpanel');
    view.setAttribute('aria-labelledby', `brief-tab-${key}`);
    view.setAttribute('aria-label', title);
    view.innerHTML = `<header class="brief-view-intro"><p class="brief-view-kicker">${title}</p><h2>${title}</h2><p>${description}</p></header>`;
    viewRoot.append(view);
    views[key] = view;
  }

  // Move source elements into views; do not rewrite the campaign names, amounts, or findings.
  if (actHeading) {
    const allWorkLink = actHeading.querySelector('a[href="Work.html"]');
    if (allWorkLink) {
      allWorkLink.classList.add('brief-all-work-link');
      chips.append(allWorkLink);
    }
    actHeading.remove();
  }
  const needsList = document.createElement('div');
  needsList.className = 'brief-finding-list';
  const todayRows = needsRows.slice(0, 4);
  const dataQualityRows = todayRows.filter(row => /Measurement|Tracking/.test(row.querySelector('.tag.cat')?.textContent || ''));
  const otherRows = todayRows.filter(row => !dataQualityRows.includes(row));
  needsList.append(...dataQualityRows);
  views.needs.append(lead, needsList);
  const deliveryList = document.createElement('div');
  deliveryList.className = 'brief-finding-list';
  deliveryList.append(...otherRows);
  views.needs.append(deliveryList);
  const laterNeeds = needsRows.slice(4);
  if (laterNeeds.length) {
    const laterHeading = document.createElement('h3');
    laterHeading.className = 'brief-subhead brief-this-week';
    laterHeading.append(document.createTextNode('Later this week'));
    const laterCount = document.createElement('span');
    laterCount.className = 'brief-this-week-count';
    laterCount.textContent = `${laterNeeds.length} ${laterNeeds.length === 1 ? 'item' : 'items'}`;
    laterHeading.append(laterCount);
    views.needs.append(laterHeading, ...laterNeeds);
  }
  if (scoringNote) views.needs.append(scoringNote);
  if (health) {
    const metricsHeading = document.createElement('h3');
    metricsHeading.className = 'brief-subhead';
    metricsHeading.textContent = 'Campaigns at a glance';
    views.needs.append(metricsHeading, health);
  }
  if (status) views.needs.append(status);
  if (allLinks) views.needs.append(allLinks);
  // The old mixed-feed heading counted a different grouping; it has no place
  // after findings are separated into these four views.
  weekHeading?.remove();

  const canIntro = views.cando.querySelector('.brief-view-intro');
  canIntro.querySelector('h2').textContent = 'Ready for Mojo';
  canRows.filter(row => row.matches('details')).forEach(row => {
    const summary = row.querySelector('summary');
    const category = summary?.querySelector('.tag.cat');
    const statusTag = summary?.querySelector('.tag.go');
    if (!summary || !category || !statusTag) return;
    const meta = document.createElement('span');
    meta.className = 'brief-finding-meta';
    meta.append(category, statusTag);
    summary.prepend(meta);
  });
  views.cando.append(...canRows);
  const canContext = document.createElement('section');
  canContext.className = 'brief-extra-context';
  canContext.setAttribute('aria-label', 'What Mojo handles within your rules');
  canContext.innerHTML = '<h3>Useful work, without a surprise send.</h3><div class="brief-extra-grid"></div>';
  for (const [title, detail, label, href] of [
    ['Daily tracking cleanup', 'The UTM checker repaired 6 malformed email links today. The receipt is in Activity.', 'See the receipt →', 'Work.html#receipts'],
    ['Report drafts stay drafts', 'Mojo prepared 3 weekly reports. They wait for your read before anything goes out.', 'Review the drafts →', 'Work.html']
  ]) {
    const item = document.createElement('div');
    item.className = 'brief-extra-item';
    const heading = document.createElement('strong'); heading.textContent = title;
    const copy = document.createElement('p'); copy.textContent = detail;
    const link = document.createElement('a'); link.href = href; link.textContent = label;
    item.append(heading, copy, link);
    canContext.querySelector('.brief-extra-grid').append(item);
  }
  views.cando.append(canContext);

  const watchIntro = views.watching.querySelector('.brief-view-intro');
  watchIntro.querySelector('h2').textContent = 'Watching';
  views.watching.append(...watchRows);
  const watchAction = watchRows[0]?.querySelector('button');
  if (watchAction) {
    const cadence = document.createElement('span');
    cadence.className = 'brief-watch-cadence';
    cadence.textContent = 'Monthly watch on';
    watchAction.replaceWith(cadence);
  }
  const creativeWatch = document.createElement('article');
  creativeWatch.className = 'brief-monitor-row';
  creativeWatch.innerHTML = '<span class="brief-story-label">Creative</span><h3>Watch for fatigue</h3><p></p><a href="Portfolio.html#creative">View creative →</a>';
  creativeWatch.querySelector('p').textContent = 'Frequency and CTR trend are needed to judge the current creative.';
  views.watching.append(creativeWatch);
  const watchLearning = document.createElement('section');
  watchLearning.className = 'brief-extra-context brief-watch-learning';
  watchLearning.innerHTML = '<span class="brief-story-label">Spend follow-up</span><h3>The $18k shift needs more time</h3><p></p><a href="Work.html#receipts">View follow-up →</a>';
  watchLearning.querySelector('p:not(.brief-extra-kicker)').textContent = 'CPA is roughly flat after 11 days. Compare pipeline with similar accounts before judging the move.';
  views.watching.append(watchLearning);

  const doneIntro = views.done.querySelector('.brief-view-intro');
  doneIntro.querySelector('h2').textContent = 'Handled';
  doneHeading?.remove();
  if (doneCard) {
    views.done.append(doneCard);
    doneCard.hidden = true; // Its source summary is represented by the six receipts below.
  }
  const doneList = document.createElement('ol');
  doneList.className = 'brief-done-list';
  [
    ['Repaired 6 malformed email UTMs', 'Tracking', 'utm-repair'],
    ['Mapped 16 stray tags', 'Tracking', 'tag-mapping'],
    ['Drafted 3 weekly reports', 'Reporting', 'weekly-reports'],
    ['Drafted a replacement ad test', 'Creative', 'creative-refresh']
  ].forEach(([title, kind, id]) => {
    const item = document.createElement('li');
    item.dataset.receiptId = id;
    item.innerHTML = `<span class="brief-done-mark" aria-hidden="true"></span><div><small>${kind}</small><strong>${title}</strong></div>`;
    const sourceCheck = doneCard?.querySelector('svg');
    if (sourceCheck) item.querySelector('.brief-done-mark').append(sourceCheck.cloneNode(true));
    doneList.append(item);
  });
  views.done.append(doneList);
  if (winsHeading) views.done.append(winsHeading);
  if (wins) views.done.append(wins);

  // Remove emptied source headings, after their content has been recomposed.
  const legacyIntro = section.querySelector('.brief-legacy-intro');
  if (legacyIntro) legacyIntro.hidden = true;
  const radios = {
    needs: document.getElementById('f-needs'),
    cando: document.getElementById('f-cando'),
    watching: document.getElementById('f-watching'),
    done: document.getElementById('f-done')
  };
  const labels = Object.fromEntries(Object.keys(radios).map(key => [key, chips.querySelector(`label[for="f-${key}"]`)]));
  const tabNames = {needs:['Needs you','6'], cando:["Mojo's got it",String(canRows.length)], watching:['Watching',String(watchRows.length + 2)], done:['Handled','']};
  Object.entries(labels).forEach(([key, label]) => {
    if (!label) return;
    const [name, count] = tabNames[key];
    label.replaceChildren(document.createTextNode(name));
    label.setAttribute('aria-label', count ? `${name}, ${count} items` : name);
    if (count) {
      const number = document.createElement('span');
      number.className = 'mojo-tab-count';
      number.textContent = count;
      label.append(number);
    }
    label.id = `brief-tab-${key}`;
    label.setAttribute('role', 'tab');
    label.setAttribute('aria-controls', `brief-view-${key}`);
    radios[key].tabIndex = -1;
  });
  const setView = (key, scroll = false) => {
    if (!views[key]) return;
    radios[key].checked = true;
    for (const [name, view] of Object.entries(views)) view.hidden = name !== key;
    for (const [name, label] of Object.entries(labels)) {
      if (!label) continue;
      label.setAttribute('aria-selected', String(name === key));
      label.tabIndex = name === key ? 0 : -1;
    }
    canvas.dataset.briefView = key;
    window.dispatchEvent(new CustomEvent('mojo:brief-view-change', {detail:{view:key}}));
    if (scroll) chips.scrollIntoView({behavior:'smooth', block:'start'});
  };
  chips.addEventListener('keydown', event => {
    if (!event.target.closest('[role="tab"]')) return;
    const keys = Object.keys(labels);
    const current = keys.findIndex(key => labels[key] === event.target);
    let next = current;
    if (event.key === 'ArrowRight') next = (current + 1) % keys.length;
    else if (event.key === 'ArrowLeft') next = (current - 1 + keys.length) % keys.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = keys.length - 1;
    else if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setView(keys[current]); return; }
    else return;
    event.preventDefault();
    setView(keys[next]);
    labels[keys[next]]?.focus();
  });
  Object.entries(radios).forEach(([key, radio]) => radio?.addEventListener('change', () => setView(key)));
  const hashView = location.hash.startsWith('#brief-') ? location.hash.slice(7) : 'needs';
  setView(views[hashView] ? hashView : 'needs');
  lead.id = 'brief-budget-risk';
  const measurementRow = needsRows.find(row => row.querySelector('.headline')?.textContent.startsWith('Is the $9'));
  const canTrackingRow = canRows.find(row => row.matches('details'));
  if (measurementRow) measurementRow.id = 'brief-measurement';
  if (canTrackingRow) canTrackingRow.id = 'brief-tracking-fix';
  if (watchRows[0]) watchRows[0].id = 'brief-ai-watch';
  if (doneList) doneList.id = 'brief-done-receipts';

  window.mojoBriefSetView = setView;
});
