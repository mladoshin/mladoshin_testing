import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppLoggerModule } from 'src/common/logging/log.module';
import { AuthObjectMother } from 'src/common/tests/object-mothers/auth-object-mother';
import { getTestingDatabaseConfig } from 'src/common/utils/utils';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AuthModule } from '../../auth.module';
import { v4 as uuidv4 } from 'uuid';

describe('AuthController (Integration)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let schemaName: string;

  const mockLoggerService = {
    accessLog: jest.fn(),
    error: jest.fn(),
    log: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  beforeAll(async () => {
    if (process.env.IS_OFFLINE === 'true') {
      throw new Error('Cannot run integration tests in offline mode');
    }

    schemaName = `test_schema_${uuidv4().replace(/-/g, '')}`;

    // Создаём схему в базе
    const tmpModule: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService): TypeOrmModuleOptions => {
            const config = getTestingDatabaseConfig(configService);
            return { ...config };
          },
        }),
      ],
    }).compile();
    const tmpApp = tmpModule.createNestApplication();
    await tmpApp.init();
    const tmpDataSource = tmpApp.get(DataSource);
    await tmpDataSource.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}";`);
    await tmpApp.close();

    // Основной модуль с указанием схемы
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService): TypeOrmModuleOptions => {
            const config = getTestingDatabaseConfig(configService);
            return { ...config, schema: schemaName };
          },
        }),
        AuthModule,
        AppLoggerModule,
      ],
      providers: [
        { provide: 'IAppLoggerService', useValue: mockLoggerService },
      ],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
    dataSource = app.get(DataSource);
  });

  afterAll(async () => {
    // Удаляем схему после тестов
    await dataSource.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE;`);
    await app.close();
  });

  afterEach(async () => {
    await dataSource.query(`
    TRUNCATE TABLE
      "${schemaName}"."course_lesson",
      "${schemaName}"."course",
      "${schemaName}"."payment",
      "${schemaName}"."user_profile",
      "${schemaName}"."user"
    RESTART IDENTITY CASCADE;
  `);
  });

  it('register_success', async () => {
    const dto = AuthObjectMother.buildRegisterDto({password: 'strongpassword'});

    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send(dto)
      .expect(201);

    expect(res.body).toHaveProperty('access_token');
    expect(res.header['set-cookie']).toEqual(
      expect.arrayContaining([expect.stringContaining('refresh_token')]),
    );
  });

  it('register_failure_validation', async () => {
    const dto = AuthObjectMother.buildRegisterDto({password: '123'});

    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send(dto)
      .expect(400);
  });

  it('register_failure_conflict', async () => {
    const dto = AuthObjectMother.buildRegisterDto({password: 'strongpassword'});

    // создаем пользователя вручную
    await request(app.getHttpServer())
      .post('/auth/register')
      .send(dto)
      .expect(201);

    // пытаемся зарегистрировать снова → Conflict
    await request(app.getHttpServer())
      .post('/auth/register')
      .send(dto)
      .expect(409);
  });

  it('login_success', async () => {
    const registerDto = AuthObjectMother.buildRegisterDto({password: 'strongpassword'});
    const loginDto = AuthObjectMother.buildLoginDto({
      email: registerDto.email,
      password: registerDto.password,
    });

    await request(app.getHttpServer())
      .post('/auth/register')
      .send(registerDto)
      .expect(201);

    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send(loginDto)
      .expect(200);

    expect(res.body).toHaveProperty('access_token');
    expect(res.header['set-cookie']).toEqual(
      expect.arrayContaining([expect.stringContaining('refresh_token')]),
    );
  });

  it('login_failure_unauthorized', async () => {
    const loginDto = AuthObjectMother.buildLoginDto({
      email: 'notfound@user.com',
      password: 'wrong',
    });

    await request(app.getHttpServer())
      .post('/auth/login')
      .send(loginDto)
      .expect(401);
  });

  it('get_me_success', async () => {
    const dto = AuthObjectMother.buildRegisterDto({password: 'strongpassword'});

    // Регистрация
    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send(dto)
      .expect(201);

    const token = registerRes.body.access_token;

    // GetMe
    const meRes = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(meRes.body).toHaveProperty('id');
    expect(meRes.body.email).toBe(dto.email);
  });

  it('logout', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/logout')
      .expect(200);

    expect(res.body).toEqual({ access_token: '' });
    expect(res.header['set-cookie'][0]).toContain('refresh_token=;');
  });

  it('check_user', async () => {
    const dto = AuthObjectMother.buildRegisterDto({password: 'strongpassword'});

    await request(app.getHttpServer())
      .post('/auth/register')
      .send(dto)
      .expect(201);

    const existsRes = await request(app.getHttpServer())
      .get('/auth/check')
      .query({ email: dto.email })
      .expect(200);

    expect(existsRes.body.result).toBe(true);

    const notExistsRes = await request(app.getHttpServer())
      .get('/auth/check')
      .query({ email: 'notexist@user.com' })
      .expect(200);

    expect(notExistsRes.body.result).toBe(false);
  });
});
