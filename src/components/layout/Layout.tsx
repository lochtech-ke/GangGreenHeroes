import { ReactNode, useState } from 'react';
import { Navigation, BottomNavBar } from '../navigation';
import { useAuthContext } from '../../contexts/AuthContext';
import { Search, Bell } from 'lucide-react';
import { UserInitializer } from '../auth/UserInitializer';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user } = useAuthContext();
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Navigation */}
      <Navigation />

      {/* Main Content Wrapper - Add left padding for desktop sidebar */}
      <div className="flex-1 flex flex-col lg:pl-72">
        {/* Top Bar - Desktop Only - Fixed */}
        {user && (
          <div className="hidden lg:block fixed top-0 right-0 left-72 bg-white border-b border-gray-200 px-8 py-4 z-30">
            <div className="flex items-center justify-between gap-4">
              {/* Search Bar */}
              <div className="flex-1 max-w-2xl">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search initiatives, trees, achievements..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50"
                  />
                </div>
              </div>

              {/* Right Section - User Info */}
              <div className="flex items-center gap-4">
                <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-green-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {user.profile?.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="hidden xl:block">
                    <p className="text-sm font-medium text-gray-900">
                      {user.profile?.full_name || user.email?.split('@')[0] || 'User'}
                    </p>
                    <p className="text-xs text-gray-500">Level 12 Hero</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content - Add padding for fixed top bar */}
        <main className="pt-18 pb-20 md:pb-0 lg:pt-20 flex-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>

        {/* Bottom Navigation Bar - Mobile Only */}
        {user && <BottomNavBar />}

        {/* Background User Initialization */}
        <UserInitializer />
      </div>
    </div>
  );
}