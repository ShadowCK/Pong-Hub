class PlayerMovementPacket {
  /**
   * @param {string} playerId - The id of the player (socket.id)
   * @param {boolean} w - If the w key is pressed
   * @param {boolean} a - If the a key is pressed
   * @param {boolean} s - If the s key is pressed
   * @param {boolean} d - If the d key is pressed
   */
  constructor(playerId, w, a, s, d) {
    this.playerId = playerId;
    this.w = w;
    this.a = a;
    this.s = s;
    this.d = d;
  }
}

module.exports = PlayerMovementPacket;
