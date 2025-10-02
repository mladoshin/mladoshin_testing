import { Test, TestingModule } from '@nestjs/testing';
import { UserAvailabilityService } from '../user-availability.service';
import { IUserAvailabilityRepo } from '../user-availability.repository';
import { CreateUserAvailabilityDto } from '../dto/create-user-availability.dto';
import { UpdateUserAvailabilityDto } from '../dto/update-user-availability.dto';
import { GetUserAvailabilitiesQueryDto } from '../dto/get-user-availabilities-query.dto';
import { UserAvailabilityBuilder } from './builders/user-availability.builder';
import { UserAvailabilityFactory } from './factories/user-availability.factory';
import { JWTPayload } from '../../auth/guards/AuthGuard';
import { UserRole } from 'src/modules/users/entities/user.entity';

describe('UserAvailabilityService', () => {
  let service: UserAvailabilityService;
  let repo: jest.Mocked<IUserAvailabilityRepo>;
  const user: JWTPayload = { id: 'user-1', email: 'test@example.com', role: UserRole.USER };

  beforeEach(async () => {
    const repoMock: jest.Mocked<IUserAvailabilityRepo> = {
      create: jest.fn(),
      findAllByUserAndCourse: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findAll: jest.fn(),
      findOrFailById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserAvailabilityService,
        { provide: 'IUserAvailabilityRepo', useValue: repoMock },
      ],
    }).compile();

    service = module.get<UserAvailabilityService>(UserAvailabilityService);
    repo = module.get('IUserAvailabilityRepo');
  });

  describe('create', () => {
    it('✅ should create a user availability', async () => {
      const dto: CreateUserAvailabilityDto =
        new UserAvailabilityBuilder().buildCreateDto();
      const availability = UserAvailabilityFactory.default();

      repo.create.mockResolvedValue(availability);

      const result = await service.create(user, dto);

      expect(repo.create).toHaveBeenCalledWith(user.id, dto);
      expect(result).toEqual(availability);
    });

    it('⚡ should throw mapped error on repo failure', async () => {
      const dto = new UserAvailabilityBuilder().buildCreateDto();
      repo.create.mockRejectedValue(new Error('DB down'));

      await expect(service.create(user, dto)).rejects.toThrow();
    });
  });

  describe('findByUserAndCourse', () => {
    it('✅ should return availabilities for a user and course', async () => {
      const query: GetUserAvailabilitiesQueryDto = { course_id: 'course-1' };
      const availabilities = [UserAvailabilityFactory.default()];

      repo.findAllByUserAndCourse.mockResolvedValue(availabilities);

      const result = await service.findByUserAndCourse(user, query);

      expect(repo.findAllByUserAndCourse).toHaveBeenCalledWith(
        user.id,
        'course-1',
      );
      expect(result).toEqual(availabilities);
    });

    it('⚡ should throw mapped error on repo failure', async () => {
      const query: GetUserAvailabilitiesQueryDto = { course_id: 'course-1' };
      repo.findAllByUserAndCourse.mockRejectedValue(new Error('DB down'));

      await expect(service.findByUserAndCourse(user, query)).rejects.toThrow();
    });
  });

  describe('findById', () => {
    it('✅ should return a user availability by id', async () => {
      const availability = UserAvailabilityFactory.default();
      repo.findById.mockResolvedValue(availability);

      const result = await service.findById('availability-1');

      expect(repo.findById).toHaveBeenCalledWith('availability-1');
      expect(result).toEqual(availability);
    });

    it('⚡ should throw mapped error on repo failure', async () => {
      repo.findById.mockRejectedValue(new Error('DB down'));

      await expect(service.findById('availability-1')).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('✅ should update a user availability', async () => {
      const updateDto: UpdateUserAvailabilityDto =
        new UserAvailabilityBuilder().buildUpdateDto();
      const availability = UserAvailabilityFactory.default();

      repo.update.mockResolvedValue({ ...availability, ...updateDto });

      const result = await service.update('availability-1', updateDto);

      expect(result).toEqual({ ...availability, ...updateDto });
    });

    it('⚡ should throw mapped error on repo failure', async () => {
      const updateDto: UpdateUserAvailabilityDto =
        new UserAvailabilityBuilder().buildUpdateDto();
      repo.update.mockRejectedValue(new Error('DB down'));

      await expect(
        service.update('availability-1', updateDto),
      ).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('✅ should delete a user availability', async () => {
      const availability = UserAvailabilityFactory.default();
      repo.delete.mockResolvedValue(availability);

      const result = await service.delete('availability-1');

      expect(repo.delete).toHaveBeenCalledWith('availability-1');
      expect(result).toEqual(availability);
    });

    it('⚡ should throw mapped error on repo failure', async () => {
      repo.delete.mockRejectedValue(new Error('DB down'));

      await expect(service.delete('availability-1')).rejects.toThrow();
    });
  });
});
