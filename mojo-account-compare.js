/* Compare modeled target accounts by channel without leaving the Accounts dashboard. */
(() => {
  const channels = [
    {name:'Display',platform:'Demandbase Ads',logo:'assets/demandbase.png'},
    {name:'Paid social',platform:'LinkedIn Ads',logo:'assets/linkedin.png'},
    {name:'Paid search',platform:'Google Ads',logo:'assets/google-ads.svg'}
  ];
  const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
  const money = value => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(value);
  const stage = account => account.stage==='Proposal'?'Decision':account.stage==='Evaluation'?'Evaluation':account.stage==='Discovery'?'Consideration':account.intentStrength>=4?'Research':'Awareness';

  document.addEventListener('DOMContentLoaded', () => {
    const host=document.querySelector('#mojo-accounts-portfolio');
    const toolbar=host?.querySelector('#aq-bulk');
    if(!host||!toolbar||!window.MojoAccounts?.list)return;
    const all=window.MojoAccounts.list();
    const byId=new Map(all.map(account=>[account.id,account]));
    const button=document.createElement('button');
    button.type='button';button.className='aq-compare-trigger';button.textContent='Compare accounts';
    toolbar.querySelector('[data-mag-tray="save"]')?.before(button);
    const view=document.createElement('section');view.className='aq-compare-view';view.hidden=true;
    view.setAttribute('aria-label','Account comparison');host.append(view);
    let current=[];

    const urlIds=()=>{
      const ids=new URL(location.href).searchParams.get('compareAccounts')?.split(',')||[];
      return [...new Set(ids)].filter(id=>byId.has(id)).slice(0,4);
    };
    const writeUrl=(ids,push=false)=>{
      const url=new URL(location.href);
      if(ids.length)url.searchParams.set('compareAccounts',ids.join(','));else url.searchParams.delete('compareAccounts');
      url.hash='accounts';
      history[push?'pushState':'replaceState'](null,'',url);
    };
    const updateTrigger=()=>{
      const count=(window.MojoAccountGroups?.selected()||[]).filter(id=>byId.has(id)).length;
      button.disabled=count<2||count>4;
      button.title=count>4?'Select up to four accounts to compare':count<2?'Select two to four accounts to compare':'';
      button.setAttribute('aria-label',count>4?`${count} selected. Select up to four accounts to compare`:`Compare ${count} selected accounts`);
    };
    const hide=()=>{current=[];view.hidden=true;host.classList.remove('aq-comparing');};
    const show=ids=>{
      current=[...new Set(ids)].filter(id=>byId.has(id)).slice(0,4);
      if(!current.length){hide();return;}
      document.querySelector('#mag-account-rail:not([hidden]) [data-mag-rail-close]')?.click();
      const accounts=current.map(id=>byId.get(id));
      const count=accounts.length;
      const coverage=channels.map(channel=>({channel,accounts:accounts.filter(account=>account.channels.includes(channel.name))}));
      const shared=coverage.filter(item=>item.accounts.length===count).map(item=>item.channel.name);
      const gaps=coverage.filter(item=>item.accounts.length>0&&item.accounts.length<count);
      const read=gaps.length?`${gaps.map(item=>`${item.channel.name} targets ${item.accounts.length} of ${count}`).join('; ')}. Review the accounts without coverage before expanding that channel.`:shared.length?`All ${count} accounts are targeted through ${shared.join(', ')}. Compare their campaign mix before adding another channel.`:'These accounts have no channel in common. Review whether they belong in the same test.';
      const columns=`minmax(145px,.75fr) repeat(${count},minmax(165px,1fr))`;
      view.innerHTML=`<button type="button" class="aq-compare-back">← All accounts</button>
        <div class="aq-compare-heading"><div><span class="aq-compare-kicker">ACCOUNT COMPARISON</span><h2>Compare targeted accounts</h2><p>See which channels and campaigns target each account in the same view.</p></div><span class="aq-compare-sample">Sample account context</span></div>
        <div class="aq-compare-chips" aria-label="Compared accounts">${accounts.map(account=>`<button type="button" data-remove-account="${account.id}" aria-label="Remove ${escape(account.name)}">${escape(account.name)} <span aria-hidden="true">×</span></button>`).join('')}${count<4?'<button type="button" class="aq-compare-add">+ Add account</button>':''}</div>
        <div class="aq-compare-picker" hidden><label for="aq-compare-account-picker">Choose an account</label><input class="aq-compare-picker-search" type="search" aria-label="Search accounts to add" placeholder="Search accounts"><select id="aq-compare-account-picker"><option value="">Select account</option>${all.filter(account=>!current.includes(account.id)).map(account=>`<option value="${account.id}">${escape(account.name)}</option>`).join('')}</select><button type="button" class="aq-compare-picker-add">Add</button><button type="button" class="aq-compare-picker-cancel">Cancel</button></div>
        <div class="aq-compare-read"><strong>Coverage read</strong><p>${escape(read)}</p></div>
        <section class="aq-compare-section"><div class="aq-compare-section-head"><h3>Targeting by channel</h3><span>${count} ${count===1?'account':'accounts'} compared</span></div>
          <div class="aq-compare-grid-scroll"><div class="aq-compare-grid" style="grid-template-columns:${columns}"><div class="aq-compare-grid-header">Channel</div>${accounts.map(account=>`<div class="aq-compare-grid-header"><strong>${escape(account.name)}</strong><small>${account.campaigns.length} ${account.campaigns.length===1?'campaign':'campaigns'}</small></div>`).join('')}
          ${coverage.map(({channel,accounts:targeted})=>`<div class="aq-compare-channel"><img src="${channel.logo}" alt=""><span><strong>${channel.name}</strong><small>${targeted.length} of ${count} targeted</small></span></div>${accounts.map(account=>{const active=account.channels.includes(channel.name);const matching=account.campaigns.filter(campaign=>campaign.platform===channel.platform);return `<div class="aq-compare-cell ${active?'is-targeted':'is-missing'}"><span>${active?'Targeted':'Not targeted'}</span>${active?`<small>${matching.length} ${matching.length===1?'campaign':'campaigns'}</small>`:''}</div>`}).join('')}`).join('')}</div></div>
          <div class="aq-compare-coverage-bars">${coverage.map(({channel,accounts:targeted})=>`<div><span>${channel.name}</span><div class="aq-compare-track"><i style="width:${targeted.length/count*100}%"></i></div><strong>${targeted.length}/${count}</strong></div>`).join('')}</div>
        </section>
        <section class="aq-compare-section"><h3>Account context</h3><div class="aq-compare-grid-scroll"><div class="aq-compare-grid aq-compare-facts" style="grid-template-columns:${columns}"><div class="aq-compare-grid-header">Measure</div>${accounts.map(account=>`<div class="aq-compare-grid-header"><strong>${escape(account.name)}</strong></div>`).join('')}
          <div class="aq-compare-measure">Journey stage</div>${accounts.map(account=>`<div>${escape(stage(account))}</div>`).join('')}
          <div class="aq-compare-measure">Opportunity</div>${accounts.map(account=>`<div>${account.opportunityValue?money(account.opportunityValue):'No open opportunity'}</div>`).join('')}
          <div class="aq-compare-measure">AI sourced</div>${accounts.map(account=>`<div>${account.aiSource?escape(account.aiSource.provider):'No recorded source'}</div>`).join('')}
          <div class="aq-compare-measure">Campaign reach</div>${accounts.map(account=>`<div>${escape(account.reach)}</div>`).join('')}</div></div></section>
        <section class="aq-compare-section"><h3>Campaigns targeting each account</h3><div class="aq-compare-campaigns">${accounts.map(account=>`<article><h4>${escape(account.name)} <span>${account.campaigns.length}</span></h4><ul>${account.campaigns.map(campaign=>`<li><a href="Portfolio.html#campaign=${encodeURIComponent(campaign.name)}&amp;tab=overview">${escape(campaign.name)}</a><small>${escape(campaign.platform)}</small></li>`).join('')}</ul></article>`).join('')}</div></section>
        <p class="aq-compare-note">Data health · Account names, campaign membership, channels, and CRM context are modeled for this prototype. “Targeted” describes planned membership; it does not prove an ad was delivered or caused an opportunity.</p>`;
      view.hidden=false;host.classList.add('aq-comparing');
      view.querySelector('.aq-compare-back').addEventListener('click',()=>{writeUrl([]);hide();window.scrollTo({top:0,behavior:'auto'});});
      view.querySelectorAll('[data-remove-account]').forEach(chip=>chip.addEventListener('click',()=>{const ids=current.filter(id=>id!==chip.dataset.removeAccount);writeUrl(ids);show(ids);if(ids.length<2)view.querySelector('.aq-compare-add')?.click();}));
      const picker=view.querySelector('.aq-compare-picker');
      view.querySelector('.aq-compare-add')?.addEventListener('click',()=>{picker.hidden=false;picker.querySelector('input').focus();});
      picker.querySelector('input').addEventListener('input',event=>{const query=event.target.value.trim().toLowerCase(),select=picker.querySelector('select');select.innerHTML='<option value="">Select account</option>'+all.filter(account=>!current.includes(account.id)&&account.name.toLowerCase().includes(query)).map(account=>`<option value="${account.id}">${escape(account.name)}</option>`).join('');});
      picker.querySelector('.aq-compare-picker-cancel').addEventListener('click',()=>picker.hidden=true);
      picker.querySelector('.aq-compare-picker-add').addEventListener('click',()=>{const id=picker.querySelector('select').value;if(!id)return;const ids=[...current,id];writeUrl(ids);show(ids);});
    };
    button.addEventListener('click',()=>{
      const ids=(window.MojoAccountGroups?.selected()||[]).filter(id=>byId.has(id)).slice(0,4);
      if(ids.length<2)return;
      writeUrl(ids,true);show(ids);window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
    });
    window.addEventListener('mojo:selection-updated',updateTrigger);
    window.addEventListener('popstate',()=>{const ids=urlIds();ids.length?show(ids):hide();});
    updateTrigger();
    const initial=urlIds();
    if(initial.length&&location.hash==='#accounts'){
      window.MojoAccountGroups?.setSelected(initial);
      show(initial);
    }
  });
})();
