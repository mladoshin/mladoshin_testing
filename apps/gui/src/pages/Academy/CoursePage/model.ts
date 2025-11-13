import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Lesson } from "@/entities/lesson/model/types";
import { useLessonStore } from "@/features/lesson/model/store";
import { useCourseStore } from "@/features/course/model/store";

export const useAcademyCoursePageModel = () => {
  const {
    lessons,
    error: lessonError,
    loadAllCourseLessons,
  } = useLessonStore();

  const { course, error: courseError, getCourseById } = useCourseStore();

  const [loadingCourse, setLoadingCourse] = useState<boolean>(true);
  const [loadingLessons, setLoadingLessons] = useState<boolean>(true);

  const { id } = useParams<{ id: string }>();
  const [openedLesson, setOpenedLesson] = useState<Lesson | null>(null);

  useEffect(() => {
    if (!id) return;

    getCourseById(id).finally(() => setLoadingCourse(false));
    loadAllCourseLessons(id).finally(() => setLoadingLessons(false));
  }, [id]);

  const onOpenLesson = (lesson: Lesson) => {
    setOpenedLesson(lesson);
  };

  const onCloseLesson = () => {
    setOpenedLesson(null);
  };

  return {
    course,
    lessons,
    loading: { course: loadingCourse, lessons: loadingLessons },
    lessonError,
    courseError,
    openedLesson,
    onOpenLesson,
    onCloseLesson,
  };
};
