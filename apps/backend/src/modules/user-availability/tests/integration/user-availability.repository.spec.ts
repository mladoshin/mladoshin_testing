import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { UserAvailability } from '../../entities/user-availability.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { Course } from 'src/modules/courses/entities/course.entity';
import { UserProfile } from 'src/modules/users/entities/user-profile.entity';
import { CourseLesson } from 'src/modules/lessons/entities/course-lesson.entity';
import { UserAvailabilityRepo } from '../../user-availability.repository';
import { UpdateUserAvailabilityDto } from '../../dto/update-user-availability.dto';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  createTestingSchema,
  getTestingDatabaseConfig,
} from 'src/common/utils/utils';
import { v4 as uuidv4 } from 'uuid';
import {
  RepositoryNotFoundError,
  RepositoryUnknownError,
} from 'src/common/errors/db-errors';
import { UserAvailabilityBuilder } from 'src/common/tests/builders/user-availability.builder';
import { UserAvailabilityObjectMother } from 'src/common/tests/object-mothers/user-availability-object-mother';
import { UserBuilder } from 'src/common/tests/builders/user.builder';
import { CourseBuilder } from 'src/common/tests/builders/course.builder';

describe('UserAvailabilityRepo (integration)', () => {
  let module: TestingModule;
  let availabilityRepo: UserAvailabilityRepo;
  let dataSource: DataSource;
  let user: User;
  let course: Course;
  let availability: UserAvailability;
  let schemaName: string;

  beforeAll(async () => {
    if (process.env.IS_OFFLINE === 'true') {
      throw new Error('Cannot run integration tests in offline mode');
    }
    schemaName = `test_schema_${uuidv4().replace(/-/g, '')}`;

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
          useFactory: async (
            configService: ConfigService,
          ): Promise<TypeOrmModuleOptions> => {
            const config = getTestingDatabaseConfig(configService);
            await createTestingSchema(configService, schemaName);
            return { ...config, schema: schemaName };
          },
        }),
        TypeOrmModule.forFeature([
          User,
          UserProfile,
          UserAvailability,
          Course,
          CourseLesson,
        ]),
      ],
      providers: [UserAvailabilityRepo],
    }).compile();

    availabilityRepo = module.get<UserAvailabilityRepo>(UserAvailabilityRepo);
    dataSource = module.get<DataSource>(DataSource);
  });

  beforeEach(async () => {
    const userRepo = dataSource.getRepository(User);
    const userData = new UserBuilder().withEmail('test@user.com').build();
    user = await userRepo.save(userData);

    const courseRepo = dataSource.getRepository(Course);
    const courseData = new CourseBuilder().withName('Test Course').build();
    course = await courseRepo.save(courseRepo.create(courseData as Course));

    const availabilityRepoDb = dataSource.getRepository(UserAvailability);
    const availabilityData = new UserAvailabilityBuilder()
      .withUserId(user.id)
      .withCourseId(course.id)
      .withWeekDay(1)
      .withStartTime('09:00')
      .withEndTime('17:00')
      .build();
    availability = await availabilityRepoDb.save(
      availabilityRepoDb.create(availabilityData as UserAvailability),
    );
  });

  afterAll(async () => {
    // Удаляем схему после тестов
    await dataSource.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE;`);
    await dataSource.destroy();
  });

  afterEach(async () => {
    await dataSource.query(
      `TRUNCATE TABLE "${schemaName}"."user_availability", "${schemaName}"."course_enrollment", "${schemaName}"."course_lesson", "${schemaName}"."course", "${schemaName}"."user_profile", "${schemaName}"."user" RESTART IDENTITY CASCADE`,
    );
  });

  // ✅ Позитивный тест для create
  it('should create a user availability', async () => {
    const dto = UserAvailabilityObjectMother.buildCreateDto({
      course_id: course.id,
      week_day: 2,
      start_time: '10:00',
      end_time: '18:00',
    });
    const created = await availabilityRepo.create(user.id, dto);
    expect(created.week_day).toBe(dto.week_day);
    expect(created.start_time).toBe(dto.start_time);
    expect(created.end_time).toBe(dto.end_time);
    expect(created.user_id).toBe(user.id);
    expect(created.course_id).toBe(course.id);
    expect(created.id).toBeDefined();
  });

  // ❌ Негативный тест для create
  it('should throw when creating availability with invalid course_id', async () => {
    const dto = UserAvailabilityObjectMother.buildCreateDto({
      course_id: uuidv4(), // Несуществующий курс
    });
    await expect(availabilityRepo.create(user.id, dto)).rejects.toThrow(
      RepositoryUnknownError,
    );
  });

  // ✅ Позитивный тест для findAll
  it('should find all user availabilities', async () => {
    const availabilities = await availabilityRepo.findAll();
    expect(Array.isArray(availabilities)).toBe(true);
    expect(availabilities.length).toBeGreaterThan(0);
  });

  // ❌ Негативный тест для findAll
  it('should return empty array when no availabilities exist', async () => {
    await availabilityRepo.delete(availability.id);
    const availabilities = await availabilityRepo.findAll();
    expect(Array.isArray(availabilities)).toBe(true);
    expect(availabilities.length).toBe(0);
  });

  // ✅ Позитивный тест для findById
  it('should find user availability by id', async () => {
    const found = await availabilityRepo.findById(availability.id);
    expect(found?.id).toEqual(availability.id);
    expect(found?.week_day).toBe(availability.week_day);
  });

  // ❌ Негативный тест для findById
  it('should return null when availability not found', async () => {
    const found = await availabilityRepo.findById(uuidv4());
    expect(found).toEqual(null);
  });

  // ✅ Позитивный тест для findOrFailById
  it('should find user availability by id or fail', async () => {
    const found = await availabilityRepo.findOrFailById(availability.id);
    expect(found.id).toEqual(availability.id);
  });

  // ❌ Негативный тест для findOrFailById
  it('should throw RepositoryNotFoundError when availability not found', async () => {
    await expect(availabilityRepo.findOrFailById(uuidv4())).rejects.toThrow(
      RepositoryNotFoundError,
    );
  });

  // ✅ Позитивный тест для findAllByUserAndCourse
  it('should find all user availabilities by user and course', async () => {
    const found = await availabilityRepo.findAllByUserAndCourse(
      user.id,
      course.id,
    );
    expect(Array.isArray(found)).toBe(true);
    expect(found.length).toBeGreaterThan(0);
    expect(found[0].user_id).toBe(user.id);
    expect(found[0].course_id).toBe(course.id);
  });

  // ❌ Негативный тест для findAllByUserAndCourse
  it('should return empty array when no availabilities found for user and course', async () => {
    const found = await availabilityRepo.findAllByUserAndCourse(
      uuidv4(),
      course.id,
    );
    expect(Array.isArray(found)).toBe(true);
    expect(found.length).toBe(0);
  });

  // ✅ Позитивный тест для update
  it('should update user availability', async () => {
    const dto: UpdateUserAvailabilityDto =
      UserAvailabilityObjectMother.buildUpdateDto({
        start_time: '11:00',
        end_time: '19:00',
      });
    const updated = await availabilityRepo.update(availability.id, dto);
    expect(updated.start_time).toBe(dto.start_time);
    expect(updated.end_time).toBe(dto.end_time);
    expect(updated.id).toBe(availability.id);
  });

  // ❌ Негативный тест для update
  it('should throw RepositoryNotFoundError when updating non-existent availability', async () => {
    const dto: UpdateUserAvailabilityDto =
      UserAvailabilityObjectMother.buildUpdateDto();
    await expect(availabilityRepo.update(uuidv4(), dto)).rejects.toThrow(
      RepositoryNotFoundError,
    );
  });

  // ✅ Позитивный тест для delete
  it('should delete user availability', async () => {
    const deleted = await availabilityRepo.delete(availability.id);
    expect(deleted.id).toBe(availability.id);

    // Проверяем что доступность удалена
    const found = await availabilityRepo.findById(availability.id);
    expect(found).toBeNull();
  });

  // ❌ Негативный тест для delete
  it('should throw RepositoryNotFoundError when deleting non-existent availability', async () => {
    await expect(availabilityRepo.delete(uuidv4())).rejects.toThrow(
      RepositoryNotFoundError,
    );
  });
});
