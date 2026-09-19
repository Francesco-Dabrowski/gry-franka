(function () {
  window.ZFG = window.ZFG || {};

  var GRID = 16;
  var SIZE = 48;

  function set(ctx, color, x, y, w, h) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w || 1, h || 1);
  }

  function line(ctx, color, x0, y0, x1, y1) {
    var dx = Math.abs(x1 - x0);
    var dy = -Math.abs(y1 - y0);
    var sx = x0 < x1 ? 1 : -1;
    var sy = y0 < y1 ? 1 : -1;
    var err = dx + dy;
    ctx.fillStyle = color;
    while (true) {
      ctx.fillRect(x0, y0, 1, 1);
      if (x0 === x1 && y0 === y1) break;
      var e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }

  var DRAW = {
    mine: function (ctx) {
      var spikes = [
        [8, 1, 8, 5], [8, 10, 8, 14],
        [1, 8, 5, 8], [10, 8, 14, 8],
        [3, 3, 5, 5], [10, 10, 12, 12],
        [10, 5, 12, 3], [3, 12, 5, 10]
      ];
      spikes.forEach(function (s) { line(ctx, '#000000', s[0], s[1], s[2], s[3]); });

      set(ctx, '#1a1a1a', 6, 5, 4, 6);
      set(ctx, '#1a1a1a', 5, 6, 6, 4);
      set(ctx, '#1a1a1a', 7, 4, 2, 8);
      set(ctx, '#666666', 6, 5, 2, 2);
      set(ctx, '#cccccc', 6, 5, 1, 1);
      set(ctx, '#000000', 7, 7, 2, 2);
    },

    solitaire: function (ctx) {
      set(ctx, '#000080', 2, 3, 8, 11);
      set(ctx, '#ffffff', 3, 4, 6, 9);
      set(ctx, '#000080', 3, 4, 6, 9);
      set(ctx, '#6ea8ff', 4, 5, 4, 7);

      set(ctx, '#000000', 6, 4, 8, 11);
      set(ctx, '#ffffff', 7, 5, 6, 9);

      set(ctx, '#c00000', 10, 6, 1, 1);
      set(ctx, '#c00000', 9, 7, 3, 1);
      set(ctx, '#c00000', 10, 8, 1, 1);
    },

    spider: function (ctx) {
      line(ctx, '#111111', 6, 6, 2, 3);
      line(ctx, '#111111', 6, 7, 2, 6);
      line(ctx, '#111111', 6, 8, 2, 10);
      line(ctx, '#111111', 6, 9, 3, 12);
      line(ctx, '#111111', 9, 6, 13, 3);
      line(ctx, '#111111', 9, 7, 13, 6);
      line(ctx, '#111111', 9, 8, 13, 10);
      line(ctx, '#111111', 9, 9, 12, 12);

      set(ctx, '#222222', 6, 6, 4, 5);
      set(ctx, '#444444', 6, 6, 4, 2);
      set(ctx, '#c00000', 7, 6, 1, 1);
      set(ctx, '#c00000', 8, 6, 1, 1);
    },

    backrooms: function (ctx) {
      set(ctx, '#f2eec2', 3, 0, 4, 1);
      set(ctx, '#e6df9e', 2, 1, 6, 1);

      set(ctx, '#c9b45a', 0, 2, 16, 10);
      set(ctx, '#b6a24c', 0, 2, 1, 10);
      set(ctx, '#b6a24c', 15, 2, 1, 10);
      set(ctx, '#b6a24c', 4, 2, 1, 10);
      set(ctx, '#b6a24c', 11, 2, 1, 10);
      set(ctx, '#d8c76b', 1, 2, 1, 10);
      set(ctx, '#d8c76b', 8, 2, 1, 10);

      set(ctx, '#8a7a3e', 0, 12, 16, 4);
      set(ctx, '#7a6b35', 0, 12, 16, 1);
      set(ctx, '#6d6030', 1, 13, 2, 2);
      set(ctx, '#6d6030', 7, 14, 3, 1);
      set(ctx, '#6d6030', 12, 13, 2, 2);

      set(ctx, '#161512', 6, 4, 4, 9);
      set(ctx, '#000000', 6, 4, 4, 1);
      set(ctx, '#2a2822', 6, 5, 1, 8);
      set(ctx, '#2a2822', 9, 5, 1, 8);
      set(ctx, '#3a382e', 7, 5, 2, 1);
    },

    palette: function (ctx) {
      var cx = 7.5;
      var cy = 8.5;
      for (var y = 0; y < 16; y++) {
        for (var x = 0; x < 16; x++) {
          var dx = (x - cx) / 6.7;
          var dy = (y - cy) / 5.3;
          var d = Math.sqrt(dx * dx + dy * dy);
          if (d < 1) set(ctx, '#d8b483', x, y);
          else if (d < 1.16) set(ctx, '#6b4a24', x, y);
        }
      }
      set(ctx, '#000000', 3, 9, 3, 3);
      set(ctx, '#8a7a52', 4, 3, 2, 2);
      set(ctx, '#e8dcb0', 8, 2, 2, 2);
      set(ctx, '#1b1b52', 10, 6, 2, 2);
    },

    computer: function (ctx) {
      set(ctx, '#404040', 1, 2, 14, 9);
      set(ctx, '#008080', 2, 3, 12, 7);
      set(ctx, '#00c0c0', 2, 3, 12, 2);
      set(ctx, '#c0c0c0', 2, 8, 12, 2);
      set(ctx, '#404040', 7, 11, 2, 2);
      set(ctx, '#404040', 5, 13, 6, 1);
    },

    unknown: function (ctx) {
      set(ctx, '#404040', 2, 2, 12, 12);
      set(ctx, '#c0c0c0', 3, 3, 10, 10);
      set(ctx, '#008080', 5, 5, 6, 6);
    }
  };

  function create(id, size) {
    var canvas = document.createElement('canvas');
    canvas.width = GRID;
    canvas.height = GRID;
    canvas.className = 'pixel-icon';
    canvas.style.width = (size || SIZE) + 'px';
    canvas.style.height = (size || SIZE) + 'px';

    var ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    (DRAW[id] || DRAW.unknown)(ctx);
    return canvas;
  }

  ZFG.icons = {
    create: create,

    fill: function (target, id, size) {
      if (!target) return;
      target.innerHTML = '';
      target.appendChild(create(id, size));
    },

    init: function () {
      var nodes = document.querySelectorAll('[data-pixel-icon]');
      Array.prototype.forEach.call(nodes, function (node) {
        var size = parseInt(node.getAttribute('data-pixel-size'), 10);
        ZFG.icons.fill(node, node.getAttribute('data-pixel-icon'), size || undefined);
      });
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { ZFG.icons.init(); });
  } else {
    ZFG.icons.init();
  }
})();
