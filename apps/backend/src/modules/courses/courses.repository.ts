import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Course } from './entities/course.entity';
import { CreateCourseDto } from './dto/create-course.dto';
import {
  RepositoryNotFoundError,
  RepositoryUnknownError,
} from 'src/common/errors/db-errors';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CourseDomain } from './domains/course.domain';
import { CourseMapper } from './courses.mapper';

export interface ICourseRepo {
  create(
    createCourseDto: CreateCourseDto,
    options?: any,
  ): Promise<CourseDomain>;
  update(
    id: string,
    updateCourseDto: UpdateCourseDto,
    options?: any,
  ): Promise<CourseDomain>;
  delete(id: string, options?: any): Promise<CourseDomain>;
  findById(id: string, options?: any): Promise<CourseDomain | null>;
  findOrFailById(id: string, options?: any): Promise<CourseDomain>;
  findAll(options?: any): Promise<CourseDomain[]>;
}

@Injectable()
export class CourseRepo implements ICourseRepo {
  public constructor(
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  private async getORMRepository(options?: any) {
    const entityManager = this.dataSource.createEntityManager();
    if (options?.schema) {
      await entityManager.query(`SET search_path TO "${options.schema}"`);
    }
    return entityManager.getRepository(Course);
  }

  async create(createCourseDto: CreateCourseDto, options?: any) {
    const repository = await this.getORMRepository(options);
    const course = repository.create(createCourseDto);
    try {
      const courseDBEntity = await repository.save(course);
      return CourseMapper.toDomainEntity(courseDBEntity);
    } catch (err) {
      throw new RepositoryUnknownError(err.message, CourseRepo.name);
    }
  }

  async update(id: string, updateCourseDto: UpdateCourseDto, options?: any) {
    const repository = await this.getORMRepository(options);
    let course = await this.findOrFailById(id, options);
    const updated = repository.merge(course as Course, updateCourseDto);
    try {
      course = await repository.save(updated);
    } catch (err) {
      throw new RepositoryUnknownError(err.message, CourseRepo.name);
    }
    return CourseMapper.toDomainEntity(course as Course);
  }

  async findById(id: string, options?: any) {
    const entityManager = this.dataSource.createEntityManager();
    if (options?.schema) {
      await entityManager.query(`SET search_path TO "${options.schema}"`);
    }
    const repository = entityManager.getRepository(Course);

    const courseDBEntity = await repository.findOne({
      where: { id },
      relations: {
        lessons: true,
      },
    });
    return courseDBEntity ? CourseMapper.toDomainEntity(courseDBEntity) : null;
  }

  async findOrFailById(id: string, options?: any): Promise<CourseDomain> {
    const courseDomain = await this.findById(id, options);
    if (!courseDomain) {
      throw new RepositoryNotFoundError('Курс не найден.', Course.name);
    }
    return courseDomain;
  }

  async findAll(options?: any) {
    const repository = await this.getORMRepository(options);
    const courseDBEntities = await repository.find();
    return courseDBEntities.map((courseDBEntity) =>
      CourseMapper.toDomainEntity(courseDBEntity),
    );
  }

  async delete(id: string, options?: any) {
    const repository = await this.getORMRepository(options);
    const courseDomain = await this.findOrFailById(id, options);
    const tmp = { ...courseDomain };
    try {
      await repository.remove(courseDomain as Course);
    } catch (err) {
      throw new RepositoryUnknownError(err.message, CourseRepo.name);
    }
    return tmp;
  }
}
