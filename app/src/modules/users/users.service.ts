import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRepo } from './users.repository';
import { RepositoryNotFoundError } from 'src/common/errors/db-errors';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  public constructor(private readonly userRepository: UserRepo) {}

  create(createUserDto: CreateUserDto): Promise<User> {
    return this.userRepository.create(createUserDto);
  }

  findAll(): Promise<User[]> {
    return this.userRepository.findAll();
  }

  findOne(id: string): Promise<User> {
    try {
      return this.userRepository.findOrFailById(id);
    } catch (err) {
      if (err instanceof RepositoryNotFoundError) {
        throw new NotFoundException(err.message);
      }
      throw new InternalServerErrorException(err?.message);
    }
  }

  update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    try {
      return this.userRepository.update(id, updateUserDto);
    } catch (err) {
      if (err instanceof RepositoryNotFoundError) {
        throw new NotFoundException(err.message);
      }
      throw new InternalServerErrorException(err?.message);
    }
  }

  remove(id: string): Promise<User> {
    try {
      return this.userRepository.delete(id);
    } catch (err) {
      if (err instanceof RepositoryNotFoundError) {
        throw new NotFoundException(err.message);
      }
      throw new InternalServerErrorException(err?.message);
    }
  }
}
