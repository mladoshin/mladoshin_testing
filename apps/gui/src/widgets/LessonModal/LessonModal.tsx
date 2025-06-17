import React from "react";
import { Lesson } from "@/entities/lesson/model/types";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface LessonModalProps {
  lesson: Lesson;
  isOpen: boolean;
  onClose: () => void;
}

export const LessonModal: React.FC<LessonModalProps> = ({
  lesson,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const formattedDate = lesson.date.toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 cursor-pointer"
          aria-label="Закрыть"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900">{lesson.title}</h2>
          <p className="text-sm text-gray-500">{formattedDate}</p>
        </div>

        {/* Content */}
        <div className="text-gray-800 whitespace-pre-line">
          {lesson.content}
        </div>
      </div>
    </div>
  );
};
