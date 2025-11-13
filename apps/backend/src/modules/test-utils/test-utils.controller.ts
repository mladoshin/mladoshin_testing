import {
  Controller,
  Post,
  Headers,
  HttpCode,
  HttpStatus,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { TestUtilsService } from './test-utils.service';

@Controller('test')
export class TestUtilsController {
  private readonly logger = new Logger(TestUtilsController.name);

  constructor(private readonly testUtilsService: TestUtilsService) {
    // Ensure this controller only works in test environment
    if (process.env.NODE_ENV !== 'test') {
      throw new Error(
        'TestUtilsController can only be instantiated in test environment',
      );
    }
  }

  /**
   * Creates a new isolated test schema
   * POST /api/test/create-schema
   * Header: X-Test-Schema: schema_name
   */
  @Post('create-schema')
  @HttpCode(HttpStatus.CREATED)
  async createSchema(
    @Headers('x-test-schema') schemaName: string,
  ): Promise<{ message: string; schema: string }> {
    this.validateEnvironment();
    this.validateSchemaName(schemaName);

    this.logger.log(`Request to create schema: ${schemaName}`);

    await this.testUtilsService.createSchema(schemaName);

    return {
      message: 'Schema created successfully',
      schema: schemaName,
    };
  }

  /**
   * Drops an isolated test schema
   * POST /api/test/drop-schema
   * Header: X-Test-Schema: schema_name
   */
  @Post('drop-schema')
  @HttpCode(HttpStatus.OK)
  async dropSchema(
    @Headers('x-test-schema') schemaName: string,
  ): Promise<{ message: string; schema: string }> {
    this.validateEnvironment();
    this.validateSchemaName(schemaName);

    this.logger.log(`Request to drop schema: ${schemaName}`);

    await this.testUtilsService.dropSchema(schemaName);

    return {
      message: 'Schema dropped successfully',
      schema: schemaName,
    };
  }

  /**
   * Resets all tables in a schema (TRUNCATE)
   * POST /api/test/reset-schema
   * Header: X-Test-Schema: schema_name
   */
  @Post('reset-schema')
  @HttpCode(HttpStatus.OK)
  async resetSchema(
    @Headers('x-test-schema') schemaName: string,
  ): Promise<{ message: string; schema: string }> {
    this.validateEnvironment();
    this.validateSchemaName(schemaName);

    this.logger.log(`Request to reset schema: ${schemaName}`);

    await this.testUtilsService.resetSchema(schemaName);

    return {
      message: 'Schema reset successfully',
      schema: schemaName,
    };
  }

  /**
   * Validates that the endpoint is only called in test environment
   */
  private validateEnvironment(): void {
    if (process.env.NODE_ENV !== 'test') {
      throw new ForbiddenException(
        'Test utilities are only available in test environment',
      );
    }
  }

  /**
   * Validates schema name format
   */
  private validateSchemaName(schemaName: string): void {
    if (!schemaName) {
      throw new BadRequestException(
        'X-Test-Schema header is required',
      );
    }

    // Validate schema name format (alphanumeric and underscores only)
    if (!/^[a-zA-Z0-9_]+$/.test(schemaName)) {
      throw new BadRequestException(
        'Schema name must contain only alphanumeric characters and underscores',
      );
    }

    // Prevent dropping public or system schemas
    const forbiddenSchemas = ['public', 'pg_catalog', 'information_schema', 'pg_toast'];
    if (forbiddenSchemas.includes(schemaName.toLowerCase())) {
      throw new BadRequestException(
        `Cannot manipulate system schema: ${schemaName}`,
      );
    }
  }
}
