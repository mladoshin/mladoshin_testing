import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import {
  RepositoryNotFoundError,
  RepositoryUnknownError,
} from 'src/common/errors/db-errors';
import { AppLoggerModule } from 'src/common/logging/log.module';
import { UserAvailabilityBuilder } from 'src/common/tests/builders/user-availability.builder';
import { CourseBuilder } from 'src/common/tests/builders/course.builder';
import { UserBuilder } from 'src/common/tests/builders/user.builder';
import { UserAvailabilityObjectMother } from 'src/common/tests/object-mothers/user-availability-object-mother';
import {
  createTestingSchema,
  getTestingDatabaseConfig,
} from 'src/common/utils/utils';
import { CoursesModule } from 'src/modules/courses/courses.module';
import { Course } from 'src/modules/courses/entities/course.entity';
import { User, UserRole } from 'src/modules/users/entities/user.entity';
import { DataSource, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { UserAvailabilityModule } from '../../user-availability.module';
import { IUserAvailabilityService } from '../../user-availability.service';
import { CreateUserAvailabilityDto } from '../../dto/create-user-availability.dto';
import { UpdateUserAvailabilityDto } from '../../dto/update-user-availability.dto';
import { UserAvailability } from '../../entities/user-availability.entity';
import { JWTPayload } from 'src/modules/auth/guards/AuthGuard';

describe('UserAvailabilityService (Integration)', () => {
  let service: IUserAvailabilityService;
  let dataSource: DataSource;
  let user: User;
  let course: Course;
  let availability: UserAvailability;
  let userRepo: Repository<User>;
  let courseRepo: Repository<Course>;
  let availabilityRepo: Repository<UserAvailability>;
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
        UserAvailabilityModule,
        CoursesModule,
        AppLoggerModule,
      ],
    }).compile();

    dataSource = module.get(DataSource);
    service = module.get<IUserAvailabilityService>('IUserAvailabilityService');

    // Репозитории
    userRepo = dataSource.getRepository(User);
    courseRepo = dataSource.getRepository(Course);
    availabilityRepo = dataSource.getRepository(UserAvailability);
  });

  afterAll(async () => {
    // Удаляем схему после тестов
    await dataSource.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE;`);
    await dataSource.destroy();
  });

  beforeEach(async () => {
    // Создаём пользователя через билдер
    const userData = new UserBuilder().withEmail('test@user.com').build();
    user = await userRepo.save(userData);

    // JWT payload для тестов
    jwtPayload = { id: user.id, email: user.email, role: UserRole.USER };

    // Создаём курс через билдер
    const courseData = new CourseBuilder().withName('Test Course').build();
    course = await courseRepo.save(courseRepo.create(courseData as Course));

    // Создаём доступность через билдер
    const availabilityData = new UserAvailabilityBuilder()
      .withUserId(user.id)
      .withCourseId(course.id)
      .withWeekDay(1)
      .withStartTime('09:00')
      .withEndTime('17:00')
      .build();
    availability = await availabilityRepo.save(
      availabilityRepo.create(availabilityData as UserAvailability),
    );
  });

  afterEach(async () => {
    await dataSource.query(
      `TRUNCATE TABLE "${schemaName}"."user_availability", "${schemaName}"."course_enrollment", "${schemaName}"."course_lesson", "${schemaName}"."course", "${schemaName}"."user_profile", "${schemaName}"."user" RESTART IDENTITY CASCADE`,
    );
  });

  // ---------- CREATE ----------
  describe('create', () => {
    it('✅ должен создать доступность', async () => {
      const dto: CreateUserAvailabilityDto =
        UserAvailabilityObjectMother.buildCreateDto({
          course_id: course.id,
          week_day: 2,
          start_time: '10:00',
          end_time: '18:00',
        });

      const created = await service.create(jwtPayload, dto);

      expect(created.course_id).toBe(dto.course_id);
      expect(created.week_day).toBe(dto.week_day);
      expect(created.start_time).toBe(dto.start_time);
      expect(created.end_time).toBe(dto.end_time);
      expect(created.id).toBeDefined();
    });

    it('❌ ошибка при создании доступности с несуществующим курсом', async () => {
      const dto: CreateUserAvailabilityDto =
        UserAvailabilityObjectMother.buildCreateDto({
          course_id: uuidv4(), // Несуществующий курс
        });

      await expect(service.create(jwtPayload, dto)).rejects.toThrow(
        RepositoryUnknownError,
      );
    });
  });

  // ---------- FIND BY USER AND COURSE ----------
  describe('findByUserAndCourse', () => {
    it('✅ возвращает доступности для пользователя и курса', async () => {
      const availabilities = await service.findByUserAndCourse(jwtPayload, {
        course_id: course.id,
      });

      expect(availabilities).toHaveLength(1);
      expect(availabilities[0].course_id).toBe(course.id);
      expect(availabilities[0].user_id).toBe(user.id);
    });

    it('❌ возвращает пустой список для несуществующего курса', async () => {
      const availabilities = await service.findByUserAndCourse(jwtPayload, {
        course_id: uuidv4(),
      });

      expect(availabilities).toEqual([]);
    });
  });

  // ---------- FIND BY ID ----------
  describe('findById', () => {
    it('✅ возвращает доступность по id', async () => {
      const found = await service.findById(availability.id);

      expect(found).toBeDefined();
      expect(found).not.toBeNull();
      expect(found!.id).toBe(availability.id);
      expect(found!.user_id).toBe(user.id);
    });

    it('❌ возвращает null если доступность не существует', async () => {
      const found = await service.findById(uuidv4());

      expect(found).toBeNull();
    });
  });

  // ---------- UPDATE ----------
  describe('update', () => {
    it('✅ обновляет доступность', async () => {
      const dto: UpdateUserAvailabilityDto =
        UserAvailabilityObjectMother.buildUpdateDto({
          start_time: '11:00',
          end_time: '19:00',
        });

      const updated = await service.update(availability.id, dto);

      expect(updated.id).toBe(availability.id);
      expect(updated.start_time).toBe(dto.start_time);
      expect(updated.end_time).toBe(dto.end_time);
    });

    it('❌ выбрасывает ошибку, если доступность не существует', async () => {
      const dto: UpdateUserAvailabilityDto =
        UserAvailabilityObjectMother.buildUpdateDto();

      await expect(service.update(uuidv4(), dto)).rejects.toThrow(
        RepositoryNotFoundError,
      );
    });
  });

  // ---------- DELETE ----------
  describe('delete', () => {
    it('✅ удаляет доступность', async () => {
      const deleted = await service.delete(availability.id);

      expect(deleted.id).toBe(availability.id);

      // Проверяем что доступность удалена
      const found = await service.findById(availability.id);
      expect(found).toBeNull();
    });

    it('❌ выбрасывает ошибку, если доступность не существует', async () => {
      await expect(service.delete(uuidv4())).rejects.toThrow(
        RepositoryNotFoundError,
      );
    });
  });
});
