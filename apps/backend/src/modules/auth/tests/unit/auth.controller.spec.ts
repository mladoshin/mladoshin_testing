import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { IAppLoggerService } from 'src/common/logging/log.service';
import { TokenService } from 'src/common/services/TokenService';
import { UserBuilder } from 'src/common/tests/builders/user.builder';
import { AuthObjectMother } from 'src/common/tests/object-mothers/auth-object-mother';
import { UserResponse } from '../../../users/dto/user-response.dto';
import { AuthController } from '../../auth.controller';
import { IAuthService } from '../../auth.service';
import { RegisterUserDto } from '../../dto/register.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let mockAuthService: Partial<Record<keyof IAuthService, jest.Mock>>;
  let mockLoggerService: Partial<Record<keyof IAppLoggerService, jest.Mock>>;

  mockAuthService = {
    check: jest.fn(),
    createTokenPair: jest.fn(),
    getMe: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
    register: jest.fn(),
  };

  mockLoggerService = {
    accessLog: jest.fn(),
    error: jest.fn(),
    log: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule],
      controllers: [AuthController],
      providers: [
        { provide: 'IAuthService', useValue: mockAuthService },
        { provide: 'ITokenService', useClass: TokenService },
        { provide: 'IAppLoggerService', useValue: mockLoggerService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('login_success', async () => {
    const dto = AuthObjectMother.buildLoginDto();
    const tokenPair = AuthObjectMother.buildTokenPair();
    mockAuthService.login?.mockResolvedValue(tokenPair);

    const res: any = {
      cookie: jest.fn(),
    };

    const result = await controller.login(dto, res);

    expect(res.cookie).toHaveBeenCalledWith(
      'refresh_token',
      tokenPair.refreshToken,
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'strict',
        secure: true,
      }),
    );
    expect(result).toEqual({ access_token: tokenPair.accessToken });
  });

  it('login_failure', async () => {
    mockAuthService.login = jest.fn().mockImplementation(() => {
      throw new UnauthorizedException();
    });

    const dto = AuthObjectMother.buildLoginDto();
    const fakeRes: any = { cookie: jest.fn() };

    await expect(controller.login(dto, fakeRes)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    expect(fakeRes.cookie).not.toHaveBeenCalled();
  });

  it('register_success', async () => {
    // Arrange
    const dto: RegisterUserDto = AuthObjectMother.buildRegisterDto();
    const tokenPair = AuthObjectMother.buildTokenPair();
    mockAuthService.register?.mockResolvedValue(tokenPair);

    const res: any = {
      cookie: jest.fn(),
    };

    const result = await controller.register(dto, res);

    expect(res.cookie).toHaveBeenCalledWith(
      'refresh_token',
      tokenPair.refreshToken,
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'strict',
        secure: true,
      }),
    );
    expect(result).toEqual({ access_token: tokenPair.accessToken });
  });

  it('register_failure', async () => {
    // Arrange
    const dto: RegisterUserDto = AuthObjectMother.buildRegisterDto();

    mockAuthService.register?.mockImplementation(() => {
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
    const fakeUser = new UserBuilder().build();
    mockAuthService.getMe!.mockResolvedValue(fakeUser);

    const result = await controller.getMe(fakeUser.id);

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
    expect(result).toEqual({ result: true });
  });

  it('check_failure', async () => {
    mockAuthService.check!.mockResolvedValue(false);

    // Act
    const result = await controller.checkUserByEmail('mladoshin@mail.ru');
    expect(result).toEqual({ result: false });
  });
});
