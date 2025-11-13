import { Test, TestingModule } from '@nestjs/testing';
import { UserAvailabilityService } from '../../user-availability.service';
import { IUserAvailabilityRepo } from '../../user-availability.repository';
import { CreateUserAvailabilityDto } from '../../dto/create-user-availability.dto';
import { UpdateUserAvailabilityDto } from '../../dto/update-user-availability.dto';
import { GetUserAvailabilitiesQueryDto } from '../../dto/get-user-availabilities-query.dto';
import { UserAvailabilityBuilder } from 'src/common/tests/builders/user-availability.builder';
import { UserAvailabilityObjectMother } from 'src/common/tests/object-mothers/user-availability-object-mother';
import { JWTPayload } from '../../../auth/guards/AuthGuard';
import { UserRole } from 'src/modules/users/entities/user.entity';

describe('UserAvailabilityService', () => {
  let service: UserAvailabilityService;
  let repo: jest.Mocked<IUserAvailabilityRepo>;
  const user: JWTPayload = {
    id: 'user-1',
    email: 'test@example.com',
    role: UserRole.USER,
  };

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
    it('✅ должен создать доступность', async () => {
      // Используем ObjectMother для создания DTO
      const dto: CreateUserAvailabilityDto =
        UserAvailabilityObjectMother.buildCreateDto({
          course_id: 'course-1',
        });

      // Используем Builder для создания тестовых данных
      const availability = new UserAvailabilityBuilder()
        .withId('availability-1')
        .withUserId(user.id)
        .withCourseId('course-1')
        .build();

      repo.create.mockResolvedValue(availability);

      const result = await service.create(user, dto);

      expect(repo.create).toHaveBeenCalledWith(user.id, dto);
      expect(result).toEqual(availability);
    });

    it('❌ должен выбросить ошибку при сбое репозитория', async () => {
      const dto = UserAvailabilityObjectMother.buildCreateDto({
        course_id: 'course-1',
      });
      repo.create.mockRejectedValue(new Error('DB down'));

      await expect(service.create(user, dto)).rejects.toThrow();
    });
  });

  describe('findByUserAndCourse', () => {
    it('✅ должен вернуть доступности для пользователя и курса', async () => {
      const query: GetUserAvailabilitiesQueryDto = { course_id: 'course-1' };

      // Используем Builder для создания массива доступностей
      const availabilities = [
        new UserAvailabilityBuilder()
          .withUserId(user.id)
          .withCourseId('course-1')
          .build(),
      ];

      repo.findAllByUserAndCourse.mockResolvedValue(availabilities);

      const result = await service.findByUserAndCourse(user, query);

      expect(repo.findAllByUserAndCourse).toHaveBeenCalledWith(
        user.id,
        'course-1',
      );
      expect(result).toEqual(availabilities);
    });

    it('❌ должен выбросить ошибку при сбое репозитория', async () => {
      const query: GetUserAvailabilitiesQueryDto = { course_id: 'course-1' };
      repo.findAllByUserAndCourse.mockRejectedValue(new Error('DB down'));

      await expect(service.findByUserAndCourse(user, query)).rejects.toThrow();
    });
  });

  describe('findById', () => {
    it('✅ должен вернуть доступность по id', async () => {
      const availability = new UserAvailabilityBuilder()
        .withId('availability-1')
        .build();

      repo.findById.mockResolvedValue(availability);

      const result = await service.findById('availability-1');

      expect(repo.findById).toHaveBeenCalledWith('availability-1');
      expect(result).toEqual(availability);
    });

    it('❌ должен выбросить ошибку при сбое репозитория', async () => {
      repo.findById.mockRejectedValue(new Error('DB down'));

      await expect(service.findById('availability-1')).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('✅ должен обновить доступность', async () => {
      // Используем ObjectMother для создания DTO обновления
      const updateDto: UpdateUserAvailabilityDto =
        UserAvailabilityObjectMother.buildUpdateDto({
          start_time: '11:00',
          end_time: '19:00',
        });

      const availability = new UserAvailabilityBuilder()
        .withId('availability-1')
        .withStartTime('11:00')
        .withEndTime('19:00')
        .build();

      repo.update.mockResolvedValue(availability);

      const result = await service.update('availability-1', updateDto);

      expect(repo.update).toHaveBeenCalledWith('availability-1', updateDto);
      expect(result).toEqual(availability);
    });

    it('❌ должен выбросить ошибку при сбое репозитория', async () => {
      const updateDto: UpdateUserAvailabilityDto =
        UserAvailabilityObjectMother.buildUpdateDto();
      repo.update.mockRejectedValue(new Error('DB down'));

      await expect(
        service.update('availability-1', updateDto),
      ).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('✅ должен удалить доступность', async () => {
      const availability = new UserAvailabilityBuilder()
        .withId('availability-1')
        .build();

      repo.delete.mockResolvedValue(availability);

      const result = await service.delete('availability-1');

      expect(repo.delete).toHaveBeenCalledWith('availability-1');
      expect(result).toEqual(availability);
    });

    it('❌ должен выбросить ошибку при сбое репозитория', async () => {
      repo.delete.mockRejectedValue(new Error('DB down'));

      await expect(service.delete('availability-1')).rejects.toThrow();
    });
  });
});
