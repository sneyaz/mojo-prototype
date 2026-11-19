/* Logos belong with platform choices and data labels, not every prose mention. */
(() => {
  const assets = {
    'Google Ads': 'assets/google-ads.svg',
    'Demandbase Ads': 'assets/demandbase.png',
    'LinkedIn Ads': 'assets/linkedin.png',
    'LinkedIn': 'assets/linkedin.png',
    'Meta Ads': 'assets/meta.svg'
  };
  const names = Object.keys(assets).sort((a, b) => b.length - a.length);

  function identity(name) {
    const item = document.createElement('span');
    item.className = 'mojo-platform-identity';
    const img = document.createElement('img');
    img.src = assets[name];
    img.alt = '';
    img.setAttribute('aria-hidden', 'true');
    const text = document.createElement('span');
    text.textContent = name;
    item.append(img, text);
    return item;
  }

  function decorateExact(container) {
    container.querySelectorAll('td').forEach(cell => {
      const name = cell.textContent.trim();
      if (!assets[name] || cell.querySelector('img, a, button')) return;
      cell.replaceChildren(identity(name));
    });
  }

  function decoratePrefix(selector) {
    document.querySelectorAll(selector).forEach(element => {
      if (element.dataset.platformIdentity || element.querySelector('img')) return;
      const value = element.textContent.trim();
      const name = names.find(candidate => value === candidate || value.startsWith(candidate + ' ·'));
      if (!name) return;
      element.dataset.platformIdentity = 'true';
      element.replaceChildren(identity(name), document.createTextNode(value.slice(name.length)));
    });
  }

  function enhancePortfolioFilter() {
    const select = document.querySelector('#ia-platform');
    if (!select || select.dataset.platformIdentity) return;
    select.dataset.platformIdentity = 'true';
    const oldLabel = select.closest('label');
    if (!oldLabel) return;
    const field = document.createElement('div');
    field.className = 'mojo-platform-filter';
    const caption = document.createElement('span');
    caption.textContent = 'Platform';
    const picker = document.createElement('details');
    picker.className = 'mojo-platform-picker';
    const summary = document.createElement('summary');
    summary.setAttribute('aria-label', 'Filter campaigns by platform');
    const menu = document.createElement('div');
    menu.className = 'mojo-platform-menu';

    const display = value => value === 'all' ? document.createTextNode('All platforms') : identity(value);
    const sync = () => {
      summary.replaceChildren(display(select.value));
      menu.querySelectorAll('button').forEach(button => {
        button.setAttribute('aria-pressed', String(button.dataset.value === select.value));
      });
    };
    [...select.options].forEach(option => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.value = option.value;
      button.append(display(option.value));
      button.addEventListener('click', () => {
        select.value = option.value;
        select.dispatchEvent(new Event('input', {bubbles: true}));
        select.dispatchEvent(new Event('change', {bubbles: true}));
        picker.open = false;
        summary.focus();
      });
      menu.append(button);
    });
    picker.append(summary, menu);
    oldLabel.replaceWith(field);
    select.hidden = true;
    select.tabIndex = -1;
    select.setAttribute('aria-hidden', 'true');
    field.append(caption, select, picker);
    select.addEventListener('change', sync);
    select.addEventListener('input', sync);
    picker.addEventListener('keydown', event => {
      if (event.key === 'Escape') { picker.open = false; summary.focus(); }
    });
    document.addEventListener('click', event => {
      if (!picker.contains(event.target)) picker.open = false;
    });
    sync();
  }

  function decorateBulkChannels() {
    document.querySelectorAll('.mc-checkboxes label').forEach(label => {
      if (label.querySelector('.mojo-platform-identity')) return;
      const input = label.querySelector('input[value]');
      if (!input || !assets[input.value]) return;
      const name = input.value;
      label.replaceChildren(input, identity(name));
    });
  }

  function scan() {
    enhancePortfolioFilter();
    const main = document.querySelector('main.canvaspane') || document.body;
    decorateExact(main);
    decoratePrefix('.ia-campaign-head > p, .ia-asset-select small');
    decorateBulkChannels();
  }

  document.addEventListener('DOMContentLoaded', () => {
    scan();
    let scheduled = false;
    new MutationObserver(() => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => { scheduled = false; scan(); });
    }).observe(document.body, {childList: true, subtree: true});
  });
})();
