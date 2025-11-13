import { useState } from "react";
import { useAuthStore } from "../model/store";
import { Link } from "react-router-dom";

export const RegisterForm = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { register, isLoading, error } = useAuthStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !password)
      return alert("Заполните все поля");
    register({ first_name: firstName, last_name: lastName, email, password });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-black">
      {error && <div className="text-red-500">{error}</div>}

      <input
        type="text"
        placeholder="Имя"
        className="w-full px-3 py-2 border rounded border-gray-200"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        required
      />

      <input
        type="text"
        placeholder="Фамилия"
        className="w-full px-3 py-2 border rounded border-gray-200"
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
        required
      />

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
        Зарегистрироваться
      </button>

      <div className="text-center text-sm">
        <span className=" text-gray-600">Уже есть аккаунт?</span>{" "}
        <Link to="/login" className="text-blue-600 hover:underline">
          Войти
        </Link>
      </div>
    </form>
  );
};
