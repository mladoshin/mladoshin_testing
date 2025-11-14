// lessons.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { RepositoryUnknownError } from 'src/common/errors/db-errors';
import { IAppLoggerService } from 'src/common/logging/log.service';
import { CourseLessonBuilder } from 'src/common/tests/builders/lesson.builder';
import { CourseLessonObjectMother } from 'src/common/tests/object-mothers/lesson-object-mother';
import { CourseLessonResponse } from '../../dto/lesson-response.dto';
import { LessonsController } from '../../lessons.controller';
import { CourseLessonMapper } from '../../lessons.mapper';
import { ILessonsService } from '../../lessons.service';

describe('LessonsController', () => {
  let controller: LessonsController;
  let service: Partial<Record<keyof ILessonsService, jest.Mock>>;
  let mockLoggerService: Partial<Record<keyof IAppLoggerService, jest.Mock>>;
  let mockReq: any;

  beforeAll(async () => {
    mockReq = {
      headers: {
        'x-test-schema': 'test_schema',
      },
    };
    // Create Jest mock functions for each service method
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    mockLoggerService = {
      accessLog: jest.fn(),
      error: jest.fn(),
      log: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LessonsController],
      providers: [
        { provide: 'ILessonsService', useValue: service },
        { provide: 'IAppLoggerService', useValue: mockLoggerService },
      ],
    }).compile();

    controller = module.get<LessonsController>(LessonsController);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Sample data
  const sampleLesson = new CourseLessonBuilder().build();
  const response = CourseLessonResponse.make(
    CourseLessonMapper.toDomainEntity(sampleLesson),
  );
  const responseList = [response];

  describe('create', () => {
    it('should create a lesson and return CourseLessonResponse', async () => {
      const dto = CourseLessonObjectMother.buildCreateDto();
      service.create!.mockResolvedValue(
        CourseLessonMapper.toDomainEntity(sampleLesson),
      );

      const result = await controller.create(dto, mockReq);

      expect(service.create).toHaveBeenCalledWith(dto, {schema: 'test_schema'});
      expect(result).toEqual(response);
    });

    it('should throw an error if service.create fails (negative)', async () => {
      const dto = CourseLessonObjectMother.buildCreateDto();
      service.create!.mockRejectedValue(new RepositoryUnknownError('', ''));
      await expect(controller.create(dto, mockReq)).rejects.toThrow(
        RepositoryUnknownError,
      );

      expect(service.create).toHaveBeenCalledWith(dto, {schema: 'test_schema'});
    });
  });

  describe('findAll', () => {
    it('should return an array of CourseLessonResponse', async () => {
      service.findAll!.mockResolvedValue([
        CourseLessonMapper.toDomainEntity(sampleLesson),
      ]);

      const result = await controller.findAll(mockReq);

      expect(service.findAll).toHaveBeenCalledWith({schema: 'test_schema'});
      expect(result).toEqual(responseList);
    });

    it('should throw an error if service.findAll fails (negative)', async () => {
      service.findAll!.mockRejectedValue(new RepositoryUnknownError('', ''));

      await expect(controller.findAll(mockReq)).rejects.toThrow(
        RepositoryUnknownError,
      );

      expect(service.findAll).toHaveBeenCalledWith({schema: 'test_schema'});
    });
  });

  describe('findOne', () => {
    it('should return a single CourseLessonResponse', async () => {
      service.findOne!.mockResolvedValue(CourseLessonMapper.toDomainEntity(sampleLesson));

      const result = await controller.findOne(sampleLesson.id, mockReq);

      expect(service.findOne).toHaveBeenCalledWith(sampleLesson.id, {schema: 'test_schema'});
      expect(result).toEqual(response);
    });

    it('should throw an error if service.findOne fails (negative)', async () => {
      service.findOne!.mockRejectedValue(new RepositoryUnknownError('', ''));

      await expect(controller.findOne(sampleLesson.id, mockReq)).rejects.toThrow(
        RepositoryUnknownError,
      );

      expect(service.findOne).toHaveBeenCalledWith(sampleLesson.id, {schema: 'test_schema'});
    });
  });

  describe('update', () => {
    it('should update a lesson and return CourseLessonResponse', async () => {
      const dto = CourseLessonObjectMother.buildUpdateDto();
      const updated = { ...sampleLesson, ...dto };
      service.update!.mockResolvedValue(CourseLessonMapper.toDomainEntity(updated));

      const result = await controller.update(sampleLesson.id, dto, mockReq);

      expect(service.update).toHaveBeenCalledWith(sampleLesson.id, dto, {schema: 'test_schema'});
      expect(result).toEqual(CourseLessonResponse.make(CourseLessonMapper.toDomainEntity(updated)));
    });

    it('should throw an error if service.update fails (negative)', async () => {
      const dto = CourseLessonObjectMother.buildUpdateDto();
      service.update!.mockRejectedValue(new RepositoryUnknownError('', ''));

      await expect(controller.update(sampleLesson.id, dto, mockReq)).rejects.toThrow(
        RepositoryUnknownError,
      );

      expect(service.update).toHaveBeenCalledWith(sampleLesson.id, dto, {schema: 'test_schema'});
    });
  });

  describe('remove', () => {
    it('should remove a lesson and return CourseLessonResponse', async () => {
      service.remove!.mockResolvedValue(CourseLessonMapper.toDomainEntity(sampleLesson));

      const result = await controller.remove(sampleLesson.id, mockReq);

      expect(service.remove).toHaveBeenCalledWith(sampleLesson.id, {schema: 'test_schema'});
      expect(result).toEqual(response);
    });

    it('should throw an error if service.remove fails (negative)', async () => {
      service.remove!.mockRejectedValue(new RepositoryUnknownError('', ''));

      await expect(controller.remove(sampleLesson.id, mockReq)).rejects.toThrow(
        RepositoryUnknownError,
      );

      expect(service.remove).toHaveBeenCalledWith(sampleLesson.id, {schema: 'test_schema'});
    });
  });
});
