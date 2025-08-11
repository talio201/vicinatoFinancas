import request from 'supertest';
import app from './index.js';
import { createClient } from '@supabase/supabase-js';
import { MockProxy, mockDeep, mockReset } from 'jest-mock-extended';

// Mock the entire @supabase/supabase-js module
jest.mock('@supabase/supabase-js');

const mockSupabase = createClient('test-url', 'test-key') as MockProxy<ReturnType<typeof createClient>>;

describe('GET /api/transactions', () => {
  beforeEach(() => {
    mockReset(mockSupabase); // Reset mocks before each test
    // Ensure createClient returns a deep mock for each test
    (createClient as jest.Mock).mockReturnValue(mockDeep());
  });

  it('should return 401 if no authorization header is provided', async () => {
    const res = await request(app).get('/api/transactions');
    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty('error', 'Token de autorização ausente ou mal formatado.');
  });

  it('should return 200 and a list of transactions if the user is authenticated', async () => {
    // Mock the auth.getUser() method
    (mockSupabase.auth.getUser as jest.Mock).mockResolvedValueOnce({
      data: { user: { id: 'test-user-id', email: 'test@example.com' } },
      error: null,
    });

    // Mock the from('transactions').select() method
    (mockSupabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValueOnce({
        data: [{ id: 'tx1', amount: 100, type: 'income' }],
        error: null,
      }),
    });

    const res = await request(app)
      .get('/api/transactions')
      .set('Authorization', 'Bearer valid-jwt-token');

    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toEqual([{ id: 'tx1', amount: 100, type: 'income' }]);
  });
});