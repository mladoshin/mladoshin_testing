import { Test, TestingModule } from '@nestjs/testing';
import { LessonsService } from '../lessons.service';
import { ICourseLessonRepo } from '../lessons.repository';
import { RepositoryNotFoundError } from 'src/common/errors/db-errors';
import {
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateLessonDto } from '../dto/create-lesson.dto';
import { UpdateLessonDto } from '../dto/update-lesson.dto';
import { CourseLessonDomain } from '../domains/lesson.domain';
import { CourseLessonFactory } from './factories/course-lesson.factory';
import { CourseLessonBuilder } from './builders/course-lesson.builder';

describe('LessonsService', () => {
  let service: LessonsService;
  let repo: jest.Mocked<ICourseLessonRepo>;

  beforeEach(async () => {
    const repoMock: jest.Mocked<ICourseLessonRepo> = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOrFailById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findAllByCourse: jest.fn(),
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LessonsService,
        { provide: 'ICourseLessonRepo', useValue: repoMock },
      ],
    }).compile();

    service = module.get<LessonsService>(LessonsService);
    repo = module.get('ICourseLessonRepo');
  });

  describe('create', () => {
    it('✅ should create a lesson (positive)', async () => {
      const dto: CreateLessonDto = new CourseLessonBuilder().buildCreateDto();
      const lesson = CourseLessonFactory.default();

      repo.create.mockResolvedValue(lesson);

      const result = await service.create(dto);

      expect(repo.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(lesson);
    });

    it('⚡ should throw InternalServerErrorException on repo error', async () => {
      const dto = new CourseLessonBuilder().buildCreateDto();
      repo.create.mockRejectedValue(new Error('DB down'));
      await expect(service.create(dto)).rejects.toThrow(Error);
    });
  });

  describe('findAll', () => {
    it('✅ should return all lessons', async () => {
      const lessons = [CourseLessonFactory.default()];
      repo.findAll.mockResolvedValue(lessons);

      const result = await service.findAll();

      expect(result).toEqual(lessons);
    });

    it('❌ should return empty array if no lessons (negative)', async () => {
      repo.findAll.mockResolvedValue([]);
      const result = await service.findAll();
      expect(result).toEqual([]);
    });

    it('⚡ should throw InternalServerErrorException on repo error', async () => {
      repo.findAll.mockRejectedValue(new Error('DB down'));
      await expect(service.findAll()).rejects.toThrow(Error);
    });
  });

  describe('findOne', () => {
    it('✅ should return a lesson by id', async () => {
      const lesson = CourseLessonFactory.default();
      repo.findOrFailById.mockResolvedValue(lesson);

      const result = await service.findOne('lesson-1');

      expect(result).toEqual(lesson);
    });

    it('❌ should throw NotFoundException for invalid id', async () => {
      repo.findOrFailById.mockRejectedValue(
        new RepositoryNotFoundError('CourseLesson', 'invalid-id'),
      );
      await expect(service.findOne('invalid-id')).rejects.toThrow(
        RepositoryNotFoundError,
      );
    });

    it('⚡ should throw InternalServerErrorException on repo error', async () => {
      repo.findOrFailById.mockRejectedValue(new Error('DB crashed'));
      await expect(service.findOne('lesson-1')).rejects.toThrow(Error);
    });
  });

  describe('update', () => {
    it('✅ should update a lesson', async () => {
      const updateDto: UpdateLessonDto = new CourseLessonBuilder()
        .withTitle('Updated')
        .buildUpdateDto();
      const lesson = CourseLessonFactory.default();
      repo.update.mockResolvedValue({ ...lesson, ...updateDto });

      const result = await service.update('lesson-1', updateDto);

      expect(result.title).toBe('Updated');
    });

    it('⚡ should throw NotFoundException if lesson not found', async () => {
      repo.update.mockRejectedValue(
        new RepositoryNotFoundError('CourseLesson', 'lesson-1'),
      );
      await expect(service.update('lesson-1', { title: 'X' })).rejects.toThrow(
        RepositoryNotFoundError,
      );
    });
  });

  describe('remove', () => {
    it('✅ should remove a lesson', async () => {
      const lesson = CourseLessonFactory.default();
      repo.delete.mockResolvedValue(lesson);

      const result = await service.remove('lesson-1');

      expect(result).toEqual(lesson);
    });

    it('❌ should throw NotFoundException for invalid id', async () => {
      repo.delete.mockRejectedValue(
        new RepositoryNotFoundError('CourseLesson', ''),
      );
      await expect(service.remove('')).rejects.toThrow(RepositoryNotFoundError);
    });

    it('⚡ should throw InternalServerErrorException on repo error', async () => {
      repo.delete.mockRejectedValue(new Error('DB crashed'));
      await expect(service.remove('lesson-1')).rejects.toThrow(Error);
    });
  });
});
