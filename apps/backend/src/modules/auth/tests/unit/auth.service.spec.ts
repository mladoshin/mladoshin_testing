import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { RepositoryNotFoundError } from 'src/common/errors/db-errors';
import { IHashService } from 'src/common/services/HashService';
import { ITokenService, TokenPair } from 'src/common/services/TokenService';
import { IUserRepo } from 'src/modules/users/users.repository';
import { AuthService, IAuthService } from '../../auth.service';
import { UserBuilder } from 'src/common/tests/builders/user.builder';
import { AuthObjectMother } from 'src/common/tests/object-mothers/auth-object-mother';

describe('AuthService', () => {
  let service: IAuthService;
  let userRepo: IUserRepo;
  let hashService: IHashService;
  let tokenService: ITokenService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: 'IUserRepo',
          useValue: {
            findByEmail: jest.fn(),
            create: jest.fn(),
            findOrFailById: jest.fn(),
          },
        },
        {
          provide: 'IHashService',
          useValue: { hash: jest.fn(), compare: jest.fn() },
        },
        { provide: 'ITokenService', useValue: { create: jest.fn() } },
        {
          provide: ConfigService,
          useValue: { getOrThrow: jest.fn().mockReturnValue('secret') },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepo = module.get<IUserRepo>('IUserRepo');
    hashService = module.get<IHashService>('IHashService');
    tokenService = module.get<ITokenService>('ITokenService');
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('createTokenPair', () => {
    it('should create valid token pair', () => {
      // Arrange
      const user = new UserBuilder().build();
      (tokenService.create as jest.Mock).mockImplementation(
        (payload, secret, expiresIn) => `${payload.id}-${expiresIn}`,
      );

      // Act
      const result: TokenPair = service.createTokenPair(user);

      // Assert
      expect(result).toEqual({
        accessToken: `${user.id}-1d`,
        refreshToken: `${user.id}-180d`,
      });
    });
  });

  describe('login', () => {
    it('should login successfully with correct credentials', async () => {
      const dto = AuthObjectMother.buildLoginDto();

      const user = new UserBuilder()
        .withEmail(dto.email)
        .withPassword('hashedSecret')
        .build();

      (userRepo.findByEmail as jest.Mock).mockResolvedValue(user);
      (hashService.compare as jest.Mock).mockResolvedValue(true);
      (tokenService.create as jest.Mock).mockReturnValue('token');

      const result = await service.login(dto);

      expect(result).toEqual({ accessToken: 'token', refreshToken: 'token' });
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      const dto = AuthObjectMother.buildLoginDto({ password: 'wrong' });
      const user = new UserBuilder()
        .withEmail(dto.email)
        .withPassword('hashedCorrect')
        .build();

      (userRepo.findByEmail as jest.Mock).mockResolvedValue(user);
      (hashService.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const dto = AuthObjectMother.buildRegisterDto();

      (userRepo.findByEmail as jest.Mock).mockResolvedValue(null);
      (hashService.hash as jest.Mock).mockResolvedValue('hashedPassword');
      (userRepo.create as jest.Mock).mockImplementation((data) => ({
        ...data,
      }));
      (tokenService.create as jest.Mock).mockReturnValue('token');

      const result = await service.register(dto);

      expect(result).toEqual({ accessToken: 'token', refreshToken: 'token' });
      expect(userRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ password: 'hashedPassword' }),
      );
    });
  });

  describe('getMe', () => {
    it('should return user if found', async () => {
      const user = new UserBuilder().build();
      (userRepo.findOrFailById as jest.Mock).mockResolvedValue(user);

      const result = await service.getMe('1');

      expect(result).toEqual(user);
    });

    it('should throw NotFoundException if user not found', async () => {
      (userRepo.findOrFailById as jest.Mock).mockRejectedValue(
        new RepositoryNotFoundError('', ''),
      );

      await expect(service.getMe('unknown')).rejects.toThrow(
        RepositoryNotFoundError,
      );
    });
  });

  describe('check', () => {
    it('should return true if user exists', async () => {
      const user = new UserBuilder().build();
      (userRepo.findByEmail as jest.Mock).mockResolvedValue(user);

      const result = await service.check(user.email);
      expect(result).toBe(true);
    });

    it('should return false if user does not exist', async () => {
      (userRepo.findByEmail as jest.Mock).mockResolvedValue(null);

      const result = await service.check('unknown@example.com');
      expect(result).toBe(false);
    });
  });

  describe('logout', () => {
    it('should return logout message', () => {
      const result = service.logout();
      expect(result).toBe('This action returns auth');
    });
  });
});
