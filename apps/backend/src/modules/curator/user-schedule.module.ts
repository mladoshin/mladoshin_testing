import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserSchedule } from './entities/user-schedule.entity';
import { UserAvailability } from '../user-availability/entities/user-availability.entity';
import { UserScheduleRepo } from './user-schedule.repository';
import { UserScheduleService } from './user-schedule.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserAvailability, UserSchedule])],
  providers: [
    { provide: 'IUserScheduleService', useClass: UserScheduleService },
    { provide: 'IUserScheduleRepo', useClass: UserScheduleRepo },
  ],
  exports: ['IUserScheduleRepo', 'IUserScheduleService'],
})
export class UserScheduleModule {}
