/**
 * Application Constants
 */

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  ORGANIZATION: 'organization',
  COMMUNITY: 'community',
  INDIVIDUAL: 'individual',
} as const;

// Forest Preferences
export const FORESTS = {
  KAKAMEGA: 'kakamega',
  KARURA: 'karura',
  MAU: 'mau',
} as const;

// Forest Display Names
export const FOREST_NAMES = {
  kakamega: 'Kakamega Forest',
  karura: 'Karura Forest',
  mau: 'Mau Forest',
} as const;

// Role Display Names
export const ROLE_NAMES = {
  admin: 'Administrator',
  organization: 'Organization',
  community: 'Community Member',
  individual: 'Individual',
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  ANTUGROW_BASE: import.meta.env.VITE_ANTUGROW_API_URL || 'https://api.antugrow.com',
} as const;

// File Upload Limits
export const FILE_LIMITS = {
  MAX_IMAGE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

// GG Coin Configuration
export const GG_COIN_CONFIG = {
  WELCOME_BONUS_AMOUNT: 10.000,  // Initial allocation for new users
  DECIMAL_PRECISION: 3,           // Number of decimal places
  REWARD_RATIO: 200,              // 1 GG Coin per 200 KES
} as const;
