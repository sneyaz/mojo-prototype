/* Small, non-blocking transitions. Static demo values never imply a fresh scan. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const timers = new WeakMap();
  const countValues = new WeakMap();
  const format = n => Math.round(n).toLocaleString('en-US');
  function tween(span, from, to) {
    if (!Number.isFinite(to)) return;
    cancelAnimationFrame(timers.get(span));
    countValues.set(span, to);
    if (reduce.matches || from === to) { span.textContent = format(to); return; }
    const start = performance.now(), duration = 490;
    const frame = now => {
      const t = Math.min(1, (now - start) / duration);
      span.textContent = format(from + (to - from) * (1 - Math.pow(1 - t, 3)));
      if (t < 1) timers.set(span, requestAnimationFrame(frame));
    };
    timers.set(span, requestAnimationFrame(frame));
  }
  function attachCount(host, initialReveal = false) {
    if (!host || host.dataset.mojoCountReady) return;
    const node = [...host.childNodes].find(n => n.nodeType === Node.TEXT_NODE && /\d/.test(n.textContent));
    if (!node) return;
    const match = node.textContent.match(/^(.*?)(\d[\d,]*)(.*)$/s);
    if (!match) return;
    const value = Number(match[2].replaceAll(',', ''));
    const span = document.createElement('span'); span.className = 'mojo-count';
    node.replaceWith(document.createTextNode(match[1]), span, document.createTextNode(match[3]));
    host.dataset.mojoCountReady = 'true';
    if (initialReveal) {
      span.textContent = '0';
      const show = () => tween(span, 0, value);
      if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver(entries => { if (entries.some(e => e.isIntersecting)) { io.disconnect(); show(); } }, {threshold:.2});
        io.observe(host);
      } else show();
    } else span.textContent = format(value);
    countValues.set(span, value);
    return span;
  }
  function scanDots() {
    document.querySelectorAll('.livedot').forEach(dot => {
      if (/Last scan/i.test(dot.parentElement?.textContent || '')) dot.classList.add('mojo-scan-live');
    });
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes=[];
    while (walker.nextNode()) {
      const node=walker.currentNode, parent=node.parentElement;
      if (!/Last scan\s+\d+/i.test(node.textContent) || !parent || parent.closest('script,style,.chatpane') || parent.querySelector(':scope > .livedot, :scope > .mojo-scan-dot') || parent.parentElement?.querySelector(':scope > .livedot')) continue;
      nodes.push(node);
    }
    nodes.forEach(node => {
      const dot=document.createElement('span'); dot.className='mojo-scan-dot'; dot.setAttribute('aria-hidden','true');
      node.before(dot);
    });
  }
  function animateBars() {
    const bars=document.querySelector('.ia-bars');
    if (!bars || bars.hidden || reduce.matches) return;
    bars.classList.remove('mojo-bars-updating'); void bars.offsetWidth;
    bars.classList.add('mojo-bars-updating');
    setTimeout(() => bars.classList.remove('mojo-bars-updating'), 520);
  }
  function animateFinding(el, arrived = false) {
    if (!el || reduce.matches) return;
    const cls=arrived?'mojo-finding-arrived':'mojo-finding-enter';
    el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls);
    setTimeout(() => el.classList.remove(cls), arrived?580:410);
  }
  function complete(el) {
    if (!el) return;
    el.classList.remove('mojo-work-complete'); void el.offsetWidth;
    el.classList.add('mojo-work-complete');
    window.dispatchEvent(new CustomEvent('mojo:work-completed'));
    setTimeout(() => el.classList.remove('mojo-work-complete'), 520);
  }
  document.addEventListener('DOMContentLoaded', () => {
    scanDots();
    const initialCountSelectors = '.healthgrid .hcard:nth-child(2) .v,.healthgrid .hcard:nth-child(4) .v,.healthgrid .hcard:nth-child(6) .v,.ia-metrics strong';
    document.querySelectorAll(initialCountSelectors).forEach(el => attachCount(el));
    window.addEventListener('mojo:scan-complete', e => {
      const counts=e.detail?.counts;
      if (!counts || typeof counts!=='object') return;
      for (const [selector,value] of Object.entries(counts)) {
        if (!/^\.(?:healthgrid|ia-metrics)[\w .:#()\-]*$/.test(selector) || !Number.isFinite(value)) continue;
        const host=document.querySelector(selector), span=host?.querySelector('.mojo-count');
        if (span) tween(span,countValues.get(span) ?? value,value);
      }
    });
    const portfolioCount=document.querySelector('#ia-match-count');
    if (portfolioCount) {
      let prior=Number(portfolioCount.textContent.match(/Showing (\d+)/)?.[1] || 0);
      attachCount(portfolioCount);
      window.addEventListener('mojo:portfolio-count', e => {
        const next=Number(e.detail?.count);
        if (!Number.isFinite(next)) return;
        const old=prior; prior=next;
        portfolioCount.dataset.mojoCountReady='';
        const span=attachCount(portfolioCount);
        if (span) tween(span,old,next);
      });
    }
    const picker=document.querySelector('.brief-focus-pick-label');
    if (picker) {
      let prior=0;
      new MutationObserver(() => {
        const next=Number(picker.textContent.match(/^(\d+) selected/)?.[1] || 0);
        if (!next || next===prior) return;
        const old=prior; prior=next;
        picker.textContent=''; const span=document.createElement('span'); span.className='mojo-count'; picker.append(span,' selected');
        tween(span,old,next);
      }).observe(picker,{childList:true,characterData:true,subtree:true});
    }
    const bars=document.querySelector('.ia-bars');
    let visibleBarKey='';
    const syncBars=() => {
      if (!bars) return;
      const platform=document.querySelector('#ia-platform')?.value || 'all';
      const q=(document.querySelector('#ia-search')?.value || '').toLowerCase().trim();
      const names=[];
      bars.querySelectorAll(':scope > div').forEach(row => {
        const name=row.querySelector('b')?.textContent || '';
        row.hidden=(platform!=='all' && platform!=='Google Ads') || (!!q && !name.toLowerCase().includes(q));
        if (!row.hidden) names.push(name);
      });
      bars.hidden=names.length===0;
      const key=names.join('|');
      if (visibleBarKey && key!==visibleBarKey && key) requestAnimationFrame(animateBars);
      visibleBarKey=key;
    };
    syncBars();
    if (bars && 'IntersectionObserver' in window) {
      const io=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){io.disconnect();animateBars();}},{threshold:.15}); io.observe(bars);
    }
    document.querySelectorAll('#ia-platform,#ia-search').forEach(el=>el.addEventListener('input',()=>requestAnimationFrame(syncBars)));
    window.addEventListener('mojo:brief-view-change', e => {
      const view=document.querySelector(`#brief-view-${CSS.escape(e.detail?.view || '')}`);
      if (view) [...view.querySelectorAll('.drow,.compact,.card.lead,.brief-focus-row')].slice(0,5).forEach((row,i)=>setTimeout(()=>animateFinding(row),i*35));
    });
    window.addEventListener('mojo:finding-arrived', e => {
      const el=e.detail?.element;
      if (el instanceof Element) animateFinding(el,true);
      if (e.detail?.finding) window.dispatchEvent(new CustomEvent('mojo:finding-needs-you',{detail:e.detail.finding}));
    });
    const findingRoot=document.querySelector('.brief-view-root') || document.querySelector('.canvaspane');
    if (findingRoot) new MutationObserver(records => {
      for (const record of records) for (const node of record.addedNodes) {
        if (!(node instanceof Element)) continue;
        const candidates=node.matches('.find,.drow')?[node]:[...node.querySelectorAll('.find,.drow')];
        candidates.forEach(el => animateFinding(el,true));
      }
    }).observe(findingRoot,{childList:true,subtree:true});
    document.addEventListener('click', e => {
      const button=e.target.closest('#mc-stage-bulk,#mc-save-draft,#ia-stage-swap,#mc-stage-creative');
      if (!button) return;
      queueMicrotask(() => {
        const status=button.closest('.mc-section,.ia-copy-panel,.mc-creative-edit')?.querySelector('#mc-bulk-status,#mc-draft-status,#ia-swap-status,#mc-copy-feedback');
        if (status && !status.hidden && /ready|saved|queued|review|staged|updated/i.test(status.textContent)) complete(status);
      });
    });
  });
  window.mojoMotion={findingArrived:(element,finding)=>window.dispatchEvent(new CustomEvent('mojo:finding-arrived',{detail:{element,finding}}))};
})();
