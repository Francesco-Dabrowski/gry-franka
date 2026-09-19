const MAX_PLAYERS = 2;

class Rooms {
  constructor() {
    this.rooms = new Map();
  }

  generateCode() {
    let code;
    do {
      code = String(Math.floor(1000 + Math.random() * 9000));
    } while (this.rooms.has(code));
    return code;
  }

  create(socket, game, name) {
    const code = this.generateCode();
    const room = {
      code,
      game: game || 'unknown',
      hostId: socket.id,
      started: false,
      players: [{ id: socket.id, name: this._cleanName(name) }]
    };
    this.rooms.set(code, room);
    socket.join(code);
    socket.data.roomCode = code;
    return room;
  }

  join(socket, code, name) {
    const room = this.rooms.get(String(code || '').trim());
    if (!room) {
      const error = new Error('Nie znaleziono pokoju o tym kodzie.');
      error.code = 'NOT_FOUND';
      throw error;
    }
    if (room.players.length >= MAX_PLAYERS) {
      const error = new Error('Pokój jest pełny.');
      error.code = 'FULL';
      throw error;
    }
    if (room.started) {
      const error = new Error('Gra już się rozpoczęła.');
      error.code = 'STARTED';
      throw error;
    }
    if (room.players.some((player) => player.id === socket.id)) {
      return room;
    }

    room.players.push({ id: socket.id, name: this._cleanName(name) });
    socket.join(room.code);
    socket.data.roomCode = room.code;
    return room;
  }

  leave(socket, reason) {
    const code = socket.data.roomCode;
    if (!code) return;

    socket.data.roomCode = null;
    const room = this.rooms.get(code);
    if (!room) return;

    socket.leave(code);
    this.rooms.delete(code);
    socket.to(code).emit('room:closed', {
      reason: reason || 'Drugi gracz opuścił pokój.'
    });
  }

  get(code) {
    return this.rooms.get(code) || null;
  }

  start(socket) {
    const room = this.rooms.get(socket.data.roomCode);
    if (!room) throw new Error('Nie jesteś w pokoju.');
    if (room.hostId !== socket.id) throw new Error('Tylko host może wystartować grę.');
    if (room.players.length < 2) throw new Error('Potrzebny jest drugi gracz.');
    room.started = true;
    return room;
  }

  publicState(room) {
    return {
      code: room.code,
      game: room.game,
      hostId: room.hostId,
      started: room.started,
      players: room.players.map((player) => ({ id: player.id, name: player.name }))
    };
  }

  _cleanName(name) {
    const value = String(name || '').trim().slice(0, 16);
    return value || 'Gracz';
  }
}

module.exports = { Rooms, MAX_PLAYERS };
