import { UserAdapter } from "@/entities/user/model/adapters";
import axios from "@/shared/api/axios";
import type { AuthResponse, LoginUserDto, RegisterUserDto, UserResponse } from "@shared/types";

export const authApi = {
  async getMe(): Promise<UserResponse> {
    const res = await axios.get("/auth/me");
    const mappedUser = UserAdapter.mapFromResponse(res.data);
    return mappedUser;
  },
  async login(data: LoginUserDto): Promise<AuthResponse> {
    const res = await axios.post("/auth/login", data);
    return res.data;
  },
  async logout(): Promise<void> {
    await axios.post("/auth/logout");
  },
  async register(data: RegisterUserDto): Promise<AuthResponse> {
    const res = await axios.post("/auth/register", data);
    return res.data;
  },
  async refresh(): Promise<AuthResponse> {
    const res = await axios.post("/auth/refresh");
    return res.data;
  },
};
