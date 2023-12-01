class Vector2 {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  // Addition with another vector
  add(vector) {
    return new Vector2(this.x + vector.x, this.y + vector.y);
  }

  // Subtraction with another vector
  subtract(vector) {
    return new Vector2(this.x - vector.x, this.y - vector.y);
  }

  // Multiply with a scalar
  multiply(scalar) {
    return new Vector2(this.x * scalar, this.y * scalar);
  }

  // Calculate the magnitude (length) of the vector
  magnitude() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  // Normalize the vector (make it length 1)
  normalize() {
    const mag = this.magnitude();
    if (mag === 0) return new Vector2(0, 0);
    return this.multiply(1 / mag);
  }

  // Static method to create a zero vector
  static zero() {
    return new Vector2(0, 0);
  }
}

module.exports = Vector2;
