/* Focused local approval for the three drafted weekly reports. */
document.addEventListener('DOMContentLoaded', () => requestAnimationFrame(() => requestAnimationFrame(() => {
  const target='HomeSystem.html#queue-reports';
  const routine=document.querySelector('#weekly-report-writer');
  if(routine){
    routine.querySelector('.mr-related')?.setAttribute('href',target);
    try{
      const saved=JSON.parse(localStorage.getItem('mojo-weekly-report-approvals-v1')||'{}');
      const remaining=3-['go-prep','dm-2026','waystar'].filter(id=>saved&&saved[id]).length;
      const label=routine.querySelector('.mr-result');
      if(label)label.textContent=remaining?remaining+' demo '+(remaining===1?'draft':'drafts'):'3 demo drafts approved';
    }catch{}
  }
  const queue=document.querySelector('#today-queue');
  if(!queue)return;
  const data=[
    {id:'go-prep',name:'GO Prep',week:'Oct 26–Nov 1, 2026',status:'At risk',reason:'Only 45% of budget was spent in the Oct 30 snapshot, one day before flight end.',progress:45,goal:'45% of budget spent',metrics:[['Spend','—','—','$27,290'],['Budget remaining','—','—','$32,710'],['Pacing','—','—','45%']],what:'The Oct 30 Google Ads snapshot shows $27,290 spent and $32,710 remaining before the Oct 31 flight end.',commentary:'The remaining balance is an allocation question, not a pipeline loss. Check the flight plan and verified outcomes before extending or moving spend.',next:'Review the shared $40k allocation on Today and confirm whether this flight should be extended.',notes:'Weekly and prior-week measures, CRM outcomes, and lead quality were not supplied.',questions:'Was the flight meant to spend evenly? What outcome would justify extending it?'},
    {id:'dm-2026',name:'D&M_2026',week:'Oct 26–Nov 1, 2026',status:'On track',reason:'Average pacing is 98.6% and six Demandbase engagement benchmarks cleared in the sample.',progress:98.6,goal:'98.6% average pacing',metrics:[['Documented budget','—','—','$56,393'],['Average pacing','—','—','98.6%'],['Engagement benchmarks','—','—','6 cleared']],what:'D&M_2026 cleared six Demandbase engagement benchmarks in the supplied sample.',commentary:'This is a pattern worth comparing with similar campaigns. Engagement alone does not verify incremental pipeline.',next:'Capture audience and message choices for a controlled comparison before repeating the pattern.',notes:'Week-over-week changes and CRM opportunity outcomes are unavailable. These checks measure engagement, not revenue.',questions:'Which message or audience should be tested next, and what will count as success?'},
    {id:'waystar',name:'Q1 flight group',week:'Oct 26–Nov 1, 2026',status:'At risk',reason:'13 of 20 flights were below 40% pacing in the supplied snapshot.',progress:46,goal:'46% average pacing',metrics:[['Group budget','—','—','$304,976'],['Average pacing','—','—','46%'],['Flights below 40%','—','—','13 of 20']],what:'The Q1 flight sample contains 20 flights; 13 were below 40% pacing in the Oct 30 snapshot.',commentary:'The source does not identify the cause. Audience size, bids, dates, and tracking need an owner check before spend changes.',next:'Ask the campaign owner to confirm active flight plans and the cause of slow delivery.',notes:'Group budget and average pacing come from source rollups. Comparable weekly spend and verified CRM outcomes were not supplied.',questions:'Are these flights still intended to be live? Is delivery constrained by audience, bids, or changed dates?'}
  ];
  const make=(tag,cls,value)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(value!==undefined)el.textContent=value;return el;};
  const read=key=>{try{const x=JSON.parse(localStorage.getItem(key)||'{}');return x&&typeof x==='object'&&!Array.isArray(x)?x:{};}catch{return {};}};
  const approvalKey='mojo-weekly-report-approvals-v1',editKey='mojo-weekly-report-edits-v1';
  const approved=read(approvalKey),edits=read(editKey);
  const save=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));}catch{}};
  const receipts=queue.querySelector('[data-queue-group="receipts"] .brief-done-list');
  const draft=[...(receipts?.querySelectorAll('li')||[])].find(li=>li.textContent.includes('Drafted 3 weekly reports'));
  if(draft){const title=draft.querySelector('strong');if(title){const a=make('a','','Drafted 3 weekly reports');a.href='#queue-reports';title.replaceChildren(a);}}
  const side=[...document.querySelectorAll('.brief-routine-box .rt')].find(row=>row.textContent.includes('Weekly report writer'));
  if(side){
    const small=side.querySelector('small');
    if(small){const a=make('a','','3 drafts ready to read');a.href='#queue-reports';small.replaceChildren(a);}
    const name=side.querySelector('.mr-brief-link');if(name)name.href='#queue-reports';
  }
  const entry=make('a','wr-queue-entry');entry.href='#queue-reports';
  entry.innerHTML='<span class="wr-queue-kind">REPORTING</span><strong>Weekly report writer</strong><span class="wr-queue-status">Drafted · 3 waiting for review</span><span aria-hidden="true">›</span>';
  queue.querySelector('[data-queue-group="decisions"]')?.append(entry);
  const screen=make('section','wr-screen');screen.id='weekly-report-approvals';screen.hidden=true;
  screen.setAttribute('aria-labelledby','wr-title');
  screen.innerHTML='<a class="wr-back" href="#queue-all">← Your queue</a><div class="wr-head"><div><h2 id="wr-title">Weekly reports</h2><p>Open any draft to read or edit it. Approve the set when you’re ready.</p></div><div class="wr-head-actions"><span class="wr-count" aria-live="polite"></span><button class="wr-approve-batch" type="button">Approve all 3</button></div></div><div class="wr-cards"></div><p class="wr-footnote">Approval is recorded in this browser. No report is sent from this prototype.</p>';
  queue.querySelector('.today-queue-filters')?.before(screen);
  const cards=screen.querySelector('.wr-cards');
  const fields=[['what','What happened'],['commentary','Commentary'],['next','Next week'],['notes','Measurement notes'],['questions','Questions for the owner']];
  function renderDetail(report,detail){
    if(detail.dataset.ready)return;detail.dataset.ready='true';
    const goal=make('section','wr-goal');goal.append(make('h3','','Goal progress'),make('strong','',report.goal));
    const bar=make('progress','');bar.max=100;bar.value=report.progress;bar.setAttribute('aria-label',report.goal);goal.append(bar);detail.append(goal);
    const glance=make('section','wr-glance');glance.append(make('h3','','This week at a glance'));
    const table=make('table','');table.innerHTML='<thead><tr><th scope="col">Measure</th><th scope="col">This week</th><th scope="col">Last week</th><th scope="col">Flight to date</th></tr></thead>';
    const body=make('tbody','');report.metrics.forEach(row=>{const tr=make('tr','');row.forEach((value,index)=>tr.append(make(index?'td':'th','',value)));body.append(tr);});table.append(body);glance.append(table);detail.append(glance);
    fields.forEach(([key,label])=>{const section=make('section','wr-narrative');section.append(make('h3','',label));const p=make('p','',edits[report.id]?.[key]||report[key]);p.dataset.editField=key;section.append(p);detail.append(section);});
    const actions=make('div','wr-detail-actions');const edit=make('button','wr-secondary','Edit before approving');edit.type='button';
    edit.addEventListener('click',()=>{
      const active=edit.dataset.editing==='true';
      if(active){edits[report.id]=Object.fromEntries([...detail.querySelectorAll('[data-edit-field]')].map(p=>[p.dataset.editField,p.textContent.trim()]));save(editKey,edits);}
      detail.querySelectorAll('[data-edit-field]').forEach(p=>{p.contentEditable=String(!active);p.classList.toggle('wr-editing',!active);});
      edit.dataset.editing=String(!active);edit.textContent=active?'Edit before approving':'Save edits';
      if(!active)detail.querySelector('[data-edit-field]')?.focus();
    });
    const ask=make('button','wr-secondary','Ask a question in Chat');ask.type='button';
    ask.addEventListener('click',()=>{
      const toggle=document.getElementById('chatOn');if(toggle&&!toggle.checked){toggle.checked=true;toggle.dispatchEvent(new Event('change',{bubbles:true}));}
      const composer=document.querySelector('.chatpane textarea');
      if(composer){composer.value='What should I clarify in the '+report.name+' weekly report?';composer.dispatchEvent(new Event('input',{bubbles:true}));composer.focus();}
    });
    actions.append(edit,ask);detail.append(actions);
  }
  const cardMap=new Map();
  function syncCard(report,card){
    const isApproved=!!approved[report.id];
    card.classList.toggle('is-approved',isApproved);
    const badge=card.querySelector('.wr-draft');
    badge.hidden=!isApproved;
    badge.textContent='Approved';
  }
  function syncReceipts(){
    if(receipts){
      receipts.querySelectorAll('[data-weekly-approval-receipt]').forEach(node=>node.remove());
      data.filter(report=>approved[report.id]).forEach(report=>{
        const li=make('li','');li.dataset.weeklyApprovalReceipt=report.id;li.dataset.receiptId='approved-report';
        const icon=make('span','brief-done-mark','✓');icon.setAttribute('aria-hidden','true');
        const copy=make('div','');copy.append(make('small','','Reporting · Approved'),make('strong','','Approved weekly report — '+report.name));
        li.append(icon,copy);receipts.append(li);
      });
    }
    const pending=data.filter(report=>!approved[report.id]).length;
    screen.querySelector('.wr-count').textContent=pending?pending+' awaiting approval':'All 3 approved';
    const batch=screen.querySelector('.wr-approve-batch');
    batch.disabled=pending===0;
    batch.textContent=pending===0?'All approved':pending===3?'Approve all 3':`Approve ${pending} remaining`;
    entry.querySelector('.wr-queue-status').textContent=pending?'Drafted · '+pending+' waiting for review':'3 reports approved';
    const small=side?.querySelector('small a');if(small)small.textContent=pending?pending+' '+(pending===1?'draft':'drafts')+' ready to read':'3 reports approved';
  }
  data.forEach(report=>{
    const card=make('article','wr-card');card.dataset.reportId=report.id;
    const row=make('div','wr-card-row'),expand=make('button','wr-expand');expand.type='button';
    expand.setAttribute('aria-expanded','false');expand.setAttribute('aria-controls','wr-detail-'+report.id);
    const name=make('span','wr-card-headline');name.append(make('strong','',report.name),make('small','',report.week));
    const badges=make('span','wr-badges');badges.append(make('span','wr-risk'+(report.status==='At risk'?' is-risk':''),report.status),make('span','wr-draft','Approved'));
    expand.append(name,badges,make('span','wr-reason',report.reason),make('span','wr-chevron','⌄'));
    row.append(expand);card.append(row);
    const detail=make('div','wr-detail');detail.id='wr-detail-'+report.id;detail.hidden=true;card.append(detail);
    expand.addEventListener('click',()=>{const open=detail.hidden;if(open)renderDetail(report,detail);detail.hidden=!open;expand.setAttribute('aria-expanded',String(open));});
    cards.append(card);cardMap.set(report.id,card);
  });
  screen.querySelector('.wr-approve-batch').addEventListener('click',()=>{
    for(const report of data){
      if(approved[report.id])continue;
      const card=cardMap.get(report.id);
      const editing=card.querySelector('.wr-detail [data-edit-field][contenteditable="true"]');
      if(editing)card.querySelector('.wr-detail-actions .wr-secondary')?.click();
      approved[report.id]={at:new Date().toISOString()};
      syncCard(report,card);
    }
    save(approvalKey,approved);
    syncReceipts();
  });
  data.forEach(report=>syncCard(report,cardMap.get(report.id)));syncReceipts();
  const toggle=()=>{const active=location.hash==='#queue-reports';screen.hidden=!active;queue.classList.toggle('wr-mode',active);document.body.classList.toggle('wr-screen-active',active);if(active)screen.scrollIntoView({block:'start'});};
  window.addEventListener('hashchange',toggle);toggle();
})));
