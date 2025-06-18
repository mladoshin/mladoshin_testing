import { Module } from '@nestjs/common';
import { CoursesModule } from 'src/modules/courses/courses.module';
import {
  CourseCommands,
  CreateCourseCommand,
  GetCourseCommand,
  ListCourseCommand,
  ListCourseEnrollmentsCommand,
  PurchaseCourseCommand,
  RegisterCourseCommand,
  RemoveCourseCommand,
  UpdateCourseCommand,
} from './commands/course.commands';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppService } from 'src/app.service';
import { BcryptService } from 'src/common/services/HashService';
import { TokenService } from 'src/common/services/TokenService';
import { LessonsModule } from 'src/modules/lessons/lessons.module';
import { PaymentsModule } from 'src/modules/payments/payments.module';
import { UsersModule } from 'src/modules/users/users.module';
import { AuthModule } from 'src/modules/auth/auth.module';
import { AppController } from 'src/app.controller';
import { CoursesService } from 'src/modules/courses/courses.service';
import {
  CreateLessonCommand,
  GetLessonCommand,
  LessonCommands,
  ListLessonCommand,
  RemoveLessonCommand,
  UpdateLessonCommand,
} from './commands/lesson.commands';
import {
  CheckUserCommand,
  LoginUserCommand,
  RegisterUserCommand,
} from './commands/auth.command';
import {
  CreateUserCommand,
  ListUsersCommand,
  RemoveUserCommand,
  ShowUserCommand,
  UpdateUserCommand,
} from './commands/user.command';
import {
  CreatePaymentCommand,
  GetPaymentCommand,
  ListPaymentsCommand,
  RemovePaymentCommand,
  UpdatePaymentCommand,
} from './commands/payment.command';
import { AppLoggerModule } from 'src/common/logging/log.module';
import { ErrorLoggerInterceptor } from 'src/common/logging/error-logger.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '/Users/maksimladosin/Documents/BMSTU/PPO/apps/backend/.env',
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.getOrThrow('POSTGRES_HOST'),
        port: configService.getOrThrow('POSTGRES_PORT'),
        password: configService.getOrThrow('POSTGRES_PASSWORD'),
        username: configService.getOrThrow('POSTGRES_USER'),
        database: configService.getOrThrow('POSTGRES_DB'),
        autoLoadEntities: true,
        logging: true,
        entities: [
          '/Users/maksimladosin/Documents/BMSTU/PPO/app/**/*.entity{.ts,.js}',
        ],
        synchronize: true, // Set to false in production
      }),
    }),
    CoursesModule,
    LessonsModule,
    AuthModule,
    UsersModule,
    PaymentsModule,
    AppLoggerModule,
  ],
  providers: [
    //Course
    CourseCommands,
    ListCourseCommand,
    CreateCourseCommand,
    UpdateCourseCommand,
    RemoveCourseCommand,
    PurchaseCourseCommand,
    RegisterCourseCommand,
    ListCourseEnrollmentsCommand,

    //Lesson
    LessonCommands,
    ListLessonCommand,
    GetLessonCommand,
    CreateLessonCommand,
    UpdateLessonCommand,
    RemoveLessonCommand,

    //Auth
    RegisterUserCommand,
    LoginUserCommand,
    CheckUserCommand,

    //User
    CreateUserCommand,
    ListUsersCommand,
    ShowUserCommand,
    UpdateUserCommand,
    RemoveUserCommand,

    //Payment
    ListPaymentsCommand,
    CreatePaymentCommand,
    GetPaymentCommand,
    UpdatePaymentCommand,
    RemovePaymentCommand,
    ErrorLoggerInterceptor,
  ],
})
export class ConsoleModule {
  constructor() {
    console.log('Console module initialized');
  }
}
