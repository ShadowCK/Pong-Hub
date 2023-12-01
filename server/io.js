// Setup socket IO
const http = require('http');
const { Server } = require('socket.io');
const gameLogic = require('./game');

let io;

const initSocketEvents = (socket) => {
  console.log('a user connected');

  // Add player to game
  gameLogic.addPlayer(socket.id, 0, 0, 20, 100);

  socket.on('disconnect', () => {
    console.log('a user disconnected');
    gameLogic.removePlayer(socket.id);
    io.emit('gameUpdate', gameLogic.getGameData());
  });

  socket.on('playerAction', (action) => {
    const gameData = gameLogic.updateGame(socket.id, action);
    io.emit('gameUpdate', gameData);
  });

  const gameData = gameLogic.getGameData();
  // Initial game update to the client
  socket.emit('gameUpdate', gameData);
  console.log(gameData);

  // ...Other code...
};

const socketSetup = (app) => {
  const server = http.createServer(app);
  io = new Server(server);
  io.on('connection', (socket) => {
    initSocketEvents(socket);
  });
  return server;
};

module.exports = socketSetup;
