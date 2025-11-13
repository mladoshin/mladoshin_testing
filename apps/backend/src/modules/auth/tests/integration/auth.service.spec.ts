import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';

import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AppLoggerModule } from 'src/common/logging/log.module';
import { AuthObjectMother } from 'src/common/tests/object-mothers/auth-object-mother';
import { getTestingDatabaseConfig } from 'src/common/utils/utils';
import { User } from '../../../users/entities/user.entity';
import { UsersModule } from '../../../users/users.module';
import { AuthModule } from '../../auth.module';
import { IAuthService } from '../../auth.service';
import { v4 as uuidv4 } from 'uuid';

describe('AuthService (Integration)', () => {
  let service: IAuthService;
  let dataSource: DataSource;
  let schemaName: string;

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
        AuthModule, // подключаем реальный модуль
        UsersModule,
        AppLoggerModule,
      ],
    }).compile();

    dataSource = module.get(DataSource);
    service = module.get<IAuthService>('IAuthService');
  });

  afterAll(async () => {
    // Удаляем схему после тестов
    await dataSource.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE;`);
    await dataSource.destroy();
  });

  afterEach(async () => {
    await dataSource.query(
      `TRUNCATE TABLE "${schemaName}"."user_profile", "${schemaName}"."user" RESTART IDENTITY CASCADE`,
    );
  });

  it('should register a new user and return tokens', async () => {
    const dto = AuthObjectMother.buildRegisterDto();

    const tokenPair = await service.register(dto);

    expect(tokenPair.accessToken).toBeDefined();
    expect(tokenPair.refreshToken).toBeDefined();

    // проверяем, что реально создался пользователь в БД
    const user = await dataSource.getRepository(User).findOne({
      where: { email: dto.email },
      relations: ['profile'],
    });

    expect(user).toBeTruthy();
    expect(user?.profile.first_name).toBe(dto.first_name);
  });

  it('should login with valid credentials', async () => {
    const dto = AuthObjectMother.buildRegisterDto();

    // сначала зарегистрируем
    await service.register(dto);

    // потом логинимся
    const tokenPair = await service.login({
      email: dto.email,
      password: dto.password,
    });

    expect(tokenPair.accessToken).toBeDefined();
    expect(tokenPair.refreshToken).toBeDefined();
  });

  it('should check existing user', async () => {
    const dto = AuthObjectMother.buildRegisterDto();

    await service.register(dto);

    const result = await service.check(dto.email);
    expect(result).toBe(true);

    const result2 = await service.check('not-existing@example.com');
    expect(result2).toBe(false);
  });

  it('should return user from getMe', async () => {
    const dto = AuthObjectMother.buildRegisterDto();

    const tokens = await service.register(dto);
    const user = await dataSource.getRepository(User).findOne({
      where: { email: dto.email },
    });

    const me = await service.getMe(user!.id);
    expect(me.email).toBe(dto.email);
  });

  it('should logout', () => {
    const result = service.logout();
    expect(result).toBe('This action returns auth');
  });
});
