/* Confirm the campaign grouping before Mojo uses it in plans and reports. */
(() => {
  const key = 'mojo-initiative-review-v1';
  const goalsKey = 'mojo-campaign-goals-v1';
  const undoKey = 'mojo-initiative-review-undo-v1';
  const suggestions = [
    {id:'visibility', initiative:'Q4 net-new pipeline', title:'Create qualified pipeline from net-new accounts'},
    {id:'expansion', initiative:'Customer Growth', title:'Open expansion opportunities in existing customers'},
    {id:'coverage', initiative:'Event Demand Generation', title:'Turn event interest into qualified engagement'},
    {id:'acceleration', initiative:'Buying-Group Coverage', title:'Reach missing buyers and create meetings'}
  ];
  const legacyNames = ['Brand','Demand','Land','Expand'];
  const legacyTitles = ['Reach the right target accounts','Increase qualified engagement','Turn buying-group engagement into meetings','Open customer expansion opportunities'];
  const normalizeGoal = (item, saved) => {
    const merged = {...item,...saved};
    if (legacyNames.includes(merged.initiative)) merged.initiative = item.initiative;
    if (legacyTitles.includes(merged.title)) merged.title = item.title;
    return merged;
  };
  const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
  const preview = goals => `<span class="mic-preview-label">Inferred groups</span><div class="mic-preview-list">${goals.map(goal => `<span class="mic-preview-item">${escape(goal.initiative)}</span>`).join('')}</div>`;
  const read = () => { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; } };
  const current = () => {
    const saved = read();
    return {label:saved?.label || 'Initiatives', confirmed:!!saved?.confirmed,
      goals:suggestions.map(item => normalizeGoal(item,saved?.goals?.find(goal => goal.id === item.id)))};
  };
  function mount() {
    const section = document.querySelector('#mf-insights .mfc-section');
    if (!section?.dataset.seqReady) return false;
    if (section.querySelector('.mojo-initiative-check')) return true;
    const state = current();
    const model = window.MojoInitiatives;
    const motionOptions = ['Brand','Demand','Land','Expand'];
    const readStructure = () => { try { return JSON.parse(localStorage.getItem(model.metadataKey) || 'null') || {}; } catch { return {}; } };
    const patchModel = structureAll => {
      if (!model) return;
      model.byId = id => {
        const entry = model.entries.find(item => item.id === id);
        const saved = structureAll[id] || {};
        return entry ? {...entry,motions:saved.motions || entry.motions,channels:saved.channels || entry.channels} : null;
      };
    };
    const card = document.createElement('article');
    card.className = 'mfc-card mojo-initiative-check';
    card.dataset.mojoOwner = 'Pam Beesly';
    card.dataset.feedArea = 'Optimize';
    card.dataset.urgencyRank = '-35';
    card.innerHTML = `<div class="mic-question-view" ${state.confirmed ? 'hidden' : ''}><div class="mic-head"><span class="mic-tag">Optimize</span></div>
      <h2>Did Mojo get your initiatives right?</h2>
      <p class="mic-intro">Review how your initiatives connect to motions, channels, and campaigns.</p>
      <div class="mic-preview">${preview(state.goals)}</div>
      <div class="mic-card-actions"><button type="button" data-mic-review>Review structure →</button><button type="button" class="mojo-see-why" data-mic-why>See why</button></div></div>
      <details class="mic-review" hidden>
      <summary><span>Edit initiative names and goals</span><svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="m3.5 6 4.5 4.5L12.5 6"/></svg></summary>
      <form class="mic-form">
        <fieldset class="mic-name"><legend>What should we call this multi-channel grouping?</legend>
          ${['Initiatives','Programs','Other'].map(label => `<label><input type="radio" name="groupLabelChoice" value="${label}" ${state.label === label || label === 'Other' && !['Initiatives','Programs'].includes(state.label) ? 'checked' : ''}>${label}</label>`).join('')}
          <input class="mic-other" name="groupLabelOther" ${!['Initiatives','Programs'].includes(state.label) ? 'required' : ''} maxlength="32" aria-label="Your grouping name" placeholder="Your term" value="${['Initiatives','Programs'].includes(state.label) ? '' : escape(state.label)}">
        </fieldset>
        <div class="mic-goals"><strong>Are these the right groups and goals?</strong>${state.goals.map(goal => `<div class="mic-goal" data-mic-goal="${goal.id}"><label><span>Initiative name</span><input name="initiative_${goal.id}" maxlength="48" required value="${escape(goal.initiative)}"></label><label><span>Goal</span><input name="goal_${goal.id}" maxlength="100" required value="${escape(goal.title)}"></label><fieldset class="mic-motions"><legend>Motions</legend>${motionOptions.map(name => `<label><input type="checkbox" name="motions_${goal.id}" value="${name}" ${model?.byId(goal.id)?.motions.includes(name) ? 'checked' : ''}>${name}</label>`).join('')}</fieldset></div>`).join('')}</div>
        <div class="mic-actions"><button type="submit">Save groupings and goals →</button><a href="Portfolio.html#goals">View configuration</a></div>
      </form>
      </details>
      <div class="mic-confirmation" role="status" ${state.confirmed ? '' : 'hidden'}><span class="mfd-quick-check" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M5 12l5 5L20 7"></path></svg></span><div class="mic-saved-content"><strong>Saved as ${escape(state.label)}</strong><p class="mic-saved-names">${state.goals.map(goal=>escape(goal.initiative)).join(' · ')}</p><small>Used in plans and reports</small><div class="mic-saved-actions"><button type="button" data-mic-edit>Edit in Chat</button><button type="button" class="mojo-see-why" data-mic-saved-why>See why</button><button type="button" data-mic-undo>Undo</button></div></div></div>`;
    section.prepend(card);
    const review=card.querySelector('.mic-review');
    const openReview=()=>{
      window.MojoOpenChat?.('',false);
      const body=document.querySelector('.chatpane .chatbody');
      if(!body)return;
      body.querySelector('.seq-chat-empty')?.remove();
      body.querySelector('.mic-chat-panel')?.remove();
      body.querySelector('.mic-chat-saved')?.remove();
      const panel=document.createElement('section');panel.className='mic-chat-panel';
      panel.innerHTML='<h2>Did Mojo get your structure right?</h2><p>Review each initiative\'s goal, motions, channels, and campaigns. Select Edit to make changes here.</p><div class="mic-structure-map"></div>';
      const structure=panel.querySelector('.mic-structure-map');
      const fallback={visibility:['GO Prep','Q4 Pipeline Search'],expansion:['2026-Q4-Customer-TryIt-NA'],coverage:['Q4 Enterprise Pipeline'],acceleration:['2026-Q4-SEM-ICP-NA-AI']};
      const renderStructure=rows=>{
        const assignments=(()=>{try{return JSON.parse(localStorage.getItem(goalsKey)||'null')?.assignments||{}}catch{return {}}})();
        structure.innerHTML=state.goals.map(goal=>{const meta=model?.byId(goal.id);if(!meta)return '';const names=rows.filter(row=>(row.platform==='Google Ads'?'visibility':assignments[row.name])===goal.id).map(row=>row.name);const campaigns=names.length?names:fallback[goal.id]||[];return `<article data-mic-structure="${goal.id}"><div class="mic-structure-head"><strong>${escape(goal.initiative)}</strong><button type="button" data-mic-structure-edit="${goal.id}">Edit</button></div><small>Initiative</small><p class="mic-structure-goal">${escape(goal.title)}</p><div><span>Motions</span><p>${meta.motions.map(name=>`<em>${escape(name)}</em>`).join('')}</p></div><div><span>Channels</span><p>${meta.channels.map(name=>`<img src="${model.logo[name]}" alt="${escape(name)}" title="${escape(name)}">`).join('')}</p></div><div><span>Campaigns</span><p>${campaigns.slice(0,3).map(name=>`<b>${escape(name)}</b>`).join('')}${campaigns.length>3?`<b>+${campaigns.length-3} more</b>`:''}</p></div></article>`}).join('');
      };
      renderStructure([]);
      fetch('mojo-plan-campaigns.json').then(response=>response.json()).then(renderStructure).catch(()=>{});
      structure.addEventListener('click',event=>{
        const button=event.target.closest('[data-mic-structure-edit]');
        if(!button)return;
        const id=button.dataset.micStructureEdit;
        const goalRow=review.querySelector(`[data-mic-goal="${id}"]`);
        const wasEditing=button.textContent==='Cancel';
        structure.querySelectorAll('[data-mic-structure-edit]').forEach(other=>{other.textContent='Edit'});
        if(wasEditing||!goalRow)return;
        button.textContent='Cancel';
        goalRow.scrollIntoView({block:'center',behavior:'smooth'});
        goalRow.querySelector('input')?.focus();
      });
      body.append(panel);panel.append(review);review.hidden=false;review.open=true;
      panel.scrollIntoView({block:'nearest',behavior:'smooth'});
    };
    card.querySelector('[data-mic-review]').addEventListener('click',openReview);
    const showWhy=(event)=>{
      const answer=window.MojoSeeWhy?.open({title:'Campaign groups and goals',reason:'Mojo found four shared objectives across your current campaigns.',source:'Current campaign names and goals',triggerType:'Mojo Brain',triggerReason:'Campaign names and goals across your account converge on the four groups shown above.',nextStep:'Confirm or edit the four group names and goals before they appear in plans and reports.',href:'#review-campaign-groups',linkLabel:'Review and confirm goals'},event?.currentTarget);
      answer?.querySelector('a[href="#review-campaign-groups"]')?.addEventListener('click',event=>{event.preventDefault();openReview()});
    };
    card.querySelector('[data-mic-why]').addEventListener('click',showWhy);
    card.querySelector('[data-mic-saved-why]').addEventListener('click',showWhy);
    card.querySelector('[data-mic-edit]').addEventListener('click', () => {
      openReview();
    });
    card.querySelector('[data-mic-undo]').addEventListener('click', () => {
      let snapshot = null;
      try { snapshot = JSON.parse(localStorage.getItem(undoKey) || 'null'); } catch {}
      if (snapshot) {
        if (snapshot.review === null) localStorage.removeItem(key);
        else localStorage.setItem(key, snapshot.review);
        if (snapshot.goals === null) localStorage.removeItem(goalsKey);
        else localStorage.setItem(goalsKey, snapshot.goals);
      } else {
        localStorage.removeItem(key);
        try {
          const configured = JSON.parse(localStorage.getItem(goalsKey) || 'null');
          if (configured?.goals && configured?.assignments) {
            configured.goals = configured.goals.map(goal => ({...goal,...suggestions.find(item => item.id === goal.id)}));
            configured.groupingLabel = 'Initiatives';
            localStorage.setItem(goalsKey, JSON.stringify(configured));
          }
        } catch {}
      }
      if (snapshot) {
        if (snapshot.structure === null) localStorage.removeItem(model.metadataKey);
        else if (snapshot.structure !== undefined) localStorage.setItem(model.metadataKey, snapshot.structure);
      }
      localStorage.removeItem(undoKey);
      const restored = current();
      patchModel(readStructure());
      card.querySelector('.mic-question-view').hidden = restored.confirmed;
      card.querySelector('.mic-confirmation').hidden = !restored.confirmed;
      card.querySelector('.mic-preview').innerHTML = preview(restored.goals);
      card.querySelector('.mic-saved-names').textContent = restored.goals.map(goal => goal.initiative).join(' · ');
      card.querySelector('.mic-saved-content>strong').textContent = `Saved as ${restored.label}`;
      const form = card.querySelector('.mic-form');
      form.querySelectorAll('[name="groupLabelChoice"]').forEach(input => { input.checked = input.value === restored.label || input.value === 'Other' && !['Initiatives','Programs'].includes(restored.label); });
      const other = form.querySelector('.mic-other');
      other.value = ['Initiatives','Programs'].includes(restored.label) ? '' : restored.label;
      other.required = !['Initiatives','Programs'].includes(restored.label);
      restored.goals.forEach(goal => {
        form.elements[`initiative_${goal.id}`].value = goal.initiative;
        form.elements[`goal_${goal.id}`].value = goal.title;
        const motions = model.byId(goal.id)?.motions || [];
        form.querySelectorAll(`[name="motions_${goal.id}"]`).forEach(checkbox => { checkbox.checked = motions.includes(checkbox.value); });
      });
      window.dispatchEvent(new CustomEvent('mojo:initiative-review-saved',{detail:restored}));
    });
    card.querySelector('.mic-form').addEventListener('change', event => {
      if (event.target.name === 'groupLabelChoice') review.querySelector('.mic-other').required = event.target.value === 'Other';
    });
    card.querySelector('.mic-form').addEventListener('submit', event => {
      event.preventDefault();
      const form = event.currentTarget;
      const data = new FormData(form);
      const choice = String(data.get('groupLabelChoice') || 'Initiatives');
      const label = choice === 'Other' ? String(data.get('groupLabelOther') || '').trim() : choice;
      if (!label) { form.querySelector('.mic-other').focus(); return; }
      const goals = suggestions.map(item => ({id:item.id,initiative:String(data.get(`initiative_${item.id}`) || '').trim(),title:String(data.get(`goal_${item.id}`) || '').trim()}));
      if (goals.some(goal => !goal.initiative || !goal.title)) return;
      const structureAll = readStructure();
      suggestions.forEach(item => {
        const selected = data.getAll(`motions_${item.id}`);
        if (selected.length) structureAll[item.id] = {...(structureAll[item.id]||{}),motions:selected};
      });
      const saved = {label,goals,confirmed:true};
      localStorage.setItem(undoKey, JSON.stringify({review:localStorage.getItem(key),goals:localStorage.getItem(goalsKey),structure:localStorage.getItem(model.metadataKey)}));
      localStorage.setItem(key, JSON.stringify(saved));
      localStorage.setItem(model.metadataKey, JSON.stringify(structureAll));
      patchModel(structureAll);
      try {
        const configured = JSON.parse(localStorage.getItem(goalsKey) || 'null');
        if (configured?.goals && configured?.assignments) {
          configured.goals = configured.goals.map(goal => ({...goal,...goals.find(item => item.id === goal.id)}));
          configured.groupingLabel = label;
          localStorage.setItem(goalsKey, JSON.stringify(configured));
        }
      } catch {}
      window.dispatchEvent(new CustomEvent('mojo:initiative-review-saved',{detail:saved}));
      const confirmation = card.querySelector('.mic-confirmation');
      card.querySelector('.mic-preview').innerHTML = preview(goals);
      card.querySelector('.mic-question-view').hidden = true;
      card.querySelector('.mic-saved-names').textContent = goals.map(goal=>goal.initiative).join(' · ');
      card.querySelector('.mic-saved-content>strong').textContent = `Saved as ${label}`;
      review.open = false;
      review.hidden = true;
      card.append(review);
      document.querySelector('.mic-chat-panel')?.remove();
      confirmation.hidden = false;
      const body = document.querySelector('.chatpane .chatbody');
      if (body) {
        body.querySelector('.mic-chat-saved')?.remove();
        const receipt = document.createElement('section');
        receipt.className = 'mic-chat-saved';
        receipt.setAttribute('role', 'status');
        receipt.innerHTML = `<span class="mic-chat-saved-check" aria-hidden="true">✓</span><div><strong>Saved as ${escape(label)}</strong><p>${goals.map(goal=>escape(goal.initiative)).join(' · ')} will appear in Plan and Report.</p><button type="button">Edit groups</button></div>`;
        receipt.querySelector('button').addEventListener('click', openReview);
        body.append(receipt);
        receipt.scrollIntoView({block:'nearest',behavior:'smooth'});
      }
    });
    return true;
  }
  document.addEventListener('DOMContentLoaded', () => {
    if (location.pathname.split('/').pop() !== 'HomeSystem.html') return;
    if (mount()) return;
    const observer = new MutationObserver(() => { if (mount()) observer.disconnect(); });
    observer.observe(document.body,{childList:true,subtree:true});
  });
})();
