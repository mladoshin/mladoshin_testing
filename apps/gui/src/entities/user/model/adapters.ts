import { UserResponse } from "@shared/types";
import { User } from "./types";

export class UserAdapter {
  static mapFromResponse = (res: UserResponse): User => ({
    id: res.id,
    email: res.email,
    first_name: res.first_name,
    last_name: res.last_name,
    bio: res.bio,
    role: res.role,
  });
}
