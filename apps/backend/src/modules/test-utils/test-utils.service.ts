import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class TestUtilsService {
  private readonly logger = new Logger(TestUtilsService.name);

  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  /**
   * Creates a new isolated PostgreSQL schema and runs migrations on it
   */
  async createSchema(schemaName: string): Promise<void> {
    this.logger.log(`Creating schema: ${schemaName}`);

    const queryRunner = this.dataSource.createQueryRunner();

    try {
      // Enable UUID extension globally (if not already enabled)
      // Use advisory lock to prevent race conditions when multiple tests run in parallel
      await queryRunner.query(`SELECT pg_advisory_lock(12345)`);
      try {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
      } finally {
        await queryRunner.query(`SELECT pg_advisory_unlock(12345)`);
      }

      // Create the schema with retry logic for race conditions
      await this.createSchemaWithRetry(queryRunner, schemaName, 3);
      this.logger.log(`Schema ${schemaName} created`);

      // Set search path to the new schema and public for extensions
      await queryRunner.query(`SET search_path TO "${schemaName}", public`);

      // Run migrations in the new schema using the same queryRunner
      await this.runMigrationsInSchema(schemaName, queryRunner);

      this.logger.log(`Schema ${schemaName} initialized successfully`);
    } catch (error) {
      this.logger.error(`Failed to create schema ${schemaName}:`, error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Creates schema with retry logic to handle race conditions
   */
  private async createSchemaWithRetry(
    queryRunner: any,
    schemaName: string,
    retries: number,
  ): Promise<void> {
    for (let i = 0; i < retries; i++) {
      try {
        await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
        return;
      } catch (error: any) {
        // If it's the last retry or not a lock/concurrency error, throw
        if (i === retries - 1 || !this.isRetryableError(error)) {
          throw error;
        }
        // Wait a bit before retry with exponential backoff
        const delay = Math.pow(2, i) * 100;
        this.logger.warn(
          `Schema creation attempt ${i + 1} failed, retrying in ${delay}ms...`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  /**
   * Checks if error is retryable (lock timeout, deadlock, etc.)
   */
  private isRetryableError(error: any): boolean {
    const retryableCodes = ['40001', '40P01', '55P03']; // serialization_failure, deadlock_detected, lock_not_available
    return error.code && retryableCodes.includes(error.code);
  }

  /**
   * Drops an isolated PostgreSQL schema
   */
  async dropSchema(schemaName: string): Promise<void> {
    this.logger.log(`Dropping schema: ${schemaName}`);

    const queryRunner = this.dataSource.createQueryRunner();

    try {
      // Drop the schema with CASCADE to remove all objects
      await queryRunner.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
      this.logger.log(`Schema ${schemaName} dropped successfully`);
    } catch (error) {
      this.logger.error(`Failed to drop schema ${schemaName}:`, error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Resets all tables in a schema by truncating them
   */
  async resetSchema(schemaName: string): Promise<void> {
    this.logger.log(`Resetting schema: ${schemaName}`);

    const queryRunner = this.dataSource.createQueryRunner();

    try {
      // Set search path to the target schema
      await queryRunner.query(`SET search_path TO "${schemaName}"`);

      // Get all table names in the schema (using parameterized query)
      const tables = await queryRunner.query(
        `
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = $1
        AND tablename NOT LIKE 'pg_%'
        AND tablename != 'migrations'
      `,
        [schemaName],
      );

      // Truncate all tables
      if (tables.length > 0) {
        const tableNames = tables.map((t: any) => `"${t.tablename}"`).join(', ');
        await queryRunner.query(`TRUNCATE TABLE ${tableNames} RESTART IDENTITY CASCADE`);
        this.logger.log(`Truncated ${tables.length} tables in schema ${schemaName}`);
      }
    } catch (error) {
      this.logger.error(`Failed to reset schema ${schemaName}:`, error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Runs migrations in a specific schema
   */
  private async runMigrationsInSchema(schemaName: string, queryRunner: any): Promise<void> {
    try {
      // Search path is already set by the caller

      // Create migrations table if it doesn't exist
      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS "migrations" (
          "id" SERIAL PRIMARY KEY,
          "timestamp" bigint NOT NULL,
          "name" character varying NOT NULL
        )
      `);

      // Get all migration files
      const migrations = this.dataSource.migrations;

      for (const migration of migrations) {
        const migrationName = migration.constructor.name;
        const timestamp = this.extractTimestampFromName(migrationName);

        // Check if migration was already run
        const executed = await queryRunner.query(
          `SELECT * FROM "migrations" WHERE "name" = $1`,
          [migrationName],
        );

        if (executed.length === 0) {
          this.logger.log(`Running migration ${migrationName} in schema ${schemaName}`);
          await migration.up(queryRunner);

          // Record migration as executed
          await queryRunner.query(
            `INSERT INTO "migrations" ("timestamp", "name") VALUES ($1, $2)`,
            [timestamp, migrationName],
          );
        }
      }

      this.logger.log(`Migrations completed in schema ${schemaName}`);
    } catch (error) {
      this.logger.error(`Failed to run migrations in schema ${schemaName}:`, error);
      throw error;
    }
  }

  /**
   * Extracts timestamp from migration class name
   */
  private extractTimestampFromName(name: string): number {
    const match = name.match(/\d+/);
    return match ? parseInt(match[0], 10) : Date.now();
  }
}
