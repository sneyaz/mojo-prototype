/* Current Plan owns initiative configuration and campaign grouping. */
(() => {
  if (location.pathname.split('/').pop() !== 'Strategy.html') return;
  const goalsKey='mojo-campaign-goals-v1', reviewKey='mojo-initiative-review-v1';
  const defaults=[
    {id:'visibility',initiative:'Q4 net-new pipeline',title:'Create qualified pipeline from net-new accounts',metric:'Ads Served',target:1200000,period:'Q4',tone:'blue'},
    {id:'expansion',initiative:'Customer Growth',title:'Open expansion opportunities in existing customers',metric:'Expansion Opportunities',target:null,period:'Q4',tone:'orange'},
    {id:'coverage',initiative:'Event Demand Generation',title:'Turn event interest into qualified engagement',metric:'Conversions',target:null,period:'Q4',tone:'purple'},
    {id:'acceleration',initiative:'Buying-Group Coverage',title:'Reach missing buyers and create meetings',metric:'Meetings Set',target:null,period:'Q4',tone:'purple'}
  ];
  const defaultAssignments={'GO Prep':'visibility','MOF — Patient Payments':'visibility','2026-Q4-eBook-ConnectedGTM':'visibility','2026-Q4-CTV-ICP-Roku':'visibility','2026-Q4-EMEA-Benelux':'visibility','Q4 Enterprise Pipeline':'coverage','Q4 Pipeline Search':'visibility','2026-Q4-EMEA-TAL-ABX':'coverage','2026-Q4-ENT-TAL-NA-ABX':'coverage','2026-Q4-HC-ICP-NA-Display':'coverage','2026-Q4-MFG-TAL-NA-ABX':'coverage','Enterprise Retargeting':'visibility','2026-Q4-Retargeting-Pricing-Page':'acceleration','2026-Q4-SEM-ICP-NA-AI':'acceleration','2026-Q4-SEM-ICP-EMEA-AI':'acceleration','2026-Q4-SEM-TAL-EMEA-Unified':'acceleration','2026-Q4-Customer-TryIt-NA':'expansion','2026-Q4-MM-All-NA':'expansion','2026-Q4-MM-All-EMEA':'expansion','2026-Q4-ENT-ICP-EMEA-Unified':'expansion'};
  const icon={'Demandbase Ads':'assets/demandbase.png','Google Ads':'assets/google-ads.svg','LinkedIn Ads':'assets/linkedin.png'};
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const read=key=>{try{return JSON.parse(localStorage.getItem(key)||'null')}catch{return null}};
  let root,rows=[],state,view='current',dragged='';
  const review=()=>read(reviewKey);
  const getState=()=>{
    const saved=read(goalsKey),confirmed=review();
    const base=saved?.goals&&saved?.assignments?saved:{goals:defaults.map(goal=>({...goal})),assignments:{...defaultAssignments},groupingLabel:'Initiatives',schema:7};
    base.goals=defaults.map(goal=>{const saved=base.goals.find(item=>item.id===goal.id),reviewed=confirmed?.goals?.find(item=>item.id===goal.id);const combined={...goal,...saved,...reviewed};if(['Brand','Demand','Land','Expand'].includes(combined.initiative))combined.initiative=goal.initiative;if(['Reach the right target accounts','Increase qualified engagement','Turn buying-group engagement into meetings','Open customer expansion opportunities'].includes(combined.title))combined.title=goal.title;return combined}).concat(base.goals.filter(goal=>!defaults.some(item=>item.id===goal.id)),(confirmed?.goals||[]).filter(goal=>!defaults.some(item=>item.id===goal.id)&&!base.goals.some(item=>item.id===goal.id)).map(goal=>({metric:'Campaigns',period:'Q4',tone:'purple',target:null,...goal})));
    base.groupingLabel=confirmed?.label||base.groupingLabel||'Initiatives';
    return base;
  };
  const save=()=>{localStorage.setItem(goalsKey,JSON.stringify(state));window.dispatchEvent(new CustomEvent('mojo:plan-organization-saved',{detail:state}));};
  const hashView=()=>/^(#current-plan|#initiative-|#campaign-group)/.test(location.hash)?'current':'ideas';
  const setView=(next,updateHash=false)=>{
    view=next;
    root.querySelector('#mcp-current').hidden=next!=='current';
    root.querySelector('#mcp-ideas').hidden=next!=='ideas';
    root.querySelectorAll('[data-mcp-view]').forEach(button=>{const on=button.dataset.mcpView===next;button.setAttribute('aria-selected',String(on));button.tabIndex=on?0:-1});
    if(updateHash)history.replaceState(null,'',next==='current'?'#current-plan':'#ideas');
  };
  const campaignRow=row=>{
    const assigned=state.assignments[row.name]||'';
    const selected=state.goals.find(goal=>goal.id===assigned);
    return `<li class="mg-campaign-item" data-mcp-campaign="${esc(row.name)}"><span class="mg-drag-handle" draggable="true" data-mcp-drag aria-label="Drag ${esc(row.name)} to an initiative" title="Drag campaign">⠿</span><a class="mg-campaign-link" draggable="true" data-mcp-drag href="Portfolio.html#campaign=${encodeURIComponent(row.name)}&tab=overview" aria-label="Open ${esc(row.name)} campaign"><span class="mg-platform"><img src="${icon[row.platform]||icon['Demandbase Ads']}" alt="" draggable="false"></span><span class="mg-campaign-name"><strong>${esc(row.name)}</strong><small>${esc(row.platform)}${row.channel&&row.channel!=='Format unknown'?` · ${esc(row.channel)}`:''}</small></span></a><span class="mg-campaign-clicks">—</span><span class="mg-campaign-spend">${esc(row.spend)}</span><div class="mg-goal-picker"><button type="button" class="mg-picker-trigger" data-mcp-picker aria-expanded="false" aria-haspopup="listbox" aria-label="Initiative for ${esc(row.name)}"><span>${esc(selected?.initiative||'No goal')}</span><svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 7 5 5 5-5"/></svg></button><div class="mg-picker-list" role="listbox" aria-label="Choose initiative for ${esc(row.name)}" hidden><button type="button" role="option" aria-selected="${!selected}" data-mcp-choice="" data-mcp-name="${esc(row.name)}">No goal</button>${state.goals.map(goal=>`<button type="button" role="option" aria-selected="${selected?.id===goal.id}" data-mcp-choice="${esc(goal.id)}" data-mcp-name="${esc(row.name)}">${esc(goal.initiative)}</button>`).join('')}</div></div></li>`;
  };
  const compactCampaignRow=row=>`<li class="mg-campaign-item mg-drop-campaign" data-mcp-campaign="${esc(row.name)}"><span class="mg-drag-handle" draggable="true" data-mcp-drag aria-label="Drag ${esc(row.name)} to another initiative" title="Drag campaign">⠿</span><a draggable="true" data-mcp-drag href="Portfolio.html#campaign=${encodeURIComponent(row.name)}&tab=overview" aria-label="Open ${esc(row.name)} campaign"><img src="${icon[row.platform]||icon['Demandbase Ads']}" alt="" draggable="false"><span>${esc(row.name)}</span></a></li>`;
  const render=()=>{
    state=getState();
    window.MojoInitiativeCounts=Object.fromEntries(state.goals.map(goal=>[goal.id,rows.filter(row=>state.assignments[row.name]===goal.id).length]));
    const ideaIds={capture:'visibility',customer_growth:'expansion',regional:'coverage',buying_group:'acceleration'};
    root.querySelectorAll('.mso-initiative-options [data-area]').forEach(button=>{const count=window.MojoInitiativeCounts[ideaIds[button.dataset.area]];const label=button.querySelector('.mso-area-count');if(label&&count!=null)label.textContent=`${count} ${count===1?'campaign':'campaigns'}`});
    root.querySelector('#mcp-initiatives-heading').textContent=state.groupingLabel;
    root.querySelector('[data-mcp-initiatives]').innerHTML=state.goals.map(goal=>{const structure=window.MojoInitiatives?.byId(goal.id);return `<article class="mcp-initiative" id="initiative-${esc(goal.id)}"><div class="mcp-initiative-copy"><div class="mcp-initiative-heading"><h3>${esc(goal.initiative)}</h3><button type="button" data-mcp-edit="${esc(goal.id)}" aria-label="Edit ${esc(goal.initiative)} initiative">Edit</button></div><p>${esc(goal.title)}</p></div>${structure?`<div class="mcp-initiative-meta"><div class="mcp-structure-row"><span class="mcp-structure-label">Motions</span><span class="mcp-motion-list">${structure.motions.map(name=>`<span>${esc(name)}</span>`).join('')}</span></div><div class="mcp-structure-row"><span class="mcp-structure-label">Channels</span><span class="mcp-channel-line"><span class="mcp-channel-list" aria-label="Channels: ${esc(structure.channels.join(', '))}">${structure.channels.map(name=>`<img src="${icon[name]}" alt="${esc(name)}" title="${esc(name)}">`).join('')}</span><span class="mcp-campaign-count">${rows.filter(row=>state.assignments[row.name]===goal.id).length} campaigns</span></span></div></div>`:`<span class="mcp-campaign-count">${rows.filter(row=>state.assignments[row.name]===goal.id).length} campaigns</span>`}</article>`}).join('');
    root.querySelector('[data-mcp-buckets]').innerHTML=state.goals.map(goal=>`<div class="mg-drop-goal" data-mcp-drop="${esc(goal.id)}"><div class="mg-drop-heading"><div><span>${esc(goal.initiative)}</span><strong>${esc(goal.title)}</strong></div></div><ul>${rows.filter(row=>state.assignments[row.name]===goal.id).map(compactCampaignRow).join('')}</ul></div>`).join('');
    const unassigned=rows.filter(row=>!state.goals.some(goal=>goal.id===state.assignments[row.name]));
    root.querySelector('[data-mcp-unassigned]').dataset.mcpDrop='';
    root.querySelector('[data-mcp-unassigned]').innerHTML=`<h3>${unassigned.length} ${unassigned.length===1?'campaign needs':'campaigns need'} an initiative</h3>${unassigned.length?`<div class="mg-pool-columns"><span>Campaign</span><span>Spend</span><span>Initiative</span></div><ul>${unassigned.map(campaignRow).join('')}</ul>`:'<p>Every campaign has an initiative. Drag one here to unassign it.</p>'}`;
  };
  const openEditor=(id='')=>{
    const goal=state.goals.find(item=>item.id===id);
    window.MojoOpenChat?.('',false);
    const body=document.querySelector('.chatpane .chatbody');if(!body)return;
    body.querySelector('.mcp-editor')?.remove();body.querySelector('.seq-chat-empty')?.remove();
    const panel=document.createElement('section');panel.className='mcp-editor';
    const names=state.goals.map(item=>item.initiative);
    const namesList=names.length>1?`${names.slice(0,-1).join(', ')}${names.length>2?',':''} and ${names[names.length-1]}`:names.join('');
    const intro=goal?`Update the name or goal for ${esc(goal.initiative)} below.`:`You're tracking ${names.length} initiative${names.length===1?'':'s'} today — ${esc(namesList)}. Let's add one more: give it a name and the goal it should support.`;
    panel.innerHTML=`<h2>${goal?`Edit ${esc(goal.initiative)}`:'Add an initiative'}</h2><p>${intro}</p><form><label>Initiative name<input name="name" maxlength="60" required value="${esc(goal?.initiative||'')}"></label><label>Goal<input name="goal" maxlength="120" required value="${esc(goal?.title||'')}"></label><label>Measure<input name="metric" maxlength="60" value="${esc(goal?.metric||'')}"></label><label>Time frame<input name="period" maxlength="60" value="${esc(goal?.period||'Q4')}"></label><button type="submit">Save initiative</button></form>`;
    panel.querySelector('form').addEventListener('submit',event=>{
      event.preventDefault();const data=new FormData(event.currentTarget);
      const target=goal||{id:`goal-${Date.now().toString(36)}`,tone:'purple',target:null,current:null,source:'Connect an outcome source to report progress'};
      target.initiative=String(data.get('name')).trim();target.title=String(data.get('goal')).trim();target.metric=String(data.get('metric')).trim()||'Campaigns';target.period=String(data.get('period')).trim()||'Q4';
      if(!target.initiative||!target.title)return;
      if(!goal)state.goals.push(target);
      const previous=review();
      if(defaults.some(item=>item.id===target.id)){
        const next={label:previous?.label||state.groupingLabel,confirmed:true,goals:defaults.map(item=>{const current=state.goals.find(entry=>entry.id===item.id);return {id:item.id,initiative:current.initiative,title:current.title}})};
        localStorage.setItem(reviewKey,JSON.stringify(next));
        localStorage.setItem(goalsKey,JSON.stringify(state));
        window.dispatchEvent(new CustomEvent('mojo:initiative-review-saved',{detail:next}));
      }else{
        localStorage.setItem(goalsKey,JSON.stringify(state));
      }
      render();panel.innerHTML=`<h2>Initiative saved</h2><p>${esc(target.initiative)} · ${esc(target.title)}</p>`;
    });
    body.append(panel);panel.scrollIntoView({block:'nearest',behavior:'smooth'});panel.querySelector('input')?.focus();
  };
  const assign=(name,id)=>{if(id)state.assignments[name]=id;else delete state.assignments[name];save();render();};
  const mount=async()=>{
    root=document.querySelector('.mf-strategy');if(!root?.querySelector('.mcp-tabs')||root.dataset.mcpMounted)return false;
    root.dataset.mcpMounted='true';
    try{const response=await fetch(new URL('mojo-plan-campaigns.json',document.baseURI));if(!response.ok)throw Error('Campaign list unavailable');rows=await response.json();}catch(error){console.error(error);root.querySelector('[data-mcp-unassigned]').textContent='Campaigns could not load. Refresh to try again.';}
    render();setView(location.hash===''?'current':hashView());
    root.addEventListener('click',event=>{
      const tab=event.target.closest('[data-mcp-view]');if(tab){setView(tab.dataset.mcpView,true);return;}
      const edit=event.target.closest('[data-mcp-edit]');if(edit){openEditor(edit.dataset.mcpEdit);return;}
      if(event.target.closest('[data-mcp-edit-all]')){root.querySelector('[data-initiative-chat]')?.click();return;}
      if(event.target.closest('[data-mcp-add]'))openEditor();
      const picker=event.target.closest('[data-mcp-picker]');if(picker){const menu=picker.nextElementSibling,opening=menu.hidden;root.querySelectorAll('.mg-picker-list').forEach(item=>{item.hidden=true;item.previousElementSibling.setAttribute('aria-expanded','false')});menu.hidden=!opening;picker.setAttribute('aria-expanded',String(opening));return;}
      const choice=event.target.closest('[data-mcp-choice]');if(choice){assign(choice.dataset.mcpName,choice.dataset.mcpChoice);return;}
    });
    root.addEventListener('dragstart',event=>{const handle=event.target.closest('[data-mcp-drag]');if(!handle)return;const item=handle.closest('[data-mcp-campaign]');if(!item)return;dragged=item.dataset.mcpCampaign;event.dataTransfer.effectAllowed='move';event.dataTransfer.setData('text/plain',dragged);const preview=document.createElement('div');preview.className='mcp-drag-preview';preview.textContent=dragged;document.body.append(preview);event.dataTransfer.setDragImage(preview,12,15);setTimeout(()=>preview.remove(),0);item.classList.add('mg-dragging');});
    root.addEventListener('dragover',event=>{const target=event.target.closest('[data-mcp-drop]');if(!target||!dragged)return;event.preventDefault();root.querySelectorAll('.mg-drop-ready').forEach(node=>node.classList.remove('mg-drop-ready'));target.classList.add('mg-drop-ready');});
    root.addEventListener('drop',event=>{const target=event.target.closest('[data-mcp-drop]');if(!target||!dragged)return;event.preventDefault();const name=dragged;dragged='';assign(name,target.dataset.mcpDrop);});
    root.addEventListener('dragend',()=>{dragged='';root.querySelectorAll('.mg-drop-ready,.mg-dragging').forEach(node=>node.classList.remove('mg-drop-ready','mg-dragging'));});
    window.addEventListener('hashchange',()=>setView(hashView()));
    window.addEventListener('mojo:initiative-review-saved',render);
    return true;
  };
  const start=()=>{if(document.querySelector('.mf-strategy .mcp-tabs')){mount();return}const observer=new MutationObserver(()=>{if(document.querySelector('.mf-strategy .mcp-tabs')){observer.disconnect();mount()}});observer.observe(document.documentElement,{childList:true,subtree:true})};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
