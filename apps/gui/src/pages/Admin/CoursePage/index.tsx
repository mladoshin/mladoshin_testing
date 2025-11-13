import { LessonList } from "@/widgets/LessonList/LessonList";
import { useAdminCoursePageModel } from "./model";
import { Lesson } from "@/entities/lesson/model/types";
import { Button } from "@/shared/ui/Button";
import { PlusIcon } from "@heroicons/react/24/outline";
import {
  EditLessonAdminModal,
  CreateLessonAdminModal,
} from "@/widgets/LessonAdminModal";
import { Course } from "@/entities/course/model/types";
import { AdminLayout } from "@/layouts/AdminLayout/AdminLayout";
import { EditCourseAdminModal } from "@/widgets/CourseAdminModal";
import { SpinnerIcon } from "@/shared/ui/SpinnerIcon";

export const AdminCoursePage = () => {
  const {
    course,
    lessons,
    lessonLoading,
    courseLoading,
    courseError,
    lessonError,
    createLessonModalOpen,
    editCourseModalOpen,
    onOpenEditCourseModal,
    onCloseEditCourseModal,
    onOpenCreateLessonModal,
    onCloseCreateLessonModal,
    onCloseLesson,
    onOpenLesson,
    openedLesson,
  } = useAdminCoursePageModel();

  if (courseLoading.fetch)
    return (
      <AdminLayout>
        <div className="w-full flex justify-center items-center gap-3 text-black">
          <p className="text-black">Загрузка курса...</p>
          <SpinnerIcon className="w-7 h-7 animate-spin" />
        </div>
      </AdminLayout>
    );

  if (!course)
    return (
      <AdminLayout>
        <p className="text-black">Курс не найден</p>
      </AdminLayout>
    );

  const handleLessonClick = (lesson: Lesson) => {
    onOpenLesson(lesson);
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-black">{course.name}</h1>
        <p className="text-gray-700 whitespace-pre-line">
          {course.startDate.toLocaleDateString()} —{" "}
          {course.endDate.toLocaleDateString()}
        </p>
        <Button onClick={onOpenEditCourseModal}>Редактировать</Button>
      </div>

      <div className="flex flex-row items-center mt-10 justify-between">
        <h2 className="text-2xl font-bold text-black">Уроки курса</h2>
        <Button
          className="!w-[150px] text-sm"
          iconRight={<PlusIcon />}
          onClick={onOpenCreateLessonModal}
        >
          Добавить
        </Button>
      </div>

      {!!lessonError.fetch && (
        <p className="text-red-500">{lessonError.fetch}</p>
      )}

      <LessonList
        loading={lessonLoading.fetch}
        lessons={lessons}
        onClick={handleLessonClick}
      />

      <EditCourseAdminModal
        isOpen={editCourseModalOpen}
        course={course}
        onClose={onCloseEditCourseModal}
      />

      <EditLessonAdminModal
        isOpen={!!openedLesson}
        lesson={openedLesson as Lesson}
        onClose={onCloseLesson}
      />

      <CreateLessonAdminModal
        isOpen={createLessonModalOpen}
        course={course as Course}
        onClose={onCloseCreateLessonModal}
      />
    </AdminLayout>
  );
};
