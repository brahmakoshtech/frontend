import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Meditation from '../models/Meditation.js';
import { authenticate } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads/meditations');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for local file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const subDir = file.fieldname === 'video' ? 'videos' : 'images';
    const fullPath = path.join(uploadsDir, subDir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
    cb(null, fullPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'video') {
      if (file.mimetype.startsWith('video/')) {
        cb(null, true);
      } else {
        cb(new Error('Only video files are allowed for video field'), false);
      }
    } else if (file.fieldname === 'image') {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed for image field'), false);
      }
    } else {
      cb(new Error('Unexpected field'), false);
    }
  }
});

// GET /api/meditations - Get all meditations for authenticated client
router.get('/', authenticate, async (req, res) => {
  try {
    const meditations = await Meditation.find({ 
      clientId: req.user.userId,
      isActive: true 
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: meditations,
      count: meditations.length
    });
  } catch (error) {
    console.error('Error fetching meditations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch meditations',
      error: error.message
    });
  }
});

// GET /api/meditations/:id - Get single meditation
router.get('/:id', authenticate, async (req, res) => {
  try {
    const meditation = await Meditation.findOne({
      _id: req.params.id,
      clientId: req.user.userId,
      isActive: true
    });

    if (!meditation) {
      return res.status(404).json({
        success: false,
        message: 'Meditation not found'
      });
    }

    res.json({
      success: true,
      data: meditation
    });
  } catch (error) {
    console.error('Error fetching meditation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch meditation',
      error: error.message
    });
  }
});

// POST /api/meditations - Create new meditation
router.post('/', authenticate, upload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'image', maxCount: 1 }
]), async (req, res) => {
  try {
    const { name, description, link } = req.body;

    // Validation
    if (!name || !description) {
      return res.status(400).json({
        success: false,
        message: 'Name and description are required'
      });
    }

    const meditationData = {
      name: name.trim(),
      description: description.trim(),
      link: link ? link.trim() : '',
      clientId: req.user.userId
    };

    // Handle video upload - local storage
    if (req.files && req.files.video) {
      const videoFile = req.files.video[0];
      meditationData.videoUrl = `/uploads/meditations/videos/${videoFile.filename}`;
    }

    // Handle image upload - local storage
    if (req.files && req.files.image) {
      const imageFile = req.files.image[0];
      meditationData.imageUrl = `/uploads/meditations/images/${imageFile.filename}`;
    }

    const meditation = new Meditation(meditationData);
    await meditation.save();

    res.status(201).json({
      success: true,
      message: 'Meditation created successfully',
      data: meditation
    });
  } catch (error) {
    console.error('Error creating meditation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create meditation',
      error: error.message
    });
  }
});

// PUT /api/meditations/:id - Update meditation
router.put('/:id', authenticate, upload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'image', maxCount: 1 }
]), async (req, res) => {
  try {
    const { name, description, link } = req.body;

    const meditation = await Meditation.findOne({
      _id: req.params.id,
      clientId: req.user.userId,
      isActive: true
    });

    if (!meditation) {
      return res.status(404).json({
        success: false,
        message: 'Meditation not found'
      });
    }

    // Update basic fields
    if (name) meditation.name = name.trim();
    if (description) meditation.description = description.trim();
    if (link !== undefined) meditation.link = link.trim();

    // Handle video upload
    if (req.files && req.files.video) {
      // Delete old video file if exists
      if (meditation.videoUrl) {
        const oldVideoPath = path.join(__dirname, '..', meditation.videoUrl);
        if (fs.existsSync(oldVideoPath)) {
          fs.unlinkSync(oldVideoPath);
        }
      }

      const videoFile = req.files.video[0];
      meditation.videoUrl = `/uploads/meditations/videos/${videoFile.filename}`;
    }

    // Handle image upload
    if (req.files && req.files.image) {
      // Delete old image file if exists
      if (meditation.imageUrl) {
        const oldImagePath = path.join(__dirname, '..', meditation.imageUrl);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }

      const imageFile = req.files.image[0];
      meditation.imageUrl = `/uploads/meditations/images/${imageFile.filename}`;
    }

    await meditation.save();

    res.json({
      success: true,
      message: 'Meditation updated successfully',
      data: meditation
    });
  } catch (error) {
    console.error('Error updating meditation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update meditation',
      error: error.message
    });
  }
});

// DELETE /api/meditations/:id - Delete meditation (soft delete)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const meditation = await Meditation.findOne({
      _id: req.params.id,
      clientId: req.user.userId,
      isActive: true
    });

    if (!meditation) {
      return res.status(404).json({
        success: false,
        message: 'Meditation not found'
      });
    }

    // Soft delete
    meditation.isActive = false;
    await meditation.save();

    res.json({
      success: true,
      message: 'Meditation deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting meditation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete meditation',
      error: error.message
    });
  }
});

export default router;