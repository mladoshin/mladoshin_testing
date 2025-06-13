import { useState } from 'react';
import { useAuthStore } from '../model/store';

export const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error } = useAuthStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return alert('Заполните все поля');
    login({ email, password });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="text-red-500">{error}</div>}

      <input
        type="email"
        placeholder="Email"
        className="w-full px-3 py-2 border rounded"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <input
        type="password"
        placeholder="Пароль"
        className="w-full px-3 py-2 border rounded"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      <button
        type="submit"
        className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        disabled={isLoading}
      >
        Войти
      </button>
    </form>
  );
};
