import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
    RepositoryDuplicateError,
    RepositoryForbiddenError,
    RepositoryNotFoundError,
    RepositoryUnknownError,
} from 'src/common/errors/db-errors';
import { AppLoggerModule } from 'src/common/logging/log.module';
import { CourseBuilder } from 'src/common/tests/builders/course.builder';
import { UserBuilder } from 'src/common/tests/builders/user.builder';
import { CourseObjectMother } from 'src/common/tests/object-mothers/course-object-mother';
import { getTestingDatabaseConfig } from 'src/common/utils/utils';
import { CourseEnrollmentsModule } from 'src/modules/course-enrollments/course-enrollments.module';
import { LessonsModule } from 'src/modules/lessons/lessons.module';
import { PaymentsModule } from 'src/modules/payments/payments.module';
import { User, UserRole } from 'src/modules/users/entities/user.entity';
import { UsersModule } from 'src/modules/users/users.module';
import { DataSource, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { CoursesModule } from '../../courses.module';
import { ICoursesService } from '../../courses.service';
import { CreateCourseDto } from '../../dto/create-course.dto';
import { UpdateCourseDto } from '../../dto/update-course.dto';
import { Course } from '../../entities/course.entity';

describe('CoursesService (Integration)', () => {
  let service: ICoursesService;
  let dataSource: DataSource;
  let user: User;
  let course: Course;
  let userRepo: Repository<User>;
  let courseRepo: Repository<Course>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService) =>
            getTestingDatabaseConfig(configService) as any,
        }),
        CoursesModule,
        UsersModule,
        PaymentsModule,
        LessonsModule,
        CourseEnrollmentsModule,
        AppLoggerModule,
      ],
    }).compile();

    dataSource = module.get(DataSource);
    service = module.get<ICoursesService>('ICoursesService');

    // Репозитории
    userRepo = dataSource.getRepository(User);
    courseRepo = dataSource.getRepository(Course);
  });

  beforeEach(async () => {
    // Создаём объекты через билдер
    const userData = new UserBuilder().withEmail('test@user.com').build();
    user = await userRepo.save(userData);

    const courseData = new CourseBuilder().withName('Test Course').build();
    course = await courseRepo.save(courseRepo.create(courseData as Course));
  });

  afterEach(async () => {
    await dataSource.query(
      `TRUNCATE TABLE "payment", "course_enrollment", "course_lesson", "course", "user_profile", "user" RESTART IDENTITY CASCADE`,
    );
  });

  // ---------- CREATE ----------
it('✅ должен создать курс', async () => {
  const dto: CreateCourseDto = CourseObjectMother.buildCreateDto();
  const course = await service.create(dto);
  expect(course.name).toBe(dto.name);
  expect(course.id).toBeDefined();
  expect(course.date_start).toBe(dto.date_start);
  expect(course.date_finish).toBe(dto.date_finish);
  expect(course.price).toBe(dto.price);
});

it('❌ ошибка при создании курса с пустым названием', async () => {
  const dto: CreateCourseDto = CourseObjectMother.buildCreateDto({
    name: null,
  } as any);
  await expect(service.create(dto)).rejects.toThrow(RepositoryUnknownError);
});

// ---------- FIND ALL ----------
it('✅ возвращает один курс изначально', async () => {
  const courses = await service.findAll();
  expect(courses).toHaveLength(1);
});

it('❌ возвращает пустой список после удаления курса', async () => {
  const jwtPayload = { id: user.id, role: user.role, email: user.email };
  await service.remove(course.id);
  const courses = await service.findAll(jwtPayload);
  expect(courses).toEqual([]);
});

// ---------- FIND ONE ----------
it('✅ возвращает курс по id', async () => {
  const found = await service.findOne(course.id);
  expect(found.id).toBe(course.id);
});

it('❌ выбрасывает ошибку, если курс не существует', async () => {
  await expect(service.findOne(uuidv4())).rejects.toThrow(
    RepositoryNotFoundError,
  );
});

// ---------- UPDATE ----------
it('✅ обновляет курс', async () => {
  const dto: UpdateCourseDto = CourseObjectMother.buildUpdateDto();
  const updated = await service.update(course.id, dto);
  expect(updated.name).toBe(dto.name);
});

it('❌ выбрасывает ошибку при обновлении несуществующего курса', async () => {
  const dto: UpdateCourseDto = CourseObjectMother.buildUpdateDto();

  await expect(service.update(uuidv4(), dto)).rejects.toThrow(
    RepositoryNotFoundError,
  );
});

// ---------- REMOVE ----------
it('✅ удаляет курс', async () => {
  const removed = await service.remove(course.id);
  expect(removed.id).toBe(course.id);
});

it('❌ выбрасывает ошибку при удалении несуществующего курса', async () => {
  await expect(service.remove(uuidv4())).rejects.toThrow(
    RepositoryNotFoundError,
  );
});

// ---------- REGISTER USER ----------
it('✅ регистрирует пользователя на курс', async () => {
  const enrollment = await service.registerUser(user.id, course.id);
  expect(enrollment.user_id).toBe(user.id);
});

it('❌ выбрасывает ошибку при регистрации на несуществующий курс', async () => {
  await expect(service.registerUser(user.id, uuidv4())).rejects.toThrow(
    RepositoryNotFoundError,
  );
});

// ---------- FIND ALL ENROLLMENTS ----------
it('✅ возвращает все регистрации на курс', async () => {
  await service.registerUser(user.id, course.id);

  const enrollments = await service.findAllEnrollments(course.id);
  expect(enrollments).toHaveLength(1);
  expect(enrollments[0].user_id).toBe(user.id);
});

it('❌ выбрасывает ошибку, если на курс нет регистраций', async () => {
  await expect(service.findAllEnrollments(uuidv4())).rejects.toThrow(RepositoryNotFoundError);
});

// ---------- FIND ALL PAYMENTS ----------
it('✅ возвращает все платежи за курс', async () => {
  await service.registerUser(user.id, course.id);
  await service.purchaseCourse(user.id, course.id);

  const payments = await service.findAllPayments(course.id);
  expect(payments).toHaveLength(1);
  expect(payments[0].user_id).toBe(user.id);
});

it('❌ возвращает пустой массив, если платежей нет', async () => {
  const res = await service.findAllPayments(uuidv4());
  expect(Array.isArray(res)).toBe(true)
  expect(res.length).toBe(0)
});

// ---------- PURCHASE COURSE ----------
it('✅ покупка курса', async () => {
  await service.registerUser(user.id, course.id);

  const payment = await service.purchaseCourse(user.id, course.id);
  expect(payment.user_id).toBe(user.id);
});

it('❌ выбрасывает ошибку при повторной оплате курса', async () => {
  await service.registerUser(user.id, course.id);
  await service.purchaseCourse(user.id, course.id);

  await expect(service.purchaseCourse(user.id, course.id)).rejects.toThrow(
    RepositoryDuplicateError,
  );
});

// ---------- DOES USER HAVE ACCESS ----------
it('✅ админ имеет доступ к курсу', async () => {
  user.role = UserRole.ADMIN;
  const hasAccess = await service.doesUserHaveAccess(user, course.id);
  expect(hasAccess).toBe(true);
});

it('✅ обычный пользователь без оплаты не имеет доступа', async () => {
  await service.registerUser(user.id, course.id);

  const hasAccess = await service.doesUserHaveAccess(
    { id: user.id, role: UserRole.USER, email: user.email },
    course.id,
  );
  expect(hasAccess).toBe(false);
});

// ---------- FIND ALL LESSONS ----------
it('✅ возвращает уроки для пользователя с доступом', async () => {
  await service.registerUser(user.id, course.id);
  await service.purchaseCourse(user.id, course.id);

  const lessons = await service.findAllLessons(
    { id: user.id, role: UserRole.USER, email: user.email },
    course.id,
  );
  expect(Array.isArray(lessons)).toBe(true);
});

it('❌ выбрасывает ошибку для пользователя без доступа к урокам', async () => {
  await service.registerUser(user.id, course.id);

  await expect(
    service.findAllLessons(
      { id: user.id, role: UserRole.USER, email: user.email },
      course.id,
    ),
  ).rejects.toThrow(RepositoryForbiddenError);
});

});
