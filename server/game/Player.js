const Matter = require('matter-js');
const { itemIds, items } = require('./items.js');

class Player {
  id;

  width;

  height;

  body;

  // * "Seems Matter’s velocity is meters (pixels) per step or 1/60s"
  // https://phaser.discourse.group/t/setting-velocity-for-matter-js-object/13327/3
  maxSpeed = 200 / 60;

  acceleration = 800 / 60;

  team = null;

  appliedItems = [];

  constructor(id, username, x, y, width, height, options = {}) {
    this.id = id;
    this.username = username;
    this.width = width;
    this.height = height;
    this.body = Matter.Bodies.rectangle(x, y, width, height, {
      inertia: Infinity, // This will prevent rotation
      frictionAir: 0.004,
      // Now that inertia is Infinity, 100% of friction slows down
      // the player (instead of rotating it) - we don't want that.
      friction: 0,
      frictionStatic: 0,
      restitution: 0.1,
      // High enough so that the ball can't push the player
      density: 100,
      ...options,
    });
    this.body.parentGameObject = this;
  }

  get position() {
    return { ...this.body.position };
  }

  set position(pos) {
    Matter.Body.setPosition(this.body, pos);
  }

  get direction() {
    return Matter.Vector.normalise(this.body.velocity);
  }

  set direction({ x, y }) {
    const newDir = Matter.Vector.normalise({ x, y });
    let currentSpeed = Matter.Vector.magnitude(this.body.velocity);
    // If speed is 0, direction can't be calculated from velocity. So we set it to very small.
    if (currentSpeed === 0) currentSpeed = 0.001;
    Matter.Body.setVelocity(this.body, Matter.Vector.mult(newDir, currentSpeed));
  }

  get speed() {
    return Matter.Vector.magnitude(this.body.velocity);
  }

  set speed(newSpeed) {
    const currentDir = Matter.Vector.normalise(this.body.velocity);
    Matter.Body.setVelocity(this.body, Matter.Vector.mult(currentDir, newSpeed));
  }

  get velocity() {
    return { ...this.body.velocity };
  }

  set velocity(vector) {
    Matter.Body.setVelocity(this.body, vector);
  }

  setTeam(team) {
    this.team = team;
  }

  /**
   * Will ignore collision. Use SetVelocity instead.
   * @param {Number} deltaTime
   */
  move(deltaTime) {
    Matter.Body.translate(this.body, Matter.Vector.mult(this.body.velocity, deltaTime));
  }

  /**
   * Will ignore collision. Use SetVelocity instead.
   * @param {Number} deltaTime
   */
  moveBy(deltaX, deltaY) {
    Matter.Body.translate(this.body, { x: deltaX, y: deltaY });
  }

  applyItem(itemId) {
    // Already applied
    if (this.appliedItems.includes(itemId)) {
      return;
    }
    const isValidId = items[itemId] != null;
    if (!isValidId) {
      console.error(`Invalid item id: ${itemId}`);
      return;
    }
    switch (itemId) {
      case itemIds.faster:
        this.maxSpeed *= 1.2;
        this.acceleration *= 1.2;
        break;
      case itemIds.stronger:
        this.height *= 1.2;
        Matter.Body.scale(this.body, 1, 1.2);
        // Matter.js will recalculate multiple attributes of the body when scaling,
        // including inertia. We need to set it back to Infinity to prevent rotation.
        Matter.Body.setInertia(this.body, Infinity);
        break;
      case itemIds.godSpeed:
        this.maxSpeed *= 1.25;
        this.acceleration *= 2;
        break;
      case itemIds.obese:
        this.width *= 1.25;
        this.height *= 1.25;
        Matter.Body.scale(this.body, 1.25, 1.25);
        Matter.Body.setInertia(this.body, Infinity);
        break;
      default:
        console.log(`Unhandled item id: ${itemId}`);
        return;
    }
    this.appliedItems.push(itemId);
  }
}

module.exports = Player;
