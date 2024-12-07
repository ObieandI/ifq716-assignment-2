const jwt = require('jsonwebtoken');


// Token blacklist for invalidated tokens
const blacklistedTokens = new Set();

// Middleware to validate tokens
const authenticateCookie = (req, res, next) => {
    const token = req.cookies.authToken || req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Authentication token not provided. Access denied.',
        });
    }

    // Check if the token is blacklisted
    if (blacklistedTokens.has(token)) {
        console.log('Token has been invalidated.');
        return res.status(403).json({ success: false, message: 'Token has been invalidated.' });
    }

    try {
        // Verify and decode the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key');
        req.user = decoded; // Attach user info to the request
        next();
    } catch (error) {
        console.error('Token verification failed:', error.message);
        res.status(403).json({ success: false, message: 'Invalid or expired token. Access denied.' });
    }
};

module.exports = authenticateCookie;
