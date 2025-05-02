import { NotFoundException } from '@nestjs/common';
import { instanceToPlain } from 'class-transformer';
import { CourseLesson } from '../entities/course-lesson.entity';

export class CourseLessonResponse {
  constructor(lesson: CourseLesson) {
    const rest = instanceToPlain(lesson) as CourseLesson;
    Object.assign(this, rest);
  }

  static make(lesson: CourseLesson | null): CourseLessonResponse {
    if (!lesson) {
      throw new NotFoundException('Пользователь не найден');
    }

    return new CourseLessonResponse(lesson);
  }

  static collection(lessons: CourseLesson[]): CourseLessonResponse[] {
    return lessons.map((lesson) => new CourseLessonResponse(lesson));
  }
}
