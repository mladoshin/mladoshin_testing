// user.repo.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserRepo } from '../users.repository';
import { UserProfile } from '../entities/user-profile.entity';
import { User } from '../entities/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { Payment } from 'src/modules/payments/entities/payment.entity';
import { Course } from 'src/modules/courses/entities/course.entity';
import { CourseLesson } from 'src/modules/lessons/entities/course-lesson.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getTestingDatabaseConfig } from 'src/common/utils/utils';

describe('UserRepo Integration Tests', () => {
  let userRepo: UserRepo;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true, // optional if you want global access
          load: [], // optionally load config functions
          envFilePath: '.env.test', // if needed
        }),
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService) =>
            getTestingDatabaseConfig(configService) as any,
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
  });

  afterAll(async () => {
    // Закрытие соединения с базой данных
    const connection = userRepo['repository'].manager.connection;
    await connection.close();
  });

  it('should create a user', async () => {
    const createUserDto: CreateUserDto = {
      email: 'test@example.com',
      password: 'password123',
      first_name: 'John',
      last_name: 'Doe',
    };

    const user = await userRepo.create(createUserDto);

    expect(user).toBeDefined();
    expect(user.email).toBe(createUserDto.email);
    expect(user.profile).toBeDefined();
    expect(user.profile.first_name).toBe(createUserDto.first_name);
  });

  it('should find a user by email', async () => {
    const email = 'test@example.com';
    const user = await userRepo.findByEmail(email);

    expect(user).toBeDefined();
    expect(user?.email).toBe(email);
  });

  it('should update a user', async () => {
    const email = 'test@example.com';
    const user = await userRepo.findByEmail(email);
    expect(user).toBeDefined();

    const updateUserDto: UpdateUserDto = {
      email: 'updated@example.com',
    };

    const updatedUser = await userRepo.update((user as User).id, updateUserDto);
    expect(updatedUser.email).toBe(updateUserDto.email);
  });

  it('should delete a user', async () => {
    const email = 'updated@example.com';
    const user = await userRepo.findByEmail(email);
    expect(user).toBeDefined();

    const deletedUser = await userRepo.delete((user as User).id);
    expect(deletedUser).toBeDefined();

    const foundUser = await userRepo.findById((user as User).id);
    expect(foundUser).toBeNull();
  });
});
