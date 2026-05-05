import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { Activity } from './schemas/activity.schema';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';

describe('ActivitiesService', () => {
  let service: ActivitiesService;
  let mockActivityModel: any;

  const mockActivity = {
    _id: '507f1f77bcf86cd799439011',
    title: 'Formation TypeScript',
    description: 'Formation avancée TypeScript',
    departmentId: '507f1f77bcf86cd799439099',
    type: 'formation',
    requiredSkills: [
      { skill_name: 'JavaScript', desired_level: 'intermediate' },
    ],
    maxParticipants: 20,
    startDate: new Date('2024-06-01'),
    endDate: new Date('2024-06-05'),
    location: '48.8566,2.3522',
    status: 'draft',
  };

  beforeEach(async () => {
    mockActivityModel = {
      new: jest.fn().mockResolvedValue(mockActivity),
      constructor: jest.fn().mockResolvedValue(mockActivity),
      find: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivitiesService,
        {
          provide: getModelToken(Activity.name),
          useValue: mockActivityModel,
        },
      ],
    }).compile();

    service = module.get<ActivitiesService>(ActivitiesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new activity with location object', async () => {
      const createActivityDto: CreateActivityDto = {
        title: 'Formation TypeScript',
        description: 'Formation avancée TypeScript',
        departmentId: '507f1f77bcf86cd799439099',
        type: 'formation',
        requiredSkills: [
          { skill_name: 'JavaScript', desired_level: 'intermediate' },
        ],
        maxParticipants: 20,
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-06-05'),
        location: {
          lat: 48.8566,
          lng: 2.3522,
          address: 'Paris, France',
        },
      };

      const saveMock = jest.fn().mockResolvedValue(mockActivity);
      mockActivityModel.new = jest.fn().mockImplementation(() => ({
        save: saveMock,
      }));

      // Mock constructor to return object with save method
      jest.spyOn(mockActivityModel, 'constructor' as any).mockImplementation(() => ({
        save: saveMock,
      }));

      // Create a mock constructor function
      const MockConstructor = function (this: any, dto: any) {
        Object.assign(this, dto);
        this.save = saveMock;
      };

      // Replace the model with our mock constructor
      (service as any).activityModel = MockConstructor as any;

      const result = await service.create(createActivityDto);

      expect(saveMock).toHaveBeenCalled();
      expect(result).toEqual(mockActivity);
    });

    it('should create activity with string location', async () => {
      const createActivityDto: CreateActivityDto = {
        title: 'Formation TypeScript',
        description: 'Formation avancée TypeScript',
        departmentId: '507f1f77bcf86cd799439099',
        type: 'formation',
        requiredSkills: [],
        maxParticipants: 20,
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-06-05'),
        location: {
          lat: 48.8566,
          lng: 2.3522,
          address: 'Paris, France',
        },
      };

      const saveMock = jest.fn().mockResolvedValue(mockActivity);
      const MockConstructor = function (this: any, dto: any) {
        Object.assign(this, dto);
        this.save = saveMock;
      };

      (service as any).activityModel = MockConstructor as any;

      await service.create(createActivityDto);

      expect(saveMock).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all activities sorted by startDate', async () => {
      const activities = [mockActivity, { ...mockActivity, _id: '507f1f77bcf86cd799439012' }];

      const sortMock = jest.fn().mockResolvedValue(activities);
      mockActivityModel.find.mockReturnValue({
        sort: sortMock,
      });

      const result = await service.findAll();

      expect(mockActivityModel.find).toHaveBeenCalled();
      expect(sortMock).toHaveBeenCalledWith({ startDate: -1 });
      expect(result).toEqual(activities);
    });

    it('should return empty array when no activities exist', async () => {
      const sortMock = jest.fn().mockResolvedValue([]);
      mockActivityModel.find.mockReturnValue({
        sort: sortMock,
      });

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return an activity by id', async () => {
      mockActivityModel.findById.mockResolvedValue(mockActivity);

      const result = await service.findOne('507f1f77bcf86cd799439011');

      expect(mockActivityModel.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(result).toEqual(mockActivity);
    });

    it('should throw BadRequestException for invalid id', async () => {
      await expect(service.findOne('invalid-id')).rejects.toThrow(BadRequestException);
      await expect(service.findOne('invalid-id')).rejects.toThrow('ID invalide');
    });

    it('should throw NotFoundException when activity not found', async () => {
      mockActivityModel.findById.mockResolvedValue(null);

      await expect(service.findOne('507f1f77bcf86cd799439011')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('507f1f77bcf86cd799439011')).rejects.toThrow('Activité non trouvée');
    });
  });

  describe('update', () => {
    it('should update an activity', async () => {
      const updateActivityDto: UpdateActivityDto = {
        title: 'Formation TypeScript Avancée',
        description: 'Nouvelle description',
      };

      const updatedActivity = { ...mockActivity, ...updateActivityDto };
      mockActivityModel.findByIdAndUpdate.mockResolvedValue(updatedActivity);

      const result = await service.update('507f1f77bcf86cd799439011', updateActivityDto);

      expect(mockActivityModel.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        updateActivityDto,
        { new: true },
      );
      expect(result).toEqual(updatedActivity);
    });

    it('should update activity with location string', async () => {
      const updateActivityDto: UpdateActivityDto = {
        location: 'Paris, France',
      };

      const updatedActivity = { ...mockActivity, location: 'Paris, France' };
      mockActivityModel.findByIdAndUpdate.mockResolvedValue(updatedActivity);

      const result = await service.update('507f1f77bcf86cd799439011', updateActivityDto);

      expect(mockActivityModel.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        { location: 'Paris, France' },
        { new: true },
      );
      expect(result.location).toBe('Paris, France');
    });

    it('should throw BadRequestException for invalid id', async () => {
      const updateActivityDto: UpdateActivityDto = { title: 'New Title' };

      await expect(service.update('invalid-id', updateActivityDto)).rejects.toThrow(BadRequestException);
      await expect(service.update('invalid-id', updateActivityDto)).rejects.toThrow('ID invalide');
    });

    it('should throw NotFoundException when activity not found', async () => {
      const updateActivityDto: UpdateActivityDto = { title: 'New Title' };
      mockActivityModel.findByIdAndUpdate.mockResolvedValue(null);

      await expect(service.update('507f1f77bcf86cd799439011', updateActivityDto)).rejects.toThrow(NotFoundException);
      await expect(service.update('507f1f77bcf86cd799439011', updateActivityDto)).rejects.toThrow('Activité non trouvée');
    });
  });

  describe('remove', () => {
    it('should delete an activity', async () => {
      mockActivityModel.findByIdAndDelete.mockResolvedValue(mockActivity);

      const result = await service.remove('507f1f77bcf86cd799439011');

      expect(mockActivityModel.findByIdAndDelete).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(result).toEqual({ message: 'Activité supprimée avec succès' });
    });

    it('should throw BadRequestException for invalid id', async () => {
      await expect(service.remove('invalid-id')).rejects.toThrow(BadRequestException);
      await expect(service.remove('invalid-id')).rejects.toThrow('ID invalide');
    });

    it('should throw NotFoundException when activity not found', async () => {
      mockActivityModel.findByIdAndDelete.mockResolvedValue(null);

      await expect(service.remove('507f1f77bcf86cd799439011')).rejects.toThrow(NotFoundException);
      await expect(service.remove('507f1f77bcf86cd799439011')).rejects.toThrow('Activité non trouvée');
    });
  });
});
