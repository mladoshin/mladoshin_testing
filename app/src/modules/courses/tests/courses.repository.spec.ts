// courses.repository.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CourseRepo } from '../courses.repository';
import { Course } from '../entities/course.entity';
import { CreateCourseDto } from '../dto/create-course.dto';
import { UpdateCourseDto } from '../dto/update-course.dto';
import { CourseLesson } from 'src/modules/lessons/entities/course-lesson.entity';
import { Payment } from 'src/modules/payments/entities/payment.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { UserProfile } from 'src/modules/users/entities/user-profile.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getTestingDatabaseConfig } from 'src/common/utils/utils';

describe('CourseRepo (integration)', () => {
  let module: TestingModule;
  let courseRepo: CourseRepo;
  let dataSource: DataSource;

  beforeAll(async () => {
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
          useFactory: (configService: ConfigService) =>
            getTestingDatabaseConfig(configService) as any,
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

  afterAll(async () => {
    await dataSource.destroy();
  });

  it('should create a course', async () => {
    const dto: CreateCourseDto = {
      name: 'Test Course',
      date_start: '2025-01-01T18:37:00',
      date_finish: '2025-01-01T18:37:00',
      price: 100,
    };

    const course = await courseRepo.create(dto);
    expect(course).toMatchObject(dto);
    expect(course.id).toBeDefined();
  });

  it('should find all courses', async () => {
    const courses = await courseRepo.findAll();
    expect(Array.isArray(courses)).toBe(true);
    expect(courses.length).toBeGreaterThan(0);
  });

  it('should find course by id', async () => {
    const dto: CreateCourseDto = {
      name: 'Another Course',
      date_start: '2025-01-01T18:37:00',
      date_finish: '2025-01-01T18:37:00',
      price: 100,
    };
    const created = await courseRepo.create(dto);
    const found = await courseRepo.findById(created.id);
    expect(found?.id).toEqual(created.id);
    expect(found?.name).toBe((dto as any).name);
  });

  it('should update course', async () => {
    const dto: CreateCourseDto = {
      name: 'Update Me',
      date_start: '2025-01-01T18:37:00',
      date_finish: '2025-01-01T18:37:00',
      price: 100,
    };
    const created = await courseRepo.create(dto);

    const update: UpdateCourseDto = {
      name: 'Updated Title',
    };

    const updated = await courseRepo.update(created.id, update);
    expect(updated.name).toBe((update as any).name);
  });

  it('should delete course', async () => {
    const dto: CreateCourseDto = {
      name: 'Delete Me',
      date_start: '2025-01-01T18:37:00',
      date_finish: '2025-01-01T18:37:00',
      price: 100,
    };
    const created = await courseRepo.create(dto);
    const deleted = await courseRepo.delete(created.id);

    expect(deleted.id).toBe(created.id);
    await expect(courseRepo.findOrFailById(created.id)).rejects.toThrow();
  });
});
