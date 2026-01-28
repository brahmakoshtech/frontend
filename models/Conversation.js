import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
  conversationId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  partnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Partner',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['active', 'ended', 'pending'],
    default: 'pending'
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  lastMessage: {
    content: String,
    senderId: mongoose.Schema.Types.ObjectId,
    senderModel: String,
    createdAt: Date
  },
  unreadCount: {
    partner: { type: Number, default: 0 },
    user: { type: Number, default: 0 }
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  endedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Compound index for finding conversations
conversationSchema.index({ partnerId: 1, userId: 1 });
conversationSchema.index({ status: 1, lastMessageAt: -1 });

export default mongoose.model('Conversation', conversationSchema);