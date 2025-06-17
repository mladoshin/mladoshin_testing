import { NotFoundException } from '@nestjs/common';
import { instanceToPlain } from 'class-transformer';
import { CourseEnrollmentDomain } from '../domains/course-enrollment.domain';

export class CourseEnrollmentResponse {
  constructor(course: CourseEnrollmentDomain) {
    const rest = instanceToPlain(course) as CourseEnrollmentDomain;
    Object.assign(this, rest);
  }

  static make(course: CourseEnrollmentDomain | null): CourseEnrollmentResponse {
    if (!course) {
      throw new NotFoundException('Пользователь не найден');
    }

    return new CourseEnrollmentResponse(course);
  }

  static collection(
    courses: CourseEnrollmentDomain[],
  ): CourseEnrollmentResponse[] {
    return courses.map((course) => new CourseEnrollmentResponse(course));
  }
}
