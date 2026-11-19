/* Shared Mojo companion, using the original supplied pixel-art renderer. */
(() => {
  const key = 'mojo-chat-threads-v1';
  const legacyKey = 'mojo-shared-chat-history-v1';
  const validMessage = item => item && ['user', 'mojo'].includes(item.role) && typeof item.text === 'string';
  const withoutPrototypeJunk = messages => {
    const cleaned = [];
    let draftIntroSeen = false;
    for (let index = 0; index < messages.length; index++) {
      const item = messages[index];
      if (item.role === 'mojo' && item.text === 'I have the audience, budget and creative ready. Tell me what to change before I draft it.') {
        if (draftIntroSeen) continue;
        draftIntroSeen = true;
      }
      if (item.role === 'user' && /^(?:fdsa){2,3}$/i.test(item.text.trim())) {
        if (messages[index + 1]?.role === 'mojo' && messages[index + 1].text.trim() === 'Ask about spend, pacing, accounts, or campaign results.') index++;
        continue;
      }
      cleaned.push(item);
    }
    return cleaned;
  };
  const createId = () => globalThis.crypto?.randomUUID?.() || `chat-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const categoryFor = text => {
    if (/\b(aeo|answer engines?|ai answers?|citations?|referrals?|chatgpt|perplexity)\b/i.test(text)) return 'AEO';
    if (/\b(audiences?|accounts?|targeting|segments?|intent|matches|coverage)\b/i.test(text)) return 'Audiences';
    if (/\b(campaigns?|ads?|budget|spend|pacing|flights?|creative|ctr)\b/i.test(text)) return 'Campaigns';
    return 'General';
  };
  const areaHere = () => {
    const page = location.pathname.split('/').pop().replace(/\.html$/, '');
    if (page === 'AppWorkspace') return new URLSearchParams(location.search).get('app') === 'aeo' ? 'AEO' : 'Audiences';
    if (['HomeSystem','Portfolio','Campaign','Performance','Accounts'].includes(page)) return 'Campaigns';
    return 'All';
  };
  const knownSubjects = ['Campaign A','Q3 CTV ICP','Enterprise ICP audience','Intent Surge','Make mo money','Product A','GO Prep'];
  const detectSubjects = messages => {
    const text = messages.map(item => item.text).join(' ');
    return knownSubjects.filter(subject => new RegExp(`\\b${subject.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}\\b`,'i').test(text));
  };
  const cleanSubjects = value => Array.isArray(value) ? [...new Set(value.filter(item => typeof item === 'string').map(item => item.trim().slice(0, 48)).filter(Boolean))].slice(0, 8) : [];
  let state;
  try {
    const saved = JSON.parse(localStorage.getItem(key) || 'null');
    if (saved && Array.isArray(saved.threads)) {
      const threads = saved.threads.filter(item => item && typeof item.id === 'string' && typeof item.title === 'string' && Array.isArray(item.messages)).map(item => ({
        id: item.id, title: item.title.slice(0, 80), area: item.area || item.category || categoryFor(item.title), subjects: cleanSubjects(item.subjects), removedSubjects: cleanSubjects(item.removedSubjects), updatedAt: Number(item.updatedAt) || Date.now(),
        messages: withoutPrototypeJunk(item.messages.filter(validMessage)).slice(-40)
      })).slice(0, 30);
      if (threads.length) state = {activeId: threads.some(item => item.id === saved.activeId) ? saved.activeId : threads[0].id, threads};
    }
  } catch (_) {}
  if (!state) {
    let messages = [];
    try { messages = withoutPrototypeJunk(JSON.parse(localStorage.getItem(legacyKey) || '[]').filter(validMessage)).slice(-40); } catch (_) {}
    const first = messages.find(item => item.role === 'user')?.text.trim();
    const thread = {id:createId(),title:first ? first.slice(0, 48) : 'New chat',area:areaHere() === 'All' ? categoryFor(first || '') : areaHere(),subjects:detectSubjects(messages),removedSubjects:[],updatedAt:Date.now(),messages};
    state = {activeId:thread.id,threads:[thread]};
  }
  // Keep the presentation conversation focused on work the visitor actually did.
  const seededTitles=new Set(['What should we do with unspent flight budget?','Which target accounts need attention?','Where are we missing in AI answers?']);
  state.threads = state.threads.filter(thread => !thread.id.startsWith('mojo-example-')&&!seededTitles.has(thread.title));
  if (!localStorage.getItem('mojo-demo-thread-clean-v2')) {
    state.threads = state.threads.filter(thread => thread.id !== 'mojo-demo-buying-group');
    localStorage.setItem('mojo-demo-thread-clean-v2','1');
  }
  if (!state.threads.length) {
    const thread={id:createId(),title:'New chat',area:areaHere(),subjects:[],removedSubjects:[],updatedAt:Date.now(),messages:[]};
    state.threads=[thread];
  }
  if (!state.threads.some(thread=>thread.id===state.activeId)) state.activeId=state.threads[0].id;
  // One-time cleanup of the prototype's test messages. Keep real user conversations.
  let demoResetActive=false;
  if(!localStorage.getItem('mojo-chat-examples-v2')){
    const junk=/^(?:test(?: message)?|asdf[a-z]*|[a-z]*fdsa[a-z]*|gfds[a-z]*|dsadsa|[a-z]{1,3})$/i;
    const before=state.threads.length;
    state.threads=state.threads.filter(thread=>{
      if(thread.id.startsWith('mojo-example-'))return true;
      const user=thread.messages.filter(item=>item.role==='user').map(item=>item.text.trim());
      return thread.title==='New chat'||(user.length>0&&!user.every(text=>junk.test(text)));
    });
    if(before!==state.threads.length&&!state.threads.some(thread=>thread.id===state.activeId)){
      state.activeId=state.threads[0]?.id;demoResetActive=true;
    }
    localStorage.setItem('mojo-chat-examples-v2','1');
  }
  const persist = (type) => {
    try { localStorage.setItem(key, JSON.stringify(state)); } catch (_) {}
    document.dispatchEvent(new CustomEvent('mojo:chat-threads-changed', {detail:{type,activeId:state.activeId}}));
  };
  const active = () => state.threads.find(item => item.id === state.activeId);
  window.MojoChatThreads = {
    demoResetActive,
    cleanMessages: withoutPrototypeJunk,
    active,
    list: () => state.threads.filter(item => item.messages.length).sort((a,b) => b.updatedAt - a.updatedAt),
    saveDemo: messages => {
      const id='mojo-demo-buying-group';
      let thread=state.threads.find(item=>item.id===id);
      if(!thread){thread={id,title:'Buying group follow-up',area:'Campaigns',subjects:['Buying group follow-up'],removedSubjects:[],updatedAt:Date.now(),messages:[]};state.threads.unshift(thread)}
      thread.messages=messages.map(item=>({role:item.role==='assistant'?'mojo':item.role,text:String(item.text||'')})).filter(validMessage).slice(-40);
      thread.updatedAt=Date.now();
      state.activeId=id;
      persist('messages');
    },
    create: () => {
      const thread = {id:createId(),title:'New chat',area:areaHere(),subjects:[],removedSubjects:[],updatedAt:Date.now(),messages:[]};
      state.threads.unshift(thread);
      state.threads = state.threads.slice(0, 30);
      state.activeId = thread.id;
      persist('select');
      return thread;
    },
    select: id => {
      if (!state.threads.some(item => item.id === id)) return false;
      state.activeId = id;
      persist('select');
      return true;
    },
    saveMessages: messages => {
      const thread = active();
      if (!thread) return;
      thread.messages = withoutPrototypeJunk(messages.filter(validMessage)).slice(-40);
      const first = thread.messages.find(item => item.role === 'user')?.text.trim();
      if (first) {
        thread.title = first.slice(0, 48);
        if (!thread.area || thread.area === 'All' || thread.area === 'General') thread.area = areaHere() === 'All' ? categoryFor(first) : areaHere();
      }
      thread.subjects = cleanSubjects([...(thread.subjects || []), ...detectSubjects(thread.messages).filter(subject => !(thread.removedSubjects || []).includes(subject))]);
      thread.updatedAt = Date.now();
      persist('messages');
    },
    addSubject: value => {
      const thread = active(), subject = String(value || '').trim().slice(0, 48);
      if (!thread || !subject) return false;
      thread.subjects = cleanSubjects([...(thread.subjects || []), subject]);
      thread.removedSubjects = (thread.removedSubjects || []).filter(item => item.toLowerCase() !== subject.toLowerCase());
      persist('subjects'); return true;
    },
    removeSubject: value => {
      const thread = active(); if (!thread) return;
      thread.subjects = (thread.subjects || []).filter(item => item !== value);
      thread.removedSubjects = cleanSubjects([...(thread.removedSubjects || []), value]);
      persist('subjects');
    },
    areaHere
  };
  window.addEventListener('storage', event => {
    if (event.key !== key || !event.newValue) return;
    try { const next = JSON.parse(event.newValue); if (Array.isArray(next.threads)) {state = next; document.dispatchEvent(new CustomEvent('mojo:chat-threads-changed',{detail:{type:'select',activeId:state.activeId}}));} } catch (_) {}
  });
  persist('ready');
})();
document.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('.mojo-companion')) return;
  const companionChoices = [
    ['koi', 'Koi fish'], ['boring-bell', 'Boring Bell'], ['turtle', 'Turtle'],
    ['cat', 'Cat'], ['dog', 'Dog'], ['dot', 'Dot'], ['blob', 'Blob']
  ];
  const companionColors = [
    ['orange', 'Orange', '#F28C3F'], ['violet', 'Purple', '#7957C5'],
    ['lilac', 'Lavender', '#B68BE4'], ['blue', 'Blue', '#6588D4'],
    ['graphite', 'Graphite', '#6F6A78']
  ];
  const companion = document.createElement('div');
  companion.className = 'mojo-companion';
  companion.innerHTML = `
    <button class="mojo-fish-button" type="button" aria-label="Open Mojo companion" aria-expanded="false" aria-controls="mojo-companion-panel" title="Open Mojo · drag to move"><span class="mojo-fish-art" aria-hidden="true"></span></button>
    <div class="mojo-companion-panel" id="mojo-companion-panel" role="dialog" aria-label="Mojo companion" hidden>
      <header class="mojo-companion-head"><div><h2><img src="assets/moj-wordmark-black.svg" alt="Mojo"></h2></div></header>
      <div class="mojo-companion-tabs" role="tablist" aria-label="Mojo companion views">
        <button type="button" role="tab" id="mojo-tab-here" aria-controls="mojo-panel-here" data-panel="here" aria-selected="true" tabindex="0">Notifications</button>
        <button type="button" role="tab" id="mojo-tab-recent" aria-controls="mojo-panel-recent" data-panel="recent" aria-selected="false" tabindex="-1">Recents</button>
        <button type="button" role="tab" id="mojo-tab-views" aria-controls="mojo-panel-views" data-panel="views" aria-selected="false" tabindex="-1">Chat</button>
      </div>
      <div class="mojo-panel-body">
        <div class="mojo-panel-view" id="mojo-panel-here" role="tabpanel" aria-labelledby="mojo-tab-here" data-panel-view="here">
        </div>
        <div class="mojo-panel-view" id="mojo-panel-recent" role="tabpanel" aria-labelledby="mojo-tab-recent" data-panel-view="recent" hidden>
        </div>
        <div class="mojo-panel-view" id="mojo-panel-views" role="tabpanel" aria-labelledby="mojo-tab-views" data-panel-view="views" hidden></div>
      </div>
      <button class="mojo-customize-toggle" type="button" aria-expanded="false" aria-controls="mojo-customize">Customize companion <span aria-hidden="true">⌄</span></button>
      <div class="mojo-customize" id="mojo-customize" hidden>
        <div class="mojo-customize-row mojo-customize-shapes"><span>Choose a companion</span><div role="group" aria-label="Companion shape">${companionChoices.map(([id,label]) => `<button type="button" data-shape="${id}" aria-label="${label}" aria-pressed="${id === 'koi'}" title="${label}"><span class="mojo-companion-picker" aria-hidden="true"></span><small>${label}</small></button>`).join('')}</div></div>
        <div class="mojo-customize-row"><span>Size</span><div role="group" aria-label="Companion size"><button type="button" data-size="extra-small">Extra small</button><button type="button" data-size="small">Small</button><button type="button" data-size="medium">Medium</button></div></div>
        <div class="mojo-customize-row"><span>Color</span><div role="group" aria-label="Companion color">${companionColors.map(([id,label,hex]) => `<button type="button" class="mojo-color-swatch" data-color="${id}" style="--swatch:${hex}" aria-label="${label}" title="${label}"></button>`).join('')}<label class="mojo-custom-color" title="Pick your own color"><input type="color" value="#F28C3F" aria-label="Pick your own companion color"></label></div></div>
        <div class="mojo-customize-row"><span id="mojo-glow-label">Glow</span><button type="button" class="mojo-setting-switch mojo-glow-toggle" role="switch" aria-labelledby="mojo-glow-label" aria-checked="true"><span class="mojo-switch-track" aria-hidden="true"></span><span class="mojo-switch-state">On</span></button></div>
        <div class="mojo-customize-row"><span id="mojo-motion-label">Motion</span><button type="button" class="mojo-setting-switch mojo-movement-toggle" role="switch" aria-labelledby="mojo-motion-label" aria-checked="true"><span class="mojo-switch-track" aria-hidden="true"></span><span class="mojo-switch-state">On</span></button></div>
        <div class="mojo-customize-row"><span id="mojo-quiet-label">Quiet mode</span><button type="button" class="mojo-setting-switch mojo-quiet-toggle" role="switch" aria-labelledby="mojo-quiet-label" aria-checked="false" title="Show a still Mojo icon while keeping the panel available"><span class="mojo-switch-track" aria-hidden="true"></span><span class="mojo-switch-state">Off</span></button></div>
      </div>
    </div>`;
  document.body.append(companion);
  const fish = companion.querySelector('.mojo-fish-button');
  const fishArt = companion.querySelector('.mojo-fish-art');
  const panel = companion.querySelector('.mojo-companion-panel');
  panel.style.display = 'none';
  const customize = companion.querySelector('.mojo-customize');
  const customizeToggle = companion.querySelector('.mojo-customize-toggle');
  const glowToggle = companion.querySelector('.mojo-glow-toggle');
  const movementToggle = companion.querySelector('.mojo-movement-toggle');
  const quietToggle = companion.querySelector('.mojo-quiet-toggle');
  const customColorInput = companion.querySelector('.mojo-custom-color input');
  const preferencesKey = 'mojo-brief-companion-preferences-v1';
  const positionKey = 'mojo-brief-companion-position-v1';
  const recentKey = 'mojo-companion-recent-places-v1';
  const recentWindowPrefix = 'mojo-prototype-recent:';
  const pageNames = {
    'HomeSystem.html': 'Feed', 'Strategy.html': 'Strategy & Planning',
    'Work.html': 'Feed', 'Portfolio.html': 'Dashboards',
    'BestPractices.html': 'Best practices',
    'Settings.html': 'Settings',
    'Setup.html': 'Setup'
  };
  const currentFile = () => {
    const route = location.pathname.split('/').pop() || 'HomeSystem';
    if (route === 'index' || route === 'index.html') return 'HomeSystem.html';
    return route.endsWith('.html') ? route : `${route}.html`;
  };
  const currentPlace = () => {
    const file = currentFile();
    const section = pageNames[file] || 'Mojo';
    if (file === 'HomeSystem.html') {
      const view = /^#feed-(insights|decisions|receipts)$/.exec(location.hash)?.[1];
      const title = view ? `Campaigns · ${view[0].toUpperCase()}${view.slice(1)}` : 'Campaigns · Feed';
      return {url:`HomeSystem.html${view ? location.hash : ''}`, title, section};
    }
    if (file === 'Portfolio.html') {
      const view = /^#(goals|channels|campaigns|accounts|creative)$/.exec(location.hash)?.[1];
      const titles = {goals:'Your initiatives', channels:'Channels dashboard', campaigns:'Campaigns dashboard', accounts:'Accounts dashboard', creative:'Creatives dashboard'};
      return {url:`Portfolio.html${view ? location.hash : ''}`, title:titles[view] || 'Your initiatives', section};
    }
    return {url:file, title:file === 'Strategy.html' ? 'Strategy & Planning' : section, section};
  };
  const safePlace = place => place && typeof place.title === 'string' && typeof place.section === 'string'
    && typeof place.url === 'string' && /^(HomeSystem|Work|Portfolio|Strategy|BestPractices|Routines|Apps|Settings)\.html(?:\?[^<>"\s#]*)?(?:#[^<>"\s]*)?$/.test(place.url);
  let recentPlaces = [];
  try {
    if (window.name.startsWith(recentWindowPrefix)) {
      const saved = JSON.parse(decodeURIComponent(window.name.slice(recentWindowPrefix.length)));
      if (Array.isArray(saved)) recentPlaces = saved.filter(safePlace).slice(0, 8);
    }
  } catch (_) {}
  try {
    const saved = JSON.parse(localStorage.getItem(recentKey) || '[]');
    if (Array.isArray(saved)) recentPlaces = [...recentPlaces, ...saved.filter(safePlace).filter(place => !recentPlaces.some(current => current.url === place.url))].slice(0, 8);
  } catch (_) {}
  const make = (tag, className, value) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (value !== undefined) node.textContent = value;
    return node;
  };
  const panelIcons = {
    draft: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M15 2v7h7M8 13h8M8 17h5"/>',
    reports: '<path d="M8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-3"/><path d="M11 3h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path d="M12 10h6M12 7h6"/>',
    freshness: '<path d="M20 11a8 8 0 0 0-14.9-4M4 4v4h4M4 13a8 8 0 0 0 14.9 4M20 20v-4h-4"/>',
    goal: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    chat: '<path d="M20 11.5a8 8 0 0 1-8 8 8.4 8.4 0 0 1-3.6-.8L4 20l1.3-4.4A8 8 0 1 1 20 11.5Z"/>',
    campaign: '<path d="m3 11 15-6v14L3 13zM18 9a3 3 0 0 1 0 6M7 14l1 6h4l-2-5"/>',
    canvas: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>'
  };
  const panelIcon = (kind, className) => {
    const wrapper = make('span', className);
    wrapper.setAttribute('aria-hidden', 'true');
    if (kind === 'salesforce') {
      const logo = make('img');
      logo.src = 'assets/salesforce.png'; logo.alt = '';
      wrapper.append(logo);
    } else {
      wrapper.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" focusable="false">${panelIcons[kind]}</svg>`;
    }
    return wrapper;
  };
  const hereView = companion.querySelector('[data-panel-view="here"]');
  const recentView = companion.querySelector('[data-panel-view="recent"]');
  const viewsView = companion.querySelector('[data-panel-view="views"]');
  const panelBody = companion.querySelector('.mojo-panel-body');
  const viewsKey = 'mojo-companion-saved-views-v1';
  let savedViews = [];
  try {
    const saved = JSON.parse(localStorage.getItem(viewsKey) || '[]');
    if (Array.isArray(saved)) savedViews = saved.filter(safePlace).slice(0, 12);
  } catch (_) {}
  const saveViews = () => {
    try { localStorage.setItem(viewsKey, JSON.stringify(savedViews)); } catch (_) {}
  };
  const findingKey = 'mojo-companion-seen-findings-v1';
  const budgetFinding = {id:'flight-allocation-2026-10-31', title:'Three flights ended with less than half their budgets spent', href:'HomeSystem.html#finding-flights', note:'Open the $40k decision →', eyebrow:'BUDGET CHOICE'};
  let seenFindings = [];
  try {
    const saved = JSON.parse(localStorage.getItem(findingKey) || 'null');
    seenFindings = Array.isArray(saved) ? saved.filter(id => typeof id === 'string') : [budgetFinding.id];
  } catch (_) { seenFindings = [budgetFinding.id]; }
  try { localStorage.setItem(findingKey, JSON.stringify(seenFindings)); } catch (_) {}
  const findings = [budgetFinding];
  const saveSeen = id => {
    if (!seenFindings.includes(id)) seenFindings.push(id);
    try { localStorage.setItem(findingKey, JSON.stringify(seenFindings)); } catch (_) {}
  };
  const findingVisible = finding => {
    const target = finding.id === budgetFinding.id
      ? document.getElementById(currentFile() === 'HomeSystem.html' ? 'mojo-reallocation' : '')
      : document.querySelector(`[data-finding-id="${CSS.escape(finding.id)}"]`);
    if (!target || !target.getClientRects().length) return false;
    const rect = target.getBoundingClientRect();
    return rect.bottom > 0 && rect.top < innerHeight && rect.right > 0 && rect.left < innerWidth;
  };
  const recentQuestionsKey = 'mojo-companion-recent-questions-v1';
  let recentQuestions = [];
  try {
    const saved = JSON.parse(sessionStorage.getItem(recentQuestionsKey) || '[]');
    if (Array.isArray(saved)) recentQuestions = saved.filter(item => item && typeof item.prompt === 'string' && item.prompt.length <= 300 && safePlace(item.place)).slice(0, 4);
  } catch (_) {}
  const addPlaceLink = (parent, label, href, note, eyebrow) => {
    const link = make('a', 'mojo-panel-item');
    link.href = href;
    if (eyebrow) link.append(make('small', '', eyebrow));
    link.append(make('strong', '', label));
    if (note) link.append(make('span', '', note));
    parent.append(link);
    return link;
  };
  const addNotification = (label, href, note, kind) => {
    const link = make('a', `mojo-panel-item mojo-notification-item mojo-notification-${kind}`);
    link.href = href;
    const copy = make('span', 'mojo-notification-copy');
    copy.append(make('strong', '', label), make('span', '', note));
    link.append(panelIcon(kind, 'mojo-notification-icon'), copy);
    hereView.append(link);
  };
  const renderHere = () => {
    const scrollTop = panelBody.scrollTop;
    hereView.replaceChildren();
    try {
      const campaigns = JSON.parse(localStorage.getItem('mojo-created-campaign-drafts-v1') || '[]');
      if (Array.isArray(campaigns) && campaigns.some(item => item?.buildStatus === 'live' && item.publishedAt)) {
        addNotification('First campaign launched', 'CampaignLifecycle.html?view=build', 'Data will come in soon. I’ll let you know when it does.', 'campaign');
      }
    } catch (_) {}
    addNotification('Salesforce needs to be reconnected', 'Connections.html', 'Ask an admin to reconnect it to resume pipeline updates.', 'salesforce');
    addNotification('Monday campaign draft is ready', 'Strategy.html', 'Review the audience, creative, channels, and budget.', 'draft');
    addNotification('3 weekly reports need review', 'HomeSystem.html#queue-reports', 'Check the drafts before they are sent.', 'reports');
    addNotification('Intent data is 16 days old', 'AppWorkspace.html?app=audience-builder#dashboards:intent-surge', 'Check the source connection before using this audience.', 'freshness');
    addNotification('A campaign needs a primary goal', 'Portfolio.html#goals', 'Assign it in Your initiatives.', 'goal');
    panelBody.scrollTop = scrollTop;
    return null;
  };
  const renderRecent = () => {
    recentView.replaceChildren();
    const area = window.MojoChatThreads.areaHere();
    const threads = window.MojoChatThreads.list().filter(thread => area === 'All' || thread.area === area).slice(0, 12);
    threads.forEach(thread => {
      const button = make('button', 'mojo-panel-item mojo-recent-thread mojo-recent-entry');
      button.type = 'button'; button.dataset.threadId = thread.id;
      const copy = make('span', 'mojo-recent-copy');
      copy.append(make('strong', '', thread.title));
      if (thread.subjects?.length) copy.append(make('span', '', thread.subjects.join(' · ')));
      button.append(panelIcon('chat', 'mojo-recent-icon'), copy);
      recentView.append(button);
    });
    const places = recentPlaces.filter(safePlace).slice(0, 5);
    places.forEach(place => {
      const kind = place.url.startsWith('HomeSystem.html') ? 'campaign' : 'canvas';
      const link = make('a', 'mojo-panel-item mojo-recent-entry');
      link.href = place.url;
      const copy = make('span', 'mojo-recent-copy');
      const currentNames = {
        'HomeSystem.html':'Campaigns · Feed',
        'Portfolio.html':'Your initiatives',
        'Portfolio.html#goals':'Your initiatives',
        'Portfolio.html#campaigns':'Campaigns dashboard',
        'Portfolio.html#accounts':'Accounts dashboard',
        'Portfolio.html#creative':'Creatives dashboard',
        'Strategy.html':'Strategy & Planning'
      };
      copy.append(make('strong', '', currentNames[place.url] || place.title));
      link.append(panelIcon(kind, 'mojo-recent-icon'), copy);
      recentView.append(link);
    });
    if (!threads.length && !places.length) recentView.append(make('p', 'mojo-recent-empty', 'Nothing recent yet.'));
  };
  const renderViews = () => {
    if (viewsView.dataset.chatReady) return;
    viewsView.dataset.chatReady = 'true';
    viewsView.innerHTML = '<div class="mojo-fish-chat-head"><strong>Chat <span aria-hidden="true">⌄</span></strong></div><div class="mojo-fish-chat-log" role="log" aria-label="Conversation with Mojo" aria-live="polite"></div><form class="mojo-fish-chat-form"><label class="mojo-fish-chat-sr" for="mojo-fish-question">Message Mojo</label><textarea id="mojo-fish-question" rows="2" placeholder="Message Mojo…"></textarea><div class="mojo-fish-chat-tools" aria-label="Chat settings"><span>Balanced <svg class="mojo-fish-tool-caret" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m2.5 4.5 3.5 3 3.5-3"/></svg></span><span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2 4 5v6c0 5 3.5 8.5 8 11 4.5-2.5 8-6 8-11V5z"/><path d="m9 12 2 2 4-4"/></svg>Guarded <svg class="mojo-fish-tool-caret" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m2.5 4.5 3.5 3 3.5-3"/></svg></span><span class="mojo-fish-chat-plus" aria-hidden="true">+</span></div><button type="submit" aria-label="Send message" title="Send message"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></svg></button></form>';
    const fishHead = viewsView.querySelector('.mojo-fish-chat-head');
    fishHead.innerHTML = '<div class="mojo-fish-chat-head-row"><button type="button" class="mojo-fish-chat-trigger" aria-expanded="false" aria-controls="mojo-fish-thread-menu">Chat <svg class="mojo-fish-chat-caret" viewBox="0 0 12 12" aria-hidden="true"><path d="m2.5 4.5 3.5 3 3.5-3"/></svg></button><button type="button" class="mojo-dock-chat" aria-label="Dock chat to canvas">Dock ↗</button></div><div class="mojo-fish-thread-menu" id="mojo-fish-thread-menu" hidden><div class="mojo-fish-thread-menu-top"><strong>Chats</strong><button type="button" class="mojo-fish-new-thread" aria-label="New chat" title="New chat">+</button></div><label class="mojo-fish-thread-search"><span aria-hidden="true">⌕</span><input type="search" placeholder="Search chats…" aria-label="Search chats"></label><div class="mojo-fish-thread-list" role="list"></div><p class="mojo-fish-thread-empty" hidden>No matching chats</p></div>';
    const fishMenu = fishHead.querySelector('.mojo-fish-thread-menu');
    const fishTrigger = fishHead.querySelector('.mojo-fish-chat-trigger');
    const fishSearch = fishHead.querySelector('input[type="search"]');
    const fishList = fishHead.querySelector('.mojo-fish-thread-list');
    fishHead.querySelector('.mojo-dock-chat').addEventListener('click', () => dockChat());
    const closeFishMenu = () => { fishMenu.hidden = true; fishTrigger.setAttribute('aria-expanded','false'); };
    const renderFishThreads = () => {
      const query = fishSearch.value.trim().toLowerCase();
      const threads = window.MojoChatThreads.list().filter(item => `${item.title} ${(item.subjects || []).join(' ')}`.toLowerCase().includes(query));
      fishList.replaceChildren();
      threads.forEach(thread => {
        const button = make('button','mojo-fish-thread-item');
        button.type = 'button';
        button.dataset.threadId = thread.id;
        button.setAttribute('aria-current',thread.id === window.MojoChatThreads.active().id ? 'true' : 'false');
        button.append(make('span','',thread.title));
        fishList.append(button);
      });
      const empty = fishHead.querySelector('.mojo-fish-thread-empty');
      empty.hidden = threads.length > 0;
      empty.textContent = query ? 'No matching chats' : 'No chats yet';
    };
    fishTrigger.addEventListener('click', () => {
      fishMenu.hidden = !fishMenu.hidden;
      fishTrigger.setAttribute('aria-expanded',String(!fishMenu.hidden));
      if (!fishMenu.hidden) { renderFishThreads(); fishSearch.focus(); }
    });
    fishSearch.addEventListener('input',renderFishThreads);
    fishList.addEventListener('click',event => {
      const item = event.target.closest('[data-thread-id]');
      if (item && window.MojoChatThreads.select(item.dataset.threadId)) closeFishMenu();
    });
    fishHead.querySelector('.mojo-fish-new-thread').addEventListener('click', () => {
      window.MojoChatThreads.create(); closeFishMenu(); viewsView.querySelector('textarea').focus();
    });
    fishHead.addEventListener('keydown',event => { if(event.key === 'Escape') {closeFishMenu();fishTrigger.focus();} });
    document.addEventListener('pointerdown',event => { if (!fishHead.contains(event.target)) closeFishMenu(); });
    renderFishThreads();
    const form=viewsView.querySelector('form'), log=viewsView.querySelector('.mojo-fish-chat-log');
    const input=form.querySelector('textarea'), send=form.querySelector('button');
    const historyKey='mojo-shared-chat-history-v1';
    let history=window.MojoChatThreads.cleanMessages(window.MojoChatThreads.active().messages.slice());
    const renderHistory=()=>{
      log.replaceChildren();
      if(!history.length){
        const empty=make('div','mojo-fish-chat-empty');
        empty.append(make('strong','','What can I help with?'),make('p','','Ask about this page or a routine.'));
        log.append(empty);
      }
      history.forEach(item=>{
        const bubble=make('div',item.role==='user'?'mojo-fish-chat-user':'mojo-fish-chat-reply');
        bubble.setAttribute('aria-label',item.role==='user'?'You':'Mojo');
        bubble.append(make('p','',item.text));
        log.append(bubble);
      });
      log.scrollTop=log.scrollHeight;
    };
    const saveHistory=()=>{
      try{localStorage.setItem(historyKey,JSON.stringify(history.slice(-40)));}catch(_){}
      window.MojoChatThreads.saveMessages(history);
    };
    const appendHistory=(role,text)=>{
      history=[...history,{role,text}].slice(-40);
      saveHistory();renderHistory();
    };
    const mainMessage=node=>{
      if(node.matches('.chat-polish-user'))return {role:'user',text:node.textContent.replace(/^You\s*/,'').trim()};
      if(node.matches('.mc-chat-ack'))return {role:'mojo',text:node.querySelector('p')?.textContent.trim()||node.textContent.trim()};
      if(node.matches('.task-chat-message:not(.task-chat-example)'))return {role:node.classList.contains('task-chat-you')?'user':'mojo',text:node.querySelector('p')?.textContent.trim()||''};
      return null;
    };
    let switchingThread = false;
    const hydrateMain = () => {
      const body = document.querySelector('.chatpane .chatbody, .mc-trust-chat .chatbody');
      if (!body) return;
      switchingThread = true;
      body.querySelectorAll(':scope > .chat-polish-user, :scope > .mc-chat-ack, :scope > .bubble.chat-polish-assistant, :scope > .task-chat-message').forEach(node => node.remove());
      if (history.length) {
        history.forEach(item => {
          const bubble=make('div',item.role==='user'?'chat-polish-user mojo-shared-restored':'bubble mc-chat-ack mojo-shared-restored');
          bubble.append(make('p','',item.text));
          body.append(bubble);
        });
      } else {
        const intro=make('div','bubble chat-polish-assistant');
        intro.append(make('p','','What can I help with?'));
        body.prepend(intro);
      }
      body.scrollTop = body.scrollHeight;
      queueMicrotask(() => { switchingThread = false; });
    };
    document.addEventListener('mojo:chat-threads-changed',event => {
      renderFishThreads(); renderRecent();
      if (!['select','messages'].includes(event.detail?.type)) return;
      history = window.MojoChatThreads.cleanMessages(window.MojoChatThreads.active().messages.slice());
      if (event.detail?.type === 'select') {input.value = ''; updateSend();}
      renderHistory();
      if (event.detail?.type === 'select') hydrateMain();
    });
    const bindMain=()=>{
      const body=document.querySelector('.chatpane .chatbody, .mc-trust-chat .chatbody');
      if(!body)return false;
      const pane=body.closest('.chatpane, .mc-trust-chat');
      const head=pane?.querySelector('.chathead');
      if(head){
        head.replaceChildren(make('strong','chat-polish-head-title','Chat'));
      }
      const mainSend=pane?.querySelector('.chat-polish-send');
      if(mainSend&&!mainSend.querySelector('svg'))mainSend.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></svg>';
      const existing=[...body.children].some(node=>mainMessage(node));
      if(window.MojoChatThreads.demoResetActive){hydrateMain();window.MojoChatThreads.demoResetActive=false;}
      if(!existing&&history.length){
        body.querySelector(':scope > .bubble.chat-polish-assistant')?.remove();
        body.querySelector('.mc-chat-prompts')?.setAttribute('hidden','');
        history.forEach(item=>{
          const bubble=make('div',item.role==='user'?'chat-polish-user mojo-shared-restored':'bubble mc-chat-ack mojo-shared-restored');
          bubble.append(make('p','',item.text));
          body.append(bubble);
        });
      }else if(!existing&&!body.querySelector('.bubble')){
        const intro=make('div','bubble chat-polish-assistant');
        intro.append(make('p','','Ask about the campaign snapshot or an open decision.'));
        body.prepend(intro);
      }
      const sync=()=>{
        if (switchingThread) return;
        const messages=[...body.children].map(mainMessage).filter(item=>item?.text);
        if(!messages.length)return;
        history=window.MojoChatThreads.cleanMessages(messages).slice(-40);saveHistory();renderHistory();
      };
      new MutationObserver(sync).observe(body,{childList:true,subtree:true,characterData:true});
      sync();
      return true;
    };
    requestAnimationFrame(()=>{
      if(bindMain())return;
      const wait=new MutationObserver(()=>{if(bindMain())wait.disconnect();});
      wait.observe(document.body,{childList:true,subtree:true});
    });
    const updateSend=()=>{send.disabled=!input.value.trim();};
    input.addEventListener('input',updateSend);
    input.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.isComposing){event.preventDefault();form.requestSubmit();}});
    form.addEventListener('submit', event => {
      event.preventDefault();
      const prompt=input.value.trim();
      if (!prompt) return;
      const mainInput=document.querySelector('.chatpane .chatfoot textarea, .mc-trust-chat .chatfoot textarea');
      const mainSend=document.querySelector('.chatpane .chatfoot .chat-polish-send,.chatpane .chatfoot .task-chat-send,.mc-trust-chat .chatfoot .chat-polish-send');
      input.value='';updateSend();
      if(mainInput&&mainSend){
        mainInput.value=prompt;
        mainInput.dispatchEvent(new Event('input',{bubbles:true}));
        mainSend.click();
        return;
      }
      appendHistory('user',prompt);
      appendHistory('mojo','I can use the supplied Campaigns sample here, but I need connected data for a broader answer. This thread will be here when you return to the Campaigns workspace.');
      document.dispatchEvent(new CustomEvent('mojo:chat-sent',{detail:{prompt}}));
    });
    renderHistory();updateSend();
  };
  const recordPlace = () => {
    const place = currentPlace();
    if (safePlace(place)) {
      recentPlaces = [place, ...recentPlaces.filter(item => item.url !== place.url)].slice(0, 8);
      try { localStorage.setItem(recentKey, JSON.stringify(recentPlaces)); } catch (_) {}
      try {
        if (!window.name || window.name.startsWith(recentWindowPrefix)) {
          window.name = recentWindowPrefix + encodeURIComponent(JSON.stringify(recentPlaces));
        }
      } catch (_) {}
    }
    renderHere();
    renderRecent();
    renderViews();
  };
  recordPlace();
  window.addEventListener('hashchange', () => requestAnimationFrame(recordPlace));
  window.addEventListener('mojo-brief-focus-change', recordPlace);
  window.addEventListener('mojo:brief-view-change', recordPlace);
  document.querySelector('.clientsel select')?.addEventListener('change', recordPlace);
  document.getElementById('chatOn')?.addEventListener('change', renderHere);
  document.addEventListener('mojo:chat-sent', event => {
    const prompt = String(event.detail?.prompt || '').trim();
    if (!prompt || prompt.length > 300) return;
    recentQuestions = [{prompt, place:currentPlace()}, ...recentQuestions.filter(item => item.prompt !== prompt)].slice(0, 4);
    try { sessionStorage.setItem(recentQuestionsKey, JSON.stringify(recentQuestions)); } catch (_) {}
    renderHere();
    renderRecent();
  });
  viewsView.addEventListener('click', event => {
    if (event.target.closest('.mojo-save-view')) {
      const place = currentPlace();
      if (safePlace(place) && !savedViews.some(item => item.url === place.url)) {
        savedViews = [place, ...savedViews].slice(0, 12);
        saveViews();
        renderViews();
      }
    }
    const remove = event.target.closest('.mojo-remove-view');
    if (remove) {
      savedViews = savedViews.filter(item => item.url !== remove.dataset.url);
      saveViews();
      renderViews();
    }
  });
  const sizes = {'extra-small':[54,63,1.5], small:[72,84,2], medium:[108,126,3]};
  const colors = Object.fromEntries(companionColors.map(([id,,hex]) => [id,hex]));
  const preferences = {size:'extra-small',shape:'koi',color:'orange',customColor:'#F28C3F',glow:true,movement:true,quiet:false};
  try {
    const saved = JSON.parse(localStorage.getItem(preferencesKey) || 'null');
    if (saved) {
      if (saved.size in sizes) preferences.size = saved.size;
      if (companionChoices.some(([id]) => id === saved.shape)) preferences.shape = saved.shape;
      if (saved.color in colors || saved.color === 'custom') preferences.color = saved.color;
      if (/^#[0-9a-f]{6}$/i.test(saved.customColor || '')) preferences.customColor = saved.customColor;
      if (typeof saved.glow === 'boolean') preferences.glow = saved.glow;
      if (typeof saved.movement === 'boolean') preferences.movement = saved.movement;
      if (typeof saved.quiet === 'boolean') preferences.quiet = saved.quiet;
    }
  } catch (_) {}
  let fishController;
  let pickerControllers = [];
  const stopPickerAnimation = () => {
    pickerControllers.forEach(controller => controller.stop());
    pickerControllers = [];
  };
  const currentColor = () => preferences.color === 'custom' ? preferences.customColor : colors[preferences.color];
  const syncPreferences = () => {
    stopPickerAnimation();
    const [normalWidth,normalHeight,scale] = sizes[preferences.size];
    const [width,height] = preferences.quiet ? [40,40] : [normalWidth,normalHeight];
    companion.style.width = `${width}px`;
    companion.style.height = `${height}px`;
    fish.style.width = `${width}px`;
    fish.style.height = `${height}px`;
    fishArt.style.width = `${width}px`;
    fishArt.style.height = `${height}px`;
    companion.dataset.movement = preferences.movement ? 'on' : 'off';
    companion.dataset.shape = preferences.shape;
    companion.dataset.glow = preferences.glow ? 'on' : 'off';
    companion.dataset.quiet = preferences.quiet ? 'on' : 'off';
    fishController?.stop();
    fishController = preferences.quiet ? null : window.MojoCompanions?.mount(fishArt, {
      name:preferences.shape, color:currentColor(), state:'idle', scale,
      glow:preferences.glow, animate:preferences.movement, bounds:'full'
    });
    companion.querySelectorAll('[data-shape]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.shape === preferences.shape));
      const picker = button.querySelector('.mojo-companion-picker');
      const options = {name:button.dataset.shape, color:currentColor(), state:'idle', scale:1.5,
        glow:preferences.glow, bounds:'compact', blink:false};
      if (!customize.hidden && preferences.movement && ['cat', 'dog', 'turtle', 'blob'].includes(button.dataset.shape)) {
        const controller = window.MojoCompanions?.mount(picker, options);
        if (controller) pickerControllers.push(controller);
      } else {
        picker.innerHTML = window.MojoCompanions?.render(button.dataset.shape, options) || '';
      }
    });
    companion.querySelectorAll('[data-size]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.size === preferences.size)));
    companion.querySelectorAll('[data-color]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.color === preferences.color)));
    customColorInput.value = preferences.customColor;
    customColorInput.parentElement.classList.toggle('selected', preferences.color === 'custom');
    [[glowToggle, preferences.glow], [movementToggle, preferences.movement], [quietToggle, preferences.quiet]].forEach(([toggle, on]) => {
      toggle.setAttribute('aria-checked', String(on));
      toggle.querySelector('.mojo-switch-state').textContent = on ? 'On' : 'Off';
    });
    fish.setAttribute('aria-label', preferences.quiet ? 'Open Mojo companion, quiet mode' : `Open Mojo companion. ${companionChoices.find(([id]) => id === preferences.shape)?.[1] || 'Companion'} selected.`);
  };
  const clampPosition = () => {
    if (!companion.style.left || !companion.style.top) return;
    const left = Math.min(Math.max(8, Number.parseFloat(companion.style.left)), Math.max(8, innerWidth - companion.offsetWidth - 8));
    const top = Math.min(Math.max(8, Number.parseFloat(companion.style.top)), Math.max(8, innerHeight - companion.offsetHeight - 8));
    companion.style.left = `${left}px`;
    companion.style.top = `${top}px`;
  };
  syncPreferences();
  try {
    const saved = JSON.parse(localStorage.getItem(positionKey) || 'null');
    if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)) {
      companion.style.left = `${saved.x}px`;
      companion.style.top = `${saved.y}px`;
      companion.style.right = 'auto';
      companion.style.bottom = 'auto';
      clampPosition();
    }
  } catch (_) {}
  const savePreferences = () => {
    syncPreferences();
    clampPosition();
    placePanel();
    try { localStorage.setItem(preferencesKey, JSON.stringify(preferences)); } catch (_) {}
  };
  const placePanel = () => {
    const rect = companion.getBoundingClientRect();
    const onLeft = rect.left < innerWidth / 2;
    const onTop = rect.top < innerHeight / 2;
    const gap = rect.height + 9;
    panel.style.left = onLeft ? '0' : 'auto';
    panel.style.right = onLeft ? 'auto' : '0';
    panel.style.top = onTop ? `${gap}px` : 'auto';
    panel.style.bottom = onTop ? 'auto' : `${gap}px`;
  };
  const closePanel = () => {
    panel.hidden = true;
    panel.style.display = 'none';
    customize.hidden = true;
    stopPickerAnimation();
    customizeToggle.setAttribute('aria-expanded', 'false');
    fish.setAttribute('aria-expanded', 'false');
    fish.focus();
  };
  fish.addEventListener('click', () => {
    placePanel();
    const opening = panel.hidden;
    if (opening) {
      const dock = document.getElementById('chatOn');
      if (dock?.checked) {dock.checked = false; dock.dispatchEvent(new Event('change',{bubbles:true}));}
      const trustToggle = document.getElementById('mc-trust-chat-toggle');
      if (trustToggle?.getAttribute('aria-expanded') === 'true') trustToggle.click();
      const displayed = renderHere();
      if (displayed) saveSeen(displayed.id);
      companion.classList.remove('mojo-new-finding');
    }
    panel.hidden = !opening;
    panel.style.display = opening ? 'flex' : 'none';
    fish.setAttribute('aria-expanded', String(!panel.hidden));
  });
  const openFloatingChat = (prompt = '', reset = false) => {
    if (reset) window.MojoChatThreads?.create();
    if (panel.hidden) fish.click();
    companion.querySelector('[data-panel="views"]')?.click();
    const input = viewsView.querySelector('.mojo-fish-chat-form textarea');
    if (input) { if (prompt) input.value = prompt; input.focus(); }
  };
  window.MojoOpenFloatingChat = openFloatingChat;
  document.querySelector('.paneToggles label[for="chatOn"]')?.addEventListener('click', event => {
    event.preventDefault();
    const dock = document.getElementById('chatOn');
    if (dock?.checked) {
      dock.checked = false;
      dock.dispatchEvent(new Event('change', {bubbles:true}));
      document.body.classList.remove('mojo-chat-full');
    } else {
      window.MojoOpenChat?.('', false);
    }
  });
  let viewportRefresh = 0;
  window.addEventListener('scroll', event => {
    if (companion.contains(event.target)) return;
    if (panel.hidden || viewportRefresh) return;
    viewportRefresh = requestAnimationFrame(() => { viewportRefresh = 0; renderHere(); });
  }, {passive:true, capture:true});
  document.addEventListener('change', event => {
    if (!panel.hidden && event.target?.matches?.('#f-needs,#f-cando,#f-watching,#f-done')) renderHere();
  });
  document.addEventListener('mojo:campaign-queue-changed', () => { if (!panel.hidden) renderHere(); });
  document.getElementById('chatOn')?.addEventListener('change', event => {if (event.target.checked && !panel.hidden) closePanel();});
  document.getElementById('mc-trust-chat-toggle')?.addEventListener('click', () => {if (document.getElementById('mc-trust-chat-toggle')?.getAttribute('aria-expanded') === 'true' && !panel.hidden) closePanel();});
  fishArt.addEventListener('animationend', () => companion.classList.remove('mojo-new-finding'));
  fishArt.addEventListener('animationend', () => companion.classList.remove('mojo-completed-work'));
  window.addEventListener('mojo:work-completed', () => {
    if (!preferences.movement || preferences.quiet || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    companion.classList.remove('mojo-completed-work'); void fishArt.offsetWidth;
    companion.classList.add('mojo-completed-work');
  });
  window.addEventListener('mojo:finding-needs-you', event => {
    const item = event.detail;
    if (!item || typeof item.id !== 'string' || !/^[a-z0-9-]{1,80}$/.test(item.id)
      || typeof item.title !== 'string' || item.title.length > 160
      || typeof item.href !== 'string' || !/^(HomeSystem|Performance|Activity|Tasks|Campaign|Strategy)\.html(?:#[^<>"\s]*)?$/.test(item.href)) return;
    if (!findings.some(finding => finding.id === item.id)) findings.unshift({id:item.id, title:item.title, href:item.href, note:'Open full context →', eyebrow:'NEEDS YOU · NEW'});
    const finding = findings.find(entry => entry.id === item.id);
    if (findingVisible(finding) || !panel.hidden) {
      saveSeen(item.id);
      renderHere();
      return;
    }
    if (seenFindings.includes(item.id)) return;
    if (preferences.movement && !preferences.quiet && !document.querySelector('.task-approval-dialog[open]') && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      companion.classList.remove('mojo-new-finding');
      void fishArt.offsetWidth;
      companion.classList.add('mojo-new-finding');
    }
    renderHere();
  });
  const decisionDialog = document.querySelector('.task-approval-dialog');
  if (decisionDialog) {
    const syncDecision = () => {
      companion.dataset.decision = decisionDialog.open ? 'on' : 'off';
      if (decisionDialog.open) {
        panel.hidden = true;
        panel.style.display = 'none';
        fish.setAttribute('aria-expanded', 'false');
        companion.classList.remove('mojo-new-finding');
      }
    };
    new MutationObserver(syncDecision).observe(decisionDialog, {attributes:true, attributeFilter:['open']});
    decisionDialog.addEventListener('close', syncDecision);
    syncDecision();
  }
  customizeToggle.addEventListener('click', () => {
    customize.hidden = !customize.hidden;
    syncPreferences();
    customizeToggle.setAttribute('aria-expanded', String(!customize.hidden));
    placePanel();
  });
  customize.addEventListener('click', event => {
    const size = event.target.closest('[data-size]');
    const shape = event.target.closest('[data-shape]');
    const color = event.target.closest('[data-color]');
    if (size) preferences.size = size.dataset.size;
    if (shape) preferences.shape = shape.dataset.shape;
    if (color) preferences.color = color.dataset.color;
    const setting = event.target.closest('.mojo-setting-switch');
    if (setting === glowToggle) preferences.glow = !preferences.glow;
    if (setting === movementToggle) preferences.movement = !preferences.movement;
    if (setting === quietToggle) preferences.quiet = !preferences.quiet;
    if (size || shape || color || setting) savePreferences();
  });
  customColorInput.addEventListener('input', event => {
    preferences.customColor = event.target.value;
    preferences.color = 'custom';
    savePreferences();
  });
  const panelScrollPositions = {here:0, recent:0, views:0};
  companion.querySelectorAll('.mojo-companion-tabs button').forEach(tab => tab.addEventListener('click', () => {
    const key = tab.dataset.panel;
    const previous = companion.querySelector('.mojo-companion-tabs button[aria-selected="true"]')?.dataset.panel;
    if (previous) panelScrollPositions[previous] = panelBody.scrollTop;
    companion.querySelectorAll('.mojo-companion-tabs button').forEach(button => {
      button.setAttribute('aria-selected', String(button === tab));
      button.tabIndex = button === tab ? 0 : -1;
    });
    companion.querySelectorAll('.mojo-panel-view').forEach(view => { view.hidden = view.dataset.panelView !== key; });
    panelBody.scrollTop = panelScrollPositions[key];
  }));
  companion.querySelector('.mojo-companion-tabs').addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const tabs = [...companion.querySelectorAll('.mojo-companion-tabs button')];
    const index = tabs.indexOf(document.activeElement);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    tabs[next].click();
    tabs[next].focus();
  });
  companion.addEventListener('click', event => {
    const recentThread = event.target.closest('.mojo-recent-thread');
    if (recentThread && window.MojoChatThreads.select(recentThread.dataset.threadId)) {companion.querySelector('[data-panel="views"]')?.click();return;}
    if (event.target.closest('.mojo-resume-chat')) {
      closePanel();
      document.querySelector('.chatpane textarea')?.focus();
      return;
    }
    if (event.target.closest('.mojo-open-chat')) { openFloatingChat(); return; }
    const askAgain = event.target.closest('.mojo-ask-again');
    if (askAgain) {
      companion.querySelector('[data-panel="views"]')?.click();
      const input=viewsView.querySelector('.mojo-fish-chat-form textarea');
      if(input){input.value=askAgain.dataset.prompt || '';input.focus();}
      return;
    }
    const briefLink = event.target.closest('a[href^="HomeSystem.html#brief-"]');
    if (briefLink && currentFile() === 'HomeSystem.html' && typeof window.mojoBriefSetView === 'function') {
      event.preventDefault();
      const view = briefLink.getAttribute('href').slice('HomeSystem.html#brief-'.length);
      window.mojoBriefSetView(view, true);
      closePanel();
    }
  });
  const dockChat = (prompt = '') => {
    closePanel();
    if (window.MojoOpenChat) {window.MojoOpenChat(prompt);return;}
    const chat = document.getElementById('chatOn');
    if (chat) {
      chat.checked = true;
      chat.dispatchEvent(new Event('change', {bubbles:true}));
    }
    else if (document.getElementById('mc-trust-chat-toggle')?.getAttribute('aria-expanded') !== 'true') document.getElementById('mc-trust-chat-toggle')?.click();
    const composer = document.querySelector('.chatpane textarea');
    if (composer) {
      if (prompt) {
        composer.value = prompt;
        composer.dispatchEvent(new Event('input', {bubbles:true}));
      }
    }
    composer?.focus();
  };
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !panel.hidden) closePanel(); });

  // Dragging moves the launcher and panel together; simple clicks still open it.
  let drag = null;
  fish.addEventListener('pointerdown', event => {
    drag = {x:event.clientX, y:event.clientY, left:companion.getBoundingClientRect().left, top:companion.getBoundingClientRect().top, moved:false};
    fish.setPointerCapture(event.pointerId);
  });
  fish.addEventListener('pointermove', event => {
    if (!drag) return;
    const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
    if (Math.abs(dx) + Math.abs(dy) < 5 && !drag.moved) return;
    drag.moved = true;
    companion.style.left = `${Math.min(Math.max(8, drag.left + dx), innerWidth - companion.offsetWidth - 8)}px`;
    companion.style.top = `${Math.min(Math.max(8, drag.top + dy), innerHeight - companion.offsetHeight - 8)}px`;
    companion.style.right = 'auto';
    companion.style.bottom = 'auto';
    placePanel();
  });
  fish.addEventListener('pointerup', () => {
    if (drag?.moved) fish.addEventListener('click', event => event.stopImmediatePropagation(), {once:true, capture:true});
    if (drag?.moved) {
      try { localStorage.setItem(positionKey, JSON.stringify({x:companion.offsetLeft,y:companion.offsetTop})); } catch (_) {}
    }
    drag = null;
  });
  window.addEventListener('resize', () => { clampPosition(); placePanel(); });
});
