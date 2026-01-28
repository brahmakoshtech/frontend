import express from 'express';
import jwt from 'jsonwebtoken';
import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import Partner from '../models/Partner.js';
import User from '../models/User.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production-to-a-strong-random-string';

// Middleware to authenticate
const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    let user;
    if (decoded.role === 'partner') {
      user = await Partner.findById(decoded.partnerId);
      req.userId = decoded.partnerId;
      req.userType = 'partner';
    } else if (decoded.role === 'user') {
      user = await User.findById(decoded.userId);
      req.userId = decoded.userId;
      req.userType = 'user';
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

// @route   GET /api/chat/partners
// @desc    Get all partners with online/busy status (for users)
// @access  Private (User only)
router.get('/partners', authenticate, async (req, res) => {
  try {
    if (req.userType !== 'user') {
      return res.status(403).json({
        success: false,
        message: 'Only users can view partners list'
      });
    }

    const partners = await Partner.find({ isActive: true, isVerified: true })
      .select('name email profilePicture specialization rating totalSessions experience')
      .sort({ rating: -1, totalSessions: -1 })
      .lean();

    // Note: Online/busy status will be updated via WebSocket
    // This endpoint returns base data
    const partnersData = partners.map(partner => ({
      ...partner,
      isOnline: false,
      isBusy: false,
      status: 'offline'
    }));

    res.json({
      success: true,
      data: partnersData
    });
  } catch (error) {
    console.error('Error fetching partners:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch partners'
    });
  }
});

// @route   GET /api/chat/conversations
// @desc    Get all conversations for logged-in user/partner
// @access  Private
router.get('/conversations', authenticate, async (req, res) => {
  try {
    const isPartner = req.userType === 'partner';
    const query = isPartner 
      ? { partnerId: req.userId }
      : { userId: req.userId };

    const conversations = await Conversation.find(query)
      .sort({ lastMessageAt: -1 })
      .populate('partnerId', 'name email profilePicture specialization rating')
      .populate('userId', 'email profile profileImage')
      .lean();

    const conversationsData = conversations.map(conv => ({
      ...conv,
      otherUser: isPartner ? conv.userId : conv.partnerId,
      unreadCount: isPartner ? conv.unreadCount.partner : conv.unreadCount.user
    }));

    res.json({
      success: true,
      data: conversationsData
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversations'
    });
  }
});

// @route   GET /api/chat/conversations/:conversationId/messages
// @desc    Get messages for a specific conversation
// @access  Private
router.get('/conversations/:conversationId/messages', authenticate, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Verify user has access to this conversation
    const conversation = await Conversation.findOne({ conversationId });
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    const isPartner = req.userType === 'partner';
    const hasAccess = isPartner 
      ? conversation.partnerId.toString() === req.userId 
      : conversation.userId.toString() === req.userId;

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const messages = await Message.find({ conversationId, isDeleted: false })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('senderId', 'name email profilePicture profile')
      .lean();

    const totalMessages = await Message.countDocuments({ conversationId, isDeleted: false });

    res.json({
      success: true,
      data: {
        messages: messages.reverse(),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalMessages,
          totalPages: Math.ceil(totalMessages / parseInt(limit)),
          hasMore: skip + messages.length < totalMessages
        }
      }
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages'
    });
  }
});

// @route   POST /api/chat/conversations/:conversationId/messages
// @desc    Send a message (REST fallback if WebSocket is not available)
// @access  Private
router.post('/conversations/:conversationId/messages', authenticate, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content, messageType = 'text', mediaUrl = null } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }

    const conversation = await Conversation.findOne({ conversationId });
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    const isPartner = req.userType === 'partner';
    const senderId = req.userId;
    const senderModel = isPartner ? 'Partner' : 'User';
    const receiverId = isPartner ? conversation.userId : conversation.partnerId;
    const receiverModel = isPartner ? 'User' : 'Partner';

    const message = await Message.create({
      conversationId,
      senderId,
      senderModel,
      receiverId,
      receiverModel,
      messageType,
      content,
      mediaUrl
    });

    await message.populate('senderId', 'name email profilePicture profile');

    // Update conversation
    await Conversation.findOneAndUpdate(
      { conversationId },
      {
        lastMessageAt: new Date(),
        lastMessage: {
          content,
          senderId,
          senderModel,
          createdAt: message.createdAt
        },
        $inc: {
          [`unreadCount.${isPartner ? 'user' : 'partner'}`]: 1
        }
      }
    );

    res.json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
  }
});

// @route   POST /api/chat/conversations
// @desc    Create or get existing conversation
// @access  Private
router.post('/conversations', authenticate, async (req, res) => {
  try {
    const { partnerId, userId } = req.body;

    // Validate request based on user type
    if (req.userType === 'user' && !partnerId) {
      return res.status(400).json({
        success: false,
        message: 'Partner ID is required'
      });
    }

    if (req.userType === 'partner' && !userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const finalPartnerId = req.userType === 'partner' ? req.userId : partnerId;
    const finalUserId = req.userType === 'user' ? req.userId : userId;

    // Create conversation ID
    const conversationId = [finalPartnerId, finalUserId].sort().join('_');

    // Find or create conversation
    let conversation = await Conversation.findOne({ conversationId });

    if (!conversation) {
      conversation = await Conversation.create({
        conversationId,
        partnerId: finalPartnerId,
        userId: finalUserId,
        status: 'pending'
      });
    }

    await conversation.populate('partnerId', 'name email profilePicture specialization rating');
    await conversation.populate('userId', 'email profile profileImage');

    res.json({
      success: true,
      data: conversation
    });
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create conversation'
    });
  }
});

// @route   PATCH /api/chat/conversations/:conversationId/read
// @desc    Mark all messages in conversation as read
// @access  Private
router.patch('/conversations/:conversationId/read', authenticate, async (req, res) => {
  try {
    const { conversationId } = req.params;

    await Message.updateMany(
      {
        conversationId,
        receiverId: req.userId,
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    const isPartner = req.userType === 'partner';
    await Conversation.findOneAndUpdate(
      { conversationId },
      {
        [`unreadCount.${isPartner ? 'partner' : 'user'}`]: 0
      }
    );

    res.json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark messages as read'
    });
  }
});

// @route   PATCH /api/chat/conversations/:conversationId/end
// @desc    End a conversation
// @access  Private
router.patch('/conversations/:conversationId/end', authenticate, async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findOneAndUpdate(
      { conversationId },
      {
        status: 'ended',
        endedAt: new Date()
      },
      { new: true }
    );

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    res.json({
      success: true,
      data: conversation
    });
  } catch (error) {
    console.error('Error ending conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to end conversation'
    });
  }
});

// @route   GET /api/chat/unread-count
// @desc    Get total unread message count
// @access  Private
router.get('/unread-count', authenticate, async (req, res) => {
  try {
    const isPartner = req.userType === 'partner';
    const query = isPartner 
      ? { partnerId: req.userId }
      : { userId: req.userId };

    const conversations = await Conversation.find(query);
    
    const totalUnread = conversations.reduce((sum, conv) => {
      return sum + (isPartner ? conv.unreadCount.partner : conv.unreadCount.user);
    }, 0);

    res.json({
      success: true,
      data: {
        totalUnread,
        conversationCount: conversations.length
      }
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unread count'
    });
  }
});

export default router;