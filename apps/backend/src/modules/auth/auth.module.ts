import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { BcryptService } from 'src/common/services/HashService';
import { TokenService } from 'src/common/services/TokenService';
import { AppLoggerService } from 'src/common/logging/log.service';

@Module({
  imports: [UsersModule],
  controllers: [AuthController],
  providers: [
    { provide: 'IAuthService', useClass: AuthService },
    { provide: 'IHashService', useClass: BcryptService },
    { provide: 'ITokenService', useClass: TokenService },
  ],
  exports: ['IAuthService'],
})
export class AuthModule {}
