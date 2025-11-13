import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { UserScheduleRepo } from '../user-schedule.repository';
import { User } from 'src/modules/users/entities/user.entity';
import { Course } from 'src/modules/courses/entities/course.entity';
import { CourseLesson } from 'src/modules/lessons/entities/course-lesson.entity';
import { UserAvailability } from 'src/modules/user-availability/entities/user-availability.entity';
import { UserSchedule } from '../entities/user-schedule.entity';
import { getTestingDatabaseConfig } from 'src/common/utils/utils';
import { UserProfile } from 'src/modules/users/entities/user-profile.entity';

describe('UserScheduleRepo', () => {
  let repo: UserScheduleRepo;
  let userRepo: Repository<User>;
  let courseRepo: Repository<Course>;
  let lessonRepo: Repository<CourseLesson>;
  let availabilityRepo: Repository<UserAvailability>;
  let scheduleRepo: Repository<UserSchedule>;

  let user: User;
  let course: Course;
  const NTESTS = 10;

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
    userRepo = module.get(getRepositoryToken(User));
    courseRepo = module.get(getRepositoryToken(Course));
    lessonRepo = module.get(getRepositoryToken(CourseLesson));
    availabilityRepo = module.get(getRepositoryToken(UserAvailability));
    scheduleRepo = module.get(getRepositoryToken(UserSchedule));

    // Create required data
    user = userRepo.create({ email: 'test@example.com', password: '1234' });
    user = await userRepo.save(user);

    course = courseRepo.create({
      name: 'Test Course',
      date_start: '2025-06-20T00:00:00Z',
      date_finish: '2026-06-20T00:00:00Z',
      price: 100,
    });
    course = await courseRepo.save(course);
  });

  beforeEach(async () => {
    // Удаляем связанные записи
    await scheduleRepo.delete({ user_id: user.id });
    await availabilityRepo.delete({ user_id: user.id });
    await lessonRepo.delete({ course_id: course.id });
  });

  const createAvailabilitySlots = async (count: number) => {
    const slots: UserAvailability[] = [];

    for (let i = 0; i < count; i++) {
      // Расчёт дня недели (0 = понедельник, 6 = воскресенье)
      const week_day = i % 7;

      // Сколько раз уже был этот день
      const repeat = Math.floor(i / 7);

      // Время увеличивается в зависимости от количества повторений
      const startHour = 10 + repeat;
      const endHour = startHour + 1;

      const availability = availabilityRepo.create({
        user,
        course,
        week_day,
        start_time: `${startHour.toString().padStart(2, '0')}:00:00`,
        end_time: `${endHour.toString().padStart(2, '0')}:00:00`,
      });

      slots.push(availability);
    }

    await availabilityRepo.save(slots);
  };

  // it('Benchmark: зависимость времени от количества уроков', async () => {
  //   const results: { lessons: number; timeMs: number }[] = [];

  //   let availabilities: UserAvailability[] = [];
  //   for (let i = 0; i < 7; i++) {
  //     availabilities.push(
  //       availabilityRepo.create({
  //         user,
  //         course,
  //         week_day: i,
  //         start_time: '10:00:00',
  //         end_time: i % 2 ? '11:00:00' : '12:00:00',
  //       }),
  //     );
  //   }
  //   // Фиксированная доступность
  //   await availabilityRepo.save(availabilities);

  //   const baseDate = new Date(course.date_start);

  //   for (let count = 1; count <= 100; count += 1) {
  //     let time = 0n;
  //     for (let j = 0; j < NTESTS; j++) {
  //       // Очищаем уроки и расписание
  //       await lessonRepo.delete({ course_id: course.id });
  //       await scheduleRepo.delete({ user_id: user.id, course_id: course.id });

  //       // Создаем `count` уроков
  //       const lessons = Array.from({ length: count }).map((_, i) =>
  //         lessonRepo.create({
  //           title: `Урок ${i + 1}`,
  //           course,
  //           date: new Date(
  //             baseDate.getTime() + i * (i % 4 === 0 ? 48 : 24) * 60 * 60 * 1000,
  //           ).toISOString(),
  //           duration: i % 2 ? 60 : 90,
  //           content: '',
  //         }),
  //       );
  //       await lessonRepo.save(lessons);

  //       const start = process.hrtime.bigint();
  //       await repo.generate(user.id, course.id);
  //       const end = process.hrtime.bigint();
  //       time += end - start;
  //     }
  //     const avgTime = Number(time / BigInt(NTESTS)) / 1_000_000;
  //     console.log(
  //       `Test ${count} of 100 completes with average time of ${avgTime} ms`,
  //     );

  //     results.push({
  //       lessons: count,
  //       timeMs: avgTime,
  //     });
  //   }

  //   console.log('Benchmark results:', results);
  // }, 3000000);

  it('Benchmark: зависимость времени от количества слотов', async () => {
    const results: { lessons: number; timeMs: number }[] = [];

    // Очищаем уроки и расписание
    await lessonRepo.delete({ course_id: course.id });
    await scheduleRepo.delete({ user_id: user.id, course_id: course.id });

    const baseDate = new Date(course.date_start);

    // Создаем `count` уроков
    const lessons = Array.from({ length: 50 }).map((_, i) =>
      lessonRepo.create({
        title: `Урок ${i + 1}`,
        course,
        date: new Date(
          baseDate.getTime() + i * 24 * 60 * 60 * 1000,
        ).toISOString(),
        duration: 60,
        content: '',
      }),
    );
    await lessonRepo.save(lessons);

    for (let count = 1; count <= 60; count += 1) {
      let time = 0n;
      await availabilityRepo.delete({ user_id: user.id, course_id: course.id });
      await createAvailabilitySlots(count);

      for (let j = 0; j < NTESTS; j++) {
        const start = process.hrtime.bigint();
        await repo.generate(user.id, course.id);
        const end = process.hrtime.bigint();
        time += end - start;
      }
      const avgTime = Number(time / BigInt(NTESTS)) / 1_000_000;
      console.log(
        `Test ${count} of 100 completes with average time of ${avgTime} ms`,
      );

      results.push({
        lessons: count,
        timeMs: avgTime,
      });
    }

    console.log('Benchmark results:', results);
  }, 3000000);

  // it('Benchmark: зависимость времени от количества уроков (количество уроков, даты уроков, продолжительность уроков)', async () => {
  //   const results1: { lessons: number; timeMs: number }[] = [];
  //   const results2: { lessons: number; timeMs: number }[] = [];
  //   const results3: { lessons: number; timeMs: number }[] = [];

  //   let availabilities: UserAvailability[] = [];
  //   for (let i = 0; i < 7; i++) {
  //     availabilities.push(
  //       availabilityRepo.create({
  //         user,
  //         course,
  //         week_day: i,
  //         start_time: '10:00:00',
  //         end_time: i % 2 ? '11:00:00' : '12:00:00',
  //       }),
  //     );
  //   }
  //   // Фиксированная доступность
  //   await availabilityRepo.save(availabilities);

  //   const baseDate = new Date(course.date_start);

  //   // 1 критерий
  //   for (let count = 1; count <= 100; count += 1) {
  //     let time = 0n;
  //     for (let j = 0; j < NTESTS; j++) {
  //       // Очищаем уроки и расписание
  //       await lessonRepo.delete({ course_id: course.id });
  //       await scheduleRepo.delete({ user_id: user.id, course_id: course.id });

  //       // Создаем `count` уроков
  //       const lessons = Array.from({ length: count }).map((_, i) =>
  //         lessonRepo.create({
  //           title: `Урок ${i + 1}`,
  //           course,
  //           date: new Date(baseDate.getTime()).toISOString(),
  //           duration: 60,
  //           content: '',
  //         }),
  //       );
  //       await lessonRepo.save(lessons);

  //       const start = process.hrtime.bigint();
  //       await repo.generate(user.id, course.id);
  //       const end = process.hrtime.bigint();
  //       time += end - start;
  //     }
  //     const avgTime = Number(time / BigInt(NTESTS)) / 1_000_000;
  //     console.log(
  //       `Test ${count} of 100 completes with average time of ${avgTime} ms`,
  //     );

  //     results1.push({
  //       lessons: count,
  //       timeMs: avgTime,
  //     });
  //   }

  //   // 2 критерия
  //   for (let count = 1; count <= 100; count += 1) {
  //     let time = 0n;
  //     for (let j = 0; j < NTESTS; j++) {
  //       // Очищаем уроки и расписание
  //       await lessonRepo.delete({ course_id: course.id });
  //       await scheduleRepo.delete({ user_id: user.id, course_id: course.id });

  //       // Создаем `count` уроков
  //       const lessons = Array.from({ length: count }).map((_, i) =>
  //         lessonRepo.create({
  //           title: `Урок ${i + 1}`,
  //           course,
  //           date: new Date(
  //             baseDate.getTime() + i * (i % 4 === 0 ? 48 : 24) * 60 * 60 * 1000,
  //           ).toISOString(),
  //           duration: 60,
  //           content: '',
  //         }),
  //       );
  //       await lessonRepo.save(lessons);

  //       const start = process.hrtime.bigint();
  //       await repo.generate(user.id, course.id);
  //       const end = process.hrtime.bigint();
  //       time += end - start;
  //     }
  //     const avgTime = Number(time / BigInt(NTESTS)) / 1_000_000;
  //     console.log(
  //       `Test ${count} of 100 completes with average time of ${avgTime} ms`,
  //     );

  //     results2.push({
  //       lessons: count,
  //       timeMs: avgTime,
  //     });
  //   }

  //   // 3 критерия
  //   for (let count = 1; count <= 100; count += 1) {
  //     let time = 0n;
  //     for (let j = 0; j < NTESTS; j++) {
  //       // Очищаем уроки и расписание
  //       await lessonRepo.delete({ course_id: course.id });
  //       await scheduleRepo.delete({ user_id: user.id, course_id: course.id });

  //       // Создаем `count` уроков
  //       const lessons = Array.from({ length: count }).map((_, i) =>
  //         lessonRepo.create({
  //           title: `Урок ${i + 1}`,
  //           course,
  //           date: new Date(
  //             baseDate.getTime() + i * (i % 4 === 0 ? 48 : 24) * 60 * 60 * 1000,
  //           ).toISOString(),
  //           duration: i % 2 ? 60 : 90,
  //           content: '',
  //         }),
  //       );
  //       await lessonRepo.save(lessons);

  //       const start = process.hrtime.bigint();
  //       await repo.generate(user.id, course.id);
  //       const end = process.hrtime.bigint();
  //       time += end - start;
  //     }
  //     const avgTime = Number(time / BigInt(NTESTS)) / 1_000_000;
  //     console.log(
  //       `Test ${count} of 100 completes with average time of ${avgTime} ms`,
  //     );

  //     results3.push({
  //       lessons: count,
  //       timeMs: avgTime,
  //     });
  //   }

  //   console.log('Benchmark results:', results1);
  //   console.log('Benchmark results:', results2);
  //   console.log('Benchmark results:', results3);
  // }, 6000000);
});
