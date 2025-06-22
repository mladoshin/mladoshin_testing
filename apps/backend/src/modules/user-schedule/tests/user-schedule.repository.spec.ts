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
      date_finish: '2025-07-04T00:00:00Z',
      price: 100,
    });
    course = await courseRepo.save(course);

    const lesson = lessonRepo.create({
      title: 'Test',
      course,
      date: '2025-06-20T00:00:00Z',
      duration: 60,
      content: '',
    });
    await lessonRepo.save(lesson);

    const availability = availabilityRepo.create({
      user,
      course,
      week_day: 4, // Четверг
      start_time: '10:00:00',
      end_time: '12:00:00',
    });
    await availabilityRepo.save(availability);
  });

  beforeEach(async () => {
    // Удаляем связанные записи
    await scheduleRepo.delete({ user_id: user.id });
    await availabilityRepo.delete({ user_id: user.id });
    await lessonRepo.delete({ course_id: course.id });
  });

  it('Должен создать расписание для одного урока, подходящего под один доступный слот.', async () => {
    // Создаем урок на четверг, 20 июня 2025 года
    const lesson = lessonRepo.create({
      title: 'Math Lesson',
      course,
      date: '2025-06-26T00:00:00Z', // Четверг
      duration: 60,
      content: '',
    });
    await lessonRepo.save(lesson);

    // Слот с 10:00 до 12:00 на четверг
    const availability = availabilityRepo.create({
      user,
      course,
      week_day: 3, // Четверг (0 = понедельник)
      start_time: '10:00:00',
      end_time: '12:00:00',
    });
    await availabilityRepo.save(availability);

    // Вызов функции
    const result = await repo.generate(user.id, course.id);

    const localDate = new Date(result[0].scheduled_date);
    const dateString = localDate.toLocaleDateString('ru-RU', {
      timeZone: 'Europe/Moscow',
    });

    // Проверка
    expect(result).toHaveLength(1);
    expect(result[0].lesson_id).toEqual(lesson.id);
    expect(dateString).toBe('26.06.2025');
    expect(result[0].start_time).toBe('10:00:00');
    expect(result[0].end_time).toBe('11:00:00');
  });

  it('Должен запланировать урок в пятницу, если доступность указана на пятницу.', async () => {
    // Урок на пятницу, 27 июня 2025 года
    const lesson = lessonRepo.create({
      title: 'Science Lesson',
      course,
      date: '2025-06-27T00:00:00Z', // Пятница
      duration: 90,
      content: '',
    });
    await lessonRepo.save(lesson);

    // Слот с 09:00 до 12:00 на пятницу (4 = пятница, 0 = понедельник)
    const availability = availabilityRepo.create({
      user,
      course,
      week_day: 4,
      start_time: '09:00:00',
      end_time: '12:00:00',
    });
    await availabilityRepo.save(availability);

    const result = await repo.generate(user.id, course.id);

    const localDate = new Date(result[0].scheduled_date);
    const dateString = localDate.toLocaleDateString('ru-RU', {
      timeZone: 'Europe/Moscow',
    });

    expect(result).toHaveLength(1);
    expect(result[0].lesson_id).toEqual(lesson.id);
    expect(dateString).toBe('27.06.2025');
    expect(result[0].start_time).toBe('09:00:00');
    expect(result[0].end_time).toBe('10:30:00');
  });

  it('Должен запланировать два урока в один день, если в доступности достаточно времени.', async () => {
    // Два урока по часу на четверг, 26 июня
    const lesson1 = lessonRepo.create({
      title: 'History Lesson',
      course,
      date: '2025-06-26T00:00:00Z',
      duration: 60,
      content: '',
    });

    const lesson2 = lessonRepo.create({
      title: 'Literature Lesson',
      course,
      date: '2025-06-26T00:00:00Z',
      duration: 60,
      content: '',
    });

    await lessonRepo.save([lesson1, lesson2]);

    // Слот с 10:00 до 12:30 на четверг (3 = четверг)
    const availability = availabilityRepo.create({
      user,
      course,
      week_day: 3,
      start_time: '10:00:00',
      end_time: '12:30:00',
    });

    await availabilityRepo.save(availability);

    const result = await repo.generate(user.id, course.id);

    const dates = result.map((r) =>
      new Date(r.scheduled_date).toLocaleDateString('ru-RU', {
        timeZone: 'Europe/Moscow',
      }),
    );

    expect(result).toHaveLength(2);
    expect(new Set(dates)).toEqual(new Set(['26.06.2025']));
    expect(result[0].start_time).toBe('10:00:00');
    expect(result[0].end_time).toBe('11:00:00');
    expect(result[1].start_time).toBe('11:00:00');
    expect(result[1].end_time).toBe('12:00:00');
  });

  it('Должен запланировать урок во второй доступный слот в тот же день, если первый слишком короткий.', async () => {
    const lesson = lessonRepo.create({
      title: 'Chemistry Lesson',
      course,
      date: '2025-06-26T00:00:00Z', // Четверг
      duration: 60,
      content: '',
    });

    await lessonRepo.save(lesson);

    // Первый слот — слишком короткий (30 минут)
    const shortSlot = availabilityRepo.create({
      user,
      course,
      week_day: 3, // Четверг
      start_time: '09:00:00',
      end_time: '09:30:00',
    });

    // Второй слот — подходит
    const validSlot = availabilityRepo.create({
      user,
      course,
      week_day: 3, // Четверг
      start_time: '10:00:00',
      end_time: '11:30:00',
    });

    await availabilityRepo.save([shortSlot, validSlot]);

    const result = await repo.generate(user.id, course.id);

    const localDate = new Date(result[0].scheduled_date);
    const dateString = localDate.toLocaleDateString('ru-RU', {
      timeZone: 'Europe/Moscow',
    });

    expect(result).toHaveLength(1);
    expect(result[0].lesson_id).toBe(lesson.id);
    expect(dateString).toBe('26.06.2025');
    expect(result[0].start_time).toBe('10:00:00');
    expect(result[0].end_time).toBe('11:00:00');
  });

  it('Должен запланировать два урока в разные дни, если в один день помещается только один.', async () => {
    const lesson1 = lessonRepo.create({
      title: 'Lesson One',
      course,
      date: '2025-06-26T00:00:00Z', // Четверг
      duration: 60,
      content: '',
    });

    const lesson2 = lessonRepo.create({
      title: 'Lesson Two',
      course,
      date: '2025-06-26T00:00:00Z', // Тоже четверг
      duration: 60,
      content: '',
    });

    await lessonRepo.save([lesson1, lesson2]);

    // Слот один на неделю — четверг 10:00–11:00
    const slot = availabilityRepo.create({
      user,
      course,
      week_day: 3, // Четверг
      start_time: '10:00:00',
      end_time: '11:00:00',
    });

    await availabilityRepo.save(slot);

    const result = await repo.generate(user.id, course.id);

    expect(result).toHaveLength(2);

    // Первый урок — 26.06.2025 (четверг)
    const date1 = new Date(result[0].scheduled_date).toLocaleDateString(
      'ru-RU',
      {
        timeZone: 'Europe/Moscow',
      },
    );
    expect(date1).toBe('26.06.2025');
    expect(result[0].start_time).toBe('10:00:00');

    // Второй урок — 03.07.2025 (следующий четверг)
    const date2 = new Date(result[1].scheduled_date).toLocaleDateString(
      'ru-RU',
      {
        timeZone: 'Europe/Moscow',
      },
    );
    expect(date2).toBe('03.07.2025');
    expect(result[1].start_time).toBe('10:00:00');
  });

  it('Должен завершиться с ошибкой, если урок не помещается во временной слот доступности.', async () => {
    // Создаем урок на пятницу (2025-06-27), 60 минут
    const lesson = lessonRepo.create({
      title: 'Long Lesson',
      course,
      date: '2025-06-27T00:00:00Z', // Пятница
      duration: 60, // 60 минут
      content: '',
    });
    await lessonRepo.save(lesson);

    // Слот на пятницу — только 30 минут (недостаточно)
    const availability = availabilityRepo.create({
      user,
      course,
      week_day: 4, // Пятница (0 = понедельник)
      start_time: '10:00:00',
      end_time: '10:30:00',
    });
    await availabilityRepo.save(availability);

    // Попытка сгенерировать расписание должна выбросить ошибку
    await expect(repo.generate(user.id, course.id)).rejects.toThrow(
      /Не удалось назначить урок/i,
    );
  });

  it('Должен завершиться с ошибкой, если у пользователя нет слотов доступности для курса.', async () => {
    // Создаем урок на понедельник (2025-06-24)
    const lesson = lessonRepo.create({
      title: 'Orphan Lesson',
      course,
      date: '2025-06-24T00:00:00Z', // Понедельник
      duration: 60,
      content: '',
    });
    await lessonRepo.save(lesson);

    // Никаких availability слотов не создается

    // Попытка сгенерировать расписание должна завершиться ошибкой
    await expect(repo.generate(user.id, course.id)).rejects.toThrow(
      /Не удалось назначить урок/i,
    );
  });

  it('Должен завершиться с ошибкой, если все слоты доступности заняты и нет доступных будущих дат.', async () => {
    // Сократим длительность курса до одной недели
    course.date_finish = '2025-06-27T00:00:00Z';
    await courseRepo.save(course);

    const lesson1 = lessonRepo.create({
      title: 'Lesson 1',
      course,
      date: '2025-06-26T00:00:00Z',
      duration: 60,
      content: '',
    });

    const lesson2 = lessonRepo.create({
      title: 'Lesson 2',
      course,
      date: '2025-06-26T00:00:00Z',
      duration: 60,
      content: '',
    });

    await lessonRepo.save([lesson1, lesson2]);

    // Один слот на четверг, только 1 час
    const availability = availabilityRepo.create({
      user,
      course,
      week_day: 3, // четверг
      start_time: '10:00:00',
      end_time: '11:00:00',
    });
    await availabilityRepo.save(availability);

    await expect(repo.generate(user.id, course.id)).rejects.toThrow(
      /Не удалось назначить урок/i,
    );
  });
});
