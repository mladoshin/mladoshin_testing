import { useEffect, useState } from "react";
import { Course } from "@/entities/course/model/types";
import { courseApi } from "@/features/course/model/api";
import { CourseAdapter } from "@/entities/course/model/adapters";

export const useAllCoursesPageModel = () => {
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

  return { courses, loading, error };
};
