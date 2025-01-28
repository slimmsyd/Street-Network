import mongoose, { Document } from 'mongoose';
import FamilyRelationship from './FamilyRelationship';

// Delete the existing model if it exists to allow schema modifications
if (mongoose.models.User) {
  delete mongoose.models.User;
}

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
    required: false, // Made optional since users can sign up with wallet
    unique: true,
    sparse: true // Allows null/undefined values while maintaining uniqueness
  },
  walletAddress: {
    type: String,
    required: false,
    unique: true,
    sparse: true // Allows null/undefined values while maintaining uniqueness
  },
  discordTag: {
    type: String,
    required: false,
    match: [
      /^.{3,32}#[0-9]{4}$|^.{2,32}$/, // Matches both old #tag and new username format
      'Please enter a valid Discord tag'
    ]
  },
  password: {
    type: String,
    required: false // Optional because of Google sign in and wallet auth
  },
  name: {
    type: String,
    required: false // Made optional for initial wallet signup
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
  }
});

// Add pre-save middleware to update the updatedAt field
userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User; 