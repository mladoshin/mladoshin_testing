import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import {
  RepositoryNotFoundError,
  RepositoryUnknownError,
} from 'src/common/errors/db-errors';
import { AppLoggerModule } from 'src/common/logging/log.module';
import { UserBuilder } from 'src/common/tests/builders/user.builder';
import { UserObjectMother } from 'src/common/tests/object-mothers/user-object-mother';
import {
  createTestingSchema,
  getTestingDatabaseConfig,
} from 'src/common/utils/utils';
import { DataSource, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { UsersModule } from '../../users.module';
import { IUsersService } from '../../users.service';
import { User } from '../../entities/user.entity';
import { UserProfile } from '../../entities/user-profile.entity';
import { CreateUserDto } from '../../dto/create-user.dto';
import { UpdateUserDto } from '../../dto/update-user.dto';

describe('UsersService (Integration)', () => {
  let service: IUsersService;
  let dataSource: DataSource;
  let user: User;
  let userRepo: Repository<User>;
  let profileRepo: Repository<UserProfile>;
  let schemaName: string;

  beforeAll(async () => {
    if (process.env.IS_OFFLINE === 'true') {
      throw new Error('Cannot run integration tests in offline mode');
    }
    schemaName = `test_schema_${uuidv4().replace(/-/g, '')}`;

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
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
        UsersModule,
        AppLoggerModule,
      ],
    }).compile();

    dataSource = module.get(DataSource);
    service = module.get<IUsersService>('IUsersService');

    userRepo = dataSource.getRepository(User);
    profileRepo = dataSource.getRepository(UserProfile);
  });

  afterAll(async () => {
    await dataSource.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE;`);
    await dataSource.destroy();
  });

  beforeEach(async () => {
    const userData = new UserBuilder().withEmail('test@user.com').build();
    const profile = await profileRepo.save(userData.profile);
    user = await userRepo.save({ ...userData, profile });
  });

  afterEach(async () => {
    await dataSource.query(
      `TRUNCATE TABLE "${schemaName}"."payment", "${schemaName}"."course_enrollment", "${schemaName}"."course_lesson", "${schemaName}"."course", "${schemaName}"."user_profile", "${schemaName}"."user" RESTART IDENTITY CASCADE`,
    );
  });

  describe('create', () => {
    it('должен успешно создать пользователя', async () => {
      const dto: CreateUserDto = UserObjectMother.buildCreateDto();
      const createdUser = await service.create(dto);

      expect(createdUser).toBeDefined();
      expect(createdUser.id).toBeDefined();
      expect(createdUser.email).toBe(dto.email);
      expect(createdUser.profile.first_name).toBe(dto.first_name);
      expect(createdUser.profile.last_name).toBe(dto.last_name);
    });

    it('должен выбросить ошибку при создании пользователя с невалидными данными', async () => {
      const dto: CreateUserDto = UserObjectMother.buildCreateDto({
        email: null as any,
      });
      await expect(service.create(dto)).rejects.toThrow(RepositoryUnknownError);
    });
  });

  describe('findAll', () => {
    it('должен вернуть всех пользователей', async () => {
      const users = await service.findAll();

      expect(users).toHaveLength(1);
      expect(users[0].email).toBe(user.email);
    });

    it('должен вернуть пустой массив после удаления всех пользователей', async () => {
      await service.remove(user.id);
      const users = await service.findAll();

      expect(users).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('должен найти пользователя по id', async () => {
      const found = await service.findOne(user.id);

      expect(found).toBeDefined();
      expect(found.id).toBe(user.id);
      expect(found.email).toBe(user.email);
    });

    it('должен выбросить ошибку если пользователь не найден', async () => {
      await expect(service.findOne(uuidv4())).rejects.toThrow(
        RepositoryNotFoundError,
      );
    });
  });

  describe('update', () => {
    it('должен успешно обновить пользователя', async () => {
      const dto: UpdateUserDto = UserObjectMother.buildUpdateDto({
        first_name: 'Обновленное Имя',
        email: 'updated@email.com',
      });
      const updated = await service.update(user.id, dto);

      expect(updated.email).toBe(dto.email);
      expect(updated.profile.first_name).toBe(dto.first_name);
    });

    it('должен выбросить ошибку при обновлении несуществующего пользователя', async () => {
      const dto: UpdateUserDto = UserObjectMother.buildUpdateDto();
      await expect(service.update(uuidv4(), dto)).rejects.toThrow(
        RepositoryNotFoundError,
      );
    });
  });

  describe('remove', () => {
    it('должен успешно удалить пользователя', async () => {
      const removed = await service.remove(user.id);

      expect(removed).toBeDefined();
      expect(removed.id).toBe(user.id);

      await expect(service.findOne(user.id)).rejects.toThrow(
        RepositoryNotFoundError,
      );
    });

    it('должен выбросить ошибку при удалении несуществующего пользователя', async () => {
      await expect(service.remove(uuidv4())).rejects.toThrow(
        RepositoryNotFoundError,
      );
    });
  });
});
