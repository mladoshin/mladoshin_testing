import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CourseLesson } from './entities/course-lesson.entity';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { RepositoryNotFoundError } from 'src/common/errors/db-errors';

@Injectable()
export class CourseLessonRepo {
  public constructor(
    @InjectRepository(CourseLesson)
    private readonly repository: Repository<CourseLesson>,
  ) {}

  create(createLessonDto: CreateLessonDto) {
    const lesson = this.repository.create(createLessonDto);
    return this.repository.save(lesson);
  }

  async update(id: string, updateLessonDto: UpdateLessonDto) {
    let lesson = await this.findOrFailById(id);
    const updated = this.repository.merge(lesson, updateLessonDto);
    lesson = await this.repository.save(updated);
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

  async delete(id: string) {
    const lesson = await this.findOrFailById(id);
    await this.repository.remove(lesson);
    return lesson;
  }
}
