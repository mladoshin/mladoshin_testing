import { UserCircleIcon } from "@heroicons/react/24/outline";
import classNames from "classnames";
import styles from "./Header.module.scss";
import { useNavigate } from "react-router-dom";
import { Button } from "@/shared/ui/Button";

export default function AdminHeader() {
  const navigate = useNavigate();

  const handleLogoClick = () => {
    navigate("/admin/");
  };

  const handleAccountClick = () => {
    navigate("/academy");
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
            Онлайн школа (Админ панель)
          </h3>
        </div>

        {/* Правый блок: уведомления и профиль */}
        <div className="flex items-center space-x-4">
          <Button
            onClick={handleAccountClick}
            className="bg-transparent !border-1 !border-gray-200 !text-gray-700 rounded hover:bg-gray-100 transition text-sm"
            iconRight={<UserCircleIcon />}
          >
            Выйти в личный кабинет
          </Button>
        </div>
      </div>
    </header>
  );
}
