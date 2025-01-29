import mongoose from 'mongoose';

const CryptoUserSchema = new mongoose.Schema({
  twitterHandle: {
    type: String,
    required: true,
    unique: true
  },
  specialty: {
    type: String,
    required: true
  },
  submittedBy: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false
    },
    name: String,
    email: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.models.CryptoUser || mongoose.model('CryptoUser', CryptoUserSchema);