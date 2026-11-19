/* Board demo, beat 3: Fix, Optimize and See why resolve on the feed card itself.
   Chat stays available from the Discuss icon, but nothing here opens it. */
(() => {
  if (location.pathname.split('/').pop() !== 'HomeSystem.html') return;
  const KEY = 'mojo-feed-inline-v3';
  const fresh = {approvedFixes:false, reviewOn:null, budgetOpen:false, budgetRequested:false, openWhy:[]};
  let state;
  try { state = {...fresh, ...JSON.parse(localStorage.getItem(KEY) || '{}')}; } catch { state = {...fresh}; }
  state.openWhy = []; // evidence panels start closed on each visit
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {} };
  const section = () => document.querySelector('#mf-insights .mfc-section');
  const card = id => document.querySelector(`.seq-feed-card[data-seq-card="${id}"]`);
  const ruleActive = index => {try{const demo=JSON.parse(localStorage.getItem('mojo-demo-sequence-v3')||'{}');return demo.teach>index&&!demo.undoneRules?.includes(index)}catch{return false}};

  const evidence = {
    conversion: {
      facts: [['What changed', 'Landing page update on Nov 3'], ['Campaigns affected', '6 across Google Ads and LinkedIn Ads'], ['Spend since', '$24,600 with no tracked conversions']],
      source: 'Campaign tracking · conversion events by day',
      check: 'Mojo prepared corrected tracking links for all six campaigns.',
      href: 'CampaignLifecycle.html?view=optimize#issues'
    },
    names: {
      facts: [['Names to fix', '4 campaigns'], ['Mismatch', 'End date in the name differs from the flight setting'], ['Rule', 'Campaign names must include the end date · Set by Pam']],
      source: 'Campaign names compared with flight settings',
      check: 'Mojo renamed each campaign to match its flight end date.',
      href: 'BestPractices.html'
    },
    pacing: {
      facts: [['Underpacing', '9 of 22 flights below 40% of plan'], ['Counterintuitive move', 'The security campaign looks weak on spend, but buyer engagement is strong. It was underfunded, not underperforming.'], ['Rule', 'Over 10% of a flight budget needs team approval · Set by Pam']],
      source: 'Demandbase Ads delivery · buying-group engagement',
      check: 'No budget moves until your team approves.',
      href: 'Portfolio.html#campaigns'
    },
    plan: {
      facts: [['Ended flights', '3 in Q4'], ['Follow-ups scheduled', 'None'], ['Signal', '1,146 engaged accounts, most with one buyer']],
      source: 'Campaign planning · Demandbase buying groups',
      check: 'Mojo has an idea ready in Plan.',
      href: 'Strategy.html'
    }
  };

  /* ---------- See why: inline evidence on the card ---------- */
  function renderWhy(id) {
    const c = card(id);
    if (!c) return;
    const open = state.openWhy.includes(id);
    const button = c.querySelector('.mfc-actions .mojo-see-why');
    if (button) { button.textContent = open ? 'Hide why' : 'See why'; button.setAttribute('aria-expanded', String(open)); }
    let panel = c.querySelector('.seq-inline-why');
    if (!open) { panel?.remove(); return; }
    const e = evidence[id];
    if (!e) return;
    if (!panel) {
      panel = document.createElement('section');
      panel.className = 'seq-inline-why';
      panel.setAttribute('aria-label', 'Why Mojo flagged this');
      c.querySelector('.mfc-actions')?.before(panel);
    }
    const facts=e.facts.map(([k,v])=>[k,k==='Rule'&&id==='names'&&!ruleActive(2)?'Suggested naming rule · save in Build before applying':k==='Rule'&&id==='pacing'&&!ruleActive(1)?'Suggested budget rule · save in Feed before routing':v]);
    panel.innerHTML = `<p>${c.dataset.seqWhy || ''}</p>
      <dl><div><dt>Data source</dt><dd>${e.source}</dd></div><div><dt>Triggered by · Mojo Brain</dt><dd>${facts[0][1]}</dd></div><div><dt>Recommended action</dt><dd>${e.check}</dd></div></dl>
      <div class="seq-inline-why-foot"><a href="${e.href}">Open the records →</a></div>`;
  }
  const toggleWhy = id => {
    state.openWhy = state.openWhy.includes(id) ? state.openWhy.filter(x => x !== id) : [...state.openWhy, id];
    save(); renderWhy(id);
  };

  /* ---------- Fix: review both corrections before approval ---------- */
  function renderFixReview(){
    document.querySelectorAll('.seq-fix-review').forEach(panel=>panel.remove());
    if(!state.reviewOn||state.approvedFixes)return;
    const c=card(state.reviewOn);if(!c)return;
    const panel=document.createElement('section');panel.className='seq-fix-review';panel.setAttribute('aria-label','Review both proposed fixes');
    panel.innerHTML=`<div class="seq-fix-review-head"><span class="seq-badge">Review before applying</span><strong>Two corrections are ready</strong></div><div class="seq-fix-review-grid"><div><span>01 · Tracking</span><strong>Restore conversion tracking on 6 campaigns</strong><p>Update the links affected by the Nov 3 landing page change. $24,600 in spend was affected.</p></div><div><span>02 · Naming</span><strong>Correct 4 campaign end dates</strong><p>Match each campaign name to its flight end date under Pam’s Campaigns rule.</p></div></div>${ruleActive(2)?'<p class="seq-review-rule">Campaign naming rule · Active · Set by Pam</p>':'<p class="seq-review-rule needs-rule">The naming rule is still suggested. Save it in Build before applying these fixes.</p>'}<div class="seq-fix-review-actions">${ruleActive(2)?'<button type="button" class="seq-button primary" data-feed-act="fix-apply">Approve and apply both fixes</button>':'<a class="seq-button" href="CampaignLifecycle.html?view=build">Save campaign rule in Build →</a>'}<button type="button" class="seq-button" data-feed-act="fix-close">Not now</button></div>`;
    c.querySelector('.mfc-actions')?.before(panel);
    c.querySelector('.mfc-primary')?.setAttribute('aria-expanded','true');
  }
  function clearState() {
    const s = section();
    if (!s) return;
    let clear = s.querySelector('.seq-fix-clear');
    if (!clear) { s.insertAdjacentHTML('afterbegin', '<div class="seq-fix-clear" hidden></div>'); clear = s.querySelector('.seq-fix-clear'); }
    if (!clear.dataset.inline) {
      clear.dataset.inline = 'true';
      clear.innerHTML = '<span class="seq-fix-clear-mark" aria-hidden="true">✓</span><div><strong>Nothing broken right now.</strong><small>You cleared everything from last week. Mojo is still watching all 42 live campaigns.</small></div>';
    }
    clear.hidden = !(state.approvedFixes && document.querySelector('[data-feed-filter="Fix"][aria-pressed="true"]'));
  }
  function hideFixed() {
    document.querySelectorAll('.seq-feed-card[data-feed-area="Fix"]').forEach(c => { c.classList.add('seq-fixed-away'); c.hidden = true; });
    clearState();
  }
  function toast(text) {
    document.querySelector('.seq-feed-toast')?.remove();
    const t = document.createElement('div');
    t.className = 'seq-feed-toast';
    t.setAttribute('role', 'status');
    t.innerHTML = `<span aria-hidden="true">✓</span>${text}`;
    document.body.append(t);
    requestAnimationFrame(() => t.classList.add('is-in'));
    setTimeout(() => { t.classList.remove('is-in'); setTimeout(() => t.remove(), 300); }, 4200);
  }
  function approveFixes() {
    if (state.approvedFixes || !ruleActive(2)) return;
    state.approvedFixes = true; state.reviewOn=null; save();renderFixReview();
    const fixCards = [...document.querySelectorAll('.seq-feed-card[data-feed-area="Fix"]')];
    fixCards.forEach(c => {
      c.classList.add('seq-card-resolved');
      c.querySelector('.seq-inline-why')?.remove();
      const primary = c.querySelector('.mfc-primary');
      if (primary) { primary.textContent = '✓ Fixed'; primary.setAttribute('aria-disabled', 'true'); }
      const note = c.dataset.seqCard === 'conversion' ? 'Tracking restored on 6 campaigns.' : '4 names now match their flight end dates.';
      c.querySelector('.mfc-actions')?.insertAdjacentHTML('beforebegin', `<p class="seq-resolved-note"><span aria-hidden="true">✓</span>${note}</p>`);
    });
    setTimeout(() => {
      fixCards.forEach(c => c.classList.add('seq-card-leaving'));
      setTimeout(() => { hideFixed(); toast('Both fixes applied. Nothing broken right now.'); }, 420);
    }, 1500);
  }

  /* ---------- Optimize: budget shift reviewed and routed on the card ---------- */
  function renderBudget() {
    const c = card('pacing');
    if (!c) return;
    const primary = c.querySelector('.mfc-primary');
    if (primary) {
      primary.textContent = state.budgetRequested ? '✓ Sent for team approval' : state.budgetOpen ? 'Hide budget shift' : 'Review budget shift →';
      primary.setAttribute('aria-expanded', String(state.budgetOpen || state.budgetRequested));
    }
    let panel = c.querySelector('.seq-budget-panel');
    if (!state.budgetOpen && !state.budgetRequested) { panel?.remove(); return; }
    if (!panel) {
      panel = document.createElement('section');
      panel.className = 'seq-budget-panel';
      panel.setAttribute('aria-label', 'Proposed budget shift');
      (c.querySelector('.seq-inline-why') || c.querySelector('.mfc-actions'))?.before(panel);
    }
    panel.classList.toggle('is-sent', state.budgetRequested);
    panel.innerHTML = `<div class="seq-budget-head"><strong>Proposed shift · $20,000 across Q4 flights</strong><span class="seq-budget-flag">${state.budgetRequested ? 'Waiting on team' : 'Needs team approval'}</span></div>
      <ul class="seq-budget-moves">
        <li><span>From 9 underpacing flights</span><b class="out">−$20,000</b></li>
        <li><span>Engaged-account follow-up</span><b class="in">+$12,000</b></li>
        <li class="seq-budget-counter"><span>Security campaign<em>Underfunded, not underperforming</em><small>Low spend so far, but its accounts are engaging. Mojo is giving it more, not less.</small></span><b class="in">+$8,000</b></li>
      </ul>
      <div class="seq-budget-threshold"><span>Security flight budget</span><strong>$40,000 → $48,000</strong><b>+20%</b><small>Above the 10% approval threshold</small></div>
      <p class="seq-budget-rule"><span>Rule</span>${ruleActive(1)?'Ask my team before moving more than 10% of a flight’s budget. · Active · Set by Pam':'Suggested: ask my team before moving more than 10% of a flight’s budget. Save this company rule in Feed first.'}</p>
      ${state.budgetRequested
        ? '<div class="seq-budget-sent"><span aria-hidden="true">✓</span><div><strong>Sent for team approval</strong><small>No budget has moved yet. Mojo applies the shift once the team approves.</small></div></div>'
        : `<div class="seq-budget-actions">${ruleActive(1)?'<button type="button" class="seq-button primary" data-feed-act="budget-send">Send for team approval</button>':'<span class="seq-budget-gate">Save the company rule to enable team approval.</span>'}<button type="button" class="seq-button" data-feed-act="budget-close">Not now</button></div>`}`;
  }

  /* ---------- Area tags filter the feed instead of leaving it ---------- */
  function filterTo(area) {
    const button = document.querySelector(`.mfd-area-filters [data-feed-filter="${area}"]`);
    if (!button) return false;
    button.click();
    section()?.scrollIntoView({block: 'start', behavior: 'smooth'});
    return true;
  }

  window.addEventListener('click', e => {
    const tag = e.target.closest('.seq-feed-card .mfc-area-tag');
    if (tag) {
      const area = tag.closest('.seq-feed-card').dataset.feedArea;
      if (filterTo(area)) { e.preventDefault(); e.stopImmediatePropagation(); }
    }
  }, true);

  document.addEventListener('click', e => { if (e.target.closest('[data-feed-filter]')) setTimeout(clearState, 0); });
  document.addEventListener('mojo:fix-approved', approveFixes);

  function apply() {
    if (!document.querySelector('.seq-feed-card')) return false;
    if (state.approvedFixes) hideFixed(); else clearState();
    return true;
  }
  document.addEventListener('mojo:board-feed-updated', () => setTimeout(apply, 0));
  let tries = 60;
  (function wait() { if (!apply() && tries--) setTimeout(wait, 150); })();
})();
