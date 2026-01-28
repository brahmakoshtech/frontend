import jwt from 'jsonwebtoken';

export const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Auth error: No token provided or invalid format');
      return res.status(401).json({
        success: false,
        message: 'No token provided. Authorization denied.'
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      console.error('Auth error: Token is empty after split');
      return res.status(401).json({
        success: false,
        message: 'Invalid token format. Authorization denied.'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // CRITICAL: Validate decoded token has required fields
    if (!decoded.id) {
      console.error('Auth error: Token does not contain user ID', decoded);
      return res.status(401).json({
        success: false,
        message: 'Invalid token: User ID missing. Authorization denied.'
      });
    }

    if (!decoded.role) {
      console.error('Auth error: Token does not contain role', decoded);
      return res.status(401).json({
        success: false,
        message: 'Invalid token: Role missing. Authorization denied.'
      });
    }
    
    // Add user info to request
    req.user = {
      id: decoded.id,
      role: decoded.role,
      email: decoded.email
    };

    // Log successful authentication (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Auth successful:', {
        userId: req.user.id,
        role: req.user.role,
        email: req.user.email
      });
    }

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Authorization denied.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error during authentication',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};