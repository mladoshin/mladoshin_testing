import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CourseLesson } from './entities/course-lesson.entity';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import {
  RepositoryNotFoundError,
  RepositoryUnknownError,
} from 'src/common/errors/db-errors';

export interface ICourseLessonRepo {
  create(createLessonDto: CreateLessonDto): Promise<CourseLesson>;
  update(id: string, updateLessonDto: UpdateLessonDto): Promise<CourseLesson>;
  delete(id: string): Promise<CourseLesson>;
  findById(id: string): Promise<CourseLesson | null>;
  findOrFailById(id: string): Promise<CourseLesson>;
  findAll(): Promise<CourseLesson[]>;
  findAllByCourse(courseId: string): Promise<CourseLesson[]>;
}

@Injectable()
export class CourseLessonRepo implements ICourseLessonRepo{
  public constructor(
    @InjectRepository(CourseLesson)
    private readonly repository: Repository<CourseLesson>,
  ) {}

  create(createLessonDto: CreateLessonDto) {
    const lesson = this.repository.create(createLessonDto);

    try {
      return this.repository.save(lesson);
    } catch (err) {
      throw new RepositoryUnknownError(err.message, CourseLessonRepo.name);
    }
  }

  async update(id: string, updateLessonDto: UpdateLessonDto) {
    let lesson = await this.findOrFailById(id);
    const updated = this.repository.merge(lesson, updateLessonDto);
    try {
      lesson = await this.repository.save(updated);
    } catch (err) {
      throw new RepositoryUnknownError(err.message, CourseLessonRepo.name);
    }
    return lesson;
  }

  findById(id: string) {
    return this.repository.findOne({
      where: { id },
    });
  }

  async findOrFailById(id: string): Promise<CourseLesson> {
    const lesson = await this.findById(id);
    if (!lesson) {
      throw new RepositoryNotFoundError('Урок не найден.', CourseLesson.name);
    }

    return lesson;
  }

  findAll() {
    return this.repository.find();
  }

  findAllByCourse(courseId: string) {
    return this.repository.find({
      where: { course_id: courseId },
    });
  }

  async delete(id: string) {
    const lesson = await this.findOrFailById(id);
    try {
      await this.repository.remove(lesson);
    } catch (err) {
      throw new RepositoryUnknownError(err.message, CourseLessonRepo.name);
    }
    return lesson;
  }
}
