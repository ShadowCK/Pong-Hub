const Vector2 = require('./Vector2.js');

/**
 * @typedef {Object} myType
 * @property {string} haha
 * @property {number} test
 */

class Player {
  id;

  x;

  y;

  width;

  height;

  speed = 100;

  direction = new Vector2(0, 0);

  get position() {
    return new Vector2(this.x, this.y);
  }

  set position(vector) {
    this.x = vector.x;
    this.y = vector.y;
  }

  get velocity() {
    return this.direction.multiply(this.speed);
  }

  set velocity(vector) {
    this.direction = vector.normalize();
    this.speed = vector.magnitude();
  }

  constructor(id, x, y, width, height) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  move(deltaTime) {
    this.position = this.position.add(this.velocity.multiply(deltaTime));
  }

  moveBy(deltaX, deltaY) {
    this.x += deltaX;
    this.y += deltaY;
  }
}

module.exports = Player;
