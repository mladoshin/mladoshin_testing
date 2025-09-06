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
import { CourseLessonDomain } from './domains/lesson.domain';
import { CourseLessonMapper } from './lessons.mapper';

export interface ICourseLessonRepo {
  create(createLessonDto: CreateLessonDto): Promise<CourseLessonDomain>;
  update(
    id: string,
    updateLessonDto: UpdateLessonDto,
  ): Promise<CourseLessonDomain>;
  delete(id: string): Promise<CourseLessonDomain>;
  findById(id: string): Promise<CourseLessonDomain | null>;
  findOrFailById(id: string): Promise<CourseLessonDomain>;
  findAll(): Promise<CourseLessonDomain[]>;
  findAllByCourse(courseId: string): Promise<CourseLessonDomain[]>;
}

@Injectable()
export class CourseLessonRepo implements ICourseLessonRepo {
  public constructor(
    @InjectRepository(CourseLesson)
    private readonly repository: Repository<CourseLesson>,
  ) {}

  async create(createLessonDto: CreateLessonDto) {
    const lesson = this.repository.create(createLessonDto);

    try {
      const courseLessonDBEntity = await this.repository.save(lesson);
      return CourseLessonMapper.toDomainEntity(courseLessonDBEntity);
    } catch (err) {
      throw new RepositoryUnknownError(err.message, CourseLessonRepo.name);
    }
  }

  async update(id: string, updateLessonDto: UpdateLessonDto) {
    let lessonDBEntity = await this.findOrFailById(id);
    const updated = this.repository.merge(lessonDBEntity, updateLessonDto);
    try {
      lessonDBEntity = await this.repository.save(updated);
    } catch (err) {
      throw new RepositoryUnknownError(err.message, CourseLessonRepo.name);
    }
    return CourseLessonMapper.toDomainEntity(lessonDBEntity);
  }

  async findById(id: string) {
    const lessonDBEntity = await this.repository.findOne({
      where: { id },
    });
    return lessonDBEntity
      ? CourseLessonMapper.toDomainEntity(lessonDBEntity)
      : null;
  }

  async findOrFailById(id: string): Promise<CourseLesson> {
    const lessonDomainEntity = await this.findById(id);
    if (!lessonDomainEntity) {
      throw new RepositoryNotFoundError('Урок не найден.', CourseLesson.name);
    }
    return lessonDomainEntity;
  }

  async findAll() {
    const lessonDBEntities = await this.repository.find();
    return lessonDBEntities.map((lessonDBEntity) =>
      CourseLessonMapper.toDomainEntity(lessonDBEntity),
    );
  }

  async findAllByCourse(courseId: string) {
    const lessonDBEntities = await this.repository.find({
      where: { course_id: courseId },
      order: {date: "asc"}
    });
    return lessonDBEntities.map((lessonDBEntity) =>
      CourseLessonMapper.toDomainEntity(lessonDBEntity),
    );
  }

  async delete(id: string) {
    const lessonDomainEntity = await this.findOrFailById(id);
    try {
      await this.repository.remove(lessonDomainEntity);
    } catch (err) {
      throw new RepositoryUnknownError(err.message, CourseLessonRepo.name);
    }
    return lessonDomainEntity;
  }
}
