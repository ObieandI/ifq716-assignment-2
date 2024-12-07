require('dotenv').config();

const fs = require('fs');
const https = require('https');
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const knex = require('./src/node-knex/db');
const authenticateCookie = require('./src/middleware/auth'); // Authentication middleware

// Import Routers
const moviesRouter = require('./src/routes/movies');
const postersRouter = require('./src/routes/posters');
const usersRouter = require('./src/routes/users');

const app = express();

// HTTPS options for self-signed certificate
const httpsOptions = {
  key: fs.readFileSync('selfsigned.key'),
  cert: fs.readFileSync('selfsigned.crt'),
};

// Set view engine
app.set('views', path.join(__dirname, 'src', 'views'));
app.set('view engine', 'jade');

// Middleware
app.use(logger('dev')); // Logs requests
app.use(express.json()); // Parses JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parses URL-encoded bodies
app.use(cookieParser()); // Parses cookies
app.use(express.static(path.join(__dirname, 'public'))); // Serves static files

// Attach Knex instance to requests
app.use((req, res, next) => {
  req.db = knex; 
  next();
});

// Routes
app.use('/posters', express.static(path.join(__dirname, 'res', 'posters'))); //Poster Add Routes
app.use('/movies', moviesRouter); // Movie-related routes
app.use('/posters', postersRouter); // Poster-related routes
app.use('/users', usersRouter); // User-related routes

// Root route
app.get('/', (req, res) => {
  res.send('Welcome to the HTTPS server!');
});

// Secure endpoint example
app.get('/secure', authenticateCookie, (req, res) => {
  res.json({
    success: true,
    message: 'This is a secure endpoint!',
    user: req.user, // Populated by `authenticateCookie`
  });
});

// Database test route
app.get('/knex', (req, res, next) => {
  req.db
    .raw('SELECT VERSION()')
    .then((version) => {
      console.log(version[0][0]);
      res.send('Version Logged successfully');
    })
    .catch((err) => {
      console.error('Database error:', err);
      next(err);
    });
});

// Catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Internal Server Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Start HTTPS server
https.createServer(httpsOptions, app).listen(443, () => {
  console.log('HTTPS server running on https://localhost:443');
});

module.exports = app;
