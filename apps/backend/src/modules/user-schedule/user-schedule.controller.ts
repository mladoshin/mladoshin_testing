import {
  Controller,
  Get,
  Post,
  Body,
  Inject,
  UseGuards,
  Query,
  Delete,
} from '@nestjs/common';
import { GenerateUserScheduleDto } from './dto/generate-user-schedule.dto';
import { JwtAuthGuard, JWTPayload } from '../auth/guards/AuthGuard';
import { User } from '../auth/decorators/UserDecorator';
import { IUserScheduleRepo } from './user-schedule.repository';
import { UserScheduleResponse } from './dto/user-schedule-response.dto';
import { CreateUserScheduleArrayDto } from './dto/create-user-schedule.dto';
import { GetUserScheduleQueryDto } from './dto/get-user-schedule-query.dto';
import { IUserScheduleService } from './user-schedule.service';
import { DeleteUserScheduleQueryDto } from './dto/delete-user-schedule-query.dto';

@Controller('user-schedule')
@UseGuards(JwtAuthGuard)
export class UserScheduleController {
  constructor(
    @Inject('IUserScheduleService')
    private readonly service: IUserScheduleService,
  ) {}

  @Post('/generate')
  async generate(
    @User() user: JWTPayload,
    @Body() dto: GenerateUserScheduleDto,
  ) {
    const result = await this.service.generate(user, dto);
    return result ? UserScheduleResponse.collection(result) : null;
  }

  @Post()
  async create(
    @User() user: JWTPayload,
    @Body() dto: CreateUserScheduleArrayDto,
  ) {
    const result = await this.service.create(user, dto);
    return result ? UserScheduleResponse.collection(result) : null;
  }

  @Get()
  async getUserSchedule(
    @User() user: JWTPayload,
    @Query() query: GetUserScheduleQueryDto,
  ) {
    const result = await this.service.getByUserAndCourse(user, query);
    return result ? UserScheduleResponse.collection(result) : null;
  }

  @Delete()
  async deleteUserSchedule(
    @User() user: JWTPayload,
    @Query() query: DeleteUserScheduleQueryDto,
  ) {
    const result = await this.service.deleteByUserAndCourse(user, query);
    return { success: result };
  }
}
