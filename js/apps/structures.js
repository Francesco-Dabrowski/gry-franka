(function () {
  window.ZFG = window.ZFG || {};

  var KEY = 'zfg.backrooms.structures.v1';
  var PAINT = { '.': '#000000', '0': '#e8dcb0', '1': '#8a7a52', 'x': '#1b1b52' };
  var B = 18;

  function uid() {
    return 's' + Date.now().toString(36) + Math.floor(Math.random() * 1000).toString(36);
  }

  function clamp(v, a, b) {
    return v < a ? a : (v > b ? b : v);
  }

  function normalizeGrid(grid) {
    var rows = [];
    for (var i = 0; i < grid.length; i++) {
      rows.push(typeof grid[i] === 'string' ? grid[i] : grid[i].join(''));
    }
    return rows;
  }

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return [];
      var data = JSON.parse(raw);
      var arr = data && data.structures ? data.structures
        : (Object.prototype.toString.call(data) === '[object Array]' ? data : []);
      return arr.map(function (s) {
        var g = normalizeGrid(s.grid || s.data || []);
        return {
          id: s.id || uid(),
          name: s.name || 'struktura',
          rarity: s.rarity || 5,
          repeat: s.repeat || 5,
          grid: g
        };
      }).filter(function (s) { return s.grid.length && s.grid[0].length; });
    } catch (err) {
      return [];
    }
  }

  function save(list) {
    try {
      var payload = {
        structures: list.map(function (s) {
          return {
            id: s.id, name: s.name,
            cols: s.grid[0].length, rows: s.grid.length,
            rarity: s.rarity, repeat: s.repeat,
            grid: s.grid
          };
        })
      };
      localStorage.setItem(KEY, JSON.stringify(payload));
      return true;
    } catch (err) {
      return false;
    }
  }

  function parseCode(text) {
    var lines = String(text || '').split(/\r?\n/);
    var name = '';
    var rarity = 5;
    var repeat = 5;
    var rows = [];
    for (var i = 0; i < lines.length; i++) {
      var t = lines[i].trim();
      if (!t) continue;
      var m;
      if ((m = t.match(/nazwa\s*:\s*(.+)/i))) { name = m[1].trim(); continue; }
      if ((m = t.match(/rzadkosc\s*:\s*(\d+)/i))) { rarity = clamp(parseInt(m[1], 10), 1, 10); continue; }
      if ((m = t.match(/powtarzalnosc\s*:\s*(\d+)/i))) { repeat = clamp(parseInt(m[1], 10), 1, 10); continue; }
      if (t.charAt(0) === '#') continue;
      if (/^[01xX.]+$/.test(t)) rows.push(t.replace(/X/g, 'x'));
    }
    if (!rows.length) return null;
    var cols = rows[0].length;
    for (var r = 0; r < rows.length; r++) {
      var row = rows[r];
      if (row.length < cols) row += new Array(cols - row.length + 1).join('0');
      rows[r] = row.slice(0, cols);
    }
    return {
      id: uid(),
      name: name || ('struktura ' + (Math.floor(Math.random() * 900) + 100)),
      rarity: rarity,
      repeat: repeat,
      grid: rows
    };
  }

  var App = {
    list: [],
    currentId: null,

    init: function () {
      this.listEl = document.getElementById('list');
      this.canvas = document.getElementById('preview');
      if (!this.canvas) return;
      this.ctx = this.canvas.getContext('2d');
      this.meta = document.getElementById('meta');
      this.status = document.getElementById('status');

      this.list = load();
      if (this.list.length) this.currentId = this.list[0].id;

      this.bind();
      this.renderList();
      this.previewCurrent();
    },

    bind: function () {
      var self = this;
      document.getElementById('btn-add').addEventListener('click', function () { self.addFromInput(); });
      document.getElementById('btn-preview').addEventListener('click', function () {
        var s = parseCode(document.getElementById('input').value);
        if (!s) { self.setStatus('Nie rozpoznano struktury — potrzebne wiersze z 0/1/x.'); return; }
        self.draw(s);
        self.showMeta(s, true);
      });
      document.getElementById('btn-delete').addEventListener('click', function () { self.removeCurrent(); });
      document.getElementById('btn-clear').addEventListener('click', function () { self.clearAll(); });
    },

    setStatus: function (text) {
      if (this.status) this.status.textContent = text;
    },

    renderList: function () {
      var self = this;
      this.listEl.innerHTML = '';
      if (!this.list.length) {
        var empty = document.createElement('div');
        empty.className = 'editor__hint';
        empty.textContent = '(brak wczytanych struktur — świat będzie samą podłogą)';
        this.listEl.appendChild(empty);
        return;
      }
      this.list.forEach(function (s) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'catalog-item' + (s.id === self.currentId ? ' is-active' : '');
        btn.textContent = s.name + ' (' + s.grid[0].length + '×' + s.grid.length + ')';
        btn.addEventListener('click', function () {
          self.currentId = s.id;
          self.renderList();
          self.previewCurrent();
        });
        self.listEl.appendChild(btn);
      });
    },

    current: function () {
      for (var i = 0; i < this.list.length; i++) {
        if (this.list[i].id === this.currentId) return this.list[i];
      }
      return null;
    },

    previewCurrent: function () {
      var s = this.current();
      if (!s) {
        this.canvas.width = 1;
        this.canvas.height = 1;
        if (this.meta) this.meta.textContent = '';
        return;
      }
      this.draw(s);
      this.showMeta(s, false);
    },

    showMeta: function (s, fromInput) {
      if (!this.meta) return;
      this.meta.textContent = (fromInput ? 'PODGLĄD: ' : '') + s.name + ' · ' +
        s.grid[0].length + '×' + s.grid.length + ' · rzadkość ' + s.rarity + '/10 · powtarzalność ' + s.repeat + '/10';
    },

    draw: function (s) {
      var cols = s.grid[0].length;
      var rows = s.grid.length;
      this.canvas.width = cols * B;
      this.canvas.height = rows * B;
      this.canvas.style.width = '';
      this.canvas.style.height = '';
      var ctx = this.ctx;
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      for (var y = 0; y < rows; y++) {
        for (var x = 0; x < cols; x++) {
          var c = s.grid[y].charAt(x);
          ctx.fillStyle = c === '.' ? '#000000' : (PAINT[c] || '#000000');
          ctx.fillRect(x * B, y * B, B, B);
          ctx.strokeStyle = 'rgba(255,255,255,0.85)';
          ctx.lineWidth = 1;
          ctx.strokeRect(x * B + 0.5, y * B + 0.5, B - 1, B - 1);
        }
      }
    },

    addFromInput: function () {
      var s = parseCode(document.getElementById('input').value);
      if (!s) { this.setStatus('Nie rozpoznano struktury — potrzebne wiersze z 0/1/x.'); return; }
      this.list.push(s);
      this.currentId = s.id;
      save(this.list);
      this.renderList();
      this.previewCurrent();
      this.setStatus('Dodano: ' + s.name);
    },

    removeCurrent: function () {
      var s = this.current();
      if (!s) return;
      this.list = this.list.filter(function (x) { return x.id !== s.id; });
      this.currentId = this.list.length ? this.list[0].id : null;
      save(this.list);
      this.renderList();
      this.previewCurrent();
      this.setStatus('Usunięto: ' + s.name);
    },

    clearAll: function () {
      this.list = [];
      this.currentId = null;
      save(this.list);
      this.renderList();
      this.previewCurrent();
      this.setStatus('Wyczyszczono — świat będzie samą podłogą.');
    }
  };

  ZFG.structures = App;
})();
