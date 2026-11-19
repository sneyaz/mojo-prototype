/* Browser-local agent demonstration. No external campaign, audience or message is changed. */
(() => {
  const key = 'mojo-agent-demo-v1';
  const read = () => { try { return JSON.parse(localStorage.getItem(key) || '{}'); } catch { return {}; } };
  const state = read();
  const save = () => localStorage.setItem(key, JSON.stringify(state));
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&quot;'}[c]));

  function budget() {
    const stream = document.querySelector('.mfc-feed #mf-insights .mf-stream');
    const budgetCard = stream?.querySelector('[data-finding-id="flight-allocation"]');
    if (!budgetCard || budgetCard.querySelector('.ma-budget-why')) return false;
    if (budgetCard) {
      const title = budgetCard.querySelector('h2 .mf-finding-title-link');
      if (title) title.textContent = '3 Campaigns ended without full coverage of your buying group';
      const summary = budgetCard.querySelector('p');
      if (summary) summary.textContent = 'Mojo found 3 opportunities to leverage in your next campaign.';
      const actions = budgetCard.querySelector('.mfc-actions');
      actions?.insertAdjacentHTML('afterbegin', '<button class="ma-budget-why" type="button" data-ma-budget="why" aria-expanded="false">Why plan now?</button>');
      budgetCard.addEventListener('click', e => {
        const button = e.target.closest('[data-ma-budget]'); if (!button) return;
        if (button.dataset.maBudget === 'why') {
          let evidence = budgetCard.querySelector('.ma-budget-evidence');
          if (evidence) { evidence.remove(); button.setAttribute('aria-expanded', 'false'); }
          else { actions?.insertAdjacentHTML('beforebegin', '<div class="ma-budget-evidence"><b>What Mojo found</b> Three flights ended with $45,920 unspent. Confirm their final results before choosing the audience, message and budget for a follow-up.</div>'); button.setAttribute('aria-expanded', 'true'); }
        }
      });
    }
    return true;
  }

  function strategy() {
    const root = document.querySelector('.mf-strategy');
    if (!root?.querySelector('.msq-hero') || root.querySelector('.ma-strategy-details')) return false;
    const disclosure = document.createElement('details');
    disclosure.className = 'ma-strategy-details';
    disclosure.innerHTML = '<summary><span><b>Agent workflow</b> AI visitor → audience → retargeting → readout</span><span>Explore sample loop ↗</span></summary>';
    const section = document.createElement('section');
    section.className = 'ma-showcase';
    section.setAttribute('aria-label', 'Mojo agent demonstration');
    disclosure.append(section);
    root.querySelector('.msq-hero').after(disclosure);
    const render = () => {
      const approved = !!state.approved;
      section.innerHTML = `<div class="ma-overline"><span class="ma-spark">✦</span> Mojo at work <span class="ma-sample">Realistic sample · browser preview</span></div>
        <div class="ma-hero"><div><h2>From an AI visit to a measured campaign</h2><p>Mojo found 38 target accounts arriving from AI answers. It checked eligibility, proposed a capped retargeting test, then reviewed the same cohort two weeks later.</p></div><div class="ma-first-value"><strong>Under 5 min</strong><span>from one connected source to a proposed move · sample</span></div></div>
        <div class="ma-steps" aria-label="Agent workflow"><div><span>01 · AEO</span><strong>38</strong><small>AI-referred accounts found</small></div><div><span>02 · Audiences</span><strong>30</strong><small>eligible · 8 excluded</small></div><div><span>03 · Campaigns</span><strong>$2k</strong><small>test cap · 20% holdout</small></div><div><span>04 · Measurement</span><strong>14d</strong><small>readout and receipt</small></div></div>
        <div class="ma-proposal"><div><div class="ma-proposal-head"><span>PROPOSAL 01</span><span class="ma-status">${approved?'Approved in preview':'Needs approval'}</span></div><h3>Test retargeting on 24 eligible accounts</h3><p>Hold out 6 comparable accounts. Cap spend at $2,000. Review engaged accounts and opportunity movement after 14 days.</p><div class="ma-actions"><button type="button" class="ma-approve" data-ma="approve">${approved?'Approved ✓':'Approve test'}</button><button type="button" data-ma="why" aria-expanded="${!!state.why}">Why?</button><a href="Routines.html#ai-referral-retargeting">Set autonomy →</a></div></div><div class="ma-readout"><span>Two-week sample receipt</span><strong>$1,742 <small>of $2,000 cap</small></strong><p>5 of 24 exposed accounts engaged; 1 of 6 held-out accounts engaged. One opportunity opened in the exposed group. The group is too small to claim lift.</p><div class="ma-receipt-actions"><span>Audience 30 · exposed 24 · holdout 6</span>${approved?'<button type="button" data-ma="undo">Undo approval</button>':''}</div></div></div>
        ${state.why?'<div class="ma-evidence"><div><b>Signals used</b><span>38 identified AI referrals; 30 passed target-list, customer and region checks. The flight has a $2,000 cap and a 20% holdout.</span></div><div><b>Ruled out</b><span>6 current customers and 2 EMEA accounts. Mojo did not add them to this test.</span></div><div><b>What changes the plan</b><span>Stop at the spend cap; pause if account match falls below 80% or the holdout shows similar engagement after 14 days.</span></div></div>':''}
        <div class="ma-bottom"><div class="ma-refusal"><b>Mojo said no</b><span>It did not move budget into Enterprise: only 1.4 buyer roles are reached per account in this sample. Fix audience coverage first.</span></div><div class="ma-handoff"><b>People stay in the loop</b><span>SDR handoff includes the AI question and campaign touches. MOps approves the exclusion rule.</span><div class="ma-handoff-actions"><button type="button" data-ma="handoff">Preview SDR handoff</button><button type="button" data-ma="email">Preview email approval</button></div>${state.preview?`<p class="ma-handoff-preview">${state.preview==='handoff'?'Slack preview · SDR: This target account returned from an AI comparison answer and engaged with the retargeting test. Review the buying group before outreach.':'Email preview · MOps: Approve the customer and EMEA exclusion rule before this routine can act within limits.'} <em>Preview only · nothing sent</em></p>`:''}</div></div>
        <div class="ma-track"><span><b>Track record · sample</b> 4 proposals · ${approved?'3':'2'} accepted · 1 declined</span><span>$45,920 found · $2,000 test proposed · $0 moved live · 2.8 hours weekly review estimated saved</span></div>`;
    };
    section.addEventListener('click', e => {
      const button = e.target.closest('[data-ma]'); if (!button) return;
      if (button.dataset.ma === 'approve') state.approved = true;
      if (button.dataset.ma === 'undo') state.approved = false;
      if (button.dataset.ma === 'why') state.why = !state.why;
      if (button.dataset.ma === 'handoff' || button.dataset.ma === 'email') state.preview = state.preview === button.dataset.ma ? '' : button.dataset.ma;
      save(); render();
    });
    render();
    return true;
  }

  function routines() {
    const page = document.querySelector('.mr-page'); if (!page) return false;
    const rows = page.querySelectorAll('.mr-routine'); if (!rows.length) return false;
    rows.forEach(row => {
      if (row.querySelector('.ma-autonomy')) return;
      const id = row.dataset.id || row.id;
      const detail = row.querySelector('.mr-detail'); if (!detail) return;
      const control = document.createElement('div'); control.className = 'ma-autonomy';
      control.innerHTML = `<label>Autonomy<select aria-label="${esc(row.querySelector('.mr-name strong')?.textContent || 'Routine')} autonomy"><option>Notify</option><option>Propose</option><option>Act within limits</option></select></label><small>Act within limits follows approved Best practices and stops at its cap. Preview setting only.</small>`;
      detail.querySelector('.mr-delivery, .mr-controls')?.after(control);
      const select = control.querySelector('select'); select.value = state.autonomy?.[id] || 'Propose';
      select.addEventListener('change', () => { state.autonomy ||= {}; state.autonomy[id] = select.value; save(); });
    });
    return true;
  }

  function practices() {
    const root = document.querySelector('#mp-root');
    if (!root?.querySelector('.mps-toolbar') || root.querySelector('.ma-teach')) return false;
    const disclosure = document.createElement('details'); disclosure.className = 'ma-teach';
    disclosure.innerHTML = '<summary>Add Best Practices <span aria-hidden="true">→</span></summary><form><label for="ma-rule">Describe the rule</label><div><input id="ma-rule" required placeholder="Never retarget current customers in EMEA" value="Never retarget current customers in EMEA"><button type="submit">Draft rule</button></div><small>Mojo turns this into a draft for MOps review. No live enforcement from this preview.</small><p class="ma-rule-result" role="status"></p></form>';
    root.querySelector('.mps-toolbar').after(disclosure);
    const form = disclosure.querySelector('form');
    form.addEventListener('submit', e => { e.preventDefault(); const rule = form.querySelector('input').value.trim(); if (!rule) return; state.taughtRule = rule; save(); window.dispatchEvent(new Event('mojo:practice-rule')); });
    if (state.taughtRule) form.querySelector('.ma-rule-result').innerHTML = `<b>Draft guardrail · will block on approval</b> ${esc(state.taughtRule)} <span>MOps approval required.</span>`;
    return true;
  }
  const init = () => { budget(); routines(); practices(); };
  init();
  const observer = new MutationObserver(init);
  observer.observe(document.documentElement, {childList:true,subtree:true});
})();
