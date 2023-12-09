const React = require('react');
const ReactDOM = require('react-dom');
const Phaser = require('phaser');

const utils = require('./utils.js');
const gameUtils = require('./gameUtils.js');

let socket;

function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

const isClientMobile = isMobile();

class GameWindow extends React.Component {
  /** @type {Phaser.GameObjects.Graphics} */
  graphics;

  constructor(props) {
    super(props);
    this.state = {
      players: {},
      gameState: {},
      walls: [],
      ball: null,
      goals: [],
    };
  }

  componentDidMount() {
    const gameWindow = this;
    // Create the Phaser game instance
    this.game = new Phaser.Game({
      // Force the use of Canvas API, because there are nuances between the render types.
      // For example, Graphics#save and Graphics#restore only care about the matrix
      // state (translate, rotate, scale, etc), not the entire state of the rendering
      // context like Canvas does. In that case, we must keep track of the fillStyle
      // and other properties ourselves.
      // Honestly, I'm not sure why Phaser doesn't do that for us.
      // But this is why I use Canvas API - for ease of use.
      // And because this is a mini game, I don't need the performance boost of WebGL.
      type: Phaser.CANVAS,
      parent: 'game-window',
      width: 800,
      height: 600,
      backgroundColor: '#ffffff',
      physics: {
        default: 'matter',
        matter: {
          gravity: { y: 0 },
          debug: true,
        },
      },
      scene: {
        preload: function preload() {
          gameWindow.preload(this);
        },
        create: function create() {
          gameWindow.create(this);
        },
        update: function update(time, delta) {
          gameWindow.update(this, time, delta);
        },
      },
    });
  }

  componentWillUnmount() {
    this.game.destroy(true);
  }

  /**
   * Load assets here
   * @param {Phaser.Scene} scene
   */
  preload = (scene) => {};

  /**
   * @param {Phaser.Scene} scene
   */
  create = (scene) => {
    this.game.canvas.setAttribute('tabindex', '0');
    this.game.canvas.addEventListener('focus', () => {
      console.log('Canvas focused');
      this.game.input.keyboard.enabled = true;
    });
    this.game.canvas.addEventListener('blur', () => {
      console.log('Canvas blurred');
      this.game.input.keyboard.enabled = false;
    });
    this.game.canvas.addEventListener('click', () => {
      console.log('Canvas clicked');
      this.game.canvas.focus();
    });

    socket = io();
    // Register socket event handlers
    socket.on('rejected', (reason) => {
      console.log(`Rejected by server: ${reason}`);
      // Destroy the game instance and remove the canvas element
      this.game.destroy(true);
      this.game = null;
    });
    socket.on('gameUpdate', (gameData) => {
      this.setState({
        players: gameData.players,
        gameState: gameData.gameState,
        walls: gameData.walls,
        ball: gameData.ball,
        goals: gameData.goals,
      });
    });
    socket.on('chatMessage', (packet) => {
      console.log(packet);
      const { username, msg, timestamp } = packet;
      // Container for the chat message
      const messageContainer = document.createElement('article');
      messageContainer.className = 'media';
      // Wrapper for the message content
      const messageContentWrapper = document.createElement('div');
      messageContentWrapper.className = 'media-content';
      // Container for the actual message text
      const messageTextContainer = document.createElement('div');
      messageTextContainer.className = 'content';
      // Format and set the message content
      messageTextContainer.innerHTML = `<p><strong>${username}</strong> <small>${new Date(
        timestamp,
      ).toLocaleTimeString()}</small><br>${msg}</p>`;
      // Assemble the message structure
      messageContentWrapper.appendChild(messageTextContainer);
      messageContainer.appendChild(messageContentWrapper);
      // Add the complete message to the chat window
      document.getElementById('chat-messages').append(messageContainer);
    });
    // Create graphics object
    this.graphics = scene.add.graphics({ fillStyle: { color: 0x00000 } });
    // Register inputs
    if (isClientMobile) {
      const updateOrientation = (event) => {
        this.gamma = event.gamma; // -90~90 left and right tilt
        this.beta = event.beta; // -180~180 front and back tilt
      };
      window.addEventListener('deviceorientation', updateOrientation, true);
    } else {
      // TODO: The current movement is only wasd, not using arrow keys
      this.cursors = scene.input.keyboard.createCursorKeys();
      this.wKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
      this.aKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
      this.sKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
      this.dKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    }
    // Create a waiting for player text in lobby state
    this.waitingText = scene.add.text(0, 0, 'Waiting for players...', {
      font: '16px Arial',
      fill: '#000000',
    });
    this.waitingText.setDepth(10000);
    gameUtils.centerGameObject(this.waitingText, scene);
    this.scoreText = scene.add.text(0, 0, 'Red 0 - 0 Blue', {
      font: '16px Arial',
      fill: '#000000',
    });
    this.scoreText.setDepth(10000);
    gameUtils.positionGameObject(this.scoreText, scene, { x: 0.5, y: 0.12 });
  };

  /**
   * @param {Phaser.Scene} scene
   * @param {number} time
   * @param {number} delta
   */
  update = (scene, time, delta) => {
    if (isClientMobile) {
      socket.emit('playerMovement', { gamma: this.gamma, beta: this.beta });
    } else {
      socket.emit('playerMovement', {
        w: this.wKey.isDown,
        a: this.aKey.isDown,
        s: this.sKey.isDown,
        d: this.dKey.isDown,
      });
    }

    this.graphics.clear();
    // FIXME: May be moved to socket.on('gameUpdate')
    if (this.state.gameState.state === 'LOBBY') {
      this.waitingText.setVisible(true);
      this.scoreText.setVisible(false);
    } else {
      this.waitingText.setVisible(false);
      this.scoreText.setVisible(true);
      this.scoreText.text = `Red ${this.state.gameState.redTeamScore} - ${this.state.gameState.blueTeamScore} Blue`;
      gameUtils.positionGameObject(this.scoreText, scene, { x: 0.5, y: 0.12 });
    }
    // Draw goals
    Object.values(this.state.goals).forEach((goal) => {
      if (goal.team === 'RED') {
        this.graphics.fillStyle(0xffeae8);
      } else {
        this.graphics.fillStyle(0xe8fffe);
      }
      gameUtils.drawMatterBody(this.graphics, goal);
    });
    // Draw walls
    this.graphics.fillStyle(0x000000);
    this.state.walls.forEach((wall) => {
      gameUtils.drawMatterBody(this.graphics, wall);
    });
    // Draw ball
    if (this.state.ball) {
      this.graphics.fillStyle(0x000000);
      this.graphics.fillCircle(
        this.state.ball.position.x,
        this.state.ball.position.y,
        this.state.ball.circleRadius,
      );
    }
    // Draw players
    Object.values(this.state.players).forEach((playerData) => {
      if (playerData.team === 'RED') {
        this.graphics.fillStyle(0xff0000);
      } else if (playerData.team === 'BLUE') {
        this.graphics.fillStyle(0x0000ff);
      } else {
        this.graphics.fillStyle(0x000000);
      }
      gameUtils.drawMatterBody(this.graphics, playerData);
    });
  };

  render() {
    return (
      <div id="game-window"></div> // Phaser will create the canvas element here
    );
  }
}

const init = () => {
  const sendChatMessage = () => {
    const chatInput = document.getElementById('chat-input');
    socket.emit('chatMessage', { msg: chatInput.value, timestamp: Date.now() });
    chatInput.value = '';
  };
  document.getElementById('send-button').addEventListener('click', () => {
    sendChatMessage();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && document.activeElement === document.getElementById('chat-input')) {
      sendChatMessage();
    }
  });

  ReactDOM.render(<GameWindow />, document.getElementById('content'));
  fetch('/api/user/info')
    .then((res) => res.json())
    .then((info) => {
      document.getElementById('navbar-username').textContent = info.username;
    });
};

window.onload = init;

utils.initBulmaNavbar();
