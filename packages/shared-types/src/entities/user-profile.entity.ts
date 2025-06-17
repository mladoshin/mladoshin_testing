import { UserEntity } from "./user.entity";

export class UserProfileEntity {
  id: string;
  first_name: string;
  last_name: string;
  bio: string;
  user_id: string;
  user: UserEntity | null;
}
