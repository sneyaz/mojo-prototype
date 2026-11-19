/* Build lists campaign status; implementation happens in Chat. */
(() => {
  if (!location.pathname.endsWith('/CampaignLifecycle.html') || new URLSearchParams(location.search).get('view') !== 'build') return;
  const key='mojo-created-campaign-drafts-v1';
  const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const drafts=()=>{try{const all=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(all)?all:[]}catch{return []}};
  const field=(name,label,value,hint='')=>`<label class="mbe-field"><span>${label}</span><input name="${name}" value="${esc(value)}">${hint?`<small>${hint}</small>`:''}</label>`;
  function open(index){
    const draft=drafts().filter(item=>item?.name)[index];
    if(!draft)return;
    window.MojoOpenChat?.('',false);
    const body=document.querySelector('.chatpane .chatbody');
    if(!body)return;
    body.querySelector('.seq-chat-empty')?.remove();
    const blueprint=Object.fromEntries(draft.planBlueprint||[]);
    const existing=draft.buildSetup||{};
    body.querySelector('.mbe-editor')?.remove();
    const editor=document.createElement('section');editor.className='mbe-editor';
    editor.innerHTML=`<div class="mbe-head"><div><span class="mbe-eyebrow">Build from saved plan</span><h3>${esc(draft.planTitle||draft.name)}</h3><p>Carry the audience, message and goal into setup. Mojo will check tracking during QA.</p></div></div>
      <form class="mbe-form"><div class="mbe-grid">
      ${field('audience','Audience',existing.audience||blueprint.Who||draft.audience||'')}
      ${field('message','Message',existing.message||blueprint.Message||draft.creative||'')}
      ${field('channels','Channels',existing.channels||blueprint.Where||(draft.channels||[]).join(', '))}
      ${field('budget','Spend and timing',existing.budget||blueprint.Spend||String(draft.budget||''))}
      ${field('goal','Campaign goal',existing.goal||draft.success||draft.goal||blueprint.Goal||'')}
      ${field('utm','Campaign tracking tag',existing.utm||'', 'Add before publishing for the post-launch check')}
      ${field('conversion','Conversion event',existing.conversion||'', 'Add before publishing to match the initiative goal')}
      ${field('validation','Validation check',existing.validation||'', 'Add before publishing to confirm the result')}
      </div><div class="mbe-footer"><p>Mojo will flag changes from the saved plan during QA.</p><button type="submit">Save setup and start Mojo QA →</button></div></form><div class="mbe-saved" role="status" hidden></div>`;
    setTimeout(()=>{body.append(editor);editor.scrollIntoView({block:'start',behavior:'smooth'});},120);
    editor.querySelector('form').addEventListener('submit',event=>{
      event.preventDefault();
      const values=Object.fromEntries(new FormData(event.currentTarget));
      const all=drafts();const saved=all.filter(item=>item?.name)[index];if(!saved)return;
      const planned={audience:blueprint.Who||draft.audience||'',message:blueprint.Message||draft.creative||'',channels:blueprint.Where||(draft.channels||[]).join(', '),budget:blueprint.Spend||String(draft.budget||''),goal:draft.success||draft.goal||blueprint.Goal||''};
      const changed=Object.keys(planned).filter(name=>String(values[name]).trim()!==String(planned[name]).trim());
      saved.buildSetup=values;saved.buildStatus='qa';saved.buildQa={changed};localStorage.setItem(key,JSON.stringify(all));
      document.dispatchEvent(new CustomEvent('mojo:build-status-changed',{detail:{index,status:'qa'}}));
      const missing=Object.entries(values).filter(([,value])=>!String(value).trim()).map(([name])=>name);
      editor.querySelector('.mbe-saved').textContent=missing.length?'Mojo QA started. Mojo will flag any missing setup before publishing.':changed.length?`Mojo QA started. Mojo will check changes to ${changed.join(', ')} against the plan.`:'Mojo QA started. Mojo will check tracking and rules before launch.';
      editor.querySelector('.mbe-saved').hidden=false;
      editor.querySelector('.mbe-saved').scrollIntoView({block:'nearest',behavior:'smooth'});
    });
  }
  document.addEventListener('click',event=>{
    const button=event.target.closest('[data-source-section="draft"] .ml-build-row [data-discuss]');
    if(!button)return;
    event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
    const row=button.closest('[data-saved-index]');const index=Number(row?.dataset.savedIndex);
    if(Number.isInteger(index))open(index);
  },true);
  if(sessionStorage.getItem('mojo-open-draft-build-v1')==='true'){
    sessionStorage.removeItem('mojo-open-draft-build-v1');
    requestAnimationFrame(()=>open(0));
  }
})();
