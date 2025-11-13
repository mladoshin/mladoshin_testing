import { Command, CommandRunner, Option } from 'nest-commander';
import { Inject, Injectable } from '@nestjs/common';
import { IUsersService } from 'src/modules/users/users.service';
import { CreateUserDto } from 'src/modules/users/dto/create-user.dto';
import { UpdateUserDto } from 'src/modules/users/dto/update-user.dto';
import { UserRole } from 'src/modules/users/entities/user.entity';

// CREATE USER
@Command({ name: 'user:create', description: 'Создать пользователя' })
export class CreateUserCommand extends CommandRunner {
  constructor(
    @Inject('IUsersService') private readonly usersService: IUsersService,
  ) {
    super();
  }

  async run(inputs: string[], options: Record<string, any>): Promise<void> {
    const { email, password, firstName, lastName, bio, role } = options;

    if (!email || !password || !firstName || !lastName) {
      console.error(
        '❌ Требуются поля: --email, --password, --first-name, --last-name',
      );
      return;
    }

    const user: CreateUserDto = {
      email,
      password,
      first_name: firstName,
      last_name: lastName,
      bio,
      role,
    };

    const created = await this.usersService.create(user);
    console.log('✅ Пользователь создан:', created);
  }

  @Option({ flags: '-e, --email <email>' }) parseEmail(val: string) {
    return val;
  }
  @Option({ flags: '-p, --password <password>' }) parsePassword(val: string) {
    return val;
  }
  @Option({ flags: '--first-name <firstName>' }) parseFirstName(val: string) {
    return val;
  }
  @Option({ flags: '--last-name <lastName>' }) parseLastName(val: string) {
    return val;
  }
  @Option({ flags: '--bio <bio>' }) parseBio(val: string) {
    return val;
  }
  @Option({ flags: '--role <role>' }) parseRole(val: string): UserRole {
    return val as UserRole;
  }
}

// LIST USERS
@Command({ name: 'user:list', description: 'Показать всех пользователей' })
export class ListUsersCommand extends CommandRunner {
  constructor(
    @Inject('IUsersService') private readonly usersService: IUsersService,
  ) {
    super();
  }

  async run(): Promise<void> {
    const users = await this.usersService.findAll();
    console.table(
      users.map((user) => ({
        id: user.id,
        email: user.email,
        first_name: user.profile?.first_name,
        last_name: user.profile?.last_name,
        role: user.role,
      })),
      ['id', 'email', 'first_name', 'last_name', 'role'],
    );
  }
}

// SHOW USER BY ID
@Command({ name: 'user:show', description: 'Показать пользователя по ID' })
export class ShowUserCommand extends CommandRunner {
  constructor(
    @Inject('IUsersService') private readonly usersService: IUsersService,
  ) {
    super();
  }

  async run(inputs: string[], options: Record<string, any>): Promise<void> {
    const { id } = options;
    if (!id) {
      console.log('❌ Укажите ID через --id');
      return;
    }
    const user = await this.usersService.findOne(id);
    console.log(user);
  }

  @Option({ flags: '--id <id>' }) parseId(val: string) {
    return val;
  }
}

// UPDATE USER
@Command({ name: 'user:update', description: 'Обновить пользователя по ID' })
@Injectable()
export class UpdateUserCommand extends CommandRunner {
  constructor(
    @Inject('IUsersService') private readonly usersService: IUsersService,
  ) {
    super();
  }

  async run(inputs: string[], options: Record<string, any>): Promise<void> {
    const { id, email, firstName, lastName, bio, role } = options;

    if (!id) {
      console.error('❌ Укажите ID через --id');
      return;
    }

    const data: UpdateUserDto = {
      ...(email && { email }),
      ...(firstName && { first_name: firstName }),
      ...(lastName && { last_name: lastName }),
      ...(bio && { bio }),
      ...(role && { role }),
    };

    const updated = await this.usersService.update(id, data);
    console.log('✅ Обновлено:', updated);
  }

  @Option({ flags: '--id <id>' }) parseId(val: string) {
    return val;
  }
  @Option({ flags: '--email <email>' }) parseEmail(val: string) {
    return val;
  }
  @Option({ flags: '--first-name <firstName>' }) parseFirstName(val: string) {
    return val;
  }
  @Option({ flags: '--last-name <lastName>' }) parseLastName(val: string) {
    return val;
  }
  @Option({ flags: '--bio <bio>' }) parseBio(val: string) {
    return val;
  }
  @Option({ flags: '--role <role>' }) parseRole(val: string): UserRole {
    return val as UserRole;
  }
}

// DELETE USER
@Command({ name: 'user:remove', description: 'Удалить пользователя по ID' })
@Injectable()
export class RemoveUserCommand extends CommandRunner {
  constructor(
    @Inject('IUsersService') private readonly usersService: IUsersService,
  ) {
    super();
  }

  async run(inputs: string[], options: Record<string, any>): Promise<void> {
    const { id } = options;
    if (!id) {
      console.error('❌ Укажите ID через --id');
      return;
    }

    const deleted = await this.usersService.remove(id);
    console.log('🗑️ Удалено:', deleted);
  }

  @Option({ flags: '--id <id>' }) parseId(val: string) {
    return val;
  }
}
