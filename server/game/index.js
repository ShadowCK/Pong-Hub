const Matter = require('matter-js');
const _ = require('underscore');
const Player = require('./Player.js');
const Ball = require('./Ball.js');
const { states, getGameState, setGameState } = require('./stateMachine.js');

const {
  Engine, World, Bodies, Events,
} = Matter;

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
const redTeamGoal = Bodies.rectangle(25, 300, 50, 600, { ...goalOptions, team: 'RED' });
const blueTeamGoal = Bodies.rectangle(775, 300, 50, 600, { ...goalOptions, team: 'BLUE' });
const goals = [redTeamGoal, blueTeamGoal];
World.add(engine.world, goals);

/** @type {{ [playerId: string]: Player }} */
const players = {};
/** @type {Player[]} */
const redTeamPlayers = [];
/** @type {Player[]} */
const blueTeamPlayers = [];
/** @type {Ball} */
let ball = null;
const redTeamCenter = { x: 200, y: 300 };
const blueTeamCenter = { x: 600, y: 300 };

const gameState = {
  get state() {
    return getGameState();
  },
  lastUpdatedTime: performance.now(),
  deltaTime: 0, // in seconds
  redTeamScore: 0,
  blueTeamScore: 0,
};

/**
 * @param {Matter.Body} body
 * @returns {{
 * position: {x: number, y: number}, x: number, y: number,
 * width: number, height: number, angle: number, circleRadius: number
 * }}
 */
const makeBodyData = (body) => ({
  ..._.pick(body, 'position', 'angle', 'circleRadius'),
  x: body.position.x,
  y: body.position.y,
  width: body.bounds.max.x - body.bounds.min.x,
  height: body.bounds.max.y - body.bounds.min.y,
});

/**
 * @param {Player} player
 * @returns
 */
const makePlayerData = (player) => {
  const { body, team } = player;
  return {
    ...makeBodyData(body),
    team,
  };
};

const getGameData = () => ({
  gameState,
  players: _.mapObject(players, (player) => makePlayerData(player)),
  walls: walls.map(makeBodyData),
  ball: ball == null ? null : makeBodyData(ball.body),
  goals: goals.map((goal) => ({
    ...makeBodyData(goal),
    team: goal.team,
  })),
});

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

  if (gameState.state === states.IN_GAME && ball) {
    if (ball.body.speed > ball.maxSpeed) {
      Matter.Body.setVelocity(
        ball.body,
        Matter.Vector.mult(ball.body.velocity, ball.maxSpeed / ball.body.speed),
      );
    }
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
    console.info('Player is not playing, in-game data cleanup is skipped.');
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
    } else {
      // Evenly spread players
      player.position = {
        x: centerX - spreadX + (spreadX * 2 * index) / (playerCount - 1),
        y: centerY - spreadY + (spreadY * 2 * index) / (playerCount - 1),
      };
    }
  });
};

const newTurn = () => {
  console.log('New turn started!');
  // Place players in their respective positions
  placePlayers(redTeamPlayers, redTeamCenter, { x: 0, y: 200 });
  placePlayers(blueTeamPlayers, blueTeamCenter, { x: 0, y: 200 });
  Matter.Body.setPosition(ball.body, { x: 400, y: 300 });
  // Give a random velocity to ball
  const randomSection = Math.floor(Math.random() * 3);
  let randomAngle;
  if (randomSection === 0) {
    // 0° to 60°
    randomAngle = (Math.random() * Math.PI) / 3;
  } else if (randomSection === 1) {
    // 120° to 240°
    randomAngle = (Math.PI / 3) * 2 + Math.random() * Math.PI;
  } else if (randomSection === 2) {
    // 300° to 360°
    randomAngle = (Math.PI / 3) * 5 + (Math.random() * Math.PI) / 3;
  }
  const randomSpeed = (Math.random() * 50 + 50) / 60;
  Matter.Body.setVelocity(ball.body, {
    x: Math.cos(randomAngle) * randomSpeed,
    y: Math.sin(randomAngle) * randomSpeed,
  });
};

const startGame = () => {
  console.log('Game started!');
  // Reset scores
  gameState.blueTeamScore = 0;
  gameState.redTeamScore = 0;
  // Add a ball to the game world
  ball = new Ball(400, 300, 10);
  console.log(ball);
  World.add(engine.world, ball.body);
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
  newTurn();
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
  if (ball) {
    World.remove(engine.world, ball.body);
    ball = null;
  }
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

const onInGameCollision = (event, bodyA, bodyB) => {
  const checkGoal = () => {
    if (!ball) {
      throw new Error('Ball is null');
    }
    if (
      (bodyA === ball.body && bodyB === redTeamGoal)
      || (bodyA === redTeamGoal && bodyB === ball.body)
    ) {
      console.log('Blue team scored!');
      gameState.blueTeamScore += 1;
      newTurn();
    } else if (
      (bodyA === ball.body && bodyB === blueTeamGoal)
      || (bodyA === blueTeamGoal && bodyB === ball.body)
    ) {
      console.log('Red team scored!');
      gameState.redTeamScore += 1;
      newTurn();
    }
  };
  checkGoal();
};

Events.on(engine, 'collisionStart', (event) => {
  event.pairs.forEach((pair) => {
    const { bodyA, bodyB } = pair;
    if (gameState.state === states.IN_GAME) {
      onInGameCollision(event, bodyA, bodyB);
    }
  });
});

module.exports = {
  onPlayerMovementPacket,
  gameLoop,
  addPlayer,
  removePlayer,
  getGameData,
  onPlayerJoin,
  onPlayerLeave,
};
