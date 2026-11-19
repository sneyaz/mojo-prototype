/* Recommended, editable campaign drafts for the campaign creation CTA. */
(() => {
  const storageKey = 'mojo-created-campaign-drafts-v1';
  const icons = {'LinkedIn Ads':'assets/linkedin.png','Google Ads':'assets/google-ads.svg','Demandbase Ads':'assets/demandbase.png'};
  const ideas = [
    {
      id:'buying-group', number:'01', type:'Recommended · Demandbase Ads',
      title:'Buying group follow-up',
      reason:'Build on 1,146 engaged accounts and reach finance and security buyers who were missed.',
      signal:'1,146 engaged accounts · $15,000',
      name:'Buying group follow-up · Dec 18', goal:'Increase buying-group coverage at engaged accounts',
      audience:'1,146 engaged accounts · prioritize groups with one buyer reached',
      creative:'Role-specific finance and security proof',
      channels:['Demandbase Ads'], budget:15000, duration:32,
      success:'35 accounts gain a third buyer role; review opportunity progress against Q3 results',
      stop:'Review after $5,000 or 14 days if no new buyer role engages',
      evidence:'Based on the three ended campaigns, Q4 engagement, and the buying-group gap in Plan.'
    },
    {
      id:'finance-security', number:'02', type:'Focused role test · LinkedIn Ads',
      title:'Reach finance and security directly',
      reason:'Focus on 412 Evaluation accounts missing finance or security engagement.',
      signal:'412 Evaluation accounts · $7,500',
      name:'Finance and security outreach · Dec 18', goal:'Engage missing finance and security buyers in Evaluation accounts',
      audience:'412 Evaluation accounts missing finance or security engagement',
      creative:'Role-specific finance and security proof',
      channels:['LinkedIn Ads'], budget:7500, duration:28,
      success:'Gain a third engaged buyer role in at least 20 target accounts',
      stop:'Review delivery and buyer-role engagement after 14 days',
      evidence:'Uses the focused LinkedIn direction already shown in the Plan page.'
    },
    {
      id:'in-market', number:'03', type:'In-market intent · Google Ads',
      title:'Capture active in-market intent',
      reason:'Reach up to 412 accounts showing relevant intent while they evaluate options.',
      signal:'Up to 412 accounts · $9,000',
      name:'In-market intent capture · Dec 18', goal:'Capture evaluation-stage demand from target accounts',
      audience:'Up to 412 target accounts showing relevant intent',
      creative:'Comparison and evaluation proof',
      channels:['Google Ads'], budget:9000, duration:28,
      success:'Engage more target buyers and review evaluation opportunities',
      stop:'Review spend and account engagement after 14 days',
      evidence:'Uses the in-market intent direction already shown in the Plan page.'
    }
  ];
  const endedCampaigns = [
    {name:'Enterprise ABX',check:'Review which buyers engaged before repeating the enterprise flight.'},
    {name:'EMEA evaluation',check:'Check which Evaluation accounts are still active.'},
    {name:'Manufacturing buyers',check:'Review the roles still missing from each buying group.'}
  ];
  const blank = {id:'custom', type:'Your idea', title:'Start with your own idea', signal:'Mojo will help fill the gaps',
    name:'', goal:'', audience:'', creative:'', channels:[], budget:'', duration:14,
    success:'', stop:'', evidence:'Start with what you know. You can ask Mojo to help with any missing field.'};
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const nextMonday = () => { const day = new Date(); day.setDate(day.getDate() + ((8-day.getDay())%7 || 7)); return `${day.getFullYear()}-${String(day.getMonth()+1).padStart(2,'0')}-${String(day.getDate()).padStart(2,'0')}`; };
  const dateDefault = nextMonday();
  const readDrafts = () => { try { const rows = JSON.parse(localStorage.getItem(storageKey) || '[]'); return Array.isArray(rows) ? rows : []; } catch { return []; } };
  const resumeDraft = item => ({...blank, ...item, id:item.source || 'custom', draftId:item.id, type:'Saved draft', title:item.name, evidence:'Continue the draft you saved in this browser.'});
  let panel, selected = null, saved = null, briefFile = null, briefCounter = 0, reviewedExisting = false;
  const isPlanning = () => document.querySelector('.app')?.classList.contains('mcc-planning');
  const closePanel = () => {
    panel?.remove(); panel = null;
    document.querySelector('.app')?.classList.remove('mcc-planning','mcc-planning-split');
    document.body.classList.remove('mcc-planning');
    const canvas = document.getElementById('canvasOn');
    if (canvas && !canvas.checked) { canvas.checked = true; canvas.dispatchEvent(new Event('change', {bubbles:true})); }
    const title = document.querySelector('.wtitle');
    if (title?.dataset.mccOriginal) { title.textContent = title.dataset.mccOriginal; delete title.dataset.mccOriginal; }
    document.querySelector('.chatpane .chatfoot textarea')?.focus();
  };
  const logo = name => `<img src="${icons[name]}" alt="${escape(name)}" title="${escape(name)}">`;
  const channelMeta = {
    'LinkedIn Ads':{key:'linkedin',target:'Buyer roles and company filters',message:'Message for these buyers',hint:'Reach the missing people at target accounts.'},
    'Google Ads':{key:'google',target:'Search intent and keywords',message:'Search ad message',hint:'Capture buyers already looking for an answer.'},
    'Demandbase Ads':{key:'demandbase',target:'Account list and exclusions',message:'Display or retargeting message',hint:'Reach eligible accounts and respect exclusions.'}
  };
  const defaultChannelPlans = item => {
    const chosen = item.channels || [];
    const base = Number(item.budget) || 0;
    const each = chosen.length ? Math.floor(base / chosen.length / 100) * 100 : 0;
    return Object.fromEntries(Object.keys(icons).map(name => [name,{
      target:name==='Google Ads' ? (item.id==='search' ? 'Evaluation-stage searches about pipeline visibility and account engagement' : 'Evaluation-stage searches from buyers at target accounts') : item.audience || '',
      message:item.creative || '',stop:item.stop || '',
      budget:chosen.includes(name) ? (chosen.indexOf(name) === chosen.length - 1 ? base - each * (chosen.length - 1) : each) : 0,
      ...(item.channelPlans?.[name] || {})
    }]));
  };
  const channelSections = item => {
    const plans = defaultChannelPlans(item);
    const firstSelected=(item.channels||[])[0];
    return Object.entries(channelMeta).map(([name,meta]) => {
      const plan=plans[name],checked=(item.channels||[]).includes(name);
      return `<details class="mcc-channel-card" data-channel-card="${escape(name)}" ${checked?'':'hidden'} ${checked&&name===firstSelected?'open':''}><summary class="mcc-channel-card-head">${logo(name)}<div><strong>${escape(name)}</strong><small data-channel-target>${escape(plan.target||meta.hint)}</small></div><span data-channel-budget>${plan.budget?'$'+Number(plan.budget).toLocaleString():'No budget yet'}</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></summary><div class="mcc-channel-fields"><label>${meta.target}<textarea name="channel_target_${meta.key}" rows="2" placeholder="Who or what should this channel reach?">${escape(plan.target)}</textarea></label><label>${meta.message}<textarea name="channel_message_${meta.key}" rows="2" placeholder="What should they see?">${escape(plan.message)}</textarea></label><label>Channel budget <span>USD</span><input name="channel_budget_${meta.key}" type="number" min="0" step="100" value="${escape(plan.budget)}"></label><label>Pause or review if<textarea name="channel_stop_${meta.key}" rows="2" placeholder="Channel-specific stop rule">${escape(plan.stop)}</textarea></label></div></details>`;
    }).join('');
  };
  function addBriefOption(afterNode) {
    const id = `mcc-brief-file-${++briefCounter}`;
    const block = document.createElement('div');
    block.className = 'mcc-brief';
    block.innerHTML = `<button type="button" class="mcc-brief-link" data-mcc="brief-toggle" aria-expanded="false">+ Upload a campaign brief</button><div class="mcc-brief-tray" hidden><p>Have a brief already? Bring it in and plan from there.</p><div class="mcc-brief-drop"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4m0 0L8 8m4-4 4 4M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/></svg><strong>Drop your brief here</strong><span>PDF, Word, text, or slides</span><label for="${id}">Choose from my files</label><input id="${id}" type="file" accept=".pdf,.doc,.docx,.txt,.md,.ppt,.pptx" aria-label="Choose a campaign brief"></div><div class="mcc-brief-picked" role="status" hidden></div><small>Attached in this browser preview. Review the plan before saving.</small></div>`;
    afterNode.after(block);
    if (briefFile) updateBrief(block);
  }
  function updateBrief(block) {
    const picked = block.querySelector('.mcc-brief-picked');
    picked.hidden = !briefFile;
    if (briefFile) picked.innerHTML = `<span aria-hidden="true">✓</span><strong>${escape(briefFile.name)}</strong><small>${(briefFile.size / 1024).toFixed(0)} KB</small><button type="button" data-mcc="brief-remove" aria-label="Remove brief">Remove</button>`;
    const tray = block.querySelector('.mcc-brief-tray');
    tray.hidden = false;
    block.querySelector('[data-mcc="brief-toggle"]').setAttribute('aria-expanded', 'true');
  }
  function shell() {
    if (panel?.isConnected) return;
    const body = document.querySelector('.app .chatpane .chatbody');
    if (!body) return;
    panel = document.createElement('section');
    panel.className = 'mcc-chat-flow';
    panel.setAttribute('aria-label','Campaign planning with Mojo');
    body.append(panel);
    panel.addEventListener('click', event => {
      const action = event.target.closest('[data-mcc]');
      if (!action) return;
      if (action.dataset.mcc === 'close') closePanel();
      if (action.dataset.mcc === 'continue') { reviewedExisting = true; render(); }
      if (action.dataset.mcc === 'back-review') { reviewedExisting = false; render(); }
      if (action.dataset.mcc === 'select') { selected = ideas.find(item => item.id === action.dataset.id) || blank; saved = null; render(); }
      if (action.dataset.mcc === 'resume') { const item = readDrafts().find(draft => draft.id === action.dataset.id); if (item) { selected = resumeDraft(item); saved = null; render(); } }
      if (action.dataset.mcc === 'edit') { selected = resumeDraft(saved); saved = null; render(); }
      if (action.dataset.mcc === 'chat') { const prompt = `Help me plan a campaign for ${selected?.audience || 'my target accounts'}. `; closePanel(); window.MojoOpenChat?.(prompt, false); }
      if (action.dataset.mcc === 'new') { selected = null; saved = null; reviewedExisting = true; render(); }
      if (action.dataset.mcc === 'brief-toggle') { const block = action.closest('.mcc-brief'); const tray = block.querySelector('.mcc-brief-tray'); tray.hidden = !tray.hidden; action.setAttribute('aria-expanded', String(!tray.hidden)); if (!tray.hidden) block.scrollIntoView({block:'center',behavior:'smooth'}); }
      if (action.dataset.mcc === 'brief-remove') { briefFile = null; panel.querySelectorAll('.mcc-brief').forEach(updateBrief); }
    });
    panel.addEventListener('change', event => {
      if (event.target.matches('input[name="channels"]')) {
        const card=panel.querySelector(`[data-channel-card="${event.target.value}"]`);
        if(card){card.hidden=!event.target.checked;card.open=event.target.checked;}
        return;
      }
      if (!event.target.matches('.mcc-brief-drop input[type="file"]')) return;
      const file = event.target.files?.[0];
      if (file) { briefFile = file; updateBrief(event.target.closest('.mcc-brief')); }
    });
    panel.addEventListener('dragover', event => { const drop = event.target.closest('.mcc-brief-drop'); if (!drop) return; event.preventDefault(); drop.classList.add('mcc-dragging'); });
    panel.addEventListener('toggle',event=>{const card=event.target;if(!card.matches?.('.mcc-channel-card')||!card.open)return;panel.querySelectorAll('.mcc-channel-card').forEach(other=>{if(other!==card)other.open=false});},true);
    panel.addEventListener('input',event=>{const card=event.target.closest('.mcc-channel-card');if(!card)return;if(event.target.name.startsWith('channel_target_'))card.querySelector('[data-channel-target]').textContent=event.target.value.trim()||'Targeting to add';if(event.target.name.startsWith('channel_budget_'))card.querySelector('[data-channel-budget]').textContent=Number(event.target.value)>0?'$'+Number(event.target.value).toLocaleString():'No budget yet';});
    panel.addEventListener('dragleave', event => { const drop = event.target.closest('.mcc-brief-drop'); if (drop && !drop.contains(event.relatedTarget)) drop.classList.remove('mcc-dragging'); });
    panel.addEventListener('drop', event => { const drop = event.target.closest('.mcc-brief-drop'); if (!drop) return; event.preventDefault(); drop.classList.remove('mcc-dragging'); const file = event.dataTransfer?.files?.[0]; if (file) { briefFile = file; updateBrief(drop.closest('.mcc-brief')); } });
    panel.addEventListener('submit', event => {
      if (!event.target.matches('.mcc-form')) return;
      event.preventDefault();
      const form = event.target;
      const data = new FormData(form);
      const channels = data.getAll('channels').map(String);
      const output = form.querySelector('.mcc-validation');
      if (!channels.length) { output.textContent = 'Choose at least one channel.'; form.querySelector('[name="channels"]')?.focus(); return; }
      const channelPlans=Object.fromEntries(channels.map(name=>{const key=channelMeta[name].key;return [name,{target:String(data.get(`channel_target_${key}`)||'').trim(),message:String(data.get(`channel_message_${key}`)||'').trim(),budget:Number(data.get(`channel_budget_${key}`)||0),stop:String(data.get(`channel_stop_${key}`)||'').trim()}]}));
      const allocated=Object.values(channelPlans).reduce((sum,plan)=>sum+plan.budget,0);
      if(allocated>Number(data.get('budget'))){output.textContent=`Channel budgets total $${allocated.toLocaleString()}, above the campaign cap.`;form.querySelector('.mcc-channel-card:not([hidden]) input[type="number"]')?.focus();return}
      const item = {
        id:selected.draftId || `draft-${Date.now()}`, source:selected.id, name:String(data.get('name')).trim(),
        goal:String(data.get('goal')).trim(), audience:[...new Set(channels.map(name=>channelPlans[name].target).filter(Boolean))].join(' · '),
        creative:channels.map(name=>channelPlans[name].message).filter(Boolean).join(' · '), channels, channelPlans,
        budget:Number(data.get('budget')), start:String(data.get('start')),
        duration:Number(data.get('duration')), success:String(data.get('success')).trim(),
        stop:channels.map(name=>channelPlans[name].stop).filter(Boolean).join(' · '), briefName:briefFile?.name || '', savedAt:new Date().toISOString()
      };
      try {
        const drafts = readDrafts().filter(draft => draft.id !== item.id);
        drafts.unshift(item);
        localStorage.setItem(storageKey, JSON.stringify(drafts.slice(0,20)));
        saved = item;
        const note = document.createElement('p');
        note.className = 'mcc-user-message';
        note.textContent = `Save ${item.name} as a draft.`;
        form.replaceWith(note);
        render();
      } catch { output.textContent = 'This browser could not save the draft. Try again.'; }
    });
  }
  function render() {
    if (!selected) {
      if (!reviewedExisting) {
        panel.innerHTML = `<div class="mcc-intro"><h2>Start with what already ran.</h2><p>Three campaigns ended. Review them before choosing how the next campaign should reach more of the buying group.</p></div><div class="mcc-review-list">${endedCampaigns.map(item => `<details class="mcc-review-row"><summary><img src="assets/demandbase.png" alt=""><strong>${escape(item.name)}</strong><span>Ended</span><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4"/></svg></summary><div><small>Review next</small><p>${escape(item.check)}</p></div></details>`).join('')}</div><div class="mcc-review-finding"><span>Mojo’s read across these campaigns</span><strong>1,146 accounts engaged. Most reached just one buyer role.</strong><p>Finance and security are the next roles to test.</p></div><div class="mcc-review-actions"><button type="button" data-mcc="continue">See ways to build on them <span aria-hidden="true">→</span></button></div>`;
        panel.scrollIntoView({block:'start'});
        return;
      }
      const drafts = readDrafts();
      panel.innerHTML = `<div class="mcc-intro"><h2>Ways to build on them.</h2><p>These are the same three directions in Plan. Pick one to review its draft.</p></div><div class="mcc-ideas" role="list">${ideas.map(item => `<div class="mcc-idea" role="listitem"><div class="mcc-idea-copy"><span class="mcc-type">${escape(item.type)}</span><h3>${escape(item.title)}</h3><p>${escape(item.reason)}</p><div class="mcc-idea-foot"><span>${escape(item.signal)}</span><span class="mcc-logos">${item.channels.map(logo).join('')}</span></div></div><button type="button" data-mcc="select" data-id="${item.id}" aria-label="Review draft: ${escape(item.title)}">Review draft <span aria-hidden="true">→</span></button></div>`).join('')}</div><div class="mcc-own"><span>Have something else in mind?</span><button type="button" data-mcc="select" data-id="custom">Start with your own idea →</button><button type="button" data-mcc="back-review">Review ended campaigns</button></div>${drafts.length ? `<div class="mcc-existing"><strong>Your drafts</strong>${drafts.slice(0,3).map(item => `<button type="button" data-mcc="resume" data-id="${escape(item.id)}">${escape(item.name)} <span>Continue →</span></button>`).join('')}</div>` : ''}`;
      addBriefOption(panel.querySelector('.mcc-own button'));
      panel.scrollIntoView({block:'start'});
      return;
    }
    if (saved) {
      const turn = document.createElement('div');
      turn.className = 'mcc-turn';
      turn.innerHTML = `<div class="mcc-saved" role="status"><p><strong>Saved ${escape(saved.name)} as a draft.</strong> Want to change anything before launch?</p><div class="mcc-saved-summary"><span>${escape(saved.audience)}</span><span class="mcc-saved-channels">${saved.channels.map(logo).join('')}</span><span>$${saved.budget.toLocaleString()} cap</span></div><p class="mcc-preview-note">Saved in this browser; no ad platform campaign was created.</p><div class="mcc-saved-actions"><button type="button" data-mcc="edit">Edit this draft</button><button type="button" data-mcc="new">Explore another idea</button></div></div>`;
      panel.replaceChildren(turn);
      requestAnimationFrame(() => turn.scrollIntoView({block:'start'}));
      return;
    }
    const item = selected;
    const turn = document.createElement('div');
    turn.className = 'mcc-turn';
    turn.innerHTML = `<div class="mcc-flow-toolbar"><button type="button" data-mcc="new">← Campaign ideas</button></div><div class="mcc-draft-head"><h2>${escape(item.title)}</h2><p>${escape(item.evidence)}</p></div><form class="mcc-form"><div class="mcc-fields"><label class="mcc-span">Campaign name<input name="name" required value="${escape(item.name)}" placeholder="Name this campaign"></label><label class="mcc-span">Goal<textarea name="goal" required rows="2" placeholder="What should this campaign improve?">${escape(item.goal)}</textarea></label><label>Budget cap <span>USD</span><input name="budget" type="number" required min="100" step="100" value="${escape(item.budget)}" placeholder="Budget cap"></label><label>Start date<input name="start" type="date" required value="${escape(item.start || dateDefault)}"></label><label>Flight length <span>days</span><input name="duration" type="number" required min="1" max="365" value="${escape(item.duration)}"></label><div class="mcc-field-note">Review timing and available budget before launch.</div><label class="mcc-span">Goal measure<textarea name="success" required rows="2" placeholder="How will you know this worked?">${escape(item.success)}</textarea></label><fieldset class="mcc-span"><legend>Channels</legend><div class="mcc-channel-list">${Object.keys(icons).map(name => `<label><input type="checkbox" name="channels" value="${escape(name)}" ${item.channels.includes(name)?'checked':''}>${logo(name)}${escape(name)}</label>`).join('')}</div></fieldset><div class="mcc-span mcc-channel-section"><div class="mcc-channel-section-title"><strong>Plan by channel</strong><span>Each channel gets its own targeting, message, budget, and review rule.</span></div>${channelSections(item)}</div></div><div class="mcc-form-footer"><p>${item.id === 'custom' ? 'Fill what you know. Mojo can help with the rest.' : 'Suggested fields are editable before saving.'}<br><small>Final targeting, creative variants, tracking, and approvals are checked before launch.</small></p><output class="mcc-validation" role="status"></output><button type="button" class="mcc-chat" data-mcc="chat">Plan with Mojo</button><button type="submit" class="mcc-save">Save campaign draft</button></div></form>`;
    addBriefOption(turn.querySelector('.mcc-draft-head'));
    panel.replaceChildren(turn);
    requestAnimationFrame(() => turn.scrollIntoView({block:'start'}));
  }
  document.getElementById('chatOn')?.addEventListener('change', event => {
    if (!event.target.checked && isPlanning()) closePanel();
  });
  document.getElementById('sidebarOn')?.addEventListener('change', () => {
    if (isPlanning()) closePanel();
  });
  document.querySelector('.paneToggles label:not([for])')?.addEventListener('click', () => {
    if (!isPlanning()) return;
    closePanel();
    const chat = document.getElementById('chatOn');
    if (chat) { chat.checked = false; chat.dispatchEvent(new Event('change', {bubbles:true})); }
  });
  window.MojoOpenCampaignCreator = (prefill = null) => {
    window.MojoOpenChat?.('', true); shell(); if (!panel) return;
    panel.replaceChildren(); selected = prefill === 'custom' || prefill === 'custom-brief' ? {...blank} : prefill ? {...ideas[0], ...prefill} : null; saved = null; reviewedExisting = true;
    document.querySelector('.app')?.classList.add('mcc-planning');
    document.querySelector('.app')?.classList.remove('mcc-planning-split');
    const canvas = document.getElementById('canvasOn');
    if (canvas) { canvas.checked = false; canvas.dispatchEvent(new Event('change', {bubbles:true})); }
    const title = document.querySelector('.wtitle');
    if (title && !prefill) { title.dataset.mccOriginal ||= title.textContent; title.textContent = 'Campaign plan development'; }
    render(); if (prefill === 'custom-brief') panel.querySelector('.mcc-brief-link')?.click(); panel.scrollIntoView({block:'start'});
  };
})();
