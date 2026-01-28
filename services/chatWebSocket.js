import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import Partner from '../models/Partner.js';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production-to-a-strong-random-string';

// Store online users and their socket IDs
const onlineUsers = new Map(); // userId/partnerId -> socketId
const activeConversations = new Map(); // conversationId -> Set of socketIds
const userTypes = new Map(); // socketId -> 'user' or 'partner'
const userIds = new Map(); // socketId -> userId/partnerId

export const setupChatWebSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: ['http://localhost:5173', 'http://localhost:5174', 'https://frontend-seven-steel-66.vercel.app', 'https://brahmakoshfrontend.vercel.app'],
      credentials: true,
      methods: ['GET', 'POST']
    },
    path: '/socket.io/',
    transports: ['websocket', 'polling']
  });

  // Authentication middleware
//   io.use(async (socket, next) => {
//     try {
//       const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      
//       if (!token) {
//         return next(new Error('Authentication required'));
//       }

//       const decoded = jwt.verify(token, JWT_SECRET);
      
//       // Verify user exists
//       let user;
//       if (decoded.role === 'partner') {
//         user = await Partner.findById(decoded.partnerId);
//         socket.userId = decoded.partnerId;
//         socket.userType = 'partner';
//       } else if (decoded.role === 'user') {
//         user = await User.findById(decoded.userId);
//         socket.userId = decoded.userId;
//         socket.userType = 'user';
//       } else {
//         return next(new Error('Invalid user type'));
//       }

//       if (!user) {
//         return next(new Error('User not found'));
//       }

//       socket.userData = user;
//       next();
//     } catch (error) {
//       console.error('Socket authentication error:', error);
//       next(new Error('Authentication failed'));
//     }
//   });

io.use(async (socket, next) => {
    // TEMPORARY: Use a test user
    socket.userId = 'test-user-123';
    socket.userType = 'user';
    socket.userData = {
      name: 'Test User',
      email: 'test@example.com'
    };
    next();
  });

  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.userId} (${socket.userType})`);

    // Store online user
    onlineUsers.set(socket.userId, socket.id);
    userTypes.set(socket.id, socket.userType);
    userIds.set(socket.id, socket.userId);

    // Emit online status to all connected users
    io.emit('user:online', {
      userId: socket.userId,
      userType: socket.userType,
      online: true
    });

    // Join user to their personal room
    socket.join(`${socket.userType}:${socket.userId}`);

    // Get online partners (for users requesting partner list)
    socket.on('partners:getOnline', async (callback) => {
      try {
        const partners = await Partner.find({ isActive: true })
          .select('name email profilePicture specialization rating totalSessions experience')
          .lean();

        const partnersWithStatus = partners.map(partner => {
          const isOnline = onlineUsers.has(partner._id.toString());
          
          // Check if partner is in active conversation
          let isBusy = false;
          if (isOnline) {
            for (const [convId, sockets] of activeConversations.entries()) {
              if (sockets.has(onlineUsers.get(partner._id.toString()))) {
                isBusy = true;
                break;
              }
            }
          }

          return {
            ...partner,
            isOnline,
            isBusy,
            status: !isOnline ? 'offline' : (isBusy ? 'busy' : 'available')
          };
        });

        callback({
          success: true,
          data: partnersWithStatus
        });
      } catch (error) {
        console.error('Error fetching partners:', error);
        callback({
          success: false,
          message: 'Failed to fetch partners'
        });
      }
    });

    // Start or join conversation
    socket.on('conversation:start', async (data, callback) => {
      try {
        const { partnerId, userId } = data;

        // Create conversation ID (consistent format)
        const conversationId = [partnerId, userId].sort().join('_');

        // Check if conversation exists
        let conversation = await Conversation.findOne({ conversationId });

        if (!conversation) {
          // Create new conversation
          conversation = await Conversation.create({
            conversationId,
            partnerId,
            userId,
            status: 'pending'
          });
        }

        // Join conversation room
        socket.join(conversationId);

        // Add to active conversations
        if (!activeConversations.has(conversationId)) {
          activeConversations.set(conversationId, new Set());
        }
        activeConversations.get(conversationId).add(socket.id);

        // Notify the other party if they're online
        const otherUserType = socket.userType === 'user' ? 'partner' : 'user';
        const otherUserId = socket.userType === 'user' ? partnerId : userId;
        
        io.to(`${otherUserType}:${otherUserId}`).emit('conversation:request', {
          conversationId,
          from: {
            id: socket.userId,
            type: socket.userType,
            name: socket.userData.name || socket.userData.profile?.name
          }
        });

        // Update partner status to busy
        io.emit('partner:statusChange', {
          partnerId,
          status: 'busy',
          isBusy: true
        });

        callback({
          success: true,
          data: {
            conversationId,
            conversation
          }
        });
      } catch (error) {
        console.error('Error starting conversation:', error);
        callback({
          success: false,
          message: 'Failed to start conversation'
        });
      }
    });

    // Accept conversation (partner accepting user request)
    socket.on('conversation:accept', async (data, callback) => {
      try {
        const { conversationId } = data;

        const conversation = await Conversation.findOneAndUpdate(
          { conversationId },
          { status: 'active' },
          { new: true }
        );

        // Notify all parties in the conversation
        io.to(conversationId).emit('conversation:accepted', {
          conversationId,
          conversation
        });

        callback({
          success: true,
          data: conversation
        });
      } catch (error) {
        console.error('Error accepting conversation:', error);
        callback({
          success: false,
          message: 'Failed to accept conversation'
        });
      }
    });

    // Send message
    socket.on('message:send', async (data, callback) => {
      try {
        const { conversationId, content, messageType = 'text', mediaUrl = null } = data;

        // Determine sender and receiver
        const conversation = await Conversation.findOne({ conversationId });
        
        if (!conversation) {
          return callback({
            success: false,
            message: 'Conversation not found'
          });
        }

        const isPartner = socket.userType === 'partner';
        const senderId = socket.userId;
        const senderModel = isPartner ? 'Partner' : 'User';
        const receiverId = isPartner ? conversation.userId : conversation.partnerId;
        const receiverModel = isPartner ? 'User' : 'Partner';

        // Create message
        const message = await Message.create({
          conversationId,
          senderId,
          senderModel,
          receiverId,
          receiverModel,
          messageType,
          content,
          mediaUrl,
          isDelivered: false,
          isRead: false
        });

        // Populate sender info
        await message.populate(senderModel === 'Partner' ? 'senderId' : 'senderId', 'name email profilePicture profile');

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

        // Send to conversation room (real-time delivery)
        io.to(conversationId).emit('message:new', {
          message,
          conversationId
        });

        // Check if receiver is online
        const receiverSocketId = onlineUsers.get(receiverId.toString());
        if (receiverSocketId) {
          // Mark as delivered
          message.isDelivered = true;
          message.deliveredAt = new Date();
          await message.save();

          io.to(conversationId).emit('message:delivered', {
            messageId: message._id,
            conversationId
          });
        }

        callback({
          success: true,
          data: message
        });
      } catch (error) {
        console.error('Error sending message:', error);
        callback({
          success: false,
          message: 'Failed to send message'
        });
      }
    });

    // Mark messages as read
    socket.on('message:read', async (data) => {
      try {
        const { conversationId, messageIds } = data;

        await Message.updateMany(
          {
            _id: { $in: messageIds },
            conversationId,
            receiverId: socket.userId
          },
          {
            isRead: true,
            readAt: new Date()
          }
        );

        // Update unread count
        const isPartner = socket.userType === 'partner';
        await Conversation.findOneAndUpdate(
          { conversationId },
          {
            [`unreadCount.${isPartner ? 'partner' : 'user'}`]: 0
          }
        );

        // Notify sender
        io.to(conversationId).emit('message:readStatus', {
          conversationId,
          messageIds,
          readBy: socket.userId
        });
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });

    // Typing indicator
    socket.on('typing:start', (data) => {
      const { conversationId } = data;
      socket.to(conversationId).emit('typing:indicator', {
        conversationId,
        userId: socket.userId,
        userType: socket.userType,
        isTyping: true
      });
    });

    socket.on('typing:stop', (data) => {
      const { conversationId } = data;
      socket.to(conversationId).emit('typing:indicator', {
        conversationId,
        userId: socket.userId,
        userType: socket.userType,
        isTyping: false
      });
    });

    // Get conversation messages
    socket.on('messages:get', async (data, callback) => {
      try {
        const { conversationId, page = 1, limit = 50 } = data;

        const messages = await Message.find({ conversationId })
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .populate('senderId', 'name email profilePicture profile')
          .lean();

        const totalMessages = await Message.countDocuments({ conversationId });

        callback({
          success: true,
          data: {
            messages: messages.reverse(),
            pagination: {
              page,
              limit,
              totalMessages,
              totalPages: Math.ceil(totalMessages / limit)
            }
          }
        });
      } catch (error) {
        console.error('Error fetching messages:', error);
        callback({
          success: false,
          message: 'Failed to fetch messages'
        });
      }
    });

    // Get user's conversations
    socket.on('conversations:get', async (callback) => {
      try {
        const isPartner = socket.userType === 'partner';
        const query = isPartner 
          ? { partnerId: socket.userId }
          : { userId: socket.userId };

        const conversations = await Conversation.find(query)
          .sort({ lastMessageAt: -1 })
          .populate('partnerId', 'name email profilePicture specialization rating')
          .populate('userId', 'email profile profileImage')
          .lean();

        // Add online status
        const conversationsWithStatus = conversations.map(conv => {
          const otherUserId = isPartner ? conv.userId._id : conv.partnerId._id;
          const isOnline = onlineUsers.has(otherUserId.toString());

          return {
            ...conv,
            otherUser: isPartner ? conv.userId : conv.partnerId,
            isOnline
          };
        });

        callback({
          success: true,
          data: conversationsWithStatus
        });
      } catch (error) {
        console.error('Error fetching conversations:', error);
        callback({
          success: false,
          message: 'Failed to fetch conversations'
        });
      }
    });

    // End conversation
    socket.on('conversation:end', async (data, callback) => {
      try {
        const { conversationId } = data;

        await Conversation.findOneAndUpdate(
          { conversationId },
          {
            status: 'ended',
            endedAt: new Date()
          }
        );

        // Remove from active conversations
        activeConversations.delete(conversationId);

        // Notify all parties
        io.to(conversationId).emit('conversation:ended', {
          conversationId
        });

        // Update partner status
        const conversation = await Conversation.findOne({ conversationId });
        if (conversation) {
          io.emit('partner:statusChange', {
            partnerId: conversation.partnerId,
            status: 'available',
            isBusy: false
          });
        }

        callback({
          success: true
        });
      } catch (error) {
        console.error('Error ending conversation:', error);
        callback({
          success: false,
          message: 'Failed to end conversation'
        });
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.userId} (${socket.userType})`);

      // Remove from online users
      onlineUsers.delete(socket.userId);
      userTypes.delete(socket.id);
      userIds.delete(socket.id);

      // Remove from active conversations
      for (const [convId, sockets] of activeConversations.entries()) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          activeConversations.delete(convId);
        }
      }

      // Emit offline status
      io.emit('user:offline', {
        userId: socket.userId,
        userType: socket.userType,
        online: false
      });

      // Update partner status if it's a partner
      if (socket.userType === 'partner') {
        io.emit('partner:statusChange', {
          partnerId: socket.userId,
          status: 'offline',
          isOnline: false,
          isBusy: false
        });
      }
    });
  });

  console.log('✅ Chat WebSocket initialized');
  return io;
};