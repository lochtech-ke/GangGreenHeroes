/**
 * Error Reporting System
 * Functionality for users to report errors with pre-filled details
 * Requirements: 3.5
 */

import { AppError, ErrorContext, ErrorSeverity } from '../types/errors';
import { sanitizeObject } from './errorLogging';

// ============================================================================
// Error Report Types
// ============================================================================

export interface ErrorReport {
  id: string;
  errorId: string;
  errorCode: string;
  errorMessage: string;
  userDescription?: string;
  reproductionSteps?: string[];
  expectedBehavior?: string;
  actualBehavior?: string;
  userAgent: string;
  url: string;
  timestamp: Date;
  severity: ErrorSeverity;
  context: ErrorReportContext;
  attachments?: ErrorReportAttachment[];
  contactInfo?: ErrorReportContact;
  status: ErrorReportStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ErrorReportContext {
  userId?: string;
  sessionId?: string;
  component?: string;
  action?: string;
  route?: string;
  breadcrumbs?: string[];
  systemInfo: SystemInfo;
  errorStack?: string;
  metadata?: Record<string, any>;
}

export interface SystemInfo {
  userAgent: string;
  platform: string;
  language: string;
  screenResolution: string;
  viewport: string;
  timezone: string;
  cookiesEnabled: boolean;
  localStorageEnabled: boolean;
  connectionType?: string;
}

export interface ErrorReportAttachment {
  id: string;
  type: 'screenshot' | 'log' | 'video' | 'file';
  name: string;
  size: number;
  mimeType: string;
  data?: string; // base64 encoded for small files
  url?: string; // for larger files stored separately
}

export interface ErrorReportContact {
  email?: string;
  name?: string;
  preferredContactMethod: 'email' | 'none';
  allowFollowUp: boolean;
}

export enum ErrorReportStatus {
  SUBMITTED = 'submitted',
  ACKNOWLEDGED = 'acknowledged',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export interface ErrorReportSubmission {
  userDescription?: string;
  reproductionSteps?: string[];
  expectedBehavior?: string;
  actualBehavior?: string;
  contactInfo?: ErrorReportContact;
  includeScreenshot?: boolean;
  includeLogs?: boolean;
}

// ============================================================================
// Error Report Service
// ============================================================================

export class ErrorReportService {
  private static instance: ErrorReportService;
  private reports: Map<string, ErrorReport> = new Map();
  private reportQueue: ErrorReport[] = [];
  private isSubmitting = false;

  static getInstance(): ErrorReportService {
    if (!ErrorReportService.instance) {
      ErrorReportService.instance = new ErrorReportService();
    }
    return ErrorReportService.instance;
  }

  /**
   * Generate error report from error and user input
   */
  async generateReport(
    error: AppError,
    submission: ErrorReportSubmission
  ): Promise<ErrorReport> {
    const reportId = this.generateReportId();
    const errorId = this.generateErrorId(error);
    
    const systemInfo = await this.collectSystemInfo();
    const context = this.buildReportContext(error, systemInfo);
    
    const report: ErrorReport = {
      id: reportId,
      errorId,
      errorCode: error.code,
      errorMessage: error.message,
      userDescription: submission.userDescription,
      reproductionSteps: submission.reproductionSteps,
      expectedBehavior: submission.expectedBehavior,
      actualBehavior: submission.actualBehavior,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: error.timestamp || new Date(),
      severity: error.severity,
      context,
      contactInfo: submission.contactInfo,
      status: ErrorReportStatus.SUBMITTED,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Add attachments if requested
    if (submission.includeScreenshot) {
      const screenshot = await this.captureScreenshot();
      if (screenshot) {
        report.attachments = [...(report.attachments || []), screenshot];
      }
    }

    if (submission.includeLogs) {
      const logs = await this.collectLogs();
      if (logs) {
        report.attachments = [...(report.attachments || []), logs];
      }
    }

    return report;
  }

  /**
   * Submit error report
   */
  async submitReport(report: ErrorReport): Promise<{ success: boolean; reportId: string }> {
    try {
      // Store report locally first
      this.reports.set(report.id, report);
      
      // Add to submission queue
      this.reportQueue.push(report);
      
      // Process queue
      await this.processReportQueue();
      
      return { success: true, reportId: report.id };
    } catch (error) {
      console.error('Failed to submit error report:', error);
      return { success: false, reportId: report.id };
    }
  }

  /**
   * Create pre-filled error report form data
   */
  createPrefilledReport(error: AppError): Partial<ErrorReportSubmission> {
    const prefilled: Partial<ErrorReportSubmission> = {
      actualBehavior: `Error occurred: ${error.message}`,
      reproductionSteps: this.generateReproductionSteps(error),
    };

    // Add context-specific information
    if (error.context?.action) {
      prefilled.reproductionSteps = [
        `1. Navigate to ${error.context.route || 'the current page'}`,
        `2. Attempt to ${error.context.action}`,
        `3. Error occurs: ${error.message}`,
        ...(prefilled.reproductionSteps || []),
      ];
    }

    return prefilled;
  }

  /**
   * Get report status
   */
  getReportStatus(reportId: string): ErrorReportStatus | null {
    const report = this.reports.get(reportId);
    return report?.status || null;
  }

  /**
   * Get user's submitted reports
   */
  getUserReports(userId?: string): ErrorReport[] {
    return Array.from(this.reports.values())
      .filter(report => !userId || report.context.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private generateReportId(): string {
    return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateErrorId(error: AppError): string {
    const hash = this.simpleHash(`${error.code}_${error.message}_${error.stack}`);
    return `error_${hash}`;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private async collectSystemInfo(): Promise<SystemInfo> {
    const systemInfo: SystemInfo = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screenResolution: `${screen.width}x${screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      cookiesEnabled: navigator.cookieEnabled,
      localStorageEnabled: this.isLocalStorageEnabled(),
    };

    // Add connection info if available
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      systemInfo.connectionType = connection?.effectiveType || connection?.type;
    }

    return systemInfo;
  }

  private isLocalStorageEnabled(): boolean {
    try {
      const test = 'localStorage_test';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  private buildReportContext(error: AppError, systemInfo: SystemInfo): ErrorReportContext {
    const context: ErrorReportContext = {
      userId: error.context?.userId,
      sessionId: error.context?.sessionId,
      component: error.context?.component,
      action: error.context?.action,
      route: error.context?.route,
      systemInfo,
      errorStack: error.stack,
      metadata: sanitizeObject(error.context?.metadata || {}),
    };

    // Add breadcrumbs if available
    if (error.context?.breadcrumbs) {
      context.breadcrumbs = error.context.breadcrumbs.map(
        breadcrumb => `[${breadcrumb.timestamp.toISOString()}] ${breadcrumb.category}: ${breadcrumb.message}`
      );
    }

    return context;
  }

  private generateReproductionSteps(error: AppError): string[] {
    const steps: string[] = [];

    if (error.context?.route) {
      steps.push(`1. Navigate to ${error.context.route}`);
    }

    if (error.context?.component) {
      steps.push(`2. Interact with ${error.context.component} component`);
    }

    if (error.context?.action) {
      steps.push(`3. Perform action: ${error.context.action}`);
    }

    steps.push(`4. Error occurs: ${error.message}`);

    return steps;
  }

  private async captureScreenshot(): Promise<ErrorReportAttachment | null> {
    try {
      // Use html2canvas if available, otherwise return null
      if (typeof window !== 'undefined' && 'html2canvas' in window) {
        const canvas = await (window as any).html2canvas(document.body, {
          height: window.innerHeight,
          width: window.innerWidth,
          useCORS: true,
        });
        
        const dataUrl = canvas.toDataURL('image/png');
        const base64Data = dataUrl.split(',')[1];
        
        return {
          id: `screenshot_${Date.now()}`,
          type: 'screenshot',
          name: 'error_screenshot.png',
          size: base64Data.length,
          mimeType: 'image/png',
          data: base64Data,
        };
      }
      
      return null;
    } catch (error) {
      console.warn('Failed to capture screenshot:', error);
      return null;
    }
  }

  private async collectLogs(): Promise<ErrorReportAttachment | null> {
    try {
      // Collect recent console logs if available
      const logs = this.getRecentLogs();
      
      if (logs.length === 0) {
        return null;
      }
      
      const logData = logs.join('\n');
      const base64Data = btoa(logData);
      
      return {
        id: `logs_${Date.now()}`,
        type: 'log',
        name: 'console_logs.txt',
        size: logData.length,
        mimeType: 'text/plain',
        data: base64Data,
      };
    } catch (error) {
      console.warn('Failed to collect logs:', error);
      return null;
    }
  }

  private getRecentLogs(): string[] {
    // This would integrate with a logging system that captures console logs
    // For now, return empty array as we don't have log capture implemented
    return [];
  }

  private async processReportQueue(): Promise<void> {
    if (this.isSubmitting || this.reportQueue.length === 0) {
      return;
    }

    this.isSubmitting = true;

    try {
      while (this.reportQueue.length > 0) {
        const report = this.reportQueue.shift()!;
        await this.sendReportToServer(report);
      }
    } catch (error) {
      console.error('Error processing report queue:', error);
    } finally {
      this.isSubmitting = false;
    }
  }

  private async sendReportToServer(report: ErrorReport): Promise<void> {
    try {
      // Sanitize report before sending
      const sanitizedReport = this.sanitizeReport(report);
      
      const response = await fetch('/api/error-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sanitizedReport),
      });

      if (!response.ok) {
        throw new Error(`Failed to submit report: ${response.statusText}`);
      }

      // Update report status
      report.status = ErrorReportStatus.ACKNOWLEDGED;
      report.updatedAt = new Date();
      this.reports.set(report.id, report);
      
    } catch (error) {
      console.error('Failed to send report to server:', error);
      // Keep report in queue for retry
      this.reportQueue.unshift(report);
      throw error;
    }
  }

  private sanitizeReport(report: ErrorReport): ErrorReport {
    const sanitized = { ...report };
    
    // Sanitize context metadata
    if (sanitized.context.metadata) {
      sanitized.context.metadata = sanitizeObject(sanitized.context.metadata);
    }
    
    // Remove sensitive system info
    sanitized.context.systemInfo = {
      ...sanitized.context.systemInfo,
      userAgent: this.sanitizeUserAgent(sanitized.context.systemInfo.userAgent),
    };
    
    return sanitized;
  }

  private sanitizeUserAgent(userAgent: string): string {
    // Remove potentially identifying information from user agent
    return userAgent
      .replace(/\([^)]*\)/g, '(...)') // Remove detailed system info in parentheses
      .replace(/Version\/[\d.]+/g, 'Version/X.X') // Remove specific version numbers
      .replace(/Chrome\/[\d.]+/g, 'Chrome/X.X')
      .replace(/Safari\/[\d.]+/g, 'Safari/X.X')
      .replace(/Firefox\/[\d.]+/g, 'Firefox/X.X');
  }
}

// ============================================================================
// Error Report Form Component Helper
// ============================================================================

export interface ErrorReportFormData {
  userDescription: string;
  reproductionSteps: string[];
  expectedBehavior: string;
  actualBehavior: string;
  contactEmail?: string;
  contactName?: string;
  allowFollowUp: boolean;
  includeScreenshot: boolean;
  includeLogs: boolean;
}

export class ErrorReportFormHelper {
  /**
   * Validate error report form data
   */
  static validateFormData(data: Partial<ErrorReportFormData>): {
    isValid: boolean;
    errors: Record<string, string>;
  } {
    const errors: Record<string, string> = {};

    // User description is required
    if (!data.userDescription || data.userDescription.trim().length === 0) {
      errors.userDescription = 'Please describe what happened';
    } else if (data.userDescription.length < 10) {
      errors.userDescription = 'Please provide more details (at least 10 characters)';
    } else if (data.userDescription.length > 1000) {
      errors.userDescription = 'Description is too long (maximum 1000 characters)';
    }

    // Validate email if provided
    if (data.contactEmail && !this.isValidEmail(data.contactEmail)) {
      errors.contactEmail = 'Please enter a valid email address';
    }

    // Validate reproduction steps
    if (data.reproductionSteps && data.reproductionSteps.length > 0) {
      const invalidSteps = data.reproductionSteps.filter(step => step.trim().length === 0);
      if (invalidSteps.length > 0) {
        errors.reproductionSteps = 'Please remove empty steps or provide details for all steps';
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Convert form data to submission format
   */
  static formDataToSubmission(data: ErrorReportFormData): ErrorReportSubmission {
    return {
      userDescription: data.userDescription,
      reproductionSteps: data.reproductionSteps.filter(step => step.trim().length > 0),
      expectedBehavior: data.expectedBehavior || undefined,
      actualBehavior: data.actualBehavior || undefined,
      contactInfo: data.contactEmail || data.contactName ? {
        email: data.contactEmail,
        name: data.contactName,
        preferredContactMethod: data.contactEmail ? 'email' : 'none',
        allowFollowUp: data.allowFollowUp,
      } : undefined,
      includeScreenshot: data.includeScreenshot,
      includeLogs: data.includeLogs,
    };
  }

  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const errorReportService = ErrorReportService.getInstance();