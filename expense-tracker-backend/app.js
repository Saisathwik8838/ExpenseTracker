// app.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sequelize = require('./database');
const User = require('./models/User');

const app = express();

// CORS Setup (allow all origins)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));
app.options('*', cors()); // Preflight handler

// Body parsers
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Sync Sequelize models to DB
sequelize.sync()
  .then(() => {
    console.log("✅ Database synced");
  })
  .catch(err => {
    console.error("❌ Failed to sync DB:", err);
  });

// Signup Route
app.post('/api/signup', async (req, res) => {
  try {
    const { username, email, password, birthdate, age, guardianEmail, isMinor } = req.body;

    // Validate required fields
    if (!username || !email || !password || !birthdate || age === undefined || isMinor === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate birthdate format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(birthdate)) {
      return res.status(400).json({ error: 'birthdate must be in YYYY-MM-DD format' });
    }

    // Create user record
    const newUser = await User.create({
      username,
      email,
      password,
      birthdate,
      age,
      guardianEmail: isMinor ? guardianEmail : null,
      isMinor
    });

    return res.status(201).json({ message: 'Signup successful', user: newUser });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ error: 'Signup failed', details: error.message });
  }
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
