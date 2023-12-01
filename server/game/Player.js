class Player {
  constructor(id, x, y, width, height) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  move(deltaX, deltaY) {
    this.x += deltaX;
    this.y += deltaY;
  }
}

module.exports = Player;
