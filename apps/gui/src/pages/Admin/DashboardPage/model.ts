import { CourseAdapter } from "@/entities/course/model/adapters";
import { Course } from "@/entities/course/model/types";
import { courseApi } from "@/features/course/model/api";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export const useAdminDashboardPageModel = () => {
  const navigate = useNavigate();
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

  const handleCourseClick = (course: Course) => {
    navigate(`/admin/courses/${course.id}`)
  };

  return { courses, loading, error, handleCourseClick };
};
