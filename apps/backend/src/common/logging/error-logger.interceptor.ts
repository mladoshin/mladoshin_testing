// error-logger.interceptor.ts
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Catch,
  ArgumentsHost,
  HttpException,
  InternalServerErrorException,
  Global,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { Observable, catchError, throwError } from 'rxjs';
import { IAppLoggerService } from './log.service';
import { ErrorMapper } from '../errors/error-mapper';

@Injectable()
@Global()
export class ErrorLoggerInterceptor implements NestInterceptor {
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
      catchError((err) => {
        const status = err instanceof HttpException ? err.getStatus() : 500;
        const message = err.message || 'Internal server error';
        const trace = err.stack;

        if (process.env.NODE_ENV !== 'test') {
          this.logger.error(
            `${method} ${url} failed [${status}] - ${message}`,
            trace,
            'ErrorLogger',
          );
        }

        return throwError(() =>
          err instanceof HttpException ? err : ErrorMapper.mapToHTTPError(err),
        );
      }),
    );
  }
}
