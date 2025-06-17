import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  RepositoryNotFoundError,
  RepositoryUnknownError,
} from 'src/common/errors/db-errors';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserProfile } from './entities/user-profile.entity';
import { UserDomain } from './domains/user.domain';
import { UsersMapper } from './users.mapper';

export interface IUserRepo {
  findByEmail(email: string): Promise<UserDomain | null>;
  findById(id: string): Promise<UserDomain | null>;
  findOrFailById(id: string): Promise<UserDomain>;
  findAll(): Promise<UserDomain[]>;
  create(createUserDto: CreateUserDto): Promise<UserDomain>;
  update(id: string, updateUserDto: UpdateUserDto): Promise<UserDomain>;
  delete(id: string): Promise<UserDomain>;
}

@Injectable()
export class UserRepo implements IUserRepo {
  public constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
    @InjectRepository(UserProfile)
    private readonly profileRepository: Repository<UserProfile>,
  ) {}

  async findByEmail(email: string) {
    const userDBEntity = await this.repository.findOne({
      where: { email },
      relations: {
        profile: true,
      },
    });
    return userDBEntity ? UsersMapper.toDomainEntity(userDBEntity) : null;
  }

  async delete(id: string) {
    const userDomain = await this.findOrFailById(id);
    try {
      await this.repository.remove(userDomain as User);
    } catch (err) {
      throw new RepositoryUnknownError(err.message, UserRepo.name);
    }
    return userDomain;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    let userDomain = await this.findOrFailById(id);
    const updated = this.repository.merge(userDomain as User, updateUserDto);
    try {
      userDomain = await this.repository.save(updated);
    } catch (err) {
      throw new RepositoryUnknownError(err.message, UserRepo.name);
    }
    return userDomain;
  }

  async create(createUserDto: CreateUserDto) {
    let userDBEntity = this.repository.create(createUserDto);
    userDBEntity.profile = this.profileRepository.create({
      first_name: createUserDto.first_name,
      last_name: createUserDto.last_name,
    });
    try {
      userDBEntity = await this.repository.save(userDBEntity);
      return UsersMapper.toDomainEntity(userDBEntity);
    } catch (err) {
      throw new RepositoryUnknownError(err.message, UserRepo.name);
    }
  }

  async findById(id: string) {
    const userDBEntity = await this.repository.findOne({
      where: { id },
      relations: {
        profile: true,
      },
    });
    return userDBEntity ? UsersMapper.toDomainEntity(userDBEntity) : null;
  }

  async findOrFailById(id: string) {
    const userDomain = await this.findById(id);
    if (!userDomain) {
      throw new RepositoryNotFoundError('Пользователь не найден.', User.name);
    }
    return userDomain;
  }

  async findAll() {
    const userDBEntities = await this.repository.find({
      relations: {
        profile: true,
      },
    });
    return userDBEntities.map((user) => UsersMapper.toDomainEntity(user));
  }
}
