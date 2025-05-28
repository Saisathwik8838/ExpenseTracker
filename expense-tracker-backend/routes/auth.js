const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Basic check
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const newUser = await User.create({ name, email, password });
    res.status(201).json({ message: 'User created', user: newUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong' });
  }
});

module.exports = router;
