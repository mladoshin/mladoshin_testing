// courses.repository.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getTestingDatabaseConfig } from 'src/common/utils/utils';
import { CourseEnrollmentRepo } from '../course-enrollments.repository';
import { User, UserRole } from 'src/modules/users/entities/user.entity';
import { UserProfile } from 'src/modules/users/entities/user-profile.entity';
import { Payment } from 'src/modules/payments/entities/payment.entity';
import { Course } from 'src/modules/courses/entities/course.entity';
import { CourseLesson } from 'src/modules/lessons/entities/course-lesson.entity';
import { DataSource } from 'typeorm';
import { CourseEnrollmentStatus } from '../types/course-enrollments.types';
import { CourseEnrollment } from '../entities/course-enrollment.entity';

describe('CourseEnrollmentRepo (integration)', () => {
  let module: TestingModule;
  let courseEnrollmentRepo: CourseEnrollmentRepo;
  let dataSource: DataSource;
  let user: User;
  let course: Course;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [],
          envFilePath: '.env.test',
        }),
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService) =>
            getTestingDatabaseConfig(configService) as any,
        }),
        TypeOrmModule.forFeature([
          User,
          UserProfile,
          Payment,
          Course,
          CourseLesson,
          CourseEnrollment
        ]),
      ],
      providers: [CourseEnrollmentRepo],
    }).compile();

    courseEnrollmentRepo =
      module.get<CourseEnrollmentRepo>(CourseEnrollmentRepo);
    dataSource = module.get<DataSource>(DataSource);

    // Create a user and course for testing
    const userRepo = dataSource.getRepository(User);
    const courseRepo = dataSource.getRepository(Course);

    user = await userRepo.save(
      userRepo.create({
        email: 'test@user.com',
        password: 'password',
        role: UserRole.USER,
        profile: {
          first_name: 'Maxim',
          last_name: 'Ladoshin',
        },
      }),
    );
    course = await courseRepo.save(
      courseRepo.create({
        name: 'Test Course',
        date_start: '2025-01-01T18:37:00',
        date_finish: '2025-01-01T18:37:00',
        price: 100,
      }),
    );
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  it('should register a user for a course', async () => {
    const enrollment = await courseEnrollmentRepo.registerUser(
      user.id,
      course.id,
    );
    expect(enrollment).toBeDefined();
    expect(enrollment.user_id).toBe(user.id);
    expect(enrollment.course_id).toBe(course.id);
    expect(enrollment.status).toBe(CourseEnrollmentStatus.NEW);
  });

  it('should find enrollment by user and course', async () => {
    const enrollment = await courseEnrollmentRepo.findOneByUserAndCourse(
      user.id,
      course.id,
    );
    expect(enrollment).toBeDefined();
    expect(enrollment?.user?.id).toBe(user.id);
    expect(enrollment?.course?.id).toBe(course.id);
  });

  it('should find all enrollments by user', async () => {
    const enrollments = await courseEnrollmentRepo.findManyByUser(user.id);
    expect(enrollments.length).toBeGreaterThan(0);
    expect(enrollments[0].user_id).toBe(user.id);
  });

  it('should find all enrollments by course', async () => {
    const enrollments = await courseEnrollmentRepo.findManyByCourse(course.id);
    expect(enrollments.length).toBeGreaterThan(0);
    expect(enrollments[0].course_id).toBe(course.id);
  });

  it('should update enrollment status', async () => {
    const enrollment = await courseEnrollmentRepo.findOneByUserAndCourse(
      user.id,
      course.id,
    );
    expect(enrollment).toBeDefined();

    const updated = await courseEnrollmentRepo.setStatus(
      user.id,
      course.id,
      CourseEnrollmentStatus.PAID,
    );
    expect(updated.status).toBe(CourseEnrollmentStatus.PAID);
  });

  it('should find enrollment by id', async () => {
    const enrollment = await courseEnrollmentRepo.findOneByUserAndCourse(
      user.id,
      course.id,
    );
    expect(enrollment).toBeDefined();

    const found = await courseEnrollmentRepo.findOneById(enrollment!.id);
    expect(found).toBeDefined();
    expect(found.id).toBe(enrollment!.id);
  });
});
