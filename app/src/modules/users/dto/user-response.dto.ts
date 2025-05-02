import { NotFoundException } from '@nestjs/common';
import { User } from '../entities/user.entity';
import { instanceToPlain } from 'class-transformer';

export class UserResponse {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  bio: string;
  role: string;

  constructor(user: User) {
    const { profile, password, ...rest } = instanceToPlain(user) as User;
    Object.assign(this, rest);
    this.first_name = profile.first_name;
    this.last_name = profile.last_name;
    this.bio = profile.bio;
  }

  static make(user: User | null): UserResponse {
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    return new UserResponse(user);
  }

  static collection(users: User[]): UserResponse[] {
    return users.map((user) => new UserResponse(user));
  }
}
