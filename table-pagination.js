/* Small, consistent pagination for every data table in the prototype. */
(() => {
  const pageSize = 10;

  function paginate(root = document) {
    root.querySelectorAll('table').forEach(table => {
      if (table.closest('.chatpane, .mc-trust-chat, .mojo-fish-chat')) {
        table._mojoPager?.remove();
        [...(table.tBodies[0]?.rows || [])].forEach(row => { row.hidden = false; });
        table.dataset.paginationManaged = 'true';
        return;
      }
      if (table.dataset.paginationManaged || table.matches('.aq-table')) return;
      const body = table.tBodies[0];
      if (!body) return;
      const rows = [...body.rows];
      if (!rows.length) return;
      if (table._mojoRows?.length === rows.length && rows.every((row, index) => row === table._mojoRows[index])) return;
      table._mojoPager?.remove();

      table.dataset.paginationReady = 'true';
      table._mojoRows = rows;
      table.classList.add('mojo-paginated-table');
      const pageCount = Math.ceil(rows.length / pageSize);
      let page = 1;
      const pager = document.createElement('nav');
      table._mojoPager = pager;
      pager.className = 'mojo-table-pager';
      pager.setAttribute('aria-label', `${table.closest('section, details')?.querySelector('h2, h3, summary')?.textContent?.trim() || 'Table'} pages`);
      const summary = document.createElement('span');
      summary.className = 'mojo-table-pager-summary';
      summary.setAttribute('aria-live', 'polite');
      const controls = document.createElement('div');
      controls.className = 'mojo-table-pager-controls';
      const previous = document.createElement('button');
      const next = document.createElement('button');
      previous.type = next.type = 'button';
      previous.textContent = 'Previous';
      next.textContent = 'Next';
      controls.append(previous, next);
      pager.append(summary, controls);
      const container = table.closest('.wrap2, .evidbox') || table;
      container.after(pager);

      function render() {
        const start = (page - 1) * pageSize;
        rows.forEach((row, index) => { row.hidden = index < start || index >= start + pageSize; });
        summary.textContent = `Rows per page ${pageSize} · Page ${page} of ${pageCount} · ${start + 1}–${Math.min(start + pageSize, rows.length)} of ${rows.length}`;
        previous.disabled = page === 1;
        next.disabled = page === pageCount;
      }
      previous.addEventListener('click', () => { if (page > 1) { page--; render(); } });
      next.addEventListener('click', () => { if (page < pageCount) { page++; render(); } });
      render();
    });
  }

  window.mojoPaginateTables = paginate;
  document.addEventListener('DOMContentLoaded', () => {
    paginate();
    let pending = false;
    new MutationObserver(() => {
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => { pending = false; paginate(); });
    }).observe(document.body, {childList:true, subtree:true});
  });
})();
