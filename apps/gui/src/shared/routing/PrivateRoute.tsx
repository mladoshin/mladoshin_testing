import { useEffect } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/model/store';

export const PrivateRoute = () => {
  const navigate = useNavigate();
  const {accessToken, fetchUser} = useAuthStore();

  useEffect(() => {
    if (!accessToken) {
      navigate('/login', { replace: true });
    }else{
      fetchUser()
    }
  }, [accessToken, navigate]);

  // Пока accessToken не проверен — ничего не рендерим
  if (!accessToken) return null;

  return <Outlet />;
};
