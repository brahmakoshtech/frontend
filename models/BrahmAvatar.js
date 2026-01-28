import mongoose from 'mongoose';

const brahmAvatarSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Spiritual', 'Devotional', 'Meditation', 'Mantra', 'Festival'],
    default: 'Spiritual'
  },
  type: {
    type: String,
    required: true,
    enum: ['Reel', 'Short', 'Story'],
    default: 'Reel'
  },
  video: {
    type: String,
    required: false
  },
  videoKey: {
    type: String
  },
  image: {
    type: String,
    required: false
  },
  imageKey: {
    type: String
  },
  imagePrompt: {
    type: String,
    required: true,
    trim: true
  },
  videoPrompt: {
    type: String,
    required: true,
    trim: true
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
  views: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  },
  shares: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

const BrahmAvatar = mongoose.model('BrahmAvatar', brahmAvatarSchema);
export default BrahmAvatar;