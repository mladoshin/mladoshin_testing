import { CourseLesson } from 'src/modules/lessons/entities/course-lesson.entity';
import { Course } from 'src/modules/courses/entities/course.entity';
import { v4 as uuidv4 } from 'uuid';

export class CourseLessonBuilder {
  private readonly lesson: CourseLesson;

  constructor() {
    const courseId = uuidv4();

    this.lesson = {
      id: uuidv4(),
      title: 'Lesson title',
      content: 'Lesson content',
      date: new Date().toISOString(),
      duration: 60,
      course_id: courseId,
      course: {} as Course,
    };
  }

  withId(id: string): this {
    this.lesson.id = id;
    return this;
  }

  withTitle(title: string): this {
    this.lesson.title = title;
    return this;
  }

  withContent(content: string): this {
    this.lesson.content = content;
    return this;
  }

  withDate(date: string): this {
    this.lesson.date = date;
    return this;
  }

  withDuration(minutes: number): this {
    this.lesson.duration = minutes;
    return this;
  }

  withCourseId(courseId: string): this {
    this.lesson.course_id = courseId;
    return this;
  }

  build(): CourseLesson {
    return this.lesson;
  }
}
