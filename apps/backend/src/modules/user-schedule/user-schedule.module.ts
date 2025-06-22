import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserSchedule } from './entities/user-schedule.entity';
import { UserAvailability } from '../user-availability/entities/user-availability.entity';
import { UserScheduleRepo } from './user-schedule.repository';
import { UserScheduleService } from './user-schedule.service';
import { UserScheduleController } from './user-schedule.controller';
import { TokenService } from 'src/common/services/TokenService';

@Module({
  imports: [TypeOrmModule.forFeature([UserAvailability, UserSchedule])],
  controllers: [UserScheduleController],
  providers: [
    { provide: 'IUserScheduleService', useClass: UserScheduleService },
    { provide: 'IUserScheduleRepo', useClass: UserScheduleRepo },
    { provide: 'ITokenService', useClass: TokenService },
  ],
  exports: ['IUserScheduleRepo', 'IUserScheduleService'],
})
export class UserScheduleModule {}
