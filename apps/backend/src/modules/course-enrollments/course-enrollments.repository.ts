import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Course } from '../courses/entities/course.entity';
import {
  RepositoryDuplicateError,
  RepositoryNotFoundError,
  RepositoryUnknownError,
} from 'src/common/errors/db-errors';
import { CourseEnrollment } from './entities/course-enrollment.entity';
import { CourseEnrollmentStatus } from './types/course-enrollments.types';
import { User } from '../users/entities/user.entity';
import { CourseEnrollmentDomain } from './domains/course-enrollment.domain';
import { CourseEnrollementMapper } from './course-enrollments.mapper';

export interface ICourseEnrollmentRepo {
  setStatus(
    userId: string,
    courseId: string,
    status: CourseEnrollmentStatus,
    options?: any,
  ): Promise<CourseEnrollmentDomain>;
  registerUser(
    userId: string,
    courseId: string,
    options?: any,
  ): Promise<CourseEnrollmentDomain>;
  findOneByUserAndCourse(
    userId: string,
    courseId: string,
    options?: any,
  ): Promise<CourseEnrollmentDomain | null>;
  existsByUserAndCourse(userId: string, courseId: string, options?: any): Promise<boolean>;
  findManyByUser(userId: string, options?: any): Promise<CourseEnrollmentDomain[]>;
  findManyByCourse(courseId: string, options?: any): Promise<CourseEnrollmentDomain[]>;
  findOneById(id: string, options?: any): Promise<CourseEnrollmentDomain>;
}

@Injectable()
export class CourseEnrollmentRepo implements ICourseEnrollmentRepo {
  public constructor(
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  private async getORMRepository(options?: any) {
    const entityManager = this.dataSource.createEntityManager();
    if (options?.schema) {
      await entityManager.query(`SET search_path TO "${options.schema}"`);
    }
    return {
      enrollmentRepository: entityManager.getRepository(CourseEnrollment),
      userRepository: entityManager.getRepository(User),
      courseRepository: entityManager.getRepository(Course),
    };
  }

  async setStatus(
    userId: string,
    courseId: string,
    status: CourseEnrollmentStatus,
    options?: any,
  ) {
    const courseEnrollmentDomain = await this.findOneByUserAndCourse(
      userId,
      courseId,
      options,
    );
    if (!courseEnrollmentDomain) {
      throw new RepositoryNotFoundError(
        'Запись об участии в курсе не найдена.',
        CourseEnrollmentRepo.name,
      );
    }
    courseEnrollmentDomain.status = status;

    const { enrollmentRepository } = await this.getORMRepository(options);

    try {
      await enrollmentRepository.save(CourseEnrollementMapper.toDatabaseEntity(courseEnrollmentDomain));
      return courseEnrollmentDomain;
    } catch (err) {
      throw new RepositoryUnknownError(err.message, CourseEnrollmentRepo.name);
    }
  }

  async registerUser(
    userId: string,
    courseId: string,
    options?: any,
  ): Promise<CourseEnrollmentDomain> {
    const { enrollmentRepository, userRepository, courseRepository } = await this.getORMRepository(options);

    if ((await userRepository.existsBy({ id: userId })) === false) {
      throw new RepositoryNotFoundError('Пользователь не найден.', User.name);
    }
    if ((await courseRepository.existsBy({ id: courseId })) === false) {
      throw new RepositoryNotFoundError('Курс не найден.', Course.name);
    }

    if (await this.existsByUserAndCourse(userId, courseId, options)) {
      throw new RepositoryDuplicateError(
        'Пользователь уже зарегистрирован на курсе.',
        Course.name,
      );
    }

    const courseEnrollment = enrollmentRepository.create({
      user_id: userId,
      course_id: courseId,
      status: CourseEnrollmentStatus.NEW,
    });

    try {
      const result = await enrollmentRepository.save(courseEnrollment);
      return result;
    } catch (err) {
      throw new RepositoryUnknownError(err.message, CourseEnrollmentRepo.name);
    }
  }

  async findOneByUserAndCourse(
    userId: string,
    courseId: string,
    options?: any,
  ): Promise<CourseEnrollmentDomain | null> {
    const { enrollmentRepository } = await this.getORMRepository(options);

    const courseEnrollmentDBEntity = await enrollmentRepository.findOne({
      where: {
        user_id: userId,
        course_id: courseId,
      },
      relations: {
        user: true,
        course: true,
      },
    });
    return courseEnrollmentDBEntity
      ? CourseEnrollementMapper.toDomainEntity(courseEnrollmentDBEntity)
      : null;
  }

  async existsByUserAndCourse(
    userId: string,
    courseId: string,
    options?: any,
  ): Promise<boolean> {
    const { enrollmentRepository } = await this.getORMRepository(options);

    return enrollmentRepository.exists({
      where: {
        user_id: userId,
        course_id: courseId,
      },
      relations: {
        user: true,
        course: true,
      },
    });
  }

  async findManyByUser(userId: string, options?: any): Promise<CourseEnrollmentDomain[]> {
    const { enrollmentRepository, userRepository } = await this.getORMRepository(options);

    if ((await userRepository.existsBy({ id: userId })) === false) {
      throw new RepositoryNotFoundError('Пользователь не найден.', User.name);
    }
    const courseEnrollmentDBEntities = await enrollmentRepository.find({
      where: {
        user_id: userId,
      },
      relations: {
        course: true,
      },
    });

    return courseEnrollmentDBEntities.map((courseEnrollmentDBEntity) =>
      CourseEnrollementMapper.toDomainEntity(courseEnrollmentDBEntity),
    );
  }

  async findManyByCourse(courseId: string, options?: any): Promise<CourseEnrollmentDomain[]> {
    const { enrollmentRepository, courseRepository } = await this.getORMRepository(options);

    if ((await courseRepository.existsBy({ id: courseId })) === false) {
      throw new RepositoryNotFoundError('Курс не найден.', Course.name);
    }
    const courseEnrollmentDBEntities = await enrollmentRepository.find({
      where: {
        course_id: courseId,
      },
      relations: {
        user: true,
      },
    });

    return courseEnrollmentDBEntities.map((courseEnrollmentDBEntity) =>
      CourseEnrollementMapper.toDomainEntity(courseEnrollmentDBEntity),
    );
  }

  // async update(id: string, updateCourseDto: UpdateCourseDto) {
  //   let course = await this.findOrFailById(id);
  //   const updated = this.repository.merge(course, updateCourseDto);
  //   course = await this.repository.save(updated);
  //   return course;
  // }

  async findOneById(id: string, options?: any): Promise<CourseEnrollmentDomain> {
    const { enrollmentRepository } = await this.getORMRepository(options);

    const courseEnrollmentDBEntity = await enrollmentRepository.findOne({
      where: { id },
      relations: {
        user: true,
        course: true,
      },
    });

    if (!courseEnrollmentDBEntity) {
      throw new RepositoryNotFoundError(
        'Запись об участии в курсе не найдена.',
        CourseEnrollment.name,
      );
    }
    return CourseEnrollementMapper.toDomainEntity(courseEnrollmentDBEntity);
  }

  // async findOrFailById(id: string): Promise<Course> {
  //   const course = await this.repository.findOne({
  //     where: { id },
  //   });
  //   if (!course) {
  //     throw new RepositoryNotFoundError('Курс не найден.', Course.name);
  //   }
  //   return course;
  // }

  // findAll() {
  //   return this.repository.find();
  // }

  // async delete(id: string) {
  //   const course = await this.findOrFailById(id);
  //   const tmp = {...course}
  //   await this.repository.remove(course);
  //   return tmp;
  // }
}
