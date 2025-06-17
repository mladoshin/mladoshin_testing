import { GuestLayout } from "@/layouts/GuestLayout/GuestLayout";
import { useNavigate } from "react-router-dom";
import { useAllCoursesPageModel } from "./model";
import { CourseList } from "@/widgets/CourseList/CourseList";
import { Course } from "@/entities/course/model/types";

export const AllCoursesPage = () => {
  const navigate = useNavigate();
  const { loading, error, courses } = useAllCoursesPageModel();

  if (error)
    return (
      <GuestLayout>
        <div className="text-red-600">{error}</div>
      </GuestLayout>
    );

  if (loading)
    return (
      <GuestLayout>
        <div className="text-black">Загрузка</div>
      </GuestLayout>
    );

  const handleCourseClick = (course: Course) => {
    navigate(`/courses/${course.id}/about`);
  };

  return (
    <GuestLayout>
      <h2 className="text-black text-2xl font-semibold mb-6">Мероприятия</h2>
      <CourseList courses={courses} onCourseClick={handleCourseClick} />
    </GuestLayout>
  );
};
