import { Test, TestingModule } from '@nestjs/testing';
import { UserScheduleService } from '../../user-schedule.service';
import { IUserScheduleRepo } from '../../user-schedule.repository';
import { JWTPayload } from '../../../auth/guards/AuthGuard';
import { GenerateUserScheduleDto } from '../../dto/generate-user-schedule.dto';
import { CreateUserScheduleArrayDto } from '../../dto/create-user-schedule.dto';
import { GetUserScheduleQueryDto } from '../../dto/get-user-schedule-query.dto';
import { DeleteUserScheduleQueryDto } from '../../dto/delete-user-schedule-query.dto';
import { UserScheduleBuilder } from 'src/common/tests/builders/user-schedule.builder';
import { UserScheduleObjectMother } from 'src/common/tests/object-mothers/user-schedule-object-mother';
import { UserRole } from 'src/modules/users/entities/user.entity';
import { RepositoryUnknownError } from 'src/common/errors/db-errors';

describe('UserScheduleService (Unit)', () => {
  let service: UserScheduleService;
  let repo: jest.Mocked<IUserScheduleRepo>;
  const user: JWTPayload = { id: 'user-1', email: 'test@example.com', role: UserRole.USER };

  beforeEach(async () => {
    const repoMock: jest.Mocked<IUserScheduleRepo> = {
      generate: jest.fn(),
      create: jest.fn(),
      getByUserAndCourse: jest.fn(),
      deleteByUserAndCourse: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserScheduleService,
        { provide: 'IUserScheduleRepo', useValue: repoMock },
      ],
    }).compile();

    service = module.get<UserScheduleService>(UserScheduleService);
    repo = module.get('IUserScheduleRepo');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ---------- GENERATE ----------
  describe('generate', () => {
    it('✅ должен сгенерировать расписание для пользователя', async () => {
      // Используем ObjectMother для создания DTO
      const dto: GenerateUserScheduleDto = UserScheduleObjectMother.buildGenerateDto({
        course_id: 'course-1',
      });

      // Используем Builder для создания сущностей
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

      const schedules = [schedule1, schedule2];
      repo.generate.mockResolvedValue(schedules);

      const result = await service.generate(user, dto);

      expect(repo.generate).toHaveBeenCalledWith(user.id, 'course-1');
      expect(result).toEqual(schedules);
      expect(result).toHaveLength(2);
    });

    it('❌ должен выбросить ошибку при сбое репозитория', async () => {
      const dto: GenerateUserScheduleDto = UserScheduleObjectMother.buildGenerateDto({
        course_id: 'course-1',
      });

      repo.generate.mockRejectedValue(
        new RepositoryUnknownError('Database error', 'UserSchedule'),
      );

      await expect(service.generate(user, dto)).rejects.toThrow();
      expect(repo.generate).toHaveBeenCalledWith(user.id, 'course-1');
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

      // Используем Builder для создания сущностей
      const schedule = new UserScheduleBuilder()
        .withId('schedule-1')
        .withUserId(user.id)
        .withCourseId('course-1')
        .withLessonId('lesson-1')
        .build();

      const schedules = [schedule];
      repo.create.mockResolvedValue(schedules);

      const result = await service.create(user, dto);

      expect(repo.create).toHaveBeenCalledWith(user.id, dto.data);
      expect(result).toEqual(schedules);
      expect(result).toHaveLength(1);
    });

    it('❌ должен выбросить ошибку при сбое репозитория', async () => {
      const createDto = UserScheduleObjectMother.buildCreateDto({
        course_id: 'course-1',
      });

      const dto: CreateUserScheduleArrayDto = {
        data: [createDto],
      };

      repo.create.mockRejectedValue(
        new RepositoryUnknownError('Database error', 'UserSchedule'),
      );

      await expect(service.create(user, dto)).rejects.toThrow();
      expect(repo.create).toHaveBeenCalledWith(user.id, dto.data);
    });
  });

  // ---------- GET BY USER AND COURSE ----------
  describe('getByUserAndCourse', () => {
    it('✅ должен вернуть расписание пользователя по курсу', async () => {
      const query: GetUserScheduleQueryDto = {
        course_id: 'course-1',
      };

      // Используем Builder для создания сущностей
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

      const schedules = [schedule1, schedule2];
      repo.getByUserAndCourse.mockResolvedValue(schedules);

      const result = await service.getByUserAndCourse(user, query);

      expect(repo.getByUserAndCourse).toHaveBeenCalledWith(user.id, 'course-1');
      expect(result).toEqual(schedules);
      expect(result).toHaveLength(2);
    });

    it('❌ должен выбросить ошибку при сбое репозитория', async () => {
      const query: GetUserScheduleQueryDto = {
        course_id: 'course-1',
      };

      repo.getByUserAndCourse.mockRejectedValue(
        new RepositoryUnknownError('Database error', 'UserSchedule'),
      );

      await expect(service.getByUserAndCourse(user, query)).rejects.toThrow();
      expect(repo.getByUserAndCourse).toHaveBeenCalledWith(user.id, 'course-1');
    });
  });

  // ---------- DELETE BY USER AND COURSE ----------
  describe('deleteByUserAndCourse', () => {
    it('✅ должен удалить расписание пользователя по курсу', async () => {
      const query: DeleteUserScheduleQueryDto = {
        course_id: 'course-1',
      };

      repo.deleteByUserAndCourse.mockResolvedValue(true);

      const result = await service.deleteByUserAndCourse(user, query);

      expect(repo.deleteByUserAndCourse).toHaveBeenCalledWith(user.id, 'course-1');
      expect(result).toBe(true);
    });

    it('❌ должен выбросить ошибку при сбое репозитория', async () => {
      const query: DeleteUserScheduleQueryDto = {
        course_id: 'course-1',
      };

      repo.deleteByUserAndCourse.mockRejectedValue(
        new RepositoryUnknownError('Database error', 'UserSchedule'),
      );

      await expect(service.deleteByUserAndCourse(user, query)).rejects.toThrow();
      expect(repo.deleteByUserAndCourse).toHaveBeenCalledWith(user.id, 'course-1');
    });
  });
});
