import { create } from "zustand";
import { authApi } from "./api";
import { LoginUserDto, RegisterUserDto, UserEntity } from "@shared/types";
import { User } from "@/entities/user/model/types";
import { UserAdapter } from "@/entities/user/model/adapters";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;
  login: (data: LoginUserDto) => void;
  logout: () => void;
  register: (data: RegisterUserDto) => void;
  fetchUser() : Promise<User | null>;
}

export const useAuthStore = create<AuthState>((set) => {
  const token = localStorage.getItem("accessToken");

  return {
    user: null,
    isLoading: false,
    error: null,
    accessToken: token,
    isAuthenticated: !!token,

    async fetchUser() {
      try {
        const user = await authApi.getMe();
        set({ user });
        return UserAdapter.mapFromResponse(user)
      } catch (err: any) {
        console.error("❌ Failed to fetch user:", err);
        set({ user: null, error: "Не удалось загрузить профиль" });
        return null;
      }
    },

    setAccessToken: (token) => {
      if (token) {
        localStorage.setItem("accessToken", token);
      } else {
        localStorage.removeItem("accessToken");
      }
      set({ accessToken: token, isAuthenticated: !!token });
    },

    async login(data) {
      set({ isLoading: true, error: null });
      try {
        const user = await authApi.login(data);
        console.log("✅ Logged in:", user);
        const token = user.access_token;
        if (token) {
          localStorage.setItem("accessToken", token);
          set({ accessToken: token, isAuthenticated: true });
        }
      } catch (err: any) {
        set({ error: err?.response?.data?.message || "Ошибка входа" });
      } finally {
        set({ isLoading: false });
      }
    },
    async logout() {
      set({ isLoading: true, error: null });
      try {
        await authApi.logout();
        console.log("✅ Logged out:");
        localStorage.removeItem("accessToken");
        set({ accessToken: null, isAuthenticated: false });
      } catch (err: any) {
        set({ error: err?.response?.data?.message || "Ошибка выхода" });
      } finally {
        set({ isLoading: false });
      }
    },
    async register(data) {
      set({ isLoading: true, error: null });
      try {
        const user = await authApi.register(data);
        console.log("✅ Registered:", user);
        const token = user.access_token;
        if (token) {
          localStorage.setItem("accessToken", token);
          set({ accessToken: token, isAuthenticated: true });
        }
      } catch (err: any) {
        set({ error: err?.response?.data?.message || "Ошибка регистрации" });
      } finally {
        set({ isLoading: false });
      }
    },
  };
});
