const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const knex = require('../node-knex/db');
const router = express.Router();

// Secret key for signing tokens
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

// Handle user registration (POST)
router.post('/register', async (req, res, next) => {
  console.log('POST /register called');
  const { email, password } = req.body;

  if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  try {
      const existingUser = await knex('users').where({ email }).first();
      if (existingUser) {
          return res.status(409).json({ success: false, message: 'User already exists.' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      await knex('users').insert({ email, hash: hashedPassword });

      res.status(201).json({ success: true, message: 'User created.' });
  } catch (error) {
      console.error('Error during registration:', error);
      next(error);
  }
});

// Login route
router.post('/login', async (req, res, next) => {
  console.log('POST /login called');
  const { email, password } = req.body;

  if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  try {
      const user = await knex('users').where({ email }).first();
      if (!user) {
          return res.status(404).json({ success: false, message: 'User not found.' });
      }

      const isPasswordValid = await bcrypt.compare(password, user.hash);
      if (!isPasswordValid) {
          return res.status(401).json({ success: false, message: 'Invalid password.' });
      }

      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
      res.cookie('authToken', token, { httpOnly: true, secure: true });
      res.status(200).json({ success: true, message: 'Login successful', token });
  } catch (error) {
      console.error('Error logging in:', error);
      next(error);
  }
});


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

// Serve the login form on the same route as the POST endpoint
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


module.exports = router;
