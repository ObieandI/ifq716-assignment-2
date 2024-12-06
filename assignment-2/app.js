require('dotenv').config(); // Load environment variables from .env file at the beginning

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const moviesRouter = require('./src/routes/movies');
const postersRouter = require('./src/routes/posters');
const usersRouter = require('./src/routes/users');
const knex = require('./src/node-knex/db');
const authenticateCookie = require('./src/middleware/auth'); // Include authentication middleware
const app = express();

const omdbApiKey = process.env.OMDB_API_KEY;
const rapidApiKey = process.env.RAPID_API_KEY;

function logOriginalUrl (req, res, next) {
  console.log('Request URL:', req.originalUrl)
  next()
}

app.set('views', path.join(__dirname, 'src', 'views')); // Update the path to reflect the new location
app.set('view engine', 'jade');


app.use(logger('dev')); // Logs every request to the console
app.use(express.json()); // Parses JSON bodies
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public'))); // Serves static files
app.use(logOriginalUrl);

// Attach DB instance to requests
app.use((req, res, next) => {
  req.db = knex; // Makes the knex instance available in the request object
  next();
});

// Setup API routers
app.use('/movies', moviesRouter); // Handle movie-related routes
app.use('/posters', postersRouter); // Handle poster-related routes
app.use('/users', usersRouter); // Handle user-related routes

app.get('/secure', authenticateCookie, (req, res) => {
  res.json({
    success: true,
    message: 'This is a secure endpoint!',
    user: req.user, // Example usage of user from authenticateCookie
  });
});

app.get("/knex", function (req, res, next) {
  req.db
    .raw("SELECT VERSION()")
    .then((version) => console.log(version[0][0]))
    .catch((err) => {
      console.log(err);
      throw err;
    });
  res.send("Version Logged successfully");
});


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use((err, req, res, next) => {
  console.error(err.stack); // Log the error for debugging
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// app.use(function(err, req, res, next) {
//     console.error(err.stack); // Logs stack trace of the error to the console
//     res.status(err.status || 500);
//     res.render('error', { error: err });
//   });

//   app.get('/test', function(req, res) {
//     res.send('Test route working');
//   });


module.exports = app;
