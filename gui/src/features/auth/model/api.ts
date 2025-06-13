import axios from "@/shared/api/axios";

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  name: string;
}

export const authApi = {
  async login(data: LoginDto) {
    const res = await axios.post("/auth/login", data);
    return res.data;
  },
  async register(data: RegisterDto) {
    const res = await axios.post("/auth/register", data);
    return res.data;
  },
  async refresh() {
    const res = await axios.post("/auth/refresh");
    return res.data as { accessToken: string };
  },
};
