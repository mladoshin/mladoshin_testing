import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { RepositoryNotFoundError, RepositoryUnknownError } from 'src/common/errors/db-errors';
import { AppLoggerModule } from 'src/common/logging/log.module';
import { CourseLessonBuilder } from 'src/common/tests/builders/lesson.builder';
import { CourseBuilder } from 'src/common/tests/builders/course.builder';
import { CourseLessonObjectMother } from 'src/common/tests/object-mothers/lesson-object-mother';
import { createTestingSchema, getTestingDatabaseConfig } from 'src/common/utils/utils';
import { CoursesModule } from 'src/modules/courses/courses.module';
import { Course } from 'src/modules/courses/entities/course.entity';
import { DataSource, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { LessonsModule } from '../../lessons.module';
import { ILessonsService } from '../../lessons.service';
import { CreateLessonDto } from '../../dto/create-lesson.dto';
import { UpdateLessonDto } from '../../dto/update-lesson.dto';
import { CourseLesson } from '../../entities/course-lesson.entity';

describe('LessonsService (Integration)', () => {
  let service: ILessonsService;
  let dataSource: DataSource;
  let course: Course;
  let lesson: CourseLesson;
  let courseRepo: Repository<Course>;
  let lessonRepo: Repository<CourseLesson>;
  let schemaName: string;

  beforeAll(async () => {
    schemaName = `test_schema_${uuidv4().replace(/-/g, '')}`;

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
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
        LessonsModule,
        CoursesModule,
        AppLoggerModule,
      ],
    }).compile();

    dataSource = module.get(DataSource);
    service = module.get<ILessonsService>('ILessonsService');

    // Репозитории
    courseRepo = dataSource.getRepository(Course);
    lessonRepo = dataSource.getRepository(CourseLesson);
  });

  afterAll(async () => {
    // Удаляем схему после тестов
    await dataSource.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE;`);
    await dataSource.destroy();
  });

  beforeEach(async () => {
    // Создаём курс через билдер
    const courseData = new CourseBuilder().withName('Test Course').build();
    course = await courseRepo.save(courseRepo.create(courseData as Course));

    // Создаём урок через билдер
    const lessonData = new CourseLessonBuilder().withCourseId(course.id).build();
    lesson = await lessonRepo.save(lessonRepo.create(lessonData as CourseLesson));
  });

  afterEach(async () => {
    await dataSource.query(
      `TRUNCATE TABLE "${schemaName}"."payment", "${schemaName}"."course_enrollment", "${schemaName}"."course_lesson", "${schemaName}"."course", "${schemaName}"."user_profile", "${schemaName}"."user" RESTART IDENTITY CASCADE`,
    );
  });

  // ---------- CREATE ----------
  it('✅ должен создать урок', async () => {
    const dto: CreateLessonDto = CourseLessonObjectMother.buildCreateDto({ course_id: course.id });
    const createdLesson = await service.create(dto);
    expect(createdLesson.title).toBe(dto.title);
    expect(createdLesson.id).toBeDefined();
    expect(createdLesson.content).toBe(dto.content);
    expect(createdLesson.course_id).toBe(dto.course_id);
  });

  it('❌ ошибка при создании урока с пустым названием', async () => {
    const dto: CreateLessonDto = CourseLessonObjectMother.buildCreateDto({
      title: null,
      course_id: course.id,
    } as any);
    await expect(service.create(dto)).rejects.toThrow(RepositoryUnknownError);
  });

  // ---------- FIND ALL ----------
  it('✅ возвращает один урок изначально', async () => {
    const lessons = await service.findAll();
    expect(lessons).toHaveLength(1);
  });

  it('❌ возвращает пустой список после удаления урока', async () => {
    await service.remove(lesson.id);
    const lessons = await service.findAll();
    expect(lessons).toEqual([]);
  });

  // ---------- FIND ONE ----------
  it('✅ возвращает урок по id', async () => {
    const found = await service.findOne(lesson.id);
    expect(found.id).toBe(lesson.id);
  });

  it('❌ выбрасывает ошибку, если урок не существует', async () => {
    await expect(service.findOne(uuidv4())).rejects.toThrow(
      RepositoryNotFoundError,
    );
  });

  // ---------- UPDATE ----------
  it('✅ обновляет урок', async () => {
    const dto: UpdateLessonDto = CourseLessonObjectMother.buildUpdateDto();
    const updated = await service.update(lesson.id, dto);
    expect(updated.title).toBe(dto.title);
  });

  it('❌ выбрасывает ошибку при обновлении несуществующего урока', async () => {
    const dto: UpdateLessonDto = CourseLessonObjectMother.buildUpdateDto();

    await expect(service.update(uuidv4(), dto)).rejects.toThrow(
      RepositoryNotFoundError,
    );
  });

  // ---------- REMOVE ----------
  it('✅ удаляет урок', async () => {
    const removed = await service.remove(lesson.id);
    expect(removed.title).toBe(lesson.title);
  });

  it('❌ выбрасывает ошибку при удалении несуществующего урока', async () => {
    await expect(service.remove(uuidv4())).rejects.toThrow(
      RepositoryNotFoundError,
    );
  });
});
