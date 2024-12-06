const express = require('express');
const jwt = require('jsonwebtoken'); // For token generation
const bcrypt = require('bcrypt'); // For password hashing
const router = express.Router();
const knex = require('../node-knex/db');

// Secret key for signing tokens
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key'; // Replace with a strong secret key in production

// Register route
// Serve the registration form on the same route as the POST endpoint
router.get('/register', (req, res) => {
  res.send(`
      <!DOCTYPE html>
      <html>
      <head>
          <title>Register</title>
      </head>
      <body>
          <h1>User Registration</h1>
          <form action="/users/register" method="POST">
              <label for="email">Email:</label>
              <input type="email" id="email" name="email" required />
              <br />
              <label for="password">Password:</label>
              <input type="password" id="password" name="password" required />
              <br />
              <button type="submit">Register</button>
          </form>
      </body>
      </html>
  `);
});

// Handle user registration (POST)
router.post('/register', async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  try {
      // Check if user already exists
      const existingUser = await knex('users').where({ email }).first();
      if (existingUser) {
          return res.status(409).json({ success: false, message: 'User already exists' });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert the user into the database
      await knex('users').insert({
          email,
          hash: hashedPassword,
      });

      res.status(201).json({ success: true, message: 'User created' });
  } catch (error) {
      console.error('Error registering user:', error);
      next(error); // Pass the error to the error-handling middleware
  }
});


router.get('/login', (req, res) => {
  res.send(`
      <!DOCTYPE html>
      <html>
      <head>
          <title>Log In</title>
      </head>
      <body>
          <h1>User Login</h1>
          <form action="/users/login" method="POST">
              <label for="email">Email:</label>
              <input type="email" id="email" name="email" required />
              <br />
              <label for="password">Password:</label>
              <input type="password" id="password" name="password" required />
              <br />
              <button type="submit">Log In</button>
          </form>
      </body>
      </html>
  `);
});

// Login route
router.post('/login', async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    // Fetch user from the database
    const user = await knex('users').where({ email }).first();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate a JWT token
    const token = jwt.sign(
      { email: user.email }, 
      process.env.JWT_SECRET || 'your_secret_key', 
      { expiresIn: '1h' }
    );

    // Send token as part of the response
    res.cookie('authToken', token, { httpOnly: true, secure: true }); // Optional: Save token as a cookie
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token, // Include token in the response
    });
  } catch (error) {
    console.error('Error during login:', error);
    next(error); // Pass to the error-handling middleware
  }
});

module.exports = router;
