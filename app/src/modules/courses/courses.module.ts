import { Module } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CoursesController } from './courses.controller';
import { CourseRepo } from './courses.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Course } from './entities/course.entity';
import { CourseEnrollmentsModule } from '../course-enrollments/course-enrollments.module';
import { TokenService } from 'src/common/services/TokenService';
import { PaymentsModule } from '../payments/payments.module';
import { CourseLessonRepo } from '../lessons/lessons.repository';
import { LessonsModule } from '../lessons/lessons.module';
import { CourseLesson } from '../lessons/entities/course-lesson.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Course, CourseLesson]),
    CourseEnrollmentsModule,
    LessonsModule,
    PaymentsModule,
  ],
  controllers: [CoursesController],
  providers: [
    { provide: 'ICoursesService', useClass: CoursesService },
    { provide: 'ICourseRepo', useClass: CourseRepo },
    { provide: 'ITokenService', useClass: TokenService },
  ],
  exports: ['ICoursesService'],
})
export class CoursesModule {}
