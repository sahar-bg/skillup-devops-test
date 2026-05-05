import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import {
  NotFoundException,
  ServiceUnavailableException,
  InternalServerErrorException,
} from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { AxiosResponse, AxiosError } from 'axios';
import { ChatService } from './chat.service';
import { ActivitiesService } from '../activities/activities.service';
import { ChatMessageDto } from './dto/chat-message.dto';
import { RewritePromptDto } from './dto/rewrite-prompt.dto';
import { WebsiteGuideDto } from './dto/website-guide.dto';

describe('ChatService', () => {
  let service: ChatService;
  let httpService: HttpService;
  let activitiesService: ActivitiesService;

  const mockActivity = {
    _id: '507f1f77bcf86cd799439011',
    title: 'Formation TypeScript',
    description: 'Formation avancée TypeScript',
    departmentId: '507f1f77bcf86cd799439099',
    type: 'formation',
    requiredSkills: [
      { skill_name: 'JavaScript', desired_level: 'intermediate' },
      { skill_name: 'TypeScript', desired_level: 'advanced' },
    ],
    maxParticipants: 20,
    startDate: new Date('2024-06-01'),
    endDate: new Date('2024-06-05'),
    location: 'Paris, France',
    duration: '5 jours',
    status: 'active',
  };

  const mockRasaResponse: AxiosResponse = {
    data: [
      {
        recipient_id: 'user',
        text: 'Voici les informations sur la formation TypeScript.',
      },
    ],
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {} as any,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        {
          provide: HttpService,
          useValue: {
            post: jest.fn(),
          },
        },
        {
          provide: ActivitiesService,
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
    httpService = module.get<HttpService>(HttpService);
    activitiesService = module.get<ActivitiesService>(ActivitiesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processMessage', () => {
    it('should process message and return chatbot response', async () => {
      const chatMessageDto: ChatMessageDto = {
        message: 'Parle-moi de cette formation',
        activityId: '507f1f77bcf86cd799439011',
      };

      jest.spyOn(activitiesService, 'findOne').mockResolvedValue(mockActivity as any);
      jest.spyOn(httpService, 'post').mockReturnValue(of(mockRasaResponse));

      const result = await service.processMessage(chatMessageDto, 'fr');

      expect(activitiesService.findOne).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(httpService.post).toHaveBeenCalledWith(
        'http://localhost:5005/webhooks/rest/webhook',
        expect.objectContaining({
          sender: 'user',
          message: 'Parle-moi de cette formation',
          metadata: expect.objectContaining({
            activity: expect.objectContaining({
              titre: 'Formation TypeScript',
              description: 'Formation avancée TypeScript',
              competences: ['JavaScript', 'TypeScript'],
            }),
          }),
        }),
      );
      expect(result.message).toBe('Voici les informations sur la formation TypeScript.');
      expect(result.success).toBe(true);
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should handle empty response from Rasa', async () => {
      const chatMessageDto: ChatMessageDto = {
        message: 'Test message',
        activityId: '507f1f77bcf86cd799439011',
      };

      const emptyRasaResponse: AxiosResponse = {
        data: [],
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      jest.spyOn(activitiesService, 'findOne').mockResolvedValue(mockActivity as any);
      jest.spyOn(httpService, 'post').mockReturnValue(of(emptyRasaResponse));

      const result = await service.processMessage(chatMessageDto, 'fr');

      expect(result.message).toBe('Désolé, je n\'ai pas pu générer une réponse.');
      expect(result.success).toBe(true);
    });

    it('should throw NotFoundException when activity not found', async () => {
      const chatMessageDto: ChatMessageDto = {
        message: 'Test message',
        activityId: 'invalid-id',
      };

      jest.spyOn(activitiesService, 'findOne').mockRejectedValue(
        new NotFoundException('Activity not found'),
      );

      await expect(service.processMessage(chatMessageDto, 'fr')).rejects.toThrow(NotFoundException);
      await expect(service.processMessage(chatMessageDto, 'fr')).rejects.toThrow(
        'Activity with ID invalid-id not found',
      );
    });

    it('should throw ServiceUnavailableException when Rasa connection fails', async () => {
      const chatMessageDto: ChatMessageDto = {
        message: 'Test message',
        activityId: '507f1f77bcf86cd799439011',
      };

      jest.spyOn(activitiesService, 'findOne').mockResolvedValue(mockActivity as any);

      const connectionError: any = new Error('Connection refused');
      connectionError.code = 'ECONNREFUSED';

      jest.spyOn(httpService, 'post').mockReturnValue(throwError(() => connectionError));

      await expect(service.processMessage(chatMessageDto, 'fr')).rejects.toThrow(
        ServiceUnavailableException,
      );
      await expect(service.processMessage(chatMessageDto, 'fr')).rejects.toThrow(
        'Chatbot service is temporarily unavailable',
      );
    });

    it('should throw InternalServerErrorException when Rasa returns HTTP error', async () => {
      const chatMessageDto: ChatMessageDto = {
        message: 'Test message',
        activityId: '507f1f77bcf86cd799439011',
      };

      jest.spyOn(activitiesService, 'findOne').mockResolvedValue(mockActivity as any);

      const httpError: any = new Error('Internal Server Error');
      httpError.response = {
        status: 500,
        data: { error: 'Internal error' },
      };

      jest.spyOn(httpService, 'post').mockReturnValue(throwError(() => httpError));

      await expect(service.processMessage(chatMessageDto, 'fr')).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(service.processMessage(chatMessageDto, 'fr')).rejects.toThrow(
        'An error occurred while processing your message',
      );
    });

    it('should handle multiple messages in Rasa response', async () => {
      const chatMessageDto: ChatMessageDto = {
        message: 'Donne-moi plus d\'informations',
        activityId: '507f1f77bcf86cd799439011',
      };

      const multiMessageResponse: AxiosResponse = {
        data: [
          { recipient_id: 'user', text: 'Première partie de la réponse.' },
          { recipient_id: 'user', text: 'Deuxième partie de la réponse.' },
        ],
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      jest.spyOn(activitiesService, 'findOne').mockResolvedValue(mockActivity as any);
      jest.spyOn(httpService, 'post').mockReturnValue(of(multiMessageResponse));

      const result = await service.processMessage(chatMessageDto, 'fr');

      expect(result.message).toBe('Première partie de la réponse. Deuxième partie de la réponse.');
      expect(result.success).toBe(true);
    });

    it('should enrich context with activity data correctly', async () => {
      const chatMessageDto: ChatMessageDto = {
        message: 'Test',
        activityId: '507f1f77bcf86cd799439011',
      };

      jest.spyOn(activitiesService, 'findOne').mockResolvedValue(mockActivity as any);
      jest.spyOn(httpService, 'post').mockReturnValue(of(mockRasaResponse));

      await service.processMessage(chatMessageDto, 'fr');

      expect(httpService.post).toHaveBeenCalledWith(
        'http://localhost:5005/webhooks/rest/webhook',
        expect.objectContaining({
          metadata: expect.objectContaining({
            activity: expect.objectContaining({
              titre: 'Formation TypeScript',
              description: 'Formation avancée TypeScript',
              competences: ['JavaScript', 'TypeScript'],
              duration: '5 jours',
              location: 'Paris, France',
              start_date: expect.any(String),
              end_date: expect.any(String),
            }),
          }),
        }),
      );
    });
  });

  describe('rewritePrompt', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should rewrite prompt using OpenRouter API', async () => {
      process.env.OPENROUTER_API_KEY = 'test-api-key';
      process.env.OPENROUTER_MODEL = 'deepseek/deepseek-chat';

      const rewriteDto: RewritePromptDto = {
        prompt: 'salut je veux savoir plus sur cette formation',
      };

      const mockLLMResponse: AxiosResponse = {
        data: {
          choices: [
            {
              message: {
                content: 'Bonjour, je souhaiterais obtenir davantage d\'informations concernant cette formation.',
              },
            },
          ],
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      jest.spyOn(httpService, 'post').mockReturnValue(of(mockLLMResponse));

      const result = await service.rewritePrompt(rewriteDto);

      expect(httpService.post).toHaveBeenCalledWith(
        expect.stringContaining('/chat/completions'),
        expect.objectContaining({
          model: 'deepseek/deepseek-chat',
          messages: expect.arrayContaining([
            expect.objectContaining({ role: 'system' }),
            expect.objectContaining({ role: 'user', content: rewriteDto.prompt }),
          ]),
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-api-key',
          }),
        }),
      );
      expect(result.rewritten).toBe('Bonjour, je souhaiterais obtenir davantage d\'informations concernant cette formation.');
      expect(result.model).toBe('deepseek/deepseek-chat');
    });

    it('should return original prompt when API key is missing and strict mode is off', async () => {
      delete process.env.OPENROUTER_API_KEY;
      process.env.OPENROUTER_STRICT = 'false';

      const rewriteDto: RewritePromptDto = {
        prompt: 'test prompt',
      };

      const result = await service.rewritePrompt(rewriteDto);

      expect(result.rewritten).toBe('test prompt');
      expect(result.model).toBe('fallback');
      expect(httpService.post).not.toHaveBeenCalled();
    });

    it('should throw ServiceUnavailableException when API key missing and strict mode is on', async () => {
      delete process.env.OPENROUTER_API_KEY;
      process.env.OPENROUTER_STRICT = 'true';

      const rewriteDto: RewritePromptDto = {
        prompt: 'test prompt',
      };

      await expect(service.rewritePrompt(rewriteDto)).rejects.toThrow(ServiceUnavailableException);
      await expect(service.rewritePrompt(rewriteDto)).rejects.toThrow('OpenRouter API key not configured');
    });

    it('should handle API error and return fallback in non-strict mode', async () => {
      process.env.OPENROUTER_API_KEY = 'test-api-key';
      process.env.OPENROUTER_STRICT = 'false';

      const rewriteDto: RewritePromptDto = {
        prompt: 'test prompt',
      };

      jest.spyOn(httpService, 'post').mockReturnValue(throwError(() => new Error('API Error')));

      const result = await service.rewritePrompt(rewriteDto);

      expect(result.rewritten).toBe('test prompt');
      expect(result.model).toBe('fallback');
    });

    it('should use custom constraints when provided', async () => {
      process.env.OPENROUTER_API_KEY = 'test-api-key';

      const rewriteDto: RewritePromptDto = {
        prompt: 'test',
        constraints: 'Traduis en anglais professionnel',
      };

      const mockLLMResponse: AxiosResponse = {
        data: {
          choices: [{ message: { content: 'Professional test' } }],
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      jest.spyOn(httpService, 'post').mockReturnValue(of(mockLLMResponse));

      await service.rewritePrompt(rewriteDto);

      expect(httpService.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({ role: 'system', content: 'Traduis en anglais professionnel' }),
          ]),
        }),
        expect.any(Object),
      );
    });
  });

  describe('websiteGuide', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should provide website guidance using AI', async () => {
      process.env.OPENROUTER_API_KEY = 'test-api-key';

      const guideDto: WebsiteGuideDto = {
        message: 'Comment créer une activité ?',
        userRole: 'HR',
        currentPath: '/hr/dashboard',
        language: 'fr',
      };

      const mockAIResponse: AxiosResponse = {
        data: {
          choices: [
            {
              message: {
                content: '1. Allez dans le menu Activités\n2. Cliquez sur Créer une activité\n3. Remplissez le formulaire',
              },
            },
          ],
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      jest.spyOn(httpService, 'post').mockReturnValue(of(mockAIResponse));

      const result = await service.websiteGuide(guideDto);

      expect(result.reply).toContain('Allez dans le menu Activités');
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(httpService.post).toHaveBeenCalled();
    });

    it('should return fallback guidance when API key is missing', async () => {
      delete process.env.OPENROUTER_API_KEY;

      const guideDto: WebsiteGuideDto = {
        message: 'Comment utiliser le site ?',
        userRole: 'EMPLOYEE',
        currentPath: '/employee/dashboard',
      };

      const result = await service.websiteGuide(guideDto);

      expect(result.reply).toContain('AgentWebsite');
      expect(result.reply).toContain('/employee/dashboard');
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(httpService.post).not.toHaveBeenCalled();
    });

    it('should handle different user roles correctly', async () => {
      delete process.env.OPENROUTER_API_KEY;

      const roles = ['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'];

      for (const role of roles) {
        const guideDto: WebsiteGuideDto = {
          message: 'Aide',
          userRole: role,
          currentPath: `/${role.toLowerCase()}/dashboard`,
        };

        const result = await service.websiteGuide(guideDto);

        expect(result.reply).toBeDefined();
        expect(result.reply.length).toBeGreaterThan(0);
      }
    });

    it('should handle API error gracefully', async () => {
      process.env.OPENROUTER_API_KEY = 'test-api-key';

      const guideDto: WebsiteGuideDto = {
        message: 'Test',
        userRole: 'HR',
        currentPath: '/hr/activities',
      };

      jest.spyOn(httpService, 'post').mockReturnValue(throwError(() => new Error('API Error')));

      const result = await service.websiteGuide(guideDto);

      expect(result.reply).toContain('AgentWebsite');
      expect(result.timestamp).toBeInstanceOf(Date);
    });
  });
});
