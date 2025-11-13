import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Create enums (with IF NOT EXISTS to avoid conflicts in shared schemas)
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "user_role_enum" AS ENUM('user', 'admin');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "course_enrollment_status_enum" AS ENUM('new', 'waiting_for_payment', 'paid');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create user_profile table
    await queryRunner.query(`
      CREATE TABLE "user_profile" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "first_name" character varying(64) NOT NULL,
        "last_name" character varying(64) NOT NULL,
        "bio" character varying(300),
        CONSTRAINT "PK_user_profile" PRIMARY KEY ("id")
      )
    `);

    // Create user table
    await queryRunner.query(`
      CREATE TABLE "user" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "email" character varying(128) NOT NULL,
        "password" character varying(128) NOT NULL,
        "role" "user_role_enum" NOT NULL DEFAULT 'user',
        "profile_id" uuid,
        CONSTRAINT "UQ_user_email" UNIQUE ("email"),
        CONSTRAINT "PK_user" PRIMARY KEY ("id")
      )
    `);

    // Create course table
    await queryRunner.query(`
      CREATE TABLE "course" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "price" double precision NOT NULL DEFAULT 0,
        "name" text NOT NULL,
        "date_start" TIMESTAMP WITH TIME ZONE NOT NULL,
        "date_finish" TIMESTAMP WITH TIME ZONE NOT NULL,
        CONSTRAINT "PK_course" PRIMARY KEY ("id")
      )
    `);

    // Create course_lesson table
    await queryRunner.query(`
      CREATE TABLE "course_lesson" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "title" character varying(256) NOT NULL,
        "content" text NOT NULL,
        "date" TIMESTAMP WITH TIME ZONE NOT NULL,
        "course_id" uuid NOT NULL,
        "duration" integer NOT NULL DEFAULT 0,
        CONSTRAINT "PK_course_lesson" PRIMARY KEY ("id")
      )
    `);

    // Create payment table
    await queryRunner.query(`
      CREATE TABLE "payment" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "amount" double precision NOT NULL,
        "course_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        CONSTRAINT "PK_payment" PRIMARY KEY ("id")
      )
    `);

    // Create course_enrollment table
    await queryRunner.query(`
      CREATE TABLE "course_enrollment" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "course_id" uuid NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "status" "course_enrollment_status_enum" NOT NULL DEFAULT 'new',
        CONSTRAINT "UQ_course_enrollment_user_course" UNIQUE ("user_id", "course_id"),
        CONSTRAINT "PK_course_enrollment" PRIMARY KEY ("id")
      )
    `);

    // Create user_availability table
    await queryRunner.query(`
      CREATE TABLE "user_availability" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "course_id" uuid NOT NULL,
        "week_day" smallint NOT NULL,
        "start_time" time NOT NULL,
        "end_time" time NOT NULL,
        CONSTRAINT "PK_user_availability" PRIMARY KEY ("id")
      )
    `);

    // Create user_schedule table
    await queryRunner.query(`
      CREATE TABLE "user_schedule" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "course_id" uuid NOT NULL,
        "lesson_id" uuid NOT NULL,
        "scheduled_date" date NOT NULL,
        "start_time" time NOT NULL,
        "end_time" time NOT NULL,
        "duration" integer NOT NULL,
        CONSTRAINT "PK_user_schedule" PRIMARY KEY ("id")
      )
    `);

    // Add foreign keys
    await queryRunner.query(`
      ALTER TABLE "user"
      ADD CONSTRAINT "FK_user_profile"
      FOREIGN KEY ("profile_id")
      REFERENCES "user_profile"("id")
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "course_lesson"
      ADD CONSTRAINT "FK_course_lesson_course"
      FOREIGN KEY ("course_id")
      REFERENCES "course"("id")
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "payment"
      ADD CONSTRAINT "FK_payment_course"
      FOREIGN KEY ("course_id")
      REFERENCES "course"("id")
      ON DELETE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "payment"
      ADD CONSTRAINT "FK_payment_user"
      FOREIGN KEY ("user_id")
      REFERENCES "user"("id")
      ON DELETE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "course_enrollment"
      ADD CONSTRAINT "FK_course_enrollment_user"
      FOREIGN KEY ("user_id")
      REFERENCES "user"("id")
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "course_enrollment"
      ADD CONSTRAINT "FK_course_enrollment_course"
      FOREIGN KEY ("course_id")
      REFERENCES "course"("id")
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "user_availability"
      ADD CONSTRAINT "FK_user_availability_user"
      FOREIGN KEY ("user_id")
      REFERENCES "user"("id")
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "user_availability"
      ADD CONSTRAINT "FK_user_availability_course"
      FOREIGN KEY ("course_id")
      REFERENCES "course"("id")
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "user_schedule"
      ADD CONSTRAINT "FK_user_schedule_user"
      FOREIGN KEY ("user_id")
      REFERENCES "user"("id")
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "user_schedule"
      ADD CONSTRAINT "FK_user_schedule_course"
      FOREIGN KEY ("course_id")
      REFERENCES "course"("id")
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "user_schedule"
      ADD CONSTRAINT "FK_user_schedule_lesson"
      FOREIGN KEY ("lesson_id")
      REFERENCES "course_lesson"("id")
      ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    await queryRunner.query(`ALTER TABLE "user_schedule" DROP CONSTRAINT "FK_user_schedule_lesson"`);
    await queryRunner.query(`ALTER TABLE "user_schedule" DROP CONSTRAINT "FK_user_schedule_course"`);
    await queryRunner.query(`ALTER TABLE "user_schedule" DROP CONSTRAINT "FK_user_schedule_user"`);
    await queryRunner.query(`ALTER TABLE "user_availability" DROP CONSTRAINT "FK_user_availability_course"`);
    await queryRunner.query(`ALTER TABLE "user_availability" DROP CONSTRAINT "FK_user_availability_user"`);
    await queryRunner.query(`ALTER TABLE "course_enrollment" DROP CONSTRAINT "FK_course_enrollment_course"`);
    await queryRunner.query(`ALTER TABLE "course_enrollment" DROP CONSTRAINT "FK_course_enrollment_user"`);
    await queryRunner.query(`ALTER TABLE "payment" DROP CONSTRAINT "FK_payment_user"`);
    await queryRunner.query(`ALTER TABLE "payment" DROP CONSTRAINT "FK_payment_course"`);
    await queryRunner.query(`ALTER TABLE "course_lesson" DROP CONSTRAINT "FK_course_lesson_course"`);
    await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "FK_user_profile"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE "user_schedule"`);
    await queryRunner.query(`DROP TABLE "user_availability"`);
    await queryRunner.query(`DROP TABLE "course_enrollment"`);
    await queryRunner.query(`DROP TABLE "payment"`);
    await queryRunner.query(`DROP TABLE "course_lesson"`);
    await queryRunner.query(`DROP TABLE "course"`);
    await queryRunner.query(`DROP TABLE "user"`);
    await queryRunner.query(`DROP TABLE "user_profile"`);

    // Drop enums
    await queryRunner.query(`DROP TYPE "course_enrollment_status_enum"`);
    await queryRunner.query(`DROP TYPE "user_role_enum"`);
  }
}
