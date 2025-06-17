import React from "react";
import { Lesson } from "../../model/types";

interface LessonCardProps {
  lesson: Lesson;
  onClick?: () => void;
}

export const LessonCard: React.FC<LessonCardProps> = ({ lesson, onClick }) => {
  const formattedDate = lesson.date.toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div
      className="border rounded-xl p-4 shadow-sm hover:shadow-md transition bg-white cursor-pointer"
      onClick={onClick}
    >
      <h3 className="text-lg font-semibold mb-1 text-gray-900">
        {lesson.title}
      </h3>

      <div className="text-xs text-gray-500">{formattedDate}</div>
    </div>
  );
};
