import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  isGoogleConnected,
  disconnectGoogle,
  getGoogleConnectionStatus,
  type ActivityEvent,
} from './googleCalendarService';

describe('GoogleCalendarService', () => {
  beforeEach(() => {
    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    global.localStorage = localStorageMock as any;

    // Mock window.google
    (window as any).google = {
      accounts: {
        oauth2: {
          revoke: vi.fn(),
        },
      },
    };
  });

  describe('isGoogleConnected', () => {
    it('should return false when no token exists', () => {
      localStorage.getItem = vi.fn().mockReturnValue(null);

      const result = isGoogleConnected();

      expect(result).toBe(false);
    });

    it('should return false when token is expired', () => {
      const expiredTime = Date.now() - 1000; // 1 seconde dans le passé

      localStorage.getItem = vi.fn((key) => {
        if (key === 'google_access_token') return 'mock-token';
        if (key === 'google_token_expiry') return expiredTime.toString();
        return null;
      });

      const result = isGoogleConnected();

      expect(result).toBe(false);
    });

    it('should return true when token is valid', () => {
      const futureTime = Date.now() + 3600000; // 1 heure dans le futur

      localStorage.getItem = vi.fn((key) => {
        if (key === 'google_access_token') return 'mock-token';
        if (key === 'google_token_expiry') return futureTime.toString();
        return null;
      });

      const result = isGoogleConnected();

      expect(result).toBe(true);
    });

    it('should return false when token exists but no expiry', () => {
      localStorage.getItem = vi.fn((key) => {
        if (key === 'google_access_token') return 'mock-token';
        return null;
      });

      const result = isGoogleConnected();

      expect(result).toBe(false);
    });
  });

  describe('disconnectGoogle', () => {
    it('should revoke token and clear localStorage', () => {
      const mockToken = 'mock-google-token';
      localStorage.getItem = vi.fn().mockReturnValue(mockToken);

      disconnectGoogle();

      expect((window as any).google.accounts.oauth2.revoke).toHaveBeenCalledWith(mockToken);
      expect(localStorage.removeItem).toHaveBeenCalledWith('google_access_token');
      expect(localStorage.removeItem).toHaveBeenCalledWith('google_token_expiry');
    });

    it('should clear localStorage even when no token exists', () => {
      localStorage.getItem = vi.fn().mockReturnValue(null);

      disconnectGoogle();

      expect(localStorage.removeItem).toHaveBeenCalledWith('google_access_token');
      expect(localStorage.removeItem).toHaveBeenCalledWith('google_token_expiry');
    });
  });

  describe('getGoogleConnectionStatus', () => {
    it('should return connected status with email', () => {
      const futureTime = Date.now() + 3600000;
      const mockEmail = 'user@example.com';

      localStorage.getItem = vi.fn((key) => {
        if (key === 'google_access_token') return 'mock-token';
        if (key === 'google_token_expiry') return futureTime.toString();
        if (key === 'google_user_email') return mockEmail;
        return null;
      });

      const result = getGoogleConnectionStatus();

      expect(result.connected).toBe(true);
      expect(result.email).toBe(mockEmail);
    });

    it('should return disconnected status', () => {
      localStorage.getItem = vi.fn().mockReturnValue(null);

      const result = getGoogleConnectionStatus();

      expect(result.connected).toBe(false);
      expect(result.email).toBeUndefined();
    });

    it('should return connected without email if email not stored', () => {
      const futureTime = Date.now() + 3600000;

      localStorage.getItem = vi.fn((key) => {
        if (key === 'google_access_token') return 'mock-token';
        if (key === 'google_token_expiry') return futureTime.toString();
        return null;
      });

      const result = getGoogleConnectionStatus();

      expect(result.connected).toBe(true);
      expect(result.email).toBeUndefined();
    });
  });

  describe('ActivityEvent type', () => {
    it('should accept valid activity event', () => {
      const validEvent: ActivityEvent = {
        title: 'Formation TypeScript',
        description: 'Formation avancée',
        startDate: '2024-06-01T09:00:00Z',
        endDate: '2024-06-01T17:00:00Z',
        location: 'Salle A',
      };

      expect(validEvent.title).toBe('Formation TypeScript');
      expect(validEvent.startDate).toBe('2024-06-01T09:00:00Z');
    });

    it('should accept activity event without optional fields', () => {
      const minimalEvent: ActivityEvent = {
        title: 'Réunion',
        description: 'Réunion d\'équipe',
        startDate: '2024-06-01T10:00:00Z',
      };

      expect(minimalEvent.endDate).toBeUndefined();
      expect(minimalEvent.location).toBeUndefined();
    });
  });
});
