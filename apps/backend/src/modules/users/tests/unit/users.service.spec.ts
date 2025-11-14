import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../../users.service';
import { IUserRepo } from '../../users.repository';
import { RepositoryNotFoundError } from 'src/common/errors/db-errors';
import { UserObjectMother } from 'src/common/tests/object-mothers/user-object-mother';
import { UserBuilder } from 'src/common/tests/builders/user.builder';

describe('UsersService (unit)', () => {
  let service: UsersService;
  let repo: jest.Mocked<IUserRepo>;

  beforeEach(async () => {
    const repoMock: jest.Mocked<IUserRepo> = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOrFailById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, { provide: 'IUserRepo', useValue: repoMock }],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repo = module.get('IUserRepo');
  });

  // ---------- CREATE ----------
  describe('create', () => {
    it('✅ должен создать пользователя', async () => {
      // Используем ObjectMother для создания DTO
      const dto = UserObjectMother.buildCreateDto();
      
      // Используем Builder для создания сущности
      const user = new UserBuilder()
        .withEmail(dto.email)
        .withFirstName(dto.first_name!)
        .withLastName(dto.last_name!)
        .build();
      
      repo.create.mockResolvedValue(user);

      const result = await service.create(dto);

      expect(repo.create).toHaveBeenCalledWith(dto, undefined);
      expect(result).toEqual(user);
    });

    it('❌ должен выбросить ошибку при ошибке репозитория', async () => {
      const dto = UserObjectMother.buildCreateDto();
      repo.create.mockRejectedValue(new Error('DB error'));

      await expect(service.create(dto)).rejects.toThrow(Error);
    });
  });

  // ---------- FIND ALL ----------
  describe('findAll', () => {
    it('✅ должен вернуть всех пользователей', async () => {
      const user = new UserBuilder().withEmail('user1@example.com').build();
      const users = [user];
      repo.findAll.mockResolvedValue(users);

      const result = await service.findAll();

      expect(result).toEqual(users);
    });

    it('❌ должен вернуть пустой массив если пользователей нет', async () => {
      repo.findAll.mockResolvedValue([]);
      
      const result = await service.findAll();
      
      expect(result).toEqual([]);
    });
  });

  // ---------- FIND ONE ----------
  describe('findOne', () => {
    it('✅ должен вернуть пользователя по id', async () => {
      const user = new UserBuilder()
        .withId('user-1')
        .withEmail('test@example.com')
        .build();
      
      repo.findOrFailById.mockResolvedValue(user);

      const result = await service.findOne('user-1');

      expect(result).toEqual(user);
    });

    it('❌ должен выбросить ошибку для несуществующего id', async () => {
      repo.findOrFailById.mockRejectedValue(
        new RepositoryNotFoundError('Пользователь не найден.', 'User'),
      );
      
      await expect(service.findOne('invalid-id')).rejects.toThrow(
        RepositoryNotFoundError,
      );
    });
  });

  // ---------- UPDATE ----------
  describe('update', () => {
    it('✅ должен обновить пользователя', async () => {
      const updateDto = UserObjectMother.buildUpdateDto({
        first_name: 'Петр',
        last_name: 'Петров',
      });

      const user = new UserBuilder()
        .withFirstName('Петр')
        .withLastName('Петров')
        .build();
      
      repo.update.mockResolvedValue(user);

      const result = await service.update('user-1', updateDto);

      expect(result.profile.first_name).toBe('Петр');
      expect(result.profile.last_name).toBe('Петров');
    });

    it('❌ должен выбросить ошибку если пользователь не найден', async () => {
      const updateDto = UserObjectMother.buildUpdateDto();
      repo.update.mockRejectedValue(
        new RepositoryNotFoundError('Пользователь не найден.', 'User'),
      );
      
      await expect(service.update('user-1', updateDto)).rejects.toThrow(
        RepositoryNotFoundError,
      );
    });
  });

  // ---------- REMOVE ----------
  describe('remove', () => {
    it('✅ должен удалить пользователя', async () => {
      const user = new UserBuilder()
        .withId('user-1')
        .withEmail('test@example.com')
        .build();
      
      repo.delete.mockResolvedValue(user);

      const result = await service.remove('user-1');

      expect(result).toEqual(user);
    });

    it('❌ должен выбросить ошибку для несуществующего id', async () => {
      repo.delete.mockRejectedValue(
        new RepositoryNotFoundError('Пользователь не найден.', 'User'),
      );
      
      await expect(service.remove('invalid-id')).rejects.toThrow(
        RepositoryNotFoundError,
      );
    });
  });
});
