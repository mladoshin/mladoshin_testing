import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { CourseResponse } from "@shared/types";
import { Course } from "@/entities/course/model/types";
import { courseApi } from "@/features/course/model/api";
import { CourseAdapter } from "@/entities/course/model/adapters";
import { lessonApi } from "@/features/lesson/model/api";
import { LessonAdapter } from "@/entities/lesson/model/adapters";
import { Lesson } from "@/entities/lesson/model/types";
import { on } from "events";

export const useAcademyCoursePageModel = () => {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [openedLesson, setOpenedLesson] = useState<Lesson | null>(null);
  const [loadingCourse, setLoadingCourse] = useState(true);
  const [loadingLessons, setLoadingLessons] = useState(true);
  const [error, setError] = useState(true);

  useEffect(() => {
    if (!id) return;

    courseApi
      .fetchOneById(id)
      .then((response: CourseResponse) => {
        const mappedCourse = CourseAdapter.mapFromResponse(response);
        setCourse(mappedCourse);
        setLoadingCourse(false);
      })
      .catch((error) => {
        console.error(`Ошибка при получении курса ${id}`, error);
        setError(error?.message ?? "Ошибка загрузки курса");
        setCourse(null);
        setLoadingCourse(false);
      });

    lessonApi
      .fetchAll(id)
      .then((response) => {
        const mappedLessons = response.map(LessonAdapter.mapFromResponse);
        setLessons(mappedLessons);
        setLoadingLessons(false);
      })
      .catch((error) => {
        console.error(`Ошибка при получении уроков курса ${id}`, error);
        setError(error?.message ?? "Ошибка загрузки уроков");
        setLoadingLessons(false);
        // Здесь можно обработать ошибку получения уроков, если нужно
      });
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
    error,
    openedLesson,
    onOpenLesson,
    onCloseLesson,
  };
};
