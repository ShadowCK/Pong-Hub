const React = require('react');
const ReactDOM = require('react-dom');
const helper = require('./helper.js');

const socket = io();

const handleKeyDown = (e) => {
  switch (e.key) {
    case 'w':
      socket.emit('playerAction', 'moveUp');
      break;
    case 's':
      socket.emit('playerAction', 'moveDown');
      break;
    case 'a':
      socket.emit('playerAction', 'moveLeft');
      break;
    case 'd':
      socket.emit('playerAction', 'moveRight');
      break;
    default:
      break;
  }
};

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
      this.setState({ players: gameData.players, gameState: gameData.gameState }, () => {
        this.renderCanvas();
        console.log("updated canvas")
      });
    });
  }

  renderCanvas() {
    const canvas = this.canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { players } = this.state;

    ctx.clearRect(0, 0, canvas.width, canvas.height); // 清除 Canvas
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
  ReactDOM.render(<GameWindow />, document.getElementById('content'));
};

window.onload = init;
