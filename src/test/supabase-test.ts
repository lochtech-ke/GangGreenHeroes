import { createClient } from '@supabase/supabase-js';
import { vi } from 'vitest';

// Test database configuration for Supabase

/**
 * Create a test Supabase client
 * This can be configured to use a test database or mock client
 */
export function createTestSupabaseClient() {
  // In a real implementation, you might want to use a separate test database
  // For now, we'll use environment variables that can be overridden in tests
  const supabaseUrl = process.env.VITE_SUPABASE_TEST_URL || process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
  const supabaseKey = process.env.VITE_SUPABASE_TEST_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'test-key';

  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Mock Supabase client for unit tests
 */
export function createMockSupabaseClient() {
  const mockResponse = {
    data: null,
    error: null,
    count: null,
    status: 200,
    statusText: 'OK',
  };

  const mockQueryBuilder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
    containedBy: vi.fn().mockReturnThis(),
    rangeGt: vi.fn().mockReturnThis(),
    rangeGte: vi.fn().mockReturnThis(),
    rangeLt: vi.fn().mockReturnThis(),
    rangeLte: vi.fn().mockReturnThis(),
    rangeAdjacent: vi.fn().mockReturnThis(),
    overlaps: vi.fn().mockReturnThis(),
    textSearch: vi.fn().mockReturnThis(),
    match: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    filter: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    abortSignal: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(mockResponse),
    maybeSingle: vi.fn().mockResolvedValue(mockResponse),
    then: vi.fn().mockResolvedValue(mockResponse),
  };

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
      signUp: vi.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      resetPasswordForEmail: vi.fn().mockResolvedValue({ data: {}, error: null }),
      updateUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
      refreshSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    },
    from: vi.fn(() => mockQueryBuilder),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ data: null, error: null }),
        download: vi.fn().mockResolvedValue({ data: null, error: null }),
        remove: vi.fn().mockResolvedValue({ data: null, error: null }),
        list: vi.fn().mockResolvedValue({ data: [], error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'http://example.com/file.jpg' } }),
        createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: 'http://example.com/signed' }, error: null }),
        createSignedUrls: vi.fn().mockResolvedValue({ data: [], error: null }),
      })),
    },
    rpc: vi.fn().mockResolvedValue(mockResponse),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
      unsubscribe: vi.fn(),
      send: vi.fn(),
    })),
    removeChannel: vi.fn(),
    removeAllChannels: vi.fn(),
    getChannels: vi.fn().mockReturnValue([]),
  };
}

/**
 * Setup test database helpers
 */
export class TestDatabaseHelper {
  private client: ReturnType<typeof createTestSupabaseClient>;

  constructor() {
    this.client = createTestSupabaseClient();
  }

  /**
   * Clean up test data after tests
   */
  async cleanup() {
    // In a real test environment, you might want to clean up specific test data
    // This is a placeholder for cleanup operations
    console.log('Test database cleanup completed');
  }

  /**
   * Seed test data
   */
  async seedTestData() {
    // Placeholder for seeding test data
    console.log('Test data seeded');
  }

  /**
   * Get the test client
   */
  getClient() {
    return this.client;
  }
}

/**
 * Test environment setup
 */
export function setupTestDatabase() {
  const helper = new TestDatabaseHelper();
  
  return {
    helper,
    cleanup: () => helper.cleanup(),
    seed: () => helper.seedTestData(),
  };
}