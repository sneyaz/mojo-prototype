/* Shared navigation: personal Home, company context, apps, then Chats. */
document.addEventListener('DOMContentLoaded', () => {
  const rail = document.querySelector('.rail');
  if (!rail) return;
  const page = (location.pathname.split('/').pop() || 'Home').replace(/\.html$/, '');
  const home = ['Home', 'index'].includes(page);
  let boardConnected = false;
  let appsVisited = false;
  try { boardConnected = localStorage.getItem('mojo-board-demandbase-connected-v1') === 'true'; } catch {}
  try { appsVisited = JSON.parse(localStorage.getItem('mojo-board-app-seen-v1') || '[]').length > 0; } catch {}
  const onboarded = boardConnected || appsVisited;
  const campaigns = page === 'HomeSystem';
  const canvas = ['Work', 'Tasks', 'Activity', 'Portfolio', 'Performance', 'Campaign', 'Accounts', 'Strategy'].includes(page);
  const icon = {
    home: '<path d="m3 10 9-7 9 7v10H3z"/><path d="M9 20v-7h6v7"/>',
    company: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h2m4 0h2M8 12h2m4 0h2M10 21v-5h4v5"/>',
    canvases: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    chat: '<path d="M21 11.5a8.5 8.5 0 0 1-12.3 7.6L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5Z"/>',
    apps: '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M3 9h18M8 14h4M16 12v5m-2.5-2.5h5"/>',
    routines: '<path d="M4 8a8 8 0 0 1 13.6-3.6L20 7"/><path d="M20 3v4h-4"/><path d="M20 16a8 8 0 0 1-13.6 3.6L4 17"/><path d="M4 21v-4h4"/><path d="M12 8v4l2.5 1.5"/>',
    more: '<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>',
    settings: '<path d="M9.8 2.9h4.4l.5 2.1a7.5 7.5 0 0 1 1.7 1l2-.8 2.2 3.8-1.6 1.4a7.6 7.6 0 0 1 0 2l1.6 1.4-2.2 3.8-2-.8a7.5 7.5 0 0 1-1.7 1l-.5 2.2H9.8l-.5-2.2a7.5 7.5 0 0 1-1.7-1l-2 .8-2.2-3.8L5 12.4a7.6 7.6 0 0 1 0-2L3.4 9l2.2-3.8 2 .8a7.5 7.5 0 0 1 1.7-1l.5-2.1Z"/><circle cx="12" cy="11.4" r="2.7"/>',
    library: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/><path d="M8 7h8M8 11h6"/>',
    brain: '<path d="M12 18V5M12 9c-1 1.5-2 2-3 2m3 1c1.5-.2 2.5-1 3-2"/><path d="M17.6 6.5A3 3 0 0 0 12 5a3 3 0 0 0-5.6 1.5A4 4 0 0 0 6 13a4 4 0 0 0 1 7 3 3 0 0 0 5-1 3 3 0 0 0 5 1 4 4 0 0 0 1-7 4 4 0 0 0-.4-6.5Z"/>'
  };
  const svg = name => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${icon[name]}</svg>`;
  const active = value => value ? ' class="mojo-nav-active" aria-current="page"' : '';
  rail.setAttribute('aria-label', 'Mojo navigation');
  rail.innerHTML = `
    <div class="mojo-nav-header"><a class="mojo-board-reset" href="FirstRun.html?view=prospect" aria-label="Restart Mojo" title="Restart Mojo"><img class="mojo-nav-mark" src="assets/moj-mdot.svg?v=20261104v230" alt="" aria-hidden="true"><img class="mojo-nav-wordmark" src="assets/moj-wordmark-black.svg" alt="Mojo"></a><button type="button" class="mojo-nav-toggle" aria-label="Collapse navigation" data-nav-tooltip="Collapse navigation" aria-pressed="true"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/></svg></button></div>
    <a href="${onboarded ? 'Home.html?board=notifications#feed' : 'FirstRun.html?view=prospect'}" aria-label="Home" data-nav-tooltip="Home"${active(home)}>${svg('home')}<span class="mojo-nav-label">Home</span></a>
    <a href="Company.html" aria-label="Company" data-nav-tooltip="Company"${active(page === 'Company')}>${svg('company')}<span class="mojo-nav-label">Company</span></a>
    <span class="mojo-nav-divider mojo-nav-apps-divider" aria-hidden="true"></span>
    <a href="Routines.html" aria-label="Routines" data-nav-tooltip="Routines"${active(page === 'Routines')} hidden>${svg('routines')}<span class="mojo-nav-label">Routines</span></a>
    <span class="mojo-nav-divider mojo-nav-chat-divider" aria-hidden="true"></span>
    <button type="button" class="mojo-nav-chat" aria-label="Chats" data-nav-tooltip="Chats" aria-expanded="false" aria-controls="mojo-chat-menu">${svg('chat')}<span class="mojo-nav-label">Chats</span></button>
    <button type="button" class="mojo-nav-canvases${canvas ? ' mojo-nav-active' : ''}" aria-label="Canvases" data-nav-tooltip="Canvases" aria-expanded="false" aria-controls="mojo-canvas-menu">${svg('canvases')}<span class="mojo-nav-label">Canvases</span></button>
    <button type="button" class="mojo-nav-more${page === 'Apps' ? ' mojo-nav-active' : ''}" aria-label="More" data-nav-tooltip="More" aria-expanded="false" aria-controls="mojo-more-menu">${svg('more')}<span class="mojo-nav-label">More</span></button>
    <span class="mojo-nav-spacer" aria-hidden="true"></span>
    <button type="button" class="mojo-nav-account${page === 'Settings' ? ' mojo-nav-active' : ''}" aria-label="Account and settings" data-nav-tooltip="Account and settings" aria-expanded="false" aria-controls="mojo-account-menu">${svg('settings')}<span class="mojo-nav-label">Settings</span></button>`;
  rail.querySelector('.mojo-board-reset')?.addEventListener('click', () => {
    for (const storage of [localStorage, sessionStorage]) {
      for (const key of Object.keys(storage)) if (key.startsWith('mojo-')) storage.removeItem(key);
    }
  });
  const tooltip=document.createElement('div');
  tooltip.className='mojo-nav-tooltip';
  tooltip.hidden=true;
  tooltip.setAttribute('aria-hidden','true');
  document.body.append(tooltip);
  const hideTooltip=()=>{tooltip.hidden=true;};
  const showTooltip=target=>{
    if(!target?.dataset.navTooltip||target.getAttribute('aria-expanded')==='true')return hideTooltip();
    tooltip.textContent=target.dataset.navTooltip;
    tooltip.hidden=false;
    const rect=target.getBoundingClientRect();
    tooltip.style.left=`${Math.min(rail.getBoundingClientRect().right+10,window.innerWidth-tooltip.offsetWidth-8)}px`;
    tooltip.style.top=`${Math.max(8,Math.min(rect.top+(rect.height-tooltip.offsetHeight)/2,window.innerHeight-tooltip.offsetHeight-8))}px`;
  };
  rail.addEventListener('pointerover',event=>showTooltip(event.target.closest('[data-nav-tooltip]')));
  rail.addEventListener('pointerout',event=>{
    const target=event.target.closest('[data-nav-tooltip]');
    if(target&&!target.contains(event.relatedTarget))hideTooltip();
  });
  rail.addEventListener('focusin',event=>showTooltip(event.target.closest('[data-nav-tooltip]')));
  rail.addEventListener('focusout',hideTooltip);
  rail.addEventListener('pointerdown',hideTooltip);
  window.addEventListener('scroll',hideTooltip,true);
  window.addEventListener('resize',hideTooltip);
  const navToggle = rail.querySelector('.mojo-nav-toggle');
  const setNavExpanded = expanded => {
    document.body.classList.toggle('mojo-nav-expanded', expanded);
    navToggle.setAttribute('aria-pressed', String(expanded));
    const action = expanded ? 'Collapse navigation' : 'Expand navigation';
    navToggle.setAttribute('aria-label', action);
    navToggle.dataset.navTooltip = action;
  };
  let navExpanded = true;
  try { navExpanded = localStorage.getItem('mojo-nav-expanded-v1') !== 'false'; } catch {}
  setNavExpanded(navExpanded);
  navToggle.addEventListener('click', () => {
    const expanded = !document.body.classList.contains('mojo-nav-expanded');
    setNavExpanded(expanded);
    try { localStorage.setItem('mojo-nav-expanded-v1', String(expanded)); } catch {}
  });
  const canvasButton = rail.querySelector('.mojo-nav-canvases');
  const chatButton = rail.querySelector('.mojo-nav-chat');
  const moreButton = rail.querySelector('.mojo-nav-more');
  const menu = document.createElement('div');
  menu.id = 'mojo-canvas-menu';
  menu.className = 'mojo-rail-flyout';
  menu.setAttribute('role', 'group');
  menu.setAttribute('aria-label', 'Canvases');
  menu.hidden = true;
  menu.innerHTML = `<div class="mojo-flyout-head"><strong>Canvases</strong><button type="button" class="mojo-flyout-new" aria-label="Create a canvas with Mojo" title="Create a canvas with Mojo">+</button></div>
    <label class="mojo-flyout-search"><span aria-hidden="true">⌕</span><input type="search" placeholder="Search canvases…" aria-label="Search canvases"></label>
    <nav class="mojo-flyout-list" aria-label="Canvases">
      <a href="HomeSystem.html"${campaigns ? ' aria-current="page"' : ''}>${svg('canvases')}<span>Campaigns · Feed</span></a>
      <a href="Portfolio.html#campaigns"${['Portfolio','Performance','Campaign'].includes(page) ? ' aria-current="page"' : ''}>${svg('canvases')}<span>Campaign performance</span></a>
      <a href="Portfolio.html#accounts"${page === 'Accounts' ? ' aria-current="page"' : ''}>${svg('canvases')}<span>Account activity</span></a>
      <a href="BestPractices.html">${svg('canvases')}<span>Campaign best practices</span></a>
      <a href="Strategy.html"${page === 'Strategy' ? ' aria-current="page"' : ''}>${svg('canvases')}<span>Campaign strategy</span></a>
      <a href="AppWorkspace.html?app=audience-builder#feed">${svg('canvases')}<span>Audience builder</span></a>
      <a href="AppWorkspace.html?app=aeo#feed">${svg('canvases')}<span>AEO</span></a>
      <a href="Work.html"${['Work','Tasks','Activity'].includes(page) ? ' aria-current="page"' : ''}>${svg('canvases')}<span>Work and decisions</span></a>
    </nav><p class="mojo-flyout-empty" hidden>No matching canvases</p>`;
  document.body.append(menu);
  const chatMenu = document.createElement('div');
  chatMenu.id = 'mojo-chat-menu';
  chatMenu.className = 'mojo-rail-flyout';
  chatMenu.setAttribute('role','group');
  chatMenu.setAttribute('aria-label','Chats');
  chatMenu.hidden = true;
  chatMenu.innerHTML = `<div class="mojo-flyout-head"><strong>Chats</strong><button type="button" class="mojo-flyout-new" aria-label="New chat" title="New chat">+</button></div>
    <label class="mojo-flyout-search"><span aria-hidden="true">⌕</span><input type="search" placeholder="Search chats…" aria-label="Search chats"></label>
    <div class="mojo-flyout-list" role="list"></div><p class="mojo-flyout-empty" hidden>No matching chats</p>`;
  document.body.append(chatMenu);
  const renderChatThreads = () => {
    const list = chatMenu.querySelector('.mojo-flyout-list');
    const query = chatMenu.querySelector('input').value.trim().toLowerCase();
    list.replaceChildren();
    const threads = window.MojoChatThreads?.list().filter(item => `${item.title} ${(item.subjects || []).join(' ')}`.toLowerCase().includes(query)) || [];
    threads.forEach(thread => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.threadId = thread.id;
      button.setAttribute('aria-current',thread.id === window.MojoChatThreads.active().id ? 'true' : 'false');
      button.innerHTML = svg('chat');
      const content = document.createElement('span');
      content.className = 'mojo-chat-thread-content';
      const title = document.createElement('span');
      title.className = 'mojo-chat-thread-title';
      title.textContent = thread.title;
      content.append(title);
      if (thread.subjects?.length) {
        const subjects = document.createElement('small');
        subjects.className = 'mojo-chat-thread-category';
        subjects.textContent = thread.subjects.join(' · ');
        content.append(subjects);
      }
      button.append(content);
      list.append(button);
    });
    const empty = chatMenu.querySelector('.mojo-flyout-empty');
    empty.hidden = threads.length > 0;
    empty.textContent = query ? 'No matching chats' : 'No chats yet';
  };
  renderChatThreads();
  chatMenu.querySelector('input').addEventListener('input',renderChatThreads);
  document.addEventListener('mojo:chat-threads-changed',renderChatThreads);
  const moreMenu = document.createElement('div');
  moreMenu.id = 'mojo-more-menu';
  moreMenu.className = 'mojo-rail-flyout mojo-more-menu';
  moreMenu.setAttribute('role','group');
  moreMenu.setAttribute('aria-label','More destinations');
  moreMenu.hidden = true;
  moreMenu.innerHTML = `<div class="mojo-flyout-head"><strong>More</strong></div>
    <nav class="mojo-flyout-list" aria-label="More destinations">
      <a href="Apps.html"${page === 'Apps' ? ' aria-current="page"' : ''}>${svg('apps')}<span>Apps</span></a>
      <a href="BestPractices.html"${page === 'BestPractices' ? ' aria-current="page"' : ''}>${svg('library')}<span>Library</span></a>
      <a href="Strategy.html"${page === 'Strategy' ? ' aria-current="page"' : ''}>${svg('brain')}<span>Brain</span></a>
    </nav>`;
  document.body.append(moreMenu);
  const accountButton = rail.querySelector('.mojo-nav-account');
  const accountMenu = document.createElement('div');
  accountMenu.id = 'mojo-account-menu';
  accountMenu.className = 'mojo-account-menu';
  accountMenu.setAttribute('role', 'group');
  accountMenu.setAttribute('aria-label', 'Account and settings');
  accountMenu.hidden = true;
  accountMenu.innerHTML = `<div class="mojo-account-profile"><span class="mojo-account-avatar" aria-hidden="true">S</span><span><strong>Sarah Neyaz</strong><small>Mojo preview workspace</small></span></div><nav aria-label="Account options"><a href="Settings.html">${svg('settings')}<span>Settings &amp; permissions</span></a><a href="Connections.html">${svg('apps')}<span>Connections</span></a><a href="Routines.html">${svg('routines')}<span>Routines</span></a></nav>`;
  document.body.append(accountMenu);
  let flyoutCloseTimer;
  const cancelFlyoutClose=()=>clearTimeout(flyoutCloseTimer);
  const closeMenu = () => { cancelFlyoutClose(); menu.hidden = true; canvasButton.setAttribute('aria-expanded', 'false'); };
  const closeChatMenu = () => { cancelFlyoutClose(); chatMenu.hidden = true; chatButton.setAttribute('aria-expanded','false'); };
  const closeMore = () => { cancelFlyoutClose(); moreMenu.hidden = true; moreButton.setAttribute('aria-expanded','false'); };
  const closeAccount = () => { accountMenu.hidden = true; accountButton.setAttribute('aria-expanded','false'); };
  const openFlyout = (button,panel,focusSearch=false) => {
    cancelFlyoutClose();closeMenu();closeChatMenu();closeMore();closeAccount();
    panel.hidden=false;
    button.setAttribute('aria-expanded','true');
    panel.style.left=`${rail.getBoundingClientRect().right+10}px`;
    if (panel === chatMenu || panel === moreMenu) {
      const trigger = button.getBoundingClientRect();
      panel.style.top = `${Math.max(12, Math.min(trigger.top - 10, window.innerHeight - panel.offsetHeight - 12))}px`;
    }
    if(focusSearch)(panel.querySelector('input') || panel.querySelector('.mojo-flyout-list>a'))?.focus();
  };
  const scheduleFlyoutClose=()=>{
    cancelFlyoutClose();
    flyoutCloseTimer=setTimeout(()=>{
      if(!menu.contains(document.activeElement)&&!canvasButton.contains(document.activeElement))closeMenu();
      if(!chatMenu.contains(document.activeElement)&&!chatButton.contains(document.activeElement))closeChatMenu();
      if(!moreMenu.contains(document.activeElement)&&!moreButton.contains(document.activeElement))closeMore();
    },220);
  };
  for(const [button,panel] of [[canvasButton,menu],[chatButton,chatMenu],[moreButton,moreMenu]]){
    button.addEventListener('pointerenter',event=>{if(event.pointerType!=='touch')openFlyout(button,panel);});
    button.addEventListener('pointerleave',scheduleFlyoutClose);
    panel.addEventListener('pointerenter',cancelFlyoutClose);
    panel.addEventListener('pointerleave',scheduleFlyoutClose);
    button.addEventListener('click',()=>openFlyout(button,panel,true));
  }
  for(const panel of [menu,chatMenu]){
    const input=panel.querySelector('input');
    input.addEventListener('input',()=>{
      const query=input.value.trim().toLowerCase();
      const items=[...panel.querySelectorAll('.mojo-flyout-list>a,.mojo-flyout-list>button')];
      items.forEach(item=>item.hidden=!item.textContent.toLowerCase().includes(query));
      panel.querySelector('.mojo-flyout-empty').hidden=items.some(item=>!item.hidden);
    });
  }
  accountButton.addEventListener('click', () => {
    hideTooltip();
    closeMenu(); closeChatMenu(); closeMore();
    const opening = accountMenu.hidden;
    accountMenu.hidden = !opening;
    accountButton.setAttribute('aria-expanded', String(opening));
    if (opening) {
      accountMenu.style.left = `${rail.getBoundingClientRect().right + 10}px`;
      accountMenu.style.bottom = `${Math.max(12, window.innerHeight - accountButton.getBoundingClientRect().bottom)}px`;
    }
  });
  document.addEventListener('pointerdown', event => {
    if (!menu.hidden && !menu.contains(event.target) && !canvasButton.contains(event.target)) closeMenu();
    if (!chatMenu.hidden && !chatMenu.contains(event.target) && !chatButton.contains(event.target)) closeChatMenu();
    if (!moreMenu.hidden && !moreMenu.contains(event.target) && !moreButton.contains(event.target)) closeMore();
    if (!accountMenu.hidden && !accountMenu.contains(event.target) && !accountButton.contains(event.target)) closeAccount();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !menu.hidden) { closeMenu(); canvasButton.focus(); }
    if (event.key === 'Escape' && !chatMenu.hidden) { closeChatMenu(); chatButton.focus(); }
    if (event.key === 'Escape' && !moreMenu.hidden) { closeMore(); moreButton.focus(); }
    if (event.key === 'Escape' && !accountMenu.hidden) { closeAccount(); accountButton.focus(); }
  });
  const chatState = () => {
    const checkbox = document.getElementById('chatOn');
    const trustToggle = document.getElementById('mc-trust-chat-toggle');
    return checkbox ? checkbox.checked : trustToggle?.getAttribute('aria-expanded') === 'true';
  };
  const syncChat = () => {
    if (!chatState()) document.body.classList.remove('mojo-chat-full');
    chatButton.classList.remove('mojo-nav-active');
    chatButton.setAttribute('aria-expanded', String(Boolean(chatState())));
  };
  const openFullChat = (prompt='',reset=false) => {
    closeMenu();closeChatMenu();closeMore();
    document.querySelector('.app')?.classList.toggle('mojo-chat-contextual', Boolean(prompt.trim()));
    if(reset){
      window.MojoChatThreads?.create();
      document.body.classList.remove('mojo-chat-has-messages');
    }
    const checkbox = document.getElementById('chatOn');
    if (checkbox) {
      checkbox.checked = true;
      checkbox.dispatchEvent(new Event('change', {bubbles:true}));
    } else if (!chatState()) document.getElementById('mc-trust-chat-toggle')?.click();
    document.body.classList.remove('mojo-chat-full');
    document.body.classList.toggle('mojo-chat-has-messages', Boolean(window.MojoChatThreads?.active()?.messages.length));
    const query=document.querySelector('.chatpane .chatfoot textarea, .mc-trust-chat .chatfoot textarea');
    if(query){query.value=prompt;query.dispatchEvent(new Event('input',{bubbles:true}));query.focus();}
    syncChat();
  };
  window.MojoOpenChat = openFullChat;
  const openDefaultChat=(prompt='',reset=false)=>window.MojoOpenFloatingChat ? window.MojoOpenFloatingChat(prompt,reset) : openFullChat(prompt,reset);
  chatMenu.querySelector('.mojo-flyout-new').addEventListener('click',()=>openDefaultChat('',true));
  chatMenu.querySelector('.mojo-flyout-list').addEventListener('click',event=>{
    const thread=event.target.closest('button[data-thread-id]');
    if(thread && window.MojoChatThreads?.select(thread.dataset.threadId))openDefaultChat();
  });
  menu.querySelector('.mojo-flyout-new').addEventListener('click',()=>openFullChat('Create a new canvas for ',true));
  document.getElementById('chatOn')?.addEventListener('change', syncChat);
  document.getElementById('mc-trust-chat-toggle')?.addEventListener('click', syncChat);
  document.addEventListener('mojo:chat-sent', () => document.body.classList.add('mojo-chat-has-messages'));
  syncChat();
});
