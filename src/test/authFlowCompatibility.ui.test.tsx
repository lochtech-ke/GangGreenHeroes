import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthOptions } from '../components/auth/AuthOptions';
import { Web3Login } from '../components/auth/Web3Login';

/**
 * Authentication Flow Compatibility UI Tests
 * 
 * Tests that verify UI components for authentication still work after OAuth callback routing changes.
 * Requirements: 4.4 - Authentication flow compatibility
 */

// Mock window.ethereum for Web3 tests
const mockEthereum = {
  request: vi.fn(),
  isMetaMask: true,
};

describe('Authentication Flow Compatibility - UI Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset window.ethereum
    Object.defineProperty(window, 'ethereum', {
      value: mockEthereum,
      writable: true,
    });
  });

  describe('AuthOptions Component', () => {
    it('should render all authentication options', () => {
      const mockHandlers = {
        onEmailAuth: vi.fn(),
        onWeb3Auth: vi.fn(),
        onGoogleAuth: vi.fn(),
      };

      render(
        <BrowserRouter>
          <AuthOptions {...mockHandlers} />
        </BrowserRouter>
      );

      // Verify all auth options are present
      expect(screen.getByText('Continue with Google')).toBeInTheDocument();
      expect(screen.getByText('Email & Password')).toBeInTheDocument();
      expect(screen.getByText('Web3 Wallet')).toBeInTheDocument();
    });

    it('should call correct handlers when options are clicked', () => {
      const mockHandlers = {
        onEmailAuth: vi.fn(),
        onWeb3Auth: vi.fn(),
        onGoogleAuth: vi.fn(),
      };

      render(
        <BrowserRouter>
          <AuthOptions {...mockHandlers} />
        </BrowserRouter>
      );

      // Test Google auth
      fireEvent.click(screen.getByText('Continue with Google'));
      expect(mockHandlers.onGoogleAuth).toHaveBeenCalled();

      // Test email auth
      fireEvent.click(screen.getByText('Email & Password'));
      expect(mockHandlers.onEmailAuth).toHaveBeenCalled();

      // Test Web3 auth
      fireEvent.click(screen.getByText('Web3 Wallet'));
      expect(mockHandlers.onWeb3Auth).toHaveBeenCalled();
    });
  });

  describe('Web3Login Component', () => {
    it('should render wallet connection options', () => {
      render(
        <BrowserRouter>
          <Web3Login />
        </BrowserRouter>
      );

      expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
      expect(screen.getByText('MetaMask')).toBeInTheDocument();
      expect(screen.getByText('WalletConnect')).toBeInTheDocument();
    });

    it('should handle MetaMask connection', async () => {
      mockEthereum.request.mockResolvedValue(['0x1234567890abcdef1234567890abcdef12345678']);
      
      const mockOnSuccess = vi.fn();

      render(
        <BrowserRouter>
          <Web3Login onSuccess={mockOnSuccess} />
        </BrowserRouter>
      );

      const metaMaskButton = screen.getByText('MetaMask');
      fireEvent.click(metaMaskButton);

      await waitFor(() => {
        expect(mockEthereum.request).toHaveBeenCalledWith({
          method: 'eth_requestAccounts',
        });
      });

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it('should handle MetaMask not installed', async () => {
      Object.defineProperty(window, 'ethereum', {
        value: undefined,
        writable: true,
      });

      render(
        <BrowserRouter>
          <Web3Login />
        </BrowserRouter>
      );

      const metaMaskButton = screen.getByText('MetaMask');
      fireEvent.click(metaMaskButton);

      await waitFor(() => {
        expect(screen.getByText(/metamask is not installed/i)).toBeInTheDocument();
      });
    });

    it('should handle connection rejection', async () => {
      mockEthereum.request.mockRejectedValue({ code: 4001 });

      render(
        <BrowserRouter>
          <Web3Login />
        </BrowserRouter>
      );

      const metaMaskButton = screen.getByText('MetaMask');
      fireEvent.click(metaMaskButton);

      await waitFor(() => {
        expect(screen.getByText(/connection request was rejected/i)).toBeInTheDocument();
      });
    });

    it('should show back button when onBack is provided', () => {
      const mockOnBack = vi.fn();

      render(
        <BrowserRouter>
          <Web3Login onBack={mockOnBack} />
        </BrowserRouter>
      );

      const backButton = screen.getByRole('button', { name: /back/i });
      expect(backButton).toBeInTheDocument();

      fireEvent.click(backButton);
      expect(mockOnBack).toHaveBeenCalled();
    });
  });

  describe('Authentication Method Switching', () => {
    it('should allow switching between authentication methods', () => {
      let currentView = 'options';
      const setView = (view: string) => { currentView = view; };

      const mockHandlers = {
        onEmailAuth: () => setView('email'),
        onWeb3Auth: () => setView('web3'),
        onGoogleAuth: () => setView('google'),
      };

      const { rerender } = render(
        <BrowserRouter>
          <AuthOptions {...mockHandlers} />
        </BrowserRouter>
      );

      // Start with options view
      expect(screen.getByText('Continue with Google')).toBeInTheDocument();

      // Switch to Web3
      fireEvent.click(screen.getByText('Web3 Wallet'));
      expect(currentView).toBe('web3');

      // Render Web3 component
      rerender(
        <BrowserRouter>
          <Web3Login onBack={() => setView('options')} />
        </BrowserRouter>
      );

      expect(screen.getByText('Connect Wallet')).toBeInTheDocument();

      // Go back to options
      const backButton = screen.getByRole('button', { name: /back/i });
      fireEvent.click(backButton);
      expect(currentView).toBe('options');
    });
  });

  describe('Error Handling in UI', () => {
    it('should display Web3 connection errors', async () => {
      mockEthereum.request.mockRejectedValue(new Error('Connection failed'));

      render(
        <BrowserRouter>
          <Web3Login />
        </BrowserRouter>
      );

      const metaMaskButton = screen.getByText('MetaMask');
      fireEvent.click(metaMaskButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to connect wallet/i)).toBeInTheDocument();
      });
    });

    it('should handle WalletConnect not implemented', async () => {
      render(
        <BrowserRouter>
          <Web3Login />
        </BrowserRouter>
      );

      const walletConnectButton = screen.getByText('WalletConnect');
      fireEvent.click(walletConnectButton);

      await waitFor(() => {
        expect(screen.getByText(/walletconnect integration coming soon/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility and UX', () => {
    it('should have proper button roles and labels', () => {
      const mockHandlers = {
        onEmailAuth: vi.fn(),
        onWeb3Auth: vi.fn(),
        onGoogleAuth: vi.fn(),
      };

      render(
        <BrowserRouter>
          <AuthOptions {...mockHandlers} />
        </BrowserRouter>
      );

      // Check that buttons are properly labeled
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);

      buttons.forEach(button => {
        expect(button).toHaveAttribute('type', 'button');
      });
    });

    it('should disable buttons during loading states', async () => {
      mockEthereum.request.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(['0x123']), 100))
      );

      render(
        <BrowserRouter>
          <Web3Login />
        </BrowserRouter>
      );

      const metaMaskButton = screen.getByText('MetaMask');
      fireEvent.click(metaMaskButton);

      // Button should be disabled during loading
      await waitFor(() => {
        expect(metaMaskButton.closest('button')).toBeDisabled();
      });

      // Wait for completion
      await waitFor(() => {
        expect(metaMaskButton.closest('button')).not.toBeDisabled();
      });
    });

    it('should provide helpful error messages', async () => {
      Object.defineProperty(window, 'ethereum', {
        value: undefined,
        writable: true,
      });

      render(
        <BrowserRouter>
          <Web3Login />
        </BrowserRouter>
      );

      const metaMaskButton = screen.getByText('MetaMask');
      fireEvent.click(metaMaskButton);

      await waitFor(() => {
        const errorMessage = screen.getByText(/metamask is not installed/i);
        expect(errorMessage).toBeInTheDocument();
        expect(errorMessage).toHaveClass('text-red-600');
      });
    });
  });

  describe('Component Integration', () => {
    it('should maintain state across component switches', () => {
      let authMethod = '';
      
      const mockHandlers = {
        onEmailAuth: () => { authMethod = 'email'; },
        onWeb3Auth: () => { authMethod = 'web3'; },
        onGoogleAuth: () => { authMethod = 'google'; },
      };

      render(
        <BrowserRouter>
          <AuthOptions {...mockHandlers} />
        </BrowserRouter>
      );

      // Test each method selection
      fireEvent.click(screen.getByText('Email & Password'));
      expect(authMethod).toBe('email');

      fireEvent.click(screen.getByText('Web3 Wallet'));
      expect(authMethod).toBe('web3');

      fireEvent.click(screen.getByText('Continue with Google'));
      expect(authMethod).toBe('google');
    });

    it('should handle rapid method switching', () => {
      let switchCount = 0;
      
      const mockHandlers = {
        onEmailAuth: () => { switchCount++; },
        onWeb3Auth: () => { switchCount++; },
        onGoogleAuth: () => { switchCount++; },
      };

      render(
        <BrowserRouter>
          <AuthOptions {...mockHandlers} />
        </BrowserRouter>
      );

      // Rapidly switch between methods
      fireEvent.click(screen.getByText('Email & Password'));
      fireEvent.click(screen.getByText('Web3 Wallet'));
      fireEvent.click(screen.getByText('Continue with Google'));
      fireEvent.click(screen.getByText('Email & Password'));

      expect(switchCount).toBe(4);
    });
  });
});