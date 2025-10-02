import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
  create(createCourseDto: CreateCourseDto): Promise<CourseDomain>;
  update(id: string, updateCourseDto: UpdateCourseDto): Promise<CourseDomain>;
  delete(id: string): Promise<CourseDomain>;
  findById(id: string): Promise<CourseDomain | null>;
  findOrFailById(id: string): Promise<CourseDomain>;
  findAll(): Promise<CourseDomain[]>;
}

@Injectable()
export class CourseRepo implements ICourseRepo {
  public constructor(
    @InjectRepository(Course)
    private readonly repository: Repository<Course>,
  ) {}

  async create(createCourseDto: CreateCourseDto) {
    const course = this.repository.create(createCourseDto);
    try {
      const courseDBEntity = await this.repository.save(course)
      return CourseMapper.toDomainEntity(courseDBEntity);
    } catch (err) {
      throw new RepositoryUnknownError(err.message, CourseRepo.name);
    }
  }

  async update(id: string, updateCourseDto: UpdateCourseDto) {
    let course = await this.findOrFailById(id);
    const updated = this.repository.merge(course as Course, updateCourseDto);
    try {
      course = await this.repository.save(updated);
    } catch (err) {
      throw new RepositoryUnknownError(err.message, CourseRepo.name);
    }
    return CourseMapper.toDomainEntity(course as Course);
  }

  async findById(id: string) {
    const courseDBEntity = await this.repository.findOne({
      where: { id },
      relations: {
        lessons: true,
      },
    });
    return courseDBEntity ? CourseMapper.toDomainEntity(courseDBEntity) : null;
  }

  async findOrFailById(id: string): Promise<CourseDomain> {
    const courseDomain = await this.findById(id);
    if (!courseDomain) {
      throw new RepositoryNotFoundError('Курс не найден.', Course.name);
    }
    return courseDomain;
  }

  async findAll() {
    const courseDBEntities = await this.repository.find();
    return courseDBEntities.map(courseDBEntity => CourseMapper.toDomainEntity(courseDBEntity));
  }

  async delete(id: string) {
    const courseDomain = await this.findOrFailById(id);
    const tmp = { ...courseDomain };
    try {
      await this.repository.remove(courseDomain as Course);
    } catch (err) {
      throw new RepositoryUnknownError(err.message, CourseRepo.name);
    }
    return tmp;
  }
}
