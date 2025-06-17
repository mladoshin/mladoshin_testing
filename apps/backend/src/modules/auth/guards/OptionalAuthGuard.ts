import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Inject,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ITokenService } from 'src/common/services/TokenService';
import { JWTPayload } from './AuthGuard';

@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(
    @Inject('ITokenService')
    private tokenService: ITokenService,
    private configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) return true;

    const token = authHeader.split(' ')[1];
    try {
      const secret = this.configService.getOrThrow('JWT_SECRET');
      const payload = this.tokenService.verify<JWTPayload>(token, secret);
      request.user = payload;
    } catch {}

    return true;
  }
}
