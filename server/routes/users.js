const express = require('express');
const bcrypt = require('bcryptjs');
const { getDb } = require('../db/database');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { validateUserUpdate } = require('../middleware/validate');

const router = express.Router();

// All user routes require admin
router.use(authenticate, requireRole('admin'));

// GET /api/users
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const users = db.all(
      'SELECT id, username, email, full_name, role, status, created_at, updated_at FROM users WHERE deleted_at IS NULL ORDER BY created_at DESC'
    );

    res.json({ success: true, data: users, total: users.length });
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// GET /api/users/:id
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const user = db.get(
      'SELECT id, username, email, full_name, role, status, created_at, updated_at FROM users WHERE id = ? AND deleted_at IS NULL',
      parseInt(req.params.id)
    );

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    res.json({ success: true, data: user });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// PUT /api/users/:id
router.put('/:id', validateUserUpdate, (req, res) => {
  try {
    const db = getDb();
    const userId = parseInt(req.params.id);

    const user = db.get(
      'SELECT * FROM users WHERE id = ? AND deleted_at IS NULL',
      userId
    );

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    // Prevent admin from demoting themselves
    if (userId === req.user.id && req.body.role && req.body.role !== 'admin') {
      return res.status(400).json({
        success: false,
        error: 'You cannot change your own role.',
      });
    }

    if (userId === req.user.id && req.body.status === 'inactive') {
      return res.status(400).json({
        success: false,
        error: 'You cannot deactivate your own account.',
      });
    }

    const updates = {};
    const allowed = ['email', 'full_name', 'role', 'status'];
    for (const field of allowed) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (req.body.password) {
      updates.password = bcrypt.hashSync(req.body.password, 10);
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid fields provided for update.',
      });
    }

    const setClause = Object.keys(updates)
      .map((k) => `${k} = ?`)
      .join(', ');
    const values = Object.values(updates);

    db.run(
      `UPDATE users SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      ...values, userId
    );

    const updated = db.get(
      'SELECT id, username, email, full_name, role, status, created_at, updated_at FROM users WHERE id = ?',
      userId
    );

    db.save();
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// DELETE /api/users/:id (soft delete)
router.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    const userId = parseInt(req.params.id);

    if (userId === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'You cannot delete your own account.',
      });
    }

    const user = db.get(
      'SELECT id FROM users WHERE id = ? AND deleted_at IS NULL',
      userId
    );

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    db.run(
      "UPDATE users SET deleted_at = CURRENT_TIMESTAMP, status = 'inactive' WHERE id = ?",
      userId
    );

    db.save();
    res.json({ success: true, message: 'User deleted successfully.' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

module.exports = router;
