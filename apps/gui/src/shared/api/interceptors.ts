// shared/api/interceptors.ts
import { AxiosInstance } from "axios";
import { useAuthStore } from "@/features/auth/model/store";
import { authApi } from "@/features/auth/model/api";
import { ForbiddenError, ValidationError } from "./errors";

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

      // Убедись, что это не login/register
      const isAuthRoute =
        original?.url?.includes("/auth/login") ||
        original?.url?.includes("/auth/register");

      if (error.response?.status === 401 && !original._retry && !isAuthRoute) {
        original._retry = true;

        try {
          const { access_token } = await authApi.refresh();
          useAuthStore.getState().setAccessToken(access_token);

          original.headers = {
            ...original.headers,
            Authorization: `Bearer ${access_token}`,
          };

          return instance(original); // 🔁 Повторить запрос
        } catch (e) {
          useAuthStore.getState().setAccessToken(null);
          window.location.href = "/login";
        }
      } else if (
        error.response?.status === 400 &&
        Array.isArray(error.response?.data?.message)
      ) {
        throw new ValidationError(error);
      } else if (error.response?.status === 403) {
        throw new ForbiddenError(error);
      }

      return Promise.reject(error);
    }
  );
}
