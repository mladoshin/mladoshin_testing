import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from '../../users.controller';
import { IUsersService } from '../../users.service';
import { CreateUserDto } from '../../dto/create-user.dto';
import { UpdateUserDto } from '../../dto/update-user.dto';
import { UserRole } from '../../entities/user.entity';
import { IAppLoggerService } from 'src/common/logging/log.service';
import { UserBuilder } from 'src/common/tests/builders/user.builder';
import { UserObjectMother } from 'src/common/tests/object-mothers/user-object-mother';
import { RepositoryNotFoundError } from 'src/common/errors/db-errors';

describe('UsersController (unit)', () => {
  let controller: UsersController;
  let service: Partial<Record<keyof IUsersService, jest.Mock>>;
  let mockLoggerService: Partial<Record<keyof IAppLoggerService, jest.Mock>>;

  beforeAll(async () => {
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

  // ---------- CREATE ----------
  describe('create', () => {
    it('✅ должен создать пользователя и вернуть UserResponse', async () => {
      // Используем ObjectMother для создания DTO
      const dto: CreateUserDto = UserObjectMother.buildCreateDto({
        email: 'test@example.com',
        password: 'secret123',
        role: UserRole.USER,
      });

      // Используем Builder для создания сущности
      const user = new UserBuilder()
        .withEmail('test@example.com')
        .withPassword('secret123')
        .withRole(UserRole.USER)
        .withFirstName(dto.first_name!)
        .withLastName(dto.last_name!)
        .build();

      service.create!.mockResolvedValue(user);

      const result = await controller.create(dto);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toMatchObject({
        email: user.email,
        role: user.role,
      });
    });

    it('❌ должен выбросить ошибку при создании пользователя с некорректными данными', async () => {
      const dto: CreateUserDto = UserObjectMother.buildCreateDto();

      service.create!.mockRejectedValue(new Error('Ошибка создания пользователя'));

      await expect(controller.create(dto)).rejects.toThrow('Ошибка создания пользователя');
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });

  // ---------- FIND ALL ----------
  describe('findAll', () => {
    it('✅ должен вернуть массив UserResponse', async () => {
      const user1 = new UserBuilder()
        .withEmail('user1@example.com')
        .withFirstName('Иван')
        .build();
      const user2 = new UserBuilder()
        .withEmail('user2@example.com')
        .withFirstName('Петр')
        .build();

      service.findAll!.mockResolvedValue([user1, user2]);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({ email: user1.email });
      expect(result[1]).toMatchObject({ email: user2.email });
    });

    it('❌ должен вернуть пустой массив когда пользователей нет', async () => {
      service.findAll!.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  // ---------- FIND ONE ----------
  describe('findOne', () => {
    it('✅ должен вернуть один UserResponse', async () => {
      const user = new UserBuilder()
        .withId('user-1')
        .withEmail('test@example.com')
        .build();

      service.findOne!.mockResolvedValue(user);

      const result = await controller.findOne('user-1');

      expect(service.findOne).toHaveBeenCalledWith('user-1');
      expect(result).toMatchObject({
        id: user.id,
        email: user.email,
      });
    });

    it('❌ должен выбросить ошибку когда пользователь не найден', async () => {
      service.findOne!.mockRejectedValue(
        new RepositoryNotFoundError('Пользователь не найден', 'User'),
      );

      await expect(controller.findOne('invalid-id')).rejects.toThrow(
        RepositoryNotFoundError,
      );
      expect(service.findOne).toHaveBeenCalledWith('invalid-id');
    });
  });

  // ---------- UPDATE ----------
  describe('update', () => {
    it('✅ должен обновить пользователя и вернуть UserResponse', async () => {
      const dto: UpdateUserDto = UserObjectMother.buildUpdateDto({
        first_name: 'Обновленное имя',
        last_name: 'Обновленная фамилия',
      });

      const updatedUser = new UserBuilder()
        .withId('user-1')
        .withFirstName('Обновленное имя')
        .withLastName('Обновленная фамилия')
        .build();

      service.update!.mockResolvedValue(updatedUser);

      const result = await controller.update('user-1', dto);

      expect(service.update).toHaveBeenCalledWith('user-1', dto);
      expect(result).toMatchObject({
        id: 'user-1',
        first_name: 'Обновленное имя',
        last_name: 'Обновленная фамилия',
      });
    });

    it('❌ должен выбросить ошибку при обновлении несуществующего пользователя', async () => {
      const dto: UpdateUserDto = UserObjectMother.buildUpdateDto({
        first_name: 'Новое имя',
      });

      service.update!.mockRejectedValue(
        new RepositoryNotFoundError('Пользователь не найден', 'User'),
      );

      await expect(controller.update('invalid-id', dto)).rejects.toThrow(
        RepositoryNotFoundError,
      );
      expect(service.update).toHaveBeenCalledWith('invalid-id', dto);
    });
  });

  // ---------- REMOVE ----------
  describe('remove', () => {
    it('✅ должен удалить пользователя и вернуть UserResponse', async () => {
      const user = new UserBuilder()
        .withId('user-1')
        .withEmail('test@example.com')
        .build();

      service.remove!.mockResolvedValue(user);

      const result = await controller.remove('user-1');

      expect(service.remove).toHaveBeenCalledWith('user-1');
      expect(result).toMatchObject({
        id: user.id,
        email: user.email,
      });
    });

    it('❌ должен выбросить ошибку при удалении несуществующего пользователя', async () => {
      service.remove!.mockRejectedValue(
        new RepositoryNotFoundError('Пользователь не найден', 'User'),
      );

      await expect(controller.remove('invalid-id')).rejects.toThrow(
        RepositoryNotFoundError,
      );
      expect(service.remove).toHaveBeenCalledWith('invalid-id');
    });
  });
});
