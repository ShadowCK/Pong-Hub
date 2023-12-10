const mongoose = require('mongoose');

const MAX_CHAT_HISTORY_LENGTH = 10000;

const ChatMessageSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  team: {
    type: String,
    required: true,
  },
  msg: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const ChatHistorySchema = new mongoose.Schema({
  history: {
    type: [ChatMessageSchema],
    validate: [(val) => val.length <= MAX_CHAT_HISTORY_LENGTH, '{PATH} exceeds the limit of 1000'],
  },
  serverStartTime: {
    type: Date,
    default: Date.now,
  },
});

const ChatHistoryModel = mongoose.model('ChatHistory', ChatHistorySchema);

module.exports = ChatHistoryModel;
