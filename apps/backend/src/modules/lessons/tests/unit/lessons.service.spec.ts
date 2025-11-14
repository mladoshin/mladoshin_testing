import { Test, TestingModule } from '@nestjs/testing';
import {
  RepositoryNotFoundError,
  RepositoryUnknownError,
} from 'src/common/errors/db-errors';
import { CourseLessonBuilder } from 'src/common/tests/builders/lesson.builder';
import { CourseLessonObjectMother } from 'src/common/tests/object-mothers/lesson-object-mother';
import { CreateLessonDto } from '../../dto/create-lesson.dto';
import { CourseLessonMapper } from '../../lessons.mapper';
import { ICourseLessonRepo } from '../../lessons.repository';
import { LessonsService } from '../../lessons.service';

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
      const dto: CreateLessonDto = CourseLessonObjectMother.buildCreateDto();
      const lesson = new CourseLessonBuilder().build();

      repo.create.mockResolvedValue(CourseLessonMapper.toDomainEntity(lesson));

      const result = await service.create(dto);

      expect(repo.create).toHaveBeenCalledWith(dto, undefined);
      expect(result).toEqual(lesson);
    });

    it('⚡ should throw InternalServerErrorException on repo error', async () => {
      const dto: CreateLessonDto = CourseLessonObjectMother.buildCreateDto();
      repo.create.mockRejectedValue(new RepositoryUnknownError('', ''));
      await expect(service.create(dto)).rejects.toThrow(RepositoryUnknownError);
    });
  });

  describe('findAll', () => {
    it('✅ should return all lessons', async () => {
      const lesson = new CourseLessonBuilder().build();
      const lessons = [CourseLessonMapper.toDomainEntity(lesson)];
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
      repo.findAll.mockRejectedValue(new RepositoryUnknownError('', ''));
      await expect(service.findAll()).rejects.toThrow(RepositoryUnknownError);
    });
  });

  describe('findOne', () => {
    it('✅ should return a lesson by id', async () => {
      const lesson = new CourseLessonBuilder().build();
      repo.findOrFailById.mockResolvedValue(
        CourseLessonMapper.toDomainEntity(lesson),
      );

      const result = await service.findOne(lesson.id);
      expect(result).toEqual(CourseLessonMapper.toDomainEntity(lesson));
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
      repo.findOrFailById.mockRejectedValue(new RepositoryUnknownError('', ''));
      await expect(service.findOne('lesson-1')).rejects.toThrow(
        RepositoryUnknownError,
      );
    });
  });

  describe('update', () => {
    it('✅ should update a lesson', async () => {
      const updateDto = CourseLessonObjectMother.buildUpdateDto();
      const lesson = new CourseLessonBuilder().build();
      const updatedLesson = { ...lesson, ...updateDto };
      repo.update.mockResolvedValue(
        CourseLessonMapper.toDomainEntity(updatedLesson),
      );

      const result = await service.update(updatedLesson.id, updateDto);

      expect(result).toStrictEqual(CourseLessonMapper.toDomainEntity(updatedLesson));
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
      const lesson = new CourseLessonBuilder().build();
      repo.delete.mockResolvedValue(CourseLessonMapper.toDomainEntity(lesson));

      const result = await service.remove(lesson.id);

      expect(result).toEqual(CourseLessonMapper.toDomainEntity(lesson));
    });

    it('❌ should throw NotFoundException for invalid id', async () => {
      repo.delete.mockRejectedValue(
        new RepositoryNotFoundError('CourseLesson', ''),
      );
      await expect(service.remove('')).rejects.toThrow(RepositoryNotFoundError);
    });

    it('⚡ should throw InternalServerErrorException on repo error', async () => {
      repo.delete.mockRejectedValue(new RepositoryUnknownError('', ''));
      await expect(service.remove('lesson-1')).rejects.toThrow(RepositoryUnknownError);
    });
  });
});
