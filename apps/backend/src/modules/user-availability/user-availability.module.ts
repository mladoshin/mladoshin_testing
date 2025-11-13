import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserAvailability } from './entities/user-availability.entity';
import { UserAvailabilityRepo } from './user-availability.repository';
import { UserAvailabilityService } from './user-availability.service';
import { UserAvailabilityController } from './user-availability.controller';
import { TokenService } from 'src/common/services/TokenService';

@Module({
  imports: [TypeOrmModule.forFeature([UserAvailability])],
  controllers: [UserAvailabilityController],
  providers: [
    { provide: 'IUserAvailabilityService', useClass: UserAvailabilityService },
    { provide: 'IUserAvailabilityRepo', useClass: UserAvailabilityRepo },
    { provide: 'ITokenService', useClass: TokenService },
  ],
  exports: ['IUserAvailabilityRepo', 'IUserAvailabilityService'],
})
export class UserAvailabilityModule {}
