/**
 * Error Reporting Tests
 * Unit tests for error reporting functionality
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  ErrorReportService,
  ErrorReportFormHelper,
  ErrorReportFormData,
  ErrorReportStatus,
} from './errorReporting';
import {
  NetworkError,
  NetworkErrorCodes,
  ErrorSeverity,
} from '../types/errors';

// Mock fetch
global.fetch = vi.fn();

// Mock navigator
Object.defineProperty(window, 'navigator', {
  value: {
    userAgent: 'Mozilla/5.0 (Test Browser)',
    platform: 'Test Platform',
    language: 'en-US',
    cookieEnabled: true,
  },
  writable: true,
});

// Mock screen and window
Object.defineProperty(window, 'screen', {
  value: { width: 1920, height: 1080 },
  writable: true,
});

Object.defineProperty(window, 'innerWidth', {
  value: 1200,
  writable: true,
});

Object.defineProperty(window, 'innerHeight', {
  value: 800,
  writable: true,
});

// Mock Intl
Object.defineProperty(window, 'Intl', {
  value: {
    DateTimeFormat: () => ({
      resolvedOptions: () => ({ timeZone: 'America/New_York' }),
    }),
  },
  writable: true,
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('ErrorReportService', () => {
  let errorReportService: ErrorReportService;
  let testError: NetworkError;

  beforeEach(() => {
    errorReportService = ErrorReportService.getInstance();
    testError = new NetworkError(
      'Connection failed',
      NetworkErrorCodes.CONNECTION_FAILED,
      500,
      '/api/test'
    );
    
    // Reset mocks
    vi.clearAllMocks();
    (fetch as any).mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateReport', () => {
    it('should generate error report with basic information', async () => {
      const submission = {
        userDescription: 'The page failed to load',
        reproductionSteps: ['1. Navigate to page', '2. Click button'],
        expectedBehavior: 'Page should load',
        actualBehavior: 'Error occurred',
      };

      const report = await errorReportService.generateReport(testError, submission);

      expect(report.id).toBeDefined();
      expect(report.errorCode).toBe(NetworkErrorCodes.CONNECTION_FAILED);
      expect(report.errorMessage).toBe('Connection failed');
      expect(report.userDescription).toBe('The page failed to load');
      expect(report.reproductionSteps).toEqual(['1. Navigate to page', '2. Click button']);
      expect(report.expectedBehavior).toBe('Page should load');
      expect(report.actualBehavior).toBe('Error occurred');
      expect(report.severity).toBe(ErrorSeverity.MEDIUM);
      expect(report.status).toBe(ErrorReportStatus.SUBMITTED);
    });

    it('should include system information in context', async () => {
      const submission = {
        userDescription: 'Test error',
      };

      const report = await errorReportService.generateReport(testError, submission);

      expect(report.context.systemInfo).toBeDefined();
      expect(report.context.systemInfo.userAgent).toBe('Mozilla/5.0 (Test Browser)');
      expect(report.context.systemInfo.platform).toBe('Test Platform');
      expect(report.context.systemInfo.language).toBe('en-US');
      expect(report.context.systemInfo.screenResolution).toBe('1920x1080');
      expect(report.context.systemInfo.viewport).toBe('1200x800');
      expect(report.context.systemInfo.timezone).toBe('America/New_York');
      expect(report.context.systemInfo.cookiesEnabled).toBe(true);
      expect(report.context.systemInfo.localStorageEnabled).toBe(true);
    });

    it('should include contact information when provided', async () => {
      const submission = {
        userDescription: 'Test error',
        contactInfo: {
          email: 'test@example.com',
          name: 'Test User',
          preferredContactMethod: 'email' as const,
          allowFollowUp: true,
        },
      };

      const report = await errorReportService.generateReport(testError, submission);

      expect(report.contactInfo).toBeDefined();
      expect(report.contactInfo!.email).toBe('test@example.com');
      expect(report.contactInfo!.name).toBe('Test User');
      expect(report.contactInfo!.allowFollowUp).toBe(true);
    });
  });

  describe('submitReport', () => {
    it('should submit report successfully', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const submission = {
        userDescription: 'Test error',
      };

      const report = await errorReportService.generateReport(testError, submission);
      const result = await errorReportService.submitReport(report);

      expect(result.success).toBe(true);
      expect(result.reportId).toBe(report.id);
      expect(fetch).toHaveBeenCalledWith('/api/error-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining(report.errorCode),
      });
    });

    it('should handle submission failure', async () => {
      (fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const submission = {
        userDescription: 'Test error',
      };

      const report = await errorReportService.generateReport(testError, submission);
      const result = await errorReportService.submitReport(report);

      expect(result.success).toBe(false);
      expect(result.reportId).toBe(report.id);
    });
  });

  describe('createPrefilledReport', () => {
    it('should create prefilled report with error context', () => {
      const errorWithContext = new NetworkError(
        'Connection failed',
        NetworkErrorCodes.CONNECTION_FAILED,
        500,
        '/api/test'
      );
      errorWithContext.context = {
        route: '/dashboard',
        action: 'load data',
        component: 'DataTable',
      };

      const prefilled = errorReportService.createPrefilledReport(errorWithContext);

      expect(prefilled.actualBehavior).toContain('Error occurred: Connection failed');
      expect(prefilled.reproductionSteps).toBeDefined();
      expect(prefilled.reproductionSteps![0]).toContain('Navigate to /dashboard');
      expect(prefilled.reproductionSteps![1]).toContain('Attempt to load data');
    });

    it('should handle error without context', () => {
      const prefilled = errorReportService.createPrefilledReport(testError);

      expect(prefilled.actualBehavior).toContain('Error occurred: Connection failed');
      expect(prefilled.reproductionSteps).toBeDefined();
    });
  });

  describe('getReportStatus', () => {
    it('should return report status', async () => {
      const submission = {
        userDescription: 'Test error',
      };

      const report = await errorReportService.generateReport(testError, submission);
      await errorReportService.submitReport(report);

      const status = errorReportService.getReportStatus(report.id);
      expect(status).toBeDefined();
    });

    it('should return null for non-existent report', () => {
      const status = errorReportService.getReportStatus('non-existent-id');
      expect(status).toBeNull();
    });
  });

  describe('getUserReports', () => {
    it('should return user reports', async () => {
      const submission = {
        userDescription: 'Test error',
      };

      const report = await errorReportService.generateReport(testError, submission);
      await errorReportService.submitReport(report);

      const reports = errorReportService.getUserReports();
      expect(reports).toHaveLength(1);
      expect(reports[0].id).toBe(report.id);
    });

    it('should filter reports by user ID', async () => {
      const errorWithUser = new NetworkError(
        'Connection failed',
        NetworkErrorCodes.CONNECTION_FAILED
      );
      errorWithUser.context = { userId: 'user-123' };

      const submission = {
        userDescription: 'Test error',
      };

      const report = await errorReportService.generateReport(errorWithUser, submission);
      await errorReportService.submitReport(report);

      const userReports = errorReportService.getUserReports('user-123');
      const otherUserReports = errorReportService.getUserReports('user-456');

      expect(userReports).toHaveLength(1);
      expect(otherUserReports).toHaveLength(0);
    });
  });
});

describe('ErrorReportFormHelper', () => {
  describe('validateFormData', () => {
    it('should validate required user description', () => {
      const data: Partial<ErrorReportFormData> = {
        userDescription: '',
      };

      const result = ErrorReportFormHelper.validateFormData(data);

      expect(result.isValid).toBe(false);
      expect(result.errors.userDescription).toBeDefined();
    });

    it('should validate minimum description length', () => {
      const data: Partial<ErrorReportFormData> = {
        userDescription: 'short',
      };

      const result = ErrorReportFormHelper.validateFormData(data);

      expect(result.isValid).toBe(false);
      expect(result.errors.userDescription).toContain('at least 10 characters');
    });

    it('should validate maximum description length', () => {
      const data: Partial<ErrorReportFormData> = {
        userDescription: 'a'.repeat(1001),
      };

      const result = ErrorReportFormHelper.validateFormData(data);

      expect(result.isValid).toBe(false);
      expect(result.errors.userDescription).toContain('too long');
    });

    it('should validate email format', () => {
      const data: Partial<ErrorReportFormData> = {
        userDescription: 'This is a valid description with enough characters',
        contactEmail: 'invalid-email',
      };

      const result = ErrorReportFormHelper.validateFormData(data);

      expect(result.isValid).toBe(false);
      expect(result.errors.contactEmail).toContain('valid email address');
    });

    it('should validate reproduction steps', () => {
      const data: Partial<ErrorReportFormData> = {
        userDescription: 'This is a valid description with enough characters',
        reproductionSteps: ['Step 1', '', 'Step 3'],
      };

      const result = ErrorReportFormHelper.validateFormData(data);

      expect(result.isValid).toBe(false);
      expect(result.errors.reproductionSteps).toContain('empty steps');
    });

    it('should pass validation with valid data', () => {
      const data: Partial<ErrorReportFormData> = {
        userDescription: 'This is a valid description with enough characters',
        contactEmail: 'test@example.com',
        reproductionSteps: ['Step 1', 'Step 2'],
      };

      const result = ErrorReportFormHelper.validateFormData(data);

      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });
  });

  describe('formDataToSubmission', () => {
    it('should convert form data to submission format', () => {
      const formData: ErrorReportFormData = {
        userDescription: 'Test description',
        reproductionSteps: ['Step 1', '', 'Step 2'],
        expectedBehavior: 'Expected behavior',
        actualBehavior: 'Actual behavior',
        contactEmail: 'test@example.com',
        contactName: 'Test User',
        allowFollowUp: true,
        includeScreenshot: true,
        includeLogs: false,
      };

      const submission = ErrorReportFormHelper.formDataToSubmission(formData);

      expect(submission.userDescription).toBe('Test description');
      expect(submission.reproductionSteps).toEqual(['Step 1', 'Step 2']); // Empty steps filtered
      expect(submission.expectedBehavior).toBe('Expected behavior');
      expect(submission.actualBehavior).toBe('Actual behavior');
      expect(submission.contactInfo).toBeDefined();
      expect(submission.contactInfo!.email).toBe('test@example.com');
      expect(submission.contactInfo!.name).toBe('Test User');
      expect(submission.contactInfo!.allowFollowUp).toBe(true);
      expect(submission.includeScreenshot).toBe(true);
      expect(submission.includeLogs).toBe(false);
    });

    it('should handle missing contact information', () => {
      const formData: ErrorReportFormData = {
        userDescription: 'Test description',
        reproductionSteps: ['Step 1'],
        expectedBehavior: '',
        actualBehavior: '',
        contactEmail: '',
        contactName: '',
        allowFollowUp: false,
        includeScreenshot: false,
        includeLogs: false,
      };

      const submission = ErrorReportFormHelper.formDataToSubmission(formData);

      expect(submission.contactInfo).toBeUndefined();
      expect(submission.expectedBehavior).toBeUndefined();
      expect(submission.actualBehavior).toBeUndefined();
    });
  });
});

describe('Error Report Integration', () => {
  it('should handle complete error reporting flow', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    const errorReportService = ErrorReportService.getInstance();
    const error = new NetworkError(
      'Connection failed',
      NetworkErrorCodes.CONNECTION_FAILED
    );

    // Validate form data
    const formData: ErrorReportFormData = {
      userDescription: 'The application failed to load data from the server',
      reproductionSteps: ['Navigate to dashboard', 'Click refresh button'],
      expectedBehavior: 'Data should load',
      actualBehavior: 'Error message appeared',
      contactEmail: 'user@example.com',
      contactName: 'Test User',
      allowFollowUp: true,
      includeScreenshot: false,
      includeLogs: false,
    };

    const validation = ErrorReportFormHelper.validateFormData(formData);
    expect(validation.isValid).toBe(true);

    // Convert to submission
    const submission = ErrorReportFormHelper.formDataToSubmission(formData);

    // Generate report
    const report = await errorReportService.generateReport(error, submission);
    expect(report).toBeDefined();

    // Submit report
    const result = await errorReportService.submitReport(report);
    expect(result.success).toBe(true);

    // Check report status
    const status = errorReportService.getReportStatus(result.reportId);
    expect(status).toBeDefined();
  });
});