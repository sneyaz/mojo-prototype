/* Light deterrent only: stops casual stumbling onto the public GitHub Pages link, not a real access control. */
(() => {
  const KEY = 'mojo-proto-unlocked-v1';
  const PASSWORD = 'koifish';
  let unlocked = false;
  try { unlocked = localStorage.getItem(KEY) === 'true'; } catch {}
  if (unlocked) {
    document.documentElement.classList.add('mojo-unlocked');
    return;
  }
  const gateHtml = `<div id="mojo-password-gate"><div class="mpg-card"><h1>Mojo Prototype</h1><p>This is an internal design prototype. Enter the password to continue.</p><form id="mpg-form"><input type="password" id="mpg-input" autocomplete="off" placeholder="Password" aria-label="Password"><button type="submit">Enter</button><p class="mpg-error" id="mpg-error" hidden>Incorrect password.</p></form></div></div>`;
  const wireUp = overlay => {
    overlay.querySelector('#mpg-input').focus();
    overlay.querySelector('#mpg-form').addEventListener('submit', event => {
      event.preventDefault();
      const value = overlay.querySelector('#mpg-input').value;
      if (value === PASSWORD) {
        try { localStorage.setItem(KEY, 'true'); } catch {}
        document.documentElement.classList.add('mojo-unlocked');
        overlay.remove();
      } else {
        overlay.querySelector('#mpg-error').hidden = false;
        overlay.querySelector('#mpg-input').value = '';
        overlay.querySelector('#mpg-input').focus();
      }
    });
  };
  // Write the gate into the stream immediately (while this blocking script is still
  // parsing, before the rest of the page's markup), so it's the first thing painted
  // instead of waiting for the whole document to finish loading.
  if (document.readyState === 'loading') {
    document.write(gateHtml);
    wireUp(document.getElementById('mojo-password-gate'));
  } else {
    const overlay = document.createElement('div');
    overlay.id = 'mojo-password-gate';
    overlay.innerHTML = gateHtml;
    document.body.append(overlay.firstElementChild);
    wireUp(document.getElementById('mojo-password-gate'));
  }
})();
