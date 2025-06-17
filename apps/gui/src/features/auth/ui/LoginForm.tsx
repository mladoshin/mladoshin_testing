import { useState } from "react";
import { useAuthStore } from "../model/store";
import { Link } from "react-router-dom";

export const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, isLoading, error } = useAuthStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return alert("Заполните все поля");
    login({ email, password });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-black">
      {error && <div className="text-red-500">{error}</div>}

      <input
        type="email"
        placeholder="Email"
        className="w-full px-3 py-2 border rounded border-gray-200"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <input
        type="password"
        placeholder="Пароль"
        className="w-full px-3 py-2 border rounded border-gray-200"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      <button
        type="submit"
        className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer"
        disabled={isLoading}
      >
        Войти
      </button>

      {/* Ссылка на регистрацию */}
      <div className="text-center text-sm">
        <span className=" text-gray-600">Нет аккаунта?</span>{" "}
        <Link to="/register" className="text-blue-600 hover:underline">
          Зарегистрироваться
        </Link>
      </div>
    </form>
  );
};
