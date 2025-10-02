import { CourseLessonDomain } from '../../domains/lesson.domain';
import { CourseLessonBuilder } from '../builders/course-lesson.builder';

export class CourseLessonFactory {
  static default(): CourseLessonDomain {
    return new CourseLessonBuilder().build();
  }

  static withId(id: string): CourseLessonDomain {
    return new CourseLessonBuilder().withId(id).build();
  }

  static titled(title: string): CourseLessonDomain {
    return new CourseLessonBuilder().withTitle(title).build();
  }
}
