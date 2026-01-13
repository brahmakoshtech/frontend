import express from 'express';
import BrandAsset from '../../models/BrandAsset.js';
import multer from 'multer';
import { uploadToS3, deleteFromS3 } from '../../utils/s3.js';
import { authenticate } from '../../middleware/auth.js';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

router.get('/', authenticate, async (req, res) => {
  try {
    const clientId = req.user?._id || req.user?.id || null;
    console.log('[Brand Assets GET]', {
      clientId: clientId?.toString(),
      userId: req.user?._id?.toString(),
      userIdAlt: req.user?.id,
      userRole: req.user?.role,
      userEmail: req.user?.email,
      hasUser: !!req.user,
      userType: req.user?.constructor?.name,
      userKeys: req.user ? Object.keys(req.user).slice(0, 10) : []
    });
    const brandAssets = await BrandAsset.find({ 
      clientId: clientId,
      isActive: true 
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: brandAssets,
      count: brandAssets.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch brand assets',
      error: error.message
    });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const { headingText, brandLogoName, webLinkUrl, socialLink } = req.body;
    const clientId = req.user?._id || req.user?.id || null;
    console.log('[Brand Assets POST]', {
      clientId: clientId?.toString(),
      userId: req.user?._id?.toString(),
      userIdAlt: req.user?.id,
      userRole: req.user?.role,
      userEmail: req.user?.email,
      hasUser: !!req.user
    });
    
    if (!clientId) {
      return res.status(401).json({
        success: false,
        message: 'Client ID not found. Please login again.'
      });
    }

    if (!headingText || !brandLogoName || !webLinkUrl || !socialLink) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    const newBrandAsset = new BrandAsset({
      headingText: headingText.trim(),
      brandLogoName: brandLogoName.trim(),
      webLinkUrl: webLinkUrl.trim(),
      socialLink: socialLink.trim(),
      clientId
    });

    const savedBrandAsset = await newBrandAsset.save();

    res.status(201).json({
      success: true,
      message: 'Brand asset created successfully',
      data: savedBrandAsset
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to create brand asset',
      error: error.message
    });
  }
});

router.put('/:id', authenticate, async (req, res) => {
  try {
    const { headingText, brandLogoName, webLinkUrl, socialLink } = req.body;
    const clientId = req.user?._id || req.user?.id || null;
    console.log('[Brand Assets PUT]', {
      clientId: clientId?.toString(),
      userId: req.user?._id?.toString(),
      userRole: req.user?.role
    });
    
    if (!clientId) {
      return res.status(401).json({
        success: false,
        message: 'Client ID not found. Please login again.'
      });
    }

    const brandAsset = await BrandAsset.findOneAndUpdate(
      { _id: req.params.id, clientId: clientId, isActive: true },
      { headingText, brandLogoName, webLinkUrl, socialLink },
      { new: true, runValidators: true }
    );

    if (!brandAsset) {
      return res.status(404).json({
        success: false,
        message: 'Brand asset not found'
      });
    }

    res.json({
      success: true,
      message: 'Brand asset updated successfully',
      data: brandAsset
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to update brand asset',
      error: error.message
    });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const clientId = req.user?._id || req.user?.id || null;
    console.log('[Brand Assets DELETE]', {
      clientId: clientId?.toString(),
      userId: req.user?._id?.toString(),
      userRole: req.user?.role
    });
    
    if (!clientId) {
      return res.status(401).json({
        success: false,
        message: 'Client ID not found. Please login again.'
      });
    }
    const brandAsset = await BrandAsset.findOne({
      _id: req.params.id,
      clientId: clientId,
      isActive: true
    });

    if (!brandAsset) {
      return res.status(404).json({
        success: false,
        message: 'Brand asset not found'
      });
    }

    brandAsset.isActive = false;
    await brandAsset.save();

    res.json({
      success: true,
      message: 'Brand asset deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete brand asset',
      error: error.message
    });
  }
});

// Upload image for brand asset
router.post('/:id/upload-image', authenticate, upload.single('brandLogoImage'), async (req, res) => {
  try {
    const clientId = req.user?._id || req.user?.id || null;
    console.log('[Brand Assets Upload Image]', {
      clientId: clientId?.toString(),
      userId: req.user?._id?.toString(),
      userRole: req.user?.role
    });
    
    if (!clientId) {
      return res.status(401).json({
        success: false,
        message: 'Client ID not found. Please login again.'
      });
    }
    const brandAsset = await BrandAsset.findOne({
      _id: req.params.id,
      clientId: clientId,
      isActive: true
    });

    if (!brandAsset) {
      return res.status(404).json({
        success: false,
        message: 'Brand asset not found'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    // Delete old image if exists
    if (brandAsset.brandLogoImage) {
      try {
        await deleteFromS3(brandAsset.brandLogoImage);
      } catch (error) {
        console.warn('Failed to delete old image:', error.message);
      }
    }

    // Upload new image to S3
    const imageUrl = await uploadToS3(req.file, 'brand-assets');

    // Update brand asset with new image URL
    brandAsset.brandLogoImage = imageUrl;
    const updatedBrandAsset = await brandAsset.save();

    res.json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        brandAsset: updatedBrandAsset,
        imageUrl: imageUrl
      }
    });
  } catch (error) {
    console.error('Error uploading brand asset image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload image',
      error: error.message
    });
  }
});

export default router;