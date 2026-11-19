/* A local send interaction for the shared chat shell. Tasks owns its guided chat. */
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.chatpane, .chatpanel').forEach(pane => {
    const body = pane.querySelector('.chatbody');
    const composer = pane.querySelector('.chatfoot .composer');
    const textarea = composer?.querySelector('textarea');
    if (!body || !composer || !textarea || composer.querySelector('.task-chat-send, .chat-polish-send')) return;

    const head = pane.querySelector('.chathead');
    if (head && !head.querySelector('.chat-polish-head-title')) {
      head.replaceChildren();
      const title = document.createElement('strong');
      title.className = 'chat-polish-head-title';
      title.textContent = 'Chat';
      head.append(title);
    }
    const intro = body.querySelector(':scope > .bubble');
    if (intro && /\/(HomeSystem|CampaignLifecycle|Portfolio|Strategy|BestPractices)(?:\.html)?$/.test(location.pathname)) intro.remove();
    else if (intro) {
      const main = document.querySelector('main.canvaspane');
      const copy = main?.classList.contains('mf-strategy-page') || location.pathname.includes('Strategy')
        ? 'Ask about spend, pacing, or the evidence behind the leadership summary.'
        : location.pathname.includes('BestPractices')
          ? 'Ask about a practice or where its recommendation came from.'
          : 'Ask about the campaign snapshot or an open decision.';
      intro.classList.add('chat-polish-assistant');
      intro.replaceChildren();
      const text = document.createElement('p');
      text.textContent = copy;
      intro.append(text);
    }
    body.setAttribute('role', 'log');
    body.setAttribute('aria-label', 'Conversation with Mojo');
    body.setAttribute('aria-live', 'polite');

    const send = document.createElement('button');
    send.type = 'button';
    send.className = 'chat-polish-send';
    send.setAttribute('aria-label', 'Send message');
    send.setAttribute('title', 'Send message');
    send.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></svg>';
    const tools = document.createElement('div');
    tools.className = 'mc-chat-composer-tools';
    tools.setAttribute('aria-label', 'Chat settings');
    tools.innerHTML = '<span>Balanced <span aria-hidden="true">⌄</span></span><span>♢ Guarded <span aria-hidden="true">⌄</span></span><span aria-hidden="true">＋</span>';
    composer.append(tools, send);

    const update = () => { send.disabled = !textarea.value.trim(); };
    const submit = () => {
      const value = textarea.value.trim();
      if (!value) return;
      const message = document.createElement('div');
      message.className = 'chat-polish-user';
      message.append(document.createTextNode(value));
      body.append(message);
      document.dispatchEvent(new CustomEvent('mojo:chat-sent', {detail:{prompt:value}}));
      textarea.value = '';
      update();
      body.scrollTop = body.scrollHeight;
      textarea.focus();
    };
    send.addEventListener('click', submit);
    textarea.addEventListener('input', update);
    textarea.addEventListener('keydown', event => {
      if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
        event.preventDefault();
        submit();
      }
    });
    update();
  });
});
