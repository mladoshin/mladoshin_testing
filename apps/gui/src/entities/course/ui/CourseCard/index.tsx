import { CourseActionButton } from "@/widgets/CourseActionButton/CourseActionButton";
import { Course } from "../../model/types";

interface CourseCardProps {
  course: Course;
  showActionButton?: boolean; // Optional prop to control button visibility
  onClick?: () => void;
  handleCourseAction?: (
    courseId: string,
    action: "register" | "pay"
  ) => Promise<void>;
}

export function CourseCard({
  course,
  showActionButton,
  onClick,
  handleCourseAction,
}: CourseCardProps) {
  const formatDate = (date: Date) =>
    date.toLocaleDateString("ru-RU", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  return (
    <div
      className="border rounded-xl p-4 shadow-sm hover:shadow-md transition bg-white cursor-pointer"
      onClick={onClick}
    >
      <h3 className="text-lg font-semibold text-gray-800 mb-2">
        {course.name}
      </h3>

      <div className="text-sm text-gray-600 mb-1">
        <span className="font-medium">Начало:</span>{" "}
        {formatDate(course.startDate)}
      </div>
      <div className="text-sm text-gray-600 mb-2">
        <span className="font-medium">Окончание:</span>{" "}
        {formatDate(course.endDate)}
      </div>

      {showActionButton && (
        <CourseActionButton course={course} handleAction={handleCourseAction} />
      )}
    </div>
  );
}
