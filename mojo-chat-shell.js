/* One chat surface for Home and the three installed workspaces. */
window.MojoAddChatSuggestions = (container, suggestions) => {
  if (!container) return;
  container.querySelector(':scope > .mc-suggestion-chips')?.remove();
  const row = document.createElement('div');
  row.className = 'mc-suggestion-chips';
  row.setAttribute('role', 'group');
  row.setAttribute('aria-label', 'Suggested follow-up questions');
  suggestions.forEach(item => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = typeof item === 'string' ? item : item.label;
    button.addEventListener('click', () => {
      const prompt = typeof item === 'string' ? item : item.prompt;
      const field = container.closest('.chatbody')?.closest('.chatpane, .mc-trust-chat')?.querySelector('.chatfoot textarea');
      if (!field) return;
      field.value = prompt;
      field.dispatchEvent(new Event('input', {bubbles:true}));
      field.focus();
    });
    row.append(button);
  });
  container.append(row);
};
document.addEventListener('DOMContentLoaded', () => {
  const icon = {
    chevron: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>',
    shield: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></svg>',
    plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    mic: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 17v5m-4 0h8"/></svg>',
    voice: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 10v4m4-8v12m4-15v18m4-14v10m4-13v16m4-10v4"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5m-7 7 7-7 7 7"/></svg>'
  };
  const makeButton = (className, label, markup) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = className;
    button.setAttribute('aria-label', label);
    button.title = label;
    button.innerHTML = markup;
    return button;
  };
  document.querySelectorAll('.app .chatpane').forEach(pane => {
    const head = pane.querySelector('.chathead');
    const body = pane.querySelector('.chatbody');
    const foot = pane.querySelector('.chatfoot');
    const composer = foot?.querySelector('.composer, .aud-chat-composer');
    const textarea = composer?.querySelector('textarea');
    const send = composer?.querySelector('.chat-polish-send');
    if (!head || !body || !composer || !textarea || !send) return;
    pane.classList.add('mc-reference-chat');
    const app = pane.closest('.app');
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'mc-chat-resize-handle';
    resizeHandle.setAttribute('role', 'separator');
    resizeHandle.setAttribute('tabindex', '0');
    resizeHandle.setAttribute('aria-label', 'Resize chat panel');
    resizeHandle.setAttribute('aria-orientation', 'vertical');
    resizeHandle.setAttribute('aria-valuemin', '280');
    const maxChatWidth = () => Math.max(280, Math.min(760, (app?.getBoundingClientRect().width || innerWidth) - 340));
    const setChatWidth = (width, persist = false) => {
      const next = Math.max(280, Math.min(maxChatWidth(), Math.round(width)));
      app?.style.setProperty('--mojo-chat-width', `${next}px`);
      resizeHandle.setAttribute('aria-valuenow', String(next));
      resizeHandle.setAttribute('aria-valuemax', String(maxChatWidth()));
      if (persist) try { localStorage.setItem('mojo-chat-width-v1', String(next)); } catch (_) {}
    };
    try { const saved = Number(localStorage.getItem('mojo-chat-width-v1')); if (saved) setChatWidth(saved); } catch (_) {}
    let dragStartX = 0, dragStartWidth = 0;
    resizeHandle.addEventListener('pointerdown', event => {
      if (event.button !== 0) return;
      dragStartX = event.clientX;
      dragStartWidth = pane.getBoundingClientRect().width;
      resizeHandle.setPointerCapture(event.pointerId);
      resizeHandle.classList.add('is-dragging');
      event.preventDefault();
    });
    resizeHandle.addEventListener('pointermove', event => {
      if (!resizeHandle.hasPointerCapture(event.pointerId)) return;
      setChatWidth(dragStartWidth + event.clientX - dragStartX);
    });
    const finishResize = event => {
      if (!resizeHandle.hasPointerCapture(event.pointerId)) return;
      resizeHandle.releasePointerCapture(event.pointerId);
      resizeHandle.classList.remove('is-dragging');
      setChatWidth(pane.getBoundingClientRect().width, true);
    };
    resizeHandle.addEventListener('pointerup', finishResize);
    resizeHandle.addEventListener('pointercancel', finishResize);
    resizeHandle.addEventListener('keydown', event => {
      const delta = event.key === 'ArrowRight' ? 24 : event.key === 'ArrowLeft' ? -24 : 0;
      if (!delta) return;
      event.preventDefault();
      setChatWidth(pane.getBoundingClientRect().width + delta, true);
    });
    pane.append(resizeHandle);
    window.addEventListener('resize', () => { const saved = Number(localStorage.getItem('mojo-chat-width-v1')); if (saved) setChatWidth(saved); });
    composer.classList.add('mc-reference-composer');
    body.setAttribute('role', 'log');
    body.setAttribute('aria-label', 'Conversation with Mojo');
    body.setAttribute('aria-live', 'polite');
    const defaults = location.pathname.includes('Strategy')
      ? ['Show the evidence', 'Compare campaign directions', 'Help me shape the plan']
      : location.pathname.includes('Portfolio')
        ? ['Compare campaigns', 'Review my goals', 'Show creative performance']
        : ['Review flight budgets', 'Check campaign pacing', 'Show account coverage'];
    const syncSuggestions = () => {
      if (/\/(HomeSystem|CampaignLifecycle|Portfolio|Strategy|BestPractices)(?:\.html)?$/.test(location.pathname)) {
        body.querySelectorAll(':scope > .mc-suggestion-holder').forEach(node => node.remove());
        return;
      }
      if (body.querySelector('.mfc-chat-seed, .mso-chat-flow')) return;
      const last = [...body.children].reverse().find(node => node.matches('.mc-chat-ack, .bubble.chat-polish-assistant'));
      if (!last || last.nextElementSibling?.classList.contains('mc-suggestion-holder')) return;
      body.querySelectorAll(':scope > .mc-suggestion-holder').forEach(node => node.remove());
      const holder = document.createElement('div');
      holder.className = 'mc-suggestion-holder';
      last.after(holder);
      window.MojoAddChatSuggestions(holder, defaults);
    };
    syncSuggestions();
    new MutationObserver(syncSuggestions).observe(body, {childList:true});

    const headButton = makeButton('mc-chat-head-button', 'Chat menu', `<span>Chat</span>${icon.chevron}`);
    headButton.setAttribute('aria-expanded', 'false');
    const floatButton = makeButton('mc-chat-float-button', 'Open Fish Chat', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M21 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6"/></svg>');
    floatButton.addEventListener('click', () => {
      if (typeof window.MojoOpenFloatingChat === 'function') window.MojoOpenFloatingChat();
      else {document.querySelector('.mojo-fish-button')?.click();document.querySelector('.mojo-companion-tabs [data-panel="views"]')?.click()}
    });
    const headMenu = document.createElement('div');
    headMenu.className = 'mc-chat-head-menu';
    headMenu.hidden = true;
    const newChat = makeButton('mc-chat-menu-item', 'New chat', `${icon.plus}<span>New chat</span>`);
    const threadSearch = document.createElement('input');
    threadSearch.type = 'search';
    threadSearch.className = 'mc-chat-thread-search';
    threadSearch.placeholder = 'Search chats…';
    threadSearch.setAttribute('aria-label','Search chats');
    const threadList = document.createElement('div');
    threadList.className = 'mc-chat-thread-list';
    headMenu.append(newChat, threadSearch, threadList);
    const renderThreads = () => {
      threadList.replaceChildren();
      const query = threadSearch.value.trim().toLowerCase();
      const threads = window.MojoChatThreads?.list().filter(item => `${item.title} ${(item.subjects || []).join(' ')}`.toLowerCase().includes(query)) || [];
      threads.forEach(thread => {
        const button = makeButton('mc-chat-menu-item mc-chat-thread-item',thread.title,`<span></span>`);
        button.dataset.threadId = thread.id;
        button.querySelector('span').textContent = thread.title;
        button.setAttribute('aria-current',String(thread.id === window.MojoChatThreads.active().id));
        threadList.append(button);
      });
      if (!threads.length) {
        const empty = document.createElement('p');
        empty.className = 'mc-chat-thread-empty';
        empty.textContent = query ? 'No matching chats' : 'No chats yet';
        threadList.append(empty);
      }
    };
    threadSearch.addEventListener('input',renderThreads);
    document.addEventListener('mojo:chat-threads-changed',renderThreads);
    head.replaceChildren(headButton, floatButton, headMenu);
    // Other workspace scripts may rebuild this header after chat history loads.
    new MutationObserver(() => {
      if (!head.contains(headButton)) head.replaceChildren(headButton, floatButton, headMenu);
    }).observe(head, {childList: true});
    const closeMenu = () => { headMenu.hidden = true; headButton.setAttribute('aria-expanded', 'false'); };
    headButton.addEventListener('click', () => {
      headMenu.hidden = !headMenu.hidden;
      headButton.setAttribute('aria-expanded', String(!headMenu.hidden));
      if (!headMenu.hidden) { renderThreads(); threadSearch.focus(); }
    });
    newChat.addEventListener('click', () => {
      if (window.MojoChatThreads) window.MojoChatThreads.create();
      else body.replaceChildren();
      textarea.value = '';
      textarea.dispatchEvent(new Event('input', {bubbles:true}));
      closeMenu();
      textarea.focus();
    });
    threadList.addEventListener('click',event => {
      const item = event.target.closest('[data-thread-id]');
      if (item && window.MojoChatThreads?.select(item.dataset.threadId)) closeMenu();
    });
    document.addEventListener('pointerdown', event => { if (!head.contains(event.target)) closeMenu(); });
    head.addEventListener('keydown', event => { if (event.key === 'Escape') { closeMenu(); headButton.focus(); } });

    composer.querySelector('.mc-chat-composer-tools')?.remove();
    const tools = document.createElement('div');
    tools.className = 'mc-chat-tools';
    const tone = makeButton('mc-chat-tone', 'Response style: Balanced', `Balanced ${icon.chevron}`);
    const guard = makeButton('mc-chat-guard', 'Guarded mode on', `${icon.shield}<span>Guarded</span>${icon.chevron}`);
    const add = makeButton('mc-chat-add', 'More chat actions', icon.plus);
    const mic = makeButton('mc-chat-mic', 'Dictate a message', icon.mic);
    const voice = makeButton('mc-chat-voice', 'Start voice input', icon.voice);
    const options = document.createElement('div');
    options.className = 'mc-chat-options';
    options.hidden = true;
    tools.append(tone, guard, add, mic, voice, options);
    composer.insertBefore(tools, send);
    send.classList.add('mc-chat-send');
    send.innerHTML = icon.arrow;
    send.setAttribute('aria-label', 'Send message');
    send.title = 'Send message';

    const closeOptions = () => { options.hidden = true; options.replaceChildren(); };
    const showOptions = (items, anchor) => {
      const wasOpen = !options.hidden && options.dataset.owner === anchor.className;
      closeOptions();
      if (wasOpen) return;
      options.dataset.owner = anchor.className;
      items.forEach(([label, action]) => {
        const option = makeButton('mc-chat-option', label, label);
        option.addEventListener('click', () => { action(); closeOptions(); anchor.focus(); });
        options.append(option);
      });
      options.hidden = false;
      options.style.left = `${anchor.offsetLeft}px`;
    };
    tone.addEventListener('click', () => showOptions([
      ['Balanced', () => { tone.innerHTML = `Balanced ${icon.chevron}`; tone.setAttribute('aria-label', 'Response style: Balanced'); }],
      ['Concise', () => { tone.innerHTML = `Concise ${icon.chevron}`; tone.setAttribute('aria-label', 'Response style: Concise'); }],
      ['Detailed', () => { tone.innerHTML = `Detailed ${icon.chevron}`; tone.setAttribute('aria-label', 'Response style: Detailed'); }]
    ], tone));
    guard.addEventListener('click', () => {
      const enabled = guard.getAttribute('aria-pressed') !== 'false';
      guard.setAttribute('aria-pressed', String(!enabled));
      guard.setAttribute('aria-label', `Guarded mode ${enabled ? 'off' : 'on'}`);
      guard.querySelector('span').textContent = enabled ? 'Standard' : 'Guarded';
    });
    guard.setAttribute('aria-pressed', 'true');
    add.addEventListener('click', () => showOptions([
      ['New chat', () => newChat.click()],
      ['Paste page link', () => { textarea.value = `${textarea.value}${textarea.value ? ' ' : ''}${location.href}`; textarea.dispatchEvent(new Event('input', {bubbles:true})); textarea.focus(); }]
    ], add));
    document.addEventListener('pointerdown', event => { if (!composer.contains(event.target)) closeOptions(); });
    composer.addEventListener('keydown', event => { if (event.key === 'Escape') closeOptions(); });

    let recognition;
    const beginVoice = () => {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        const status = document.createElement('p');
        status.className = 'mc-chat-voice-status';
        status.textContent = 'Voice input is unavailable in this browser.';
        body.append(status);
        body.scrollTop = body.scrollHeight;
        return;
      }
      if (recognition) { recognition.stop(); return; }
      recognition = new SpeechRecognition();
      recognition.lang = document.documentElement.lang || 'en-US';
      recognition.interimResults = false;
      recognition.onresult = event => {
        textarea.value = `${textarea.value}${textarea.value ? ' ' : ''}${event.results[0][0].transcript}`;
        textarea.dispatchEvent(new Event('input', {bubbles:true}));
        textarea.focus();
      };
      recognition.onend = () => { recognition = null; pane.classList.remove('mc-chat-listening'); };
      recognition.onerror = () => { recognition = null; pane.classList.remove('mc-chat-listening'); };
      pane.classList.add('mc-chat-listening');
      recognition.start();
    };
    mic.addEventListener('click', beginVoice);
    voice.addEventListener('click', beginVoice);
    const sync = () => {
      const hasText = !!textarea.value.trim();
      composer.classList.toggle('mc-chat-has-text', hasText);
      send.disabled = !hasText;
    };
    textarea.addEventListener('input', sync);
    if (foot.tagName === 'FORM') {
      textarea.addEventListener('keydown', event => {
        if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
          event.preventDefault();
          foot.requestSubmit();
        }
      });
      foot.addEventListener('submit', () => requestAnimationFrame(sync));
    }
    sync();
  });
});
