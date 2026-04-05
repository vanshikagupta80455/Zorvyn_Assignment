const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'finance.db');

let db = null;
let SQL = null;

/**
 * Wrapper class that provides a cleaner API over sql.js
 */
class DatabaseWrapper {
  constructor(sqlDb) {
    this.db = sqlDb;
  }

  /** Run a SELECT and return all rows as objects */
  all(sql, ...params) {
    const stmt = this.db.prepare(sql);
    if (params.length > 0) stmt.bind(params);
    const rows = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
  }

  /** Run a SELECT and return the first row as an object, or undefined */
  get(sql, ...params) {
    const stmt = this.db.prepare(sql);
    if (params.length > 0) stmt.bind(params);
    let row = undefined;
    if (stmt.step()) {
      row = stmt.getAsObject();
    }
    stmt.free();
    return row;
  }

  /** Run an INSERT/UPDATE/DELETE statement and return { changes, lastInsertRowid } */
  run(sql, ...params) {
    this.db.run(sql, params);
    const changes = this.db.getRowsModified();
    const lastId = this.all('SELECT last_insert_rowid() as id');
    return {
      changes,
      lastInsertRowid: lastId.length > 0 ? lastId[0].id : 0,
    };
  }

  /** Execute raw SQL (for schema creation, etc.) */
  exec(sql) {
    this.db.run(sql);
  }

  /** Save the database to disk */
  save() {
    const data = this.db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

async function initializeDatabase() {
  SQL = await initSqlJs();

  // Load existing DB or create new one
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new DatabaseWrapper(new SQL.Database(fileBuffer));
    console.log('📂 Loaded existing database');
  } else {
    db = new DatabaseWrapper(new SQL.Database());
    console.log('🆕 Created new database');
  }

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'viewer',
      status TEXT NOT NULL DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      deleted_at DATETIME DEFAULT NULL
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS financial_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      amount REAL NOT NULL,
      type TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      date DATE NOT NULL,
      created_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      deleted_at DATETIME DEFAULT NULL,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  // Create indexes (ignore if exist)
  try { db.exec('CREATE INDEX idx_records_type ON financial_records(type)'); } catch(e) {}
  try { db.exec('CREATE INDEX idx_records_category ON financial_records(category)'); } catch(e) {}
  try { db.exec('CREATE INDEX idx_records_date ON financial_records(date)'); } catch(e) {}
  try { db.exec('CREATE INDEX idx_records_deleted ON financial_records(deleted_at)'); } catch(e) {}
  try { db.exec('CREATE INDEX idx_users_deleted ON users(deleted_at)'); } catch(e) {}

  // Seed data if empty
  const userCount = db.get('SELECT COUNT(*) as count FROM users');
  if (userCount.count === 0) {
    console.log('🌱 Seeding database...');

    const hashedAdmin = bcrypt.hashSync('admin123', 10);
    const hashedAnalyst = bcrypt.hashSync('analyst123', 10);
    const hashedViewer = bcrypt.hashSync('viewer123', 10);

    db.run(
      "INSERT INTO users (username, email, password, full_name, role, status) VALUES (?, ?, ?, ?, ?, 'active')",
      'admin', 'admin@easyfinance.com', hashedAdmin, 'Admin User', 'admin'
    );
    db.run(
      "INSERT INTO users (username, email, password, full_name, role, status) VALUES (?, ?, ?, ?, ?, 'active')",
      'analyst', 'analyst@easyfinance.com', hashedAnalyst, 'Sarah Chen', 'analyst'
    );
    db.run(
      "INSERT INTO users (username, email, password, full_name, role, status) VALUES (?, ?, ?, ?, ?, 'active')",
      'viewer', 'viewer@easyfinance.com', hashedViewer, 'Alex Morgan', 'viewer'
    );

    const seedRecords = [
      [5000.00, 'income', 'Salary', 'Monthly salary - January', '2025-01-15'],
      [5000.00, 'income', 'Salary', 'Monthly salary - February', '2025-02-15'],
      [5000.00, 'income', 'Salary', 'Monthly salary - March', '2025-03-15'],
      [5200.00, 'income', 'Salary', 'Monthly salary - April (raise)', '2025-04-15'],
      [5200.00, 'income', 'Salary', 'Monthly salary - May', '2025-05-15'],
      [5200.00, 'income', 'Salary', 'Monthly salary - June', '2025-06-15'],
      [1200.00, 'income', 'Freelance', 'Web development project', '2025-01-20'],
      [800.00, 'income', 'Freelance', 'UI design work', '2025-03-10'],
      [1500.00, 'income', 'Freelance', 'Mobile app consulting', '2025-05-22'],
      [350.00, 'income', 'Investment', 'Stock dividends Q1', '2025-03-31'],
      [420.00, 'income', 'Investment', 'Stock dividends Q2', '2025-06-30'],
      [1500.00, 'expense', 'Rent', 'Monthly rent - January', '2025-01-01'],
      [1500.00, 'expense', 'Rent', 'Monthly rent - February', '2025-02-01'],
      [1500.00, 'expense', 'Rent', 'Monthly rent - March', '2025-03-01'],
      [1500.00, 'expense', 'Rent', 'Monthly rent - April', '2025-04-01'],
      [1500.00, 'expense', 'Rent', 'Monthly rent - May', '2025-05-01'],
      [1500.00, 'expense', 'Rent', 'Monthly rent - June', '2025-06-01'],
      [450.00, 'expense', 'Groceries', 'Monthly groceries - January', '2025-01-05'],
      [380.00, 'expense', 'Groceries', 'Monthly groceries - February', '2025-02-05'],
      [520.00, 'expense', 'Groceries', 'Monthly groceries - March', '2025-03-05'],
      [410.00, 'expense', 'Groceries', 'Monthly groceries - April', '2025-04-05'],
      [390.00, 'expense', 'Groceries', 'Monthly groceries - May', '2025-05-05'],
      [480.00, 'expense', 'Groceries', 'Monthly groceries - June', '2025-06-05'],
      [120.00, 'expense', 'Utilities', 'Electric bill - January', '2025-01-18'],
      [135.00, 'expense', 'Utilities', 'Electric bill - March', '2025-03-18'],
      [110.00, 'expense', 'Utilities', 'Electric bill - May', '2025-05-18'],
      [60.00, 'expense', 'Entertainment', 'Netflix + Spotify', '2025-01-10'],
      [85.00, 'expense', 'Entertainment', 'Concert tickets', '2025-02-28'],
      [200.00, 'expense', 'Healthcare', 'Dental checkup', '2025-04-12'],
      [150.00, 'expense', 'Transportation', 'Gas + maintenance', '2025-03-20'],
      [95.00, 'expense', 'Transportation', 'Bus pass', '2025-05-01'],
    ];

    for (const record of seedRecords) {
      db.run(
        'INSERT INTO financial_records (amount, type, category, description, date, created_by) VALUES (?, ?, ?, ?, ?, 1)',
        ...record
      );
    }

    db.save();
    console.log('✅ Database seeded with 3 users and', seedRecords.length, 'financial records');
  }

  // Auto-save every 30 seconds
  setInterval(() => {
    if (db) db.save();
  }, 30000);

  return db;
}

function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

module.exports = { getDb, initializeDatabase };
