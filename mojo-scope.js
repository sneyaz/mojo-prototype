/* Shared campaign initiative pills and brief view control. */
window.MojoInitiativePicker = (menu, campaignNames, onChange, beforeSelector) => {
  const catalog=window.MojoInitiatives;
  const savedGoals=catalog?.read('mojo-campaign-goals-v1')?.goals||[];
  const options=['visibility','expansion','coverage','acceleration'].map(id=>[id,savedGoals.find(goal=>goal.id===id)?.initiative||catalog?.byId(id)?.name||id]);
  const defaults={'GO Prep':'visibility','MOF — Patient Payments':'visibility','2026-Q4-eBook-ConnectedGTM':'visibility','2026-Q4-CTV-ICP-Roku':'visibility','2026-Q4-EMEA-Benelux':'visibility','Q4 Pipeline Search':'visibility','Enterprise Retargeting':'visibility','Q4 Enterprise Pipeline':'coverage','2026-Q4-EMEA-TAL-ABX':'coverage','2026-Q4-ENT-TAL-NA-ABX':'coverage','2026-Q4-HC-ICP-NA-Display':'coverage','2026-Q4-MFG-TAL-NA-ABX':'coverage','2026-Q4-Retargeting-Pricing-Page':'acceleration','2026-Q4-SEM-ICP-NA-AI':'acceleration','2026-Q4-SEM-ICP-EMEA-AI':'acceleration','2026-Q4-SEM-TAL-EMEA-Unified':'acceleration','2026-Q4-Customer-TryIt-NA':'expansion','2026-Q4-MM-All-NA':'expansion','2026-Q4-MM-All-EMEA':'expansion','2026-Q4-ENT-ICP-EMEA-Unified':'expansion'};
  const fieldset = document.createElement('fieldset');
  fieldset.className = 'mojo-scope-initiatives';
  fieldset.innerHTML = '<legend>Initiatives</legend><div class="mojo-scope-initiative-options"></div>';
  const selected = new Set();
  const assignmentFor = name => {
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem('mojo-campaign-goals-v1') || '{}').assignments || {}; } catch {}
    if (saved[name] || defaults[name]) return saved[name] || defaults[name];
    return null;
  };
  for (const [id,label] of options) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'mojo-scope-initiative-pill';
    button.textContent = label;
    button.setAttribute('aria-pressed', 'false');
    button.addEventListener('click', () => {
      if (selected.has(id)) selected.delete(id); else selected.add(id);
      button.setAttribute('aria-pressed', String(selected.has(id)));
      onChange(campaignNames.filter(name => selected.has(assignmentFor(name))));
    });
    fieldset.lastElementChild.append(button);
  }
  const before = menu.querySelector(beforeSelector);
  if (before) before.before(fieldset); else menu.append(fieldset);
  return {clear: () => {
    selected.clear();
    fieldset.querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed','false'));
  }};
};
document.addEventListener('DOMContentLoaded', () => {
  const main = document.querySelector('main.canvaspane');
  if (!main) return;
  const route = location.pathname.split('/').pop() || 'HomeSystem';
  const page = route === 'index' || route === 'index.html'
    ? 'HomeSystem.html'
    : route.endsWith('.html') ? route : `${route}.html`;
  if (page === 'Strategy.html') {
    const subtitle = [...main.children].find(element => element.tagName === 'P');
    if (subtitle) subtitle.textContent = 'Composite sample · separate campaign exports · reviewed weekly.';
  }
  // A control should only appear where choosing it changes the current page.
  if (page !== 'HomeSystem.html') return;
  const banner = main.querySelector('.performance-client-banner');
  const chip = banner || document.createElement('button');
  chip.classList.add('mojo-scope-chip');
  if (!banner) {
    chip.type = 'button';
    const label = document.createElement('span');
    const name = document.createElement('strong');
    const detail = document.createElement('small');
    label.className = 'mojo-filter-icon';
    label.setAttribute('role', 'img');
    label.setAttribute('aria-label', 'Filter by');
    label.innerHTML = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 20a1 1 0 0 0 .553.895l2 1A1 1 0 0 0 14 21v-7a2 2 0 0 1 .517-1.341L21.74 4.67A1 1 0 0 0 21 3H3a1 1 0 0 0-.742 1.67l7.225 7.989A2 2 0 0 1 10 14z"/></svg>';
    name.textContent = 'All Active Campaigns';
    detail.textContent = '26 scenario campaigns';
    chip.append(label, name, detail);
    const anchor = main.querySelector('.brief-ledger-layout > section > :first-child');
    anchor?.after(chip);
  }
  if (page === 'HomeSystem.html') {
    const focusApi = window.mojoBriefFocusControls;
    const updateFocus = () => {
      const focus = window.mojoBriefFocus;
      const name = chip.querySelector('strong');
      const detail = chip.querySelector('small');
      if (!name || !detail) return;
      if (!focus || focus.mode === 'all') {
        name.textContent = focus?.platform && focus.platform !== 'all' ? `${focus.platform} campaigns` : focus?.channel && focus.channel !== 'all' ? `${focus.channel} campaigns` : 'All Active Campaigns';
        detail.textContent = focus?.platform && focus.platform !== 'all' || focus?.channel && focus.channel !== 'all' ? `${focus.records?.length || 0} named campaigns` : '26 scenario campaigns';
      } else {
        const count = focus.records?.length || 0;
        name.textContent = focus.mode === 'soon' ? 'Ended Oct 31'
          : focus.mode === 'attention' ? 'Needs attention'
          : count === 1 ? focus.records[0].name : 'Selected campaigns';
        detail.textContent = count === 1
          ? `1 campaign${focus.records[0].platform ? ` · ${focus.records[0].platform}` : ''}`
          : `${count} named campaigns`;
      }
      chip.setAttribute('aria-label', `Change campaign scope. ${name.textContent}. ${detail.textContent}.`);
    };
    window.addEventListener('mojo-brief-focus-change', updateFocus);
    updateFocus();
    if (!focusApi) return;
    chip.classList.add('mojo-scope-editable');
    chip.setAttribute('aria-haspopup', 'dialog');
    chip.setAttribute('aria-expanded', 'false');
    chip.setAttribute('aria-controls', 'mojo-scope-menu');
    const chevron = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    chevron.setAttribute('viewBox', '0 0 16 16');
    chevron.setAttribute('width', '14');
    chevron.setAttribute('height', '14');
    chevron.setAttribute('fill', 'none');
    chevron.setAttribute('stroke', 'currentColor');
    chevron.setAttribute('stroke-width', '1.5');
    chevron.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'm4 6 4 4 4-4');
    chevron.append(path);
    chip.append(chevron);
    const control = document.createElement('div');
    control.className = 'mojo-scope-control';
    chip.before(control);
    control.append(chip);
    const scanline = main.querySelector('.brief-ledger-layout > section > .brief-status-source:not(.scan-workline)');
    const scanSummary = scanline?.querySelector(':scope > span:nth-child(2)');
    if (scanline && scanSummary) {
      scanline.classList.add('brief-scope-scan-row');
      scanline.setAttribute('aria-label', 'Campaign scope and latest scan');
      scanSummary.classList.add('brief-scan-summary');
      scanSummary.textContent = '26 scenario campaigns · Oct–Nov 2026';
      scanline.replaceChildren(control, scanSummary);
    }
    const menu = document.createElement('div');
    menu.className = 'mojo-scope-menu';
    menu.id = 'mojo-scope-menu';
    menu.setAttribute('role', 'dialog');
    menu.setAttribute('aria-label', 'Choose campaigns');
    menu.hidden = true;
    control.append(menu);
    const title = document.createElement('h3');
    title.textContent = 'Choose campaigns';
    const presetList = document.createElement('div');
    presetList.className = 'mojo-scope-presets';
    const presets = {};
    for (const [key, label, note] of [
      ['all', 'All Active Campaigns', '26 scenario campaigns'],
      ['soon', 'Ended Oct 31', 'Three Google Ads flights'],
      ['attention', 'Needs attention', 'Named campaigns to review']
    ]) {
      const option = document.createElement('button');
      option.type = 'button';
      option.className = 'mojo-scope-preset';
      option.append(document.createElement('strong'), document.createElement('small'));
      option.querySelector('strong').textContent = label;
      option.querySelector('small').textContent = note;
      option.addEventListener('click', () => { focusApi.setMode(key); closeMenu(); });
      presetList.append(option);
      presets[key] = option;
    }
    const divider = document.createElement('p');
    divider.className = 'mojo-scope-list-label';
    divider.textContent = 'Or choose named campaigns';
    const platformGroup = document.createElement('div');
    platformGroup.className = 'mojo-scope-platforms';
    platformGroup.setAttribute('role', 'group');
    platformGroup.setAttribute('aria-label', 'Channels');
    platformGroup.innerHTML = '<span>Channels</span><div></div>';
    for (const [value, logo] of [['all',null],['Demandbase Ads','demandbase.png'],['Google Ads','google-ads.svg'],['LinkedIn Ads','linkedin.png']]) {
      const button = document.createElement('button');
      button.type = 'button';button.dataset.platform = value;
      button.setAttribute('aria-label',value === 'all' ? 'All channels' : value);
      button.title = value === 'all' ? 'All channels' : value;
      if (logo) { const image = document.createElement('img'); image.src = `assets/${logo}`; image.alt = ''; button.append(image); }
      else button.textContent = 'All';
      button.addEventListener('click', () => { focusApi.setPlatform(value); draft.clear(); renderList(); updatePlatforms(); });
      platformGroup.lastElementChild.append(button);
    }
    const updatePlatforms = () => platformGroup.querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.platform === focusApi.getState().platform)));
    const search = document.createElement('input');
    search.type = 'search';
    search.className = 'mojo-scope-search';
    search.placeholder = 'Search campaigns';
    search.setAttribute('aria-label', 'Search named campaigns');
    const list = document.createElement('div');
    list.className = 'mojo-scope-campaigns';
    const footer = document.createElement('div');
    footer.className = 'mojo-scope-footer';
    const note = document.createElement('span');
    note.textContent = `${focusApi.records.length} named campaigns available`;
    const apply = document.createElement('button');
    apply.type = 'button';
    apply.textContent = 'Apply focus';
    apply.addEventListener('click', () => { focusApi.setSelected([...draft]); closeMenu(); });
    footer.append(note, apply);
    menu.append(title, presetList, platformGroup, divider, search, list, footer);
    let draft = new Set();
    const initiativePicker = window.MojoInitiativePicker(menu, focusApi.records.map(record => record.name), names => {
      draft = new Set(names);
      renderList();
    }, '.mojo-scope-platforms');
    const logos = {'Google Ads':'google-ads.svg', 'LinkedIn Ads':'linkedin.png', 'Demandbase Ads':'demandbase.png'};
    const renderList = () => {
      list.replaceChildren();
      const query = search.value.trim().toLocaleLowerCase();
      const platform = focusApi.getState().platform;
      const matches = focusApi.records.filter(record => (platform === 'all' || record.platform === platform) && `${record.name} ${record.platform} ${record.channel}`.toLocaleLowerCase().includes(query));
      if (!matches.length) {
        const empty = document.createElement('p');
        empty.textContent = 'No named campaigns match.';
        list.append(empty);
      }
      matches.forEach(record => {
        const row = document.createElement('label');
        row.className = 'mojo-scope-campaign';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = draft.has(record.name);
        checkbox.addEventListener('change', () => {
          initiativePicker.clear();
          if (checkbox.checked) draft.add(record.name); else draft.delete(record.name);
          apply.disabled = draft.size === 0;
        });
        const logo = document.createElement('span');
        logo.className = 'mojo-scope-logo';
        if (logos[record.platform]) {
          const image = document.createElement('img');
          image.src = `assets/${logos[record.platform]}`;
          image.alt = '';
          logo.append(image);
        } else logo.textContent = '·';
        const copy = document.createElement('span');
        copy.append(document.createElement('strong'), document.createElement('small'));
        copy.querySelector('strong').textContent = record.name;
        copy.querySelector('small').textContent = record.platform;
        row.append(checkbox, logo, copy);
        list.append(row);
      });
      apply.disabled = draft.size === 0;
    };
    const closeMenu = (restoreFocus = false) => {
      menu.hidden = true;
      chip.setAttribute('aria-expanded', 'false');
      if (restoreFocus) chip.focus();
    };
    chip.addEventListener('click', () => {
      if (!menu.hidden) { closeMenu(); return; }
      const state = focusApi.getState();
      draft = new Set(state.selected);
      Object.entries(presets).forEach(([key, option]) => option.setAttribute('aria-pressed', String(state.mode === key)));
      updatePlatforms();
      search.value = '';
      renderList();
      menu.hidden = false;
      chip.setAttribute('aria-expanded', 'true');
      search.focus();
    });
    search.addEventListener('input', renderList);
    document.addEventListener('pointerdown', event => { if (!menu.hidden && !control.contains(event.target)) closeMenu(); });
    document.addEventListener('keydown', event => { if (event.key === 'Escape' && !menu.hidden) closeMenu(true); });
  }

});
