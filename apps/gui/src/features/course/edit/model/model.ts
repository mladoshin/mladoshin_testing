import { useNavigate } from "react-router-dom";
import { useCourseStore } from "../../model/store";

export function useEditCourseFormModel() {
  const navigate = useNavigate();
  const { updateCourse, deleteCourse, loading, error } = useCourseStore();

  const _deleteCourse = async (courseId: string) => {
    await deleteCourse(courseId);
    navigate("/admin/courses");
  };

  return {
    updateCourse,
    deleteCourse: _deleteCourse,
    loading,
    error,
  };
}
