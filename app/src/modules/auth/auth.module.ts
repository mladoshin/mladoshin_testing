import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { BcryptService } from 'src/common/services/HashService';
import { TokenService } from 'src/common/services/TokenService';

@Module({
  imports: [UsersModule],
  controllers: [AuthController],
  providers: [AuthService, BcryptService, TokenService],
  exports: [AuthService]
})
export class AuthModule {}
