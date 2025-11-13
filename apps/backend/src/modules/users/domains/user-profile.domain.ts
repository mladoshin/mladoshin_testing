import { UserDomain } from './user.domain';

export class UserProfileDomain {
  id: string;
  first_name: string;
  last_name: string;
  bio: string;
  user: UserDomain;
}
