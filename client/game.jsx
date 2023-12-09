const React = require('react');
const ReactDOM = require('react-dom');
const Phaser = require('phaser');

const utils = require('./utils.js');
const gameUtils = require('./gameUtils.js');

let socket;

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
    socket = io();
    // Register socket event handlers
    socket.on('gameUpdate', (gameData) => {
      this.setState({
        players: gameData.players,
        gameState: gameData.gameState,
        walls: gameData.walls,
        ball: gameData.ball,
        goals: gameData.goals,
      });
    });
    socket.on('rejected', (reason) => {
      console.log(`Rejected by server: ${reason}`);
      // Destroy the game instance and remove the canvas element
      this.game.destroy(true);
      this.game = null;
    });
    // Create graphics object
    this.graphics = scene.add.graphics({ fillStyle: { color: 0x00000 } });
    // Register inputs
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.wKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.aKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.sKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.dKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
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
    const movement = {
      w: this.wKey.isDown,
      a: this.aKey.isDown,
      s: this.sKey.isDown,
      d: this.dKey.isDown,
    };
    socket.emit('playerMovement', movement);

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
  ReactDOM.render(<GameWindow />, document.getElementById('content'));
  fetch('/api/user/info')
    .then((res) => res.json())
    .then((info) => {
      document.getElementById('navbar-username').textContent = info.username;
    });
};

window.onload = init;

utils.initBulmaNavbar();
