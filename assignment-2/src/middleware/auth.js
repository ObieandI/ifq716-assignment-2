const jwt = require('jsonwebtoken');

const authenticateCookie = (req, res, next) => {
    const token = req.cookies.authToken || req.headers.authorization?.split(' ')[1];
    console.log('Token received:', token);

    if (!token) {
        console.log('No token provided.');
        return res.status(401).json({
            error: true,
            message: 'Authentication token not provided. Access denied.',
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key');
        console.log('Token is valid. Decoded user:', decoded);
        req.user = decoded;
        next();
    } catch (error) {
        console.error('Invalid or expired token:', error.message);
        return res.status(403).json({
            error: true,
            message: 'Invalid or expired token. Access denied.',
        });
    }
};

module.exports = authenticateCookie;
