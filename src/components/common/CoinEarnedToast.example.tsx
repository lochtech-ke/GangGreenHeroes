/**
 * Coin Earned Toast - Usage Examples
 * 
 * This file demonstrates how to use the CoinEarnedToast component
 * in various scenarios throughout the application.
 */

import { useState } from 'react';
import { CoinEarnedToast, CoinEarnedToastContainer } from './CoinEarnedToast';

/**
 * Example 1: Single Toast
 * Basic usage for showing a single coin earned notification
 */
export function SingleToastExample() {
  const [showToast, setShowToast] = useState(false);

  const handleEarnCoins = () => {
    setShowToast(true);
  };

  return (
    <div>
      <button onClick={handleEarnCoins}>
        Earn Coins
      </button>

      {showToast && (
        <CoinEarnedToast
          amount={50}
          reason="Planted a tree"
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );
}

/**
 * Example 2: Multiple Toasts with Container
 * Managing multiple coin earned notifications
 */
export function MultipleToastsExample() {
  const [toasts, setToasts] = useState<Array<{
    id: string;
    amount: number;
    reason: string;
  }>>([]);

  const addToast = (amount: number, reason: string) => {
    const newToast = {
      id: `toast-${Date.now()}`,
      amount,
      reason,
    };
    setToasts(prev => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div>
      <div className="space-x-2">
        <button onClick={() => addToast(50, 'Planted a tree')}>
          Plant Tree (+50)
        </button>
        <button onClick={() => addToast(100, 'Completed mission')}>
          Complete Mission (+100)
        </button>
        <button onClick={() => addToast(20, 'Finished learning module')}>
          Learn (+20)
        </button>
      </div>

      <CoinEarnedToastContainer
        toasts={toasts}
        onDismiss={removeToast}
        position="top-right"
        maxVisible={3}
      />
    </div>
  );
}

/**
 * Example 3: Integration with Service
 * How to integrate with ggCoin.service.ts
 */
export function ServiceIntegrationExample() {
  const [toasts, setToasts] = useState<Array<{
    id: string;
    amount: number;
    reason: string;
  }>>([]);

  // This would be called after a successful coin transaction
  const handleCoinEarned = (amount: number, reason: string) => {
    const newToast = {
      id: `toast-${Date.now()}`,
      amount,
      reason,
    };
    setToasts(prev => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Example: After planting a tree
  const plantTree = async () => {
    try {
      // const transaction = await ggCoinService.awardCoins(userId, 'tree_planting', 1);
      // if (transaction) {
      //   handleCoinEarned(transaction.amount, 'Planted a tree');
      // }
      
      // For demo purposes:
      handleCoinEarned(50, 'Planted a tree');
    } catch (error) {
      console.error('Failed to award coins:', error);
    }
  };

  return (
    <div>
      <button onClick={plantTree}>
        Plant Tree
      </button>

      <CoinEarnedToastContainer
        toasts={toasts}
        onDismiss={removeToast}
      />
    </div>
  );
}

/**
 * Example 4: Different Positions
 * Showing toasts in different screen positions
 */
export function PositionExample() {
  const [position, setPosition] = useState<'top-right' | 'top-center' | 'bottom-right' | 'bottom-center'>('top-right');
  const [showToast, setShowToast] = useState(false);

  return (
    <div>
      <div className="space-x-2 mb-4">
        <button onClick={() => { setPosition('top-right'); setShowToast(true); }}>
          Top Right
        </button>
        <button onClick={() => { setPosition('top-center'); setShowToast(true); }}>
          Top Center
        </button>
        <button onClick={() => { setPosition('bottom-right'); setShowToast(true); }}>
          Bottom Right
        </button>
        <button onClick={() => { setPosition('bottom-center'); setShowToast(true); }}>
          Bottom Center
        </button>
      </div>

      {showToast && (
        <CoinEarnedToast
          amount={50}
          reason="Position test"
          onClose={() => setShowToast(false)}
          position={position}
        />
      )}
    </div>
  );
}

/**
 * Example 5: Decimal Amounts
 * Showing how decimal amounts are formatted
 */
export function DecimalAmountsExample() {
  const [toasts, setToasts] = useState<Array<{
    id: string;
    amount: number;
    reason: string;
  }>>([]);

  const addToast = (amount: number, reason: string) => {
    const newToast = {
      id: `toast-${Date.now()}`,
      amount,
      reason,
    };
    setToasts(prev => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div>
      <div className="space-x-2">
        <button onClick={() => addToast(50, 'Whole number')}>
          50 Coins
        </button>
        <button onClick={() => addToast(50.5, 'One decimal')}>
          50.5 Coins
        </button>
        <button onClick={() => addToast(50.123, 'Three decimals')}>
          50.123 Coins
        </button>
        <button onClick={() => addToast(1234.567, 'Large with decimals')}>
          1,234.567 Coins
        </button>
      </div>

      <CoinEarnedToastContainer
        toasts={toasts}
        onDismiss={removeToast}
      />
    </div>
  );
}
