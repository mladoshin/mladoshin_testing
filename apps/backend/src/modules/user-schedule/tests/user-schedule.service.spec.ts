import { Test, TestingModule } from '@nestjs/testing';
import { UserScheduleService } from '../user-schedule.service';
import { IUserScheduleRepo } from '../user-schedule.repository';
import { JWTPayload } from '../../auth/guards/AuthGuard';
import { GenerateUserScheduleDto } from '../dto/generate-user-schedule.dto';
import { CreateUserScheduleArrayDto } from '../dto/create-user-schedule.dto';
import { GetUserScheduleQueryDto } from '../dto/get-user-schedule-query.dto';
import { DeleteUserScheduleQueryDto } from '../dto/delete-user-schedule-query.dto';
import { UserScheduleBuilder } from './builders/user-schedule.builder';
import { UserScheduleFactory } from './factories/user-schedule.factory';
import { UserRole } from 'src/modules/users/entities/user.entity';

describe('UserScheduleService', () => {
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

  describe('generate', () => {
    it('✅ should generate schedule for user', async () => {
      const dto: GenerateUserScheduleDto = { course_id: 'course-1' };
      const schedules = [UserScheduleFactory.default()];

      repo.generate.mockResolvedValue(schedules);

      const result = await service.generate(user, dto);

      expect(repo.generate).toHaveBeenCalledWith(user.id, 'course-1');
      expect(result).toEqual(schedules);
    });

    it('⚡ should throw mapped error on repo failure', async () => {
      const dto: GenerateUserScheduleDto = { course_id: 'course-1' };
      repo.generate.mockRejectedValue(new Error('DB down'));

      await expect(service.generate(user, dto)).rejects.toThrow();
    });
  });

  describe('create', () => {
    it('✅ should create user schedule', async () => {
      const dto: CreateUserScheduleArrayDto = { data: [new UserScheduleBuilder().buildCreateDto()] };
      const schedules = [UserScheduleFactory.default()];

      repo.create.mockResolvedValue(schedules);

      const result = await service.create(user, dto);

      expect(repo.create).toHaveBeenCalledWith(user.id, dto.data);
      expect(result).toEqual(schedules);
    });

    it('⚡ should throw mapped error on repo failure', async () => {
      const dto: CreateUserScheduleArrayDto = { data: [new UserScheduleBuilder().buildCreateDto()] };
      repo.create.mockRejectedValue(new Error('DB down'));

      await expect(service.create(user, dto)).rejects.toThrow();
    });
  });

  describe('getByUserAndCourse', () => {
    it('✅ should return schedules by user and course', async () => {
      const query: GetUserScheduleQueryDto = { course_id: 'course-1' };
      const schedules = [UserScheduleFactory.default()];

      repo.getByUserAndCourse.mockResolvedValue(schedules);

      const result = await service.getByUserAndCourse(user, query);

      expect(repo.getByUserAndCourse).toHaveBeenCalledWith(user.id, 'course-1');
      expect(result).toEqual(schedules);
    });

    it('⚡ should throw mapped error on repo failure', async () => {
      const query: GetUserScheduleQueryDto = { course_id: 'course-1' };
      repo.getByUserAndCourse.mockRejectedValue(new Error('DB down'));

      await expect(service.getByUserAndCourse(user, query)).rejects.toThrow();
    });
  });

  describe('deleteByUserAndCourse', () => {
    it('✅ should delete schedules by user and course', async () => {
      const query: DeleteUserScheduleQueryDto = { course_id: 'course-1' };
      repo.deleteByUserAndCourse.mockResolvedValue(true);

      const result = await service.deleteByUserAndCourse(user, query);

      expect(repo.deleteByUserAndCourse).toHaveBeenCalledWith(user.id, 'course-1');
      expect(result).toBe(true);
    });

    it('⚡ should throw mapped error on repo failure', async () => {
      const query: DeleteUserScheduleQueryDto = { course_id: 'course-1' };
      repo.deleteByUserAndCourse.mockRejectedValue(new Error('DB down'));

      await expect(service.deleteByUserAndCourse(user, query)).rejects.toThrow();
    });
  });
});
