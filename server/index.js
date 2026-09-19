const path = require('path');
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const { Rooms } = require('./rooms');

const PORT = process.env.PORT || 3000;
const ROOT = path.join(__dirname, '..');

const app = express();
app.use(express.static(ROOT));

app.get('/health', (req, res) => {
  res.json({ ok: true, rooms: rooms.rooms.size });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const rooms = new Rooms();

function players(room) {
  return room.players.map((player) => ({ id: player.id, name: player.name }));
}

io.on('connection', (socket) => {
  socket.on('room:create', (payload, ack) => {
    try {
      const room = rooms.create(socket, payload && payload.game, payload && payload.name);
      if (typeof ack === 'function') {
        ack({
          ok: true,
          code: room.code,
          playerId: socket.id,
          hostId: room.hostId,
          players: players(room)
        });
      }
      io.to(room.code).emit('room:players', rooms.publicState(room));
    } catch (error) {
      if (typeof ack === 'function') ack({ ok: false, error: error.message });
    }
  });

  socket.on('room:join', (payload, ack) => {
    try {
      const room = rooms.join(socket, payload && payload.code, payload && payload.name);
      if (typeof ack === 'function') {
        ack({
          ok: true,
          code: room.code,
          playerId: socket.id,
          hostId: room.hostId,
          players: players(room)
        });
      }
      io.to(room.code).emit('room:players', rooms.publicState(room));
    } catch (error) {
      if (typeof ack === 'function') ack({ ok: false, error: error.message });
    }
  });

  socket.on('room:start', (payload, ack) => {
    try {
      const room = rooms.start(socket);
      io.to(room.code).emit('room:started', rooms.publicState(room));
      if (typeof ack === 'function') ack({ ok: true });
    } catch (error) {
      if (typeof ack === 'function') ack({ ok: false, error: error.message });
    }
  });

  socket.on('room:leave', () => {
    rooms.leave(socket, 'Drugi gracz opuścił pokój.');
  });

  socket.on('game:state', (payload) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || !payload || payload.code !== room.code) return;
    socket.to(room.code).emit('game:state', payload.state);
  });

  socket.on('game:event', (payload) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || !payload || payload.code !== room.code) return;
    socket.to(room.code).emit('game:event', {
      type: payload.type,
      data: payload.data,
      from: socket.id
    });
  });

  socket.on('disconnect', () => {
    rooms.leave(socket, 'Drugi gracz rozłączył się.');
  });
});

server.listen(PORT, () => {
  console.log(`Serwer gier działa na http://localhost:${PORT}`);
});
