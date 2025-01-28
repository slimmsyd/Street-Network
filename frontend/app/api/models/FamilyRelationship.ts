import mongoose, { Document, Model } from 'mongoose';

interface IFamilyRelationship extends Document {
  workspaceId: mongoose.Types.ObjectId;
  fromUserId: mongoose.Types.ObjectId;
  toUserId: mongoose.Types.ObjectId;
  relationType: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface FamilyRelationshipModel extends Model<IFamilyRelationship> {
  getFamilyMembers(userId: string, workspaceId: string): Promise<IFamilyRelationship[]>;
  getRelationship(userId1: string, userId2: string, workspaceId: string): Promise<IFamilyRelationship | null>;
}

const relationshipTypes = [
  'mother', 'Mother', 'mom', 'Mom',
  'father', 'Father', 'dad', 'Dad', 'daddy', 'Daddy',
  'son', 'Son',
  'daughter', 'Daughter',
  'brother', 'Brother', 'bro', 'Bro',
  'sister', 'Sister', 'sis', 'Sis',
  'grandfather', 'Grandfather', 'grandpa', 'Grandpa',
  'grandmother', 'Grandmother', 'grandma', 'Grandma',
  'grandson', 'Grandson',
  'granddaughter', 'Granddaughter',
  'uncle', 'Uncle',
  'aunt', 'Aunt', 'auntie', 'Auntie',
  'nephew', 'Nephew',
  'niece', 'Niece',
  'cousin', 'Cousin', 'cuz', 'Cuz',
  'spouse', 'Spouse', 'husband', 'Husband', 'wife', 'Wife'
];

const familyRelationshipSchema = new mongoose.Schema({
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true
  },
  fromUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  toUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  relationType: {
    type: String,
    enum: relationshipTypes,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
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

// Index for faster queries
familyRelationshipSchema.index({ workspaceId: 1, fromUserId: 1, toUserId: 1 });

// Middleware to update the updatedAt timestamp
familyRelationshipSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Helper method to get all family members for a user in a workspace
familyRelationshipSchema.statics.getFamilyMembers = async function(userId: string, workspaceId: string) {
  return this.find({
    workspaceId,
    $or: [
      { fromUserId: userId },
      { toUserId: userId }
    ],
    isActive: true
  }).populate('fromUserId toUserId');
};

// Helper method to get specific relationships
familyRelationshipSchema.statics.getRelationship = async function(
  userId1: string,
  userId2: string,
  workspaceId: string
) {
  return this.findOne({
    workspaceId,
    $or: [
      { fromUserId: userId1, toUserId: userId2 },
      { fromUserId: userId2, toUserId: userId1 }
    ],
    isActive: true
  });
};

const FamilyRelationship = (mongoose.models.FamilyRelationship || 
  mongoose.model<IFamilyRelationship, FamilyRelationshipModel>('FamilyRelationship', familyRelationshipSchema)) as FamilyRelationshipModel;

export default FamilyRelationship; 