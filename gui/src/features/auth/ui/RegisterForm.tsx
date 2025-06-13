import { useState } from 'react';
import { useAuthStore } from '../model/store';

export const RegisterForm = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { register, isLoading, error } = useAuthStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return alert('Заполните все поля');
    register({ name, email, password });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="text-red-500">{error}</div>}

      <input
        type="text"
        placeholder="Имя"
        className="w-full px-3 py-2 border rounded"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />

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
        className="w-full py-2 bg-green-600 text-white rounded hover:bg-green-700"
        disabled={isLoading}
      >
        Зарегистрироваться
      </button>
    </form>
  );
};
