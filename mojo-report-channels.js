/* Channel views show available metrics without blending different reporting windows. */
(() => {
  const model=window.MojoInitiatives;
  if(!model)return;
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const campaignLink=row=>`<a href="Portfolio.html#campaign=${encodeURIComponent(row.name)}&tab=overview">${esc(row.name)}</a>`;
  const platforms=['Demandbase Ads','LinkedIn Ads','Google Ads'];
  const read=model.read;
  const amount=value=>{const parsed=Number(String(value??'').replace(/[$,]/g,''));return Number.isFinite(parsed)?parsed:NaN};
  const money=value=>Number.isFinite(value)?new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(value):'—';
  const performance=(channel,items)=>{
    if(channel==='Demandbase Ads')return {
      source:'Illustrative Demandbase example · Q4 2026',
      metrics:[['Spend','$51,366.75'],['Impressions','51,207,915'],['Visits','3,407'],['Clicks','2,457'],['Lift','16%']],
      results:'<details class="mrc-results"><summary><strong>Account response</strong><span>10,218 reached · 867 new accounts on site · 1,378 interacted</span></summary><div class="mrc-results-grid"><div><small>Targeted accounts</small><strong>11,123</strong></div><div><small>Accounts reached</small><strong>10,218</strong></div><div><small>New accounts on site</small><strong>867</strong></div><div><small>Accounts interacted</small><strong>1,378</strong></div></div><p>Lift is the percentage shown in the example view; its comparison method was not supplied.</p></details>'
    };
    if(channel==='Google Ads'){
      const records=window.MojoCampaignRecords;
      const sum=field=>items.reduce((total,row)=>{const value=amount(records?.get(row.name)?.[field]);return total+(Number.isFinite(value)?value:0)},0);
      const spend=sum('spent');
      return {source:'Three ending flights · illustrative delivery',metrics:[['Spend',money(spend)],['Impressions','1,150,000'],['Clicks','34,500'],['CTR','3.00%'],['Average CPC','$2.15']],resultMetrics:[['Conversions','690'],['Cost per conversion','$107.58'],['Conversion rate','2.00%']]};
    }
    return {source:'Q4 channel summary · illustrative delivery',metrics:[['Spend','$200K'],['Impressions','1,600,000'],['Clicks','20,000'],['CTR','1.25%'],['CPC','$10.00']],resultMetrics:[['Leads / conversions','320'],['Cost per lead','$625.00'],['Conversion rate','1.60%']]};
  };
  const render=async()=>{
    const panel=document.querySelector('#ia-panel-channels');
    if(!panel||panel.dataset.channelsReady)return !!panel;
    panel.dataset.channelsReady='true';
    let rows=[];
    try{const response=await fetch('mojo-plan-campaigns.json');if(response.ok)rows=await response.json()}catch{}
    const goals=read('mojo-campaign-goals-v1')?.goals||[];
    const assigned=read('mojo-campaign-goals-v1')?.assignments||{};
    panel.innerHTML=`<div class="mrc-head"><div><h1>Channels</h1><p>See delivery and campaign work by advertising platform.</p></div><div class="mrc-head-actions"><select aria-label="Filter channels"><option value="all">All channels</option><option value="Demandbase Ads">Demandbase Ads</option><option value="LinkedIn Ads">LinkedIn Ads</option><option value="Google Ads">Google Ads</option></select></div></div><div class="mrc-grid">${platforms.map(channel=>{
      const items=rows.filter(row=>row.platform===channel);
      const related=model.entries.filter(entry=>model.byId(entry.id).channels.includes(channel));
      const view=performance(channel,items);
      const campaignRows=subset=>subset.map(row=>`<li>${campaignLink(row)}<small>${esc(goals.find(goal=>goal.id===(channel==='Google Ads'?'visibility':assigned[row.name]))?.initiative||'Unassigned')}</small></li>`).join('');
      return `<article class="mrc-card" data-channel="${esc(channel)}"><div class="mrc-card-head"><img src="${model.logo[channel]}" alt=""><div><h2>${esc(channel)}</h2><span>${items.length} ${items.length===1?'campaign':'campaigns'} in the current plan</span></div><small class="mrc-source">${esc(view.source)}</small></div><div class="mrc-card-body"><div class="mrc-performance"><h3>Delivery</h3><dl class="mrc-metrics" style="--mrc-count:${view.metrics.length}">${view.metrics.map(([label,value])=>`<div class="mrc-metric"><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl>${view.resultMetrics?`<div class="mrc-outcomes"><h3>Results</h3><dl class="mrc-metrics" style="--mrc-count:${view.resultMetrics.length}">${view.resultMetrics.map(([label,value])=>`<div class="mrc-metric"><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl></div>`:''}${view.note?`<p class="mrc-performance-note">${esc(view.note)}</p>`:""}${view.results||''}</div><div class="mrc-campaigns"><div class="mrc-campaign-head"><strong>Campaigns in the current plan</strong><span>Initiative</span></div>${items.length?`<ul>${campaignRows(items.slice(0,3))}</ul>${items.length>3?`<details><summary><span class="mrc-show-more">Show all ${items.length} campaigns</span><span class="mrc-show-less">Show fewer campaigns</span></summary><ul>${campaignRows(items.slice(3))}</ul></details>`:''}`:'<p>No campaign records in this sample.</p>'}</div></div><div class="mrc-initiatives"><strong>Initiatives using this channel</strong><div>${related.map(entry=>`<a href="Strategy.html#initiative-${entry.id}">${esc(goals.find(goal=>goal.id===entry.id)?.initiative||entry.name)}</a>`).join('')}</div></div></article>`;
    }).join('')}</div>`;
    panel.querySelector('.mrc-head-actions select')?.addEventListener('change',event=>{panel.querySelectorAll('.mrc-card').forEach(card=>card.hidden=event.target.value!=='all'&&card.dataset.channel!==event.target.value)});
    requestAnimationFrame(()=>{
      const trigger=panel.querySelector('.mrc-head-actions .mojo-select-trigger');
      if(trigger&&!trigger.querySelector('.mojo-filter-icon'))trigger.insertAdjacentHTML('afterbegin','<span class="mojo-filter-icon" role="img" aria-label="Filter by"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 20a1 1 0 0 0 .553.895l2 1A1 1 0 0 0 14 21v-7a2 2 0 0 1 .517-1.341L21.74 4.67A1 1 0 0 0 21 3H3a1 1 0 0 0-.742 1.67l7.225 7.989A2 2 0 0 1 10 14z"/></svg></span>');
    });
    document.dispatchEvent(new Event('mojo:report-channels-rendered'));
    return true;
  };
  const start=()=>{if(document.querySelector('#ia-panel-channels')){render();return}const observer=new MutationObserver(()=>{if(document.querySelector('#ia-panel-channels')){observer.disconnect();render()}});observer.observe(document.body,{childList:true,subtree:true})};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
