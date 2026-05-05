import { describe, it, expect, beforeEach, vi } from 'vitest';
import { chatService } from './chatService';

describe('ChatService', () => {
  beforeEach(() => {
    // Reset fetch mock avant chaque test
    global.fetch = vi.fn();
  });

  describe('sendMessage', () => {
    it('should send message successfully and return response', async () => {
      const mockResponse = {
        message: 'Bonjour! Comment puis-je vous aider?',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const result = await chatService.sendMessage('Bonjour', 'activity-123');

      expect(result).toBe('Bonjour! Comment puis-je vous aider?');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/chat'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: 'Bonjour',
            activityId: 'activity-123',
          }),
        })
      );
    });

    it('should throw error for 400 Bad Request', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
      });

      await expect(
        chatService.sendMessage('', 'activity-123')
      ).rejects.toThrow('Message ou ID d\'activité invalide');
    });

    it('should throw error for 404 Not Found', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      await expect(
        chatService.sendMessage('Bonjour', 'invalid-id')
      ).rejects.toThrow('Activité non trouvée');
    });

    it('should throw error for 503 Service Unavailable', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 503,
      });

      await expect(
        chatService.sendMessage('Bonjour', 'activity-123')
      ).rejects.toThrow('Le service de chatbot est temporairement indisponible');
    });

    it('should throw generic error for other HTTP errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(
        chatService.sendMessage('Bonjour', 'activity-123')
      ).rejects.toThrow('Une erreur est survenue lors de l\'envoi du message');
    });

    it('should throw connection error when fetch fails', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(
        chatService.sendMessage('Bonjour', 'activity-123')
      ).rejects.toThrow('Network error');
    });

    it('should handle empty response message', async () => {
      const mockResponse = {
        message: '',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const result = await chatService.sendMessage('Test', 'activity-123');

      expect(result).toBe('');
    });
  });
});
