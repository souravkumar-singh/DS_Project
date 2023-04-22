const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  createdBy: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

roomSchema.index({ name: 1}, { unique: true });

module.exports = Room = mongoose.model('rooms', roomSchema);
