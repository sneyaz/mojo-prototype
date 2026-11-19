/* Board path: each action advances the same local workspace and conversation. */
(() => {
  const KEY='mojo-demo-sequence-v3';
  const initial={teach:0,budgetThreshold:'over10',customThreshold:15,icpCorrection:'',icpAdjusting:false,undoneRules:[],pendingTeachRule:null,approvedFixes:false,fixReview:false,budgetRequested:false,budgetApplied:false,budgetPreview:false,draft:'none',publishReview:false,chatOpen:false,context:'',messages:[],customerExcluded:false,chatCardAt:0};
  let state;try{state={...initial,...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch{state={...initial}}
  // Earlier prototype revisions seeded example exchanges into this local thread.
  // Keep only messages created by the current sequential flow.
  state.messages=(Array.isArray(state.messages)?state.messages:[]).filter(item=>item&&item.origin==='mojo-sequence-v2'&&typeof item.text==='string');
  state.messages=state.messages.map(item=>({...item,text:item.text==='Yes, that ideal customer profile looks right.'?'ICP: B2B software companies with 200–2,000 employees; RevOps, marketing ops, and sales ops buyers.':item.text==='Ask my team before any flight budget move.'?'Ask my team before every flight budget move, including moves under 10%.':item.text}));
  state.messages=state.messages.map(item=>({...item,text:item.text.replace(/^Ideal customer:/,'ICP:')}));
  const draftIntro='I have the audience, budget and creative ready. Tell me what to change before I draft it.';
  const beforeDraftDedupe=state.messages.length;
  let draftIntroSeen=false;
  state.messages=state.messages.filter(item=>{if(item.role!=='assistant'||item.text!==draftIntro)return true;if(draftIntroSeen)return false;draftIntroSeen=true;return true});
  // A new page starts with chat closed; opening it requires a user action.
  state.chatOpen=false;
  const save=()=>localStorage.setItem(KEY,JSON.stringify(state));
  if(!Number.isInteger(state.chatStart)||state.chatStart<0||state.chatStart>state.messages.length)state.chatStart=state.messages.length;
  if(state.messages.length!==beforeDraftDedupe)save();
  const isRuleSaved=i=>(state.teach>i||state.savedRules?.includes(i))&&!state.undoneRules?.includes(i);
  const budgetLimit=()=>state.budgetThreshold==='any'?0:state.budgetThreshold==='other'?Math.max(1,Math.min(100,Number(state.customThreshold)||15)):10;
  const budgetRuleText=()=>budgetLimit()===0?'Ask my team before every flight budget move.':`Ask my team before moving more than ${budgetLimit()}% of a flight’s budget.`;
  const budgetNeedsApproval=()=>budgetLimit()<20;
  const activeTeachRule=()=>state.pendingTeachRule??state.teach;
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  let toastTimer;
  const receiptCheck='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M5 12l5 5L20 7"></path></svg>';
  const showSaveToast=(message,i)=>{document.querySelector('.seq-save-toast')?.remove();const toast=document.createElement('div');toast.className='seq-save-toast';toast.setAttribute('role','status');toast.innerHTML=`<span class="seq-save-check" aria-hidden="true">${receiptCheck}</span><span><strong>Saved to Best Practices</strong><small>${esc(message)}</small></span><button type="button" data-seq="review-saved-rule-${i}">Review in chat →</button><button type="button" aria-label="Dismiss confirmation" data-seq="dismiss-toast">×</button>`;document.body.append(toast);clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.remove(),6500)};
  function celebrateFirstLaunch(card){
    const key='mojo-first-campaign-celebrated-v1';
    if(localStorage.getItem(key)==='true'||!window.MojoLaunchCelebration)return false;
    localStorage.setItem(key,'true');
    window.MojoLaunchCelebration.play({card});
    return true;
  }
  const page=location.pathname.split('/').pop();
  const feedEntryStarted=performance.now();
  const firstFeedReveal=document.documentElement.classList.contains('mojo-feed-first-load');
  const revealFeedEntry=()=>{if(!document.documentElement.classList.contains('mojo-feed-entry-loading'))return;setTimeout(()=>{document.documentElement.classList.remove('mojo-booting','mojo-feed-entry-loading');document.querySelector('.mojo-feed-entry-skeleton')?.remove();document.querySelector('#mf-insights .mfc-section')?.classList.add('seq-feed-revealed');try{sessionStorage.removeItem('mojo-feed-entry-loading-v1')}catch{}},Math.max(0,900-(performance.now()-feedEntryStarted)))};
  function syncSavedCampaignToLive(){
    if(state.draft!=='live')return false;
    const key='mojo-created-campaign-drafts-v1';
    let drafts;try{drafts=JSON.parse(localStorage.getItem(key)||'[]')}catch{return false}
    if(!Array.isArray(drafts))return false;
    const index=drafts.findIndex(item=>item?.name&&/buying group follow.up/i.test([item.name,item.planTitle].join(' ')));
    if(index<0)return false;
    if(drafts[index].buildStatus!=='live'){
      drafts[index].buildStatus='live';
      localStorage.setItem(key,JSON.stringify(drafts));
      document.dispatchEvent(new CustomEvent('mojo:build-status-changed',{detail:{index,status:'live'}}));
    }
    return true;
  }
  document.documentElement.dataset.mojoSequence='true';
  const button=(label,action,cls='')=>`<button type="button" class="seq-button ${cls}" data-seq="${action}">${label}</button>`;
  const seeWhy=action=>`<button type="button" class="mojo-see-why" data-seq="${action}">See why</button>`;
  const whyDetails={
    'why-teach-0':{triggerType:'Inferred Best Practice',triggerReason:'Three target account lists point to the same company size and operations buyers.',source:'Demandbase target account lists',check:'Confirm or correct the ICP before Mojo builds new audiences.',href:'Company.html#icp',linkLabel:'Review the ICP'},
    'why-teach-1':{triggerType:'Inferred Best Practice',triggerReason:'Mojo inferred a team approval threshold from the budget practices in this demo.',source:'Campaign budget history and team practices',check:'Choose the threshold your team wants, then save the company rule.',href:'BestPractices.html',linkLabel:'Review Best Practices'},
    'why-teach-2':{triggerType:'Best practice',triggerReason:'Four campaign names contain end dates that differ from their flight settings.',source:'Campaign names and flight end dates',check:'Review the four corrections and save the naming rule before applying them.',href:'CampaignLifecycle.html?view=build',linkLabel:'Review the campaign rule'},
    'why-conversion':{triggerType:'Mojo Brain',triggerReason:'Conversion events stopped after the Nov 3 landing page change while six campaigns kept spending.',source:'Landing page history and campaign conversion events',check:'Review the corrected tracking links for all six campaigns before approving the fixes.',href:'CampaignLifecycle.html?view=optimize#issues',linkLabel:'Review tracking fixes'},
    'why-names':{triggerType:'Best practice',triggerReason:'Four end dates in campaign names do not match their flight settings.',source:'Campaign names, flight settings and Pam’s naming rule',check:'Compare the proposed names with the flight dates, then approve the corrections.',href:'CampaignLifecycle.html?view=optimize#issues',linkLabel:'Review name fixes'},
    'why-pacing':{triggerType:'Best practice',triggerReason:'Nine of 22 flights are below 40% pacing against plan.',source:'Demandbase Ads flight delivery and spend plans',check:'Check the flight dates and delivery before approving a budget shift.',href:'Portfolio.html#campaigns',linkLabel:'Review flight pacing'},
    'why-plan':{triggerType:'Mojo Brain',triggerReason:'Two campaign plans already have their audience, creative, landing page and budget available.',source:'Plan deliverables and Demandbase buying groups',check:'Review reach and the campaign blueprint, then choose which campaign to launch.',href:'Strategy.html#next-test',linkLabel:'See the Plan'}
  };
  const link=(label,href)=>`<a class="seq-link" href="${href}">${label} →</a>`;
  const waitFor=(selector,fn,tries=40)=>{const el=document.querySelector(selector);if(el)return fn(el);if(tries)setTimeout(()=>waitFor(selector,fn,tries-1),125)};
  const openChat=context=>{state.chatOpen=true;const nextContext=context||state.context||'Buying group follow-up';if(nextContext!==state.context)state.chatStart=state.messages.length;state.context=nextContext;state.chatPage=page;save();const toggle=document.getElementById('chatOn');if(toggle&&!toggle.checked){toggle.checked=true;toggle.dispatchEvent(new Event('change',{bubbles:true}))}const homeButton=document.querySelector('[data-home-pane="chat"]');if(homeButton&&homeButton.getAttribute('aria-expanded')!=='true')homeButton.click();renderChat()};
  let typingMessage=null,typingProgress=0,typingTimer=0;
  const push=(role,text,stream=false,kind='')=>{if(role==='assistant'&&state.messages.at(-1)?.role==='assistant'&&state.messages.at(-1)?.text===text){renderChat();return}if(typingMessage){clearTimeout(typingTimer);typingMessage=null}const message={role,text,kind,origin:'mojo-sequence-v2'};if(stream&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){typingMessage=message;typingProgress=0}state.messages.push(message);save();if(/Buying group follow-up/i.test(state.context)||state.draft!=='none')window.MojoChatThreads?.saveDemo?.(state.messages.slice(state.chatStart));renderChat();if(typingMessage===message)streamReply(message)};
  const chatCard=()=>{
    if(state.draft==='none')return '';
    const corrected=['ready','live'].includes(state.draft);
    const status=state.draft==='live'?'Live':state.draft==='ready'?'Ready to publish':state.draft==='qa-review'?'Mojo QA: review finding':'Draft';
    const qaFinding=state.draft==='qa-review'?`<div class="seq-qa-finding"><span class="seq-badge">${isRuleSaved(2)?'Campaign rule · Set by Pam':'Campaign name check'}</span><strong>Name is missing the flight end date</strong><p>Current: Buying group follow-up<br>Proposed: Buying group follow-up · Dec 18</p>${button('Approve Mojo’s correction','qa-apply','primary')}</div>`:'';
    const publish=state.draft==='ready'?(state.publishReview?`<div class="seq-publish-review"><strong>Final review</strong><p>Demandbase Ads · 1,146 engaged accounts${state.customerExcluded?' · current customers excluded':''} · $15,000 · Nov 11–Dec 18</p><p>Mojo’s QA passed. The campaign name includes the end date.</p>${button('Publish to Demandbase Ads','publish','primary')}<a href="#draft" class="seq-text-link" data-seq="publish-back">Back to draft</a></div>`:button('Review before publishing','publish-review','primary')):'';
    const live=state.draft==='live'?`<div class="seq-launch-confirmation"><span aria-hidden="true">✓</span><div><strong>Campaign published</strong><small>Demandbase Ads · Live</small></div></div>${link('View in Report','Portfolio.html#campaigns')}`:'';
    return `<article class="seq-chat-draft"><div class="seq-draft-top"><strong>Buying group follow-up${corrected?' · Dec 18':''}</strong><span>${status}</span></div><div class="seq-progress"><span class="done ${state.draft==='draft'?'current':''}">Draft</span><i></i><span class="${state.draft!=='draft'?'done':''} ${state.draft==='qa-review'?'current':''}">QA</span><i></i><span class="${state.draft==='live'?'done current':''}">Publish</span></div><dl><div><dt>Audience</dt><dd>1,146 engaged accounts${state.customerExcluded?' · current customers excluded':''}</dd></div><div><dt>Ads</dt><dd>2 role-specific ads · finance and security</dd></div><div><dt>Budget</dt><dd>$15,000</dd></div><div><dt>Flight</dt><dd>Nov 11–Dec 18, 2026</dd></div><div><dt>Name</dt><dd>Buying group follow-up${corrected?' · Dec 18':''}</dd></div></dl>${state.draft==='draft'?`<p class="seq-qa-note">Mojo will check this draft against Pam’s active campaign rule.</p>${button('Ask Mojo to run QA','qa','primary')}`:''}${qaFinding}${publish}${live}</article>`;
  };
  const chatPlan=()=>state.draft==='none'?'':`<article class="seq-chat-plan"><strong>Plan for Buying group follow-up</strong><ul><li>Goal: 35 accounts gain a third buyer role; about 3 new opportunities, based on Q3 conversion rates</li><li>Audience: 1,146 engaged accounts${state.customerExcluded?'; current customers excluded':''}</li><li>Channel: Demandbase Ads</li><li>Budget: $15,000</li><li>Timing: Nov 11–Dec 18, 2026</li></ul></article>`;
  const chatFixCard=()=>!state.fixReview||state.context!=='Campaign fixes'?'':`<section class="seq-chat-review" aria-label="Review two campaign fixes"><span class="seq-badge">Review before applying</span><h3>Two fixes are ready</h3><div><strong>Tracking</strong><p>Restore conversion tracking on six campaigns after the Nov 3 landing page change. $24,600 in spend is affected.</p></div><div><strong>Campaign names</strong><p>Match all four flight end dates: Enterprise ABX · Dec 12 → Dec 18; EMEA evaluation · Dec 10 → Dec 18; Manufacturing ABX · Dec 15 → Dec 18; Security proof · Dec 11 → Dec 18.</p></div><p class="seq-review-rule ${isRuleSaved(2)?'':'needs-rule'}">${isRuleSaved(2)?'Campaign rule active · Set by Pam':'Campaign naming rule is still suggested. Save it in Build before applying.'}</p>${isRuleSaved(2)?button('Approve and apply both fixes','fix-apply','primary'):link('Save campaign rule in Build','CampaignLifecycle.html?view=build')}${button('Not now','fix-close')}</section>`;
  const chatBudgetCard=()=>state.context!=='Q4 budget shift'||!state.budgetPreview&&!state.budgetRequested&&!state.budgetApplied?'':`<section class="seq-chat-review" aria-label="Review proposed budget shift"><span class="seq-badge">Optimize · Q4 flights</span><h3>$20,000 budget shift</h3><div><strong>From nine underpacing flights</strong><p>−$20,000 across Q4 flights</p></div><div><strong>To engaged-account follow-up</strong><p>+$12,000</p></div><div><strong>To security campaign</strong><p>+$8,000. Buyer engagement is strong; the flight was underfunded. Its budget moves from $40,000 to $48,000, a 20% increase.</p></div><p class="seq-review-rule ${isRuleSaved(1)?'':'needs-rule'}">${isRuleSaved(1)?'Company rule active · '+esc(budgetRuleText())+' · Set by Pam':'The approval rule is still suggested. Save it in Feed before routing.'}</p>${state.budgetRequested?'<p class="seq-review-sent">Sent for team approval. No budget has moved.</p>':state.budgetApplied?'<p class="seq-review-sent">Budget shift applied. The security flight is now $48,000.</p>':isRuleSaved(1)?budgetNeedsApproval()?button('Send for team approval','budget-send','primary'):button('Apply budget shift','budget-apply','primary'):button('Save company rule','teach-card-1')}${!state.budgetRequested&&!state.budgetApplied?button('Not now','budget-close'):''}</section>`;
  const chatIcpReview=()=>state.teach!==0||!state.teaching||state.context!=='How Mojo works with Acme Co'?'':`<section class="seq-chat-review seq-icp-review" aria-label="Review ICP"><span class="seq-badge">Why Mojo suggested this</span><h3>Acme’s likely ICP</h3><p>Mojo inferred this from the three connected Demandbase target account lists and the buyer roles in those accounts. The working profile is B2B software companies with 200–2,000 employees; likely buyers are RevOps, marketing ops and sales ops.</p>${state.icpCorrection?`<p class="seq-icp-correction"><strong>Your change</strong>${esc(state.icpCorrection)}</p>`:''}<p class="seq-review-rule">This is a suggestion until you confirm it. Mojo will use the saved profile across Campaigns, Audiences and AEO.</p>${state.icpAdjusting?'<p class="seq-icp-prompt">Tell Mojo what to change in the message box.</p>':''}${button('Yes, use this','icp-yes','primary')}${button('No, change it','icp-no')}</section>`;
  const buyerRoleEvidence=()=>`<div class="seq-buyer-evidence" aria-label="Buying group follow-up test"><div class="seq-buyer-evidence-head"><strong>Who to reach next</strong><span>1,146 accounts engaged with ads</span></div><table><thead><tr><th scope="col">Buyer</th><th scope="col">Message to test and signal to watch</th></tr></thead><tbody><tr><th scope="row">IT</th><td>Use the proof from Q3 wins as the baseline. Watch for another buyer joining those accounts.</td></tr><tr><th scope="row">Finance</th><td>Test a cost and payback case. Watch for finance engagement and a meeting request.</td></tr><tr><th scope="row">Security</th><td>Test a security review brief. Watch for security engagement and a meeting request.</td></tr></tbody></table><p>Compare role engagement and meetings before moving more budget.</p></div>`;
  const messageMarkup=messages=>messages.map(m=>`<p class="seq-chat-${m.role}"${m===typingMessage?' data-seq-typing="true"':''}>${esc(m===typingMessage?m.text.slice(0,typingProgress):m.text)}</p>${m.kind==='buyer-roles'&&m!==typingMessage?buyerRoleEvidence():''}`).join('');
  function streamReply(message){
    const tick=()=>{
      if(typingMessage!==message)return;
      const text=message.text;
      typingProgress=Math.min(text.length,typingProgress+3+(typingProgress%4===0?1:0));
      const body=document.querySelector('.chatpane .chatbody');
      const output=body?.querySelector('[data-seq-typing="true"]');
      if(output)output.textContent=text.slice(0,typingProgress);
      if(body)body.scrollTop=body.scrollHeight;
      if(typingProgress<text.length)typingTimer=setTimeout(tick,/[.!?]/.test(text[typingProgress-1])?180:35);
      else{typingMessage=null;typingTimer=0;output?.removeAttribute('data-seq-typing');renderChat()}
    };
    typingTimer=setTimeout(tick,100);
  }
  let thinking=false;
  function renderChat(){
    const body=document.querySelector('.chatpane .chatbody');
    if(!body||!state.chatOpen)return;
    if(document.querySelector('.app')?.classList.contains('mcc-planning'))return;
    const recent=state.messages.slice(state.chatStart);
    const canAnswer=state.teach<2&&page==='HomeSystem.html'||state.teach===2&&page==='CampaignLifecycle.html';
    const showDraft=state.draft!=='none'&&/Buying group follow-up/i.test(state.context);
    body.innerHTML=`<div class="seq-chat-history">${messageMarkup(recent)}</div>${showDraft?chatCard():''}${chatFixCard()}${chatBudgetCard()}${chatIcpReview()}${thinking?'<div class="seq-thinking" role="status" aria-label="Mojo is thinking"><span class="seq-thinking-dots" aria-hidden="true"><i></i><i></i><i></i></span></div>':''}${state.teach>0&&state.teach<3&&state.teaching&&canAnswer?`<div class="seq-chat-choices">${button(teachQuestions[state.teach].answer,'teach-next','primary')}${button('Change this','teach-adjust')}</div>`:''}`;
    body.scrollTop=body.scrollHeight;
    document.querySelectorAll('.chatpane .seq-head-context').forEach(context=>context.remove());
    if(!body.dataset.seqObserver){body.dataset.seqObserver='true';new MutationObserver(()=>{if(!state.chatOpen)return;for(const child of [...body.children])if(!String(child.className||'').startsWith('seq-')&&!String(child.className||'').startsWith('mojo-why')&&!String(child.className||'').startsWith('ml-chat-card')&&!String(child.className||'').startsWith('mso-')&&!String(child.className||'').startsWith('mcc-')&&!String(child.className||'').startsWith('mbe-')&&!String(child.className||'').startsWith('mbj-')&&!String(child.className||'').startsWith('mic-')&&!child.classList?.contains('mg-chat-flow'))child.remove()}).observe(body,{childList:true})}
  }
  const teachQuestions=[
    {title:'Is this your Ideal Customer (ICP)?',detail:'This is where we’ll start when building campaign audiences.',answer:'Looks right',message:'ICP: B2B software companies with 200–2,000 employees; RevOps, marketing ops, and sales ops buyers.'},
    {title:'When should Mojo ask about budget moves?',detail:'Choose which budget changes need your team’s approval.',answer:'Save company rule',message:'Ask my team before moving more than 10% of a flight’s budget.'},
    {title:'What must every campaign name include?',detail:'Suggested: the campaign end date.',answer:'Save campaign rule',message:'Campaign names must include the end date.'}
  ];
  const savedRuleReceipt=i=>{
    const scope=i===2?'Campaigns':'Company',applies=i===2?'Campaigns':'Campaigns, Audiences, AEO';
    const decision=i===1?budgetRuleText():i===0?(state.icpCorrection||teachQuestions[i].message.replace(/^ICP: /,'')):teachQuestions[i].message;
    return `<div class="mfd-quick-receipt" role="status"><span class="mfd-quick-check" aria-hidden="true">${receiptCheck}</span><div class="seq-receipt-content"><strong>Saved to Best Practices</strong><div class="seq-receipt-decision"><p>${esc(decision)}</p></div><div class="seq-receipt-meta"><span class="seq-receipt-applies">Applies to ${applies}</span></div><div class="mfd-quick-links"><button type="button" data-seq="review-saved-rule-${i}">Review in chat</button><button type="button" data-seq="undo-rule-${i}">Undo</button></div></div></div>`;
  };
  const reviewSavedRule=i=>{
    if(!Number.isInteger(i)||i<0||i>=teachQuestions.length||!isRuleSaved(i))return;
    const titles=['Saved ICP','Saved budget approval rule','Saved campaign naming rule'];
    const sources=['Three Demandbase target account lists','Your saved budget approval choice','Campaign naming rule and flight end dates'];
    const triggers=['The connected account lists suggested this company size and buyer group.','You selected this approval threshold for flight budget moves.','You approved the rule to include the flight end date in campaign names.'];
    const next=['Review the profile here. Use Undo on the confirmation to revise it.','Review the threshold here. Use Undo on the confirmation to choose another limit.','Review the naming rule here. Use Undo on the confirmation to change it.'];
    const decision=i===1?budgetRuleText():i===0?(state.icpCorrection||teachQuestions[i].message.replace(/^ICP: /,'')):teachQuestions[i].message;
    openChat(titles[i]);
    window.MojoSeeWhy?.open({title:titles[i],reason:decision,source:sources[i],triggerType:i===0?'Inferred Best Practice':'Best practice',triggerReason:triggers[i],nextStep:next[i]});
  };
  const teachCard=(i,buildView=false)=>{const q=teachQuestions[i],saved=isRuleSaved(i),scope=i===2?'Campaigns':'Company',applies=i===2?'Campaigns':'Campaigns · Audiences · AEO';if(saved)return `<article class="seq-rule-card is-saved seq-rule-receipt" data-rule="${i}">${savedRuleReceipt(i)}</article>`;return `<article class="seq-rule-card" data-rule="${i}"><div class="seq-rule-copy"><div class="seq-rule-meta"><span class="seq-badge">${scope}</span><span>${i===0?'Inferred from Demandbase':'Suggested by Mojo'}</span></div><h3>${q.title}</h3><p>${q.detail.replace(/^Suggested: /,'')}</p><small>Applies to ${applies}</small></div><div class="seq-rule-action">${i===2&&!buildView?link('Set this in Build','CampaignLifecycle.html?view=build'):button(q.answer,`teach-card-${i}`)}</div></article>`};
  const feedVisual=id=>{
    if(id==='icp')return `<div class="seq-icp-visual" aria-label="Inferred ICP"><div class="seq-icp-core"><span class="seq-icp-label">Ideal account</span><strong>B2B software</strong><span class="seq-icp-scale"><i aria-hidden="true"></i>200–2,000 employees</span></div><div class="seq-icp-buyers"><span class="seq-icp-label">Likely buying group</span><div><b>RevOps</b><b>Marketing ops</b><b>Sales ops</b></div><small>Inferred from 3 Demandbase target account lists</small></div></div>`;
    if(id==='budgetRule')return `<fieldset class="seq-budget-choices"><legend>Ask my team before</legend><label class="${state.budgetThreshold==='any'?'selected':''}"><input type="radio" name="seq-budget-threshold" value="any" ${state.budgetThreshold==='any'?'checked':''}><span><strong>Ask every time</strong><small>Every budget move needs approval</small></span></label><label class="${state.budgetThreshold==='over10'?'selected':''}"><input type="radio" name="seq-budget-threshold" value="over10" ${state.budgetThreshold==='over10'?'checked':''}><span><strong>More than 10%</strong><small>Recommended for this team</small></span></label><label class="${state.budgetThreshold==='other'?'selected':''}"><input type="radio" name="seq-budget-threshold" value="other" ${state.budgetThreshold==='other'?'checked':''}><span><strong>Other threshold</strong><small>Choose your own limit</small></span><input class="seq-budget-custom" data-seq-custom-threshold type="number" min="1" max="100" step="1" value="${esc(state.customThreshold)}" aria-label="Custom budget approval threshold percentage" ${state.budgetThreshold==='other'?'':'disabled'}><span class="seq-budget-percent">%</span></label></fieldset>`;
    if(id==='plan')return `<div class="seq-campaign-visual seq-launch-ready" aria-label="Two campaigns with deliverables ready"><div class="seq-campaign-tiles"><div><span class="seq-ready-campaign"><strong>Buying group follow-up</strong><small class="seq-campaign-source"><img src="assets/demandbase.png" alt="Demandbase"><span>Audience, creative, landing page</span></small></span><span class="seq-ready-qa"><span class="seq-ready-check" aria-hidden="true">✓</span>Mojo QA passed</span></div><div><span class="seq-ready-campaign"><strong>Capture in-market intent</strong><small class="seq-campaign-source"><img src="assets/google-ads.svg" alt="Google Ads"><span>Audience, keywords, tracking</span></small></span><span class="seq-ready-qa"><span class="seq-ready-check" aria-hidden="true">✓</span>Mojo QA passed</span></div></div></div>`;
    if(id==='launched')return `<div class="seq-campaign-visual seq-launch-data" aria-label="Seven recently launched campaigns are reporting data"><div class="seq-campaign-visual-head"><span>Launched this weekend</span><span>First data received</span></div><div class="seq-campaign-tiles"><div><strong>3 Demandbase Ads</strong><small>Delivery and pacing visible</small></div><div><strong>2 LinkedIn Ads</strong><small>Buyer engagement visible</small></div><div><strong>2 Google Ads</strong><small>Search response visible</small></div></div></div>`;
    if(id==='conversion'){
      const recorded=[78,92,68,100,84,90,82].map(height=>`<span class="seq-tracking-bar is-recorded" style="--bar-height:${height}%"></span>`).join('');
      const missing=Array.from({length:9},()=>'<span class="seq-tracking-bar is-missing"></span>').join('');
      return `<div class="seq-tracking-visual" role="group" aria-label="Conversion tracking stopped after the November 3 landing page change and affected six campaigns"><div class="seq-tracking-chart"><div class="seq-tracking-chart-head"><strong>Conversion events per day</strong><div class="seq-tracking-legend"><span><i class="is-recorded" aria-hidden="true"></i>Recorded</span><span><i class="is-missing" aria-hidden="true"></i>Missing</span></div></div><div class="seq-tracking-plot" role="img" aria-label="Conversion events were recorded daily from October 27 to November 2. No conversion events were recorded after the November 3 landing page change."><div class="seq-tracking-change"><strong>Nov 3</strong><span>Landing page changed</span></div><div class="seq-tracking-bars" aria-hidden="true">${recorded}${missing}</div></div><div class="seq-tracking-axis"><span>Oct 27</span><span>Today</span></div></div><div class="seq-tracking-metrics"><div><span>Spend untracked</span><strong>$24,600</strong></div><div><span>Campaigns</span><strong>6</strong></div><div><span>Broken for</span><strong>9 days</strong></div></div><div class="seq-tracking-affected"><span>Affected</span><b>Enterprise ABX</b><b>EMEA evaluation</b><b>Manufacturing ABX</b><span class="seq-tracking-more">+3 more</span></div></div>`;
    }
    if(id==='names'){const rows=[['Enterprise ABX · Dec 12','Dec 18'],['EMEA evaluation · Dec 10','Dec 18'],['Manufacturing ABX · Dec 15','Dec 18'],['Security proof · Dec 11','Dec 18']];return `<div class="seq-name-visual" aria-label="Four campaign names have end dates that differ from their flight settings"><div class="seq-name-head"><span>Campaign name says</span><span>Flight ends</span></div>${rows.map(([name,date])=>`<div class="seq-name-row"><span>${name}</span><strong>${date}</strong></div>`).join('')}<p>Review the proposed corrections in chat.</p></div>`}
    if(id==='pacing')return `<div class="seq-pacing-visual" aria-label="Nine of twenty-two Demandbase Ads flights are underpacing"><div class="seq-pacing-head"><strong>Q4 flight pacing</strong><span class="seq-pacing-legend"><span><i class="slow" aria-hidden="true"></i>9 underpacing</span><span><i class="on" aria-hidden="true"></i>13 on pace</span></span></div><div class="seq-pacing-track" aria-hidden="true">${Array.from({length:22},(_,i)=>`<i class="${i<9?'slow':'on'}"></i>`).join('')}</div><p>Mojo has a reallocation proposal to review in chat.</p></div>`;
    return '';
  };
  function refreshBuildRule(){const main=document.querySelector('#lifecycle-content .ml-wrap');const recommended=main?.querySelector('[data-source-section="recommended"]');if(!recommended)return;main.querySelector('.seq-build-rule')?.remove();if(isRuleSaved(2)){recommended.insertAdjacentHTML('afterend',`<section class="seq-build-rule is-compact"><details><summary><span>Campaign rule</span><strong>End date required in campaign names</strong><em>Active</em><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3.5 6 4.5 4 4.5-4"/></svg></summary><div class="seq-build-rule-details">${teachCard(2,true)}</div></details></section>`);return}const prompt=state.teach<2?`<p>${state.teach===0?'Confirm the inferred ICP':'Save the budget approval rule'} in Campaigns Feed before setting the campaign rule.</p>${link('Open Feed','HomeSystem.html#feed-insights')}`:teachCard(2,true);recommended.insertAdjacentHTML('afterend',`<section class="seq-build-rule"><div class="seq-build-rule-heading"><h2>Campaign rule</h2></div>${prompt}</section>`)}
  function saveTeachAnswer(){const i=state.teach;if(i>=3)return;const q=teachQuestions[i];push('user',i===1?budgetRuleText():i===0&&state.icpCorrection?`ICP: ${state.icpCorrection}`:q.message);state.teach=i+1;if(state.teach===1&&isRuleSaved(1))state.teach=2;state.icpAdjusting=false;state.undoneRules=(state.undoneRules||[]).filter(rule=>rule!==i);save();push('assistant',`Saved your ${['ICP','budget rule','naming rule'][i]} to Best Practices.`);showSaveToast(i===1?budgetRuleText():i===0&&state.icpCorrection?`ICP: ${state.icpCorrection}`:q.message,i);if(state.teach===2&&page==='HomeSystem.html'){state.teaching=false;save();push('assistant','One more rule: set the campaign naming rule in Build.');}else if(state.teach<3){const next=teachQuestions[state.teach];push('assistant',`${next.title} ${next.detail}`)}else{state.teaching=false;save();push('assistant','Your rules are active. I’ll use them when I check and build campaigns.')}home();refreshBuildRule();refreshFeedRuleCards();renderChat()}
  function home(){if(localStorage.getItem('mojo-board-demandbase-connected-v1')!=='true')return;document.querySelector('#home-feed > .seq-teach')?.remove();document.querySelector('.seq-demo-reset')?.remove()}
  function company(){const icp=document.querySelector('#icp');if(!icp)return;const setMetrics=()=>{icp.querySelectorAll('[data-company-demandbase]').forEach(metric=>{const value=Number(metric.dataset.companyDemandbase);const text=Number.isFinite(value)&&value>0?value.toLocaleString():'—';if(metric.textContent!==text)metric.textContent=text})};setMetrics();new MutationObserver(setMetrics).observe(icp,{childList:true,subtree:true});icp.querySelector('.company-source')?.remove();icp.querySelector('.seq-company-source')?.remove();icp.querySelector('.seq-buyer-roles')?.remove();icp.querySelector('.seq-company-rules')?.remove();icp.insertAdjacentHTML('beforeend',`<div class="seq-company-source"><span class="seq-badge">Inferred</span><span>From your 3 target account lists</span>${seeWhy('company-why')}</div><div class="seq-buyer-roles"><strong>Likely buyer roles</strong><span class="seq-badge">Inferred</span><span>RevOps · Marketing ops · Sales ops</span></div><a class="seq-link seq-company-rules" href="BestPractices.html">${state.teach>=3?'2 company rules':'Company rules'} →</a>`)}
  function practices(){waitFor('#mp-root .mps-list',list=>{const apply=()=>{const current=document.querySelector('#mp-root .mps-list');const ruleKey=state.teach+':'+(state.undoneRules||[]).join(',')+':'+budgetLimit();if(!current||current.dataset.seqReady===ruleKey&&current.querySelectorAll(':scope > .seq-practice').length===3)return;current.dataset.seqReady=ruleKey;current.querySelectorAll(':scope > .seq-practice').forEach(row=>row.remove());current.querySelectorAll(':scope > .mps-row').forEach(row=>row.hidden=true);const counts=document.querySelectorAll('#mp-root .mps-side-nav button span');[3,[0,1,2].filter(isRuleSaved).length,3-[0,1,2].filter(isRuleSaved).length].forEach((value,index)=>{if(counts[index])counts[index].textContent=String(value)});const rules=[['Confirm the ICP','Company',state.icpCorrection||'B2B software · 200–2,000 employees · RevOps, marketing ops, sales ops','Applies to Campaigns, Audiences, AEO'],[budgetRuleText(),'Company','Hold the budget move for team approval.','Applies to Campaigns, Audiences, AEO'],['Campaign names must include the end date.','Campaigns','Check the end date before publishing.','Applies to Campaigns']];rules.forEach(([title,scope,detail,applies],i)=>{current.insertAdjacentHTML('beforeend',`<details class="mps-row seq-practice"><summary><span class="mps-number">${String(i+1).padStart(2,'0')}</span><span class="mps-main"><span class="mps-meta"><span class="mps-origin org">${scope}</span></span><strong>${title}</strong><span class="mps-effect ${isRuleSaved(i)?'active':''}">${applies}</span><span class="mps-owner">${isRuleSaved(i)?'Set by Pam · Today':'Suggested by Mojo'}</span></span><span class="mps-status ${isRuleSaved(i)?'active':'draft'}">${isRuleSaved(i)?'Active':'Suggested'}</span><span class="mps-chevron" aria-hidden="true">⌄</span></summary><div class="mps-detail"><div class="mps-facts"><div><small>The rule</small><p>${esc(detail)}</p></div><div><small>Scope</small><p>${applies}</p></div></div></div></details>`)})};apply();const root=document.getElementById('mp-root');new MutationObserver(()=>apply()).observe(root,{childList:true,subtree:true})})}
  function feed(){
    waitFor('#mf-insights .mfc-section',section=>{
      if(section.dataset.seqReady)return;
      const originals={
        conversion:section.querySelector('[data-finding-id="unassigned-utms"]'),
        names:section.querySelector('[data-finding-id="ended-live"]'),
        pacing:section.querySelector('[data-finding-id="q4-pacing"]'),
        plan:section.querySelector('[data-finding-id="flight-allocation"]')
      };
      if(Object.values(originals).some(card=>!card)){setTimeout(feed,150);return}
      section.dataset.seqReady='true';
      const cards=[
        {id:'conversion',area:'Fix',title:'Conversions stopped tracking on 6 campaigns.',copy:'Since the Nov 3 landing page update, the conversion tag isn’t firing. The campaigns are still spending, so results look worse than they are.',action:'Review both fixes',source:'Campaign tracking',why:'The conversion events stopped after the Nov 3 landing page change. Mojo checked all six campaigns and prepared corrected tracking links.'},
        {id:'names',area:'Fix',title:'4 campaign end dates do not match their names.',copy:'Mojo matched each name to its flight end date. Pam’s naming rule applies.',action:'Review both fixes',source:'Campaign names',why:'The end dates in four campaign names differ from their flight settings. Pam’s active Best Practice requires the end date in every campaign name.'},
        {id:'pacing',area:'Optimize',title:'9 of 22 Demandbase Ads flights are underpacing.',copy:'Mojo found room to rebalance spend across Q4 flights.',action:'Review budget shift',source:'Demandbase Ads',why:'One smaller campaign gets more budget because it was underfunded and its accounts were engaging. Mojo applies the company approval rule before moving spend.'},
        {id:'plan',area:'Optimize',title:'2 campaigns you could launch today',copy:'Mojo has the audience, creative, landing page and budget. Review their reach before launching.',action:'See the Plan',source:'Campaign planning',why:'These campaigns have the inputs needed to launch and reach the buyers named in the current plan.'},
        {id:'launched',area:'Optimize',title:'7 campaigns launched this weekend are showing data',copy:'Mojo is checking delivery and early performance across Demandbase, LinkedIn and Google Ads.',action:'Check performance',source:'Recent launches',why:'The first delivery data has arrived for seven campaigns launched this weekend.'}
      ];
      section.querySelectorAll(':scope > article').forEach(card=>card.classList.add('seq-old-feed-card'));
      cards.forEach((item,index)=>{
        const card=(originals[item.id]||originals.plan).cloneNode(true);
        card.classList.remove('seq-old-feed-card','mfd-filtered-out','mojo-owner-hidden','mfd-top15-hidden');
        card.classList.add('seq-feed-card');
        card.hidden=false;
        card.querySelectorAll('.ma-budget-why,.ma-budget-evidence').forEach(extra=>extra.remove());
        card.removeAttribute('data-finding-id');
        card.dataset.feedArea=item.area;
        card.dataset.feedInitiative={conversion:'Buying-Group Coverage',names:'Event Demand Generation',pacing:'Q4 net-new pipeline'}[item.id]||'';
        card.dataset.urgencyRank=String(index-20);
        card.dataset.seqCard=item.id;
        const tag=card.querySelector('.mfc-area-tag');
        if(tag){tag.textContent=item.area;tag.href=item.id==='plan'?'Strategy.html':item.area==='Fix'?'CampaignLifecycle.html?view=optimize#issues':'Portfolio.html#campaigns'}
        const meta=card.querySelector('.mf-story-meta');
        if(meta){const other=[...meta.children].find(child=>child!==tag);if(other)other.textContent=item.source}
        const title=card.querySelector('h2');
        if(title)title.textContent=item.title;
        const body=card.firstElementChild;
        const description=body?.querySelector('p');
        if(description)description.textContent=item.id==='names'&&!isRuleSaved(2)?'Mojo matched each name to its flight end date. Save the suggested naming rule in Build before applying it.':item.copy;
        if(item.stats){const chart=card.querySelector('.mfc-chart,.mfc-stats');if(chart)chart.outerHTML='<dl class="mfc-stats">'+item.stats.map(([label,value])=>`<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')+'</dl>'}
        if(['conversion','names','pacing','plan','launched'].includes(item.id)){const chart=card.querySelector('.mfc-chart,.mfc-stats');if(chart)chart.outerHTML=feedVisual(item.id)}
        const primary=card.querySelector('.mfc-primary');
        if(primary){primary.textContent=item.action+' →';primary.href=item.id==='launched'?'Portfolio.html#campaigns':'#';if(item.id!=='launched')primary.dataset.seq=item.id==='plan'?'idea':item.id==='pacing'?'budget':'approve-'+item.id;else primary.removeAttribute('data-seq')}
        const why=card.querySelector('.mojo-see-why');
        if(why){why.removeAttribute('data-mfc-action');why.dataset.seq='why-'+item.id}
        const discuss=card.querySelector('[data-mfc-action="discuss"]');
        if(discuss){discuss.removeAttribute('data-mfc-action');discuss.dataset.seq='discuss-'+item.id}
        card.dataset.seqWhy=item.why;
        card.dataset.mojoOwner='Pam Beesly';
        card.querySelectorAll('.mojo-card-owner').forEach(badge=>badge.remove());
        section.prepend(card);
      });
      if(state.budgetRequested||state.budgetApplied){const budgetAction=section.querySelector('.seq-feed-card[data-seq-card="pacing"] .mfc-primary');if(budgetAction)budgetAction.textContent=state.budgetApplied?'✓ Budget shift applied':'✓ Sent for team approval'}
      const controls=document.querySelector('.mfd-unified-controls');
      const planFilter=controls?.querySelector('[data-feed-filter="Plan"]');
      if(planFilter?.getAttribute('aria-pressed')==='true')controls.querySelector('[data-feed-filter="Optimize"]')?.click();
      planFilter?.remove();
      if(state.approvedFixes)markFixed();
      document.dispatchEvent(new Event('mojo:board-feed-updated'));
      refreshFeedRuleCards();
      if(firstFeedReveal){section.classList.add('seq-first-feed-reveal');section.querySelectorAll(':scope > .seq-feed-card').forEach((card,index)=>card.style.setProperty('--seq-reveal-index',String(Math.min(index,7))))}
      revealFeedEntry();
    });
  }
  function refreshFeedRuleCards(){
    const section=document.querySelector('#mf-insights .mfc-section');
    if(!section||!section.dataset.seqReady)return;
    section.querySelectorAll(':scope > .seq-teach-feed-card').forEach(card=>card.remove());
    const template=section.querySelector(':scope > .seq-feed-card[data-seq-card="plan"]');
    if(!template)return;
    // Company questions start in the feed; the campaign naming rule is set in Build.
    // Once saved, all three use the feed's existing Best Practices receipt pattern.
    for(let i=2;i>=0;i--){
      const q=teachQuestions[i],saved=isRuleSaved(i),scope=i===2?'Campaigns':'Company';
      if(i===2&&!saved)continue;
      const card=template.cloneNode(true);
      card.classList.add('seq-teach-feed-card');
      card.querySelector('.seq-campaign-visual')?.remove();
      card.classList.remove('mfd-filtered-out','mojo-owner-hidden','mfd-top15-hidden');
      card.hidden=false;
      card.dataset.seqCard='teach-'+i;
      card.dataset.feedArea=i===2?'Build':'Optimize';
      card.dataset.urgencyRank=String(-30+i);
      card.dataset.seqWhy=i===0?'Mojo inferred this buyer profile from your three Demandbase target account lists. Confirm it before Mojo uses it in campaigns.':i===1?'Budget moves above the selected threshold will wait for your team. This company rule applies in Campaigns, Audiences and AEO.':'Campaign names will include their end date. Mojo checks this rule during QA before publishing.';
      if(saved){card.classList.add('seq-saved-receipt-card');card.innerHTML=savedRuleReceipt(i);section.prepend(card);continue}
      const tag=card.querySelector('.mfc-area-tag');
      if(tag){tag.textContent=i===2?'Build':'Optimize';tag.href=i===2?'CampaignLifecycle.html?view=build':'Strategy.html'}
      const meta=card.querySelector('.mf-story-meta');
      if(meta){const other=[...meta.children].find(child=>child!==tag);if(other)other.textContent=saved?scope+' · Set by Pam · Today':i===0?'Company · From your 3 target account lists':'Company · Suggested by Mojo'}
      const title=card.querySelector('h2');if(title)title.textContent=q.title;
      const description=card.firstElementChild?.querySelector('p');
      if(description)description.textContent=q.detail.replace(/^Suggested: /,'');
      const stats=card.querySelector('.mfc-chart,.mfc-stats');
      const ruleStats=i===1?feedVisual('budgetRule'):i===0?feedVisual('icp'):'<dl class="mfc-stats"><div><dt>Scope</dt><dd>'+scope+'</dd></div><div><dt>Applies to</dt><dd>Campaigns</dd></div><div><dt>Status</dt><dd>To confirm</dd></div></dl>';
      if(stats)stats.outerHTML=ruleStats;else card.querySelector('.mfc-actions')?.insertAdjacentHTML('beforebegin',ruleStats);
      const primary=card.querySelector('.mfc-primary');
      if(primary){primary.textContent=i===2?'Set this in Build →':i===1?'Save company rule →':'Review with Mojo →';primary.href=i===2?'CampaignLifecycle.html?view=build':'#';if(i<2)primary.dataset.seq=i===1?'save-budget-choice':'teach-card-'+i;else primary.removeAttribute('data-seq')}
      const why=card.querySelector('.mojo-see-why');if(why){why.dataset.seq='why-teach-'+i;why.removeAttribute('data-mfc-action')}
      const discuss=card.querySelector('[data-mfc-action="discuss"]');if(discuss){discuss.dataset.seq='discuss-teach-'+i;discuss.removeAttribute('data-mfc-action')}
      section.prepend(card);
    }
    document.dispatchEvent(new Event('mojo:board-feed-updated'));
  }
  function markFixed(){
    document.querySelectorAll('.seq-feed-card[data-feed-area="Fix"]').forEach(card=>card.hidden=true);
    const section=document.querySelector('#mf-insights .mfc-section');
    if(section&&!section.querySelector('.seq-fix-clear'))section.insertAdjacentHTML('afterbegin','<div class="seq-fix-clear" hidden>Nothing broken right now. You cleared everything from last week.</div>');
    const update=()=>{const clear=section?.querySelector('.seq-fix-clear');if(clear)clear.hidden=document.querySelector('[data-feed-filter="Fix"][aria-pressed="true"]')===null};
    document.querySelector('.mfd-area-filters')?.addEventListener('click',()=>setTimeout(update,0));
    update();
  }
  function plan(){waitFor('.mso-detail',detail=>{
    if(detail.dataset.seqReady)return;
    detail.dataset.seqReady='true';
    document.querySelector('.mso-strategy-statement')?.remove();
    document.querySelector('.mso-tabs [data-view="lookbook"]')?.remove();
    document.querySelector('#mso-lookbook')?.remove();
    const tabs=document.querySelector('.mso-tabs');
    if(tabs&&tabs.querySelectorAll('[role="tab"]').length===1)tabs.hidden=true;
    const signal=detail.querySelector('.mso-q4-signal > p');
    if(signal){
      signal.remove();
      const signalHead=detail.querySelector('.mso-q4-signal .mso-section-head');
      signalHead.querySelector('h3').textContent='Signals behind this idea';
      detail.querySelector('.mso-q4-signal .mso-section-head').insertAdjacentHTML('afterend','<div class="seq-visible-signals" aria-label="Signals behind this idea"></div>');
      const updateSignals=()=>{
        const area=document.querySelector('.mso-strategy-areas [data-area].active')?.dataset.area||'buying_group';
        const signals={
          buying_group:[['Q4 results','1,146','engaged accounts','Most reached one buyer'],['Demandbase intent','2','roles missing','Finance and security'],['Q3 wins','IT','buyer role','A useful comparison for the next ads']],
          regional:[['Q4 results','12.7×','pipeline per dollar','Enterprise led the quarter'],['Demandbase accounts','520','to test','EMEA and Manufacturing'],['Buying group','3+','roles to reach','Build on engaged accounts']],
          capture:[['AI answers','1 of 4','','Comparison answers mention Acme'],['Demandbase intent','~180','','Target accounts researching alternatives'],['Q4 results','2×','','Meeting rate when comparison visitors were retargeted']],
          customer_growth:[['Customer accounts','280','to review','Existing customers'],['Account engagement','25','showing interest','Another workflow'],['Pipeline goal','3','conversations','Expansion opportunity']]
        }[area];
        const visual=area==='buying_group'?`<div class="seq-evidence-journey" aria-label="1,146 accounts engaged in Q4, most reached one buyer; test finance and security next"><div class="seq-journey-main"><div class="seq-journey-stage"><span class="seq-journey-kicker">Q4 engagement</span><strong class="seq-journey-number">1,146 <small>accounts engaged</small></strong></div><div class="seq-journey-stage seq-journey-action"><span class="seq-journey-kicker">Next ad test</span><strong>Finance and security</strong><p>Most accounts reached just one buyer.</p></div></div></div>`:`<div class="seq-evidence-story seq-evidence-generic">${signals.map(([label,value,unit,description])=>`<div><span class="seq-evidence-eyebrow">${esc(label)}</span><strong>${esc(value)}</strong><span>${esc(unit)}</span><p>${esc(description)}</p></div>`).join('')}</div>`;
        detail.querySelector('.seq-visible-signals').innerHTML=visual;
      };
      updateSignals();
      document.querySelector('.mso-strategy-areas')?.addEventListener('click',event=>{if(event.target.closest('[data-area]'))requestAnimationFrame(updateSignals)});
      const signalLinks=detail.querySelector('.mso-q4-signal .mso-signal-links');
      signalLinks?.insertAdjacentHTML('beforeend','<a href="Portfolio.html#campaigns">View Q4 evidence in Report →</a>');
      if(signalLinks)signalHead.append(signalLinks);
    }
    const ideas=detail.querySelector('.mso-ideas-plan .mso-section-head');
    if(ideas&&!detail.querySelector('.seq-add-idea')){const grid=detail.querySelector('.mso-ideas-plan .mso-option-grid');if(grid){const column=document.createElement('div');column.className='seq-options-column';grid.before(column);column.append(grid);column.insertAdjacentHTML('beforeend',`<button type="button" class="seq-add-idea" data-seq="add-idea">+ Add your own idea</button>`)}}
    const optionColumn=detail.querySelector('.mso-ideas-plan .seq-options-column');
    if(optionColumn){
      const sources=document.createElement('details');
      sources.className='seq-plan-sources';
      sources.setAttribute('aria-label','Sources');
      optionColumn.append(sources);
      const renderSources=()=>{
        const area=document.querySelector('.mso-strategy-areas [data-area].active')?.dataset.area||'buying_group';
        const sourceSets={
          buying_group:[['Demandbase buying groups','Who is engaged and which roles are missing','Today'],['Q3 campaign results','Conversion rates behind the opportunity estimate','Oct 31'],['Gong','14 late-stage calls mentioned security or cost','Nov 9'],['Your Q1 plan','Budget available for Land','Nov 12']],
          regional:[['Q4 campaign results','Returns from Enterprise, EMEA and Manufacturing','Oct 31'],['Demandbase account lists','520 Evaluation accounts in EMEA and Manufacturing','Today'],['Demandbase buying groups','Which buyer roles are engaged','Today'],['Your Q1 plan','Budget available for Demand','Nov 12']],
          capture:[['AI answer checks','Acme appeared in 1 of 4 comparison answers','Nov 9'],['Demandbase intent','About 180 accounts researched alternatives','Today'],['Q4 campaign results','Comparison retargeting meeting rate','Oct 31'],['Your Q1 plan','Budget available for Brand','Nov 12']],
          customer_growth:[['Demandbase account lists','Current customers in the expansion audience','Today'],['Demandbase intent','Interest in another workflow','Today'],['Q4 campaign results','Customer campaign engagement','Oct 31'],['Your Q1 plan','Budget available for Expand','Nov 12']]
        };
        const rows=sourceSets[area]||sourceSets.buying_group;
        const sourceIcon=name=>{
          if(name.startsWith('Demandbase'))return '<img src="assets/demandbase.png" alt="">';
          if(name==='Gong')return '<img src="assets/gong.svg" alt="">';
          if(name==='Your Q1 plan')return '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/></svg>';
          return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20V5a2 2 0 0 1 2-2h9l5 5v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Z"/><path d="M15 3v5h5M8 16l3-3 2 2 3-4"/></svg>';
        };
        sources.innerHTML=`<summary class="seq-plan-sources-head"><span>Sources</span><svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 7.5 5 5 5-5"/></svg></summary><div class="seq-plan-sources-content"><ul>${rows.map(([name,description,date])=>`<li>${sourceIcon(name)}<div><strong>${esc(name)}</strong><span> · ${esc(description)}</span></div><time>Updated ${esc(date.toLowerCase()==='today'?'today':date)}</time></li>`).join('')}</ul>${area==='buying_group'?'<p class="seq-source-limit"><strong>What Mojo didn’t account for:</strong> Holiday weeks (Dec 22 – Jan 2) usually slow Evaluation meetings. Mojo hasn’t adjusted for that.</p>':''}</div>`;
      };
      renderSources();
      document.querySelector('.mso-strategy-areas')?.addEventListener('click',event=>{if(event.target.closest('[data-area]'))requestAnimationFrame(renderSources)});
    }
  })}
  function build(){waitFor('#lifecycle-content [data-source-section="recommended"] .ml-build-row',row=>{
    const main=row.closest('.ml-wrap');
    refreshBuildRule();
    const hasSavedLive=syncSavedCampaignToLive();
    if(!main||main.dataset.seqReady)return;
    main.querySelectorAll('.seq-build-draft').forEach(entry=>entry.remove());
    main.dataset.seqReady='true';
    ['qa','ready'].forEach(id=>{const section=main.querySelector(`[data-source-section="${id}"]`);const count=section?.querySelector('.ml-section-count');if(count)count.textContent=String(section.querySelectorAll('.ml-build-row:not([hidden])').length)});
    if(state.draft==='none'||state.draft==='live'&&hasSavedLive)return;
    if(state.draft==='live'&&!main.querySelector('[data-source-section="live"]')){const ready=main.querySelector('[data-source-section="ready"]');ready?.insertAdjacentHTML('afterend','<section class="ml-section" data-source-section="live"><div class="ml-toolbar"><div><h2>Live</h2><span class="ml-section-count">0</span></div></div><div class="ml-build-list"></div></section>')}
    const first=main.querySelector('[data-source-section="recommended"] [data-plan-id="buying_group"]');
    const destination=state.draft==='live'?main.querySelector('[data-source-section="live"]'):state.draft==='ready'?main.querySelector('[data-source-section="ready"]'):state.draft==='qa-review'?main.querySelector('[data-source-section="qa"]'):main.querySelector('[data-source-section="draft"]');
    if(!first||!destination)return;
    destination.querySelector('.ml-build-empty')?.remove();
    const entry=first.cloneNode(true);
    entry.classList.remove('ml-build-recommended');
    entry.classList.add('ml-build-draft','ml-build-work-card','seq-build-draft');
    entry.removeAttribute('data-item');
    entry.querySelector('h3').textContent=`Buying group follow-up${['ready','live'].includes(state.draft)?' · Dec 18':''}`;
    entry.querySelector('p').textContent='1,146 engaged accounts'+(state.customerExcluded?' · current customers excluded':'');
    const stageLabel=state.draft==='live'?'Live':state.draft==='ready'?'Ready to publish':state.draft==='qa-review'?'Mojo QA':'Draft';
    entry.querySelector('.ml-build-row-main').insertAdjacentHTML('afterbegin',`<div class="ml-build-row-head"><span class="ml-area">Land</span><span class="ml-build-stage">${stageLabel}</span></div>`);
    if(state.draft==='ready')entry.classList.add('ml-build-ready');
    if(state.draft==='qa-review')entry.classList.add('ml-build-qa');
    if(state.draft==='live')entry.classList.add('ml-build-live');
    entry.querySelector('.ml-build-budget')?.remove();
    entry.querySelector('.ml-build-recommendation')?.remove();
    entry.querySelector('.ml-build-row-main').insertAdjacentHTML('beforeend',`${state.draft==='ready'?'<div class="ml-build-passed"><span>Audience</span><span>Budget rule</span><span>Tracking</span><span>Ad specs</span><span>Name rule</span></div>':state.draft==='live'?'<div class="ml-build-passed"><span>Published to Demandbase Ads</span><span>Mojo is watching delivery</span></div>':`<div class="ml-build-checklist"><div class="ml-build-checklist-top"><strong>${state.draft==='qa-review'?'Mojo found one item to review':'Campaign brief saved'}</strong><span>${state.draft==='qa-review'?'Mojo QA':'Build'}</span></div><ul><li class="is-done"><span class="ml-build-check" aria-hidden="true">✓</span><span>Audience, message and spend saved</span></li><li><span class="ml-build-pending" aria-hidden="true"></span><span>${state.draft==='qa-review'?'Review Mojo’s campaign name finding':'Build and check tracking in Chat'}</span></li></ul></div>`}<details class="ml-build-blueprint-details"><summary>View blueprint <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 7.5 5 5 5-5"/></svg></summary><dl class="ml-build-blueprint"><div><dt>Audience</dt><dd>1,146 engaged accounts${state.customerExcluded?' · current customers excluded':''}</dd></div><div><dt>Message</dt><dd>Finance and security proof by role</dd></div><div><dt>Where</dt><dd>Demandbase Ads</dd></div><div><dt>Spend</dt><dd>$15,000</dd></div><div><dt>Flight</dt><dd>Nov 11–Dec 18</dd></div><div><dt>Goal</dt><dd>35 accounts gain a third buyer role</dd></div></dl></details>`);
    const primary=entry.querySelector('[data-discuss]');
    if(primary){primary.removeAttribute('data-discuss');primary.dataset.seq='draft';primary.textContent=state.draft==='qa-review'?'Review QA in Chat →':state.draft==='ready'?'Review to publish →':state.draft==='live'?'View in Chat →':'Build in Chat →'}
    const why=entry.querySelector('[data-why]');
    if(why){why.removeAttribute('data-why');why.classList.add('mojo-see-why');why.dataset.seq='build-why'}
    destination.querySelector('.ml-build-list')?.prepend(entry);
    ['draft','qa','ready','live'].forEach(id=>{
      const section=main.querySelector(`[data-source-section="${id}"]`);
      if(!section)return;
      const list=section.querySelector('.ml-build-list');
      const count=section.querySelector('.ml-section-count');
      const rows=list?.querySelectorAll('.ml-build-row:not([hidden])').length||0;
      if(count)count.textContent=String(rows);
      if(rows)list?.querySelector('.ml-build-empty')?.remove();
      else if(list&&!list.querySelector('.ml-build-empty'))list.innerHTML=`<div class="ml-build-empty"><span>${id==='qa'?'No campaigns for Mojo to check yet. Campaigns move here after setup.':id==='ready'?'Nothing ready to publish yet. Campaigns move here after Mojo completes QA.':id==='live'?'Live campaigns appear here after publishing.':'No drafts saved yet.'}</span></div>`;
    });
  })}
  function report(){if(state.draft!=='live')return;waitFor('#ia-panel-campaigns .md-dashboard-summary',summary=>{const main=summary.parentElement;if(main.querySelector('.seq-report-live'))return;summary.insertAdjacentHTML('beforebegin',`<section class="seq-report-live" aria-label="Live campaign"><div class="seq-report-live-head"><div><span class="seq-report-kicker">New campaign</span><h3>Buying group follow-up · Dec 18</h3><p>Launched in Demandbase Ads</p></div><span class="seq-report-live-status"><span aria-hidden="true">✓</span>Live</span></div><div class="seq-report-live-facts"><div><small>Audience</small><strong>1,146 engaged accounts${state.customerExcluded?' · current customers excluded':''}</strong></div><div><small>Budget</small><strong>$15,000</strong></div><div><small>Mojo is watching</small><strong>Tracking, pacing and buyer engagement</strong></div></div><details class="seq-report-details"><summary>Campaign details <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 7.5 5 5 5-5"/></svg></summary><dl><div><dt>Creative</dt><dd>Finance and security proof ads</dd></div><div><dt>Flight</dt><dd>Nov 11–Dec 18, 2026</dd></div><div><dt>Goal</dt><dd>35 accounts gain a third buyer role · about 3 new opportunities</dd></div></dl></details></section>`)})}
  const typeReply=(text,kind='')=>push('assistant',text,true,kind);
  function sendPrompt(text){push('user',text);thinking=true;renderChat();setTimeout(()=>{thinking=false;const low=text.toLowerCase();const financeSecurityExcerpt=/tell me more about this from signals behind this idea:\s*[“"']?finance and security[”"']?\s*$/i.test(text.trim());if(state.icpAdjusting&&state.teach===0){state.icpCorrection=text;state.icpAdjusting=false;save();typeReply('I updated the proposed profile with your change. Review it and choose whether to use it.')}else if(state.context==='Q4 budget shift'&&/security|underfunded|why.*budget/.test(low)){typeReply('The security flight has strong buyer engagement but a smaller budget than comparable Q4 flights. The proposal adds $8,000, moving it from $40,000 to $48,000. That is a 20% increase, so your saved approval rule routes it to the team before any spend moves.')}else if(financeSecurityExcerpt||/why.*finance|q3 wins|why.*security/.test(low)){typeReply('IT showed up in Q3 wins, but most of the 1,146 accounts reached by ads still have just one engaged buyer. I’d use that IT proof as a baseline, then give finance a cost-and-payback case and security a short security-review brief. Run those as separate follow-ups to the same accounts. Before moving more budget, check which accounts add a second or third buyer and which of those turn into meetings.','buyer-roles')}else if(/what did you change/.test(low))typeReply('I excluded current customers from the audience, as you asked.');else if(/draft|leave out|exclude/.test(low)){state.customerExcluded=/leave out|exclude/.test(low)||state.customerExcluded;typeReply(`I’ll use the 1,146 engaged accounts${state.customerExcluded?', exclude current customers':''}. The goal is 35 accounts with a third buyer role and about 3 new opportunities, based on Q3 conversion rates. Demandbase Ads, $15,000, Nov 11–Dec 18.`);state.draft='draft';state.context='Buying group follow-up draft';state.chatCardAt=state.messages.length;save();renderChat();const main=document.querySelector('#lifecycle-content .ml-wrap');if(main){delete main.dataset.seqReady;build()}}else typeReply('I can show the source behind this and change the draft with you.');renderChat()},1050)}
  document.addEventListener('mojo:chat-sent',e=>{if(state.chatOpen&&e.detail?.prompt)sendPrompt(e.detail.prompt)});
  document.addEventListener('change',e=>{if(e.target.id==='chatOn'){state.chatOpen=e.target.checked;save();if(state.chatOpen)renderChat()}else if(e.target.name==='seq-budget-threshold'){state.budgetThreshold=e.target.value;save();document.querySelectorAll('.seq-budget-choices label').forEach(label=>label.classList.toggle('selected',label.querySelector('input[type="radio"]')?.checked));const custom=document.querySelector('[data-seq-custom-threshold]');if(custom)custom.disabled=state.budgetThreshold!=='other'}else if(e.target.matches('[data-seq-custom-threshold]')){state.customThreshold=Math.max(1,Math.min(100,Number(e.target.value)||15));e.target.value=state.customThreshold;save()}});
  document.addEventListener('click',e=>{const target=e.target.closest('[data-seq]');if(!target)return;e.preventDefault();const action=target.dataset.seq;
    if(action==='teach'){state.teaching=true;openChat('How Mojo works with Acme Co');const q=teachQuestions[Math.min(state.teach,2)];push('assistant',`${q.title} ${q.detail}`)}
    else if(action==='teach-next'){saveTeachAnswer()}
    else if(action==='icp-yes'){if(state.teach===0)saveTeachAnswer()}
    else if(action==='icp-no'){state.icpAdjusting=true;save();push('assistant','What should I change about the industry, company size, or buyer roles?');document.querySelector('.chatpane textarea')?.focus()}
    else if(action==='dismiss-toast'){document.querySelector('.seq-save-toast')?.remove()}
    else if(action.startsWith('review-saved-rule-')){reviewSavedRule(Number(action.slice('review-saved-rule-'.length)))}
    else if(action==='save-budget-choice'){if(state.budgetThreshold==='other'){const value=document.querySelector('[data-seq-custom-threshold]')?.value;state.customThreshold=Math.max(1,Math.min(100,Number(value)||15))}if(state.teach===1){saveTeachAnswer()}else{state.savedRules=[...new Set([...(state.savedRules||[]),1])];state.undoneRules=(state.undoneRules||[]).filter(rule=>rule!==1);save();showSaveToast(budgetRuleText(),1);refreshFeedRuleCards();refreshBuildRule()}}
    else if(action.startsWith('undo-rule-')){const i=Number(action.slice('undo-rule-'.length));if(!Number.isInteger(i)||i<0||i>=teachQuestions.length)return;state.undoneRules=[...new Set([...(state.undoneRules||[]),i])];save();refreshFeedRuleCards();refreshBuildRule();push('assistant','Removed from Best Practices. You can save it again if you change your mind.')}
    else if(action.startsWith('teach-card-')){const i=Number(action.slice('teach-card-'.length));if(state.undoneRules?.includes(i)){state.undoneRules=state.undoneRules.filter(rule=>rule!==i);save();refreshFeedRuleCards();refreshBuildRule();push('assistant','Saved to Best Practices again.')}else if(i!==state.teach){state.teaching=true;openChat('How Mojo works with Acme Co');push('assistant',`Let’s do these in order. ${teachQuestions[state.teach]?.title||'Your rules are active.'}`)}else{state.teaching=true;openChat(i===2?'Campaign naming rule':'How Mojo works with Acme Co');push('assistant',`${teachQuestions[i].title} ${teachQuestions[i].detail}`)}}
    else if(action==='teach-adjust'){document.querySelector('.chatpane textarea')?.focus()}
    else if(action==='approve-conversion'||action==='approve-names'){state.fixReview=true;save();openChat('Campaign fixes');push('assistant','I prepared both corrections. Review the changes before I apply them.');}
    else if(action==='fix-apply'){if(!isRuleSaved(2))return;state.approvedFixes=true;state.fixReview=false;save();document.dispatchEvent(new Event('mojo:fix-approved'));push('assistant','Both corrections are in place. Nothing broken right now.');}
    else if(action==='fix-close'){state.fixReview=false;save();renderChat()}
    else if(action==='budget'){state.budgetPreview=true;save();openChat('Q4 budget shift');push('assistant','I found a $20,000 shift worth reviewing. The security flight gets more because its buyers are engaged. Here is the proposal and approval rule.');}
    else if(action==='budget-send'){if(!isRuleSaved(1)||!budgetNeedsApproval())return;state.budgetRequested=true;state.budgetPreview=false;save();push('assistant','Sent for team approval. No budget has moved yet.');const budgetAction=document.querySelector('.seq-feed-card[data-seq-card="pacing"] .mfc-primary');if(budgetAction)budgetAction.textContent='✓ Sent for team approval';}
    else if(action==='budget-apply'){if(!isRuleSaved(1)||budgetNeedsApproval())return;state.budgetApplied=true;state.budgetPreview=false;save();push('assistant','Budget shift applied. The security flight is now $48,000, and I’ll watch its pacing and buyer engagement.');const budgetAction=document.querySelector('.seq-feed-card[data-seq-card="pacing"] .mfc-primary');if(budgetAction)budgetAction.textContent='✓ Budget shift applied';}
    else if(action==='budget-close'){state.budgetPreview=false;save();renderChat()}
    else if(action==='idea'){location.href='Strategy.html#next-test'}
    else if(action.startsWith('why-')){const card=target.closest('.seq-feed-card');if(!card)return;const details=whyDetails[action]||{};window.MojoSeeWhy?.open({title:card.querySelector('h2')?.textContent,reason:card.dataset.seqWhy,source:card.querySelector('.mf-story-meta span')?.textContent||'Connected campaign data',...details},target)}
    else if(action.startsWith('discuss-')){const card=target.closest('.seq-feed-card');openChat(card?.querySelector('h2')?.textContent||'Campaign insight');push('assistant','What would you like to check or change?')}
    else if(action==='plan-why'||action==='company-why'||action==='build-why'){const isPlan=action==='plan-why',isBuild=action==='build-why';window.MojoSeeWhy?.open(isPlan||isBuild?{title:'Buying group follow-up',reason:'1,146 accounts engaged with ads, but most had only one buyer engaged. Finance and security are the roles to test next.',source:'Q4 campaign results and Demandbase buying groups',triggerType:'Mojo Brain',triggerReason:'Most engaged accounts reached only one buyer role, leaving finance and security to test next.',check:'Review the selected audience and campaign blueprint before building.',href:'Portfolio.html#campaigns',linkLabel:'Open campaign results'}:{title:'Acme Co ICP',reason:'Mojo inferred this buyer profile from the account lists and buyer roles already in Demandbase.',source:'Three Demandbase target account lists',triggerType:'Inferred Best Practice',triggerReason:'The same company size and operations buyer roles recur across the connected lists.',check:'Correct the ICP before using it to build campaign audiences.',href:'Company.html#icp',linkLabel:'Review the ICP'},target)}
    else if(action==='draft'){openChat('Buying group follow-up idea');if(state.draft==='none'&&!state.messages.some(item=>item.role==='assistant'&&item.text===draftIntro))push('assistant',draftIntro)}
    else if(action==='qa'){state.draft='qa-review';save();push('assistant',isRuleSaved(2)?'Mojo found one issue during QA: the campaign name is missing its Dec 18 flight end date. Pam’s active Campaigns rule requires it. Review Mojo’s proposed correction.':'Mojo started QA and found the campaign name is missing its Dec 18 flight end date. Review Mojo’s proposed correction.');const main=document.querySelector('#lifecycle-content .ml-wrap');if(main){delete main.dataset.seqReady;build()}document.querySelector('[data-source-section="qa"]')?.scrollIntoView({block:'start',behavior:'smooth'})}
    else if(action==='qa-apply'){state.draft='ready';save();push('assistant',`Name corrected to “Buying group follow-up · Dec 18.” Mojo’s QA passed.${state.customerExcluded?' Current customers are excluded.':''} Ready for final review.`);renderChat();const main=document.querySelector('#lifecycle-content .ml-wrap');if(main){delete main.dataset.seqReady;build()}}
    else if(action==='publish-review'){state.publishReview=true;save();renderChat()}
    else if(action==='publish-back'){state.publishReview=false;save();renderChat()}
    else if(action==='publish'){if(!state.publishReview||state.draft!=='ready')return;state.draft='live';save();push('assistant','It’s live! Demandbase Ads is delivering Buying group follow-up. I’ll watch tracking, pacing and buyer engagement, and flag anything that needs you.');renderChat();const main=document.querySelector('#lifecycle-content .ml-wrap');if(main){delete main.dataset.seqReady;build()}const card=document.querySelector('.chatpane .seq-chat-draft');if(!celebrateFirstLaunch(card))card?.classList.add('seq-published-pop')}
    else if(action==='add-idea'){openChat('New campaign idea');push('assistant','What audience, event or outcome should we plan for?')}
    else if(action==='ads-role'){openChat('Buying group follow-up idea');push('assistant','I have two ad directions ready: finance gets the cost and pipeline proof; security gets the Salesforce integration and trust proof. I can refine either before drafting.')}
  });
  function start(){const chatToggle=document.getElementById('chatOn');if(chatToggle)chatToggle.checked=false;save();if(page==='Portfolio.html')document.title='Mojo — Report';{const contexts={'Home.html':'Home','Company.html':'Acme Co ICP','BestPractices.html':'Best Practices','HomeSystem.html':'Campaigns feed','Strategy.html':'Buying group follow-up idea','CampaignLifecycle.html':'Buying group follow-up draft','Portfolio.html':state.draft==='live'?'Buying group follow-up · Live':'Campaign results'};if(state.chatPage!==page){state.chatPage=page;state.chatStart=state.messages.length;state.context=page==='Home.html'&&state.teaching?'How Mojo works with Acme Co':contexts[page]||state.context;save()}else if(!state.context){state.context=contexts[page]||'Mojo';save()}}if(state.chatOpen){const toggle=document.getElementById('chatOn');if(toggle&&!toggle.checked){toggle.checked=true;toggle.dispatchEvent(new Event('change',{bubbles:true}))}renderChat()}if(page==='Home.html')home();if(page==='Company.html')company();if(page==='BestPractices.html')practices();if(page==='HomeSystem.html')feed();if(page==='Strategy.html')plan();if(page==='CampaignLifecycle.html')build();if(page==='Portfolio.html')report()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
