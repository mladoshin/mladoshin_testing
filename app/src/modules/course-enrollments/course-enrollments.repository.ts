import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from '../courses/entities/course.entity';
import { CreateCourseDto } from '../courses/dto/create-course.dto';
import {
  RepositoryDuplicateError,
  RepositoryNotFoundError,
  RepositoryUnknownError,
} from 'src/common/errors/db-errors';
import { UpdateCourseDto } from '../courses/dto/update-course.dto';
import { CourseEnrollment } from './entities/course-enrollment.entity';
import { CourseEnrollmentStatus } from './types/course-enrollments.types';
import { User } from '../users/entities/user.entity';

export interface ICourseEnrollmentRepo {
  setStatus(
    userId: string,
    courseId: string,
    status: CourseEnrollmentStatus,
  ): Promise<CourseEnrollment>;
  registerUser(userId: string, courseId: string): Promise<CourseEnrollment>;
  findOneByUserAndCourse(
    userId: string,
    courseId: string,
  ): Promise<CourseEnrollment | null>;
  existsByUserAndCourse(userId: string, courseId: string): Promise<boolean>;
  findManyByUser(userId: string): Promise<CourseEnrollment[]>;
  findManyByCourse(courseId: string): Promise<CourseEnrollment[]>;
  findOneById(id: string): Promise<CourseEnrollment>;
}

@Injectable()
export class CourseEnrollmentRepo implements ICourseEnrollmentRepo {
  public constructor(
    @InjectRepository(CourseEnrollment)
    private readonly repository: Repository<CourseEnrollment>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async setStatus(
    userId: string,
    courseId: string,
    status: CourseEnrollmentStatus,
  ) {
    const courseEnrollment = await this.findOneByUserAndCourse(
      userId,
      courseId,
    );
    if (!courseEnrollment) {
      throw new RepositoryNotFoundError(
        'Запись об участии в курсе не найдена.',
        CourseEnrollmentRepo.name,
      );
    }
    courseEnrollment.status = status;
    try {
      return this.repository.save(courseEnrollment);
    } catch (err) {
      throw new RepositoryUnknownError(err.message, CourseEnrollmentRepo.name);
    }
  }

  async registerUser(
    userId: string,
    courseId: string,
  ): Promise<CourseEnrollment> {
    if ((await this.userRepository.existsBy({ id: userId })) === false) {
      throw new RepositoryNotFoundError('Пользователь не найден.', User.name);
    }
    if ((await this.courseRepository.existsBy({ id: courseId })) === false) {
      throw new RepositoryNotFoundError('Курс не найден.', Course.name);
    }

    if (await this.existsByUserAndCourse(userId, courseId)) {
      throw new RepositoryDuplicateError(
        'Пользователь уже зарегистрирован на курсе.',
        Course.name,
      );
    }

    const courseEnrollment = this.repository.create({
      user_id: userId,
      course_id: courseId,
      status: CourseEnrollmentStatus.NEW,
    });

    try {
      const result = await this.repository.save(courseEnrollment);
      return result;
    } catch (err) {
      throw new RepositoryUnknownError(err.message, CourseEnrollmentRepo.name);
    }
  }

  async findOneByUserAndCourse(
    userId: string,
    courseId: string,
  ): Promise<CourseEnrollment | null> {
    return this.repository.findOne({
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

  async existsByUserAndCourse(
    userId: string,
    courseId: string,
  ): Promise<boolean> {
    return this.repository.exists({
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

  async findManyByUser(userId: string): Promise<CourseEnrollment[]> {
    if ((await this.userRepository.existsBy({ id: userId })) === false) {
      throw new RepositoryNotFoundError('Пользователь не найден.', User.name);
    }
    return this.repository.find({
      where: {
        user_id: userId,
      },
      relations: {
        course: true,
      },
    });
  }

  async findManyByCourse(courseId: string): Promise<CourseEnrollment[]> {
    if ((await this.courseRepository.existsBy({ id: courseId })) === false) {
      throw new RepositoryNotFoundError('Курс не найден.', Course.name);
    }
    return this.repository.find({
      where: {
        course_id: courseId,
      },
      relations: {
        user: true,
      },
    });
  }

  // async update(id: string, updateCourseDto: UpdateCourseDto) {
  //   let course = await this.findOrFailById(id);
  //   const updated = this.repository.merge(course, updateCourseDto);
  //   course = await this.repository.save(updated);
  //   return course;
  // }

  async findOneById(id: string): Promise<CourseEnrollment> {
    const courseEnrollment = await this.repository.findOne({
      where: { id },
      relations: {
        user: true,
        course: true,
      },
    });

    if (!courseEnrollment) {
      throw new RepositoryNotFoundError(
        'Запись об участии в курсе не найдена.',
        CourseEnrollment.name,
      );
    }
    return courseEnrollment;
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
