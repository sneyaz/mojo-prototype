/* Stories on the Home feed. */
(() => {
  const page = (location.pathname.split('/').pop() || '').replace(/\.html$/, '');
  if (page !== 'Home') return;
  const initialContext = 'home';

  const sets = {
    home: {
      title: 'From signal to sale',
      subtitle: 'A quick look across answer engines, audiences, ads, site visits, and sales.',
      slides: [
        {kind:'intro',theme:'violet',label:'THE BIG PICTURE',metric:'The path',caption:'What connects the work',title:'One buyer journey. Several places to look.',body:'A buyer may ask an agent, see an ad, visit a page, and talk to sales. These examples come from different samples, so follow the questions without treating them as one measured funnel.',visual:{type:'journey',steps:['AI answers','Audience','Ads','Website','Sales']},source:'Campaign, audience, AEO, GA4, and CRM examples cover different periods and populations.',href:'Home.html#strategy',action:'See the full strategy'},
        {theme:'blue',label:'AI DISCOVERY',metric:'3 of 4',caption:'comparison answers omit the brand',title:'Buyers ask agents before they ever click.',body:'In the sampled comparison answers, the brand is absent from three of four. Review the answer and the pages it cites before changing the content plan.',visual:{type:'dots',count:4,active:3,activeLabel:'Brand absent',otherLabel:'Brand present'},source:'AEO comparison-answer sample · four answers',href:'AppWorkspace.html?app=aeo#feed-insights',action:'Review answer visibility',prompt:'Which sampled comparison answers omit our brand, and what sources did they use?'},
        {theme:'teal',label:'AUDIENCES',metric:'16 days',caption:'since the intent refresh',title:'Fresh signals decide who is in the plan.',body:'Intent Surge is 16 days old against a seven-day refresh standard. Check the audience update before using intent to steer spend.',visual:{type:'bars',rows:[['Elapsed',16,16,'16 days'],['Standard',7,16,'7 days']]},source:'Audience scenario · Intent Surge refresh check',href:'AppWorkspace.html?app=audience-builder#feed-insights',action:'Review the audience',prompt:'What should we check before refreshing the Intent Surge audience?'},
        {theme:'mint',label:'AD DELIVERY',metric:'83%',caption:'target-account coverage',title:'Coverage comes before downstream response.',body:'Ads reached 5,312 of 6,400 target accounts. A separate planning breakdown suggests 803 match issues to verify; confirm whether 285 suppressions are intentional.',visual:{type:'coverage',value:5312,total:6400,secondary:'803 possible match issues · planning example'},source:'Campaign scenario totals + separate planning breakdown; causes are not verified by account.',href:'Portfolio.html#insight=unreached',action:'Review account coverage',prompt:'How can we verify and improve account coverage, starting with DSP matches?'},
        {theme:'amber',label:'WEBSITE',metric:'+41%',caption:'sessions versus baseline',title:'The visit is a signal, not yet an outcome.',body:'Sessions reached 18,420 against a 13,060 baseline. Untagged LinkedIn clicks appear in pricing traffic, so audit source tags before crediting the campaign.',visual:{type:'bars',rows:[['Observed',18420,18420,'18,420'],['Baseline',13060,18420,'13,060']]},source:'Campaign Control Room traffic digest · 28-day baseline',href:'Portfolio.html#insight=traffic-baseline',action:'Review traffic sources',prompt:'What can the traffic change tell us, and which source tags need checking?'},
        {theme:'indigo',label:'SALES HANDOFF',metric:'214',caption:'opportunities reported',title:'The handoff is where the story needs proof.',body:'The separate CRM summary also reports 37 wins. It does not join owners, next steps, or opportunity dates to account-level ad exposure, so it cannot show which work created pipeline.',visual:{type:'handoff',left:'5,312 reached',right:'214 opportunities',note:'Account-level join missing'},source:'Demandbase campaign scenario + separate CRM summary; no account-level exposure join.',href:'Strategy.html#mf-influence',action:'See the measurement gap',prompt:'What account-level fields do we need to connect marketing exposure to sales handoff?'},
        {kind:'outro',theme:'violet',label:'NEXT MOVE',metric:'Together',caption:'one coordinated check',title:'Make the next decision across the whole system.',body:'Refresh the audience, verify DSP matches, inspect answer visibility and source tags, then join engagement to CRM dates before claiming pipeline impact.',visual:{type:'steps',steps:['Refresh intent and eligibility','Repair and verify matching','Check answers and site sources','Join exposure to sales outcomes']},source:'Suggested workflow based on separate sample sources; no live changes are made here.',href:'Home.html#strategy',action:'Open the strategy',prompt:'Help me plan a coordinated audience, campaign, AEO, website, and sales measurement check.'}
      ]
    }
  };

  function buildStories(context) {
  const data = sets[context];
  const esc = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const number = value => new Intl.NumberFormat('en-US').format(value);
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const storageKey = `mojo-stories-seen-v1:${context}`;
  let seen = [];
  try { seen = JSON.parse(localStorage.getItem(storageKey) || '[]'); } catch {}
  if (!Array.isArray(seen)) seen = [];

  const stories = document.createElement('section');
  stories.className = `ms-stories ms-${context}`;
  stories.setAttribute('aria-label', data.title);
  stories.innerHTML = `<div class="ms-heading"><span class="ms-eyebrow">${context==='done'?'60-SECOND RECAPS':'STORIES'}</span></div><div class="ms-strip">${data.slides.map((slide,index)=>`<button class="ms-thumb ms-theme-${slide.theme}${seen.includes(index)?' is-seen':''}" type="button" data-ms-open="${index}" aria-label="Play ${esc(slide.label.toLowerCase())} story: ${esc(slide.title)}"><span class="ms-thumb-label">${esc(slide.label)}</span><span class="ms-thumb-spacer"></span><strong>${esc(slide.metric)}</strong><span class="ms-thumb-caption">${esc(slide.caption)}</span><span class="ms-thumb-play" aria-hidden="true">${index===0?'▶':'→'}</span></button>`).join('')}</div>`;
  const strip = stories.querySelector('.ms-strip');
  const syncStripFade = () => {
    const firstCard = strip.querySelector('.ms-thumb');
    // Scroll snapping can set a small scrollLeft at the start because the strip has padding.
    // Show the left fade only once the first card is actually clipped.
    stories.classList.toggle('ms-has-prev', firstCard && firstCard.getBoundingClientRect().left < strip.getBoundingClientRect().left - 2);
    stories.classList.toggle('ms-has-next', strip.scrollWidth - strip.clientWidth - strip.scrollLeft > 2);
  };
  strip.addEventListener('scroll', syncStripFade, {passive:true});
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(syncStripFade).observe(strip);
  else window.addEventListener('resize', syncStripFade);

  const overlay = document.createElement('div');
  overlay.className = 'ms-overlay';
  overlay.hidden = true;
  overlay.innerHTML = `<div class="ms-backdrop" data-ms-close></div><section class="ms-viewer ms-theme-violet" role="dialog" aria-modal="true" aria-labelledby="ms-title-${context}"><div class="ms-top"><div class="ms-progress" aria-label="Story progress"></div><div class="ms-topline"><span class="ms-brand">Mojo <span>· ${context==='home'?'Home':context==='done'?"What's done":'Campaigns'} stories</span></span><span class="ms-controls"><button type="button" data-ms-play aria-label="Pause story" title="Pause or play">Ⅱ</button><button type="button" data-ms-close aria-label="Close stories" title="Close">×</button></span></div></div><button type="button" class="ms-arrow ms-arrow-prev" data-ms-prev aria-label="Previous story">‹</button><div class="ms-slide" data-ms-tap></div><button type="button" class="ms-arrow ms-arrow-next" data-ms-next aria-label="Next story">›</button><div class="ms-bottom"><p class="ms-source"></p><div class="ms-actions"><button type="button" class="ms-primary" data-ms-start hidden>Start stories <span aria-hidden="true">→</span></button><a class="ms-detail" data-ms-detail href="#"></a><button type="button" class="ms-ask" data-ms-ask><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 11.5a8.5 8.5 0 0 1-12.3 7.6L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5Z"/></svg>Ask Mojo</button><button type="button" class="ms-share" data-ms-share aria-label="Share this story" title="Share this story"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="18" cy="5" r="2"/><circle cx="6" cy="12" r="2"/><circle cx="18" cy="19" r="2"/><path d="m8 11 8-5M8 13l8 5"/></svg></button></div><p class="ms-status" role="status" aria-live="polite"></p></div></section>`;
  document.body.append(overlay);

  const viewer = overlay.querySelector('.ms-viewer');
  const playerShell = document.createElement('div');
  playerShell.className = 'ms-player-shell';
  viewer.before(playerShell);
  playerShell.append(overlay.querySelector('[data-ms-prev]'), viewer, overlay.querySelector('[data-ms-next]'));
  playerShell.setAttribute('role', 'dialog');
  playerShell.setAttribute('aria-modal', 'true');
  playerShell.setAttribute('aria-labelledby', 'ms-title');
  viewer.removeAttribute('role');
  viewer.removeAttribute('aria-modal');
  viewer.removeAttribute('aria-labelledby');
  const progress = overlay.querySelector('.ms-progress');
  const slidePane = overlay.querySelector('.ms-slide');
  const playButton = overlay.querySelector('[data-ms-play]');
  const startButton = overlay.querySelector('[data-ms-start]');
  startButton.textContent = 'Skip intro →';
  const detail = overlay.querySelector('[data-ms-detail]');
  const status = overlay.querySelector('.ms-status');
  let index = 0;
  let elapsed = 0;
  let duration = 3800;
  let playing = false;
  let holding = false;
  let frame = 0;
  let metricFrame = 0;
  let lastFrame = 0;
  let previousFocus = null;
  let touchStart = null;

  function visualMarkup(visual) {
    if (visual.type === 'journey') return `<div class="ms-journey" role="img" aria-label="Marketing checkpoints: ${visual.steps.join(', ')}">${visual.steps.map((step,i)=>`<span style="--ms-i:${i}"><b>${String(i+1).padStart(2,'0')}</b>${esc(step)}</span>`).join('')}</div>`;
    if (visual.type === 'bars') return `<div class="ms-bars">${visual.rows.map(([label,value,max,display])=>`<div class="ms-bar-row"><span>${esc(label)}</span><div class="ms-bar-track"><i style="width:${Math.max(0,Math.min(100,100*value/max))}%"></i></div><b>${esc(display)}</b></div>`).join('')}</div>`;
    if (visual.type === 'dots') return `<div class="ms-dot-visual" role="img" aria-label="${visual.active} ${visual.activeLabel.toLowerCase()} out of ${visual.count}"><div>${Array.from({length:visual.count},(_,i)=>`<i style="--ms-i:${i}" class="${i<visual.active?'is-active':''}"></i>`).join('')}</div><p><span>${visual.active} ${esc(visual.activeLabel)}</span><span>${visual.count-visual.active} ${esc(visual.otherLabel)}</span></p></div>`;
    if (visual.type === 'coverage') return `<div class="ms-coverage" role="img" aria-label="${Math.round(visual.value/visual.total*100)} percent account coverage"><div><strong>${Math.round(visual.value/visual.total*100)}%</strong><span>${number(visual.value)} of ${number(visual.total)} accounts reached</span></div><div class="ms-coverage-track"><i style="width:${visual.value/visual.total*100}%"></i></div><small>${esc(visual.secondary)}</small></div>`;
    if (visual.type === 'stats') return `<div class="ms-stats">${visual.items.map(([value,label])=>`<div><strong>${esc(value)}</strong><span>${esc(label)}</span></div>`).join('')}</div>`;
    if (visual.type === 'handoff') return `<div class="ms-handoff"><span>${esc(visual.left)}</span><b aria-hidden="true">···</b><span>${esc(visual.right)}</span><small>${esc(visual.note)}</small></div>`;
    if (visual.type === 'steps') return `<ol class="ms-steps">${visual.steps.map((step,i)=>`<li><b>${String(i+1).padStart(2,'0')}</b><span>${esc(step)}</span></li>`).join('')}</ol>`;
    return '';
  }

  function syncProgress() {
    const fills = progress.querySelectorAll('i');
    fills.forEach((fill,i)=>{ fill.style.width = i<index?'100%':i>index?'0%':`${Math.min(100,elapsed/duration*100)}%`; });
  }
  function animateMetric(value) {
    cancelAnimationFrame(metricFrame);
    if (reduceMotion) return;
    const metric = slidePane.querySelector('.ms-hero-metric');
    const parts = /^([+$−-]*)([\d,]+(?:\.\d+)?)(.*)$/.exec(value);
    if (!metric || !parts) return;
    const target = Number(parts[2].replaceAll(',', ''));
    if (!Number.isFinite(target)) return;
    const decimals = (parts[2].split('.')[1] || '').length;
    const format = new Intl.NumberFormat('en-US', {minimumFractionDigits:decimals, maximumFractionDigits:decimals});
    const paint = fraction => { metric.textContent = `${parts[1]}${format.format(target * fraction)}${parts[3]}`; };
    const started = performance.now();
    paint(0);
    const step = now => {
      const t = Math.min(1, (now - started) / 620);
      paint(1 - Math.pow(1 - t, 3));
      if (t < 1) metricFrame = requestAnimationFrame(step);
      else metric.textContent = value;
    };
    metricFrame = requestAnimationFrame(step);
  }
  function syncPlay() {
    const active = playing && !holding;
    playButton.textContent = active ? 'Ⅱ' : '▶';
    playButton.setAttribute('aria-label', active ? 'Pause story' : 'Play story');
    playButton.title = active ? 'Pause story' : 'Play story';
    viewer.classList.toggle('is-playing', active);
  }
  function setHidden(element, hidden) {
    element.hidden = hidden;
    if (hidden) element.style.setProperty('display', 'none', 'important');
    else element.style.removeProperty('display');
  }
  function tick(time) {
    if (overlay.hidden) return;
    if (playing && !holding && lastFrame) {
      elapsed += Math.min(100,time-lastFrame);
      if (elapsed >= duration) {
        if (index < data.slides.length-1) show(index+1,true);
        else { elapsed=duration; playing=false; syncPlay(); }
      }
      syncProgress();
    }
    lastFrame=time;
    frame=requestAnimationFrame(tick);
  }
  function show(next,auto) {
    index = Math.max(0,Math.min(data.slides.length-1,next));
    const slide=data.slides[index];
    const wordCount=`${slide.title} ${slide.body}`.trim().split(/\s+/).length;
    duration=context==='done'?15000:slide.kind==='intro'?1100:Math.min(3400,Math.max(2350,wordCount*65));
    elapsed=slide.kind==='outro'?duration:0;
    playing=Boolean(auto && slide.kind !== 'outro' && !reduceMotion);
    viewer.className=`ms-viewer ms-theme-${slide.theme}`;
    slidePane.innerHTML=`<div class="ms-copy"><span class="ms-slide-label">${esc(slide.label)} <span>· ${index+1} / ${data.slides.length}</span></span>${slide.kind==='intro'?`<h2 id="ms-title-${context}">${esc(slide.title)}</h2>`:`<strong class="ms-hero-metric">${esc(slide.metric)}</strong><h2 id="ms-title-${context}">${esc(slide.title)}</h2>`}<p>${esc(slide.body)}</p></div>${visualMarkup(slide.visual)}`;
    animateMetric(slide.metric);
    if(!reduceMotion)slidePane.animate([{transform:'translateX(18px) scale(.985)',opacity:.55},{transform:'translateX(0) scale(1)',opacity:1}],{duration:260,easing:'cubic-bezier(.18,.9,.25,1)'});
    overlay.querySelector('.ms-source').textContent=slide.source;
    detail.href=slide.href;
    detail.textContent=slide.action+' →';
    setHidden(startButton,slide.kind!=='intro');
    setHidden(detail,slide.kind==='intro');
    setHidden(overlay.querySelector('[data-ms-ask]'),slide.kind==='intro');
    setHidden(overlay.querySelector('[data-ms-share]'),slide.kind==='intro');
    setHidden(playButton,slide.kind==='outro');
    overlay.querySelector('[data-ms-prev]').disabled=index===0;
    overlay.querySelector('[data-ms-next]').disabled=index===data.slides.length-1;
    status.textContent='';
    progress.innerHTML=data.slides.map((_,i)=>`<span aria-label="Story ${i+1} of ${data.slides.length}"><i></i></span>`).join('');
    syncProgress();syncPlay();
    seen=[...new Set([...seen,index])];
    try { localStorage.setItem(storageKey,JSON.stringify(seen)); } catch {}
    stories.querySelector(`[data-ms-open="${index}"]`)?.classList.add('is-seen');
  }
  function open(next) {
    previousFocus=document.activeElement;
    overlay.hidden=false;
    document.body.classList.add('ms-open');
    show(next,true);
    overlay.querySelector('.ms-controls [data-ms-close]')?.focus();
    lastFrame=0;cancelAnimationFrame(frame);frame=requestAnimationFrame(tick);
  }
  function close() {
    overlay.hidden=true;
    document.body.classList.remove('ms-open');
    playing=false;holding=false;cancelAnimationFrame(frame);lastFrame=0;
    cancelAnimationFrame(metricFrame);
    previousFocus?.focus?.();
    const url=new URL(location.href);
    if(url.searchParams.has('story')){url.searchParams.delete('story');history.replaceState(null,'',url.pathname+url.search+url.hash);}
  }
  function shift(delta) {
    if(index===0&&delta>0)show(1,true);
    else if(index+delta>=0&&index+delta<data.slides.length)show(index+delta,true);
  }
  function askMojo() {
    const slide=data.slides[index];
    close();
    const box=document.getElementById('chatOn');
    if(box&&!box.checked){box.checked=true;box.dispatchEvent(new Event('change',{bubbles:true}));}
    const field=document.querySelector('.chatpane textarea, .mojo-fish-chat-form textarea');
    if(field){field.value=slide.prompt||`Help me understand this story: ${slide.title}`;field.dispatchEvent(new Event('input',{bubbles:true}));field.focus();}
  }
  stories.addEventListener('click',event=>{const button=event.target.closest('[data-ms-open]');if(button)open(Number(button.dataset.msOpen));});
  overlay.addEventListener('click',async event=>{
    if(event.target.closest('[data-ms-close]')){close();return;}
    if(event.target.closest('[data-ms-prev]')){shift(-1);return;}
    if(event.target.closest('[data-ms-next]')){shift(1);return;}
    if(event.target.closest('[data-ms-start]')){show(1,true);return;}
    if(event.target.closest('[data-ms-detail]')){close();return;}
    if(event.target.closest('[data-ms-play]')){playing=!playing;syncPlay();return;}
    if(event.target.closest('[data-ms-ask]')){askMojo();return;}
    if(event.target.closest('[data-ms-share]')){
      const url=new URL(location.href);url.searchParams.set('story',`${context}-${index}`);
      close();
      document.dispatchEvent(new CustomEvent('mojo:open-share',{detail:{url:url.href}}));
      return;
    }
    if(event.target.closest('a,button'))return;
    if(slidePane.contains(event.target)){
      const rect=slidePane.getBoundingClientRect();const fraction=(event.clientX-rect.left)/rect.width;
      if(fraction<.25)shift(-1);else if(fraction>.75)shift(1);
    }
  });
  overlay.addEventListener('pointerdown',event=>{if(event.target.closest('[data-ms-tap]')){holding=true;syncPlay();}});
  overlay.addEventListener('pointerup',()=>{if(holding){holding=false;syncPlay();}});
  overlay.addEventListener('touchstart',event=>{touchStart={x:event.changedTouches[0].clientX,y:event.changedTouches[0].clientY};},{passive:true});
  overlay.addEventListener('touchend',event=>{if(!touchStart)return;const dx=event.changedTouches[0].clientX-touchStart.x;const dy=event.changedTouches[0].clientY-touchStart.y;if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.3)shift(dx<0?1:-1);touchStart=null;},{passive:true});
  document.addEventListener('keydown',event=>{
    if(overlay.hidden)return;
    if(event.key==='Escape'){event.preventDefault();close();}
    else if(event.key==='ArrowRight'){event.preventDefault();shift(1);}
    else if(event.key==='ArrowLeft'){event.preventDefault();shift(-1);}
    else if(event.key===' '&&!event.target.closest('button,a,textarea,input')){event.preventDefault();playing=!playing;syncPlay();}
    else if(event.key==='Tab'){
      const focusable=[...playerShell.querySelectorAll('button:not([disabled]):not([hidden]),a[href]')].filter(node=>node.getClientRects().length);
      const first=focusable[0],last=focusable.at(-1);
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    }
  });

  function mount() {
    const home=document.querySelector('#home-feed-view.home-content');
    if(!home)return false;
    home.prepend(stories);
    requestAnimationFrame(syncStripFade);
    const requested=new URL(location.href).searchParams.get('story');
    const prefix=`${context}-`;
    if(requested?.startsWith(prefix)){
      const value=Number(requested.slice(prefix.length));
      if(Number.isInteger(value)&&value>=0&&value<data.slides.length)open(value);
    }
    return true;
  }
  if(!mount()){
    const observer=new MutationObserver(()=>{if(mount())observer.disconnect();});
    observer.observe(document.documentElement,{childList:true,subtree:true});
    setTimeout(()=>observer.disconnect(),15000);
  }
  }
  buildStories(initialContext);
})();
