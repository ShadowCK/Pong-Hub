// Setup socket IO
const http = require('http');
const { Server } = require('socket.io');
const game = require('./game');
const packets = require('./packets');

let io;

/**
 * @param {import('socket.io').Socket} socket
 */
const initSocketEvents = (socket) => {
  // Note: To access/modify session data, manually reload session by calling
  // socket.request.session.reload() to ensure the session object has the latest data
  // as socket.io does not do this for us. (only automatically updated for http requests)
  socket.on('disconnect', () => {
    console.log('A user disconnected');
    const { session } = socket.request;
    session.reload((err) => {
      console.log('Cleaning socket.io related session data');
      if (err) {
        console.log('Session alreay destroyed, probably because user logged out.');
      } else {
        session.isConnectedToGame = false;
        session.save();
      }
    });
    game.onPlayerLeave(socket);
  });

  socket.on('playerMovement', (packet) => {
    const {
      w, a, s, d,
    } = packet;
    game.onPlayerMovementPacket(new packets.PlayerMovementPacket(socket.id, w, a, s, d));
  });

  const gameData = game.getGameData();
  // Initial game update to the client
  socket.emit('gameUpdate', gameData);

  // ...Other code...
};

const socketSetup = (app, sessionMiddleware) => {
  const server = http.createServer(app);
  io = new Server(server);
  // This grants socket.io access to the session data
  io.engine.use(sessionMiddleware);

  // Avoid multiple connections for one user
  // socket.io middlewares are executed before the connection event is fired.
  io.use((socket, next) => {
    // * Does not need to reload session here, because the middleware
    // is processing a newly created socket, whose session is just loaded.
    const { session } = socket.request;
    // If already connected to the game, reject the connection
    if (session.isConnectedToGame === true) {
      console.log("Rejected a user because they're already connected to the game");
      socket.disconnect();
      return;
    }
    session.isConnectedToGame = true;
    session.save();
    next();
  });

  io.on('connection', (socket) => {
    console.log('A user connected');
    console.log(socket.request.session);

    game.onPlayerJoin(socket);
    initSocketEvents(socket);
  });

  setInterval(() => {
    game.gameLoop();
    // TODO: This is super dirty and laggy because it spams the client and abuses network
    // But it works for now
    io.emit('gameUpdate', game.getGameData());
  }, 1000 / 60);
  return server;
};

module.exports = socketSetup;
