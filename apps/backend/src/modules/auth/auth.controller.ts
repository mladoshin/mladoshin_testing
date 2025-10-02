import {
  Controller,
  Get,
  Post,
  Body,
  Res,
  UseGuards,
  Inject,
  HttpCode,
  Query,
} from '@nestjs/common';
import { IAuthService } from './auth.service';
import { LoginUserDto } from './dto/login.dto';
import { RegisterUserDto } from './dto/register.dto';
import { AuthResponse } from './dto/auth-response.dto';
import { Response } from 'express';
import { TokenPair } from 'src/common/services/TokenService';
import { JwtAuthGuard } from './guards/AuthGuard';
import { User } from './decorators/UserDecorator';
import { UserResponse } from '../users/dto/user-response.dto';
import { AccessLog } from 'src/common/logging/access-log.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject('IAuthService') private readonly authService: IAuthService,
  ) {}

  @Post('login')
  @HttpCode(200)
  @AccessLog()
  async login(
    @Body() loginUserDto: LoginUserDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    const tokenPair = await this.authService.login(loginUserDto);
    return AuthResponse.make(tokenPair, res);
  }

  @Get('check')
  @AccessLog()
  async checkUserByEmail(@Query() data: any) {
    const result = await this.authService.check(data.email as string);
    return { result };
  }

  @Get('me')
  @AccessLog()
  @UseGuards(JwtAuthGuard)
  async getMe(@User('id') uid: string) {
    const user = await this.authService.getMe(uid);
    return UserResponse.make(user);
  }

  @Post('register')
  @AccessLog()
  async register(
    @Body() registerUserDto: RegisterUserDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    const tokenPair = await this.authService.register(registerUserDto);
    return AuthResponse.make(tokenPair, res);
  }

  @Post('logout')
  @HttpCode(200)
  @AccessLog()
  logout(@Res({ passthrough: true }) res: Response): AuthResponse {
    const tokenPair: TokenPair = { accessToken: '', refreshToken: '' };
    return AuthResponse.make(tokenPair, res);
  }
}
