import { CourseDomain } from 'src/modules/courses/domains/course.domain';
import { CourseLessonDomain } from 'src/modules/lessons/domains/lesson.domain';
import { UserDomain } from 'src/modules/users/domains/user.domain';

export class UserScheduleDomain {
  id: string;
  user?: UserDomain | null;
  user_id: string;
  course?: CourseDomain | null;
  course_id: string;
  lesson?: CourseLessonDomain | null;
  lesson_id: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  duration: number;
}
