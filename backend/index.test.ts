import request from 'supertest';
import app from './index.js';
import { createClient } from '@supabase/supabase-js';

// Mock the entire @supabase/supabase-js module
jest.mock('@supabase/supabase-js');

// Explicitly type the mock client
const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    eq: jest.fn(),
    order: jest.fn(),
    single: jest.fn(),
  })),
} as unknown as ReturnType<typeof createClient>;

// Mock the createClient function to return our mockSupabase object
(createClient as jest.Mock).mockReturnValue(mockSupabase);

describe('GET /api/transactions', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    // Re-mock createClient to return our mockSupabase
    (createClient as jest.Mock).mockReturnValue(mockSupabase);
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
    (mockSupabase.from('transactions').select as jest.Mock).mockResolvedValueOnce({
      data: [{ id: 'tx1', amount: 100, type: 'income' }],
      error: null,
    });

    const res = await request(app)
      .get('/api/transactions')
      .set('Authorization', 'Bearer valid-jwt-token');

    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toEqual([{ id: 'tx1', amount: 100, type: 'income' }]);
  });
});