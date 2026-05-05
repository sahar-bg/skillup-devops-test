import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ManagerService } from './manager.service';
import { User, UserRole } from '../users/schemas/user.schema';
import { Department } from '../users/schemas/department.schema';
import { Activity } from '../activities/schemas/activity.schema';
import { ActivityRequest } from './schemas/activity-request.schema';
import { Fiche } from '../users/schemas/fiche.schema';
import { Competence } from '../users/schemas/competence.schema';
import { Recommendation } from '../recommendations/schemas/recommendation.schema';
import { CreateActivityRequestDto } from './dto/create-activity-request.dto';
import { ConfirmParticipantsDto } from './dto/confirm-participants.dto';
import { AddEmployeeDto } from './dto/add-employee.dto';
import { EvaluateCompetenceDto } from './dto/evaluate-competence.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { MailService } from '../mail/mail.service';

describe('ManagerService', () => {
  let service: ManagerService;
  let userModel: any;
  let departmentModel: any;
  let activityModel: any;
  let activityRequestModel: any;
  let ficheModel: any;
  let competenceModel: any;
  let recommendationModel: any;
  let notificationsService: any;
  let mailService: any;

  const mockManager = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Jean Manager',
    email: 'jean.manager@example.com',
    role: UserRole.MANAGER,
    department_id: '507f1f77bcf86cd799439099',
  };

  const mockDepartment = {
    _id: '507f1f77bcf86cd799439099',
    name: 'IT Department',
    code: 'IT',
    manager_id: '507f1f77bcf86cd799439011',
  };

  const mockActivity = {
    _id: '507f1f77bcf86cd799439021',
    title: 'Formation TypeScript',
    description: 'Formation avancée',
    departmentId: '507f1f77bcf86cd799439099',
    type: 'formation',
    maxParticipants: 20,
    startDate: new Date('2024-06-01'),
    endDate: new Date('2024-06-05'),
  };

  const mockEmployee = {
    _id: '507f1f77bcf86cd799439031',
    name: 'Marie Employée',
    email: 'marie.employee@example.com',
    matricule: 'EMP001',
    role: UserRole.EMPLOYEE,
    department_id: '507f1f77bcf86cd799439099',
  };

  beforeEach(async () => {
    userModel = {
      findById: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn(),
        }),
        exec: jest.fn(),
      }),
      find: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              exec: jest.fn(),
            }),
            limit: jest.fn(),
          }),
          sort: jest.fn().mockReturnValue({
            exec: jest.fn(),
          }),
          exec: jest.fn(),
        }),
        exec: jest.fn(),
      }),
      countDocuments: jest.fn(),
    };

    departmentModel = {
      findOne: jest.fn().mockReturnValue({
        exec: jest.fn(),
      }),
      findById: jest.fn().mockReturnValue({
        exec: jest.fn(),
      }),
    };

    activityModel = {
      findById: jest.fn(),
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
      }),
      create: jest.fn(),
      countDocuments: jest.fn(),
    };

    activityRequestModel = {
      create: jest.fn(),
      findById: jest.fn().mockReturnValue({
        exec: jest.fn(),
      }),
      find: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              exec: jest.fn(),
            }),
          }),
        }),
        sort: jest.fn().mockReturnValue({
          exec: jest.fn(),
        }),
      }),
    };

    ficheModel = {
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
      }),
      findById: jest.fn(),
      countDocuments: jest.fn(),
    };

    competenceModel = {
      find: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnThis(),
        }),
      }),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
    };

    recommendationModel = {
      findOne: jest.fn(),
    };

    notificationsService = {
      create: jest.fn().mockResolvedValue({}),
    };

    mailService = {
      sendEmployeeInvitation: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ManagerService,
        {
          provide: getModelToken(User.name),
          useValue: userModel,
        },
        {
          provide: getModelToken(Department.name),
          useValue: departmentModel,
        },
        {
          provide: getModelToken(Activity.name),
          useValue: activityModel,
        },
        {
          provide: getModelToken(ActivityRequest.name),
          useValue: activityRequestModel,
        },
        {
          provide: getModelToken(Fiche.name),
          useValue: ficheModel,
        },
        {
          provide: getModelToken(Competence.name),
          useValue: competenceModel,
        },
        {
          provide: getModelToken(Recommendation.name),
          useValue: recommendationModel,
        },
        {
          provide: NotificationsService,
          useValue: notificationsService,
        },
        {
          provide: MailService,
          useValue: mailService,
        },
      ],
    }).compile();

    service = module.get<ManagerService>(ManagerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createActivityRequest', () => {
    it('should throw BadRequestException for invalid manager ID', async () => {
      const dto: CreateActivityRequestDto = {
        title: 'Test Activity',
        description: 'Test Description',
        type: 'formation',
        requiredSkills: [],
        maxParticipants: 20,
        startDate: new Date(),
        endDate: new Date(),
      };

      await expect(service.createActivityRequest('invalid-id', dto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createActivityRequest('invalid-id', dto)).rejects.toThrow(
        'ID manager invalide',
      );
    });

    it('should throw BadRequestException if user is not a manager', async () => {
      const nonManager = { ...mockManager, role: UserRole.EMPLOYEE };
      userModel.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(nonManager),
        }),
      });

      const dto: CreateActivityRequestDto = {
        title: 'Test Activity',
        description: 'Test Description',
        type: 'formation',
        requiredSkills: [],
        maxParticipants: 20,
        startDate: new Date(),
        endDate: new Date(),
      };

      await expect(
        service.createActivityRequest('507f1f77bcf86cd799439011', dto),
      ).rejects.toThrow('Seul un manager peut créer une demande');
    });

    it('should create activity request successfully', async () => {
      userModel.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockManager),
        }),
      });

      const mockRequest = {
        _id: '507f1f77bcf86cd799439041',
        managerId: mockManager._id,
        department_id: mockManager.department_id,
        status: 'PENDING',
      };

      activityRequestModel.create.mockResolvedValue(mockRequest);

      userModel.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([{ _id: 'hr1' }, { _id: 'hr2' }]),
        }),
      });

      const dto: CreateActivityRequestDto = {
        title: 'Test Activity',
        description: 'Test Description',
        type: 'formation',
        requiredSkills: [],
        maxParticipants: 20,
        startDate: new Date(),
        endDate: new Date(),
      };

      const result = await service.createActivityRequest('507f1f77bcf86cd799439011', dto);

      expect(result.message).toBe('Demande envoyée à RH');
      expect(result.request).toEqual(mockRequest);
      expect(activityRequestModel.create).toHaveBeenCalled();
      expect(notificationsService.create).toHaveBeenCalledTimes(2);
    });
  });

  describe('getMyActivities', () => {
    it('should throw BadRequestException for invalid manager ID', async () => {
      await expect(service.getMyActivities('invalid-id')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should return empty array when manager has no department', async () => {
      // Mock findOne pour ne pas trouver de département via manager_id (pas de .exec())
      departmentModel.findOne.mockResolvedValue(null);

      // Mock findById pour retourner un manager sans department_id
      userModel.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({ _id: '507f1f77bcf86cd799439011' }),
        }),
      });

      // Mock findById du département pour retourner null (pas de département trouvé)
      departmentModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await service.getMyActivities('507f1f77bcf86cd799439011');

      expect(result.activities).toEqual([]);
      expect(result.department).toBeNull();
    });

    it('should return activities for manager department', async () => {
      // Mock findOne pour trouver le département directement (pas de .exec())
      departmentModel.findOne.mockResolvedValue(mockDepartment);

      // Mock find pour retourner les activités
      activityModel.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue([mockActivity]),
      });

      const result = await service.getMyActivities('507f1f77bcf86cd799439011');

      expect(result.activities).toHaveLength(1);
      expect(result.department).toBeDefined();
      expect(result.department?.name).toBe('IT Department');
      expect(result.total).toBe(1);
    });
  });

  describe('getActivityDetail', () => {
    it('should throw BadRequestException for invalid activity ID', async () => {
      await expect(service.getActivityDetail('invalid-id')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException when activity not found', async () => {
      activityModel.findById.mockResolvedValue(null);

      await expect(
        service.getActivityDetail('507f1f77bcf86cd799439021'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return activity details', async () => {
      activityModel.findById.mockResolvedValue(mockActivity);

      const result = await service.getActivityDetail('507f1f77bcf86cd799439021');

      expect(result.activity).toEqual(mockActivity);
      expect(activityModel.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439021');
    });
  });

  describe('getMyEmployees', () => {
    it('should throw BadRequestException for invalid manager ID', async () => {
      await expect(service.getMyEmployees('invalid-id')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should return empty array when manager has no department', async () => {
      departmentModel.findOne.mockResolvedValue(null);

      const result = await service.getMyEmployees('507f1f77bcf86cd799439011');

      expect(result.employees).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should return employees of manager department', async () => {
      departmentModel.findOne.mockResolvedValue(mockDepartment);

      userModel.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue([mockEmployee]),
        }),
      });

      const result = await service.getMyEmployees('507f1f77bcf86cd799439011');

      expect(result.employees).toHaveLength(1);
      expect(result.department).toBe('IT Department');
      expect(result.total).toBe(1);
    });
  });

  describe('confirmParticipants', () => {
    it('should throw BadRequestException for invalid activity ID', async () => {
      const dto: ConfirmParticipantsDto = {
        confirmedEmployeeIds: [],
        rejectedEmployeeIds: [],
      };

      await expect(
        service.confirmParticipants('invalid-id', dto, '507f1f77bcf86cd799439011'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when activity not found', async () => {
      activityModel.findById.mockResolvedValue(null);

      const dto: ConfirmParticipantsDto = {
        confirmedEmployeeIds: [],
        rejectedEmployeeIds: [],
      };

      await expect(
        service.confirmParticipants('507f1f77bcf86cd799439021', dto, '507f1f77bcf86cd799439011'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should confirm participants successfully', async () => {
      activityModel.findById.mockResolvedValue(mockActivity);

      userModel.findById.mockResolvedValue(mockEmployee);

      const dto: ConfirmParticipantsDto = {
        confirmedEmployeeIds: ['507f1f77bcf86cd799439031'],
        rejectedEmployeeIds: [],
      };

      const result = await service.confirmParticipants(
        '507f1f77bcf86cd799439021',
        dto,
        '507f1f77bcf86cd799439011',
      );

      expect(result.message).toBe('Participants confirmés avec succès');
      expect(result.confirmedCount).toBe(1);
      expect(result.rejectedCount).toBe(0);
    });
  });

  describe('addEmployeeManually', () => {
    it('should throw BadRequestException for invalid IDs', async () => {
      const dto: AddEmployeeDto = {
        employeeId: 'invalid-id',
      };

      await expect(service.addEmployeeManually('507f1f77bcf86cd799439021', dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException when activity not found', async () => {
      activityModel.findById.mockResolvedValue(null);

      const dto: AddEmployeeDto = {
        employeeId: '507f1f77bcf86cd799439031',
      };

      await expect(service.addEmployeeManually('507f1f77bcf86cd799439021', dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when user is not an employee', async () => {
      activityModel.findById.mockResolvedValue(mockActivity);

      const nonEmployee = { ...mockEmployee, role: UserRole.MANAGER };
      userModel.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(nonEmployee),
      });

      const dto: AddEmployeeDto = {
        employeeId: '507f1f77bcf86cd799439031',
      };

      await expect(service.addEmployeeManually('507f1f77bcf86cd799439021', dto)).rejects.toThrow(
        'Cet utilisateur n\'est pas un employé',
      );
    });

    it('should add employee manually successfully', async () => {
      activityModel.findById.mockResolvedValue(mockActivity);

      userModel.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockEmployee),
      });

      const dto: AddEmployeeDto = {
        employeeId: '507f1f77bcf86cd799439031',
        score: 0.85,
      };

      const result = await service.addEmployeeManually('507f1f77bcf86cd799439021', dto);

      expect(result.message).toContain('ajouté à l\'activité avec succès');
      expect(result.employee.name).toBe('Marie Employée');
      expect(result.score).toBe(0.85);
    });
  });

  describe('evaluateCompetence', () => {
    it('should throw BadRequestException for invalid competence ID', async () => {
      const dto: EvaluateCompetenceDto = {
        competenceId: 'invalid-id',
        hierarchie_eval: 8,
      };

      await expect(service.evaluateCompetence(dto, '507f1f77bcf86cd799439011')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException when competence not found', async () => {
      competenceModel.findById.mockResolvedValue(null);

      const dto: EvaluateCompetenceDto = {
        competenceId: '507f1f77bcf86cd799439051',
        hierarchie_eval: 8,
      };

      await expect(service.evaluateCompetence(dto, '507f1f77bcf86cd799439011')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when competence is already validated', async () => {
      const validatedCompetence = {
        _id: '507f1f77bcf86cd799439051',
        etat: 'validated',
      };

      competenceModel.findById.mockResolvedValue(validatedCompetence);

      const dto: EvaluateCompetenceDto = {
        competenceId: '507f1f77bcf86cd799439051',
        hierarchie_eval: 8,
      };

      await expect(service.evaluateCompetence(dto, '507f1f77bcf86cd799439011')).rejects.toThrow(
        'Cette compétence est déjà validée',
      );
    });

    it('should evaluate competence successfully', async () => {
      const competence = {
        _id: '507f1f77bcf86cd799439051',
        intitule: 'TypeScript',
        type: 'hard',
        auto_eval: 'intermediate',
        etat: 'draft',
      };

      competenceModel.findById.mockResolvedValue(competence);

      const updatedCompetence = {
        ...competence,
        hierarchie_eval: 8,
        etat: 'validated',
      };

      competenceModel.findByIdAndUpdate.mockResolvedValue(updatedCompetence);

      const dto: EvaluateCompetenceDto = {
        competenceId: '507f1f77bcf86cd799439051',
        hierarchie_eval: 8,
        commentaire: 'Excellent travail',
      };

      const result = await service.evaluateCompetence(dto, '507f1f77bcf86cd799439011');

      expect(result.message).toBe('Évaluation enregistrée avec succès');
      expect(result.competence.hierarchie_eval).toBe(8);
      expect(result.competence.etat).toBe('validated');
      expect(result.commentaire).toBe('Excellent travail');
    });
  });

  describe('getDashboard', () => {
    it('should throw BadRequestException for invalid manager ID', async () => {
      await expect(service.getDashboard('invalid-id')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when manager not found', async () => {
      // Mock findById pour ne pas trouver le manager
      userModel.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await expect(service.getDashboard('507f1f77bcf86cd799439011')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return dashboard statistics', async () => {
      // Mock findById pour retourner le manager (sans .exec())
      userModel.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockManager),
      });

      // Mock findOne pour retourner le département
      departmentModel.findOne.mockResolvedValue(mockDepartment);

      // Mock pour countDocuments (totalEmployees et totalActivities)
      userModel.countDocuments.mockResolvedValue(15);
      activityModel.countDocuments.mockResolvedValue(5);

      // Mock pour find (récupération des employés pour pendingEvaluations)
      userModel.find.mockResolvedValue([mockEmployee]);

      ficheModel.countDocuments.mockResolvedValue(3);

      const result = await service.getDashboard('507f1f77bcf86cd799439011');

      expect(result.manager.name).toBe('Jean Manager');
      expect(result.department).toBeDefined();
      expect(result.stats.totalEmployees).toBe(15);
      expect(result.stats.totalActivities).toBe(5);
      expect(result.stats.pendingEvaluations).toBe(3);
    });
  });
});
