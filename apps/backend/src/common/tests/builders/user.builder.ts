// tests/builders/user.builder.ts
import { UserProfile } from 'src/modules/users/entities/user-profile.entity';
import { User, UserRole } from 'src/modules/users/entities/user.entity';
import { v4 as uuidv4 } from 'uuid';

export class UserBuilder {
  private id = uuidv4();
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

  withId(id: string) {
    this.id = id;
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

  build(): User {
    return {
      id: this.id,
      email: this.email,
      password: this.password,
      role: this.role,
      profile: {
        id: uuidv4(),
        first_name: this.first_name,
        last_name: this.last_name,
        bio: this.bio,
      } as UserProfile,
    };
  }
}
