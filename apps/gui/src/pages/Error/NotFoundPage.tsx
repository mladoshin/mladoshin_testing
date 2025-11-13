import { Link } from "react-router-dom";

const NotFoundPage = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 text-center p-4">
    <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
    <p className="text-xl text-gray-600 mb-6">Страница не найдена</p>
    <Link
      to="/"
      className="px-6 py-2 border border-gray-400 text-gray-700 rounded hover:bg-gray-100 transition"
    >
      Вернуться на главную
    </Link>
  </div>
);

export default NotFoundPage;
