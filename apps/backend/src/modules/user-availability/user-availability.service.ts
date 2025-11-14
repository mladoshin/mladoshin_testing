import { Inject, Injectable } from '@nestjs/common';
import { JWTPayload } from '../auth/guards/AuthGuard';
import { IUserAvailabilityRepo } from './user-availability.repository';
import { CreateUserAvailabilityDto } from './dto/create-user-availability.dto';
import { UserAvailabilityDomain } from './domains/user-availability.domain';
import { GetUserAvailabilitiesQueryDto } from './dto/get-user-availabilities-query.dto';
import { UpdateUserAvailabilityDto } from './dto/update-user-availability.dto';

export interface IUserAvailabilityService {
  create(
    user: JWTPayload,
    data: CreateUserAvailabilityDto,
    options?: any,
  ): Promise<UserAvailabilityDomain>;
  findByUserAndCourse(
    user: JWTPayload,
    query: GetUserAvailabilitiesQueryDto,
    options?: any,
  ): Promise<UserAvailabilityDomain[]>;
  findById(id: string, options?: any): Promise<UserAvailabilityDomain | null>;
  update(
    id: string,
    data: UpdateUserAvailabilityDto,
    options?: any,
  ): Promise<UserAvailabilityDomain>;
  delete(id: string, options?: any): Promise<UserAvailabilityDomain>;
}

@Injectable()
export class UserAvailabilityService implements IUserAvailabilityService {
  public constructor(
    @Inject('IUserAvailabilityRepo')
    private readonly repo: IUserAvailabilityRepo,
  ) {}

  async create(user: JWTPayload, data: CreateUserAvailabilityDto, options?: any) {
    const entities = await this.repo.create(user.id, data, options);
    return entities;
  }

  async findByUserAndCourse(
    user: JWTPayload,
    query: GetUserAvailabilitiesQueryDto,
    options?: any,
  ) {
    const entities = await this.repo.findAllByUserAndCourse(
      user.id,
      query.course_id,
      options,
    );
    return entities;
  }

  async findById(id: string, options?: any) {
    const entity = await this.repo.findById(id, options);
    return entity;
  }

  async update(id: string, data: UpdateUserAvailabilityDto, options?: any) {
    const entity = await this.repo.update(id, data, options);
    return entity;
  }

  async delete(id: string, options?: any) {
    const entity = await this.repo.delete(id, options);
    return entity;
  }
}
