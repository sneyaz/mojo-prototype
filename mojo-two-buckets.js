/* A single daily queue and one predictable home for Mojo controls. */
(() => {
  const page = (location.pathname.split('/').pop() || 'HomeSystem').replace(/\.html$/, '');
  const workHash = hash => /handoff/i.test(hash) ? 'queue-handoffs' : /receipt|activity/i.test(hash) ? 'queue-receipts' : /creat|new-campaign/i.test(hash) ? 'queue-create' : /decision|task-/i.test(hash) ? 'queue-decisions' : 'queue-all';
  if (page === 'Work') {
    location.replace(`HomeSystem.html${location.search}#${workHash(location.hash)}`);
    return;
  }

  document.addEventListener('DOMContentLoaded', () => {
    buildNavigation();
    if (page === 'HomeSystem' || page === 'index') buildToday();
    if (['Connections', 'Settings'].includes(page)) buildManagementHeading();
    if (page === 'Apps') {
      document.querySelector('.mm-header-link')?.remove();
    }
    for (const link of document.querySelectorAll('a[href^="Work.html"]')) {
      const old = new URL(link.href, location.href);
      link.href = `HomeSystem.html${old.search}#${workHash(old.hash)}`;
    }
  });

  function buildNavigation() {
    const nav = document.querySelector('.modulenav');
    const rail = document.querySelector('.rail');
    if (!nav || !rail) return;
    const current = key => page === key ? ' aria-current="page" class="on"' : '';
    const lifecycleView = new URLSearchParams(location.search).get('view') || 'build';
    const lifecycleCurrent = key => page === 'CampaignLifecycle' && lifecycleView === key ? ' aria-current="page" class="on"' : '';
    const platformPage = ['Routines', 'Connections', 'Settings', 'Apps'].includes(page);
    nav.classList.add('mojo-ia-nav');
    nav.innerHTML = `<a href="HomeSystem.html#feed-insights"${current('HomeSystem')}>Feed</a><a href="Strategy.html"${current('Strategy')}>Plan</a><a href="CampaignLifecycle.html?view=build"${lifecycleCurrent('build')}>Build</a><a href="Portfolio.html"${current('Portfolio')}>Report</a><a href="BestPractices.html" class="mojo-practices-nav${page==='BestPractices'?' on':''}"${page==='BestPractices'?' aria-current="page"':''}>Best Practices</a>`;
    if (!platformPage) {
      const create = document.createElement('button');
      create.type = 'button';
      create.className = 'mojo-create-cta';
      create.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>Create new campaign';
      create.addEventListener('click', () => window.MojoOpenCampaignCreator?.());
      nav.append(create);
    }
    nav.hidden = platformPage;
    if (platformPage) document.querySelector('.wtitle')?.replaceChildren(page === 'Routines' ? 'Routines' : 'Mojo');
    const canvasMenu = document.getElementById('mojo-canvas-menu');
    if (canvasMenu && !canvasMenu.classList.contains('mojo-rail-flyout')) canvasMenu.innerHTML = '<strong>Mojo Ad Campaigns</strong><a href="HomeSystem.html">Feed <span>Updates and decisions</span></a><a href="Portfolio.html">Dashboards <span>Campaign data</span></a><a href="Strategy.html">Strategy <span>Current plan and next campaigns</span></a><a href="BestPractices.html">Best Practices <span>How your team works</span></a>';
    const apps = rail.querySelector('a[href="Apps.html"]');
    if (apps) {
      const homeIcon = rail.querySelector('a[href="HomeSystem.html"]');
      homeIcon?.classList.remove('mojo-nav-active');
      homeIcon?.removeAttribute('aria-current');
      rail.querySelector('.mojo-nav-canvases')?.classList.remove('mojo-nav-active');
      const appActive = !['Routines', 'Connections', 'Settings'].includes(page);
      apps.classList.toggle('mojo-nav-active', appActive);
      if (appActive) apps.setAttribute('aria-current','true');
      else apps.removeAttribute('aria-current');
      apps.setAttribute('aria-label', appActive && page !== 'Apps' ? 'Apps — Mojo Ad Campaigns selected' : 'Apps');
      apps.dataset.navTooltip = 'Apps';
    }
  }

  function buildManagementHeading() {
    const main = document.querySelector('main.canvaspane');
    if (!main || main.querySelector('.mojo-management-heading')) return;
    const oldCrumb = [...main.querySelectorAll('a[href="Apps.html"]')].find(link => link.parentElement?.textContent.includes(page));
    oldCrumb?.parentElement?.remove();
    const head = document.createElement('div'); head.className = 'mojo-management-heading';
    head.innerHTML = `<nav aria-label="Mojo controls"><a href="Routines.html"${page === 'Routines' ? ' aria-current="page"' : ''}>Routines</a><a href="Connections.html"${page === 'Connections' ? ' aria-current="page"' : ''}>Connections</a><a href="Settings.html"${page === 'Settings' ? ' aria-current="page"' : ''}>Settings</a></nav>`;
    main.prepend(head);
  }

  function buildToday() {
    const main = document.querySelector('main.canvaspane');
    const section = main?.querySelector('.brief-ledger-layout > section');
    const views = section?.querySelector('.brief-view-root');
    const chips = section?.querySelector('.chipr');
    const needs = views?.querySelector('.brief-view-needs');
    const list = needs?.querySelector('.brief-finding-list');
    if (!main || !section || !views || !chips || !list) return;
    document.title = 'Mojo — Today';
    main.classList.add('mojo-today');
    const heading = section.querySelector('h1');
    if (heading) heading.textContent = 'Today';
    const queue = document.createElement('section'); queue.id = 'today-queue'; queue.className = 'today-queue';
    queue.innerHTML = `<header class="today-queue-head"><h2>Your queue</h2></header><div class="today-queue-filters" role="group" aria-label="Filter your queue"><button type="button" data-queue-filter="all" aria-pressed="true">All</button><button type="button" data-queue-filter="decisions" aria-pressed="false">Decisions</button><button type="button" data-queue-filter="handoffs" aria-pressed="false">Handoffs</button><button type="button" data-queue-filter="receipts" aria-pressed="false">Receipts</button></div><div class="today-queue-list"><div data-queue-group="decisions" class="today-queue-group"></div><div data-queue-group="handoffs" class="today-queue-group"></div><div data-queue-group="receipts" class="today-queue-group"></div></div><div class="today-queue-summary">Mojo is also watching signals and running routines. <a href="Routines.html">View routines →</a></div><section id="today-create-panel" class="today-create-panel" hidden aria-label="New campaign"></section>`;
    chips.before(queue);
    const decisions = queue.querySelector('[data-queue-group="decisions"]');
    decisions.append(list);
    for (const row of [...needs.querySelectorAll(':scope > details.drow')]) decisions.append(row);
    needs.querySelector('.brief-this-week')?.remove();
    const handoffs = queue.querySelector('[data-queue-group="handoffs"]');
    const followup = list.querySelector('.brief-handoff-question');
    followup?.remove();
    list.querySelector('.story-owner')?.remove();
    const handoff = document.createElement('details'); handoff.className = 'today-handoff-row';
    handoff.id = 'finding-unreached-accounts';
    handoff.dataset.findingId = 'waystar-unreached-accounts';
    handoff.innerHTML = '<summary><span>HANDOFFS</span><strong>1,140 surging accounts are outside live campaigns</strong><span class="today-chevron" aria-hidden="true">›</span></summary><div class="today-handoff-body"><p><strong>26 handoffs await a sales reply.</strong> CRM eligibility is unverified.</p><a href="Portfolio.html#accounts">Review accounts in Campaigns →</a></div>';
    handoffs.append(handoff);
    const doneList = views.querySelector('.brief-view-done .brief-done-list');
    const receipts = queue.querySelector('[data-queue-group="receipts"]');
    if (doneList) receipts.append(doneList);
    // The old Brief tabs and footer links point to views replaced by this queue.
    chips.remove();
    for (const link of [...section.querySelectorAll('a')].filter(link => link.textContent.trim().startsWith('All findings and receipts'))) {
      link.parentElement?.remove();
    }
    for (const legacyControl of [chips, views, ...document.querySelectorAll('#f-needs,#f-cando,#f-watching,#f-done')]) {
      legacyControl.inert = true;
      legacyControl.setAttribute('aria-hidden', 'true');
    }
    const buttons = [...queue.querySelectorAll('[data-queue-filter]')];
    const setFilter = (filter, updateHash = true) => {
      buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.queueFilter === filter)));
      queue.querySelectorAll('[data-queue-group]').forEach(group => { group.hidden = filter !== 'all' && group.dataset.queueGroup !== filter; });
      if (updateHash) history.replaceState(null, '', `#queue-${filter}`);
    };
    buttons.forEach(button => button.addEventListener('click', () => setFilter(button.dataset.queueFilter)));
    const create = queue.querySelector('#today-create-panel');
    const openCreate = () => {
      if (create.hidden) { create.hidden = false; if (typeof renderBulk === 'function') renderBulk(create); }
      create.scrollIntoView({block: 'start', behavior: 'smooth'});
      history.replaceState(null, '', '#queue-create');
    };
    const initial = location.hash.slice(1);
    const selected = initial.match(/^queue-(decisions|handoffs|receipts)$/)?.[1] || 'all';
    setFilter(selected, false);
    if (initial === 'queue-create') requestAnimationFrame(openCreate);
    if (initial === 'queue-handoffs' || initial === 'finding-unreached-accounts') handoff.open = true;
    if (initial.startsWith('queue-') || initial === 'finding-unreached-accounts') requestAnimationFrame(() => queue.scrollIntoView({block: 'start'}));
    const scopeLink = document.querySelector('a[href$="#brief-focus-controls"]');
    if (scopeLink) scopeLink.textContent = 'Change Today scope';
    window.addEventListener('hashchange', () => {
      const hash = location.hash.slice(1);
      const filter = hash.match(/^queue-(all|decisions|handoffs|receipts)$/)?.[1];
      if (filter) { setFilter(filter, false); queue.scrollIntoView({block: 'start'}); }
      if (hash === 'queue-create') openCreate();
      if (hash === 'finding-unreached-accounts') handoff.open = true;
    });
  }
})();
