import { Test, TestingModule } from '@nestjs/testing';
import { UserScheduleController } from '../../user-schedule.controller';
import { IUserScheduleService } from '../../user-schedule.service';
import { GenerateUserScheduleDto } from '../../dto/generate-user-schedule.dto';
import { CreateUserScheduleArrayDto } from '../../dto/create-user-schedule.dto';
import { GetUserScheduleQueryDto } from '../../dto/get-user-schedule-query.dto';
import { DeleteUserScheduleQueryDto } from '../../dto/delete-user-schedule-query.dto';
import { UserScheduleBuilder } from 'src/common/tests/builders/user-schedule.builder';
import { UserScheduleObjectMother } from 'src/common/tests/object-mothers/user-schedule-object-mother';
import { JWTPayload } from '../../../auth/guards/AuthGuard';
import { UserRole } from 'src/modules/users/entities/user.entity';
import { UserScheduleDomain } from '../../domains/user-schedule.domain';

describe('UserScheduleController (Unit)', () => {
  let controller: UserScheduleController;
  let service: jest.Mocked<IUserScheduleService>;

  const user: JWTPayload = {
    id: 'user-1',
    email: 'test@example.com',
    role: UserRole.USER,
  };

  beforeEach(async () => {
    const serviceMock: jest.Mocked<IUserScheduleService> = {
      generate: jest.fn(),
      create: jest.fn(),
      getByUserAndCourse: jest.fn(),
      deleteByUserAndCourse: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserScheduleController],
      providers: [
        { provide: 'IUserScheduleService', useValue: serviceMock },
      ],
    })
      .overrideGuard(require('../../../auth/guards/AuthGuard').JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<UserScheduleController>(UserScheduleController);
    service = module.get('IUserScheduleService');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ---------- GENERATE ----------
  describe('generate', () => {
    it('✅ должен сгенерировать расписание пользователя', async () => {
      // Используем ObjectMother для создания DTO
      const dto: GenerateUserScheduleDto =
        UserScheduleObjectMother.buildGenerateDto({
          course_id: 'course-1',
        });

      // Используем Builder для создания тестовых данных
      const schedule1 = new UserScheduleBuilder()
        .withId('schedule-1')
        .withUserId(user.id)
        .withCourseId('course-1')
        .build();

      const schedule2 = new UserScheduleBuilder()
        .withId('schedule-2')
        .withUserId(user.id)
        .withCourseId('course-1')
        .build();

      const scheduleDomains: UserScheduleDomain[] = [schedule1, schedule2];
      service.generate.mockResolvedValue(scheduleDomains);

      const result = await controller.generate(user, dto);

      expect(service.generate).toHaveBeenCalledWith(user, dto);
      expect(result).toBeDefined();
      expect(result).toHaveLength(2);
      expect(result![0]).toHaveProperty('id', 'schedule-1');
      expect(result![1]).toHaveProperty('id', 'schedule-2');
    });

    it('❌ должен вернуть null если генерация не удалась', async () => {
      const dto = UserScheduleObjectMother.buildGenerateDto({
        course_id: 'course-1',
      });
      service.generate.mockResolvedValue([]);

      const result = await controller.generate(user, dto);

      expect(service.generate).toHaveBeenCalledWith(user, dto);
      expect(result).toHaveLength(0);
    });
  });

  // ---------- CREATE ----------
  describe('create', () => {
    it('✅ должен создать расписание пользователя', async () => {
      // Используем ObjectMother для создания DTO
      const createDto = UserScheduleObjectMother.buildCreateDto({
        course_id: 'course-1',
        lesson_id: 'lesson-1',
      });

      const dto: CreateUserScheduleArrayDto = {
        data: [createDto],
      };

      // Используем Builder для создания тестовых данных
      const schedule = new UserScheduleBuilder()
        .withId('schedule-1')
        .withUserId(user.id)
        .withCourseId('course-1')
        .withLessonId('lesson-1')
        .build();

      const scheduleDomains: UserScheduleDomain[] = [schedule];
      service.create.mockResolvedValue(scheduleDomains);

      const result = await controller.create(user, dto);

      expect(service.create).toHaveBeenCalledWith(user, dto);
      expect(result).toBeDefined();
      expect(result).toHaveLength(1);
      expect(result![0]).toHaveProperty('id', 'schedule-1');
      expect(result![0]).toHaveProperty('course_id', 'course-1');
      expect(result![0]).toHaveProperty('lesson_id', 'lesson-1');
    });

    it('❌ должен вернуть null если создание не удалось', async () => {
      const createDto = UserScheduleObjectMother.buildCreateDto({
        course_id: 'course-1',
      });

      const dto: CreateUserScheduleArrayDto = {
        data: [createDto],
      };

      service.create.mockResolvedValue([]);

      const result = await controller.create(user, dto);

      expect(service.create).toHaveBeenCalledWith(user, dto);
      expect(result).toHaveLength(0);
    });
  });

  // ---------- GET USER SCHEDULE ----------
  describe('getUserSchedule', () => {
    it('✅ должен получить расписание пользователя по курсу', async () => {
      // Используем ObjectMother для создания Query DTO
      const query: GetUserScheduleQueryDto = {
        course_id: 'course-1',
      };

      // Используем Builder для создания тестовых данных
      const schedule1 = new UserScheduleBuilder()
        .withId('schedule-1')
        .withUserId(user.id)
        .withCourseId('course-1')
        .withScheduledDate('2025-06-26')
        .build();

      const schedule2 = new UserScheduleBuilder()
        .withId('schedule-2')
        .withUserId(user.id)
        .withCourseId('course-1')
        .withScheduledDate('2025-06-27')
        .build();

      const scheduleDomains: UserScheduleDomain[] = [schedule1, schedule2];
      service.getByUserAndCourse.mockResolvedValue(scheduleDomains);

      const result = await controller.getUserSchedule(user, query);

      expect(service.getByUserAndCourse).toHaveBeenCalledWith(user, query);
      expect(result).toBeDefined();
      expect(result).toHaveLength(2);
      expect(result![0]).toHaveProperty('id', 'schedule-1');
      expect(result![1]).toHaveProperty('id', 'schedule-2');
    });

    it('❌ должен вернуть null если расписание не найдено', async () => {
      const query: GetUserScheduleQueryDto = {
        course_id: 'course-1',
      };

      service.getByUserAndCourse.mockResolvedValue([]);

      const result = await controller.getUserSchedule(user, query);

      expect(service.getByUserAndCourse).toHaveBeenCalledWith(user, query);
      expect(result).toHaveLength(0);
    });
  });

  // ---------- DELETE USER SCHEDULE ----------
  describe('deleteUserSchedule', () => {
    it('✅ должен удалить расписание пользователя по курсу', async () => {
      // Используем ObjectMother для создания Query DTO
      const query: DeleteUserScheduleQueryDto = {
        course_id: 'course-1',
      };

      service.deleteByUserAndCourse.mockResolvedValue(true);

      const result = await controller.deleteUserSchedule(user, query);

      expect(service.deleteByUserAndCourse).toHaveBeenCalledWith(user, query);
      expect(result).toEqual({ success: true });
    });

    it('❌ должен вернуть false если удаление не удалось', async () => {
      const query: DeleteUserScheduleQueryDto = {
        course_id: 'course-1',
      };

      service.deleteByUserAndCourse.mockResolvedValue(false);

      const result = await controller.deleteUserSchedule(user, query);

      expect(service.deleteByUserAndCourse).toHaveBeenCalledWith(user, query);
      expect(result).toEqual({ success: false });
    });
  });
});
