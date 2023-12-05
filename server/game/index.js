const Matter = require('matter-js');
const Player = require('./Player.js');
const { states, getGameState, setGameState } = require('./stateMachine.js');

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
const goalOptions = { isStatic: true, isSensor: true };
const goals = [
  Bodies.rectangle(25, 300, 50, 600, { ...goalOptions, team: 'RED' }),
  Bodies.rectangle(775, 300, 50, 600, { ...goalOptions, team: 'BLUE' }),
];
World.add(engine.world, goals);

/** @type {{ [playerId: string]: Player }} */
const players = {};
/** @type {Player[]} */
const redTeamPlayers = [];
/** @type {Player[]} */
const blueTeamPlayers = [];
let ball = null;
const redTeamCenter = { x: 200, y: 300 };
const blueTeamCenter = { x: 600, y: 300 };

const gameState = {
  get state() {
    return getGameState();
  },
  lastUpdatedTime: performance.now(),
  deltaTime: 0, // in seconds
};

/**
 * @param {Player} player
 * @returns
 */
const makePlayerData = (player) => {
  const { position, width, height, body, team } = player;
  return {
    position,
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
    position: wall.position,
    x: wall.position.x,
    y: wall.position.y,
    width: wall.bounds.max.x - wall.bounds.min.x,
    height: wall.bounds.max.y - wall.bounds.min.y,
  }));
  let _ball = null;
  if (ball != null) {
    _ball = {
      position: ball.position,
      x: ball.position.x,
      y: ball.position.y,
      circleRadius: ball.circleRadius,
    };
  }
  const _goals = goals.map((goal) => ({
    position: goal.position,
    x: goal.position.x,
    y: goal.position.y,
    width: goal.bounds.max.x - goal.bounds.min.x,
    height: goal.bounds.max.y - goal.bounds.min.y,
    team: goal.team,
  }));
  return {
    gameState,
    players: playerDatas,
    walls: _walls,
    ball: _ball,
    goals: _goals,
  };
};

/**
 * @param {import('../packets/index.js').PlayerMovementPacket} packet
 */
const onPlayerMovementPacket = (packet) => {
  const { playerId, w, s, a, d } = packet;
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

const stopPlayerPlaying = (player) => {
  if (gameState.state !== states.IN_GAME) {
    console.warn('Player is not playing!');
    return;
  }
  if (player.team === 'RED') {
    const index = redTeamPlayers.indexOf(player);
    if (index !== -1) {
      redTeamPlayers.splice(index, 1);
    }
  } else if (player.team === 'BLUE') {
    const index = blueTeamPlayers.indexOf(player);
    if (index !== -1) {
      blueTeamPlayers.splice(index, 1);
    }
  }
};

const removePlayer = (playerId) => {
  if (players[playerId]) {
    const player = players[playerId];
    stopPlayerPlaying(player);
    World.remove(engine.world, player.body);
    delete players[playerId];
  }
};

/**
 * @param {Player[]} playerArr
 * @param {{x:number,y:number}} center
 * @param {{x:number,y:number}} spread
 */
const placePlayers = (playerArr, center, spread) => {
  const centerX = center.x;
  const centerY = center.y;
  const spreadX = spread.x;
  const spreadY = spread.y;
  const playerCount = playerArr.length;
  playerArr.forEach((element, index) => {
    const player = element;
    if (playerCount === 1) {
      // Only one player, put it at the center
      player.position = { x: centerX, y: centerY };
    } else if (playerCount % 2 === 0) {
      // Even number of players
      player.position = {
        x: centerX - spreadX + (spreadX * 2 * index) / (playerCount - 1),
        y: centerY - spreadY + (spreadY * 2 * index) / (playerCount - 1),
      };
    } else {
      // Odd number of players
      player.position = {
        x: centerX - spreadX + (spreadX * 2 * index) / playerCount,
        y: centerY - spreadY + (spreadY * 2 * index) / playerCount,
      };
    }
    console.log(player.position);
  });
};

const startGame = () => {
  console.log('Game started!');
  // Add a ball to the game world
  ball = Bodies.circle(400, 300, 10, {
    restitution: 0.9,
    // TODO: setting this to smaller than 0.001 somehow does not
    // have any more visual effect on its speed after being hit
    density: 0.0005,
    friction: 0.01,
    frictionAir: 0.001,
    frictionStatic: 0.1,
  });
  console.log(ball);
  World.add(engine.world, ball);
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

  // Place players in their respective positions
  placePlayers(redTeamPlayers, redTeamCenter, { x: 0, y: 200 });
  placePlayers(blueTeamPlayers, blueTeamCenter, { x: 0, y: 200 });
};

const endGame = () => {
  console.log('Game ended!');
  // Remove current players from teams
  redTeamPlayers.length = 0;
  blueTeamPlayers.length = 0;
  Object.values(players).forEach((player) => {
    player.setTeam(null);
  });
  // Remove ball from game
  World.remove(engine.world, ball);
};

const balanceTeams = () => {
  let diff = redTeamPlayers.length - blueTeamPlayers.length;
  console.log(`Red Team has ${diff} more players than Blue Team`);
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
  console.log('Teams balanced!');
  console.log('Red Team Players:', redTeamPlayers);
  console.log('Blue Team Players:', blueTeamPlayers);
};

const onPlayerJoin = (socket) => {
  const player = addPlayer(socket.id, 100, 100, 20, 100);
  // Start game if there are at least 2 players
  const currentState = getGameState();
  if (currentState === states.LOBBY && Object.keys(players).length >= 2) {
    setGameState(states.IN_GAME);
    startGame();
  } else if (currentState === 'IN_GAME') {
    // Add player to the team with less players
    if (redTeamPlayers.length > blueTeamPlayers.length) {
      player.setTeam('BLUE');
      blueTeamPlayers.push(player);
      player.position = blueTeamCenter;
    } else {
      player.setTeam('RED');
      redTeamPlayers.push(player);
      player.position = redTeamCenter;
    }
  }
};

const onPlayerLeave = (socket) => {
  removePlayer(socket.id);
  if (Object.keys(players).length < 2) {
    setGameState('LOBBY');
    endGame();
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
