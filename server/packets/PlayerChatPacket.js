/**
 * Describes a chat message sent by a player.
 */
class PlayerChatPacket {
  /**
   * @param {Object} options - The options for creating a PlayerChatPacket.
   * @param {string} options.playerId - The id of the player (socket.id, not account._id).
   * @param {string} options.username - The username of the player.
   * @param {string} options.team - The team of the player.
   * @param {string} options.msg - The message content.
   * @param {number} options.timestamp - The timestamp of the message.
   */
  constructor({
    playerId, username, team, msg, timestamp,
  }) {
    this.playerId = playerId;
    this.username = username;
    this.team = team;
    this.msg = msg;
    this.timestamp = timestamp;
  }
}

module.exports = PlayerChatPacket;
