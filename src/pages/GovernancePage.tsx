import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';
import GovernanceDashboard from '../components/governance/GovernanceDashboard';
import ProposalList from '../components/governance/ProposalList';

export default function GovernancePage() {
  const { user } = useAuthContext();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'proposals'>('dashboard');

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Governance</h1>
          <p className="text-gray-600">
            Participate in platform decision-making through proposals and voting
          </p>
        </div>

        {/* Create Proposal Button */}
        {user && (
          <div className="mb-6">
            <Link
              to="/governance/proposals/create"
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Proposal
            </Link>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex gap-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'dashboard'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('proposals')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'proposals'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              All Proposals
            </button>
          </nav>
        </div>

        {/* Content */}
        {activeTab === 'dashboard' ? (
          <GovernanceDashboard />
        ) : (
          <ProposalList />
        )}
      </div>
    </div>
  );
}
