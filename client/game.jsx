const React = require('react');
const ReactDOM = require('react-dom');
const Phaser = require('phaser');

const socket = io();

const matterToPhaser = ({ x, y, width, height, angle = 0 }) => ({
  x: x - width / 2,
  y: y - height / 2,
  width,
  height,
  angle,
});

class GameWindow extends React.Component {
  /** @type {Phaser.GameObjects.Graphics} */
  graphics;

  constructor(props) {
    super(props);
    this.state = {
      players: {},
      gameState: {},
      walls: [],
    };
  }

  componentDidMount() {
    const gameWindow = this;
    // Create the Phaser game instance
    this.game = new Phaser.Game({
      type: Phaser.AUTO,
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
   * @param {Phaser.Scene} scene
   */
  preload = (scene) => {};

  /**
   * @param {Phaser.Scene} scene
   */
  create = (scene) => {
    // Register socket event handlers
    socket.on('gameUpdate', (gameData) => {
      this.setState({
        players: gameData.players,
        gameState: gameData.gameState,
        walls: gameData.walls,
      });
    });
    // Create graphics object
    this.graphics = scene.add.graphics({ fillStyle: { color: 0x00000 } });
    // Register inputs
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.wKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.aKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.sKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.dKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
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
    Object.values(this.state.players).forEach((playerData) => {
      const { x, y, width, height, angle } = matterToPhaser(playerData);
      this.graphics.save();
      this.graphics.translateCanvas(x + width / 2, y + height / 2);
      this.graphics.rotateCanvas(angle);
      this.graphics.fillRect(-width / 2, -height / 2, width, height);
      this.graphics.restore();
    });
    Object.values(this.state.walls).forEach((wall) => {
      this.graphics.fillRect(...Object.values(matterToPhaser(wall)));
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
};

window.onload = init;
