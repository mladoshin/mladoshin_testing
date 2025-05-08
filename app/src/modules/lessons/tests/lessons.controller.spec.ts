// lessons.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { LessonsController }   from '../lessons.controller';
import { LessonsService }      from '../lessons.service';
import { CreateLessonDto }     from '../dto/create-lesson.dto';
import { UpdateLessonDto }     from '../dto/update-lesson.dto';
import { CourseLessonResponse } from '../dto/lesson-response.dto';
import { CourseLesson } from '../entities/course-lesson.entity';

describe('LessonsController', () => {
  let controller: LessonsController;
  let service: Partial<Record<keyof LessonsService, jest.Mock>>;

  beforeAll(async () => {
    // Create Jest mock functions for each service method
    service = {
      create:  jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update:  jest.fn(),
      remove:  jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LessonsController],
      providers: [
        { provide: LessonsService, useValue: service },
      ],
    }).compile();

    controller = module.get<LessonsController>(LessonsController);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Sample data
  const sampleLesson: CourseLesson = {
    id: 'lesson-1',
    course_id: 'course-1',
    title: 'Intro',
    content: 'Welcome to the course',
    date: '2025-01-01',
    course: {} as any
  };
  const response = CourseLessonResponse.make(sampleLesson);
  const responseList = [response];

  describe('create', () => {
    it('should create a lesson and return CourseLessonResponse', async () => {
      const dto: CreateLessonDto = {
        course_id: 'course-1',
        title: 'Intro',
        content: 'Welcome to the course',
        date: '2025-01-01'
      };
      service.create!.mockResolvedValue(sampleLesson);

      const result = await controller.create(dto);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(response);
    });
  });

  describe('findAll', () => {
    it('should return an array of CourseLessonResponse', async () => {
      service.findAll!.mockResolvedValue([sampleLesson]);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(responseList);
    });
  });

  describe('findOne', () => {
    it('should return a single CourseLessonResponse', async () => {
      service.findOne!.mockResolvedValue(sampleLesson);

      const result = await controller.findOne('lesson-1');

      expect(service.findOne).toHaveBeenCalledWith('lesson-1');
      expect(result).toEqual(response);
    });
  });

  describe('update', () => {
    it('should update a lesson and return CourseLessonResponse', async () => {
      const dto: UpdateLessonDto = {
        title: 'Introduction',
        content: 'Updated content'
      };
      const updated = { ...sampleLesson, ...dto };
      service.update!.mockResolvedValue(updated);

      const result = await controller.update('lesson-1', dto);

      expect(service.update).toHaveBeenCalledWith('lesson-1', dto);
      expect(result).toEqual(CourseLessonResponse.make(updated));
    });
  });

  describe('remove', () => {
    it('should remove a lesson and return CourseLessonResponse', async () => {
      service.remove!.mockResolvedValue(sampleLesson);

      const result = await controller.remove('lesson-1');

      expect(service.remove).toHaveBeenCalledWith('lesson-1');
      expect(result).toEqual(response);
    });
  });
});
