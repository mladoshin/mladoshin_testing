import { useLessonStore } from "../../model/store";

export function useCreateLessonFormModel() {
  const { createLesson, loading, error } = useLessonStore();

  return {
    createLesson,
    loading,
    error,
  };
}
