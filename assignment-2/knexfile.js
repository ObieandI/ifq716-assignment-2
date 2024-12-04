const knex = require('knex')({
  client: 'mysql2',
  connection: {
    host: '127.0.0.1',
    user: 'root',
    password: 'J5K5UY+XpuD6VPt',
    database: 'world'
  }
});

knex.select('*').from('some_table')
  .then(data => {
    console.log(data);
  })
  .catch(err => {
    console.error(err);
  });