/* Recompose the existing Brief data as an editorial decision ledger. */
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.querySelector('.canvaspane');
  const layout = canvas?.querySelector(':scope > .layout');
  const section = layout?.querySelector(':scope > section');
  const rail = layout?.querySelector(':scope > aside');
  const lead = section?.querySelector(':scope > .card.lead');
  if (!canvas || !layout || !section || !rail || !lead) return;

  const oldIntro = section.firstElementChild;
  oldIntro?.classList.add('brief-legacy-intro');
  const header = canvas.firstElementChild;
  const workline = canvas.querySelector(':scope > .scan-workline');
  const scanline = workline?.previousElementSibling;
  const status = canvas.querySelector(':scope > .brief-status');
  const health = canvas.querySelector(':scope > .healthgrid');
  const week = canvas.querySelector(':scope > .weekrow');
  const weekHeading = week?.previousElementSibling;
  const chips = canvas.querySelector(':scope > .chipr');
  const headings = [...section.querySelectorAll(':scope > .grouphead')];
  const actHeading = headings.find(node => node.textContent.includes('Act Today'));
  const thisWeekHeading = headings.find(node => node.textContent.includes('This Week'));
  const handledHeading = headings.find(node => node.textContent.includes('Handled'));

  // Retain every source element, while letting the two columns begin at the masthead.
  section.prepend(header, scanline, lead);
  if (workline) section.append(workline);
  if (status && thisWeekHeading) section.insertBefore(status, thisWeekHeading);
  if (health && thisWeekHeading) section.insertBefore(health, thisWeekHeading);
  if (week && handledHeading) {
    section.insertBefore(weekHeading, handledHeading);
    section.insertBefore(week, handledHeading);
  }
  canvas.prepend(layout);
  layout.classList.add('brief-ledger-layout');

  // Present the three connected sources as a compact, accessible logo row.
  const sourceBox = rail.querySelector(':scope > .sidebox:first-child');
  const sourceRows = [...(sourceBox?.querySelectorAll(':scope > .rt') || [])];
  if (sourceRows.length === 3) {
    const logos = document.createElement('div');
    logos.className = 'brief-source-logos';
    logos.setAttribute('role', 'group');
    logos.setAttribute('aria-label', 'Connected ad sources');
    sourceRows[0].before(logos);
    const assets = ['google-ads.svg', 'linkedin.png', 'demandbase.png'];
    sourceRows.forEach((row, index) => {
      const name = row.textContent.trim();
      const circle = document.createElement('span');
      circle.className = 'brief-source-mark';
      const image = document.createElement('img');
      image.src = `assets/${assets[index]}`;
      image.alt = '';
      circle.append(image);
      row.replaceChildren(circle);
      row.setAttribute('role', 'img');
      row.setAttribute('aria-label', name);
      row.title = name;
      logos.append(row);
    });
  }

  // Keep the destination to the full task list when the legacy heading is condensed.
  const allWork = oldIntro?.querySelector('a[href="Work.html"]');
  if (allWork && actHeading) actHeading.append(allWork);
  const scoringNote = [...section.querySelectorAll(':scope > p')]
    .find(node => node.textContent.startsWith('Tracking and lead-definition'));
  if (scoringNote) {
    scoringNote.classList.add('brief-scoring-note');
    scoringNote.textContent = 'This decision is here because three flights ended Oct 31. About $90k remains, but its pipeline value is unknown. Check performance before extending, reallocating, or returning it; there is no numeric impact score.';
  }
  const lastToday = [...section.querySelectorAll(':scope > .drow.cat-needs')].at(-1);
  if (scoringNote && lastToday) lastToday.after(scoringNote);
  if (chips && scoringNote) scoringNote.after(chips);
  else if (chips && thisWeekHeading) section.insertBefore(chips, thisWeekHeading);

  // Comparable campaign amounts belong in columns, not inline chips.
  const evidence = lead.querySelector('.ev');
  const rows = [...(evidence?.querySelectorAll(':scope > span') || [])].map(node => {
    const match = node.textContent.replace(/\s+/g, ' ').trim().match(/^(.+?)\s+(\$[\d,]+)\s*\/\s*(\$[\d,]+)$/);
    return match && match.slice(1);
  });
  if (evidence && rows.length > 1 && rows.every(Boolean)) {
    const table = document.createElement('table');
    table.className = 'brief-budget-table';
    table.innerHTML = '<thead><tr><th scope="col">Campaign</th><th scope="col">Spent</th><th scope="col">Total budget</th></tr></thead><tbody></tbody>';
    const body = table.querySelector('tbody');
    rows.forEach(([name, spent, budget]) => {
      const row = document.createElement('tr');
      [name, spent, budget].forEach((value, index) => {
        const cell = document.createElement('td');
        if (index === 0) {
          const link = document.createElement('a');
          link.href = `Portfolio.html#campaign=${encodeURIComponent(value)}&view=brief`;
          link.className = 'brief-campaign-link';
          link.textContent = value;
          cell.append(link);
        } else cell.textContent = value;
        if (index) cell.className = 'tn';
        row.append(cell);
      });
      body.append(row);
    });
    evidence.after(table);
    evidence.hidden = true;
  }

  const connect = rail.querySelector(':scope > .sidebox:nth-child(3)');
  if (connect) {
    connect.classList.add('brief-opportunity', 'mojo-unlocks');
    const title = connect.querySelector(':scope > span');
    if (title) { title.textContent = 'The signals you’re missing'; title.classList.add('mojo-unlocks-title'); }
    const intro = document.createElement('p');
    intro.className = 'brief-opportunity-intro';
    intro.textContent = 'Three answers your current sources can’t show yet.';
    title?.after(intro);
    const opportunities = [
      ['See which spend creates pipeline', 'Salesforce · pipeline outcomes', 'assets/salesforce.png', 'salesforce'],
      ['Catch missing conversions', 'Tag Manager · tracking checks', 'assets/google-tag-manager.svg', 'tag-manager'],
      ['Spot creative fatigue early', 'LinkedIn Ads · frequency and engagement', 'assets/linkedin.png', 'linkedin']
    ];
    [...connect.querySelectorAll(':scope > .rt')].forEach((row, index) => {
      const copy = row.querySelector(':scope > div');
      const item = opportunities[index];
      if (!copy || !item) return;
      row.classList.add('mojo-unlock-row');
      copy.classList.add('mojo-unlock-content');
      const logo = document.createElement('img');
      logo.src = item[2]; logo.alt = '';
      logo.className = 'mojo-unlock-logo';
      const body = document.createElement('div');
      body.className = 'mojo-unlock-text';
      const headline = document.createElement('strong');
      headline.textContent = item[0];
      const source = document.createElement('small');
      source.textContent = item[1];
      body.append(headline, source);
      copy.replaceChildren(logo, body);
      const action = row.querySelector(':scope > a.btn');
      if (action) { action.href = `Connect.dc.html#${item[3]}`; action.classList.add('mojo-unlock-action'); }
    });
  }
  // Brief explains the finding; the person-owned decision is made in Tasks.
  const headline = lead.querySelector('.dhead');
  if (headline) headline.textContent = 'What should happen to about $90k remaining across three flights?';
  const leadBody = lead.querySelector('.dbody');
  if (leadBody) leadBody.textContent = 'GO Prep, Q4 Pipeline Search, and Enterprise Retargeting are at 43–47% of budget. The source does not show whether that pacing was planned or whether more spend would create pipeline.';
  const later = [...lead.querySelectorAll('button')].find(node => node.textContent.trim() === 'Later');
  later?.remove();

  const approve = [...lead.querySelectorAll('button')].find(node => node.textContent.trim() === 'Approve the extension');
  if (approve) {
    const taskLink = document.createElement('a');
    taskLink.className = approve.className;
    taskLink.href = 'HomeSystem.html#finding-flights';
    taskLink.textContent = 'Review budget choices in Tasks →';
    approve.replaceWith(taskLink);
  }
  const recommendation = lead.querySelector('.mojoline');
  if (recommendation) recommendation.textContent = 'Compare outcomes first, then extend, reallocate, or hold.';
  const whyLink = lead.querySelector('.cact > a.lnk[href="#why94"]');
  whyLink?.remove();
  scoringNote?.remove();
});
