const React = require('react');
const ReactDOM = require('react-dom');
const helper = require('./helper.js');

const socket = io();

const keyStates = new Map();
const handleKeyDown = (e) => {
  keyStates.set(e.key, true);
};
const handleKeyUp = (e) => {
  keyStates.set(e.key, false);
};
const isKeyPressed = (key) => keyStates.get(key) || false;

class GameWindow extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      players: {},
      gameState: {},
    };
    this.canvasRef = React.createRef();
  }

  componentDidMount() {
    socket.on('gameUpdate', (gameData) => {
      this.setState({ players: gameData.players, gameState: gameData.gameState });
    });

    this.gameLoop();
  }

  componentWillUnmount() {
    // Stop game loop
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
  }

  gameLoop = () => {
    this.renderCanvas();

    socket.emit('playerMovement', {
      w: isKeyPressed('w'),
      s: isKeyPressed('s'),
      a: isKeyPressed('a'),
      d: isKeyPressed('d'),
    });

    // Request next game loop
    this.rafId = requestAnimationFrame(this.gameLoop);
  };

  renderCanvas() {
    const canvas = this.canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { players } = this.state;

    // Reset canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    Object.values(players).forEach((player) => {
      // Draw every player
      ctx.fillStyle = 'blue';
      ctx.fillRect(player.x, player.y, player.width, player.height);
    });
  }

  render() {
    return (
      <div id="game-window">
        <canvas ref={this.canvasRef} width="800" height="600"></canvas>
      </div>
    );
  }
}

const init = () => {
  // Register keydown event
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
  ReactDOM.render(<GameWindow />, document.getElementById('content'));
};

const gameLoop = () => {};
window.requestAnimationFrame(gameLoop);

window.onload = init;
