import { Inject, Injectable } from '@nestjs/common';
import { IUserScheduleRepo } from './user-schedule.repository';
import { JWTPayload } from '../auth/guards/AuthGuard';
import { GenerateUserScheduleDto } from './dto/generate-user-schedule.dto';
import { ErrorMapper } from 'src/common/errors/error-mapper';
import { UserScheduleDomain } from './domains/user-schedule.domain';
import { CreateUserScheduleArrayDto } from './dto/create-user-schedule.dto';
import { GetUserScheduleQueryDto } from './dto/get-user-schedule-query.dto';
import { DeleteUserScheduleQueryDto } from './dto/delete-user-schedule-query.dto';

export interface IUserScheduleService {
  generate(
    user: JWTPayload,
    data: GenerateUserScheduleDto,
    options?: any,
  ): Promise<UserScheduleDomain[]>;
  create(
    user: JWTPayload,
    data: CreateUserScheduleArrayDto,
    options?: any,
  ): Promise<UserScheduleDomain[]>;
  getByUserAndCourse(
    user: JWTPayload,
    query: GetUserScheduleQueryDto,
    options?: any,
  ): Promise<UserScheduleDomain[]>;
  deleteByUserAndCourse(
    user: JWTPayload,
    query: DeleteUserScheduleQueryDto,
    options?: any,
  ): Promise<boolean>;
}

@Injectable()
export class UserScheduleService implements IUserScheduleService {
  public constructor(
    @Inject('IUserScheduleRepo')
    private readonly repo: IUserScheduleRepo,
  ) {}

  async generate(user: JWTPayload, data: GenerateUserScheduleDto, options?: any) {
    try {
      const entities = await this.repo.generate(user.id, data.course_id, options);
      return entities;
    } catch (err) {
      throw ErrorMapper.mapToHTTPError(err);
    }
  }

  async create(user: JWTPayload, data: CreateUserScheduleArrayDto, options?: any) {
    try {
      const entities = await this.repo.create(user.id, data.data, options);
      return entities;
    } catch (err) {
      throw ErrorMapper.mapToHTTPError(err);
    }
  }

  async getByUserAndCourse(user: JWTPayload, query: GetUserScheduleQueryDto, options?: any) {
    try {
      const entities = await this.repo.getByUserAndCourse(
        user.id,
        query.course_id,
        options,
      );
      return entities;
    } catch (err) {
      throw ErrorMapper.mapToHTTPError(err);
    }
  }

  async deleteByUserAndCourse(
    user: JWTPayload,
    query: DeleteUserScheduleQueryDto,
    options?: any,
  ) {
    try {
      const result = await this.repo.deleteByUserAndCourse(
        user.id,
        query.course_id,
        options,
      );
      return result;
    } catch (err) {
      throw ErrorMapper.mapToHTTPError(err);
    }
  }
}
