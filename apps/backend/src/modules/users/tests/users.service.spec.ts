import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../users.service';
import { IUserRepo } from '../users.repository';
import { UserBuilder } from './builders/user.builder';
import { UserFactory } from './factories/user.factory';
import { RepositoryNotFoundError } from 'src/common/errors/db-errors';

describe('UsersService', () => {
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

  describe('create', () => {
    it('✅ should create a user', async () => {
      const dto = new UserBuilder().buildCreateDto();
      const user = UserFactory.default();
      repo.create.mockResolvedValue(user);

      const result = await service.create(dto);

      expect(repo.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(user);
    });
  });

  describe('findAll', () => {
    it('✅ should return all users', async () => {
      const users = [UserFactory.default()];
      repo.findAll.mockResolvedValue(users);

      const result = await service.findAll();

      expect(result).toEqual(users);
    });
  });

  describe('findOne', () => {
    it('✅ should return a user by id', async () => {
      const user = UserFactory.default();
      repo.findOrFailById.mockResolvedValue(user);

      const result = await service.findOne('user-1');

      expect(result).toEqual(user);
    });

    it('❌ should throw RepositoryNotFoundError if not found', async () => {
      repo.findOrFailById.mockRejectedValue(
        new RepositoryNotFoundError('User', 'invalid-id'),
      );

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        RepositoryNotFoundError,
      );
    });
  });

  describe('update', () => {
    it('✅ should update a user', async () => {
      const updateDto = new UserBuilder()
        .withFirstName('Jane')
        .withLastName('Doe')
        .buildUpdateDto();

      const user = new UserBuilder()
        .withFirstName('Jane')
        .withLastName('Doe')
        .build();
      repo.update.mockResolvedValue(user);

      const result = await service.update('user-1', updateDto);

      console.log(user, result);

      expect(result.profile.first_name).toBe('Jane');
      expect(result.profile.last_name).toBe('Doe');
    });

    it('❌ should throw RepositoryNotFoundError if user not found', async () => {
      const updateDto = new UserBuilder().buildUpdateDto();
      repo.update.mockRejectedValue(
        new RepositoryNotFoundError('User', 'user-1'),
      );

      await expect(service.update('user-1', updateDto)).rejects.toThrow(
        RepositoryNotFoundError,
      );
    });
  });

  describe('remove', () => {
    it('✅ should remove a user', async () => {
      const user = UserFactory.default();
      repo.delete.mockResolvedValue(user);

      const result = await service.remove('user-1');

      expect(result).toEqual(user);
    });

    it('❌ should throw RepositoryNotFoundError if user not found', async () => {
      repo.delete.mockRejectedValue(
        new RepositoryNotFoundError('User', 'user-1'),
      );

      await expect(service.remove('user-1')).rejects.toThrow(
        RepositoryNotFoundError,
      );
    });
  });
});
