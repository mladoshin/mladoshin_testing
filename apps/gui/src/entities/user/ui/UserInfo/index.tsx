import React from "react";
import { User } from "../../model/types";

interface UserInfoProps {
  user: User;
}

export const UserInfo: React.FC<UserInfoProps> = ({ user }) => {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm space-y-3 text-gray-800">
      <div>
        <span className="font-semibold">Имя:</span>{" "}
        {user.first_name || "Не указано"}
      </div>
      <div>
        <span className="font-semibold">Фамилия:</span>{" "}
        {user.last_name || "Не указано"}
      </div>
      <div>
        <span className="font-semibold">О себе:</span>{" "}
        {user.bio || "Не указано"}
      </div>
      <div>
        <span className="font-semibold">Email:</span>{" "}
        {user.email || "Не указано"}
      </div>
    </div>
  );
};
