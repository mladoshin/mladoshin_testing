import { CourseSidebar } from "@/widgets/CourseSidebar/CourseSidebar";
import { useAcademyAboutCoursePageModel } from "./model";
import { AcademyLayout } from "@/layouts/AcademyLayout/AcademyLayout";

export const AcademyAboutCoursePage = () => {
  const { course, loading, error, handleCourseAction } =
    useAcademyAboutCoursePageModel();

  if (loading)
    return (
      <AcademyLayout>
        <p>Загрузка...</p>
      </AcademyLayout>
    );

  if (!course)
    return (
      <AcademyLayout>
        <p>Курс не найден</p>
      </AcademyLayout>
    );

  return (
    <AcademyLayout>
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 space-y-4">
          <h1 className="text-3xl font-bold text-black">{course.name}</h1>
          <p className="text-gray-700 whitespace-pre-line">
            {course.startDate.toLocaleDateString()} —{" "}
            {course.endDate.toLocaleDateString()}
          </p>
        </div>

        <div className="w-full lg:w-[360px] shrink-0">
          <CourseSidebar
            course={course}
            handleCourseAction={handleCourseAction}
          />
        </div>
      </div>
    </AcademyLayout>
  );
};
