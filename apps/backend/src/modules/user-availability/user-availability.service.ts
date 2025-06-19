import { Inject, Injectable } from '@nestjs/common';
import { JWTPayload } from '../auth/guards/AuthGuard';
import { ErrorMapper } from 'src/common/errors/error-mapper';
import { IUserAvailabilityRepo } from './user-availability.repository';
import { CreateUserAvailabilityDto } from './dto/create-user-availability.dto';
import { UserAvailabilityDomain } from './domains/user-availability.domain';
import { GetUserAvailabilitiesQueryDto } from './dto/get-user-availabilities-query.dto';
import { UpdateUserAvailabilityDto } from './dto/update-user-availability.dto';

export interface IUserAvailabilityService {
  create(
    user: JWTPayload,
    data: CreateUserAvailabilityDto,
  ): Promise<UserAvailabilityDomain>;
  findByUserAndCourse(
    user: JWTPayload,
    query: GetUserAvailabilitiesQueryDto,
  ): Promise<UserAvailabilityDomain[]>;
  findById(id: string): Promise<UserAvailabilityDomain | null>;
  update(
    id: string,
    data: UpdateUserAvailabilityDto,
  ): Promise<UserAvailabilityDomain>;
  delete(id: string): Promise<UserAvailabilityDomain>;
}

@Injectable()
export class UserAvailabilityService implements IUserAvailabilityService {
  public constructor(
    @Inject('IUserAvailabilityRepo')
    private readonly repo: IUserAvailabilityRepo,
  ) {}

  async create(user: JWTPayload, data: CreateUserAvailabilityDto) {
    try {
      const entities = await this.repo.create(user.id, data);
      return entities;
    } catch (err) {
      throw ErrorMapper.mapToHTTPError(err);
    }
  }

  async findByUserAndCourse(
    user: JWTPayload,
    query: GetUserAvailabilitiesQueryDto,
  ) {
    try {
      const entities = await this.repo.findAllByUserAndCourse(
        user.id,
        query.course_id,
      );
      return entities;
    } catch (err) {
      throw ErrorMapper.mapToHTTPError(err);
    }
  }

  async findById(id: string) {
    try {
      const entity = await this.repo.findById(id);
      return entity;
    } catch (err) {
      throw ErrorMapper.mapToHTTPError(err);
    }
  }

  async update(id: string, data: UpdateUserAvailabilityDto) {
    try {
      const entity = await this.repo.update(id, data);
      return entity;
    } catch (err) {
      throw ErrorMapper.mapToHTTPError(err);
    }
  }

  async delete(id: string) {
    try {
      const entity = await this.repo.delete(id);
      return entity;
    } catch (err) {
      throw ErrorMapper.mapToHTTPError(err);
    }
  }
}
