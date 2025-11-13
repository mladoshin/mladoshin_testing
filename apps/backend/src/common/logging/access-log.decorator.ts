// access-log.decorator.ts
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  applyDecorators,
  UseInterceptors,
  Inject,
  forwardRef,
  LoggerService,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AppLoggerService, IAppLoggerService } from './log.service';

@Injectable()
export class AccessLogInterceptor implements NestInterceptor {
  constructor(
    @Inject(forwardRef(() => 'IAppLoggerService'))
    private readonly logger: IAppLoggerService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const method = req.method;
    const url = req.originalUrl;
    const user = req.user?.id || 'anonymous';
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';

    return next.handle().pipe(
      tap(() => {
        const logLine = `[${method}] ${url} by ${user} from ${ip}`;
        if (process.env.NODE_ENV !== 'test') {
          this.logger.accessLog(logLine);
        }
      }),
    );
  }
}

export function AccessLog() {
  return applyDecorators(UseInterceptors(AccessLogInterceptor));
}
