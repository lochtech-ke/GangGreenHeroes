/**
 * Redirect Destination Utility
 * Manages preservation of intended destinations during OAuth flows
 * Requirements: 5.5
 */

const REDIRECT_DESTINATION_KEY = 'oauth_redirect_destination';
const DESTINATION_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

export interface RedirectDestination {
  path: string;
  timestamp: number;
  search?: string;
  hash?: string;
}

/**
 * Validates if a destination path is safe and allowed
 */
export function isValidDestination(path: string): boolean {
  if (!path || typeof path !== 'string') {
    return false;
  }

  // Remove leading slash for consistency
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;

  // List of allowed destination patterns
  const allowedPatterns = [
    /^dashboard(\/.*)?$/,           // Dashboard and sub-pages
    /^profile(\/.*)?$/,             // Profile pages
    /^initiatives(\/.*)?$/,         // Initiatives pages
    /^marketplace(\/.*)?$/,         // Marketplace pages
    /^trees(\/.*)?$/,               // Tree registry pages
    /^community(\/.*)?$/,           // Community pages
    /^settings(\/.*)?$/,            // Settings pages
    /^badges(\/.*)?$/,              // Badge pages
    /^missions(\/.*)?$/,            // Mission pages
    /^$/, // Root/home page
  ];

  // Blocked patterns for security
  const blockedPatterns = [
    /^auth\//,                      // Auth pages (prevent loops)
    /^admin\//,                     // Admin pages (require separate auth)
    /^api\//,                       // API endpoints
    /^_/,                           // Internal routes
    /javascript:/i,                 // XSS prevention
    /data:/i,                       // Data URLs
    /vbscript:/i,                   // VBScript
    /file:/i,                       // File URLs
    /ftp:/i,                        // FTP URLs
  ];

  // Check if path is blocked
  if (blockedPatterns.some(pattern => pattern.test(normalizedPath))) {
    return false;
  }

  // Check if path matches allowed patterns
  return allowedPatterns.some(pattern => pattern.test(normalizedPath));
}

/**
 * Stores the intended destination before OAuth redirect
 */
export function storeRedirectDestination(destination: string): void {
  try {
    // Validate the destination first
    if (!isValidDestination(destination)) {
      console.warn('[RedirectDestination] Invalid destination, not storing:', destination);
      return;
    }

    // Parse the destination to separate path, search, and hash
    const url = new URL(destination, window.location.origin);
    
    const redirectData: RedirectDestination = {
      path: url.pathname,
      timestamp: Date.now(),
      search: url.search || undefined,
      hash: url.hash || undefined,
    };

    sessionStorage.setItem(REDIRECT_DESTINATION_KEY, JSON.stringify(redirectData));
    
    console.log('[RedirectDestination] Stored destination:', redirectData);
  } catch (error) {
    console.error('[RedirectDestination] Error storing destination:', error);
  }
}

/**
 * Retrieves and clears the stored redirect destination
 */
export function getAndClearRedirectDestination(): string | null {
  try {
    const stored = sessionStorage.getItem(REDIRECT_DESTINATION_KEY);
    
    if (!stored) {
      return null;
    }

    // Clear the stored destination immediately to prevent reuse
    sessionStorage.removeItem(REDIRECT_DESTINATION_KEY);

    const redirectData: RedirectDestination = JSON.parse(stored);

    // Check if the destination has expired
    if (Date.now() - redirectData.timestamp > DESTINATION_EXPIRY_MS) {
      console.log('[RedirectDestination] Destination expired, ignoring');
      return null;
    }

    // Validate the stored destination
    if (!isValidDestination(redirectData.path)) {
      console.warn('[RedirectDestination] Stored destination is invalid, ignoring:', redirectData.path);
      return null;
    }

    // Reconstruct the full destination URL
    let destination = redirectData.path;
    
    if (redirectData.search) {
      destination += redirectData.search;
    }
    
    if (redirectData.hash) {
      destination += redirectData.hash;
    }

    console.log('[RedirectDestination] Retrieved destination:', destination);
    return destination;
  } catch (error) {
    console.error('[RedirectDestination] Error retrieving destination:', error);
    
    // Clear potentially corrupted data
    try {
      sessionStorage.removeItem(REDIRECT_DESTINATION_KEY);
    } catch (clearError) {
      console.error('[RedirectDestination] Error clearing corrupted data:', clearError);
    }
    
    return null;
  }
}

/**
 * Clears any stored redirect destination without returning it
 */
export function clearRedirectDestination(): void {
  try {
    sessionStorage.removeItem(REDIRECT_DESTINATION_KEY);
    console.log('[RedirectDestination] Cleared stored destination');
  } catch (error) {
    console.error('[RedirectDestination] Error clearing destination:', error);
  }
}

/**
 * Gets the current page path for storing as a destination
 * Excludes auth-related pages and other invalid destinations
 */
export function getCurrentDestination(): string | null {
  const currentPath = window.location.pathname;
  
  // Don't store auth pages or other invalid destinations
  if (!isValidDestination(currentPath)) {
    return null;
  }

  // Include search params and hash if present
  let destination = currentPath;
  
  if (window.location.search) {
    destination += window.location.search;
  }
  
  if (window.location.hash) {
    destination += window.location.hash;
  }

  return destination;
}

/**
 * Utility to store current page as redirect destination before OAuth
 */
export function storeCurrentPageAsDestination(): void {
  const currentDestination = getCurrentDestination();
  
  if (currentDestination) {
    storeRedirectDestination(currentDestination);
  }
}