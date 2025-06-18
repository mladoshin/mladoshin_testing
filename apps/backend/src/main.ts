import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ErrorLoggerInterceptor } from './common/logging/error-logger.interceptor';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );

  const errorLoggerInterceptor = app.get(ErrorLoggerInterceptor);
  app.useGlobalInterceptors(errorLoggerInterceptor);
  app.enableCors({
    origin: 'http://localhost:5173',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
