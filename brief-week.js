document.addEventListener('DOMContentLoaded', () => {
  const workline = document.querySelector('.canvaspane .scan-workline');
  const scanline = workline?.previousElementSibling;
  const scanText = [...(scanline?.querySelectorAll('span') || [])]
    .map((node) => node.textContent.trim())
    .find((value) => value.startsWith('Last scan '));
  const scan = scanText?.match(/^Last scan (.*?) · (\d+) checks across (\d+) campaigns · (\d+) connected ad sources$/);
  const scanLink = scanline?.querySelector('a');
  if (workline && scanline && scan && scanLink) {
    const status = document.createElement('div');
    status.className = 'brief-status';
    const top = document.createElement('div');
    top.className = 'brief-status-top';
    const recency = document.createElement('div');
    recency.className = 'brief-status-recency';
    recency.innerHTML = '<span class="brief-status-dot" aria-hidden="true"></span><span>Last scan</span><strong></strong>';
    recency.querySelector('strong').textContent = scan[1];
    top.append(recency, scanLink);
    status.append(top);

    const groups = document.createElement('div');
    groups.className = 'brief-status-groups';
    const metric = (value, label) => {
      const item = document.createElement('span');
      item.className = 'brief-status-metric';
      const number = document.createElement('b');
      number.textContent = value;
      const description = document.createElement('small');
      description.textContent = label;
      item.append(number, description);
      return item;
    };
    const coverage = document.createElement('div');
    coverage.className = 'brief-status-group';
    coverage.innerHTML = '<span class="brief-status-kicker">Scan coverage</span>';
    coverage.append(metric(scan[2], 'checks'), metric(scan[3], 'campaigns'), metric(scan[4], 'connected ad sources'));
    const work = document.createElement('div');
    work.className = 'brief-status-group brief-status-work';
    work.innerHTML = '<span class="brief-status-kicker">Mojo at work</span>';
    [...workline.querySelectorAll(':scope > span')].slice(1).forEach((node) => {
      const value = node.querySelector('b')?.textContent.trim();
      if (value) work.append(metric(value, node.textContent.trim().slice(value.length).trim()));
    });
    groups.append(coverage, work);
    status.append(groups);
    scanline.before(status);
    scanline.classList.add('brief-status-source');
    workline.classList.add('brief-status-source');
  }

  const week = document.querySelector('.canvaspane .weekrow');
  if (!week) return;
  week.previousElementSibling?.classList.add('brief-week-title');

  const wins = [
    { value: '6 / 6', label: 'Vendor checks passed', detail: 'D&M_2026 · engagement signal, not pipeline' },
    { value: '2,500', label: 'Sessions attribute again', detail: 'After 16 stray UTMs were fixed' },
    { value: '$18,000', label: 'Reallocation observed', detail: 'Pipeline outcome pending' }
  ];
  const winsHeading = week.querySelector(':scope > .sidebox:first-child>span');
  if (winsHeading) winsHeading.textContent = 'Three receipts';

  week.querySelectorAll(':scope > .sidebox:first-child .winitem').forEach((row, index) => {
    const original = row.lastElementChild;
    const win = wins[index];
    if (!original || !win) return;

    // Keep the source sentence in the document for an exact-data reference.
    original.hidden = true;
    original.classList.add('win-source');

    const visual = document.createElement('div');
    visual.className = 'win-visual-copy';
    visual.innerHTML = `<span class="win-value"></span><span class="win-copy"><strong></strong><small></small></span>`;
    visual.querySelector('.win-value').textContent = win.value;
    visual.querySelector('strong').textContent = win.label;
    visual.querySelector('small').textContent = win.detail;
    row.append(visual);
  });

  const spend = week.querySelector(':scope > .sidebox:nth-child(2)');
  const spendHeading = spend?.querySelector(':scope > span');
  if (spendHeading) {
    spendHeading.textContent = 'Source organization budgets';
    const context = document.createElement('p');
    context.className = 'spend-context';
    context.textContent = 'Four example source slices · relative size';
    spendHeading.after(context);
  }
  if (spend) {
    const disclosure = document.createElement('details');
    disclosure.className = 'week-spend-disclosure';
    const summary = document.createElement('summary');
    summary.textContent = 'Compare the source budgets';
    disclosure.append(summary);
    while (spend.firstChild) disclosure.append(spend.firstChild);
    spend.append(disclosure);
  }

  const shareCard = week.querySelector('.cmocard');
  if (shareCard) {
    const story = document.createElement('p');
    story.className = 'share-story';
    story.textContent = 'Mojo fixed 6 UTMs and prepared 3 reports in this documented snapshot. Pipeline impact is still being measured.';
    shareCard.querySelectorAll(':scope > div').forEach((node) => node.classList.add('share-source'));
    const label = shareCard.querySelector(':scope > span');
    if (label) { label.textContent = 'Value receipt'; label.after(story); }
    shareCard.classList.add('share-storyline');
  }

  const shareButton = shareCard?.querySelector('.btn');
  if (shareButton) {
    const link = document.createElement('a');
    link.className = 'btn';
    link.href = 'Work.html#receipts';
    link.textContent = 'View the receipt →';
    shareButton.replaceWith(link);
  }

  document.querySelectorAll('.canvaspane .layout > section .grouphead').forEach((heading) => {
    const match = heading.textContent.trim().match(/^(Act Today|This Week)\s*·\s*(\d+)$/);
    if (!match) return;
    const title = document.createElement('span');
    title.className = 'feed-section-title';
    title.textContent = match[1];
    const count = document.createElement('span');
    count.className = 'feed-section-count';
    count.textContent = `${match[2]} total`;
    heading.replaceChildren(title, count);
    heading.classList.add('feed-section-head');
  });

  week.classList.add('week-enhanced');
});
