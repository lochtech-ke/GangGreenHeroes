import type { UserRole } from '../../types/user.types';
import type { NavItemConfig, NavGroupConfig } from './types';

// Standalone navigation items (not in groups)
export const standaloneNavigationItems: NavItemConfig[] = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: 'home',
  },
  {
    to: '/impact-dashboard',
    label: 'Impact Dashboard',
    icon: 'bar-chart-3',
    description: 'View real-time conservation impact metrics',
  },
  {
    to: '/challenges',
    label: 'Challenges',
    icon: 'target',
    description: 'Complete micro-challenges and earn rewards',
  },
  {
    to: '/badges',
    label: 'My Badges',
    icon: 'award',
    description: 'View your badge progression and achievements',
  },
  {
    to: '/marketplace',
    label: 'Badge Marketplace',
    icon: 'shopping-bag',
    description: 'Purchase NFT badges and earn GG Coins',
  },
  {
    to: '/leaderboard',
    label: 'Leaderboard',
    icon: 'trophy',
    description: 'See top community contributors',
  },
  {
    to: '/coins',
    label: 'GG Coins',
    icon: 'coins',
    description: 'Manage your GG Coins and track referrals',
  },
];

// Navigation groups for mega menu dropdowns
// Track 3 Focus: Community Engagement and Sustainability
export const navigationGroups: NavGroupConfig[] = [
  {
    id: 'community',
    label: 'Community',
    icon: 'users',
    items: [
      {
        to: '/communities',
        label: 'Community Hub',
        icon: 'users',
        description: 'Browse and join local climate action groups',
      },
      {
        to: '/social-feed',
        label: 'Social Feed',
        icon: 'hash',
        description: 'Share and discover conservation stories',
      },
      {
        to: '/forum',
        label: 'Forum',
        icon: 'message-square',
        description: 'Discuss with the community',
      },
      {
        to: '/events',
        label: 'Events',
        icon: 'calendar',
        description: 'Join local conservation events',
      },
    ],
  },
  {
    id: 'initiatives',
    label: 'Initiatives',
    icon: 'tree-pine',
    items: [
      {
        to: '/initiatives',
        label: 'Browse Initiatives',
        icon: 'tree-pine',
        description: 'Browse and join conservation projects',
      },
      {
        to: '/missions',
        label: 'Climate Missions',
        icon: 'target',
        description: 'Join climate action missions and earn rewards',
      },
      {
        to: '/journey',
        label: 'My Journey',
        icon: 'map',
        description: 'Your personal conservation journey',
      },
      {
        to: '/initiatives/create',
        label: 'Create Initiative',
        icon: 'plus',
        description: 'Start a new conservation project',
        roles: ['organization'],
      },
    ],
  },
  {
    id: 'governance',
    label: 'Governance',
    icon: 'vote',
    items: [
      {
        to: '/governance',
        label: 'Overview',
        icon: 'layout-dashboard',
        description: 'Governance dashboard and token balance',
      },
      {
        to: '/governance/proposals',
        label: 'Proposals',
        icon: 'file-text',
        description: 'Vote on platform features and improvements',
      },
      {
        to: '/governance/petitions',
        label: 'Petitions',
        icon: 'pen-tool',
        description: 'Support community initiatives with signatures',
      },
      {
        to: '/governance/delegate',
        label: 'Delegate Voting',
        icon: 'users',
        description: 'Delegate your voting power',
      },
    ],
  },
  {
    id: 'learning',
    label: 'Learning',
    icon: 'book-open',
    items: [
      {
        to: '/learning',
        label: 'Learning Dashboard',
        icon: 'book-open',
        description: 'Browse educational modules and track progress',
      },
      {
        to: '/certificates',
        label: 'My Certificates',
        icon: 'award',
        description: 'View your earned certificates',
      },
      {
        to: '/learn',
        label: 'Ask Green Mentor',
        icon: 'message-circle',
        description: 'Get climate questions answered',
      },
    ],
  },
];

// Admin-specific navigation items
export const adminNavigationItems: NavItemConfig[] = [
  {
    to: '/admin/moderation',
    label: 'Moderation',
    icon: 'shield',
    description: 'Content moderation dashboard',
    roles: ['admin'],
  },
  {
    to: '/admin/analytics',
    label: 'Analytics',
    icon: 'bar-chart-3',
    description: 'Platform analytics and insights',
    roles: ['admin'],
  },
];

// Footer navigation items (Settings & Profile)
export const footerNavigationItems: NavItemConfig[] = [
  {
    to: '/settings',
    label: 'Settings',
    icon: 'settings',
    description: 'Manage your account settings',
  },
  {
    to: '/profile',
    label: 'Profile',
    icon: 'user',
    description: 'View and edit your profile',
  },
];

/**
 * Get footer navigation items filtered by user role
 * @param userRole - The role of the current user
 * @returns Array of footer navigation items
 */
export function getFooterItems(userRole?: UserRole): NavItemConfig[] {
  return filterByRole(footerNavigationItems, userRole);
}

/**
 * Filter navigation items based on user role
 * @param items - Array of navigation items to filter
 * @param userRole - The role of the current user
 * @returns Filtered array of navigation items
 */
function filterByRole(items: NavItemConfig[], userRole?: UserRole): NavItemConfig[] {
  if (!userRole) return items.filter((item) => !item.roles);
  
  return items.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(userRole);
  });
}

/**
 * Get navigation groups filtered by user role
 * @param userRole - The role of the current user
 * @returns Array of navigation groups with filtered items
 */
export function getNavigationGroups(userRole?: UserRole): NavGroupConfig[] {
  return navigationGroups.map((group) => ({
    ...group,
    items: filterByRole(group.items, userRole),
  }));
}

/**
 * Get standalone navigation items filtered by user role
 * @param userRole - The role of the current user
 * @returns Array of standalone navigation items
 */
export function getStandaloneItems(userRole?: UserRole): NavItemConfig[] {
  return filterByRole(standaloneNavigationItems, userRole);
}

/**
 * Get admin navigation items if user has admin role
 * @param userRole - The role of the current user
 * @returns Array of admin navigation items or empty array
 */
export function getAdminItems(userRole?: UserRole): NavItemConfig[] {
  if (userRole === 'admin') {
    return adminNavigationItems;
  }
  return [];
}

/**
 * Get all navigation items (flattened) filtered by user role
 * @param userRole - The role of the current user
 * @returns Array of all navigation items the user has access to
 */
export function getAllNavigationItems(userRole?: UserRole): NavItemConfig[] {
  const standalone = getStandaloneItems(userRole);
  const groups = getNavigationGroups(userRole);
  const groupItems = groups.flatMap((group) => group.items);
  const admin = getAdminItems(userRole);
  
  return [...standalone, ...groupItems, ...admin];
}

/**
 * Check if a user has access to a specific route
 * @param route - The route to check
 * @param userRole - The role of the current user
 * @returns True if the user has access to the route
 */
export function hasRouteAccess(route: string, userRole?: UserRole): boolean {
  const items = getAllNavigationItems(userRole);
  return items.some((item) => item.to === route || route.startsWith(`${item.to}/`));
}

/**
 * Get the active navigation group for a given route
 * @param route - The current route
 * @returns The ID of the active navigation group or null
 */
export function getActiveGroup(route: string): string | null {
  for (const group of navigationGroups) {
    const isActive = group.items.some(
      (item) => item.to === route || route.startsWith(`${item.to}/`)
    );
    if (isActive) return group.id;
  }
  return null;
}

// Legacy support - keep for backward compatibility
export const baseNavigationItems = standaloneNavigationItems;
export function getNavigationItems(userRole?: UserRole): NavItemConfig[] {
  return getAllNavigationItems(userRole);
}
