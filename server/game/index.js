const Player = require('./Player');
let players = {};

let gameState = {
  // TODO
};

const getGameData = () => ({
  players,
  gameState,
});

const updateGame = (playerId, action) => {
  const player = players[playerId];
  if (player) {
    // Simple movement logic
    const moveDistance = 10;
    switch (action) {
      case 'moveUp':
        player.move(0, -moveDistance);
        break;
      case 'moveDown':
        player.move(0, moveDistance);
        break;
      case 'moveLeft':
        player.move(-moveDistance, 0);
        break;
      case 'moveRight':
        player.move(moveDistance, 0);
        break;
      default:
    }
  }

  return getGameData();
};

const addPlayer = (playerId, x, y, width, height) => {
  players[playerId] = new Player(playerId, x, y, width, height);
};

const removePlayer = (playerId) => {
  delete players[playerId];
};

module.exports = { updateGame, addPlayer, removePlayer, getGameData };
