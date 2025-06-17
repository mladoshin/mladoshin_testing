import { CourseResponse } from '../course/course.response.dto';

export interface LessonResponse {
  id: string;
  title: string;
  content: string;
  date: string;
  course: CourseResponse;
  course_id: string;
}
