import { CourseDomain } from "src/modules/courses/domains/course.domain";

export class CourseLessonDomain {
  id: string;
  title: string;
  content: string;
  date: string;
  course: CourseDomain;
  course_id: string;
  duration: number;
}
