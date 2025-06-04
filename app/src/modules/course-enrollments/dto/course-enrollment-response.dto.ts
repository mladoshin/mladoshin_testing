import { NotFoundException } from '@nestjs/common';
import { instanceToPlain } from 'class-transformer';
import { CourseEnrollment } from '../entities/course-enrollment.entity';

export class CourseEnrollmentResponse {
  constructor(course: CourseEnrollment) {
    const rest = instanceToPlain(course) as CourseEnrollment;
    Object.assign(this, rest);
  }

  static make(course: CourseEnrollment | null): CourseEnrollmentResponse {
    if (!course) {
      throw new NotFoundException('Пользователь не найден');
    }

    return new CourseEnrollmentResponse(course);
  }

  static collection(courses: CourseEnrollment[]): CourseEnrollmentResponse[] {
    return courses.map((course) => new CourseEnrollmentResponse(course));
  }
}
