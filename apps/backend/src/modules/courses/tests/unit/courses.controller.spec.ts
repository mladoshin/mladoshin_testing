// courses.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { CoursesController } from '../../courses.controller';
import { ICoursesService } from '../../courses.service';
import { CourseResponse } from '../../dto/course-response.dto';
import { CourseEnrollmentResponse } from 'src/modules/course-enrollments/dto/course-enrollment-response.dto';
import { JwtAuthGuard } from 'src/modules/auth/guards/AuthGuard';
import { CourseEnrollmentStatus } from 'src/modules/course-enrollments/types/course-enrollments.types';
import { ConfigService } from '@nestjs/config';
import { IAppLoggerService } from 'src/common/logging/log.service';
import {
  RepositoryDuplicateError,
  RepositoryNotFoundError,
  RepositoryUnknownError,
} from 'src/common/errors/db-errors';
import { CourseObjectMother } from 'src/common/tests/object-mothers/course-object-mother';
import { CourseBuilder } from 'src/common/tests/builders/course.builder';
import { JWTBuilder } from 'src/common/tests/builders/jwt.builder';
import { CourseEnrollmentBuilder } from 'src/common/tests/builders/course-enrollment.builder';

describe('CoursesController', () => {
  let controller: CoursesController;
  let service: Partial<Record<keyof ICoursesService, jest.Mock>>;
  let mockLoggerService: Partial<Record<keyof IAppLoggerService, jest.Mock>>;
  let mockReq: any;

  beforeAll(async () => {
    mockReq = {
      headers: {
        'x-test-schema': 'test_schema',
      },
    };
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

  describe('register', () => {
    it('✅ should register user to course (positive)', async () => {
      const courseId = 'course-456';
      const mockUser = new JWTBuilder().withId('user-123').build();
      const mockEnrollment = new CourseEnrollmentBuilder()
        .withUserId(mockUser.id)
        .withCourseId(courseId)
        .withStatus(CourseEnrollmentStatus.NEW)
        .build();

      service.registerUser?.mockResolvedValue(mockEnrollment);

      const result = await controller.register(mockUser, courseId, mockReq);

      expect(service.registerUser).toHaveBeenCalledWith(mockUser.id, courseId, {schema: 'test_schema'});
      expect(result).toEqual(CourseEnrollmentResponse.make(mockEnrollment));
    });

    it('❌ should throw if registerUser fails (negative)', async () => {
      const mockUser = new JWTBuilder().build();
      service.registerUser!.mockRejectedValue(
        new RepositoryDuplicateError('', ''),
      );
      await expect(controller.register(mockUser, 'bad-id', mockReq)).rejects.toThrow(
        RepositoryDuplicateError,
      );
    });
  });

  describe('purchaseCourse', () => {
    it('should call service.purchaseCourse and return success', async () => {
      const courseId = 'course-789';
      const mockUser = new JWTBuilder().build();
      service.purchaseCourse?.mockResolvedValue({});

      const result = await controller.purchaseCourse(mockUser, courseId, mockReq);

      expect(service.purchaseCourse).toHaveBeenCalledWith(
        mockUser.id,
        courseId,
        {schema: 'test_schema'},
      );
      expect(result).toEqual({ success: true });
    });
    it('❌ should throw if purchaseCourse fails (negative)', async () => {
      const mockUser = new JWTBuilder().build();
      service.purchaseCourse!.mockRejectedValue(
        new RepositoryDuplicateError('', ''),
      );
      await expect(
        controller.purchaseCourse(mockUser, 'bad-id', mockReq),
      ).rejects.toThrow(RepositoryDuplicateError);
    });
  });

  // 2. create()
  describe('create', () => {
    it('should create a course and return CourseResponse', async () => {
      const dto = CourseObjectMother.buildCreateDto();
      const sampleCourse = new CourseBuilder()
        .withName(dto.name)
        .withPrice(dto.price)
        .withDateStart(dto.date_start)
        .withDateFinish(dto.date_finish)
        .build();

      service.create!.mockResolvedValue(sampleCourse);

      const result = await controller.create(dto, mockReq);

      expect(service.create).toHaveBeenCalledWith(dto, {schema: 'test_schema'});
      expect(result).toEqual(CourseResponse.make(sampleCourse));
    });
    it('❌ should throw if service.create fails (negative)', async () => {
      const dto = CourseObjectMother.buildCreateDto();
      service.create!.mockRejectedValue(new RepositoryUnknownError('', ''));

      await expect(controller.create(dto, mockReq)).rejects.toThrow(
        RepositoryUnknownError,
      );
    });
  });

  // 3. findAll()
  describe('findAll', () => {
    it('should return an array of CourseResponse', async () => {
      const sampleCourse = new CourseBuilder().withName('Test Course').build();
      service.findAll!.mockResolvedValue([sampleCourse]);

      const result = await controller.findAll(undefined, mockReq);

      expect(service.findAll).toHaveBeenCalledWith(undefined, {schema: 'test_schema'});
      expect(result).toEqual([CourseResponse.make(sampleCourse)]);
    });
    it('❌ should throw if service.findAll fails (negative)', async () => {
      service.findAll!.mockRejectedValue(new RepositoryUnknownError('', ''));
      await expect(controller.findAll(undefined, mockReq)).rejects.toThrow(
        RepositoryUnknownError,
      );
    });
  });

  // 4. findOne()
  describe('findOne', () => {
    it('should return a single CourseResponse', async () => {
      const sampleCourse = new CourseBuilder().withId('1').withName('Test Course').build();
      service.findOne!.mockResolvedValue(sampleCourse);

      const result = await controller.findOne('1', undefined, mockReq);

      expect(service.findOne).toHaveBeenCalledWith('1', undefined, {schema: 'test_schema'});
      expect(result).toEqual(CourseResponse.make(sampleCourse));
    });
    it('❌ should throw if course not found (negative)', async () => {
      service.findOne!.mockRejectedValue(new RepositoryNotFoundError('', ''));

      await expect(controller.findOne('999', undefined, mockReq)).rejects.toThrow(
        RepositoryNotFoundError,
      );
    });
  });

  // 5. update()
  describe('update', () => {
    it('should update a course and return CourseResponse', async () => {
      const dto = CourseObjectMother.buildUpdateDto({
        name: 'Updated',
        date_start: '2024-01-01',
        date_finish: '2024-02-01',
        price: 200,
      });
      const originalCourse = new CourseBuilder().withId('1').build();
      const updatedCourse = new CourseBuilder()
        .withId('1')
        .withName(dto.name!)
        .withDateStart(dto.date_start!)
        .withDateFinish(dto.date_finish!)
        .withPrice(dto.price!)
        .build();

      service.update!.mockResolvedValue(updatedCourse);

      const result = await controller.update('1', dto, mockReq);

      expect(service.update).toHaveBeenCalledWith('1', dto, {schema: 'test_schema'});
      expect(result).toEqual(CourseResponse.make(updatedCourse));
    });
    it('❌ should throw if update fails (negative)', async () => {
      const dto = CourseObjectMother.buildUpdateDto({ name: 'Updated' });
      service.update!.mockRejectedValue(new RepositoryNotFoundError('', ''));

      await expect(controller.update('1', dto, mockReq)).rejects.toThrow(
        RepositoryNotFoundError,
      );
    });
  });

  // 6. remove()
  describe('remove', () => {
    it('should remove a course and return CourseResponse', async () => {
      const sampleCourse = new CourseBuilder().withId('1').withName('Test Course').build();
      service.remove!.mockResolvedValue(sampleCourse);

      const result = await controller.remove('1', mockReq);

      expect(service.remove).toHaveBeenCalledWith('1', {schema: 'test_schema'});
      expect(result).toEqual(CourseResponse.make(sampleCourse));
    });

    it('❌ should throw if remove fails (negative)', async () => {
      service.remove!.mockRejectedValue(new RepositoryNotFoundError('', ''));

      await expect(controller.remove('1', mockReq)).rejects.toThrow(
        RepositoryNotFoundError,
      );
    });
  });
});
