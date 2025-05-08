import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Res,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginUserDto } from './dto/login.dto';
import { RegisterUserDto } from './dto/register.dto';
import { AuthResponse } from './dto/auth-response.dto';
import { Response } from 'express';
import { TokenPair } from 'src/common/services/TokenService';
import { JwtAuthGuard } from './guards/AuthGuard';
import { User } from './decorators/UserDecorator';
import { UserResponse } from '../users/dto/user-response.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(
    @Body() loginUserDto: LoginUserDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    const tokenPair = await this.authService.login(loginUserDto);
    return AuthResponse.make(tokenPair, res);
  }

  @Get('check')
  async checkUserByEmail(@Body() data: any) {
    const result = await this.authService.check(data.email as string);
    return { result };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@User('id') uid: string) {
    const user = await this.authService.getMe(uid);
    return UserResponse.make(user);
  }

  @Post('register')
  async register(
    @Body() registerUserDto: RegisterUserDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    const tokenPair = await this.authService.register(registerUserDto);
    return AuthResponse.make(tokenPair, res);
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response): AuthResponse {
    const tokenPair: TokenPair = { accessToken: '', refreshToken: '' };
    return AuthResponse.make(tokenPair, res);
  }
}
