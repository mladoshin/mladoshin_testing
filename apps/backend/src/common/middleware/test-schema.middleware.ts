import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { schemaContext } from './schema-context';

/**
 * Middleware to handle PostgreSQL schema isolation for tests
 * Intercepts X-Test-Schema header and stores it in AsyncLocalStorage
 */
@Injectable()
export class TestSchemaMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TestSchemaMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    const schemaName = req.headers['x-test-schema'] as string;

    // If no schema header is present, use default public schema
    if (!schemaName) {
      return next();
    }

    // Only allow schema switching in test environment
    if (process.env.NODE_ENV !== 'test') {
      this.logger.warn(
        'Attempted to use X-Test-Schema header in non-test environment',
      );
      return next();
    }

    // Validate schema name format
    if (!/^[a-zA-Z0-9_]+$/.test(schemaName)) {
      this.logger.error(`Invalid schema name format: ${schemaName}`);
      return next();
    }

    this.logger.debug(`Setting schema context to: ${schemaName}`);

    // Run the rest of the request within the schema context
    schemaContext.run({ schema: schemaName }, () => {
      next();
    });
  }
}
