const Matter = require('matter-js');
const Player = require('./Player.js');

const { Engine, World, Bodies } = Matter;

// Create Matter.js engine
const engine = Engine.create();
engine.gravity = { x: 0, y: 0 }; // No gravity

const wallOptions = { isStatic: true }; // isStatic means the object will not move
const walls = [
  // top, bottom, left, right
  Bodies.rectangle(400, 0, 800, 50, wallOptions),
  Bodies.rectangle(400, 600, 800, 50, wallOptions),
  Bodies.rectangle(0, 300, 50, 600, wallOptions),
  Bodies.rectangle(800, 300, 50, 600, wallOptions),
];
// Add walls to the game world
World.add(engine.world, walls);

/** @type {{ [playerId: string]: Player }} */
const players = {};

const gameState = {
  lastUpdatedTime: performance.now(),
  deltaTime: 0, // in seconds
};

const getGameData = () => {
  const _players = Object.entries(players).reduce((acc, [id, player]) => {
    const { position } = player;
    acc[id] = {
      x: position.x,
      y: position.y,
      width: player.width,
      height: player.height,
    };
    return acc;
  }, {});
  const _walls = walls.map((wall) => ({
    x: wall.position.x,
    y: wall.position.y,
    width: wall.bounds.max.x - wall.bounds.min.x,
    height: wall.bounds.max.y - wall.bounds.min.y,
  }));
  return {
    players: _players,
    gameState,
    walls: _walls,
  };
};

/**
 * @param {import('../packets').PlayerMovementPacket} packet
 */
const onPlayerMovementPacket = (packet) => {
  const { playerId, w, s, a, d } = packet;
  const player = players[playerId];
  const newDir = { x: 0, y: 0 };
  if (player) {
    if (w === s) {
      newDir.y = 0;
    } else {
      newDir.y = w ? -1 : 1;
    }
    if (a === d) {
      newDir.x = 0;
    } else {
      newDir.x = a ? -1 : 1;
    }
    player.direction = newDir;
    player.speed = Math.min(
      player.speed + player.acceleration * gameState.deltaTime,
      player.maxSpeed,
    );
  }
};

const gameLoop = () => {
  // Update delta time
  const currentTime = performance.now() / 1000;
  const deltaTime = currentTime - gameState.lastUpdatedTime; // in seconds
  gameState.deltaTime = deltaTime;

  // Update physics engine
  Engine.update(engine, deltaTime * 1000); // in miliseconds
  if (Object.values(players)[0]) {
    console.log(Object.values(players)[0].speed * 60);
  }

  gameState.lastUpdatedTime = currentTime;
};

const addPlayer = (playerId, x, y, width, height) => {
  const player = new Player(playerId, x, y, width, height);
  players[playerId] = player;
  World.add(engine.world, player.body);
};

const removePlayer = (playerId) => {
  if (players[playerId]) {
    World.remove(engine.world, players[playerId].body);
    delete players[playerId];
  }
};

module.exports = {
  onPlayerMovementPacket,
  gameLoop,
  addPlayer,
  removePlayer,
  getGameData,
};
