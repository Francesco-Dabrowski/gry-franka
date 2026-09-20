(function () {
  window.ZFG = window.ZFG || {};
  ZFG.games = ZFG.games || {};

  var C = 16;
  var SUB = 3;
  var WALL_TILES_H = 5;
  var WALL_H = WALL_TILES_H / SUB;

  var TEX = 32;
  var WALL_TEX_W = TEX * SUB;
  var WALL_TEX_H = TEX * WALL_TILES_H;
  var FLOOR_PPC = TEX * SUB;
  var CEIL_TEX = 64;
  var CEIL_PPC = 16;

  var RW = 320;
  var RH = 240;
  var HALF = RH / 2;
  var LEVELS = 32;
  var MAXDIST = 26;
  var LSCALE = 128 / MAXDIST;
  var PLAYER_R = 0.26;
  var FOV = 0.72;

  var EYE = WALL_H / 2;
  var EYE_MIN = WALL_H * 0.12;
  var EYE_MAX = WALL_H - 0.08;

  var LOAD_RADIUS = 2;
  var EVICT_AFTER = 60;
  var EVICT_DIST = 100;
  var EXIT_CHANCE = 0.1;
  var DARK_PERMILLE = 26;
  var FLOOR_DARK_PERMILLE = 33;

  var LAMP_TILES = 4;
  var LAMP_SUB = LAMP_TILES / SUB;
  var LAMP_W = 4;
  var LAMP_RADIUS = 3.8;
  var LAMP_GAIN = 0.92;

  var TP = 0.5;
  var SH = 0.26;
  var SHAFT_HW = 2.2;
  var CEIL_Z = 2.8;
  var EYE_ABOVE = 0.6;
  var STAIR_STEPS = 20;
  var STAIR_MAX = 34;
  var STAIR_RATE = 3.4;

  var HOLE_TILE = 6;
  var FALL_TILES = 30;
  var FALL_RATE = 8.5;
  var STAIR_SLOTS = 4;
  var PITCH_MAX = 95;
  var ABYSS_DEPTH = 44;
  var STAMINA_DRAIN = 16;
  var STAMINA_REGEN = 24;

  var DISTRICT_CHUNKS = 4;

  var DESCEND_STEPS = 20;

  var VHS_MODES = ['mocne', 'średnie', 'słabe'];
  var VHS_INTENSITY = [1, 0.62, 0.3];

  var COL = {
    bg: 0xff1a1814,
    ceil: 0xff141216,
    tread: [152, 146, 132],
    riser: [66, 62, 56],
    nosing: [198, 192, 174],
    hudFrame: [176, 176, 160],
    hudBg: [18, 18, 18],
    hudOk: [52, 190, 84],
    hudLow: [200, 40, 40],
    hudDim: [90, 90, 86],
    hudText: [220, 220, 200]
  };

  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hashInt(a, b, s) {
    var h = Math.imul(a | 0, 0x165667B1) ^ Math.imul(b | 0, 0x9E3779B1) ^ Math.imul(s | 0, 0x85EBCA6B);
    h = Math.imul(h ^ (h >>> 15), 0x2C1B3C6D);
    h ^= h >>> 12;
    h = Math.imul(h, 0x297A2D39);
    h ^= h >>> 15;
    return h >>> 0;
  }

  function hash2(x, y, s) {
    var n = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1013904223);
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    n ^= n >>> 16;
    return ((n >>> 0) % 100000) / 100000;
  }

  function valueNoise(x, y, scale, salt) {
    var fx = x / scale;
    var fy = y / scale;
    var x0 = Math.floor(fx);
    var y0 = Math.floor(fy);
    var tx = fx - x0;
    var ty = fy - y0;
    var sx = tx * tx * (3 - 2 * tx);
    var sy = ty * ty * (3 - 2 * ty);
    var a = hash2(x0, y0, salt);
    var b = hash2(x0 + 1, y0, salt);
    var c = hash2(x0, y0 + 1, salt);
    var d = hash2(x0 + 1, y0 + 1, salt);
    var ab = a + (b - a) * sx;
    var cd = c + (d - c) * sx;
    return ab + (cd - ab) * sy;
  }

  function byte(v) {
    return v < 0 ? 0 : (v > 255 ? 255 : v | 0);
  }

  function clamp(v, a, b) {
    return v < a ? a : (v > b ? b : v);
  }

  function fmtClock(sec) {
    sec = Math.max(0, Math.floor(sec));
    var m = Math.floor(sec / 60);
    var s = sec % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function fmtHMS(sec) {
    sec = Math.max(0, Math.floor(sec));
    var h = Math.floor(sec / 3600);
    var m = Math.floor((sec % 3600) / 60);
    var s = sec % 60;
    return h + ':' + (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  function chunkIsDark(cx, cy) {
    return (hashInt(cx, cy, 0x0DA9) % 1000) < DARK_PERMILLE;
  }

  function darkFieldAt(x, y) {
    var fx = x / C;
    var fy = y / C;
    var x0 = Math.floor(fx);
    var y0 = Math.floor(fy);
    var tx = fx - x0;
    var ty = fy - y0;
    var s = tx * tx * (3 - 2 * tx);
    var t = ty * ty * (3 - 2 * ty);
    var d00 = chunkIsDark(x0, y0) ? 1 : 0;
    var d10 = chunkIsDark(x0 + 1, y0) ? 1 : 0;
    var d01 = chunkIsDark(x0, y0 + 1) ? 1 : 0;
    var d11 = chunkIsDark(x0 + 1, y0 + 1) ? 1 : 0;
    var a = d00 + (d10 - d00) * s;
    var b = d01 + (d11 - d01) * s;
    return a + (b - a) * t;
  }

  function lampLightAt(x, y) {
    var gx = Math.round((x - 0.5) / LAMP_W) * LAMP_W + 0.5;
    var gy = Math.round((y - 0.5) / LAMP_W) * LAMP_W + 0.5;
    var dx = x - gx;
    var dy = y - gy;
    var d = Math.sqrt(dx * dx + dy * dy);
    if (d >= LAMP_RADIUS) return 0;
    var t = 1 - d / LAMP_RADIUS;
    return t * t * (3 - 2 * t);
  }

  function bloodAt(txi, tyi) {
    return (hashInt(txi, tyi, 0x0B100D) % 1000000) < 330;
  }

  function floorVariantAt(txi, tyi) {
    if ((hashInt(txi, tyi, 0x0DA9) % 10000) < 70) {
      return 4 + (hashInt(txi, tyi, 0x0D2) % 2);
    }
    return hashInt(txi, tyi, 0x0F11) & 3;
  }

  function wallBloodVariantAt() {
    return 0;
  }

  // ---------- textures ----------

  function makeTexture(w, h, painter) {
    var canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    var ctx = canvas.getContext('2d');
    var img = ctx.createImageData(w, h);
    var d = img.data;
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        var c = painter(x, y, w, h);
        var i = (y * w + x) * 4;
        d[i] = c[0];
        d[i + 1] = c[1];
        d[i + 2] = c[2];
        d[i + 3] = c[3] === undefined ? 255 : c[3];
      }
    }
    ctx.putImageData(img, 0, 0);
    return { w: w, h: h, data: new Uint32Array(img.data.buffer) };
  }

  function rotateTexture(tex, rot) {
    if (!rot) return tex;
    var s = tex.w;
    var out = new Uint32Array(tex.data.length);
    for (var y = 0; y < s; y++) {
      for (var x = 0; x < s; x++) {
        var sx, sy;
        if (rot === 1) { sx = y; sy = s - 1 - x; }
        else if (rot === 2) { sx = s - 1 - x; sy = s - 1 - y; }
        else { sx = s - 1 - y; sy = x; }
        out[y * s + x] = tex.data[sy * s + sx];
      }
    }
    return { w: s, h: s, data: out };
  }

  function buildShades(tex, ambient) {
    var out = [];
    for (var l = 0; l < LEVELS; l++) {
      var f = ambient + (1 - ambient) * (l / (LEVELS - 1));
      var arr = new Uint32Array(tex.data.length);
      for (var i = 0; i < tex.data.length; i++) {
        var p = tex.data[i];
        var a = (p >>> 24) & 255;
        var b = (p >>> 16) & 255;
        var g = (p >>> 8) & 255;
        var r = p & 255;
        arr[i] = ((a << 24) | (byte(b * f) << 16) | (byte(g * f) << 8) | byte(r * f)) >>> 0;
      }
      out.push(arr);
    }
    return out;
  }

  function paintWallpaper(x, y) {
    var grain = hash2(x, y, 1) - 0.5;
    var mottA = valueNoise(x, y, 9, 3) - 0.5;
    var mottB = valueNoise(x, y, 3, 9) - 0.5;
    var f = 1 + grain * 0.045 + mottA * 0.08 + mottB * 0.035;
    if (y < 2) f *= 0.95;
    if (y > WALL_TEX_H - 9) f *= 0.85;
    return [byte(217 * f), byte(201 * f), byte(133 * f), 255];
  }

  function makeWallBloodPainter(v) {
    var col = v % SUB;
    var row = 1 + (v % 2);
    var cx = col * TEX + 15 + ((v * 5) % 5) - 2;
    var cy = row * TEX + 15 + ((v * 3) % 5) - 2;
    return function (x, y) {
      var base = paintWallpaper(x, y);
      var r = base[0];
      var g = base[1];
      var b = base[2];
      var dx = x - cx;
      var dy = y - cy;
      var d = Math.sqrt(dx * dx + dy * dy);
      var wob = Math.sin(x * 0.8 + v * 1.3) * 2.0 + Math.cos(y * 0.7 + v * 2.1) * 2.0;
      var rad = 8 + wob * 0.5;
      var m = 1 - d / rad;
      if (m > 0) {
        m = Math.min(1, m * 1.2);
        var t = 0.5 + m * 0.5;
        r = r * (1 - t) + 116 * t;
        g = g * (1 - t) + 14 * t;
        b = b * (1 - t) + 16 * t;
        if (m > 0.5) { r *= 0.82; g *= 0.82; b *= 0.82; }
      }
      if (y > cy && y < cy + rad + 9 && Math.abs(x - cx) < 2.2) {
        var t2 = 0.55;
        r = r * (1 - t2) + 96 * t2;
        g = g * (1 - t2) + 10 * t2;
        b = b * (1 - t2) + 12 * t2;
      }
      return [byte(r), byte(g), byte(b), 255];
    };
  }

  function paintConcrete(x, y) {
    var grain = hash2(x, y, 41) - 0.5;
    var mott = valueNoise(x, y, 11, 43) - 0.5;
    var f = 1 + grain * 0.1 + mott * 0.15;
    if (y < 3) f *= 0.94;
    if (y > WALL_TEX_H - 4) f *= 0.9;
    return [byte(172 * f), byte(161 * f), byte(118 * f), 255];
  }

  function paintCeiling(x, y) {
    var tile = 16;
    var gx = x % tile;
    var gy = y % tile;
    var tx = (x / tile) | 0;
    var ty = (y / tile) | 0;
    var r, g, b;
    var isLamp = tx === 0 && ty === 0;
    if (gx === 0 || gy === 0) {
      r = 168; g = 161; b = 126;
    } else if (isLamp && gx >= 3 && gx <= tile - 4 && gy >= 3 && gy <= tile - 4) {
      r = 252; g = 248; b = 220;
    } else if (isLamp) {
      r = 230; g = 224; b = 188;
    } else {
      r = 208; g = 200; b = 158;
    }
    var n = hash2(x, y, 7);
    var f = 1 + (n - 0.5) * 0.05;
    return [byte(r * f), byte(g * f), byte(b * f), 255];
  }

  function paintFloorPlain(x, y) {
    var n = hash2(x, y, 11);
    var f = 1 + (n - 0.5) * 0.22;
    if ((x * 3 + y * 5) % 7 === 0) f *= 0.93;
    return [byte(150 * f), byte(138 * f), byte(88 * f), 255];
  }

  function makeDampPainter(v) {
    var cx = 15.5 + Math.sin(v * 2.1) * 3.5;
    var cy = 15.5 + Math.cos(v * 1.7) * 3.5;
    return function (x, y) {
      var n = hash2(x, y, 11);
      var f = 1 + (n - 0.5) * 0.22;
      if ((x * 3 + y * 5) % 7 === 0) f *= 0.93;
      var r = 150 * f;
      var g = 138 * f;
      var b = 88 * f;
      var dx = x - cx;
      var dy = y - cy;
      var d = Math.sqrt(dx * dx + dy * dy);
      var wob = Math.sin(x * 0.5 + v) * 1.8 + Math.cos(y * 0.45 + v * 2) * 1.8;
      var rad = 13 + wob * 0.6;
      var m = 1 - d / rad;
      if (m > 0) {
        m = m * m * (3 - 2 * m);
        var s = 0.11 * m;
        r *= (1 - s);
        g *= (1 - s * 0.85);
        b *= (1 - s * 0.5);
      }
      return [byte(r), byte(g), byte(b), 255];
    };
  }

  function makeBloodPainter(v) {
    var cx = 16 + Math.sin(v * 3.1) * 5;
    var cy = 16 + Math.cos(v * 2.3) * 5;
    return function (x, y) {
      var n = hash2(x, y, 11);
      var f = 1 + (n - 0.5) * 0.22;
      if ((x * 3 + y * 5) % 7 === 0) f *= 0.93;
      var r = 150 * f;
      var g = 138 * f;
      var b = 88 * f;
      var dx = x - cx;
      var dy = y - cy;
      var d = Math.sqrt(dx * dx + dy * dy);
      var wob = Math.sin(x * 0.9 + v) * 1.3 + Math.cos(y * 0.8 + v * 1.7) * 1.3;
      var rad = 7.6 + wob * 0.6;
      var m = 1 - d / rad;
      if (m > 0) {
        m = Math.min(1, m * 1.15);
        var t = 0.55 + m * 0.45;
        r = r * (1 - t) + 118 * t;
        g = g * (1 - t) + 14 * t;
        b = b * (1 - t) + 16 * t;
        if (m > 0.55) { r *= 0.8; g *= 0.8; b *= 0.8; }
      }
      return [byte(r), byte(g), byte(b), 255];
    };
  }

  function paintStairTop(x, y) {
    var n = hash2(x, y, 71);
    var f = 1 + (n - 0.5) * 0.18;
    var v = (y / TEX) * 4;
    var band = v | 0;
    f *= 1 - band * 0.16;
    if ((v % 1) < 0.2) f *= 1.4;
    if (x < 2 || x > TEX - 3) f *= 0.7;
    return [byte(126 * f), byte(120 * f), byte(108 * f), 255];
  }

  function paintShaftWall(x, y) {
    var grain = hash2(x, y, 91) - 0.5;
    var mott = valueNoise(x, y, 7, 93) - 0.5;
    var f = 1 + grain * 0.12 + mott * 0.16;
    return [byte(114 * f), byte(110 * f), byte(103 * f), 255];
  }

  // ---------- chunk helpers ----------

  function carveRect(tiles, x, y, w, h, val) {
    for (var yy = y; yy < y + h; yy++) {
      if (yy < 0 || yy >= C) continue;
      for (var xx = x; xx < x + w; xx++) {
        if (xx < 0 || xx >= C) continue;
        tiles[yy * C + xx] = val;
      }
    }
  }

  function carveH(tiles, x0, x1, y) {
    var a = x0 < x1 ? x0 : x1;
    var b = x0 < x1 ? x1 : x0;
    for (var x = a; x <= b; x++) {
      if (x >= 0 && x < C && y >= 0 && y < C) tiles[y * C + x] = 0;
    }
  }

  function carveV(tiles, y0, y1, x) {
    var a = y0 < y1 ? y0 : y1;
    var b = y0 < y1 ? y1 : y0;
    for (var y = a; y <= b; y++) {
      if (x >= 0 && x < C && y >= 0 && y < C) tiles[y * C + x] = 0;
    }
  }

  function connectCells(tiles, x0, y0, x1, y1) {
    carveH(tiles, x0, x1, y0);
    carveV(tiles, y0, y1, x1);
  }

  function verticalPassages(cx, cy) {
    var r = mulberry32(hashInt(cx, cy, 0x51AB));
    var p1 = 2 + ((r() * (C - 4)) | 0);
    var p2 = 2 + ((r() * (C - 4)) | 0);
    if (p2 === p1) p2 = 2 + ((p1 - 2 + 6) % (C - 4));
    return [p1, p2];
  }

  function horizontalPassages(cx, cy) {
    var r = mulberry32(hashInt(cx, cy, 0x77CD));
    var p1 = 2 + ((r() * (C - 4)) | 0);
    var p2 = 2 + ((r() * (C - 4)) | 0);
    if (p2 === p1) p2 = 2 + ((p1 - 2 + 6) % (C - 4));
    return [p1, p2];
  }

  function pack(r, g, b) {
    return ((255 << 24) | (byte(b) << 16) | (byte(g) << 8) | byte(r)) >>> 0;
  }

  // --- struktury (rzut z gory), 1 znak = 3x3 male tile ---
  // '0' = podloga, '1' = sciana, 'x' = dziura w dol,
  // '.' = puste — traktowane jak podloga (przestrzen miedzy strukturami)
  var STRUCTURES = [
    {
      name: 'Przykład — filary',
      cols: 5,
      rows: 5,
      rarity: 5,
      repeat: 5,
      data: [
        '00000',
        '00100',
        '01110',
        '00100',
        '00000'
      ]
    }
  ];

  function structureChar(ch) {
    if (ch === '1') return 1;
    if (ch === 'x' || ch === 'X') return HOLE_TILE;
    return 0;
  }

  class Backrooms extends ZFG.Game {
    constructor(container, opts) {
      super(container, opts);
      this.id = 'backrooms';
      this.keys = {};
      this.raf = 0;
      this.locked = false;
      this.dead = false;
      this.soundOn = true;
      this.audio = null;
      this.vhsLevel = 0;
      this.vhsIntensity = VHS_INTENSITY[0];
      this.time = 0;
      this.sens = 0.0022;
      this.sensPitch = 1.35;
      this.pitchPx = 0;
      this.skipMouse = false;
      this.dragging = false;
      this.started = false;
    }

    init() {
      this._loop = this.loop.bind(this);
      this._onKeyDown = this.onKeyDown.bind(this);
      this._onKeyUp = this.onKeyUp.bind(this);
      this._onMouseMove = this.onMouseMove.bind(this);
      this._onMouseDown = this.onMouseDown.bind(this);
      this._onMouseUp = this.onMouseUp.bind(this);
      this._onLockChange = this.onLockChange.bind(this);
      this._onCanvasClick = this.onCanvasClick.bind(this);
      this._onFsChange = this.onFsChange.bind(this);

      this.buildDom();
      this.buildAssets();
      this.reset();

      document.addEventListener('keydown', this._onKeyDown);
      document.addEventListener('keyup', this._onKeyUp);
      document.addEventListener('mousemove', this._onMouseMove);
      document.addEventListener('mousedown', this._onMouseDown);
      document.addEventListener('mouseup', this._onMouseUp);
      document.addEventListener('pointerlockchange', this._onLockChange);
      document.addEventListener('fullscreenchange', this._onFsChange);
      document.addEventListener('webkitfullscreenchange', this._onFsChange);
    }

    // ---------- DOM ----------

    buildDom() {
      var self = this;
      this.container.classList.add('game-stage--screen');

      this.shell = document.createElement('div');
      this.shell.className = 'vhs-shell vhs-shell--unlocked';

      this.frame = document.createElement('div');
      this.frame.className = 'vhs-frame';

      this.canvas = document.createElement('canvas');
      this.canvas.className = 'vhs-canvas';
      this.canvas.width = RW;
      this.canvas.height = RH;

      this.fx = document.createElement('div');
      this.fx.className = 'vhs-fx';

      this.cross = document.createElement('div');
      this.cross.className = 'vhs-crosshair hidden';

      this.osd = document.createElement('div');
      this.osd.className = 'vhs-osd';
      this.osd.innerHTML =
        '<div class="vhs-osd__row">' +
          '<span class="vhs-rec"><i></i>REC</span>' +
          '<span class="vhs-osd__date"></span>' +
        '</div>' +
        '<div class="vhs-osd__row">' +
          '<span class="vhs-osd__play">&#9654; PLAY&nbsp;&nbsp;SP</span>' +
          '<span class="vhs-osd__time">0:00:00</span>' +
        '</div>';

      this.osdDate = this.osd.querySelector('.vhs-osd__date');
      this.osdTime = this.osd.querySelector('.vhs-osd__time');

      this.hint = document.createElement('div');
      this.hint.className = 'vhs-hint';

      this.startScreen = document.createElement('div');
      this.startScreen.className = 'br-start';
      this.startScreen.innerHTML =
        '<div class="br-start__inner">' +
          '<p class="br-start__kicker">Level 0</p>' +
          '<h1 class="br-start__title">The Backrooms</h1>' +
          '<p class="br-start__goal">Cel: znajdź <b>schody w dół</b> i wydostań się z Backrooms. ' +
            'Uważaj na <b>dziury w podłodze</b> &mdash; są nieskończenie głębokie.</p>' +
          '<ul class="br-start__keys">' +
            '<li><b>WSAD</b><span>ruch</span></li>' +
            '<li><b>Mysz</b><span>rozglądanie</span></li>' +
            '<li><b>Spacja</b><span>skok</span></li>' +
            '<li><b>Shift</b><span>sprint (tylko do przodu)</span></li>' +
            '<li><b>Esc</b><span>pauza</span></li>' +
            '<li><b>F11</b><span>pełny ekran</span></li>' +
          '</ul>' +
          '<button class="br-start__btn" type="button" data-act="start">Wejdź</button>' +
        '</div>';
      this.startScreen.addEventListener('click', function (event) {
        var btn = event.target.closest('[data-act]');
        if (!btn) return;
        self.beginRun();
      });

      this.endScreen = document.createElement('div');
      this.endScreen.className = 'br-ending hidden';
      this.endScreen.innerHTML =
        '<div class="br-ending__inner">' +
          '<p class="br-ending__kicker">Level 0 &mdash; Terminated</p>' +
          '<h1 class="br-ending__title">You escaped the Backrooms</h1>' +
          '<p class="br-ending__text">The fluorescent hum fades away. The stained carpet ends. ' +
            'For the first time in hours the air is silent &mdash; and it is over.</p>' +
          '<p class="br-ending__stats"></p>' +
          '<div class="br-ending__actions">' +
            '<button class="br-ending__btn" type="button" data-act="again">Descend again</button>' +
            '<button class="br-ending__btn" type="button" data-act="menu">Main menu</button>' +
          '</div>' +
        '</div>';
      this.endKicker = this.endScreen.querySelector('.br-ending__kicker');
      this.endTitle = this.endScreen.querySelector('.br-ending__title');
      this.endText = this.endScreen.querySelector('.br-ending__text');
      this.endStats = this.endScreen.querySelector('.br-ending__stats');
      this.endScreen.addEventListener('click', function (event) {
        var btn = event.target.closest('[data-act]');
        if (!btn) return;
        if (btn.getAttribute('data-act') === 'again') self.newGame();
        else window.location.href = '../../index.html';
      });

      this.frame.appendChild(this.canvas);
      this.frame.appendChild(this.cross);
      this.frame.appendChild(this.fx);
      this.frame.appendChild(this.osd);
      this.frame.appendChild(this.startScreen);
      this.frame.appendChild(this.endScreen);
      this.frame.appendChild(this.hint);
      this.shell.appendChild(this.frame);
      this.container.appendChild(this.shell);

      this.canvas.addEventListener('click', this._onCanvasClick);
      this.canvas.addEventListener('contextmenu', function (event) { event.preventDefault(); });
    }

    buildAssets() {
      this.ctx = this.canvas.getContext('2d');
      this.imageData = this.ctx.createImageData(RW, RH);
      this.view = new Uint32Array(this.imageData.data.buffer);
      this.screen = new Uint32Array(RW * RH);
      this.prev = new Uint32Array(RW * RH);
      this.zBuf = new Float32Array(RW);
      this.dbuf = new Float32Array(RW * RH);

      this.texWall = makeTexture(WALL_TEX_W, WALL_TEX_H, paintWallpaper);
      this.texConcrete = makeTexture(WALL_TEX_W, WALL_TEX_H, paintConcrete);
      this.wallBloodTex = [];
      for (var wv = 0; wv < 3; wv++) {
        this.wallBloodTex.push(makeTexture(WALL_TEX_W, WALL_TEX_H, makeWallBloodPainter(wv)));
      }
      this.texCeil = makeTexture(CEIL_TEX, CEIL_TEX, paintCeiling);
      this.texStairTop = makeTexture(TEX, TEX, paintStairTop);
      this.texShaft = makeTexture(TEX, TEX, paintShaftWall);

      this.wallShades = buildShades(this.texWall, 0.24);
      this.concreteShades = buildShades(this.texConcrete, 0.26);
      this.wallBloodShades = [];
      for (var ws2 = 0; ws2 < 3; ws2++) {
        this.wallBloodShades.push(buildShades(this.wallBloodTex[ws2], 0.24));
      }
      this.ceilShades = buildShades(this.texCeil, 0.28);
      this.stairTopShades = buildShades(this.texStairTop, 0.4);
      this.shaftShades = buildShades(this.texShaft, 0.28);

      this.floorTables = [];
      var plain = makeTexture(TEX, TEX, paintFloorPlain);
      for (var r = 0; r < 4; r++) {
        this.floorTables.push(buildShades(rotateTexture(plain, r), 0.28));
      }
      for (var dv = 0; dv < 2; dv++) {
        this.floorTables.push(buildShades(makeTexture(TEX, TEX, makeDampPainter(dv)), 0.28));
      }

      this.noise = new Uint8Array(65536);
      for (var i = 0; i < this.noise.length; i++) this.noise[i] = (Math.random() * 256) | 0;
      this.noiseOff = 0;

      this.vignette = new Float32Array(RW * RH);
      for (var y = 0; y < RH; y++) {
        for (var x = 0; x < RW; x++) {
          var nx = (x / (RW - 1)) * 2 - 1;
          var ny = (y / (RH - 1)) * 2 - 1;
          var d = Math.sqrt(nx * nx * 0.9 + ny * ny * 0.8);
          this.vignette[y * RW + x] = 1 - 0.42 * Math.min(1, Math.pow(d, 1.7));
        }
      }

      this.lvA = new Uint8Array(129);
      this.lvB = new Uint8Array(129);
      this.lvC = new Uint8Array(129);
      this.lvAD = new Uint8Array(129);
      this.lvBD = new Uint8Array(129);
      this.lvCD = new Uint8Array(129);
      this.lvE = new Uint8Array(129);
      this.lvZ = new Uint8Array(129);

      this.tcX = new Int32Array(32768);
      this.tcY = new Int32Array(32768);
      this.tcV = new Uint8Array(32768);
      this.tcD = new Uint8Array(32768);
      this.tcH = new Uint8Array(32768);
      this.tcS = new Uint8Array(32768);
      this.tcL = new Uint8Array(32768);
      this.tcF = new Uint8Array(32768);
      this.tcX.fill(0x7fffffff);
      this.tcY.fill(0x7fffffff);

      this.dcX = new Int32Array(8192);
      this.dcY = new Int32Array(8192);
      this.dcV = new Uint8Array(8192);
      this.dcL = new Uint8Array(8192);
      this.dcX.fill(0x7fffffff);
      this.dcY.fill(0x7fffffff);

      this.lampDist = new Float32Array(129);
      for (var ld = 0; ld <= 128; ld++) {
        var ldd = ld * MAXDIST / 128;
        this.lampDist[ld] = 1 / (1 + ldd * ldd * 0.022);
      }
    }

    // ---------- world ----------

    reset() {
      this.chunks = new Map();
      this.worldSeed = (Math.random() * 4294967296) >>> 0;
      this.time = 0;
      this.exitsNear = [];
      this.signalBars = 0;
      this.signalTimer = 0;
      this.lampBuzz = 0;

      var spawn = this.findSpawn();
      this.px = spawn.x;
      this.py = spawn.y;
      this.ang = spawn.a;
      this.camZ = EYE;
      this.pitchPx = 0;
      this.zVel = 0;
      this.onGround = true;
      this.bob = 0;
      this.bobPhase = 0;
      this.stamina = 100;
      this.fade = 0;
      this.cutDark = 0;
      this.fadingOut = false;
      this.descending = false;
      this.descendMode = 'stairs';
      this.endKind = 'win';
      this.stairK = 0;
      this.stairS = 0;
      this.fallK = 0;
      this.stairEye = EYE_ABOVE;
      this.endingShown = false;

      this.flicker = 1;
      this.flickerPhase = 0;
      this.glitch = 0;
      this.bandY = -30;
      this.noiseOff = 0;
      this.lastHud = 0;
      this.dead = false;
      this.stepDist = 0;
      this.signalText = '—';

      this.tcX.fill(0x7fffffff);
      this.tcY.fill(0x7fffffff);
      this.dcX.fill(0x7fffffff);
      this.dcY.fill(0x7fffffff);

      this.recStart = new Date();

      this.hideEndScreen();
    }

    findSpawn() {
      this.chunks = this.chunks || new Map();
      var best = null;
      for (var r = 0; r <= 12 && !best; r++) {
        var steps = r === 0 ? 1 : Math.max(8, r * 8);
        for (var a = 0; a < steps; a++) {
          var th = (a / steps) * Math.PI * 2;
          var x = C / 2 + Math.cos(th) * r;
          var y = C / 2 + Math.sin(th) * r;
          if (this.standable(x, y) && this.standable(x + 0.3, y) && this.standable(x - 0.3, y) &&
              this.standable(x, y + 0.3) && this.standable(x, y - 0.3)) {
            best = { x: x, y: y };
            break;
          }
        }
      }
      if (!best) best = { x: C / 2 + 0.5, y: C / 2 + 0.5 };

      var bestAng = 0;
      var bestLen = -1;
      for (var i = 0; i < 24; i++) {
        var ang = (i / 24) * Math.PI * 2;
        var cx = Math.cos(ang);
        var cy = Math.sin(ang);
        var len = 0;
        for (var t = 0.3; t < 14; t += 0.3) {
          if (!this.standable(best.x + cx * t, best.y + cy * t)) break;
          len = t;
        }
        if (len > bestLen) {
          bestLen = len;
          bestAng = ang;
        }
      }
      return { x: best.x, y: best.y, a: bestAng };
    }

    tileAt(x, y) {
      var cx = Math.floor(x / C);
      var cy = Math.floor(y / C);
      var ch = this.getChunk(cx, cy);
      var lx = Math.floor(x) - cx * C;
      var ly = Math.floor(y) - cy * C;
      return ch.tiles[ly * C + lx];
    }

    getChunk(cx, cy) {
      var key = cx + ',' + cy;
      var ch = this.chunks.get(key);
      if (!ch) {
        ch = this.generateChunk(cx, cy);
        this.chunks.set(key, ch);
      }
      ch.lastSeen = this.time;
      return ch;
    }

    pickStructure(sx, sy) {
      var list = STRUCTURES;
      var total = 0;
      var i;
      for (i = 0; i < list.length; i++) total += (list[i].rarity || 1);
      var v = hashInt(sx, sy, (this.worldSeed ^ 0x5A17) >>> 0) % 1000000;
      var pick = (v / 1000000) * total;
      var acc = 0;
      for (i = 0; i < list.length; i++) {
        acc += (list[i].rarity || 1);
        if (pick < acc) return list[i];
      }
      return list[list.length - 1];
    }

    structureTileAt(wx, wy) {
      var list = STRUCTURES;
      if (!list.length) return 0;
      var st = list[0];
      var sw = st.cols * 3;
      var sh = st.rows * 3;
      var sx = Math.floor(wx / sw);
      var sy = Math.floor(wy / sh);
      if (list.length > 1) st = this.pickStructure(sx, sy);
      var lx = wx - sx * sw;
      var ly = wy - sy * sh;
      var cx = Math.floor(lx / 3);
      var cy = Math.floor(ly / 3);
      var row = st.data[cy];
      if (!row) return 0;
      return structureChar(row.charAt(cx));
    }

    generateChunk(cx, cy) {
      var tiles = new Uint8Array(C * C);
      tiles.fill(1);
      var rng = mulberry32(hashInt(cx, cy, (this.worldSeed ^ 0x51A7) >>> 0) >>> 0);
      var baseX = cx * C;
      var baseY = cy * C;
      var x, y;

      for (y = 0; y < C; y++) {
        for (x = 0; x < C; x++) {
          tiles[y * C + x] = this.structureTileAt(baseX + x, baseY + y);
        }
      }

      var stair = null;
      if (rng() < EXIT_CHANCE) {
        var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
        for (var t2 = 0; t2 < 80 && !stair; t2++) {
          var wx = 1 + ((rng() * (C - 2)) | 0);
          var wy = 1 + ((rng() * (C - 2)) | 0);
          if (tiles[wy * C + wx] !== 1) continue;
          for (var d2 = 0; d2 < 4; d2++) {
            var nx2 = wx + dirs[d2][0];
            var ny2 = wy + dirs[d2][1];
            if (nx2 < 0 || ny2 < 0 || nx2 >= C || ny2 >= C) continue;
            if (tiles[ny2 * C + nx2] !== 0) continue;
            var bx = wx - dirs[d2][0];
            var by = wy - dirs[d2][1];
            if (bx >= 0 && by >= 0 && bx < C && by < C && tiles[by * C + bx] !== 1) continue;
            tiles[wy * C + wx] = 5;
            for (var oy2 = -1; oy2 <= 1; oy2++) {
              for (var ox2 = -1; ox2 <= 1; ox2++) {
                var ax = wx + ox2;
                var ay = wy + oy2;
                if (ax < 0 || ay < 0 || ax >= C || ay >= C) continue;
                var tv = tiles[ay * C + ax];
                if (tv === 1 || tv === HOLE_TILE) tiles[ay * C + ax] = 1;
              }
            }
            stair = { ex: wx, ey: wy, dx: -dirs[d2][0], dy: -dirs[d2][1] };
            break;
          }
        }
      }

      return {
        tiles: tiles,
        lastSeen: this.time,
        hasStair: !!stair,
        stair: stair,
        cx: cx,
        cy: cy
      };
    }

    standable(x, y) {
      return this.tileAt(x, y) === 0;
    }

    walkable(x, y) {
      var t = this.tileAt(x, y);
      return t === 0 || t === 5 || t === HOLE_TILE;
    }

    free(x, y) {
      var r = PLAYER_R;
      return this.walkable(x - r, y - r) && this.walkable(x + r, y - r) &&
        this.walkable(x - r, y + r) && this.walkable(x + r, y + r);
    }

    manageChunks() {
      var pcx = Math.floor(this.px / C);
      var pcy = Math.floor(this.py / C);
      for (var dx = -LOAD_RADIUS; dx <= LOAD_RADIUS; dx++) {
        for (var dy = -LOAD_RADIUS; dy <= LOAD_RADIUS; dy++) {
          this.getChunk(pcx + dx, pcy + dy);
        }
      }

      var self = this;
      this.chunks.forEach(function (ch, key) {
        var ccx = ch.cx * C + C / 2;
        var ccy = ch.cy * C + C / 2;
        var dist = Math.abs(ccx - self.px) + Math.abs(ccy - self.py);
        if (dist > EVICT_DIST && self.time - ch.lastSeen > EVICT_AFTER) {
          self.chunks.delete(key);
        }
      });
    }

    updateSignal() {
      var self = this;
      var list = this.exitsNear;
      list.length = 0;
      var nearest = Infinity;
      this.chunks.forEach(function (ch) {
        if (!ch.hasStair || !ch.stair) return;
        var wx = (ch.cx * C + ch.stair.ex) + 0.5;
        var wy = (ch.cy * C + ch.stair.ey) + 0.5;
        var d = Math.sqrt(Math.pow(wx - self.px, 2) + Math.pow(wy - self.py, 2));
        if (d < 70) list.push({ x: wx, y: wy, cx: ch.cx * C + ch.stair.ex, cy: ch.cy * C + ch.stair.ey });
        if (d < nearest) nearest = d;
      });
      if (nearest === Infinity) {
        this.signalBars = 0;
      } else {
        this.signalBars = clamp(6 - Math.round(nearest / 9), 0, 6);
      }
    }

    // ---------- lifecycle ----------

    _start() {
      this.dead = false;
      this.startLoop();
      this.manageChunks();
      this.updateSignal();
    }

    _stop() {
      this.cancelLoop();
      if (document.pointerLockElement) document.exitPointerLock();
      if (this.audio) this.audio.stopAll();
      this.audio = null;
      this.shell.classList.add('vhs-shell--unlocked');
      this.cross.classList.add('hidden');
    }

    _pause() {
      this.cancelLoop();
      if (document.pointerLockElement) document.exitPointerLock();
      this.shell.classList.add('vhs-shell--unlocked');
      this.cross.classList.add('hidden');
      this.setHint('Pauza', true);
      var self = this;
      this.showOverlay({
        title: 'Pauza',
        text: 'Taśma zatrzymana.',
        actions: [
          { label: 'Wznów', primary: true, onClick: function () { self.hideOverlay(); self.resume(); self.requestLock(); } },
          { label: 'Nowa gra', onClick: function () { self.newGame(); } },
          { label: 'Menu', onClick: function () { window.location.href = '../../index.html'; } }
        ]
      });
    }

    _resume() {
      this.dead = false;
      this.startLoop();
      this.setHint(this.locked ? '' : 'Kliknij obraz, aby przejąć mysz', !this.locked);
    }

    _destroy() {
      this.cancelLoop();
      document.removeEventListener('keydown', this._onKeyDown);
      document.removeEventListener('keyup', this._onKeyUp);
      document.removeEventListener('mousemove', this._onMouseMove);
      document.removeEventListener('mousedown', this._onMouseDown);
      document.removeEventListener('mouseup', this._onMouseUp);
      document.removeEventListener('pointerlockchange', this._onLockChange);
      document.removeEventListener('fullscreenchange', this._onFsChange);
      document.removeEventListener('webkitfullscreenchange', this._onFsChange);
      if (this.audio) this.audio.stopAll();
      this.audio = null;
      if (this.shell && this.shell.parentNode) this.shell.parentNode.removeChild(this.shell);
    }

    newGame() {
      this.paused = false;
      this.reset();
      this.hideOverlay();
      this.cross.classList.add('hidden');
      this.shell.classList.add('vhs-shell--unlocked');
      this.started = false;
      this.showStart();
      this.manageChunks();
      this.updateSignal();
      if (!this.running) {
        this.start();
      } else {
        this.lastTime = performance.now();
        if (!this.raf) this.startLoop();
      }
    }

    showStart() {
      if (this.startScreen) this.startScreen.classList.remove('hidden');
    }

    hideStart() {
      if (this.startScreen) this.startScreen.classList.add('hidden');
    }

    beginRun() {
      this.started = true;
      this.hideStart();
      this.time = 0;
      this.recStart = new Date();
      this.ensureAudio();
      if (this.audio) this.audio.resume();
      this.setHint('WSAD ruch, Spacja skok, Shift sprint, F11 pełny ekran', true);
      this.requestLock();
      var self = this;
      setTimeout(function () { if (self.started && self.locked) self.setHint('', false); }, 2500);
    }

    startLoop() {
      if (this.raf) return;
      this.lastTime = performance.now();
      this.raf = requestAnimationFrame(this._loop);
    }

    cancelLoop() {
      if (this.raf) {
        cancelAnimationFrame(this.raf);
        this.raf = 0;
      }
    }

    hideEndScreen() {
      if (!this.endScreen) return;
      this.endScreen.classList.add('hidden');
      this.endScreen.classList.remove('is-visible');
    }

    toggleFullscreen() {
      var d = document;
      var el = this.shell;
      var fsEl = d.fullscreenElement || d.webkitFullscreenElement;
      try {
        if (fsEl) {
          if (d.exitFullscreen) d.exitFullscreen();
          else if (d.webkitExitFullscreen) d.webkitExitFullscreen();
        } else {
          var p = el.requestFullscreen ? el.requestFullscreen() : el.webkitRequestFullscreen();
          if (p && p.catch) p.catch(function () {});
        }
      } catch (e) { /* ignore */ }
      return !fsEl;
    }

    onFsChange() {
      this.updateHud();
    }

    // ---------- input ----------

    onCanvasClick() {
      if (this.overlay && !this.overlay.classList.contains('hidden')) return;
      if (this.endingShown || !this.started) return;
      this.ensureAudio();
      if (this.audio) this.audio.resume();
      this.requestLock();
    }

    requestLock() {
      if (this.paused || this.dead || this.endingShown || !this.started) return;
      var self = this;
      try {
        var p = this.canvas.requestPointerLock({ unadjustedMovement: true });
        if (p && typeof p.catch === 'function') {
          p.catch(function () {
            try { self.canvas.requestPointerLock(); } catch (e) { /* unavailable */ }
          });
        }
      } catch (err) {
        try { this.canvas.requestPointerLock(); } catch (e2) { /* unavailable */ }
      }
    }

    onLockChange() {
      this.locked = document.pointerLockElement === this.canvas;
      this.shell.classList.toggle('vhs-shell--unlocked', !this.locked);
      this.cross.classList.toggle('hidden', !this.locked);
      if (this.locked) {
        this.skipMouse = true;
        this.setHint('', false);
      } else if (this.running && this.started && !this.paused && !this.dead &&
                 this.overlay.classList.contains('hidden')) {
        this.pause();
      }
    }

    onMouseDown(event) {
      if (event.button !== 0) return;
      if (this.canvas.contains(event.target)) this.dragging = true;
    }

    onMouseUp() {
      this.dragging = false;
    }

    onMouseMove(event) {
      if (this.paused || this.dead || this.endingShown || !this.started) return;
      if (!this.locked && !this.dragging) return;
      var mx = event.movementX || 0;
      var my = event.movementY || 0;
      if (this.skipMouse) {
        this.skipMouse = false;
        return;
      }
      if (mx > 140) mx = 140;
      else if (mx < -140) mx = -140;
      if (my > 140) my = 140;
      else if (my < -140) my = -140;
      this.ang += mx * this.sens;
      this.pitchPx = clamp(this.pitchPx - my * this.sensPitch, -PITCH_MAX, PITCH_MAX);
    }

    onKeyDown(event) {
      var k = event.key.toLowerCase();
      this.keys[k] = true;
      if (k === 'f11') {
        event.preventDefault();
        this.toggleFullscreen();
        return;
      }
      if (k === ' ' || k === 'arrowup' || k === 'arrowdown' || k === 'arrowleft' || k === 'arrowright') {
        event.preventDefault();
      }
      if (k === 'p' && this.running && this.started) this.togglePause();
    }

    onKeyUp(event) {
      this.keys[event.key.toLowerCase()] = false;
    }

    togglePause() {
      if (!this.running) {
        this.start();
        return;
      }
      if (this.paused) {
        this.resume();
        this.requestLock();
      } else {
        this.pause();
      }
    }

    // ---------- audio ----------

    ensureAudio() {
      if (this.audio || !this.soundOn) return;
      try {
        this.audio = this.createAudio();
      } catch (err) {
        this.audio = null;
        this.soundOn = false;
      }
    }

    createAudio() {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      var ctx = new Ctx();
      var master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);

      var humGain = ctx.createGain();
      humGain.gain.value = 0.05;
      var lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 260;
      lp.connect(humGain);
      humGain.connect(master);

      [52, 104, 156, 208].forEach(function (f, i) {
        var osc = ctx.createOscillator();
        osc.type = i === 0 ? 'sawtooth' : 'sine';
        osc.frequency.value = f;
        var g = ctx.createGain();
        g.gain.value = i === 0 ? 0.5 : 0.2 / i;
        osc.connect(g);
        g.connect(lp);
        osc.start();
      });

      var buzzGain = ctx.createGain();
      buzzGain.gain.value = 0;
      buzzGain.connect(master);

      var buzzFilter = ctx.createBiquadFilter();
      buzzFilter.type = 'lowpass';
      buzzFilter.frequency.value = 520;
      buzzFilter.Q.value = 0.9;
      buzzFilter.connect(buzzGain);

      var b1 = ctx.createOscillator();
      b1.type = 'sawtooth';
      b1.frequency.value = 62;
      b1.connect(buzzFilter);
      b1.start();

      var b2 = ctx.createOscillator();
      b2.type = 'square';
      b2.frequency.value = 124;
      var b2g = ctx.createGain();
      b2g.gain.value = 0.34;
      b2.connect(b2g);
      b2g.connect(buzzFilter);
      b2.start();

      var b3 = ctx.createOscillator();
      b3.type = 'square';
      b3.frequency.value = 186;
      var b3g = ctx.createGain();
      b3g.gain.value = 0.14;
      b3.connect(b3g);
      b3g.connect(buzzFilter);
      b3.start();

      var buzzTarget = 0;
      var buzzCurrent = 0;

      var len = Math.floor(ctx.sampleRate * 0.6);
      var buf = ctx.createBuffer(1, len, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

      function burst(dur, gain, freq, type, q) {
        if (ctx.state === 'suspended') ctx.resume();
        var src = ctx.createBufferSource();
        src.buffer = buf;
        src.loop = true;
        var filt = ctx.createBiquadFilter();
        filt.type = type || 'bandpass';
        filt.frequency.value = freq;
        filt.Q.value = q || 1;
        var g = ctx.createGain();
        var now = ctx.currentTime;
        g.gain.setValueAtTime(0.0001, now);
        g.gain.linearRampToValueAtTime(gain, now + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
        src.connect(filt);
        filt.connect(g);
        g.connect(master);
        src.start(now);
        src.stop(now + dur + 0.05);
      }

      function tone(freq, gain, dur, delay, type) {
        var osc = ctx.createOscillator();
        osc.type = type || 'sine';
        osc.frequency.value = freq;
        var g = ctx.createGain();
        var now = ctx.currentTime + (delay || 0);
        g.gain.setValueAtTime(0.0001, now);
        g.gain.linearRampToValueAtTime(gain, now + 0.04);
        g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
        osc.connect(g);
        g.connect(master);
        osc.start(now);
        osc.stop(now + dur + 0.05);
      }

      return {
        ctx: ctx,
        resume: function () { if (ctx.state === 'suspended') ctx.resume(); },
        setMute: function (m) {
          var t = ctx.currentTime;
          master.gain.cancelScheduledValues(t);
          master.gain.linearRampToValueAtTime(m ? 0 : 0.5, t + 0.08);
        },
        buzz: function (level) { buzzTarget = level; },
        tick: function () {
          buzzCurrent += (buzzTarget - buzzCurrent) * 0.12;
          buzzGain.gain.value = buzzCurrent * (0.9 + Math.random() * 0.1);
        },
        step: function (run) { burst(0.09, run ? 0.3 : 0.2, 380 + Math.random() * 160, 'bandpass', 0.9); },
        land: function () { burst(0.16, 0.28, 140, 'lowpass', 1); },
        staticBurst: function (amount) { burst(0.12 + amount * 0.12, 0.16 + amount * 0.14, 1900, 'highpass', 0.7); },
        ending: function () {
          [392, 523.25, 659.25].forEach(function (f, i) { tone(f, 0.12, 1.6, i * 0.22); });
        },
        fall: function () {
          [196, 147, 98, 65, 49].forEach(function (f, i) { tone(f, 0.15, 2.4, i * 0.32, 'sawtooth'); });
        },
        stopAll: function () { try { ctx.close(); } catch (e) {} }
      };
    }

    toggleSound() {
      this.soundOn = !this.soundOn;
      if (this.soundOn) {
        this.ensureAudio();
        if (this.audio) { this.audio.resume(); this.audio.setMute(false); }
      } else if (this.audio) {
        this.audio.setMute(true);
      }
      return this.soundOn;
    }

    cycleVhs() {
      this.vhsLevel = (this.vhsLevel + 1) % VHS_MODES.length;
      this.vhsIntensity = VHS_INTENSITY[this.vhsLevel];
      return VHS_MODES[this.vhsLevel];
    }

    // ---------- hud ----------

    setHint(text, visible) {
      if (!this.hint) return;
      if (text) this.hint.textContent = text;
      this.hint.classList.toggle('is-hidden', !visible);
    }

    setStatus(text) {
      if (this.opts && this.opts.status) this.opts.status.textContent = text;
    }

    updateHud() { /* HUD is drawn in-canvas as pixel art */ }

    updateOsd() {
      if (!this.osdDate) return;
      var now = new Date();
      var dd = now.getDate();
      var mm = now.getMonth() + 1;
      var yyyy = now.getFullYear();
      this.osdDate.textContent = (dd < 10 ? '0' : '') + dd + '.' + (mm < 10 ? '0' : '') + mm + '.' + yyyy;
      this.osdTime.textContent = fmtHMS(this.time);
    }

    updateLampBuzz() {
      if (!this.audio) return;
      var dark = darkFieldAt(this.px, this.py) * darkFieldAt(this.px, this.py);
      var ux = this.px * SUB;
      var uy = this.py * SUB;
      var nlu = Math.round((ux - 0.5) / LAMP_TILES) * LAMP_TILES + 0.5;
      var nlv = Math.round((uy - 0.5) / LAMP_TILES) * LAMP_TILES + 0.5;
      var du = (ux - nlu) / SUB;
      var dv = (uy - nlv) / SUB;
      var d = Math.sqrt(du * du + dv * dv);
      var prox = 1 - d / 2.4;
      if (prox < 0) prox = 0;
      var level = (0.35 + 0.65 * prox) * 0.07 * (1 - dark);
      this.lampBuzz = level;
      this.audio.buzz(level);
      this.audio.tick();
    }

    // ---------- update ----------

    loop(now) {
      this.raf = requestAnimationFrame(this._loop);
      var dt = (now - this.lastTime) / 1000;
      this.lastTime = now;
      if (dt > 0.1) dt = 0.1;
      if (dt <= 0) dt = 0.0001;
      this.update(dt);
      this.render();
      this.postFrame();
      this.drawPixelHud();
      this.ctx.putImageData(this.imageData, 0, 0);
    }

    update(dt) {
      if (this.paused || this.dead) return;

      this.flickerPhase -= dt;
      if (this.flickerPhase <= 0) {
        this.flickerPhase = 0.05 + Math.random() * 0.28;
        this.flicker = Math.random() < 0.16 ? 0.5 + Math.random() * 0.22 : 0.93 + Math.random() * 0.07;
      }

      if (!this.started) return;
      this.time += dt;

      if (this.cutDark > 0) this.cutDark = Math.max(0, this.cutDark - dt * 1.8);

      if (this.fadingOut) {
        this.fade = Math.min(1, this.fade + dt / 1.1);
        if (this.fade >= 1) {
          this.fadingOut = false;
          this.showEndScreen(this.endKind || 'win');
        }
        return;
      }

      if (this.descending) {
        this.updateDescent(dt);
        return;
      }

      this.manageChunks();
      this.signalTimer -= dt;
      if (this.signalTimer <= 0) {
        this.signalTimer = 0.5;
        this.updateSignal();
      }

      this.updateMovement(dt);
      this.updateLampBuzz();

      var here = this.tileAt(this.px, this.py);
      if (here === 5) {
        this.startDescent();
        return;
      }
      if (here === HOLE_TILE) {
        this.startFall();
        return;
      }

      this.glitch *= Math.exp(-dt * 1.7);
      if (this.glitch < 0.001) this.glitch = 0.001;
      if (this.glitch > 3) this.glitch = 3;

      this.bandY += dt * (40 + this.glitch * 120);
      if (this.bandY > RH + 50) {
        this.bandY = -50;
        if (Math.random() < 0.4) this.glitch += 0.35;
      }

      this.lastHud -= dt;
      if (this.lastHud <= 0) {
        this.lastHud = 0.25;
        this.updateOsd();
      }
    }

    updateMovement(dt) {
      var keys = this.keys;
      var fwd = 0;
      var strafe = 0;
      var turn = 0;
      if (keys.w) fwd += 1;
      if (keys.s) fwd -= 1;
      if (keys.d) strafe += 1;
      if (keys.a) strafe -= 1;
      if (keys.arrowleft) turn -= 1;
      if (keys.arrowright) turn += 1;

      if (keys.arrowup) this.pitchPx = clamp(this.pitchPx + 95 * dt, -PITCH_MAX, PITCH_MAX);
      if (keys.arrowdown) this.pitchPx = clamp(this.pitchPx - 95 * dt, -PITCH_MAX, PITCH_MAX);

      var wantJump = !!keys[' '];
      var wantSprint = !!keys.shift;

      this.ang += turn * 2.1 * dt;

      var ground = EYE;
      if (wantJump && this.onGround) {
        this.zVel = 2.4;
        this.onGround = false;
      }
      if (!this.onGround) {
        this.zVel -= 9.5 * dt;
        this.camZ += this.zVel * dt;
        if (this.camZ <= ground) {
          this.camZ = ground;
          this.zVel = 0;
          this.onGround = true;
          if (this.audio) this.audio.land();
        }
      } else {
        this.camZ += (ground - this.camZ) * Math.min(1, dt * 12);
      }
      this.camZ = clamp(this.camZ, EYE_MIN, EYE_MAX);

      var canSprint = wantSprint && fwd > 0 && this.stamina > 0 && this.onGround;
      var speed;
      if (canSprint) speed = 3.9;
      else speed = 2.05;
      speed *= dt;

      if (canSprint) {
        this.stamina = Math.max(0, this.stamina - STAMINA_DRAIN * dt);
      } else {
        this.stamina = Math.min(100, this.stamina + (fwd || strafe ? STAMINA_REGEN * 0.7 : STAMINA_REGEN) * dt);
      }

      var dirX = Math.cos(this.ang);
      var dirY = Math.sin(this.ang);
      var mx = dirX * fwd - dirY * strafe;
      var my = dirY * fwd + dirX * strafe;
      var mag = Math.sqrt(mx * mx + my * my);
      var moved = 0;
      if (mag > 0.0001) {
        mx = (mx / mag) * speed;
        my = (my / mag) * speed;
        var nx = this.px + mx;
        var ny = this.py + my;
        if (this.free(nx, this.py)) { moved += Math.abs(nx - this.px); this.px = nx; }
        if (this.free(this.px, ny)) { moved += Math.abs(ny - this.py); this.py = ny; }
        var stride = canSprint ? 0.44 : 0.62;
        this.bobPhase += moved * 9;
        if (this.bobPhase > Math.PI * 2) this.bobPhase -= Math.PI * 2;
        this.bob = Math.sin(this.bobPhase) * 0.012;
        this.stepDist += moved;
        if (this.stepDist > stride) {
          this.stepDist = 0;
          if (this.audio) this.audio.step(canSprint);
        }
      } else {
        this.bob += (0 - this.bob) * Math.min(1, dt * 10);
      }
    }

    startDescent() {
      this.descendMode = 'stairs';
      this.endKind = 'win';
      this.descending = false;
      this.fadingOut = true;
      this.fade = 0;
      this.cutDark = 0.25;
      this.keys = {};
      if (this.audio) {
        this.audio.buzz(0);
        this.audio.ending();
      }
      this.setStatus('Schodzisz w dół...');
      this.setHint('', false);
    }

    startFall() {
      this.descending = true;
      this.descendMode = 'fall';
      this.endKind = 'fall';
      this.fallK = 0;
      this.camZ = EYE + 0.2;
      this.bob = 0;
      this.cutDark = 0.5;
      this.keys = {};
      if (this.audio) this.audio.buzz(0);
      this.setStatus('Wpadłeś w dziurę — spadasz w nieskończoność...');
      this.setHint('', false);
    }

    updateDescent(dt) {
      if (this.descendMode === 'fall') {
        this.updateFall(dt);
        return;
      }
      this.stairK += dt * STAIR_RATE;
      if (this.stairK > STAIR_STEPS) this.stairK = STAIR_STEPS;
      this.stairS = this.stairK * TP;
      var kInt = Math.floor(this.stairK);
      this.stairEye = -kInt * SH + EYE_ABOVE;
      var prev = Math.floor((this.stairK - dt * STAIR_RATE < 0 ? 0 : this.stairK - dt * STAIR_RATE));
      if (kInt > prev) {
        if (this.audio) this.audio.step(false);
        this.glitch += 0.1;
      }
      if (this.stairK >= STAIR_STEPS) {
        this.descending = false;
        this.fadingOut = true;
        this.endKind = 'win';
      }
    }

    updateFall(dt) {
      this.camZ -= FALL_RATE * dt;
      this.fallK = -this.camZ;
      if (-this.camZ >= FALL_TILES) {
        this.descending = false;
        this.fadingOut = true;
        this.endKind = 'fall';
      }
    }

    showEndScreen(kind) {
      var win = kind !== 'fall';
      this.endingShown = true;
      this.dead = true;

      if (this.endKicker) this.endKicker.textContent = win ? 'Level 0 — Terminated' : 'Level 0 — Lost';
      if (this.endTitle) this.endTitle.textContent = win ? 'You escaped the Backrooms' : 'You fell into the void';
      if (this.endText) {
        this.endText.textContent = win
          ? 'The fluorescent hum fades away. The stained carpet ends. For the first time in hours the air is silent — and it is over.'
          : 'The floor gave way and you kept falling. Thirty levels of humming yellow light rushed past. Nobody ever hits the bottom.';
      }
      if (this.endStats) this.endStats.textContent = 'Time in the Backrooms: ' + fmtClock(this.time);
      this.setStatus(win ? 'You escaped the Backrooms.' : 'You fell into an endlessly deep pit.');

      if (this.audio) {
        if (win) this.audio.ending();
        else this.audio.fall();
      }

      this.cancelLoop();
      if (document.pointerLockElement) document.exitPointerLock();
      this.shell.classList.add('vhs-shell--unlocked');
      this.cross.classList.add('hidden');
      this.endScreen.classList.remove('hidden');
      var el = this.endScreen;
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { el.classList.add('is-visible'); });
      });
    }

    // ---------- render: rooms ----------

    updateLevels() {
      var flicker = this.flicker;
      var topLevel = LEVELS - 1;
      function fill(arr, mul) {
        for (var i = 0; i <= 128; i++) {
          var dist = i * MAXDIST / 128;
          var f = 1 - dist / MAXDIST;
          if (f < 0) f = 0;
          var v = f * flicker * mul;
          var l = (v * topLevel) | 0;
          arr[i] = l < 0 ? 0 : (l > topLevel ? topLevel : l);
        }
      }
      fill(this.lvA, 1.0);
      fill(this.lvB, 0.8);
      fill(this.lvC, 0.62);
      fill(this.lvAD, 0.3);
      fill(this.lvBD, 0.23);
      fill(this.lvCD, 0.17);
      fill(this.lvZ, 0.1);
      for (var li = 0; li <= 128; li++) {
        var df = li * MAXDIST / 128;
        var ff = 1 - df / MAXDIST;
        if (ff < 0) ff = 0;
        var ve = 0.72 + ff * 0.28;
        var le = (ve * topLevel) | 0;
        this.lvE[li] = le < 0 ? 0 : (le > topLevel ? topLevel : le);
      }
    }

    render() {
      var buf = this.screen;
      var dirX = Math.cos(this.ang);
      var dirY = Math.sin(this.ang);
      var planeX = -dirY * FOV;
      var planeY = dirX * FOV;
      var horizon = HALF + this.pitchPx;
      var camZ = this.descendMode === 'fall'
        ? this.camZ
        : clamp(this.camZ + this.bob, EYE_MIN, EYE_MAX);
      var flicker = this.flicker;

      var lvA = this.lvA;
      var lvB = this.lvB;
      var lvC = this.lvC;
      var lvAD = this.lvAD;
      var lvBD = this.lvBD;
      var lvCD = this.lvCD;
      var lvE = this.lvE;
      var lvZ = this.lvZ;
      var topLevel = LEVELS - 1;

      this.updateLevels();

      var dbuf = this.dbuf;
      dbuf.fill(1e9);

      if (camZ < 0.03) {
        var black = pack(6, 6, 6);
        for (var bi = 0; bi < buf.length; bi++) buf[bi] = black;
        this.renderShafts3D(dirX, dirY, planeX, planeY, camZ, horizon, topLevel);
        return;
      }

      var wallShades = this.wallShades;
      var wallBloodShades = this.wallBloodShades;
      var concreteShades = this.concreteShades;
      var ceilShades = this.ceilShades;
      var floorTables = this.floorTables;
      var stairTopShades = this.stairTopShades;

      var px = this.px;
      var py = this.py;
      var exitList = this.exitsNear;
      var hasExits = exitList.length > 0;

      var tcX = this.tcX;
      var tcY = this.tcY;
      var tcV = this.tcV;
      var tcD = this.tcD;
      var tcH = this.tcH;
      var tcS = this.tcS;
      var tcL = this.tcL;
      var tcF = this.tcF;
      var dcX = this.dcX;
      var dcY = this.dcY;
      var dcV = this.dcV;
      var dcL = this.dcL;
      var lampDist = this.lampDist;

      var ceilingD = WALL_H - camZ;

      for (var x = 0; x < RW; x++) {
        var cameraX = 2 * x / RW - 1;
        var rayDirX = dirX + planeX * cameraX;
        var rayDirY = dirY + planeY * cameraX;

        var mapX = Math.floor(px);
        var mapY = Math.floor(py);
        var chCx = Math.floor(mapX / C);
        var chCy = Math.floor(mapY / C);
        var ch = this.getChunk(chCx, chCy);
        var chTiles = ch.tiles;

        var deltaX = rayDirX === 0 ? 1e30 : Math.abs(1 / rayDirX);
        var deltaY = rayDirY === 0 ? 1e30 : Math.abs(1 / rayDirY);
        var stepX, stepY, sideDistX, sideDistY;
        if (rayDirX < 0) { stepX = -1; sideDistX = (px - mapX) * deltaX; }
        else { stepX = 1; sideDistX = (mapX + 1 - px) * deltaX; }
        if (rayDirY < 0) { stepY = -1; sideDistY = (py - mapY) * deltaY; }
        else { stepY = 1; sideDistY = (mapY + 1 - py) * deltaY; }

        var side = 0;
        var tile = 1;
        var guard = 0;
        var hit = false;
        while (!hit && guard++ < 400) {
          if (sideDistX < sideDistY) {
            sideDistX += deltaX;
            mapX += stepX;
            side = 0;
          } else {
            sideDistY += deltaY;
            mapY += stepY;
            side = 1;
          }
          var lx = mapX - chCx * C;
          var ly = mapY - chCy * C;
          if (lx < 0 || lx >= C || ly < 0 || ly >= C) {
            chCx = Math.floor(mapX / C);
            chCy = Math.floor(mapY / C);
            ch = this.getChunk(chCx, chCy);
            chTiles = ch.tiles;
            lx = mapX - chCx * C;
            ly = mapY - chCy * C;
          }
          tile = chTiles[ly * C + lx];
          if (tile !== 0 && tile !== 5 && tile !== HOLE_TILE) hit = true;
        }

        var perp = side === 0 ? (sideDistX - deltaX) : (sideDistY - deltaY);
        if (perp < 0.0001) perp = 0.0001;
        this.zBuf[x] = perp;

        var invPerp = RH / perp;
        var drawStart = horizon + (camZ - WALL_H) * invPerp;
        var drawEnd = horizon + camZ * invPerp;

        var lidx = (perp * LSCALE) | 0;
        if (lidx > 128) lidx = 128;

        var wdk = darkFieldAt(mapX + 0.5, mapY + 0.5);
        var tier = 0;
        if (side === 0) tier = rayDirX > 0 ? 1 : 0;
        else tier = rayDirY > 0 ? 2 : 1;
        var lBright = tier === 0 ? lvA[lidx] : (tier === 1 ? lvB[lidx] : lvC[lidx]);
        var lDark = tier === 0 ? lvAD[lidx] : (tier === 1 ? lvBD[lidx] : lvCD[lidx]);
        var lvl = (lBright + (lDark - lBright) * wdk) | 0;
        var lampW = lampLightAt(mapX + 0.5, mapY + 0.5);
        if (lampW > 0) {
          lvl += (lampW * lampDist[lidx] * LAMP_GAIN * topLevel) | 0;
        }
        if (lvl > topLevel) lvl = topLevel;
        else if (lvl < 0) lvl = 0;

        var shading;
        if (tile === 2) {
          shading = concreteShades[lvl];
        } else {
          var wb = wallBloodVariantAt(mapX, mapY);
          if (wb) shading = wallBloodShades[wb - 1][lvl];
          else shading = wallShades[lvl];
        }

        var wallX;
        if (side === 0) wallX = py + perp * rayDirY;
        else wallX = px + perp * rayDirX;
        wallX -= Math.floor(wallX);
        var texX = (wallX * WALL_TEX_W) | 0;
        if (side === 0 && rayDirX > 0) texX = WALL_TEX_W - texX - 1;
        if (side === 1 && rayDirY < 0) texX = WALL_TEX_W - texX - 1;
        if (texX < 0) texX = 0;
        else if (texX >= WALL_TEX_W) texX = WALL_TEX_W - 1;

        var cEnd = drawStart < 0 ? 0 : (drawStart > RH ? RH : Math.ceil(drawStart));
        for (var cy = 0; cy < cEnd; cy++) {
          var pc = horizon - cy;
          if (pc <= 0) continue;
          var rowDistC = ceilingD * RH / pc;
          var fxC = px + rowDistC * rayDirX;
          var fyC = py + rowDistC * rayDirY;
          var txC = Math.floor(fxC * CEIL_PPC) & (CEIL_TEX - 1);
          var tyC = Math.floor(fyC * CEIL_PPC) & (CEIL_TEX - 1);
          var cxi = Math.floor(fxC);
          var cyi = Math.floor(fyC);
          var slotd = (Math.imul(cxi, 73856093) ^ Math.imul(cyi, 19349663)) & 8191;
          if (dcX[slotd] !== cxi || dcY[slotd] !== cyi) {
            dcX[slotd] = cxi;
            dcY[slotd] = cyi;
            dcV[slotd] = (darkFieldAt(cxi + 0.5, cyi + 0.5) * 255) | 0;
            dcL[slotd] = (lampLightAt(cxi + 0.5, cyi + 0.5) * 255) | 0;
          }
          var cdk = dcV[slotd] / 255;
          var ci = (rowDistC * LSCALE) | 0;
          if (ci > 128) ci = 128;
          var ceilLvl = (lvA[ci] + (lvZ[ci] - lvA[ci]) * cdk) | 0;
          if (dcL[slotd] > 0) {
            ceilLvl += ((dcL[slotd] / 255) * lampDist[ci] * LAMP_GAIN * 0.9 * topLevel) | 0;
          }
          if (ceilLvl < 0) ceilLvl = 0;
          else if (ceilLvl > topLevel) ceilLvl = topLevel;
          buf[cy * RW + x] = ceilShades[ceilLvl][tyC * CEIL_TEX + txC];
          dbuf[cy * RW + x] = rowDistC;
        }

        var ws = drawStart < 0 ? 0 : Math.ceil(drawStart);
        var we = drawEnd > RH ? RH : Math.ceil(drawEnd);
        if (we > ws) {
          var zTop = camZ - (ws - horizon) * perp / RH;
          var texStepY = (perp / (RH * WALL_H)) * (WALL_TEX_H - 1);
          var texPosY = (1 - zTop / WALL_H) * (WALL_TEX_H - 1);
          for (var wy = ws; wy < we; wy++) {
            var texY = texPosY | 0;
            if (texY < 0) texY = 0;
            else if (texY >= WALL_TEX_H) texY = WALL_TEX_H - 1;
            buf[wy * RW + x] = shading[texY * WALL_TEX_W + texX];
            dbuf[wy * RW + x] = perp;
            texPosY += texStepY;
          }
        }

        var fStart = drawEnd < 0 ? 0 : (drawEnd | 0);
        if (fStart < 0) fStart = 0;
        for (var fy2 = fStart; fy2 < RH; fy2++) {
          var pf = fy2 - horizon;
          if (pf <= 0) continue;
          var rowDistF = camZ * RH / pf;
          var fxF = px + rowDistF * rayDirX;
          var fyF = py + rowDistF * rayDirY;

          var txi = Math.floor(fxF * SUB);
          var tyi = Math.floor(fyF * SUB);
          var slot = (Math.imul(txi, 73856093) ^ Math.imul(tyi, 19349663)) & 32767;
          var lxi = Math.floor(fxF);
          var lyi = Math.floor(fyF);
          if (tcX[slot] !== txi || tcY[slot] !== tyi) {
            tcX[slot] = txi;
            tcY[slot] = tyi;
            tcV[slot] = floorVariantAt(txi, tyi);
            tcD[slot] = (darkFieldAt(fxF, fyF) * 255) | 0;
            tcL[slot] = (lampLightAt(fxF, fyF) * 255) | 0;
            tcF[slot] = 0;
            tcH[slot] = 0;
            tcS[slot] = 0;
          }
          if (tcF[slot] !== 2 && rowDistF < MAXDIST + 3) {
            var ftile = this.tileAt(fxF, fyF);
            var fh = 0;
            var fs = 0;
            if (ftile === HOLE_TILE) fh = 1;
            else if (ftile === 5) {
              if (this.tileAt(lxi - 1, lyi) === 0) fs = 1;
              else if (this.tileAt(lxi + 1, lyi) === 0) fs = 2;
              else if (this.tileAt(lxi, lyi - 1) === 0) fs = 3;
              else if (this.tileAt(lxi, lyi + 1) === 0) fs = 4;
              else fs = 3;
            }
            tcH[slot] = fh;
            tcS[slot] = fs;
            tcF[slot] = 2;
          }
          var fdk = tcD[slot] / 255;

          var fi = (rowDistF * LSCALE) | 0;
          if (fi > 128) fi = 128;

          if (tcS[slot] || tcH[slot]) {
            buf[fy2 * RW + x] = pack(7, 7, 6);
          } else {
            var ao = (perp - rowDistF) / 1.6;
            if (ao > 1) ao = 1;
            else if (ao < 0) ao = 0;
            var fl = (lvA[fi] + (lvAD[fi] - lvA[fi]) * fdk) | 0;
            if (tcL[slot] > 0) {
              var lampF = (tcL[slot] / 255) * lampDist[fi] * LAMP_GAIN;
              fl = (fl * (0.72 + 0.28 * ao) + lampF * topLevel) | 0;
            } else {
              fl = (fl * (0.82 + 0.18 * ao)) | 0;
            }
            if (fl > topLevel) fl = topLevel;
            else if (fl < 0) fl = 0;
            var txF = Math.floor(fxF * FLOOR_PPC) & (TEX - 1);
            var tyF = Math.floor(fyF * FLOOR_PPC) & (TEX - 1);
            buf[fy2 * RW + x] = floorTables[tcV[slot]][fl][tyF * TEX + txF];
            dbuf[fy2 * RW + x] = rowDistF;
          }
        }
      }

      this.renderShafts3D(dirX, dirY, planeX, planeY, camZ, horizon, topLevel);
    }

    // ---------- render: 3D stairs / pits ----------

    _tileTRange(px, py, rdx, rdy, tx, ty) {
      var t0 = 0.12;
      var t1 = 60;
      if (Math.abs(rdx) < 1e-6) {
        if (px < tx || px > tx + 1) return null;
      } else {
        var a = (tx - px) / rdx;
        var b = (tx + 1 - px) / rdx;
        if (a > b) { var tmp = a; a = b; b = tmp; }
        if (a > t0) t0 = a;
        if (b < t1) t1 = b;
      }
      if (Math.abs(rdy) < 1e-6) {
        if (py < ty || py > ty + 1) return null;
      } else {
        var c = (ty - py) / rdy;
        var d = (ty + 1 - py) / rdy;
        if (c > d) { var tm = c; c = d; d = tm; }
        if (c > t0) t0 = c;
        if (d < t1) t1 = d;
      }
      if (t1 <= t0) return null;
      return [t0, t1];
    }

    _orientAt(tx, ty) {
      if (this.tileAt(tx - 1, ty + 0.5) === 0) return 1;
      if (this.tileAt(tx + 1, ty + 0.5) === 0) return 2;
      if (this.tileAt(tx + 0.5, ty - 1) === 0) return 3;
      if (this.tileAt(tx + 0.5, ty + 1) === 0) return 4;
      return 3;
    }

    _tread(tx, ty, orient, z, u0, u1, cr, cg, cb, camZ, horizon, dirX, dirY, planeX, planeY) {
      var buf = this.screen;
      var dbuf = this.dbuf;
      var px = this.px;
      var py = this.py;
      var k = (camZ - z) * RH;
      if (k <= 0) return;
      for (var sx = 0; sx < RW; sx++) {
        var cameraX = 2 * sx / RW - 1;
        var rdx = dirX + planeX * cameraX;
        var rdy = dirY + planeY * cameraX;
        var range = this._tileTRange(px, py, rdx, rdy, tx, ty);
        if (!range) continue;
        var yHi = horizon + k / range[0];
        var yLo = horizon + k / range[1];
        var yStart = Math.ceil(yLo);
        if (yStart < horizon + 1) yStart = horizon + 1;
        if (yStart < 0) yStart = 0;
        var yEnd = Math.ceil(yHi);
        if (yEnd > RH) yEnd = RH;
        for (var y = yStart; y < yEnd; y++) {
          var t = k / (y - horizon);
          if (t < range[0] || t > range[1]) continue;
          var idx = y * RW + sx;
          if (t >= dbuf[idx]) continue;
          var wx = px + t * rdx;
          var wy = py + t * rdy;
          var u, v;
          if (orient === 1) { u = wx - tx; v = wy - ty; }
          else if (orient === 2) { u = tx + 1 - wx; v = wy - ty; }
          else if (orient === 3) { u = wy - ty; v = wx - tx; }
          else { u = ty + 1 - wy; v = wx - tx; }
          if (u < u0 || u > u1 || v < 0 || v > 1) continue;
          var lit = 0.5 + 0.5 * (1 - t / MAXDIST) + lampLightAt(wx, wy) * 0.45;
          buf[idx] = pack(cr * lit, cg * lit, cb * lit);
          dbuf[idx] = t;
        }
      }
    }

    _vplane(axis, coord, v0, v1, z0, z1, cr, cg, cb, fadeDepth, camZ, horizon, dirX, dirY, planeX, planeY) {
      var buf = this.screen;
      var dbuf = this.dbuf;
      var px = this.px;
      var py = this.py;
      for (var sx = 0; sx < RW; sx++) {
        var cameraX = 2 * sx / RW - 1;
        var rdx = dirX + planeX * cameraX;
        var rdy = dirY + planeY * cameraX;
        var t;
        if (axis === 0) {
          if (Math.abs(rdx) < 1e-6) continue;
          t = (coord - px) / rdx;
          if (t < 0.08) continue;
          var lat = py + t * rdy;
          if (lat < v0 || lat > v1) continue;
        } else {
          if (Math.abs(rdy) < 1e-6) continue;
          t = (coord - py) / rdy;
          if (t < 0.08) continue;
          var lat2 = px + t * rdx;
          if (lat2 < v0 || lat2 > v1) continue;
        }
        var yA = Math.ceil(horizon + (camZ - z1) * RH / t);
        var yB = Math.ceil(horizon + (camZ - z0) * RH / t);
        if (yA < 0) yA = 0;
        if (yB > RH) yB = RH;
        var base = 0.55 + 0.45 * (1 - t / MAXDIST);
        for (var y = yA; y < yB; y++) {
          var idx = y * RW + sx;
          if (t >= dbuf[idx]) continue;
          var sh = base;
          if (fadeDepth > 0) {
            var z = camZ - (y - horizon) * t / RH;
            var fz = 1 + z / fadeDepth;
            if (fz < 0) fz = 0;
            else if (fz > 1) fz = 1;
            sh *= fz;
          }
          buf[idx] = pack(cr * sh, cg * sh, cb * sh);
          dbuf[idx] = t;
        }
      }
    }

    renderStairTile(tx, ty, camZ, horizon, dirX, dirY, planeX, planeY) {
      var orient = this._orientAt(tx, ty);
      var N = 6;
      var stepH = 0.24;
      var depth = N * stepH;
      var treadC = [158, 148, 112];
      var riserC = [104, 97, 74];
      var sideC = [130, 122, 95];
      var farC = [120, 113, 88];
      var i;

      for (i = 0; i < N; i++) {
        this._tread(tx, ty, orient, -(i + 1) * stepH, i / N, (i + 1) / N,
          treadC[0], treadC[1], treadC[2], camZ, horizon, dirX, dirY, planeX, planeY);
      }

      for (i = 0; i < N; i++) {
        var uk = i / N;
        var z0 = -(i + 1) * stepH;
        var z1 = -i * stepH;
        if (orient === 1) this._vplane(0, tx + uk, ty, ty + 1, z0, z1, riserC[0], riserC[1], riserC[2], 0, camZ, horizon, dirX, dirY, planeX, planeY);
        else if (orient === 2) this._vplane(0, tx + 1 - uk, ty, ty + 1, z0, z1, riserC[0], riserC[1], riserC[2], 0, camZ, horizon, dirX, dirY, planeX, planeY);
        else if (orient === 3) this._vplane(1, ty + uk, tx, tx + 1, z0, z1, riserC[0], riserC[1], riserC[2], 0, camZ, horizon, dirX, dirY, planeX, planeY);
        else this._vplane(1, ty + 1 - uk, tx, tx + 1, z0, z1, riserC[0], riserC[1], riserC[2], 0, camZ, horizon, dirX, dirY, planeX, planeY);
      }

      if (orient === 1 || orient === 2) {
        this._vplane(1, ty, tx, tx + 1, -depth, 0, sideC[0], sideC[1], sideC[2], 0, camZ, horizon, dirX, dirY, planeX, planeY);
        this._vplane(1, ty + 1, tx, tx + 1, -depth, 0, sideC[0], sideC[1], sideC[2], 0, camZ, horizon, dirX, dirY, planeX, planeY);
        var fx = orient === 1 ? tx + 1 : tx;
        this._vplane(0, fx, ty, ty + 1, -depth, 0, farC[0], farC[1], farC[2], 0, camZ, horizon, dirX, dirY, planeX, planeY);
      } else {
        this._vplane(0, tx, ty, ty + 1, -depth, 0, sideC[0], sideC[1], sideC[2], 0, camZ, horizon, dirX, dirY, planeX, planeY);
        this._vplane(0, tx + 1, ty, ty + 1, -depth, 0, sideC[0], sideC[1], sideC[2], 0, camZ, horizon, dirX, dirY, planeX, planeY);
        var fy = orient === 3 ? ty + 1 : ty;
        this._vplane(1, fy, tx, tx + 1, -depth, 0, farC[0], farC[1], farC[2], 0, camZ, horizon, dirX, dirY, planeX, planeY);
      }
    }

    renderPitTile(tx, ty, camZ, horizon, dirX, dirY, planeX, planeY) {
      var c0 = 150;
      var c1 = 140;
      var c2 = 106;
      var depth = ABYSS_DEPTH;
      var px = this.px;
      var py = this.py;
      if (px > tx) this._vplane(0, tx, ty, ty + 1, -depth, 0, c0, c1, c2, depth, camZ, horizon, dirX, dirY, planeX, planeY);
      if (px < tx + 1) this._vplane(0, tx + 1, ty, ty + 1, -depth, 0, c0, c1, c2, depth, camZ, horizon, dirX, dirY, planeX, planeY);
      if (py > ty) this._vplane(1, ty, tx, tx + 1, -depth, 0, c0, c1, c2, depth, camZ, horizon, dirX, dirY, planeX, planeY);
      if (py < ty + 1) this._vplane(1, ty + 1, tx, tx + 1, -depth, 0, c0, c1, c2, depth, camZ, horizon, dirX, dirY, planeX, planeY);
    }

    renderShafts3D(dirX, dirY, planeX, planeY, camZ, horizon, topLevel) {
      var i;

      if (camZ >= 0) {
        var exits = this.exitsNear;
        for (i = 0; i < exits.length; i++) {
          var e = exits[i];
          var dx = (e.cx + 0.5) - this.px;
          var dy = (e.cy + 0.5) - this.py;
          var fd = dx * dirX + dy * dirY;
          if (fd < 0.3 || fd > 18) continue;
          var lat = -dx * dirY + dy * dirX;
          if (Math.abs(lat) > fd * (0.9 + FOV) + 1.6) continue;
          this.renderStairTile(e.cx, e.cy, camZ, horizon, dirX, dirY, planeX, planeY);
        }
      }

      var ptx = Math.floor(this.px);
      var pty = Math.floor(this.py);
      var pr = 4;
      for (var oy = -pr; oy <= pr; oy++) {
        for (var ox = -pr; ox <= pr; ox++) {
          var tx = ptx + ox;
          var ty = pty + oy;
          if (this.tileAt(tx + 0.5, ty + 0.5) !== HOLE_TILE) continue;
          var hx = tx + 0.5 - this.px;
          var hy = ty + 0.5 - this.py;
          if (hx * hx + hy * hy > 100) continue;
          this.renderPitTile(tx, ty, camZ, horizon, dirX, dirY, planeX, planeY);
        }
      }
    }

    // ---------- render: stairs ----------

    floorAt(depth) {
      var n = Math.floor(depth / TP);
      if (n < 0) n = 0;
      return -n * SH;
    }

    renderStairs() {
      var buf = this.screen;
      var horizon = HALF - 95;
      var camS = this.stairS;
      var eyeZ = this.stairEye;
      var fogK = 0.16;
      this.updateLevels();
      var lvLocal = this.lvA;

      var ceilR = COL.ceil & 255;
      var ceilG = (COL.ceil >>> 8) & 255;
      var ceilB = (COL.ceil >>> 16) & 255;
      for (var y0 = 0; y0 < horizon; y0++) {
        var grad = 1 - (y0 / horizon) * 0.55;
        var rr = ceilR * grad;
        var gg = ceilG * grad;
        var bb = ceilB * grad;
        var row = y0 * RW;
        for (var x0 = 0; x0 < RW; x0++) buf[row + x0] = pack(rr, gg, bb);
      }
      var bgR = 26;
      var bgG = 24;
      var bgB = 20;
      for (var y1 = horizon; y1 < RH; y1++) {
        var row1 = y1 * RW;
        for (var x1 = 0; x1 < RW; x1++) buf[row1 + x1] = pack(bgR, bgG, bgB);
      }

      var nNear = Math.floor(camS / TP);
      for (var n = nNear + STAIR_MAX; n >= nNear; n--) {
        var d0 = n * TP;
        var d1 = (n + 1) * TP;
        var D0 = d0 - camS;
        var D1 = d1 - camS;
        if (D1 < 0.06) continue;
        if (D0 < 0.06) D0 = 0.06;
        var zN = -n * SH;
        var zc = zN - eyeZ;
        if (zc > -0.02) continue;

        var yNear = horizon - zc * RH / D0;
        var yFar = horizon - zc * RH / D1;
        var yRT = horizon - (zc + SH) * RH / D0;

        var dMid = (D0 + D1) * 0.5;
        var fog = 1 / (1 + dMid * fogK);
        var nse = 0.94 + 0.12 * hash2(n, 3, 5);
        var fr = COL.tread[0] * fog * nse;
        var fg = COL.tread[1] * fog * nse;
        var fb = COL.tread[2] * fog * nse;
        var rr2 = COL.riser[0] * fog;
        var gg2 = COL.riser[1] * fog;
        var bb2 = COL.riser[2] * fog;

        var r0 = Math.ceil(yFar);
        var r1 = Math.ceil(yRT);
        if (r0 < horizon) r0 = horizon;
        if (r1 > RH) r1 = RH;
        for (var ty = r0; ty < r1; ty++) {
          var rowT = ty * RW;
          for (var xt = 0; xt < RW; xt++) buf[rowT + xt] = pack(fr, fg, fb);
        }

        r0 = Math.ceil(yRT);
        r1 = Math.ceil(yNear);
        if (r0 < horizon) r0 = horizon;
        if (r1 > RH) r1 = RH;
        for (var ry = r0; ry < r1; ry++) {
          var rowR = ry * RW;
          var edge = (ry < r0 + 2);
          var er = edge ? COL.nosing[0] * fog : rr2;
          var eg = edge ? COL.nosing[1] * fog : gg2;
          var eb = edge ? COL.nosing[2] * fog : bb2;
          for (var xr = 0; xr < RW; xr++) buf[rowR + xr] = pack(er, eg, eb);
        }
      }

      var shaftShades = this.shaftShades;
      var invFov = 1 / FOV;
      for (var sx = 0; sx < RW; sx++) {
        var cameraX = 2 * sx / RW - 1;
        var lateral = cameraX * invFov;
        var latAbs = lateral < 0 ? -lateral : lateral;
        if (latAbs < 0.0015) continue;
        var depth = SHAFT_HW / latAbs;
        if (depth > 90) continue;
        var worldDepth = camS + depth;
        var floorZ = this.floorAt(worldDepth);
        var yTop = horizon + (eyeZ - CEIL_Z) * RH / depth;
        var yBot = horizon + (eyeZ - floorZ) * RH / depth;
        var fogW = 1 / (1 + depth * fogK);
        var uu = (worldDepth * TEX) | 0;
        var texU = uu & (TEX - 1);
        var rA = Math.ceil(yTop);
        var rB = Math.ceil(yBot);
        if (rA < 0) rA = 0;
        if (rB > RH) rB = RH;
        var sideShade = lateral > 0 ? 0.92 : 1.0;
        for (var wy = rA; wy < rB; wy++) {
          var wz = eyeZ - (wy - horizon) * depth / RH;
          var vv = (wz * TEX) | 0;
          var texV = vv & (TEX - 1);
          var sp = shaftShades[lvLocal[Math.min(128, (depth * LSCALE) | 0)]][texV * TEX + texU];
          var sr = sp & 255;
          var sg = (sp >>> 8) & 255;
          var sb = (sp >>> 16) & 255;
          buf[wy * RW + sx] = pack(sr * fogW * sideShade, sg * fogW * sideShade, sb * fogW * sideShade);
        }
      }
    }

    // ---------- render: falling into a pit ----------

    renderFall() {
      var buf = this.screen;
      var t = clamp(this.fallK / FALL_TILES, 0, 1);
      var cx = RW / 2;
      var cy = (HALF - 50 - t * 120) | 0;
      var topW = 190 * (1 - t * 0.88) + 8;
      var topH = 140 * (1 - t * 0.82) + 6;

      for (var y = 0; y < RH; y++) {
        var row = y * RW;
        for (var x = 0; x < RW; x++) {
          var dx = (x - cx) / (topW * 0.5);
          var dy = (y - cy) / (topH * 0.5);
          var inside = dx * dx + dy * dy;
          var g;
          if (inside < 1) {
            var ed = 1 - Math.sqrt(inside);
            g = (196 - t * 128) * (0.35 + 0.65 * ed);
          } else {
            var nx = (x - cx) / (RW * 0.5);
            var ny = (y - cy) / (RH * 0.6);
            var d = Math.sqrt(nx * nx + ny * ny);
            g = 46 * (1 - d) * (1 - t * 0.78);
            if (g < 2) g = 2;
          }
          var vb = 1 - 0.22 * t;
          buf[row + x] = pack(g * vb, g * vb * 0.99, g * vb * 0.94);
        }
      }

      var streak = (26 * (1 - t)) | 0;
      for (var i = 0; i < 90; i++) {
        var sx = (hash2(i, 0, 77) * RW) | 0;
        var sh = (8 + hash2(i, 1, 77) * 40) | 0;
        var sy = (hash2(i, 2, 77) * RH) | 0;
        for (var k = 0; k < sh; k++) {
          var yy = (sy + k) % RH;
          var idx = yy * RW + sx;
          var p = buf[idx];
          var r = (p & 255) * (1 - streak / 255);
          var gg = ((p >>> 8) & 255) * (1 - streak / 255);
          var bb = ((p >>> 16) & 255) * (1 - streak / 255);
          buf[idx] = pack(r, gg, bb);
        }
      }
    }

    // ---------- HUD (pixel art, drawn into the game buffer) ----------

    drawPixelHud() {
      if (!this.started) return;
      var v = this.view;
      var i;
      function px(x, y, r, g, b) {
        if (x < 0 || y < 0 || x >= RW || y >= RH) return;
        v[y * RW + x] = pack(r, g, b);
      }
      function rect(x, y, w, h, r, g, b) {
        for (var yy = y; yy < y + h; yy++) {
          for (var xx = x; xx < x + w; xx++) px(xx, yy, r, g, b);
        }
      }
      function frame(x, y, w, h, r, g, b) {
        for (var xx = 0; xx < w; xx++) { px(x + xx, y, r, g, b); px(x + xx, y + h - 1, r, g, b); }
        for (var yy = 0; yy < h; yy++) { px(x, y + yy, r, g, b); px(x + w - 1, y + yy, r, g, b); }
      }

      var bx = 8;
      var by = RH - 18;
      var bw = 104;
      var bh = 11;
      frame(bx, by, bw, bh, COL.hudFrame[0], COL.hudFrame[1], COL.hudFrame[2]);
      rect(bx + 1, by + 1, bw - 2, bh - 2, COL.hudBg[0], COL.hudBg[1], COL.hudBg[2]);
      var innerW = bw - 4;
      var fillW = Math.round(innerW * clamp(this.stamina, 0, 100) / 100);
      var col = this.stamina < 25 ? COL.hudLow : COL.hudOk;
      rect(bx + 2, by + 2, fillW, bh - 4, col[0], col[1], col[2]);
      for (i = 1; i < 10; i++) {
        var txx = bx + 2 + Math.round(innerW * i / 10);
        px(txx, by + 2, 12, 12, 12);
        px(txx, by + bh - 3, 12, 12, 12);
        px(txx, by + 3, 12, 12, 12);
      }

      var sw = 10;
      var sg = 4;
      var stackW = 5;
      var sx0 = RW - 8 - (stackW * sw + (stackW - 1) * sg);
      var sy0 = RH - 18;
      frame(sx0 - 3, sy0 - 3, stackW * sw + (stackW - 1) * sg + 6, bh + 6,
        COL.hudFrame[0], COL.hudFrame[1], COL.hudFrame[2]);
      var barH = bh - 2;
      for (i = 0; i < stackW; i++) {
        var bxx = sx0 + i * (sw + sg);
        rect(bxx, sy0, sw, barH, COL.hudBg[0], COL.hudBg[1], COL.hudBg[2]);
        var on = i < this.signalBars;
        var cc = on ? COL.hudOk : COL.hudDim;
        if (on) rect(bxx + 1, sy0 + 1, sw - 2, barH - 2, cc[0], cc[1], cc[2]);
        else px(bxx + 1, sy0 + barH - 2, cc[0], cc[1], cc[2]);
      }
    }

    postFrame() {
      var src = this.screen;
      var out = this.view;
      var prev = this.prev;
      var noise = this.noise;
      var vlook = this.vignette;
      var glitch = this.glitch * this.vhsIntensity;
      var base = 0.12 + glitch * 0.42;
      var chroma = 1 + ((glitch * 1.6) | 0);
      if (chroma > 4) chroma = 4;
      var noiseOff = this.noiseOff;
      var band = this.bandY;
      var BAND = 26;
      var nScale = (0.3 + glitch) * this.vhsIntensity;
      var dark = (1 - this.fade) * (1 - this.cutDark);

      this.noiseOff = (this.noiseOff + 1237) & 0xffff;

      for (var y = 0; y < RH; y++) {
        var rowBase = y * RW;
        var scan = (y & 1) ? 0.84 : 1.0;
        var bandDist = Math.abs(y - band);
        var bandAmt = bandDist < BAND ? (1 - bandDist / BAND) : 0;
        var off = Math.sin((y + this.time * 90) * 0.35) * base;
        if (bandAmt > 0) off += bandAmt * (5 + glitch * 9) * ((y & 3) === 0 ? -1 : 1);
        if (bandAmt > 0.55 && noise[(y + noiseOff) & 0xffff] > 246) off += 15;

        for (var x = 0; x < RW; x++) {
          var idx = rowBase + x;
          var xi = (x + off) | 0;
          if (xi < 0) xi = 0;
          else if (xi >= RW) xi = RW - 1;
          var xr = xi + chroma;
          if (xr >= RW) xr = RW - 1;
          var xb = xi - chroma;
          if (xb < 0) xb = 0;

          var pc = src[rowBase + xi];
          var r = src[rowBase + xr] & 255;
          var g = (pc >>> 8) & 255;
          var b = (src[rowBase + xb] >>> 16) & 255;

          var pv = prev[idx];
          var ghost = 0.12 * this.vhsIntensity;
          r = r * (1 - ghost) + (pv & 255) * ghost;
          g = g * (1 - ghost) + ((pv >>> 8) & 255) * ghost;
          b = b * (1 - ghost) + ((pv >>> 16) & 255) * ghost;

          r *= scan;
          g *= scan;
          b *= scan;

          var vv = vlook[idx];
          r *= vv;
          g *= vv;
          b *= vv;

          var lum = (r + g + b) * 0.3333;
          var nn = noise[(idx + noiseOff) & 0xffff] / 255 - 0.5;
          nn *= 26 * nScale * (0.4 + (1 - lum / 255));
          r += nn;
          g += nn * 0.95;
          b += nn * 1.06;

          var lg = r * 0.299 + g * 0.587 + b * 0.114;
          r = r * 0.9 + lg * 0.1;
          g = g * 0.9 + lg * 0.1;
          b = b * 0.9 + lg * 0.1;

          r = (r - 128) * 1.12 + 128;
          g = (g - 128) * 1.12 + 128;
          b = (b - 128) * 1.12 + 118;

          if (dark < 1) {
            r *= dark;
            g *= dark;
            b *= dark;
          }

          out[idx] = pack(r, g, b);
        }
      }

      prev.set(out);
    }
  }

  ZFG.games.Backrooms = Backrooms;
})();
