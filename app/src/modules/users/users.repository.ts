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

export interface IUserRepo {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  findOrFailById(id: string): Promise<User>;
  findAll(): Promise<User[]>;
  create(createUserDto: CreateUserDto): Promise<User>;
  update(id: string, updateUserDto: UpdateUserDto): Promise<User>;
  delete(id: string): Promise<User>;
}

@Injectable()
export class UserRepo implements IUserRepo{
  public constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
    @InjectRepository(UserProfile)
    private readonly profileRepository: Repository<UserProfile>,
  ) {}

  findByEmail(email: string) {
    return this.repository.findOne({
      where: { email },
      relations: {
        profile: true,
      },
    });
  }

  async delete(id: string) {
    const user = await this.findOrFailById(id);
    try {
      await this.repository.remove(user);
    } catch (err) {
      throw new RepositoryUnknownError(err.message, UserRepo.name);
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    let user = await this.findOrFailById(id);
    const updated = this.repository.merge(user, updateUserDto);
    try {
      user = await this.repository.save(updated);
    } catch (err) {
      throw new RepositoryUnknownError(err.message, UserRepo.name);
    }
    return user;
  }

  create(createUserDto: CreateUserDto) {
    const user = this.repository.create(createUserDto);
    user.profile = this.profileRepository.create({
      first_name: createUserDto.first_name,
      last_name: createUserDto.last_name,
    });
    try {
      return this.repository.save(user);
    } catch (err) {
      throw new RepositoryUnknownError(err.message, UserRepo.name);
    }
  }

  findById(id: string) {
    return this.repository.findOne({
      where: { id },
      relations: {
        profile: true,
      },
    });
  }

  async findOrFailById(id: string) {
    const user = await this.findById(id);
    if (!user) {
      throw new RepositoryNotFoundError('Пользователь не найден.', User.name);
    }
    return user;
  }

  findAll() {
    return this.repository.find({
      relations: {
        profile: true,
      },
    });
  }
}
