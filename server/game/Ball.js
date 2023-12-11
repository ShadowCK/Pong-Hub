const Matter = require('matter-js');

const { Bodies } = Matter;

/**
 * Represents a ball in the game.
 * "The ball" is also true for now, but in the future there will be more balls
 */
class Ball {
  body;

  minSpeed = 100 / 60;

  maxSpeed = 400 / 60;

  team = null;

  constructor(x, y, radius, options) {
    this.body = Bodies.circle(x, y, radius, {
      restitution: 0.9,
      // TODO: setting this to smaller than 0.001 somehow does not
      // have any more visual effect on its speed after being hit
      density: 0.0005,
      friction: 0.01,
      frictionAir: 0.001,
      frictionStatic: 0.1,
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
}

module.exports = Ball;
