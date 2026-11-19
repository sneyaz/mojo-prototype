(() => {
  const chat = document.getElementById('chatOn');
  const sidebar = document.getElementById('sidebarOn');
  const controls = document.querySelector('.home-pane-controls');
  if (!chat || !sidebar || !controls) return;
  const chatButton = controls.querySelector('[data-home-pane="chat"]');
  const canvasButton = controls.querySelector('[data-home-pane="canvas"]');
  const sidebarButton = controls.querySelector('[data-home-pane="sidebar"]');
  const shareButton = controls.querySelector('.home-share-button');
  const sync = () => {
    chatButton.setAttribute('aria-expanded', String(chat.checked));
    sidebarButton.setAttribute('aria-expanded', String(sidebar.checked));
    canvasButton.setAttribute('aria-pressed', String(!chat.checked && !sidebar.checked));
  };
  chat.addEventListener('change', () => {
    if (chat.checked) sidebar.checked = false;
    sync();
  });
  sidebar.addEventListener('change', () => {
    if (sidebar.checked && chat.checked) {
      chat.checked = false;
      chat.dispatchEvent(new Event('change', {bubbles:true}));
    }
    sync();
  });
  chatButton.addEventListener('click', () => {
    chat.checked = !chat.checked;
    chat.dispatchEvent(new Event('change', {bubbles:true}));
  });
  sidebarButton.addEventListener('click', () => {
    sidebar.checked = !sidebar.checked;
    sidebar.dispatchEvent(new Event('change', {bubbles:true}));
  });
  canvasButton.addEventListener('click', () => {
    chat.checked = false;
    sidebar.checked = false;
    chat.dispatchEvent(new Event('change', {bubbles:true}));
    sync();
    document.getElementById('main-content')?.focus({preventScroll:true});
  });
  shareButton?.addEventListener('click', async () => {
    const label = shareButton.querySelector('span');
    try {
      await navigator.clipboard.writeText(location.href);
      label.textContent = 'Link copied';
      shareButton.setAttribute('aria-label', 'Home link copied');
      window.setTimeout(() => {
        label.textContent = 'Share';
        shareButton.setAttribute('aria-label', 'Copy Home link');
      }, 2000);
    } catch {
      label.textContent = 'Copy failed';
      shareButton.setAttribute('aria-label', 'Could not copy Home link');
    }
  });
  sync();
})();
