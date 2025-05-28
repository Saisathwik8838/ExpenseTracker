const express = require('express');
const app = express();
const PORT = 3000;

// Middleware to parse JSON
app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.send('Expense Tracker API is running');
});

// Signup route (dummy for now)
app.post('/api/signup', (req, res) => {
  const { name, email, birthdate, password, guardianEmail } = req.body;
  console.log("Received signup:", req.body);

  // TODO: Validate + Save to DB
  res.json({ message: 'Signup data received successfully!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
const sequelize = require('./database.js');
const User = require('../models/User');

sequelize.sync()
  .then(() => console.log('User table synced'))
  .catch(console.error);
