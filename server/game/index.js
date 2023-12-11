const Matter = require('matter-js');
const _ = require('underscore');
const Player = require('./Player.js');
const Ball = require('./Ball.js');
const { states, getGameState, setGameState } = require('./stateMachine.js');
const BitBuilder = require('./BitBuilder.js');
// MongoDB models
const { Account, ChatHistory } = require('../models');

// #region Collision Filters Setup
// Note: Bodies without collision filter will collide with everything
// Filters must have 'group' set, otherwise undefined behavior will occur. For example,
// two bodies of the same category will never collide with each other if 'group' is not set.
// const CATEGORY_DEFAULT = 0x00000001;
const CATEGORY_PLAYER = 0x00000002;
const CATEGORY_WALL = 0x00000004;
const CATEGORY_BALL = 0x00000008;
const CATEGORY_GOAL = 0x00000010;
const CATEGORY_NET = 0x00000020;
const MASK_DEFAULT = 0xffffffff; // Can collide with everything
const MASK_PLAYER = new BitBuilder()
  .or(CATEGORY_PLAYER)
  .or(CATEGORY_WALL)
  .or(CATEGORY_BALL)
  .or(CATEGORY_NET)
  .build();
const MASK_PLAYER_NO_BALL = new BitBuilder()
  .or(CATEGORY_PLAYER)
  .or(CATEGORY_WALL)
  .or(CATEGORY_NET)
  .build();
const MASK_WALL = MASK_DEFAULT;
const MASK_BALL = new BitBuilder().or(CATEGORY_PLAYER).or(CATEGORY_WALL).or(CATEGORY_GOAL)
  .build();
const MASK_GOAL = new BitBuilder().or(CATEGORY_BALL).build();
const MASK_NET = new BitBuilder().or(CATEGORY_PLAYER).build();
const FILTER_PLAYER = {
  category: CATEGORY_PLAYER,
  mask: MASK_PLAYER,
  group: 0,
};
const FILTER_PLAYER_NO_BALL = {
  category: CATEGORY_PLAYER,
  mask: MASK_PLAYER_NO_BALL,
  group: 0,
};
const FILTER_WALL = {
  category: CATEGORY_WALL,
  mask: MASK_WALL,
  group: 0,
};
const FILTER_BALL = {
  category: CATEGORY_BALL,
  mask: MASK_BALL,
  group: 0,
};
const FILTER_GOAL = {
  category: CATEGORY_GOAL,
  mask: MASK_GOAL,
  group: 0,
};
const FILTER_NET = {
  category: CATEGORY_NET,
  mask: MASK_NET,
  group: 0,
};
// #endregion

const {
  Engine, World, Bodies, Events,
} = Matter;

// Create Matter.js engine
const engine = Engine.create();
engine.gravity = { x: 0, y: 0 }; // No gravity

// isStatic means the object will not move
const wallOptions = { isStatic: true, collisionFilter: FILTER_WALL };
const walls = [
  // top, bottom, left, right
  Bodies.rectangle(400, -20, 800, 50, wallOptions),
  Bodies.rectangle(400, 620, 800, 50, wallOptions),
  Bodies.rectangle(-20, 300, 50, 600, wallOptions),
  Bodies.rectangle(820, 300, 50, 600, wallOptions),
];
// Add walls to the game world
World.add(engine.world, walls);
const goalOptions = { isStatic: true, isSensor: true, collisionFilter: FILTER_GOAL };
const redTeamGoal = Bodies.rectangle(25, 300, 50, 600, { ...goalOptions, team: 'RED' });
const blueTeamGoal = Bodies.rectangle(775, 300, 50, 600, { ...goalOptions, team: 'BLUE' });
const goals = [redTeamGoal, blueTeamGoal];
World.add(engine.world, goals);
const net = Bodies.rectangle(400, 300, 40, 600, { isStatic: true, collisionFilter: FILTER_NET });
World.add(engine.world, net);

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

const gyroSensitivity = {
  gamma: 5, // X movement
  beta: 7.5, // Y movement
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
  const { username, body, team } = player;
  return {
    username,
    ...makeBodyData(body),
    team,
  };
};

const makeBallData = () => {
  if (ball == null) {
    return null;
  }
  return {
    ...makeBodyData(ball.body),
    team: ball.team,
  };
};

const getGameData = () => ({
  gameState,
  players: _.mapObject(players, makePlayerData),
  walls: walls.map(makeBodyData),
  ball: makeBallData(),
  goals: goals.map((goal) => ({
    ...makeBodyData(goal),
    team: goal.team,
  })),
  net: makeBodyData(net),
});

/**
 * @param {import('../packets/index.js').PlayerMovementPacket} packet
 */
const onPlayerMovementPacket = (packet) => {
  const {
    playerId, w, s, a, d, left, up, right, down, gamma, beta,
  } = packet;
  const player = players[playerId];
  if (player) {
    const accDir = { x: 0, y: 0 };
    const updatePlayerVelocity = () => {
      player.velocity = Matter.Vector.add(
        player.velocity,
        Matter.Vector.mult(accDir, player.acceleration * gameState.deltaTime),
      );
      const currentSpeed = Matter.Vector.magnitude(player.velocity);
      if (currentSpeed > player.maxSpeed) {
        player.velocity = Matter.Vector.mult(player.velocity, player.maxSpeed / currentSpeed);
      }
    };
    // Mobile device
    if (gamma != null && beta != null) {
      if (Math.abs(gamma) > gyroSensitivity.gamma) {
        accDir.x = Math.sign(gamma);
      } else {
        accDir.x = 0;
      }
      if (Math.abs(beta) > gyroSensitivity.beta) {
        accDir.y = Math.sign(beta);
      } else {
        accDir.y = 0;
      }
    } else if (w != null) {
      // Desktop - WASD
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
    } else {
      // Desktop - Arrow keys
      if (up === down) {
        accDir.y = 0;
      } else {
        accDir.y = up ? -1 : 1;
      }
      if (left === right) {
        accDir.x = 0;
      } else {
        accDir.x = left ? -1 : 1;
      }
    }
    updatePlayerVelocity();
  }
};

let chatHistory = null;

const initChatHistory = (serverStartTime) => {
  // Delete empty chat histories
  ChatHistory.deleteMany({ history: { $size: 0 } })
    .then((result) => {
      console.log('Empty chat histories cleared:', result);
      // Create new ChatHistory document
      return new ChatHistory({ history: [], serverStartupTime: serverStartTime }).save();
    })
    .then((savedDocument) => {
      chatHistory = savedDocument;
      console.log('Chat history initialized and saved:', savedDocument);
    })
    .catch((error) => {
      console.error('Error during chat history initialization:', error);
    });
};

/**
 * @returns chat messages ordered from earliest to latest
 */
const getRecentChatHistory = (msgCount) => ChatHistory.find()
  .sort({ serverStartTime: 1 }) // 1 for ascending order
  .lean()
  .then((chatHistories) => chatHistories
    .flatMap(
      (doc) => doc.history
        .map((msg) => ({
          ..._.omit(msg, 'timestamp', '_id'),
          timestamp: msg.timestamp.getTime(),
        }))
        .sort((a, b) => a.timestamp - b.timestamp), // ascending order
    )
    .slice(-msgCount))
  .catch((error) => {
    console.error('Error getting recent chat history:', error);
    return null;
  });

/**
 * @param {import('../packets/index.js').PlayerChatPacket} packet
 */
const onPlayerChatPacket = (packet) => {
  if (!chatHistory) {
    // Player joined and sent a message too fast - technically impossible for a human
    console.error('Chat history is not initialized');
    return;
  }
  const newMessage = {
    username: packet.username,
    msg: packet.msg,
    team: packet.team,
    timestamp: packet.timestamp,
  };
  console.log(newMessage);
  // Atomically adds the new message to the 'history' array
  ChatHistory.updateOne({ _id: chatHistory._id }, { $push: { history: newMessage } })
    .then((result) => {
      console.log('Chat message added:', result, newMessage);
    })
    .catch((error) => {
      console.error('Error adding chat message:', error);
    });
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
      ball.speed = ball.maxSpeed;
    } else if (ball.body.speed < ball.minSpeed) {
      // If ball is not moving, give it a random direction - technically a velocity,
      // But we will set its speed to minSpeed, so only the direction matters.
      if (ball.body.speed === 0) {
        ball.velocity = { x: Math.random() - 0.5, y: Math.random() - 0.5 };
      }
      ball.speed = ball.minSpeed;
    }
  }
  gameState.lastUpdatedTime = currentTime;
};

const addPlayer = (playerId, username, x, y, width, height) => {
  const player = new Player(playerId, username, x, y, width, height, {
    collisionFilter: FILTER_PLAYER,
  });
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
  // Reset players' collision filters
  [...redTeamPlayers, ...blueTeamPlayers].forEach((player) => {
    const playerBody = player.body;
    playerBody.collisionFilter = FILTER_PLAYER;
  });
  // Reset ball's belonging / which team hit it
  ball.team = null;
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
  ball = new Ball(400, 300, 10, { collisionFilter: FILTER_BALL });
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

/**
 * @param {import('socket.io').Socket} socket
 */
const onPlayerJoin = (socket) => {
  const { account } = socket.request.session;
  const player = addPlayer(socket.id, account.username, 100, 100, 20, 100);
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
  // Apply purchased items
  Account.findById(account._id).then((doc) => {
    doc.items.forEach((item) => {
      player.applyItem(item.itemId);
    });
  });
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

const onInGameCollisionStart = (event, bodyA, bodyB) => {
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

const onInGameCollisionEnd = (event, bodyA, bodyB) => {
  const checkHit = () => {
    if (!ball) {
      throw new Error('Ball is null');
    }
    // After hitting the ball, the team can't hit it again until the other team hit it
    if (
      (bodyA === ball.body && bodyB.parentGameObject instanceof Player)
      || (bodyA.parentGameObject instanceof Player && bodyB === ball.body)
    ) {
      const playerIsB = bodyB.parentGameObject instanceof Player;
      const player = playerIsB ? bodyB.parentGameObject : bodyA.parentGameObject;
      const { team } = player;
      ball.team = team;
      [...redTeamPlayers, ...blueTeamPlayers].forEach((p) => {
        const playerBody = p.body;
        playerBody.collisionFilter = p.team === team ? FILTER_PLAYER_NO_BALL : FILTER_PLAYER;
      });
    }
  };
  checkHit();
};

Events.on(engine, 'collisionStart', (event) => {
  event.pairs.forEach((pair) => {
    const { bodyA, bodyB } = pair;
    if (gameState.state === states.IN_GAME) {
      onInGameCollisionStart(event, bodyA, bodyB);
    }
  });
});

Events.on(engine, 'collisionEnd', (event) => {
  event.pairs.forEach((pair) => {
    const { bodyA, bodyB } = pair;
    if (gameState.state === states.IN_GAME) {
      onInGameCollisionEnd(event, bodyA, bodyB);
    }
  });
});

module.exports = {
  onPlayerMovementPacket,
  onPlayerChatPacket,
  initChatHistory,
  getRecentChatHistory,
  gameLoop,
  addPlayer,
  removePlayer,
  getGameData,
  onPlayerJoin,
  onPlayerLeave,
  players,
};
