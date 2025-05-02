import { UserRole } from '../entities/user.entity';

export class CreateUserDto {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  bio?: string;
  role?: UserRole;
}
