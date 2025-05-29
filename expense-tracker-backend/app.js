// app.js - Main application entry point
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const sequelize = require('./database');
const User = require('./models/User');
const authRoutes = require('./routes/auth');

const app = express();

// CORS Setup (allow all origins for development)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.options('*', cors()); // Preflight handler

// Body parsers
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Test route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Expense Tracker API is running!',
    version: '1.0.0',
    status: 'OK'
  });
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    database: 'connected',
    timestamp: new Date().toISOString()
  });
});

// Use auth routes
app.use('/api/auth', authRoutes);

// Main signup route (keeping your original structure)
app.post('/api/signup', async (req, res) => {
  // DEBUG: Log all incoming requests
  console.log('🔍 Signup request received:', {
    body: req.body,
    headers: req.headers,
    method: req.method,
    url: req.url
  });

  try {
    const { username, email, password, birthdate, age, guardianEmail, isMinor } = req.body;

    // Validate required fields
    console.log('🔍 Extracted data:', { username, email, password: password ? '***' : undefined, birthdate, age, guardianEmail, isMinor });
    
    if (!username || !email || !password || !birthdate || age === undefined || isMinor === undefined) {
      console.log('❌ Missing required fields:', {
        username: !!username,
        email: !!email, 
        password: !!password,
        birthdate: !!birthdate,
        age: age !== undefined,
        isMinor: isMinor !== undefined
      });
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['username', 'email', 'password', 'birthdate', 'age', 'isMinor'],
        received: { username: !!username, email: !!email, password: !!password, birthdate: !!birthdate, age: age !== undefined, isMinor: isMinor !== undefined }
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate birthdate format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(birthdate)) {
      return res.status(400).json({ error: 'birthdate must be in YYYY-MM-DD format' });
    }

    // Validate age consistency
    const birthYear = new Date(birthdate).getFullYear();
    const currentYear = new Date().getFullYear();
    const calculatedAge = currentYear - birthYear;
    
    if (Math.abs(calculatedAge - age) > 1) {
      return res.status(400).json({ error: 'Age does not match birthdate' });
    }

    // Check if minor status is correct
    const actuallyMinor = age < 18;
    if (isMinor !== actuallyMinor) {
      return res.status(400).json({ 
        error: `Minor status incorrect. User is ${actuallyMinor ? 'a minor' : 'not a minor'} based on age` 
      });
    }

    // Validate guardian email for minors
    if (isMinor && !guardianEmail) {
      return res.status(400).json({ error: 'Guardian email is required for minors' });
    }

    if (guardianEmail && !emailRegex.test(guardianEmail)) {
      return res.status(400).json({ error: 'Invalid guardian email format' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    // Hash password before storing
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user record
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      birthdate,
      age,
      guardianEmail: isMinor ? guardianEmail : null,
      isMinor
    });

    // Return user data without password
    const { password: _, ...userWithoutPassword } = newUser.toJSON();

    return res.status(201).json({ 
      message: 'Signup successful', 
      user: userWithoutPassword 
    });

  } catch (error) {
    console.error('❌ Signup error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      sql: error.sql || 'No SQL',
      original: error.original || 'No original error'
    });
    
    // Handle Sequelize validation errors
    if (error.name === 'SequelizeValidationError') {
      console.log('❌ Validation errors:', error.errors.map(e => ({ field: e.path, message: e.message })));
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors.map(e => ({ field: e.path, message: e.message }))
      });
    }
    
    // Handle Sequelize unique constraint errors
    if (error.name === 'SequelizeUniqueConstraintError') {
      console.log('❌ Unique constraint error:', error.errors[0]);
      return res.status(409).json({ 
        error: 'User already exists', 
        field: error.errors[0].path 
      });
    }

    // Handle database connection errors
    if (error.name === 'SequelizeConnectionError') {
      console.log('❌ Database connection error');
      return res.status(503).json({ 
        error: 'Database connection failed', 
        message: 'Please check database connection' 
      });
    }

    return res.status(500).json({ 
      error: 'Signup failed', 
      message: 'Internal server error',
      details: error.message
    });
  }
});

// Login route
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Compare password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user.toJSON();

    return res.status(200).json({ 
      message: 'Login successful', 
      user: userWithoutPassword 
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ 
      error: 'Login failed', 
      message: 'Internal server error' 
    });
  }
});

// Get all users (for admin/testing purposes)
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] } // Exclude passwords from response
    });
    
    res.json({ 
      message: 'Users retrieved successfully',
      count: users.length,
      users 
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to retrieve users' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl 
  });
});

// Sync Sequelize models to DB and start server
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');
    
    // Sync models
    await sequelize.sync({ alter: true }); // Use alter for development
    console.log('✅ Database synced');
    
    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 API available at http://localhost:${PORT}`);
      console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;