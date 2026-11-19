/* A reviewable, browser-local campaign draft for the Strategy demo. */
(() => {
  const key = 'mojo-next-campaign-draft-v1';
  const defaults = {
    name: 'Ironwood Works · Evaluation unblock',
    audience: 'Ironwood Works buying group · finance, security, marketing ops, champion',
    creative: 'Pipeline visibility · adapt proof for finance and security',
    budget: 3000,
    channels: ['LinkedIn Ads', 'Google Ads'],
    success: 'Reach 3+ buyer roles and book an evaluation meeting within 21 days',
    stop: 'Pause after $1,000 or 7 days if no new buyer role engages',
    published: false,
    weekly: true
  };
  const esc = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const read = () => { try { return {...defaults, ...JSON.parse(localStorage.getItem(key) || '{}')}; } catch { return {...defaults}; } };
  let draft = read();
  const save = () => localStorage.setItem(key, JSON.stringify(draft));

  function mount() {
    const root = document.querySelector('.mf-strategy');
    const strategyRoutes = root?.querySelector('.mso-strategy-lab');
    if (!strategyRoutes || root.querySelector('.mnc-section')) return false;
    const section = document.createElement('section');
    section.className = 'mnc-section';
    section.id = 'next-campaign';
    section.setAttribute('aria-labelledby', 'mnc-title');
    strategyRoutes.after(section);
    let editorOpen = false;
    let whyOpen = false;
    const render = () => {
      section.innerHTML = `
        <div class="mnc-head"><div><span class="mnc-eyebrow">MONDAY CAMPAIGN DRAFT · 1:1</span><h2 id="mnc-title">Your best campaign awaits.</h2><p>Ironwood Works has been in Evaluation for 21 days, with only 2 of 5 buyer roles reached. Mojo drafted a focused campaign to reach the missing buyers.</p></div><span class="mnc-state">${draft.published?'Published in preview':'Ready for review'}</span></div>
        <div class="mnc-blueprint">
          <div><small>AUDIENCE</small><div class="mnc-visual mnc-roles" aria-label="2 of 5 buyer roles reached"><span class="reached"></span><span class="reached"></span><span></span><span></span><span></span></div><strong>Ironwood Works buying group</strong><p>${draft.audience === defaults.audience ? 'Focus on the missing finance, security, and marketing ops roles.' : esc(draft.audience)}</p><a href="Portfolio.html#accounts">Inspect account →</a></div>
          <div><small>CREATIVE</small><div class="mnc-visual mnc-creative-preview" aria-hidden="true"><span></span><i></i><i></i><b></b></div><strong>${esc(draft.creative.split(' · ')[0])}</strong><p>${draft.creative === defaults.creative ? 'Adapt the strongest proof for those roles.' : esc(draft.creative.split(' · ').slice(1).join(' · ') || draft.creative)}</p><a href="Portfolio.html#creative">Review creative →</a></div>
          <div><small>CHANNELS</small><div class="mnc-visual mnc-platform-icons" aria-hidden="true">${draft.channels.map(channel=>`<img src="${{'LinkedIn Ads':'assets/linkedin.png','Google Ads':'assets/google-ads.svg','Demandbase Ads':'assets/demandbase.png'}[channel] || 'assets/google-ads.svg'}" alt="">`).join('')}</div><strong>${esc(draft.channels.join(' + ') || 'Choose channels')}</strong><p>Reach buyers in social; capture active evaluation intent in search.</p></div>
          <div><small>BUDGET</small><div class="mnc-visual mnc-budget-icon" aria-hidden="true"><svg viewBox="0 0 40 40" fill="none"><circle cx="20" cy="20" r="15" stroke="currentColor" stroke-width="2"/><path d="M20 10v10l7 5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></div><strong>$${Number(draft.budget).toLocaleString()} cap · 14 days</strong><p>Based on comparable 1:1 flights.</p></div>
        </div>
        <div class="mnc-decision"><div><small>HOW MOJO WILL JUDGE IT</small><strong>${esc(draft.success)}</strong><span>${esc(draft.stop)}</span></div><div class="mnc-actions"><button type="button" class="mnc-primary" data-mnc="review">${editorOpen?'Close draft':'Review draft'}</button><button type="button" class="mnc-link" data-mnc="why" aria-expanded="${whyOpen}">Why this campaign?</button></div></div>
        ${whyOpen?'<div class="mnc-why"><div><b>Signals used</b><p>Evaluation stage, opportunity size, existing display and search touches, the buyer-role gap, and sample creative response from similar Tier 1 accounts.</p></div><div><b>Why this mix</b><p>The Pipeline visibility asset had a 4.8% engaged-account rate against 2.6% for other sample assets. Mojo drafts role-specific proof. LinkedIn reaches finance and security; search catches comparison intent.</p></div><div><b>What Mojo ruled out</b><p>No broad Enterprise budget increase while buying-group coverage is thin. No claim of causal lift from one account.</p></div></div>':''}
        ${editorOpen?`<form class="mnc-editor" data-mnc-editor><div class="mnc-editor-head"><h3>Review the campaign draft</h3><span>Every field is editable before approval.</span></div><div class="mnc-fields"><label>Campaign name<input name="name" required value="${esc(draft.name)}"></label><label>Budget cap ($)<input name="budget" type="number" min="100" max="50000" step="100" required value="${Number(draft.budget)}"></label><label class="mnc-wide">Audience<input name="audience" required value="${esc(draft.audience)}"></label><label class="mnc-wide">Creative and message<select name="creative"><option ${draft.creative.startsWith('Pipeline visibility')?'selected':''}>Pipeline visibility · adapt proof for finance and security</option><option ${draft.creative.startsWith('Buying-group coverage')?'selected':''}>Buying-group coverage · reach the missing roles</option><option ${draft.creative.startsWith('Intent follow-up')?'selected':''}>Intent follow-up · prompt an evaluation meeting</option></select></label><fieldset class="mnc-wide"><legend>Channels</legend>${['LinkedIn Ads','Google Ads','Demandbase Ads'].map(channel=>`<label><input type="checkbox" name="channels" value="${channel}" ${draft.channels.includes(channel)?'checked':''}> ${channel}</label>`).join('')}</fieldset><label class="mnc-wide">Success rule<input name="success" required value="${esc(draft.success)}"></label><label class="mnc-wide">Stop rule<input name="stop" required value="${esc(draft.stop)}"></label></div><div class="mnc-editor-actions"><button type="submit" name="intent" value="save">Save draft</button><button type="submit" name="intent" value="publish" class="mnc-primary">Approve and publish</button><span>Preview only · no ad platform changes</span></div></form>`:''}
        <div class="mnc-routine"><span>Mojo can draft a campaign like this every Monday.</span><a href="Routines.html#next-best-campaign">${draft.weekly?'Review weekly routine':'Set up weekly routine'} →</a></div>
        ${draft.published?'<div class="mnc-receipt" role="status"><strong>Campaign published in this preview.</strong><span>The approved draft is saved locally. No ad platform was changed.</span><button type="button" data-mnc="undo">Undo preview</button></div>':''}`;
    };
    section.addEventListener('click', event => {
      const button = event.target.closest('[data-mnc]');
      if (!button) return;
      if (button.dataset.mnc === 'review') { window.MojoOpenCampaignCreator?.(draft); return; }
      if (button.dataset.mnc === 'why') whyOpen = !whyOpen;
      if (button.dataset.mnc === 'undo') { draft.published = false; save(); }
      render();
      if (editorOpen && button.dataset.mnc === 'review') section.querySelector('.mnc-editor')?.scrollIntoView({behavior:'smooth',block:'nearest'});
    });
    section.addEventListener('submit', event => {
      const form = event.target.closest('[data-mnc-editor]');
      if (!form) return;
      event.preventDefault();
      const data = new FormData(form);
      draft = {...draft, name:String(data.get('name')).trim(), audience:String(data.get('audience')).trim(), creative:String(data.get('creative')), budget:Number(data.get('budget')), channels:data.getAll('channels').map(String), success:String(data.get('success')).trim(), stop:String(data.get('stop')).trim()};
      if (!draft.channels.length) { form.querySelector('.mnc-editor-actions span').textContent = 'Choose at least one channel.'; form.querySelector('input[name="channels"]')?.focus(); return; }
      const intent = event.submitter?.value;
      if (intent === 'publish') { draft.published = true; editorOpen = false; }
      save(); render();
      section.querySelector('.mnc-receipt,.mnc-decision')?.scrollIntoView({behavior:'smooth',block:'nearest'});
    });
    render();
    return true;
  }
  const start = () => {
    if (mount()) return;
    const observer = new MutationObserver(() => { if (mount()) observer.disconnect(); });
    observer.observe(document.documentElement, {childList:true,subtree:true});
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();
