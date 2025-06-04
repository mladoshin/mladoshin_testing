import { ConfigService } from '@nestjs/config';
import { CourseEnrollment } from 'src/modules/course-enrollments/entities/course-enrollment.entity';
import { Course } from 'src/modules/courses/entities/course.entity';
import { CourseLesson } from 'src/modules/lessons/entities/course-lesson.entity';
import { Payment } from 'src/modules/payments/entities/payment.entity';
import { UserProfile } from 'src/modules/users/entities/user-profile.entity';
import { User } from 'src/modules/users/entities/user.entity';

export function getTestingDatabaseConfig(configService: ConfigService) {
  return {
    host: configService.getOrThrow('POSTGRES_HOST'),
    port: configService.getOrThrow('POSTGRES_PORT'),
    password: configService.getOrThrow('POSTGRES_PASSWORD'),
    username: configService.getOrThrow('POSTGRES_USER'),
    database: configService.getOrThrow('POSTGRES_DB'),
    type: 'postgres',
    entities: [User, CourseEnrollment, Course, CourseLesson, Payment, UserProfile],
    synchronize: true,
    dropSchema: true, // IMPORTANT: resets DB for each run
  };
}
