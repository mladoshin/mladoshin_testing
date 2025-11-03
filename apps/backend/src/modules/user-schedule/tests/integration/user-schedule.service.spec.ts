import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import {
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { AppLoggerModule } from 'src/common/logging/log.module';
import { UserBuilder } from 'src/common/tests/builders/user.builder';
import { CourseBuilder } from 'src/common/tests/builders/course.builder';
import { CourseLessonBuilder } from 'src/common/tests/builders/lesson.builder';
import { UserScheduleObjectMother } from 'src/common/tests/object-mothers/user-schedule-object-mother';
import {
  createTestingSchema,
  getTestingDatabaseConfig,
} from 'src/common/utils/utils';
import { User } from 'src/modules/users/entities/user.entity';
import { Course } from 'src/modules/courses/entities/course.entity';
import { CourseLesson } from 'src/modules/lessons/entities/course-lesson.entity';
import { DataSource, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { UserScheduleModule } from '../../user-schedule.module';
import { IUserScheduleService } from '../../user-schedule.service';
import { CreateUserScheduleArrayDto } from '../../dto/create-user-schedule.dto';
import { GenerateUserScheduleDto } from '../../dto/generate-user-schedule.dto';
import { GetUserScheduleQueryDto } from '../../dto/get-user-schedule-query.dto';
import { DeleteUserScheduleQueryDto } from '../../dto/delete-user-schedule-query.dto';
import { JWTPayload } from 'src/modules/auth/guards/AuthGuard';
import { CoursesModule } from 'src/modules/courses/courses.module';
import { LessonsModule } from 'src/modules/lessons/lessons.module';

describe('UserScheduleService (Integration)', () => {
  let service: IUserScheduleService;
  let dataSource: DataSource;
  let user: User;
  let course: Course;
  let lesson: CourseLesson;
  let userRepo: Repository<User>;
  let courseRepo: Repository<Course>;
  let lessonRepo: Repository<CourseLesson>;
  let schemaName: string;
  let jwtPayload: JWTPayload;

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
        UserScheduleModule,
        CoursesModule,
        LessonsModule,
        AppLoggerModule,
      ],
    }).compile();

    dataSource = module.get(DataSource);
    service = module.get<IUserScheduleService>('IUserScheduleService');

    // Репозитории
    userRepo = dataSource.getRepository(User);
    courseRepo = dataSource.getRepository(Course);
    lessonRepo = dataSource.getRepository(CourseLesson);
  });

  afterAll(async () => {
    await dataSource.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE;`);
    await dataSource.destroy();
  });

  beforeEach(async () => {
    // Создаём объекты через билдер
    const userData = new UserBuilder().withEmail('test@user.com').build();
    user = await userRepo.save(userData);

    jwtPayload = { id: user.id, role: user.role, email: user.email };

    const courseData = new CourseBuilder().withName('Test Course').build();
    course = await courseRepo.save(courseRepo.create(courseData as Course));

    const lessonData = new CourseLessonBuilder()
      .withCourseId(course.id)
      .withTitle('Test Lesson')
      .withDuration(60)
      .build();
    lesson = await lessonRepo.save(
      lessonRepo.create(lessonData as CourseLesson),
    );
  });

  afterEach(async () => {
    await dataSource.query(
      `TRUNCATE TABLE "${schemaName}"."user_schedule", "${schemaName}"."user_availability", "${schemaName}"."course_lesson", "${schemaName}"."course", "${schemaName}"."user_profile", "${schemaName}"."user" RESTART IDENTITY CASCADE`,
    );
  });

  // ---------- GENERATE ----------
  describe('generate()', () => {
    // SKIP: Функция pick_student_schedule() работает только с public схемой
    // it.skip('должен сгенерировать расписание', async () => {
    //   const dto: GenerateUserScheduleDto = {
    //     course_id: course.id,
    //   };

    //   const result = await service.generate(jwtPayload, dto);

    //   expect(Array.isArray(result)).toBe(true);
    // });

    it('должен выбросить ошибку для несуществующего курса', async () => {
      const dto: GenerateUserScheduleDto = {
        course_id: uuidv4(),
      };

      await expect(service.generate(jwtPayload, dto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ---------- CREATE ----------
  describe('create()', () => {
    it('должен создать расписание', async () => {
      const scheduleDto = UserScheduleObjectMother.buildCreateDto({
        course_id: course.id,
        lesson_id: lesson.id,
        duration: 60,
        start_time: '09:00:00',
        end_time: '10:00:00',
        scheduled_date: '2025-06-26',
      });

      const dto: CreateUserScheduleArrayDto = {
        data: [scheduleDto],
      };

      const result = await service.create(jwtPayload, dto);

      expect(result).toHaveLength(1);
      expect(result[0].course_id).toBe(course.id);
      expect(result[0].lesson_id).toBe(lesson.id);
      expect(result[0].duration).toBe(60);
    });

    it('должен выбросить ошибку при создании с несуществующим уроком', async () => {
      const scheduleDto = UserScheduleObjectMother.buildCreateDto({
        course_id: course.id,
        lesson_id: uuidv4(),
        duration: 60,
      });

      const dto: CreateUserScheduleArrayDto = {
        data: [scheduleDto],
      };

      await expect(service.create(jwtPayload, dto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  // ---------- GET BY USER AND COURSE ----------
  describe('getByUserAndCourse()', () => {
    it('должен вернуть расписание пользователя для курса', async () => {
      // Создаём расписание
      const scheduleDto = UserScheduleObjectMother.buildCreateDto({
        course_id: course.id,
        lesson_id: lesson.id,
      });

      const createDto: CreateUserScheduleArrayDto = {
        data: [scheduleDto],
      };

      await service.create(jwtPayload, createDto);

      // Получаем расписание
      const query: GetUserScheduleQueryDto = {
        course_id: course.id,
      };

      const result = await service.getByUserAndCourse(jwtPayload, query);

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].course_id).toBe(course.id);
      expect(result[0].user_id).toBe(user.id);
    });

    it('должен выбросить ошибку для несуществующего курса', async () => {
      const query: GetUserScheduleQueryDto = {
        course_id: uuidv4(),
      };

      await expect(
        service.getByUserAndCourse(jwtPayload, query),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ---------- DELETE BY USER AND COURSE ----------
  describe('deleteByUserAndCourse()', () => {
    it('должен удалить расписание пользователя для курса', async () => {
      // Создаём расписание
      const scheduleDto = UserScheduleObjectMother.buildCreateDto({
        course_id: course.id,
        lesson_id: lesson.id,
      });

      const createDto: CreateUserScheduleArrayDto = {
        data: [scheduleDto],
      };

      await service.create(jwtPayload, createDto);

      // Удаляем расписание
      const query: DeleteUserScheduleQueryDto = {
        course_id: course.id,
      };

      const result = await service.deleteByUserAndCourse(jwtPayload, query);

      expect(result).toBe(true);

      // Проверяем что расписание удалено
      const getQuery: GetUserScheduleQueryDto = {
        course_id: course.id,
      };

      await expect(
        service.getByUserAndCourse(jwtPayload, getQuery),
      ).rejects.toThrow(NotFoundException);
    });

    it('должен выбросить ошибку при удалении для несуществующего курса', async () => {
      const query: DeleteUserScheduleQueryDto = {
        course_id: uuidv4(),
      };

      await expect(
        service.deleteByUserAndCourse(jwtPayload, query),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
