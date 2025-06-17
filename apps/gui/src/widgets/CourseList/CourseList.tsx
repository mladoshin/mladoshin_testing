import { Course } from "@/entities/course/model/types";
import { CourseCard } from "@/entities/course/ui/CourseCard";

interface CourseListProps {
  courses: Course[];
  title?: string;
  showActionButtons?: boolean;
  onCourseClick?: (course: Course) => void;
  handleCourseAction?: (
    courseId: string,
    action: "register" | "pay"
  ) => Promise<void>;
}

export function CourseList({
  courses,
  title,
  showActionButtons,
  onCourseClick,
  handleCourseAction,
}: CourseListProps) {
  return (
    <section className="py-6">
      {title && <h2 className="text-2xl font-bold mb-4">{title}</h2>}

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
