const Matter = require('matter-js');

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

  constructor(id, x, y, width, height) {
    this.id = id;
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
    });
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
}

module.exports = Player;
