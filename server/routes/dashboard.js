const express = require('express');
const { getDb } = require('../db/database');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

const router = express.Router();

router.use(authenticate);

// GET /api/dashboard/summary — All roles
router.get('/summary', (req, res) => {
  try {
    const db = getDb();

    const income = db.get(
      "SELECT COALESCE(SUM(amount), 0) as total FROM financial_records WHERE type = 'income' AND deleted_at IS NULL"
    ).total;

    const expenses = db.get(
      "SELECT COALESCE(SUM(amount), 0) as total FROM financial_records WHERE type = 'expense' AND deleted_at IS NULL"
    ).total;

    const recordCount = db.get(
      'SELECT COUNT(*) as count FROM financial_records WHERE deleted_at IS NULL'
    ).count;

    const userCount = db.get(
      'SELECT COUNT(*) as count FROM users WHERE deleted_at IS NULL'
    ).count;

    res.json({
      success: true,
      data: {
        total_income: income,
        total_expenses: expenses,
        net_balance: income - expenses,
        total_records: recordCount,
        total_users: userCount,
      },
    });
  } catch (err) {
    console.error('Dashboard summary error:', err);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// GET /api/dashboard/category-totals — Analyst + Admin
router.get('/category-totals', requireRole('analyst', 'admin'), (req, res) => {
  try {
    const db = getDb();

    const categories = db.all(
      `SELECT category, type,
              SUM(amount) as total,
              COUNT(*) as count
       FROM financial_records
       WHERE deleted_at IS NULL
       GROUP BY category, type
       ORDER BY total DESC`
    );

    const expenseCategories = db.all(
      `SELECT category, SUM(amount) as total, COUNT(*) as count
       FROM financial_records
       WHERE type = 'expense' AND deleted_at IS NULL
       GROUP BY category
       ORDER BY total DESC`
    );

    const incomeCategories = db.all(
      `SELECT category, SUM(amount) as total, COUNT(*) as count
       FROM financial_records
       WHERE type = 'income' AND deleted_at IS NULL
       GROUP BY category
       ORDER BY total DESC`
    );

    res.json({
      success: true,
      data: {
        all: categories,
        expenses: expenseCategories,
        income: incomeCategories,
      },
    });
  } catch (err) {
    console.error('Category totals error:', err);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// GET /api/dashboard/trends — Analyst + Admin
router.get('/trends', requireRole('analyst', 'admin'), (req, res) => {
  try {
    const db = getDb();

    const monthly = db.all(
      `SELECT
         strftime('%Y-%m', date) as month,
         type,
         SUM(amount) as total,
         COUNT(*) as count
       FROM financial_records
       WHERE deleted_at IS NULL
       GROUP BY month, type
       ORDER BY month ASC`
    );

    // Restructure into { month, income, expense } format
    const monthMap = {};
    monthly.forEach((row) => {
      if (!monthMap[row.month]) {
        monthMap[row.month] = { month: row.month, income: 0, expense: 0 };
      }
      monthMap[row.month][row.type] = row.total;
    });

    const trends = Object.values(monthMap).sort((a, b) => a.month.localeCompare(b.month));

    res.json({ success: true, data: trends });
  } catch (err) {
    console.error('Trends error:', err);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// GET /api/dashboard/recent — All roles
router.get('/recent', (req, res) => {
  try {
    const db = getDb();
    const limit = Math.min(20, Math.max(1, parseInt(req.query.limit) || 10));

    const recent = db.all(
      `SELECT fr.*, u.username as created_by_name
       FROM financial_records fr
       LEFT JOIN users u ON fr.created_by = u.id
       WHERE fr.deleted_at IS NULL
       ORDER BY fr.created_at DESC
       LIMIT ?`,
      limit
    );

    res.json({ success: true, data: recent });
  } catch (err) {
    console.error('Recent activity error:', err);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

module.exports = router;
