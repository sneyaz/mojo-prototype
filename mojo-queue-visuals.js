/* Small visual evidence cues for the daily queue. Values come from the supplied sample. */
(() => {
  const page = (location.pathname.split('/').pop() || 'HomeSystem').replace(/\.html$/, '');
  if (page !== 'HomeSystem' && page !== 'index') return;

  const visuals = {
    'flight-allocation-2026-10-31': '<span class="mq-bars-horizontal mq-budget"><i style="--value:45%"></i><i style="--value:43%"></i><i style="--value:47%"></i></span><small>43–47% spent</small>',
    'lead-definition': '<span class="mq-goal-ring"><b>$9</b></span><small>goal to define</small>',
    'duplicate-ga4-events': '<span class="mq-event-pair"><i></i><i></i></span><small>2 events to check</small>',
    'waystar-delivery': `<span class="mq-flight-grid">${Array.from({length:20}, (_, index) => `<i${index < 13 ? ' class="is-under"' : ''}></i>`).join('')}</span><small>13 of 20 flights</small>`,
    'benchmark-visit-gap': '<span class="mq-compare"><i style="height:94%"></i><i style="height:18%"></i></span><small>reach · visit</small>',
    'account-list-overlap': '<span class="mq-overlap"><i></i><i></i></span><small>7 list pairs</small>'
  };
  function install() {
    const queue = document.querySelector('#today-queue');
    if (!queue) return;
    queue.querySelectorAll('[data-finding-id] > summary').forEach(summary => {
      const id = summary.parentElement.dataset.findingId;
      if (!visuals[id] || summary.querySelector('.mq-viz')) return;
      const cue = document.createElement('span');
      cue.className = 'mq-viz';
      cue.setAttribute('aria-hidden', 'true');
      cue.innerHTML = visuals[id];
      summary.querySelector('.chev')?.before(cue);
    });
    const handoff = queue.querySelector('.today-handoff-row > summary');
    if (handoff && !handoff.querySelector('.mq-viz')) {
      const cue = document.createElement('span');
      cue.className = 'mq-viz mq-viz-handoff';
      cue.setAttribute('aria-hidden', 'true');
      cue.innerHTML = '<span class="mq-big-number">1,140</span><small>accounts to reach</small>';
      handoff.querySelector('.today-chevron')?.before(cue);
    }
  }
  document.addEventListener('DOMContentLoaded', () => requestAnimationFrame(() => requestAnimationFrame(install)));
})();
