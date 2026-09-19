(function () {
  window.ZFG = window.ZFG || {};

  var KEY = 'zfg.structures.v1';
  var B = 16;
  var PAINT = { '.': '#000000', '0': '#e8dcb0', '1': '#8a7a52', 'x': '#1b1b52' };

  function uid() {
    return 's' + Date.now().toString(36) + Math.floor(Math.random() * 1000).toString(36);
  }

  function makeGrid(cols, rows) {
    var grid = [];
    for (var y = 0; y < rows; y++) {
      var row = [];
      for (var x = 0; x < cols; x++) row.push('.');
      grid.push(row);
    }
    return grid;
  }

  function sampleGrid() {
    var rows = [
      '1111111111111111',
      '1000000000000001',
      '1011000011000101',
      '1011000011000101',
      '1000000000000001',
      '1000000000000001',
      '1000011001100001',
      '1000011001100001',
      '1000000000000001',
      '1000011001100001',
      '1000011001100001',
      '1000000000000001',
      '1000000000000001',
      '1011000011000101',
      '1011000011000101',
      '1111111111111111'
    ];
    return rows.map(function (r) { return r.split(''); });
  }

  function cloneGrid(grid) {
    return grid.map(function (row) { return row.slice(); });
  }

  function promptFields(title, fields) {
    return new Promise(function (resolve) {
      var backdrop = document.createElement('div');
      backdrop.className = 'modal';
      var card = document.createElement('div');
      card.className = 'overlay-card';

      var heading = document.createElement('h2');
      heading.className = 'overlay-card__title';
      heading.textContent = title;
      card.appendChild(heading);

      var form = document.createElement('div');
      form.className = 'overlay-card__text';
      var inputs = {};

      fields.forEach(function (field) {
        var label = document.createElement('label');
        label.className = 'editor__field';
        var span = document.createElement('span');
        span.textContent = field.label;
        var input = document.createElement('input');
        input.className = 'input';
        input.type = field.type || 'text';
        input.value = field.value == null ? '' : field.value;
        if (field.min != null) input.min = field.min;
        if (field.max != null) input.max = field.max;
        label.appendChild(span);
        label.appendChild(input);
        form.appendChild(label);
        inputs[field.key] = input;
      });
      card.appendChild(form);

      var actions = document.createElement('div');
      actions.className = 'overlay-card__actions';

      function close(result) {
        if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
        resolve(result);
      }

      var ok = document.createElement('button');
      ok.className = 'btn btn--primary';
      ok.type = 'button';
      ok.textContent = 'OK';
      ok.addEventListener('click', function () {
        var out = {};
        fields.forEach(function (field) {
          out[field.key] = inputs[field.key].value;
        });
        close(out);
      });

      var cancel = document.createElement('button');
      cancel.className = 'btn';
      cancel.type = 'button';
      cancel.textContent = 'Anuluj';
      cancel.addEventListener('click', function () { close(null); });

      actions.appendChild(ok);
      actions.appendChild(cancel);
      card.appendChild(actions);

      backdrop.appendChild(card);
      backdrop.addEventListener('click', function (event) {
        if (event.target === backdrop) close(null);
      });
      document.body.appendChild(backdrop);
      var first = fields[0] && inputs[fields[0].key];
      if (first) first.focus();
    });
  }

  function confirmBox(title, text) {
    return new Promise(function (resolve) {
      var backdrop = document.createElement('div');
      backdrop.className = 'modal';
      var card = document.createElement('div');
      card.className = 'overlay-card';

      var heading = document.createElement('h2');
      heading.className = 'overlay-card__title';
      heading.textContent = title;

      var body = document.createElement('p');
      body.className = 'overlay-card__text';
      body.textContent = text;

      var actions = document.createElement('div');
      actions.className = 'overlay-card__actions';

      function close(value) {
        if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
        resolve(value);
      }

      var yes = document.createElement('button');
      yes.className = 'btn btn--primary';
      yes.type = 'button';
      yes.textContent = 'Tak';
      yes.addEventListener('click', function () { close(true); });

      var no = document.createElement('button');
      no.className = 'btn';
      no.type = 'button';
      no.textContent = 'Nie';
      no.addEventListener('click', function () { close(false); });

      actions.appendChild(yes);
      actions.appendChild(no);
      card.appendChild(heading);
      card.appendChild(body);
      card.appendChild(actions);
      backdrop.appendChild(card);
      document.body.appendChild(backdrop);
    });
  }

  var Editor = {
    structures: [],
    currentId: null,
    tool: 'pencil',
    color: '1',
    cellSize: 50,
    painting: false,
    saveTimer: null,

    init: function () {
      this.canvas = document.getElementById('grid');
      if (!this.canvas) return;
      this.ctx = this.canvas.getContext('2d');
      this.cursor = document.getElementById('cursor');
      this.wrap = document.getElementById('canvas-wrap');

      this.load();
      if (!this.structures.length) {
        var grid = sampleGrid();
        this.structures.push({
          id: uid(),
          name: 'Przykład — filary',
          cols: grid[0].length,
          rows: grid.length,
          grid: grid
        });
      }
      if (!this.byId(this.currentId)) this.currentId = this.structures[0].id;

      this.bind();
      this.renderCatalog();
      this.select(this.currentId);
      this.syncSizeButtons();
    },

    load: function () {
      try {
        var raw = localStorage.getItem(KEY);
        var data = raw ? JSON.parse(raw) : null;
        if (data && data.structures) {
          this.structures = data.structures.map(function (s) {
            s.grid = (s.grid || []).map(function (row) {
              return typeof row === 'string' ? row.split('') : row.slice();
            });
            return s;
          });
          this.currentId = data.currentId || null;
          if (data.cellSize) this.cellSize = data.cellSize;
        }
      } catch (err) {
        this.structures = [];
      }
    },

    save: function () {
      var self = this;
      clearTimeout(this.saveTimer);
      this.saveTimer = setTimeout(function () {
        try {
          var payload = {
            cellSize: self.cellSize,
            currentId: self.currentId,
            structures: self.structures.map(function (s) {
              return { id: s.id, name: s.name, cols: s.cols, rows: s.rows, grid: s.grid.map(function (r) { return r.join(''); }) };
            })
          };
          localStorage.setItem(KEY, JSON.stringify(payload));
        } catch (err) {
          /* storage unavailable */
        }
      }, 300);
    },

    byId: function (id) {
      for (var i = 0; i < this.structures.length; i++) {
        if (this.structures[i].id === id) return this.structures[i];
      }
      return null;
    },

    current: function () {
      return this.byId(this.currentId);
    },

    bind: function () {
      var self = this;

      document.querySelectorAll('.tool-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          self.tool = btn.getAttribute('data-tool');
          document.querySelectorAll('.tool-btn').forEach(function (b) {
            b.classList.toggle('is-active', b === btn);
          });
        });
      });

      document.querySelectorAll('.swatch').forEach(function (btn) {
        btn.addEventListener('click', function () {
          self.color = btn.getAttribute('data-color');
          document.querySelectorAll('.swatch').forEach(function (b) {
            b.classList.toggle('is-active', b === btn);
          });
        });
      });

      document.querySelectorAll('.size-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          self.setCellSize(parseInt(btn.getAttribute('data-size'), 10));
        });
      });

      var applySize = document.getElementById('apply-size');
      var custom = document.getElementById('custom-size');
      if (applySize && custom) {
        applySize.addEventListener('click', function () {
          var v = parseInt(custom.value, 10);
          if (v >= 8 && v <= 200) self.setCellSize(v);
        });
      }

      document.getElementById('btn-new').addEventListener('click', function () { self.newStructure(); });
      document.getElementById('btn-rename').addEventListener('click', function () { self.renameStructure(); });
      document.getElementById('btn-duplicate').addEventListener('click', function () { self.duplicateStructure(); });
      document.getElementById('btn-delete').addEventListener('click', function () { self.deleteStructure(); });
      document.getElementById('btn-copy').addEventListener('click', function () { self.copy('code'); });
      document.getElementById('btn-copy-json').addEventListener('click', function () { self.copy('json'); });

      this.canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
      this.canvas.addEventListener('pointerdown', function (e) { self.onDown(e); });
      this.canvas.addEventListener('pointermove', function (e) { self.onMove(e); });
      this.canvas.addEventListener('pointerleave', function () { self.cursor.classList.add('hidden'); });
      window.addEventListener('pointerup', function () { self.painting = false; });
    },

    setCellSize: function (size) {
      this.cellSize = size;
      this.syncSizeButtons();
      this.applyCanvasSize();
      this.save();
    },

    syncSizeButtons: function () {
      var self = this;
      document.querySelectorAll('.size-btn').forEach(function (btn) {
        btn.classList.toggle('is-active', parseInt(btn.getAttribute('data-size'), 10) === self.cellSize);
      });
      var custom = document.getElementById('custom-size');
      if (custom && [50, 100].indexOf(this.cellSize) < 0) custom.value = this.cellSize;
    },

    applyCanvasSize: function () {
      var s = this.current();
      if (!s) return;
      this.canvas.style.width = (s.cols * this.cellSize) + 'px';
      this.canvas.style.height = (s.rows * this.cellSize) + 'px';
    },

    renderCatalog: function () {
      var self = this;
      var list = document.getElementById('catalog');
      list.innerHTML = '';
      this.structures.forEach(function (s) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'catalog-item' + (s.id === self.currentId ? ' is-active' : '');
        btn.textContent = s.name;
        btn.addEventListener('click', function () { self.select(s.id); });
        list.appendChild(btn);
      });
    },

    select: function (id) {
      this.currentId = id;
      this.renderCatalog();
      this.renderCanvas();
      this.applyCanvasSize();
      this.updateCode();
      this.save();
    },

    renderCanvas: function () {
      var s = this.current();
      if (!s) return;
      this.canvas.width = s.cols * B;
      this.canvas.height = s.rows * B;
      var ctx = this.ctx;
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      for (var y = 0; y < s.rows; y++) {
        for (var x = 0; x < s.cols; x++) {
          this.drawCell(x, y);
        }
      }
    },

    drawCell: function (x, y) {
      var s = this.current();
      if (!s || !s.grid[y] || s.grid[y][x] === undefined) return;
      var ctx = this.ctx;
      var ch = s.grid[y][x];
      var px = x * B;
      var py = y * B;
      ctx.fillStyle = ch === '.' ? '#000000' : PAINT[ch];
      ctx.fillRect(px, py, B, B);
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 0.5, py + 0.5, B - 1, B - 1);
    },

    cellFromEvent: function (event) {
      var s = this.current();
      if (!s) return null;
      var rect = this.canvas.getBoundingClientRect();
      var x = Math.floor((event.clientX - rect.left) / rect.width * s.cols);
      var y = Math.floor((event.clientY - rect.top) / rect.height * s.rows);
      if (x < 0 || y < 0 || x >= s.cols || y >= s.rows) return null;
      return { x: x, y: y };
    },

    onDown: function (event) {
      var cell = this.cellFromEvent(event);
      if (!cell) return;
      this.painting = true;
      try { this.canvas.setPointerCapture(event.pointerId); } catch (err) { /* noop */ }
      if (this.tool === 'fill') {
        this.floodFill(cell.x, cell.y, event.button === 2 ? '.' : this.color);
      } else {
        this.paint(cell.x, cell.y, event);
      }
    },

    onMove: function (event) {
      var cell = this.cellFromEvent(event);
      if (cell) {
        this.moveCursor(cell.x, cell.y);
      } else {
        this.cursor.classList.add('hidden');
      }
      if (!this.painting || this.tool === 'fill' || !cell) return;
      this.paint(cell.x, cell.y, event);
    },

    moveCursor: function (x, y) {
      var s = this.current();
      if (!s) return;
      this.cursor.classList.remove('hidden');
      this.cursor.style.left = (x * this.cellSize) + 'px';
      this.cursor.style.top = (y * this.cellSize) + 'px';
      this.cursor.style.width = this.cellSize + 'px';
      this.cursor.style.height = this.cellSize + 'px';
    },

    paint: function (x, y, event) {
      var s = this.current();
      if (!s) return;
      var ch = this.color;
      if (this.tool === 'eraser' || event.button === 2) ch = '.';
      if (s.grid[y][x] === ch) return;
      s.grid[y][x] = ch;
      this.drawCell(x, y);
      this.updateCode();
      this.save();
    },

    floodFill: function (x, y, color) {
      var s = this.current();
      if (!s) return;
      var target = s.grid[y][x];
      if (target === color) return;
      var stack = [[x, y]];
      while (stack.length) {
        var p = stack.pop();
        var cx = p[0];
        var cy = p[1];
        if (cx < 0 || cy < 0 || cx >= s.cols || cy >= s.rows) continue;
        if (s.grid[cy][cx] !== target) continue;
        s.grid[cy][cx] = color;
        this.drawCell(cx, cy);
        stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
      }
      this.updateCode();
      this.save();
    },

    newStructure: function () {
      var self = this;
      promptFields('Nowa struktura', [
        { key: 'name', label: 'Nazwa', value: 'Struktura ' + (this.structures.length + 1) },
        { key: 'cols', label: 'Szerokość (piksele = 3×3 tile)', value: 16, type: 'number', min: 1, max: 200 },
        { key: 'rows', label: 'Wysokość', value: 16, type: 'number', min: 1, max: 200 }
      ]).then(function (res) {
        if (!res) return;
        var cols = Math.max(1, Math.min(200, parseInt(res.cols, 10) || 16));
        var rows = Math.max(1, Math.min(200, parseInt(res.rows, 10) || 16));
        var s = { id: uid(), name: res.name || 'Struktura', cols: cols, rows: rows, grid: makeGrid(cols, rows) };
        self.structures.push(s);
        self.select(s.id);
      });
    },

    renameStructure: function () {
      var self = this;
      var s = this.current();
      if (!s) return;
      promptFields('Zmień nazwę', [{ key: 'name', label: 'Nazwa', value: s.name }]).then(function (res) {
        if (!res || !res.name) return;
        s.name = res.name;
        self.renderCatalog();
        self.save();
      });
    },

    duplicateStructure: function () {
      var s = this.current();
      if (!s) return;
      var copy = { id: uid(), name: s.name + ' — kopia', cols: s.cols, rows: s.rows, grid: cloneGrid(s.grid) };
      this.structures.push(copy);
      this.select(copy.id);
    },

    deleteStructure: function () {
      var self = this;
      var s = this.current();
      if (!s) return;
      if (this.structures.length <= 1) {
        confirmBox('Nie można usunąć', 'Musi zostać co najmniej jedna struktura.').then(function () {});
        return;
      }
      confirmBox('Usunąć strukturę?', '„' + s.name + '” zostanie trwale usunięta.').then(function (ok) {
        if (!ok) return;
        self.structures = self.structures.filter(function (item) { return item.id !== s.id; });
        self.currentId = self.structures[0].id;
        self.select(self.currentId);
      });
    },

    generateCode: function () {
      var s = this.current();
      if (!s) return '';
      var lines = [];
      lines.push('# ZFG-STRUKTURA v1');
      lines.push('# nazwa: ' + s.name);
      lines.push('# komorka: 3x3 male tile');
      lines.push('# rozmiar: ' + s.cols + 'x' + s.rows);
      lines.push('# legenda: . puste | 0 podloga | 1 sciana | x dziura');
      lines.push('#---');
      for (var y = 0; y < s.rows; y++) lines.push(s.grid[y].join(''));
      return lines.join('\n');
    },

    generateJson: function () {
      var s = this.current();
      if (!s) return '';
      return JSON.stringify({
        format: 'ZFG-STRUKTURA',
        version: 1,
        name: s.name,
        cell: '3x3 tile',
        cols: s.cols,
        rows: s.rows,
        legend: { '.': 'puste', '0': 'podloga', '1': 'sciana', 'x': 'dziura' },
        grid: s.grid.map(function (r) { return r.join(''); })
      }, null, 2);
    },

    updateCode: function () {
      var area = document.getElementById('code');
      if (area) area.value = this.generateCode();
    },

    copy: function (kind) {
      var text = kind === 'json' ? this.generateJson() : this.generateCode();
      var hint = document.getElementById('hint');
      function done() {
        if (hint) hint.textContent = 'Skopiowano ' + (kind === 'json' ? 'JSON' : 'kod') + ' do schowka.';
      }
      function fallback() {
        var tmp = document.createElement('textarea');
        tmp.value = text;
        tmp.style.position = 'fixed';
        tmp.style.left = '-9999px';
        document.body.appendChild(tmp);
        tmp.select();
        try { document.execCommand('copy'); } catch (err) { /* noop */ }
        document.body.removeChild(tmp);
        done();
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, fallback);
      } else {
        fallback();
      }
    }
  };

  ZFG.editor = Editor;
})();
