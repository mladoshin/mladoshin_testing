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
  Query,
  Req,
} from '@nestjs/common';
import { CreateUserAvailabilityDto } from './dto/create-user-availability.dto';
import { UpdateUserAvailabilityDto } from './dto/update-user-availability.dto';
import { JwtAuthGuard, JWTPayload } from '../auth/guards/AuthGuard';
import { User } from '../auth/decorators/UserDecorator';
import { UserAvailabilityResponse } from './dto/user-availability-response.dto';
import { GetUserAvailabilitiesQueryDto } from './dto/get-user-availabilities-query.dto';
import { IUserAvailabilityService } from './user-availability.service';
import { ErrorMapper } from 'src/common/errors/error-mapper';
import { RepositoryNotFoundError } from 'src/common/errors/db-errors';

@Controller('user-availability')
@UseGuards(JwtAuthGuard)
export class UserAvailabilityController {
  constructor(
    @Inject('IUserAvailabilityService')
    private readonly service: IUserAvailabilityService,
  ) {}

  @Post()
  async create(
    @User() user: JWTPayload,
    @Body() dto: CreateUserAvailabilityDto,
    @Req() req,
  ) {
    try {
      const result = await this.service.create(user, dto, {schema: req.headers['x-test-schema']});
      return UserAvailabilityResponse.make(result);
    } catch (err) {
      throw ErrorMapper.mapToHTTPError(err);
    }
  }

  @Get()
  async findAll(
    @User() user: JWTPayload,
    @Query() query: GetUserAvailabilitiesQueryDto,
    @Req() req,
  ) {
    try {
      const results = await this.service.findByUserAndCourse(user, query, {schema: req.headers['x-test-schema']});
      return UserAvailabilityResponse.collection(results);
    } catch (err) {
      throw ErrorMapper.mapToHTTPError(err);
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req) {
    try {
      const result = await this.service.findById(id, {schema: req.headers['x-test-schema']});
      if (!result) throw new RepositoryNotFoundError('UserAvailability not found', 'UserAvailability');
      return UserAvailabilityResponse.make(result);
    } catch (err) {
      throw ErrorMapper.mapToHTTPError(err);
    }
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserAvailabilityDto,
    @Req() req,
  ) {
    try {
      const result = await this.service.update(id, dto, {schema: req.headers['x-test-schema']});
      return UserAvailabilityResponse.make(result);
    } catch (err) {
      throw ErrorMapper.mapToHTTPError(err);
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req) {
    try {
      const result = await this.service.delete(id, {schema: req.headers['x-test-schema']});
      return UserAvailabilityResponse.make(result);
    } catch (err) {
      throw ErrorMapper.mapToHTTPError(err);
    }
  }
}
