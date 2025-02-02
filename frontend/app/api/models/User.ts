import mongoose, { Document } from 'mongoose';
import FamilyRelationship from './FamilyRelationship';

// Delete the existing model if it exists to allow schema modifications
if (mongoose.models.User) {
  delete mongoose.models.User;
}

// Drop the existing email index if it exists
const dropEmailIndex = async () => {
  try {
    const User = mongoose.model('User');
    await User.collection.dropIndex('email_1');
    console.log('Successfully dropped email index');
  } catch (error) {
    // Index might not exist, which is fine
    console.log('Note: email index might not exist or already dropped');
  }
};

interface IUserWorkspaceDocument extends Document {
  workspaceId: mongoose.Types.ObjectId;
  role: 'admin' | 'member';
  invitedBy?: mongoose.Types.ObjectId;
  relationshipToInviter?: string;
  joinedAt: Date;
  createFamilyRelationship(): Promise<void>;
}

const userWorkspaceSchema = new mongoose.Schema({
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'member'],
    default: 'member'
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  relationshipToInviter: {
    type: String,
    required: false,
    default: null,
    enum: [
      'mother', 'father',
      'son', 'daughter',
      'spouse',
      'brother', 'sister',
      'cousin',
      'aunt', 'uncle',
      'niece', 'nephew',
      'grandfather', 'grandmother',
      'grandson', 'granddaughter',
      'other',
      null
    ]
  },
  joinedAt: {
    type: Date,
    default: Date.now
  }
});

userWorkspaceSchema.methods = {
  async createFamilyRelationship() {
    if (this.invitedBy && this.relationshipToInviter) {
      await FamilyRelationship.create({
        workspaceId: this.workspaceId,
        fromUserId: this.parent().id,
        toUserId: this.invitedBy,
        relationType: this.relationshipToInviter
      });
    }
  }
};

// Add post-save middleware to create family relationship
userWorkspaceSchema.post('save', async function(this: IUserWorkspaceDocument) {
  if (this.invitedBy && this.relationshipToInviter) {
    await this.createFamilyRelationship();
  }
});

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: false,
  },
  walletAddress: {
    type: String,
    required: false,
    unique: true,
    sparse: true
  },
  discordId: {
    type: String,
    unique: true,
    sparse: true
  },
  discordTag: {
    type: String,
    unique: true,
    sparse: true
  },
  discordEmail: {
    type: String,
    sparse: true
  },
  discordAvatarUrl: {
    type: String,
    sparse: true
  },
  discordGuilds: [{
    id: String,
    name: String,
    icon: String,
    owner: Boolean,
    permissions: String
  }],
  discordConnections: [{
    type: String,
    id: String,
    name: String,
    visibility: Boolean,
    verified: Boolean,
    revoked: Boolean
  }],
  password: {
    type: String,
    required: false
  },
  name: {
    type: String,
    required: false
  },
  profileImage: String,
  occupation: String,
  phoneNumber: String,
  birthDay: Date,
  gender: {
    type: String,
    enum: ['male', 'female', 'non-binary', 'other', 'prefer-not-to-say']
  },
  maritalStatus: {
    type: String,
    enum: ['single', 'married', 'divorced', 'widowed']
  },
  location: String,
  bio: String,
  interests: [String],
  milestones: [{
    date: Date,
    title: String,
    description: String
  }],
  familyRole: String,
  familyConnections: [{
    relatedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    relationship: {
      type: String,
      enum: [
        'mother', 'father', 'parent',
        'son', 'daughter, sibling',
        'spouse', 'husband', 'wife',
        'brother', 'sister',
        'cousin',
        'aunt', 'uncle',
        'niece', 'nephew',
        'grandfather', 'grandmother',
        'grandson', 'granddaughter'
      ]
    },
    confirmed: {
      type: Boolean,
      default: false
    }
  }],
  contributions: [{
    type: String
  }],
  settings: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  workspaces: [userWorkspaceSchema],
  primaryWorkspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  points: {
    type: Number,
    default: 0
  }
});

// Add pre-save middleware to update the updatedAt field
userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Drop the old index before creating the model
dropEmailIndex().catch(console.error);

const User = mongoose.models.User || mongoose.model('User', userSchema);

// Ensure indexes are dropped and recreated properly
const setupIndexes = async () => {
  try {
    // Drop all indexes except _id
    await User.collection.dropIndexes();
    console.log('Dropped all indexes');
    
    // Recreate necessary indexes
    await User.collection.createIndex(
      { walletAddress: 1 }, 
      { unique: true, sparse: true }
    );
    console.log('Created wallet index');
    
    // Add other unique indexes back
    await User.collection.createIndex(
      { discordId: 1 }, 
      { unique: true, sparse: true }
    );
    await User.collection.createIndex(
      { discordTag: 1 }, 
      { unique: true, sparse: true }
    );
    console.log('Recreated all necessary indexes');
  } catch (error) {
    console.error('Error setting up indexes:', error);
  }
};

// Run the index setup
setupIndexes().catch(console.error);

export default User; 