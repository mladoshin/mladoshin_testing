import React from "react";
import { UserSchedule } from "@/entities/user-schedule/model/types";
import { weekDays } from "@/shared/constants";

interface UserScheduleItemProps {
  item: UserSchedule;
}

export const UserScheduleItem: React.FC<UserScheduleItemProps> = ({ item }) => {
  const { lesson, scheduledDate, startTime, endTime, duration } = item;

  const day = scheduledDate.getDay(); // от 0 (вс) до 6 (сб)
  const isoDay = (day + 6) % 7; // от 0 (пн) до 6 (вс)

  return (
    <div className="border rounded-lg p-4 shadow-sm bg-white">
      <h4 className="text-lg font-semibold mb-2 text-gray-800">
        {lesson?.title || "Без названия"}{", "}
        {lesson?.date.toLocaleDateString("ru-RU")}
      </h4>
      <div className="text-sm text-gray-700">
        <p>
          <strong>Дата:</strong>{" "}
          {weekDays[isoDay]}{", "}
          {new Date(scheduledDate).toLocaleDateString("ru-RU")}
          
        </p>
        <p>
          <strong>Время:</strong> {startTime} — {endTime}
        </p>
        <p>
          <strong>Длительность:</strong> {duration} мин.
        </p>
      </div>
    </div>
  );
};
