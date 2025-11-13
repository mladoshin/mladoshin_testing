import { CourseMapper } from '../courses/courses.mapper';
import { Course } from '../courses/entities/course.entity';
import { CourseEnrollmentDomain } from './domains/course-enrollment.domain';
import { CourseEnrollment } from './entities/course-enrollment.entity';

export class CourseEnrollementMapper {
  static toDomainEntity(
    courseEnrollment: CourseEnrollment,
  ): CourseEnrollmentDomain {
    return {
      id: courseEnrollment.id,
      user: courseEnrollment.user,
      user_id: courseEnrollment.user_id,
      course: courseEnrollment.course,
      course_id: courseEnrollment.course_id,
      created_at: courseEnrollment.created_at,
      status: courseEnrollment.status,
    };
  }

  static toDatabaseEntity(
    courseEnrollment: CourseEnrollmentDomain,
  ): CourseEnrollment {
    return {
      id: courseEnrollment.id,
      user: courseEnrollment.user,
      user_id: courseEnrollment.user_id,
      course: courseEnrollment.course as Course,
      course_id: courseEnrollment.course_id,
      created_at: courseEnrollment.created_at,
      status: courseEnrollment.status,
    };
  }
}
