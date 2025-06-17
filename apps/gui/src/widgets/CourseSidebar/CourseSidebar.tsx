import { Course } from "@/entities/course/model/types";
import { CourseActionButton } from "../CourseActionButton/CourseActionButton";

interface Props {
  course: Course;
  handleCourseAction?: (
    courseId: string,
    action: "register" | "pay"
  ) => Promise<void>;
}

export const CourseSidebar = ({ course, handleCourseAction }: Props) => (
  <aside className="bg-white shadow-lg rounded-xl p-6 w-full sticky top-20 space-y-4">
    <div>
      <h3 className="text-sm text-gray-500 mb-1">Автор курса</h3>
      <p className="font-semibold text-gray-800">Максим Ладошин</p>
    </div>

    <div className="text-sm text-gray-700">
      📅{" "}
      <strong>
        {course.startDate.toLocaleDateString()} –{" "}
        {course.endDate.toLocaleDateString()}
      </strong>
      <br />
      Онлайн курс с вебинарами
    </div>

    <div className="text-2xl font-bold text-gray-900 text-nowrap">
      Цена: {course.price} ₽
    </div>

    <CourseActionButton course={course} handleAction={handleCourseAction} />
  </aside>
);
