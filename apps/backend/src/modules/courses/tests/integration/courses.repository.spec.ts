import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource, QueryFailedError } from 'typeorm';
import { CourseRepo } from '../../courses.repository';
import { Course } from '../../entities/course.entity';
import { UpdateCourseDto } from '../../dto/update-course.dto';
import { CourseLesson } from 'src/modules/lessons/entities/course-lesson.entity';
import { Payment } from 'src/modules/payments/entities/payment.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { UserProfile } from 'src/modules/users/entities/user-profile.entity';
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
import { CourseBuilder } from 'src/common/tests/builders/course.builder';
import { CourseObjectMother } from 'src/common/tests/object-mothers/course-object-mother';

describe('CourseRepo (integration)', () => {
  let module: TestingModule;
  let courseRepo: CourseRepo;
  let dataSource: DataSource;
  let course: Course;
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
          Payment,
          Course,
          CourseLesson,
        ]),
      ],
      providers: [CourseRepo],
    }).compile();

    courseRepo = module.get<CourseRepo>(CourseRepo);
    dataSource = module.get<DataSource>(DataSource);
  });

  beforeEach(async () => {
    const courseRepo = dataSource.getRepository(Course);
    const courseData = new CourseBuilder().withName('Test Course').build();
    course = await courseRepo.save(courseData);
  });

  afterAll(async () => {
    // Удаляем схему после тестов
    await dataSource.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE;`);
    await dataSource.destroy();
  });

  afterEach(async () => {
    await dataSource.query(
      `TRUNCATE TABLE "${schemaName}"."payment", "${schemaName}"."course_enrollment", "${schemaName}"."course_lesson", "${schemaName}"."course", "${schemaName}"."user_profile", "${schemaName}"."user" RESTART IDENTITY CASCADE`,
    );
  });

  it('should create a course', async () => {
    const dto = CourseObjectMother.buildCreateDto();
    const course = await courseRepo.create(dto);
    expect(course).toMatchObject(dto);
    expect(course.id).toBeDefined();
  });

  // ❌ Negative test for create
  it('should create a course', async () => {
    const dto = CourseObjectMother.buildCreateDto({ name: undefined });
    await expect(courseRepo.create(dto)).rejects.toThrow(
      RepositoryUnknownError,
    );
  });

  it('should find all courses', async () => {
    const courses = await courseRepo.findAll();
    expect(Array.isArray(courses)).toBe(true);
    expect(courses.length).toBeGreaterThan(0);
  });

  // ❌ Negative test for findAll
  it('should find all courses', async () => {
    await courseRepo.delete(course.id);
    const courses = await courseRepo.findAll();
    expect(Array.isArray(courses)).toBe(true);
    expect(courses.length).toBe(0);
  });

  it('should find course by id', async () => {
    const found = await courseRepo.findById(course.id);
    expect(found?.id).toEqual(course.id);
    expect(found?.name).toBe(course.name);
  });

  // ❌ Negative test for findById
  it('Course not found', async () => {
    const found = await courseRepo.findById(uuidv4());
    expect(found).toEqual(null);
  });

  it('should update course', async () => {
    const dto = CourseObjectMother.buildUpdateDto();
    const updated = await courseRepo.update(course.id, dto);
    expect(updated.name).toBe(dto.name);
  });

  // ❌ Negative test for update
  it('should throw when updating non-existing course', async () => {
    const update: UpdateCourseDto = CourseObjectMother.buildUpdateDto();
    await expect(courseRepo.update(uuidv4(), update)).rejects.toThrow(
      RepositoryNotFoundError,
    );
  });

  it('should delete course', async () => {
    const deleted = await courseRepo.delete(course.id);

    expect(deleted.id).toBe(course.id);
    await expect(courseRepo.findOrFailById(course.id)).rejects.toThrow(
      RepositoryNotFoundError,
    );
  });

  it('should throw when deleting non-existing course', async () => {
    await expect(courseRepo.delete(uuidv4())).rejects.toThrow(
      RepositoryNotFoundError,
    );
  });
});
