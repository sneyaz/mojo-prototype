/* Arrange the supplied task content into predictable rows without editing it. */
document.addEventListener('DOMContentLoaded', () => {
  const main = document.querySelector('main.canvaspane');
  if (!main) return;
  const panels = Array.from(main.querySelectorAll(':scope > section.panel'));
  const answerPanel = panels.find(panel => panel.querySelector('h2')?.textContent.trim() === 'Needs your answer');
  const decisionPanel = panels.find(panel => panel.querySelector('h2')?.textContent.trim() === 'Needs your decision');
  if (!answerPanel || !decisionPanel) return;

  const children = Array.from(answerPanel.children);
  const questions = children.filter(child => child.tagName === 'H3');
  questions.forEach((heading, index) => {
    const start = children.indexOf(heading);
    const end = index + 1 < questions.length ? children.indexOf(questions[index + 1]) : children.length;
    const parts = children.slice(start, end);
    const action = parts.find(part => part.matches('button, a.btn'));
    if (!action) return;

    const row = document.createElement('div');
    row.className = 'task-list-row';
    const copy = document.createElement('div');
    copy.className = 'task-list-copy';
    const actionSlot = document.createElement('div');
    actionSlot.className = 'task-list-action';
    answerPanel.insertBefore(row, heading);
    row.append(copy, actionSlot);
    parts.forEach(part => (part === action ? actionSlot : copy).append(part));
  });

  const decisionRows = decisionPanel.querySelectorAll(':scope > .row');
  const evidence = decisionPanel.querySelector(':scope > details.evid');
  if (decisionRows.length >= 3 && evidence) {
    decisionRows[2].querySelector(':scope > div:first-child')?.append(evidence);
  }
  main.classList.add('task-list-enhanced');
});
