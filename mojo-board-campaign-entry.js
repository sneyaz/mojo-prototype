/* Staged entrance for the first Campaigns view after connecting Demandbase. */
(() => {
  const root=document.documentElement;
  if(!root.classList.contains('board-entry-pending'))return;
  let started=false;
  const timers=[];
  const later=(delay,action)=>timers.push(setTimeout(action,delay));
  const reveal=element=>element?.classList.add('board-entry-visible');
  const start=()=>{
    if(started)return true;
    const context=document.querySelector('#mf-insights .board-demandbase-context');
    const rail=document.querySelector('#mf-insights .mf-sources-rail');
    const section=document.querySelector('#mf-insights .mfc-section');
    const summary=document.querySelector('#mf-insights .mfd-feed-summary');
    if(!section||!summary)return false;
    if(!context||!rail){started=true;root.classList.remove('board-entry-pending');return true;}
    started=true;
    sessionStorage.setItem('mojo-campaign-entry-seen-v1','true');
    root.classList.add('board-entry-playing');
    const status=document.createElement('span');
    status.className='board-entry-calculation';
    status.setAttribute('role','status');
    status.textContent='Reading campaign structure…';
    context.querySelector('div:nth-child(2)')?.append(status);
    const scan=(message,amount)=>{status.textContent=message;status.style.setProperty('--scan',`${amount}%`);};
    const cards=[...section.querySelectorAll('.mfc-card')];
    const head=section.querySelector('.mfc-section-head');
    const pills=[...summary.querySelectorAll('button')];
    const pillCounts=pills.map(pill=>Number(pill.querySelector('strong')?.textContent)||0);
    pills.forEach(pill=>{pill.querySelector('strong').textContent='0';});
    const countUp=(pill,target)=>{
      reveal(pill);
      const number=pill.querySelector('strong');
      const startTime=performance.now();
      const frame=now=>{
        const progress=Math.min(1,(now-startTime)/900);
        const eased=1-Math.pow(1-progress,3);
        number.textContent=String(Math.round(target*eased));
        if(progress<1)requestAnimationFrame(frame);
        else number.textContent=String(target);
      };
      requestAnimationFrame(frame);
    };
    later(100,()=>reveal(context));
    later(350,()=>{reveal(rail);scan('Matching target accounts…',22);});
    later(700,()=>{context.classList.add('board-entry-read');scan('Matching spend and account reach…',43);});
    later(1050,()=>{context.classList.add('board-entry-described');scan('Finding naming and budget patterns…',57);});
    later(1120,()=>{reveal(summary);scan('Calculating campaign summaries…',68);});
    pills.forEach((pill,index)=>later(1300+index*220,()=>countUp(pill,pillCounts[index])));
    later(2150,()=>{reveal(head);scan('Prioritizing what needs attention…',88);});
    cards.forEach((card,index)=>later(2370+index*160,()=>reveal(card)));
    later(3380,()=>{scan('First pass ready',100);status.remove();root.classList.remove('board-entry-pending','board-entry-playing');});
    return true;
  };
  const watch=new MutationObserver(()=>{if(start())watch.disconnect();});
  if(!start())watch.observe(document.body,{childList:true,subtree:true});
  later(4600,()=>{watch.disconnect();root.classList.remove('board-entry-pending','board-entry-playing');});
})();
