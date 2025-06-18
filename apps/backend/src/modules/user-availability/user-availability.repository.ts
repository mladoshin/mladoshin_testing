import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  RepositoryNotFoundError,
  RepositoryUnknownError,
} from 'src/common/errors/db-errors';
import { UserAvailability } from './entities/user-availability.entity';
import { CreateUserAvailabilityDto } from './dto/create-user-availability.dto';
import { UpdateUserAvailabilityDto } from './dto/update-user-availability.dto';
import { UserAvailabilityDomain } from './domains/user-availability.domain';
import { UserAvailabilityMapper } from './user-availability.mapper';

export interface IUserAvailabilityRepo {
  create(
    userId: string,
    dto: CreateUserAvailabilityDto,
  ): Promise<UserAvailabilityDomain>;
  update(
    id: string,
    dto: UpdateUserAvailabilityDto,
  ): Promise<UserAvailabilityDomain>;
  delete(id: string): Promise<UserAvailabilityDomain>;
  findById(id: string): Promise<UserAvailabilityDomain | null>;
  findOrFailById(id: string): Promise<UserAvailabilityDomain>;
  findAllByUser(userId: string): Promise<UserAvailabilityDomain[]>;
  findAllByCourse(courseId: string): Promise<UserAvailabilityDomain[]>;
  findAll(): Promise<UserAvailabilityDomain[]>;
}

@Injectable()
export class UserAvailabilityRepo implements IUserAvailabilityRepo {
  constructor(
    @InjectRepository(UserAvailability)
    private readonly repository: Repository<UserAvailability>,
  ) {}

  async create(userId: string, dto: CreateUserAvailabilityDto) {
    const entity = this.repository.create({
      user_id: userId,
      ...dto
    });

    try {
      const saved = await this.repository.save(entity);
      return UserAvailabilityMapper.toDomainEntity(saved);
    } catch (err) {
      throw new RepositoryUnknownError(err.message, UserAvailabilityRepo.name);
    }
  }

  async update(id: string, dto: UpdateUserAvailabilityDto) {
    const existing = await this.findOrFailById(id);
    const merged = this.repository.merge(existing as UserAvailability, dto);

    try {
      const updated = await this.repository.save(merged);
      return UserAvailabilityMapper.toDomainEntity(updated);
    } catch (err) {
      throw new RepositoryUnknownError(err.message, UserAvailabilityRepo.name);
    }
  }

  async delete(id: string) {
    const entity = await this.findOrFailById(id);
    const backup = { ...entity };
    try {
      await this.repository.remove(entity as UserAvailability);
    } catch (err) {
      throw new RepositoryUnknownError(err.message, UserAvailabilityRepo.name);
    }
    return backup;
  }

  async findById(id: string) {
    const found = await this.repository.findOne({
      where: { id },
      relations: { user: true, course: true },
    });
    return found ? UserAvailabilityMapper.toDomainEntity(found) : null;
  }

  async findOrFailById(id: string) {
    const found = await this.repository.findOne({ where: { id } });
    if (!found) {
      throw new RepositoryNotFoundError(
        'UserAvailability not found',
        UserAvailability.name,
      );
    }
    return UserAvailabilityMapper.toDomainEntity(found);
  }

  async findAllByUser(userId: string) {
    const items = await this.repository.find({
      where: { user: { id: userId } },
      relations: { user: true, course: true },
    });
    return items.map(UserAvailabilityMapper.toDomainEntity);
  }

  async findAllByCourse(courseId: string) {
    const items = await this.repository.find({
      where: { course: { id: courseId } },
      relations: { user: true, course: true },
    });
    return items.map(UserAvailabilityMapper.toDomainEntity);
  }

  async findAll() {
    const items = await this.repository.find({
      relations: { user: true, course: true },
    });
    return items.map(UserAvailabilityMapper.toDomainEntity);
  }
}
