const Matter = require('matter-js');
const Player = require('./Player.js');
const stateMachine = require('./stateMachine.js');

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
/** @type {Player[]} */
const redTeamPlayers = [];
/** @type {Player[]} */
const blueTeamPlayers = [];

const gameState = {
  get state() {
    return stateMachine.getGameState();
  },
  lastUpdatedTime: performance.now(),
  deltaTime: 0, // in seconds
};

/**
 * @param {Player} player
 * @returns
 */
const makePlayerData = (player) => {
  const {
    position, width, height, body, team,
  } = player;
  return {
    x: position.x,
    y: position.y,
    width,
    height,
    angle: body.angle,
    team,
  };
};

const getGameData = () => {
  const playerDatas = Object.entries(players).reduce((acc, [id, player]) => {
    acc[id] = makePlayerData(player);
    return acc;
  }, {});
  const _walls = walls.map((wall) => ({
    x: wall.position.x,
    y: wall.position.y,
    width: wall.bounds.max.x - wall.bounds.min.x,
    height: wall.bounds.max.y - wall.bounds.min.y,
  }));
  return {
    players: playerDatas,
    gameState,
    walls: _walls,
  };
};

/**
 * @param {import('../packets/index.js').PlayerMovementPacket} packet
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
  return player;
};

const removePlayer = (playerId) => {
  if (players[playerId]) {
    World.remove(engine.world, players[playerId].body);
    delete players[playerId];
  }
};

const handleGameStart = () => {
  console.log('Game started!');
  // Assign players to teams
  Object.values(players).forEach((player, index) => {
    if (index % 2 === 0) {
      player.setTeam('RED');
      redTeamPlayers.push(player);
    } else {
      player.setTeam('BLUE');
      blueTeamPlayers.push(player);
    }
  });
};

const handleGameEnd = () => {
  console.log('Game ended!');
  // Assign players to teams
  Object.values(players).forEach((player) => {
    player.setTeam(null);
  });
};

const balanceTeams = () => {
  let diff = redTeamPlayers.length - blueTeamPlayers.length;
  if (Math.abs(diff) <= 1) {
    // No need to balance
    return;
  }
  if (Math.sign(diff) === 1) {
    // Red team has more than 2 players than blue team
    while (diff > 1) {
      const player = redTeamPlayers.pop();
      player.setTeam('BLUE');
      blueTeamPlayers.push(player);
      diff -= 2;
    }
  } else {
    // Blue team has more than 2 players than red team
    while (diff < -1) {
      const player = blueTeamPlayers.pop();
      player.setTeam('RED');
      redTeamPlayers.push(player);
      diff += 2;
    }
  }
};

const onPlayerJoin = (socket) => {
  const player = addPlayer(socket.id, 100, 100, 20, 100);
  // Start game if there are at least 2 players
  if (stateMachine.getGameState() === 'LOBBY' && Object.keys(players).length >= 2) {
    stateMachine.setGameState('IN_GAME');
    handleGameStart();
  } else if (stateMachine.getGameState() === 'IN_GAME') {
    // Add player to the team with less players
    if (redTeamPlayers.length > blueTeamPlayers.length) {
      player.setTeam('BLUE');
      blueTeamPlayers.push(player);
    } else {
      player.setTeam('RED');
      redTeamPlayers.push(player);
    }
  }
};

const onPlayerLeave = (socket) => {
  removePlayer(socket.id);
  if (Object.keys(players).length < 2) {
    stateMachine.setGameState('LOBBY');
    handleGameEnd();
  } else {
    balanceTeams();
  }
};

module.exports = {
  onPlayerMovementPacket,
  gameLoop,
  addPlayer,
  removePlayer,
  getGameData,
  onPlayerJoin,
  onPlayerLeave,
};
