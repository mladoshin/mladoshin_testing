import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserAvailability } from './entities/user-availability.entity';
import { UserAvailabilityRepo } from './user-availability.repository';

@Module({
  imports: [TypeOrmModule.forFeature([UserAvailability])],
  providers: [
    { provide: 'IUserAvailabilityRepo', useClass: UserAvailabilityRepo },
  ],
  exports: ['IUserAvailabilityRepo'],
})
export class UserAvailabilityModule {}
