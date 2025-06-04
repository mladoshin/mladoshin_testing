import { Global, Module } from '@nestjs/common';
import { AppLoggerService } from './log.service';

@Global()
@Module({
  providers: [
    {
      provide: 'IAppLoggerService',
      useClass: AppLoggerService,
    },
  ],
  exports: ['IAppLoggerService'],
})
export class AppLoggerModule {}
