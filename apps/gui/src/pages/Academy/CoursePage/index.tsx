import { LessonList } from "@/widgets/LessonList/LessonList";
import { useAcademyCoursePageModel } from "./model";
import { AcademyLayout } from "@/layouts/AcademyLayout/AcademyLayout";
import { Lesson } from "@/entities/lesson/model/types";
import { LessonModal } from "@/widgets/LessonModal/LessonModal";

export const AcademyCoursePage = () => {
  const {
    course,
    lessons,
    loading,
    lessonError,
    onCloseLesson,
    onOpenLesson,
    openedLesson,
  } = useAcademyCoursePageModel();

  if (loading.course)
    return (
      <AcademyLayout>
        <p>Загрузка курса...</p>
      </AcademyLayout>
    );

  if (!course)
    return (
      <AcademyLayout>
        <p>Курс не найден</p>
      </AcademyLayout>
    );

  const handleLessonClick = (lesson: Lesson) => {
    onOpenLesson(lesson);
  };

  return (
    <AcademyLayout>
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-black">{course.name}</h1>
        <p className="text-gray-700 whitespace-pre-line">
          {course.startDate.toLocaleDateString()} —{" "}
          {course.endDate.toLocaleDateString()}
        </p>
      </div>

      <h2 className="text-2xl font-bold text-black mt-10">Уроки курса</h2>
      <LessonList
        error={lessonError.fetch}
        loading={loading.lessons}
        lessons={lessons}
        onClick={handleLessonClick}
      />

      <LessonModal
        lesson={openedLesson as Lesson}
        onClose={onCloseLesson}
        isOpen={!!openedLesson}
      />
    </AcademyLayout>
  );
};
