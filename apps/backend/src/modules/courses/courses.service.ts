import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { ICourseRepo } from './courses.repository';
import { Course } from './entities/course.entity';
import {
  RepositoryDuplicateError,
  RepositoryForbiddenError,
  RepositoryNotFoundError,
} from 'src/common/errors/db-errors';
import { ICourseEnrollmentRepo } from '../course-enrollments/course-enrollments.repository';
import { IPaymentRepo } from '../payments/payments.repository';
import { CourseEnrollmentStatus } from './types/courses.types';
import { JWTPayload } from '../auth/guards/AuthGuard';
import { ICourseLessonRepo } from '../lessons/lessons.repository';
import { UserRole } from '../users/entities/user.entity';
import { PaymentDomain } from '../payments/domains/payment.domain';
import { CourseLessonDomain } from '../lessons/domains/lesson.domain';
import { CourseEnrollmentDomain } from '../course-enrollments/domains/course-enrollment.domain';
import {
  CourseDomain,
  CourseDomainWithEnrollmentStatus,
} from './domains/course.domain';

export interface ICoursesService {
  create(createCourseDto: CreateCourseDto, options?: any): Promise<CourseDomain>;
  findAll(
    user?: JWTPayload,
    options?: any,
  ): Promise<CourseDomain[] | CourseDomainWithEnrollmentStatus[]>;
  findOne(id: string, user?: JWTPayload, options?: any): Promise<CourseDomain>;
  update(id: string, updateCourseDto: UpdateCourseDto, options?: any): Promise<CourseDomain>;
  remove(id: string, options?: any): Promise<CourseDomain>;
  registerUser(
    userId: string,
    courseId: string,
    options?: any,
  ): Promise<CourseEnrollmentDomain>;
  findAllEnrollments(courseId: string, options?: any): Promise<CourseEnrollmentDomain[]>;
  findAllPayments(courseId: string, options?: any): Promise<PaymentDomain[]>;
  purchaseCourse(userId: string, courseId: string, options?: any): Promise<PaymentDomain>;
  doesUserHaveAccess(user: JWTPayload, courseId: string, options?: any): Promise<boolean>;
  findAllLessons(
    user: JWTPayload,
    courseId: string,
    options?: any,
  ): Promise<CourseLessonDomain[]>;
}

@Injectable()
export class CoursesService implements ICoursesService {
  constructor(
    @Inject('ICourseRepo') private readonly courseRepository: ICourseRepo,
    @Inject('ICourseEnrollmentRepo')
    private readonly courseEnrollmentRepository: ICourseEnrollmentRepo,
    @Inject('IPaymentRepo')
    private readonly paymentRepository: IPaymentRepo,
    @Inject('ICourseLessonRepo')
    private readonly lessonRepository: ICourseLessonRepo,
  ) {}

  async findAllLessons(user: JWTPayload, courseId: string, options?: any) {
    const hasAccess = await this.doesUserHaveAccess(user, courseId, options);
    if (!hasAccess) {
      throw new RepositoryForbiddenError('У вас нет доступа к этому курсу.', CoursesService.name);
    }

    return this.lessonRepository.findAllByCourse(courseId, options);
  }

  async doesUserHaveAccess(user: JWTPayload, courseId: string, options?: any) {
    let result = false;
    if (user.role === UserRole.ADMIN) {
      result = true;
    } else {
      const courseEnrollment =
        await this.courseEnrollmentRepository.findOneByUserAndCourse(
          user.id,
          courseId,
          options,
        );
      result = (await courseEnrollment?.status) === CourseEnrollmentStatus.PAID;
    }
    return result;
  }

  async getUserStatusInCourse(user: JWTPayload, courseId: string, options?: any) {
    let result: CourseEnrollmentStatus | null = null;
    const courseEnrollment =
      await this.courseEnrollmentRepository.findOneByUserAndCourse(
        user.id,
        courseId,
        options,
      );
    if (courseEnrollment) {
      result = courseEnrollment.status;
    }
    return result;
  }

  async purchaseCourse(userId: string, courseId: string, options?: any) {
    try {
      const course = await this.courseRepository.findOrFailById(courseId, options);
      const courseEnrollment =
        await this.courseEnrollmentRepository.findOneByUserAndCourse(
          userId,
          courseId,
          options,
        );
      if (!courseEnrollment) {
        throw new RepositoryNotFoundError(
          'Пользователь не является участником курса.',
          CoursesService.name,
        );
      }

      if (courseEnrollment.status === CourseEnrollmentStatus.PAID) {
        throw new RepositoryDuplicateError(
          'Пользователь уже оплатил этот курс.',
          CoursesService.name,
        );
      }

      const payment = await this.paymentRepository.create({
        amount: course.price,
        userId,
        courseId,
      }, options);
      await this.courseEnrollmentRepository.setStatus(
        userId,
        courseId,
        CourseEnrollmentStatus.PAID,
        options,
      );
      return payment;
    } catch (err) {
      throw err
    }
  }

  async findAllPayments(courseId: string, options?: any) {
    try {
      return await this.paymentRepository.findAllByCourse(courseId, options);
    } catch (err) {
      if (err instanceof RepositoryNotFoundError) {
        throw new NotFoundException(err.message);
      }
      throw new InternalServerErrorException(err?.message);
    }
  }

  async findAllEnrollments(courseId: string, options?: any) {
    try {
      return await this.courseEnrollmentRepository.findManyByCourse(courseId, options);
    } catch (err) {
      throw err;
    }
  }

  async registerUser(
    userId: string,
    courseId: string,
    options?: any,
  ): Promise<CourseEnrollmentDomain> {
    try {
      return await this.courseEnrollmentRepository.registerUser(
        userId,
        courseId,
        options,
      );
    } catch (err) {
      throw err
    }
  }

  create(createCourseDto: CreateCourseDto, options?: any): Promise<CourseDomain> {
    return this.courseRepository.create(createCourseDto, options);
  }

  async findAll(
    user?: JWTPayload,
    options?: any,
  ): Promise<CourseDomain[] | CourseDomainWithEnrollmentStatus[]> {
    const courses = await this.courseRepository.findAll(options);
    if (user) {
      for (const course of courses) {
        (course as CourseDomainWithEnrollmentStatus).enrollment_status =
          await this.getUserStatusInCourse(user, course.id, options);
      }
    }
    return courses;
  }

  async findOne(
    id: string,
    user?: JWTPayload,
    options?: any,
  ): Promise<CourseDomain | CourseDomainWithEnrollmentStatus> {
    try {
      const course = await this.courseRepository.findOrFailById(id, options);

      if (!!user) {
        (course as CourseDomainWithEnrollmentStatus).enrollment_status =
          await this.getUserStatusInCourse(user, id, options);
      }
      return course;
    } catch (err) {
      throw err
    }
  }

  async update(id: string, updateCourseDto: UpdateCourseDto, options?: any): Promise<CourseDomain> {
    try {
      return await this.courseRepository.update(id, updateCourseDto, options);
    } catch (err) {
      throw err
    }
  }

  async remove(id: string, options?: any): Promise<CourseDomain> {
    try {
      return await this.courseRepository.delete(id, options);
    } catch (err) {
      throw err;
    }
  }
}
