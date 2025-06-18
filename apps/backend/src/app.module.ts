import { Module } from '@nestjs/common';
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
        synchronize: true, // Set to false in production
      }),
    }),
    AuthModule,
    UsersModule,
    CoursesModule,
    PaymentsModule,
    LessonsModule,
    UserAvailabilityModule,
    AppLoggerModule,
  ],
  controllers: [AppController],
  providers: [AppService, BcryptService, TokenService, ErrorLoggerInterceptor],
})
export class AppModule {}
