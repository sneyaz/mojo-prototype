/*
 * Mojo companions: pixel-art sprites on a 24x24 grid, plus renderer.
 * No dependencies. Works as a plain <script> (window.MojoCompanions),
 * CommonJS (require), or can be pasted inline into a single-file HTML app.
 *
 * Quick use:
 *   el.innerHTML = MojoCompanions.render('koi', { color: 'orange', scale: 2 });
 *   MojoCompanions.mount(el, { name: 'cat', color: 'purple', state: 'working' });
 */
(function (root) {
  'use strict';

  var SPRITES = {
 "koi": [
  [
   "........................",
   "........................",
   "........................",
   ".o......................",
   "olo............oo.......",
   "olo..........oolloo.....",
   "ollo........ollllllo....",
   "olllo......olllllllo....",
   "ollllo....oobbbbwwboo...",
   ".olllo...obbbbbbbbbbbo..",
   "..olllooowbbbbbbbbbbbbo.",
   "...olllwwwwbbbbbbbwkkbbo",
   ".oooollbbbwwwwwwwwkkkbwo",
   "ollllllbbbwwwwwwwwkkkwwo",
   "ollllllwbwwwwwwwwwwwwwwo",
   "ollvvooovwwwwwwwwppwwwvo",
   "ovvoo...ovvwwllwwwwwvvo.",
   ".oo......oovllwwwwvvoo..",
   "...........oovvvvvoo....",
   ".............ooooo......",
   "........................",
   "........................",
   "........................",
   "........................"
  ],
  [
   "........................",
   "........................",
   "........................",
   "........................",
   "...............oo.......",
   ".............oolloo.....",
   "............ollllllo....",
   "...........olllllllo....",
   ".oo.......oobbbbwwboo...",
   "olloo....obbbbbbbbbbbo..",
   "olllloooowbbbbbbbbbbbbo.",
   "ollllllwwwwbbbbbbbwkkbbo",
   "ollllllbbbwwwwwwwwkkkbwo",
   ".oooollbbbwwwwwwwwkkkwwo",
   "...olllwbwwwwwwwwwwwwwwo",
   "..ollvoovwwwwwwwwppwwwvo",
   ".ollvo..ovvwwllwwwwwvvo.",
   "olllo....oovllwwwwvvoo..",
   "ollvo......oovvvvvoo....",
   "olvo.........ooooo......",
   "olo.....................",
   "ovo.....................",
   ".o......................",
   "........................"
  ]
 ],
 "boring-bell": [
  [
   "........................",
   "........................",
   "..........oooo..........",
   ".........obbbbo.........",
   ".........obbbbo.........",
   "........oooooooo........",
   "......obbbbbbbbbbo......",
   "......obbbbbbbbbbo......",
   "......ollbbbbbbbbo......",
   ".....obllbbbbbbbsso.....",
   ".....obllbbbbbbbsso.....",
   ".....oblkkbbbbkksso.....",
   ".....oblwwbbbbwwsso.....",
   ".....obllbbbbbbbsso.....",
   ".....obllbbbbbbbsso.....",
   ".....obbbboooobbsso.....",
   "....obbbbbbbbbbbbbbo....",
   "...obbbbbbbbbbbbbbbbo...",
   "...oossssssssssssssoo...",
   ".......oooooooooo.......",
   "..........oppo..........",
   "..........oooo..........",
   "........................",
   "........................"
  ]
 ],
 "turtle": [
  [
   "........................",
   "........................",
   "........................",
   "........................",
   "........................",
   "........................",
   ".......oooooooooo.......",
   ".....obbbbbbbbbbbbo.....",
   "....obbbbbbbbbbbbbbo....",
   "...obbbbbbooobbbbbbo....",
   "...obblllllbssssssboooo.",
   "...oblllllbbbsssssbbbkb.",
   ".ooobbbboobbboobbbbobbbo",
   "..oobbbbbbbbbbbbbbbobbbo",
   "...obbbbbbbbbbbbbbbobbo.",
   "...obbbbbbooobbbbbbooo..",
   "...obbbbbbbbbbbbbbbo....",
   ".....oooo.....oooo......",
   "......bbb.....bbb.......",
   "......oooo...oooo.......",
   "........................",
   "........................",
   "........................",
   "........................"
  ]
 ],
 "cat": [
  [
   "........................",
   "........................",
   "....o..............o....",
   "...oso............oso...",
   "...obso..........obso...",
   "...obbso........obbso...",
   "...obpbsooo..ooobbpso...",
   "...obpppbssoosbbpppso...",
   "...obppppbsbbsbppppso...",
   "...obpbbsbbbbbbsbbpso...",
   "...obbkkkbbbbbbkkkbso...",
   "...obbwkkbbbbbbwkkbso...",
   "...obbkkkbbbbbbkkkbso...",
   "..obbbkkkbbbbbbkkkbbso..",
   "..obbbbbbbbbbbbbbbbbso..",
   "..obppbbbbbppbbbbbppso..",
   "..osbbbbbbwppwbbbbbbso..",
   "...osbbbwwwoowwwbbbso...",
   "....osbbwwwwwwwwbbso....",
   ".....ossbwwwwwwbsso.....",
   "......oossssssssoo......",
   "........oooooooo........",
   "........................",
   "........................"
  ]
 ],
 "dog": [
  [
   "........................",
   "........................",
   "........................",
   "........................",
   "........................",
   "..........oooo..........",
   "........oowwwwoo........",
   "...oo..obbwwwwbso..oo...",
   "..ossoobbbwwwwbbsoosso..",
   "..osssbbbbwwwwbbbsssso..",
   ".osssskkkbwwwwbkkksssso.",
   ".osssswkkbbbbbbwkksssso.",
   ".osssskkkbbbbbbkkksssso.",
   ".osssskkkbbbbbbkkksssso.",
   ".ossssbbbbwwwwbbbbsssso.",
   ".ossssbbwwkkkkwwbbsssso.",
   ".osssppbwwkkkkwwbppssso.",
   ".ossssswwwwwwwwwwssssso.",
   "..osssoswwwwwwwwsossso..",
   "..osso.owwwwwwwwo.osso..",
   "...oo...oowwwwoo...oo...",
   "..........oooo..........",
   "........................",
   "........................"
  ]
 ],
 "blob": [
  [
   "........................",
   "........................",
   "........................",
   "........................",
   "........................",
   ".......ooooooo..........",
   "......oblwbbbsoo........",
   ".....oblwbbbbbbso.......",
   "....obbwbbbbbbbbso......",
   "....oblbbbbbbbbbso......",
   "...obbbbbbbbbbbbsoo.....",
   "...obbbkkkbbbbkkkbso....",
   "...obbbwkkbbbbwkkbbso...",
   "..obbbbkkkbbbbkkkbbbso..",
   ".obbbbbkkkbbbbkkkbbbbso.",
   ".obbbppbbbbbbbbbbppbbso.",
   ".osbbbbbbbboobbbbbbbbso.",
   "..oslbbbbbbbbbbbbbblso..",
   "...osllbbbbbbbbbbllso...",
   "....ossllllllllllsso....",
   ".....oossssssssssoo.....",
   ".......oooooooooo.......",
   "........................",
   "........................"
  ]
 ],
 "dot": [
  [
   "........................",
   "........................",
   "........oooooooo........",
   "......oolllllbbboo......",
   ".....olwwwllllbbbso.....",
   "....olwwwwllllbbbbso....",
   "...olwwwwwllllbbbsbso...",
   "...owwwwwlllllbbbbsso...",
   "..ollwwwlllllbbbbsssso..",
   "..olllllllllbbbbsbssso..",
   "..ollllllllbbbbbbsssso..",
   "..olllllllbbbbbbssssso..",
   "..obllllbbbbbbbssssslo..",
   "..obbbbbbbbbbbsssssslo..",
   "..obbbbbbbbbbssssssllo..",
   "..obbbbbbbsbsssssssllo..",
   "...obsbsbsbsssssssllo...",
   "...osssbssssssssslllo...",
   "....ossssssssssslllo....",
   ".....ossssssssllllo.....",
   "......oosssslllloo......",
   "........oooooooo........",
   "........................",
   "........................"
  ]
 ]
};

  // Eyes as [x, y, width, height]. Used for blinking and closed eyes.
  var EYES = {
    koi: [[18, 11, 3, 3]],
    'boring-bell': [[8, 11, 2, 2], [14, 11, 2, 2]],
    turtle: [[21, 11, 1, 2]],
    cat: [[6, 10, 3, 4], [15, 10, 3, 4]],
    dog: [[6, 10, 3, 4], [15, 10, 3, 4]],
    blob: [[7, 11, 3, 4], [14, 11, 3, 4]],
    dot: []
  };

  var NAMES = [
    { id: 'koi', label: 'Koi fish' },
    { id: 'boring-bell', label: 'Boring Bell' },
    { id: 'turtle', label: 'Turtle' },
    { id: 'cat', label: 'Cat' },
    { id: 'dog', label: 'Dog' },
    { id: 'dot', label: 'Dot' },
    { id: 'blob', label: 'Blob' }
  ];

  var COLORS = [
    { id: 'orange', label: 'Orange', hex: '#F28C3F' },
    { id: 'coral', label: 'Coral', hex: '#DD8D78' },
    { id: 'purple', label: 'Purple', hex: '#7653C0' },
    { id: 'lavender', label: 'Lavender', hex: '#B08FE0' },
    { id: 'blue', label: 'Blue', hex: '#6D86D6' },
    { id: 'graphite', label: 'Graphite', hex: '#6F6A78' }
  ];

  // scale = CSS pixels per art pixel. 24 art pixels wide, so 36 / 48 / 72 px sprites.
  // 1.5 / 2 / 3 land on whole device pixels on 2x (retina) screens.
  var SIZES = [
    { id: 'xs', label: 'Extra small', scale: 1.5 },
    { id: 's', label: 'Small', scale: 2 },
    { id: 'm', label: 'Medium', scale: 3 }
  ];

  var STATES = ['idle', 'working', 'needs-you', 'paused'];
  var TICK_MS = 520;

  function hexToRgb(h) {
    return [1, 3, 5].map(function (i) { return parseInt(h.slice(i, i + 2), 16); });
  }
  function mix(a, b, k) {
    var A = hexToRgb(a), B = hexToRgb(b);
    return '#' + A.map(function (v, i) {
      return Math.round(v + (B[i] - v) * k).toString(16).padStart(2, '0');
    }).join('');
  }

  // One base color generates the whole palette, so any hex color works.
  function palette(base) {
    return {
      b: base,
      s: mix(base, '#3a2450', 0.24),
      l: mix(base, '#ffffff', 0.38),
      o: mix(base, '#2a1830', 0.66),
      w: mix(base, '#ffffff', 0.92),
      v: mix(base, '#ffffff', 0.78),
      k: '#2c2433',
      p: mix(base, '#ff6f9c', 0.42)
    };
  }

  function resolveColor(c) {
    if (!c) return COLORS[0].hex;
    if (c.charAt(0) === '#') return c;
    for (var i = 0; i < COLORS.length; i++) if (COLORS[i].id === c) return COLORS[i].hex;
    return COLORS[0].hex;
  }

  function px(x, y, c) {
    return '<rect x="' + x + '" y="' + y + '" width="1" height="1" fill="' + c + '"/>';
  }

  // Returns the 2D char grid for a sprite frame. closed = true draws eyelids:
  // all eye rows except the last are filled with the surrounding body color.
  function frameGrid(name, frame, closed) {
    var frames = SPRITES[name];
    var g = frames[frame % frames.length].map(function (r) { return r.split(''); });
    if (closed) {
      (EYES[name] || []).forEach(function (e) {
        var x = e[0], y = e[1], w = e[2], h = e[3], counts = {}, fill = 'b', best = 0, xx, yy, k;
        for (xx = x; xx < x + w; xx++) {
          var u = g[y - 1][xx];
          if ('kwo.'.indexOf(u) < 0) counts[u] = (counts[u] || 0) + 1;
        }
        for (k in counts) if (counts[k] > best) { best = counts[k]; fill = k; }
        for (yy = y; yy <= y + h - 2; yy++) for (xx = x; xx < x + w; xx++) g[yy][xx] = fill;
      });
    }
    return g;
  }

  function silhouette(g) {
    var s = {};
    g.forEach(function (row, y) { row.forEach(function (c, x) { if (c !== '.') s[x + ',' + y] = 1; }); });
    return s;
  }
  function dilate(s, k) {
    var o = {}, key;
    for (key in s) {
      var q = key.split(',').map(Number);
      for (var a = -k; a <= k; a++) for (var b = -k; b <= k; b++) o[(q[0] + a) + ',' + (q[1] + b)] = 1;
    }
    return o;
  }
  function ring(outer, inner, fill, opacity) {
    var h = '', key;
    for (key in outer) {
      if (inner[key]) continue;
      var q = key.split(',');
      h += '<rect x="' + q[0] + '" y="' + q[1] + '" width="1" height="1" fill="' + fill + '" opacity="' + opacity + '"/>';
    }
    return h;
  }

  // Stepped pixel halo (not a blur) so glow matches the pixel style.
  function spriteGroup(name, frame, closed, base, glow, dy) {
    var g = frameGrid(name, frame, closed), P = palette(base), h = '';
    if (glow) {
      var s = silhouette(g), g1 = dilate(s, 1), g2 = dilate(s, 2);
      h += ring(g2, g1, base, 0.14) + ring(g1, s, base, 0.28);
    }
    g.forEach(function (row, y) { row.forEach(function (c, x) { if (c !== '.') h += px(x, y, P[c]); }); });
    return '<g transform="translate(0 ' + (dy || 0) + ')">' + h + '</g>';
  }

  // A compact body sits behind each front-facing head. Its feet and chest stay
  // visible below the face, and the tail attaches to its right side.
  function animalBody(name, base, dy) {
    if (name !== 'dog' && name !== 'cat') return '';
    var P = palette(base);
    var outline = name === 'dog'
      ? 'M6 18h13v2h3v8h-2v4h-4v-3h-3v3H9v-3H7v3H3v-4h2v-7h1z'
      : 'M7 18h12v2h3v8h-2v4h-4v-3h-3v3H9v-3H7v3H4v-4h2v-8h1z';
    return '<g class="mojo-companion-body" transform="translate(0 ' + (dy || 0) + ')" shape-rendering="crispEdges">' +
      '<path d="' + outline + '" fill="' + P.b + '" stroke="' + P.o + '" stroke-width="1.3" stroke-linejoin="miter"/>' +
      '<path d="M9 21h7v7H9z" fill="' + (name === 'dog' ? P.w : P.v) + '"/>' +
      '<path d="M4 29h5v3H4zm12 0h5v3h-5z" fill="' + P.s + '"/>' +
      '</g>';
  }

  // The existing animation tick supplies the wag frames.
  function animalTail(name, tick, base, dy) {
    if (name !== 'dog' && name !== 'cat') return '';
    var P = palette(base), frame = tick % 4;
    var paths = name === 'dog'
      ? ['M20 25h4v-2h3v-3h2v-2h2v-1', 'M20 25h4v-4h3v-4h2v-3h1v-1',
         'M20 25h4v-2h3v-3h2v-2h2v-1', 'M20 25h4v1h3v-2h2v-3h2v-2']
      : ['M20 25h4v-2h3v-4h2v-4h2v-2', 'M20 25h4v-5h3v-5h2v-4h1v-2',
         'M20 25h4v-2h3v-4h2v-4h2v-2', 'M20 25h4v1h3v-3h2v-4h2v-2'];
    var path = paths[frame];
    return '<g class="mojo-companion-tail" transform="translate(0 ' + (dy || 0) + ')" fill="none" stroke-linecap="square" stroke-linejoin="miter">' +
      '<path d="' + path + '" stroke="' + P.o + '" stroke-width="3.5"/>' +
      '<path d="' + path + '" stroke="' + P.b + '" stroke-width="1.7"/>' +
      '</g>';
  }

  // These two silhouettes need smooth edges to stay recognizable in the 45px picker.
  function shapedSpriteGroup(name, closed, base, glow, dy, tick) {
    var P = palette(base), h = '';
    if (name === 'boring-bell') {
      h += '<circle cx="12" cy="20.4" r="1.8" fill="' + P.s + '" stroke="' + P.o + '" stroke-width=".7"/>';
      h += '<circle cx="12" cy="4.4" r="2" fill="' + P.l + '" stroke="' + P.o + '" stroke-width=".9"/>';
      h += '<path d="M12 6.1c-3.7 0-5.6 2.8-5.6 6.2 0 2.5-.8 4.2-2 5.8h15.2c-1.2-1.6-2-3.3-2-5.8 0-3.4-1.9-6.2-5.6-6.2Z" fill="' + P.b + '" stroke="' + P.o + '" stroke-width="1.1" stroke-linejoin="round"/>';
      h += '<path d="M8.5 10.1c.6-1.5 1.7-2.4 3-2.6" fill="none" stroke="' + P.v + '" stroke-width="1.5" stroke-linecap="round" opacity=".9"/>';
      h += '<path d="M4.6 18.1c2.2 1.3 12.6 1.3 14.8 0" fill="none" stroke="' + P.o + '" stroke-width="1" stroke-linecap="round"/>';
      h += closed
        ? '<path d="M9 13h1.6m2.8 0H15" fill="none" stroke="' + P.k + '" stroke-width=".65" stroke-linecap="round"/>'
        : '<circle cx="9.8" cy="12.7" r=".55" fill="' + P.k + '"/><circle cx="14.2" cy="12.7" r=".55" fill="' + P.k + '"/>';
      h += '<path d="M11.2 15.3h1.6" fill="none" stroke="' + P.o + '" stroke-width=".55" stroke-linecap="round"/>';
      if (glow) h = '<path d="M12 6.1c-3.7 0-5.6 2.8-5.6 6.2 0 2.5-.8 4.2-2 5.8h15.2c-1.2-1.6-2-3.3-2-5.8 0-3.4-1.9-6.2-5.6-6.2Z" fill="none" stroke="' + P.l + '" stroke-width="2.5" opacity=".48"/>' + h;
    } else {
      h += '<path d="M5.2 15.1 2.3 14l1.5 2.7 2.4.4Z" fill="' + P.b + '" stroke="' + P.o + '" stroke-width=".8" stroke-linejoin="round"/>';
      var shuffle = (tick || 0) % 4;
      var backFootX = [-1, 0, 1, 0][shuffle];
      var frontFootX = [1, 0, -1, 0][shuffle];
      var backFootY = [0, 1, 0, 0][shuffle];
      var frontFootY = [0, 0, 0, 1][shuffle];
      h += '<g class="mojo-turtle-feet" shape-rendering="crispEdges">' +
        '<path class="mojo-turtle-back-foot" transform="translate(' + backFootX + ' ' + backFootY + ')" d="M6.5 16h3v2.5h-1v1h-1v-1h-1Z" fill="' + P.b + '" stroke="' + P.o + '" stroke-width=".8" stroke-linejoin="miter"/>' +
        '<path class="mojo-turtle-front-foot" transform="translate(' + frontFootX + ' ' + frontFootY + ')" d="M14.5 16h3v2.5h-1v1h-1v-1h-1Z" fill="' + P.b + '" stroke="' + P.o + '" stroke-width=".8" stroke-linejoin="miter"/>' +
        '</g>';
      h += '<path d="M5 15V12H6V10H8V8h3V7h4v1h2v1h2v2h1v5h-2v1H8v-1H6Z" fill="' + P.s + '" stroke="' + P.o + '" stroke-width="1" stroke-linejoin="miter" shape-rendering="crispEdges"/>';
      h += '<path d="M8.1 12c1-1.9 2.7-3 4.8-3.1m-.1 0 1.1 3.3m-1.1-3.3-2 4.5m3.1-1.2 3.5-.2M8 15.1c2.2 1.1 6.2 1.3 9 .4" fill="none" stroke="' + P.l + '" stroke-width=".85" stroke-linecap="round" opacity=".88"/>';
      h += '<path d="M18.1 12.2c1.2-1 3.4-1 4.4.3 1.1 1.4 1 3.3-.4 4.4-1 1-2.8 1.2-4.5.5l-1.4-1.7Z" fill="' + P.b + '" stroke="' + P.o + '" stroke-width=".9" stroke-linejoin="round"/>';
      h += closed
        ? '<path d="M20.8 13.8h1.1" fill="none" stroke="' + P.k + '" stroke-width=".5" stroke-linecap="round"/>'
        : '<circle cx="21.2" cy="13.5" r=".46" fill="' + P.k + '"/>';
      h += '<circle cx="22.5" cy="15.5" r=".26" fill="' + P.o + '"/>';
      if (glow) h = '<path d="M5.1 15.1c0-5 3.1-8.6 7.8-8.6 4 0 6.6 2.6 7.1 6.2l2.6-.2c2.3 1.9 1.2 4.8-1.7 5.2-4.9 1.4-14.8 2-15.8-.6Z" fill="none" stroke="' + P.l + '" stroke-width="2.4" opacity=".45"/>' + h;
    }
    return '<g transform="translate(0 ' + (dy || 0) + ')">' + h + '</g>';
  }

  // ---- State overlays, drawn in the same 24-unit art grid, above/right of the sprite ----

  function bubble(tick) {
    var h = '', O = '#4a3a66', x, y;
    for (x = 18; x <= 28; x++) h += px(x, -14, O) + px(x, -5, O);
    for (y = -13; y <= -6; y++) {
      h += px(17, y, O) + px(29, y, O);
      for (x = 18; x <= 28; x++) h += px(x, y, '#ffffff');
    }
    [19, 23, 27].forEach(function (dx, i) {
      var yy = tick % 3 === i ? -11 : -10;
      h += px(dx, yy, '#7653C0') + px(dx + 1, yy, '#7653C0') + px(dx, yy + 1, '#7653C0') + px(dx + 1, yy + 1, '#7653C0');
    });
    return h;
  }

  var Z_BIG = ['111111', '000011', '000110', '001100', '011000', '111111'];
  var Z_SMALL = ['1111', '0010', '0100', '1111'];
  function zzz(tick) {
    var c = '#7F77DD', o = tick % 2 ? -1 : 0, h = '';
    Z_BIG.forEach(function (r, y) { r.split('').forEach(function (v, x) { if (v === '1') h += px(18 + x, -7 + y + o, c); }); });
    Z_SMALL.forEach(function (r, y) { r.split('').forEach(function (v, x) { if (v === '1') h += px(26 + x, -14 + y + o, c); }); });
    return h;
  }

  /*
   * render(name, opts) -> SVG string
   * opts.color   hex like '#7653C0' or an id: orange | coral | purple | lavender | blue | graphite
   * opts.state   idle | working | needs-you | paused   (default idle)
   * opts.tick    animation step counter (default 0). Advance every ~520 ms, see mount().
   * opts.scale   CSS px per art pixel (default 2). Use 1.5, 2 or 3.
   * opts.glow    stepped pixel halo (default true)
   * opts.bounds  'full' leaves room above/right for state overlays (default),
   *              'compact' is a tight 30x30 box for picker tiles
   * opts.blink   allow idle blinking (default true)
   */
  function render(name, opts) {
    opts = opts || {};
    var base = resolveColor(opts.color);
    var state = opts.state || 'idle';
    var tick = opts.tick || 0;
    var scale = opts.scale || 2;
    var glow = opts.glow !== false;
    var bounds = opts.bounds === 'compact' ? 'compact' : 'full';
    var blink = opts.blink !== false && tick % 8 === 5;
    var frame = tick, closed = false, dy = 0, overlay = '';

    if (state === 'idle') { dy = name === 'turtle' ? 0 : tick % 2; closed = blink; }
    else if (state === 'working') { closed = blink; overlay = bubble(tick); }
    else if (state === 'needs-you') { dy = tick % 2 ? -1 : 0; closed = blink; }
    else if (state === 'paused') { closed = true; frame = Math.floor(tick / 2); dy = tick % 4 < 2 ? 0 : 1; overlay = zzz(tick); }

    var vb = bounds === 'compact'
      ? (name === 'cat' || name === 'dog' ? [-3, -3, 36, 39] : [-3, -3, 30, 30])
      : (name === 'cat' || name === 'dog' ? [-3, -16, 36, 52] : [-3, -16, 36, 42]);
    var shaped = name === 'boring-bell' || name === 'turtle';
    return '<svg xmlns="http://www.w3.org/2000/svg" class="' + (shaped ? 'mojo-companion-shaped' : '') + (name === 'turtle' ? ' mojo-companion-turtle' : '') + '" viewBox="' + vb.join(' ') + '" width="' + (vb[2] * scale) +
      '" height="' + (vb[3] * scale) + '" shape-rendering="' + (shaped ? 'geometricPrecision' : 'crispEdges') + '" role="img" aria-label="' + name + ' companion, ' + state + '">' +
      animalTail(name, tick, base, dy) +
      animalBody(name, base, dy) +
      (shaped ? shapedSpriteGroup(name, closed, base, glow, dy, tick) : spriteGroup(name, frame, closed, base, glow, dy)) + (bounds === 'full' ? overlay : '') + '</svg>';
  }

  /*
   * mount(el, opts) animates a companion inside el.
   * Returns { set(partialOpts), stop() }. Honors prefers-reduced-motion (draws a still frame).
   */
  function mount(el, opts) {
    var o = Object.assign({ name: 'koi', color: 'orange', state: 'idle', scale: 2, glow: true, animate: true, bounds: 'full' }, opts || {});
    var tick = 0, timer = null;
    var reduce = o.animate === false || (typeof window !== 'undefined' && window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    function draw() {
      el.innerHTML = render(o.name, Object.assign({}, o, { tick: tick, blink: !reduce }));
    }
    draw();
    if (!reduce) timer = setInterval(function () { tick++; draw(); }, TICK_MS);
    return {
      set: function (p) { Object.assign(o, p || {}); draw(); },
      stop: function () { if (timer) clearInterval(timer); timer = null; }
    };
  }

  var api = {
    GRID: 24, SPRITES: SPRITES, EYES: EYES, NAMES: NAMES, COLORS: COLORS, SIZES: SIZES,
    STATES: STATES, TICK_MS: TICK_MS, palette: palette, render: render, mount: mount
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.MojoCompanions = api;
})(typeof window !== 'undefined' ? window : this);
