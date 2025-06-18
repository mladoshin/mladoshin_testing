import { CourseEntity } from "./course.entity";

export interface CourseLessonEntity {
  id: string;
  title: string;
  content: string;
  date: string;
  course: CourseEntity | null;
  course_id: string;
}
