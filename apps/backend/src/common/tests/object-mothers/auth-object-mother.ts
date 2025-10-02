import { LoginUserDto } from 'src/modules/auth/dto/login.dto';
import { RegisterUserDto } from 'src/modules/auth/dto/register.dto';

export class AuthObjectMother {
  static buildRegisterDto(
    overrides?: Partial<RegisterUserDto>,
  ): RegisterUserDto {
    const dto: RegisterUserDto = {
      email: 'a@b.com',
      password: 'pw',
      first_name: 'fn',
      last_name: 'ln',
      ...overrides,
    };

    return dto;
  }

  static buildLoginDto(overrides?: Partial<LoginUserDto>): LoginUserDto {
    const dto: LoginUserDto = {
      email: 'wrong@example.com',
      password: 'badpass',
      ...overrides,
    };

    return dto;
  }

  static buildTokenPair() {
    return {
      accessToken: 'AT',
      refreshToken: 'RT',
    };
  }
}
