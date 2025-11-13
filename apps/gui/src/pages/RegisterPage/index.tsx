import { GuestLayout } from "@/layouts/GuestLayout/GuestLayout";
import { useRegisterPageModel } from "./model";
import { RegisterForm } from "@/features/auth/ui/RegisterForm";

export const RegisterPage = () => {
  useRegisterPageModel();

  return (
    <GuestLayout>
      <div className="flex justify-center items-center h-screen">
        <div className="w-full max-w-md p-6 bg-white rounded shadow">
          <h1 className="text-2xl font-bold mb-4 text-center text-black">Регистрация</h1>
          <RegisterForm />
        </div>
      </div>
    </GuestLayout>
  );
};
