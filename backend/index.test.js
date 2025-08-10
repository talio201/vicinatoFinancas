import request from 'supertest';
import app from './index.js';

describe('GET /api/transactions', () => {
  it('should return 401 if no authorization header is provided', async () => {
    const res = await request(app).get('/api/transactions');
    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty('error', 'Token de autorização ausente ou mal formatado.');
  });

  it('should return 200 and a list of transactions if the user is authenticated', async () => {
    // This test requires a valid JWT token. You should replace this with a valid token.
    const token = 'your-jwt-token';
    const res = await request(app)
      .get('/api/transactions')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});