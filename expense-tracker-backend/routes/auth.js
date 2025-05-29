// routes/auth.js - Separate authentication routes
const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const User = require('../models/User');

// Alternative signup route (cleaner version)
router.post('/signup', async (req, res) => {
  try {
    const { username, email, password, birthdate, age, guardianEmail, isMinor } = req.body;
    
    // Basic validation
    if (!username || !email || !password || !birthdate || age === undefined || isMinor === undefined) {
      return res.status(400).json({ 
        message: 'All required fields must be provided',
        required: ['username', 'email', 'password', 'birthdate', 'age', 'isMinor']
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Password strength validation
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Check for existing user
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      birthdate,
      age,
      guardianEmail: isMinor ? guardianEmail : null,
      isMinor
    });

    // Return without password
    const { password: _, ...userResponse } = newUser.toJSON();

    res.status(201).json({ 
      message: 'User created successfully', 
      user: userResponse 
    });

  } catch (error) {
    console.error('Auth signup error:', error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ 
        message: 'Validation error',
        errors: error.errors.map(e => e.message)
      });
    }

    res.status(500).json({ message: 'Something went wrong during signup' });
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Return user without password
    const { password: _, ...userResponse } = user.toJSON();

    res.status(200).json({ 
      message: 'Login successful', 
      user: userResponse 
    });

  } catch (error) {
    console.error('Auth login error:', error);
    res.status(500).json({ message: 'Something went wrong during login' });
  }
});

// Get user profile
router.get('/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ 
      message: 'Profile retrieved successfully',
      user 
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Failed to retrieve profile' });
  }
});

// Update user profile
router.put('/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { username, guardianEmail } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update allowed fields
    const updateData = {};
    if (username) updateData.username = username;
    if (user.isMinor && guardianEmail) updateData.guardianEmail = guardianEmail;

    await user.update(updateData);

    // Return updated user without password
    const { password: _, ...userResponse } = user.toJSON();

    res.status(200).json({ 
      message: 'Profile updated successfully',
      user: userResponse 
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

module.exports = router;