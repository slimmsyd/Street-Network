const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  filename: String,
  contentType: String,
  uploadDate: { type: Date, default: Date.now },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  metadata: {
    originalName: String,
    size: Number,
    type: String, // e.g., 'profile', 'family', etc.
    description: String
  }
});

module.exports = mongoose.model('Image', imageSchema); 