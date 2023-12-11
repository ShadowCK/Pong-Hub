const React = require('react');
const ReactDOM = require('react-dom');
const Phaser = require('phaser');

const utils = require('./utils.js');
const gameUtils = require('./gameUtils.js');
const { items } = require('../server/game/items.js');
const { ItemStore, NavigationBar } = require('./components.jsx');

let socket;

/**
 * @returns {boolean} Whether the client is on a mobile device
 */
function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

const isClientMobile = isMobile();

/**
 * Shows a chat message in the chat window.
 */
const showChatMessage = (username, color, msg, timestamp) => {
  // Container for the chat message
  const messageContainer = document.createElement('article');
  messageContainer.className = 'media';
  // Wrapper for the message content
  const messageContentWrapper = document.createElement('div');
  messageContentWrapper.className = 'media-content';
  // Container for the actual message text
  const messageTextContainer = document.createElement('div');
  messageTextContainer.className = 'content';
  messageTextContainer.innerHTML = `<p><span class="${color}">${username}</span> <small>${new Date(
    timestamp,
  ).toLocaleTimeString()}</small><br>${msg}</p>`;
  // Create close button
  const closeButton = document.createElement('button');
  closeButton.className = 'delete mr-1';
  closeButton.setAttribute('aria-label', 'delete message');
  closeButton.onclick = () => messageContainer.remove();
  // Assemble the message structure
  messageContentWrapper.appendChild(messageTextContainer);
  messageContainer.appendChild(messageContentWrapper);
  messageContainer.appendChild(closeButton); // Add close button to the message container
  // Add the complete message to the chat window
  document.getElementById('chat-messages').append(messageContainer);
  // This scrolls all ancestors (including the entire page) to ensure the message is visible,
  // which might not be feasible
  // messageContainer.scrollIntoView({ behavior: 'smooth', block: 'end' });
  // Instead, we simply scroll the chat window to the bottom
  const chatMessages = document.getElementById('chat-messages');
  chatMessages.scrollTo({
    top: chatMessages.scrollHeight,
    behavior: 'smooth',
  });
};

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
      net: null,
    };
    this.playerNametags = {};
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
    // TODO: This is for debugging only. Remove this later.
    window.test = () => {
      console.log(this.state);
    };
    this.game.canvas.setAttribute('tabindex', '0');
    this.game.canvas.addEventListener('focus', () => {
      if (this.game == null) {
        return;
      }
      console.log('Canvas focused');
      this.game.input.keyboard.enabled = true;
    });
    this.game.canvas.addEventListener('blur', () => {
      if (this.game == null) {
        return;
      }
      console.log('Canvas blurred');
      this.game.input.keyboard.enabled = false;
    });
    this.game.canvas.addEventListener('click', () => {
      if (this.game == null) {
        return;
      }
      console.log('Canvas clicked');
      this.game.canvas.focus();
    });
    // Focus on canvas at the beginning
    this.game.canvas.focus({ preventScroll: true });
    document.body.scrollTo({ top: 0, behavior: 'smooth' });

    socket = io();
    // Register socket event handlers
    socket.on('rejected', (reason) => {
      showChatMessage('System', 'chat-error', reason, Date.now());
      console.log(`Rejected by server: ${reason}`);
      // Destroy the game instance and remove the canvas element
      this.game.destroy(true);
      // Note: game will not be destroyed immediately,
      // that's why we have null checks in the canvas' event listeners
      this.game = null;
    });
    socket.on('gameUpdate', (gameData) => {
      this.setState({
        players: gameData.players,
        gameState: gameData.gameState,
        walls: gameData.walls,
        ball: gameData.ball,
        goals: gameData.goals,
        net: gameData.net,
      });
    });
    const showPlayerChatMessage = (packet) => {
      const { username, team, msg, timestamp } = packet;
      let color = 'chat-no-team';
      if (team === 'RED') {
        color = 'chat-red-team';
      } else if (team === 'BLUE') {
        color = 'chat-blue-team';
      }
      showChatMessage(username, color, msg, timestamp);
    };
    socket.on('chatMessage', showPlayerChatMessage);
    socket.on('syncChatHistory', (chatHistory) => {
      if (!Array.isArray(chatHistory)) {
        return;
      }
      const chatMessages = document.getElementById('chat-messages');
      // Cleanup chat messages if there are any, in case of reconnection without page refresh
      chatMessages.innerHTML = '';
      console.table(
        chatHistory.map((msgData) => ({
          ...msgData,
          timestamp: new Date(msgData.timestamp).toLocaleTimeString(),
        })),
      );
      chatHistory.forEach(showPlayerChatMessage);
    });

    // Create graphics object
    this.graphics = scene.add.graphics({ fillStyle: { color: 0x00000 } });
    // Register inputs
    if (isClientMobile) {
      const updateOrientation = (event) => {
        this.gamma = event.gamma; // -90-90 left and right tilt
        this.beta = event.beta; // -180-180 front and back tilt
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
      // Using device orientation
      socket.emit('playerMovement', { gamma: this.gamma, beta: this.beta });
    } else if (this.wKey.isDown || this.aKey.isDown || this.sKey.isDown || this.dKey.isDown) {
      // Using WASD
      socket.emit('playerMovement', {
        w: this.wKey.isDown,
        a: this.aKey.isDown,
        s: this.sKey.isDown,
        d: this.dKey.isDown,
      });
    } else {
      // Using arrow keys
      socket.emit('playerMovement', {
        left: this.cursors.left.isDown,
        up: this.cursors.up.isDown,
        right: this.cursors.right.isDown,
        down: this.cursors.down.isDown,
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
    // Draw net
    if (this.state.net) {
      this.graphics.fillStyle(0xefefef);
      gameUtils.drawMatterBody(this.graphics, this.state.net);
    }
    // Draw walls
    this.graphics.fillStyle(0x000000);
    this.state.walls.forEach((wall) => {
      gameUtils.drawMatterBody(this.graphics, wall);
    });
    // Draw ball
    if (this.state.ball) {
      const { team } = this.state.ball;
      if (team === 'RED') {
        this.graphics.fillStyle(0xff0000);
      } else if (team === 'BLUE') {
        this.graphics.fillStyle(0x0000ff);
      } else if (team == null) {
        this.graphics.fillStyle(0x000000);
      } else {
        // For debugging only. Should not happen.
        this.graphics.fillStyle(0xefefef);
      }
      this.graphics.fillCircle(
        this.state.ball.position.x,
        this.state.ball.position.y,
        this.state.ball.circleRadius,
      );
    }
    // Draw players
    Object.entries(this.state.players).forEach(([playerId, playerData]) => {
      if (playerData.team === 'RED') {
        this.graphics.fillStyle(0xff0000);
      } else if (playerData.team === 'BLUE') {
        this.graphics.fillStyle(0x0000ff);
      } else {
        this.graphics.fillStyle(0x000000);
      }
      gameUtils.drawMatterBody(this.graphics, playerData);
      if (!this.playerNametags[playerId]) {
        this.playerNametags[playerId] = scene.add
          .text(0, 0, playerData.username, {
            font: '14px Arial',
            fill: '#000000',
            align: 'center',
          })
          .setOrigin(0.5, 1);
      }
      this.playerNametags[playerId].setPosition(
        playerData.x,
        playerData.y - playerData.height / 2 - 5, // 5px on top of the player
      );
    });
    // FIXME: This is a super dirty way to remove nametags of disconnected players.
    // Will be fixed after adding player-related events, such as playerJoin, playerLeave, etc.
    // The client currently doesn't know when a player leaves. It only receives player datas
    // from the server, so we have to do this.
    Object.entries(this.playerNametags).forEach(([playerId, nametag]) => {
      if (!this.state.players[playerId]) {
        nametag.destroy();
        delete this.playerNametags[playerId];
      }
    });
  };

  render() {
    return (
      <div id="game-window"></div> // Phaser will create the canvas element here
    );
  }
}

const init = () => {
  ReactDOM.render(
    <NavigationBar
      start={<a id="navbar-username" className="navbar-item">Username</a>}
    >
      <a className="button is-light" href="/changePassword">Change Password</a>
      <a className="button is-light" href="/logout">Log Out</a>
    </NavigationBar>,
    document.getElementById('navbar'),
  );

  const purchaseItem = (itemId, itemContainer) => {
    if (!itemId || !items[itemId]) {
      showChatMessage('System', 'chat-error', 'Item not found', Date.now());
      return;
    }
    utils.sendPost(
      '/api/user/purchaseItem',
      { itemId },
      {
        onError: (result) => {
          showChatMessage('System', 'chat-error', result.error, Date.now());
        },
        onSuccess: (result) => {
          const buyButton = itemContainer.querySelector('.buy-button');
          buyButton.setAttribute('disabled', true);
          buyButton.textContent = 'Purchased';
          showChatMessage('System', 'chat-success', result.message, Date.now());
          const canvas = document.querySelector('#game-window canvas');
          canvas.focus({ preventScroll: true });
        },
      },
    );
  };
  ReactDOM.render(<ItemStore items={items} />, document.getElementById('items-content'));
  document.querySelectorAll('.item-container').forEach((itemContainer) => {
    const buyButton = itemContainer.querySelector('.buy-button');
    buyButton.addEventListener('click', () => {
      purchaseItem(itemContainer.dataset.itemId, itemContainer);
    });
  });

  const sendChatMessage = () => {
    const chatInput = document.getElementById('chat-input');
    if (chatInput.value) {
      socket.emit('chatMessage', { msg: chatInput.value, timestamp: Date.now() });
      chatInput.value = '';
    } else {
      showChatMessage('System', 'chat-error', 'You cannot send an empty message', Date.now());
      console.log('You cannot send an empty message');
    }
  };
  document.getElementById('send-button').addEventListener('click', () => {
    sendChatMessage();
    // Allow the user to send another message without having to click on the input box again
    const chatInput = document.getElementById('chat-input');
    chatInput.focus();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && document.activeElement === document.getElementById('chat-input')) {
      sendChatMessage();
    }
  });

  ReactDOM.render(<GameWindow />, document.getElementById('content'));
  // Update username on navbar, and update item store for purchased items
  fetch('/api/user/info')
    .then((res) => res.json())
    .then((info) => {
      const { username, items: purchasedItems } = info;
      document.getElementById('navbar-username').textContent = username;
      purchasedItems.forEach((itemData) => {
        const itemContainer = document.querySelector(
          `.item-container[data-item-id="${itemData.itemId}"]`,
        );
        if (!itemContainer) {
          console.log(`Item container for ${itemData.itemId} not found`);
          return;
        }
        const buyButton = itemContainer.querySelector('.buy-button');
        buyButton.setAttribute('disabled', true);
        buyButton.textContent = 'Purchased';
      });
    });
};

window.onload = init;
