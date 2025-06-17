import { GuestLayout } from "@/layouts/GuestLayout/GuestLayout";
import { useCoursePageModel } from "./model";
import { CourseSidebar } from "@/widgets/CourseSidebar/CourseSidebar";

export const CoursePage = () => {
  const { course, loading } = useCoursePageModel();

  if (loading)
    return (
      <GuestLayout>
        <p>Загрузка...</p>
      </GuestLayout>
    );
  if (!course)
    return (
      <GuestLayout>
        <p>Курс не найден</p>
      </GuestLayout>
    );

  return (
    <GuestLayout>
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 space-y-4">
          <h1 className="text-3xl font-bold text-black">{course.name}</h1>
          <p className="text-gray-700 whitespace-pre-line">
            {course.startDate.toLocaleDateString()} —{" "}
            {course.endDate.toLocaleDateString()}
          </p>
        </div>

        <div className="w-full lg:w-[360px] shrink-0">
          <CourseSidebar course={course} />
        </div>
      </div>
    </GuestLayout>
  );
};
