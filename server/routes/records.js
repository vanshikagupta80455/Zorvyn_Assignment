const express = require('express');
const { getDb } = require('../db/database');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { validateRecord } = require('../middleware/validate');

const router = express.Router();

router.use(authenticate);

// GET /api/records — List with filtering, pagination, sorting
router.get('/', requireRole('analyst', 'admin'), (req, res) => {
  try {
    const db = getDb();
    const {
      page = 1,
      limit = 20,
      type,
      category,
      start_date,
      end_date,
      sort_by = 'date',
      sort_order = 'desc',
      search,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    let where = ['fr.deleted_at IS NULL'];
    const params = [];

    if (type) {
      where.push('fr.type = ?');
      params.push(type);
    }
    if (category) {
      where.push('fr.category = ?');
      params.push(category);
    }
    if (start_date) {
      where.push('fr.date >= ?');
      params.push(start_date);
    }
    if (end_date) {
      where.push('fr.date <= ?');
      params.push(end_date);
    }
    if (search) {
      where.push('(fr.description LIKE ? OR fr.category LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    const whereClause = where.join(' AND ');
    const validSortColumns = ['date', 'amount', 'category', 'type', 'created_at'];
    const sortCol = validSortColumns.includes(sort_by) ? sort_by : 'date';
    const sortDir = sort_order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const totalResult = db.get(
      `SELECT COUNT(*) as count FROM financial_records fr WHERE ${whereClause}`,
      ...params
    );
    const total = totalResult.count;

    const records = db.all(
      `SELECT fr.*, u.username as created_by_name
       FROM financial_records fr
       LEFT JOIN users u ON fr.created_by = u.id
       WHERE ${whereClause}
       ORDER BY fr.${sortCol} ${sortDir}
       LIMIT ? OFFSET ?`,
      ...params, limitNum, offset
    );

    // Get unique categories for filters
    const categories = db.all(
      'SELECT DISTINCT category FROM financial_records WHERE deleted_at IS NULL ORDER BY category'
    ).map((r) => r.category);

    res.json({
      success: true,
      data: records,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
      filters: { categories },
    });
  } catch (err) {
    console.error('Get records error:', err);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// GET /api/records/:id
router.get('/:id', requireRole('analyst', 'admin'), (req, res) => {
  try {
    const db = getDb();
    const record = db.get(
      `SELECT fr.*, u.username as created_by_name
       FROM financial_records fr
       LEFT JOIN users u ON fr.created_by = u.id
       WHERE fr.id = ? AND fr.deleted_at IS NULL`,
      parseInt(req.params.id)
    );

    if (!record) {
      return res.status(404).json({ success: false, error: 'Record not found.' });
    }

    res.json({ success: true, data: record });
  } catch (err) {
    console.error('Get record error:', err);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// POST /api/records
router.post('/', requireRole('admin'), validateRecord, (req, res) => {
  try {
    const { amount, type, category, description, date } = req.body;
    const db = getDb();

    const result = db.run(
      'INSERT INTO financial_records (amount, type, category, description, date, created_by) VALUES (?, ?, ?, ?, ?, ?)',
      amount, type, category.trim(), description?.trim() || null, date, req.user.id
    );

    const record = db.get(
      `SELECT fr.*, u.username as created_by_name
       FROM financial_records fr
       LEFT JOIN users u ON fr.created_by = u.id
       WHERE fr.id = ?`,
      result.lastInsertRowid
    );

    db.save();
    res.status(201).json({ success: true, data: record });
  } catch (err) {
    console.error('Create record error:', err);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// PUT /api/records/:id
router.put('/:id', requireRole('admin'), validateRecord, (req, res) => {
  try {
    const db = getDb();
    const recordId = parseInt(req.params.id);
    const existing = db.get(
      'SELECT id FROM financial_records WHERE id = ? AND deleted_at IS NULL',
      recordId
    );

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Record not found.' });
    }

    const { amount, type, category, description, date } = req.body;

    db.run(
      `UPDATE financial_records
       SET amount = ?, type = ?, category = ?, description = ?, date = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      amount, type, category.trim(), description?.trim() || null, date, recordId
    );

    const record = db.get(
      `SELECT fr.*, u.username as created_by_name
       FROM financial_records fr
       LEFT JOIN users u ON fr.created_by = u.id
       WHERE fr.id = ?`,
      recordId
    );

    db.save();
    res.json({ success: true, data: record });
  } catch (err) {
    console.error('Update record error:', err);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// DELETE /api/records/:id (soft delete)
router.delete('/:id', requireRole('admin'), (req, res) => {
  try {
    const db = getDb();
    const recordId = parseInt(req.params.id);
    const existing = db.get(
      'SELECT id FROM financial_records WHERE id = ? AND deleted_at IS NULL',
      recordId
    );

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Record not found.' });
    }

    db.run(
      'UPDATE financial_records SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?',
      recordId
    );

    db.save();
    res.json({ success: true, message: 'Record deleted successfully.' });
  } catch (err) {
    console.error('Delete record error:', err);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

module.exports = router;
