import { NotFoundException } from '@nestjs/common';
import { instanceToPlain } from 'class-transformer';
import { CourseLesson } from '../entities/course-lesson.entity';
import { CourseLessonDomain } from '../domains/lesson.domain';
import { CourseResponse, LessonResponse } from '@shared/types';

export class CourseLessonResponse implements LessonResponse {
  id: string;
  course_id: string;
  content: string;
  course: CourseResponse;
  date: string;
  title: string;
  
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
