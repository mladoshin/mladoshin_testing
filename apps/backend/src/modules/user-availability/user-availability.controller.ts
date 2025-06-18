import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  NotFoundException,
  Inject,
  UseGuards,
} from '@nestjs/common';
import { CreateUserAvailabilityDto } from './dto/create-user-availability.dto';
import { UpdateUserAvailabilityDto } from './dto/update-user-availability.dto';
import { IUserAvailabilityRepo } from './user-availability.repository';
import { JwtAuthGuard, JWTPayload } from '../auth/guards/AuthGuard';
import { User } from '../auth/decorators/UserDecorator';
import { UserAvailabilityResponse } from './dto/user-availability-response.dto';

@Controller('user-availability')
@UseGuards(JwtAuthGuard)
export class UserAvailabilityController {
  constructor(
    @Inject('IUserAvailabilityRepo')
    private readonly repo: IUserAvailabilityRepo,
  ) {}

  @Post()
  async create(@User() user: JWTPayload, @Body() dto: CreateUserAvailabilityDto) {
    const result = await this.repo.create(user.id, dto);
    return UserAvailabilityResponse.make(result);
  }

  @Get()
  async findAll() {
    const results = await this.repo.findAll();
    return UserAvailabilityResponse.collection(results);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.repo.findById(id);
    if (!result) throw new NotFoundException('UserAvailability not found');
    return UserAvailabilityResponse.make(result);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserAvailabilityDto,
  ) {
    const result = await this.repo.update(id, dto);
    return UserAvailabilityResponse.make(result);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.repo.delete(id);
    return UserAvailabilityResponse.make(result);
  }

//   @Get('by-user/:userId')
//   async findByUser(@Param('userId') userId: string) {
//     const results = await this.repo.findAllByUser(userId);
//     return UserAvailabilityResponse.collection(results);
//   }

//   @Get('by-course/:courseId')
//   async findByCourse(@Param('courseId') courseId: string) {
//     const results = await this.repo.findAllByCourse(courseId);
//     return UserAvailabilityResponse.collection(results);
//   }
}
