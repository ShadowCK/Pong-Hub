class PlayerChatPacket {
  /**
   * @param {string} playerId - The id of the player (socket.id)
   * @param {boolean} w - If the w key is pressed
   * @param {boolean} a - If the a key is pressed
   * @param {boolean} s - If the s key is pressed
   * @param {boolean} d - If the d key is pressed
   */
  constructor(playerId, username, msg, timestamp) {
    this.playerId = playerId;
    this.username = username;
    this.msg = msg;
    this.timestamp = timestamp;
  }
}

module.exports = PlayerChatPacket;
