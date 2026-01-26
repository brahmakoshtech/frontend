import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import SpiritualConfiguration from '../models/SpiritualConfiguration.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Create new spiritual configuration
const createConfiguration = async (req, res) => {
  try {
    const { title, duration, description, emotion, type, karmaPoints, chantingType, customChantingType } = req.body;
    
    // Get clientId based on user role
    let clientId;
    if (req.user.role === 'client') {
      clientId = req.user.clientId; // For client users
    } else if (req.user.role === 'user') {
      // For regular users, get clientId from their profile
      clientId = req.user.clientId?.clientId || req.user.tokenClientId;
    } else {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only clients and users can create configurations.'
      });
    }

    if (!clientId) {
      return res.status(400).json({
        success: false,
        message: 'Client ID not found. Please contact support.'
      });
    }

    const configuration = new SpiritualConfiguration({
      title,
      duration: duration || '15 minutes',
      description,
      emotion,
      type,
      karmaPoints: karmaPoints || 10,
      chantingType: chantingType || '',
      customChantingType: customChantingType || '',
      clientId
    });

    await configuration.save();

    res.status(201).json({
      success: true,
      message: 'Spiritual configuration created successfully',
      data: configuration
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get all configurations for a client
const getConfigurations = async (req, res) => {
  try {
    console.log('[Spiritual Config] User info:', {
      userId: req.user._id,
      role: req.user.role,
      clientId: req.user.clientId
    });
    
    // Get clientId based on user role
    let clientId;
    if (req.user.role === 'client') {
      clientId = req.user.clientId; // For client users
    } else if (req.user.role === 'user') {
      // For regular users, get clientId from their profile
      clientId = req.user.clientId?.clientId || req.user.tokenClientId;
    } else {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only clients and users can view configurations.'
      });
    }

    console.log('[Spiritual Config] Extracted clientId:', clientId);

    if (!clientId) {
      return res.status(400).json({
        success: false,
        message: 'Client ID not found. Please contact support.',
        debug: {
          role: req.user.role,
          userClientId: req.user.clientId,
          tokenClientId: req.user.tokenClientId
        }
      });
    }
    
    // Build query with optional type filter
    const query = {
      clientId,
      isDeleted: false
    };
    if (req.query.type) {
      query.type = req.query.type;
    }
    
    const configurations = await SpiritualConfiguration.find(query).sort({ createdAt: -1 });

    console.log('[Spiritual Config] Found configurations:', configurations.length);

    res.status(200).json({
      success: true,
      data: configurations,
      count: configurations.length
    });
  } catch (error) {
    console.error('[Spiritual Config] Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update configuration
const updateConfiguration = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, duration, description, emotion, karmaPoints, chantingType, customChantingType } = req.body;
    
    // Get clientId based on user role
    let clientId;
    if (req.user.role === 'client') {
      clientId = req.user.clientId; // For client users
    } else if (req.user.role === 'user') {
      // For regular users, get clientId from their profile
      clientId = req.user.clientId?.clientId || req.user.tokenClientId;
    } else {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only clients and users can update configurations.'
      });
    }

    if (!clientId) {
      return res.status(400).json({
        success: false,
        message: 'Client ID not found. Please contact support.'
      });
    }

    const configuration = await SpiritualConfiguration.findOneAndUpdate(
      { _id: id, clientId, isDeleted: false },
      { 
        title, 
        duration, 
        description, 
        emotion, 
        karmaPoints: karmaPoints || 10,
        chantingType: chantingType || '',
        customChantingType: customChantingType || ''
      },
      { new: true, runValidators: true }
    );

    if (!configuration) {
      return res.status(404).json({
        success: false,
        message: 'Configuration not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Configuration updated successfully',
      data: configuration
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Delete configuration (soft delete)
const deleteConfiguration = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get clientId based on user role
    let clientId;
    if (req.user.role === 'client') {
      clientId = req.user.clientId; // For client users
    } else if (req.user.role === 'user') {
      // For regular users, get clientId from their profile
      clientId = req.user.clientId?.clientId || req.user.tokenClientId;
    } else {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only clients and users can delete configurations.'
      });
    }

    if (!clientId) {
      return res.status(400).json({
        success: false,
        message: 'Client ID not found. Please contact support.'
      });
    }

    const configuration = await SpiritualConfiguration.findOneAndUpdate(
      { _id: id, clientId, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );

    if (!configuration) {
      return res.status(404).json({
        success: false,
        message: 'Configuration not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Configuration deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Toggle configuration status
const toggleConfiguration = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get clientId based on user role
    let clientId;
    if (req.user.role === 'client') {
      clientId = req.user.clientId; // For client users
    } else if (req.user.role === 'user') {
      // For regular users, get clientId from their profile
      clientId = req.user.clientId?.clientId || req.user.tokenClientId;
    } else {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only clients and users can toggle configurations.'
      });
    }

    if (!clientId) {
      return res.status(400).json({
        success: false,
        message: 'Client ID not found. Please contact support.'
      });
    }

    const configuration = await SpiritualConfiguration.findOne({
      _id: id, 
      clientId, 
      isDeleted: false
    });

    if (!configuration) {
      return res.status(404).json({
        success: false,
        message: 'Configuration not found'
      });
    }

    configuration.isActive = !configuration.isActive;
    await configuration.save();

    res.status(200).json({
      success: true,
      message: `Configuration ${configuration.isActive ? 'enabled' : 'disabled'} successfully`,
      data: {
        isActive: configuration.isActive
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get single configuration by ID
const getSingleConfiguration = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get clientId based on user role
    let clientId;
    if (req.user.role === 'client') {
      clientId = req.user.clientId; // For client users
    } else if (req.user.role === 'user') {
      // For regular users, get clientId from their profile
      clientId = req.user.clientId?.clientId || req.user.tokenClientId;
    } else {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only clients and users can view configurations.'
      });
    }

    if (!clientId) {
      return res.status(400).json({
        success: false,
        message: 'Client ID not found. Please contact support.'
      });
    }

    const configuration = await SpiritualConfiguration.findOne({
      _id: id,
      clientId,
      isDeleted: false
    });

    if (!configuration) {
      return res.status(404).json({
        success: false,
        message: 'Configuration not found'
      });
    }

    res.status(200).json({
      success: true,
      data: configuration
    });
  } catch (error) {
    console.error('[Spiritual Config] Get single error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Routes
router.post('/', createConfiguration);
router.get('/', getConfigurations);
router.get('/:id', getSingleConfiguration);
router.put('/:id', updateConfiguration);
router.delete('/:id', deleteConfiguration);
router.patch('/:id/toggle', toggleConfiguration);

export default router;