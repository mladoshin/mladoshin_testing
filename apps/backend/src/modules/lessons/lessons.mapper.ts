import { CourseLessonDomain } from './domains/lesson.domain';
import { CourseLesson } from './entities/course-lesson.entity';

export class CourseLessonMapper {
  static toDomainEntity(lesson: CourseLesson): CourseLessonDomain {
    return {
      id: lesson.id,
      title: lesson.title,
      content: lesson.content,
      date: lesson.date,
      course_id: lesson.course_id,
      course: lesson.course,
      duration: lesson.duration,
    };
  }
}
