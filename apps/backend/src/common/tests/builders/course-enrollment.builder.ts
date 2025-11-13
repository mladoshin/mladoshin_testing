import { CourseEnrollment } from 'src/modules/course-enrollments/entities/course-enrollment.entity';
import { CourseEnrollmentStatus } from 'src/modules/course-enrollments/types/course-enrollments.types';
import { v4 as uuidv4 } from 'uuid';

export class CourseEnrollmentBuilder {
  private courseEnrollment: CourseEnrollment;

  constructor() {
    const now = new Date();
    this.courseEnrollment = {
      id: uuidv4(),
      course_id: uuidv4(),
      user_id: uuidv4(),
      status: CourseEnrollmentStatus.NEW,
      created_at: now,
    };
  }

  withOverrides(overrides?: Partial<CourseEnrollment>){
    this.courseEnrollment = {
        ...this.courseEnrollment,
        ...overrides
    }
    return this;
  }

  withId(id: string): this {
    this.courseEnrollment.id = id;
    return this;
  }

  withCourseId(courseId: string): this {
    this.courseEnrollment.course_id = courseId;
    return this;
  }

  withUserId(userId: string): this {
    this.courseEnrollment.user_id = userId;
    return this;
  }

  withStatus(status: CourseEnrollmentStatus): this {
    this.courseEnrollment.status = status;
    return this;
  }

  build(): CourseEnrollment {
    return this.courseEnrollment;
  }
}
