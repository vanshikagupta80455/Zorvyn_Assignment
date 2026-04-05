require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { initializeDatabase } = require('./db/database');

async function startServer() {
  // Initialize database (async for sql.js)
  await initializeDatabase();

  const app = express();

  // Middleware
  app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
  app.use(express.json());

  // Request logging
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
    });
    next();
  });

  // Routes
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/users', require('./routes/users'));
  app.use('/api/records', require('./routes/records'));
  app.use('/api/dashboard', require('./routes/dashboard'));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ success: false, error: 'Endpoint not found.' });
  });

  // Global error handler
  app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  });

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`\n🚀 Finance Dashboard API running on http://localhost:${PORT}`);
    console.log(`📚 Health check: http://localhost:${PORT}/api/health\n`);
    console.log('Default credentials:');
    console.log('  Admin:   admin / admin123');
    console.log('  Analyst: analyst / analyst123');
    console.log('  Viewer:  viewer / viewer123\n');
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
