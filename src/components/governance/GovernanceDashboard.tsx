import { useAuthContext } from '../../contexts/AuthContext';
import { TokenBalanceCard } from './TokenBalanceCard';
import { DelegationPanel } from './DelegationPanel';
import ProposalList from './ProposalList';

export default function GovernanceDashboard() {
  const { user } = useAuthContext();

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Please sign in to view your governance dashboard</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Token Balance */}
      <TokenBalanceCard userId={user.id} />

      {/* Delegation Panel */}
      <DelegationPanel userId={user.id} />

      {/* Active Proposals */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Proposals</h2>
        <ProposalList filter="active" limit={5} />
      </div>
    </div>
  );
}
