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

export interface ICourseRepo {
  create(createCourseDto: CreateCourseDto): Promise<Course>;
  update(id: string, updateCourseDto: UpdateCourseDto): Promise<Course>;
  delete(id: string): Promise<Course>;
  findById(id: string): Promise<Course | null>;
  findOrFailById(id: string): Promise<Course>;
  findAll(): Promise<Course[]>;
}

@Injectable()
export class CourseRepo implements ICourseRepo {
  public constructor(
    @InjectRepository(Course)
    private readonly repository: Repository<Course>,
  ) {}

  create(createCourseDto: CreateCourseDto) {
    const course = this.repository.create(createCourseDto);
    try {
      return this.repository.save(course);
    } catch (err) {
      throw new RepositoryUnknownError(err.message, CourseRepo.name);
    }
  }

  async update(id: string, updateCourseDto: UpdateCourseDto) {
    let course = await this.findOrFailById(id);
    const updated = this.repository.merge(course, updateCourseDto);
    try {
      course = await this.repository.save(updated);
    } catch (err) {
      throw new RepositoryUnknownError(err.message, CourseRepo.name);
    }
    return course;
  }

  findById(id: string) {
    return this.repository.findOne({
      where: { id },
      relations: {
        lessons: true,
      },
    });
  }

  async findOrFailById(id: string): Promise<Course> {
    const course = await this.repository.findOne({
      where: { id },
    });
    if (!course) {
      throw new RepositoryNotFoundError('Курс не найден.', Course.name);
    }
    return course;
  }

  findAll() {
    return this.repository.find();
  }

  async delete(id: string) {
    const course = await this.findOrFailById(id);
    const tmp = { ...course };
    try {
      await this.repository.remove(course);
    } catch (err) {
      throw new RepositoryUnknownError(err.message, CourseRepo.name);
    }
    return tmp;
  }
}
