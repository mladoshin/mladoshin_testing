import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CourseEnrollment } from './entities/course-enrollment.entity';
import { CourseEnrollmentRepo } from './course-enrollments.repository';
import { User } from '../users/entities/user.entity';
import { Course } from '../courses/entities/course.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CourseEnrollment, User, Course])],
  providers: [
    { provide: 'ICourseEnrollmentRepo', useClass: CourseEnrollmentRepo },
  ],
  exports: ['ICourseEnrollmentRepo'],
})
export class CourseEnrollmentsModule {}
