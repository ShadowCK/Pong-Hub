const Player = require('./Player.js');

/** @type {{ [playerId: string]: Player }} */
const players = {};

const gameState = {
  lastUpdatedTime: performance.now(),
  deltaTime: 0, // in seconds
};

const getGameData = () => ({
  players,
  gameState,
});

/**
 * @param {import('../packets').PlayerMovementPacket} packet
 */
const onPlayerMovementPacket = (packet) => {
  const { playerId, w, s, a, d } = packet;
  const player = players[playerId];
  if (player) {
    if (w === s) {
      player.direction.y = 0;
    } else {
      player.direction.y = w ? -1 : 1;
    }
    if (a === d) {
      player.direction.x = 0;
    } else {
      player.direction.x = a ? -1 : 1;
    }
  }
};

const gameLoop = () => {
  // Update delta time
  const currentTime = performance.now() / 1000;
  const deltaTime = currentTime - gameState.lastUpdatedTime;
  gameState.deltaTime = deltaTime;

  Object.values(players).forEach((player) => {
    player.move(gameState.deltaTime);
  });
  gameState.lastUpdatedTime = currentTime;
};

const addPlayer = (playerId, x, y, width, height) => {
  players[playerId] = new Player(playerId, x, y, width, height);
};

const removePlayer = (playerId) => {
  delete players[playerId];
};

module.exports = {
  onPlayerMovementPacket,
  gameLoop,
  addPlayer,
  removePlayer,
  getGameData,
};
