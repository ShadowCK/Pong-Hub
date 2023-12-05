// Setup socket IO
const http = require('http');
const { Server } = require('socket.io');
const game = require('./game');
const packets = require('./packets');

let io;

const initSocketEvents = (socket) => {
  game.onPlayerJoin(socket);

  socket.on('disconnect', () => {
    console.log('a user disconnected');
    game.onPlayerLeave(socket);
  });

  socket.on('playerMovement', (packet) => {
    const { w, a, s, d } = packet;
    game.onPlayerMovementPacket(new packets.PlayerMovementPacket(socket.id, w, a, s, d));
  });

  const gameData = game.getGameData();
  // Initial game update to the client
  socket.emit('gameUpdate', gameData);
  console.log(gameData);

  // ...Other code...
};

const socketSetup = (app) => {
  const server = http.createServer(app);
  io = new Server(server);
  io.on('connection', (socket) => {
    console.log('a user connected');
    initSocketEvents(socket);
  });

  setInterval(() => {
    game.gameLoop();
    io.emit('gameUpdate', game.getGameData());
  }, 1000 / 60);
  return server;
};

module.exports = socketSetup;
