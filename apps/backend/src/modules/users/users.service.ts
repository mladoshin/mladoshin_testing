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
  create(createUserDto: CreateUserDto): Promise<UserDomain>;
  findAll(): Promise<UserDomain[]>;
  findOne(id: string): Promise<UserDomain>;
  update(id: string, updateUserDto: UpdateUserDto): Promise<UserDomain>;
  remove(id: string): Promise<UserDomain>;
}

@Injectable()
export class UsersService implements IUsersService {
  public constructor(
    @Inject('IUserRepo') private readonly userRepository: IUserRepo,
  ) {}

  create(createUserDto: CreateUserDto): Promise<UserDomain> {
    return this.userRepository.create(createUserDto);
  }

  findAll(): Promise<UserDomain[]> {
    return this.userRepository.findAll();
  }

  findOne(id: string): Promise<UserDomain> {
    try {
      return this.userRepository.findOrFailById(id);
    } catch (err) {
      throw err;
    }
  }

  update(id: string, updateUserDto: UpdateUserDto): Promise<UserDomain> {
    try {
      return this.userRepository.update(id, updateUserDto);
    } catch (err) {
      throw err;
    }
  }

  remove(id: string): Promise<UserDomain> {
    try {
      return this.userRepository.delete(id);
    } catch (err) {
      throw err;
    }
  }
}
