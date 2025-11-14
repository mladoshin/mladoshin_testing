import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { IUserRepo } from './users.repository';
import { RepositoryNotFoundError } from 'src/common/errors/db-errors';
import { UserDomain } from './domains/user.domain';

export interface IUsersService {
  create(createUserDto: CreateUserDto, options?: any): Promise<UserDomain>;
  findAll(options?: any): Promise<UserDomain[]>;
  findOne(id: string, options?: any): Promise<UserDomain>;
  update(id: string, updateUserDto: UpdateUserDto, options?: any): Promise<UserDomain>;
  remove(id: string, options?: any): Promise<UserDomain>;
}

@Injectable()
export class UsersService implements IUsersService {
  public constructor(
    @Inject('IUserRepo') private readonly userRepository: IUserRepo,
  ) {}

  create(createUserDto: CreateUserDto, options?: any): Promise<UserDomain> {
    return this.userRepository.create(createUserDto, options);
  }

  findAll(options?: any): Promise<UserDomain[]> {
    return this.userRepository.findAll(options);
  }

  findOne(id: string, options?: any): Promise<UserDomain> {
    try {
      return this.userRepository.findOrFailById(id, options);
    } catch (err) {
      throw err;
    }
  }

  update(id: string, updateUserDto: UpdateUserDto, options?: any): Promise<UserDomain> {
    try {
      return this.userRepository.update(id, updateUserDto, options);
    } catch (err) {
      throw err;
    }
  }

  remove(id: string, options?: any): Promise<UserDomain> {
    try {
      return this.userRepository.delete(id, options);
    } catch (err) {
      throw err;
    }
  }
}
