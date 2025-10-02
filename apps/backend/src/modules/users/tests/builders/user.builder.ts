// tests/builders/user.builder.ts
import { UserDomain } from '../../domains/user.domain';
import { CreateUserDto } from '../../dto/create-user.dto';
import { UpdateUserDto } from '../../dto/update-user.dto';
import { UserRole } from '../../entities/user.entity';

export class UserBuilder {
  private first_name = 'John';
  private last_name = 'Doe';
  private bio = '';
  private role = UserRole.USER;
  private email = 'john@example.com';
  private password = 'password123';

  withFirstName(first_name: string) {
    this.first_name = first_name;
    return this;
  }

  withLastName(last_name: string) {
    this.last_name = last_name;
    return this;
  }

  withBio(bio: string) {
    this.bio = bio;
    return this;
  }

  withRole(role: UserRole) {
    this.role = role;
    return this;
  }

  withEmail(email: string) {
    this.email = email;
    return this;
  }

  withPassword(password: string) {
    this.password = password;
    return this;
  }

  build(): UserDomain {
    return {
      id: '006aeece-b464-4968-8c34-23e581a1cf9b',
      email: this.email,
      password: this.password,
      role: this.role,
      profile: {
        first_name: this.first_name,
        last_name: this.last_name,
        bio: this.bio,
        id: '006aeece-b464-4968-8c34-23e581a1cf9n',
      },
    } as UserDomain;
  }

  buildCreateDto(): CreateUserDto {
    return {
      first_name: this.first_name,
      last_name: this.last_name,
      bio: this.bio,
      email: this.email,
      password: this.password,
    };
  }

  buildUpdateDto(): UpdateUserDto {
    return {
      first_name: this.first_name,
      last_name: this.last_name,
      bio: this.bio,
      role: this.role,
      email: this.email,
    };
  }
}
