const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../db/database');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { validateUser } = require('../middleware/validate');

const router = express.Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required.',
      });
    }

    const db = getDb();
    const user = db.get(
      'SELECT * FROM users WHERE username = ? AND deleted_at IS NULL',
      username
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password.',
      });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({
        success: false,
        error: 'Account is inactive. Contact an administrator.',
      });
    }

    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password.',
      });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          status: user.status,
        },
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// POST /api/auth/register (Admin only)
router.post('/register', authenticate, requireRole('admin'), validateUser, (req, res) => {
  try {
    const { username, email, password, full_name, role } = req.body;
    const db = getDb();

    const existing = db.get(
      'SELECT id FROM users WHERE (username = ? OR email = ?) AND deleted_at IS NULL',
      username, email
    );

    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'Username or email already exists.',
      });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const result = db.run(
      'INSERT INTO users (username, email, password, full_name, role) VALUES (?, ?, ?, ?, ?)',
      username, email, hashedPassword, full_name, role || 'viewer'
    );

    const newUser = db.get(
      'SELECT id, username, email, full_name, role, status, created_at FROM users WHERE id = ?',
      result.lastInsertRowid
    );

    db.save();
    res.status(201).json({ success: true, data: newUser });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
  res.json({ success: true, data: req.user });
});

module.exports = router;
