/**
 * User-Friendly Error Messages
 * Maps error codes to user-friendly messages with actionable guidance
 * Requirements: 3.1, 3.3, 3.4
 */

import {
  AppError,
  NetworkErrorCodes,
  AuthErrorCodes,
  ValidationErrorCodes,
  DatabaseErrorCodes,
  Web3ErrorCodes,
  BadgeErrorCodes,
  CurationErrorCodes,
  ErrorSeverity,
} from '../types/errors';

// ============================================================================
// Error Message Configuration
// ============================================================================

export interface UserErrorMessage {
  title: string;
  message: string;
  actions: ErrorMessageAction[];
  icon?: string;
  severity: ErrorSeverity;
  category: string;
}

export interface ErrorMessageAction {
  label: string;
  type: 'retry' | 'navigate' | 'contact' | 'dismiss' | 'refresh' | 'custom';
  url?: string;
  handler?: () => void | Promise<void>;
  primary?: boolean;
}

export interface ErrorMessageContext {
  component?: string;
  action?: string;
  field?: string;
  value?: any;
  endpoint?: string;
  transactionHash?: string;
  networkId?: number;
}

// ============================================================================
// Network Error Messages
// ============================================================================

const NETWORK_ERROR_MESSAGES: Record<string, UserErrorMessage> = {
  [NetworkErrorCodes.CONNECTION_FAILED]: {
    title: 'Connection Problem',
    message: 'We\'re having trouble connecting to our servers. Please check your internet connection and try again.',
    actions: [
      { label: 'Try Again', type: 'retry', primary: true },
      { label: 'Check Status', type: 'navigate', url: 'https://status.ganggreen.app' },
    ],
    icon: '🌐',
    severity: ErrorSeverity.MEDIUM,
    category: 'network',
  },
  [NetworkErrorCodes.TIMEOUT]: {
    title: 'Request Timed Out',
    message: 'The request is taking longer than expected. This might be due to a slow connection or server load.',
    actions: [
      { label: 'Try Again', type: 'retry', primary: true },
      { label: 'Go Back', type: 'navigate', url: '/' },
    ],
    icon: '⏱️',
    severity: ErrorSeverity.MEDIUM,
    category: 'network',
  },
  [NetworkErrorCodes.RATE_LIMITED]: {
    title: 'Too Many Requests',
    message: 'You\'re making requests too quickly. Please wait a moment before trying again.',
    actions: [
      { label: 'Wait and Retry', type: 'retry', primary: true },
    ],
    icon: '🚦',
    severity: ErrorSeverity.LOW,
    category: 'network',
  },
  [NetworkErrorCodes.SERVER_ERROR]: {
    title: 'Server Error',
    message: 'Something went wrong on our end. Our team has been notified and is working on a fix.',
    actions: [
      { label: 'Try Again', type: 'retry', primary: true },
      { label: 'Contact Support', type: 'contact' },
    ],
    icon: '🔧',
    severity: ErrorSeverity.HIGH,
    category: 'network',
  },
  [NetworkErrorCodes.OFFLINE]: {
    title: 'You\'re Offline',
    message: 'It looks like you\'re not connected to the internet. Please check your connection and try again.',
    actions: [
      { label: 'Retry When Online', type: 'retry', primary: true },
      { label: 'View Cached Data', type: 'custom' },
    ],
    icon: '📡',
    severity: ErrorSeverity.MEDIUM,
    category: 'network',
  },
};

// ============================================================================
// Authentication Error Messages
// ============================================================================

const AUTH_ERROR_MESSAGES: Record<string, UserErrorMessage> = {
  [AuthErrorCodes.INVALID_CREDENTIALS]: {
    title: 'Login Failed',
    message: 'The email or password you entered is incorrect. Please check your credentials and try again.',
    actions: [
      { label: 'Try Again', type: 'retry', primary: true },
      { label: 'Forgot Password?', type: 'navigate', url: '/forgot-password' },
    ],
    icon: '🔐',
    severity: ErrorSeverity.LOW,
    category: 'auth',
  },
  [AuthErrorCodes.TOKEN_EXPIRED]: {
    title: 'Session Expired',
    message: 'Your session has expired for security reasons. Please log in again to continue.',
    actions: [
      { label: 'Log In Again', type: 'navigate', url: '/login', primary: true },
    ],
    icon: '⏰',
    severity: ErrorSeverity.MEDIUM,
    category: 'auth',
  },
  [AuthErrorCodes.INSUFFICIENT_PERMISSIONS]: {
    title: 'Access Denied',
    message: 'You don\'t have permission to perform this action. Contact your administrator if you believe this is an error.',
    actions: [
      { label: 'Go Back', type: 'navigate', url: '/', primary: true },
      { label: 'Contact Support', type: 'contact' },
    ],
    icon: '🚫',
    severity: ErrorSeverity.MEDIUM,
    category: 'auth',
  },
  [AuthErrorCodes.SESSION_EXPIRED]: {
    title: 'Session Expired',
    message: 'Your session has expired. Please log in again to continue using the platform.',
    actions: [
      { label: 'Log In', type: 'navigate', url: '/login', primary: true },
    ],
    icon: '🔒',
    severity: ErrorSeverity.MEDIUM,
    category: 'auth',
  },
  [AuthErrorCodes.ACCOUNT_LOCKED]: {
    title: 'Account Locked',
    message: 'Your account has been temporarily locked due to multiple failed login attempts. Please try again later or contact support.',
    actions: [
      { label: 'Contact Support', type: 'contact', primary: true },
      { label: 'Reset Password', type: 'navigate', url: '/forgot-password' },
    ],
    icon: '🔒',
    severity: ErrorSeverity.HIGH,
    category: 'auth',
  },
};

// ============================================================================
// Validation Error Messages
// ============================================================================

const VALIDATION_ERROR_MESSAGES: Record<string, UserErrorMessage> = {
  [ValidationErrorCodes.REQUIRED_FIELD]: {
    title: 'Required Field Missing',
    message: 'Please fill in all required fields before continuing.',
    actions: [
      { label: 'Fix and Continue', type: 'dismiss', primary: true },
    ],
    icon: '📝',
    severity: ErrorSeverity.LOW,
    category: 'validation',
  },
  [ValidationErrorCodes.INVALID_FORMAT]: {
    title: 'Invalid Format',
    message: 'The information you entered doesn\'t match the expected format. Please check and try again.',
    actions: [
      { label: 'Fix and Continue', type: 'dismiss', primary: true },
    ],
    icon: '⚠️',
    severity: ErrorSeverity.LOW,
    category: 'validation',
  },
  [ValidationErrorCodes.OUT_OF_RANGE]: {
    title: 'Value Out of Range',
    message: 'The value you entered is outside the acceptable range. Please enter a valid value.',
    actions: [
      { label: 'Fix and Continue', type: 'dismiss', primary: true },
    ],
    icon: '📊',
    severity: ErrorSeverity.LOW,
    category: 'validation',
  },
  [ValidationErrorCodes.DUPLICATE_VALUE]: {
    title: 'Duplicate Entry',
    message: 'This value already exists. Please choose a different value.',
    actions: [
      { label: 'Choose Different Value', type: 'dismiss', primary: true },
    ],
    icon: '🔄',
    severity: ErrorSeverity.LOW,
    category: 'validation',
  },
  [ValidationErrorCodes.INVALID_AGE]: {
    title: 'Age Verification Required',
    message: 'You must be at least 13 years old to use this platform. Please verify your age.',
    actions: [
      { label: 'Update Age', type: 'dismiss', primary: true },
      { label: 'Contact Support', type: 'contact' },
    ],
    icon: '🎂',
    severity: ErrorSeverity.MEDIUM,
    category: 'validation',
  },
};

// ============================================================================
// Database Error Messages
// ============================================================================

const DATABASE_ERROR_MESSAGES: Record<string, UserErrorMessage> = {
  [DatabaseErrorCodes.CONNECTION_FAILED]: {
    title: 'Database Connection Issue',
    message: 'We\'re experiencing technical difficulties. Please try again in a few moments.',
    actions: [
      { label: 'Try Again', type: 'retry', primary: true },
      { label: 'Contact Support', type: 'contact' },
    ],
    icon: '🗄️',
    severity: ErrorSeverity.HIGH,
    category: 'database',
  },
  [DatabaseErrorCodes.QUERY_TIMEOUT]: {
    title: 'Operation Taking Too Long',
    message: 'This operation is taking longer than expected. Please try again or contact support if the problem persists.',
    actions: [
      { label: 'Try Again', type: 'retry', primary: true },
      { label: 'Contact Support', type: 'contact' },
    ],
    icon: '⏳',
    severity: ErrorSeverity.MEDIUM,
    category: 'database',
  },
  [DatabaseErrorCodes.CONSTRAINT_VIOLATION]: {
    title: 'Data Conflict',
    message: 'The data you\'re trying to save conflicts with existing information. Please check your input and try again.',
    actions: [
      { label: 'Review and Fix', type: 'dismiss', primary: true },
      { label: 'Contact Support', type: 'contact' },
    ],
    icon: '⚠️',
    severity: ErrorSeverity.MEDIUM,
    category: 'database',
  },
  [DatabaseErrorCodes.TRANSACTION_FAILED]: {
    title: 'Save Failed',
    message: 'We couldn\'t save your changes due to a technical issue. Please try again.',
    actions: [
      { label: 'Try Saving Again', type: 'retry', primary: true },
      { label: 'Save Draft', type: 'custom' },
    ],
    icon: '💾',
    severity: ErrorSeverity.MEDIUM,
    category: 'database',
  },
  [DatabaseErrorCodes.RLS_VIOLATION]: {
    title: 'Access Restricted',
    message: 'You don\'t have permission to access this data. Please contact support if you believe this is an error.',
    actions: [
      { label: 'Go Back', type: 'navigate', url: '/', primary: true },
      { label: 'Contact Support', type: 'contact' },
    ],
    icon: '🔐',
    severity: ErrorSeverity.MEDIUM,
    category: 'database',
  },
};

// ============================================================================
// Web3 Error Messages
// ============================================================================

const WEB3_ERROR_MESSAGES: Record<string, UserErrorMessage> = {
  [Web3ErrorCodes.WALLET_NOT_CONNECTED]: {
    title: 'Wallet Not Connected',
    message: 'Please connect your wallet to continue with this transaction.',
    actions: [
      { label: 'Connect Wallet', type: 'custom', primary: true },
      { label: 'Learn More', type: 'navigate', url: '/help/wallet-setup' },
    ],
    icon: '👛',
    severity: ErrorSeverity.MEDIUM,
    category: 'web3',
  },
  [Web3ErrorCodes.TRANSACTION_REJECTED]: {
    title: 'Transaction Cancelled',
    message: 'You cancelled the transaction in your wallet. No charges were made.',
    actions: [
      { label: 'Try Again', type: 'retry', primary: true },
      { label: 'Go Back', type: 'navigate', url: '/' },
    ],
    icon: '❌',
    severity: ErrorSeverity.LOW,
    category: 'web3',
  },
  [Web3ErrorCodes.INSUFFICIENT_GAS]: {
    title: 'Insufficient Gas',
    message: 'You don\'t have enough cryptocurrency to cover the transaction fees. Please add funds to your wallet.',
    actions: [
      { label: 'Add Funds', type: 'custom', primary: true },
      { label: 'Learn About Gas Fees', type: 'navigate', url: '/help/gas-fees' },
    ],
    icon: '⛽',
    severity: ErrorSeverity.MEDIUM,
    category: 'web3',
  },
  [Web3ErrorCodes.NETWORK_MISMATCH]: {
    title: 'Wrong Network',
    message: 'Please switch your wallet to the correct network to continue.',
    actions: [
      { label: 'Switch Network', type: 'custom', primary: true },
      { label: 'Help with Networks', type: 'navigate', url: '/help/networks' },
    ],
    icon: '🌐',
    severity: ErrorSeverity.MEDIUM,
    category: 'web3',
  },
  [Web3ErrorCodes.CONTRACT_ERROR]: {
    title: 'Smart Contract Error',
    message: 'The smart contract encountered an error. This might be due to insufficient funds or invalid parameters.',
    actions: [
      { label: 'Try Again', type: 'retry', primary: true },
      { label: 'Contact Support', type: 'contact' },
    ],
    icon: '📜',
    severity: ErrorSeverity.HIGH,
    category: 'web3',
  },
};

// ============================================================================
// Badge Error Messages
// ============================================================================

const BADGE_ERROR_MESSAGES: Record<string, UserErrorMessage> = {
  [BadgeErrorCodes.GENERATION_FAILED]: {
    title: 'Badge Creation Failed',
    message: 'We couldn\'t create your badge right now. Don\'t worry, your achievement is still recorded!',
    actions: [
      { label: 'Try Again', type: 'retry', primary: true },
      { label: 'View Achievements', type: 'navigate', url: '/profile/achievements' },
    ],
    icon: '🏆',
    severity: ErrorSeverity.MEDIUM,
    category: 'badge',
  },
  [BadgeErrorCodes.INVALID_METADATA]: {
    title: 'Badge Information Error',
    message: 'There\'s an issue with the badge information. Please try again or contact support.',
    actions: [
      { label: 'Try Again', type: 'retry', primary: true },
      { label: 'Contact Support', type: 'contact' },
    ],
    icon: '📋',
    severity: ErrorSeverity.MEDIUM,
    category: 'badge',
  },
  [BadgeErrorCodes.AWARD_FAILED]: {
    title: 'Badge Award Failed',
    message: 'We couldn\'t award your badge right now, but your achievement is saved. We\'ll try again automatically.',
    actions: [
      { label: 'Check Later', type: 'navigate', url: '/profile/achievements', primary: true },
      { label: 'Contact Support', type: 'contact' },
    ],
    icon: '🎖️',
    severity: ErrorSeverity.MEDIUM,
    category: 'badge',
  },
  [BadgeErrorCodes.DUPLICATE_BADGE]: {
    title: 'Badge Already Earned',
    message: 'You\'ve already earned this badge! Check your achievements to see all your badges.',
    actions: [
      { label: 'View Achievements', type: 'navigate', url: '/profile/achievements', primary: true },
    ],
    icon: '✅',
    severity: ErrorSeverity.LOW,
    category: 'badge',
  },
  [BadgeErrorCodes.TIER_MISMATCH]: {
    title: 'Badge Tier Error',
    message: 'There\'s a mismatch in badge tier requirements. Please complete the previous tier first.',
    actions: [
      { label: 'View Requirements', type: 'navigate', url: '/badges', primary: true },
      { label: 'Contact Support', type: 'contact' },
    ],
    icon: '🎯',
    severity: ErrorSeverity.MEDIUM,
    category: 'badge',
  },
};

// ============================================================================
// Curation Error Messages
// ============================================================================

const CURATION_ERROR_MESSAGES: Record<string, UserErrorMessage> = {
  [CurationErrorCodes.SCORING_FAILED]: {
    title: 'Content Scoring Issue',
    message: 'We\'re having trouble analyzing this content. Please try again in a few moments.',
    actions: [
      { label: 'Try Again', type: 'retry', primary: true },
      { label: 'Skip for Now', type: 'dismiss' },
    ],
    icon: '📊',
    severity: ErrorSeverity.MEDIUM,
    category: 'curation',
  },
  [CurationErrorCodes.INVALID_COHORT]: {
    title: 'Age Group Error',
    message: 'There\'s an issue with your age group settings. Please update your profile.',
    actions: [
      { label: 'Update Profile', type: 'navigate', url: '/profile/edit', primary: true },
      { label: 'Contact Support', type: 'contact' },
    ],
    icon: '👥',
    severity: ErrorSeverity.MEDIUM,
    category: 'curation',
  },
  [CurationErrorCodes.RULE_VALIDATION_FAILED]: {
    title: 'Content Guidelines Issue',
    message: 'This content doesn\'t meet our community guidelines. Please review and modify.',
    actions: [
      { label: 'Review Guidelines', type: 'navigate', url: '/community-guidelines', primary: true },
      { label: 'Edit Content', type: 'dismiss' },
    ],
    icon: '📋',
    severity: ErrorSeverity.MEDIUM,
    category: 'curation',
  },
  [CurationErrorCodes.CACHE_ERROR]: {
    title: 'Loading Issue',
    message: 'We\'re having trouble loading personalized content. Showing general content instead.',
    actions: [
      { label: 'Refresh', type: 'refresh', primary: true },
      { label: 'Continue', type: 'dismiss' },
    ],
    icon: '🔄',
    severity: ErrorSeverity.LOW,
    category: 'curation',
  },
  [CurationErrorCodes.FALLBACK_FAILED]: {
    title: 'Content Loading Failed',
    message: 'We couldn\'t load content recommendations. Please refresh the page.',
    actions: [
      { label: 'Refresh Page', type: 'refresh', primary: true },
      { label: 'Browse Manually', type: 'navigate', url: '/explore' },
    ],
    icon: '📱',
    severity: ErrorSeverity.MEDIUM,
    category: 'curation',
  },
};

// ============================================================================
// Error Message Registry
// ============================================================================

const ERROR_MESSAGE_REGISTRY: Record<string, UserErrorMessage> = {
  ...NETWORK_ERROR_MESSAGES,
  ...AUTH_ERROR_MESSAGES,
  ...VALIDATION_ERROR_MESSAGES,
  ...DATABASE_ERROR_MESSAGES,
  ...WEB3_ERROR_MESSAGES,
  ...BADGE_ERROR_MESSAGES,
  ...CURATION_ERROR_MESSAGES,
};

// ============================================================================
// Default Error Messages
// ============================================================================

const DEFAULT_ERROR_MESSAGES: Record<ErrorSeverity, UserErrorMessage> = {
  [ErrorSeverity.LOW]: {
    title: 'Minor Issue',
    message: 'Something didn\'t work as expected, but you can continue using the app.',
    actions: [
      { label: 'Continue', type: 'dismiss', primary: true },
    ],
    icon: 'ℹ️',
    severity: ErrorSeverity.LOW,
    category: 'general',
  },
  [ErrorSeverity.MEDIUM]: {
    title: 'Something Went Wrong',
    message: 'We encountered an issue while processing your request. Please try again.',
    actions: [
      { label: 'Try Again', type: 'retry', primary: true },
      { label: 'Go Back', type: 'navigate', url: '/' },
    ],
    icon: '⚠️',
    severity: ErrorSeverity.MEDIUM,
    category: 'general',
  },
  [ErrorSeverity.HIGH]: {
    title: 'Error Occurred',
    message: 'We\'re experiencing technical difficulties. Our team has been notified.',
    actions: [
      { label: 'Try Again', type: 'retry', primary: true },
      { label: 'Contact Support', type: 'contact' },
    ],
    icon: '❌',
    severity: ErrorSeverity.HIGH,
    category: 'general',
  },
  [ErrorSeverity.CRITICAL]: {
    title: 'Critical Error',
    message: 'A serious error occurred. Please contact support immediately.',
    actions: [
      { label: 'Contact Support', type: 'contact', primary: true },
      { label: 'Refresh Page', type: 'refresh' },
    ],
    icon: '🚨',
    severity: ErrorSeverity.CRITICAL,
    category: 'general',
  },
};

// ============================================================================
// Error Message Service
// ============================================================================

export class ErrorMessageService {
  /**
   * Get user-friendly error message for an error
   */
  static getUserMessage(error: AppError, context?: ErrorMessageContext): UserErrorMessage {
    // Try to get specific message for error code
    let message = ERROR_MESSAGE_REGISTRY[error.code];
    
    if (!message) {
      // Fall back to default message based on severity
      message = DEFAULT_ERROR_MESSAGES[error.severity];
    }
    
    // Customize message based on context
    return this.customizeMessage(message, error, context);
  }
  
  /**
   * Customize error message based on context
   */
  private static customizeMessage(
    message: UserErrorMessage,
    error: AppError,
    context?: ErrorMessageContext
  ): UserErrorMessage {
    let customizedMessage = { ...message };
    
    // Add field-specific information for validation errors
    if (context?.field && error.code.startsWith('VALIDATION_')) {
      customizedMessage.message = `${customizedMessage.message} Field: ${context.field}`;
    }
    
    // Add endpoint information for network errors
    if (context?.endpoint && error.code.startsWith('NETWORK_')) {
      customizedMessage.title = `${customizedMessage.title} (${this.getEndpointName(context.endpoint)})`;
    }
    
    // Add transaction hash for Web3 errors
    if (context?.transactionHash && error.code.startsWith('WEB3_')) {
      customizedMessage.actions = [
        ...customizedMessage.actions,
        {
          label: 'View Transaction',
          type: 'navigate',
          url: `https://etherscan.io/tx/${context.transactionHash}`,
        },
      ];
    }
    
    return customizedMessage;
  }
  
  /**
   * Get friendly name for API endpoint
   */
  private static getEndpointName(endpoint: string): string {
    const endpointNames: Record<string, string> = {
      '/api/auth/login': 'Login',
      '/api/auth/logout': 'Logout',
      '/api/users/profile': 'Profile',
      '/api/initiatives': 'Initiatives',
      '/api/trees': 'Trees',
      '/api/badges': 'Badges',
      '/api/donations': 'Donations',
    };
    
    return endpointNames[endpoint] || 'API';
  }
  
  /**
   * Get error message for network-specific errors
   */
  static getNetworkErrorMessage(statusCode: number, endpoint?: string): UserErrorMessage {
    if (statusCode >= 500) {
      return ERROR_MESSAGE_REGISTRY[NetworkErrorCodes.SERVER_ERROR];
    } else if (statusCode === 429) {
      return ERROR_MESSAGE_REGISTRY[NetworkErrorCodes.RATE_LIMITED];
    } else if (statusCode === 408) {
      return ERROR_MESSAGE_REGISTRY[NetworkErrorCodes.TIMEOUT];
    } else {
      return DEFAULT_ERROR_MESSAGES[ErrorSeverity.MEDIUM];
    }
  }
  
  /**
   * Get validation error message with field context
   */
  static getValidationErrorMessage(
    field: string,
    constraint: string,
    value?: any
  ): UserErrorMessage {
    const baseMessage = ERROR_MESSAGE_REGISTRY[ValidationErrorCodes.INVALID_FORMAT];
    
    const fieldMessages: Record<string, string> = {
      email: 'Please enter a valid email address (e.g., user@example.com)',
      password: 'Password must be at least 8 characters with letters and numbers',
      age: 'Please enter a valid age between 13 and 120',
      phone: 'Please enter a valid phone number',
      url: 'Please enter a valid URL (e.g., https://example.com)',
    };
    
    const customMessage = fieldMessages[field.toLowerCase()];
    
    return {
      ...baseMessage,
      message: customMessage || `Please check the ${field} field and try again`,
      title: `Invalid ${field.charAt(0).toUpperCase() + field.slice(1)}`,
    };
  }
  
  /**
   * Register custom error message
   */
  static registerErrorMessage(errorCode: string, message: UserErrorMessage): void {
    ERROR_MESSAGE_REGISTRY[errorCode] = message;
  }
  
  /**
   * Get all registered error codes
   */
  static getRegisteredErrorCodes(): string[] {
    return Object.keys(ERROR_MESSAGE_REGISTRY);
  }
  
  /**
   * Check if error code has custom message
   */
  static hasCustomMessage(errorCode: string): boolean {
    return errorCode in ERROR_MESSAGE_REGISTRY;
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create error action with retry functionality
 */
export function createRetryAction(
  retryFn: () => void | Promise<void>,
  label: string = 'Try Again'
): ErrorMessageAction {
  return {
    label,
    type: 'retry',
    handler: retryFn,
    primary: true,
  };
}

/**
 * Create error action for navigation
 */
export function createNavigationAction(
  url: string,
  label: string = 'Go Back'
): ErrorMessageAction {
  return {
    label,
    type: 'navigate',
    url,
  };
}

/**
 * Create error action for contacting support
 */
export function createSupportAction(
  errorCode?: string,
  label: string = 'Contact Support'
): ErrorMessageAction {
  const supportUrl = errorCode 
    ? `/support?error=${encodeURIComponent(errorCode)}`
    : '/support';
    
  return {
    label,
    type: 'contact',
    url: supportUrl,
  };
}

/**
 * Create error action for dismissing notification
 */
export function createDismissAction(
  label: string = 'Dismiss'
): ErrorMessageAction {
  return {
    label,
    type: 'dismiss',
  };
}

/**
 * Get contextual error message based on user action
 */
export function getContextualErrorMessage(
  error: AppError,
  userAction: string,
  component?: string
): UserErrorMessage {
  const context: ErrorMessageContext = {
    action: userAction,
    component,
  };
  
  const baseMessage = ErrorMessageService.getUserMessage(error, context);
  
  // Add action-specific context
  const actionMessages: Record<string, string> = {
    'login': 'while trying to log in',
    'save': 'while saving your changes',
    'upload': 'while uploading your file',
    'delete': 'while deleting the item',
    'create': 'while creating the item',
    'update': 'while updating the item',
  };
  
  const actionContext = actionMessages[userAction.toLowerCase()];
  if (actionContext) {
    baseMessage.message = `An error occurred ${actionContext}. ${baseMessage.message}`;
  }
  
  return baseMessage;
}

export default ErrorMessageService;