import {
  BellIcon
} from "@heroicons/react/24/outline";
import classNames from "classnames";
import styles from "./Header.module.scss";
import { useNavigate } from "react-router-dom";
import { UserDropdown } from "../UserDropdown/UserDropdown";

export default function AcademyHeader() {
  const navigate = useNavigate();

  const handleLogoClick = () => {
    navigate("/academy/courses");
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

        {/* Правый блок: уведомления и профиль */}
        <div className="flex items-center space-x-4">
          {/* Иконка уведомлений */}
          <button className="relative p-2 rounded-full hover:bg-gray-100 transition-colors">
            <BellIcon className="h-6 w-6 text-gray-700" />
            <span className="absolute -top-1 -right-1 block h-2 w-2 bg-red-500 rounded-full" />
          </button>

          <UserDropdown />
        </div>
      </div>
    </header>
  );
}
