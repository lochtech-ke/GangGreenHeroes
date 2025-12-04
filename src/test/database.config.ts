import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { vi } from 'vitest';

// Test database configuration and utilities

export interface TestDatabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
}

/**
 * Get test database configuration from environment variables
 */
export function getTestDatabaseConfig(): TestDatabaseConfig {
  return {
    url: process.env.VITE_SUPABASE_TEST_URL || process.env.VITE_SUPABASE_URL || 'http://localhost:54321',
    anonKey: process.env.VITE_SUPABASE_TEST_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'test-anon-key',
    serviceRoleKey: process.env.SUPABASE_TEST_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

/**
 * Create a real Supabase client for integration tests
 */
export function createTestSupabaseClient(): SupabaseClient {
  const config = getTestDatabaseConfig();
  return createClient(config.url, config.anonKey);
}

/**
 * Create a mock Supabase client for unit tests
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
 * Test database helper class for managing test data
 */
export class TestDatabaseHelper {
  private client: SupabaseClient;
  private testDataIds: Set<string> = new Set();

  constructor(useMock: boolean = false) {
    this.client = useMock ? createMockSupabaseClient() as any : createTestSupabaseClient();
  }

  /**
   * Get the database client
   */
  getClient(): SupabaseClient {
    return this.client;
  }

  /**
   * Track test data for cleanup
   */
  trackTestData(id: string): void {
    this.testDataIds.add(id);
  }

  /**
   * Clean up all tracked test data
   */
  async cleanup(): Promise<void> {
    if (this.testDataIds.size === 0) return;

    try {
      // Clean up test data from various tables
      const tables = [
        'user_badges',
        'green_coin_transactions',
        'mission_participations',
        'community_members',
        'planted_trees',
        'verification_evidence',
        'chat_messages',
        'content_interactions',
        'user_learning_progress',
        'petition_signatures',
        'community_posts',
        'missions',
        'learning_modules',
        'communities',
        'user_profiles',
        'users',
      ];

      for (const table of tables) {
        if (this.testDataIds.size > 0) {
          await this.client
            .from(table)
            .delete()
            .in('id', Array.from(this.testDataIds));
        }
      }

      this.testDataIds.clear();
    } catch (error) {
      console.warn('Test cleanup failed:', error);
    }
  }

  /**
   * Create test user
   */
  async createTestUser(userData: any = {}): Promise<any> {
    const defaultUser = {
      email: `test-${Date.now()}@example.com`,
      password: 'testpassword123',
      user_type: 'individual',
      ...userData,
    };

    const { data, error } = await this.client.auth.signUp({
      email: defaultUser.email,
      password: defaultUser.password,
    });

    if (error) throw error;
    if (data.user) {
      this.trackTestData(data.user.id);
      
      // Create user profile
      await this.createTestUserProfile({
        user_id: data.user.id,
        user_type: defaultUser.user_type,
        ...userData,
      });
    }

    return data.user;
  }

  /**
   * Create test user profile
   */
  async createTestUserProfile(profileData: any = {}): Promise<any> {
    const defaultProfile = {
      display_name: `Test User ${Date.now()}`,
      age: 25,
      age_cohort: '25-34',
      user_type: 'individual',
      green_coins: 0,
      trees_planted: 0,
      curation_enabled: true,
      ...profileData,
    };

    const { data, error } = await this.client
      .from('test_user_profiles')
      .insert(defaultProfile)
      .select()
      .single();

    if (error) throw error;
    if (data) this.trackTestData(data.id);

    return data;
  }

  /**
   * Create test community
   */
  async createTestCommunity(communityData: any = {}): Promise<any> {
    const defaultCommunity = {
      name: `Test Community ${Date.now()}`,
      description: 'A test community',
      county: 'Test County',
      ...communityData,
    };

    const { data, error } = await this.client
      .from('communities')
      .insert(defaultCommunity)
      .select()
      .single();

    if (error) throw error;
    if (data) this.trackTestData(data.id);

    return data;
  }

  /**
   * Create test mission
   */
  async createTestMission(missionData: any = {}): Promise<any> {
    const defaultMission = {
      title: `Test Mission ${Date.now()}`,
      description: 'A test mission',
      mission_type: 'tree_planting',
      organizer_id: missionData.organizer_id || 'test-organizer-id',
      location_name: 'Test Location',
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      target_metric: 'trees',
      target_value: 100,
      green_coin_reward: 50,
      ...missionData,
    };

    const { data, error } = await this.client
      .from('test_missions')
      .insert(defaultMission)
      .select()
      .single();

    if (error) throw error;
    if (data) this.trackTestData(data.id);

    return data;
  }

  /**
   * Create test content item for curation testing
   */
  async createTestContentItem(contentData: any = {}): Promise<any> {
    const defaultContent = {
      type: 'initiative',
      title: `Test Content ${Date.now()}`,
      description: 'Test content for curation',
      relevance_score: 50.0,
      age_targeting: ['25-34'],
      ...contentData,
    };

    const { data, error } = await this.client
      .from('test_content_items')
      .insert(defaultContent)
      .select()
      .single();

    if (error) throw error;
    if (data) this.trackTestData(data.id);

    return data;
  }

  /**
   * Create test error log
   */
  async createTestErrorLog(errorData: any = {}): Promise<any> {
    const defaultError = {
      error_name: 'TestError',
      error_message: 'Test error message',
      error_code: 'TEST_001',
      severity: 'medium',
      context: { test: true },
      ...errorData,
    };

    const { data, error } = await this.client
      .from('test_error_logs')
      .insert(defaultError)
      .select()
      .single();

    if (error) throw error;
    if (data) this.trackTestData(data.id);

    return data;
  }

  /**
   * Create test GG coin transaction
   */
  async createTestGGCoinTransaction(transactionData: any = {}): Promise<any> {
    const defaultTransaction = {
      transaction_type: 'earn',
      amount: 10,
      source: 'test_mission',
      description: 'Test transaction',
      ...transactionData,
    };

    const { data, error } = await this.client
      .from('test_gg_coin_transactions')
      .insert(defaultTransaction)
      .select()
      .single();

    if (error) throw error;
    if (data) this.trackTestData(data.id);

    return data;
  }

  /**
   * Create test planted tree
   */
  async createTestPlantedTree(treeData: any = {}): Promise<any> {
    const defaultTree = {
      species: 'Test Tree Species',
      planted_date: new Date().toISOString().split('T')[0],
      location_name: 'Test Location',
      location_coordinates: 'POINT(0 0)',
      health_status: 'healthy',
      ...treeData,
    };

    const { data, error } = await this.client
      .from('test_planted_trees')
      .insert(defaultTree)
      .select()
      .single();

    if (error) throw error;
    if (data) this.trackTestData(data.id);

    return data;
  }

  /**
   * Setup test database schema (for integration tests)
   */
  async setupTestSchema(): Promise<void> {
    // This would run the SQL setup script in a real test environment
    // For now, we'll just verify the client is working
    try {
      await this.client.from('test_users').select('count').limit(1);
    } catch (error) {
      console.warn('Test schema setup not available (expected in unit tests):', error);
    }
  }

  /**
   * Reset test database to clean state
   */
  async resetTestDatabase(): Promise<void> {
    await this.cleanup();
    await this.setupTestSchema();
  }
}

/**
 * Setup test database for a test suite
 */
export function setupTestDatabase(useMock: boolean = false) {
  const helper = new TestDatabaseHelper(useMock);

  return {
    helper,
    client: helper.getClient(),
    cleanup: () => helper.cleanup(),
  };
}