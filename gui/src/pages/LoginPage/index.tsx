import { useLoginPageModel } from './model';
import { LoginForm } from '@/features/auth/ui/LoginForm';

export const LoginPage = () => {
  useLoginPageModel();

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="w-full max-w-md p-6 bg-white rounded shadow">
        <h1 className="text-2xl font-bold mb-4 text-center">Вход</h1>
        <LoginForm />
      </div>
    </div>
  );
};
