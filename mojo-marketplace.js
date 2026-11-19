document.addEventListener('DOMContentLoaded', () => {
  if (document.body.classList.contains('mojo-global-page')) {
    const title = document.querySelector('.topbar .wtitle');
    if (title) title.textContent = 'Mojo';
  }
  const page = document.querySelector('.mojo-marketplace-page');
  if (!page) return;
  const input = page.querySelector('#mm-search');
  if (!input) return;
  const cards = [...page.querySelectorAll('.mm-card')];
  const buttons = [...page.querySelectorAll('[data-mm-filter]')];
  const empty = page.querySelector('.mm-empty');
  let filter = 'all';
  const update = () => {
    const query = input.value.trim().toLocaleLowerCase();
    let visible = 0;
    for (const card of cards) {
      const stateMatches = filter === 'all' || card.dataset.mmState === filter;
      const searchMatches = !query || card.dataset.mmSearch.includes(query) || card.querySelector('h3').textContent.toLocaleLowerCase().includes(query);
      card.hidden = !(stateMatches && searchMatches);
      if (!card.hidden) visible++;
    }
    empty.hidden = visible > 0;
  };
  input.addEventListener('input', update);
  buttons.forEach(button => button.addEventListener('click', () => {
    filter = button.dataset.mmFilter;
    buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    update();
  }));
  update();
});
