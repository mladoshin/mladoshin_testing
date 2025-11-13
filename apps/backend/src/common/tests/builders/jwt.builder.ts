// tests/builders/user.builder.ts
import { JWTPayload } from 'src/modules/auth/guards/AuthGuard';
import { UserRole } from 'src/modules/users/entities/user.entity';
import { v4 as uuidv4 } from 'uuid';

export class JWTBuilder {
  private id = uuidv4();
  private email = 'test@mail.ru';
  private role = UserRole.USER;

  withId(id: string) {
    this.id = id;
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

  build(): JWTPayload {
    return {
      id: this.id,
      email: this.email,
      role: this.role,
    };
  }
}
