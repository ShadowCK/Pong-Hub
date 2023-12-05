const Matter = require('matter-js');
const Player = require('./Player.js');

const { Engine, World, Bodies } = Matter;

// Create Matter.js engine
const engine = Engine.create();
engine.gravity = { x: 0, y: 0 }; // No gravity

const wallOptions = { isStatic: true }; // isStatic means the object will not move
const walls = [
  // top, bottom, left, right
  Bodies.rectangle(400, -20, 800, 50, wallOptions),
  Bodies.rectangle(400, 620, 800, 50, wallOptions),
  Bodies.rectangle(-20, 300, 50, 600, wallOptions),
  Bodies.rectangle(820, 300, 50, 600, wallOptions),
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
    const { position, width, height } = player;
    acc[id] = {
      x: position.x,
      y: position.y,
      width,
      height,
      angle: player.body.angle,
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
  const {
    playerId, w, s, a, d,
  } = packet;
  const player = players[playerId];
  const accDir = { x: 0, y: 0 };
  if (player) {
    if (w === s) {
      accDir.y = 0;
    } else {
      accDir.y = w ? -1 : 1;
    }
    if (a === d) {
      accDir.x = 0;
    } else {
      accDir.x = a ? -1 : 1;
    }
    player.velocity = Matter.Vector.add(
      player.velocity,
      Matter.Vector.mult(accDir, player.acceleration * gameState.deltaTime),
    );
    const currentSpeed = Matter.Vector.magnitude(player.velocity);
    if (currentSpeed > player.maxSpeed) {
      player.velocity = Matter.Vector.mult(player.velocity, player.maxSpeed / currentSpeed);
    }
  }
};

const physicsUpdateIterations = 4;

const gameLoop = () => {
  // Update delta time
  const currentTime = performance.now() / 1000;
  const deltaTime = currentTime - gameState.lastUpdatedTime; // in seconds
  gameState.deltaTime = deltaTime;

  // Update physics engine
  const deltaTimeMs = deltaTime * 1000; // in miliseconds
  for (let i = 0; i < physicsUpdateIterations; i += 1) {
    Engine.update(engine, deltaTimeMs / physicsUpdateIterations);
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
