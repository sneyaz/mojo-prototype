/* Goal-led planning and reviewed shortcuts. All changes remain local drafts. */
(() => {
  const $ = (selector, root=document) => root.querySelector(selector);
  const make = (tag, className, text) => { const node=document.createElement(tag); node.className=className||''; if(text!=null)node.textContent=text; return node; };
  const money = n => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n);
  const rules = () => { try { return JSON.parse(localStorage.getItem('mojo-rules-v1')||'{}'); } catch { return {}; } };

  function setupGrowthPlay() {
    const panel=$('#ia-panel-create'), wizard=$('#ia-bulk'); if(!panel||!wizard)return;
    const section=make('section','mg-growth-play');
    section.innerHTML=`<h2>Start with the outcome</h2><p>Set the goal, then check whether the budget and timeline can support it before reviewing campaign drafts.</p><div class="mg-intent-grid"><label>Pipeline target · USD<input id="mg-target" type="number" min="1" value="500000"></label><label>From which companies?<input id="mg-segment" type="text" value="Retail companies"></label><label>Company size<select id="mg-size"><option>500+ employees</option><option>1,000+ employees</option><option>All sizes</option></select></label><label>Budget · USD<input id="mg-total" type="number" min="1" value="120000"></label><label>Timeframe<select id="mg-timeframe"><option value="3">This quarter · 3 months</option><option value="6">6 months</option><option value="12">12 months</option></select></label><label>Modeled pipeline per $1 spent<input id="mg-return" type="number" min="0.1" step="0.1" value="3"></label></div><p class="mg-intent-summary" id="mg-intent-summary"></p><p class="mg-assumption">The return rate is an editable planning assumption. Segment-level historical CAC and conversion rates are not connected, so Mojo cannot validate this forecast yet.</p><details class="mg-context"><summary>Add creative reference for review</summary><label>Reference URL<input id="mg-context-url" type="url" placeholder="https://example.com/launch"></label><label>Reference PDF<input id="mg-context-file" type="file" accept="application/pdf,.pdf"></label><p>The URL and PDF filename are saved with the draft for review. The PDF is not uploaded or read, and neither reference changes targeting or budget math.</p></details><button type="button" class="mc-btn primary" id="mg-draft-play">Draft a Growth Play →</button><div id="mg-play-result" aria-live="polite"></div>`;
    wizard.before(section);
    const fromAccountQueue=new URLSearchParams(location.search).has('audience');
    const pathDivider=make('p','mg-path-divider','Or build from an account list');wizard.before(pathDivider);
    const wizardHeading=$('h2',wizard);
    if(fromAccountQueue){section.hidden=true;pathDivider.hidden=true;}
    else if(wizardHeading)wizardHeading.textContent='Build from an account list';
    const result=$('#mg-play-result',section);
    const intentSummary=()=>{const target=Number($('#mg-target',section).value)||0,budget=Number($('#mg-total',section).value)||0,segment=$('#mg-segment',section).value.trim()||'selected companies';$('#mg-intent-summary',section).textContent=`Generate ${money(target)} in pipeline from ${segment.toLowerCase()} with ${$('#mg-size',section).value.toLowerCase()} using ${money(budget)} over ${$('#mg-timeframe',section).selectedOptions[0].textContent.toLowerCase()}.`;};
    section.querySelectorAll('.mg-intent-grid input,.mg-intent-grid select').forEach(input=>input.addEventListener('input',intentSummary));intentSummary();
    $('#mg-draft-play',section).addEventListener('click',()=>{
      const target=Number($('#mg-target',section).value),initialBudget=Number($('#mg-total',section).value),rate=Number($('#mg-return',section).value),months=Number($('#mg-timeframe',section).value),segment=$('#mg-segment',section).value.trim(),size=$('#mg-size',section).value;
      if(!(target>0&&initialBudget>0&&rate>0&&months>0&&segment)){result.textContent='Enter a pipeline target, company segment, budget, timeframe and positive planning rate.';return;}
      result.replaceChildren();
      const modeled=initialBudget*rate,hasGap=modeled<target*.95,budgetNeeded=Math.ceil(target/rate),monthsNeeded=Math.ceil(months*target/modeled);
      const feasibility=make('section','mg-feasibility');
      feasibility.innerHTML=`<h3>First, does the plan add up?</h3><p>At your editable ${rate.toFixed(1)}× return assumption, ${money(initialBudget)} models ${money(modeled)} in pipeline over ${months} months. ${hasGap?`That is ${money(target-modeled)} short of your ${money(target)} goal.`:'The modeled result reaches the stated goal.'}</p><span class="mc-confidence mc-confidence-low">Low confidence · no segment history</span>`;
      const options=make('div','mg-feasibility-options');
      const choices=hasGap?[['specified','Keep the brief as specified',`${money(modeled)} modeled over ${months} months`],['budget','Increase the budget',`${money(budgetNeeded)} needed at ${rate.toFixed(1)}× return`],['timeline','Extend the timeline',`${monthsNeeded} months at the current budget and monthly pace`]]:[['specified','Continue as specified',`${money(modeled)} modeled over ${months} months`]];
      choices.forEach(([value,label,detail])=>{const choice=make('label','');choice.innerHTML=`<input type="radio" name="mg-feasibility-choice" value="${value}" ${value==='specified'?'checked':''}><span><strong>${label}</strong><small>${detail}</small></span>`;options.append(choice);});
      feasibility.append(options);
      const acknowledgment=make('label','mg-gap-ack');acknowledgment.innerHTML='<input type="checkbox" id="mg-gap-ack"> I understand the modeled gap and want to continue as specified.';if(hasGap)feasibility.append(acknowledgment);
      const proceed=make('button','mc-btn primary','Continue to the brief →');proceed.type='button';feasibility.append(proceed);
      const feasibilityStatus=make('p','mg-status');feasibilityStatus.setAttribute('role','status');feasibility.append(feasibilityStatus);
      result.append(feasibility);
      options.addEventListener('change',()=>{feasibilityStatus.textContent='';if(hasGap)acknowledgment.hidden=options.querySelector('input:checked')?.value!=='specified';});
      proceed.addEventListener('click',()=>{
        const choice=options.querySelector('input:checked')?.value||'specified';
        if(hasGap&&choice==='specified'&&!$('#mg-gap-ack',feasibility).checked){feasibilityStatus.textContent='Acknowledge the projected gap to keep this plan as specified.';return;}
        feasibilityStatus.textContent='';
        const budget=choice==='budget'?budgetNeeded:initialBudget,timeframe=choice==='timeline'?monthsNeeded:months;
        renderBrief({target,budget,rate,timeframe,baselineMonths:months,segment,size,modeled:budget*rate*timeframe/months,choice});
      });
    });
    function renderBrief(intent){
      const {target,budget,segment,size,timeframe}=intent;
      const goal=`Generate ${money(target)} in pipeline from ${segment} with ${size} over ${timeframe} months`;
      const existing=$('.mg-brief-draft',result);existing?.remove();
      const draft=make('section','mg-brief-draft');result.append(draft);
      const heading=make('h3','','Review the proposed brief');
      draft.append(heading);
      const note=make('p','mg-assumption',`Illustrative plan: ${money(intent.modeled)} modeled pipeline over ${timeframe} months using your ${intent.rate.toFixed(1)}× return assumption for ${intent.baselineMonths} months. Channel split, audience and copy are draft assumptions, not observed performance.`);draft.append(note);
      const form=make('div','mg-plan-form');
      const fields=[
        ['mg-program','Program name','text','Growth Play · enterprise pipeline'],
        ['mg-budget','Total planned budget · USD','number',String(budget)],
        ['mg-pipeline','Pipeline goal · USD','number',String(target)],
        ['mg-opps','Assumed qualified opportunities','number','20'],
        ['mg-linkedin','LinkedIn share · %','number','50'],
        ['mg-google','Google Ads share · %','number','35'],
        ['mg-meta','Meta share · %','number','15'],
        ['mg-audience','Targeting summary','text',`${segment} · ${size}`],
        ['mg-copy','Search draft copy','text',`Reach the right ${segment.toLowerCase()}. See the pipeline behind your campaigns.`],
        ['mg-creative','Creative direction','text','Account-specific proof, localized before launch'],
        ['mg-cap','Maximum cost per opportunity · USD','number','10000'],
        ['mg-exclusions','Exclusions','text','Current customers']
      ];
      const block=(title,ids)=>{const group=make('div','mg-plan-block');group.append(make('h4','',title));ids.forEach(id=>{const [,,type,value]=fields.find(item=>item[0]===id),label=fields.find(item=>item[0]===id)[1];const wrapper=make('label','',label),input=make('input','');input.id=id;input.type=type;input.value=value;if(type==='number')input.min='0';wrapper.append(input);group.append(wrapper);});form.append(group);};
      block('Strategy & spend',['mg-program','mg-budget','mg-pipeline','mg-opps','mg-linkedin','mg-google','mg-meta','mg-audience']);
      block('Assets',['mg-copy','mg-creative']);
      block('Guardrails',['mg-cap','mg-exclusions']);
      const custom=make('label','mg-custom-exclusion');custom.innerHTML='<input type="checkbox" id="mg-add-exclusion"> Add a custom exclusion';form.lastElementChild.append(custom);
      const extra=make('label','mg-extra-exclusion','Custom exclusion');const extraInput=make('input','');extraInput.id='mg-extra-exclusion';extra.append(extraInput);extra.hidden=true;form.lastElementChild.append(extra);
      $('#mg-add-exclusion',form).addEventListener('change',event=>{extra.hidden=!event.target.checked;});
      draft.append(form);
      const summary=make('p','mg-model-output');draft.append(summary);
      const calculate=()=>{const planned=Number($('#mg-budget',form).value),pipeline=Number($('#mg-pipeline',form).value),opps=Number($('#mg-opps',form).value),sum=['#mg-linkedin','#mg-google','#mg-meta'].reduce((total,id)=>total+Number($(id,form).value),0),cap=Number($('#mg-cap',form).value),cost=opps>0?planned/opps:0;summary.textContent=`Illustrative plan: ${money(planned)} planned across channels; ${money(pipeline)} pipeline goal; ${opps>0?money(cost):'—'} modeled cost per opportunity. Channel shares total ${sum}%. Reachable account count needs a mapped audience source. ${sum===100?'':'Set channel shares to 100%.'} ${cost>cap?'Modeled cost exceeds the cap.':''}`;return planned>0&&pipeline>0&&opps>0&&cap>0&&sum===100&&cost<=cap;};
      form.addEventListener('input',calculate);calculate();
      const continueButton=make('button','mc-btn primary','Review markets and approval →');continueButton.type='button';draft.append(continueButton);
      const status=make('p','mg-status');status.setAttribute('role','status');draft.append(status);
      continueButton.addEventListener('click',()=>{
        if(!calculate()){status.textContent='Add positive amounts, balance channel shares to 100%, and keep modeled cost per opportunity within the cap.';return;}
        const program=$('#mg-program',form).value.trim();if(!program){status.textContent='Name this program first.';return;}
        $('#mc-bulk-program',wizard).value=program.slice(0,48);
        $('#mc-bulk-budget',wizard).value=$('#mg-budget',form).value;
        const channelMap=[['LinkedIn','#mg-linkedin'],['Google Ads','#mg-google'],['Meta Ads','#mg-meta']];
        channelMap.forEach(([name,selector])=>{const input=[...wizard.querySelectorAll('[data-platform]')].find(node=>node.value===name);if(input)input.checked=Number($(selector,form).value)>0;});
        $('#mc-bulk-code',wizard).value=program.toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'').slice(0,32);
        const plan={goal,program,budget:Number($('#mg-budget',form).value),pipelineGoal:Number($('#mg-pipeline',form).value),modeledPipeline:intent.modeled,assumedOpportunities:Number($('#mg-opps',form).value),shares:Object.fromEntries(channelMap.map(([name,selector])=>[name,Number($(selector,form).value)])),audience:$('#mg-audience',form).value.trim(),searchCopy:$('#mg-copy',form).value.trim(),creativeDirection:$('#mg-creative',form).value.trim(),maxCostPerOpportunity:Number($('#mg-cap',form).value),exclusions:[$('#mg-exclusions',form).value.trim(),$('#mg-add-exclusion',form).checked?$('#mg-extra-exclusion',form).value.trim():''].filter(Boolean),timeframeMonths:timeframe,planningReturnRate:intent.rate,baselineMonths:intent.baselineMonths,feasibilityChoice:intent.choice,referenceUrl:$('#mg-context-url',section).value.trim(),referencePdfName:$('#mg-context-file',section).files[0]?.name||'',status:'Planning assumption',at:new Date().toISOString()};
        localStorage.setItem('mojo-growth-play-v1',JSON.stringify(plan));
        status.textContent='Brief saved locally. Choose named markets and review the approval chain below.';
        pathDivider.hidden=true;
        if(wizardHeading)wizardHeading.textContent='Review markets and approval';
        wizard.scrollIntoView({block:'start',behavior:'smooth'});
      });
    }
  }

  function setupPalette() {
    const dialog=make('dialog','mg-command-dialog');dialog.setAttribute('aria-label','Mojo command palette');
    dialog.innerHTML='<div class="mg-command-head"><label for="mg-command-input">Ask Mojo or start a reviewed action</label><button type="button" class="mg-close" aria-label="Close command palette">×</button></div><input id="mg-command-input" type="search" placeholder="Search a campaign, ask a question, or draft a change"><div id="mg-command-result" role="status"></div><p class="mg-command-hint">⌘K / Ctrl+K · Actions always open a review first.</p>';
    document.body.append(dialog);
    const input=$('#mg-command-input',dialog),result=$('#mg-command-result',dialog);
    const open=()=>{if(!dialog.open)dialog.showModal();input.focus();};
    const close=()=>dialog.close();$('.mg-close',dialog).addEventListener('click',close);
    dialog.addEventListener('click',e=>{if(e.target===dialog)close();});
    document.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();dialog.open?close():open();}});
    const respond=()=>{
      const query=input.value.trim().toLowerCase();result.replaceChildren();if(!query)return;
      let answer='',target='',label='';
      if(/linkedin.*ctr|ctr.*linkedin/.test(query)){answer='LinkedIn CTR is not available in the supplied campaign-level source. Open Campaigns to inspect the connected delivery data.';target='Portfolio.html#campaigns';label='Open Campaigns →';}
      else if(/go prep|pacing/.test(query)){answer='GO Prep was 45% paced in the Oct 30 snapshot: $27,290 spent from a $60,000 budget before its Oct 31 flight end. Review the flight before moving its remaining funds.';target='Portfolio.html#campaign=GO%20Prep&tab=performance';label='Inspect GO Prep →';}
      else if(/pause|halt|exclude|broad.match|keyword/.test(query)){answer='I can draft a pause for a named campaign. Keyword-level spend and conversion rows are not connected, so I cannot count matching keywords or estimate savings here.';target='Portfolio.html#campaign=GO%20Prep&tab=work';label='Review a campaign change →';}
      else if(/\$40k|40000|reallocat|shift budget/.test(query)){answer='Three flights ended with about $90k remaining in the Oct 30 source snapshot. The shared $40k decision has three priced options and needs human review.';target='HomeSystem.html#finding-flights';label='Open the $40k decision →';}
      else if(/scale|d&m/.test(query)){answer='D&M_2026 cleared six Demandbase engagement benchmarks. Review its campaign record before increasing spend; a benchmark is not a verified pipeline result.';target='Portfolio.html#campaign=D%26M_2026&tab=work';label='Review D&M_2026 →';}
      else if(/campaign|create|growth/.test(query)){answer='Start with a business goal, then review the plan, named markets and approval path.';target='Work.html#create';label='Draft a Growth Play →';}
      else{answer='I cannot verify that request from the supplied snapshot. Open Campaigns to inspect the available source rows.';target='Portfolio.html';label='Open Campaigns →';}
      result.append(make('p','',answer));const link=make('a','mc-btn',label);link.href=target;result.append(link);
    };
    input.addEventListener('input',respond);
    document.querySelectorAll('[data-mojo-command]').forEach(button=>button.addEventListener('click',open));
  }

  function setupCampaignLevers() {
    const augment=()=>{
      const drill=$('.ia-campaign-workspace[data-tab="work"]');if(!drill||drill.querySelector('.mg-reviewer'))return;
      const form=$('#ia-campaign-action-form',drill),name=drill.dataset.campaign,records=window.MojoCampaignRecords,record=records?.get(name);if(!form||!record)return;
      const section=make('div','mg-levers');
      const scaleAllowed=record.group==='Reported benchmark'&&!!record.budget;
      const haltAllowed=record.group==='Q1 flight delivery';
      if(scaleAllowed||haltAllowed){
        section.innerHTML=`<h3>Change the direction</h3><div class="mg-lever-buttons">${scaleAllowed?'<button type="button" data-lever="scale">Scale +20% · preview</button>':''}${haltAllowed?'<button type="button" data-lever="halt">Halt · preview</button>':''}</div><p class="mg-lever-note">This prepares a campaign-specific draft. No ad account changes until a person reviews the request.</p>`;
        form.before(section);
      }
      const reviewer=make('label','mg-reviewer','Reviewer name');const reviewerInput=make('input','');reviewerInput.required=true;reviewerInput.maxLength=64;reviewerInput.placeholder='Name the person who will review';reviewer.append(reviewerInput);form.querySelector('button[type="submit"]').before(reviewer);
      const rule=rules(),threshold=Number(rule.threshold)||10000,sequence=rule.sequence||'Demand gen lead → Finance';
      const finance=make('label','mg-reviewer mg-finance','Finance reviewer');const financeInput=make('input','');financeInput.maxLength=64;financeInput.placeholder='Name the finance reviewer';finance.append(financeInput);reviewer.after(finance);
      const approval=make('p','mg-approval-path','');finance.after(approval);
      const updateApproval=()=>{const type=$('#ia-campaign-change',form).value,current=Number(String(record.budget||'').replace(/[^0-9.]/g,'')),proposed=Number($('#ia-campaign-budget',form)?.value||0),delta=type==='budget'?Math.abs(proposed-current):0,needsFinance=type==='budget'&&delta>=threshold&&sequence.includes('Finance');finance.hidden=!needsFinance;financeInput.required=needsFinance;approval.textContent=needsFinance?`This ${money(delta)} budget change meets the ${money(threshold)} rule: ${sequence}. Both named reviewers are required before live application.`:`Demand gen lead review is required before any live change. Budget changes at or above ${money(threshold)} also require Finance.`;return needsFinance;};
      $('#ia-campaign-change',form).addEventListener('change',updateApproval);$('#ia-campaign-budget',form)?.addEventListener('input',updateApproval);updateApproval();
      form.addEventListener('submit',event=>{const needsFinance=updateApproval();if(!reviewerInput.value.trim()||(needsFinance&&!financeInput.value.trim())){event.preventDefault();event.stopImmediatePropagation();(reviewerInput.value.trim()?financeInput:reviewerInput).focus();$('.ia-campaign-action-status',form).textContent='Name each required reviewer before staging this draft.';return;}localStorage.setItem(`mojo-campaign-reviewer-${name}`,JSON.stringify({reviewer:reviewerInput.value.trim(),financeReviewer:needsFinance?financeInput.value.trim():null,at:new Date().toISOString()}));},true);
      section.querySelectorAll('[data-lever]').forEach(button=>button.addEventListener('click',()=>{
        const kind=button.dataset.lever,select=$('#ia-campaign-change',form),budget=$('#ia-campaign-budget',form),current=Number(String(record.budget||'').replace(/[^0-9.]/g,''));
        if(kind==='scale'&&(!current||![...select.options].some(option=>option.value==='budget'))){$('.mg-lever-note',section).textContent='A source budget is needed to preview a 20% increase for this campaign.';return;}
        select.value=kind==='scale'?'budget':'pause';if(kind==='scale')budget.value=String(Math.round(current*1.2));select.dispatchEvent(new Event('change',{bubbles:true}));
        $('.mg-lever-note',section).textContent=kind==='scale'?`Draft: ${money(current)} → ${money(Math.round(current*1.2))} (+${money(Math.round(current*.2))}). Performance impact is unknown; review the budget and owner below.`:'Draft: request to pause this campaign. Spend avoided cannot be estimated from the supplied source. Review the owner below.';
        section.querySelectorAll('[data-lever]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
        form.scrollIntoView({block:'nearest',behavior:'smooth'});
      }));
    };
    new MutationObserver(augment).observe(document.body,{childList:true,subtree:true});augment();
  }

  function setupWeeklyBrief() {
    const strategy = $('.mc-strategy');
    const header = strategy?.querySelector(':scope > .mc-section-head');
    const download = header?.querySelector('#mc-strategy-export');
    if (!strategy || !header || !download) return;
    // The executive scan is the brief. Keep its sharing actions in this one header.
    strategy.id = 'weekly-brief';
    const actions = make('div', 'mg-strategy-actions');
    const print = make('button', 'mc-btn', 'Print / save PDF');
    print.type = 'button';
    print.id = 'mg-print-brief';
    const share = make('button', 'mc-btn', 'Share summary →');
    share.type = 'button';
    share.id = 'mg-copy-brief';
    actions.append(download, print, share);
    header.append(actions);
    const status = make('p', 'mg-brief-status');
    status.setAttribute('role', 'status');
    strategy.append(status);
    print.addEventListener('click', () => window.print());
    share.addEventListener('click', async () => {
      const url = new URL('Strategy.html#weekly-brief', location.href).href;
      try {
        if (navigator.share) {
          await navigator.share({title: 'Mojo executive summary', url});
          status.textContent = 'Share sheet opened.';
        } else {
          await navigator.clipboard.writeText(url);
          status.textContent = 'Summary link copied.';
        }
      } catch { status.textContent = 'Copy this page URL to share the summary.'; }
    });
    if (location.hash === '#weekly-brief') requestAnimationFrame(() => strategy.scrollIntoView({block: 'start'}));
  }

  function setupCampaignNavigation() {
    const campaignLink=(name,tab='overview')=>`Portfolio.html#campaign=${encodeURIComponent(name)}&tab=${tab}`;
    const render=()=>{
      const decisions=$('#ia-panel-decisions');
      if(decisions&&!decisions.querySelector('.mg-decision-campaigns')){
        const action=[...decisions.querySelectorAll('a')].find(link=>link.textContent.includes('Open the $40k decision'));
        if(action){
          const row=make('div','mg-decision-campaigns');row.append(make('span','','Campaigns behind this decision: '));
          ['GO Prep','Q4 Pipeline Search','Enterprise Retargeting'].forEach((name,index)=>{if(index)row.append(make('span','mg-link-separator',' · '));const link=make('a','',name);link.href=campaignLink(name);row.append(link);});
          action.closest('.mp-actions')?.after(row);
        }
      }
      decisions?.querySelectorAll('#task-q4-review table tbody tr').forEach(row=>{
        const cell=row.cells[0],name=cell?.textContent.trim();if(!cell||cell.querySelector('a')||!name)return;
        const link=make('a','',name);link.href=campaignLink(name);cell.replaceChildren(link);
      });
      const drill=$('.ia-campaign-workspace[data-tab="performance"]');
      if(!drill||drill.querySelector('.mg-performance-next'))return;
      const name=drill.dataset.campaign,record=window.MojoCampaignRecords?.get(name),body=$('.ia-campaign-content',drill);if(!name||!body||record?.platform==='Demandbase Ads')return;
      let next=record?.scope||'Check what this campaign has reported before proposing a change.';
      if(record?.group==='Reported benchmark')next='Compare this engagement result with similar campaigns, then review a measured scale test. Pipeline return is not verified.';
      else if(record?.group==='Waystar delivery')next='Ask the owner to check list size, bids, flight dates and tracking before changing spend.';
      if(window.MojoCampaignSamples?.[name])next=window.MojoCampaignSamples[name].nextStep;
      const section=make('section','mg-performance-next');section.append(make('h3','','What should happen next?'),make('p','',next));
      const link=make('a','mc-btn',`Open ${name} next steps →`);link.href=`#campaign=${encodeURIComponent(name)}&tab=work`;section.append(link);
      body.querySelector('.ia-campaign-creative-prompt')?.before(section);
    };
    new MutationObserver(render).observe(document.body,{childList:true,subtree:true});render();
  }

  function setupApprovalClarity() {
    const decision=$('#mojo-decision'),team=$('#team-workflow');if(!decision||!team)return;
    const actions=$('.mp-actions',decision);if(!actions)return;
    const lede=$('.mp-lede',decision);
    if(lede)lede.textContent='Three Google Ads flights ended with about $90k still allocated. Choose whether to extend them, shift $40k to D&M_2026, or reserve it for Q1.';
    $('.mojo-approval-rule',decision)?.remove();
    actions.after(team);team.classList.add('mp-team-clarity');
    const disclosure=make('details','mg-approval-details');
    const summary=make('summary','mg-approval-summary');
    const summaryTitle=make('strong','','Approval details');
    const summaryMeta=make('span','mg-approval-summary-meta');
    summary.append(summaryTitle,summaryMeta);
    team.before(disclosure);disclosure.append(summary,team);
    const related=$('.mg-decision-campaigns',decision);if(related)disclosure.append(related);
    const oldHeading=$('h2',team),heading=make('h3','','Review path');oldHeading?.replaceWith(heading);
    const status=make('div','mp-approval-status');status.setAttribute('role','status');heading.after(status);
    const head=$('.mp-team-sequence-head',team),headLabels=head?.querySelectorAll('span');
    const configuredThreshold=Number(rules().threshold),threshold=Number.isFinite(configuredThreshold)&&configuredThreshold>=0?configuredThreshold:10000;
    if(headLabels?.length===2){headLabels[0].textContent='Who would review it';headLabels[1].textContent=40000>=threshold?`$40k meets the ${money(threshold)} approval rule`:`Below the ${money(threshold)} finance threshold`;}
    const steps=$('.mp-team-steps',team);steps?.setAttribute('aria-label','Steps before a live budget change');
    const choiceStep=make('span','mp-approval-choice-step');steps?.prepend(choiceStep);
    const arrow=make('span','mp-team-arrow','→');arrow.setAttribute('aria-hidden','true');choiceStep.after(arrow);
    const chips=[...team.querySelectorAll('.mp-team-chip')];
    chips.forEach((chip,index)=>{
      chip.classList.remove('current','next');
      chip.querySelector('small').textContent=index===0?'First review':'Final review';
      chip.setAttribute('aria-label',`Change ${index===0?'first':'final'} reviewer`);
    });
    if(40000<threshold&&chips.length>1){chips.slice(1).forEach(chip=>{chip.hidden=true;if(chip.previousElementSibling?.classList.contains('mp-team-arrow'))chip.previousElementSibling.hidden=true;});}
    const rule=$('.mp-team-rule',team);
    const source=$('.mp-source',team);
    if(source)source.textContent='Reviewer changes and notes stay in this browser. No approval request or teammate notification is sent.';
    const auditEmpty=$('#mp-audit-empty',team);if(auditEmpty)auditEmpty.textContent='No review activity yet';
    const choiceNames={extend:'Extend the ending flights',shift:'Shift $40k to D&M_2026',release:'Release $40k to Q1'};
    const chatLink=[...actions.querySelectorAll('a')].find(link=>link.href.includes('#finding-flights'));
    const renderStatus=()=>{
      let recorded=null;try{recorded=JSON.parse(localStorage.getItem('mojo-command-budget-v1')||'null');}catch{}
      const name=choiceNames[recorded?.choice];
      status.replaceChildren();
      const label=make('strong','',name?'Option saved in this browser':'No option chosen yet');
      const explanation=make('span','',name?`${name}. No approval has been requested, and no budget has moved.`:'After you choose, this decision would go to the reviewers below. No approval has started.');
      status.append(label,explanation);
      choiceStep.replaceChildren(make('b','',name?'1 · Option recorded':'1 · Choose an option'),make('small','',name?'Saved locally':'Start in Chat'));
      if(chatLink)chatLink.textContent='Open the $40k decision →';
      const roleNames=chips.filter(chip=>!chip.hidden).map(chip=>chip.querySelector('.mp-team-chip-name')?.textContent.trim()).filter(Boolean);
      summaryMeta.textContent=`${name?'Option saved · ':''}$40k requires ${roleNames.join(' → ')}`;
      if(rule)rule.textContent=`${roleNames.join(' then ')} ${roleNames.length===1?'reviews':'review'} before any live change. Mojo cannot approve its own change.`;
    };
    renderStatus();
    window.addEventListener('storage',renderStatus);
    window.addEventListener('focus',renderStatus);
    document.addEventListener('click',()=>requestAnimationFrame(renderStatus),true);
  }

  document.addEventListener('DOMContentLoaded',()=>{setupGrowthPlay();setupPalette();setupCampaignLevers();setupCampaignNavigation();setupApprovalClarity();setupWeeklyBrief();});
})();
