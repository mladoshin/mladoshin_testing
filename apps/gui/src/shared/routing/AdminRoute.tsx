import { useEffect } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/features/auth/model/store";
import { UserRole } from "@shared/types";

export const AdminRoute = () => {
  const navigate = useNavigate();
  const { accessToken, user, fetchUser } = useAuthStore();

  useEffect(() => {
    if (!accessToken) {
      navigate("/login", { replace: true });
    } else {
      fetchUserAndValidate().then((hasAccess) => {
        if (!hasAccess) {
          navigate("/forbidden", { replace: true });
        }
      });
    }
  }, [accessToken, navigate]);

  async function fetchUserAndValidate() {
    let hasAccess = false;
    const user = await fetchUser();
    if (user?.role === UserRole.ADMIN) {
      hasAccess = true;
    }
    return hasAccess;
  }

  if (!accessToken || !user) return null;

  return <Outlet />;
};
