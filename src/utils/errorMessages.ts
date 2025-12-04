/**
 * User-Friendly Error Messages
 * 
 * Provides:
 * - Error code to user message mapping
 * - Age-appropriate message generation
 * - Actionable guidance for common errors
 * 
 * Requirements: C3.1, C3.3, C3.4
 */

import { AgeCohort } from '../types/contentCuration.types';

/**
 * Error message with actionable guidance
 */
export interface ErrorMessage {
  title: string;
  message: string;
  guidance?: string[];
  actions?: Array<{
    label: string;
    type: 'retry' | 'navigate' | 'contact' | 'external';
    target?: string | number;
  }>;
}

/**
 * Error code to message mapping
 * 
 * Requirement C3.1: User-friendly messages without technical jargon
 * Requirement C3.4: Actionable guidance
 */
const ERROR_MESSAGES: Record<string, ErrorMessage> = {
  // Authentication Errors
  INVALID_CREDENTIALS: {
    title: 'Login Failed',
    message: 'The email or password you entered is incorrect.',
    guidance: [
      'Double-check your email address for typos',
      'Make sure Caps Lock is off when entering your password',
      'Try resetting your password if you forgot it',
    ],
    actions: [
      { label: 'Try Again', type: 'retry' },
      { label: 'Reset Password', type: 'navigate', target: '/reset-password' },
    ],
  },

  SESSION_EXPIRED: {
    title: 'Session Expired',
    message: 'Your session has expired for security reasons.',
    guidance: ['Please log in again to continue'],
    actions: [
      { label: 'Log In', type: 'navigate', target: '/login' },
    ],
  },

  TOKEN_REFRESH_FAILED: {
    title: 'Connection Issue',
    message: 'We had trouble refreshing your session.',
    guidance: ['This usually happens due to a temporary connection issue'],
    actions: [
      { label: 'Try Again', type: 'retry' },
    ],
  },

  INSUFFICIENT_PERMISSIONS: {
    title: 'Access Denied',
    message: 'You don\'t have permission to perform this action.',
    guidance: [
      'This feature may require a different account type',
      'Contact an administrator if you believe this is an error',
    ],
    actions: [
      { label: 'Go Back', type: 'navigate', target: -1 },
      { label: 'Contact Support', type: 'contact' },
    ],
  },

  EMAIL_NOT_VERIFIED: {
    title: 'Email Verification Required',
    message: 'Please verify your email address to continue.',
    guidance: [
      'Check your inbox for a verification email',
      'Don\'t forget to check your spam folder',
    ],
    actions: [
      { label: 'Resend Email', type: 'retry' },
    ],
  },

  ACCOUNT_LOCKED: {
    title: 'Account Locked',
    message: 'Your account has been temporarily locked.',
    guidance: [
      'This may be due to multiple failed login attempts',
      'Contact support to unlock your account',
    ],
    actions: [
      { label: 'Contact Support', type: 'contact' },
    ],
  },

  // Validation Errors
  REQUIRED_FIELD: {
    title: 'Missing Information',
    message: 'Please fill in all required fields.',
    guidance: ['Look for fields marked with an asterisk (*)'],
    actions: [
      { label: 'Go Back', type: 'navigate', target: -1 },
    ],
  },

  INVALID_FORMAT: {
    title: 'Invalid Format',
    message: 'The information you entered doesn\'t match the expected format.',
    guidance: ['Check the example provided for the correct format'],
    actions: [
      { label: 'Try Again', type: 'retry' },
    ],
  },

  OUT_OF_RANGE: {
    title: 'Value Out of Range',
    message: 'The value you entered is outside the allowed range.',
    guidance: ['Make sure your value is within the specified limits'],
    actions: [
      { label: 'Go Back', type: 'navigate', target: -1 },
    ],
  },

  INVALID_AGE: {
    title: 'Invalid Age',
    message: 'The age you entered doesn\'t seem right.',
    guidance: [
      'Age must be between 13 and 120',
      'Make sure you entered your birth year correctly',
    ],
    actions: [
      { label: 'Try Again', type: 'retry' },
    ],
  },

  DUPLICATE_ENTRY: {
    title: 'Already Exists',
    message: 'This information is already in use.',
    guidance: ['Try using a different value'],
    actions: [
      { label: 'Go Back', type: 'navigate', target: -1 },
    ],
  },

  // Database Errors
  QUERY_FAILED: {
    title: 'Something Went Wrong',
    message: 'We encountered an issue while processing your request.',
    guidance: ['This is usually temporary. Please try again in a moment.'],
    actions: [
      { label: 'Try Again', type: 'retry' },
    ],
  },

  CONNECTION_FAILED: {
    title: 'Connection Failed',
    message: 'We couldn\'t connect to our servers.',
    guidance: [
      'Check your internet connection',
      'Try refreshing the page',
    ],
    actions: [
      { label: 'Try Again', type: 'retry' },
    ],
  },

  QUERY_TIMEOUT: {
    title: 'Request Timed Out',
    message: 'Your request took too long to complete.',
    guidance: [
      'This might be due to a slow connection',
      'Try again with a faster internet connection',
    ],
    actions: [
      { label: 'Try Again', type: 'retry' },
    ],
  },

  RECORD_NOT_FOUND: {
    title: 'Not Found',
    message: 'We couldn\'t find what you\'re looking for.',
    guidance: [
      'The item may have been removed',
      'Check that you have the correct link',
    ],
    actions: [
      { label: 'Go Back', type: 'navigate', target: -1 },
    ],
  },

  // Network Errors
  REQUEST_FAILED: {
    title: 'Network Error',
    message: 'We couldn\'t complete your request due to a network issue.',
    guidance: [
      'Check your internet connection',
      'Try again in a moment',
    ],
    actions: [
      { label: 'Try Again', type: 'retry' },
    ],
  },

  REQUEST_TIMEOUT: {
    title: 'Request Timed Out',
    message: 'Your request took too long and was cancelled.',
    guidance: ['This usually happens with slow internet connections'],
    actions: [
      { label: 'Try Again', type: 'retry' },
    ],
  },

  OFFLINE: {
    title: 'No Internet Connection',
    message: 'You appear to be offline.',
    guidance: [
      'Check your Wi-Fi or mobile data connection',
      'Try moving to an area with better signal',
    ],
    actions: [
      { label: 'Try Again', type: 'retry' },
    ],
  },

  SERVER_ERROR: {
    title: 'Server Error',
    message: 'Our servers are having trouble right now.',
    guidance: [
      'This is not your fault',
      'Our team has been notified',
      'Please try again in a few minutes',
    ],
    actions: [
      { label: 'Try Again', type: 'retry' },
    ],
  },

  // Mission Errors
  MISSION_NOT_FOUND: {
    title: 'Mission Not Found',
    message: 'This mission doesn\'t exist or has been removed.',
    guidance: ['Browse other available missions'],
    actions: [
      { label: 'View Missions', type: 'navigate', target: '/missions' },
    ],
  },

  ALREADY_JOINED: {
    title: 'Already Joined',
    message: 'You\'ve already joined this mission.',
    guidance: ['Check your mission dashboard to see your progress'],
    actions: [
      { label: 'View My Missions', type: 'navigate', target: '/dashboard' },
    ],
  },

  CAPACITY_REACHED: {
    title: 'Mission Full',
    message: 'This mission has reached its maximum number of participants.',
    guidance: ['Try joining a similar mission or check back later'],
    actions: [
      { label: 'Browse Missions', type: 'navigate', target: '/missions' },
    ],
  },

  VERIFICATION_REQUIRED: {
    title: 'Verification Needed',
    message: 'You need to submit verification evidence to complete this mission.',
    guidance: [
      'Take photos of your completed action',
      'Make sure GPS location is enabled',
    ],
    actions: [
      { label: 'Submit Evidence', type: 'retry' },
    ],
  },

  // Community Errors
  COMMUNITY_NOT_FOUND: {
    title: 'Community Not Found',
    message: 'This community doesn\'t exist or has been removed.',
    guidance: ['Explore other communities'],
    actions: [
      { label: 'Browse Communities', type: 'navigate', target: '/communities' },
    ],
  },

  ALREADY_MEMBER: {
    title: 'Already a Member',
    message: 'You\'re already a member of this community.',
    guidance: ['Visit the community page to participate'],
    actions: [
      { label: 'View Community', type: 'navigate' },
    ],
  },

  NOT_MEMBER: {
    title: 'Membership Required',
    message: 'You need to join this community first.',
    guidance: ['Join the community to access this feature'],
    actions: [
      { label: 'Join Community', type: 'retry' },
    ],
  },

  // GG Coin Errors
  INSUFFICIENT_BALANCE: {
    title: 'Not Enough GG Coins',
    message: 'You don\'t have enough GG Coins for this action.',
    guidance: [
      'Complete missions to earn more GG Coins',
      'Participate in learning modules',
    ],
    actions: [
      { label: 'Earn Coins', type: 'navigate', target: '/missions' },
    ],
  },

  INVALID_AMOUNT: {
    title: 'Invalid Amount',
    message: 'The coin amount must be a positive number.',
    guidance: ['Enter a valid amount and try again'],
    actions: [
      { label: 'Try Again', type: 'retry' },
    ],
  },

  // Badge Errors
  GENERATION_FAILED: {
    title: 'Badge Generation Failed',
    message: 'We couldn\'t create your badge right now.',
    guidance: ['This is usually temporary. Try again in a moment.'],
    actions: [
      { label: 'Try Again', type: 'retry' },
    ],
  },

  ALREADY_OWNED: {
    title: 'Badge Already Owned',
    message: 'You already have this badge.',
    guidance: ['Check your badge collection'],
    actions: [
      { label: 'View Badges', type: 'navigate', target: '/badges' },
    ],
  },

  INSUFFICIENT_PROGRESS: {
    title: 'More Progress Needed',
    message: 'You haven\'t completed enough actions to earn this badge yet.',
    guidance: ['Keep participating to unlock this badge'],
    actions: [
      { label: 'View Progress', type: 'navigate', target: '/gamification' },
    ],
  },

  // Curation Errors
  SCORING_FAILED: {
    title: 'Content Loading Issue',
    message: 'We had trouble personalizing your content.',
    guidance: ['You\'ll see general content instead'],
    actions: [
      { label: 'Continue', type: 'navigate', target: -1 },
    ],
  },

  ENGINE_FAILURE: {
    title: 'Personalization Unavailable',
    message: 'Content personalization is temporarily unavailable.',
    guidance: ['You\'ll see content in chronological order'],
    actions: [
      { label: 'Continue', type: 'navigate', target: -1 },
    ],
  },

  // Circuit Breaker
  CIRCUIT_BREAKER_OPEN: {
    title: 'Service Temporarily Unavailable',
    message: 'This feature is temporarily unavailable due to technical issues.',
    guidance: [
      'Our team is working on it',
      'Please try again in a few minutes',
    ],
    actions: [
      { label: 'Go Back', type: 'navigate', target: -1 },
    ],
  },
};

/**
 * Get user-friendly error message for an error code
 * 
 * Requirement C3.1: User-friendly messages
 */
export function getErrorMessage(errorCode: string): ErrorMessage {
  return ERROR_MESSAGES[errorCode] || {
    title: 'Something Went Wrong',
    message: 'We encountered an unexpected error.',
    guidance: ['Please try again or contact support if the problem persists'],
    actions: [
      { label: 'Try Again', type: 'retry' },
      { label: 'Contact Support', type: 'contact' },
    ],
  };
}

/**
 * Generate age-appropriate error message
 * 
 * Requirement C3.3: Age-appropriate messages
 */
export function getAgeAppropriateMessage(
  errorCode: string,
  ageCohort?: AgeCohort
): ErrorMessage {
  const baseMessage = getErrorMessage(errorCode);

  // For younger users (13-17), simplify language
  if (ageCohort === '13-17') {
    return {
      ...baseMessage,
      message: simplifyForYouth(baseMessage.message),
      guidance: baseMessage.guidance?.map(simplifyForYouth),
    };
  }

  // For seniors (50+), add more context
  if (ageCohort === '50+') {
    return {
      ...baseMessage,
      guidance: [
        ...(baseMessage.guidance || []),
        'Need help? Contact support for assistance',
      ],
    };
  }

  return baseMessage;
}

/**
 * Simplify message for younger users
 */
function simplifyForYouth(message: string): string {
  return message
    .replace(/encountered/gi, 'found')
    .replace(/temporarily/gi, 'for now')
    .replace(/unavailable/gi, 'not working')
    .replace(/insufficient/gi, 'not enough')
    .replace(/credentials/gi, 'login info')
    .replace(/verification/gi, 'proof')
    .replace(/participate/gi, 'join in');
}

/**
 * Get actionable guidance for common errors
 * 
 * Requirement C3.4: Actionable guidance
 */
export function getErrorGuidance(errorCode: string): string[] {
  const message = getErrorMessage(errorCode);
  return message.guidance || [];
}

/**
 * Check if error is recoverable (has retry action)
 */
export function isRecoverableError(errorCode: string): boolean {
  const message = getErrorMessage(errorCode);
  return message.actions?.some((action) => action.type === 'retry') || false;
}
