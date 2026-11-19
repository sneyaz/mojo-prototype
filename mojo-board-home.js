(() => {
  try { if (localStorage.getItem('mojo-board-demandbase-connected-v1') !== 'true') return; } catch { return; }
  const mount = () => {
    const feed = document.getElementById('home-feed');
    if (!feed) return;
    let intro = feed.querySelector(':scope > .board-home-intro');
    if (!intro) {
      intro = document.createElement('section');
      intro.className = 'board-home-intro';
      intro.setAttribute('aria-label', 'Acme workspace ready');
      intro.innerHTML = `<p class="board-home-summary">Mojo has read what is running and found where your team may need to act next.</p><div class="board-home-links"><a href="Portfolio.html#campaigns">42 live campaigns</a><span aria-hidden="true">·</span><a href="Portfolio.html#campaigns">$180K in Q4 flights</a><span aria-hidden="true">·</span><a href="AppWorkspace.html?app=audience-builder#report">3 audiences</a></div>`;
    }
    const greeting = feed.querySelector(':scope > .mfd-feed-greeting');
    const introTarget = greeting ? greeting.nextElementSibling : feed.firstElementChild;
    if (introTarget !== intro) (greeting ? greeting.after(intro) : feed.prepend(intro));
    feed.querySelector(':scope > .board-home-apps')?.remove();
    const filter=document.querySelector('.home-source-filter');
    if(filter&&filter.parentElement!==feed.parentElement)feed.before(filter);
  };
  const seedChat = () => {
    const body=document.querySelector('#home-chat-pane .chatbody');
    if(!body||body.querySelector('.board-home-chat'))return;
    const message=document.createElement('section');
    message.className='board-home-chat';
    message.innerHTML='<small><img src="assets/demandbase.png" alt=""> DEMANDBASE CONNECTED</small><p>Your campaigns, audiences and buyer signals are in view.</p><div class="board-home-current" aria-live="polite"><span class="board-home-current-mark"></span><div><em>ON YOUR CANVAS</em><strong>Your workspace is ready.</strong><a href="Company.html">Review Acme context →</a></div></div>';
    body.prepend(message);
  };
  let cardObserver;
  const revealFeed=()=>{
    const feed=document.getElementById('home-feed');
    const scroll=document.querySelector('.home-scroll');
    if(!feed||!scroll)return;
    cardObserver?.disconnect();
    const cards=[...feed.querySelectorAll('.home-card')];
    cards.forEach((card,index)=>{
      card.classList.add('board-feed-reveal');
      card.style.setProperty('--board-feed-order',String(Math.min(index,5)));
      if(card.dataset.boardRevealed==='true')card.classList.add('is-lit');
      else card.classList.remove('is-lit');
    });
    cardObserver=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(!entry.isIntersecting)return;
        const card=entry.target;
        card.dataset.boardRevealed='true';
        card.classList.add('is-lit');
        cardObserver.unobserve(card);
        const title=card.querySelector('h3')?.textContent?.trim();
        const source=card.querySelector('.home-source')?.textContent?.trim();
        const current=document.querySelector('.board-home-current');
        if(current&&title){
          current.querySelector('em').textContent=source?`${source.toUpperCase()} · ON YOUR CANVAS`:'ON YOUR CANVAS';
          current.querySelector('strong').textContent=title;
          const target=card.querySelector('h3 a');
          const link=current.querySelector('a');
          if(target&&link){link.href=target.getAttribute('href');link.textContent='Open this work →';}
        }
      });
    },{root:['auto','scroll'].includes(getComputedStyle(scroll).overflowY)?scroll:null,rootMargin:'0px 0px -6% 0px',threshold:.12});
    cards.forEach(card=>{if(card.dataset.boardRevealed!=='true')cardObserver.observe(card);});
  };
  const setupTabs=()=>{const strip=document.querySelector('.home-tabs');if(!strip)return;const move=tab=>{if(!tab)return;strip.style.setProperty('--board-tab-left',`${tab.offsetLeft}px`);strip.style.setProperty('--board-tab-width',`${tab.offsetWidth}px`);strip.classList.add('board-motion-tab-strip');};move(strip.querySelector('[aria-current="page"]'));strip.addEventListener('click',event=>{const tab=event.target.closest('a[data-home-view]');if(tab){move(tab);document.querySelector('.home-scroll')?.classList.add('board-tab-crossfade');setTimeout(()=>document.querySelector('.home-scroll')?.classList.remove('board-tab-crossfade'),150);}});window.addEventListener('resize',()=>move(strip.querySelector('[aria-current="page"]')));};
  const start = () => { const feed=document.getElementById('home-feed'); if(!feed)return; mount(); seedChat(); setupTabs(); if(new URLSearchParams(location.search).get('chat')==='1'){const toggle=document.getElementById('chatOn');if(toggle&&!toggle.checked){toggle.checked=true;toggle.dispatchEvent(new Event('change',{bubbles:true}));}} revealFeed(); document.querySelectorAll('#chatOn,#sidebarOn').forEach(toggle=>toggle.addEventListener('change',()=>requestAnimationFrame(revealFeed))); document.addEventListener('mojo:board-source-connected',mount); new MutationObserver(()=>{mount();revealFeed();}).observe(feed,{childList:true}); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true}); else start();
})();
