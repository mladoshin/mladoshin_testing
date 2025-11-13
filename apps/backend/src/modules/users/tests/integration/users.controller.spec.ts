import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { UsersController } from '../../users.controller';
import { User } from '../../entities/user.entity';
import { UserProfile } from '../../entities/user-profile.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  createTestingSchema,
  getTestingDatabaseConfig,
} from 'src/common/utils/utils';
import { UsersModule } from '../../users.module';
import { AppLoggerModule } from 'src/common/logging/log.module';
import { UserObjectMother } from 'src/common/tests/object-mothers/user-object-mother';
import { IAuthService } from 'src/modules/auth/auth.service';
import { AuthModule } from 'src/modules/auth/auth.module';
import { UserBuilder } from 'src/common/tests/builders/user.builder';
import { v4 as uuidv4 } from 'uuid';
import { ErrorLoggerInterceptor } from 'src/common/logging/error-logger.interceptor';

describe('UsersController (integration)', () => {
  let module: TestingModule;
  let app: INestApplication;
  let dataSource: DataSource;
  let authService: IAuthService;

  let userRepo: Repository<User>;

  let user: User;
  let token: string;
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
        TypeOrmModule.forFeature([User, UserProfile]),
        AuthModule,
        UsersModule,
        AppLoggerModule,
      ],
      providers: [ErrorLoggerInterceptor],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    const errorLoggerInterceptor = app.get(ErrorLoggerInterceptor);
    app.useGlobalInterceptors(errorLoggerInterceptor);
    await app.init();

    dataSource = module.get<DataSource>(DataSource);
    authService = module.get<IAuthService>('IAuthService');

    // Репозитории
    userRepo = dataSource.getRepository(User);
  });

  afterAll(async () => {
    // Удаляем схему после тестов
    await dataSource.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE;`);
    await app.close();
  });

  beforeEach(async () => {
    // Создаём пользователя через билдер
    const userData = new UserBuilder().withEmail('test@user.com').build();
    user = await userRepo.save(userData);
    const { accessToken } = authService.createTokenPair(user);
    token = `Bearer ${accessToken}`;
  });

  afterEach(async () => {
    await dataSource.query(
      `TRUNCATE TABLE "${schemaName}"."user_profile", "${schemaName}"."user" RESTART IDENTITY CASCADE`,
    );
  });

  // ---------- CREATE ----------
  describe('POST /users', () => {
    it('должен создать пользователя', async () => {
      const dto = UserObjectMother.buildCreateDto({
        email: 'newuser@example.com',
      });

      const res = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', token)
        .send(dto);

      console.log('Response status:', res.status);
      console.log('Response body:', JSON.stringify(res.body, null, 2));

      expect(res.status).toBe(201);
      expect(res.body.email).toBe(dto.email);
      expect(res.body.first_name).toBe(dto.first_name);
      expect(res.body.last_name).toBe(dto.last_name);
      expect(res.body.id).toBeDefined();
    });

    it('должен вернуть ошибку при создании пользователя с дублирующимся email', async () => {
      const dto = UserObjectMother.buildCreateDto({
        email: user.email, // Используем email существующего пользователя
      });

      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', token)
        .send(dto)
        .expect(500);
    });
  });

  // ---------- FIND ALL ----------
  describe('GET /users', () => {
    it('должен вернуть всех пользователей', async () => {
      const res = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', token)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
    });

    it('должен вернуть пустой массив если пользователей нет', async () => {
      await dataSource.query(
        `TRUNCATE TABLE "${schemaName}"."user_profile", "${schemaName}"."user" RESTART IDENTITY CASCADE`,
      );

      const res = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', token)
        .expect(200);

      expect(res.body).toEqual([]);
    });
  });

  // ---------- FIND BY ID ----------
  describe('GET /users/:id', () => {
    it('должен вернуть пользователя по id', async () => {
      const res = await request(app.getHttpServer())
        .get(`/users/${user.id}`)
        .set('Authorization', token)
        .expect(200);

      expect(res.body.id).toBe(user.id);
      expect(res.body.email).toBe(user.email);
    });

    it('должен вернуть 404 для несуществующего пользователя', async () => {
      await request(app.getHttpServer())
        .get(`/users/${uuidv4()}`)
        .set('Authorization', token)
        .expect(404);
    });
  });

  // ---------- UPDATE ----------
  describe('PATCH /users/:id', () => {
    it('должен обновить пользователя', async () => {
      const dto = UserObjectMother.buildUpdateDto({
        first_name: 'Обновленное Имя',
      });

      const res = await request(app.getHttpServer())
        .patch(`/users/${user.id}`)
        .set('Authorization', token)
        .send(dto)
        .expect(200);

      expect(res.body.first_name).toBe(dto.first_name);
    });

    it('должен вернуть 404 при обновлении несуществующего пользователя', async () => {
      const dto = UserObjectMother.buildUpdateDto({
        first_name: 'Обновленное Имя',
      });

      await request(app.getHttpServer())
        .patch(`/users/${uuidv4()}`)
        .set('Authorization', token)
        .send(dto)
        .expect(404);
    });
  });

  // ---------- DELETE ----------
  describe('DELETE /users/:id', () => {
    it('должен удалить пользователя', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/users/${user.id}`)
        .set('Authorization', token)
        .expect(200);

      expect(res.body.id).toBe(user.id);
    });

    it('должен вернуть 404 для несуществующего пользователя', async () => {
      await request(app.getHttpServer())
        .delete(`/users/${uuidv4()}`)
        .set('Authorization', token)
        .expect(404);
    });
  });
});
