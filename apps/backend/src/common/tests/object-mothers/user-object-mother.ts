import { CreateUserDto } from 'src/modules/users/dto/create-user.dto';
import { UpdateUserDto } from 'src/modules/users/dto/update-user.dto';
import { UserRole } from 'src/modules/users/entities/user.entity';

export class UserObjectMother {
  static buildCreateDto(overrides?: Partial<CreateUserDto>): CreateUserDto {
    const dto: CreateUserDto = {
      email: 'test@example.com',
      password: 'TestPassword123!',
      first_name: 'Иван',
      last_name: 'Иванов',
      bio: 'Тестовая биография пользователя',
      role: UserRole.USER,
      ...overrides,
    };

    return dto;
  }

  static buildUpdateDto(overrides?: Partial<UpdateUserDto>): UpdateUserDto {
    const dto: UpdateUserDto = {
      first_name: 'Петр',
      last_name: 'Петров',
      bio: 'Обновленная биография',
      ...overrides,
    };

    return dto;
  }
}
