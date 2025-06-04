import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserRepo, IUserRepo } from 'src/modules/users/users.repository';
import { UserProfile } from './entities/user-profile.entity';
import { AppLoggerService } from 'src/common/logging/log.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserProfile])],
  controllers: [UsersController],
  providers: [
    {
      provide: 'IUsersService',
      useClass: UsersService,
    },
    {
      provide: 'IUserRepo',
      useClass: UserRepo,
    },
  ],
  exports: ['IUserRepo', 'IUsersService'],
})
export class UsersModule {}
