/**
 * Error Logging Utility with Sensitive Data Filtering
 * Ensures that logged errors don't contain sensitive information
 * Requirements: 4.4
 */

// Patterns to detect and redact sensitive information
const SENSITIVE_PATTERNS = [
  // Tokens and API keys
  { pattern: /bearer\s+[\w-]+/gi, replacement: 'bearer [REDACTED]' },
  { pattern: /token["\s:=]+[\w.-]+/gi, replacement: 'token: [REDACTED]' },
  { pattern: /api[_-]?key["\s:=]+[\w-]+/gi, replacement: 'api_key: [REDACTED]' },
  { pattern: /access[_-]?token["\s:=]+[\w.-]+/gi, replacement: 'access_token: [REDACTED]' },
  { pattern: /refresh[_-]?token["\s:=]+[\w.-]+/gi, replacement: 'refresh_token: [REDACTED]' },
  
  // Passwords
  { pattern: /password["\s:=]+[^\s,}"]+/gi, replacement: 'password: [REDACTED]' },
  { pattern: /"password":\s*"[^"]+"/gi, replacement: '"password": "[REDACTED]"' },
  
  // Email addresses (partial redaction - keep domain for debugging)
  { pattern: /([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, replacement: (_match: string, user: string, domain: string) => {
    const redactedUser = user.length > 2 ? user.substring(0, 2) + '***' : '***';
    return `${redactedUser}@${domain}`;
  }},
  
  // Phone numbers (various formats)
  { pattern: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, replacement: '***-***-****' },
  { pattern: /\+\d{1,3}\s?\d{3,14}/g, replacement: '+*** ********' },
  
  // Credit card numbers
  { pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, replacement: '**** **** **** ****' },
  
  // Social security numbers
  { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: '***-**-****' },
  
  // JWT tokens (basic detection)
  { pattern: /eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g, replacement: '[JWT_TOKEN_REDACTED]' },
  
  // Transaction hashes (0x followed by 64 hex characters) - must come before addresses
  { pattern: /0x[a-fA-F0-9]{64}/g, replacement: (match: string) => {
    // Keep first 6 and last 6 characters for debugging
    return `${match.substring(0, 6)}...${match.substring(match.length - 6)}`;
  }},
  
  // Web3 addresses (Ethereum/Polygon - 0x followed by 40 hex characters)
  { pattern: /0x[a-fA-F0-9]{40}/g, replacement: (match: string) => {
    // Keep first 6 and last 4 characters for debugging
    return `${match.substring(0, 6)}...${match.substring(match.length - 4)}`;
  }},
  
  // Additional Web3 patterns
  { pattern: /wallet[_-]?address["\s:=]+0x[a-fA-F0-9]{40}/gi, replacement: 'wallet_address: [REDACTED]' },
  { pattern: /contract[_-]?address["\s:=]+0x[a-fA-F0-9]{40}/gi, replacement: 'contract_address: [REDACTED]' },
  
  // Extended transaction hash patterns
  { pattern: /tx[_-]?hash["\s:=]+0x[a-fA-F0-9]{64}/gi, replacement: 'tx_hash: [REDACTED]' },
  { pattern: /transaction[_-]?hash["\s:=]+0x[a-fA-F0-9]{64}/gi, replacement: 'transaction_hash: [REDACTED]' },
  
  // Private keys (various formats - be aggressive with redaction)
  { pattern: /private[_-]?key["\s:=]+[0-9a-fA-F]{64}/gi, replacement: 'private_key: [REDACTED]' },
  { pattern: /priv["\s:=]+[0-9a-fA-F]{64}/gi, replacement: 'priv: [REDACTED]' },
  
  // Age data (dates of birth in various formats)
  { pattern: /\b(19|20)\d{2}[-/](0[1-9]|1[0-2])[-/](0[1-9]|[12]\d|3[01])\b/g, replacement: '[DOB_REDACTED]' },
  { pattern: /date[_-]?of[_-]?birth["\s:=]+[^\s,}"]+/gi, replacement: 'date_of_birth: [REDACTED]' },
  { pattern: /dob["\s:=]+[^\s,}"]+/gi, replacement: 'dob: [REDACTED]' },
  { pattern: /"dateOfBirth":\s*"[^"]+"/gi, replacement: '"dateOfBirth": "[REDACTED]"' },
];

/**
 * Sanitizes a string by removing or redacting sensitive information
 * @param text - The text to sanitize
 * @returns Sanitized text with sensitive data redacted
 */
export function sanitizeString(text: string): string {
  if (!text || typeof text !== 'string') {
    return text;
  }

  let sanitized = text;

  // Apply all sensitive patterns
  for (const { pattern, replacement } of SENSITIVE_PATTERNS) {
    if (typeof replacement === 'function') {
      sanitized = sanitized.replace(pattern, replacement as any);
    } else {
      sanitized = sanitized.replace(pattern, replacement);
    }
  }

  return sanitized;
}

/**
 * Sanitizes an object by recursively removing sensitive data
 * Implements deep sanitization for nested objects and arrays
 * @param obj - The object to sanitize
 * @param depth - Current recursion depth (prevents infinite loops)
 * @param maxDepth - Maximum recursion depth (default: 10)
 * @returns Sanitized object with sensitive data redacted
 */
export function sanitizeObject(obj: any, depth: number = 0, maxDepth: number = 10): any {
  // Use the enhanced deep sanitization by default
  return sanitizeObjectDeep(obj, new WeakSet(), depth, maxDepth);
}

/**
 * Legacy sanitizeObject implementation (kept for backward compatibility)
 * @param obj - The object to sanitize
 * @param depth - Current recursion depth (prevents infinite loops)
 * @param maxDepth - Maximum recursion depth (default: 10)
 * @returns Sanitized object with sensitive data redacted
 */
export function sanitizeObjectLegacy(obj: any, depth: number = 0, maxDepth: number = 10): any {
  // Prevent infinite recursion
  if (depth > maxDepth) {
    return '[MAX_DEPTH_EXCEEDED]';
  }

  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle primitive types
  if (typeof obj !== 'object') {
    if (typeof obj === 'string') {
      return sanitizeString(obj);
    }
    return obj;
  }

  // Handle Date objects
  if (obj instanceof Date) {
    return obj;
  }

  // Handle Error objects
  if (obj instanceof Error) {
    return {
      name: obj.name,
      message: sanitizeString(obj.message),
      stack: obj.stack ? sanitizeString(obj.stack) : undefined,
    };
  }

  // Handle arrays - deep sanitization
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, depth + 1, maxDepth));
  }

  // Handle objects - deep sanitization
  const sanitized: any = {};
  const sensitiveKeys = [
    'password', 'token', 'secret', 'key', 'api_key', 'apikey', 'accesstoken', 'refreshtoken',
    'privatekey', 'private_key', 'mnemonic', 'seed', 'seedphrase', 'seed_phrase',
    'dateofbirth', 'date_of_birth', 'dob', 'ssn', 'socialsecuritynumber',
    'creditcard', 'credit_card', 'cvv', 'pin', 'authorization', 'auth',
    // Web3 specific keys
    'walletaddress', 'wallet_address', 'contractaddress', 'contract_address',
    'txhash', 'tx_hash', 'transactionhash', 'transaction_hash', 'blockhash', 'block_hash',
    // Additional sensitive keys
    'signature', 'nonce', 'salt', 'hash', 'digest', 'checksum',
  ];

  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    
    // Completely redact known sensitive keys
    if (sensitiveKeys.some(sk => lowerKey.includes(sk))) {
      sanitized[key] = '[REDACTED]';
    } 
    // Recursively sanitize nested objects and arrays
    else if (value !== null && typeof value === 'object') {
      sanitized[key] = sanitizeObject(value, depth + 1, maxDepth);
    } 
    // Sanitize string values
    else if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } 
    // Keep other primitive values as-is
    else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Logs an error with sensitive data filtering
 * @param context - Context string (e.g., 'AuthService', 'LoginPage')
 * @param error - The error to log
 * @param additionalData - Additional data to log (will be sanitized)
 */
export function logError(context: string, error: any, additionalData?: any): void {
  const timestamp = new Date().toISOString();
  
  // Sanitize error message
  const errorMessage = error?.message ? sanitizeString(error.message) : 'Unknown error';
  
  // Sanitize additional data
  const sanitizedData = additionalData ? sanitizeObject(additionalData) : undefined;
  
  // Log to console (in production, this could be sent to a logging service)
  console.error(`[${timestamp}] [${context}] Error:`, {
    message: errorMessage,
    type: error?.name || 'Error',
    ...(sanitizedData && { data: sanitizedData }),
  });
  
  // In production, you might want to send this to a logging service
  // Example: sendToLoggingService({ timestamp, context, errorMessage, sanitizedData });
}

/**
 * Logs authentication errors specifically
 * Includes additional OAuth-specific sanitization
 * @param context - Context string
 * @param error - The error to log
 * @param additionalData - Additional data to log
 */
export function logAuthError(context: string, error: any, additionalData?: any): void {
  // Add OAuth-specific sanitization
  const sanitizedError = {
    ...error,
    message: error?.message ? sanitizeString(error.message) : undefined,
  };
  
  logError(context, sanitizedError, additionalData);
}

/**
 * Logs Web3 errors specifically
 * Includes additional Web3-specific sanitization for addresses and transaction hashes
 * @param context - Context string
 * @param error - The error to log
 * @param additionalData - Additional data to log (transaction details, addresses, etc.)
 */
export function logWeb3Error(context: string, error: any, additionalData?: any): void {
  // Sanitize Web3-specific data
  const sanitizedData = additionalData ? sanitizeWeb3Data(additionalData) : undefined;
  
  const sanitizedError = {
    ...error,
    message: error?.message ? sanitizeString(error.message) : undefined,
  };
  
  logError(context, sanitizedError, sanitizedData);
}

/**
 * Logs curation errors specifically
 * Includes age data sanitization
 * @param context - Context string
 * @param error - The error to log
 * @param additionalData - Additional data to log (user profile, age data, etc.)
 */
export function logCurationError(context: string, error: any, additionalData?: any): void {
  // Sanitize age-related data
  const sanitizedData = additionalData ? sanitizeAgeData(additionalData) : undefined;
  
  const sanitizedError = {
    ...error,
    message: error?.message ? sanitizeString(error.message) : undefined,
  };
  
  logError(context, sanitizedError, sanitizedData);
}

/**
 * Sanitizes Web3-specific data (addresses, transaction hashes, private keys)
 * @param data - The data to sanitize
 * @returns Sanitized data with Web3 information redacted appropriately
 */
export function sanitizeWeb3Data(data: any): any {
  if (!data) {
    return data;
  }

  if (typeof data === 'string') {
    return sanitizeString(data);
  }

  if (typeof data === 'object') {
    const sanitized = sanitizeObject(data);
    
    // Additional Web3-specific sanitization
    const web3Keys = ['address', 'from', 'to', 'hash', 'transactionHash', 'blockHash'];
    
    for (const key of web3Keys) {
      if (sanitized[key] && typeof sanitized[key] === 'string') {
        // Keep partial information for debugging
        const value = sanitized[key];
        if (value.startsWith('0x') && value.length === 42) {
          // Ethereum address
          sanitized[key] = `${value.substring(0, 6)}...${value.substring(value.length - 4)}`;
        } else if (value.startsWith('0x') && value.length === 66) {
          // Transaction hash
          sanitized[key] = `${value.substring(0, 10)}...${value.substring(value.length - 6)}`;
        }
      }
    }
    
    return sanitized;
  }

  return data;
}

/**
 * Sanitizes age-related data (date of birth, age)
 * @param data - The data to sanitize
 * @returns Sanitized data with age information redacted
 */
export function sanitizeAgeData(data: any): any {
  if (!data) {
    return data;
  }

  if (typeof data === 'object') {
    const sanitized = { ...data };
    
    // Redact specific age-related fields
    const ageKeys = ['dateOfBirth', 'date_of_birth', 'dob', 'birthDate', 'birth_date'];
    
    for (const key of ageKeys) {
      if (sanitized[key]) {
        sanitized[key] = '[REDACTED]';
      }
    }
    
    // Keep age cohort but redact exact age if present
    if (sanitized.age && typeof sanitized.age === 'number') {
      // Convert to age range for privacy
      const age = sanitized.age;
      if (age < 18) {
        sanitized.age = '13-17';
      } else if (age < 25) {
        sanitized.age = '18-24';
      } else if (age < 35) {
        sanitized.age = '25-34';
      } else if (age < 50) {
        sanitized.age = '35-49';
      } else {
        sanitized.age = '50+';
      }
    }
    
    return sanitized;
  }

  return data;
}

/**
 * Enhanced deep sanitization for complex nested objects
 * Handles circular references and provides more thorough sanitization
 * @param obj - The object to sanitize
 * @param visited - Set of visited objects to prevent circular references
 * @param depth - Current recursion depth
 * @param maxDepth - Maximum recursion depth
 * @returns Sanitized object with sensitive data redacted
 */
export function sanitizeObjectDeep(
  obj: any, 
  visited: WeakSet<object> = new WeakSet(), 
  depth: number = 0, 
  maxDepth: number = 15
): any {
  // Prevent infinite recursion
  if (depth > maxDepth) {
    return '[MAX_DEPTH_EXCEEDED]';
  }

  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle primitive types
  if (typeof obj !== 'object') {
    if (typeof obj === 'string') {
      return sanitizeString(obj);
    }
    return obj;
  }

  // Handle circular references
  if (visited.has(obj)) {
    return '[CIRCULAR_REFERENCE]';
  }
  visited.add(obj);

  // Handle Date objects
  if (obj instanceof Date) {
    return obj;
  }

  // Handle Error objects
  if (obj instanceof Error) {
    return {
      name: obj.name,
      message: sanitizeString(obj.message),
      stack: obj.stack ? sanitizeString(obj.stack) : undefined,
      code: (obj as any).code,
      severity: (obj as any).severity,
    };
  }

  // Handle arrays - deep sanitization
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObjectDeep(item, visited, depth + 1, maxDepth));
  }

  // Handle objects - deep sanitization with enhanced patterns
  const sanitized: any = {};
  const sensitiveKeys = [
    'password', 'token', 'secret', 'key', 'api_key', 'apikey', 'accesstoken', 'refreshtoken',
    'privatekey', 'private_key', 'mnemonic', 'seed', 'seedphrase', 'seed_phrase',
    'dateofbirth', 'date_of_birth', 'dob', 'ssn', 'socialsecuritynumber',
    'creditcard', 'credit_card', 'cvv', 'pin', 'authorization', 'auth',
    // Web3 specific keys
    'walletaddress', 'wallet_address', 'contractaddress', 'contract_address',
    'txhash', 'tx_hash', 'transactionhash', 'transaction_hash', 'blockhash', 'block_hash',
    // Additional sensitive keys
    'signature', 'nonce', 'salt', 'hash', 'digest', 'checksum',
    // OAuth and session keys
    'clientsecret', 'client_secret', 'sessionid', 'session_id', 'csrf', 'xsrf',
  ];

  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    
    // Completely redact known sensitive keys
    if (sensitiveKeys.some(sk => lowerKey.includes(sk))) {
      sanitized[key] = '[REDACTED]';
    } 
    // Special handling for Web3 addresses and hashes
    else if (typeof value === 'string' && (
      value.match(/^0x[a-fA-F0-9]{40}$/) || // Ethereum address
      value.match(/^0x[a-fA-F0-9]{64}$/)    // Transaction hash
    )) {
      if (value.length === 42) {
        // Ethereum address - keep first 6 and last 4
        sanitized[key] = `${value.substring(0, 6)}...${value.substring(value.length - 4)}`;
      } else if (value.length === 66) {
        // Transaction hash - keep first 10 and last 6
        sanitized[key] = `${value.substring(0, 10)}...${value.substring(value.length - 6)}`;
      } else {
        sanitized[key] = value;
      }
    }
    // Recursively sanitize nested objects and arrays
    else if (value !== null && typeof value === 'object') {
      sanitized[key] = sanitizeObjectDeep(value, visited, depth + 1, maxDepth);
    } 
    // Sanitize string values
    else if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } 
    // Keep other primitive values as-is
    else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Tests if a string contains sensitive information
 * Useful for validation in tests
 * @param text - The text to check
 * @returns true if sensitive data is detected
 */
export function containsSensitiveData(text: string): boolean {
  if (!text || typeof text !== 'string') {
    return false;
  }

  // Check for common sensitive patterns
  const sensitiveIndicators = [
    /bearer\s+[\w-]{20,}/i,
    /token["\s:=]+[\w.-]{20,}/i,
    /password["\s:=]+[^\s,}"]{6,}/i,
    /eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/,
    /0x[a-fA-F0-9]{40}/, // Ethereum addresses
    /0x[a-fA-F0-9]{64}/, // Transaction hashes
    /\b(19|20)\d{2}[-/](0[1-9]|1[0-2])[-/](0[1-9]|[12]\d|3[01])\b/, // Dates of birth
    // Additional patterns
    /client[_-]?secret["\s:=]+[\w-]+/i,
    /session[_-]?id["\s:=]+[\w-]+/i,
    /signature["\s:=]+[\w+/=]+/i,
  ];

  return sensitiveIndicators.some(pattern => pattern.test(text));
}
