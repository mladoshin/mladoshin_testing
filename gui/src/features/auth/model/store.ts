import { create } from "zustand";
import { authApi, LoginDto, RegisterDto } from "./api";

interface AuthState {
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;
  login: (data: LoginDto) => void;
  register: (data: RegisterDto) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isLoading: false,
  error: null,
  accessToken: null,
  isAuthenticated: false,

  setAccessToken: (token) => {
    if (token) {
      localStorage.setItem("accessToken", token);
    } else {
      localStorage.removeItem("accessToken");
    }
    set({ accessToken: token });
  },

  async login(data) {
    set({ isLoading: true, error: null });
    try {
      const user = await authApi.login(data);
      console.log("✅ Logged in:", user);
      set({ isAuthenticated: true });
    } catch (err: any) {
      set({ error: err?.response?.data?.message || "Ошибка входа" });
    } finally {
      set({ isLoading: false });
    }
  },

  async register(data) {
    set({ isLoading: true, error: null });
    try {
      const user = await authApi.register(data);
      console.log("✅ Registered:", user);
      set({ isAuthenticated: true });
    } catch (err: any) {
      set({ error: err?.response?.data?.message || "Ошибка регистрации" });
    } finally {
      set({ isLoading: false });
    }
  },
}));
