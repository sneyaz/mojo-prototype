/* One decision home; source reports remain available without a second scope bar. */
document.addEventListener('DOMContentLoaded', () => {
  document.title = document.querySelector('.ia-portfolio') ? 'Mojo · Campaigns' : document.title;

  const rules = (() => { try { return JSON.parse(localStorage.getItem('mojo-rules-v1') || '{}'); } catch { return {}; } })();
  const approval = Number.isFinite(Number(rules.threshold)) && Number(rules.threshold) >= 0 ? Number(rules.threshold) : 10000;
  const autonomy = Number.isFinite(Number(rules.limit)) && Number(rules.limit) >= 0 ? Number(rules.limit) : 5000;
  const dollars = amount => new Intl.NumberFormat('en-US', {style:'currency', currency:'USD', maximumFractionDigits:0}).format(amount);
  const approvalRule = `In a connected workspace, eligible routine changes up to ${dollars(autonomy)} may run within your Settings rules. A ${dollars(approval)} or larger move needs the configured approval chain. This $40k decision requires a person; this prototype makes no live change.`;

  const workDecision = document.querySelector('#mojo-decision');
  if (workDecision && !workDecision.querySelector('.mojo-approval-rule')) {
    const note = document.createElement('p'); note.className = 'mojo-approval-rule'; note.textContent = approvalRule;
    workDecision.querySelector('.mp-actions')?.before(note);
  }
  if (workDecision && /\/Work(?:\.html)?$/.test(location.pathname)) {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem('mojo-command-budget-v1') || 'null'); } catch {}
    const choices = {extend:'Extend ending flights', shift:'Shift $40k to D&M_2026', release:'Release to Q1'};
    const choice = choices[saved?.choice] ? saved.choice : null;
    const intro = workDecision.querySelector('.mp-lede');
    if (intro) intro.textContent = choice ? `Staged in Chat: ${choices[choice]}. Review the diff and approval path below.` : 'Choose an option with Mojo in Chat. Work handles approval and the staged change.';
    workDecision.querySelector('.mp-options')?.classList.add('mojo-work-choice-hidden');
    workDecision.querySelector('.mp-evidence')?.classList.add('mojo-work-choice-hidden');
    workDecision.querySelector('.mp-inaction')?.classList.add('mojo-work-choice-hidden');
    const actions = workDecision.querySelector('.mp-actions');
    const link = document.createElement('a'); link.href = 'HomeSystem.html#finding-flights'; link.className = 'mp-btn'; link.textContent = 'Open the $40k decision →';
    actions?.prepend(link);
    const review = workDecision.querySelector('.mp-review');
    if (review) {
      review.hidden = !choice;
      if (choice) {
        const input = workDecision.querySelector(`input[name="mp-budget-choice"][value="${choice}"]`);
        if (input) { input.checked = true; input.dispatchEvent(new Event('change', {bubbles:true})); }
        review.textContent = 'Review staged change →';
      }
    }
  }

  const board = document.querySelector('#board-view');
  if (board && !board.querySelector('.mojo-attribution-method')) {
    const method = document.createElement('details'); method.className = 'mojo-attribution-method';
    method.innerHTML = '<summary>How these pipeline numbers were defined</summary><p>The $128k and $220k cases use synthetic pipeline-per-dollar assumptions over 90 days. The $130.3M figure is pipeline among 431 reached accounts in a separate Demandbase cohort. It is not ad-attributed or incremental. To estimate lift, compare reached accounts with similar unreached accounts after the sales cycle has had time to mature.</p>';
    board.append(method);
  }

  const annotateChatDecision = () => {
    const result = document.querySelector('#mc-result');
    if (!result?.querySelector('#mc-review-budget') || result.querySelector('.mojo-approval-rule')) return;
    const note = document.createElement('p'); note.className = 'mojo-approval-rule'; note.textContent = approvalRule;
    result.querySelector('#mc-review-budget').before(note);
  };
  annotateChatDecision();
  const chatResult = document.querySelector('#mc-result');
  if (chatResult) new MutationObserver(() => {
    annotateChatDecision();
    const status = chatResult.querySelector('#mc-budget-status');
    if (status && !status.hidden && !status.querySelector('a')) {
      const link = document.createElement('a'); link.href = 'Work.html#decisions';
      link.textContent = 'Continue in Work for approval →'; status.append(' ', link);
    }
  }).observe(chatResult, {childList:true,subtree:true});

  if (/\/Campaign(?:\.html)?$/.test(location.pathname)) {
    const explorerMain = document.querySelector('main.canvaspane');
    const explorerHeading = explorerMain?.querySelector('h1');
    if (explorerHeading) explorerHeading.textContent = 'Campaign source report';
    const explorerIntro = explorerHeading?.nextElementSibling;
    if (explorerIntro?.tagName === 'P') explorerIntro.textContent = 'Use Campaigns for the current read. The source tables below hold the underlying evidence.';
    const duplicateDirectoryHeading = [...(explorerMain?.querySelectorAll('h2') || [])].find(node => node.textContent.includes('Every ad campaign'));
    duplicateDirectoryHeading?.closest('section')?.classList.add('mojo-source-directory-duplicate');
    explorerMain?.querySelector('.mojo-scope-control')?.classList.add('mojo-source-scope-hidden');
    const triage = document.querySelector('.campaign-triage');
    const panels = [...document.querySelectorAll('.pattern-row-section')];
    if (triage && panels.length) {
      const source = document.createElement('details');
      source.className = 'mojo-pattern-source';
      source.innerHTML = '<summary>Source evidence for findings</summary><p>Decisions live in Today. This report keeps the underlying campaign evidence.</p><p><a href="HomeSystem.html#finding-flights">Open the $40k decision →</a> <a href="HomeSystem.html#finding-duplicate-events">Check data trust →</a></p>';
      triage.before(source);
      panels.forEach(panel => { panel.hidden = false; source.append(panel); });
      triage.remove();
    }
  }

  const chat = document.querySelector('.chatpane');
  const chatHead = chat?.querySelector('.chathead');
  if (chatHead && !chatHead.querySelector('.mojo-chat-purpose')) {
    const purpose = document.createElement('small');
    purpose.className = 'mojo-chat-purpose';
    purpose.textContent = 'Ask, review and act in Canvas';
    chatHead.append(purpose);
  }
  chat?.querySelectorAll('.modebar .modebtn').forEach((button, index) => {
    button.textContent = index === 0 ? 'Tone: Balanced ▾' : 'Autonomy: Guarded ▾';
    button.title = index === 0 ? 'How Mojo explains its answer' : 'How much Mojo may prepare without approval';
  });

  const portfolio = document.querySelector('.ia-portfolio');
  if (!portfolio) return;
  const report = portfolio.querySelector('.ia-source-detail');
  if (report) {
    const sourceTarget = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    report.open = !!(sourceTarget && report.contains(sourceTarget));
    const legacyHeading = report.querySelector('h1');
    if (legacyHeading?.nextElementSibling?.tagName === 'P') legacyHeading.nextElementSibling.remove();
    legacyHeading?.remove();
    report.querySelector('.mojo-scope-row')?.classList.add('mojo-source-scope-hidden');
    report.querySelector('.clientsel')?.classList.add('mojo-source-scope-hidden');
    report.querySelector('.performance-portfolio-stats')?.classList.add('mojo-source-counts-hidden');
    report.querySelector('.performance-pipeline-gate')?.classList.add('mojo-source-connect-duplicate');
    report.querySelector('.performance-portfolio-exposure')?.classList.add('mojo-source-counts-hidden');
  }
});
