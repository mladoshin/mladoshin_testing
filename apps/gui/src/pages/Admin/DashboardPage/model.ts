import { Course } from "@/entities/course/model/types";
import { useCourseStore } from "@/features/course/model/store";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export const useAdminDashboardPageModel = () => {
  const navigate = useNavigate();
  const { allCourses, loadAllCourses, loading, error } = useCourseStore();
  const [openCreateCourseModal, setOpenCreateCourseModal] =
    useState<boolean>(false);

  useEffect(() => {
    loadAllCourses();
  }, []);

  const handleCourseClick = (course: Course) => {
    navigate(`/admin/courses/${course.id}`);
  };

  const onOpenCreateCourseModal = () => {
    setOpenCreateCourseModal(true);
  };

  const onCloseCreateCourseModal = () => {
    setOpenCreateCourseModal(false);
  };

  return {
    courses: allCourses,
    loading,
    error,
    openCreateCourseModal,
    handleCourseClick,
    onOpenCreateCourseModal,
    onCloseCreateCourseModal,
  };
};
