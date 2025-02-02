import mongoose from 'mongoose';

const ResourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
  },
  url: {
    type: String,
    required: [true, 'URL is required'],
    trim: true,
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['AI', 'Memes', 'DAO', 'Quantum'],
  },
  source: {
    type: String,
    required: true,
    enum: ['discord', 'web', 'api'],
    default: 'web'
  },
  metadata: {
    discordServerId: String,
    discordChannelId: String,
    discordMessageId: String,
    discordUserId: String,
    discordUsername: String,
    messageContent: String,
    commandUsed: String,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  dateAdded: {
    type: Date,
    default: Date.now,
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  likes: {
    type: Number,
    default: 0,
  },
  tags: [{
    type: String,
    trim: true,
  }],
  engagement: {
    views: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    saves: { type: Number, default: 0 },
  },
  moderationNotes: [{
    note: String,
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    dateAdded: { type: Date, default: Date.now }
  }],
}, {
  timestamps: true // Adds createdAt and updatedAt fields
});

// Modified export to prevent model recompilation
const ResourceModel = mongoose.models.Resource || mongoose.model('Resource', ResourceSchema);

export default ResourceModel; 

