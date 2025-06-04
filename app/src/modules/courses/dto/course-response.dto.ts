import { NotFoundException } from '@nestjs/common';
import { instanceToPlain } from 'class-transformer';
import { Course } from '../entities/course.entity';

interface CourseResponseWithCommision
  extends Omit<Course, 'lessons' | 'payments' | 'courseEnrollments'> {
  price_with_commission: number;
  commision: number;
}

export class CourseResponse implements CourseResponseWithCommision {
  id: string;
  name: string;
  price: number;
  price_with_commission: number;
  commision: number;
  date_start: string;
  date_finish: string;

  constructor(course: Course) {
    const rest = instanceToPlain(course) as Course;
    Object.assign(this, rest);

    const commission = parseFloat(process.env.COURSE_COMMISION || '1');
    this.price_with_commission = this.price * commission;
    this.commision = commission;
  }

  static make(course: Course | null): CourseResponse {
    if (!course) {
      throw new NotFoundException('Курс не найден');
    }
    return new CourseResponse(course);
  }

  static collection(courses: Course[]): CourseResponse[] {
    return courses.map((course) => new CourseResponse(course));
  }
}
