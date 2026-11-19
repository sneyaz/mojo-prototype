/* Keep the Campaigns underline aligned as navigation is rebuilt. */
(() => {
  const nav=document.querySelector('nav.modulenav');
  if(!nav)return;
  const selected=()=>nav.querySelector('a[aria-current="page"]:not(.mojo-practices-nav),a.on:not(.mojo-practices-nav)');
  const position=link=>({left:link?.offsetLeft||0,width:link?.offsetWidth||0});
  const place=(value)=>{nav.style.setProperty('--board-nav-left',`${value.left}px`);nav.style.setProperty('--board-nav-width',`${value.width}px`);};
  const target=position(selected());
  place(target);
  nav.classList.add('board-nav-motion');
  requestAnimationFrame(()=>nav.classList.add('board-nav-ready'));
  let pending=false;
  const realign=()=>{
    if(pending)return;
    pending=true;
    requestAnimationFrame(()=>{pending=false;place(position(selected()));});
  };
  new MutationObserver(realign).observe(nav,{childList:true});
  nav.addEventListener('click',event=>{
    const link=event.target.closest('a[href]');if(!link||!nav.contains(link)||link.classList.contains('mojo-practices-nav'))return;
    place(position(link));
  });
  window.addEventListener('resize',realign);
})();
