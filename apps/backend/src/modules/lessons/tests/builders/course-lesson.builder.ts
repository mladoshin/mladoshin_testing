import { CourseDomainBuilder } from 'src/modules/courses/tests/builders/course-domain.builder';
import { CourseLessonDomain } from '../../domains/lesson.domain';
import { CreateLessonDto } from '../../dto/create-lesson.dto';
import { UpdateLessonDto } from '../../dto/update-lesson.dto';

export class CourseLessonBuilder {
  private lesson: CourseLessonDomain;

  constructor() {
    this.lesson = {
      id: 'lesson-1',
      title: 'Default lesson',
      content: 'Default content of lesson',
      date: new Date().toISOString(),
      duration: 60,
      course_id: 'course-1',
      course: new CourseDomainBuilder().build(),
    };
  }

  withId(id: string): CourseLessonBuilder {
    this.lesson.id = id;
    return this;
  }

  withTitle(title: string): CourseLessonBuilder {
    this.lesson.title = title;
    return this;
  }

  withContent(content: string): CourseLessonBuilder {
    this.lesson.content = content;
    return this;
  }

  withCourseId(courseId: string): CourseLessonBuilder {
    this.lesson.course_id = courseId;
    return this;
  }

  build(): CourseLessonDomain {
    return { ...this.lesson };
  }

  buildCreateDto(): CreateLessonDto {
    return {
      course_id: this.lesson.course_id,
      title: this.lesson.title,
      content: this.lesson.content,
      date: this.lesson.date,
      duration: this.lesson.duration,
    };
  }

  buildUpdateDto(): UpdateLessonDto {
    return {
      title: this.lesson.title,
      content: this.lesson.content,
      date: this.lesson.date,
      duration: this.lesson.duration,
    };
  }
}
