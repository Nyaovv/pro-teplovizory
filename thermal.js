/* thermal.js — procedural "thermal imager" frames for the ПРО ТЕПЛОВИЗОРЫ mockup.
 *   Thermal.render(canvas, { scene, palette, seed })   Thermal.palettes   Thermal.scenes
 * Vanilla ES2019, no deps. Pipeline: half-res temperature field -> optics blur -> sensor noise
 * -> percentile AGC (2% .. 99.5%) -> bilinear upscale -> 8-bit index (cached) -> palette LUT.
 */
(function () {
  'use strict';

  function rng(a) { // mulberry32
    a |= 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Value noise on one fixed 256x256 lattice; seeds shift coordinates instead of rebuilding it.
  var NG = new Float32Array(65536);
  (function () { var r = rng(9137); for (var i = 0; i < 65536; i++) NG[i] = r() * 2 - 1; })();

  function vn(x, y) {
    var xf = Math.floor(x), yf = Math.floor(y), fx = x - xf, fy = y - yf;
    var i0 = xf & 255, i1 = (xf + 1) & 255, j0 = (yf & 255) << 8, j1 = ((yf + 1) & 255) << 8;
    fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
    var a = NG[j0 + i0], c = NG[j1 + i0];
    a += (NG[j0 + i1] - a) * fx; c += (NG[j1 + i1] - c) * fx;
    return a + (c - a) * fy;
  }

  function fbm(x, y, oct) {
    var s = 0, amp = 1, norm = 0, t;
    for (var k = 0; k < oct; k++) {
      s += amp * vn(x, y); norm += amp; amp *= 0.5;
      t = 1.6 * x - 1.2 * y + 37.1; y = 1.2 * x + 1.6 * y + 11.7; x = t; // rotate + double
    }
    return s / norm;
  }

  // Separable box blur, clamped edges; `passes` x box ~ gaussian. In place.
  function blur(a, w, h, r, passes) {
    var t = new Float32Array(a.length), inv = 1 / (2 * r + 1), x, y, k, s, o;
    while (passes--) {
      for (y = 0; y < h; y++) {
        o = y * w; s = 0;
        for (k = -r; k <= r; k++) s += a[o + (k < 0 ? 0 : k >= w ? w - 1 : k)];
        for (x = 0; x < w; x++) {
          t[o + x] = s * inv;
          s += a[o + (x + r + 1 < w ? x + r + 1 : w - 1)] - a[o + (x - r > 0 ? x - r : 0)];
        }
      }
      for (x = 0; x < w; x++) {
        s = 0;
        for (k = -r; k <= r; k++) s += t[(k < 0 ? 0 : k >= h ? h - 1 : k) * w + x];
        for (y = 0; y < h; y++) {
          a[y * w + x] = s * inv;
          s += t[(y + r + 1 < h ? y + r + 1 : h - 1) * w + x] - t[(y - r > 0 ? y - r : 0) * w + x];
        }
      }
    }
    return a;
  }

  // Bristle crest along the boar's back (spikes point backwards, longest at the withers).
  var BOAR_MANE = (function () {
    var P = [[27, 53.2], [36, 54.5], [44, 56.6], [52, 60.5], [58, 63.8], [63, 65.2], [67, 64.6], [71, 62], [75, 58.5]];
    function hb(x) {
      for (var i = 1; i < P.length; i++) if (x <= P[i][0]) return P[i - 1][1] + (P[i][1] - P[i - 1][1]) * (x - P[i - 1][0]) / (P[i][0] - P[i - 1][0]);
      return P[P.length - 1][1];
    }
    var r = rng(5), d = 'M27 ' + (hb(27) - 1.6), x;
    for (x = 27.5; x < 75; x += 1.3) {
      var k = Math.max(0, 1 - Math.abs(x - 61) / 26);
      d += 'L' + (x - 1).toFixed(2) + ' ' + (hb(x) + (0.8 + 3.4 * k) * (0.6 + 0.6 * r())).toFixed(2) +
           'L' + (x + 0.5).toFixed(2) + ' ' + (hb(x + 0.5) - 0.2).toFixed(2);
    }
    d += 'L76 ' + (hb(76) - 1.6);
    for (x = 72; x >= 28; x -= 4) d += 'L' + x + ' ' + (hb(x) - 1.6).toFixed(2);
    return d + 'Z';
  })();

  // Animals in local units: x along the body (head towards +x), h = height above ground (up).
  // parts: [svg path, hot 0..1, cool 0..1, leg top h?] (part 0 = torso); spots: [x, h, rx, ry, heat] (heat < 0 = cooler fur).
  // w/h = bbox size, frac = share of frame width, vital = point placed at the frame centre (reticle).
  var ANIMALS = {
    boar: {
      w: 103, h: 68, frac: 0.37, vital: [62, 37], base: 0.8, fur: 0.07, fx: 0.9, fy: 0.3, grass: 3, feet: [8, 77],
      parts: [
        ['M4 40C8 47 18 50.5 30 52.5C40 54.5 50 59.5 57 63.5C61 65.5 66 65.5 70 62.5C76 57.5 83 47 89 36C93 28 97 20 99.5 13.5L100.5 8.5C98.5 7.5 95 8 92 9.5C88 11.5 85 14 82 17.5C79.5 20.5 76.5 22 73 22.5C70 22.5 68 22 66 21.5C56 20.5 44 21.5 33 23.5C26 25 21 27 17 28.5C10 30.5 5 32 3.5 35.5C3 37.5 3.2 39 4 40Z', 0, 0],
        [BOAR_MANE, 0, 0.9],
        ['M70.5 61.5C70 64.5 69.2 67.5 68 70C70.8 69 73.6 66 75 61.5Z', 0.55, 0],
        ['M73.8 60C74 63 74 66 73.4 68.8C75.8 67.4 77.6 64 78 59.5Z', 0.45, 0],
        ['M66 27C67.5 20 69 14 70.5 9.5C71.2 6.5 71.8 3.5 72 1.5L72.2 0L77.2 0L76.6 1.8C76.3 4.5 76.2 7.5 76.3 10.5C76.6 16 77 22 77 27Z', 0.35, 0, 27],
        ['M61 26C61.5 19 62 13 62.3 9C62.5 6 62.6 3 62.5 1.5L62.4 0L67 0L66.8 1.6C66.6 4.5 66.5 7.5 66.8 10C67.2 15 68 21 68.5 26Z', 0.28, 0, 26],
        ['M24 29C20 22 16 16 13.5 11.5C12.6 8 12.3 4.5 12.3 1.5L12.4 0L7.6 0L7.8 1.5C8 4.5 7.9 8 7.6 11C6 15 4.5 20 3.5 25C3 28 3 31 3.3 34Z', 0.35, 0, 32],
        ['M30 27C27.5 21 25 15.5 24 11C23.4 8 23.2 4.5 23.3 1.5L23.4 0L18.6 0L18.8 1.6C18.9 5 18.6 8.5 18 11.5C17 15 16 21 15.5 30Z', 0.28, 0, 28],
        ['M4.5 39C2.2 38 0.5 35-0.2 30C-0.5 28-0.6 26-0.2 24.5L1.2 24.5C1.2 26.5 1.4 29.5 2 32C2.8 34.5 4 36 5.5 37Z', 0, 0.5]
      ],
      spots: [[82.5, 43, 3, 3, 1], [98, 11, 4.5, 4, 0.5], [88, 13, 6, 4, 0.4], [79, 24, 8, 6, 0.3],
        [67, 24, 7, 5, 0.45], [22, 26, 7, 5, 0.4], [45, 22, 22, 4.5, 0.35], [72, 61, 4, 4, 0.4],
        [38, 55, 32, 16, -0.7], [62, 64, 13, 10, -0.45]]
    },
    deer: {
      w: 100, h: 129, frac: 0.30, vital: [63, 54], base: 0.84, fur: 0.035, fx: 0.5, fy: 0.5, grass: 3, feet: [6, 74],
      parts: [
        ['M2.5 69C5 75.5 13 77 24 75.5C35 74 48 72 58.5 71.5C63 71.3 66.5 73 68.5 77C71.5 85 74.5 95 77.5 103C79 107.5 81 110.5 84.5 111.5C88.5 112.5 92 110.5 94.5 107C96.5 104 98.5 101.5 100.3 99.8C101 98.8 100.5 97 98.8 96.6C96 96 92.5 96.2 89.5 95.5C87 95 85.5 93.5 84.8 91C83 84 80.5 74 78.5 63C77.5 57 76.5 49 72 44C68 40.5 62 39.8 56 40.5C49 41.5 38 45.5 29 49C23 51 17 51 13 49C6 48 1.5 53 1 59C0.6 62.5 1.2 66.5 2.5 69Z', 0, 0],
        ['M81 108.5C77 112 73.5 118 73.8 123.5C74 126 76.5 126.5 78.5 124.5C82 121 85 116 86.5 111Z', 0.55, 0],
        ['M84 110.5C82.5 115.5 82.5 121.5 84.5 126.5C85.5 128.5 88 128 88.5 125.5C89.5 121 89.5 115.5 88.8 110.5Z', 0.45, 0],
        ['M67.5 50C68.8 40 69.8 31 70.2 23.5C70.4 16 70.4 9 70.3 3.5L70.2 0L73.6 0L73.4 3.5C73.2 9 73.1 16 73.4 23.5C74 31 75.3 40 76 50Z', 0.45, 0, 48],
        ['M60 45C60.6 37 61 30 61.2 23.5C61.4 16 61.5 9 61.5 3.5L61.4 0L64.4 0L64.3 3.5C64.2 9 64 16 64.2 23.5C64.6 31 65.8 38 66.8 45Z', 0.35, 0, 44],
        ['M21 55C17.5 45 12 34 9.5 27C9 19 9.4 10 9.8 3.5L9.9 0L6.6 0L6.6 3.5C6.3 10 5.7 18 5.2 24C4.4 25.5 3.7 27.5 3.4 30C2.8 37 2 45 2.2 53Z', 0.45, 0, 52],
        ['M27 53C23.5 43 19 34 16.5 28C16 20 16.2 11 16.5 3.5L16.6 0L13.4 0L13.4 3.5C13.2 10 12.8 18 12.3 24.5C11.6 26 11 28 10.8 31C10.5 37 10.5 43 11 49Z', 0.35, 0, 50]
      ],
      spots: [[91, 106, 2.6, 2.6, 1], [99.3, 98.3, 2.8, 2.4, 0.6], [92, 102, 7, 5, 0.3], [84, 111, 3.5, 3.5, 0.45],
        [82, 88, 4, 7, 0.3], [70, 46, 6, 5, 0.55], [16, 47, 6, 5, 0.55], [44, 45, 22, 4.5, 0.4],
        [38, 76, 34, 16, -0.55], [72, 86, 5, 10, -0.2]]
    },
    fox: {
      w: 102, h: 54, frac: 0.28, vital: [71, 23], base: 0.84, fur: 0.035, fx: 0.5, fy: 0.5, grass: 2.5, feet: [40, 80], fuzz: 1,
      parts: [
        ['M35.5 31.5C43 34.5 53 35.5 63 35.2C69 35 73.5 35.8 76.5 38C78.8 40 81 41.8 84 42.2C87 42.6 89.2 41.6 91.2 39.6C94 37.2 97.5 35.2 100.2 33.6C101 33 100.4 32 99 31.8C96 31.4 92 30.6 88.5 29.6C86.3 29 84.6 27.8 83.6 26.2C82.6 24 82 21 80.6 18.6C79 16.6 76 15.6 72 15.6C62 16.5 53 18.5 46 19.5C43 20 40.5 20.5 38 21C35 20.2 33 23.5 32.8 27.5C32.8 29.5 33.8 31 35.5 31.5Z', 0, 0],
        ['M37 31.5C30 31 22 29 14.5 27C9 25.5 4 24.5 1 22C-0.6 20.6-0.4 18.4 1.5 17.2C5.5 15.2 11.5 15 17.5 16C24.5 17.2 30.5 20.5 35.5 24.5Z', 0, 0.8],
        ['M81.2 40.8C81.3 45 81.7 49.5 82.6 53.2C84.5 50.5 86.2 46.5 87 42.4Z', 0.5, 0],
        ['M85 42.3C85.6 46 86.6 49.5 88 52.4C89.2 49.3 89.9 45.5 89.6 41.4Z', 0.45, 0],
        ['M73.5 18C74.5 12.5 75.6 7 76.2 2.4L76.3 0L79.6 0L79.2 1.6C78.9 6 78.6 11.5 78.6 18Z', 0.5, 0, 18],
        ['M69.5 17C69.8 12 70 7 70 2.4L69.9 0L73 0L72.9 2.4C72.8 7 72.6 12 72.6 17Z', 0.4, 0, 17],
        ['M46.5 22C45.4 15 43.8 10 42.8 7.5C43 5 43.4 2.6 44 0.8L44.2 0L40.4 0L40.2 1C39.8 3.2 39.4 5.5 38.8 7.6C37.7 11 36.3 15.5 35.5 21Z', 0.5, 0, 21],
        ['M51 21.5C50 15 48.6 10.5 47.8 8C48 5.5 48.4 3 49 0.8L49.2 0L45.8 0L45.6 1C45.2 3.2 44.8 5.5 44.3 8C43.6 11 43 14.5 42.7 18.5Z', 0.4, 0, 21]
      ],
      spots: [[90.5, 37.2, 1.9, 1.9, 1], [99.7, 32.6, 2, 1.8, 0.6], [93.5, 33.5, 5, 2.5, 0.3], [84.5, 42, 3, 2.5, 0.4],
        [82, 25, 4, 5, 0.3], [74, 18, 5, 3.5, 0.55], [41, 19, 5, 3.5, 0.5], [58, 17.5, 15, 3, 0.45],
        [56, 36, 22, 9, -0.5]]
    },
    hare: {
      w: 97, h: 105, frac: 0.15, vital: [63, 35], base: 0.86, fur: 0.035, fx: 0.5, fy: 0.5, grass: 4, feet: [5, 78],
      parts: [
        ['M4 9C0 19-0.5 34 8 47C15 57 29 63.5 44 64C53 64.3 60 62.5 65.5 60C69.5 58 72.5 55 73.8 50C75.6 44 75.8 36 74 30C72.5 24.5 70 18 66.5 12.5C61 7.5 52 5.5 41 5C28 4.5 14 5 4 9Z', 0, 0],
        ['M69 65.5C71 71.5 79 74 86 71.5C90.5 69.5 93.5 65.5 94.5 61.5C95 58.5 93.6 56.5 90.6 55.8C86.5 55 80.5 54.2 75.5 55.5C71 56.8 68 60.5 69 65.5Z', 0.1, 0],
        ['M71.5 68C67.5 79 64.2 91 65.6 100.5C66.3 103 69.4 103 70.6 100C72.8 91 75.6 80.5 77.6 70.5Z', 0.6, 0],
        ['M74.8 69.8C72.2 81 71 93 72.8 102C73.6 104.3 76.6 104 77.4 101C78.6 92 80.2 81.5 80.8 71Z', 0.5, 0],
        ['M68 30C69.5 20 71.5 10 72.6 2.2L72.6 0L78 0L77.6 2C76.4 9 75 19 74.3 30Z', 0.45, 0, 29],
        ['M64.5 27C65.5 18 66.6 10 67.2 2.2L67.2 0L72 0L71.6 2.2C71 10 70.5 18 70.3 27Z', 0.35, 0, 27],
        ['M5 9C2.5 5 4 0.6 10 0.3L54 0C58.5 0.2 59.5 3 57 5C46 6.5 25 7.5 5 9Z', 0.4, 0],
        ['M-2.5 24C-2.5 26.8-0.3 28.6 2 28C4 27.4 5 25.5 4.5 23.5C3.8 21.2 1.6 20-0.5 20.8C-1.9 21.4-2.5 22.6-2.5 24Z', 0, 0.4]
      ],
      spots: [[84, 65.5, 2.8, 2.6, 1], [93.6, 58.5, 2.6, 2.4, 0.6], [85, 61, 7, 5, 0.3], [75, 70, 4, 3.5, 0.5],
        [71, 33, 6, 8, 0.35], [42, 11, 20, 6, 0.45], [50, 18, 8, 6, 0.3], [36, 62, 28, 20, -0.5]]
    }
  };

  // Rasterise the animal into an offscreen canvas: R = coverage, G = extra heat, B = cooler fur.
  var AC = null;
  function drawAnimal(A, fw, fh, sx, sy, tx, ty) {
    if (!AC) AC = document.createElement('canvas');
    if (AC.width !== fw) AC.width = fw;
    if (AC.height !== fh) AC.height = fh;
    var g = AC.getContext('2d', { willReadFrequently: true });
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = '#000'; g.fillRect(0, 0, fw, fh); // opaque black, so 'lighter' sums stay un-premultiplied
    g.globalCompositeOperation = 'lighter';
    g.setTransform(sx, 0, 0, sy, tx, ty);
    if (!A.p2d) A.p2d = A.parts.map(function (p) { return new Path2D(p[0]); });
    A.parts.forEach(function (p, k) {
      var c = 'rgb(255,' + Math.round(p[1] * 255) + ',' + Math.round(p[2] * 255) + ')';
      if (p[3]) { // legs: hot below, blending into the body heat at the top
        var lg = g.createLinearGradient(0, 0, 0, p[3]);
        lg.addColorStop(0.5, c); lg.addColorStop(1, 'rgb(255,0,' + Math.round(p[2] * 255) + ')');
        c = lg;
      }
      g.fillStyle = c;
      g.fill(A.p2d[k]);
    });
    if (A.fuzz) { // bushy, fluffy fringe (fox tail)
      g.lineWidth = 2.4; g.lineJoin = 'round';
      g.strokeStyle = 'rgba(255,0,255,0.3)'; g.stroke(A.p2d[A.fuzz]);
    }
    A.spots.forEach(function (q) {
      var c = q[4] > 0 ? '0,255,0,' : '0,0,255,', rg = g.createRadialGradient(0, 0, 0, 0, 0, q[2]);
      rg.addColorStop(0, 'rgba(' + c + Math.abs(q[4]) + ')'); rg.addColorStop(1, 'rgba(' + c + '0)');
      g.save(); g.translate(q[0], q[1]); g.scale(1, q[3] / q[2]);
      g.fillStyle = rg; g.beginPath(); g.arc(0, 0, q[2], 0, 6.2832); g.fill();
      g.restore();
    });
    return g.getImageData(0, 0, fw, fh).data;
  }

  function build(name, seed, W, H) {
    var A = ANIMALS[name], fw = Math.max(16, Math.round(W / 2)), fh = Math.max(16, Math.round(H / 2));
    var n = fw * fh, T = new Float32Array(n), M = new Float32Array(n);
    var r = rng(Math.imul(seed | 0, 2654435761) ^ (name.charCodeAt(0) * 7919 + name.length));
    var ox = r() * 256, oy = r() * 256, x, y, i, k;

    // Tree line: distant forest band + individual crowns (round deciduous / pointed spruce).
    var yB = fh * (0.405 + 0.02 * r());
    var base = new Float32Array(fw), top = new Float32Array(fw), toff = new Float32Array(fw);
    for (x = 0; x < fw; x++) {
      base[x] = yB + fh * 0.006 * vn(x * 10 / fw + ox, 1.5);
      top[x] = base[x] - fh * (0.05 + 0.02 * vn(x * 6 / fw + ox, 4.5));
      toff[x] = -0.04;
    }
    for (var tx = -0.05 * fw; tx < 1.05 * fw;) {
      var con = r() < 0.3, hw = fh * (con ? 0.018 + 0.014 * r() : 0.026 + 0.03 * r());
      var ht = fh * (0.075 + 0.06 * r() + (r() < 0.15 ? 0.045 : 0)), off = (r() - 0.5) * 0.07 + (con ? 0.03 : 0);
      for (x = Math.max(0, Math.ceil(tx - hw)); x <= Math.min(fw - 1, tx + hw); x++) {
        var q = (x - tx) / hw, hh = con ? ht * Math.pow(1 - Math.abs(q), 1.2) : ht * Math.sqrt(1 - q * q);
        if (base[x] - hh < top[x]) { top[x] = base[x] - hh; toff[x] = off; }
      }
      tx += hw * (0.6 + 0.8 * r());
    }
    for (x = 0; x < fw; x++) top[x] += 1.3 * vn(x * 0.8 + oy, 2.5);
    blur(toff, fw, 1, 3, 2);

    // Sky / trees / field, per pixel. Field uses a ground-plane perspective mapping.
    var yv = yB - 0.035 * fh, edge = 0.022 * fh;
    for (y = 0, i = 0; y < fh; y++) {
      var sky = 0.115 * Math.pow(y < yB ? y / yB : 1, 1.7);
      var dy = y - yv, dd = (y - yB) / (fh - yB), gv = dy > 1 ? 4 * fh / dy : 0;
      var amp = 0.025 + 0.06 * dd;
      for (x = 0; x < fw; x++, i++) {
        var g = y - base[x] + 1, v = 0;
        if (g < 1) {
          v = sky + 0.008 * vn(x * 4 / fw + ox, y * 4 / fh + oy);
          var e = y - top[x];
          if (e > -3) {
            e += 2.2 * vn(x * 0.45 + ox, y * 0.45 + oy);
            if (e > 0) {
              var tr = 0.38 + toff[x] + 0.07 * fbm(x * 0.13 + ox, y * 0.11 + oy, 3) - 0.07 * Math.exp(-e / edge) +
                0.04 * (y - top[x]) / (base[x] - top[x] + 1);
              v += (tr - v) * (e > 1.5 ? 1 : e / 1.5);
            }
          }
        }
        if (g > 0) {
          var u = 9 * (x - fw * 0.5) / dy;
          var ff = 0.27 + 0.13 * dd + amp * fbm(u + ox, gv + oy, 3) + 0.035 * vn(u * 0.15 + oy, gv * 0.15 + ox) + 0.03 * dd * vn(x * 0.7 + ox, y * 1.1 + oy);
          v = g >= 1 ? ff : v + (ff - v) * g;
        }
        T[i] = v;
      }
    }

    // Slightly warm bushes along the forest edge, away from the centre.
    function bush(bx, by, rad, temp) {
      var bl = [], nb = 4 + (r() * 3 | 0), kk, xx, yy;
      for (kk = 0; kk < nb; kk++) bl.push(bx + (r() - 0.5) * rad * 2.4, by - rad * 0.2 - r() * rad * 0.8, rad * (0.45 + 0.35 * r()));
      var x0 = Math.max(0, (bx - rad * 2.5) | 0), x1 = Math.min(fw - 1, (bx + rad * 2.5) | 0);
      var y0 = Math.max(0, (by - rad * 2.2) | 0), y1 = Math.min(fh - 1, (by + 1) | 0);
      for (yy = y0; yy <= y1; yy++) for (xx = x0; xx <= x1; xx++) {
        var a = 0;
        for (kk = 0; kk < bl.length; kk += 3) {
          var ddx = xx - bl[kk], ddy = yy - bl[kk + 1], w = 1.6 * (1 - Math.sqrt(ddx * ddx + ddy * ddy) / bl[kk + 2]);
          if (w > a) a = w;
        }
        a += 0.4 * vn(xx * 0.6 + oy, yy * 0.6 + ox);
        if (yy > by) a *= 1 - (yy - by);
        if (a > 0) { var j = yy * fw + xx; T[j] += (temp + 0.04 * fbm(xx * 0.35 + ox, yy * 0.35 + oy, 2) - T[j]) * (a > 1 ? 1 : a); }
      }
    }
    var nB = 2 + (r() * 2 | 0);
    for (k = 0; k < nB; k++) bush(fw * (0.5 + (k % 2 ? 1 : -1) * (0.2 + 0.28 * r())), yB + 0.5, fh * (0.02 + 0.016 * r()), 0.44 + 0.04 * r());

    // Animal: vital zone on the frame centre, facing left or right.
    var ref = Math.min(fw, fh * 1.3), s = A.frac * ref / A.w * (0.96 + 0.08 * r()), dir = r() < 0.5 ? 1 : -1;
    var cx = fw / 2, cy = fh / 2, gy = cy + A.vital[1] * s;
    var px = function (lx) { return cx + dir * (lx - A.vital[0]) * s; };
    var D = drawAnimal(A, fw, fh, dir * s, -s, cx - dir * A.vital[0] * s, gy);
    var bx0 = Math.max(0, Math.floor(Math.min(px(-4), px(A.w + 4))) - 3), bx1 = Math.min(fw - 1, Math.ceil(Math.max(px(-4), px(A.w + 4))) + 3);
    var by0 = Math.max(0, Math.floor(gy - (A.h + 4) * s) - 3), by1 = Math.min(fh - 1, Math.ceil(gy) + 4), gh = A.grass * s;
    for (y = by0; y <= by1; y++) for (x = bx0; x <= bx1; x++) {
      i = y * fw + x;
      var m = D[i * 4] / 255;
      if (!m) continue;
      var oc = (y + 0.5 - gy + gh * (0.45 + 0.55 * (0.5 + 0.5 * vn(x * 0.9 + ox, 7.7)))) / 1.2; // grass in front of the feet
      if (oc > 0) m *= 1 - 0.9 * (oc > 1 ? 1 : oc);
      var Ta = A.base - 0.1 + 0.4 * D[i * 4 + 1] / 255 - 0.26 * D[i * 4 + 2] / 255 + A.fur * vn(x * A.fx + ox, y * A.fy + oy);
      T[i] += (Ta - T[i]) * m; M[i] = m;
    }
    // Faint heat halo + grass warmed where it stands.
    var Hb = blur(M.slice(), fw, fh, 1, 2);
    var pcx = px((A.feet[0] + A.feet[1]) / 2), prx = (A.feet[1] - A.feet[0]) * 0.6 * s, pry = Math.max(1.2, prx * 0.12);
    for (y = by0; y <= by1; y++) for (x = bx0; x <= bx1; x++) {
      i = y * fw + x;
      var hx = (x - pcx) / prx, hy = (y - gy) / pry, hq = hx * hx + hy * hy;
      T[i] += 0.08 * (Hb[i] > M[i] ? Hb[i] - M[i] : 0) + (hq < 6 && y > yB ? 0.06 * Math.exp(-hq) * (1 - M[i]) : 0);
    }

    // Sensor: soft optics, per-pixel noise, faint column fixed-pattern noise.
    blur(T, fw, fh, 1, 2);
    var col = new Float32Array(fw);
    for (x = 0; x < fw; x++) col[x] = (r() - 0.5) * 0.012;
    for (i = 0, x = 0; i < n; i++) {
      T[i] += (r() + r() - 1) * 0.025 + col[x];
      if (++x === fw) x = 0;
    }

    // AGC: stretch 2nd..99.5th percentile (histogram).
    var lo = Infinity, hi = -Infinity, NB = 2048, hist = new Uint32Array(NB);
    for (i = 0; i < n; i++) { if (T[i] < lo) lo = T[i]; if (T[i] > hi) hi = T[i]; }
    var hk = (NB - 1) / (hi - lo || 1);
    for (i = 0; i < n; i++) hist[((T[i] - lo) * hk) | 0]++;
    function pct(p) { for (var b = 0, c = 0; b < NB; b++) { c += hist[b]; if (c >= p * n) return lo + b / hk; } return hi; }
    var p0 = pct(0.02), p1 = pct(0.995), sc = 255 / (p1 - p0 || 1);

    // Bilinear upscale to the canvas size, quantised to palette indices.
    var idx = new Uint8Array(W * H), X0 = new Int32Array(W), FX = new Float32Array(W), X, Y, o = 0;
    for (X = 0; X < W; X++) {
      var sxx = Math.max(0, (X + 0.5) * fw / W - 0.5), xi = Math.min(fw - 2, Math.floor(sxx));
      X0[X] = xi; FX[X] = Math.min(1, sxx - xi);
    }
    for (Y = 0; Y < H; Y++) {
      var syy = Math.max(0, (Y + 0.5) * fh / H - 0.5), yi = Math.min(fh - 2, Math.floor(syy)), fy = Math.min(1, syy - yi);
      var r0 = yi * fw, r1 = r0 + fw;
      for (X = 0; X < W; X++, o++) {
        var x0 = X0[X], f = FX[X], a = T[r0 + x0], c = T[r1 + x0];
        a += (T[r0 + x0 + 1] - a) * f; c += (T[r1 + x0 + 1] - c) * f;
        var qv = (a + (c - a) * fy - p0) * sc;
        idx[o] = qv <= 0 ? 0 : qv >= 255 ? 255 : (qv + 0.5) | 0;
      }
    }
    return idx;
  }

  function lut(st) {
    var o = new Uint32Array(256), k = 1;
    for (var i = 0; i < 256; i++) {
      var t = i / 255;
      while (k < st.length - 1 && t > st[k][0]) k++;
      var a = st[k - 1], b = st[k], f = Math.max(0, Math.min(1, (t - a[0]) / (b[0] - a[0])));
      o[i] = (255 << 24 | Math.round(a[3] + (b[3] - a[3]) * f) << 16 | Math.round(a[2] + (b[2] - a[2]) * f) << 8 |
        Math.round(a[1] + (b[1] - a[1]) * f)) >>> 0; // little-endian RGBA
    }
    return o;
  }
  var LUT = {
    white: lut([[0, 0, 0, 0], [1, 255, 255, 255]]),
    black: lut([[0, 255, 255, 255], [1, 0, 0, 0]]),
    red: lut([[0, 0, 0, 0], [0.875, 224, 224, 224], [0.876, 255, 172, 40], [1, 228, 24, 14]]),
    iron: lut([[0, 0, 0, 0], [0.12, 24, 6, 74], [0.28, 88, 12, 130], [0.42, 162, 22, 124], [0.56, 216, 56, 54],
      [0.7, 243, 120, 18], [0.85, 254, 196, 42], [1, 255, 250, 226]]),
    rainbow: lut([[0, 22, 18, 120], [0.25, 0, 186, 228], [0.5, 38, 204, 64], [0.75, 250, 226, 0], [1, 232, 22, 22]])
  };

  var cache = {}, cacheN = 0;
  function render(canvas, o) {
    o = o || {};
    var W = canvas.width | 0, H = canvas.height | 0;
    if (W < 2 || H < 2) return;
    var scene = ANIMALS[o.scene] ? o.scene : 'boar', seed = o.seed == null ? 1 : (+o.seed || 0);
    var key = scene + ':' + seed + ':' + W + 'x' + H, idx = cache[key];
    if (!idx) {
      if (++cacheN > 64) { cache = {}; cacheN = 1; } // ponytail: crude cap; LRU if a page ever cycles many sizes
      idx = cache[key] = build(scene, seed, W, H);
    }
    var pal = LUT[o.palette] || LUT.white, ctx = canvas.getContext('2d'), img = ctx.createImageData(W, H);
    var out = new Uint32Array(img.data.buffer);
    for (var i = 0; i < idx.length; i++) out[i] = pal[idx[i]];
    ctx.putImageData(img, 0, 0);
  }

  window.Thermal = {
    render: render,
    palettes: [{ id: 'white', name: 'Белый горячий' }, { id: 'black', name: 'Чёрный горячий' },
      { id: 'red', name: 'Красный горячий' }, { id: 'iron', name: 'Железо' }, { id: 'rainbow', name: 'Радуга' }],
    scenes: ['boar', 'deer', 'fox', 'hare']
  };
})();
