/*
 * Mojo — first campaign launch celebration.
 *
 * A short pixel-art performance by the companion (about 7 seconds):
 *   1. Notice   – the fish perks up with a pixel "!" and grows a little (4/3 size).
 *   2. Dart     – it turns (sprite-style squash turn) and swims a curved path to the
 *                 published campaign card, leaving a bubble trail.
 *   3. Boop     – nose-bumps the card: the card pops, "Oh! Our first campaign is live."
 *      Shimmer  – koi-scale shimmer: an orange/white band sweeps across its body
 *                 twice while orange-and-white koi glints twinkle around it.
 *   4. Backflip – a leap with a full flip; it shimmers again at the top: "We did it."
 *   5. Face you – squash-turns to a real front-facing koi frame, flaps its fins,
 *                 happy ^^ eyes, a little heart: "I'll keep watch from here."
 *   6. Home     – turns back, swims home, shrinks back to normal size and settles, then hands
 *                 back to the normal idle companion.
 *
 * Any click or Escape skips the show: the fish swims straight home.
 * Reduced motion, Movement off and Quiet mode get a still version (no travel).
 *
 * API
 *   MojoLaunchCelebration.play({ card, lines }) -> Promise
 *     card   element to swim to and pop (optional; without one the fish celebrates in place)
 *     lines  three strings (optional)
 *     color  hex override (optional; defaults to the saved companion color)
 *     ignoreSkip  CSS selector; clicks inside it don't skip the show (optional)
 *   MojoLaunchCelebration.isPlaying()
 *
 * Needs mojo-companions.js (window.MojoCompanions) and the .mojo-companion markup.
 * The once-per-browser gate stays with the caller (mojo-demo-sequence.js).
 */
(() => {
  'use strict';
  if (window.MojoLaunchCelebration) return;

  const PREFS_KEY = 'mojo-brief-companion-preferences-v1';
  const LINES = ['Oh! Our first campaign is live.', 'We did it.', 'I’ll keep watch from here.'];
  const SKIP = Symbol('skip');
  const C = { purple: '#7653C0', lavender: '#B08FE0', bubble: '#9C84C9', pink: '#E8708F', pinkLight: '#F7B9C8' };
  const MC = () => window.MojoCompanions;

  // ---------- Pixel art (same 24x24 grid and palette letters as mojo-companions.js) ----------
  // o outline · b body · l light · s shade · w white · v pale · k eye · p cheek
  const KOI_FRONT = [
    '........................',
    '........................',
    '...........oo...........',
    '..........ollo..........',
    '.........ollllo.........',
    '.......oooooooooo.......',
    '.....oobbbllllbbboo.....',
    '....obbbbbllllbbbbbo....',
    '...obbbbbbbbbbbbbbbbo...',
    '..obbbbbbbbbbbbbbbbbbo..',
    '..obbwkkbbbbbbbbwkkbbo..',
    '..obbkkkbbbbbbbbkkkbbo..',
    '..obbkkkbbbbbbbbkkkbbo..',
    '..obbpppbwwwwwwbpppbbo..',
    '..obbbbwwwkwwkwwwbbbbo..',
    '...obbwwwwwkkwwwwwbbo...',
    '....obvwwwwwwwwwwvbo....',
    '.....oovvwwwwwwvvoo.....',
    '.......oovvvvvvoo.......',
    '.........oooooo.........',
    '........................',
    '........................',
    '........................',
    '........................'
  ];
  const FRONT_EYES = [[5, 10], [16, 10]];
  // Pectoral fins, left side; mirrored for the right.
  const FIN_UP = [[1, 10, 'o'], [0, 11, 'o'], [1, 11, 'l'], [0, 12, 'o'], [1, 12, 'l'], [1, 13, 'o']];
  const FIN_DOWN = [[1, 13, 'o'], [0, 14, 'o'], [1, 14, 'l'], [0, 15, 'o'], [1, 15, 'l'], [2, 15, 'l'], [1, 16, 'o'], [2, 16, 'o']];
  const EYE_HAPPY = ['bkb', 'kbk', 'bbb'];
  const EYE_BLINK = ['bbb', 'bbb', 'kkk'];

  // Overlay drawn above the head, in sprite coordinates.
  const BANG = `<g fill="${C.purple}"><rect x="20" y="-11" width="2" height="6"/><rect x="20" y="-3" width="2" height="2"/></g>`;

  // Cute pixel bubbles: lavender rim, pale fill, a white shine; one carries a tiny heart.
  const BUBBLE = {
    s: ['.o.', 'oho', '.o.'],
    m: ['.oo.', 'ohfo', 'offo', '.oo.'],
    l: ['.ooo.', 'ohffo', 'owffo', 'offfo', '.ooo.'],
    xl: ['..ooo..', '.ohffo.', 'ohwfffo', 'owffffo', 'offfffo', '.offfo.', '..ooo..'],
    heart: ['..ooo..', '.ohffo.', 'ofpfpfo', 'ofpppfo', 'offpffo', '.offfo.', '..ooo..']
  };
  const BUBBLE_COLORS = { o: '#A58ED3', f: '#F5F0FF', w: '#FFFFFF', h: '#FFFFFF', p: '#E8708F' };
  // Koi glints: orange and white only, with an orange rim so white reads on a white page.
  const KOI_GLINT = ['..o..', '.owo.', 'owWwo', '.owo.', '..o..'];
  const KOI_GLINT_SM = ['.o.', 'oWo', '.o.'];
  const KOI_SPARK = ['..o..', '..o..', 'ooWoo', '..o..', '..o..'];
  const SHIMMER_STEPS = 24; // frames in one shimmer loop
  const HEART = ['.x.x.', 'xhxxx', 'xxxxx', '.xxx.', '..x..'];

  // ---------- Helpers ----------
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const rand = (a, b) => a + Math.random() * (b - a);
  const ease = {
    inQuad: t => t * t,
    outQuad: t => 1 - (1 - t) * (1 - t),
    outCubic: t => 1 - Math.pow(1 - t, 3),
    inOutCubic: t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    inOutSine: t => -(Math.cos(Math.PI * t) - 1) / 2,
    outBack: t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); }
  };
  const bez = (p0, p1, p2, p3, t) => {
    const u = 1 - t;
    return {
      x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
      y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y
    };
  };
  const bezD = (p0, p1, p2, p3, t) => {
    const u = 1 - t;
    return {
      x: 3 * u * u * (p1.x - p0.x) + 6 * u * t * (p2.x - p1.x) + 3 * t * t * (p3.x - p2.x),
      y: 3 * u * u * (p1.y - p0.y) + 6 * u * t * (p2.y - p1.y) + 3 * t * t * (p3.y - p2.y)
    };
  };
  const el = (cls, tag = 'div') => { const n = document.createElement(tag); n.className = cls; return n; };

  const pixelSvg = (rows, colors, ps) => {
    let h = '';
    rows.forEach((row, y) => row.split('').forEach((c, x) => {
      if (colors[c]) h += `<rect x="${x}" y="${y}" width="1" height="1" fill="${colors[c]}"/>`;
    }));
    const w = rows[0].length, ht = rows.length;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${ht}" width="${w * ps}" height="${ht * ps}" shape-rendering="crispEdges">${h}</svg>`;
  };

  const glowRings = (g, base, strong) => {
    const solid = new Set();
    g.forEach((row, y) => row.forEach((c, x) => { if (c !== '.') solid.add(`${x},${y}`); }));
    const grow = (set, k) => {
      const out = new Set();
      set.forEach(key => {
        const [x, y] = key.split(',').map(Number);
        for (let a = -k; a <= k; a++) for (let b = -k; b <= k; b++) out.add(`${x + a},${y + b}`);
      });
      return out;
    };
    const g1 = grow(solid, 1), g2 = grow(solid, 2);
    let h = '';
    const ring = (outer, inner, op) => outer.forEach(key => {
      if (inner.has(key)) return;
      const [x, y] = key.split(',');
      h += `<rect x="${x}" y="${y}" width="1" height="1" fill="${base}" opacity="${op}"/>`;
    });
    ring(g2, g1, strong ? 0.26 : 0.14);
    ring(g1, solid, strong ? 0.5 : 0.28);
    return h;
  };

  const gridSvg = (g, base, glow, scale, overlay = '', strongGlow = false) => {
    const P = { ...MC().palette(base), ...KOI };
    let h = glow ? glowRings(g, base, strongGlow) : '';
    g.forEach((row, y) => row.forEach((c, x) => {
      if (c !== '.') h += `<rect x="${x}" y="${y}" width="1" height="1" fill="${P[c]}"/>`;
    }));
    return `<svg xmlns="http://www.w3.org/2000/svg" data-mlc="1" viewBox="-3 -16 36 42" width="${36 * scale}" height="${42 * scale}" shape-rendering="crispEdges" aria-hidden="true">${h}${overlay}</svg>`;
  };

  // Koi shimmer: while it plays, the skin itself becomes a living koi pattern — orange
  // patches on white that ripple across the body, a white sheen sliding over the scales,
  // and single scales glinting. Outline and eyes are left alone so it stays readable.
  // Fixed koi colors (not the companion color), as uppercase palette letters.
  const KOI = { D: '#DD5F1A', K: '#F2852E', E: '#F9B77C', W: '#FFFFFF', Y: '#FFF1C9', R: '#FFE0C2' };
  const shimmerGrid = (g, step) => {
    const t = (step / SHIMMER_STEPS) * Math.PI * 2;
    const sheen = -10 + (step / SHIMMER_STEPS) * 52; // diagonal sheen position
    g.forEach((row, y) => row.forEach((c, x) => {
      if ('blswvp'.indexOf(c) < 0) return;
      const v = Math.sin(x * 0.55 + t) + Math.sin(y * 0.8 - t * 0.7) + 0.8 * Math.sin((x - y) * 0.35 + t * 1.6);
      let k = v > 1.05 ? 'D' : v > 0.35 ? 'K' : v > 0.05 ? 'E' : 'W';
      if (c === 'p') k = 'K';
      if (Math.abs(x + y * 0.6 - sheen) < 1.4) k = k === 'W' ? 'K' : 'W';
      const h = Math.abs(Math.sin(x * 12.9898 + y * 78.233 + step * 37.719) * 43758.5453) % 1;
      if (h < 0.07) k = k === 'W' || k === 'E' ? 'Y' : 'R';
      row[x] = k;
    }));
    return g;
  };

  const frontGrid = (fin, eyes) => {
    const g = KOI_FRONT.map(r => r.split(''));
    (fin === 'up' ? FIN_UP : FIN_DOWN).forEach(([x, y, c]) => { g[y][x] = c; g[y][23 - x] = c; });
    const art = eyes === 'happy' ? EYE_HAPPY : eyes === 'blink' ? EYE_BLINK : null;
    if (art) FRONT_EYES.forEach(([ex, ey]) => art.forEach((row, dy) => row.split('').forEach((c, dx) => { g[ey + dy][ex + dx] = c; })));
    return g;
  };

  const readColor = () => {
    let p = {};
    try { p = JSON.parse(localStorage.getItem(PREFS_KEY) || '{}') || {}; } catch (_) {}
    if (p.color === 'custom' && /^#[0-9a-f]{6}$/i.test(p.customColor || '')) return p.customColor;
    const found = (MC()?.COLORS || []).find(c => c.id === p.color);
    return found ? found.hex : '#F28C3F';
  };

  const popCard = card => {
    if (!card) return;
    card.classList.remove('seq-published-pop');
    void card.offsetWidth;
    card.classList.add('seq-published-pop');
  };

  const visibleRect = node => {
    if (!node || !node.isConnected) return null;
    const r = node.getBoundingClientRect();
    if (r.width < 8 || r.height < 8) return null;
    if (r.bottom < 24 || r.top > innerHeight - 24 || r.right < 24 || r.left > innerWidth - 24) return null;
    return r;
  };

  let stylesReady = false;
  const ensureStyles = () => {
    if (stylesReady) return;
    stylesReady = true;
    const style = document.createElement('style');
    style.id = 'mojo-launch-celebration-styles';
    style.textContent = `
.mojo-companion.mlc-performing .mojo-fish-art{visibility:hidden}
.mojo-companion.mlc-performing .mojo-fish-button,.mojo-companion.mlc-performing .mojo-fish-art{animation-play-state:paused!important}
.mlc-actor{position:fixed;left:0;top:0;z-index:100000;pointer-events:none;will-change:transform}
.mlc-actor svg{display:block;overflow:visible}
.mlc-fx{position:fixed;inset:0;z-index:100002;pointer-events:none;overflow:hidden}
.mlc-fx>*{position:absolute;left:0;top:0;will-change:transform,opacity}
.mlc-fx svg{display:block}
.mlc-note{position:fixed;left:0;top:0;z-index:100001;width:max-content;max-width:min(280px,calc(100vw - 24px));pointer-events:none;visibility:hidden}
.mlc-note-card{position:relative;box-sizing:border-box;padding:12px 16px 13px;border:1px solid #e8dfd9;border-radius:16px;background:#fff;box-shadow:0 14px 34px #342a3824,0 2px 6px #342a380f;color:#342c38}
.mlc-note p{margin:0;font:500 15px/1.4 Lora,Georgia,serif}
.mlc-note[data-stage=second] p{font:600 15px/1.4 Inter,Arial,sans-serif;color:#40246d}
.mlc-note-tail{position:absolute;left:var(--tail-x,50%);bottom:-7px;width:12px;height:12px;margin-left:-6px;background:#fff;border-right:1px solid #e8dfd9;border-bottom:1px solid #e8dfd9;transform:rotate(45deg)}
.mlc-note[data-side=below] .mlc-note-tail{bottom:auto;top:-7px;transform:rotate(225deg)}
`;
    document.head.append(style);
  };

  // ---------- Speech note, tethered to the fish ----------
  const createNote = () => {
    const note = el('mlc-note');
    note.setAttribute('role', 'status');
    note.setAttribute('aria-live', 'polite');
    note.innerHTML = '<div class="mlc-note-card"><p></p><span class="mlc-note-tail" aria-hidden="true"></span></div>';
    document.body.append(note);
    const card = note.firstElementChild, text = card.querySelector('p');
    const n = { shown: false, x: 0, y: 0, w: 0, h: 0, side: 'above' };
    // lean: -1..1 shifts the note sideways (e.g. away from the card the fish is next to).
    n.place = (fx, fy, lift, below, dt, snap, lean = 0) => {
      if (!n.shown) return;
      let top = fy - lift - 14 - n.h, side = 'above';
      if (top < 10) { top = fy + below + 14; side = 'below'; }
      const left = clamp(fx - n.w / 2 + lean * Math.max(0, n.w / 2 - 26), 12, Math.max(12, innerWidth - n.w - 12));
      if (snap || side !== n.side) { n.x = left; n.y = top; }
      else { const k = 1 - Math.exp(-dt / 90); n.x += (left - n.x) * k; n.y += (top - n.y) * k; }
      n.side = side;
      note.dataset.side = side;
      note.style.transform = `translate(${n.x}px, ${n.y}px)`;
      note.style.setProperty('--tail-x', `${clamp(fx - n.x, 18, n.w - 18)}px`);
    };
    n.say = (words, stage, anchor) => {
      if (text.textContent === words) return;
      text.textContent = words;
      note.dataset.stage = stage;
      n.w = note.offsetWidth; n.h = note.offsetHeight;
      if (!n.shown) {
        n.shown = true;
        note.style.visibility = 'visible';
        anchor && anchor(true);
        card.animate([{ opacity: 0, transform: 'translateY(6px) scale(.92)' }, { opacity: 1, transform: 'none' }],
          { duration: 260, easing: 'cubic-bezier(.2,.9,.3,1.25)' });
      } else {
        text.animate([{ opacity: 0, transform: 'translateY(5px)' }, { opacity: 1, transform: 'none' }],
          { duration: 220, easing: 'cubic-bezier(.2,.7,.3,1)' });
      }
    };
    n.hide = () => {
      if (!note.isConnected) return;
      const a = card.animate([{ opacity: 1 }, { opacity: 0, transform: 'translateY(4px)' }], { duration: 260, fill: 'forwards' });
      a.onfinish = () => note.remove();
    };
    n.remove = () => note.remove();
    return n;
  };

  let playing = false;

  // ---------- Still version: reduced motion, Movement off, Quiet mode ----------
  const playStill = ({ companion, art, card, lines, shape, base, glow, scale, quiet }) => {
    popCard(card);
    const note = createNote();
    const r = (companion ? companion.getBoundingClientRect() : { left: innerWidth - 80, top: innerHeight - 80, width: 54, height: 63 });
    const fx = r.left + r.width / 2, fy = r.top + r.height / 2;
    note.say(`${lines[0]} ${lines[2]}`, 'final', snap => note.place(fx, fy, r.height / 2, r.height / 2, 0, snap));
    let swapped = false, saved = '';
    if (!quiet && art && shape === 'koi' && MC()) {
      saved = art.innerHTML;
      art.innerHTML = gridSvg(frontGrid('down', 'happy'), base, glow, scale);
      swapped = true;
    }
    return new Promise(resolve => setTimeout(() => {
      if (swapped && art.querySelector('svg[data-mlc]')) art.innerHTML = saved;
      note.hide();
      playing = false;
      resolve();
    }, 3600));
  };

  // ---------- The performance ----------
  async function play(opts = {}) {
    if (playing) return;
    playing = true;
    const lines = Array.isArray(opts.lines) && opts.lines.length === 3 ? opts.lines : LINES;
    const card = opts.card || null;
    const companion = document.querySelector('.mojo-companion');
    const button = companion?.querySelector('.mojo-fish-button');
    const art = companion?.querySelector('.mojo-fish-art');
    ensureStyles();

    const shape = companion?.dataset.shape || 'koi';
    const base = /^#[0-9a-f]{6}$/i.test(opts.color || '') ? opts.color : readColor();
    const glow = companion?.dataset.glow !== 'off';
    const scale = ((art && parseFloat(art.style.width)) || 54) / 36;
    const quiet = companion?.dataset.quiet === 'on';
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches || companion?.dataset.movement === 'off';
    if (!companion || !art || !MC() || quiet || reduced) {
      return playStill({ companion, art, card, lines, shape, base, glow, scale, quiet });
    }

    const s = scale;
    const ox = 15 * s, oy = 28 * s; // body centre inside the 36x42 sprite box
    const st = { x: 0, y: 0, hy: 0, rot: 0, sx: 1, sy: 1, boost: 1, size: 1, shimmer: -1, flip: 1, lean: 0, pose: 'side', bang: false,
      swimMs: 240, tick: 0, clock: 0, skip: false, done: false };

    const fxLayer = el('mlc-fx');
    const actor = el('mlc-actor');
    actor.setAttribute('aria-hidden', 'true');
    actor.style.width = `${36 * s}px`;
    actor.style.height = `${42 * s}px`;
    actor.style.transformOrigin = `${ox}px ${oy}px`;
    document.body.append(fxLayer, actor);
    const note = createNote();

    // Start exactly where the idle fish is right now.
    const r0 = art.getBoundingClientRect();
    st.x = (r0.left + r0.right) / 2 - 3 * s;
    st.y = (r0.top + r0.bottom) / 2 + 7 * s;
    companion.classList.add('mlc-performing');

    const homePoint = () => {
      const r = companion.getBoundingClientRect();
      return { x: r.left + ox, y: r.top + oy };
    };

    // Sprite frames, cached by key.
    const cache = new Map();
    const spriteKey = () => `${st.pose}:${st.tick % 2}:${st.bang ? 1 : 0}:${st.shimmer}`;
    const buildSprite = key => {
      const [pose, f, bang, shim] = key.split(':');
      const overlay = bang === '1' ? BANG : '';
      if (shape === 'koi') {
        const g = pose === 'side'
          ? MC().SPRITES.koi[+f % MC().SPRITES.koi.length].map(r => r.split(''))
          : frontGrid(f === '1' ? 'up' : 'down', pose === 'front-happy' ? 'happy' : pose === 'front-blink' ? 'blink' : 'open');
        const shimmering = +shim >= 0;
        return gridSvg(shimmering ? shimmerGrid(g, +shim) : g, base, glow, s, overlay, shimmering);
      }
      return MC().render(shape, { color: base, state: 'idle', tick: +f, scale: s, glow, blink: false, bounds: 'full' })
        .replace('</svg>', `${overlay}</svg>`);
    };
    let lastKey = '';
    const paint = () => {
      const key = spriteKey();
      if (key !== lastKey) {
        if (!cache.has(key)) cache.set(key, buildSprite(key));
        actor.innerHTML = cache.get(key);
        lastKey = key;
      }
      actor.style.transform = `translate(${st.x - ox}px, ${st.y + st.hy - oy}px) rotate(${st.rot}deg) scale(${st.flip * st.sx * st.boost * st.size}, ${st.sy * st.boost * st.size})`;
    };
    const placeNote = (dt, snap) => note.place(st.x, st.y, 10 * s * st.boost * st.size, 9 * s * st.boost * st.size, dt, snap, st.lean);
    const say = (words, stage) => note.say(words, stage, snap => placeNote(0, snap));

    // Frame loop: advances swim/fin frames and keeps the note tethered.
    let last = performance.now();
    const loop = now => {
      if (st.done) return;
      const dt = Math.min(64, now - last);
      last = now;
      st.clock += dt;
      while (st.clock >= st.swimMs) { st.clock -= st.swimMs; st.tick++; }
      paint();
      placeNote(dt, false);
      requestAnimationFrame(loop);
    };
    paint();
    requestAnimationFrame(loop);

    const tween = (ms, fn, { skippable = true } = {}) => new Promise((resolve, reject) => {
      const t0 = performance.now();
      const step = now => {
        if (st.done) return resolve();
        if (skippable && st.skip) return reject(SKIP);
        const t = Math.min(1, (now - t0) / ms);
        fn(t);
        paint();
        if (t >= 1) resolve(); else requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
    const wait = (ms, o) => tween(ms, () => {}, o);

    // ---- Effects ----
    const heading = () => { const r = st.rot * Math.PI / 180; return { x: st.flip * Math.cos(r), y: st.flip * Math.sin(r) }; };
    const mouth = () => {
      const k = s * st.size;
      if (st.pose !== 'side') return { x: st.x, y: st.y + st.hy + 4 * k * st.boost };
      const d = heading();
      return { x: st.x + d.x * 11 * k, y: st.y + st.hy + d.y * 11 * k + 2 * k };
    };
    const tail = () => { const d = heading(), k = s * st.size; return { x: st.x - d.x * 11 * k, y: st.y + st.hy - d.y * 11 * k }; };

    const spawn = (html, w, h) => {
      const node = el('');
      node.innerHTML = html;
      node.style.width = `${w}px`;
      node.style.height = `${h}px`;
      fxLayer.append(node);
      return node;
    };
    // A bubble wobbles up, then pops into four tiny pixels.
    const pop = (x, y, ps) => {
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
        const dot = spawn('', ps, ps);
        dot.style.background = BUBBLE_COLORS.o;
        dot.animate([
          { transform: `translate(${x - ps / 2}px,${y - ps / 2}px)`, opacity: 1 },
          { transform: `translate(${x - ps / 2 + dx * 6}px,${y - ps / 2 + dy * 6}px)`, opacity: 0 }
        ], { duration: 220, easing: 'ease-out', fill: 'forwards' }).onfinish = () => dot.remove();
      });
    };
    const bubble = (p, size = 'm', drift = 0, riseRange = [48, 80]) => {
      const rows = BUBBLE[size];
      const ps = s * Math.max(1, st.size * 0.9);
      const w = rows[0].length * ps;
      const node = spawn(pixelSvg(rows, BUBBLE_COLORS, ps), w, w);
      const x = p.x - w / 2, y = p.y - w / 2;
      const rise = rand(riseRange[0], riseRange[1]), sway = (Math.random() < 0.5 ? -1 : 1) * rand(3, 7);
      const anim = node.animate([
        { transform: `translate(${x}px,${y}px) scale(.3)`, opacity: 0 },
        { transform: `translate(${x + drift * 0.6 + sway * 0.3}px,${y - rise * 0.15}px) scale(1.1)`, opacity: 1, offset: 0.12 },
        { transform: `translate(${x + drift - sway}px,${y - rise * 0.5}px) scale(.95)`, opacity: 1, offset: 0.5 },
        { transform: `translate(${x + drift + sway}px,${y - rise * 0.86}px) scale(1.05)`, opacity: 1, offset: 0.86 },
        { transform: `translate(${x + drift + sway * 0.5}px,${y - rise}px) scale(1.15)`, opacity: 1 }
      ], { duration: rand(1100, 1600), easing: 'linear', fill: 'forwards' });
      anim.onfinish = () => {
        node.remove();
        if (!fxLayer.isConnected) return;
        pop(x + drift + sway * 0.5 + w / 2, y - rise + w / 2, ps);
      };
    };
    // A playful little stream of bubbles from the mouth.
    const bubbleStream = (sizes, gap) => sizes.forEach((size, i) => setTimeout(() => {
      if (st.done) return;
      const d = heading();
      bubble(mouth(), size, d.x * rand(2, 8), [70, 110]);
    }, i * gap));
    const koiColors = { o: base, w: '#FFF3E6', W: '#ffffff' };
    const burst = (p, n, dist) => {
      for (let i = 0; i < n; i++) {
        const rows = i % 3 === 0 ? KOI_SPARK : i % 3 === 1 ? KOI_GLINT_SM : KOI_GLINT;
        const w = rows[0].length * s;
        const node = spawn(pixelSvg(rows, koiColors, s), w, w);
        const a = (i / n) * Math.PI * 2 + rand(-0.3, 0.3), d = dist * rand(0.7, 1.2);
        const x = p.x - w / 2, y = p.y - w / 2;
        node.animate([
          { transform: `translate(${x}px,${y}px) scale(.3)`, opacity: 1 },
          { transform: `translate(${x + Math.cos(a) * d * 0.8}px,${y + Math.sin(a) * d * 0.8}px) scale(1)`, opacity: 1, offset: 0.45 },
          { transform: `translate(${x + Math.cos(a) * d}px,${y + Math.sin(a) * d}px) scale(.5)`, opacity: 0 }
        ], { duration: rand(480, 640), easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'forwards' }).onfinish = () => node.remove();
      }
    };
    // Orange-and-white glints that twinkle in place around the fish (koi shimmer, not confetti).
    const glints = (p, n, radius) => {
      for (let i = 0; i < n; i++) {
        const rows = i % 3 === 0 ? KOI_GLINT : i % 3 === 1 ? KOI_SPARK : KOI_GLINT_SM;
        const ps = s * st.size, w = rows[0].length * ps;
        const node = spawn(pixelSvg(rows, koiColors, ps), w, w);
        const a = (i / n) * Math.PI * 2 + rand(-0.4, 0.4), r = radius * rand(0.55, 1.05);
        const x = p.x + Math.cos(a) * r - w / 2, y = p.y + Math.sin(a) * r * 0.8 - w / 2, up = rand(6, 14);
        node.style.opacity = '0';
        node.animate([
          { transform: `translate(${x}px,${y}px) scale(0)`, opacity: 0 },
          { transform: `translate(${x}px,${y - up * 0.25}px) scale(1.15)`, opacity: 1, offset: 0.22 },
          { transform: `translate(${x}px,${y - up * 0.5}px) scale(.45)`, opacity: 0.85, offset: 0.48 },
          { transform: `translate(${x}px,${y - up * 0.75}px) scale(1)`, opacity: 1, offset: 0.72 },
          { transform: `translate(${x}px,${y - up}px) scale(0)`, opacity: 0 }
        ], { duration: rand(700, 950), delay: rand(0, 420), easing: 'ease-in-out', fill: 'forwards' }).onfinish = () => node.remove();
      }
    };
    // Koi shimmer: the skin pattern flows (~14 fps, like a sprite), the fish puffs up a
    // little, wiggles, and blows bubbles while glints twinkle around it.
    const shimmer = async ms => {
      let nextBubble = 0.08;
      await tween(ms, t => {
        const elapsed = t * ms;
        st.shimmer = shape === 'koi' ? Math.floor(elapsed / 70) % SHIMMER_STEPS : -1;
        st.boost = 1 + 0.14 * Math.sin(Math.min(1, t * 1.15) * Math.PI);
        st.hy = -Math.sin(t * Math.PI * 3) * 2;
        st.rot = Math.sin(t * Math.PI * 4) * 5;
        if (t > nextBubble && t < 0.85) { nextBubble += 0.2; bubble(mouth(), Math.random() < 0.5 ? 's' : 'm'); }
      });
      st.shimmer = -1; st.hy = 0; st.rot = 0; st.boost = 1;
    };
    const heart = p => {
      const w = 5 * s;
      const node = spawn(pixelSvg(HEART, { x: C.pink, h: C.pinkLight }, s), w, w);
      const x = p.x - w / 2, y = p.y - w / 2;
      node.animate([
        { transform: `translate(${x}px,${y}px) scale(.4)`, opacity: 0 },
        { transform: `translate(${x + 3}px,${y - 12}px) scale(1.1)`, opacity: 1, offset: 0.25 },
        { transform: `translate(${x - 3}px,${y - 26}px) scale(1)`, opacity: 1, offset: 0.65 },
        { transform: `translate(${x + 1}px,${y - 38}px) scale(1)`, opacity: 0 }
      ], { duration: 1200, easing: 'ease-out', fill: 'forwards' }).onfinish = () => node.remove();
    };

    // ---- Moves ----
    const squashTurn = async (apply, o) => {
      await tween(80, t => { st.sx = lerp(1, 0.12, ease.inQuad(t)); st.hy = -2 * t; }, o);
      apply();
      await tween(150, t => { st.sx = lerp(0.12, 1, ease.outBack(t)); st.hy = -2 * (1 - t); }, o);
      st.sx = 1; st.hy = 0;
    };
    const swimPath = async (p0, p1, p2, p3, ms, easing, swimMs, bubbleGap, o) => {
      st.swimMs = swimMs;
      let prev = { x: st.x, y: st.y }, lastBubble = 0;
      await tween(ms, t => {
        const e = easing(t), p = bez(p0, p1, p2, p3, e), d = bezD(p0, p1, p2, p3, e);
        const speed = Math.hypot(p.x - prev.x, p.y - prev.y);
        prev = p;
        st.x = p.x; st.y = p.y;
        if (Math.hypot(d.x, d.y) > 1) {
          const want = clamp(Math.atan2(st.flip * d.y, st.flip * d.x) * 180 / Math.PI, -34, 34);
          st.rot = lerp(st.rot, want, 0.25);
        }
        const k = Math.min(1, speed / 14); // stretch with speed
        st.sx = 1 + 0.16 * k; st.sy = 1 - 0.1 * k;
        if (bubbleGap && t - lastBubble > bubbleGap && t < 0.9) { lastBubble = t; bubble(tail(), Math.random() < 0.6 ? 's' : 'm'); }
      }, o);
      st.sx = 1; st.sy = 1;
    };

    // 1 · Notice
    const notice = async () => {
      st.bang = true;
      // Grows to 4/3 size (2 CSS px per art pixel at XS, so it stays crisp), with a small overshoot.
      await tween(170, t => { st.hy = -7 * ease.outQuad(t); st.sy = lerp(1, 1.08, t); st.sx = lerp(1, 0.94, t); st.size = lerp(1, 1.4, ease.outQuad(t)); });
      await tween(150, t => { st.hy = -7 * (1 - ease.inQuad(t)); st.sy = lerp(1.08, 0.86, t); st.sx = lerp(0.94, 1.12, t); st.size = lerp(1.4, 4 / 3, t); });
      await tween(130, t => { st.sy = lerp(0.86, 1, ease.outBack(t)); st.sx = lerp(1.12, 1, ease.outBack(t)); });
      // Cute bubbles first: a little stream from the mouth, one with a heart.
      bubbleStream(['s', 'm', 'xl', 's', 'heart', 'm'], 150);
      await tween(700, t => { st.hy = -Math.sin(t * Math.PI * 2) * 1.5; });
    };

    // 2 + 3 · Dart to the card and boop it (or celebrate in place)
    const dartAndBoop = async () => {
      let rect = visibleRect(card);
      // No room beside the card (e.g. a full-width card on a phone): celebrate in place instead.
      const k = s * st.size;
      if (rect && rect.right + 12 * k + 60 > innerWidth && rect.left - 12 * k - 60 < 0) rect = null;
      let T, n, contact;
      if (rect) {
        const top = Math.max(rect.top, 12), bottom = Math.min(rect.bottom, innerHeight - 12);
        const nose = 12 * k + 2;
        // Room for the body, the recoil after the boop, and the tail.
        const room = nose + 16 + 13 * k + 10;
        const rightOk = rect.right + room < innerWidth;
        const leftOk = rect.left - room > 0;
        let side = st.x >= (rect.left + rect.right) / 2 ? 'right' : 'left';
        if (side === 'right' && !rightOk) side = 'left';
        if (side === 'left' && !leftOk) side = 'right';
        n = { x: side === 'right' ? 1 : -1, y: 0 };
        // Aim near the card's middle, leaning toward the side the fish is coming from.
        const mid = (top + bottom) / 2;
        contact = { x: side === 'right' ? rect.right : rect.left, y: clamp(mid + (st.y - mid) * 0.3, top + 16, bottom - 16) };
        T = { x: contact.x + n.x * nose, y: contact.y };
      } else {
        T = { x: clamp(st.x - 170, 60, innerWidth - 60), y: clamp(st.y - 130, 90, innerHeight - 60) };
        n = { x: st.x >= T.x ? 1 : -1, y: 0 };
      }
      const wantFlip = -n.x;
      st.bang = false;
      if (st.flip !== wantFlip) await squashTurn(() => { st.flip = wantFlip; });
      // Anticipation: pull back a touch before the dash.
      const a0 = { x: st.x, y: st.y };
      await tween(110, t => { st.x = a0.x - st.flip * 4 * t; st.sx = lerp(1, 0.88, t); st.sy = lerp(1, 1.08, t); });
      const P0 = { x: st.x, y: st.y };
      const dist = Math.hypot(T.x - P0.x, T.y - P0.y);
      const P1 = { x: P0.x + (T.x - P0.x) * 0.25, y: P0.y + (T.y - P0.y) * 0.25 - Math.min(110, dist * 0.45) };
      const P2 = { x: T.x + n.x * Math.min(90, dist * 0.35), y: T.y - 20 };
      await swimPath(P0, P1, P2, T, clamp(dist * 1.6, 650, 1000), ease.inOutCubic, 70, 0.11);

      if (rect) {
        const into = { x: T.x - n.x * 5, y: T.y };
        const r0 = st.rot;
        await tween(80, t => { st.x = lerp(T.x, into.x, ease.inQuad(t)); st.sx = lerp(1, 0.82, t); st.sy = lerp(1, 1.14, t); st.rot = lerp(r0, 0, t); });
        popCard(card);
        burst(contact, 8, 26);
        st.lean = n.x; // keep the note off the card
        say(lines[0], 'first');
        const back = { x: T.x + n.x * 16, y: T.y - 4 };
        await tween(300, t => {
          const e = ease.outBack(t);
          st.x = lerp(into.x, back.x, e); st.y = lerp(into.y, back.y, e);
          st.sx = lerp(0.82, 1, ease.outCubic(t)); st.sy = lerp(1.14, 1, ease.outCubic(t));
        });
      } else {
        const r0 = st.rot;
        popCard(card);
        burst({ x: st.x, y: st.y }, 8, 30);
        say(lines[0], 'first');
        await tween(420, t => { st.rot = lerp(r0, 0, t) + Math.sin(t * Math.PI * 4) * 10 * (1 - t); });
      }
      st.swimMs = 240;
      // Koi shimmer: two sweeps of orange/white across the scales, glints twinkling around.
      glints({ x: st.x, y: st.y }, 12, 30 * s * st.size);
      setTimeout(() => !st.done && glints({ x: st.x, y: st.y }, 8, 34 * s * st.size), 650);
      await shimmer(1500);
      bubble(mouth(), 'l');
      setTimeout(() => !st.done && bubble(mouth(), 's'), 160);
      await wait(180);
    };

    // 4 · Backflip, shimmering at the top
    const leap = async () => {
      await tween(110, t => { st.sy = lerp(1, 0.8, t); st.sx = lerp(1, 1.14, t); st.hy = 2 * t; });
      let apex = false;
      await tween(780, t => {
        st.hy = -54 * 4 * t * (1 - t);
        st.sy = t < 0.15 ? lerp(0.8, 1.12, t / 0.15) : lerp(1.12, 1, (t - 0.15) / 0.85);
        st.sx = t < 0.15 ? lerp(1.14, 0.92, t / 0.15) : lerp(0.92, 1, (t - 0.15) / 0.85);
        st.rot = -st.flip * 360 * ease.inOutCubic(t);
        st.shimmer = shape === 'koi' && t > 0.15 && t < 0.95 ? Math.floor(t * 780 / 70) % SHIMMER_STEPS : -1;
        if (!apex && t >= 0.45) { apex = true; glints({ x: st.x, y: st.y + st.hy }, 12, 32 * s * st.size); say(lines[1], 'second'); }
      });
      st.rot = 0; st.hy = 0; st.shimmer = -1;
      await tween(220, t => { st.sy = lerp(0.8, 1, ease.outBack(t)); st.sx = lerp(1.16, 1, ease.outBack(t)); });
      await wait(160);
    };

    // 5 · Turn to face the viewer
    const faceViewer = async () => {
      const home = homePoint();
      const flipHome = Math.abs(home.x - st.x) < 6 ? 1 : Math.sign(home.x - st.x);
      if (shape !== 'koi') {
        say(lines[2], 'final');
        for (let i = 0; i < 2; i++) {
          await tween(320, t => { st.hy = -12 * 4 * t * (1 - t); st.sy = t < 0.5 ? 1.06 : lerp(1.06, 1, (t - 0.5) * 2); });
        }
        await wait(700);
        if (st.flip !== flipHome) await squashTurn(() => { st.flip = flipHome; });
        return;
      }
      await squashTurn(() => { st.pose = 'front'; st.flip = 1; st.rot = 0; });
      st.swimMs = 150; // fin flaps
      await tween(200, t => { st.boost = lerp(1, 1.14, ease.outBack(t)); });
      say(lines[2], 'final');
      await wait(240);
      st.pose = 'front-happy';
      heart({ x: st.x + 9 * s * st.size, y: st.y - 9 * s * st.size });
      await tween(850, t => { st.hy = -Math.sin(t * Math.PI * 2) * 2; });
      st.pose = 'front-blink';
      await wait(110);
      st.pose = 'front';
      await wait(160);
      await tween(160, t => { st.boost = lerp(1.14, 1, t); });
      await squashTurn(() => { st.pose = 'side'; st.flip = flipHome; });
    };

    // 6 · Swim home and settle
    const goHome = async fast => {
      const o = { skippable: false };
      st.pose = 'side'; st.bang = false; st.boost = 1; st.sx = 1; st.sy = 1; st.lean = 0; st.shimmer = -1;
      if (st.hy) { const h0 = st.hy; await tween(120, t => { st.hy = lerp(h0, 0, t); }, o); }
      const H = homePoint();
      const P0 = { x: st.x, y: st.y };
      const flipHome = Math.abs(H.x - P0.x) < 6 ? 1 : Math.sign(H.x - P0.x);
      if (st.flip !== flipHome) await squashTurn(() => { st.flip = flipHome; }, o);
      const dist = Math.hypot(H.x - P0.x, H.y - P0.y);
      if (dist > 2) {
        const P1 = { x: P0.x + (H.x - P0.x) * 0.3, y: P0.y + (H.y - P0.y) * 0.3 + Math.min(60, dist * 0.25) };
        const P2 = { x: H.x - flipHome * Math.min(70, dist * 0.3), y: H.y - Math.min(50, dist * 0.2) };
        await swimPath(P0, P1, P2, H, fast ? 420 : clamp(dist * 2.4, 800, 1300), fast ? ease.outCubic : ease.inOutSine, fast ? 90 : 150, fast ? 0 : 0.3, o);
      }
      const r0 = st.rot, size0 = st.size;
      st.swimMs = 260;
      await tween(fast ? 220 : 440, t => {
        st.hy = -5 * Math.exp(-4 * t) * Math.sin(t * Math.PI * 3);
        st.rot = lerp(r0, 0, ease.outCubic(t));
        st.size = lerp(size0, 1, ease.outBack(t)); // back to normal size as it settles
      }, o);
      st.size = 1;
      st.hy = 0; st.rot = 0;
      if (st.flip !== 1) await squashTurn(() => { st.flip = 1; }, o);
    };

    const onSkip = event => {
      if (event.type === 'keydown' && event.key !== 'Escape') return;
      if (opts.ignoreSkip && event.target?.closest?.(opts.ignoreSkip)) return;
      st.skip = true;
    };
    addEventListener('pointerdown', onSkip, true);
    addEventListener('keydown', onSkip, true);
    document.dispatchEvent(new CustomEvent('mojo:launch-celebration', { detail: { phase: 'start' } }));

    let skipped = false;
    try {
      try {
        await notice();
        await dartAndBoop();
        await leap();
        await faceViewer();
      } catch (error) {
        if (error !== SKIP) throw error;
        skipped = true;
        popCard(card);
        say(lines[2], 'final');
      }
      await goHome(skipped);
    } finally {
      removeEventListener('pointerdown', onSkip, true);
      removeEventListener('keydown', onSkip, true);
      st.done = true;
      actor.remove();
      companion.classList.remove('mlc-performing');
      // Restart the idle patrol from its first keyframe so the hand-off is seamless.
      [button, art].forEach(node => { if (!node) return; node.style.animation = 'none'; void node.offsetWidth; node.style.animation = ''; });
      setTimeout(() => note.hide(), skipped ? 500 : 900);
      setTimeout(() => fxLayer.remove(), 1800);
      playing = false;
      document.dispatchEvent(new CustomEvent('mojo:launch-celebration', { detail: { phase: 'end', skipped } }));
    }
  }

  window.MojoLaunchCelebration = { play, isPlaying: () => playing };
})();
