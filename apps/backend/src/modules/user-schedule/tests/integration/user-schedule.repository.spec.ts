import { Test, TestingModule } from '@nestjs/testing';
import {
  TypeOrmModule,
  getRepositoryToken,
  TypeOrmModuleOptions,
} from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DataSource, Repository } from 'typeorm';
import { UserScheduleRepo } from '../../user-schedule.repository';
import { User } from 'src/modules/users/entities/user.entity';
import { Course } from 'src/modules/courses/entities/course.entity';
import { CourseLesson } from 'src/modules/lessons/entities/course-lesson.entity';
import { UserAvailability } from 'src/modules/user-availability/entities/user-availability.entity';
import { UserSchedule } from '../../entities/user-schedule.entity';
import {
  createTestingSchema,
  getTestingDatabaseConfig,
} from 'src/common/utils/utils';
import { UserProfile } from 'src/modules/users/entities/user-profile.entity';
import { UserBuilder } from 'src/common/tests/builders/user.builder';
import { CourseBuilder } from 'src/common/tests/builders/course.builder';
import { CourseLessonBuilder } from 'src/common/tests/builders/lesson.builder';
import { UserAvailabilityBuilder } from 'src/common/tests/builders/user-availability.builder';
import { UserScheduleObjectMother } from 'src/common/tests/object-mothers/user-schedule-object-mother';
import { v4 as uuidv4 } from 'uuid';

describe('UserScheduleRepo', () => {
  let repo: UserScheduleRepo;
  let dataSource: DataSource;
  let userRepo: Repository<User>;
  let courseRepo: Repository<Course>;
  let lessonRepo: Repository<CourseLesson>;
  let availabilityRepo: Repository<UserAvailability>;
  let scheduleRepo: Repository<UserSchedule>;

  let user: User;
  let course: Course;
  let schemaName: string;

  beforeAll(async () => {
    if (process.env.IS_OFFLINE === 'true') {
      throw new Error('Cannot run integration tests in offline mode');
    }
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
        TypeOrmModule.forFeature([
          User,
          UserProfile,
          Course,
          CourseLesson,
          UserAvailability,
          UserSchedule,
        ]),
      ],
      providers: [UserScheduleRepo],
    }).compile();

    repo = module.get(UserScheduleRepo);
    dataSource = module.get<DataSource>(DataSource);
    userRepo = module.get(getRepositoryToken(User));
    courseRepo = module.get(getRepositoryToken(Course));
    lessonRepo = module.get(getRepositoryToken(CourseLesson));
    availabilityRepo = module.get(getRepositoryToken(UserAvailability));
    scheduleRepo = module.get(getRepositoryToken(UserSchedule));

    // Создаем пользователя с помощью Builder
    const userData = new UserBuilder()
      .withEmail('test@example.com')
      .withPassword('1234')
      .build();
    user = await userRepo.save(userRepo.create(userData as User));

    // Создаем курс с помощью Builder
    const courseData = new CourseBuilder()
      .withName('Test Course')
      .withDateStart('2025-06-20T00:00:00Z')
      .withDateFinish('2025-07-04T00:00:00Z')
      .withPrice(100)
      .build();
    course = await courseRepo.save(courseRepo.create(courseData as Course));
  });

  afterAll(async () => {
    await dataSource.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE;`);
    await dataSource.destroy();
  });

  beforeEach(async () => {
    // Удаляем связанные записи
    await scheduleRepo.delete({ user_id: user.id });
    await availabilityRepo.delete({ user_id: user.id });
    await lessonRepo.delete({ course_id: course.id });
  });

  // ---------- GENERATE ----------
  describe('generate()', () => {
    // SKIP: Функция pick_student_schedule() работает только с public схемой
    // Для полноценного тестирования нужно либо создавать функцию в каждой схеме,
    // либо модифицировать функцию для поддержки схем
    // it.skip('должен сгенерировать расписание для курса с доступностью', async () => {
    //   // Создаем урок с помощью Builder
    //   const lessonData = new CourseLessonBuilder()
    //     .withCourseId(course.id)
    //     .withTitle('Math Lesson')
    //     .withDate('2025-06-26T00:00:00Z') // Четверг
    //     .withDuration(60)
    //     .withContent('')
    //     .build();
    //   await lessonRepo.save(lessonRepo.create(lessonData as CourseLesson));

    //   // Создаем доступность с помощью Builder
    //   const availabilityData = new UserAvailabilityBuilder()
    //     .withUserId(user.id)
    //     .withCourseId(course.id)
    //     .withWeekDay(3) // Четверг (0 = понедельник)
    //     .withStartTime('10:00:00')
    //     .withEndTime('12:00:00')
    //     .build();
    //   await availabilityRepo.save(
    //     availabilityRepo.create(availabilityData as UserAvailability),
    //   );

    //   const result = await repo.generate(user.id, course.id);

    //   const localDate = new Date(result[0].scheduled_date);
    //   const dateString = localDate.toLocaleDateString('ru-RU', {
    //     timeZone: 'Europe/Moscow',
    //   });

    //   expect(result).toHaveLength(1);
    //   expect(dateString).toBe('26.06.2025');
    //   expect(result[0].start_time).toBe('10:00:00');
    //   expect(result[0].end_time).toBe('11:00:00');
    // });

    it('должен выбросить ошибку при генерации для несуществующего курса', async () => {
      const nonExistentCourseId = uuidv4();

      await expect(repo.generate(user.id, nonExistentCourseId)).rejects.toThrow(
        /Такого курса нет/i,
      );
    });
  });

  // ---------- CREATE ----------
  describe('create()', () => {
    it('должен создать расписание для пользователя', async () => {
      // Создаем урок
      const lessonData = new CourseLessonBuilder()
        .withCourseId(course.id)
        .withTitle('Test Lesson')
        .withDuration(60)
        .build();
      const lesson = await lessonRepo.save(
        lessonRepo.create(lessonData as CourseLesson),
      );

      // Используем ObjectMother для создания DTO
      const scheduleDto = UserScheduleObjectMother.buildCreateDto({
        course_id: course.id,
        lesson_id: lesson.id,
        duration: 60,
        start_time: '09:00:00',
        end_time: '10:00:00',
        scheduled_date: '2025-06-26',
      });

      const result = await repo.create(user.id, [scheduleDto]);

      expect(result).toHaveLength(1);
      expect(result[0].course_id).toBe(course.id);
      expect(result[0].lesson_id).toBe(lesson.id);
      expect(result[0].duration).toBe(60);
    });

    it('должен выбросить ошибку при создании с несуществующим уроком', async () => {
      const nonExistentLessonId = uuidv4();

      const scheduleDto = UserScheduleObjectMother.buildCreateDto({
        course_id: course.id,
        lesson_id: nonExistentLessonId,
        duration: 60,
      });

      await expect(repo.create(user.id, [scheduleDto])).rejects.toThrow();
    });
  });

  // ---------- GET BY USER AND COURSE ----------
  describe('getByUserAndCourse()', () => {
    it('должен вернуть расписание пользователя для курса', async () => {
      // Создаем урок
      const lessonData = new CourseLessonBuilder()
        .withCourseId(course.id)
        .withTitle('Test Lesson')
        .withDuration(60)
        .build();
      const lesson = await lessonRepo.save(
        lessonRepo.create(lessonData as CourseLesson),
      );

      // Создаем расписание
      const scheduleDto = UserScheduleObjectMother.buildCreateDto({
        course_id: course.id,
        lesson_id: lesson.id,
      });
      await repo.create(user.id, [scheduleDto]);

      const result = await repo.getByUserAndCourse(user.id, course.id);

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].course_id).toBe(course.id);
      expect(result[0].user_id).toBe(user.id);
    });

    it('должен выбросить ошибку для несуществующего курса', async () => {
      const nonExistentCourseId = uuidv4();

      await expect(
        repo.getByUserAndCourse(user.id, nonExistentCourseId),
      ).rejects.toThrow(/Такого курса нет/i);
    });
  });

  // ---------- DELETE BY USER AND COURSE ----------
  describe('deleteByUserAndCourse()', () => {
    it('должен удалить расписание пользователя для курса', async () => {
      // Создаем урок
      const lessonData = new CourseLessonBuilder()
        .withCourseId(course.id)
        .withTitle('Test Lesson')
        .withDuration(60)
        .build();
      const lesson = await lessonRepo.save(
        lessonRepo.create(lessonData as CourseLesson),
      );

      // Создаем расписание
      const scheduleDto = UserScheduleObjectMother.buildCreateDto({
        course_id: course.id,
        lesson_id: lesson.id,
      });
      await repo.create(user.id, [scheduleDto]);

      const result = await repo.deleteByUserAndCourse(user.id, course.id);

      expect(result).toBe(true);

      // Проверяем что расписание удалено
      await expect(repo.getByUserAndCourse(user.id, course.id)).rejects.toThrow(
        /Расписание на курсе не найдено/i,
      );
    });

    it('должен выбросить ошибку при удалении для несуществующего курса', async () => {
      const nonExistentCourseId = uuidv4();

      await expect(
        repo.deleteByUserAndCourse(user.id, nonExistentCourseId),
      ).rejects.toThrow(/Такого курса нет/i);
    });
  });
});
