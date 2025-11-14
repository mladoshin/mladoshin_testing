import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
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
  create(createLessonDto: CreateLessonDto, options?: any): Promise<CourseLessonDomain>;
  update(
    id: string,
    updateLessonDto: UpdateLessonDto,
    options?: any,
  ): Promise<CourseLessonDomain>;
  delete(id: string, options?: any): Promise<CourseLessonDomain>;
  findById(id: string, options?: any): Promise<CourseLessonDomain | null>;
  findOrFailById(id: string, options?: any): Promise<CourseLessonDomain>;
  findAll(options?: any): Promise<CourseLessonDomain[]>;
  findAllByCourse(courseId: string, options?: any): Promise<CourseLessonDomain[]>;
}

@Injectable()
export class CourseLessonRepo implements ICourseLessonRepo {
  public constructor(
    @InjectRepository(CourseLesson)
    private readonly repository: Repository<CourseLesson>,
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  private async getORMRepository(options?: any) {
    const entityManager = this.dataSource.createEntityManager();
    if (options?.schema) {
      await entityManager.query(`SET search_path TO "${options.schema}"`);
    }
    return entityManager.getRepository(CourseLesson);
  }

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
    let lessonEntity = await this.findOrFailById(id);
    const updated = this.repository.merge(lessonEntity as CourseLesson, updateLessonDto);
    try {
      lessonEntity = await this.repository.save(updated);
    } catch (err) {
      throw new RepositoryUnknownError(err.message, CourseLessonRepo.name);
    }
    return CourseLessonMapper.toDomainEntity(lessonEntity as CourseLesson);
  }

  async findById(id: string) {
    const lessonDBEntity = await this.repository.findOne({
      where: { id },
    });
    return lessonDBEntity
      ? CourseLessonMapper.toDomainEntity(lessonDBEntity)
      : null;
  }

  async findOrFailById(id: string): Promise<CourseLessonDomain> {
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

  async findAllByCourse(courseId: string, options?: any) {
    const repository = await this.getORMRepository(options);

    const lessonDBEntities = await repository.find({
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
      await this.repository.remove(lessonDomainEntity as CourseLesson);
    } catch (err) {
      throw new RepositoryUnknownError(err.message, CourseLessonRepo.name);
    }
    return lessonDomainEntity;
  }
}
