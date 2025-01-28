import mongoose from 'mongoose';

const MilestoneSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  user_email: {
    type: String,
    required: true,
  },
  user_name: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending_arweave', 'immutably_stored', 'failed'],
    default: 'pending_arweave'
  },
  arweave_tx_id: {
    type: String,
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

export const Milestone = mongoose.models.Milestone || mongoose.model('Milestone', MilestoneSchema); 