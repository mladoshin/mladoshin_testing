import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
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
    options?: any,
  ): Promise<UserAvailabilityDomain>;
  update(
    id: string,
    dto: UpdateUserAvailabilityDto,
    options?: any,
  ): Promise<UserAvailabilityDomain>;
  delete(id: string, options?: any): Promise<UserAvailabilityDomain>;
  findById(id: string, options?: any): Promise<UserAvailabilityDomain | null>;
  findOrFailById(id: string, options?: any): Promise<UserAvailabilityDomain>;
  findAllByUserAndCourse(
    userId: string,
    courseId: string,
    options?: any,
  ): Promise<UserAvailabilityDomain[]>;
  findAll(options?: any): Promise<UserAvailabilityDomain[]>;
}

@Injectable()
export class UserAvailabilityRepo implements IUserAvailabilityRepo {
  constructor(
    @InjectRepository(UserAvailability)
    private readonly repository: Repository<UserAvailability>,
    @Inject(DataSource) private readonly dataSource: DataSource,
  ) {}

  private async getORMRepository(options?: any) {
    const entityManager = this.dataSource.createEntityManager();
    if (options?.schema) {
      await entityManager.query(`SET search_path TO "${options.schema}"`);
    }
    return entityManager.getRepository(UserAvailability);
  }

  async create(userId: string, dto: CreateUserAvailabilityDto, options?: any) {
    const repository = await this.getORMRepository(options);
    const entity = repository.create({
      user_id: userId,
      ...dto,
    });

    try {
      const saved = await repository.save(entity);
      return UserAvailabilityMapper.toDomainEntity(saved);
    } catch (err) {
      throw new RepositoryUnknownError(err.message, UserAvailabilityRepo.name);
    }
  }

  async update(id: string, dto: UpdateUserAvailabilityDto, options?: any) {
    const repository = await this.getORMRepository(options);
    const existing = await this.findOrFailById(id, options);
    const merged = repository.merge(existing as UserAvailability, dto);

    try {
      const updated = await repository.save(merged);
      return UserAvailabilityMapper.toDomainEntity(updated);
    } catch (err) {
      throw new RepositoryUnknownError(err.message, UserAvailabilityRepo.name);
    }
  }

  async delete(id: string, options?: any) {
    const repository = await this.getORMRepository(options);
    const entity = await this.findOrFailById(id, options);
    const backup = { ...entity };
    try {
      await repository.remove(entity as UserAvailability);
    } catch (err) {
      throw new RepositoryUnknownError(err.message, UserAvailabilityRepo.name);
    }
    return backup;
  }

  async findById(id: string, options?: any) {
    const repository = await this.getORMRepository(options);
    const found = await repository.findOne({
      where: { id },
      relations: { user: true, course: true },
    });
    return found ? UserAvailabilityMapper.toDomainEntity(found) : null;
  }

  async findOrFailById(id: string, options?: any) {
    const repository = await this.getORMRepository(options);
    const found = await repository.findOne({
      where: { id },
      relations: { user: true, course: true },
    });
    if (!found) {
      throw new RepositoryNotFoundError(
        'UserAvailability not found',
        UserAvailability.name,
      );
    }
    return UserAvailabilityMapper.toDomainEntity(found);
  }

  async findAllByUserAndCourse(userId: string, courseId: string, options?: any) {
    const repository = await this.getORMRepository(options);
    const items = await repository.find({
      where: { user_id: userId, course_id: courseId },
      relations: { user: true, course: true },
    });
    return items.map(UserAvailabilityMapper.toDomainEntity);
  }

  async findAll(options?: any) {
    const repository = await this.getORMRepository(options);
    const items = await repository.find({
      relations: { user: true, course: true },
    });
    return items.map(UserAvailabilityMapper.toDomainEntity);
  }
}
