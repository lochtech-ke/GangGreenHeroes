import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, X } from 'lucide-react';
import type { QuickAction } from './types';
import type { UserRole } from '../../types/user.types';
import { Icon } from './iconMap';
import { getQuickActionPreferences } from '../../services/quickActions.service';

interface QuickActionsProps {
  userId?: string;
  userRole?: UserRole;
  maxVisible?: number;
}

export function QuickActions({ userId, userRole, maxVisible = 4 }: QuickActionsProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [customActionIds, setCustomActionIds] = useState<string[] | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Default quick actions - Community Engagement
  const defaultActions: QuickAction[] = [
    {
      id: 'share-story',
      label: 'Share Story',
      icon: 'edit',
      onClick: () => {
        navigate('/social-feed');
        setIsOpen(false);
      },
    },
    {
      id: 'view-challenges',
      label: 'View Challenges',
      icon: 'target',
      onClick: () => {
        navigate('/challenges');
        setIsOpen(false);
      },
    },
    {
      id: 'join-initiative',
      label: 'Join Initiative',
      icon: 'users',
      onClick: () => {
        navigate('/initiatives');
        setIsOpen(false);
      },
    },
    {
      id: 'invite-friend',
      label: 'Invite Friend',
      icon: 'user-plus',
      onClick: () => {
        navigate('/referrals');
        setIsOpen(false);
      },
    },
    {
      id: 'create-initiative',
      label: 'Create Initiative',
      icon: 'plus',
      onClick: () => {
        navigate('/initiatives/create');
        setIsOpen(false);
      },
      roles: ['organization'],
    },
  ];

  // Load user preferences
  useEffect(() => {
    if (!userId) return;

    const loadPreferences = async () => {
      const preferences = await getQuickActionPreferences(userId);
      setCustomActionIds(preferences);
    };

    loadPreferences();
  }, [userId]);

  // Filter actions by user role
  const availableActions = defaultActions.filter((action) => {
    if (!action.roles) return true;
    if (!userRole) return false;
    return action.roles.includes(userRole);
  });

  // Get actions to display (custom or default)
  const displayActions = customActionIds
    ? availableActions.filter((action) => customActionIds.includes(action.id))
    : availableActions;

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close dropdown on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  return (
    <div ref={dropdownRef} className="relative">
      {/* Quick Actions Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg
          text-sm font-medium transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
          ${
            isOpen
              ? 'bg-green-600 text-white'
              : 'bg-green-50 text-green-700 hover:bg-green-100'
          }
        `}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label="Quick actions menu"
      >
        <Zap className="w-4 h-4" />
        <span className="hidden sm:inline">Quick Actions</span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <div
            className="fixed inset-0 bg-black bg-opacity-25 z-40 md:hidden"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          <div
            className={`
              absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 z-50
              animate-in fade-in slide-in-from-top-2 duration-200
            `}
            role="menu"
            aria-orientation="vertical"
            aria-label="Quick actions menu"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-green-600" />
                <h3 className="text-sm font-semibold text-gray-900">Quick Actions</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close quick actions"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Action Items */}
            <div className="py-2">
              {displayActions.slice(0, maxVisible).map((action) => (
                <button
                  key={action.id}
                  onClick={action.onClick}
                  className="
                    w-full flex items-center gap-3 px-4 py-3 text-left
                    text-gray-700 hover:bg-gray-50 transition-colors duration-150
                    focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-500
                  "
                  role="menuitem"
                >
                  <div className="flex-shrink-0 text-green-600">
                    <Icon name={action.icon} className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-medium">{action.label}</span>
                </button>
              ))}
            </div>

            {/* Footer - Customize Link */}
            <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => {
                  navigate('/settings');
                  setIsOpen(false);
                }}
                className="text-xs text-gray-600 hover:text-green-600 transition-colors"
              >
                Customize quick actions →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
