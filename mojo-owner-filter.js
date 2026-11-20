/* Shared owner filter for the sample feeds. */
(() => {
  // This V1 demo has one signed-in sample user. Team feeds are a future state.
  const currentUser = 'Pam Beesly';
  const owners = [currentUser, 'Jim Halpert', 'Dwight Schrute', 'Angela Martin'];
  const page = location.pathname.split('/').pop().replace(/\.html$/, '') || 'Home';
  if (!['HomeSystem', 'AppWorkspace'].includes(page)) return;

  const ownerFor = card => {
    const title = card.querySelector('h2, h3, .mfr-body > strong')?.textContent.trim() || '';
    if (/Three flights ended|Intent Surge|3,482 sessions|214 accounts now match|803 match issues|604/.test(title)) return 'Pam Beesly';
    let hash = 0;
    for (const character of title) hash = (Math.imul(hash, 31) + character.charCodeAt(0)) | 0;
    return ['Pam Beesly', 'Pam Beesly', 'Pam Beesly', ...owners.slice(1)][(hash >>> 0) % 6];
  };

  const createControl = () => {
    const personIcon = '<svg class="mojo-owner-person" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M5.5 20c.3-3.5 2.7-5.5 6.5-5.5s6.2 2 6.5 5.5"/></svg>';
    const control = document.createElement('div');
    control.className = 'mojo-owner-control';
    control.innerHTML = `<span class="mojo-owner-label" id="mojo-owner-label">Owner</span>
      <div class="mojo-owner-select-wrap">
        <button class="mojo-owner-trigger" type="button" aria-expanded="false" aria-labelledby="mojo-owner-label mojo-owner-value" aria-controls="mojo-owner-panel">
          <span class="mojo-owner-trigger-value">${personIcon}<span id="mojo-owner-value"></span></span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
        </button>
        <div class="mojo-owner-options mojo-owner-v1-panel" id="mojo-owner-panel" hidden>
          <div class="mojo-owner-current"><span class="mojo-owner-option-value">${personIcon}<span>${currentUser}</span></span><svg class="mojo-owner-check" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg></div>
          <div class="mojo-owner-coming-soon"><strong>Team feeds are coming soon</strong><p>Marketing takes a team. For now, this feed shows your work. Soon, you’ll be able to see what your teammates are working on, too.</p></div>
        </div>
      </div>`;
    const trigger = control.querySelector('.mojo-owner-trigger');
    const menu = control.querySelector('.mojo-owner-options');
    const close = (restoreFocus = false) => {
      menu.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
      control.classList.remove('is-open');
      if (restoreFocus) trigger.focus();
    };
    const open = () => {
      menu.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
      control.classList.add('is-open');
    };
    trigger.addEventListener('click', () => menu.hidden ? open() : close(true));
    trigger.addEventListener('keydown', event => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        open();
      }
    });
    control.addEventListener('keydown', event => { if (event.key === 'Escape' && !menu.hidden) { event.preventDefault(); close(true); } });
    document.addEventListener('pointerdown', event => {
      if (!control.contains(event.target)) close();
    });
    return control;
  };

  const syncControl = () => {
    if (!control) return;
    const display = control.querySelector('#mojo-owner-value');
    if (display.textContent !== currentUser) display.textContent = currentUser;
  };

  const getRoot = () => page === 'Home' ? document.querySelector('#home-feed-view')
    : page === 'HomeSystem' ? document.querySelector('.mf-shell.mfc-feed')
    : document.querySelector('.aud-content');
  const getHost = root => {
    if (page === 'Home') return root.querySelector('.home-source-filter');
    if (page === 'HomeSystem') return root.querySelector('.mfd-unified-toolbar') || root.querySelector('.mf-feed-toolbar .mf-topline');
    const tabs = root.querySelector('.aud-feed-tabs');
    if (tabs) {
      let rail = tabs.parentElement;
      if (!rail.classList.contains('mojo-feed-rail')) {
        rail = document.createElement('div');
        rail.className = 'mojo-feed-rail';
        tabs.before(rail);
        rail.append(tabs);
      }
    }
    return root.querySelector('.aud-feed-scope');
  };
  const getCards = root => [...root.querySelectorAll(page === 'Home' ? '#home-feed .home-card'
    : page === 'HomeSystem' ? '.mfc-card, .mfd-card, .mfr-card'
    : '.aud-feed-item')];

  let root;
  let control;
  let queued = false;
  const sync = () => {
    queued = false;
    root = getRoot();
    if (!root) return;
    const host = getHost(root);
    if (!host) return;
    if (page === 'HomeSystem') {
      const intro = root.querySelector('#mf-insights .mf-source-context, .mf-topline .mf-source-context');
      if (intro && intro.parentElement !== host) host.prepend(intro);
    }
    if (page === 'AppWorkspace' && !root.querySelector('.aud-feed-tabs')) return;
    if (!control || !control.isConnected) control = createControl();
    if (page === 'HomeSystem' || page === 'AppWorkspace') {
      if (control.parentElement !== host) host.append(control);
    } else if (control.parentElement !== host) {
      host.prepend(control);
    }
    syncControl();

    for (const card of getCards(root)) {
      if (card.classList.contains('mfr-card') || card.classList.contains('aud-receipt-row')) {
        card.querySelectorAll('.mojo-card-owner').forEach(badge => badge.remove());
        card.classList.remove('mojo-owner-hidden');
        continue;
      }
      const owner = card.dataset.mojoOwner || ownerFor(card);
      card.dataset.mojoOwner = owner;
      const meta = card.querySelector('.home-meta, .mf-story-meta, .mfd-meta, .aud-feed-meta, .mfr-byline');
      if (meta && !card.querySelector('.mojo-card-owner')) {
        const badge = document.createElement('span');
        badge.className = 'mojo-card-owner';
        badge.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M5.5 20c.3-3.5 2.7-5.5 6.5-5.5s6.2 2 6.5 5.5"/></svg>';
        const ownerName = document.createElement('span');
        ownerName.textContent = owner;
        badge.append(ownerName);
        badge.setAttribute('aria-label', `Owner: ${owner}`);
        badge.title = `Owner: ${owner}`;
        if (meta.classList.contains('mfr-byline')) meta.after(badge);
        else meta.append(badge);
      }
      if (card.classList.contains('mfd-question')) {
        const title = card.querySelector(':scope > h2');
        const badge = card.querySelector('.mojo-card-owner');
        if (title && badge) {
          let row = card.querySelector(':scope > .mfd-title-row');
          if (!row) {
            row = document.createElement('div');
            row.className = 'mfd-title-row';
            title.before(row);
          }
          row.append(title, badge);
        }
      }
      card.querySelectorAll('.mfc-watcher, .aud-feed-byline, .mfr-byline').forEach(byline => byline.remove());
      card.querySelectorAll('.mfd-meta > span:not(.mfd-decision-tag):not(.mf-kind):not(.mojo-card-owner)').forEach(byline => byline.remove());
      card.classList.toggle('mojo-owner-hidden', owner !== currentUser);
    }

    if (page === 'Home') {
      root.querySelectorAll('#home-feed .home-section').forEach(section => {
        const approved = root.querySelectorAll('#home-feed .home-done-receipt').length;
        const count = section.querySelectorAll('.home-card:not(.mojo-owner-hidden)').length + (section.getAttribute('aria-label') === 'Decisions' || section.getAttribute('aria-label') === 'What Mojo did' ? approved : 0);
        const number = section.querySelector('.home-section-title span');
        if (number && number.textContent !== String(count)) number.textContent = String(count);
        section.classList.toggle('mojo-owner-hidden', count === 0);
      });
    } else if (page === 'HomeSystem') {
      root.querySelectorAll('.mfc-section').forEach(section => {
        const count = [...section.querySelectorAll('.mfc-card')].filter(card => !card.hidden && !card.classList.contains('mojo-owner-hidden')).length;
        const number = section.querySelector('.mfc-section-head b');
        if (number && number.textContent !== String(count)) number.textContent = String(count);
        section.classList.toggle('mojo-owner-hidden', count === 0);
      });
      const attentionCount = [...root.querySelectorAll('.mfd-attention-section .mfc-card, .board-source-story[data-board-feed-group="attention"]')]
        .filter(card => !card.hidden && !card.classList.contains('mojo-owner-hidden') && !card.classList.contains('mfd-top15-hidden')).length;
      const attentionPill = root.querySelector('.mfd-feed-summary [data-feed-group="attention"] strong');
      if (attentionPill && attentionPill.textContent !== String(attentionCount)) attentionPill.textContent = String(attentionCount);
      const attentionHeading = root.querySelector('.mfd-attention-section .mfc-section-head b');
      if (attentionHeading && attentionHeading.textContent !== String(attentionCount)) attentionHeading.textContent = String(attentionCount);
      const decisions = root.querySelector('#mf-decisions .mfd-head h1');
      if (decisions && !decisions.classList.contains('mfd-invite-title')) {
        const count = [...root.querySelectorAll('#mf-decisions .mfd-card')].filter(card => !card.hidden && !card.classList.contains('mojo-owner-hidden')).length;
        const title = `${count} decision${count === 1 ? '' : 's'} need you`;
        if (decisions.textContent !== title) decisions.textContent = title;
      }
    } else {
      root.querySelectorAll('.aud-section-head').forEach(head => {
        const following = head.nextElementSibling;
        if (!following?.classList.contains('aud-feed')) return;
        const count = [...following.querySelectorAll('.aud-feed-item')].filter(card => !card.classList.contains('mojo-owner-hidden')).length;
        const label = head.querySelector(':scope > span');
        if (label && /^\d+ (insights?|open|recorded)$/.test(label.textContent.trim())) {
          const suffix = label.textContent.trim().replace(/^\d+ /, '');
          const value = suffix.startsWith('insight') ? `${count} ${count === 1 ? 'insight' : 'insights'}` : `${count} ${suffix}`;
          if (label.textContent !== value) label.textContent = value;
        }
        const title = head.querySelector('h2');
        if (title && /^\d+ decisions? need you$/.test(title.textContent.trim())) {
          const value = `${count} decision${count === 1 ? '' : 's'} need you`;
          if (title.textContent !== value) title.textContent = value;
        }
      });
    }
    const emptyHost = page === 'Home' ? root.querySelector('#home-feed')
      : page === 'HomeSystem' ? root.querySelector('.mf-panel:not([hidden]) .mf-stream')
      : root.querySelector('.aud-feed');
    if (emptyHost) {
      let empty = emptyHost.querySelector(':scope > .mojo-owner-empty');
      const hasCards = getCards(page === 'HomeSystem' ? emptyHost : root).some(card => !card.classList.contains('mojo-owner-hidden'));
      if (!hasCards && getCards(root).length && !empty) {
        empty = document.createElement('p');
        empty.className = 'mojo-owner-empty';
        empty.textContent = 'No items in your feed yet.';
        emptyHost.append(empty);
      }
      if (hasCards) empty?.remove();
    }
  };
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(sync);
  }
  const start = () => {
    schedule();
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, {childList: true, subtree: true});
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once: true});
  else start();
})();
