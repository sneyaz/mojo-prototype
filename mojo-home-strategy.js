(() => {
  const feed = document.getElementById('home-feed-view');
  const strategy = document.getElementById('home-strategy-view');
  const main = document.getElementById('main-content');
  const tabs = [...document.querySelectorAll('[data-home-view]')];
  if (!feed || !strategy || !main || !tabs.length) return;

  const topbarLabel = document.getElementById('home-topbar-label');
  const stageFrame = strategy.querySelector('.hs-stage-frame');
  let resizeStage = () => {};
  if (stageFrame) {
    let stageObserver;
    resizeStage = () => {
      if (strategy.hidden) return;
      const doc = stageFrame.contentDocument;
      if (!doc) return;
      const height = Math.ceil(doc.querySelector('.wrap')?.getBoundingClientRect().height || doc.body?.scrollHeight || doc.documentElement.scrollHeight);
      if (stageFrame.style.height !== `${height}px`) stageFrame.style.height = `${height}px`;
    };
    stageFrame.addEventListener('load', () => {
      stageObserver?.disconnect();
      if (typeof ResizeObserver !== 'undefined') {
        stageObserver = new ResizeObserver(resizeStage);
        stageObserver.observe(stageFrame.contentDocument.documentElement);
        stageObserver.observe(stageFrame.contentDocument.body);
        stageObserver.observe(stageFrame);
      }
      resizeStage();
    });
    window.addEventListener('resize', resizeStage);
  }

  let lastHash = null;
  const render = (view = location.hash) => {
    const showStrategy = view === '#strategy';
    feed.hidden = showStrategy;
    strategy.hidden = !showStrategy;
    main.classList.toggle('is-strategy', showStrategy);
    if (showStrategy && stageFrame) requestAnimationFrame(resizeStage);
    tabs.forEach(tab => {
      if (tab.dataset.homeView === (showStrategy ? 'strategy' : 'feed')) tab.setAttribute('aria-current', 'page');
      else tab.removeAttribute('aria-current');
    });
    document.title = showStrategy ? 'Mojo — Strategy' : 'Mojo — Home';
    if (topbarLabel) topbarLabel.textContent = 'Home';
    lastHash = location.hash;
  };

  window.addEventListener('hashchange', () => render());
  window.addEventListener('pageshow', () => render());
  tabs.forEach(tab => tab.addEventListener('click', () => render(`#${tab.dataset.homeView}`)));
  // The hosted route restores its hash after the deferred scripts run.
  window.setInterval(() => {
    if (location.hash !== lastHash) render();
  }, 200);
  render();
})();
