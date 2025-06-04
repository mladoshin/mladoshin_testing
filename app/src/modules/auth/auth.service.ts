import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { LoginUserDto } from './dto/login.dto';
import { RegisterUserDto } from './dto/register.dto';
import { IUserRepo } from '../users/users.repository';
import { IHashService } from 'src/common/services/HashService';
import {
  ITokenService,
  TokenPair,
} from 'src/common/services/TokenService';
import { User } from '../users/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { RepositoryNotFoundError } from 'src/common/errors/db-errors';

export interface IAuthService {
  createTokenPair(user: User): TokenPair;
  login(loginUserDto: LoginUserDto): Promise<TokenPair>;
  register(registerUserDto: RegisterUserDto): Promise<TokenPair>;
  logout(): string;
  getMe(userId: string): Promise<User>;
  check(email: string): Promise<boolean>;
}

@Injectable()
export class AuthService implements IAuthService {
  constructor(
    @Inject('IUserRepo') private readonly userRepository: IUserRepo,
    @Inject('IHashService') private readonly hashService: IHashService,
    @Inject('ITokenService') private readonly tokenService: ITokenService,
    @Inject(ConfigService) private readonly configService: ConfigService,
  ) {}

  createTokenPair(user: User): TokenPair {
    const body = { id: user.id, email: user.email, role: user.role };
    const secret = this.configService.getOrThrow('JWT_SECRET');
    const accessToken = this.tokenService.create(body, secret, '1d');
    const refreshToken = this.tokenService.create(body, secret, '180d');
    return { accessToken, refreshToken };
  }

  async login(loginUserDto: LoginUserDto) {
    const user = await this.userRepository.findByEmail(loginUserDto.email);
    if (!user) {
      throw new UnauthorizedException(
        'Пользователь с таким логином не найден.',
      );
    }

    const isPasswordValid = await this.hashService.compare(
      loginUserDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException(
        'Пользователь с таким логином и паролем не найден.',
      );
    }

    return this.createTokenPair(user);
  }

  async register(registerUserDto: RegisterUserDto) {
    let user = await this.userRepository.findByEmail(registerUserDto.email);
    if (user) {
      throw new ConflictException(
        'Пользователь с таким логином уже существует.',
      );
    }
    const hashedPassword = await this.hashService.hash(
      registerUserDto.password,
    );
    const userData = { ...registerUserDto, password: hashedPassword };
    user = await this.userRepository.create(userData);
    return this.createTokenPair(user);
  }

  logout() {
    return `This action returns auth`;
  }

  getMe(userId: string) {
    try {
      return this.userRepository.findOrFailById(userId);
    } catch (err) {
      if (err instanceof RepositoryNotFoundError) {
        throw new NotFoundException('Пользователь не найден.');
      }
      throw err;
    }
  }

  async check(email: string) {
    const user = await this.userRepository.findByEmail(email);
    return !!user;
  }
}
