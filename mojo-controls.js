/* Shared, accessible select treatment for the static HTML prototype. */
document.addEventListener('DOMContentLoaded', () => {
  const headerTitle = document.querySelector('.topbar .wtitle');
  if (headerTitle) headerTitle.textContent = 'Campaigns';
  const pageTitle = document.querySelector('.topbar .ctitle');
  if (pageTitle) pageTitle.setAttribute('aria-hidden', 'true');
  const sidebarToggle = document.getElementById('sidebarOn');
  if (sidebarToggle) {
    const panes = document.querySelector('.panes');
    let sidebarPane = panes?.querySelector('.sidebarpane');
    if (panes && !sidebarPane) {
      sidebarPane = document.createElement('aside');
      sidebarPane.className = 'sidebarpane';
      panes.append(sidebarPane);
    }
    if (sidebarPane) {
      sidebarPane.hidden = false;
      sidebarPane.setAttribute('aria-label', 'Workspace sidebar');
      const body = document.createElement('div');
      body.className = 'mojo-sidepane-body';
      while (sidebarPane.firstChild) body.append(sidebarPane.firstChild);
      if (!body.textContent.trim()) {
        const current = (location.pathname.split('/').pop() || '').replace('.html', '');
        const links = [['HomeSystem', 'Feed'], ['Portfolio', 'Dashboards'], ['Strategy', 'Strategy'], ['BestPractices', 'Best Practices']];
        const nav = document.createElement('nav');
        nav.className = 'mojo-sidepane-links';
        nav.setAttribute('aria-label', 'Workspace sections');
        links.forEach(([page, label]) => {
          const link = document.createElement('a');
          link.href = `${page}.html`;
          link.textContent = label;
          if (page === current) link.setAttribute('aria-current', 'page');
          nav.append(link);
        });
        body.append(nav);
      }
      const heading = document.createElement('div');
      heading.className = 'mojo-sidepane-head';
      heading.textContent = 'Sidebar';
      sidebarPane.append(heading, body);
    }
    sidebarToggle.disabled = false;
  }
  document.querySelectorAll('.paneToggles label[for="sidebarOn"]').forEach(control => {
    control.classList.remove('mojo-sidebar-inert');
    control.removeAttribute('aria-disabled');
  });
  const chatToggle = document.getElementById('chatOn');
  for (const [toggle, other] of [[chatToggle, sidebarToggle], [sidebarToggle, chatToggle]]) {
    toggle?.addEventListener('change', () => {
      if (toggle.checked && other) other.checked = false;
    });
  }
  document.querySelectorAll('.modebtn').forEach(button => {
    const label = button.textContent.trim();
    if (!label.endsWith('▾')) return;
    button.textContent = label.slice(0, -1).trim();
    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.setAttribute('width', '14');
    icon.setAttribute('height', '14');
    icon.setAttribute('fill', 'none');
    icon.setAttribute('stroke', 'currentColor');
    icon.setAttribute('stroke-width', '2');
    icon.setAttribute('stroke-linecap', 'round');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'm6 9 6 6 6-6');
    icon.append(path);
    button.append(icon);
  });

  let selectNumber = 0;
  function enhanceSelect(nativeSelect) {
    if (nativeSelect.closest('.mojo-select')) return;
    const instanceNumber = selectNumber++;

    const fieldName = nativeSelect.closest('.clientsel')?.querySelector('label')?.textContent.trim()
      || (nativeSelect.options[0]?.textContent.includes('platform') ? 'Platform' : 'Select');
    const wrapper = document.createElement('div');
    wrapper.className = 'mojo-select';

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'mojo-select-trigger';
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');

    const value = document.createElement('span');
    value.className = 'mojo-select-value';
    const chevron = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    chevron.setAttribute('viewBox', '0 0 24 24');
    chevron.setAttribute('width', '16');
    chevron.setAttribute('height', '16');
    chevron.setAttribute('fill', 'none');
    chevron.setAttribute('stroke', 'currentColor');
    chevron.setAttribute('stroke-width', '2');
    chevron.setAttribute('stroke-linecap', 'round');
    chevron.setAttribute('stroke-linejoin', 'round');
    const chevronPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    chevronPath.setAttribute('d', 'm6 9 6 6 6-6');
    chevron.append(chevronPath);
    trigger.append(value, chevron);

    const menu = document.createElement('div');
    menu.className = 'mojo-select-menu';
    menu.id = `mojo-select-list-${instanceNumber}`;
    const searchable = nativeSelect.dataset.searchable === 'true';
    const optionList = searchable ? document.createElement('div') : menu;
    if (searchable) {
      menu.classList.add('has-search');
      optionList.className = 'mojo-select-options';
      optionList.id = `${menu.id}-options`;
      menu.setAttribute('role', 'group');
    }
    optionList.setAttribute('role', 'listbox');
    optionList.setAttribute('aria-label', fieldName);
    menu.hidden = true;
    trigger.setAttribute('aria-controls', optionList.id || menu.id);

    let search, noMatches;
    if (searchable) {
      search = document.createElement('input');
      search.type = 'search';
      search.className = 'mojo-select-search';
      search.placeholder = `Search ${fieldName.toLowerCase()}s`;
      search.setAttribute('aria-label', `Search ${fieldName.toLowerCase()}s`);
      search.setAttribute('autocomplete', 'off');
      menu.append(search, optionList);
      noMatches = document.createElement('p');
      noMatches.className = 'mojo-select-empty';
      noMatches.textContent = 'No matching campaigns';
      noMatches.hidden = true;
      optionList.after(noMatches);
    }

    const items = Array.from(nativeSelect.options).map((option, optionNumber) => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'mojo-select-option';
      item.id = `${menu.id}-option-${optionNumber}`;
      item.setAttribute('role', 'option');
      item.dataset.index = optionNumber;
      const optionLabel = document.createElement('span');
      optionLabel.textContent = option.textContent;
      const check = document.createElement('span');
      check.className = 'mojo-select-check';
      check.setAttribute('aria-hidden', 'true');
      check.textContent = '✓';
      item.append(optionLabel, check);
      optionList.append(item);
      return item;
    });

    function filterOptions() {
      if (!search) return;
      const query = search.value.trim().toLocaleLowerCase();
      let visible = 0;
      items.forEach(item => {
        item.hidden = !item.textContent.toLocaleLowerCase().includes(query);
        if (!item.hidden) visible++;
      });
      noMatches.hidden = visible > 0;
    }

    function update() {
      value.textContent = nativeSelect.selectedOptions[0]?.textContent || '';
      trigger.setAttribute('aria-label', `${fieldName}: ${value.textContent}`);
      items.forEach((item, index) => item.setAttribute('aria-selected', String(index === nativeSelect.selectedIndex)));
    }

    function close(restoreFocus = false) {
      menu.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
      wrapper.classList.remove('is-open', 'opens-up');
      if (restoreFocus) trigger.focus();
    }

    function open() {
      document.querySelectorAll('.mojo-select.is-open').forEach(other => {
        if (other !== wrapper) other.querySelector('.mojo-select-trigger').click();
      });
      const spaceBelow = window.innerHeight - trigger.getBoundingClientRect().bottom;
      wrapper.classList.toggle('opens-up', spaceBelow < Math.min(items.length * 36 + 20, 290));
      menu.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
      wrapper.classList.add('is-open');
      if (search) {
        search.value = '';
        filterOptions();
        search.focus();
      } else (items[nativeSelect.selectedIndex] || items[0])?.focus();
    }

    function choose(index) {
      if (index < 0 || index >= items.length) return;
      nativeSelect.selectedIndex = index;
      nativeSelect.dispatchEvent(new Event('input', { bubbles: true }));
      nativeSelect.dispatchEvent(new Event('change', { bubbles: true }));
      update();
      close(true);
    }

    trigger.addEventListener('click', () => menu.hidden ? open() : close(true));
    trigger.addEventListener('keydown', event => {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
        event.preventDefault();
        open();
      }
    });
    menu.addEventListener('click', event => {
      const item = event.target.closest('.mojo-select-option');
      if (item) choose(Number(item.dataset.index));
    });
    menu.addEventListener('keydown', event => {
      const visibleItems = items.filter(item => !item.hidden);
      const current = visibleItems.indexOf(document.activeElement);
      let next = current;
      if (event.key === 'ArrowDown') next = Math.min(current + 1, visibleItems.length - 1);
      else if (event.key === 'ArrowUp') next = Math.max(current - 1, 0);
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = visibleItems.length - 1;
      else if (event.key === 'Enter' || event.key === ' ') {
        if (document.activeElement === search && event.key === ' ') return;
        event.preventDefault();
        const selected = current >= 0 ? visibleItems[current] : visibleItems[0];
        if (selected) choose(Number(selected.dataset.index));
        return;
      } else if (event.key === 'Escape' || event.key === 'Tab') {
        if (event.key === 'Escape') event.preventDefault();
        close(event.key === 'Escape');
        return;
      } else return;
      event.preventDefault();
      visibleItems[next]?.focus();
    });
    search?.addEventListener('input', filterOptions);
    document.addEventListener('pointerdown', event => {
      if (!menu.hidden && !wrapper.contains(event.target)) close();
    });
    nativeSelect.addEventListener('change', update);

    nativeSelect.insertAdjacentElement('beforebegin', wrapper);
    wrapper.append(nativeSelect, trigger, menu);
    nativeSelect.classList.add('mojo-native-select');
    nativeSelect.tabIndex = -1;
    nativeSelect.setAttribute('aria-hidden', 'true');
    update();
  }

  document.querySelectorAll('select').forEach(enhanceSelect);
  // Most app panels are rendered after DOMContentLoaded. Enhance their controls
  // as they arrive so no interaction opens a browser-native dropdown.
  const selectObserver = new MutationObserver(records => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (node.nodeType !== 1) continue;
        if (node.matches?.('select')) enhanceSelect(node);
        node.querySelectorAll?.('select').forEach(enhanceSelect);
      }
    }
  });
  selectObserver.observe(document.body, { childList: true, subtree: true });
});
