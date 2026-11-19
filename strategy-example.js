/* One direct path from the portfolio strategy to a single campaign workspace. */
document.addEventListener('DOMContentLoaded', () => {
  const thesis = document.querySelector('.canvaspane > .thesis');
  if (!thesis) return;
  const example = document.createElement('div');
  example.className = 'strategy-campaign-example';
  const label = document.createElement('span');
  label.textContent = 'SEE ONE CAMPAIGN';
  const link = document.createElement('a');
  link.href = 'Portfolio.html#campaign=GO%20Prep&tab=overview';
  link.textContent = 'Open GO Prep’s campaign workspace →';
  const detail = document.createElement('small');
  detail.textContent = 'Overview · Evidence · Tasks, scoped to GO Prep';
  example.append(label, link, detail);
  thesis.after(example);

  const main = document.querySelector('main.canvaspane');
  const stats = main?.querySelector(':scope > .cardgrid');
  if (!stats) return;

  const detailPanels = [...main.querySelectorAll(':scope > section.panel')].slice(0, 2);
  if (detailPanels.length === 2) {
    const receipts = document.createElement('details');
    receipts.className = 'strategy-blueprint-receipts';
    const summary = document.createElement('summary');
    summary.textContent = 'Explore source detail for this strategy';
    const content = document.createElement('div');
    content.className = 'strategy-blueprint-receipts-content';
    detailPanels.forEach(panel => content.append(panel));
    receipts.append(summary, content);
    stats.after(receipts);
  }
});
