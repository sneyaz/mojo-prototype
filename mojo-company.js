document.addEventListener('DOMContentLoaded', async () => {
  let demandbaseConnected=false;
  try {demandbaseConnected=localStorage.getItem('mojo-board-demandbase-connected-v1')==='true'} catch {}
  if (demandbaseConnected) {
    document.querySelectorAll('[data-company-demandbase]').forEach(metric=>metric.textContent=Number(metric.dataset.companyDemandbase).toLocaleString());
    const source=document.getElementById('company-data-source');
    if(source)source.textContent='Account figures come from Demandbase. Buyer roles are a working read.';
  }
  const model=window.MojoInitiatives,structure=document.querySelector('.company-structure');
  if(!model||!structure)return;
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const read=model.read;
  const reviewKey='mojo-initiative-review-v1',goalsKey='mojo-campaign-goals-v1';
  const goals=()=>model.entries.map(entry=>{
    const saved=read(reviewKey)?.goals?.find(item=>item.id===entry.id)||read(goalsKey)?.goals?.find(item=>item.id===entry.id);
    return {id:entry.id,name:saved?.initiative||entry.name,goal:saved?.title||entry.goal};
  });
  let rows=[];
  try {const response=await fetch('mojo-plan-campaigns.json');if(response.ok)rows=await response.json()}catch{}
  const defaultAssignments={'GO Prep':'visibility','MOF — Patient Payments':'visibility','2026-Q4-eBook-ConnectedGTM':'visibility','2026-Q4-CTV-ICP-Roku':'visibility','2026-Q4-EMEA-Benelux':'visibility','Q4 Enterprise Pipeline':'coverage','Q4 Pipeline Search':'visibility','2026-Q4-EMEA-TAL-ABX':'coverage','2026-Q4-ENT-TAL-NA-ABX':'coverage','2026-Q4-HC-ICP-NA-Display':'coverage','2026-Q4-MFG-TAL-NA-ABX':'coverage','Enterprise Retargeting':'visibility','2026-Q4-Retargeting-Pricing-Page':'acceleration','2026-Q4-SEM-ICP-NA-AI':'acceleration','2026-Q4-SEM-ICP-EMEA-AI':'acceleration','2026-Q4-SEM-TAL-EMEA-Unified':'acceleration','2026-Q4-Customer-TryIt-NA':'expansion','2026-Q4-MM-All-NA':'expansion','2026-Q4-MM-All-EMEA':'expansion','2026-Q4-ENT-ICP-EMEA-Unified':'expansion'};
  const assignmentFor=row=>row.platform==='Google Ads'?'visibility':read(goalsKey)?.assignments?.[row.name]||defaultAssignments[row.name]||'';
  const campaignGroup=(channel,id)=>{
    const campaigns=rows.filter(row=>assignmentFor(row)===id&&row.platform===channel);
    return `<div class="company-map-channel"><div class="company-map-channel-head"><img src="${model.logo[channel]}" alt="${esc(channel)}"><span>${esc(channel)}</span><small>${campaigns.length} campaigns</small></div>${campaigns.length?`<ul>${campaigns.slice(0,2).map(row=>`<li>${esc(row.name)}</li>`).join('')}</ul>${campaigns.length>2?`<details><summary><span class="company-show-more">Show ${campaigns.length-2} more</span><span class="company-show-less">Show less</span></summary><ul>${campaigns.slice(2).map(row=>`<li>${esc(row.name)}</li>`).join('')}</ul></details>`:''}`:'<p>No campaigns mapped yet</p>'}</div>`;
  };
  const render=()=>{
    structure.querySelector('[data-company-map]').innerHTML=goals().map(goal=>{
      const meta=model.byId(goal.id);
      return `<article class="company-map-card" data-company-id="${goal.id}"><div class="company-map-heading"><div><span>INITIATIVE</span><h3>${esc(goal.name)}</h3><p>${esc(goal.goal)}</p></div><button type="button" data-company-edit="initiative" aria-label="Edit ${esc(goal.name)}">Edit</button></div><div class="company-map-motions"><div class="company-map-section-head"><strong>Motions</strong><button type="button" data-company-edit="motions">Edit</button></div><div class="company-motion-pills">${meta.motions.map(name=>`<span>${esc(name)}</span>`).join('')}</div></div><div class="company-map-channels"><div class="company-map-section-head"><strong>Channels</strong><button type="button" data-company-edit="channels">Edit channels</button></div><div class="company-map-channel-list">${meta.channels.map(channel=>campaignGroup(channel,goal.id)).join('')}</div><a href="Strategy.html#current-plan">Edit campaigns →</a></div></article>`;
    }).join('');
  };
  const saveGoal=(id,name,goal)=>{
    const review=read(reviewKey)||{label:'Initiatives',confirmed:false,goals:[]};
    review.goals=Array.isArray(review.goals)?review.goals:[];
    const existing=review.goals.find(item=>item.id===id);
    if(existing)Object.assign(existing,{initiative:name,title:goal});else review.goals.push({id,initiative:name,title:goal});
    localStorage.setItem(reviewKey,JSON.stringify(review));
    const configured=read(goalsKey);
    const current=configured?.goals?.find(item=>item.id===id);
    if(current){Object.assign(current,{initiative:name,title:goal});localStorage.setItem(goalsKey,JSON.stringify(configured))}
  };
  structure.addEventListener('click',event=>{
    const button=event.target.closest('[data-company-edit]');if(!button)return;
    const card=button.closest('[data-company-id]'),id=card.dataset.companyId,kind=button.dataset.companyEdit;
    card.querySelector('.company-structure-editor')?.remove();
    const meta=model.byId(id),goal=goals().find(item=>item.id===id);
    const form=document.createElement('form');form.className='company-structure-editor';
    if(kind==='initiative')form.innerHTML=`<label>Initiative name<input name="name" required maxlength="60" value="${esc(goal.name)}"></label><label>Goal<input name="goal" required maxlength="160" value="${esc(goal.goal)}"></label>`;
    if(kind==='motions')form.innerHTML=`<span>Choose motions</span><div class="company-channel-choices">${['Brand','Demand','Land','Expand'].map(name=>`<label><input type="checkbox" name="motion" value="${name}" ${meta.motions.includes(name)?'checked':''}>${name}</label>`).join('')}</div>`;
    if(kind==='channels')form.innerHTML=`<span>Choose channels</span><div class="company-channel-choices">${Object.entries(model.logo).map(([name,src])=>`<label><input type="checkbox" name="channel" value="${esc(name)}" ${meta.channels.includes(name)?'checked':''}><img src="${src}" alt="">${esc(name)}</label>`).join('')}</div>`;
    form.insertAdjacentHTML('beforeend','<p class="company-structure-editor-error" role="status"></p><div class="company-structure-editor-actions"><button type="submit">Save</button><button type="button" data-company-cancel>Cancel</button></div>');
    form.querySelector('[data-company-cancel]').addEventListener('click',()=>form.remove());
    form.addEventListener('submit',submit=>{
      submit.preventDefault();const data=new FormData(form);
      if(kind==='initiative')saveGoal(id,String(data.get('name')).trim(),String(data.get('goal')).trim());
      else {const selected=data.getAll(kind==='motions'?'motion':'channel');if(!selected.length){form.querySelector('[role=status]').textContent='Choose at least one.';return}const all=read(model.metadataKey)||{};all[id]={...(all[id]||{}),[kind]:selected};localStorage.setItem(model.metadataKey,JSON.stringify(all));model.byId=id=>{const entry=model.entries.find(item=>item.id===id),saved=all[id]||{};return entry?{...entry,motions:saved.motions||entry.motions,channels:saved.channels||entry.channels}:null}}
      render();
    });
    button.closest(kind==='initiative'?'.company-map-heading':kind==='motions'?'.company-map-motions':'.company-map-channels').append(form);
    form.querySelector('input')?.focus();
  });
  render();
  const tabs=[...document.querySelectorAll('.mojo-company-app .modulenav a')];
  const syncTab=()=>{const current=tabs.find(tab=>tab.hash===location.hash)||tabs[0];tabs.forEach(tab=>{tab.toggleAttribute('aria-current',tab===current);if(tab===current)tab.setAttribute('aria-current','location')})};
  window.addEventListener('hashchange',syncTab);syncTab();
  document.querySelectorAll('[data-company-chat]').forEach(button=>button.addEventListener('click',()=>window.MojoOpenChat?.(button.dataset.companyChat)));
});
