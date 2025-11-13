import classNames from "classnames";
import styles from "./Header.module.scss";
import { useNavigate } from "react-router-dom";

export default function GuestHeader() {
  const navigate = useNavigate();

  const handleLogoClick = () => {
    navigate("/courses");
  };

  const handleLoginClick = () => {
    navigate("/login");
  };

  return (
    <header
      className={classNames(styles.container, "w-full border-b-4 bg-white")}
    >
      <div
        className={classNames(
          styles.inner,
          "max-w-7xl mx-auto px-4 h-16 flex items-center justify-between"
        )}
      >
        {/* Левый логотип */}
        <div className="flex-shrink-0">
          <h3
            className="text-black font-bold cursor-pointer"
            onClick={handleLogoClick}
          >
            Онлайн школа
          </h3>
        </div>

        {/* Правая кнопка "Войти" */}
        <div>
          <button
            className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition cursor-pointer"
            onClick={handleLoginClick}
          >
            Войти
          </button>
        </div>
      </div>
    </header>
  );
}
