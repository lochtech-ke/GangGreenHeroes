/**
 * Type tests for splash screen types
 * These tests verify that the type definitions are correct and usable
 */

import { describe, it, expect } from 'vitest';
import type {
  Contributor,
  ContributorList,
  VersionInfo,
  VivianSplashScreenProps,
  SplashScreenState,
  HummingbirdAnimationProps,
  VersionDisplayProps,
  ContributorTickerProps
} from './splash.types';

describe('Splash Types', () => {
  describe('Contributor', () => {
    it('should accept valid contributor data', () => {
      const contributor: Contributor = {
        login: 'testuser',
        contributions: 42
      };
      
      expect(contributor.login).toBe('testuser');
      expect(contributor.contributions).toBe(42);
    });

    it('should accept optional avatar_url', () => {
      const contributor: Contributor = {
        login: 'testuser',
        contributions: 42,
        avatar_url: 'https://github.com/testuser.png'
      };
      
      expect(contributor.avatar_url).toBe('https://github.com/testuser.png');
    });
  });

  describe('ContributorList', () => {
    it('should accept valid contributor list', () => {
      const list: ContributorList = {
        contributors: [
          { login: 'user1', contributions: 10 },
          { login: 'user2', contributions: 20 }
        ],
        lastUpdated: '2024-01-01T00:00:00Z',
        totalCount: 2
      };
      
      expect(list.contributors).toHaveLength(2);
      expect(list.totalCount).toBe(2);
    });
  });

  describe('VersionInfo', () => {
    it('should accept version and codename', () => {
      const version: VersionInfo = {
        version: '1.0.0',
        codename: 'Vivian'
      };
      
      expect(version.version).toBe('1.0.0');
      expect(version.codename).toBe('Vivian');
    });

    it('should accept optional releaseDate', () => {
      const version: VersionInfo = {
        version: '1.0.0',
        codename: 'Vivian',
        releaseDate: '2024-01-01'
      };
      
      expect(version.releaseDate).toBe('2024-01-01');
    });
  });

  describe('VivianSplashScreenProps', () => {
    it('should accept all optional props', () => {
      const props: VivianSplashScreenProps = {
        minDisplayDuration: 2000,
        maxDisplayDuration: 5000,
        fadeOutDuration: 500,
        onComplete: () => {},
        version: '1.0.0',
        codename: 'Vivian',
        contributors: [{ login: 'user1', contributions: 10 }]
      };
      
      expect(props.minDisplayDuration).toBe(2000);
      expect(props.version).toBe('1.0.0');
    });

    it('should accept empty props object', () => {
      const props: VivianSplashScreenProps = {};
      
      expect(props).toBeDefined();
    });
  });

  describe('SplashScreenState', () => {
    it('should accept valid state', () => {
      const state: SplashScreenState = {
        isVisible: true,
        isFadingOut: false,
        startTime: Date.now(),
        appReady: false
      };
      
      expect(state.isVisible).toBe(true);
      expect(state.isFadingOut).toBe(false);
    });
  });

  describe('HummingbirdAnimationProps', () => {
    it('should accept format and size', () => {
      const props: HummingbirdAnimationProps = {
        format: 'gif',
        size: 'md',
        fallbackImage: '/fallback.png',
        className: 'custom-class'
      };
      
      expect(props.format).toBe('gif');
      expect(props.size).toBe('md');
    });

    it('should accept lottie format', () => {
      const props: HummingbirdAnimationProps = {
        format: 'lottie'
      };
      
      expect(props.format).toBe('lottie');
    });
  });

  describe('VersionDisplayProps', () => {
    it('should require version and codename', () => {
      const props: VersionDisplayProps = {
        version: '1.0.0',
        codename: 'Vivian'
      };
      
      expect(props.version).toBe('1.0.0');
      expect(props.codename).toBe('Vivian');
    });

    it('should accept optional className', () => {
      const props: VersionDisplayProps = {
        version: '1.0.0',
        codename: 'Vivian',
        className: 'custom-class'
      };
      
      expect(props.className).toBe('custom-class');
    });
  });

  describe('ContributorTickerProps', () => {
    it('should require contributors array', () => {
      const props: ContributorTickerProps = {
        contributors: ['user1', 'user2', 'user3']
      };
      
      expect(props.contributors).toHaveLength(3);
    });

    it('should accept optional scrollSpeed and className', () => {
      const props: ContributorTickerProps = {
        contributors: ['user1'],
        scrollSpeed: 100,
        className: 'ticker-class'
      };
      
      expect(props.scrollSpeed).toBe(100);
      expect(props.className).toBe('ticker-class');
    });
  });
});
