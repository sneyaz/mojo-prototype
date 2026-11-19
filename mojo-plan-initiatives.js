/* Confirm or revise inferred campaign initiatives from Plan. */
(() => {
  if (location.pathname.split('/').pop() !== 'Strategy.html') return;
  const reviewKey='mojo-initiative-review-v1';
  const goalsKey='mojo-campaign-goals-v1';
  const undoKey='mojo-initiative-review-undo-v1';
  const defaults=[
    {id:'visibility',initiative:'Q4 net-new pipeline',title:'Create qualified pipeline from net-new accounts'},
    {id:'expansion',initiative:'Customer Growth',title:'Open expansion opportunities in existing customers'},
    {id:'coverage',initiative:'Event Demand Generation',title:'Turn event interest into qualified engagement'},
    {id:'acceleration',initiative:'Buying-Group Coverage',title:'Reach missing buyers and create meetings'}
  ];
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const read=key=>{try{return JSON.parse(localStorage.getItem(key)||'null')}catch{return null}};
  const current=()=>{const saved=read(reviewKey),configured=read(goalsKey);const core=defaults.map(goal=>{const merged={...goal,...configured?.goals?.find(item=>item.id===goal.id),...saved?.goals?.find(item=>item.id===goal.id)};if(['Brand','Demand','Land','Expand'].includes(merged.initiative))merged.initiative=goal.initiative;if(['Reach the right target accounts','Increase qualified engagement','Turn buying-group engagement into meetings','Open customer expansion opportunities'].includes(merged.title))merged.title=goal.title;return merged});const extras=new Map();[...(configured?.goals||[]),...(saved?.goals||[])].forEach(goal=>{if(!defaults.some(item=>item.id===goal.id))extras.set(goal.id,goal)});return {label:saved?.label||configured?.groupingLabel||'Initiatives',confirmed:!!saved?.confirmed,goals:[...core,...extras.values()]}};
  function save(state){
    localStorage.setItem(undoKey,JSON.stringify({review:localStorage.getItem(reviewKey),goals:localStorage.getItem(goalsKey)}));
    const saved={label:state.label,goals:state.goals,confirmed:true};
    localStorage.setItem(reviewKey,JSON.stringify(saved));
    const configured=read(goalsKey);
    if(configured?.goals&&configured?.assignments){configured.goals=configured.goals.map(goal=>({...goal,...saved.goals.find(item=>item.id===goal.id)}));saved.goals.filter(goal=>!configured.goals.some(item=>item.id===goal.id)).forEach(goal=>configured.goals.push({metric:'Campaigns',period:'Q4',tone:'purple',target:null,...goal}));configured.groupingLabel=saved.label;localStorage.setItem(goalsKey,JSON.stringify(configured))}
    window.dispatchEvent(new CustomEvent('mojo:initiative-review-saved',{detail:saved}));
    return saved;
  }
  function mount(){
    const section=document.querySelector('.mf-strategy .mso-initiative-actions');
    if(!section)return false;
    if(section.dataset.bound)return true;
    section.dataset.bound='true';
    const update=()=>{const state=current();section.classList.toggle('is-confirmed',state.confirmed);section.querySelector('[data-initiative-approve]').hidden=state.confirmed;section.querySelector('[data-initiative-chat]').hidden=state.confirmed};
    section.querySelector('[data-initiative-approve]').addEventListener('click',()=>{save(current());update()});
    section.querySelectorAll('[data-initiative-chat]').forEach(button=>button.addEventListener('click',()=>{
      window.MojoOpenChat?.('',false);
      const body=document.querySelector('.chatpane .chatbody');if(!body)return;
      body.querySelector('.seq-chat-empty')?.remove();body.querySelector('.mso-initiative-chat-panel')?.remove();
      const state=current(),panel=document.createElement('section');panel.className='mso-initiative-chat-panel';
      panel.innerHTML=`<h2>Review campaign groups</h2><p>Confirm what your team calls these groups and the goal for each one.</p><form><fieldset><legend>Grouping name</legend>${['Initiatives','Programs','Other'].map(name=>`<label><input type="radio" name="labelChoice" value="${name}" ${state.label===name||name==='Other'&&!['Initiatives','Programs'].includes(state.label)?'checked':''}>${name}</label>`).join('')}<input name="otherLabel" maxlength="32" aria-label="Other grouping name" placeholder="Your term" value="${['Initiatives','Programs'].includes(state.label)?'':esc(state.label)}"></fieldset><div class="mso-initiative-chat-goals">${state.goals.map(goal=>`<div data-goal-id="${esc(goal.id)}"><label>Group<input name="name_${goal.id}" required maxlength="48" value="${esc(goal.initiative)}"></label><label>Goal<input name="goal_${goal.id}" required maxlength="100" value="${esc(goal.title)}"></label></div>`).join('')}</div><button type="button" class="mso-add-initiative" data-add-initiative>+ Add initiative</button><button type="submit">Save groups and goals</button></form>`;
      body.append(panel);panel.scrollIntoView({block:'nearest',behavior:'smooth'});
      const choice=panel.querySelector('[name="labelChoice"]:checked');
      const other=panel.querySelector('[name="otherLabel"]');
      const syncOther=()=>{other.hidden=panel.querySelector('[name="labelChoice"]:checked')?.value!=='Other';other.required=!other.hidden};
      panel.querySelectorAll('[name="labelChoice"]').forEach(input=>input.addEventListener('change',syncOther));
      if(choice)syncOther();
      panel.querySelector('[data-add-initiative]').addEventListener('click',()=>{const id=`goal-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,5)}`;panel.querySelector('.mso-initiative-chat-goals').insertAdjacentHTML('beforeend',`<div data-goal-id="${id}"><label>Group<input name="name_${id}" required maxlength="48" placeholder="Initiative name"></label><label>Goal<input name="goal_${id}" required maxlength="100" placeholder="What should this achieve?"></label></div>`);panel.querySelector(`[name="name_${id}"]`)?.focus()});
      panel.querySelector('form').addEventListener('submit',event=>{
        event.preventDefault();const data=new FormData(event.currentTarget);
        const label=data.get('labelChoice')==='Other'?String(data.get('otherLabel')||'').trim():String(data.get('labelChoice')||'Initiatives');
        if(!label){other.focus();return}
        const goals=[...panel.querySelectorAll('[data-goal-id]')].map(row=>{const id=row.dataset.goalId;return {id,initiative:String(data.get(`name_${id}`)||'').trim(),title:String(data.get(`goal_${id}`)||'').trim()}});
        if(goals.some(goal=>!goal.initiative||!goal.title))return;
        save({label,goals});update();
        panel.innerHTML='<h2>Initiatives confirmed</h2><p>The names and goals now appear in Plan and Report.</p>';
      });
    }));
    window.addEventListener('mojo:initiative-review-saved',update);
    update();return true;
  }
  const start=()=>{if(mount())return;const observer=new MutationObserver(()=>{if(mount())observer.disconnect()});observer.observe(document.body,{childList:true,subtree:true})};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
