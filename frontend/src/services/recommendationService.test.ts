import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';
import { RecommendationService } from './recommendationService';

// Mock axios
vi.mock('axios');
const mockedAxios = axios as any;

describe('RecommendationService', () => {
  let service: RecommendationService;
  const mockToken = 'mock-jwt-token';

  beforeEach(() => {
    service = new RecommendationService(mockToken);
    vi.clearAllMocks();
    
    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    global.localStorage = localStorageMock as any;

    // Mock window.location
    delete (window as any).location;
    window.location = { href: '' } as any;
  });

  describe('respondToRecommendation', () => {
    it('should send ACCEPTED response successfully', async () => {
      const mockResponse = {
        data: {
          message: 'Réponse enregistrée avec succès',
        },
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await service.respondToRecommendation(
        'rec-123',
        'ACCEPTED',
        'Geste détecté: pouce levé'
      );

      expect(result.success).toBe(true);
      expect(result.message).toBe('Réponse enregistrée avec succès');
      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/api/recommendations/respond',
        {
          recommendationId: 'rec-123',
          response: 'ACCEPTED',
          justification: 'Geste détecté: pouce levé',
        },
        {
          headers: {
            'Authorization': `Bearer ${mockToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
    });

    it('should send REJECTED response successfully', async () => {
      const mockResponse = {
        data: {
          message: 'Recommandation rejetée',
        },
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await service.respondToRecommendation(
        'rec-456',
        'REJECTED',
        'Pas intéressé'
      );

      expect(result.success).toBe(true);
      expect(result.message).toBe('Recommandation rejetée');
    });

    it('should handle network error', async () => {
      mockedAxios.post.mockRejectedValueOnce({
        response: undefined,
      });

      const result = await service.respondToRecommendation('rec-123', 'ACCEPTED');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Connexion réseau perdue. Vérifiez votre connexion internet.');
    });

    it('should handle 404 error (recommendation not found)', async () => {
      mockedAxios.post.mockRejectedValueOnce({
        response: {
          status: 404,
          data: {},
        },
      });

      const result = await service.respondToRecommendation('invalid-id', 'ACCEPTED');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Recommandation non trouvée. Elle a peut-être été supprimée.');
    });

    it('should handle 500 server error', async () => {
      mockedAxios.post.mockRejectedValueOnce({
        response: {
          status: 500,
          data: {},
        },
      });

      const result = await service.respondToRecommendation('rec-123', 'ACCEPTED');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Erreur serveur. Veuillez réessayer dans quelques instants.');
    });

    it('should handle 401 error and redirect to login when no refresh token', async () => {
      localStorage.getItem = vi.fn().mockReturnValue(null);

      mockedAxios.post.mockRejectedValueOnce({
        response: {
          status: 401,
          data: {},
        },
      });

      const result = await service.respondToRecommendation('rec-123', 'ACCEPTED');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Session expirée. Redirection vers la connexion...');
      expect(localStorage.removeItem).toHaveBeenCalledWith('accessToken');
      expect(localStorage.removeItem).toHaveBeenCalledWith('refreshToken');
      expect(window.location.href).toBe('/login');
    });

    it('should retry after successful token refresh', async () => {
      const refreshToken = 'mock-refresh-token';
      const newAccessToken = 'new-access-token';

      localStorage.getItem = vi.fn().mockReturnValue(refreshToken);

      // Premier appel échoue avec 401
      mockedAxios.post
        .mockRejectedValueOnce({
          response: {
            status: 401,
            data: {},
          },
        })
        // Refresh token réussit
        .mockResolvedValueOnce({
          data: {
            accessToken: newAccessToken,
          },
        })
        // Retry réussit
        .mockResolvedValueOnce({
          data: {
            message: 'Réponse enregistrée',
          },
        });

      const result = await service.respondToRecommendation('rec-123', 'ACCEPTED');

      expect(result.success).toBe(true);
      expect(localStorage.setItem).toHaveBeenCalledWith('accessToken', newAccessToken);
    });

    it('should handle generic error with custom message', async () => {
      mockedAxios.post.mockRejectedValueOnce({
        response: {
          status: 400,
          data: {
            message: 'Données invalides',
          },
        },
      });

      const result = await service.respondToRecommendation('rec-123', 'ACCEPTED');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Données invalides');
    });
  });

  describe('updateToken', () => {
    it('should update authentication token', () => {
      const newToken = 'new-jwt-token';
      service.updateToken(newToken);

      // Vérifier que le nouveau token est utilisé
      mockedAxios.post.mockResolvedValueOnce({
        data: { message: 'Success' },
      });

      service.respondToRecommendation('rec-123', 'ACCEPTED');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Bearer ${newToken}`,
          }),
        })
      );
    });
  });
});
