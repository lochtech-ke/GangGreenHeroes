import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Settings, LogOut, ChevronDown, Map, Award, Coins } from 'lucide-react';
import type { User as UserType } from '../../types/user.types';
import { ggCoinService } from '../../services/ggCoin.service';

interface UserMenuProps {
  user: UserType;
  onLogout: () => Promise<void>;
}

export function UserMenu({ user, onLogout }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [ggCoinBalance, setGGCoinBalance] = useState<number>(0);
  const [userLevel, setUserLevel] = useState<number>(1);
  const [userPoints, setUserPoints] = useState<number>(0);
  const menuRef = useRef<HTMLDivElement>(null);

  // Load user stats
  useEffect(() => {
    const loadUserStats = async () => {
      try {
        // Load GG Coin balance
        const balance = await ggCoinService.getBalance(user.id);
        setGGCoinBalance(balance);

        // Load user level and points from gamification
        // This would come from a gamification service
        // For now, using placeholder values
        setUserLevel((user.profile as any)?.level || 1);
        setUserPoints((user.profile as any)?.points || 0);
      } catch (error) {
        console.error('Error loading user stats:', error);
      }
    };

    if (user.id) {
      loadUserStats();
    }
  }, [user.id, user.profile]);

  // Get user initials for avatar
  const getInitials = () => {
    const name = user.profile?.full_name || user.email;
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Close menu when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Handle logout
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await onLogout();
    } catch (error) {
      console.error('Logout failed:', error);
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* User Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label="User menu"
      >
        {/* Avatar with Level Badge */}
        <div className="relative">
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-700 rounded-full flex items-center justify-center text-white text-xs font-bold ring-2 ring-white">
            {getInitials()}
          </div>
          {/* Level Badge */}
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-white">
            {userLevel}
          </div>
        </div>
        {/* User Name */}
        <span className="hidden md:block">
          {user.profile?.full_name || user.email}
        </span>
        {/* Dropdown Icon */}
        <ChevronDown
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl ring-1 ring-black ring-opacity-5 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
          role="menu"
          aria-orientation="vertical"
        >
          <div className="py-1">
            {/* User Info Header */}
            <div className="px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-700 rounded-full flex items-center justify-center text-white text-sm font-bold ring-2 ring-white">
                    {getInitials()}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-xs font-bold text-white border-2 border-white">
                    {userLevel}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {user.profile?.full_name || 'User'}
                  </p>
                  <p className="text-xs text-gray-600 truncate">{user.email}</p>
                  <p className="text-xs text-gray-500 mt-0.5 capitalize">
                    {user.role}
                  </p>
                </div>
              </div>

              {/* User Stats */}
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="bg-white rounded-lg px-2 py-1.5 text-center">
                  <p className="text-xs text-gray-500">Level</p>
                  <p className="text-sm font-bold text-green-600">{userLevel}</p>
                </div>
                <div className="bg-white rounded-lg px-2 py-1.5 text-center">
                  <p className="text-xs text-gray-500">Points</p>
                  <p className="text-sm font-bold text-blue-600">{userPoints.toLocaleString()}</p>
                </div>
              </div>

              {/* GG Coins */}
              <div className="mt-2 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg px-3 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-yellow-600" />
                  <span className="text-xs font-medium text-gray-700">GG Coins</span>
                </div>
                <span className="text-sm font-bold text-yellow-700">
                  {ggCoinBalance.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-1">
              {/* Profile Link */}
              <Link
                to="/profile"
                className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:bg-gray-50"
                role="menuitem"
                onClick={() => setIsOpen(false)}
                tabIndex={isOpen ? 0 : -1}
              >
                <User className="w-4 h-4 mr-3 text-gray-400" />
                <span>Profile</span>
              </Link>

              {/* My Journey Link */}
              <Link
                to="/journey"
                className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:bg-gray-50"
                role="menuitem"
                onClick={() => setIsOpen(false)}
                tabIndex={isOpen ? 0 : -1}
              >
                <Map className="w-4 h-4 mr-3 text-gray-400" />
                <span>My Journey</span>
              </Link>

              {/* My Badges Link */}
              <Link
                to="/badges"
                className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:bg-gray-50"
                role="menuitem"
                onClick={() => setIsOpen(false)}
                tabIndex={isOpen ? 0 : -1}
              >
                <Award className="w-4 h-4 mr-3 text-gray-400" />
                <span>My Badges</span>
              </Link>

              {/* Settings Link */}
              <Link
                to="/settings"
                className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:bg-gray-50"
                role="menuitem"
                onClick={() => setIsOpen(false)}
                tabIndex={isOpen ? 0 : -1}
              >
                <Settings className="w-4 h-4 mr-3 text-gray-400" />
                <span>Settings</span>
              </Link>
            </div>

            {/* Logout Button */}
            <div className="border-t border-gray-100 py-1">
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full flex items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:bg-red-50"
                role="menuitem"
                tabIndex={isOpen ? 0 : -1}
              >
                <LogOut className="w-4 h-4 mr-3" />
                <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
