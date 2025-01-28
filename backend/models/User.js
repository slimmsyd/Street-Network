const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // General Section
  name: {
    type: String,
    required: [true, 'Please add a name'],
  },
  profileImage: {
    type: String,
    default: 'default.jpg',
  },
  occupation: {
    type: String,
    default: '',
  },

  // Contact Information
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email',
    ],
  },
  phoneNumber: {
    type: String,
    default: '',
  },

  // Personal Details
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

  // About Me
  bio: {
    type: String,
    default: '',
  },

  // Interests
  interests: [{
    type: String,
  }],

  // Family Milestones
  milestones: [{
    date: {
      type: String,
    },
    title: {
      type: String,
    },
    description: {
      type: String,
    },
    arweaveTransactionId: {
      type: String,
      default: null
    }
  }],

  // Family Role & Contributions
  familyRole: {
    type: String,
    default: 'member',
  },
  contributions: [{
    type: String,
  }],

  // System and Security
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastLogin: {
    type: Date,
  },
  familyConnections: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    relationship: {
      type: String,
      required: true
    },
    confirmed: {
      type: Boolean,
      default: false
    },
    arweaveTransactionId: {
      type: String,
      default: null
    }
  }],
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
});

module.exports = mongoose.model('User', userSchema); 