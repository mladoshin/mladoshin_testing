import { Test, TestingModule } from '@nestjs/testing';
import { CoursesService } from '../courses.service';
import { ICourseRepo } from '../courses.repository';
import { ICourseEnrollmentRepo } from '../../course-enrollments/course-enrollments.repository';
import { IPaymentRepo } from '../../payments/payments.repository';
import { ICourseLessonRepo } from '../../lessons/lessons.repository';
import { NotFoundException, ForbiddenException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { RepositoryNotFoundError, RepositoryDuplicateError } from 'src/common/errors/db-errors';
import { CourseEnrollmentStatus } from '../types/courses.types';
import { UserRole } from '../../users/entities/user.entity';
import { CourseDomainBuilder } from './builders/course-domain.builder';
import { CourseEnrollmentFactory } from './factories/course-enrollment.factory';
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
      const course = new CourseDomainBuilder().build();
      mockCourseRepo.create.mockResolvedValue(course);

      const result = await service.create(course);

      expect(result).toEqual(course);
      expect(mockCourseRepo.create).toHaveBeenCalledWith(course);
    });
  });

  // -----------------------------
  // findAll
  // -----------------------------
  describe('findAll', () => {
    it('should return courses without user (positive)', async () => {
      const course = new CourseDomainBuilder().build();
      mockCourseRepo.findAll.mockResolvedValue([course]);

      const result = await service.findAll();

      expect(result).toEqual([course]);
    });

    it('should attach enrollment_status if user provided (positive)', async () => {
      const course = new CourseDomainBuilder().build();
      mockCourseRepo.findAll.mockResolvedValue([course]);
      mockEnrollmentRepo.findOneByUserAndCourse.mockResolvedValue(
        CourseEnrollmentFactory.paid("1", 'u1', course.id)
      );

      const result = await service.findAll({ id: 'u1', role: UserRole.USER, email: 'test@test.com' });

      expect((result[0] as any).enrollment_status).toBe(CourseEnrollmentStatus.PAID);
    });
  });

  // -----------------------------
  // findOne
  // -----------------------------
  describe('findOne', () => {
    it('should return course if exists', async () => {
      const course = new CourseDomainBuilder().build();
      mockCourseRepo.findOrFailById.mockResolvedValue(course);

      const result = await service.findOne(course.id);

      expect(result).toEqual(course);
    });

    it('should throw NotFoundException if not found', async () => {
      mockCourseRepo.findOrFailById.mockRejectedValue(new RepositoryNotFoundError('not found', ''));

      await expect(service.findOne('invalid')).rejects.toThrow(NotFoundException);
    });
  });

  // -----------------------------
  // update
  // -----------------------------
  describe('update', () => {
    it('should update course (positive)', async () => {
      const course = new CourseDomainBuilder().build();
      mockCourseRepo.update.mockResolvedValue(course);

      const result = await service.update(course.id, { name: 'newName' });

      expect(result).toEqual(course);
    });

    it('should throw NotFoundException if course not found', async () => {
      mockCourseRepo.update.mockRejectedValue(new RepositoryNotFoundError('not found', ''));

      await expect(service.update('id1', { name: 'x' })).rejects.toThrow(NotFoundException);
    });
  });

  // -----------------------------
  // remove
  // -----------------------------
  describe('remove', () => {
    it('should delete course', async () => {
      const course = new CourseDomainBuilder().build();
      mockCourseRepo.delete.mockResolvedValue(course);

      const result = await service.remove(course.id);

      expect(result).toEqual(course);
    });

    it('should throw NotFoundException if course not found', async () => {
      mockCourseRepo.delete.mockRejectedValue(new RepositoryNotFoundError('not found', ''));

      await expect(service.remove('id1')).rejects.toThrow(NotFoundException);
    });
  });

  // -----------------------------
  // registerUser
  // -----------------------------
  describe('registerUser', () => {
    it('should register user (positive)', async () => {
      const enrollment = CourseEnrollmentFactory.pending("1", 'u1', 'c1');
      mockEnrollmentRepo.registerUser.mockResolvedValue(enrollment);

      const result = await service.registerUser('u1', 'c1');

      expect(result).toEqual(enrollment);
    });

    it('should throw ConflictException if duplicate', async () => {
      mockEnrollmentRepo.registerUser.mockRejectedValue(new RepositoryDuplicateError('dup', ''));

      await expect(service.registerUser('u1', 'c1')).rejects.toThrow(ConflictException);
    });
  });

  // -----------------------------
  // findAllEnrollments
  // -----------------------------
  describe('findAllEnrollments', () => {
    it('should return enrollments', async () => {
      const enrollment = CourseEnrollmentFactory.paid('1', 'u1', 'c1');
      mockEnrollmentRepo.findManyByCourse.mockResolvedValue([enrollment]);

      const result = await service.findAllEnrollments('c1');

      expect(result).toEqual([enrollment]);
    });

    it('should throw NotFoundException if no enrollments found', async () => {
      mockEnrollmentRepo.findManyByCourse.mockRejectedValue(new RepositoryNotFoundError('not found', ''));

      await expect(service.findAllEnrollments('c1')).rejects.toThrow(NotFoundException);
    });
  });

  // -----------------------------
  // findAllPayments
  // -----------------------------
  describe('findAllPayments', () => {
    it('should return payments', async () => {
      const payment = { id: 'p1', amount: 100 };
      mockPaymentRepo.findAllByCourse.mockResolvedValue([payment]);

      const result = await service.findAllPayments('c1');

      expect(result).toEqual([payment]);
    });

    it('should throw NotFoundException if none found', async () => {
      mockPaymentRepo.findAllByCourse.mockRejectedValue(new RepositoryNotFoundError('not found', ''));

      await expect(service.findAllPayments('c1')).rejects.toThrow(NotFoundException);
    });
  });

  // -----------------------------
  // purchaseCourse
  // -----------------------------
  describe('purchaseCourse', () => {
    it('should create payment and set status', async () => {
      const course = new CourseDomainBuilder().price(100).build();
      const enrollment = CourseEnrollmentFactory.pending('1', 'u1', course.id);
      const payment = { id: 'p1', amount: 100 };

      mockCourseRepo.findOrFailById.mockResolvedValue(course);
      mockEnrollmentRepo.findOneByUserAndCourse.mockResolvedValue(enrollment);
      mockPaymentRepo.create.mockResolvedValue(payment);
      mockEnrollmentRepo.setStatus.mockResolvedValue(undefined);

      const result = await service.purchaseCourse('u1', course.id);

      expect(result).toEqual(payment);
      expect(mockEnrollmentRepo.setStatus).toHaveBeenCalledWith('u1', course.id, CourseEnrollmentStatus.PAID);
    });

    it('should throw ForbiddenException if already paid', async () => {
      const course = new CourseDomainBuilder().build();
      const enrollment = CourseEnrollmentFactory.paid('1', 'u1', course.id);

      mockCourseRepo.findOrFailById.mockResolvedValue(course);
      mockEnrollmentRepo.findOneByUserAndCourse.mockResolvedValue(enrollment);

      await expect(service.purchaseCourse('u1', course.id)).rejects.toThrow(ForbiddenException);
    });
  });

  // -----------------------------
  // doesUserHaveAccess
  // -----------------------------
  describe('doesUserHaveAccess', () => {
    it('should return true for admin', async () => {
      const result = await service.doesUserHaveAccess({ id: 'admin', role: UserRole.ADMIN, email: 'a@a.com' }, 'c1');
      expect(result).toBe(true);
    });

    it('should return true if student has paid enrollment', async () => {
      mockEnrollmentRepo.findOneByUserAndCourse.mockResolvedValue(CourseEnrollmentFactory.paid('1', 'u1', 'c1'));

      const result = await service.doesUserHaveAccess({ id: 'u1', role: UserRole.USER, email: 'x' }, 'c1');

      expect(result).toBe(true);
    });
  });

  // -----------------------------
  // findAllLessons
  // -----------------------------
  describe('findAllLessons', () => {
    it('should return lessons if user has access', async () => {
      mockEnrollmentRepo.findOneByUserAndCourse.mockResolvedValue(CourseEnrollmentFactory.paid('1', 'u1', 'c1'));
      mockLessonRepo.findAllByCourse.mockResolvedValue([{ id: 'l1', title: 'lesson' }]);

      const result = await service.findAllLessons({ id: 'u1', role: UserRole.USER, email: 'e' }, 'c1');

      expect(result).toEqual([{ id: 'l1', title: 'lesson' }]);
    });

    it('should throw ForbiddenException if no access', async () => {
      mockEnrollmentRepo.findOneByUserAndCourse.mockResolvedValue(CourseEnrollmentFactory.pending('1', 'u1', 'c1'));

      await expect(service.findAllLessons({ id: 'u1', role: UserRole.USER, email: 'e' }, 'c1')).rejects.toThrow(ForbiddenException);
    });
  });
});
