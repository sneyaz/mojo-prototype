/* Original selected-text ribbon icons and positioning, adapted to this static campaign prototype. */
document.addEventListener('DOMContentLoaded', () => {
  if (/\/Activity(?:\.html)?$/.test(location.pathname)) return;
  // These five SVG paths and the selected-text toolbar are copied from the supplied HTML.
  const ribbonIcon={dig:'<path d="M21 12a8 8 0 0 1-8 8H7l-4 2 1.5-5A8 8 0 1 1 21 12Z"/><path d="M8.5 12h.01M12 12h.01M15.5 12h.01"/>',share:'<path d="M18 8a3 3 0 1 0-2.8-4"/><circle cx="18" cy="5" r="2"/><circle cx="6" cy="12" r="2"/><circle cx="18" cy="19" r="2"/><path d="m8 11 8-5M8 13l8 5"/>',task:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h5M8 16h4"/><path d="m16 16 1.5 1.5L20 15"/>',remind:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',feedback:'<path d="M4 4h16v13H9l-5 4z"/><path d="M8 9h8M8 12h5"/>'};
  const ribbonSvg = kind => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ribbonIcon[kind]}</svg>`;
  const ribbon = document.createElement('div');
  ribbon.id = 'excerptRibbon';
  ribbon.className = 'excerpt-ribbon';
  ribbon.hidden = true;
  ribbon.setAttribute('role','toolbar');
  ribbon.setAttribute('aria-label','Selected text actions');
  ribbon.innerHTML = `<button class="excerpt-dig" data-act="text-dig" data-tip="Ask Mojo about this" aria-label="Ask Mojo about selected text">${ribbonSvg('dig')}</button><button data-act="text-share" data-tip="Share" aria-label="Share selected text">${ribbonSvg('share')}</button><button data-act="text-assign" data-tip="Assign task" aria-label="Assign a task from selected text">${ribbonSvg('task')}</button><button data-act="text-remind" data-tip="Remind me…" aria-label="Set a reminder for selected text">${ribbonSvg('remind')}</button><button data-act="text-feedback" data-tip="Give feedback" aria-label="Give feedback on selected text">${ribbonSvg('feedback')}</button>`;
  ribbon.addEventListener('pointerdown', event => event.preventDefault());
  document.body.append(ribbon);

  let selectedExcerpt = null;
  const closeRibbon = () => { ribbon.hidden = true; };
  const findContext = node => {
    if (/\/Campaign(?:\.html)?$/.test(location.pathname) && new URLSearchParams(location.hash.slice(1)).get('view') === 'activity') return null;
    const element = node?.nodeType === 1 ? node : node?.parentElement;
    if (!element?.closest('main,.canvaspane,.chatpane .chatbody') || element.closest('textarea,input,[contenteditable],button,nav,.rail,.topbar,#excerptRibbon,.mojo-companion-panel,.excerpt-dialog')) return null;
    const heading = element.closest('section')?.querySelector('h1,h2,h3')?.textContent.trim()
      || document.querySelector('main h1, main h2')?.textContent.trim()
      || document.querySelector('.modulenav a.on')?.textContent.trim() || document.title || 'Mojo insight';
    return {label:heading};
  };
  const updateRibbon = () => {
    const selection = window.getSelection();
    const quote = selection?.toString().trim();
    if (!quote || quote.length < 3 || !selection.rangeCount) { closeRibbon(); return; }
    const context = findContext(selection.anchorNode);
    if (!context) { closeRibbon(); return; }
    const range = selection.getRangeAt(0);
    const rect = range.getClientRects()[0] || range.getBoundingClientRect();
    if (!rect || (!rect.width && !rect.height)) { closeRibbon(); return; }
    selectedExcerpt = {...context, quote:quote.slice(0,700), url:location.href};
    ribbon.hidden = false;
    const width = ribbon.offsetWidth, height = ribbon.offsetHeight;
    const x = Math.max(10, Math.min(innerWidth-width-10,rect.left+rect.width/2-width/2));
    let y = rect.top-height-10;
    if (y < 8) y = rect.bottom+10;
    ribbon.style.left = `${x}px`;
    ribbon.style.top = `${Math.min(innerHeight-height-8,y)}px`;
  };
  document.addEventListener('mouseup', event => { if (!event.target.closest('#excerptRibbon,.excerpt-dialog')) requestAnimationFrame(updateRibbon); });
  document.addEventListener('pointerup', event => { if (event.pointerType !== 'mouse' && !event.target.closest('#excerptRibbon,.excerpt-dialog')) requestAnimationFrame(updateRibbon); });
  document.addEventListener('keyup', event => {
    if (event.key === 'Escape') closeRibbon();
    else if (event.shiftKey || ['ArrowLeft','ArrowRight'].includes(event.key)) requestAnimationFrame(updateRibbon);
  });
  document.addEventListener('scroll', closeRibbon, true);

  const keys = {tasks:'mojo-excerpt-tasks-v1',reminders:'mojo-excerpt-reminders-v1',feedback:'mojo-excerpt-feedback-v1'};
  const id = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const read = key => { try { const data=JSON.parse(localStorage.getItem(key)||'[]'); return Array.isArray(data)?data:[]; } catch (_) { return []; } };
  const write = (key, items) => { try { localStorage.setItem(key,JSON.stringify(items)); } catch (_) {} };
  const toast = document.createElement('div');
  toast.className = 'excerpt-toast';
  toast.hidden = true;
  toast.setAttribute('role','status');
  document.body.append(toast);
  let toastTimer;
  const notify = message => { toast.textContent=message; toast.hidden=false; clearTimeout(toastTimer); toastTimer=setTimeout(()=>{toast.hidden=true;},4000); };

  const dialog = document.createElement('dialog');
  dialog.className = 'excerpt-dialog';
  dialog.innerHTML = `<form method="dialog"><div class="excerpt-dialog-head"><h2></h2><button type="button" class="excerpt-dialog-close" aria-label="Close">×</button></div><p class="excerpt-dialog-source"></p><blockquote></blockquote><div class="excerpt-dialog-fields"></div><div class="excerpt-dialog-actions"><button type="button" class="excerpt-cancel">Cancel</button><button type="submit" class="excerpt-primary"></button></div></form>`;
  document.body.append(dialog);
  const fields = dialog.querySelector('.excerpt-dialog-fields');
  const primary = dialog.querySelector('.excerpt-primary');
  const form = dialog.querySelector('form');
  let currentAction = '';
  const closeDialog = () => { if (dialog.open) dialog.close(); };
  dialog.querySelector('.excerpt-dialog-close').addEventListener('click', closeDialog);
  dialog.querySelector('.excerpt-cancel').addEventListener('click', closeDialog);
  dialog.addEventListener('click', event => { if (event.target === dialog) closeDialog(); });
  const field = (label, control) => {
    const wrapper = document.createElement('label');
    wrapper.className = 'excerpt-field';
    const name = document.createElement('span');
    name.textContent = label;
    wrapper.append(name,control);
    return wrapper;
  };
  const openDialog = action => {
    if (!selectedExcerpt) return;
    currentAction = action;
    closeRibbon();
    window.getSelection()?.removeAllRanges();
    fields.replaceChildren();
    dialog.querySelector('h2').textContent = ({share:'Share selected text',task:'Create a task draft',remind:'Remind me',feedback:'Give feedback'})[action];
    dialog.querySelector('.excerpt-dialog-source').textContent = selectedExcerpt.label;
    dialog.querySelector('blockquote').textContent = selectedExcerpt.quote;
    if (action === 'share') {
      const text = document.createElement('textarea');
      text.rows = 4;
      text.readOnly = true;
      text.value = `“${selectedExcerpt.quote}”\n\n${selectedExcerpt.url}`;
      fields.append(field('Shareable excerpt',text));
      primary.textContent = 'Copy excerpt';
    } else if (action === 'task') {
      const input = document.createElement('input');
      input.name = 'taskTitle';
      input.required = true;
      input.value = selectedExcerpt.quote.slice(0,90);
      fields.append(field('Task title',input));
      primary.textContent = 'Save task draft';
    } else if (action === 'remind') {
      const input = document.createElement('input');
      input.name = 'dueAt';
      input.type = 'datetime-local';
      input.required = true;
      const tomorrow = new Date(Date.now()+86400000);
      tomorrow.setHours(9,0,0,0);
      input.value = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth()+1).padStart(2,'0')}-${String(tomorrow.getDate()).padStart(2,'0')}T09:00`;
      fields.append(field('When',input));
      primary.textContent = 'Save reminder';
    } else if (action === 'feedback') {
      const select = document.createElement('select');
      select.name = 'feedbackKind';
      ['Needs correction','Helpful','Missing context'].forEach(value => { const option=document.createElement('option'); option.textContent=value; select.append(option); });
      const note = document.createElement('textarea');
      note.name = 'feedbackNote';
      note.rows = 3;
      note.placeholder = 'What should Mojo know?';
      fields.append(field('Feedback',select),field('Note',note));
      primary.textContent = 'Save feedback draft';
    }
    dialog.showModal();
    fields.querySelector('input,textarea,select')?.focus();
  };

  ribbon.addEventListener('click', event => {
    const action = event.target.closest('button')?.dataset.act;
    if (!action || !selectedExcerpt) return;
    if (action === 'text-dig') {
      closeRibbon();
      window.getSelection()?.removeAllRanges();
      const prompt = `Tell me more about this from ${selectedExcerpt.label}:\n\n“${selectedExcerpt.quote}”`;
      const composer = document.querySelector('.chatpane .chatfoot textarea,.mc-trust-chat .chatfoot textarea,.chatpanel .composer textarea');
      if (composer) {
        if (typeof window.MojoOpenChat === 'function') window.MojoOpenChat(prompt, false);
        else {
          const chat = document.querySelector('#chatOn,#chatToggle');
          if (chat) { chat.checked = true; chat.dispatchEvent(new Event('change',{bubbles:true})); }
          composer.value = prompt;
          composer.dispatchEvent(new Event('input',{bubbles:true}));
          composer.focus();
        }
        notify('The selected text is ready in Chat.');
      } else {
        sessionStorage.setItem('mojo-selected-text-chat-v1',prompt);
        location.href = 'HomeSystem.html#feed-insights';
      }
    } else openDialog(({ 'text-share':'share','text-assign':'task','text-remind':'remind','text-feedback':'feedback' })[action]);
  });

  const pendingPrompt = sessionStorage.getItem('mojo-selected-text-chat-v1');
  if (pendingPrompt && /\/(?:HomeSystem)(?:\.html)?$/.test(location.pathname)) {
    sessionStorage.removeItem('mojo-selected-text-chat-v1');
    setTimeout(() => window.MojoOpenChat?.(pendingPrompt,false), 100);
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!selectedExcerpt) return;
    if (currentAction === 'share') {
      const text = fields.querySelector('textarea');
      try { await navigator.clipboard.writeText(text.value); notify('Excerpt copied.'); }
      catch (_) { text.focus(); text.select(); notify('Select and copy the excerpt.'); return; }
    } else if (currentAction === 'task') {
      const title = fields.querySelector('input').value.trim();
      if (!title) return;
      write(keys.tasks,[{id:id(),title,...selectedExcerpt,createdAt:Date.now()},...read(keys.tasks)]);
      renderSavedWork();
      notify('Task draft saved. Find it in Tasks.');
    } else if (currentAction === 'remind') {
      const dueAt = new Date(fields.querySelector('input').value).getTime();
      if (!Number.isFinite(dueAt) || dueAt <= Date.now()) { notify('Choose a future time.'); return; }
      write(keys.reminders,[{id:id(),dueAt,...selectedExcerpt,createdAt:Date.now()},...read(keys.reminders)]);
      renderSavedWork();
      notify('Reminder saved. It will appear while this prototype is open.');
    } else if (currentAction === 'feedback') {
      const kind = fields.querySelector('select').value;
      const note = fields.querySelector('textarea').value.trim();
      write(keys.feedback,[{id:id(),kind,note,...selectedExcerpt,createdAt:Date.now()},...read(keys.feedback)]);
      notify('Feedback draft saved locally.');
    }
    closeDialog();
  });

  function renderSavedWork() {
    const main = document.querySelector('main.canvaspane');
    if (!main || !/\/Tasks(?:\.html)?$/.test(location.pathname)) return;
    let list = main.querySelector('.excerpt-saved-work');
    const tasks = read(keys.tasks), reminders = read(keys.reminders);
    if (!tasks.length && !reminders.length) { list?.remove(); return; }
    if (!list) { list=document.createElement('section'); list.className='excerpt-saved-work'; main.prepend(list); }
    list.replaceChildren();
    const title = document.createElement('h2');
    title.textContent = 'From selected text';
    list.append(title);
    [...tasks.map(item=>({...item,kind:'Task draft'})),...reminders.map(item=>({...item,kind:'Reminder'}))].forEach(item => {
      const row = document.createElement('div');
      row.className = 'excerpt-saved-row';
      const content = document.createElement('div');
      const kind = document.createElement('small'); kind.textContent=item.kind;
      const strong = document.createElement('strong'); strong.textContent=item.title||item.quote;
      const meta = document.createElement('span'); meta.textContent=item.kind==='Reminder' ? new Date(item.dueAt).toLocaleString() : item.label;
      content.append(kind,strong,meta);
      const link = document.createElement('a'); link.href=item.url; link.textContent='Source ↗';
      const remove = document.createElement('button'); remove.type='button'; remove.textContent='Remove';
      remove.addEventListener('click',()=>{const key=item.kind==='Reminder'?keys.reminders:keys.tasks;write(key,read(key).filter(other=>other.id!==item.id));renderSavedWork();});
      row.append(content,link,remove); list.append(row);
    });
  }
  renderSavedWork();
  const checkReminders = () => {
    const reminders = read(keys.reminders);
    const due = reminders.find(item => !item.notified && item.dueAt <= Date.now());
    if (!due) return;
    due.notified = true;
    write(keys.reminders,reminders);
    notify(`Reminder: ${due.quote.slice(0,90)}`);
    renderSavedWork();
  };
  checkReminders();
  setInterval(checkReminders,30000);
});
