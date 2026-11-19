/* Keep the established Quarterly Review in Report's view switcher. */
(() => {
  const evidence = {
    pipeline: ['Pipeline from target accounts', 'The account match associates Q4 campaigns with $2.1M in pipeline.', 'Demandbase accounts and Salesforce opportunities', 'Confirm the account match and compare against a holdout.'],
    reach: ['Target accounts reached', 'Ads reached 5,312 of 6,400 target accounts.', 'Demandbase Ads delivery and target account lists', 'Check the accounts that did not receive ads.'],
    spend: ['Spend versus budget', '$304K of the $350K Q4 budget was spent.', 'Connected ad platform spend', 'Confirm final platform totals.'],
    cost: ['Cost per opportunity', '$304K in spend divided by 57 opportunities is about $5.3K per opportunity.', 'Ad platform spend and Salesforce opportunities', 'Confirm which opportunities can be linked to the campaigns.'],
    enterprise: ['Demandbase Enterprise', '$30K spend, 10 opportunities, and $380K in associated pipeline.', 'Demandbase Ads and Salesforce', 'Check whether the same accounts would have progressed without the ads.'],
    emea: ['LinkedIn EMEA', '$55K spend, 14 opportunities, and $560K in associated pipeline.', 'LinkedIn Ads and Salesforce', 'Verify opportunity dates and account matches.'],
    manufacturing: ['LinkedIn Manufacturing', '$49K spend, 12 opportunities, and $490K in associated pipeline.', 'LinkedIn Ads and Salesforce', 'Verify opportunity dates and account matches.'],
    search: ['Google Ads Search', '$70K spend and 18 associated opportunities.', 'Google Ads and Salesforce', 'Review account matches before changing spend.'],
    pacing: ['CTV pacing', 'CTV used 33% of spend and accounted for 5% of associated pipeline.', 'Demandbase Ads delivery and Salesforce', 'Confirm final spend and the flight dates.'],
    journey: ['Buying group coverage', '61% of stalled Evaluation accounts had fewer than three buyer roles engaged.', 'Demandbase buying groups and journey stages', 'Find the missing roles before expanding spend.'],
    answers: ['Comparison answer visibility', 'Acme appeared in one of four comparison answers.', 'AI answer checks', 'Update comparison proof, then check the answers again.']
  };
  const triggers = {
    pipeline:'A provisional account join associates campaign exposure with opportunities totaling $2.1M.',
    reach:'5,312 of 6,400 target accounts received ads in Q4.',
    spend:'Connected platform totals show $46K less spend than the Q4 budget.',
    cost:'The provisional opportunity count makes the spend per opportunity about $5.3K.',
    enterprise:'The Enterprise cohort has 10 associated opportunities in the provisional match.',
    emea:'The EMEA cohort has 14 associated opportunities in the provisional match.',
    manufacturing:'The Manufacturing cohort has 12 associated opportunities in the provisional match.',
    search:'Search spend is associated with 18 opportunities before final account validation.',
    pacing:'CTV took one-third of Q4 spend but only 5% of provisionally associated pipeline.',
    journey:'Most stalled Evaluation accounts have fewer than three buyer roles engaged.',
    answers:'Three of the four checked comparison answers did not mention Acme.'
  };

  function addQuarterComparison(report) {
    const scorecard = report.querySelector('#lookbook-scorecard');
    const cards = scorecard?.querySelector('.mso-lb-scorecard');
    if (!cards) return;
    const measures = [
      {name:'Pipeline from target accounts', prior:'~$1.8M', current:'$2.1M', change:'+18%', priorWidth:85, currentWidth:100, context:'$2.5M goal'},
      {name:'Target accounts reached', prior:'~4.9K', current:'5,312', change:'+9%', priorWidth:92, currentWidth:100, context:'of 6,400'},
      {name:'Spend', prior:'~$327K', current:'$304K', change:'−7%', priorWidth:100, currentWidth:93, context:'of $350K budget', tone:'caution'},
      {name:'Cost per opportunity', prior:'~$6.0K', current:'~$5.3K', change:'−12%', priorWidth:100, currentWidth:88, context:'$5K goal · $304K ÷ 57 opps'}
    ];
    const toolbar = document.createElement('div');
    toolbar.className = 'mqr-compare-toolbar';
    toolbar.innerHTML = '<span class="mqr-review-period">Q4 2026 review</span><label class="mqr-quarter-picker">Compare to <select aria-label="Compare Q4 2026 to quarter"><option value="q3-2026">Q3 2026</option><option value="q2-2026">Q2 2026</option><option value="q1-2026">Q1 2026</option><option value="q4-2025">Q4 2025</option></select></label><button type="button" class="mqr-compare-toggle" aria-expanded="false" aria-controls="mqr-quarter-comparison">Show comparison <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="m4 6 4 4 4-4"/></svg></button>';
    scorecard.prepend(toolbar);
    const cardNodes = [...cards.querySelectorAll('article')];
    cardNodes.forEach((card, index) => {
      const measure = measures[index];
      if (!measure) return;
      const context = card.querySelector('p');
      if (context) context.textContent = measure.context;
      const trend = document.createElement('div');
      trend.className = 'mqr-card-trend';
      card.append(trend);
    });
    const comparison = document.createElement('section');
    comparison.className = 'mqr-quarter-comparison';
    comparison.id = 'mqr-quarter-comparison';
    comparison.setAttribute('aria-live', 'polite');
    comparison.hidden = true;
    cards.after(comparison);
    const picker = toolbar.querySelector('select');
    const toggle = toolbar.querySelector('.mqr-compare-toggle');
    const render = () => {
      const label = picker.selectedOptions[0].textContent;
      const available = picker.value === 'q3-2026';
      comparison.setAttribute('aria-label', `Q4 2026 compared with ${label}`);
      cardNodes.forEach((card, index) => {
        const trend = card.querySelector('.mqr-card-trend');
        if (!trend || !measures[index]) return;
        const measure = measures[index];
        trend.innerHTML = available ? `<span class="mqr-prior">Q3 estimate ${measure.prior}</span><span class="${measure.tone === 'caution' ? 'mqr-trend-caution' : 'mqr-trend-gain'}">${measure.change} vs Q3</span>` : `<span class="mqr-prior">No ${label} comparison data</span>`;
      });
      comparison.innerHTML = available
        ? `<div class="mqr-compare-heading"><h3>Q4 vs Q3 2026</h3><p>Pipeline and reach increased. Spend fell; check delivery before treating that as an improvement.</p></div><div class="mqr-compare-legend"><span><i class="mqr-legend-prior"></i>Q3 estimate</span><span><i class="mqr-legend-current"></i>Q4 result</span></div><div class="mqr-compare-list">${measures.map(measure => `<div class="mqr-compare-row"><div class="mqr-compare-row-top"><strong>${measure.name}</strong><span class="${measure.tone === 'caution' ? 'mqr-trend-caution' : 'mqr-trend-gain'}">${measure.change} vs Q3</span></div><div class="mqr-compare-bar"><span>Q3</span><i><b class="mqr-bar-prior" style="width:${measure.priorWidth}%"></b></i><strong>${measure.prior}</strong></div><div class="mqr-compare-bar"><span>Q4</span><i><b class="mqr-bar-current" style="width:${measure.currentWidth}%"></b></i><strong>${measure.current}</strong></div></div>`).join('')}</div><p class="mqr-compare-note">Q3 values are estimates calculated from rounded changes in this review. Pipeline and cost per opportunity remain provisional.</p>`
        : `<div class="mqr-compare-empty"><h3>No comparison data for ${label}</h3><p>This prototype only has Q3 2026 figures to compare with Q4. Choose Q3 to see the quarter comparison.</p></div>`;
    };
    picker.addEventListener('change', () => {
      comparison.hidden = false;
      report.classList.add('mqr-comparison-open');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.classList.add('is-open');
      toggle.firstChild.textContent = 'Hide comparison ';
      render();
    });
    toggle.addEventListener('click', () => {
      const open = comparison.hidden;
      comparison.hidden = !open;
      report.classList.toggle('mqr-comparison-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.classList.toggle('is-open', open);
      toggle.firstChild.textContent = open ? 'Hide comparison ' : 'Show comparison ';
    });
    render();
  }

  function bind(panel) {
    panel.addEventListener('click', event => {
      const source = event.target.closest('[data-lb-source]');
      if (source) {
        const item = evidence[source.dataset.lbSource];
        if (item) window.MojoSeeWhy?.open({title:item[0],reason:item[1],source:item[2],triggerType:'Mojo Brain',triggerReason:triggers[source.dataset.lbSource],nextStep:item[3],href:'Portfolio.html#quarterly',linkLabel:'Return to Quarterly Review'});
        return;
      }
      if (event.target.closest('[data-lb-repeat],[data-lb-approve]')) {
        location.href = 'Strategy.html#campaign-options';
        return;
      }
      if (event.target.closest('[data-lb-cmo]')) {
        window.MojoOpenChat?.('', false);
        const body = document.querySelector('.chatpane .chatbody');
        if (body) {
          const line = document.createElement('p');
          line.className = 'mqr-chat-note';
          line.textContent = 'I can turn the Q4 results into a short leadership summary. Which result should lead?';
          body.append(line);
          line.scrollIntoView({block:'nearest',behavior:'smooth'});
        }
      }
    });
  }

  async function mount() {
    const panel = document.querySelector('#ia-panel-quarterly');
    if (!panel) return;
    panel.innerHTML = '<p class="mqr-loading" role="status">Loading Quarterly Review…</p>';
    try {
      const response = await fetch(new URL('mojo-strategy-outcome.html', document.baseURI));
      if (!response.ok) throw new Error('Quarterly Review unavailable');
      const reportDocument = new DOMParser().parseFromString(await response.text(), 'text/html');
      const report = reportDocument.querySelector('#mso-lookbook');
      if (!report) throw new Error('Quarterly Review missing');
      report.removeAttribute('hidden');
      report.removeAttribute('id');
      report.removeAttribute('role');
      report.classList.add('mqr-report');
      report.querySelector('.mso-budget-planner')?.remove();
      const heading = document.createElement('div');
      heading.className = 'mqr-page-heading';
      heading.innerHTML = '<h1>Quarterly Review</h1>';
      report.prepend(heading);
      addQuarterComparison(report);
      panel.replaceChildren(report);
      bind(panel);
    } catch (error) {
      panel.innerHTML = '<p class="mqr-loading" role="status">Quarterly Review could not load. Refresh to try again.</p>';
      console.error(error);
    }
  }
  document.addEventListener('DOMContentLoaded', mount);
})();
