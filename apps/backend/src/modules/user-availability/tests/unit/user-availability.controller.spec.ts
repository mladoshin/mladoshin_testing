import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UserAvailabilityController } from '../../user-availability.controller';
import { IUserAvailabilityService } from '../../user-availability.service';
import { CreateUserAvailabilityDto } from '../../dto/create-user-availability.dto';
import { UpdateUserAvailabilityDto } from '../../dto/update-user-availability.dto';
import { GetUserAvailabilitiesQueryDto } from '../../dto/get-user-availabilities-query.dto';
import { UserAvailabilityBuilder } from 'src/common/tests/builders/user-availability.builder';
import { UserAvailabilityObjectMother } from 'src/common/tests/object-mothers/user-availability-object-mother';
import { JWTPayload } from '../../../auth/guards/AuthGuard';
import { UserRole } from 'src/modules/users/entities/user.entity';
import { RepositoryNotFoundError } from 'src/common/errors/db-errors';

describe('UserAvailabilityController (Unit)', () => {
  let controller: UserAvailabilityController;
  let service: jest.Mocked<IUserAvailabilityService>;
  let mockReq: any;
  const user: JWTPayload = {
    id: 'user-1',
    email: 'test@example.com',
    role: UserRole.USER,
  };

  beforeEach(async () => {
    mockReq = {
      headers: {
        'x-test-schema': 'test_schema',
      },
    };
    const serviceMock: jest.Mocked<IUserAvailabilityService> = {
      create: jest.fn(),
      findByUserAndCourse: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserAvailabilityController],
      providers: [
        { provide: 'IUserAvailabilityService', useValue: serviceMock },
      ],
    })
      .overrideGuard(require('../../../auth/guards/AuthGuard').JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<UserAvailabilityController>(
      UserAvailabilityController,
    );
    service = module.get('IUserAvailabilityService');
  });

  // ---------- CREATE ----------
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

      service.create.mockResolvedValue(availability);

      const result = await controller.create(user, dto, mockReq);

      expect(service.create).toHaveBeenCalledWith(user, dto, {schema: 'test_schema'});
      expect(result).toHaveProperty('id', 'availability-1');
    });

    it('❌ должен выбросить ошибку при сбое сервиса', async () => {
      const dto = UserAvailabilityObjectMother.buildCreateDto({
        course_id: 'course-1',
      });
      service.create.mockRejectedValue(new Error('Service error'));

      await expect(controller.create(user, dto, mockReq)).rejects.toThrow();
    });
  });

  // ---------- FIND ALL ----------
  describe('findAll', () => {
    it('✅ должен вернуть все доступности для пользователя и курса', async () => {
      const query: GetUserAvailabilitiesQueryDto = { course_id: 'course-1' };

      // Используем Builder для создания массива доступностей
      const availabilities = [
        new UserAvailabilityBuilder()
          .withUserId(user.id)
          .withCourseId('course-1')
          .build(),
      ];

      service.findByUserAndCourse.mockResolvedValue(availabilities);

      const result = await controller.findAll(user, query, mockReq);

      expect(service.findByUserAndCourse).toHaveBeenCalledWith(user, query, {schema: 'test_schema'});
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
    });

    it('❌ должен выбросить ошибку при сбое сервиса', async () => {
      const query: GetUserAvailabilitiesQueryDto = { course_id: 'course-1' };
      service.findByUserAndCourse.mockRejectedValue(new Error('Service error'));

      await expect(controller.findAll(user, query, mockReq)).rejects.toThrow();
    });
  });

  // ---------- FIND ONE ----------
  describe('findOne', () => {
    it('✅ должен вернуть доступность по id', async () => {
      const availability = new UserAvailabilityBuilder()
        .withId('availability-1')
        .build();

      service.findById.mockResolvedValue(availability);

      const result = await controller.findOne('availability-1', mockReq);

      expect(service.findById).toHaveBeenCalledWith('availability-1', {schema: 'test_schema'});
      expect(result).toHaveProperty('id', 'availability-1');
    });

    it('❌ должен выбросить NotFoundException если доступность не найдена', async () => {
      service.findById.mockRejectedValue(
        new RepositoryNotFoundError(
          'UserAvailability not found',
          'UserAvailability',
        ),
      );

      await expect(controller.findOne('availability-1', mockReq)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ---------- UPDATE ----------
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

      service.update.mockResolvedValue(availability);

      const result = await controller.update('availability-1', updateDto, mockReq);

      expect(service.update).toHaveBeenCalledWith('availability-1', updateDto, {schema: 'test_schema'});
      expect(result).toHaveProperty('id', 'availability-1');
    });

    it('❌ должен выбросить ошибку при обновлении несуществующей доступности', async () => {
      const updateDto = UserAvailabilityObjectMother.buildUpdateDto();
      service.update.mockRejectedValue(
        new RepositoryNotFoundError(
          'UserAvailability not found',
          'UserAvailability',
        ),
      );

      await expect(
        controller.update('availability-1', updateDto, mockReq),
      ).rejects.toThrow();
    });
  });

  // ---------- DELETE ----------
  describe('remove', () => {
    it('✅ должен удалить доступность', async () => {
      const availability = new UserAvailabilityBuilder()
        .withId('availability-1')
        .build();

      service.delete.mockResolvedValue(availability);

      const result = await controller.remove('availability-1', mockReq);

      expect(service.delete).toHaveBeenCalledWith('availability-1', {schema: 'test_schema'});
      expect(result).toHaveProperty('id', 'availability-1');
    });

    it('❌ должен выбросить ошибку при удалении несуществующей доступности', async () => {
      service.delete.mockRejectedValue(
        new RepositoryNotFoundError(
          'UserAvailability not found',
          'UserAvailability',
        ),
      );

      await expect(controller.remove('availability-1', mockReq)).rejects.toThrow();
    });
  });
});
