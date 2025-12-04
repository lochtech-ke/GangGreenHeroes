/**
 * Error Types
 * Type definitions for error handling and debugging system
 */

import { DateRange } from './socialFeed.types';

// ============================================================================
// Core Error Types
// ============================================================================

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  route?: string;
  ageCohort?: string;
  metadata?: Record<string, any>;
  timestamp?: Date;
  breadcrumbs?: Breadcrumb[];
  userAgent?: string;
  sessionId?: string;
  requestId?: string;
}

export interface Breadcrumb {
  timestamp: Date;
  category: string;
  message: string;
  level: 'info' | 'warning' | 'error';
  data?: Record<string, any>;
}

// ============================================================================
// Structured Error Classes
// ============================================================================

export abstract class AppError extends Error {
  public readonly code: string;
  public readonly severity: ErrorSeverity;
  public readonly context?: ErrorContext;
  public readonly recoverable: boolean;
  public readonly timestamp: Date;

  constructor(
    message: string,
    code: string,
    severity: ErrorSeverity,
    context?: ErrorContext,
    recoverable: boolean = false
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.severity = severity;
    this.context = context;
    this.recoverable = recoverable;
    this.timestamp = new Date();

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      severity: this.severity,
      context: this.context,
      recoverable: this.recoverable,
      timestamp: this.timestamp,
      stack: this.stack,
    };
  }
}

// ============================================================================
// Domain-Specific Error Classes
// ============================================================================

export class NetworkError extends AppError {
  public readonly statusCode?: number;
  public readonly endpoint?: string;
  public readonly method?: string;

  constructor(
    message: string,
    code: string,
    statusCode?: number,
    endpoint?: string,
    method?: string,
    context?: ErrorContext
  ) {
    super(message, code, ErrorSeverity.MEDIUM, context, true);
    this.statusCode = statusCode;
    this.endpoint = endpoint;
    this.method = method;
  }
}

export class AuthError extends AppError {
  public readonly authType?: 'login' | 'token' | 'permission' | 'session';

  constructor(
    message: string,
    code: string,
    authType?: 'login' | 'token' | 'permission' | 'session',
    context?: ErrorContext
  ) {
    super(message, code, ErrorSeverity.HIGH, context, true);
    this.authType = authType;
  }
}

export class ValidationError extends AppError {
  public readonly field?: string;
  public readonly value?: any;
  public readonly constraint?: string;

  constructor(
    message: string,
    code: string,
    field?: string,
    value?: any,
    constraint?: string,
    context?: ErrorContext
  ) {
    super(message, code, ErrorSeverity.LOW, context, false);
    this.field = field;
    this.value = value;
    this.constraint = constraint;
  }
}

export class DatabaseError extends AppError {
  public readonly query?: string;
  public readonly table?: string;
  public readonly operation?: 'select' | 'insert' | 'update' | 'delete';

  constructor(
    message: string,
    code: string,
    query?: string,
    table?: string,
    operation?: 'select' | 'insert' | 'update' | 'delete',
    context?: ErrorContext
  ) {
    super(message, code, ErrorSeverity.HIGH, context, true);
    this.query = query;
    this.table = table;
    this.operation = operation;
  }
}

export class Web3Error extends AppError {
  public readonly walletType?: string;
  public readonly transactionHash?: string;
  public readonly networkId?: number;

  constructor(
    message: string,
    code: string,
    walletType?: string,
    transactionHash?: string,
    networkId?: number,
    context?: ErrorContext
  ) {
    super(message, code, ErrorSeverity.MEDIUM, context, true);
    this.walletType = walletType;
    this.transactionHash = transactionHash;
    this.networkId = networkId;
  }
}

export class BadgeError extends AppError {
  public readonly badgeId?: string;
  public readonly badgeType?: string;
  public readonly operation?: 'generate' | 'validate' | 'award' | 'revoke';

  constructor(
    message: string,
    code: string,
    badgeId?: string,
    badgeType?: string,
    operation?: 'generate' | 'validate' | 'award' | 'revoke',
    context?: ErrorContext
  ) {
    super(message, code, ErrorSeverity.MEDIUM, context, false);
    this.badgeId = badgeId;
    this.badgeType = badgeType;
    this.operation = operation;
  }
}

export class CurationError extends AppError {
  public readonly userId?: string;
  public readonly contentType?: string;
  public readonly cohort?: string;

  constructor(
    message: string,
    code: string,
    userId?: string,
    contentType?: string,
    cohort?: string,
    context?: ErrorContext
  ) {
    super(message, code, ErrorSeverity.MEDIUM, context, true);
    this.userId = userId;
    this.contentType = contentType;
    this.cohort = cohort;
  }
}

// ============================================================================
// Error Handler Interface
// ============================================================================

export type CustomErrorHandler = (error: AppError) => void | Promise<void>;

export interface ErrorHandler {
  handleError(error: Error, context?: ErrorContext): void;
  registerHandler(errorType: string, handler: CustomErrorHandler): void;
  setSeverityThreshold(severity: ErrorSeverity): void;
  setTrackingEnabled(enabled: boolean): void;
  sanitizeError(error: Error): Error;
  categorizeError(error: Error): string;
}

// ============================================================================
// Error Recovery
// ============================================================================

export interface RecoveryStrategy {
  maxRetries: number;
  retryDelay: number; // milliseconds
  backoffMultiplier: number;
  shouldRetry: (error: Error, attempt: number) => boolean;
  onRetry?: (attempt: number, error: Error) => void;
  onSuccess?: (attempt: number) => void;
  onFailure?: (error: Error, attempts: number) => void;
}

export interface RecoveryResult {
  success: boolean;
  attempts: number;
  finalError?: Error;
  recoveryTime: number; // milliseconds
  strategy: string;
}

export interface ErrorRecoveryManager {
  attemptRecovery(error: AppError, operation: () => Promise<any>): Promise<RecoveryResult>;
  registerStrategy(errorCode: string, strategy: RecoveryStrategy): void;
  isCircuitOpen(operationKey: string): boolean;
  resetCircuit(operationKey: string): void;
  getRecoveryStats(operationKey: string): RecoveryStats;
}

export interface RecoveryStats {
  totalAttempts: number;
  successfulRecoveries: number;
  failedRecoveries: number;
  avgRecoveryTime: number;
  lastRecoveryAttempt?: Date;
}

// ============================================================================
// Circuit Breaker
// ============================================================================

export enum CircuitBreakerState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half_open',
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number; // milliseconds
  monitoringPeriod: number; // milliseconds
  halfOpenMaxCalls: number;
}

export interface CircuitBreakerStats {
  state: CircuitBreakerState;
  failureCount: number;
  successCount: number;
  lastFailureTime?: Date;
  lastSuccessTime?: Date;
  nextAttemptTime?: Date;
}

// ============================================================================
// Debug Logger
// ============================================================================

export interface DebugLogger {
  debug(namespace: string, message: string, data?: any): void;
  info(namespace: string, message: string, data?: any): void;
  warn(namespace: string, message: string, data?: any): void;
  error(namespace: string, message: string, error?: Error, data?: any): void;
  time(namespace: string, label: string): void;
  timeEnd(namespace: string, label: string): void;
  enable(namespace: string): void;
  disable(namespace: string): void;
  setLevel(level: LogLevel): void;
  isEnabled(namespace: string): boolean;
  getEnabledNamespaces(): string[];
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  namespace: string;
  message: string;
  data?: any;
  error?: Error;
  duration?: number; // for time/timeEnd pairs
}

// ============================================================================
// Error Boundaries
// ============================================================================

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  resetKeys?: any[];
  level?: 'critical' | 'section' | 'component';
  isolationId?: string;
}

export interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
  level: 'critical' | 'section' | 'component';
  isolationId?: string;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  errorId?: string;
  resetCount: number;
}

// ============================================================================
// Sentry Integration
// ============================================================================

export type SentryLevel = 'fatal' | 'error' | 'warning' | 'info' | 'debug';

export interface SentryConfig {
  dsn: string;
  environment: 'development' | 'staging' | 'production';
  release?: string;
  tracesSampleRate: number;
  beforeSend?: (event: any) => any;
  beforeBreadcrumb?: (breadcrumb: any) => any;
  maxBreadcrumbs?: number;
  attachStacktrace?: boolean;
}

export interface SentryIntegration {
  initialize(config: SentryConfig): void;
  captureError(error: Error, context?: ErrorContext): string;
  captureMessage(message: string, level: SentryLevel): string;
  addBreadcrumb(breadcrumb: Breadcrumb): void;
  setUser(user: UserContext | null): void;
  setTag(key: string, value: string): void;
  setContext(key: string, context: Record<string, any>): void;
  withScope(callback: (scope: any) => void): void;
}

export interface UserContext {
  id: string;
  email?: string;
  username?: string;
  ageCohort?: string;
  userType?: string;
}

// ============================================================================
// Error Analytics
// ============================================================================

export interface ErrorLog {
  id: string;
  errorCode: string;
  errorType: string;
  message: string;
  severity: ErrorSeverity;
  stackTrace?: string;
  userId?: string;
  component?: string;
  action?: string;
  route?: string;
  metadata?: Record<string, any>;
  resolved: boolean;
  resolvedAt?: Date;
  createdAt: Date;
}

export interface ErrorAnalytics {
  errorCode: string;
  occurrenceCount: number;
  affectedUsers: number;
  firstSeen: Date;
  lastSeen: Date;
  averageResolutionTime?: number; // minutes
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ErrorAnalyticsService {
  trackError(error: AppError): Promise<void>;
  getErrorStats(timeRange: DateRange): Promise<ErrorStats>;
  getTopErrors(limit: number, timeRange: DateRange): Promise<ErrorSummary[]>;
  getErrorTrends(errorCode: string, timeRange: DateRange): Promise<ErrorTrend[]>;
  markErrorResolved(errorId: string): Promise<void>;
  getAffectedUsers(errorCode: string): Promise<string[]>;
}

export interface ErrorStats {
  totalErrors: number;
  uniqueErrors: number;
  affectedUsers: number;
  averageResolutionTime: number;
  errorsByType: Record<string, number>;
  errorsBySeverity: Record<ErrorSeverity, number>;
  topComponents: Array<{ component: string; count: number }>;
}

export interface ErrorSummary {
  errorCode: string;
  message: string;
  count: number;
  affectedUsers: number;
  severity: ErrorSeverity;
  trend: 'increasing' | 'decreasing' | 'stable';
  lastOccurrence: Date;
}

export interface ErrorTrend {
  date: Date;
  count: number;
  uniqueUsers: number;
}

// DateRange is imported from socialFeed.types.ts

// ============================================================================
// Error Rate Limiting
// ============================================================================

export interface ErrorRateLimiter {
  shouldLog(errorCode: string): boolean;
  recordError(errorCode: string): void;
  getSuppressedCount(errorCode: string): number;
  resetLimits(): void;
  getConfiguration(): RateLimitConfig;
  updateConfiguration(config: Partial<RateLimitConfig>): void;
}

export interface RateLimitConfig {
  windowSize: number; // milliseconds
  maxErrorsPerWindow: number;
  suppressionDuration: number; // milliseconds
  criticalErrorsBypass: boolean;
}

export interface RateLimitState {
  errorCode: string;
  count: number;
  suppressedCount: number;
  windowStart: Date;
  lastSuppression?: Date;
  isSuppressed: boolean;
}

// ============================================================================
// Error Notification System
// ============================================================================

export interface ErrorNotification {
  id: string;
  title: string;
  message: string;
  severity: ErrorSeverity;
  actions?: ErrorAction[];
  autoHide?: boolean;
  hideAfter?: number; // milliseconds
  persistent?: boolean;
  timestamp: Date;
}

export interface ErrorAction {
  label: string;
  action: () => void | Promise<void>;
  style?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
}

export interface ErrorNotificationService {
  showError(error: AppError, actions?: ErrorAction[]): string;
  showMessage(message: string, severity: ErrorSeverity, actions?: ErrorAction[]): string;
  hideNotification(id: string): void;
  clearAll(): void;
  getActiveNotifications(): ErrorNotification[];
}

// ============================================================================
// Service Response Types
// ============================================================================

export interface ErrorServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
    recoverable?: boolean;
    suggestions?: string[];
  };
}

// ============================================================================
// Error Code Enums
// ============================================================================

export enum NetworkErrorCodes {
  CONNECTION_FAILED = 'NETWORK_CONNECTION_FAILED',
  TIMEOUT = 'NETWORK_TIMEOUT',
  RATE_LIMITED = 'NETWORK_RATE_LIMITED',
  SERVER_ERROR = 'NETWORK_SERVER_ERROR',
  OFFLINE = 'NETWORK_OFFLINE',
}

export enum AuthErrorCodes {
  INVALID_CREDENTIALS = 'AUTH_INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'AUTH_TOKEN_EXPIRED',
  INSUFFICIENT_PERMISSIONS = 'AUTH_INSUFFICIENT_PERMISSIONS',
  SESSION_EXPIRED = 'AUTH_SESSION_EXPIRED',
  ACCOUNT_LOCKED = 'AUTH_ACCOUNT_LOCKED',
}

export enum ValidationErrorCodes {
  REQUIRED_FIELD = 'VALIDATION_REQUIRED_FIELD',
  INVALID_FORMAT = 'VALIDATION_INVALID_FORMAT',
  OUT_OF_RANGE = 'VALIDATION_OUT_OF_RANGE',
  DUPLICATE_VALUE = 'VALIDATION_DUPLICATE_VALUE',
  INVALID_AGE = 'VALIDATION_INVALID_AGE',
}

export enum DatabaseErrorCodes {
  CONNECTION_FAILED = 'DB_CONNECTION_FAILED',
  QUERY_TIMEOUT = 'DB_QUERY_TIMEOUT',
  CONSTRAINT_VIOLATION = 'DB_CONSTRAINT_VIOLATION',
  TRANSACTION_FAILED = 'DB_TRANSACTION_FAILED',
  RLS_VIOLATION = 'DB_RLS_VIOLATION',
}

export enum Web3ErrorCodes {
  WALLET_NOT_CONNECTED = 'WEB3_WALLET_NOT_CONNECTED',
  TRANSACTION_REJECTED = 'WEB3_TRANSACTION_REJECTED',
  INSUFFICIENT_GAS = 'WEB3_INSUFFICIENT_GAS',
  NETWORK_MISMATCH = 'WEB3_NETWORK_MISMATCH',
  CONTRACT_ERROR = 'WEB3_CONTRACT_ERROR',
}

export enum BadgeErrorCodes {
  GENERATION_FAILED = 'BADGE_GENERATION_FAILED',
  INVALID_METADATA = 'BADGE_INVALID_METADATA',
  AWARD_FAILED = 'BADGE_AWARD_FAILED',
  DUPLICATE_BADGE = 'BADGE_DUPLICATE_BADGE',
  TIER_MISMATCH = 'BADGE_TIER_MISMATCH',
}

export enum CurationErrorCodes {
  SCORING_FAILED = 'CURATION_SCORING_FAILED',
  INVALID_COHORT = 'CURATION_INVALID_COHORT',
  RULE_VALIDATION_FAILED = 'CURATION_RULE_VALIDATION_FAILED',
  CACHE_ERROR = 'CURATION_CACHE_ERROR',
  FALLBACK_FAILED = 'CURATION_FALLBACK_FAILED',
}