/* Treat the budget comparison as the open state of Brief's first question. */
document.addEventListener('DOMContentLoaded', () => {
  const needs = document.querySelector('.brief-view-needs');
  const list = needs?.querySelector('.brief-finding-list');
  const card = needs?.querySelector('#mojo-reallocation');
  if (!needs || !list || !card || needs.querySelector('.brief-priority-question')) return;

  const row = document.createElement('details');
  row.className = 'drow catitem cat-needs brief-priority-question';
  row.id = 'brief-budget-risk';
  row.innerHTML = '<summary><span class="tag cat">Budget · top priority</span><span class="headline">Where should the next $40k go after the Oct 31 flight end?</span><span class="chev" aria-hidden="true">›</span></summary><div class="drowbody"></div>';

  card.querySelector('.mp-hero-title')?.remove();
  row.querySelector('.drowbody').append(card);
  list.prepend(row);

  // Keep the questions in one continuous list so each row has the same
  // spacing and divider. The handoff queue follows the full set of questions.
  const extraLists = [...needs.querySelectorAll('.brief-finding-list')].filter(other => other !== list);
  for (const extra of extraLists) {
    list.append(...extra.children);
    extra.remove();
  }
  const handoffs = needs.querySelector('.aq-followup');
  if (handoffs) {
    const handoffRow = document.createElement('details');
    handoffRow.className = 'drow catitem cat-needs brief-handoff-question';
    handoffRow.innerHTML = '<summary><span class="tag cat">Handoffs</span><span class="headline"></span><span class="chev" aria-hidden="true">›</span></summary><div class="drowbody"></div>';
    handoffRow.querySelector('.drowbody').append(handoffs);
    list.append(handoffRow);
    const syncHandoffs = () => {
      handoffRow.hidden = handoffs.hidden;
      handoffRow.querySelector('.headline').textContent = handoffs.querySelector('strong')?.textContent || 'Sales handoffs need a reply';
    };
    new MutationObserver(syncHandoffs).observe(handoffs, {attributes: true, childList: true, subtree: true});
    syncHandoffs();
  }

  // These two earlier blocks repeat the same decision and tracking context.
  needs.querySelector('.mp-original-lead')?.remove();
  needs.querySelector('.mp-trust-brief')?.remove();
});
