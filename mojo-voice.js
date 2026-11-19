/* Vary low-stakes completion copy; every version states the demo boundary. */
(() => {
  const memory = {};
  const lines = {
    bulk: [
      ({count}) => `${count} drafts are lined up for review. Nothing went live.`,
      ({count}) => `One brief, ${count} tidy drafts. They are saved here; ad accounts are untouched.`,
      ({count}) => `${count} campaign drafts are ready when you are. No platform campaign was created.`,
      ({count}) => `The ${count} drafts are in order. Review them here before anything goes live.`
    ],
    draft: [
      () => 'This draft is saved. The other drafts are exactly where you left them.',
      () => 'A cleaner draft is ready. No live campaign changed.',
      () => 'Saved here for review. The rest of the batch is untouched.',
      () => 'This one is updated. The other drafts still match the brief.'
    ],
    creative: [
      ({name}) => `New copy for ${name} is ready to review. The live ad is unchanged.`,
      ({name}) => `${name} has a fresh draft waiting. Nothing was published.`,
      ({name}) => `A new take on ${name} is queued here. The current ad keeps running.`,
      ({name}) => `Copy for ${name} is in place for review. No platform change was sent.`
    ],
    handoff: [
      ({action,name}) => `${action} for ${name} is ready for review. Nothing was sent.`,
      ({action,name}) => `${name} is queued for “${action}.” Slack and CRM are unchanged.`,
      ({action,name}) => `The ${name} handoff is prepared. No external message or task was created.`,
      ({action,name}) => `${action} is staged for ${name}. It stays in this browser for now.`
    ]
  };
  window.MojoVoice = {say(action, context = {}) {
    const variants = lines[action];
    if (!variants) return '';
    const key = `mojo-voice-${action}`;
    let index = memory[key] || 0;
    try { index = Number(sessionStorage.getItem(key) || 0); sessionStorage.setItem(key, String(index + 1)); }
    catch { memory[key] = index + 1; }
    return variants[index % variants.length](context);
  }};
})();
