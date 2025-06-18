import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Lesson } from "@/entities/lesson/model/types";
import { useLessonStore } from "@/features/lesson/model/store";
import { useCourseStore } from "@/features/course/model/store";

export const useAdminCoursePageModel = () => {
  const {
    lessons,
    loading: lessonLoading,
    error: lessonError,
    setError,
    loadAllCourseLessons,
  } = useLessonStore();

  const {
    course,
    getCourseById,
    loading: courseLoading,
    error: courseError,
  } = useCourseStore();
  
  const { id } = useParams<{ id: string }>();
  const [openedLesson, setOpenedLesson] = useState<Lesson | null>(null);
  const [createLessonModalOpen, setCreateLessonModalOpen] =
    useState<boolean>(false);

  const [editCourseModalOpen, setEditCourseModalOpen] =
    useState<boolean>(false);

  useEffect(() => {
    if (!id) return;
    getCourseById(id);
    loadAllCourseLessons(id);
  }, [id]);

  const onOpenLesson = (lesson: Lesson) => {
    setOpenedLesson(lesson);
  };

  const onOpenCreateLessonModal = () => {
    setCreateLessonModalOpen(true);
  };

  const onCloseCreateLessonModal = () => {
    setCreateLessonModalOpen(false);
    setError("create", null);
  };

  const onCloseLesson = () => {
    setOpenedLesson(null);
    setError("update", null);
  };

  const onOpenEditCourseModal = () => {
    setEditCourseModalOpen(true);
  };

  const onCloseEditCourseModal = () => {
    setEditCourseModalOpen(false);
  };

  return {
    course,
    lessons,
    courseLoading,
    lessonLoading,
    courseError,
    lessonError,
    openedLesson,
    createLessonModalOpen,
    editCourseModalOpen,
    onOpenCreateLessonModal,
    onCloseCreateLessonModal,
    onOpenLesson,
    onCloseLesson,
    onOpenEditCourseModal,
    onCloseEditCourseModal,
  };
};
