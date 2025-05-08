import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CourseRepo } from './courses.repository';
import { Course } from './entities/course.entity';
import { RepositoryNotFoundError } from 'src/common/errors/db-errors';

@Injectable()
export class CoursesService {
  constructor(@Inject(CourseRepo) private readonly courseRepository: CourseRepo) {}

  create(createCourseDto: CreateCourseDto): Promise<Course> {
    return this.courseRepository.create(createCourseDto);
  }

  findAll(): Promise<Course[]> {
    return this.courseRepository.findAll();
  }

  findOne(id: string): Promise<Course> {
    try {
      return this.courseRepository.findOrFailById(id);
    }
 catch (err) {
      if (err instanceof RepositoryNotFoundError) {
        throw new NotFoundException(err.message);
      }
      throw new InternalServerErrorException(err?.message);
    }
  }

  update(id: string, updateCourseDto: UpdateCourseDto): Promise<Course> {
    try {
      return this.courseRepository.update(id, updateCourseDto);
    }
 catch (err) {
      if (err instanceof RepositoryNotFoundError) {
        throw new NotFoundException(err.message);
      }
      throw new InternalServerErrorException(err?.message);
    }
  }

  remove(id: string): Promise<Course> {
    try {
      return this.courseRepository.delete(id);
    }
 catch (err) {
      if (err instanceof RepositoryNotFoundError) {
        throw new NotFoundException(err.message);
      }
      throw new InternalServerErrorException(err?.message);
    }
  }
}
