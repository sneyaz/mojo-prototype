/* A consistent explanation for every See why action, expanded inline on its card. */
(() => {
  const esc = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
  const kinds = new Set(['Best practice', 'Mojo Brain', 'Inferred Best Practice']);
  function buildAnswer({title,reason,source,dataSource,triggerType,triggerReason,nextStep,check,href,linkLabel,owner} = {}, {showTitle = false} = {}) {
    const heading = title || 'What Mojo noticed';
    const summary = reason || 'Mojo found a signal worth reviewing.';
    const provenance = dataSource || source || 'Connected campaign and account records';
    const kind = kinds.has(triggerType) ? triggerType : 'Mojo Brain';
    const signal = triggerReason || heading;
    const action = nextStep || check || 'Review the source records before making a change.';
    const answer = document.createElement('section');
    answer.className = 'mojo-why-answer';
    answer.setAttribute('aria-label', `Why Mojo flagged ${heading}`);
    answer.innerHTML = `${showTitle ? `<strong class="mojo-why-title">${esc(heading)}</strong>` : ''}
      <p class="mojo-why-summary">${esc(summary)}</p>
      <div class="mojo-why-trigger"><span class="mojo-why-label">Triggered by</span><p>${esc(kind)}: ${esc(signal)}</p></div>
      <div class="mojo-why-action"><span class="mojo-why-label">Recommended action</span><p>${esc(action)}${href ? ` <a href="${esc(href)}">${esc(linkLabel || 'Open the relevant view')} <span aria-hidden="true">→</span></a>` : ''}</p></div>
      <div class="mojo-why-source"><span class="mojo-why-label">Data source</span><span>${esc(provenance)}</span></div>
      ${owner ? `<small class="mojo-why-owner">${esc(owner)}</small>` : ''}`;
    return answer;
  }
  function open(details, trigger) {
    if (trigger instanceof Element && trigger.parentElement) {
      const row = trigger.parentElement;
      const wasOpen = trigger.dataset.mojoWhyOpen === 'true';
      if (row.nextElementSibling?.classList.contains('mojo-why-answer')) row.nextElementSibling.remove();
      if (!trigger.dataset.mojoWhyLabel) trigger.dataset.mojoWhyLabel = trigger.textContent.trim();
      if (wasOpen) {
        trigger.textContent = trigger.dataset.mojoWhyLabel || 'See why';
        trigger.setAttribute('aria-expanded', 'false');
        delete trigger.dataset.mojoWhyOpen;
        return null;
      }
      const answer = buildAnswer(details, {showTitle: false});
      row.insertAdjacentElement('afterend', answer);
      trigger.textContent = 'Hide why';
      trigger.setAttribute('aria-expanded', 'true');
      trigger.dataset.mojoWhyOpen = 'true';
      answer.scrollIntoView({block:'nearest', behavior:'smooth'});
      return answer;
    }
    window.MojoOpenChat?.('', false);
    const body = document.querySelector('.app .chatpane .chatbody, .chatpane .chatbody');
    if (!body) return null;
    body.querySelector('.mojo-why-answer')?.remove();
    const answer = buildAnswer(details, {showTitle: true});
    body.append(answer);
    answer.scrollIntoView({block:'nearest', behavior:'smooth'});
    return answer;
  }
  window.MojoSeeWhy = {open};
})();
