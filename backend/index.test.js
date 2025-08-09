import request from 'supertest';
import app from './index.js'; // Assuming your express app is exported from index.js

describe('GET /api/transactions', () => {
  it('should return 401 if no authorization header is provided', async () => {
    const res = await request(app).get('/api/transactions');
    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty('error', 'Authorization header is missing or invalid.');
  });
});
