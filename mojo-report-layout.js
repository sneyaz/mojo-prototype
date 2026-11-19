/* Put report filters beside each view. */
document.addEventListener('DOMContentLoaded',()=>{
  const root=document.querySelector('.ia-portfolio');
  if(!root)return;
  const ensureSlot=(panel,view)=>{
    if(view==='goals')return panel.querySelector('.mg-head-actions');
    if(view==='channels')return panel.querySelector('.mrc-head-actions');
    if(view==='campaigns'){
      const heading=panel.querySelector('.md-omni-view>.md-table-head');
      if(!heading)return null;
      let slot=heading.querySelector('.mrl-campaign-actions');
      if(!slot){slot=document.createElement('div');slot.className='mrl-campaign-actions';heading.append(slot)}
      return slot;
    }
    if(view==='quarterly'){
      const heading=panel.querySelector('.mqr-page-heading');
      if(!heading)return null;
      let slot=heading.querySelector('.mqr-page-actions');
      if(!slot){slot=document.createElement('div');slot.className='mqr-page-actions';heading.append(slot)}
      return slot;
    }
    if(view==='creative'){
      let slot=panel.querySelector('.md-creative-toolbar');
      if(!slot){
        slot=document.createElement('div');
        slot.className='md-creative-toolbar';
        (panel.querySelector('.cr-table-wrap')||panel.querySelector('.md-table-wrap'))?.before(slot);
      }
      return slot;
    }
    let slot=panel.querySelector(':scope > .mrl-controls');
    if(!slot){slot=document.createElement('div');slot.className='mrl-controls';panel.prepend(slot)}
    return slot;
  };
  const sync=()=>{
    const toolbar=root.querySelector('.mf-dashboard-toolbar'),view=root.querySelector('#ia-lens')?.value;
    const panel=root.querySelector('#ia-panel-'+view);
    if(!toolbar||!panel)return;
    const scope=root.querySelector('.md-omni-scope');
    const quarterScope=root.querySelector('.mqr-control');
    const range=root.querySelector('.mf-dashboard-range');
    const slot=ensureSlot(panel,view);
    if(scope){scope.hidden=!['goals','campaigns'].includes(view);if(!scope.hidden&&slot&&scope.parentElement!==slot)slot.append(scope)}
    if(quarterScope){quarterScope.hidden=view!=='quarterly';if(!quarterScope.hidden&&slot&&quarterScope.parentElement!==slot)slot.append(quarterScope)}
    if(range){range.hidden=view==='accounts';if(slot&&range.parentElement!==slot)slot.append(range)}
  };
  document.addEventListener('mojo:goals-rendered',()=>requestAnimationFrame(sync));
  document.addEventListener('mojo:report-channels-rendered',()=>requestAnimationFrame(sync));
  root.addEventListener('click',event=>{if(event.target.closest('[data-dashboard-tab]'))setTimeout(sync,0)});
  window.addEventListener('hashchange',()=>requestAnimationFrame(sync));
  requestAnimationFrame(()=>requestAnimationFrame(sync));
});
