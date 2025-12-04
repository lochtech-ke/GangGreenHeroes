import React from 'react';
import { TreeWallet } from '../components/trees/TreeWallet';

/**
 * Tree Wallet Page
 * Full page view of user's Digital Tree Wallet
 * Requirements: A8.1, A8.2
 */
const TreeWalletPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TreeWallet />
      </div>
    </div>
  );
};

export default TreeWalletPage;
