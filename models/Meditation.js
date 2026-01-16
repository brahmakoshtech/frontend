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
  videoKey: {
    type: String,
    trim: true
    // S3 object key for generating presigned URLs
  },
  imageUrl: {
    type: String,
    trim: true
  },
  imageKey: {
    type: String,
    trim: true
    // S3 object key for generating presigned URLs
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