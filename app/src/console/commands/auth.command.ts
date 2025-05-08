import { Command, CommandRunner, Option } from 'nest-commander';
import { Injectable, Inject } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import { RegisterUserDto } from 'src/modules/auth/dto/register.dto';
import { AuthService } from 'src/modules/auth/auth.service';
import { LoginUserDto } from 'src/modules/auth/dto/login.dto';

@Command({
  name: 'auth:register',
  description: 'Зарегистрировать пользователя',
})
@Injectable()
export class RegisterUserCommand extends CommandRunner {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {
    super();
  }

  async run(
    passedParams: string[],
    options: Record<string, any>,
  ): Promise<void> {
    const dto = plainToInstance(RegisterUserDto, options);
    await validateOrReject(dto);

    const result = await this.authService.register(dto);
    console.log('✅ Успешная регистрация. Токены:', result);
  }

  @Option({ flags: '-f, --first_name <first_name>' })
  getFirstName(val: string) {
    return val;
  }

  @Option({ flags: '-l, --last_name <last_name>' })
  getLastName(val: string) {
    return val;
  }

  @Option({ flags: '-e, --email <email>' })
  getEmail(val: string) {
    return val;
  }

  @Option({ flags: '-p, --password <password>' })
  getPassword(val: string) {
    return val;
  }
}

@Command({
  name: 'auth:login',
  description: 'Авторизовать пользователя',
})
@Injectable()
export class LoginUserCommand extends CommandRunner {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {
    super();
  }

  async run(
    passedParams: string[],
    options: Record<string, any>,
  ): Promise<void> {
    const dto = plainToInstance(LoginUserDto, options);
    await validateOrReject(dto);

    const result = await this.authService.login(dto);
    console.log('✅ Успешная авторизация. Токены:', result);
  }

  @Option({ flags: '-e, --email <email>' })
  getEmail(val: string) {
    return val;
  }

  @Option({ flags: '-p, --password <password>' })
  getPassword(val: string) {
    return val;
  }
}

@Command({
  name: 'auth:check',
  description: 'Проверить наличие пользователя по email',
  options: { isDefault: true },
})
export class CheckUserCommand extends CommandRunner {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {
    super();
  }

  async run(
    passedParams: string[],
    options: { email?: string },
  ): Promise<void> {
    if (!options.email) {
      console.log('❌ Укажите email через --email');
      return;
    }

    const exists = await this.authService.check(options.email);
    console.log(
      exists ? '✅ Пользователь найден' : '❌ Пользователь не найден',
    );
  }

  @Option({
    flags: '-e, --email <email>',
    description: 'Email пользователя',
  })
  parseEmail(val: string): string {
    return val;
  }
}
