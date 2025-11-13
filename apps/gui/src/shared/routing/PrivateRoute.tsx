import { useEffect, useState } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/features/auth/model/store";

export const PrivateRoute = () => {
  const navigate = useNavigate();
  const { isLoading, fetchUser } = useAuthStore();

  useEffect(() => {
    fetchUser().then((u) => {
      if (!u) navigate("/login", { replace: true });
    });
  }, []);

  if (isLoading) return null;

  return <Outlet />;
};
