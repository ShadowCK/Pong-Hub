class PlayerChatPacket {
  /**
   * @param {string} playerId - The id of the player (socket.id)
   * @param {string} username - The username of the player
   * @param {string} msg - The message content
   * @param {number} timestamp - The timestamp of the message
   */
  constructor({
    playerId, username, msg, timestamp,
  }) {
    this.playerId = playerId;
    this.username = username;
    this.msg = msg;
    this.timestamp = timestamp;
  }
}

module.exports = PlayerChatPacket;
