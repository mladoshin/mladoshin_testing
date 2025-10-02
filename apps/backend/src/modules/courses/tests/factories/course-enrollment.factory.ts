import { CourseEnrollmentDomain } from "src/modules/course-enrollments/domains/course-enrollment.domain";
import { CourseEnrollmentStatus } from "../../types/courses.types";

export class CourseEnrollmentFactory {
  static paid(id: string, userId: string, courseId: string): CourseEnrollmentDomain {
    return {
      id,
      user_id: userId,
      course_id: courseId,
      status: CourseEnrollmentStatus.PAID,
      created_at: new Date(),
      user: undefined,
      course: undefined,
    };
  }

  static pending(id: string, userId: string, courseId: string): CourseEnrollmentDomain {
    return {
      id,
      user_id: userId,
      course_id: courseId,
      status: CourseEnrollmentStatus.NEW,
      created_at: new Date(),
      user: undefined,
      course: undefined,
    };
  }
}
