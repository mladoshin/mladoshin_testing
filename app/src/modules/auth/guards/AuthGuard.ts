import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TokenService } from 'src/common/services/TokenService';
import { UserRole } from 'src/modules/users/entities/user.entity';

export type JWTPayload = {email: string, id: string, role: UserRole}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private tokenService: TokenService,
    private configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) return false;

    const token = authHeader.split(' ')[1];
    try {
      const secret = this.configService.getOrThrow('JWT_SECRET');
      const payload = this.tokenService.verify<JWTPayload>(token, secret);
      request.user = payload;
      return true;
    } catch {
      return false;
    }
  }
}
