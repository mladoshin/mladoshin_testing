import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { UserRepo } from '../../users.repository';
import { UserProfile } from '../../entities/user-profile.entity';
import { User } from '../../entities/user.entity';
import { Payment } from 'src/modules/payments/entities/payment.entity';
import { Course } from 'src/modules/courses/entities/course.entity';
import { CourseLesson } from 'src/modules/lessons/entities/course-lesson.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  createTestingSchema,
  getTestingDatabaseConfig,
} from 'src/common/utils/utils';
import { v4 as uuidv4 } from 'uuid';
import {
  RepositoryNotFoundError,
  RepositoryUnknownError,
} from 'src/common/errors/db-errors';
import { UserBuilder } from 'src/common/tests/builders/user.builder';
import { UserObjectMother } from 'src/common/tests/object-mothers/user-object-mother';

describe('UserRepo (integration)', () => {
  let module: TestingModule;
  let userRepo: UserRepo;
  let dataSource: DataSource;
  let user: User;
  let schemaName: string;

  beforeAll(async () => {
    if (process.env.IS_OFFLINE === 'true') {
      throw new Error('Cannot run integration tests in offline mode');
    }
    schemaName = `test_schema_${uuidv4().replace(/-/g, '')}`;

    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [],
          envFilePath: '.env.test',
        }),
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: async (
            configService: ConfigService,
          ): Promise<TypeOrmModuleOptions> => {
            const config = getTestingDatabaseConfig(configService);
            await createTestingSchema(configService, schemaName);
            return { ...config, schema: schemaName };
          },
        }),
        TypeOrmModule.forFeature([
          User,
          UserProfile,
          Payment,
          Course,
          CourseLesson,
        ]),
      ],
      providers: [UserRepo],
    }).compile();

    userRepo = module.get<UserRepo>(UserRepo);
    dataSource = module.get<DataSource>(DataSource);
  });

  beforeEach(async () => {
    const userRepository = dataSource.getRepository(User);
    const profileRepository = dataSource.getRepository(UserProfile);

    const userData = new UserBuilder().withEmail('test@user.com').build();
    const profile = await profileRepository.save(userData.profile);
    user = await userRepository.save({ ...userData, profile });
  });

  afterAll(async () => {
    await dataSource.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE;`);
    await dataSource.destroy();
  });

  afterEach(async () => {
    await dataSource.query(
      `TRUNCATE TABLE "${schemaName}"."payment", "${schemaName}"."course_enrollment", "${schemaName}"."course_lesson", "${schemaName}"."course", "${schemaName}"."user_profile", "${schemaName}"."user" RESTART IDENTITY CASCADE`,
    );
  });

  describe('create', () => {
    it('должен успешно создать пользователя', async () => {
      const dto = UserObjectMother.buildCreateDto();
      const createdUser = await userRepo.create(dto);

      expect(createdUser).toBeDefined();
      expect(createdUser.id).toBeDefined();
      expect(createdUser.email).toBe(dto.email);
      expect(createdUser.profile).toBeDefined();
      expect(createdUser.profile.first_name).toBe(dto.first_name);
      expect(createdUser.profile.last_name).toBe(dto.last_name);
    });

    it('должен выбросить ошибку при создании пользователя с невалидными данными', async () => {
      const dto = UserObjectMother.buildCreateDto({ email: undefined as any });
      await expect(userRepo.create(dto)).rejects.toThrow(
        RepositoryUnknownError,
      );
    });
  });

  describe('findByEmail', () => {
    it('должен найти пользователя по email', async () => {
      const found = await userRepo.findByEmail(user.email);

      expect(found).toBeDefined();
      expect(found?.email).toBe(user.email);
      expect(found?.id).toBe(user.id);
    });

    it('должен вернуть null если пользователь не найден', async () => {
      const found = await userRepo.findByEmail('nonexistent@email.com');
      expect(found).toBeNull();
    });
  });

  describe('findById', () => {
    it('должен найти пользователя по id', async () => {
      const found = await userRepo.findById(user.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(user.id);
      expect(found?.email).toBe(user.email);
    });

    it('должен вернуть null если пользователь не найден', async () => {
      const found = await userRepo.findById(uuidv4());
      expect(found).toBeNull();
    });
  });

  describe('findOrFailById', () => {
    it('должен найти пользователя по id', async () => {
      const found = await userRepo.findOrFailById(user.id);

      expect(found).toBeDefined();
      expect(found.id).toBe(user.id);
      expect(found.email).toBe(user.email);
    });

    it('должен выбросить ошибку если пользователь не найден', async () => {
      await expect(userRepo.findOrFailById(uuidv4())).rejects.toThrow(
        RepositoryNotFoundError,
      );
    });
  });

  describe('findAll', () => {
    it('должен вернуть всех пользователей', async () => {
      const users = await userRepo.findAll();

      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBeGreaterThan(0);
      expect(users[0].profile).toBeDefined();
    });

    it('должен вернуть пустой массив если пользователей нет', async () => {
      await userRepo.delete(user.id);
      const users = await userRepo.findAll();

      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBe(0);
    });
  });

  describe('update', () => {
    it('должен успешно обновить пользователя', async () => {
      const dto = UserObjectMother.buildUpdateDto({
        first_name: 'Обновленное Имя',
        email: 'updated@email.com',
      });
      const updated = await userRepo.update(user.id, dto);

      expect(updated.email).toBe(dto.email);
      expect(updated.profile.first_name).toBe(dto.first_name);
    });

    it('должен выбросить ошибку при обновлении несуществующего пользователя', async () => {
      const dto = UserObjectMother.buildUpdateDto();
      await expect(userRepo.update(uuidv4(), dto)).rejects.toThrow(
        RepositoryNotFoundError,
      );
    });
  });

  describe('delete', () => {
    it('должен успешно удалить пользователя', async () => {
      const deleted = await userRepo.delete(user.id);

      expect(deleted).toBeDefined();
      expect(deleted.id).toBe(user.id);

      const found = await userRepo.findById(user.id);
      expect(found).toBeNull();
    });

    it('должен выбросить ошибку при удалении несуществующего пользователя', async () => {
      await expect(userRepo.delete(uuidv4())).rejects.toThrow(
        RepositoryNotFoundError,
      );
    });
  });
});
