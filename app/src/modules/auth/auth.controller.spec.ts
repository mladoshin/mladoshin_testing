import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TokenPair, TokenService } from 'src/common/services/TokenService';
import { ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoginUserDto } from './dto/login.dto';
import { RegisterUserDto } from './dto/register.dto';
import { register } from 'module';
import { UserResponse } from '../users/dto/user-response.dto';
import { User } from '../users/entities/user.entity';

const tokenPair: TokenPair = {
  accessToken:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImM3M2RlYTYwLTdmZDYtNDViMS04OWVhLTM1NzJjYWNmZDlkNiIsImVtYWlsIjoibWxhZG9zaGluQG1haWwucnUiLCJyb2xlIjoidXNlciIsImlhdCI6MTc0NjYwNzEyNiwiZXhwIjoxNzQ2NjkzNTI2fQ.QQi-r3LAFWu2rdKI9bqnEGjPS2gnKdh9xzBlJyazsr8',
  refreshToken:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImM3M2RlYTYwLTdmZDYtNDViMS04OWVhLTM1NzJjYWNmZDlkNiIsImVtYWlsIjoibWxhZG9zaGluQG1haWwucnUiLCJyb2xlIjoidXNlciIsImlhdCI6MTc0NjYwNzEyNiwiZXhwIjoxNzYyMTU5MTI2fQ._H7ZAdiCDuzrEh2wS8i2-O2JPWE4t44gPcI1T-86ans',
};

describe('AuthController', () => {
  let controller: AuthController;
  const mockAuthService = {
    login: jest.fn(),
    register: jest.fn(),
    getMe: jest.fn(),
    logout: jest.fn(),
    check: jest.fn()
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule],
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        TokenService,
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('login_success', async () => {
    // Arrange
    const dto = { email: 'a@b.com', password: 'pw' };
    mockAuthService.login.mockResolvedValue({
      accessToken: 'AT',
      refreshToken: 'RT',
    });

    // Create a fake `res` with a jest.fn() for `cookie`
    const res: any = {
      cookie: jest.fn(),
    };

    // Act
    const result = await controller.login(dto, res);

    // Assert
    expect(res.cookie).toHaveBeenCalledWith(
      'refresh_token',
      'RT',
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'strict',
        secure: true,
      }),
    ); // ← проверяем вызов cookie :contentReference[oaicite:0]{index=0}
    expect(result).toEqual({ access_token: 'AT' });
  });

  it('login_failure', async () => {
    mockAuthService.login = jest.fn().mockImplementation(() => {
      throw new UnauthorizedException();
    });

    const dto: LoginUserDto = {
      email: 'wrong@example.com',
      password: 'badpass',
    };
    const fakeRes: any = { cookie: jest.fn() };

    await expect(controller.login(dto, fakeRes)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    expect(fakeRes.cookie).not.toHaveBeenCalled();
  });

  it('register_success', async () => {
    // Arrange
    const dto: RegisterUserDto = {
      email: 'a@b.com',
      password: 'pw',
      first_name: 'fn',
      last_name: 'ln',
    };

    mockAuthService.register.mockResolvedValue({
      accessToken: 'AT',
      refreshToken: 'RT',
    });

    // Create a fake `res` with a jest.fn() for `cookie`
    const res: any = {
      cookie: jest.fn(),
    };

    // Act
    const result = await controller.register(dto, res);

    // Assert
    expect(res.cookie).toHaveBeenCalledWith(
      'refresh_token',
      'RT',
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'strict',
        secure: true,
      }),
    ); // ← проверяем вызов cookie :contentReference[oaicite:0]{index=0}
    expect(result).toEqual({ access_token: 'AT' });
  });

  it('register_failure', async () => {
    // Arrange
    const dto: RegisterUserDto = {
      email: 'a@b.com',
      password: 'pw',
      first_name: 'fn',
      last_name: 'ln',
    };

    mockAuthService.register.mockImplementation(() => {
      throw new ConflictException();
    });

    // Create a fake `res` with a jest.fn() for `cookie`
    const res: any = {
      cookie: jest.fn(),
    };

    await expect(controller.register(dto, res)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(res.cookie).not.toHaveBeenCalled();
  });

  it('get_me_success', async () => {
    // Arrange: fake user data
    const fakeUser = { id: 'user-123', email: 'a@b.com', role: 'user', profile: {
      first_name: "Maxim",
      last_name: "Ladoshin"
    } } as User;
    mockAuthService.getMe!.mockResolvedValue(fakeUser);
    // Act
    const result = await controller.getMe('user-123');
    // Note: the @User decorator pulls id from req.user, so the arg is ignored
    // Assert
    expect(result).toBeInstanceOf(UserResponse);
    expect(result).toEqual(UserResponse.make(fakeUser));
  });

  it('get_me_failure', async () => {
    mockAuthService.getMe!.mockImplementation(() => {
      throw new NotFoundException();
    });

    await expect(controller.getMe('user-123')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('logout', async () => {
    mockAuthService.logout!.mockImplementation(() => {
      throw new NotFoundException();
    });

    const res: any = {
      cookie: jest.fn(),
    };

    // Act
    const result = await controller.logout(res);

    // Assert
    expect(res.cookie).toHaveBeenCalledWith(
      'refresh_token',
      '',
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'strict',
        secure: true,
      }),
    );

    expect(result).toEqual({ access_token: '' });
  });

  it('check_success', async () => {
    mockAuthService.check!.mockResolvedValue(true);

    // Act
    const result = await controller.checkUserByEmail('mladoshin@mail.ru');
    expect(result).toEqual({result: true});
  });

  it('check_failure', async () => {
    mockAuthService.check!.mockResolvedValue(false);

    // Act
    const result = await controller.checkUserByEmail('mladoshin@mail.ru');
    expect(result).toEqual({result: false});
  });
});
