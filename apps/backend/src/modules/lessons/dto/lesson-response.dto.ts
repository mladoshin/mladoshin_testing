import { NotFoundException } from '@nestjs/common';
import { instanceToPlain } from 'class-transformer';
import { CourseLesson } from '../entities/course-lesson.entity';
import { CourseLessonDomain } from '../domains/lesson.domain';

export class CourseLessonResponse {
  constructor(lesson: CourseLessonDomain) {
    const rest = instanceToPlain(lesson) as CourseLesson;
    Object.assign(this, rest);
  }

  static make(lesson: CourseLessonDomain | null): CourseLessonResponse {
    if (!lesson) {
      throw new NotFoundException('Пользователь не найден');
    }

    return new CourseLessonResponse(lesson);
  }

  static collection(lessons: CourseLessonDomain[]): CourseLessonResponse[] {
    return lessons.map((lesson) => new CourseLessonResponse(lesson));
  }
}
