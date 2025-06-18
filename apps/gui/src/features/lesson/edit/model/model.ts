import { useLessonStore } from "../../model/store";

export function useEditLessonFormModel() {
  const {
    updateLesson,
    deleteLesson,
    loading,
    error,
  } = useLessonStore();

  return {
    updateLesson,
    deleteLesson,
    loading,
    error,
  };
}
