import { CourseDomain } from './domains/course.domain';
import { Course } from './entities/course.entity';

export class CourseMapper {
  static toDomainEntity(course: Course): CourseDomain {
    return {
      id: course.id,
      price: course.price,
      name: course.name,
      date_start: course.date_start,
      date_finish: course.date_finish,
      lessons: course.lessons,
      payments: course.payments,
      courseEnrollments: course.courseEnrollments,
    };
  }
}
