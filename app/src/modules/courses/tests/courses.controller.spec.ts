// courses.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { CoursesController } from '../courses.controller';
import { CoursesService } from '../courses.service';
import { CreateCourseDto } from '../dto/create-course.dto';
import { UpdateCourseDto } from '../dto/update-course.dto';
import { CourseResponse } from '../dto/course-response.dto';
import { Course } from '../entities/course.entity';

describe('CoursesController', () => {
  let controller: CoursesController;
  let service: Partial<Record<keyof CoursesService, jest.Mock>>;

  beforeAll(async () => {
    // Create Jest mock functions for each service method
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CoursesController],
      providers: [{ provide: CoursesService, useValue: service }],
    }).compile();

    controller = module.get<CoursesController>(CoursesController);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test data
  const sampleCourse: Course = {
    id: '1',
    name: 'Test Course',
    price: 100,
    date_finish: '2025-01-01',
    date_start: '2025-02-01',
    lessons: [],
    payments: [],
  };
  const response = CourseResponse.make(sampleCourse);
  const responseList = [response];

  // 2. create()
  describe('create', () => {
    it('should create a course and return CourseResponse', async () => {
      const dto: CreateCourseDto = {
        name: 'Test Course',
        date_finish: '2025-01-01',
        date_start: '2025-02-01',
        price: 100,
      };
      service.create!.mockResolvedValue(sampleCourse);

      const result = await controller.create(dto);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(response);
    });
  });

  // 3. findAll()
  describe('findAll', () => {
    it('should return an array of CourseResponse', async () => {
      service.findAll!.mockResolvedValue([sampleCourse]);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(responseList);
    });
  });

  // 4. findOne()
  describe('findOne', () => {
    it('should return a single CourseResponse', async () => {
      service.findOne!.mockResolvedValue(sampleCourse);

      const result = await controller.findOne('1');

      expect(service.findOne).toHaveBeenCalledWith('1');
      expect(result).toEqual(response);
    });
  });

  // 5. update()
  describe('update', () => {
    it('should update a course and return CourseResponse', async () => {
      const dto: UpdateCourseDto = {
        name: 'Updated',
        date_start: '2024-01-01',
        date_finish: '2024-02-01',
        price: 200,
      };
      service.update!.mockResolvedValue({ ...sampleCourse, ...dto });

      const result = await controller.update('1', dto);

      expect(service.update).toHaveBeenCalledWith('1', dto);
      expect(result).toEqual(CourseResponse.make({ ...sampleCourse, ...dto }));
    });
  });

  // 6. remove()
  describe('remove', () => {
    it('should remove a course and return CourseResponse', async () => {
      service.remove!.mockResolvedValue(sampleCourse);

      const result = await controller.remove('1');

      expect(service.remove).toHaveBeenCalledWith('1');
      expect(result).toEqual(response);
    });
  });
});
