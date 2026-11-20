/* Keep source connections visible alongside each feed, including app feeds that rerender. */
(() => {
  const boardConnected = (() => { try { return localStorage.getItem('mojo-board-demandbase-connected-v1') === 'true'; } catch { return false; } })();
  const sources = boardConnected ? [['Demandbase Ads', 'demandbase.png']] : [
    ['Google Ads', 'google-ads.svg'],
    ['Demandbase Ads', 'demandbase.png'],
    ['LinkedIn Ads', 'linkedin.png'],
    ['Salesforce', 'salesforce.png']
  ];
  const markup = () => `<div class="ms-connected" aria-label="Connected sources"><span>INTEGRATIONS</span><div class="ms-connected-logos">${sources.map(([name, asset]) => `<a href="Connections.html" aria-label="${name} connection" title="${name}"><img src="assets/${asset}" alt=""></a>`).join('')}<a href="Connections.html" class="ms-connect-more" aria-label="Connect more sources" title="Connect more">+</a></div></div>`;
  function mount() {
    const home = document.querySelector('#home-feed-view.home-content');
    if (home && !home.querySelector(':scope > .home-connected-rail')) {
      const rail = document.createElement('aside');
      rail.className = 'home-connected-rail';
      rail.setAttribute('aria-label', 'Connected sources');
      rail.innerHTML = markup();
      home.append(rail);
    }
    const appFeed = document.querySelector('.aud-app-body .aud-content:has(>.aud-feed-tabs,>.mojo-feed-rail)');
    if (appFeed && !appFeed.querySelector(':scope > .app-connected-rail')) {
      const rail = document.createElement('aside');
      rail.className = 'app-connected-rail';
      rail.setAttribute('aria-label', 'Connected sources');
      rail.innerHTML = markup();
      appFeed.append(rail);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, {once: true});
  else mount();
  if (document.body.classList.contains('aud-app-body')) {
    const canvas = document.querySelector('.canvaspane.ma-standalone');
    if (canvas) new MutationObserver(mount).observe(canvas, {childList: true, subtree: true});
  }
})();
