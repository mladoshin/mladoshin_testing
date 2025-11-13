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
    const entities = await this.repo.create(user.id, data);
    return entities;
  }

  async findByUserAndCourse(
    user: JWTPayload,
    query: GetUserAvailabilitiesQueryDto,
  ) {
    const entities = await this.repo.findAllByUserAndCourse(
      user.id,
      query.course_id,
    );
    return entities;
  }

  async findById(id: string) {
    const entity = await this.repo.findById(id);
    return entity;
  }

  async update(id: string, data: UpdateUserAvailabilityDto) {
    const entity = await this.repo.update(id, data);
    return entity;
  }

  async delete(id: string) {
    const entity = await this.repo.delete(id);
    return entity;
  }
}
