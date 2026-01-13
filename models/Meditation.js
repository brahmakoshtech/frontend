import mongoose from 'mongoose';

const meditationSchema = new mongoose.Schema({
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
  link: {
    type: String,
    trim: true
  },
  videoUrl: {
    type: String,
    trim: true
  },
  imageUrl: {
    type: String,
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
  }
}, {
  timestamps: true
});

export default mongoose.model('Meditation', meditationSchema);