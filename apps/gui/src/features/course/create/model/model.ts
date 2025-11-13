import { useCourseStore } from "../../model/store";

export function useCreateCourseFormModel() {
  const { createCourse, loading, error } = useCourseStore();

  return {
    createCourse,
    loading,
    error,
  };
}
