/**
 * GGCoinWallet Component Examples
 * 
 * This file demonstrates various usage patterns for the GGCoinWallet component.
 * These examples can be used in Storybook or as reference for implementation.
 */

import React from 'react';
import { GGCoinWallet } from './GGCoinWallet';

/**
 * Example 1: Basic Usage
 * Simple wallet display with default settings
 */
export const BasicExample: React.FC = () => {
  const userId = 'example-user-123';
  
  return (
    <div className="p-4 bg-gray-100">
      <h2 className="text-2xl font-bold mb-4">Basic Wallet Display</h2>
      <GGCoinWallet userId={userId} />
    </div>
  );
};

/**
 * Example 2: Dashboard Integration
 * Wallet as part of a dashboard grid
 */
export const DashboardExample: React.FC = () => {
  const userId = 'example-user-123';
  
  return (
    <div className="p-4 bg-gray-100">
      <h2 className="text-2xl font-bold mb-4">Dashboard Layout</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <GGCoinWallet userId={userId} className="col-span-1" />
        
        {/* Other dashboard widgets */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="font-bold mb-2">Recent Activity</h3>
          <p className="text-gray-600">Activity feed goes here...</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="font-bold mb-2">Achievements</h3>
          <p className="text-gray-600">Badges and achievements...</p>
        </div>
      </div>
    </div>
  );
};

/**
 * Example 3: Profile Page Integration
 * Wallet in a profile sidebar
 */
export const ProfileExample: React.FC = () => {
  const userId = 'example-user-123';
  
  return (
    <div className="p-4 bg-gray-100">
      <h2 className="text-2xl font-bold mb-4">Profile Page</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main content */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4">Profile Information</h3>
          <p className="text-gray-600">User profile details...</p>
        </div>
        
        {/* Sidebar with wallet */}
        <div className="lg:col-span-1 space-y-4">
          <GGCoinWallet userId={userId} />
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="font-bold mb-2">Quick Stats</h3>
            <p className="text-gray-600">Other stats...</p>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Example 4: Compact Header Display
 * Simplified wallet for navigation header
 */
export const CompactExample: React.FC = () => {
  const userId = 'example-user-123';
  
  return (
    <div className="p-4 bg-gray-800">
      <div className="flex items-center justify-between">
        <h1 className="text-white text-xl font-bold">#GangGreen</h1>
        
        {/* Compact wallet in header */}
        <div className="w-64">
          <GGCoinWallet userId={userId} className="shadow-lg" />
        </div>
      </div>
    </div>
  );
};

/**
 * Example 5: Multiple Wallets Comparison
 * Side-by-side wallet displays (e.g., for admin view)
 */
export const ComparisonExample: React.FC = () => {
  const users = [
    { id: 'user-1', name: 'Alice' },
    { id: 'user-2', name: 'Bob' },
    { id: 'user-3', name: 'Charlie' },
  ];
  
  return (
    <div className="p-4 bg-gray-100">
      <h2 className="text-2xl font-bold mb-4">User Wallets Comparison</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map(user => (
          <div key={user.id}>
            <h3 className="font-semibold mb-2">{user.name}</h3>
            <GGCoinWallet userId={user.id} />
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Example 6: Responsive Layout
 * Demonstrates responsive behavior across screen sizes
 */
export const ResponsiveExample: React.FC = () => {
  const userId = 'example-user-123';
  
  return (
    <div className="p-4 bg-gray-100">
      <h2 className="text-2xl font-bold mb-4">Responsive Layout</h2>
      
      {/* Mobile: Full width */}
      <div className="mb-4 md:hidden">
        <GGCoinWallet userId={userId} />
      </div>
      
      {/* Tablet: Half width */}
      <div className="hidden md:block lg:hidden mb-4">
        <div className="grid grid-cols-2 gap-4">
          <GGCoinWallet userId={userId} />
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-600">Other content...</p>
          </div>
        </div>
      </div>
      
      {/* Desktop: Third width */}
      <div className="hidden lg:block">
        <div className="grid grid-cols-3 gap-4">
          <GGCoinWallet userId={userId} />
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-600">Content 1...</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-600">Content 2...</p>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Example 7: With Custom Styling
 * Demonstrates className prop usage
 */
export const CustomStyledExample: React.FC = () => {
  const userId = 'example-user-123';
  
  return (
    <div className="p-4 bg-gray-100">
      <h2 className="text-2xl font-bold mb-4">Custom Styling</h2>
      
      {/* Custom border and shadow */}
      <GGCoinWallet 
        userId={userId} 
        className="border-4 border-green-500 shadow-2xl mb-4"
      />
      
      {/* Custom background */}
      <GGCoinWallet 
        userId={userId} 
        className="bg-gradient-to-br from-green-50 to-blue-50 mb-4"
      />
      
      {/* Custom sizing */}
      <GGCoinWallet 
        userId={userId} 
        className="max-w-md mx-auto"
      />
    </div>
  );
};

/**
 * Example 8: Error State Demo
 * Shows how the component handles errors
 */
export const ErrorStateExample: React.FC = () => {
  // Using invalid userId to trigger error
  const invalidUserId = '';
  
  return (
    <div className="p-4 bg-gray-100">
      <h2 className="text-2xl font-bold mb-4">Error State</h2>
      <GGCoinWallet userId={invalidUserId} />
    </div>
  );
};

/**
 * Example 9: Loading State Demo
 * Shows the skeleton loader (would need to delay the service response)
 */
export const LoadingStateExample: React.FC = () => {
  const userId = 'example-user-123';
  
  return (
    <div className="p-4 bg-gray-100">
      <h2 className="text-2xl font-bold mb-4">Loading State</h2>
      <p className="text-gray-600 mb-4">
        The component shows a skeleton loader while fetching data.
        This happens automatically on initial load.
      </p>
      <GGCoinWallet userId={userId} />
    </div>
  );
};

/**
 * Example 10: Integration with Auth Context
 * Real-world usage with authentication
 */
export const AuthIntegrationExample: React.FC = () => {
  // In a real app, this would come from useAuth()
  const user = {
    id: 'authenticated-user-123',
    email: 'user@example.com',
    name: 'John Doe',
  };
  
  if (!user) {
    return (
      <div className="p-4 bg-gray-100">
        <p className="text-gray-600">Please log in to view your wallet.</p>
      </div>
    );
  }
  
  return (
    <div className="p-4 bg-gray-100">
      <h2 className="text-2xl font-bold mb-4">Welcome, {user.name}!</h2>
      <GGCoinWallet userId={user.id} />
    </div>
  );
};

// Export all examples for easy access
export const examples = {
  BasicExample,
  DashboardExample,
  ProfileExample,
  CompactExample,
  ComparisonExample,
  ResponsiveExample,
  CustomStyledExample,
  ErrorStateExample,
  LoadingStateExample,
  AuthIntegrationExample,
};

export default examples;
