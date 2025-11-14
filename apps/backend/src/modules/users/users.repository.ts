import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import {
  RepositoryNotFoundError,
  RepositoryUnknownError,
} from 'src/common/errors/db-errors';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import { DataSource, Repository } from 'typeorm';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserProfile } from './entities/user-profile.entity';
import { UserDomain } from './domains/user.domain';
import { UsersMapper } from './users.mapper';

export interface IUserRepo {
  findByEmail(email: string, options?: any): Promise<UserDomain | null>;
  findById(id: string, options?: any): Promise<UserDomain | null>;
  findOrFailById(id: string, options?: any): Promise<UserDomain>;
  findAll(options?: any): Promise<UserDomain[]>;
  create(createUserDto: CreateUserDto, options?: any): Promise<UserDomain>;
  update(id: string, updateUserDto: UpdateUserDto, options?: any): Promise<UserDomain>;
  delete(id: string, options?: any): Promise<UserDomain>;
}

@Injectable()
export class UserRepo implements IUserRepo {
  public constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
    @InjectRepository(UserProfile)
    private readonly profileRepository: Repository<UserProfile>,
    @InjectDataSource() private dataSource: DataSource
  ) {}

  private async getORMRepository(options?: any) {
    const entityManager = this.dataSource.createEntityManager();
    if (options?.schema) {
      await entityManager.query(`SET search_path TO "${options.schema}"`);
    }
    return {
      userRepository: entityManager.getRepository(User),
      profileRepository: entityManager.getRepository(UserProfile),
    };
  }

  async findByEmail(email: string, options?: any) {
    const { userRepository } = await this.getORMRepository(options);

    const userDBEntity = await userRepository.findOne({
      where: { email },
      relations: {
        profile: true,
      },
    });
    return userDBEntity ? UsersMapper.toDomainEntity(userDBEntity) : null;
  }

  async delete(id: string, options?: any) {
    const { userRepository } = await this.getORMRepository(options);
    const userDomain = await this.findOrFailById(id, options);
    const backup = { ...userDomain };
    try {
      await userRepository.remove(userDomain as User);
    } catch (err) {
      throw new RepositoryUnknownError(err.message, UserRepo.name);
    }
    return backup;
  }

  async update(id: string, updateUserDto: UpdateUserDto, options?: any) {
    const { userRepository, profileRepository } = await this.getORMRepository(options);
    let userDomain = await this.findOrFailById(id, options);

    // Обновляем основные поля пользователя
    if (updateUserDto.email !== undefined) {
      (userDomain as User).email = updateUserDto.email;
    }
    if (updateUserDto.password !== undefined) {
      (userDomain as User).password = updateUserDto.password;
    }
    if (updateUserDto.role !== undefined) {
      (userDomain as User).role = updateUserDto.role;
    }

    // Обновляем поля профиля
    if (updateUserDto.first_name !== undefined) {
      (userDomain as User).profile.first_name = updateUserDto.first_name;
    }
    if (updateUserDto.last_name !== undefined) {
      (userDomain as User).profile.last_name = updateUserDto.last_name;
    }
    if (updateUserDto.bio !== undefined) {
      (userDomain as User).profile.bio = updateUserDto.bio;
    }

    try {
      // Сохраняем профиль отдельно
      if (updateUserDto.first_name !== undefined || updateUserDto.last_name !== undefined || updateUserDto.bio !== undefined) {
        await profileRepository.save((userDomain as User).profile);
      }
      // Сохраняем пользователя
      await userRepository.save(userDomain as User);

      // Перезагружаем пользователя с обновленным профилем
      return await this.findOrFailById(id, options);
    } catch (err) {
      throw new RepositoryUnknownError(err.message, UserRepo.name);
    }
  }

  async create(createUserDto: CreateUserDto, options?: any) {
    try {
      const { userRepository, profileRepository } = await this.getORMRepository(options);

      // Создаём профиль (не сохраняем отдельно - cascade:true сделает это)
      const profile = profileRepository.create({
        first_name: createUserDto.first_name,
        last_name: createUserDto.last_name,
        bio: createUserDto.bio || '',
      });

      // Создаём пользователя с профилем
      let userDBEntity = userRepository.create({
        email: createUserDto.email,
        password: createUserDto.password,
        role: createUserDto.role,
        profile: profile,
      });

      // Сохраняем пользователя (профиль сохранится автоматически благодаря cascade: true)
      userDBEntity = await userRepository.save(userDBEntity);
      return UsersMapper.toDomainEntity(userDBEntity);
    } catch (err) {
      throw new RepositoryUnknownError(err.message, UserRepo.name);
    }
  }

  async findById(id: string, options?: any) {
    const { userRepository } = await this.getORMRepository(options);

    const userDBEntity = await userRepository.findOne({
      where: { id },
      relations: {
        profile: true,
      },
    });
    return userDBEntity ? UsersMapper.toDomainEntity(userDBEntity) : null;
  }

  async findOrFailById(id: string, options?: any) {
    const userDomain = await this.findById(id, options);
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
