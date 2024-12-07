const knex = require('../src/node-knex/db'); // Import knex for mocking
jest.mock('../src/node-knex/db'); // Mock the database module

describe('GET /movies', () => {
  it('should return all movies', async () => {
    knex.mockReturnValue([
      { title: 'Movie 1', imdbID: 'tt1234567' },
      { title: 'Movie 2', imdbID: 'tt2345678' },
    ]);
    
    const response = await request(app).get('/movies');
    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBeTruthy();
    expect(Array.isArray(response.body.data)).toBe(true);
  });
});