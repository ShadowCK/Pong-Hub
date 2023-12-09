class PlayerMovementPacket {
  /**
   * @param {string} playerId - The id of the player (socket.id)
   * @param {boolean} w - If the w key is pressed
   * @param {boolean} a - If the a key is pressed
   * @param {boolean} s - If the s key is pressed
   * @param {boolean} d - If the d key is pressed
   * @param {boolean} left - If the left key is pressed
   * @param {boolean} up - If the up key is pressed
   * @param {boolean} right - If the right key is pressed
   * @param {boolean} down - If the down key is pressed
   * @param {number} gamma - The gamma value of the device's orientation
   * @param {number} beta - The beta value of the device's orientation
   */
  constructor({
    playerId, w, a, s, d, left, up, right, down, gamma, beta,
  }) {
    this.playerId = playerId;
    this.w = w;
    this.a = a;
    this.s = s;
    this.d = d;
    this.left = left;
    this.up = up;
    this.right = right;
    this.down = down;
    this.gamma = gamma;
    this.beta = beta;
  }
}

module.exports = PlayerMovementPacket;
