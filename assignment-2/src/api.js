const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const knex = require('./node-knex/db');
const authenticateCookie = require('./middleware/auth');
const router = express.Router();

// Environment variables and defaults
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';
const TOKEN_EXPIRY = '1h'; // Token expiry duration

// In-memory token store
const validTokens = new Set();

const addValidToken = (token) => validTokens.add(token);
const removeValidToken = (token) => validTokens.delete(token);
const isTokenValid = (token) => validTokens.has(token);

// Middleware for Cross-Origin Resource Sharing (CORS)
router.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

// Routes
router.get('/status', (req, res) => {
    res.json({ success: true, message: 'API is up and running!' });
});

//Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    try {
        const user = await knex('users').where({ email }).first();
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        const isPasswordMatch = await bcrypt.compare(password, user.hash);
        if (!isPasswordMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        }

        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
        addValidToken(token);

        res.json({ success: true, message: 'Login successful.', token });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});

//Logout
router.post('/logout', authenticateCookie, logout);

//Validate Token
router.get('/validate-token', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, message: 'No token provided.' });
    }

    try {
        if (!isTokenValid(token)) {
            return res.status(403).json({ success: false, message: 'Token invalid or expired.' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        res.json({ success: true, message: 'Token is valid.', decoded });
    } catch (error) {
        console.error('Token validation error:', error.message);
        res.status(403).json({ success: false, message: 'Invalid token.' });
    }
});

module.exports = {
    router,
};