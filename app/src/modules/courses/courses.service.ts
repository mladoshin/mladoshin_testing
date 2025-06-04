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
  RepositoryNotFoundError,
} from 'src/common/errors/db-errors';
import {
  ICourseEnrollmentRepo,
} from '../course-enrollments/course-enrollments.repository';
import { CourseEnrollment } from '../course-enrollments/entities/course-enrollment.entity';
import { IPaymentRepo } from '../payments/payments.repository';
import { CourseEnrollmentStatus } from './types/courses.types';
import { JWTPayload } from '../auth/guards/AuthGuard';
import {
  ICourseLessonRepo,
} from '../lessons/lessons.repository';
import { UserRole } from '../users/entities/user.entity';
import { Payment } from '../payments/entities/payment.entity';
import { CourseLesson } from '../lessons/entities/course-lesson.entity';

export interface ICoursesService {
  create(createCourseDto: CreateCourseDto): Promise<Course>;
  findAll(): Promise<Course[]>;
  findOne(id: string): Promise<Course>;
  update(id: string, updateCourseDto: UpdateCourseDto): Promise<Course>;
  remove(id: string): Promise<Course>;
  registerUser(userId: string, courseId: string): Promise<CourseEnrollment>;
  findAllEnrollments(courseId: string): Promise<CourseEnrollment[]>;
  findAllPayments(courseId: string): Promise<Payment[]>;
  purchaseCourse(userId: string, courseId: string): Promise<Payment>;
  doesUserHaveAccess(user: JWTPayload, courseId: string): Promise<boolean>;
  findAllLessons(user: JWTPayload, courseId: string): Promise<CourseLesson[]>;
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

  async findAllLessons(user: JWTPayload, courseId: string) {
    const hasAccess = await this.doesUserHaveAccess(user, courseId);
    if (!hasAccess) {
      throw new ForbiddenException('У вас нет доступа к этому курсу.');
    }

    return this.lessonRepository.findAllByCourse(courseId);
  }

  async doesUserHaveAccess(user: JWTPayload, courseId: string) {
    let result = false;
    if (user.role === UserRole.ADMIN) {
      result = true;
    } else {
      const courseEnrollment =
        await this.courseEnrollmentRepository.findOneByUserAndCourse(
          user.id,
          courseId,
        );
      result = (await courseEnrollment?.status) === CourseEnrollmentStatus.PAID;
    }
    return result;
  }

  async purchaseCourse(userId: string, courseId: string) {
    try {
      const course = await this.courseRepository.findOrFailById(courseId);
      const courseEnrollment =
        await this.courseEnrollmentRepository.findOneByUserAndCourse(
          userId,
          courseId,
        );
      if (!courseEnrollment) {
        throw new RepositoryNotFoundError(
          'Пользователь не является участником курса.',
          CoursesService.name,
        );
      }

      if (courseEnrollment.status === CourseEnrollmentStatus.PAID) {
        throw new ForbiddenException(
          'Пользователь уже оплатил этот курс.',
          CoursesService.name,
        );
      }

      const payment = await this.paymentRepository.create({
        amount: course.price,
        userId,
        courseId,
      });
      await this.courseEnrollmentRepository.setStatus(
        userId,
        courseId,
        CourseEnrollmentStatus.PAID,
      );
      return payment;
    } catch (err) {
      if (err instanceof RepositoryNotFoundError) {
        throw new NotFoundException(err.message);
      } else if (err instanceof ForbiddenException) {
        throw err;
      }
      throw new InternalServerErrorException(err?.message);
    }
  }

  async findAllPayments(courseId: string) {
    try {
      return await this.paymentRepository.findAllByCourse(courseId);
    } catch (err) {
      if (err instanceof RepositoryNotFoundError) {
        throw new NotFoundException(err.message);
      }
      throw new InternalServerErrorException(err?.message);
    }
  }

  async findAllEnrollments(courseId: string) {
    try {
      return await this.courseEnrollmentRepository.findManyByCourse(courseId);
    } catch (err) {
      if (err instanceof RepositoryNotFoundError) {
        throw new NotFoundException(err.message);
      }
      throw new InternalServerErrorException(err?.message);
    }
  }

  async registerUser(
    userId: string,
    courseId: string,
  ): Promise<CourseEnrollment> {
    try {
      return await this.courseEnrollmentRepository.registerUser(
        userId,
        courseId,
      );
    } catch (err) {
      if (err instanceof RepositoryNotFoundError) {
        throw new NotFoundException(err.message);
      } else if (err instanceof RepositoryDuplicateError) {
        throw new ConflictException(err.message);
      }
      throw new InternalServerErrorException(err?.message);
    }
  }

  create(createCourseDto: CreateCourseDto): Promise<Course> {
    return this.courseRepository.create(createCourseDto);
  }

  findAll(): Promise<Course[]> {
    return this.courseRepository.findAll();
  }

  async findOne(id: string): Promise<Course> {
    try {
      return await this.courseRepository.findOrFailById(id);
    } catch (err) {
      if (err instanceof RepositoryNotFoundError) {
        throw new NotFoundException(err.message);
      }
      throw new InternalServerErrorException(err?.message);
    }
  }

  async update(id: string, updateCourseDto: UpdateCourseDto): Promise<Course> {
    try {
      return await this.courseRepository.update(id, updateCourseDto);
    } catch (err) {
      if (err instanceof RepositoryNotFoundError) {
        throw new NotFoundException(err.message);
      }
      throw new InternalServerErrorException(err?.message);
    }
  }

  async remove(id: string): Promise<Course> {
    try {
      return await this.courseRepository.delete(id);
    } catch (err) {
      if (err instanceof RepositoryNotFoundError) {
        throw new NotFoundException(err.message);
      }
      throw new InternalServerErrorException(err?.message);
    }
  }
}
