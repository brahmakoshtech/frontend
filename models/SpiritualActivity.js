import mongoose from 'mongoose';

const spiritualActivitySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  image: {
    type: String,
    default: null
  },
  imageKey: {
    type: String,
    default: null
  },
  icon: {
    type: String,
    default: '🌟'
  },
  completed: {
    type: Boolean,
    default: false
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

export default mongoose.model('SpiritualActivity', spiritualActivitySchema);