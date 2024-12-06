require('dotenv').config();  // Make sure to install and require dotenv if you are using environment variables

module.exports = {
  client: 'mysql2',
  connection: {
    host: '127.0.0.1',
    user: 'root',
    password: 'J5K5UY+XpuD6VPt',
    database: 'movies'
  }
};


// module.exports = {
//   client: 'mysql2',
//   connection: {
//     host: process.env.DB_HOST,
//     user: process.env.DB_USER,
//     password: process.env.DB_PASSWORD,
//     database: process.env.DB_NAME
//   }
// };