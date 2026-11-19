/* A local sharing and export sheet. Access controls remain with the host site. */
document.addEventListener('DOMContentLoaded', () => {
  const selector = '.home-share-button,#aud-share,#mc-share,.topbar .btn.outline';
  const dialog = document.createElement('dialog');
  dialog.className = 'mojo-share-dialog';
  dialog.setAttribute('aria-labelledby','mojo-share-title');
  const icons={share:'<circle cx="18" cy="5" r="2"/><circle cx="6" cy="12" r="2"/><circle cx="18" cy="19" r="2"/><path d="m8 11 8-5M8 13l8 5"/>',mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>',pdf:'<path d="M7 2h7l5 5v15H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z"/><path d="M14 2v6h6M8 16h8"/>',slides:'<rect x="3" y="4" width="18" height="15" rx="2"/><path d="M8 22h8M12 19v3M7 9h10M7 13h7"/>',svg:'<path d="M4 5h16v14H4zM8 14l3-4 3 4 2-2 2 3"/>',ignore:'<circle cx="12" cy="12" r="9"/><path d="m9 9 6 6m0-6-6 6"/>'};
  const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${icons[name]}</svg>`;
  dialog.innerHTML = `<div class="mojo-share-head"><div><h2 id="mojo-share-title">Share and export</h2><p>Send this view to your team or take it into a report.</p></div><button class="mojo-share-close" type="button" aria-label="Close share dialog">×</button></div><div class="mojo-share-body"><h3>Share this view</h3><div class="mojo-share-link"><input aria-label="Link to this view" readonly><button class="mojo-share-copy" type="button">${icon('share')}<span>Copy link</span></button></div><button class="mojo-share-email" type="button">${icon('mail')}<span>Email link to teammates</span></button><p class="mojo-share-note">Links use the site's current access. Organization-only permissions require a connected organization workspace.</p><div class="mojo-share-divider"></div><h3>Export for a presentation</h3><div class="mojo-share-export"><button type="button" data-export="pdf">${icon('pdf')}<strong>PDF</strong><span>Report to download</span></button><button type="button" data-export="pptx">${icon('slides')}<strong>Slide deck</strong><span>Editable .pptx</span></button><button type="button" data-export="svg">${icon('svg')}<strong>SVG</strong><span>Vector summary</span></button></div><p class="mojo-share-status" role="status" aria-live="polite"></p></div>`;
  document.body.append(dialog);
  const linkInput = dialog.querySelector('.mojo-share-link input');
  const status = dialog.querySelector('.mojo-share-status');
  let activeCard = null;
  const pageTitle = () => document.querySelector('.modulenav a[aria-current="page"],.aud-app-nav a[aria-current="page"],.home-tabs a[aria-current="page"]')?.textContent.trim() || document.title.split(' · ')[0].split(' — ')[0] || 'Mojo';
  const fileBase = () => `Mojo-${pageTitle().replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'')}-${new Date().toISOString().slice(0,10)}`;
  const visible = node => !!node.getClientRects().length && getComputedStyle(node).visibility !== 'hidden';
  const escapeXml = value => String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
  const tidy = value => String(value||'').replace(/\s+/g,' ').trim();
  const root = () => activeCard || [...document.querySelectorAll('main.canvaspane,.home-scroll,.aud-content,main')].find(node => visible(node) && !node.closest('.mojo-share-dialog')) || document.body;
  const content = () => {
    const blocks=[];
    const seen=new Set();
    root().querySelectorAll('h1,h2,h3,p,table').forEach(node => {
      if (!visible(node) || node.closest('dialog,.chatpane,.excerpt-ribbon,.mojo-share-dialog')) return;
      if (node.matches('table')) {
        [...node.querySelectorAll('tr')].slice(0,13).forEach(row => {
          const value=tidy([...row.querySelectorAll('th,td')].map(cell=>tidy(cell.innerText)).join('  |  '));
          if (value && !seen.has(value)) { blocks.push({kind:'body',text:value}); seen.add(value); }
        });
      } else {
        const value=tidy(node.innerText);
        if (value && value.length>2 && !seen.has(value)) { blocks.push({kind:node.matches('h1,h2,h3')?'heading':'body',text:value}); seen.add(value); }
      }
    });
    return blocks.slice(0,110);
  };
  const wrap = (value,limit) => {
    const words=tidy(value).split(' '), lines=[];
    let line='';
    words.forEach(word=>{if ((line+' '+word).trim().length>limit && line){lines.push(line);line=word;}else line=(line+' '+word).trim();});
    if(line)lines.push(line);
    return lines;
  };
  const download = (blob,name) => {
    const url=URL.createObjectURL(blob), anchor=document.createElement('a');
    anchor.href=url; anchor.download=name; document.body.append(anchor); anchor.click(); anchor.remove();
    setTimeout(()=>URL.revokeObjectURL(url),30000);
  };
  const loadLibrary = (src,globalName) => new Promise((resolve,reject)=>{
    if (window[globalName]) return resolve(window[globalName]);
    const script=document.createElement('script'); script.src=src; script.onload=()=>window[globalName]?resolve(window[globalName]):reject(new Error('Export library did not load')); script.onerror=()=>reject(new Error('Export library did not load')); document.head.append(script);
  });
  const ascii = value => String(value).replace(/[\u2018\u2019]/g,"'").replace(/[\u201c\u201d]/g,'"').replace(/[\u2013\u2014]/g,'-').replace(/\u2192/g,'->').replace(/[^\x20-\x7e]/g,' ');
  const exportPdf = async () => {
    const PDFLib=await loadLibrary('vendor-pdf-lib.min.js','PDFLib');
    const pdf=await PDFLib.PDFDocument.create(), regular=await pdf.embedFont(PDFLib.StandardFonts.Helvetica), bold=await pdf.embedFont(PDFLib.StandardFonts.HelveticaBold);
    const purple=PDFLib.rgb(.36,.23,.61), ink=PDFLib.rgb(.19,.16,.23), muted=PDFLib.rgb(.48,.44,.51);
    let page, y, number=0;
    const newPage=()=>{page=pdf.addPage([612,792]);number++;y=748;page.drawText(ascii(pageTitle()),{x:46,y,size:21,font:bold,color:ink});page.drawLine({start:{x:46,y:730},end:{x:566,y:730},thickness:1,color:purple});y=707;page.drawText(`Mojo  |  ${new Date().toLocaleDateString()}  |  Page ${number}`,{x:46,y:31,size:9,font:regular,color:muted});};
    newPage();
    for (const block of content()) {
      const heading=block.kind==='heading', size=heading?13:10, lineHeight=heading?18:15;
      const lines=wrap(ascii(block.text),heading?75:100);
      if(y-(lines.length*lineHeight)-(heading?13:8)<54)newPage();
      for(const line of lines){if(y<54)newPage();page.drawText(line,{x:46,y,size,font:heading?bold:regular,color:heading?purple:ink});y-=lineHeight;}
      y-=heading?10:7;
    }
    const bytes=await pdf.save();
    download(new Blob([bytes],{type:'application/pdf'}),`${fileBase()}.pdf`);
  };
  const slideSections = () => {
    const blocks=content(), sections=[];
    let section={title:pageTitle(),lines:[]};
    blocks.forEach(block=>{
      if(block.kind==='heading' && section.lines.length){sections.push(section);section={title:block.text,lines:[]};}
      else if(block.kind==='heading')section.title=block.text;
      else if(section.lines.length<6)section.lines.push(block.text);
    });
    if(section.lines.length||!sections.length)sections.push(section);
    return sections.slice(0,10);
  };
  const exportPptx = async () => {
    await loadLibrary('vendor-jszip.min.js','JSZip');
    const PptxGenJS=await loadLibrary('vendor-pptxgen.min.js','PptxGenJS');
    const pptx=new PptxGenJS(); pptx.layout='LAYOUT_WIDE'; pptx.author='Mojo'; pptx.subject=`${pageTitle()} view`; pptx.title=`Mojo ${pageTitle()}`;
    slideSections().forEach((section,index)=>{
      const slide=pptx.addSlide(); slide.background={color:'FFFFFF'};
      slide.addShape(pptx.ShapeType.rect,{x:0,y:0,w:.14,h:7.5,line:{color:'65429B'},fill:{color:'65429B'}});
      slide.addText('MOJO  /  '+pageTitle().toUpperCase(),{x:.55,y:.35,w:11.9,h:.3,fontFace:'Arial',fontSize:9,bold:true,color:'65429B',charSpacing:1});
      slide.addText(section.title,{x:.55,y:.85,w:12.1,h:1.15,fontFace:'Georgia',fontSize:28,color:'292331',breakLine:false,margin:0});
      let y=2.25;
      section.lines.slice(0,5).forEach(line=>{const clipped=line.length>225?line.slice(0,222)+'...':line;slide.addText(clipped,{x:.7,y,w:11.75,h:.7,fontFace:'Arial',fontSize:17,color:'4B4552',margin:0,breakLine:false,valign:'mid'});y+=.86;});
      slide.addText(`${index+1}  /  ${location.href}`,{x:.55,y:7.12,w:12.1,h:.2,fontFace:'Arial',fontSize:8,color:'817887',margin:0});
    });
    const blob=await pptx.write({outputType:'blob'});
    download(blob,`${fileBase()}.pptx`);
  };
  const exportSvg = () => {
    const sections=slideSections().slice(0,5), rows=[];
    sections.forEach(section=>{rows.push({kind:'heading',text:section.title});section.lines.slice(0,2).forEach(line=>wrap(line,105).slice(0,3).forEach(text=>rows.push({kind:'body',text})));});
    const height=Math.max(580,190+rows.reduce((sum,row)=>sum+(row.kind==='heading'?55:29),0));
    let y=160;
    const labels=rows.map(row=>{const heading=row.kind==='heading';const result=`<text x="66" y="${y}" fill="${heading?'#5B3FA0':'#3F3946'}" font-family="${heading?'Georgia, serif':'Arial, sans-serif'}" font-size="${heading?28:17}" font-weight="${heading?600:400}">${escapeXml(row.text)}</text>`;y+=heading?55:29;return result;}).join('');
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="${height}" viewBox="0 0 1200 ${height}"><rect width="1200" height="${height}" fill="#fff"/><rect width="12" height="${height}" fill="#65429B"/><text x="66" y="57" fill="#65429B" font-family="Arial,sans-serif" font-size="15" font-weight="700" letter-spacing="2">MOJO / ${escapeXml(pageTitle().toUpperCase())}</text><path d="M66 77H1134" stroke="#E6DFEA"/><text x="66" y="115" fill="#2D2635" font-family="Georgia,serif" font-size="34">${escapeXml(pageTitle())}</text>${labels}<text x="66" y="${height-35}" fill="#817887" font-family="Arial,sans-serif" font-size="12">${escapeXml(location.href)}</text></svg>`;
    download(new Blob([svg],{type:'image/svg+xml'}),`${fileBase()}.svg`);
  };
  dialog.querySelector('.mojo-share-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
  dialog.querySelector('.mojo-share-copy').addEventListener('click',async()=>{
    try{await navigator.clipboard.writeText(linkInput.value);status.textContent='Link copied.';}
    catch{linkInput.focus();linkInput.select();status.textContent='Select and copy the link.';}
  });
  dialog.querySelector('.mojo-share-email').addEventListener('click',()=>{
    const subject=encodeURIComponent(`Mojo ${pageTitle()}`),body=encodeURIComponent(`Here is the Mojo view for our review:\n\n${linkInput.value}`);
    location.href=`mailto:?subject=${subject}&body=${body}`;
    status.textContent='Email draft opened. Add your teammates before sending.';
  });
  dialog.querySelectorAll('[data-export]').forEach(button=>button.addEventListener('click',async()=>{
    button.disabled=true;status.textContent=`Preparing ${button.dataset.export.toUpperCase()}…`;
    try{await ({pdf:exportPdf,pptx:exportPptx,svg:exportSvg})[button.dataset.export]();status.textContent='Download ready.';}
    catch(error){status.textContent=`Export failed: ${error.message}`;console.error(error);}
    finally{button.disabled=false;}
  }));
  const cardSelector='.home-card,.mfc-card,.mfd-card,.mfr-card,.aud-feed-item';
  const copySelector='[data-home-action="copy"],[data-mfc-action="copy"],[data-mfr-action="copy"],[data-aud-receipt-tool="copy"],[data-aeo-receipt-copy]';
  const ignoredKey='mojo-global-ignored-cards-v1';
  const feedbackKey='mojo-card-feedback-v2:';
  const readIgnored=()=>{try{return JSON.parse(localStorage.getItem(ignoredKey)||'{}')||{};}catch{return {};}};
  const cardKey=card=>`${location.pathname.split('/').pop()}:${card.dataset.homeKey||card.dataset.findingId||card.dataset.decisionId||card.dataset.receiptId||card.querySelector('h2,h3,strong')?.textContent.trim().replace(/\s+/g,' ').slice(0,100)||'card'}`;
  const cardTitle=card=>tidy(card.querySelector('h2,h3,strong')?.textContent)||'this item';
  const cardUrl=card=>{const href=card.querySelector('h2 a,h3 a,.mfc-primary,.aud-feed-actions a,.mfr-actions a')?.getAttribute('href');return href?new URL(href,location.href).href:location.href;};
  const ignoredRow=card=>{
    const key=cardKey(card);
    if(!readIgnored()[key]||card.nextElementSibling?.dataset.mojoIgnored===key)return;
    const row=document.createElement(card.tagName==='LI'?'li':'div');row.className='mojo-ignored-card';row.dataset.mojoIgnored=key;
    const label=document.createElement('span');label.textContent=`Ignored: ${cardTitle(card)}`;
    const undo=document.createElement('button');undo.type='button';undo.textContent='Undo';undo.addEventListener('click',()=>{const saved=readIgnored();delete saved[key];localStorage.setItem(ignoredKey,JSON.stringify(saved));card.hidden=false;row.remove();});
    row.append(label,undo);card.hidden=true;card.after(row);
  };
  const enhanceCards=()=>{
    document.querySelectorAll(cardSelector).forEach(card=>{
      if(card.dataset.mojoShareReady){ignoredRow(card);return;}
      card.dataset.mojoShareReady='true';
      card.querySelectorAll('.mf-feedback-ignore,.aud-feedback-ignore').forEach(button=>button.remove());
      const actions=card.querySelector('.home-actions,.mfc-actions,.mfd-footer,.mfr-actions,.aud-feed-actions');
      if(!actions)return;
      let tools=actions.querySelector(':scope > .home-utilities,:scope > .mfc-utility-group,:scope > .mojo-card-tools');
      if(!tools){tools=document.createElement('span');actions.append(tools);}
      tools.classList.add('mojo-card-tools');
      tools.setAttribute('role','group');tools.setAttribute('aria-label','Card actions');
      actions.querySelectorAll(':scope > .aud-receipt-utility').forEach(group=>tools.append(group));
      let share=card.querySelector(copySelector);
      if(!share){share=document.createElement('button');share.type='button';tools.append(share);}
      else if(!tools.contains(share))tools.append(share);
      share.classList.add('mojo-card-share');share.setAttribute('aria-label','Share');share.title='Share';
      share.innerHTML=icon('share');
      card.querySelectorAll('.aud-feedback,.mf-feedback,button[data-home-action="up"],button[data-home-action="down"]').forEach(control=>control.classList.add('mojo-feedback-legacy'));
      const ignore=document.createElement('button');ignore.type='button';ignore.className='mojo-card-ignore';ignore.setAttribute('aria-label','Ignore this');ignore.title='Ignore this';ignore.innerHTML=icon('ignore');tools.append(ignore);
      tools.querySelectorAll('button[aria-label]').forEach(button=>button.removeAttribute('title'));
      const discuss=tools.querySelector('button[aria-label="Discuss"],button[data-home-action="discuss"],button[data-mfc-action="discuss"],button[data-mfd-action="discuss"],button[data-mfr-action="discuss"]');
      if(discuss)tools.prepend(discuss);tools.insertBefore(share,discuss?discuss.nextSibling:tools.firstChild);
      const prior=localStorage.getItem(feedbackKey+cardKey(card))||'';
      const more=document.createElement('details');more.className='mojo-card-more';
      const summary=document.createElement('summary');summary.setAttribute('aria-label','More card actions');summary.title='More card actions';summary.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/></svg>';
      const menu=document.createElement('div');menu.className='mojo-card-more-menu';
      [...tools.querySelectorAll('button')].filter(button=>button!==share&&button!==discuss&&!button.closest('.mf-feedback,.aud-feedback')&&!['up','down'].includes(button.dataset.homeAction)).forEach(button=>{button.dataset.mojoMenuLabel=button.getAttribute('aria-label')||button.textContent.trim();menu.append(button);});
      [['not-useful','Not useful','<circle cx="12" cy="12" r="9"/><path d="M8 12h8"/>'],['useful','Useful for my work','<path d="m4 12 5 5L20 6"/>']].forEach(([value,label,shape])=>{const button=document.createElement('button');button.type='button';button.dataset.cardFeedback=value;button.dataset.mojoMenuLabel=label;button.setAttribute('aria-label',label);button.setAttribute('aria-pressed',String(value==='not-useful'?prior.startsWith('not-useful:')||prior==='incorrect':prior===value));button.innerHTML=`<svg viewBox="0 0 24 24" aria-hidden="true">${shape}</svg>`;menu.prepend(button);});
      const reasons=document.createElement('div');reasons.className='mojo-card-feedback-reasons';reasons.innerHTML='<strong>What made it less useful?</strong><button type="button" data-card-feedback-reason="irrelevant" data-mojo-menu-label="Not relevant to my work" aria-label="Not relevant to my work"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M4 12h16"/></svg></button><button type="button" data-card-feedback-reason="incorrect" data-mojo-menu-label="Data looks wrong" aria-label="Data looks wrong"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 2 21h20L12 3Z"/><path d="M12 9v5m0 3h.01"/></svg></button><button type="button" data-card-feedback-reason="known" data-mojo-menu-label="Already knew this" aria-label="Already knew this"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v14H4zM8 10h8M8 14h5"/></svg></button><button type="button" class="mojo-card-feedback-back" data-card-feedback-back data-mojo-menu-label="Back" aria-label="Back"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m13 6-6 6 6 6M7 12h12"/></svg></button>';
      menu.append(reasons);
      more.append(summary,menu);tools.append(more);
      let leaveTimer;
      more.addEventListener('pointerenter',()=>clearTimeout(leaveTimer));
      summary.addEventListener('pointerenter',()=>{if(matchMedia('(hover:hover)').matches)more.open=true;});
      more.addEventListener('pointerleave',()=>{leaveTimer=setTimeout(()=>{if(more.dataset.pinned!=='true')more.open=false;},140);});
      summary.addEventListener('click',event=>{event.preventDefault();const pinned=more.dataset.pinned!=='true';more.dataset.pinned=String(pinned);more.open=pinned;});
      menu.addEventListener('click',event=>{if(event.target.closest('[data-card-feedback="not-useful"],[data-card-feedback-back]'))return;more.open=false;delete more.dataset.pinned;});
      more.addEventListener('toggle',()=>{if(!more.open)delete menu.dataset.reasonsOpen;});
      tools.querySelectorAll('.aud-receipt-utility,.mfc-utility-group').forEach(group=>{if(!group.querySelector('button'))group.remove();});
      ignoredRow(card);
    });
  };
  enhanceCards();
  document.addEventListener('pointerdown',event=>{document.querySelectorAll('.mojo-card-more[open]').forEach(more=>{if(!more.contains(event.target)){more.open=false;delete more.dataset.pinned;}});});
  document.addEventListener('keydown',event=>{if(event.key==='Escape')document.querySelectorAll('.mojo-card-more[open]').forEach(more=>{more.open=false;delete more.dataset.pinned;});});
  let queued=false;new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;enhanceCards();});}).observe(document.body,{childList:true,subtree:true});
  document.querySelectorAll(selector).forEach(button=>{if(!button.matches('.topbar .btn.outline')||button.textContent.trim()==='Share')button.setAttribute('aria-label','Share and export this view');});
  document.addEventListener('mojo:open-share',event=>{
    activeCard=null;
    linkInput.value=event.detail?.url||location.href;
    status.textContent='';
    if(!dialog.open)dialog.showModal();
  });
  document.addEventListener('click',event=>{
    const reason=event.target.closest('[data-card-feedback-reason]');
    if(reason){const card=reason.closest(cardSelector);if(card){localStorage.setItem(feedbackKey+cardKey(card),`not-useful:${reason.dataset.cardFeedbackReason}`);card.querySelectorAll('[data-card-feedback]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.cardFeedback==='not-useful')));const more=reason.closest('.mojo-card-more');more.open=false;delete more.dataset.pinned;}return;}
    const back=event.target.closest('[data-card-feedback-back]');
    if(back){delete back.closest('.mojo-card-more-menu').dataset.reasonsOpen;return;}
    const feedbackChoice=event.target.closest('[data-card-feedback]');
    if(feedbackChoice){const card=feedbackChoice.closest(cardSelector);if(card){if(feedbackChoice.dataset.cardFeedback==='not-useful'){feedbackChoice.closest('.mojo-card-more-menu').dataset.reasonsOpen='true';return;}const key=feedbackKey+cardKey(card);const next=localStorage.getItem(key)==='useful'?'':'useful';if(next)localStorage.setItem(key,next);else localStorage.removeItem(key);card.querySelectorAll('[data-card-feedback]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.cardFeedback===next)));feedbackChoice.closest('.mojo-card-more').open=false;}return;}
    const ignore=event.target.closest('.mojo-card-ignore');
    if(ignore){event.preventDefault();event.stopImmediatePropagation();const card=ignore.closest(cardSelector);if(card){const saved=readIgnored();saved[cardKey(card)]=true;localStorage.setItem(ignoredKey,JSON.stringify(saved));ignoredRow(card);}return;}
    const cardShare=event.target.closest('.mojo-card-share');
    const button=cardShare||event.target.closest(selector);
    if(!button || (!cardShare&&button.matches('.topbar .btn.outline')&&button.textContent.trim()!=='Share'))return;
    event.preventDefault();event.stopImmediatePropagation();
    activeCard=cardShare?.closest(cardSelector)||null;
    linkInput.value=activeCard?cardUrl(activeCard):location.href;status.textContent='';dialog.showModal();
  },true);
});
