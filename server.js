require('dotenv').config({ override: true });
const express = require('express');
const cors = require('cors');
const { pool } = require('./utils/db');
const initDb = require('./init-db');

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION:', reason);
});

const app = express();
const PORT = process.env.PORT || 5000;
const path = require('path');

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname)));

// Serve index.html on root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve other HTML pages
app.get('/dashboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.get('/admin.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));

// Database Connection
pool.query('SELECT NOW()')
  .then(async () => {
    console.log('PostgreSQL (Neon) connected');
    // Initialize database tables
    await initDb();
  })
  .catch(err => console.error('DB Connection error:', err));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
