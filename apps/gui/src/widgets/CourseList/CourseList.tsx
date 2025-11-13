import { Course } from "@/entities/course/model/types";
import { CourseCard } from "@/entities/course/ui/CourseCard";
import { SpinnerIcon } from "@/shared/ui/SpinnerIcon";

interface CourseListProps {
  courses: Course[];
  loading?: boolean;
  showActionButtons?: boolean;
  onCourseClick?: (course: Course) => void;
  handleCourseAction?: (
    courseId: string,
    action: "register" | "pay"
  ) => Promise<void>;
}

export function CourseList({
  courses,
  loading,
  showActionButtons,
  onCourseClick,
  handleCourseAction,
}: CourseListProps) {
  if (loading) {
    return (
      <section className="py-6">
        <div className="w-full flex justify-center items-center gap-3 text-black">
          <SpinnerIcon className="w-7 h-7 animate-spin" />
        </div>
      </section>
    );
  }

  return (
    <section className="py-6">
      {courses.length === 0 ? (
        <p className="text-gray-500">Нет доступных курсов</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              handleCourseAction={handleCourseAction}
              showActionButton={showActionButtons}
              onClick={() => onCourseClick?.(course)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
