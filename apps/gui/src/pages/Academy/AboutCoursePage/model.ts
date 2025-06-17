import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { CourseResponse } from "@shared/types";
import { Course } from "@/entities/course/model/types";
import { courseApi } from "@/features/course/model/api";
import { CourseAdapter } from "@/entities/course/model/adapters";

export const useAcademyAboutCoursePageModel = () => {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(true);

  useEffect(() => {
    if (!id) return;

    courseApi
      .fetchOneById(id)
      .then((response: CourseResponse) => {
        const mappedCourse = CourseAdapter.mapFromResponse(response);
        setCourse(mappedCourse);
        setLoading(false);
      })
      .catch((error) => {
        console.error(`Ошибка при получении курса ${id}`, error);
        setError(error?.message ?? "Ошибка загрузки курса");
        setCourse(null);
        setLoading(false);
      });
  }, [id]);

  const handleCourseAction = async (
    courseId: string,
    action: "register" | "pay"
  ) => {
    try {
      let updatedCourse;

      if (action === "register") {
        await courseApi.register(courseId);
        updatedCourse = await courseApi.fetchOneById(courseId);
      } else if (action === "pay") {
        await courseApi.purchase(courseId);
        updatedCourse = await courseApi.fetchOneById(courseId);
      }

      if (updatedCourse) {
        const mappedCourse = CourseAdapter.mapFromResponse(updatedCourse);
        setCourse(mappedCourse);
      }
    } catch (error: any) {
      console.error(
        `Ошибка при ${action === "register" ? "регистрации" : "оплате"} курса ${courseId}`,
        error
      );
      setError(
        error?.message ??
          `Ошибка при ${action === "register" ? "регистрации" : "оплате"} курса`
      );
    }
  };

  return { course, loading, error, handleCourseAction };
};
