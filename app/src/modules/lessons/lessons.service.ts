import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { ICourseLessonRepo } from './lessons.repository';
import { RepositoryNotFoundError } from 'src/common/errors/db-errors';
import { CourseLesson } from './entities/course-lesson.entity';

export interface ILessonsService {
  create(createLessonDto: CreateLessonDto): Promise<CourseLesson>;
  findAll(): Promise<CourseLesson[]>;
  findOne(id: string): Promise<CourseLesson>;
  update(id: string, updateLessonDto: UpdateLessonDto): Promise<CourseLesson>;
  remove(id: string): Promise<CourseLesson>;
}

@Injectable()
export class LessonsService implements ILessonsService{
  constructor(
    @Inject('ICourseLessonRepo')
    private readonly courseLessonRepository: ICourseLessonRepo,
  ) {}

  create(createLessonDto: CreateLessonDto): Promise<CourseLesson> {
    return this.courseLessonRepository.create(createLessonDto);
  }

  findAll(): Promise<CourseLesson[]> {
    return this.courseLessonRepository.findAll();
  }

  findOne(id: string): Promise<CourseLesson> {
    try {
      return this.courseLessonRepository.findOrFailById(id);
    } catch (err) {
      if (err instanceof RepositoryNotFoundError) {
        throw new NotFoundException(err.message);
      }
      throw new InternalServerErrorException(err?.message);
    }
  }

  update(id: string, updateLessonDto: UpdateLessonDto): Promise<CourseLesson> {
    try {
      return this.courseLessonRepository.update(id, updateLessonDto);
    } catch (err) {
      if (err instanceof RepositoryNotFoundError) {
        throw new NotFoundException(err.message);
      }
      throw new InternalServerErrorException(err?.message);
    }
  }

  remove(id: string): Promise<CourseLesson> {
    try {
      return this.courseLessonRepository.delete(id);
    } catch (err) {
      if (err instanceof RepositoryNotFoundError) {
        throw new NotFoundException(err.message);
      }
      throw new InternalServerErrorException(err?.message);
    }
  }
}
