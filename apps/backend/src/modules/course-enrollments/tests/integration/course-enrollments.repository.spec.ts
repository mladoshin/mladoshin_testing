import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getTestingDatabaseConfig } from 'src/common/utils/utils';
import { CourseEnrollmentRepo } from '../../course-enrollments.repository';
import { User } from 'src/modules/users/entities/user.entity';
import { UserProfile } from 'src/modules/users/entities/user-profile.entity';
import { Payment } from 'src/modules/payments/entities/payment.entity';
import { Course } from 'src/modules/courses/entities/course.entity';
import { CourseLesson } from 'src/modules/lessons/entities/course-lesson.entity';
import { DataSource, QueryFailedError } from 'typeorm';
import { CourseEnrollmentStatus } from '../../types/course-enrollments.types';
import { CourseEnrollment } from '../../entities/course-enrollment.entity';
import { CourseEnrollmentDomain } from '../../domains/course-enrollment.domain';
import { RepositoryNotFoundError } from 'src/common/errors/db-errors';
import { UserBuilder } from 'src/common/tests/builders/user.builder';
import { CourseBuilder } from 'src/common/tests/builders/course.builder';
import { v4 as uuidv4 } from 'uuid';

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
          CourseEnrollment,
        ]),
      ],
      providers: [CourseEnrollmentRepo],
    }).compile();

    courseEnrollmentRepo =
      module.get<CourseEnrollmentRepo>(CourseEnrollmentRepo);
    dataSource = module.get<DataSource>(DataSource);

    // Репозитории
    const userRepo = dataSource.getRepository(User);
    const courseRepo = dataSource.getRepository(Course);

    // Создаём объекты через билдер
    const userData = new UserBuilder().withEmail('test@user.com').build();
    user = await userRepo.save(userData);

    const courseData = new CourseBuilder().withName('Test Course').build();
    course = await courseRepo.save(courseRepo.create(courseData as Course));
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

  it('should throw an error if user does not exist', async () => {
    await expect(
      courseEnrollmentRepo.registerUser(uuidv4(), course.id),
    ).rejects.toThrow(RepositoryNotFoundError);
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

  it('can not find enrollment by course and user', async () => {
    const enrollment = await courseEnrollmentRepo.findOneByUserAndCourse(
      uuidv4(),
      course.id,
    );
    expect(enrollment).toBeDefined();
    expect(enrollment).toBe(null);
  });

  it('should find all enrollments by user', async () => {
    const enrollments = await courseEnrollmentRepo.findManyByUser(user.id);
    expect(enrollments.length).toBeGreaterThan(0);
    expect(enrollments[0].user_id).toBe(user.id);
  });

  it('should find all enrollments by user - invalid uuid', async () => {
    await expect(courseEnrollmentRepo.findManyByUser('123')).rejects.toThrow(
      QueryFailedError,
    );
  });

  it('should find all enrollments by course', async () => {
    const enrollments = await courseEnrollmentRepo.findManyByCourse(course.id);
    expect(enrollments.length).toBeGreaterThan(0);
    expect(enrollments[0].course_id).toBe(course.id);
  });

  it('should find all enrollments by course - no course', async () => {
    const enrollments = await expect(courseEnrollmentRepo.findManyByCourse(uuidv4())).rejects.toThrow(RepositoryNotFoundError);
  });

  it('should update enrollment status', async () => {
    const updated = await courseEnrollmentRepo.setStatus(
      user.id,
      course.id,
      CourseEnrollmentStatus.PAID,
    );
    expect((updated as CourseEnrollmentDomain).status).toBe(
      CourseEnrollmentStatus.PAID,
    );
  });

  it('should update enrollment status - no enrollment found', async () => {
    const updated = await expect(
      courseEnrollmentRepo.setStatus(
        uuidv4(),
        course.id,
        CourseEnrollmentStatus.PAID,
      ),
    ).rejects.toThrow(RepositoryNotFoundError);
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

  it('should find enrollment by id - not found', async () => {
    const found = await expect(
      courseEnrollmentRepo.findOneById(uuidv4()),
    ).rejects.toThrow(RepositoryNotFoundError);
  });
});
