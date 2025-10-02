// tests/factories/user.factory.ts
import { UserDomain } from '../../domains/user.domain';
import { UserRole } from '../../entities/user.entity';

export class UserFactory {
  static default(): UserDomain {
    return {
      id: 'user-1',
      profile: {
        first_name: 'John',
        last_name: 'Doe',
        bio: '',
        id: 'profile-1',
      },
      role: UserRole.USER, // например, 'student' | 'teacher' | 'admin'
      email: 'john@example.com',
      password: 'password123', // обычно хэш
    } as UserDomain;
  }
}
