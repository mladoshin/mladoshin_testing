import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { getCurrentSchema } from '../middleware/schema-context';

/**
 * Interceptor that sets PostgreSQL search_path based on schema context
 * This ensures all database queries in the request use the correct schema
 */
@Injectable()
export class SchemaInterceptor implements NestInterceptor {
  private readonly logger = new Logger(SchemaInterceptor.name);

  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const schema = getCurrentSchema();

    // Only set search_path if not using default public schema
    if (schema !== 'public' && process.env.NODE_ENV === 'test') {
      const queryRunner = this.dataSource.createQueryRunner();

      try {
        // Set search_path for this connection
        await queryRunner.query(`SET search_path TO "${schema}"`);
        this.logger.debug(`Set search_path to: ${schema}`);

        // Store query runner for cleanup
        const request = context.switchToHttp().getRequest();
        request.schemaQueryRunner = queryRunner;

        return next.handle().pipe(
          tap({
            finalize: async () => {
              try {
                await queryRunner.release();
                this.logger.debug(`Released connection for schema: ${schema}`);
              } catch (error) {
                this.logger.error('Error releasing query runner:', error);
              }
            },
          }),
        );
      } catch (error) {
        this.logger.error(`Error setting search_path to ${schema}:`, error);
        await queryRunner.release();
      }
    }

    return next.handle();
  }
}
