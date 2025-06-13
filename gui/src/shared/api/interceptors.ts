// shared/api/interceptors.ts
import { AxiosInstance } from "axios";
import { useAuthStore } from "@/features/auth/model/store";
import { authApi } from "@/features/auth/model/api";

export function setupInterceptors(instance: AxiosInstance) {
  instance.interceptors.request.use((config) => {
    const token = useAuthStore.getState().accessToken;

    if (token) {
      config.headers?.set?.("Authorization", `Bearer ${token}`);
    }

    return config;
  });

  instance.interceptors.response.use(
    (res) => res,
    async (error) => {
      const original = error.config;
      if (error.response?.status === 401 && !original._retry) {
        original._retry = true;
        try {
          const { accessToken } = await authApi.refresh();
          useAuthStore.getState().setAccessToken(accessToken);
          original.headers.Authorization = `Bearer ${accessToken}`;
          return instance(original); // повтор запроса
        } catch (e) {
          useAuthStore.getState().setAccessToken(null);
          window.location.href = "/login";
        }
      }
      return Promise.reject(error);
    }
  );
}
