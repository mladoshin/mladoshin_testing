import { ConfigService } from '@nestjs/config';
import { CourseEnrollment } from 'src/modules/course-enrollments/entities/course-enrollment.entity';
import { Course } from 'src/modules/courses/entities/course.entity';
import { CourseLesson } from 'src/modules/lessons/entities/course-lesson.entity';
import { Payment } from 'src/modules/payments/entities/payment.entity';
import { UserAvailability } from 'src/modules/user-availability/entities/user-availability.entity';
import { UserSchedule } from 'src/modules/user-schedule/entities/user-schedule.entity';
import { UserProfile } from 'src/modules/users/entities/user-profile.entity';
import { User } from 'src/modules/users/entities/user.entity';

import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource, DataSourceOptions } from 'typeorm';
export function getTestingDatabaseConfig(
  configService: ConfigService,
): TypeOrmModuleOptions {
  return {
    host: configService.getOrThrow('POSTGRES_HOST'),
    port: configService.getOrThrow('POSTGRES_PORT'),
    password: configService.getOrThrow('POSTGRES_PASSWORD'),
    username: configService.getOrThrow('POSTGRES_USER'),
    database: configService.getOrThrow('POSTGRES_DB'),
    type: 'postgres',
    entities: [
      User,
      CourseEnrollment,
      Course,
      CourseLesson,
      Payment,
      UserProfile,
      UserAvailability,
      UserSchedule,
    ],
    synchronize: true,
    dropSchema: true, // IMPORTANT: resets DB for each run
  };
}

export async function createTestingSchema(configService: ConfigService, schemaName: string): Promise<void> {
  const tmpDataSource = new DataSource(
    createTestingDataSourceOptions(configService),
  );

  await tmpDataSource.initialize();
  await tmpDataSource.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}";`);
  await tmpDataSource.destroy();
}

export function createTestingDataSourceOptions(
  configService: ConfigService,
): DataSourceOptions {
  return {
    type: 'postgres',
    host: configService.getOrThrow('POSTGRES_HOST'),
    port: configService.getOrThrow('POSTGRES_PORT'),
    username: configService.getOrThrow('POSTGRES_USER'),
    password: configService.getOrThrow('POSTGRES_PASSWORD'),
    database: configService.getOrThrow('POSTGRES_DB'),
  };
}

export function getDurationInMinutes(
  startTime: string,
  endTime: string,
): number {
  const [sh, sm, ss] = startTime.split(':').map(Number);
  const [eh, em, es] = endTime.split(':').map(Number);

  const startDate = new Date(2000, 0, 1, sh, sm, ss);
  const endDate = new Date(2000, 0, 1, eh, em, es);

  const diffMs = endDate.getTime() - startDate.getTime();
  return diffMs / 60000; // миллисекунды → минуты
}
