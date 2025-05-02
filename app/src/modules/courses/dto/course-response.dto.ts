import { NotFoundException } from '@nestjs/common';
import { instanceToPlain } from 'class-transformer';
import { Course } from '../entities/course.entity';

export class CourseResponse {
  constructor(course: Course) {
    const rest = instanceToPlain(course) as Course;
    Object.assign(this, rest);
  }

  static make(course: Course | null): CourseResponse {
    if (!course) {
      throw new NotFoundException('Пользователь не найден');
    }

    return new CourseResponse(course);
  }

  static collection(courses: Course[]): CourseResponse[] {
    return courses.map((course) => new CourseResponse(course));
  }
}
