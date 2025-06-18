import { AcademyLayout } from "@/layouts/AcademyLayout/AcademyLayout";
import { CourseList } from "@/widgets/CourseList/CourseList";
import { useAcademyAllCoursesPageModel } from "./model";
import { useNavigate } from "react-router-dom";
import { Course } from "@/entities/course/model/types";

export const AcademyAllCoursesPage = () => {
  const navigate = useNavigate();
  const { loading, error, courses, handleCourseAction } = useAcademyAllCoursesPageModel();

  if (error.fetch)
    return (
      <AcademyLayout>
        <div className="text-red-600">{error.fetch}</div>
      </AcademyLayout>
    );

  const handleCourseClick = (course: Course) => {
    navigate(`/academy/courses/${course.id}/about`);
  };

  return (
    <AcademyLayout>
      <h2 className="text-black text-2xl font-semibold mb-6">Мероприятия</h2>
      <CourseList
        loading={loading}
        courses={courses}
        onCourseClick={handleCourseClick}
        handleCourseAction={handleCourseAction}
        showActionButtons
      />
    </AcademyLayout>
  );
};
