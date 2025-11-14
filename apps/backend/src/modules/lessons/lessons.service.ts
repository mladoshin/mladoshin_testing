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
import { CourseLessonDomain } from './domains/lesson.domain';

export interface ILessonsService {
  create(createLessonDto: CreateLessonDto, options?: any): Promise<CourseLessonDomain>;
  findAll(options?: any): Promise<CourseLessonDomain[]>;
  findOne(id: string, options?: any): Promise<CourseLessonDomain>;
  update(id: string, updateLessonDto: UpdateLessonDto, options?: any): Promise<CourseLessonDomain>;
  remove(id: string, options?: any): Promise<CourseLessonDomain>;
}

@Injectable()
export class LessonsService implements ILessonsService{
  constructor(
    @Inject('ICourseLessonRepo')
    private readonly courseLessonRepository: ICourseLessonRepo,
  ) {}

  create(createLessonDto: CreateLessonDto, options?: any): Promise<CourseLessonDomain> {
    return this.courseLessonRepository.create(createLessonDto, options);
  }

  findAll(options?: any): Promise<CourseLessonDomain[]> {
    return this.courseLessonRepository.findAll(options);
  }

  findOne(id: string, options?: any): Promise<CourseLessonDomain> {
    try {
      return this.courseLessonRepository.findOrFailById(id, options);
    } catch (err) {
      if (err instanceof RepositoryNotFoundError) {
        throw new NotFoundException(err.message);
      }
      throw new InternalServerErrorException(err?.message);
    }
  }

  update(id: string, updateLessonDto: UpdateLessonDto, options?: any): Promise<CourseLessonDomain> {
    try {
      return this.courseLessonRepository.update(id, updateLessonDto, options);
    } catch (err) {
      if (err instanceof RepositoryNotFoundError) {
        throw new NotFoundException(err.message);
      }
      throw new InternalServerErrorException(err?.message);
    }
  }

  remove(id: string, options?: any): Promise<CourseLessonDomain> {
    try {
      return this.courseLessonRepository.delete(id, options);
    } catch (err) {
      if (err instanceof RepositoryNotFoundError) {
        throw new NotFoundException(err.message);
      }
      throw new InternalServerErrorException(err?.message);
    }
  }
}
