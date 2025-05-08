import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { LoginUserDto } from './dto/login.dto';
import { RegisterUserDto } from './dto/register.dto';
import { UserRepo } from '../users/users.repository';
import { BcryptService } from 'src/common/services/HashService';
import { TokenPair, TokenService } from 'src/common/services/TokenService';
import { User } from '../users/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { RepositoryNotFoundError } from 'src/common/errors/db-errors';

@Injectable()
export class AuthService {
  constructor(
    @Inject(UserRepo) private readonly userRepository: UserRepo,
    @Inject(BcryptService) private readonly hashService: BcryptService,
    @Inject(TokenService) private readonly tokenService: TokenService,
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
