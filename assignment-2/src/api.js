const express = require('express');
const knex = require('./node-knex/db'); // Ensure correct path to your Knex setup
const authenticate = require('../middleware/authenticateCookie'); // Middleware for authentication
const jwt = require('jsonwebtoken'); // For token validation
const router = express.Router();

// In-memory set to manage valid tokens (cleared on server restart)
const validTokens = new Set();

// Middleware to allow CORS (adjust for production)
router.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    next();
});

// Add a token to the validTokens set
const addValidToken = (token) => {
    validTokens.add(token);
};

// Clear all tokens on server restart
const clearValidTokens = () => {
    validTokens.clear();
};

// Clear tokens when the server starts
clearValidTokens();

// Example secure route requiring authentication
router.get('/secure-data', authenticate, (req, res) => {
    res.json({ success: true, message: 'Accessed secure data!', user: req.user });
});

// Token Validation Test Route
router.get('/validate-token', (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1]; // Extract token from Authorization header
    if (!token) {
        return res.status(401).json({ error: true, message: 'No token provided. Access denied.' });
    }

    try {
        // Check if the token is in the validTokens set
        if (!validTokens.has(token)) {
            return res.status(403).json({ error: true, message: 'Token invalid or expired. Access denied.' });
        }

        // Validate the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key'); // Replace 'your_secret_key' with your actual key
        res.json({ success: true, message: 'Token is valid.', decoded });
    } catch (error) {
        console.error('Token validation failed:', error.message);
        res.status(403).json({ error: true, message: 'Invalid token. Access denied.' });
    }
});

// Example status route to check API health
router.get('/status', (req, res) => {
    res.json({ success: true, message: 'API is up and running!' });
});

// Middleware for handling errors
router.use((err, req, res, next) => {
    console.error('Internal Server Error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
});

// Allow Cross-Origin Resource Sharing (CORS)
router.use((req, res, next) => {
    const allowedOrigins = ['*']; // Adjust to allow specific origins in production
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    next();
});

module.exports = router;

// Expose token management functions for external use (optional)
module.exports.addValidToken = addValidToken;
module.exports.clearValidTokens = clearValidTokens;
