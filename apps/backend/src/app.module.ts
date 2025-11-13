import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CoursesModule } from './modules/courses/courses.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { LessonsModule } from './modules/lessons/lessons.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BcryptService } from './common/services/HashService';
import { TokenService } from './common/services/TokenService';
import { ErrorLoggerInterceptor } from './common/logging/error-logger.interceptor';
import { AppLoggerModule } from './common/logging/log.module';
import { UserAvailabilityModule } from './modules/user-availability/user-availability.module';
import { UserScheduleModule } from './modules/user-schedule/user-schedule.module';
import { TestUtilsModule } from './modules/test-utils/test-utils.module';
import { TestSchemaMiddleware } from './common/middleware/test-schema.middleware';
import { dataSourceOptions } from './database/data-source';

// Dynamically import TestUtilsModule only in test environment
const testModules = process.env.NODE_ENV === 'test' ? [TestUtilsModule] : [];

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        // Only synchronize in development, use migrations in test/production
        synchronize: process.env.NODE_ENV === 'development',
        // Load migrations from data-source
        migrations: dataSourceOptions.migrations,
        // Enable logging in development
        logging: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : false,
      }),
    }),
    AuthModule,
    UsersModule,
    CoursesModule,
    PaymentsModule,
    LessonsModule,
    UserAvailabilityModule,
    UserScheduleModule,
    AppLoggerModule,
    ...testModules,
  ],
  controllers: [AppController],
  providers: [AppService, BcryptService, TokenService, ErrorLoggerInterceptor],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply schema middleware only in test environment
    if (process.env.NODE_ENV === 'test') {
      consumer.apply(TestSchemaMiddleware).forRoutes('*');
    }
  }
}
