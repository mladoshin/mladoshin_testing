import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ErrorLoggerInterceptor } from './common/logging/error-logger.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  const errorLoggerInterceptor = app.get(ErrorLoggerInterceptor);
  app.useGlobalInterceptors(errorLoggerInterceptor)

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
