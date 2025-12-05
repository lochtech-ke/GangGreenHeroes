import { useState, useEffect } from 'react';
import { ggCoinService } from '../../services/ggCoin.service';

interface GGCoinBalanceProps {
  userId: string;
  className?: string;
  showTooltip?: boolean;
}

export const GGCoinBalance: React.FC<GGCoinBalanceProps> = ({
  userId,
  className = '',
  showTooltip = true,
}) => {
  const [balance, setBalance] = useState<number>(0);
  const [previousBalance, setPreviousBalance] = useState<number>(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBalance = async () => {
      try {
        const currentBalance = await ggCoinService.getBalance(userId);
        setBalance(currentBalance);
        setPreviousBalance(currentBalance);
      } catch (error) {
        console.error('Error loading GG Coin balance:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBalance();

    // Subscribe to real-time balance updates
    const unsubscribe = ggCoinService.subscribeToBalance(userId, (newBalance) => {
      if (newBalance !== balance) {
        setPreviousBalance(balance);
        setBalance(newBalance);
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 1000);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [userId, balance]);

  const balanceChange = balance - previousBalance;
  const showChange = isAnimating && balanceChange !== 0;

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="w-6 h-6 bg-gray-200 rounded-full animate-pulse" />
        <div className="w-16 h-4 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className={`relative group ${className}`}>
      <div className="flex items-center gap-2">
        {/* GG Coin Icon */}
        <div className="w-6 h-6 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-md">
          <span className="text-white text-xs font-bold">GG</span>
        </div>

        {/* Balance Display */}
        <div className="flex items-center gap-1">
          <span
            className={`text-lg font-bold transition-all duration-300 ${
              isAnimating ? 'scale-110 text-green-600' : 'text-gray-900'
            }`}
          >
            {ggCoinService.formatGGCoins(balance)}
          </span>
          <span className="text-sm text-gray-500">coins</span>
        </div>

        {/* Balance Change Animation */}
        {showChange && (
          <span
            className={`absolute -top-6 left-8 text-sm font-semibold animate-bounce ${
              balanceChange > 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {balanceChange > 0 ? '+' : ''}
            {ggCoinService.formatGGCoins(Math.abs(balanceChange))}
          </span>
        )}
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
          <div className="font-semibold mb-1">GG Coins</div>
          <div className="text-gray-300">
            Earn coins by purchasing badges and participating in #GangGreen activities
          </div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
            <div className="border-4 border-transparent border-t-gray-900" />
          </div>
        </div>
      )}
    </div>
  );
};
