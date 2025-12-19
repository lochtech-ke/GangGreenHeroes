import { useState } from 'react';

interface Web3LoginProps {
  onSuccess?: () => void;
  onBack?: () => void;
}

export function Web3Login({ onSuccess, onBack }: Web3LoginProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const connectMetaMask = async () => {
    setError('');
    setLoading(true);

    try {
      // Check if MetaMask is installed
      if (typeof window.ethereum === 'undefined') {
        setError('MetaMask is not installed. Please install MetaMask to continue.');
        setLoading(false);
        return;
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts && accounts.length > 0) {
        const address = accounts[0];
        console.log('Connected wallet:', address);

        // TODO: Implement backend authentication with wallet signature
        // For now, just show success
        setError('');
        onSuccess?.();
      }
    } catch (err: any) {
      if (err.code === 4001) {
        setError('Connection request was rejected. Please try again.');
      } else {
        setError('Failed to connect wallet. Please try again.');
      }
      console.error('MetaMask connection error:', err);
    } finally {
      setLoading(false);
    }
  };

  const connectWalletConnect = async () => {
    setError('WalletConnect integration coming soon!');
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center mb-6">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="mr-3 text-gray-600 hover:text-gray-900"
              disabled={loading}
              aria-label="Back"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          )}
          <h2 className="text-2xl font-bold text-green-700">Connect Wallet</h2>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          {/* MetaMask */}
          <button
            type="button"
            onClick={connectMetaMask}
            disabled={loading}
            className="w-full flex items-center gap-4 px-6 py-4 border-2 border-gray-300 hover:border-green-500 hover:bg-green-50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🦊</span>
            </div>
            <div className="text-left flex-1">
              <div className="font-semibold text-gray-900">MetaMask</div>
              <div className="text-sm text-gray-600">Connect with MetaMask wallet</div>
            </div>
          </button>

          {/* WalletConnect */}
          <button
            type="button"
            onClick={connectWalletConnect}
            disabled={loading}
            className="w-full flex items-center gap-4 px-6 py-4 border-2 border-gray-300 hover:border-green-500 hover:bg-green-50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🔗</span>
            </div>
            <div className="text-left flex-1">
              <div className="font-semibold text-gray-900">WalletConnect</div>
              <div className="text-sm text-gray-600">Scan with mobile wallet</div>
            </div>
          </button>
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Make sure you're connected to the correct network (Polygon Mumbai for testnet).
          </p>
        </div>
      </div>
    </div>
  );
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: any;
  }
}
