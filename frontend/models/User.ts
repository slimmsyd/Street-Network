import mongoose from 'mongoose';

// Delete any existing model to allow for hot reloading
delete mongoose.models.User;

const familyConnectionSchema = new mongoose.Schema({
  relatedUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  relationship: {
    type: String,
    enum: ['parent', 'child', 'sibling', 'spouse', 'grandparent', 'grandchild', 'aunt-uncle', 'niece-nephew', 'cousin'],
    required: true
  },
  confirmed: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email',
    ],
  },
  profileImage: {
    type: String,
    default: 'default.jpg',
  },
  occupation: {
    type: String,
    default: '',
  },
  phoneNumber: {
    type: String,
    default: '',
  },
  birthDay: {
    type: Date,
  },
  maritalStatus: {
    type: String,
    enum: ['single', 'married', 'divorced', 'widowed'],
    default: 'single',
  },
  location: {
    type: String,
    default: '',
  },
  bio: {
    type: String,
    default: '',
  },
  interests: [{
    type: String,
  }],
  milestones: [{
    date: {
      type: Date,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    arweave_tx_id: {
      type: String
    }
  }],
  familyRole: {
    type: String,
    default: '',
  },
  contributions: [{
    type: String,
  }],
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  settings: {
    notifications: {
      type: Boolean,
      default: true,
    },
    privacy: {
      type: String,
      enum: ['public', 'private', 'family-only'],
      default: 'family-only',
    },
  },
  ethnicity: {
    type: String,
    required: false,
  },
  rewardPoints: {
    type: Number,
    default: 0,
  },
  referralLink: {
    type: String,
    unique: true,
    sparse: true,
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  workspaces: [{
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace'
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
  }],
  familyConnections: [familyConnectionSchema]
}, {
  timestamps: true
});

// Add a method to establish family connection
userSchema.methods.establishFamilyConnection = async function(relatedUserId: string, relationship: string) {
  // Add the connection to the current user
  if (!this.familyConnections) {
    this.familyConnections = [];
  }
  
  this.familyConnections.push({
    relatedUserId,
    relationship,
    confirmed: false
  });
  await this.save();

  // Get the inverse relationship
  const inverseRelationship = getInverseRelationship(relationship);
  
  // Add the inverse connection to the related user
  const relatedUser = await mongoose.model('User').findById(relatedUserId);
  if (relatedUser) {
    if (!relatedUser.familyConnections) {
      relatedUser.familyConnections = [];
    }
    
    relatedUser.familyConnections.push({
      relatedUserId: this._id,
      relationship: inverseRelationship,
      confirmed: false
    });
    await relatedUser.save();
  }
};

// Helper function to get inverse relationship
function getInverseRelationship(relationship: string): string {
  const inverseMap: { [key: string]: string } = {
    'parent': 'child',
    'child': 'parent',
    'sibling': 'sibling',
    'spouse': 'spouse',
    'grandparent': 'grandchild',
    'grandchild': 'grandparent',
    'aunt-uncle': 'niece-nephew',
    'niece-nephew': 'aunt-uncle',
    'cousin': 'cousin'
  };
  return inverseMap[relationship] || relationship;
}

const User = mongoose.model('User', userSchema);
export default User; 