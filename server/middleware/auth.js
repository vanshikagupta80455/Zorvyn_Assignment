const jwt = require('jsonwebtoken');
const { getDb } = require('../db/database');

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Access denied. No token provided.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const db = getDb();
    const user = db.get(
      'SELECT id, username, email, full_name, role, status FROM users WHERE id = ? AND deleted_at IS NULL',
      decoded.id
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found or has been deleted.',
      });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({
        success: false,
        error: 'Account is inactive. Contact an administrator.',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, error: 'Token has expired.' });
    }
    return res.status(401).json({ success: false, error: 'Invalid token.' });
  }
}

module.exports = { authenticate };
