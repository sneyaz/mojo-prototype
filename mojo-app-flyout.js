/* The Apps destination in More opens installed workspaces and planned previews. */
(() => {
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();

  function init(){
    const triggerSelector='#mojo-more-menu a[href="Apps.html"], .ma-apps-toggle';
    let trigger=document.querySelector(triggerSelector);
    const menu=document.createElement('div');
    menu.id='mojo-app-flyout';
    menu.className='mojo-app-flyout';
    menu.hidden=true;
    menu.setAttribute('role','menu');
    menu.setAttribute('aria-label','Mojo apps');
    document.body.append(menu);
    const markTrigger=element=>{
      if(!element)return;
      element.setAttribute('aria-haspopup','menu');
      element.setAttribute('aria-controls',menu.id);
      element.setAttribute('aria-expanded',String(!menu.hidden));
    };
    markTrigger(trigger);
    requestAnimationFrame(()=>markTrigger(document.querySelector(triggerSelector)));
    const currentPath=location.pathname.split('/').pop().replace(/\.html$/,'')||'index';
    const currentApp=currentPath==='AppWorkspace'||currentPath==='AppPreview'
      ?new URLSearchParams(location.search).get('app')
      :['HomeSystem','Portfolio','BestPractices','Strategy','CampaignLifecycle'].includes(currentPath)?'campaigns':null;
    const boardConnected=localStorage.getItem('mojo-board-demandbase-connected-v1')==='true';
    const seenKey='mojo-board-app-seen-v1';
    let seen=new Set();
    try{seen=new Set(JSON.parse(localStorage.getItem(seenKey)||'[]'));}catch{}
    if(currentApp&&!seen.has(currentApp)){
      seen.add(currentApp);
      localStorage.setItem(seenKey,JSON.stringify([...seen]));
    }
    const escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
    const pinsKey='mojo-pinned-apps-v2';
    const defaultPins=['campaigns','aeo','audience-builder'];
    const readPins=()=>{
      try{
        const valid=new Set(MojoApps.apps().map(app=>app.id));
        const stored=localStorage.getItem(pinsKey);
        if(stored===null){
          let previous=[];
          try{previous=JSON.parse(localStorage.getItem('mojo-pinned-apps-v1')||'[]');}catch{}
          const seeded=defaultPins.filter(id=>valid.has(id));
          localStorage.setItem(pinsKey,JSON.stringify(seeded));
          return seeded;
        }
        const saved=JSON.parse(stored);
        return Array.isArray(saved)?defaultPins.filter(id=>valid.has(id)):defaultPins;
      }catch{return defaultPins;}
    };
    const appRoute=app=>app.status==='installed'?app.entryRoute:app.previewRoute;
    const markCurrentPinnedApp=rail=>{
      const current=rail.querySelector(`.mojo-pinned-app[data-pinned-app="${currentApp}"]`);
      if(!current)return;
      if(!current.classList.contains('mojo-nav-active'))current.classList.add('mojo-nav-active');
      if(current.getAttribute('aria-current')!=='page')current.setAttribute('aria-current','page');
    };
    const syncRail=()=>{
      const rail=document.querySelector('.rail');
      const appsDivider=rail?.querySelector('.mojo-nav-chat-divider');
      const moreButton=rail?.querySelector('.mojo-nav-more');
      if(!appsDivider||!moreButton||!window.MojoApps)return;
      let group=rail.querySelector('.mojo-pinned-apps');
      if(!group){
        group=document.createElement('div');
        group.className='mojo-pinned-apps';
        group.setAttribute('aria-label','Pinned apps');
        appsDivider.before(group);
      }
      const apps=new Map(MojoApps.apps().map(app=>[app.id,app]));
      const pins=readPins();
      group.replaceChildren(...pins.map(id=>{
        const app=apps.get(id);
        const link=document.createElement('a');
        link.className='mojo-pinned-app'+(app.status==='planned'?' is-preview':'')+(boardConnected&&!seen.has(id)?' mojo-board-new-app':'');
        link.dataset.pinnedApp=id;
        link.href=appRoute(app);
        link.setAttribute('aria-label',app.name+(app.status==='planned'?' preview':'')+(boardConnected&&!seen.has(id)?', new':''));
        link.dataset.navTooltip=app.name;
        link.innerHTML=`${MojoApps.icon(app.icon)}<span class="mojo-nav-label">${escape(app.name)}</span>`;
        if(id===currentApp){link.classList.add('mojo-nav-active');link.setAttribute('aria-current','page');}
        return link;
      }));
      group.hidden=!pins.length;
      if(pins.includes(currentApp)){
        markCurrentPinnedApp(rail);
        rail.querySelectorAll('.mojo-nav-active').forEach(element=>{
          if(!element.matches('.mojo-pinned-app')){
            element.classList.remove('mojo-nav-active');
            element.removeAttribute('aria-current');
          }
        });
      }else if(currentApp){
        moreButton.classList.add('mojo-nav-active');
        moreButton.setAttribute('aria-current','true');
      }
    };
    let closeTimer;
    const render=()=>{
      const apps=MojoApps.apps();
      const pins=new Set(readPins());
      const installed=apps.filter(app=>app.status==='installed');
      const planned=apps.filter(app=>app.status==='planned');
      const row=(app,preview)=>`<div class="mojo-app-flyout-item"><a class="mojo-app-flyout-row${app.id===currentApp?' is-current':''}" role="menuitem" href="${appRoute(app)}"${app.id===currentApp?' aria-current="page"':''}><span class="mojo-app-flyout-icon">${MojoApps.icon(app.icon)}</span><span class="mojo-app-flyout-copy"><strong>${escape(app.name)}</strong><small>${preview?'Workflow preview':'Open workspace'}</small></span></a><button type="button" class="mojo-app-pin${pins.has(app.id)?' is-pinned':''}" data-pin-app="${app.id}" role="menuitemcheckbox" aria-checked="${pins.has(app.id)}" aria-label="${pins.has(app.id)?'Unpin':'Pin'} ${escape(app.name)} ${preview?'preview ':''}${pins.has(app.id)?'from':'to'} navigation" title="${pins.has(app.id)?'Unpin from':'Pin to'} navigation"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3h6l-1 6 3 3v2H7v-2l3-3-1-6Z"/><path d="M12 14v7"/></svg></button></div>`;
      menu.innerHTML=`<div class="mojo-app-flyout-head"><strong>Apps</strong><span>${installed.length} installed</span></div><div class="mojo-app-flyout-section"><span class="mojo-app-flyout-label">INSTALLED</span>${installed.map(app=>row(app,false)).join('')}</div>${planned.length?`<div class="mojo-app-flyout-section"><span class="mojo-app-flyout-label">PREVIEWS</span>${planned.map(app=>row(app,true)).join('')}</div>`:''}<a class="mojo-app-flyout-all" role="menuitem" href="Apps.html">View all apps</a>`;
    };
    const position=()=>{
      const box=trigger.getBoundingClientRect();
      const width=menu.getBoundingClientRect().width;
      const height=menu.getBoundingClientRect().height;
      const left=box.right+10+width<window.innerWidth?box.right+10:box.left-width-10;
      menu.style.left=`${Math.max(8,left)}px`;
      menu.style.top=`${Math.max(8,Math.min(box.top-12,window.innerHeight-height-8))}px`;
    };
    const close=(restoreFocus=false)=>{
      clearTimeout(closeTimer);
      if(menu.hidden)return;
      menu.hidden=true;
      trigger?.setAttribute('aria-expanded','false');
      if(restoreFocus)trigger?.focus();
    };
    const open=(focusFirst=true)=>{
      if(!window.MojoApps)return;
      clearTimeout(closeTimer);
      render();
      for(const selector of ['#mojo-canvas-menu','#mojo-manage-menu']){
        const other=document.querySelector(selector);
        if(other&&!other.hidden){
          other.hidden=true;
          document.querySelector(`[aria-controls="${other.id}"]`)?.setAttribute('aria-expanded','false');
        }
      }
      menu.hidden=false;
      trigger.setAttribute('aria-expanded','true');
      position();
      if(focusFirst)menu.querySelector('[role="menuitem"]')?.focus();
    };
    document.addEventListener('click',event=>{
      const clicked=event.target.closest(triggerSelector);
      if(!clicked)return;
      event.preventDefault();
      trigger=clicked;
      markTrigger(trigger);
      if(menu.hidden)open();
      else{
        clearTimeout(closeTimer);
        menu.querySelector('[role="menuitem"]')?.focus();
      }
    },true);
    document.addEventListener('pointerover',event=>{
      if(event.pointerType!=='mouse')return;
      const hovered=event.target.closest(triggerSelector);
      if(hovered){
        trigger=hovered;
        markTrigger(trigger);
        clearTimeout(closeTimer);
        if(menu.hidden)open(false);
        else position();
      }else if(menu.contains(event.target))clearTimeout(closeTimer);
    });
    document.addEventListener('pointerout',event=>{
      if(event.pointerType!=='mouse'||menu.hidden)return;
      const fromTrigger=event.target.closest(triggerSelector);
      const fromMenu=menu.contains(event.target);
      if(!fromTrigger&&!fromMenu)return;
      const next=event.relatedTarget;
      if((fromTrigger&&fromTrigger.contains(next))||(fromMenu&&menu.contains(next)))return;
      if((fromTrigger&&menu.contains(next))||(fromMenu&&trigger?.contains(next)))return;
      clearTimeout(closeTimer);
      closeTimer=setTimeout(()=>close(),220);
    });
    document.addEventListener('pointerdown',event=>{
      if(!menu.hidden&&!menu.contains(event.target)&&!trigger.contains(event.target))close();
    });
    document.addEventListener('keydown',event=>{
      if(event.key==='Escape'&&!menu.hidden){event.preventDefault();close(true);}
    });
    menu.addEventListener('click',event=>{
      const button=event.target.closest('[data-pin-app]');
      if(!button)return;
      const id=button.dataset.pinApp;
      const pins=readPins();
      const next=pins.includes(id)?pins.filter(pin=>pin!==id):[...pins,id];
      try{localStorage.setItem(pinsKey,JSON.stringify(next));}catch{return;}
      syncRail();
      render();
      menu.querySelector(`[data-pin-app="${id}"]`)?.focus();
      position();
    });
    menu.addEventListener('keydown',event=>{
      if(!['ArrowDown','ArrowUp','Home','End'].includes(event.key))return;
      event.preventDefault();
      const items=[...menu.querySelectorAll('[role="menuitem"],[role="menuitemcheckbox"]')];
      const index=items.indexOf(document.activeElement);
      const next=event.key==='Home'?0:event.key==='End'?items.length-1:(index+(event.key==='ArrowDown'?1:items.length-1))%items.length;
      items[next]?.focus();
    });
    window.addEventListener('resize',()=>{if(!menu.hidden)position();});
    window.addEventListener('mojo:app-installed',()=>{syncRail();if(!menu.hidden){render();position();}});
    window.addEventListener('storage',event=>{if([pinsKey,'mojo-installed-apps-v1'].includes(event.key)){syncRail();if(!menu.hidden){render();position();}}});
    const rail=document.querySelector('.rail');
    if(rail){
      new MutationObserver(()=>{
        if(!rail.querySelector('.mojo-pinned-apps'))requestAnimationFrame(syncRail);
        if(readPins().includes(currentApp)){
          markCurrentPinnedApp(rail);
          rail.querySelectorAll('.mojo-nav-active:not(.mojo-pinned-app)').forEach(element=>{
            element.classList.remove('mojo-nav-active');
            element.removeAttribute('aria-current');
          });
        }
      }).observe(rail,{childList:true,attributes:true,attributeFilter:['class','aria-current','aria-label','title'],subtree:true});
      requestAnimationFrame(syncRail);
    }
  }
})();
