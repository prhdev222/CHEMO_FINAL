const jwt = require('jsonwebtoken');

// 1. Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (token == null) {
    return res.sendStatus(401); // Unauthorized
  }

  jwt.verify(token, process.env.JWT_SECRET || 'YOUR_SECRET_KEY', (err, user) => {
    if (err) {
      return res.sendStatus(403); // Forbidden
    }
    req.user = user; // Attach user payload (e.g., { userId: 1, role: 'ADMIN' }) to request
    next();
  });
};

// 2. Middleware factory to authorize based on roles
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'You do not have permission to perform this action' });
    }
    next();
  };
};

module.exports = {
  authenticateToken,
  authorizeRoles,
}; 