import { Link, useLocation } from 'react-router-dom';
import { Icon } from './iconMap';

interface BottomNavItem {
  to: string;
  label: string;
  icon: string;
  badge?: number;
}

interface BottomNavBarProps {
  activeSection?: string;
  unreadNotifications?: number;
}

// Focus: Community Engagement and Sustainability
const bottomNavItems: BottomNavItem[] = [
  {
    to: '/dashboard',
    label: 'Home',
    icon: 'home',
  },
  {
    to: '/challenges',
    label: 'Challenges',
    icon: 'target',
  },
  {
    to: '/social-feed',
    label: 'Community',
    icon: 'users',
  },
  {
    to: '/badges',
    label: 'Badges',
    icon: 'award',
  },
  {
    to: '/profile',
    label: 'Profile',
    icon: 'user',
  },
];

export function BottomNavBar({ activeSection, unreadNotifications = 0 }: BottomNavBarProps) {
  const location = useLocation();

  // Determine if an item is active
  const isActive = (itemPath: string) => {
    if (activeSection) {
      return itemPath.includes(activeSection);
    }
    return location.pathname === itemPath || location.pathname.startsWith(`${itemPath}/`);
  };

  // Get badge count for specific items
  const getBadgeCount = (itemPath: string): number | undefined => {
    if (itemPath === '/profile' && unreadNotifications > 0) {
      return unreadNotifications;
    }
    return undefined;
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 md:hidden safe-area-inset-bottom"
      role="navigation"
      aria-label="Mobile bottom navigation"
    >
      <div className="flex items-center justify-around h-16 px-2">
        {bottomNavItems.map((item) => {
          const active = isActive(item.to);
          const badgeCount = getBadgeCount(item.to);

          return (
            <Link
              key={item.to}
              to={item.to}
              className={`
                flex flex-col items-center justify-center flex-1 h-full
                transition-all duration-200 relative group
                ${active ? 'text-green-600' : 'text-gray-600'}
              `}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
            >
              {/* Icon Container */}
              <div className="relative">
                <Icon
                  name={item.icon}
                  className={`
                    w-6 h-6 transition-transform duration-200
                    ${active ? 'scale-110' : 'group-active:scale-95'}
                  `}
                />
                
                {/* Badge */}
                {badgeCount && badgeCount > 0 && (
                  <span className="absolute -top-2 -right-2 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
                    {badgeCount > 9 ? '9+' : badgeCount}
                  </span>
                )}
              </div>

              {/* Label */}
              <span
                className={`
                  text-[10px] font-medium mt-1 transition-all duration-200
                  ${active ? 'opacity-100' : 'opacity-70'}
                `}
              >
                {item.label}
              </span>

              {/* Active Indicator */}
              {active && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-green-600 rounded-b-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
