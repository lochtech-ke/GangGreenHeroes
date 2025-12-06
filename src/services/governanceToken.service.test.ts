import { describe, it, expect, beforeEach, vi } from 'vitest';
import { governanceTokenService } from './governanceToken.service';
import { supabase } from './supabase';
import type { GovernanceToken } from '../types/governance.types';

// Mock Supabase
vi.mock('./supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('GovernanceTokenService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getBalance', () => {
    it('should return user balance when record exists', async () => {
      const mockData = { balance: 100 };
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({ data: mockData, error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });

      const balance = await governanceTokenService.getBalance('user-123');

      expect(balance).toBe(100);
      expect(supabase.from).toHaveBeenCalledWith('governance_tokens');
      expect(mockSelect).toHaveBeenCalledWith('balance');
      expect(mockEq).toHaveBeenCalledWith('user_id', 'user-123');
    });

    it('should return 0 when no record exists', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });

      const balance = await governanceTokenService.getBalance('user-123');

      expect(balance).toBe(0);
    });

    it('should throw error on database failure', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST500', message: 'Database error' },
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });

      await expect(governanceTokenService.getBalance('user-123')).rejects.toThrow();
    });
  });

  describe('awardTokens', () => {
    it('should reject negative token amounts', async () => {
      const result = await governanceTokenService.awardTokens('user-123', -10, 'test');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_TOKEN_AMOUNT');
    });

    it('should reject zero token amounts', async () => {
      const result = await governanceTokenService.awardTokens('user-123', 0, 'test');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_TOKEN_AMOUNT');
    });

    it('should create new record for first-time user', async () => {
      const mockTokenRecord: GovernanceToken = {
        id: 'token-1',
        user_id: 'user-123',
        balance: 50,
        earned_total: 50,
        delegated_to: null,
        delegated_amount: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Mock getTokenRecord to return null (no existing record)
      vi.spyOn(governanceTokenService as any, 'getTokenRecord').mockResolvedValue(null);

      // Mock insert
      const mockInsert = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({ data: mockTokenRecord, error: null });

      (supabase.from as any).mockReturnValue({
        insert: mockInsert,
      });
      mockInsert.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        single: mockSingle,
      });

      // Mock recordTransaction
      vi.spyOn(governanceTokenService as any, 'recordTransaction').mockResolvedValue(undefined);

      const result = await governanceTokenService.awardTokens('user-123', 50, 'tree_planting');

      expect(result.success).toBe(true);
      expect(result.data?.balance).toBe(50);
      expect(result.data?.earned_total).toBe(50);
    });

    it('should update existing record for returning user', async () => {
      const existingRecord: GovernanceToken = {
        id: 'token-1',
        user_id: 'user-123',
        balance: 100,
        earned_total: 100,
        delegated_to: null,
        delegated_amount: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const updatedRecord: GovernanceToken = {
        ...existingRecord,
        balance: 150,
        earned_total: 150,
      };

      // Mock getTokenRecord to return existing record
      vi.spyOn(governanceTokenService as any, 'getTokenRecord').mockResolvedValue(existingRecord);

      // Mock update
      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({ data: updatedRecord, error: null });

      (supabase.from as any).mockReturnValue({
        update: mockUpdate,
      });
      mockUpdate.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        single: mockSingle,
      });

      // Mock recordTransaction
      vi.spyOn(governanceTokenService as any, 'recordTransaction').mockResolvedValue(undefined);

      const result = await governanceTokenService.awardTokens('user-123', 50, 'initiative_creation');

      expect(result.success).toBe(true);
      expect(result.data?.balance).toBe(150);
      expect(result.data?.earned_total).toBe(150);
    });
  });

  describe('delegateTokens', () => {
    it('should reject self-delegation', async () => {
      const result = await governanceTokenService.delegateTokens('user-123', 'user-123', 50);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('CANNOT_DELEGATE_TO_SELF');
    });

    it('should reject negative delegation amounts', async () => {
      const result = await governanceTokenService.delegateTokens('user-123', 'user-456', -10);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_TOKEN_AMOUNT');
    });

    it('should reject zero delegation amounts', async () => {
      const result = await governanceTokenService.delegateTokens('user-123', 'user-456', 0);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_TOKEN_AMOUNT');
    });

    it('should reject delegation with insufficient balance', async () => {
      const mockRecord: GovernanceToken = {
        id: 'token-1',
        user_id: 'user-123',
        balance: 30,
        earned_total: 30,
        delegated_to: null,
        delegated_amount: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      vi.spyOn(governanceTokenService as any, 'checkCircularDelegation').mockResolvedValue(false);
      vi.spyOn(governanceTokenService as any, 'getTokenRecord').mockResolvedValue(mockRecord);

      const result = await governanceTokenService.delegateTokens('user-123', 'user-456', 50);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INSUFFICIENT_TOKENS');
    });

    it('should reject circular delegation', async () => {
      const mockRecord: GovernanceToken = {
        id: 'token-1',
        user_id: 'user-123',
        balance: 100,
        earned_total: 100,
        delegated_to: null,
        delegated_amount: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      vi.spyOn(governanceTokenService as any, 'checkCircularDelegation').mockResolvedValue(true);
      vi.spyOn(governanceTokenService as any, 'getTokenRecord').mockResolvedValue(mockRecord);

      const result = await governanceTokenService.delegateTokens('user-123', 'user-456', 50);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('CIRCULAR_DELEGATION');
    });

    it('should successfully delegate tokens', async () => {
      const mockRecord: GovernanceToken = {
        id: 'token-1',
        user_id: 'user-123',
        balance: 100,
        earned_total: 100,
        delegated_to: null,
        delegated_amount: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const updatedRecord: GovernanceToken = {
        ...mockRecord,
        delegated_to: 'user-456',
        delegated_amount: 50,
      };

      vi.spyOn(governanceTokenService as any, 'checkCircularDelegation').mockResolvedValue(false);
      vi.spyOn(governanceTokenService as any, 'getTokenRecord').mockResolvedValue(mockRecord);

      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({ data: updatedRecord, error: null });

      (supabase.from as any).mockReturnValue({
        update: mockUpdate,
      });
      mockUpdate.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        single: mockSingle,
      });

      vi.spyOn(governanceTokenService as any, 'recordTransaction').mockResolvedValue(undefined);

      const result = await governanceTokenService.delegateTokens('user-123', 'user-456', 50);

      expect(result.success).toBe(true);
      expect(result.data?.delegated_to).toBe('user-456');
      expect(result.data?.delegated_amount).toBe(50);
    });
  });

  describe('revokeDelegation', () => {
    it('should reject revocation when no delegation exists', async () => {
      const mockRecord: GovernanceToken = {
        id: 'token-1',
        user_id: 'user-123',
        balance: 100,
        earned_total: 100,
        delegated_to: null,
        delegated_amount: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      vi.spyOn(governanceTokenService as any, 'getTokenRecord').mockResolvedValue(mockRecord);

      const result = await governanceTokenService.revokeDelegation('user-123');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('DELEGATION_NOT_FOUND');
    });

    it('should successfully revoke delegation', async () => {
      const mockRecord: GovernanceToken = {
        id: 'token-1',
        user_id: 'user-123',
        balance: 100,
        earned_total: 100,
        delegated_to: 'user-456',
        delegated_amount: 50,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const updatedRecord: GovernanceToken = {
        ...mockRecord,
        delegated_to: null,
        delegated_amount: 0,
      };

      vi.spyOn(governanceTokenService as any, 'getTokenRecord').mockResolvedValue(mockRecord);

      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({ data: updatedRecord, error: null });

      (supabase.from as any).mockReturnValue({
        update: mockUpdate,
      });
      mockUpdate.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        single: mockSingle,
      });

      vi.spyOn(governanceTokenService as any, 'recordTransaction').mockResolvedValue(undefined);

      const result = await governanceTokenService.revokeDelegation('user-123');

      expect(result.success).toBe(true);
      expect(result.data?.delegated_to).toBeNull();
      expect(result.data?.delegated_amount).toBe(0);
    });
  });

  describe('getVotingPower', () => {
    it('should return 0 for user with no tokens', async () => {
      vi.spyOn(governanceTokenService as any, 'getTokenRecord').mockResolvedValue(null);

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({ data: [], error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      const votingPower = await governanceTokenService.getVotingPower('user-123');

      expect(votingPower).toBe(0);
    });

    it('should return user balance when no delegation', async () => {
      const mockRecord: GovernanceToken = {
        id: 'token-1',
        user_id: 'user-123',
        balance: 100,
        earned_total: 100,
        delegated_to: null,
        delegated_amount: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      vi.spyOn(governanceTokenService as any, 'getTokenRecord').mockResolvedValue(mockRecord);

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({ data: [], error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      const votingPower = await governanceTokenService.getVotingPower('user-123');

      expect(votingPower).toBe(100);
    });

    it('should return 0 when user has delegated their tokens', async () => {
      const mockRecord: GovernanceToken = {
        id: 'token-1',
        user_id: 'user-123',
        balance: 100,
        earned_total: 100,
        delegated_to: 'user-456',
        delegated_amount: 100,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      vi.spyOn(governanceTokenService as any, 'getTokenRecord').mockResolvedValue(mockRecord);

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({ data: [], error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      const votingPower = await governanceTokenService.getVotingPower('user-123');

      expect(votingPower).toBe(0);
    });

    it('should include delegated power from others', async () => {
      const mockRecord: GovernanceToken = {
        id: 'token-1',
        user_id: 'user-123',
        balance: 100,
        earned_total: 100,
        delegated_to: null,
        delegated_amount: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      vi.spyOn(governanceTokenService as any, 'getTokenRecord').mockResolvedValue(mockRecord);

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({
        data: [
          { delegated_amount: 50 },
          { delegated_amount: 30 },
        ],
        error: null,
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      const votingPower = await governanceTokenService.getVotingPower('user-123');

      expect(votingPower).toBe(180); // 100 own + 50 + 30 delegated
    });
  });

  describe('checkCircularDelegation', () => {
    it('should detect direct circular delegation', async () => {
      const userARecord: GovernanceToken = {
        id: 'token-1',
        user_id: 'user-A',
        balance: 100,
        earned_total: 100,
        delegated_to: 'user-B',
        delegated_amount: 50,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const userBRecord: GovernanceToken = {
        id: 'token-2',
        user_id: 'user-B',
        balance: 100,
        earned_total: 100,
        delegated_to: 'user-A',
        delegated_amount: 50,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      vi.spyOn(governanceTokenService as any, 'getTokenRecord')
        .mockResolvedValueOnce(userBRecord);

      const hasCircular = await (governanceTokenService as any).checkCircularDelegation('user-A', 'user-B');

      expect(hasCircular).toBe(true);
    });

    it('should detect indirect circular delegation', async () => {
      const userBRecord: GovernanceToken = {
        id: 'token-2',
        user_id: 'user-B',
        balance: 100,
        earned_total: 100,
        delegated_to: 'user-C',
        delegated_amount: 50,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const userCRecord: GovernanceToken = {
        id: 'token-3',
        user_id: 'user-C',
        balance: 100,
        earned_total: 100,
        delegated_to: 'user-A',
        delegated_amount: 50,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      vi.spyOn(governanceTokenService as any, 'getTokenRecord')
        .mockResolvedValueOnce(userBRecord)
        .mockResolvedValueOnce(userCRecord);

      const hasCircular = await (governanceTokenService as any).checkCircularDelegation('user-A', 'user-B');

      expect(hasCircular).toBe(true);
    });

    it('should return false for valid delegation chain', async () => {
      const userBRecord: GovernanceToken = {
        id: 'token-2',
        user_id: 'user-B',
        balance: 100,
        earned_total: 100,
        delegated_to: null,
        delegated_amount: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      vi.spyOn(governanceTokenService as any, 'getTokenRecord')
        .mockResolvedValueOnce(userBRecord);

      const hasCircular = await (governanceTokenService as any).checkCircularDelegation('user-A', 'user-B');

      expect(hasCircular).toBe(false);
    });
  });
});
