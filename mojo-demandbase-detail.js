/* A focused, campaign-scoped view of Demandbase reporting. */
(() => {
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const number = value => Number(String(value ?? '').replace(/[^\d.]/g, '')) || 0;
  const whole = value => new Intl.NumberFormat('en-US', {maximumFractionDigits:0}).format(value);
  const money = value => value ? new Intl.NumberFormat('en-US', {style:'currency',currency:'USD',maximumFractionDigits:0}).format(value) : '—';
  const metric = (label, value, note = '') => `<div class="dbcd-metric"><span>${escape(label)}</span><strong>${escape(value)}</strong>${note ? `<small>${escape(note)}</small>` : ''}</div>`;
  const head = (title, text = '') => `<div class="dbcd-section-head"><h2>${escape(title)}</h2>${text ? `<p>${escape(text)}</p>` : ''}</div>`;
  const empty = (title, text) => `<div class="dbcd-empty"><strong>${escape(title)}</strong><p>${escape(text)}</p></div>`;
  const bar = (label, value, max, note) => `<div class="dbcd-bar-row"><span>${escape(label)}</span><strong>${value ? whole(value) : '—'}</strong><i><b style="width:${max ? Math.max(2,Math.min(100,value/max*100)) : 0}%"></b></i><small>${escape(note)}</small></div>`;
  const table = (columns, rows, label) => `<div class="dbcd-table-wrap"><table aria-label="${escape(label)}"><thead><tr>${columns.map(column => `<th scope="col">${escape(column)}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${row.map((cell,index) => `<${index ? 'td' : 'th'}${index ? '' : ' scope="row"'}>${escape(cell)}</${index ? 'td' : 'th'}>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  function chart(total, label) {
    const share = [0.12, 0.29, 0.51, 0.73, 1];
    const values = share.map(part => Math.round(total * part));
    const points = values.map((value,index) => [54 + index * 145, 181 - value / total * 140]);
    const polyline = points.map(point => point.join(',')).join(' ');
    return `<div class="dbcd-chart" role="img" aria-label="Illustrative weekly ${escape(label.toLowerCase())} trend ending at ${whole(total)}"><svg viewBox="0 0 680 215" aria-hidden="true"><line x1="54" y1="181" x2="635" y2="181"/><line x1="54" y1="111" x2="635" y2="111"/><line x1="54" y1="41" x2="635" y2="41"/><polyline points="${polyline}"/>${points.map(([x,y]) => `<circle cx="${x}" cy="${y}" r="4"/>`).join('')}<text x="12" y="185">0</text><text x="8" y="115">${whole(total/2)}</text><text x="8" y="45">${whole(total)}</text>${['Oct 5','Oct 12','Oct 19','Oct 26','Nov 2'].map((date,index) => `<text x="${43 + index * 145}" y="205">${date}</text>`).join('')}</svg></div>`;
  }
  function render({body,tab,name,record,sample}) {
    const spend = number(record.spent) || sample?.spend || 0;
    const impressions = number(record.impressions) || sample?.impressions || 0;
    const clicks = number(record.clicks) || sample?.clicks || 0;
    const reached = number(record.reached);
    const clicked = number(record.clickedAccounts);
    const lifted = number(record.liftedAccounts);
    const ctr = record.ctr || (impressions && clicks ? `${(clicks/impressions*100).toFixed(3)}%` : '—');
    const reportNote = record.scenarioExport ? 'Oct 2–Nov 2' : 'Campaign snapshot';
    if(tab === 'performance') {
      body.innerHTML = `<section class="dbcd-view">${head('Performance',reportNote)}<div class="dbcd-metrics">${metric('Spend',money(spend))}${metric('Impressions',impressions ? whole(impressions) : '—')}${metric('Ad clicks',clicks ? whole(clicks) : '—')}${metric('CTR',ctr)}</div>${reached ? `<div class="dbcd-panel"><h3>From reach to response</h3><div class="dbcd-bars">${bar('Reached',reached,reached,'accounts')}${bar('Clicked',clicked,reached,'accounts')}${bar('Marked lifted',lifted,reached,'accounts')}</div></div>` : empty('Account results are not available yet','Connect campaign-level account reporting to see who responded.')}</section>`;
      return;
    }
    if(tab === 'influence') {
      const rate = reached && lifted ? Math.round(lifted/reached*100) : 0;
      body.innerHTML = `<section class="dbcd-view">${head('Influence','How reached accounts responded.')}<div class="dbcd-metrics dbcd-metrics-three">${metric('Accounts reached',reached ? whole(reached) : '—')}${metric('Accounts clicked',clicked ? whole(clicked) : '—')}${metric('Marked lifted',lifted ? whole(lifted) : '—',rate ? `${rate}% of reached accounts` : '')}</div>${reached ? `<div class="dbcd-panel"><h3>Account response</h3><div class="dbcd-bars">${bar('Reached',reached,reached,'accounts')}${bar('Clicked',clicked,reached,'accounts')}${bar('Marked lifted',lifted,reached,'accounts')}</div></div>` : empty('Account influence is not available yet','This campaign has no account-level response totals in the current report.')}<div class="dbcd-next"><div><strong>Did this create pipeline?</strong><p>Sales opportunities are not linked to this campaign yet.</p></div><a href="Connections.html">Review connections →</a></div></section>`;
      return;
    }
    if(tab === 'trends') {
      const options = [['impressions','Impressions',impressions],['spend','Spend',spend],['clicks','Clicks',clicks]];
      body.innerHTML = `<section class="dbcd-view">${head('Trends','See how delivery built over the campaign.')}<div class="dbcd-trend-panel"><div class="dbcd-trend-top"><div class="dbcd-segment" role="group" aria-label="Trend metric">${options.map(([id,label,total],index) => `<button type="button" data-dbcd-trend="${id}" aria-pressed="${index===0}" ${total ? '' : 'disabled'}>${label}</button>`).join('')}</div><strong data-dbcd-total></strong></div><div data-dbcd-chart></div><p class="dbcd-footnote">Illustrative weekly shape based on the campaign total.</p></div></section>`;
      const update = id => {
        const choice = options.find(([key]) => key === id) || options[0];
        body.querySelectorAll('[data-dbcd-trend]').forEach(button => button.setAttribute('aria-pressed',String(button.dataset.dbcdTrend===choice[0])));
        body.querySelector('[data-dbcd-total]').textContent = choice[0]==='spend' ? money(choice[2]) : choice[2] ? whole(choice[2]) : '—';
        body.querySelector('[data-dbcd-chart]').innerHTML = choice[2] ? chart(choice[2],choice[1]) : empty('No trend available','This campaign has no delivery total to chart.');
      };
      body.querySelectorAll('[data-dbcd-trend]').forEach(button => button.addEventListener('click',() => update(button.dataset.dbcdTrend)));
      update(options.find(([, , total]) => total)?.[0] || 'impressions');
      return;
    }
    if(tab === 'publishers') {
      const publisherRows = impressions ? [['dailymail.com',0.065,0.079],['theguardian.com',0.046,0.061],['marca.com',0.029,0.042]].map(([domain,share,clickShare]) => {const views=Math.round(impressions*share), visits=Math.round(clicks*clickShare);return [domain,'Web',whole(views),whole(visits),views ? `${(visits/views*100).toFixed(3)}%` : '—'];}) : [];
      body.innerHTML = `<section class="dbcd-view">${head('Publishers','Where this campaign could appear.')}<div class="dbcd-panel dbcd-table-panel"><div class="dbcd-panel-head"><h3>Top placements</h3><span>Preview</span></div>${publisherRows.length ? table(['Publisher','Environment','Impressions','Clicks','CTR'],publisherRows,`${name} publisher preview`) : empty('Publisher detail is not available yet','Connect a placement report to compare sites for this campaign.')}</div>${publisherRows.length ? '<p class="dbcd-footnote">Illustrative placement mix; publisher rows are not linked to this campaign export.</p>' : ''}</section>`;
      return;
    }
    if(tab === 'creatives') {
      const shortName = name.replace(/^\d{4}-Q\d-/, '').replace(/[^A-Za-z0-9]+/g,'').slice(0,18) || 'Campaign';
      const creativeRows = impressions ? [['Display',0.22,0.24],['Display',0.17,0.18],['Native',0.12,0.11]].map(([format,share,clickShare],index) => {const views=Math.round(impressions*share),visits=Math.round(clicks*clickShare);return [`${format}_${shortName}_v${index+1}`,money(spend*share),whole(views),whole(visits),views ? `${(visits/views*100).toFixed(3)}%` : '—'];}) : [];
      const art = [
        ['assets/acme-creative-handoff.svg','Make the handoff the easy part','Display'],
        ['assets/acme-creative-buyers.svg','Every buyer. One flow.','Display'],
        ['assets/acme-creative-momentum.svg','Keep momentum moving','Native']
      ];
      const gallery = creativeRows.length ? `<div class="dbcd-creative-gallery" aria-label="Creative previews">${art.map(([src,title,format],index) => `<figure class="dbcd-creative-tile"><img src="${src}" alt="Illustrative Acme Co ad: ${escape(title)}" ${index ? 'loading="lazy"' : ''}><figcaption><strong>${escape(title)}</strong><span>${format} · v${index+1}</span></figcaption></figure>`).join('')}</div>` : '';
      body.innerHTML = `<section class="dbcd-view">${head('Creatives','Compare the ads carrying this campaign.')}${gallery}<div class="dbcd-panel dbcd-table-panel"><div class="dbcd-panel-head"><h3>Ad groups</h3><span>Preview</span></div>${creativeRows.length ? table(['Ad group','Spend','Impressions','Clicks','CTR'],creativeRows,`${name} creative preview`) : empty('Creative detail is not available yet','Connect ad group reporting to compare this campaign’s creatives.')}</div>${creativeRows.length ? '<p class="dbcd-footnote">Illustrative creative concepts and ad group split; creative files are not linked to this campaign export.</p>' : ''}</section>`;
    }
  }
  window.MojoDemandbaseDetail = {render};
})();
