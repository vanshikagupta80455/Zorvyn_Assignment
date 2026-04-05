/**
 * Validation middleware for request bodies.
 */

function validateRecord(req, res, next) {
  const { amount, type, category, date } = req.body;
  const errors = [];

  if (amount === undefined || amount === null) {
    errors.push('Amount is required.');
  } else if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
    errors.push('Amount must be a positive number.');
  }

  if (!type) {
    errors.push('Type is required.');
  } else if (!['income', 'expense'].includes(type)) {
    errors.push('Type must be "income" or "expense".');
  }

  if (!category || typeof category !== 'string' || category.trim().length === 0) {
    errors.push('Category is required.');
  } else if (category.trim().length > 50) {
    errors.push('Category must be 50 characters or less.');
  }

  if (!date) {
    errors.push('Date is required.');
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    errors.push('Date must be in YYYY-MM-DD format.');
  } else {
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) {
      errors.push('Date is not a valid date.');
    }
  }

  if (req.body.description && typeof req.body.description === 'string' && req.body.description.length > 500) {
    errors.push('Description must be 500 characters or less.');
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  next();
}

function validateUser(req, res, next) {
  const { username, email, password, full_name } = req.body;
  const errors = [];

  if (!username || typeof username !== 'string' || username.trim().length < 3) {
    errors.push('Username is required and must be at least 3 characters.');
  } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    errors.push('Username can only contain letters, numbers, and underscores.');
  }

  if (!email || typeof email !== 'string') {
    errors.push('Email is required.');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Email must be a valid email address.');
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    errors.push('Password is required and must be at least 6 characters.');
  }

  if (!full_name || typeof full_name !== 'string' || full_name.trim().length < 2) {
    errors.push('Full name is required and must be at least 2 characters.');
  }

  if (req.body.role && !['viewer', 'analyst', 'admin'].includes(req.body.role)) {
    errors.push('Role must be "viewer", "analyst", or "admin".');
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  next();
}

function validateUserUpdate(req, res, next) {
  const errors = [];

  if (req.body.role && !['viewer', 'analyst', 'admin'].includes(req.body.role)) {
    errors.push('Role must be "viewer", "analyst", or "admin".');
  }

  if (req.body.status && !['active', 'inactive'].includes(req.body.status)) {
    errors.push('Status must be "active" or "inactive".');
  }

  if (req.body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.body.email)) {
    errors.push('Email must be a valid email address.');
  }

  if (req.body.full_name && req.body.full_name.trim().length < 2) {
    errors.push('Full name must be at least 2 characters.');
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  next();
}

module.exports = { validateRecord, validateUser, validateUserUpdate };
