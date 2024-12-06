const request = require('supertest');
const app = require('../app');  // Ensure this path points to your Express app

describe('GET /movies', () => {
  it('should return all movies', async () => {
    const response = await request(app).get('/movies');
    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBeTruthy();
    expect(Array.isArray(response.body.data)).toBe(true);
  });
});

describe('GET /movies/data/:imdbID', () => {
  it('should return a single movie', async () => {
    const imdbID = 'tt1234567'; // Replace with a valid ID for testing
    const response = await request(app).get(`/movies/data/${imdbID}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBeTruthy();
    expect(response.body.data).toHaveProperty('title');
  });
});