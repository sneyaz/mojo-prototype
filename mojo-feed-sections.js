/* Decision choices and receipt evidence use the same feed card language. */
(() => {
  if (!/^(HomeSystem|index)(\.html)?$/.test(location.pathname.split('/').pop() || 'index')) return;
  const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const utilityIcons = {
    discuss: '<path d="M20 11.5a8 8 0 0 1-8 8 8.4 8.4 0 0 1-3.6-.8L4 20l1.3-4.4A8 8 0 1 1 20 11.5Z"/>',
    assign: '<circle cx="12" cy="8" r="4"/><path d="M5 20a7 7 0 0 1 14 0"/>',
    snooze: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 1.5M9 2h6"/>'
  };
  function decorateUtilities(footer) {
    const buttons = [...footer.querySelectorAll(':scope > button[data-mfd-action], :scope > button[data-mfr-action]')];
    if (!buttons.length) return;
    const group = document.createElement('span');
    group.className = 'mfc-utility-group';
    group.setAttribute('role', 'group');
    group.setAttribute('aria-label', 'Card actions');
    buttons[0].before(group);
    buttons.forEach(button => {
      const label = button.textContent.trim();
      const action = button.dataset.mfdAction || button.dataset.mfrAction;
      button.setAttribute('aria-label', label);
      button.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${utilityIcons[action]}</svg>`;
      group.append(button);
    });
    const why=document.createElement('button');
    why.type='button';why.className='mojo-see-why';why.textContent='See why';why.dataset.mojoFeedWhy='';
    group.before(why);
  }
  const areaForDecision = id => id === 'strategy-goal' || id === 'strategy-guardrail' ? 'Plan'
    : id === 'influence' || id === 'aeo-comparison' ? 'Report'
    : id === 'reach' ? 'Fix'
    : id === 'ctv' || id === 'enterprise-roles' ? 'Optimize'
    : id === 'customer-holdout' ? 'Optimize' : 'Build';
  const receiptInfo = {
    'utm-repair': {category:'TRACKING', summary:'Six email links were recorded as repaired in the sample.', link:'Routines.html#utm-checker', label:'View tracking rule'},
    'tag-mapping': {category:'TRACKING', summary:'Sixteen campaign tags were mapped to the sample taxonomy.', link:'Routines.html#utm-checker', label:'View mapping rule'},
    'weekly-reports': {category:'REPORTING', summary:'Three drafts are ready for review; none were sent.', link:'HomeSystem.html#queue-reports', label:'Open drafts'},
    'creative-refresh': {category:'CREATIVE', summary:'A new ad concept is ready to test against the tired creative.', link:'Portfolio.html#campaign=2026-Q4-EMEA-TAL-ABX&tab=creatives', label:'Review creative'}
  };
  const quickKey = 'mojo-feed-quick-answers-v1';
  const practiceKey = 'mojo-mops-standards-v2';
  const quickQuestions = [
    {id:'linkedin-mof',area:'accounts',tag:'BUYING GROUP',title:'Reach more buyers with LinkedIn',question:'Should Mojo suggest LinkedIn ads to reach more buyers at accounts already seeing display ads?',more:'Mojo would check which buyers are missing, plus account overlap and exclusions, before suggesting a LinkedIn campaign.',rule:'For consideration-stage target accounts, suggest LinkedIn alongside display when the buying group has uncovered roles. Check overlap and exclusions before proposing spend.',applies:'Consideration-stage target accounts',behavior:'Suggest the pairing for review; never launch it automatically.'},
    {id:'ai-referrals',area:'accounts',tag:'AI VISITS',title:'Follow up on AI visits',question:'When someone at a target account arrives from an AI answer, what should Mojo do first?',options:['Watch audience','Capped retargeting proposal','Owner review'],optionLabels:{'Watch audience':'Watch the account','Capped retargeting proposal':'Draft a small retargeting test','Owner review':'Ask the account owner'},more:'Mojo first needs to match the visit to an account using a GA4 referrer or UTM tag. An anonymous visit alone cannot trigger retargeting.',rules:{'Watch audience':'Add matched AI-referred target accounts to a reviewable watch audience before proposing retargeting.','Capped retargeting proposal':'Draft a capped retargeting proposal for matched AI-referred target accounts, with exclusions and a holdout for review.','Owner review':'Ask the account owner to review a matched AI referral before proposing an audience or spend change.'},applies:'Matched AI-referred target accounts',behavior:'Hold unmatched visits and customer exclusions for review.'},
    {id:'enterprise-roles',area:'accounts',tag:'ENTERPRISE',title:'Enterprise reach before more spend',question:'Before Mojo suggests more Enterprise spend, how many buyer roles should we reach at each account?',options:['2 roles','3 roles','Review each account'],optionLabels:{'2 roles':'At least 2 roles','3 roles':'At least 3 roles','Review each account':'Let the owner decide account by account'},more:'This helps Mojo spot campaigns that reach only one person at a company. It would ask for an audience fix before suggesting more budget.',rules:{'2 roles':'Before increasing Enterprise spend, check that at least two buyer roles are reached in the target account cohort.','3 roles':'Before increasing Enterprise spend, check that at least three buyer roles are reached in the target account cohort.','Review each account':'Before increasing Enterprise spend, ask the owner to review buyer-role coverage for each target account.'},applies:'Enterprise campaign expansion proposals',behavior:'Flag the proposal and ask for an audience coverage plan.'},
    {id:'customer-holdout',area:'measurement',tag:'CUSTOMERS',title:'Compare customer campaign results',question:'How many customer accounts should get no ads so we can compare results?',options:['20% of eligible accounts','10% of eligible accounts','Let the owner choose'],more:'Those excluded accounts are the holdout. Mojo would compare their results with the advertised accounts before suggesting more spend.',rules:{'20% of eligible accounts':'For customer expansion tests, propose a 20% holdout and compare account outcomes before recommending a scale-up.','10% of eligible accounts':'For customer expansion tests, propose a 10% holdout and compare account outcomes before recommending a scale-up.','Let the owner choose':'Before scaling a customer campaign, ask the owner to choose a holdout and approve the test design.'},applies:'Customer expansion campaigns',behavior:'Keep the increase in review until a test design is approved.'},
    {id:'aeo-comparison',area:'reporting',tag:'AI ANSWERS',title:'Review missing AI mentions',question:'If an AI answer comparing vendors leaves out our brand, who should review it?',options:['Content owner','Campaign owner','Both owners'],more:'Mojo would include the buyer question and the AI answer, then ask the chosen owner to decide what content to improve.',rules:{'Content owner':'Route missing priority AI comparison answers to the content owner before suggesting extra paid capture spend.','Campaign owner':'Route missing priority AI comparison answers to the campaign owner before suggesting extra paid capture spend.','Both owners':'Route missing priority AI comparison answers to both content and campaign owners before suggesting extra paid capture spend.'},applies:'Priority AI comparison prompts',behavior:'Send a review proposal with the prompt and answer evidence.'}
  ];
  const quickVisuals = {
    'enterprise-roles':'<span class="mfd-quick-icon" aria-hidden="true"><svg data-lucide-icon="users" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg></span>',
    'customer-holdout':'<span class="mfd-quick-icon" aria-hidden="true"><svg data-lucide-icon="pie-chart" viewBox="0 0 24 24"><path d="M21.21 15.89A10 10 0 1 1 8.11 2.79"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg></span>',
    'aeo-comparison':'<span class="mfd-quick-icon" aria-hidden="true"><svg data-lucide-icon="message-circle-question" viewBox="0 0 24 24"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01"/></svg></span>'
  };
  const readJson = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key) || 'null') || fallback; } catch { return fallback; } };
  const quickAnswer = (item, answer) => answer !== 'no'
    ? `<div class="mfd-quick-receipt" role="status"><span class="mfd-quick-check" aria-hidden="true">✓</span><div><strong>Saved to Best Practices</strong><p>${item.options?escape(item.optionLabels?.[answer] || answer):escape(item.title)}</p><small>Your team reviews it before Mojo uses it.</small><div class="mfd-quick-links"><button type="button" data-quick-action="review">Review in chat</button><button type="button" data-quick-action="undo">Undo</button></div></div></div>`
    : `<div class="mfd-quick-receipt mfd-quick-declined" role="status"><span class="mfd-quick-check" aria-hidden="true">–</span><div><strong>Left out</strong><p>${escape(item.title)}</p><small>Not added to Best Practices.</small><div class="mfd-quick-links"><button type="button" data-quick-action="undo">Undo</button></div></div></div>`;
  const quickAnswers = readJson(quickKey, {});
  let upgradedAnswers = false;
  quickQuestions.forEach(item => {
    if (!item.options || quickAnswers[item.id] !== 'yes') return;
    quickAnswers[item.id] = item.options[0];
    upgradedAnswers = true;
  });
  if (upgradedAnswers) {
    localStorage.setItem(quickKey, JSON.stringify(quickAnswers));
    const practiceState = readJson(practiceKey, {});
    (Array.isArray(practiceState.authored) ? practiceState.authored : []).forEach(entry => {
      const item = quickQuestions.find(question => entry.id === `mojo-quick-${question.id}`);
      if (item?.options && entry.status === 'draft' && entry.rule === item.rule) entry.rule = item.rules[item.options[0]];
    });
    localStorage.setItem(practiceKey, JSON.stringify(practiceState));
  }
  const legacyQuickTitles = {'linkedin-mof':'LinkedIn for middle-funnel accounts','ai-referrals':'AI-referred account follow-up','enterprise-roles':'Enterprise buying-group threshold','customer-holdout':'Customer expansion holdout','aeo-comparison':'Missing AI comparison answer review'};
  const existingPractices = readJson(practiceKey, {});
  let updatedQuickTitles = false;
  (Array.isArray(existingPractices.authored) ? existingPractices.authored : []).forEach(entry => {
    const item = quickQuestions.find(question => entry.id === `mojo-quick-${question.id}`);
    if (item && entry.title === legacyQuickTitles[item.id]) { entry.title = item.title; updatedQuickTitles = true; }
  });
  if (updatedQuickTitles) localStorage.setItem(practiceKey, JSON.stringify(existingPractices));
  const quickQuestionCards = quickQuestions.map(item => `<article class="mfd-card mfd-quick-card mf-feedback-item" data-decision-id="quick-${escape(item.id)}" data-quick-id="${escape(item.id)}" data-mf-feedback-key="decision:quick-${escape(item.id)}" data-mojo-owner="Pam Beesly"><div class="mfd-quick-prompt" ${quickAnswers[item.id]?'hidden':''}><div class="mfd-meta"><span class="mf-kind mf-kind-accounts">${escape(item.tag)}</span></div><h2>${escape(item.question)}</h2>${quickVisuals[item.id]||''}<div class="mfd-quick-actions">${item.options?item.options.map((choice,index)=>`<button type="button" data-quick-action="choose" data-choice="${escape(choice)}" ${index===0?'class="mfd-first-choice"':''}>${escape(item.optionLabels?.[choice] || choice)}</button>`).join(''):'<button type="button" data-quick-action="yes">Yes</button><button type="button" data-quick-action="no">No</button>'}<button type="button" data-quick-action="more" aria-expanded="false">Tell me more</button></div><div class="mfd-quick-more" hidden><p>${escape(item.more)}</p><button type="button" data-quick-action="chat">Ask Mojo about this →</button></div></div><div class="mfd-quick-result" ${quickAnswers[item.id]?'':'hidden'}>${quickAnswers[item.id]?quickAnswer(item,quickAnswers[item.id]):''}</div><div class="mfd-footer"><button type="button" data-mfd-action="discuss">Discuss</button><button type="button" data-mfd-action="snooze">Snooze</button></div></article>`).join('');
  const decisionCards = `
    <article class="mfd-card mfd-question mf-feedback-item" data-decision-id="strategy-goal" data-mf-feedback-key="decision:strategy-goal" data-mojo-owner="Pam Beesly">
      <div class="mfd-meta"><span>Q1 strategy · 30 seconds</span></div>
      <h2>What should Mojo focus on first?</h2>
      <p>Choose the result you want the next campaign plan to improve.</p>
      <fieldset class="mfd-choices"><legend>I want to…</legend><label><input type="radio" name="mfd-strategy-goal" value="More qualified opportunities"><span>Create more qualified opportunities</span></label><label><input type="radio" name="mfd-strategy-goal" value="Deeper buying-group coverage"><span>Reach more buyers at each target account</span></label><label><input type="radio" name="mfd-strategy-goal" value="Lower cost per engaged account"><span>Lower the cost to engage an account</span></label></fieldset>
      <div class="mfd-main-actions"><button type="button" data-mfd-action="save-question" disabled>Save priority</button><button type="button" class="mfd-chat-link" data-mfd-action="question-chat">Something else? Tell Mojo</button><output aria-live="polite"></output></div>
      <div class="mfd-footer"><button type="button" data-mfd-action="discuss">Discuss</button><button type="button" data-mfd-action="snooze">Snooze</button></div>
    </article>
    <article class="mfd-card mfd-question mf-feedback-item" data-decision-id="strategy-guardrail" data-mf-feedback-key="decision:strategy-guardrail" data-mojo-owner="Pam Beesly">
      <div class="mfd-meta"><span>Audience guardrail · 30 seconds</span></div>
      <h2>What should Mojo check before recommending a change?</h2>
      <p>Pick the rule that matters most when Mojo suggests a new audience or budget shift.</p>
      <fieldset class="mfd-choices"><legend>First, Mojo should…</legend><label><input type="radio" name="mfd-strategy-guardrail" value="Exclude current customers from acquisition"><span>Keep current customers out of acquisition campaigns</span></label><label><input type="radio" name="mfd-strategy-guardrail" value="Require two buyer roles in enterprise accounts"><span>Reach at least two buyers at Enterprise accounts</span></label><label><input type="radio" name="mfd-strategy-guardrail" value="Ask my team before shifting budget"><span>Ask my team before moving budget</span></label></fieldset>
      <div class="mfd-main-actions"><button type="button" data-mfd-action="save-question" disabled>Save rule</button><button type="button" class="mfd-chat-link" data-mfd-action="question-chat">Add a rule in your own words</button><output aria-live="polite"></output></div>
      <div class="mfd-footer"><button type="button" data-mfd-action="discuss">Discuss</button><button type="button" data-mfd-action="snooze">Snooze</button></div>
    </article>
    <div class="mfc-section-head mfd-quick-section"><h2>Got a few minutes?</h2><span class="mfd-quick-progress" role="progressbar" aria-label="Questions answered" aria-valuemin="0" aria-valuemax="7" aria-valuenow="0"><i></i></span><b class="mfd-quick-count">0 of 7 answered</b></div>
    ${quickQuestionCards}
    <div class="mfd-subhead"><h2>Decisions waiting on you</h2><span>3 to review</span></div>
    <article class="mfd-card mf-feedback-item" data-decision-id="reach" data-mf-feedback-key="decision:reach" data-mojo-owner="Pam Beesly">
      <div class="mfd-meta"><span class="mf-kind mf-kind-accounts">ENGAGEMENT</span></div>
      <h2>Are engaged accounts turning into pipeline?</h2>
      <p>1,146 target accounts engaged with ads. The CRM summary lists 214 opportunities, but they aren’t matched to those accounts yet.</p>
      <div class="mfd-evidence mfd-pipeline-path" role="img" aria-label="1,146 accounts engaged; 214 opportunities reported separately; campaign influence not yet verified"><span><b>1,146</b> engaged accounts</span><i aria-hidden="true">→</i><span><b>214</b> opportunities reported</span><small>Influence still needs an account match</small></div>
      <fieldset class="mfd-choices"><legend>What should Mojo check first?</legend><label><input type="radio" name="mfd-reach" value="Match engaged accounts to opportunities" checked><span>Match engaged accounts to opportunities</span><em>Mojo recommends</em></label><label><input type="radio" name="mfd-reach" value="Compare engagement by campaign"><span>Compare engagement by campaign</span></label><label><input type="radio" name="mfd-reach" value="Review engaged accounts with sales"><span>Review engaged accounts with sales</span></label></fieldset>
      <div class="mfd-main-actions"><button type="button" data-mfd-action="ask">Ask Mojo to investigate</button></div>
      <div class="mfd-footer"><button type="button" data-mfd-action="discuss">Discuss</button><button type="button" data-mfd-action="assign">Assign</button><button type="button" data-mfd-action="snooze">Snooze</button></div>
    </article>
    <article class="mfd-card mf-feedback-item" data-decision-id="ctv" data-mf-feedback-key="decision:ctv" data-mojo-owner="Pam Beesly">
      <div class="mfd-meta"><span class="mf-kind mf-kind-budget">CTV</span></div>
      <h2>What job should CTV do in Q1?</h2>
      <p>Five CTV campaigns spent $21,640 in this sample. Before Mojo proposes another flight, choose where video belongs in the buying journey.</p>
      <fieldset class="mfd-choices"><legend>Use CTV to…</legend><label><input type="radio" name="mfd-ctv" value="Reach new target accounts"><span>Reach new target accounts</span></label><label><input type="radio" name="mfd-ctv" value="Reinforce accounts already engaged"><span>Reinforce accounts already engaged</span></label><label><input type="radio" name="mfd-ctv" value="Hold until account reach is verified"><span>Hold until account reach is verified</span></label></fieldset>
      <div class="mfd-main-actions"><button type="button" data-mfd-action="measure" disabled>Save CTV role</button><output aria-live="polite"></output></div>
      <div class="mfd-footer"><button type="button" data-mfd-action="discuss">Discuss</button><button type="button" data-mfd-action="assign">Assign</button><button type="button" data-mfd-action="snooze">Snooze</button></div>
    </article>
    <article class="mfd-card mf-feedback-item" data-decision-id="influence" data-mf-feedback-key="decision:influence" data-mojo-owner="Pam Beesly">
      <div class="mfd-meta"><span class="mf-kind mf-kind-measure">MEASUREMENT</span></div>
      <h2>Which opportunities did our ads influence?</h2>
      <p>See the reported opportunities beside campaign activity and find the account matches still missing.</p>
      <div class="mfd-main-actions"><button type="button" class="mfd-primary-link" data-mojo-feed-primary>Explore opportunity influence →</button></div>
      <div class="mfd-footer"><button type="button" data-mfd-action="discuss">Discuss</button><button type="button" data-mfd-action="assign">Assign</button><button type="button" data-mfd-action="snooze">Snooze</button></div>
    </article>`;
  function chat(prompt) {
    if(window.MojoOpenChat){window.MojoOpenChat(prompt);return;}
    const box = document.getElementById('chatOn');
    if (box && !box.checked) { box.checked = true; box.dispatchEvent(new Event('change', {bubbles:true})); }
    const field = document.querySelector('.chatpane textarea, .mojo-fish-chat-form textarea');
    if (field) { field.value = prompt; field.dispatchEvent(new Event('input', {bubbles:true})); field.focus(); }
  }
  function bindDecisions(shell) {
    const panel = shell.querySelector('#mf-decisions');
    const mount = panel?.querySelector('.mf-reported-decisions');
    if (!mount || mount.dataset.mfdReady) return;
    mount.dataset.mfdReady = 'true';
    panel.querySelector('.mf-section-line').hidden = true;
    mount.insertAdjacentHTML('beforebegin', '<div class="mfd-head"><h1 class="mfd-invite-title">Decisions waiting on you</h1></div>');
    mount.innerHTML = decisionCards;
    const decisionHeading = mount.querySelector('.mfd-subhead');
    const activeDecisions = ['reach','ctv','influence'].map(id => mount.querySelector(`[data-decision-id="${id}"]`));
    decisionHeading.remove();
    mount.prepend(...activeDecisions);
    mount.querySelector('[data-decision-id="strategy-goal"]').before(mount.querySelector('.mfd-quick-section'));
    mount.querySelectorAll('.mfd-card').forEach(card => {
      const meta=card.querySelector('.mfd-meta');
      if (!meta) return;
      const tag=document.createElement('a');
      tag.className='mfd-area-tag';
      tag.textContent=areaForDecision(card.dataset.decisionId?.replace(/^quick-/,'') || '');
      tag.href=tag.textContent==='Plan'?'Strategy.html':tag.textContent==='Report'?'Portfolio.html#campaigns':tag.textContent==='Build'?'CampaignLifecycle.html?view=build':tag.textContent==='Fix'?'CampaignLifecycle.html?view=optimize#issues':'CampaignLifecycle.html?view=optimize#performance';
      meta.prepend(tag);
    });
    mount.querySelectorAll('.mfd-footer').forEach(footer => {
      decorateUtilities(footer);
      const card = footer.closest('.mfd-card');
      const row = card.querySelector('.mfd-main-actions') || card.querySelector('.mfd-quick-actions');
      if (card.classList.contains('mfd-quick-card') && card.querySelector('.mfd-quick-result:not([hidden]) .mfd-quick-links'))
        card.querySelector('.mfd-quick-result .mfd-quick-links').append(footer);
      else row?.append(footer);
    });
    const storeQuick = () => localStorage.setItem(quickKey, JSON.stringify(quickAnswers));
    const practiceFor = (item, answer) => ({id:`mojo-quick-${item.id}`,origin:'mojo',area:item.area,title:item.title,rule:item.rules?.[answer] || item.rule,applies:item.applies,behavior:item.behavior,source:'Feed question · sample pattern',author:'Mojo with Pam Beesly',status:'draft'});
    const writePractice = (item, answer) => {
      const state = readJson(practiceKey, {});
      state.authored = Array.isArray(state.authored) ? state.authored : [];
      if (!state.authored.some(entry => entry.id === `mojo-quick-${item.id}`)) state.authored.push(practiceFor(item, answer));
      localStorage.setItem(practiceKey, JSON.stringify(state));
    };
    const removePractice = item => {
      const state = readJson(practiceKey, {});
      if (!Array.isArray(state.authored)) return;
      state.authored = state.authored.filter(entry => entry.id !== `mojo-quick-${item.id}`);
      localStorage.setItem(practiceKey, JSON.stringify(state));
    };
    const transitionQuick = (card, item, answer) => {
      const prompt = card.querySelector('.mfd-quick-prompt');
      const result = card.querySelector('.mfd-quick-result');
      const finish = () => {
        if (prompt.hidden) return;
        prompt.hidden = true;
        prompt.classList.remove('is-poof');
        result.innerHTML = quickAnswer(item, answer);
        result.hidden = false;
        result.classList.add('is-revealed');
        result.querySelector('.mfd-quick-links')?.append(card.querySelector('.mfd-footer'));
        result.querySelector('[data-quick-action="undo"]')?.focus({preventScroll:true});
      };
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) finish();
      else { prompt.classList.add('is-poof'); prompt.addEventListener('animationend', finish, {once:true}); setTimeout(finish, 430); }
    };
    shell.addEventListener('click', event => {
      const button = event.target.closest('[data-quick-action]');
      if (!button) return;
      const card = button.closest('.mfd-quick-card');
      const item = quickQuestions.find(entry => entry.id === card?.dataset.quickId);
      if (!item) return;
      const action = button.dataset.quickAction;
      if (action === 'more') {
        const detail = card.querySelector('.mfd-quick-more');
        detail.hidden = !detail.hidden;
        button.setAttribute('aria-expanded', String(!detail.hidden));
      } else if (action === 'chat') chat(`Why is this a useful Best Practice? ${item.question} What evidence would change your recommendation?`);
      else if (action === 'review') {
        const answer=quickAnswers[item.id];
        window.MojoSeeWhy?.open({title:item.title,reason:`Saved choice: ${item.optionLabels?.[answer]||answer}. ${item.more}`,source:'Your decision on the campaign feed',triggerType:'Best practice',triggerReason:item.rules?.[answer]||item.rule||item.more,nextStep:'Review the saved choice here. Use Undo on the card if you want to choose again.'});
      }
      else if (action === 'undo') {
        if (quickAnswers[item.id] !== 'no') removePractice(item);
        delete quickAnswers[item.id]; storeQuick();
        updateQuickProgress();
        const prompt = card.querySelector('.mfd-quick-prompt');
        const result = card.querySelector('.mfd-quick-result');
        const footer = card.querySelector('.mfd-footer');
        if (footer) card.append(footer);
        result.hidden = true; result.classList.remove('is-revealed'); result.innerHTML = '';
        prompt.hidden = false; prompt.classList.add('is-restored');
        if (footer) prompt.querySelector('.mfd-quick-actions')?.append(footer);
        prompt.querySelector('[data-quick-action="yes"], [data-quick-action="choose"]')?.focus({preventScroll:true});
      } else if (action === 'yes' || action === 'no' || action === 'choose') {
        const answer = action === 'choose' ? button.dataset.choice : action;
        quickAnswers[item.id] = answer; storeQuick();
        updateQuickProgress();
        if (answer !== 'no') writePractice(item, answer);
        transitionQuick(card, item, answer);
      }
    });
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem('mojo-feed-decisions-v1') || '{}'); } catch { saved = {}; }
    const receiptTitles = {
      'strategy-goal':'Campaign priority saved',
      'strategy-guardrail':'Guardrail saved',
      ctv:'Saved to Best Practices',
    };
    const paintDecision = (card, reveal = false) => {
      const id = card.dataset.decisionId;
      if (!receiptTitles[id]) return;
      const answer = saved[id];
      const footer = card.querySelector('.mfd-footer');
      if (footer) card.append(footer);
      card.querySelectorAll(':scope > :not(.mfd-footer):not(.mfd-decision-result)').forEach(part => { part.hidden = !!answer; });
      card.querySelector('.mfd-decision-result')?.remove();
      if (!answer) { card.querySelector('.mfd-main-actions')?.append(footer); return; }
      const result = document.createElement('div');
      result.className = 'mfd-quick-receipt mfd-decision-result' + (reveal ? ' is-revealed' : '');
      result.setAttribute('role', 'status');
      result.innerHTML = `<span class="mfd-quick-check" aria-hidden="true">✓</span><div><strong>${receiptTitles[id]}</strong><p>${id === 'ctv' ? 'CTV: ' : 'Your choice: '}${escape(answer)}</p><div class="mfd-quick-links">${id === 'ctv' ? '<button type="button" data-mfd-action="review-practice">Review in chat</button>' : ''}<button type="button" data-mfd-action="edit-decision">Change</button><button type="button" data-mfd-action="undo-decision">Undo</button></div></div>`;
      card.querySelector('.mfd-footer').before(result);
      result.querySelector('.mfd-quick-links').append(footer);
      if (reveal) result.querySelector('[data-mfd-action="edit-decision"]')?.focus({preventScroll:true});
    };
    function updateQuickProgress() {
      const answered = Number(!!saved['strategy-goal']) + Number(!!saved['strategy-guardrail']) + quickQuestions.filter(item => quickAnswers[item.id] !== undefined).length;
      const progress = mount.querySelector('.mfd-quick-progress');
      progress.setAttribute('aria-valuenow', String(answered));
      progress.querySelector('i').style.width = `${answered / 7 * 100}%`;
      mount.querySelector('.mfd-quick-count').textContent = `${answered} of 7 answered`;
    }
    updateQuickProgress();
    mount.querySelectorAll('.mfd-card').forEach(card => {
      if (saved['snooze-'+card.dataset.decisionId]) card.hidden = true;
      if (saved[card.dataset.decisionId]) {
        card.querySelectorAll('input[type="radio"]').forEach(input => { input.checked = input.value === saved[card.dataset.decisionId]; });
        paintDecision(card);
      }
    });
    shell.addEventListener('change', event => {
      const card = event.target.closest('.mfd-card');
      if (!card) return;
      if (card.dataset.decisionId === 'ctv') card.querySelector('[data-mfd-action="measure"]').disabled = false;
      if (card.classList.contains('mfd-question')) card.querySelector('[data-mfd-action="save-question"]').disabled = false;
    });
    shell.addEventListener('click', event => {
      const why=event.target.closest('[data-mojo-feed-why], [data-mojo-feed-primary]');
      if(why){
        const card=why.closest('.mfd-card'),id=card?.dataset.decisionId;
        const sources={reach:['Demandbase engagement and opportunity summary','CampaignLifecycle.html?view=optimize#issues','Open data checks','Check whether the same account appears in both sets.'],ctv:['Demandbase Ads CTV campaigns','Strategy.html','Open Plan','Review delivery and account engagement before setting the next role.'],influence:['Campaign activity and opportunity summary','Portfolio.html#accounts','Open Report','Match account IDs and dates before claiming influence.'],'strategy-goal':['Q4 campaign results','Strategy.html','Open Plan','Use the result your next campaign should improve.'],'strategy-guardrail':['Your team’s current campaign practices','BestPractices.html','Open Best Practices','Confirm the rule before Mojo applies it.']};
        const quick=quickQuestions.find(item=>`quick-${item.id}`===id);
        const source=sources[id]||(quick?['Demandbase signals and team practices','BestPractices.html','Open Best Practices',quick.more]:['Connected workspace records','Portfolio.html','Open dashboard','Review the underlying records.']);
        const triggers={reach:'1,146 engaged accounts and 214 reported opportunities are not linked by account ID.',ctv:'Five CTV campaigns spent $21,640, but clicks alone do not show their account impact.',influence:'214 opportunities are reported without campaign exposure matches.','strategy-goal':'Q4 results leave a gap between target-account reach and pipeline.','strategy-guardrail':'Mojo inferred a guardrail from the team’s current campaign practices.'};
        window.MojoSeeWhy?.open({title:card.querySelector('h2')?.textContent.trim()||quick?.title,reason:card.querySelector(':scope > p, .mfd-quick-prompt > p')?.textContent.trim()||quick?.more,source:source[0],triggerType:quick||id==='strategy-guardrail'?'Inferred Best Practice':'Mojo Brain',triggerReason:triggers[id]||quick?.more||source[3],nextStep:source[3],href:source[1],linkLabel:source[2]},why.classList.contains('mojo-see-why')?why:undefined);
        return;
      }
      const button = event.target.closest('[data-mfd-action]');
      if (!button) return;
      const card = button.closest('.mfd-card');
      const title = card.querySelector('h2').textContent.trim();
      const selected = card.querySelector('input:checked')?.value;
      const action = button.dataset.mfdAction;
      if (action === 'review-practice') {
        window.MojoSeeWhy?.open({title:'Saved CTV role',reason:`You chose: ${saved[card.dataset.decisionId]}.`,source:'Demandbase Ads CTV campaign delivery',triggerType:'Best practice',triggerReason:'Five CTV campaigns spent $21,640; their next role in the buyer journey needs an explicit decision.',nextStep:'Review this choice here. Use Change on the card to select another CTV role.'});
      } else if (action === 'edit-decision') {
        delete saved[card.dataset.decisionId];
        paintDecision(card);
        const saveButton = card.querySelector('[data-mfd-action="save-question"], [data-mfd-action="measure"]');
        if (saveButton) saveButton.disabled = false;
        card.querySelector('input:checked, [data-mfd-action="standard"]')?.focus({preventScroll:true});
      } else if (action === 'undo-decision') {
        delete saved[card.dataset.decisionId];
        localStorage.setItem('mojo-feed-decisions-v1', JSON.stringify(saved));
        card.querySelectorAll('input[type="radio"]').forEach(input => { input.checked = false; });
        paintDecision(card);
        const saveButton = card.querySelector('[data-mfd-action="save-question"], [data-mfd-action="measure"]');
        if (saveButton) saveButton.disabled = true;
        updateQuickProgress();
      } else if (action === 'question-chat') {
        chat(card.dataset.decisionId === 'strategy-goal' ? 'Help me define what Q1 campaigns should optimize for.' : 'I want to add a campaign or audience guardrail in my own words.');
      } else if (action === 'save-question') {
        if (!selected) return;
        saved[card.dataset.decisionId] = selected;
        localStorage.setItem('mojo-feed-decisions-v1', JSON.stringify(saved));
        updateQuickProgress();
        button.disabled = true;
        paintDecision(card, true);
      } else if (action === 'ask' || action === 'discuss' || action === 'assign') {
        const prefix = action === 'assign' ? 'Help me assign an owner for' : action === 'ask' ? `Help me plan the first step (${selected}) for` : 'Let’s discuss';
        chat(`${prefix} ${title}`);
      } else if (action === 'measure' || action === 'standard') {
        const id = card.dataset.decisionId;
        saved[id] = action === 'measure' ? selected : 'Account ID, first impression date, opportunity created date, and account spend';
        localStorage.setItem('mojo-feed-decisions-v1', JSON.stringify(saved));
        paintDecision(card, true);
      } else if (action === 'snooze') {
        const id = card.dataset.decisionId;
        saved['snooze-'+id] = true;
        localStorage.setItem('mojo-feed-decisions-v1', JSON.stringify(saved));
        card.hidden = true;
        const notice = document.createElement('div');
        notice.className = 'mfc-snoozed';
        notice.innerHTML = `Snoozed: ${escape(title)} <button type="button">Undo</button>`;
        card.after(notice);
        notice.querySelector('button').addEventListener('click', () => { delete saved['snooze-'+id]; localStorage.setItem('mojo-feed-decisions-v1', JSON.stringify(saved)); card.hidden = false; notice.remove(); });
      }
    });
  }
  function bindReceipts(shell) {
    const panel = shell.querySelector('#mf-receipts');
    const list = panel?.querySelector('.brief-done-list');
    if (!list || list.dataset.mfrReady) return;
    list.dataset.mfrReady = 'true';
    panel.querySelector('.mf-section-line').hidden = true;
    list.insertAdjacentHTML('beforebegin', '<div class="mfr-head"><h1>Recently Completed</h1><p>These are the changes Mojo suggested and you approved.</p></div>');
    list.querySelectorAll('li[data-receipt-id]').forEach((item, index) => {
      const info = receiptInfo[item.dataset.receiptId];
      if (!info) return;
      item.classList.add('mfr-card');
      if (index === 0) item.classList.add('mfr-featured');
      const content = item.querySelector(':scope > div');
      content.classList.add('mfr-body');
      const kind = content.querySelector('small');
      kind.textContent = info.category;
      const title = content.querySelector('strong');
      if (title && !title.querySelector('a')) title.textContent = title.textContent.trim().replace(/[.\s]+$/, '') + '.';
      content.insertAdjacentHTML('beforeend', `<p>${escape(info.summary)}</p>`);
      const detailButton = item.querySelector('.mf-receipt-expand');
      const panelDetail = item.querySelector('.mf-receipt-detail');
      const actions = document.createElement('div');
      actions.className = 'mfr-actions';
      actions.innerHTML = `<a href="${info.link}">${info.label} →</a><button type="button" data-mfr-action="discuss">Discuss</button>`;
      item.append(actions);
      decorateUtilities(actions);
      if (detailButton) actions.insertBefore(detailButton, actions.querySelector('.mfc-utility-group'));
      if (panelDetail) item.append(panelDetail);
      if (index === 0 && detailButton && panelDetail?.hidden) detailButton.click();
    });
    list.addEventListener('click', event => {
      const why=event.target.closest('[data-mojo-feed-why]');
      if(why){const item=why.closest('.mfr-card');const info=receiptInfo[item?.dataset.receiptId];if(info)window.MojoSeeWhy?.open({title:item.querySelector('strong')?.textContent.trim(),reason:info.summary,source:'Mojo action history',triggerType:'Best practice',triggerReason:'You approved this change and Mojo recorded it in the action history.',nextStep:'Review the saved change before using it again.',href:info.link,linkLabel:info.label,owner:'Approved by you'},why);return;}
      const button = event.target.closest('[data-mfr-action="discuss"]');
      if (!button) return;
      const item = button.closest('.mfr-card');
      chat(`Let’s discuss this Mojo receipt: ${item.querySelector('strong')?.textContent.trim()}`);
    });
  }
  function syncFeedback(shell) {
    const source = shell.querySelector('#mf-insights .mfc-card .mf-feedback');
    if (!source) return false;
    const prepare = toolbar => {
      toolbar.querySelector(':scope > span')?.remove();
      toolbar.querySelector('.mf-feedback-ignore')?.remove();
      toolbar.querySelector('output')?.remove();
      toolbar.setAttribute('aria-label', 'Was this useful?');
      return toolbar;
    };
    shell.querySelectorAll('#mf-insights .mfc-card').forEach(card => {
      const toolbar = card.querySelector('.mf-feedback');
      const actions = card.querySelector('.mfc-actions');
      if (toolbar && actions && toolbar.parentElement !== actions) actions.append(prepare(toolbar));
    });
    shell.querySelectorAll('#mf-decisions .mfd-card').forEach(card => {
      if (card.querySelector('.mf-feedback')) return;
      const toolbar = prepare(source.cloneNode(true));
      let state = {};
      try { state = JSON.parse(localStorage.getItem('mojo-feed-feedback-v1:'+card.dataset.mfFeedbackKey) || '{}'); } catch { state = {}; }
      toolbar.querySelectorAll('[data-mf-feedback]').forEach(button => button.setAttribute('aria-pressed', String(state.vote === button.dataset.mfFeedback)));
      card.querySelector('.mfd-footer').append(toolbar);
    });
    shell.querySelectorAll('#mf-receipts .mfr-card .mf-feedback').forEach(toolbar => toolbar.remove());
    return true;
  }
  function init() {
    const shell = document.querySelector('.mf-shell.mfc-feed');
    if (!shell || shell.dataset.mfdReady !== undefined) return false;
    if (!shell.querySelector('.mf-reported-decisions') || !shell.querySelector('#mf-receipts .brief-done-list')) return false;
    shell.dataset.mfdReady = 'true';
    bindDecisions(shell);
    bindReceipts(shell);
    const decisions = shell.querySelector('#mf-decisions');
    const insightsStream = shell.querySelector('#mf-insights .mf-stream');
    const section=insightsStream?.querySelector(':scope > .mfc-section');
    if (decisions && section) {
      section.classList.add('mfd-attention-section','mfd-unified-list');
      section.querySelector('.mfc-section-head')?.remove();
      const mount=decisions.querySelector('.mf-reported-decisions');
      const decisionCards=['reach','ctv','influence'].map(id=>mount?.querySelector('[data-decision-id="'+id+'"]')).filter(Boolean);
      decisionCards.forEach(card=>{
        card.classList.add('mfd-unified-card');
        const tag=card.querySelector('.mfd-area-tag');
        const area=tag?.textContent.trim()||'Optimize';
        card.dataset.feedArea=area;
        if(tag)tag.textContent=area;
      });
      const current=[...section.querySelectorAll(':scope > article.mfc-card')];
      const byId=id=>current.find(card=>card.dataset.findingId===id);
      const order=['q4-pacing','evaluation-roles','engaged-roles','ended-live','flight-allocation','unassigned-utms'];
      const ranked=[byId(order[0]),byId(order[1]),decisionCards[0],byId(order[2]),byId(order[3]),byId(order[4]),decisionCards[1],byId(order[5]),decisionCards[2]].filter(Boolean);
      ranked.forEach((card,index)=>{card.dataset.urgencyRank=String(index);section.append(card);});
      decisions.hidden=true;
      const fixCount=ranked.filter(card=>card.dataset.feedArea==='Fix').length;
      const optimizeCount=ranked.filter(card=>card.dataset.feedArea!=='Fix').length;
      const greetingWord=(()=>{const h=new Date().getHours();return h<12?'Good morning':h<18?'Good afternoon':'Good evening'})();
      const greeting=document.createElement('div');
      greeting.className='mfd-feed-greeting';
      greeting.innerHTML=`<p class="mfd-greeting-name">${greetingWord}, Pam!</p><p class="mfd-greeting-summary">${fixCount} fix${fixCount===1?'':'es'} need attention. ${optimizeCount} optimization${optimizeCount===1?'':'s'} ${optimizeCount===1?'is':'are'} ready to review. <span class="mfd-greeting-scan">Last scan 12 minutes ago</span></p>`;
      section.before(greeting);
      const controls=document.createElement('div');
      controls.className='mfd-unified-controls';
      controls.innerHTML='<div class="mfd-unified-toolbar"><div class="mfd-area-filters" role="group" aria-label="Filter feed"><button type="button" data-feed-filter="All" aria-pressed="true">All</button><button type="button" data-feed-filter="Optimize" aria-pressed="false">Optimize</button><button type="button" data-feed-filter="Fix" aria-pressed="false">Fix</button></div><label class="mfd-sort-label"><span>Sort feed</span><select aria-label="Sort feed"><option value="signal">Biggest signal</option><option value="urgency" selected>Most urgent</option><option value="ease">Easiest to fix</option></select></label></div>';
      section.before(controls);
      const sortExplanations={
        urgency:'Ranks lost value, affected traffic, and worsening trends.',
        ease:'Ranks one-click fixes, access requests, then developer work.'
      };
      const sortTip=document.createElement('div');
      sortTip.className='mfd-sort-tooltip';
      sortTip.id='mfd-sort-tooltip';
      sortTip.setAttribute('role','tooltip');
      sortTip.hidden=true;
      document.body.append(sortTip);
      let sortTipTimer,sortTipOption;
      const hideSortTip=()=>{clearTimeout(sortTipTimer);sortTipOption=null;sortTip.hidden=true;};
      const showSortTip=event=>{
        const option=event.target.closest?.('.mfd-sort-label .mojo-select-option');
        if(!option){hideSortTip();return;}
        const explanation=sortExplanations[controls.querySelector('select')?.options[Number(option.dataset.index)]?.value];
        if(!explanation){hideSortTip();return;}
        if(sortTipOption===option)return;
        hideSortTip();
        sortTipOption=option;
        sortTipTimer=setTimeout(()=>{
          if(!option.isConnected||sortTipOption!==option)return;
          option.setAttribute('aria-describedby',sortTip.id);
          sortTip.textContent=explanation;
          sortTip.hidden=false;
          const box=option.getBoundingClientRect(),tip=sortTip.getBoundingClientRect();
          const toLeft=box.left>tip.width+20;
          sortTip.style.left=`${Math.max(8,Math.min(window.innerWidth-tip.width-8,toLeft?box.left-tip.width-8:box.right+8))}px`;
          sortTip.style.top=`${Math.max(8,Math.min(window.innerHeight-tip.height-8,box.top+(box.height-tip.height)/2))}px`;
        },1800);
      };
      controls.addEventListener('pointerover',showSortTip);
      controls.addEventListener('pointerout',event=>{if(!event.relatedTarget?.closest?.('.mfd-sort-label .mojo-select-option'))hideSortTip();});
      controls.addEventListener('focusin',showSortTip);
      controls.addEventListener('focusout',hideSortTip);
      controls.addEventListener('click',hideSortTip);
      const placeSortBesideCampaigns=()=>{
        const row=shell.querySelector('.mf-feed-toolbar .mf-topline');
        if(row?.querySelector('.mojo-scope-control') && controls.parentElement!==row) row.append(controls);
      };
      placeSortBesideCampaigns();
      document.addEventListener('DOMContentLoaded',placeSortBesideCampaigns,{once:true});
      const easeOrder={'unassigned-utms':0,'ended-live':1,'engaged-roles':2,'evaluation-roles':3,'q4-pacing':4,'flight-allocation':5,reach:6,ctv:7,influence:8};
      const signalOrder={'engaged-roles':0,'evaluation-roles':1,'q4-pacing':2,'flight-allocation':3,reach:4,influence:5,'ended-live':6,ctv:7,'unassigned-utms':8};
      let feedFilter='All';
      const apply=()=>{
        const mode=controls.querySelector('select').value;
        const cards=[...section.querySelectorAll(':scope > article')];
        cards.sort((a,b)=>{
          const key=card=>card.dataset.findingId||card.dataset.decisionId||card.dataset.boardSourceStory;
          if(mode==='signal')return (signalOrder[key(a)]??Number(a.dataset.urgencyRank??99)+20)-(signalOrder[key(b)]??Number(b.dataset.urgencyRank??99)+20);
          if(mode==='ease')return (easeOrder[key(a)]??10)-(easeOrder[key(b)]??10);
          return Number(a.dataset.urgencyRank??99)-Number(b.dataset.urgencyRank??99);
        });
        cards.forEach(card=>{section.append(card);card.classList.toggle('mfd-filtered-out',feedFilter!=='All'&&card.dataset.feedArea!==feedFilter);});
      };
      controls.querySelector('select').addEventListener('change',apply);
      controls.querySelector('.mfd-area-filters').addEventListener('click',event=>{
        const button=event.target.closest('[data-feed-filter]');
        if(!button)return;
        feedFilter=button.dataset.feedFilter;
        controls.querySelectorAll('[data-feed-filter]').forEach(chip=>chip.setAttribute('aria-pressed',String(chip===button)));
        apply();
      });
      document.addEventListener('mojo:board-feed-updated',()=>{
        section.querySelectorAll(':scope > article.board-source-story').forEach(card=>{card.dataset.urgencyRank=card.dataset.urgencyRank||'2';});
        apply();
      });
      apply();
    }
    if (!syncFeedback(shell)) {
      const observer = new MutationObserver(() => { if (syncFeedback(shell)) observer.disconnect(); });
      observer.observe(shell, {childList:true, subtree:true});
    }
    return true;
  }
  if (!init()) {
    const observer = new MutationObserver(() => { if (init()) observer.disconnect(); });
    observer.observe(document.documentElement, {childList:true, subtree:true});
  }
})();
