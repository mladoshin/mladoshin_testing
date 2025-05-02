import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RepositoryNotFoundError } from 'src/common/errors/db-errors';
import { CreateUserDto } from 'src/modules/users/dto/create-user.dto';
import { User } from 'src/modules/users/entities/user.entity';
import { Repository } from 'typeorm';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserRepo {
  public constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
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
    await this.repository.remove(user);
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    let user = await this.findOrFailById(id);
    const updated = this.repository.merge(user, updateUserDto);
    user = await this.repository.save(updated);
    return user;
  }

  create(createUserDto: CreateUserDto) {
    const user = this.repository.create(createUserDto);
    return this.repository.save(user);
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
