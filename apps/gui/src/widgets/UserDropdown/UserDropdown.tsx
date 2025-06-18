// src/widgets/UserDropdown/UserDropdown.tsx
import { useAuthStore } from "@/features/auth/model/store";
import { UserIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export function UserDropdown() {
  const { logout, isAdmin } = useAuthStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const toggle = () => setOpen((prev) => !prev);

  const handleClickOutside = (e: MouseEvent) => {
    if (ref.current && !ref.current.contains(e.target as Node)) {
      setOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleProfile = () => {
    setOpen(false);
    navigate("/profile");
  };

  const handleAdmin = () => {
    setOpen(false);
    navigate("/admin");
  };

  const handleLogout = () => {
    setOpen(false);
    logout().then(() => navigate("/"));
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={toggle}
        className="flex items-center space-x-1 p-2 rounded-full hover:bg-gray-100 transition-colors"
      >
        <UserIcon className="h-6 w-6 text-gray-700" />
        <ChevronDownIcon className="h-4 w-4 text-gray-700" />
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-10 w-52 rounded-md shadow-md bg-white border">
          {isAdmin() && (
            <button
              onClick={handleAdmin}
              className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-gray-700"
            >
              Войти в админ панель
            </button>
          )}
          <button
            onClick={handleProfile}
            className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-gray-700"
          >
            Профиль
          </button>
          <button
            onClick={handleLogout}
            className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-red-600"
          >
            Выйти
          </button>
        </div>
      )}
    </div>
  );
}
