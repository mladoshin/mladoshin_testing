import {
  NotFoundException
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  RepositoryDuplicateError,
  RepositoryForbiddenError,
  RepositoryNotFoundError,
  RepositoryUnknownError,
} from 'src/common/errors/db-errors';
import { CourseBuilder } from 'src/common/tests/builders/course.builder';
import { JWTBuilder } from 'src/common/tests/builders/jwt.builder';
import { CourseLessonBuilder } from 'src/common/tests/builders/lesson.builder';
import { PaymentBuilder } from 'src/common/tests/builders/payment.builder';
import { CourseEnrollmentObjectMother } from 'src/common/tests/object-mothers/course-enrollment-object-mother';
import { CourseObjectMother } from 'src/common/tests/object-mothers/course-object-mother';
import { CourseEnrollementMapper } from 'src/modules/course-enrollments/course-enrollments.mapper';
import { CourseLessonMapper } from 'src/modules/lessons/lessons.mapper';
import { PaymentsMapper } from 'src/modules/payments/payments.mapper';
import { UserRole } from '../../../users/entities/user.entity';
import { CourseMapper } from '../../courses.mapper';
import { CoursesService } from '../../courses.service';
import { CourseEnrollmentStatus } from '../../types/courses.types';
// -----------------------------
// Моки
// -----------------------------
const mockCourseRepo = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOrFailById: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const mockEnrollmentRepo = {
  findOneByUserAndCourse: jest.fn(),
  findManyByCourse: jest.fn(),
  registerUser: jest.fn(),
  setStatus: jest.fn(),
};

const mockPaymentRepo = {
  create: jest.fn(),
  findAllByCourse: jest.fn(),
};

const mockLessonRepo = {
  findAllByCourse: jest.fn(),
};

describe('CoursesService', () => {
  let service: CoursesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoursesService,
        { provide: 'ICourseRepo', useValue: mockCourseRepo },
        { provide: 'ICourseEnrollmentRepo', useValue: mockEnrollmentRepo },
        { provide: 'IPaymentRepo', useValue: mockPaymentRepo },
        { provide: 'ICourseLessonRepo', useValue: mockLessonRepo },
      ],
    }).compile();

    service = module.get<CoursesService>(CoursesService);

    jest.clearAllMocks();
  });

  // -----------------------------
  // create
  // -----------------------------
  describe('create', () => {
    it('should create a new course (positive)', async () => {
      const course = new CourseBuilder().build();
      mockCourseRepo.create.mockResolvedValue(
        CourseMapper.toDomainEntity(course),
      );

      const result = await service.create(course);

      expect(result).toEqual(CourseMapper.toDomainEntity(course));
      expect(mockCourseRepo.create).toHaveBeenCalledWith(course);
    });
    it('should throw an error if repository.create fails (negative)', async () => {
      const dto = CourseObjectMother.buildCreateDto();
      mockCourseRepo.create.mockRejectedValue(
        new RepositoryDuplicateError('', ''),
      );

      await expect(service.create(dto)).rejects.toThrow(
        RepositoryDuplicateError,
      );
      expect(mockCourseRepo.create).toHaveBeenCalledWith(dto);
    });
  });

  // -----------------------------
  // findAll
  // -----------------------------
  describe('findAll', () => {
    it('should return courses without user (positive)', async () => {
      const course = new CourseBuilder().build();
      mockCourseRepo.findAll.mockResolvedValue([
        CourseMapper.toDomainEntity(course),
      ]);

      const result = await service.findAll();

      expect(result).toEqual([CourseMapper.toDomainEntity(course)]);
    });

    it('should attach enrollment_status if user provided (positive)', async () => {
      const course = new CourseBuilder().build();
      const enrollment = CourseEnrollmentObjectMother.buildPaidEnrollment({
        course_id: course.id,
      });
      const jwt = new JWTBuilder().withId(enrollment.user_id).build();
      mockCourseRepo.findAll.mockResolvedValue([
        CourseMapper.toDomainEntity(course),
      ]);
      mockEnrollmentRepo.findOneByUserAndCourse.mockResolvedValue(
        CourseEnrollementMapper.toDomainEntity(enrollment),
      );

      const result = await service.findAll(jwt);

      expect((result[0] as any).enrollment_status).toBe(
        CourseEnrollmentStatus.PAID,
      );
    });

    it('should throw an error if repository.findAll fails (negative)', async () => {
      mockCourseRepo.findAll.mockRejectedValue(
        new RepositoryUnknownError('', ''),
      );

      await expect(service.findAll()).rejects.toThrow(RepositoryUnknownError);
    });
  });

  // -----------------------------
  // findOne
  // -----------------------------
  describe('findOne', () => {
    it('should return course if exists', async () => {
      const course = new CourseBuilder().build();
      mockCourseRepo.findOrFailById.mockResolvedValue(
        CourseMapper.toDomainEntity(course),
      );

      const result = await service.findOne(course.id);

      expect(result).toEqual(CourseMapper.toDomainEntity(course));
    });

    it('should throw NotFoundException if not found', async () => {
      mockCourseRepo.findOrFailById.mockRejectedValue(
        new RepositoryNotFoundError('not found', ''),
      );

      await expect(service.findOne('invalid')).rejects.toThrow(
        RepositoryNotFoundError,
      );
    });
  });

  // -----------------------------
  // update
  // -----------------------------
  describe('update', () => {
    it('should update course (positive)', async () => {
      const course = new CourseBuilder().build();
      const dto = CourseObjectMother.buildUpdateDto({ name: 'New name' });

      mockCourseRepo.update.mockResolvedValue({
        ...CourseMapper.toDomainEntity(course),
        name: dto.name,
      });

      const result = await service.update(course.id, dto);

      expect(result.name).toEqual(dto.name);
    });

    it('should throw NotFoundException if course not found', async () => {
      const dto = CourseObjectMother.buildUpdateDto({ name: 'New name' });
      mockCourseRepo.update.mockRejectedValue(
        new RepositoryNotFoundError('not found', ''),
      );

      await expect(service.update('id1', dto)).rejects.toThrow(
        RepositoryNotFoundError,
      );
    });
  });

  // -----------------------------
  // remove
  // -----------------------------
  describe('remove', () => {
    it('should delete course', async () => {
      const course = new CourseBuilder().build();
      mockCourseRepo.delete.mockResolvedValue(CourseMapper.toDomainEntity(course));

      const result = await service.remove(course.id);

      expect(result).toEqual(CourseMapper.toDomainEntity(course));
    });

    it('should throw NotFoundException if course not found', async () => {
      mockCourseRepo.delete.mockRejectedValue(
        new RepositoryNotFoundError('not found', ''),
      );

      await expect(service.remove('id1')).rejects.toThrow(
        RepositoryNotFoundError,
      );
    });
  });

  // -----------------------------
  // registerUser
  // -----------------------------
  describe('registerUser', () => {
    it('should register user (positive)', async () => {
      const enrollment = CourseEnrollmentObjectMother.buildNewEnrollment();
      mockEnrollmentRepo.registerUser.mockResolvedValue(
        CourseEnrollementMapper.toDomainEntity(enrollment),
      );

      const result = await service.registerUser(
        enrollment.user_id,
        enrollment.course_id,
      );
      expect(result).toEqual(
        CourseEnrollementMapper.toDomainEntity(enrollment),
      );
    });

    it('should throw ConflictException if duplicate', async () => {
      mockEnrollmentRepo.registerUser.mockRejectedValue(
        new RepositoryDuplicateError('dup', ''),
      );

      await expect(service.registerUser('u1', 'c1')).rejects.toThrow(
        RepositoryDuplicateError,
      );
    });
  });

  // -----------------------------
  // findAllEnrollments
  // -----------------------------
  describe('findAllEnrollments', () => {
    it('should return enrollments', async () => {
      const enrollment = CourseEnrollmentObjectMother.buildPaidEnrollment();
      mockEnrollmentRepo.findManyByCourse.mockResolvedValue([
        CourseEnrollementMapper.toDomainEntity(enrollment),
      ]);

      const result = await service.findAllEnrollments(enrollment.course_id);

      expect(result).toEqual([
        CourseEnrollementMapper.toDomainEntity(enrollment),
      ]);
    });

    it('should throw NotFoundException if no enrollments found', async () => {
      mockEnrollmentRepo.findManyByCourse.mockRejectedValue(
        new RepositoryNotFoundError('not found', ''),
      );

      await expect(service.findAllEnrollments('c1')).rejects.toThrow(
        RepositoryNotFoundError,
      );
    });
  });

  // -----------------------------
  // findAllPayments
  // -----------------------------
  describe('findAllPayments', () => {
    it('should return payments', async () => {
      const payment = new PaymentBuilder().build();
      mockPaymentRepo.findAllByCourse.mockResolvedValue([
        PaymentsMapper.toDomainEntity(payment),
      ]);

      const result = await service.findAllPayments(payment.course_id);

      expect(result).toEqual([PaymentsMapper.toDomainEntity(payment)]);
    });

    it('should throw NotFoundException if none found', async () => {
      mockPaymentRepo.findAllByCourse.mockRejectedValue(
        new RepositoryNotFoundError('not found', ''),
      );

      await expect(service.findAllPayments('c1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // -----------------------------
  // purchaseCourse
  // -----------------------------
  describe('purchaseCourse', () => {
    it('should create payment and set status', async () => {
      const course = new CourseBuilder().withPrice(100).build();
      const enrollment = CourseEnrollmentObjectMother.buildNewEnrollment({
        course_id: course.id,
      });
      const payment = new PaymentBuilder().build();

      mockCourseRepo.findOrFailById.mockResolvedValue(
        CourseMapper.toDomainEntity(course),
      );
      mockEnrollmentRepo.findOneByUserAndCourse.mockResolvedValue(
        CourseEnrollementMapper.toDomainEntity(enrollment),
      );
      mockPaymentRepo.create.mockResolvedValue(
        PaymentsMapper.toDomainEntity(payment),
      );
      mockEnrollmentRepo.setStatus.mockResolvedValue(undefined);

      const result = await service.purchaseCourse(
        enrollment.user_id,
        course.id,
      );

      expect(result).toEqual(PaymentsMapper.toDomainEntity(payment));
      expect(mockEnrollmentRepo.setStatus).toHaveBeenCalledWith(
        enrollment.user_id,
        course.id,
        CourseEnrollmentStatus.PAID,
      );
    });

    it('should throw ForbiddenException if already paid', async () => {
      const course = new CourseBuilder().withPrice(100).build();
      const enrollment = CourseEnrollmentObjectMother.buildPaidEnrollment({
        course_id: course.id,
      });

      mockCourseRepo.findOrFailById.mockResolvedValue(
        CourseMapper.toDomainEntity(course),
      );
      mockEnrollmentRepo.findOneByUserAndCourse.mockResolvedValue(
        CourseEnrollementMapper.toDomainEntity(enrollment),
      );

      await expect(
        service.purchaseCourse(enrollment.user_id, course.id),
      ).rejects.toThrow(RepositoryDuplicateError);
    });
  });

  // -----------------------------
  // doesUserHaveAccess
  // -----------------------------
  describe('doesUserHaveAccess', () => {
    it('should return true for admin', async () => {
      const jwt = new JWTBuilder().withRole(UserRole.ADMIN).build();
      const result = await service.doesUserHaveAccess(jwt, 'c1');
      expect(result).toBe(true);
    });

    it('should return true if student has paid enrollment', async () => {
      const jwt = new JWTBuilder().build();
      const enrollment = CourseEnrollmentObjectMother.buildPaidEnrollment({
        user_id: jwt.id,
      });

      mockEnrollmentRepo.findOneByUserAndCourse.mockResolvedValue(
        CourseEnrollementMapper.toDomainEntity(enrollment),
      );

      const result = await service.doesUserHaveAccess(jwt, 'c1');

      expect(result).toBe(true);
    });
  });

  // -----------------------------
  // findAllLessons
  // -----------------------------
  describe('findAllLessons', () => {
    it('should return lessons if user has access', async () => {
      const jwt = new JWTBuilder().build();
      const course = new CourseBuilder().withPrice(100).build();
      const enrollment = CourseEnrollmentObjectMother.buildPaidEnrollment({
        course_id: course.id,
        user_id: jwt.id
      });
      const lesson = new CourseLessonBuilder().withCourseId(course.id).build()


      mockEnrollmentRepo.findOneByUserAndCourse.mockResolvedValue(
        CourseEnrollementMapper.toDomainEntity(enrollment),
      );
      mockLessonRepo.findAllByCourse.mockResolvedValue([
        CourseLessonMapper.toDomainEntity(lesson)
      ]);

      const result = await service.findAllLessons(
        jwt,
        'c1',
      );

      expect(result).toEqual([CourseLessonMapper.toDomainEntity(lesson)]);
    });

    it('should throw ForbiddenException if no access', async () => {
      const jwt = new JWTBuilder().build();
      const course = new CourseBuilder().withPrice(100).build();
      const enrollment = CourseEnrollmentObjectMother.buildNewEnrollment({
        course_id: course.id,
        user_id: jwt.id
      });

      mockEnrollmentRepo.findOneByUserAndCourse.mockResolvedValue(
        CourseEnrollementMapper.toDomainEntity(enrollment),
      );

      await expect(
        service.findAllLessons(
          jwt,
          'c1',
        ),
      ).rejects.toThrow(RepositoryForbiddenError);
    });
  });
});
