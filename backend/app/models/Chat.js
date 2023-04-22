const mongoose = require("mongoose");

const ChatSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true,
  },
  
  senderName:{
    type: String,
    required: true,
  },
  
  receiverName:{
    type: String,
  },
  
  roomName: {
    type: String,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = Chat = mongoose.model("chats", ChatSchema);
