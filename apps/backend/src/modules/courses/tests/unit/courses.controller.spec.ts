// courses.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { CoursesController } from '../../courses.controller';
import { ICoursesService } from '../../courses.service';
import { CreateCourseDto } from '../../dto/create-course.dto';
import { UpdateCourseDto } from '../../dto/update-course.dto';
import { CourseResponse } from '../../dto/course-response.dto';
import { Course } from '../../entities/course.entity';
import { CourseEnrollmentResponse } from 'src/modules/course-enrollments/dto/course-enrollment-response.dto';
import { JwtAuthGuard, JWTPayload } from 'src/modules/auth/guards/AuthGuard';
import { UserRole } from 'src/modules/users/entities/user.entity';
import { CourseEnrollment } from 'src/modules/course-enrollments/entities/course-enrollment.entity';
import { CourseEnrollmentStatus } from 'src/modules/course-enrollments/types/course-enrollments.types';
import { ConfigService } from '@nestjs/config';
import { IAppLoggerService } from 'src/common/logging/log.service';
import {
  RepositoryDuplicateError,
  RepositoryNotFoundError,
  RepositoryUnknownError,
} from 'src/common/errors/db-errors';
import { CourseObjectMother } from 'src/common/tests/object-mothers/course-object-mother';

describe('CoursesController', () => {
  let controller: CoursesController;
  let service: Partial<Record<keyof ICoursesService, jest.Mock>>;
  let mockLoggerService: Partial<Record<keyof IAppLoggerService, jest.Mock>>;

  beforeAll(async () => {
    // Create Jest mock functions for each service method
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      registerUser: jest.fn(),
      purchaseCourse: jest.fn(),
    };

    mockLoggerService = {
      accessLog: jest.fn(),
      error: jest.fn(),
      log: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CoursesController],
      providers: [
        { provide: 'ICoursesService', useValue: service },
        {
          provide: JwtAuthGuard,
          useValue: { canActivate: jest.fn(() => true) },
        },
        {
          provide: ConfigService,
          useValue: { canActivate: jest.fn(() => true) },
        },
        {
          provide: 'ITokenService',
          useValue: { canActivate: jest.fn(() => true) },
        },
        { provide: 'IAppLoggerService', useValue: mockLoggerService },
      ],
    }).compile();

    controller = module.get<CoursesController>(CoursesController);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test data
  const sampleCourse: Course = {
    id: '1',
    name: 'Test Course',
    price: 100,
    date_finish: '2025-01-01',
    date_start: '2025-02-01',
    lessons: [],
    payments: [],
  };

  const mockUser: JWTPayload = {
    id: 'user-123',
    email: 'test@example.com',
    role: UserRole.USER,
  };

  const response = CourseResponse.make(sampleCourse);
  const responseList = [response];

  describe('register', () => {
    it('✅ should register user to course (positive)', async () => {
      const courseId = 'course-456';
      const mockEnrollment: CourseEnrollment = {
        id: 'enroll-1',
        user_id: mockUser.id,
        course_id: courseId,
        status: CourseEnrollmentStatus.NEW,
        created_at: new Date(),
      };

      service.registerUser?.mockResolvedValue(mockEnrollment);

      const result = await controller.register(mockUser, courseId);

      expect(service.registerUser).toHaveBeenCalledWith(mockUser.id, courseId);
      expect(result).toEqual(CourseEnrollmentResponse.make(mockEnrollment));
    });

    it('❌ should throw if registerUser fails (negative)', async () => {
      service.registerUser!.mockRejectedValue(
        new RepositoryDuplicateError('', ''),
      );
      await expect(controller.register(mockUser, 'bad-id')).rejects.toThrow(
        RepositoryDuplicateError,
      );
    });
  });

  describe('purchaseCourse', () => {
    it('should call service.purchaseCourse and return success', async () => {
      const courseId = 'course-789';
      service.purchaseCourse?.mockResolvedValue({});

      const result = await controller.purchaseCourse(mockUser, courseId);

      expect(service.purchaseCourse).toHaveBeenCalledWith(
        mockUser.id,
        courseId,
      );
      expect(result).toEqual({ success: true });
    });
    it('❌ should throw if purchaseCourse fails (negative)', async () => {
      service.purchaseCourse!.mockRejectedValue(
        new RepositoryDuplicateError('', ''),
      );
      await expect(
        controller.purchaseCourse(mockUser, 'bad-id'),
      ).rejects.toThrow(RepositoryDuplicateError);
    });
  });

  // 2. create()
  describe('create', () => {
    it('should create a course and return CourseResponse', async () => {
      const dto: CreateCourseDto = {
        name: 'Test Course',
        date_finish: '2025-01-01',
        date_start: '2025-02-01',
        price: 100,
      };
      service.create!.mockResolvedValue(sampleCourse);

      const result = await controller.create(dto);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(response);
    });
    it('❌ should throw if service.create fails (negative)', async () => {
      const dto = CourseObjectMother.buildCreateDto();
      service.create!.mockRejectedValue(new RepositoryUnknownError('', ''));

      await expect(controller.create(dto)).rejects.toThrow(
        RepositoryUnknownError,
      );
    });
  });

  // 3. findAll()
  describe('findAll', () => {
    it('should return an array of CourseResponse', async () => {
      service.findAll!.mockResolvedValue([sampleCourse]);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(responseList);
    });
    it('❌ should throw if service.findAll fails (negative)', async () => {
      service.findAll!.mockRejectedValue(new RepositoryUnknownError('', ''));
      await expect(controller.findAll()).rejects.toThrow(
        RepositoryUnknownError,
      );
    });
  });

  // 4. findOne()
  describe('findOne', () => {
    it('should return a single CourseResponse', async () => {
      service.findOne!.mockResolvedValue(sampleCourse);

      const result = await controller.findOne('1');

      expect(service.findOne).toHaveBeenCalledWith('1', undefined);
      expect(result).toEqual(response);
    });
    it('❌ should throw if course not found (negative)', async () => {
      service.findOne!.mockRejectedValue(new RepositoryNotFoundError('', ''));

      await expect(controller.findOne('999')).rejects.toThrow(
        RepositoryNotFoundError,
      );
    });
  });

  // 5. update()
  describe('update', () => {
    it('should update a course and return CourseResponse', async () => {
      const dto: UpdateCourseDto = {
        name: 'Updated',
        date_start: '2024-01-01',
        date_finish: '2024-02-01',
        price: 200,
      };
      service.update!.mockResolvedValue({ ...sampleCourse, ...dto });

      const result = await controller.update('1', dto);

      expect(service.update).toHaveBeenCalledWith('1', dto);
      expect(result).toEqual(CourseResponse.make({ ...sampleCourse, ...dto }));
    });
    it('❌ should throw if update fails (negative)', async () => {
      const dto = CourseObjectMother.buildUpdateDto({ name: 'Updated' });
      service.update!.mockRejectedValue(new RepositoryNotFoundError('', ''));

      await expect(controller.update('1', dto)).rejects.toThrow(
        RepositoryNotFoundError,
      );
    });
  });

  // 6. remove()
  describe('remove', () => {
    it('should remove a course and return CourseResponse', async () => {
      service.remove!.mockResolvedValue(sampleCourse);

      const result = await controller.remove('1');

      expect(service.remove).toHaveBeenCalledWith('1');
      expect(result).toEqual(response);
    });

    it('❌ should throw if remove fails (negative)', async () => {
      service.remove!.mockRejectedValue(new RepositoryNotFoundError('', ''));

      await expect(controller.remove('1')).rejects.toThrow(
        RepositoryNotFoundError,
      );
    });
  });
});
