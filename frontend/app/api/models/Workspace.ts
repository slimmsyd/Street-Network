import mongoose from 'mongoose';

const workspaceMemberSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  role: { 
    type: String, 
    enum: ['admin', 'member'],
    default: 'member' 
  },
  joinedAt: { 
    type: Date, 
    default: Date.now 
  }
});

const workspaceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [workspaceMemberSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});



workspaceSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Workspace = mongoose.models.Workspace || mongoose.model('Workspace', workspaceSchema);

export default Workspace; 