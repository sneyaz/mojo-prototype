/* A local, interactive example of answering a task in the existing left chat pane. */
document.addEventListener('DOMContentLoaded', () => {
  const main = document.querySelector('main.canvaspane');
  const answerPanel = [...(main?.querySelectorAll('section.panel') || [])]
    .find(panel => panel.querySelector('h2')?.textContent.trim() === 'Needs your answer');
  const action = [...(answerPanel?.querySelectorAll('button') || [])]
    .find(button => button.textContent.trim() === 'Answer 3 questions');
  const toggle = document.getElementById('chatOn');
  const pane = document.querySelector('.chatpane');
  const body = pane?.querySelector('.chatbody');
  const head = pane?.querySelector('.chathead');
  const foot = pane?.querySelector('.chatfoot');
  const textarea = foot?.querySelector('textarea');
  if (!action || !toggle || !pane || !body || !head || !foot || !textarea) return;

  const questions = [
    {prompt:'What should count as a lead for the $9 goal?', choices:['CRM-qualified form submission','Any form submission','I’m not sure yet']},
    {prompt:'Which system should be the source of truth?', choices:['CRM','GA4','Ad platform']},
    {prompt:'Should the $9 target apply to qualified leads or all conversions?', choices:['Qualified leads','All conversions','Needs review']}
  ];
  let active = false;
  let step = 0;
  const answers = [];
  const make = (tag, className, textContent) => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (textContent !== undefined) el.textContent = textContent;
    return el;
  };
  const scrollEnd = () => { body.scrollTop = body.scrollHeight; };
  const message = (speaker, content, className = '') => {
    const bubble = make('div', `task-chat-message task-chat-${speaker} ${className}`.trim());
    bubble.append(make('span', 'task-chat-speaker', speaker === 'mojo' ? 'Mojo' : 'You'), make('p', '', content));
    body.append(bubble);
    scrollEnd();
    return bubble;
  };
  head.replaceChildren(make('span', 'task-chat-title', 'Chat'));
  body.setAttribute('role', 'log');
  body.setAttribute('aria-label', 'Conversation with Mojo');
  body.setAttribute('aria-live', 'polite');

  const composer = foot.querySelector('.composer');
  const composerMeta = make('div', 'task-chat-composer-meta');
  composerMeta.append(make('span', '', 'Type @ to invite teammates'));
  const composerTools = make('div', 'task-chat-composer-tools');
  composerTools.append(make('span', '', 'Balanced ⌄'), make('span', '', 'Guarded ⌄'), make('span', '', '+'));
  composerMeta.append(composerTools);
  composer.append(composerMeta);
  const send = make('button', 'task-chat-send', '↑');
  send.type = 'button';
  send.setAttribute('aria-label', 'Send message');
  composer.append(send);
  textarea.placeholder = 'Message Mojo…';
  textarea.rows = 3;
  const evidence = answerPanel.querySelector('details.evid');

  const removeChoices = () => body.querySelectorAll('.task-chat-replies').forEach(row => row.remove());
  const ask = () => {
    if (step >= questions.length) return;
    const question = questions[step];
    const bubble = message('mojo', question.prompt);
    bubble.prepend(make('small', 'task-chat-progress', `QUESTION ${step + 1} OF ${questions.length}`));
    const replies = make('div', 'task-chat-replies');
    replies.setAttribute('role', 'group');
    replies.setAttribute('aria-label', `Suggested answers to question ${step + 1}`);
    question.choices.forEach(choice => {
      const button = make('button', '', choice);
      button.type = 'button';
      button.addEventListener('click', () => submit(choice));
      replies.append(button);
    });
    body.append(replies);
    scrollEnd();
  };
  const finish = () => {
    message('mojo', 'Here’s the draft definition from your answers. Nothing has changed in reporting yet.');
    const summary = make('div', 'task-chat-summary');
    summary.append(make('strong', '', 'Draft measurement definition'));
    [['Lead event', answers[0]], ['Source of truth', answers[1]], ['$9 target', answers[2]]].forEach(([label, value]) => {
      const row = make('div', 'task-chat-summary-row');
      row.append(make('span', '', label), make('b', '', value));
      summary.append(row);
    });
    const evidenceButton = make('button', 'task-chat-evidence', 'Review the task evidence →');
    evidenceButton.type = 'button';
    evidenceButton.addEventListener('click', () => {
      if (evidence) { evidence.open = true; evidence.scrollIntoView({behavior:'smooth', block:'center'}); }
    });
    summary.append(evidenceButton);
    const restart = make('button', 'task-chat-restart', 'Start this example again');
    restart.type = 'button';
    restart.addEventListener('click', () => { active = false; action.click(); });
    summary.append(restart);
    body.append(summary);
    scrollEnd();
  };
  const submit = raw => {
    const value = raw.trim();
    if (!value) return;
    removeChoices();
    message('you', value);
    document.dispatchEvent(new CustomEvent('mojo:chat-sent', {detail:{prompt:value}}));
    textarea.value = '';
    if (!active) {
      message('mojo', 'I can walk through the measurement question with you. Select “Answer 3 questions” in the task list to start.');
      return;
    }
    if (step < questions.length) {
      answers.push(value);
      step++;
      if (step < questions.length) ask(); else finish();
    } else {
      message('mojo', 'This draft is ready to review against the task evidence. No campaign settings have changed.');
    }
    textarea.focus();
  };
  send.addEventListener('click', () => submit(textarea.value));
  textarea.addEventListener('keydown', event => {
    if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); submit(textarea.value); }
  });
  action.type = 'button';
  action.addEventListener('click', () => {
    toggle.checked = true;
    if (!active) {
      active = true;
      step = 0;
      answers.length = 0;
      body.replaceChildren();
      const context = make('div', 'task-chat-context');
      context.append(make('strong', '', 'Measurement'), make('span', '', 'Working through the $9 lead goal · draft only'));
      body.append(context);
      const sample = message('you', 'Can you help me define what counts toward the $9 goal?', 'task-chat-example');
      sample.querySelector('.task-chat-speaker').textContent = 'You · example';
      message('mojo', 'The task evidence shows 16 platform conversions in seven days, but “leads” has no number attached.\n\nLet’s define the event first, then choose which source should count it. I’ll prepare a draft for your review.');
      ask();
    }
    textarea.focus();
    scrollEnd();
  });
});
