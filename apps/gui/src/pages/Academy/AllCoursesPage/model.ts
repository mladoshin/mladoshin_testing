import { useEffect, useState } from "react";
import { useCourseStore } from "@/features/course/model/store";

export const useAcademyAllCoursesPageModel = () => {
  const {
    allCourses: courses,
    error,
    loadAllCourses,
    registerForCourse,
    purchaseCourse,
  } = useCourseStore();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllCourses().finally(() => setLoading(false));
  }, []);

  const handleCourseAction = async (
    courseId: string,
    action: "register" | "pay"
  ) => {
    if (action === "register") {
      await registerForCourse(courseId);
    } else if (action === "pay") {
      await purchaseCourse(courseId);
    }
  };

  return { courses, loading, error, handleCourseAction };
};
