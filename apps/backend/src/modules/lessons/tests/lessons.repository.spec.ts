import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CourseLesson } from '../entities/course-lesson.entity';
import { Course } from 'src/modules/courses/entities/course.entity';
import { CourseLessonRepo } from '../lessons.repository';
import { CreateLessonDto } from '../dto/create-lesson.dto';
import { UpdateLessonDto } from '../dto/update-lesson.dto';
import { Payment } from 'src/modules/payments/entities/payment.entity';
import { UserProfile } from 'src/modules/users/entities/user-profile.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { getTestingDatabaseConfig } from 'src/common/utils/utils';
import { ConfigModule, ConfigService } from '@nestjs/config';

describe('CourseLessonRepo', () => {
  let repo: CourseLessonRepo;
  let courseRepo: Repository<Course>;
  let course: Course;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
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
      providers: [CourseLessonRepo],
    }).compile();

    repo = module.get<CourseLessonRepo>(CourseLessonRepo);
    courseRepo = module.get<Repository<Course>>(getRepositoryToken(Course));

    // Create a course to satisfy FK
    course = courseRepo.create({
      name: 'Test Course',
      date_start: '2025-01-01T18:37:00',
      date_finish: '2025-01-01T18:37:00',
      price: 100,
    });
    await courseRepo.save(course);
  });

  it('should create a lesson', async () => {
    const dto: CreateLessonDto = {
      title: 'Lesson 1',
      content: 'Lesson content',
      course_id: course.id,
      date: '2025-01-01',
      duration: 60
    };

    const lesson = await repo.create(dto);
    expect(lesson).toMatchObject({
      title: (dto as any).title,
      content: (dto as any).content,
      course_id: course.id,
    });
  });

  it('should find a lesson by ID', async () => {
    const dto: CreateLessonDto = {
      title: 'Lesson 2',
      content: 'More content',
      course_id: course.id,
      date: '2025-01-01',
      duration: 60
    };

    const created = await repo.create(dto);
    const found = await repo.findById(created.id);
    expect(found?.title).toBe('Lesson 2');
  });

  it('should update a lesson', async () => {
    const lesson = await repo.create({
      title: 'Original',
      content: 'Old content',
      course_id: course.id,
      date: '2025-01-01',
      duration: 60
    });

    const updated = await repo.update(lesson.id, {
      title: 'Updated Title',
      content: 'Updated content',
    } as UpdateLessonDto);

    expect(updated.title).toBe('Updated Title');
  });

  it('should delete a lesson', async () => {
    const lesson = await repo.create({
      title: 'To Delete',
      content: 'Will be gone',
      course_id: course.id,
      date: '2025-01-01',
      duration: 60
    });

    await repo.delete(lesson.id);
    const found = await repo.findById(lesson.id);
    expect(found).toBeNull();
  });

  it('should throw if lesson not found', async () => {
    await expect(repo.findOrFailById('18dadbe2-2312-4eaa-9889-aab4b28c28c9')).rejects.toThrow(
      'Урок не найден.',
    );
  });
});
