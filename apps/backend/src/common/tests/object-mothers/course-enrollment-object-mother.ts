import { CourseEnrollment } from 'src/modules/course-enrollments/entities/course-enrollment.entity';
import { CourseEnrollmentStatus } from 'src/modules/course-enrollments/types/course-enrollments.types';
import { CourseEnrollmentBuilder } from '../builders/course-enrollment.builder';

export class CourseEnrollmentObjectMother {
  static buildPaidEnrollment(
    overrides?: Partial<CourseEnrollment>,
  ): CourseEnrollment {
    return new CourseEnrollmentBuilder()
      .withOverrides(overrides)
      .withStatus(CourseEnrollmentStatus.PAID)
      .build();
  }

  static buildNewEnrollment(
    overrides?: Partial<CourseEnrollment>,
  ): CourseEnrollment {
    return new CourseEnrollmentBuilder()
      .withOverrides(overrides)

      .withStatus(CourseEnrollmentStatus.NEW)
      .build();
  }
}
