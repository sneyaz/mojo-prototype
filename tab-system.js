/* Preserve the original Performance radios while giving their tabs keyboard behavior. */
document.addEventListener('DOMContentLoaded', () => {
  const tabs = document.querySelector('.canvaspane .ctabs');
  if (!tabs) return;
  const entries = [
    {radio: document.getElementById('t-ov'), label: tabs.querySelector('label[for="t-ov"]'), panel: document.querySelector('.tab-ov')},
    {radio: document.getElementById('t-pc'), label: tabs.querySelector('label[for="t-pc"]'), panel: document.querySelector('.tab-pc')}
  ];
  if (entries.some(entry => !entry.radio || !entry.label || !entry.panel)) return;
  tabs.setAttribute('role', 'tablist');
  tabs.setAttribute('aria-label', 'Performance views');
  entries.forEach((entry, index) => {
    entry.radio.tabIndex = -1;
    entry.label.id = `performance-tab-${index}`;
    entry.label.setAttribute('role', 'tab');
    entry.label.setAttribute('aria-controls', `performance-panel-${index}`);
    entry.panel.id = `performance-panel-${index}`;
    entry.panel.setAttribute('role', 'tabpanel');
    entry.panel.setAttribute('aria-labelledby', entry.label.id);
  });
  const sync = () => entries.forEach(entry => {
    entry.label.setAttribute('aria-selected', String(entry.radio.checked));
    entry.label.tabIndex = entry.radio.checked ? 0 : -1;
  });
  entries.forEach(entry => entry.radio.addEventListener('change', sync));
  tabs.addEventListener('keydown', event => {
    const index = entries.findIndex(entry => entry.label === event.target);
    if (index < 0) return;
    let next = index;
    if (event.key === 'ArrowRight') next = (index + 1) % entries.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + entries.length) % entries.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = entries.length - 1;
    else if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); entries[index].radio.click(); sync(); return; }
    else return;
    event.preventDefault();
    entries[next].radio.click();
    sync();
    entries[next].label.focus();
  });
  sync();
});
