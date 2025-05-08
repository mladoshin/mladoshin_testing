import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from './entities/course.entity';
import { CreateCourseDto } from './dto/create-course.dto';
import { RepositoryNotFoundError } from 'src/common/errors/db-errors';
import { UpdateCourseDto } from './dto/update-course.dto';

@Injectable()
export class CourseRepo {
  public constructor(
    @InjectRepository(Course)
    private readonly repository: Repository<Course>,
  ) {}

  create(createCourseDto: CreateCourseDto) {
    const course = this.repository.create(createCourseDto);
    return this.repository.save(course);
  }

  async update(id: string, updateCourseDto: UpdateCourseDto) {
    let course = await this.findOrFailById(id);
    const updated = this.repository.merge(course, updateCourseDto);
    course = await this.repository.save(updated);
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
    const tmp = {...course}
    await this.repository.remove(course);
    return tmp;
  }
}
