import { useAuthStore } from "@/features/auth/model/store";

export const useProfilePageModel = () => {
  const { user } = useAuthStore();
  return {
    user,
  };
};
