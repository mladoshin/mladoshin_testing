import { useEffect, useState } from "react";
import { Course } from "@/entities/course/model/types";
import { courseApi } from "@/features/course/model/api";
import { CourseAdapter } from "@/entities/course/model/adapters";

export const useAcademyAllCoursesPageModel = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    courseApi
      .fetchAll()
      .then((rawCourses) => {
        const mappedCourses = rawCourses.map(CourseAdapter.mapFromResponse);
        setCourses(mappedCourses);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Ошибка загрузки курсов", error);
        setError(error?.message ?? "Ошибка загрузки курсов");
        setLoading(false);
      });
  }, []);

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
        setCourses((prevCourses) =>
          prevCourses.map((c) =>
            c.id === updatedCourse.id
              ? CourseAdapter.mapFromResponse(updatedCourse)
              : c
          )
        );
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

  return { courses, loading, error, handleCourseAction };
};
