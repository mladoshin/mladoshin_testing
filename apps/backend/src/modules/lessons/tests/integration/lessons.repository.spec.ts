import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CourseLessonRepo } from '../../lessons.repository';
import { CourseLesson } from '../../entities/course-lesson.entity';
import { UpdateLessonDto } from '../../dto/update-lesson.dto';
import { Course } from 'src/modules/courses/entities/course.entity';
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
import { CourseLessonBuilder } from 'src/common/tests/builders/lesson.builder';
import { CourseLessonObjectMother } from 'src/common/tests/object-mothers/lesson-object-mother';
import { CourseBuilder } from 'src/common/tests/builders/course.builder';

describe('CourseLessonRepo (integration)', () => {
  let module: TestingModule;
  let lessonRepo: CourseLessonRepo;
  let dataSource: DataSource;
  let course: Course;
  let lesson: CourseLesson;
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
      providers: [CourseLessonRepo],
    }).compile();

    lessonRepo = module.get<CourseLessonRepo>(CourseLessonRepo);
    dataSource = module.get<DataSource>(DataSource);
  });

  beforeEach(async () => {
    const courseRepo = dataSource.getRepository(Course);
    const courseData = new CourseBuilder().withName('Test Course').build();
    course = await courseRepo.save(courseData);

    const lessonRepo = dataSource.getRepository(CourseLesson);
    const lessonData = new CourseLessonBuilder()
      .withCourseId(course.id)
      .build();
    lesson = await lessonRepo.save(lessonData);
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

  // ✅ Positive test for create
  it('should create a lesson', async () => {
    const dto = CourseLessonObjectMother.buildCreateDto({
      course_id: course.id,
    });
    const createdLesson = await lessonRepo.create(dto);
    expect(createdLesson).toMatchObject(dto);
    expect(createdLesson.id).toBeDefined();
  });

  // ❌ Negative test for create
  it('should throw when creating a lesson with invalid data', async () => {
    const dto = CourseLessonObjectMother.buildCreateDto({
      title: undefined,
      course_id: course.id,
    });
    await expect(lessonRepo.create(dto)).rejects.toThrow(
      RepositoryUnknownError,
    );
  });

  // ✅ Positive test for findAll
  it('should find all lessons', async () => {
    const lessons = await lessonRepo.findAll();
    expect(Array.isArray(lessons)).toBe(true);
    expect(lessons.length).toBeGreaterThan(0);
  });

  // ❌ Negative test for findAll
  it('should return empty array when no lessons exist', async () => {
    await lessonRepo.delete(lesson.id);
    const lessons = await lessonRepo.findAll();
    expect(Array.isArray(lessons)).toBe(true);
    expect(lessons.length).toBe(0);
  });

  // ✅ Positive test for findById
  it('should find lesson by id', async () => {
    const found = await lessonRepo.findById(lesson.id);
    expect(found?.id).toEqual(lesson.id);
    expect(found?.title).toBe(lesson.title);
  });

  // ❌ Negative test for findById
  it('should return null when lesson not found', async () => {
    const found = await lessonRepo.findById(uuidv4());
    expect(found).toEqual(null);
  });

  // ✅ Positive test for findOrFailById
  it('should find lesson by id or fail', async () => {
    const found = await lessonRepo.findOrFailById(lesson.id);
    expect(found.id).toEqual(lesson.id);
  });

  // ❌ Negative test for findOrFailById
  it('should throw when lesson not found', async () => {
    await expect(lessonRepo.findOrFailById(uuidv4())).rejects.toThrow(
      RepositoryNotFoundError,
    );
  });

  // ✅ Positive test for findAllByCourse
  it('should find all lessons by course', async () => {
    const lessons = await lessonRepo.findAllByCourse(course.id);
    expect(Array.isArray(lessons)).toBe(true);
    expect(lessons.length).toBeGreaterThan(0);
    expect(lessons[0].course_id).toBe(course.id);
  });

  // ❌ Negative test for findAllByCourse
  it('should return empty array when no lessons for course', async () => {
    const lessons = await lessonRepo.findAllByCourse(uuidv4());
    expect(Array.isArray(lessons)).toBe(true);
    expect(lessons.length).toBe(0);
  });

  // ✅ Positive test for update
  it('should update lesson', async () => {
    const dto = CourseLessonObjectMother.buildUpdateDto();
    const updated = await lessonRepo.update(lesson.id, dto);
    expect(updated.title).toBe(dto.title);
  });

  // ❌ Negative test for update
  it('should throw when updating non-existing lesson', async () => {
    const update: UpdateLessonDto = CourseLessonObjectMother.buildUpdateDto();
    await expect(lessonRepo.update(uuidv4(), update)).rejects.toThrow(
      RepositoryNotFoundError,
    );
  });

  // ✅ Positive test for delete
  it('should delete lesson', async () => {
    const deleted = await lessonRepo.delete(lesson.id);

    expect(deleted.title).toBe(lesson.title);
    await expect(lessonRepo.findOrFailById(lesson.id)).rejects.toThrow(
      RepositoryNotFoundError,
    );
  });

  // ❌ Negative test for delete
  it('should throw when deleting non-existing lesson', async () => {
    await expect(lessonRepo.delete(uuidv4())).rejects.toThrow(
      RepositoryNotFoundError,
    );
  });
});
