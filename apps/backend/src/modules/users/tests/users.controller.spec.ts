// users.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from '../users.controller';
import { IUsersService, UsersService } from '../users.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserResponse } from '../dto/user-response.dto';
import { User, UserRole } from '../entities/user.entity';
import { IAppLoggerService } from 'src/common/logging/log.service';

describe('UsersController', () => {
  let controller: UsersController;
  let service: Partial<Record<keyof IUsersService, jest.Mock>>;
  let mockLoggerService: Partial<Record<keyof IAppLoggerService, jest.Mock>>;

  beforeAll(async () => {
    // Mock each service method
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    mockLoggerService = {
      accessLog: jest.fn(),
      error: jest.fn(),
      log: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: 'IUsersService', useValue: service },
        { provide: 'IAppLoggerService', useValue: mockLoggerService },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Sample user entity
  const sampleUser: User = {
    id: 'user-1',
    email: 'test@example.com',
    password: '1234',
    payments: [],
    profile: {
      id: '1',
      user: {} as any,
      bio: '',
      first_name: 'Maxim',
      last_name: 'Ladoshin',
    },
    role: UserRole.USER,
  };
  const response = UserResponse.make(sampleUser);
  const responseList = [response];

  describe('create', () => {
    it('should create a user and return UserResponse', async () => {
      const dto: CreateUserDto = {
        email: 'test@example.com',
        password: 'secret',
        role: UserRole.USER,
        first_name: 'Maxim',
        last_name: 'Ladoshin',
      };
      service.create!.mockResolvedValue(sampleUser);

      const result = await controller.create(dto);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(response);
    });
  });

  describe('findAll', () => {
    it('should return an array of UserResponse', async () => {
      service.findAll!.mockResolvedValue([sampleUser]);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(responseList);
    });
  });

  describe('findOne', () => {
    it('should return a single UserResponse', async () => {
      service.findOne!.mockResolvedValue(sampleUser);

      const result = await controller.findOne('user-1');

      expect(service.findOne).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(response);
    });
  });

  describe('update', () => {
    it('should update a user and return UserResponse', async () => {
      const dto: UpdateUserDto = {
        email: 'new@example.com',
        role: UserRole.ADMIN,
      };
      const updated = { ...sampleUser, ...dto };
      service.update!.mockResolvedValue(updated);

      const result = await controller.update('user-1', dto);

      expect(service.update).toHaveBeenCalledWith('user-1', dto);
      expect(result).toEqual(UserResponse.make(updated));
    });
  });

  describe('remove', () => {
    it('should remove a user and return UserResponse', async () => {
      service.remove!.mockResolvedValue(sampleUser);

      const result = await controller.remove('user-1');

      expect(service.remove).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(response);
    });
  });
});
